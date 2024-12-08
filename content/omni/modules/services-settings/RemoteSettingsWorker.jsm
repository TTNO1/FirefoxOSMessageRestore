"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{setTimeout,clearTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");var EXPORTED_SYMBOLS=["RemoteSettingsWorker"];XPCOMUtils.defineLazyPreferenceGetter(this,"gMaxIdleMilliseconds","services.settings.worker_idle_max_milliseconds",30*1000
);ChromeUtils.defineModuleGetter(this,"AsyncShutdown","resource://gre/modules/AsyncShutdown.jsm");ChromeUtils.defineModuleGetter(this,"SharedUtils","resource://services-settings/SharedUtils.jsm");
let gShutdown=false;let gShutdownResolver=null;class RemoteSettingsWorkerError extends Error{constructor(message){super(message);this.name="RemoteSettingsWorkerError";}}
class Worker{constructor(source){if(gShutdown){Cu.reportError("Can't create worker once shutdown has started");}
this.source=source;this.worker=null;this.callbacks=new Map();this.lastCallbackId=0;this.idleTimeoutId=null;}
async _execute(method,args=[],options={}){if(gShutdown&&method!="prepareShutdown"){throw new RemoteSettingsWorkerError("Remote Settings has shut down.");}
if(method=="prepareShutdown"&&!this.worker){return null;}
const{mustComplete=false}=options;if(!this.worker){this.worker=new ChromeWorker(this.source);this.worker.onmessage=this._onWorkerMessage.bind(this);this.worker.onerror=error=>{for(const{reject}of this.callbacks.values()){reject(error);}
this.callbacks.clear();this.stop();};}
if(this.idleTimeoutId){clearTimeout(this.idleTimeoutId);}
let identifier=method+"-";if(identifier=="importJSONDump-"){identifier+=`${args[0]}-${args[1]}-`;}
return new Promise((resolve,reject)=>{const callbackId=`${identifier}${++this.lastCallbackId}`;this.callbacks.set(callbackId,{resolve,reject,mustComplete});this.worker.postMessage({callbackId,method,args});});}
_onWorkerMessage(event){const{callbackId,result,error}=event.data;
if(!this.callbacks.has(callbackId)){return;}
const{resolve,reject}=this.callbacks.get(callbackId);if(error){reject(new RemoteSettingsWorkerError(error));}else{resolve(result);}
this.callbacks.delete(callbackId);if(!this.callbacks.size){if(gShutdown){this.stop();if(gShutdownResolver){gShutdownResolver();}}else{this.idleTimeoutId=setTimeout(()=>{this.stop();},gMaxIdleMilliseconds);}}}
_abortCancelableRequests(){const callbackCopy=Array.from(this.callbacks.entries());const error=new Error("Shutdown, aborting read-only worker requests.");for(const[id,{reject,mustComplete}]of callbackCopy){if(!mustComplete){this.callbacks.delete(id);reject(error);}}
if(!this.callbacks.size){this.stop();if(gShutdownResolver){gShutdownResolver();}}

this._execute("prepareShutdown");}
stop(){this.worker.terminate();this.worker=null;this.idleTimeoutId=null;}
async canonicalStringify(localRecords,remoteRecords,timestamp){return this._execute("canonicalStringify",[localRecords,remoteRecords,timestamp,]);}
async importJSONDump(bucket,collection){return this._execute("importJSONDump",[bucket,collection],{mustComplete:true,});}
async checkFileHash(filepath,size,hash){return this._execute("checkFileHash",[filepath,size,hash]);}
async checkContentHash(buffer,size,hash){
return SharedUtils.checkContentHash(buffer,size,hash);}}




try{AsyncShutdown.profileBeforeChange.addBlocker("Remote Settings profile-before-change",async()=>{gShutdown=true;if(!RemoteSettingsWorker.worker||!RemoteSettingsWorker.callbacks.size){return null;}
let finishedPromise=new Promise(resolve=>{gShutdownResolver=resolve;});RemoteSettingsWorker._abortCancelableRequests();return finishedPromise;},{fetchState(){const remainingCallbacks=RemoteSettingsWorker.callbacks;const details=Array.from(remainingCallbacks.keys()).join(", ");return`Remaining: ${remainingCallbacks.size} callbacks (${details}).`;},});}catch(ex){Cu.reportError("Couldn't add shutdown blocker, assuming shutdown has started.");Cu.reportError(ex);

gShutdown=true;}
var RemoteSettingsWorker=new Worker("resource://services-settings/RemoteSettingsWorker.js");