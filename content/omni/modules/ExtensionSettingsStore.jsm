//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ExtensionSettingsStore"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"AddonManager","resource://gre/modules/AddonManager.jsm");ChromeUtils.defineModuleGetter(this,"JSONFile","resource://gre/modules/JSONFile.jsm");ChromeUtils.defineModuleGetter(this,"ExtensionParent","resource://gre/modules/ExtensionParent.jsm");

const SETTING_USER_SET=null;const SETTING_PRECEDENCE_ORDER=undefined;const JSON_FILE_NAME="extension-settings.json";const JSON_FILE_VERSION=2;const STORE_PATH=PathUtils.join(Services.dirsvc.get("ProfD",Ci.nsIFile).path,JSON_FILE_NAME);let _initializePromise;let _store={};function dataPostProcessor(json){if(json.version!==JSON_FILE_VERSION){for(let storeType in json){for(let setting in json[storeType]){for(let extData of json[storeType][setting].precedenceList){if(typeof extData.installDate!="number"){extData.installDate=new Date(extData.installDate).valueOf();}}}}
json.version=JSON_FILE_VERSION;}
return json;}
function initialize(){if(!_initializePromise){_store=new JSONFile({path:STORE_PATH,dataPostProcessor,});_initializePromise=_store.load();}
return _initializePromise;}
async function reloadFile(saveChanges){if(!saveChanges){_store._saver.disarm();}
await _store.finalize();_initializePromise=null;return initialize();}
function ensureType(type){if(!_store.dataReady){throw new Error("The ExtensionSettingsStore was accessed before the initialize promise resolved.");}
if(!_store.data[type]){_store.data[type]={};}}
function getItem(type,key,id){ensureType(type);let keyInfo=_store.data[type][key];if(!keyInfo){return null;}
if(!id&&keyInfo.selected){id=keyInfo.selected;}
if(id){let item=keyInfo.precedenceList.find(item=>item.id===id);return item?{key,value:item.value,id}:null;}

if(keyInfo.selected===SETTING_PRECEDENCE_ORDER){for(let item of keyInfo.precedenceList){if(item.enabled){return{key,value:item.value,id:item.id};}}}
return{key,initialValue:keyInfo.initialValue};}
function precedenceComparator(a,b){if(a.enabled&&!b.enabled){return-1;}
if(b.enabled&&!a.enabled){return 1;}
return b.installDate-a.installDate;}
function alterSetting(id,type,key,action){let returnItem=null;ensureType(type);let keyInfo=_store.data[type][key];if(!keyInfo){if(action==="remove"){return null;}
throw new Error(`Cannot alter the setting for ${type}:${key} as it does not exist.`);}
let foundIndex=keyInfo.precedenceList.findIndex(item=>item.id==id);if(foundIndex===-1&&(action!=="select"||id!==SETTING_USER_SET)){if(action==="remove"){return null;}
throw new Error(`Cannot alter the setting for ${type}:${key} as ${id} does not exist.`);}
let selected=keyInfo.selected;switch(action){case"select":if(foundIndex>=0&&!keyInfo.precedenceList[foundIndex].enabled){throw new Error(`Cannot select the setting for ${type}:${key} as ${id} is disabled.`);}
keyInfo.selected=id;keyInfo.selectedDate=Date.now();break;case"remove":if(id===keyInfo.selected){keyInfo.selected=SETTING_PRECEDENCE_ORDER;delete keyInfo.selectedDate;}
keyInfo.precedenceList.splice(foundIndex,1);break;case"enable":keyInfo.precedenceList[foundIndex].enabled=true;keyInfo.precedenceList.sort(precedenceComparator);
if(keyInfo.selected!==SETTING_PRECEDENCE_ORDER){_store.saveSoon();return null;}
foundIndex=keyInfo.precedenceList.findIndex(item=>item.id==id);break;case"disable":if(keyInfo.selected===id){keyInfo.selected=SETTING_PRECEDENCE_ORDER;delete keyInfo.selectedDate;}
keyInfo.precedenceList[foundIndex].enabled=false;keyInfo.precedenceList.sort(precedenceComparator);break;default:throw new Error(`${action} is not a valid action for alterSetting.`);}
if(selected!==keyInfo.selected||foundIndex===0){returnItem=getItem(type,key);}
if(action==="remove"&&keyInfo.precedenceList.length===0){delete _store.data[type][key];}
_store.saveSoon();ExtensionParent.apiManager.emit("extension-setting-changed",{action,id,type,key,item:returnItem,});return returnItem;}
var ExtensionSettingsStore={SETTING_USER_SET,initialize(){return initialize();},async addSetting(id,type,key,value,initialValueCallback=()=>undefined,callbackArgument=key,settingDataUpdate=val=>val){if(typeof initialValueCallback!="function"){throw new Error("initialValueCallback must be a function.");}
ensureType(type);if(!_store.data[type][key]){let initialValue=await initialValueCallback(callbackArgument);_store.data[type][key]={initialValue,precedenceList:[],};}
let keyInfo=_store.data[type][key];keyInfo.initialValue=settingDataUpdate(keyInfo.initialValue);let foundIndex=keyInfo.precedenceList.findIndex(item=>item.id==id);let newInstall=false;if(foundIndex===-1){let addon=await AddonManager.getAddonByID(id);keyInfo.precedenceList.push({id,installDate:addon.installDate.valueOf(),value,enabled:true,});newInstall=addon.installDate.valueOf()>keyInfo.selectedDate;}else{let item=keyInfo.precedenceList[foundIndex];item.value=value;item.enabled=true;}
keyInfo.precedenceList.sort(precedenceComparator);foundIndex=keyInfo.precedenceList.findIndex(item=>item.id==id);if(foundIndex===0&&newInstall){keyInfo.selected=SETTING_PRECEDENCE_ORDER;delete keyInfo.selectedDate;}
_store.saveSoon();
if(keyInfo.selected!==SETTING_USER_SET&&(keyInfo.selected===id||foundIndex===0)){return{id,key,value};}
return null;},removeSetting(id,type,key){return alterSetting(id,type,key,"remove");},enable(id,type,key){return alterSetting(id,type,key,"enable");},disable(id,type,key){return alterSetting(id,type,key,"disable");},select(id,type,key){return alterSetting(id,type,key,"select");},getAllForExtension(id,type){ensureType(type);let keysObj=_store.data[type];let items=[];for(let key in keysObj){if(keysObj[key].precedenceList.find(item=>item.id==id)){items.push(key);}}
return items;},getSetting(type,key,id){return getItem(type,key,id);},hasSetting(id,type,key){return this.getAllForExtension(id,type).includes(key);},async getLevelOfControl(id,type,key){ensureType(type);let keyInfo=_store.data[type][key];if(!keyInfo||!keyInfo.precedenceList.length){return"controllable_by_this_extension";}
if(keyInfo.selected!==SETTING_PRECEDENCE_ORDER){if(id===keyInfo.selected){return"controlled_by_this_extension";}

let addon=await AddonManager.getAddonByID(id);return!addon||keyInfo.selectedDate>addon.installDate.valueOf()?"not_controllable":"controllable_by_this_extension";}
let enabledItems=keyInfo.precedenceList.filter(item=>item.enabled);if(!enabledItems.length){return"controllable_by_this_extension";}
let topItem=enabledItems[0];if(topItem.id==id){return"controlled_by_this_extension";}
let addon=await AddonManager.getAddonByID(id);return!addon||topItem.installDate>addon.installDate.valueOf()?"controlled_by_other_extensions":"controllable_by_this_extension";},_reloadFile(saveChanges=true){return reloadFile(saveChanges);},};ExtensionParent.apiManager.on("uninstall-complete",async(type,{id})=>{await ExtensionSettingsStore.initialize();for(let type in _store.data){if(type==="prefs"){continue;}
let items=ExtensionSettingsStore.getAllForExtension(id,type);for(let key of items){ExtensionSettingsStore.removeSetting(id,type,key);Services.console.logStringMessage(`Post-Uninstall removal of addon settings for ${id}, type: ${type} key: ${key}`);}}});