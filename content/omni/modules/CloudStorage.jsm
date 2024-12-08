//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["CloudStorage"];const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["fetch"]);ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");const CLOUD_SERVICES_PREF="cloud.services.";const CLOUD_PROVIDERS_URI="resource://cloudstorage/providers.json";var CloudStorage={async init(){let isInitialized=null;try{
 isInitialized=await CloudStorageInternal.initProviders();}catch(err){Cu.reportError(err);}
return isInitialized;},promisePromptInfo(){return CloudStorageInternal.promisePromptInfo();},savePromptResponse(key,remember,selected=false){Services.prefs.setIntPref(CLOUD_SERVICES_PREF+"lastprompt",Math.floor(Date.now()/1000));if(remember){if(selected){CloudStorageInternal.setCloudStoragePref(key);}else{
 CloudStorageInternal.handleRejected(key);}}},getDownloadFolder(typeSpecificData){return CloudStorageInternal.getDownloadFolder(typeSpecificData);},getPreferredProvider(){return CloudStorageInternal.preferredProviderKey;},getPreferredProviderMetaData(){return CloudStorageInternal.getPreferredProviderMetaData();},getProviderIfInUse(){return CloudStorageInternal.getProviderIfInUse();},getStorageProviders(){return CloudStorageInternal.getStorageProviders();},};var CloudStorageInternal={promiseInit:null,providersMetaData:null,async _downloadJSON(uri){let json=null;try{let response=await fetch(uri);if(response.ok){json=await response.json();}}catch(e){Cu.reportError("Fetching "+uri+" results in error: "+e);}
return json;},async resetFolderListPref(){let folderListValue=Services.prefs.getIntPref("browser.download.folderList",0);if(folderListValue!==3){return;}
let downloadDirPath=null;try{let file=Services.prefs.getComplexValue("browser.download.dir",Ci.nsIFile);downloadDirPath=file.path;}catch(e){}
if(!downloadDirPath||downloadDirPath===(await Downloads.getSystemDownloadsDirectory())){ folderListValue=1;}else if(downloadDirPath===Services.dirsvc.get("Desk",Ci.nsIFile).path){ folderListValue=0;}else{ folderListValue=2;}
Services.prefs.setIntPref("browser.download.folderList",folderListValue);},async initProviders(){

if(!this.isAPIEnabled){this.resetFolderListPref().catch(err=>{Cu.reportError("CloudStorage: Failed to reset folderList pref "+err);});return false;}
let response=await this._downloadJSON(CLOUD_PROVIDERS_URI);this.providersMetaData=await this._parseProvidersJSON(response);let providersCount=Object.keys(this.providersMetaData).length;if(providersCount>0){ let handledProviders=await this.initDownloadPathIfProvidersExist();if(handledProviders.length===providersCount){return true;}}
return false;},_parseProvidersJSON(providers){if(!providers){return{};}



 
Object.getOwnPropertyNames(providers).forEach(key=>{if(providers[key].relativeDiscoveryPath.hasOwnProperty(AppConstants.platform)){providers[key].discoveryPath=this._concatPath(providers[key].relativeDiscoveryPath[AppConstants.platform]);providers[key].downloadPath=this._concatPath(providers[key].relativeDownloadPath);}else{ delete providers[key];}});return providers;},_concatPath(arrDirs){let dirPath="";for(let subDir of arrDirs){switch(subDir){case"homeDir":subDir=OS.Constants.Path.homeDir?OS.Constants.Path.homeDir:"";break;case"LocalAppData":if(OS.Constants.Win){let nsIFileLocal=Services.dirsvc.get("LocalAppData",Ci.nsIFile);subDir=nsIFileLocal&&nsIFileLocal.path?nsIFileLocal.path:"";}else{subDir="";}
break;}
dirPath=OS.Path.join(dirPath,subDir);}
return dirPath;},initDownloadPathIfProvidersExist(){let providerKeys=Object.keys(this.providersMetaData);let promises=providerKeys.map(key=>{return key==="Dropbox"?this._initDropbox(key):Promise.resolve(false);});return Promise.all(promises);},async _initDropbox(key){ if(!(await this._checkIfAssetExists(this.providersMetaData[key].discoveryPath))){return false;} 
let rejectedKeys=this.cloudStorageRejectedKeys.split(",");if(rejectedKeys.includes(key)){return false;}
let file=null;try{file=new FileUtils.File(this.providersMetaData[key].discoveryPath);}catch(ex){return false;}
let data=await this._downloadJSON(Services.io.newFileURI(file).spec);if(!data){return false;}
let path=data&&data.personal&&data.personal.path;if(!path){return false;}
let isUsable=await this._isUsableDirectory(path);if(isUsable){this.providersMetaData.Dropbox.downloadPath=path;}
return isUsable;},async _isUsableDirectory(path){let isUsable=false;try{let info=await OS.File.stat(path);isUsable=info.isDir;}catch(e){}
return isUsable;},async getDownloadFolder(dataType="default"){ if(!this.providersMetaData){let isInitialized=await this.promiseInit;if(!isInitialized&&!this.providersMetaData){Cu.reportError("CloudStorage: Failed to initialize and retrieve download folder ");return null;}}
let key=this.preferredProviderKey;if(!key||!this.providersMetaData.hasOwnProperty(key)){return null;}
let provider=this.providersMetaData[key];if(!provider.typeSpecificData[dataType]){return null;}
let downloadDirPath=OS.Path.join(provider.downloadPath,provider.typeSpecificData[dataType]);if(!(await this._isUsableDirectory(downloadDirPath))){return null;}
return downloadDirPath;},async promisePromptInfo(){

 if(!this.preferredProviderKey&&this.shouldPrompt()){return this.scan();}
return Promise.resolve(null);},shouldPrompt(){let lastPrompt=this.lastPromptTime;let now=Math.floor(Date.now()/1000);let interval=now-lastPrompt; let maxAllow=this.promptInterval*24*60*60;return interval>=maxAllow;},async scan(){let providers=await this.getStorageProviders();if(!providers.size){ return null;}
 
let rejectedKeys=this.cloudStorageRejectedKeys.split(",");for(let rejectedKey of rejectedKeys){providers.delete(rejectedKey);} 
let provider=providers.entries().next().value;if(provider){return{key:provider[0],value:provider[1]};}
return null;},_checkIfAssetExists(path){return OS.File.exists(path).catch(err=>{Cu.reportError(`Couldn't check existance of ${path}`,err);return false;});},async getStorageProviders(){let providers=Object.entries(this.providersMetaData||{});let promises=providers.map(([,provider])=>this._checkIfAssetExists(provider.discoveryPath));let results=await Promise.all(promises); providers=providers.filter((_,idx)=>results[idx]);return new Map(providers);},handleRejected(key){let rejected=this.cloudStorageRejectedKeys;if(!rejected){Services.prefs.setCharPref(CLOUD_SERVICES_PREF+"rejected.key",key);}else{
 let keys=rejected.split(",");if(key){keys.push(key);}
Services.prefs.setCharPref(CLOUD_SERVICES_PREF+"rejected.key",keys.join(","));}},setCloudStoragePref(key){Services.prefs.setCharPref(CLOUD_SERVICES_PREF+"storage.key",key);Services.prefs.setIntPref("browser.download.folderList",3);},getPreferredProviderMetaData(){ return this.providersMetaData.hasOwnProperty(this.preferredProviderKey)?this.providersMetaData[this.preferredProviderKey]:null;},async getProviderIfInUse(){
 if(this.isAPIEnabled&&this.preferredProviderKey&&(await this.getDownloadFolder())){let provider=this.getPreferredProviderMetaData();return provider.displayName||null;}
return null;},};XPCOMUtils.defineLazyPreferenceGetter(CloudStorageInternal,"preferredProviderKey",CLOUD_SERVICES_PREF+"storage.key","");XPCOMUtils.defineLazyPreferenceGetter(CloudStorageInternal,"cloudStorageRejectedKeys",CLOUD_SERVICES_PREF+"rejected.key","");XPCOMUtils.defineLazyPreferenceGetter(CloudStorageInternal,"lastPromptTime",CLOUD_SERVICES_PREF+"lastprompt",0 );XPCOMUtils.defineLazyPreferenceGetter(CloudStorageInternal,"promptInterval",CLOUD_SERVICES_PREF+"interval.prompt",0 );XPCOMUtils.defineLazyPreferenceGetter(CloudStorageInternal,"isAPIEnabled",CLOUD_SERVICES_PREF+"api.enabled",false,()=>CloudStorage.init());CloudStorageInternal.promiseInit=CloudStorage.init();