//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ExtensionStorageSync","extensionStorageSync"];const STORAGE_SYNC_ENABLED_PREF="webextensions.storage.sync.enabled";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const NS_ERROR_DOM_QUOTA_EXCEEDED_ERR=0x80530016;XPCOMUtils.defineLazyModuleGetters(this,{ExtensionCommon:"resource://gre/modules/ExtensionCommon.jsm",ExtensionUtils:"resource://gre/modules/ExtensionUtils.jsm",});XPCOMUtils.defineLazyPreferenceGetter(this,"prefPermitsStorageSync",STORAGE_SYNC_ENABLED_PREF,true);
XPCOMUtils.defineLazyGetter(this,"storageSvc",()=>Cc["@mozilla.org/extensions/storage/sync;1"].getService(Ci.nsIInterfaceRequestor).getInterface(Ci.mozIExtensionStorageArea));XPCOMUtils.defineLazyGetter(this,"extensionStorageSyncKinto",()=>ChromeUtils.import("resource://gre/modules/ExtensionStorageSyncKinto.jsm",{}).extensionStorageSync);
function ExtensionStorageApiCallback(resolve,reject,changeCallback){this.resolve=resolve;this.reject=reject;this.changeCallback=changeCallback;}
ExtensionStorageApiCallback.prototype={QueryInterface:ChromeUtils.generateQI(["mozIExtensionStorageListener","mozIExtensionStorageCallback",]),handleSuccess(result){this.resolve(result?JSON.parse(result):null);},handleError(code,message){let e=new Error(message);e.code=code;Cu.reportError(e);this.reject(e);},onChanged(extId,json){if(this.changeCallback&&json){try{this.changeCallback(extId,JSON.parse(json));}catch(ex){Cu.reportError(ex);}}},};class ExtensionStorageSync{constructor(){this.listeners=new Map();

this.migrationOk=true;}
async _promisify(fnName,extension,context,...args){let extId=extension.id;if(prefPermitsStorageSync!==true){throw new ExtensionUtils.ExtensionError(`Please set ${STORAGE_SYNC_ENABLED_PREF} to true in about:config`);}
if(this.migrationOk){try{return await new Promise((resolve,reject)=>{let callback=new ExtensionStorageApiCallback(resolve,reject,(extId,changes)=>this.notifyListeners(extId,changes));let sargs=args.map(JSON.stringify);storageSvc[fnName](extId,...sargs,callback);});}catch(ex){if(ex.code!=Cr.NS_ERROR_CANNOT_CONVERT_DATA){
let sanitized=ex.code==NS_ERROR_DOM_QUOTA_EXCEEDED_ERR?`QuotaExceededError: storage.sync API call exceeded its quota limitations.`:"An unexpected error occurred";throw new ExtensionUtils.ExtensionError(sanitized);}
Cu.reportError("migration of extension-storage failed - will fall back to kinto");this.migrationOk=false;}}
return extensionStorageSyncKinto[fnName](extension,...args,context);}
set(extension,items,context){return this._promisify("set",extension,context,items);}
remove(extension,keys,context){return this._promisify("remove",extension,context,keys);}
clear(extension,context){return this._promisify("clear",extension,context);}
get(extension,spec,context){return this._promisify("get",extension,context,spec);}
getBytesInUse(extension,keys,context){return this._promisify("getBytesInUse",extension,context,keys);}
addOnChangedListener(extension,listener,context){let listeners=this.listeners.get(extension.id)||new Set();listeners.add(listener);this.listeners.set(extension.id,listeners);}
removeOnChangedListener(extension,listener){let listeners=this.listeners.get(extension.id);listeners.delete(listener);if(listeners.size==0){this.listeners.delete(extension.id);}}
notifyListeners(extId,changes){let listeners=this.listeners.get(extId)||new Set();if(listeners){for(let listener of listeners){ExtensionCommon.runSafeSyncWithoutClone(listener,changes);}}}}
var extensionStorageSync=new ExtensionStorageSync();