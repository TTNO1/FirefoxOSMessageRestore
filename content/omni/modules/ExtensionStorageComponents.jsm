//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AsyncShutdown:"resource://gre/modules/AsyncShutdown.jsm",FileUtils:"resource://gre/modules/FileUtils.jsm",});const EXPORTED_SYMBOLS=["StorageSyncService"];const StorageSyncArea=Components.Constructor("@mozilla.org/extensions/storage/internal/sync-area;1","mozIConfigurableExtensionStorageArea","configure");function StorageSyncService(){if(StorageSyncService._singleton){return StorageSyncService._singleton;}
let file=FileUtils.getFile("ProfD",["storage-sync-v2.sqlite"]);let kintoFile=FileUtils.getFile("ProfD",["storage-sync.sqlite"]);this._storageArea=new StorageSyncArea(file,kintoFile);this._shutdownBound=()=>this._shutdown();AsyncShutdown.profileChangeTeardown.addBlocker("StorageSyncService: shutdown",this._shutdownBound);StorageSyncService._singleton=this;}
StorageSyncService._singleton=null;StorageSyncService.prototype={QueryInterface:ChromeUtils.generateQI(["nsIInterfaceRequestor"]),

getInterface(iid){if(iid.equals(Ci.mozIExtensionStorageArea)||iid.equals(Ci.mozIBridgedSyncEngine)){return this._storageArea.QueryInterface(iid);}
throw Components.Exception("This interface isn't implemented",Cr.NS_ERROR_NO_INTERFACE);},
async _shutdown(){try{await new Promise((resolve,reject)=>{this._storageArea.teardown({handleSuccess:resolve,handleError(code,message){reject(Components.Exception(message,code));},});});}finally{AsyncShutdown.profileChangeTeardown.removeBlocker(this._shutdownBound);}},};