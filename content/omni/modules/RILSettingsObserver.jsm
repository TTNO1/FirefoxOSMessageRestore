//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gSettingsManager","@mozilla.org/sidl-native/settings;1","nsISettingsManager");var RIL_DEBUG=ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");var DEBUG=RIL_DEBUG.DEBUG_RIL;function debug(s){dump("-@- RILSettingsObserver: "+s+"\n");}
function updateDebugFlag(){ try{DEBUG=RIL_DEBUG.DEBUG_RIL||Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);}catch(e){}}
updateDebugFlag();this.RILSettingsObserver=function(aListener){this.listener=aListener;};RILSettingsObserver.prototype={QueryInterface:ChromeUtils.generateQI([Ci.nsISettingsObserver]),listener:null,observeSetting(aSettingInfo){if(aSettingInfo){let name=aSettingInfo.name;let result=JSON.parse(aSettingInfo.value);if(this.listener){this.listener.handleSettingChanged(name,result);}else if(DEBUG){debug("listener null.");}}},getSettingWithDefault(aKey,aDefaultValue){return new Promise(resolve=>{gSettingsManager.get(aKey,{resolve:setting=>{if(DEBUG){debug("get setting "+setting.name+" value: "+setting.value);}
resolve({name:setting.name,value:JSON.parse(setting.value)});},reject:()=>{if(DEBUG){debug("get setting "+
aKey+"failed, use default value: "+
aDefaultValue);}
resolve({name:aKey,value:aDefaultValue});},});});},addSettingObserver(aKey){if(!aKey){return;}
if(gSettingsManager){if(DEBUG){debug("add "+aKey+" setting observer.");}
gSettingsManager.addObserver(aKey,this,{resolve:()=>{if(DEBUG){debug("observed "+aKey+" successed.");}},reject:()=>{if(DEBUG){debug("observed "+aKey+" failed.");}},});}},removeSettingObserver(aKey){if(!aKey){return;}
if(gSettingsManager){if(DEBUG){debug("remove "+aKey+" setting observer.");}
gSettingsManager.removeObserver(aKey,this,{resolve:()=>{if(DEBUG){debug("remove observer "+aKey+" successed.");}},reject:()=>{if(DEBUG){debug("remove observer "+aKey+" failed.");}},});}},};this.EXPORTED_SYMBOLS=["RILSettingsObserver"];