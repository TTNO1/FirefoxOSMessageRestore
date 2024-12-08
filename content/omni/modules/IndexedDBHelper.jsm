//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var DEBUG=0;var debug;if(DEBUG){debug=function(s){dump("-*- IndexedDBHelper: "+s+"\n");};}else{debug=function(s){};}
var EXPORTED_SYMBOLS=["IndexedDBHelper"];Cu.importGlobalProperties(["indexedDB"]);ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");function getErrorName(err){return(err&&err.name)||"UnknownError";}
function IndexedDBHelper(){}
IndexedDBHelper.prototype={ close:function close(){if(this._db){this._db.close();this._db=null;}},open:function open(aCallback){if(aCallback&&!this._waitForOpenCallbacks.has(aCallback)){this._waitForOpenCallbacks.add(aCallback);if(this._waitForOpenCallbacks.size!==1){return;}}
let self=this;let invokeCallbacks=err=>{for(let callback of self._waitForOpenCallbacks){callback(err);}
self._waitForOpenCallbacks.clear();};if(DEBUG){debug("Try to open database:"+self.dbName+" "+self.dbVersion);}
let req;try{req=indexedDB.open(this.dbName,this.dbVersion);}catch(e){if(DEBUG){debug("Error opening database: "+self.dbName);}
Services.tm.dispatchToMainThread(()=>invokeCallbacks(getErrorName(e)));return;}
req.onsuccess=function(event){if(DEBUG){debug("Opened database:"+self.dbName+" "+self.dbVersion);}
self._db=event.target.result;self._db.onversionchange=function(event){if(DEBUG){debug("WARNING: DB modified from a different window.");}};invokeCallbacks();};req.onupgradeneeded=function(aEvent){if(DEBUG){debug("Database needs upgrade:"+
self.dbName+
aEvent.oldVersion+
aEvent.newVersion);debug("Correct new database version:"+
(aEvent.newVersion==this.dbVersion));}
let _db=aEvent.target.result;self.upgradeSchema(req.transaction,_db,aEvent.oldVersion,aEvent.newVersion);};req.onerror=function(aEvent){if(DEBUG){debug("Failed to open database: "+self.dbName);}
invokeCallbacks(getErrorName(aEvent.target.error));};req.onblocked=function(aEvent){if(DEBUG){debug("Opening database request is blocked.");}};},ensureDB:function ensureDB(aSuccessCb,aFailureCb){if(this._db){if(DEBUG){debug("ensureDB: already have a database, returning early.");}
if(aSuccessCb){Services.tm.dispatchToMainThread(aSuccessCb);}
return;}
this.open(aError=>{if(aError){aFailureCb&&aFailureCb(aError);}else{aSuccessCb&&aSuccessCb();}});},newTxn:function newTxn(txn_type,store_name,callback,successCb,failureCb){this.ensureDB(()=>{if(DEBUG){debug("Starting new transaction"+txn_type);}
let txn;try{txn=this._db.transaction(Array.isArray(store_name)?store_name:this.dbStoreNames,txn_type);}catch(e){if(DEBUG){debug("Error starting transaction: "+this.dbName);}
failureCb(getErrorName(e));return;}
if(DEBUG){debug("Retrieving object store: "+this.dbName);}
let stores;if(Array.isArray(store_name)){stores=[];for(let i=0;i<store_name.length;++i){stores.push(txn.objectStore(store_name[i]));}}else{stores=txn.objectStore(store_name);}
txn.oncomplete=function(){if(DEBUG){debug("Transaction complete. Returning to callback.");}
if(successCb){if("result"in txn){successCb(txn.result);}else{successCb();}}};txn.onabort=function(){if(DEBUG){debug("Caught error on transaction");}
if(failureCb){failureCb(getErrorName(txn.error));}};callback(txn,stores);},failureCb);},initDBHelper:function initDBHelper(aDBName,aDBVersion,aDBStoreNames){this.dbName=aDBName;this.dbVersion=aDBVersion;this.dbStoreNames=aDBStoreNames;this._db=null;this._waitForOpenCallbacks=new Set();},};