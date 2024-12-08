//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["NativeApp"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{ExtensionUtils:{ExtensionError,promiseTimeout},}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AppConstants:"resource://gre/modules/AppConstants.jsm",AsyncShutdown:"resource://gre/modules/AsyncShutdown.jsm",NativeManifests:"resource://gre/modules/NativeManifests.jsm",OS:"resource://gre/modules/osfile.jsm",Services:"resource://gre/modules/Services.jsm",Subprocess:"resource://gre/modules/Subprocess.jsm",});

const GRACEFUL_SHUTDOWN_TIME=3000;




const MAX_READ=1024*1024;const MAX_WRITE=0xffffffff;const PREF_MAX_READ="webextensions.native-messaging.max-input-message-bytes";const PREF_MAX_WRITE="webextensions.native-messaging.max-output-message-bytes";const global=this;var NativeApp=class extends EventEmitter{constructor(context,application){super();this.context=context;this.name=application;this.context.callOnClose(this);this.proc=null;this.readPromise=null;this.sendQueue=[];this.writePromise=null;this.cleanupStarted=false;this.startupPromise=NativeManifests.lookupManifest("stdio",application,context).then(hostInfo=>{
if(!hostInfo){throw new ExtensionError(`No such native application ${application}`);}
let command=hostInfo.manifest.path;if(AppConstants.platform=="win"){

command=OS.Path.join(OS.Path.dirname(hostInfo.path),command);}
let subprocessOpts={command:command,arguments:[hostInfo.path,context.extension.id],workdir:OS.Path.dirname(command),stderr:"pipe",disclaim:true,};return Subprocess.call(subprocessOpts);}).then(proc=>{this.startupPromise=null;this.proc=proc;this._startRead();this._startWrite();this._startStderrRead();}).catch(err=>{this.startupPromise=null;Cu.reportError(err instanceof Error?err:err.message);this._cleanup(err);});}
onConnect(portId,port){ this.on("message",(_,message)=>{port.sendPortMessage(portId,new StructuredCloneHolder(message));});this.once("disconnect",(_,error)=>{port.sendPortDisconnect(portId,error&&new ClonedErrorHolder(error));});return{onPortMessage:holder=>this.send(holder),onPortDisconnect:()=>this.close(),};}
static encodeMessage(context,message){message=context.jsonStringify(message);let buffer=new TextEncoder().encode(message).buffer;if(buffer.byteLength>NativeApp.maxWrite){throw new context.Error("Write too big");}
return buffer;}



get _isDisconnected(){return!this.proc&&!this.startupPromise;}
_startRead(){if(this.readPromise){throw new Error("Entered _startRead() while readPromise is non-null");}
this.readPromise=this.proc.stdout.readUint32().then(len=>{if(len>NativeApp.maxRead){throw new ExtensionError(`Native application tried to send a message of ${len} bytes, which exceeds the limit of ${NativeApp.maxRead} bytes.`);}
return this.proc.stdout.readJSON(len);}).then(msg=>{this.emit("message",msg);this.readPromise=null;this._startRead();}).catch(err=>{if(err.errorCode!=Subprocess.ERROR_END_OF_FILE){Cu.reportError(err instanceof Error?err:err.message);}
this._cleanup(err);});}
_startWrite(){if(!this.sendQueue.length){return;}
if(this.writePromise){throw new Error("Entered _startWrite() while writePromise is non-null");}
let buffer=this.sendQueue.shift();let uintArray=Uint32Array.of(buffer.byteLength);this.writePromise=Promise.all([this.proc.stdin.write(uintArray.buffer),this.proc.stdin.write(buffer),]).then(()=>{this.writePromise=null;this._startWrite();}).catch(err=>{Cu.reportError(err.message);this._cleanup(err);});}
_startStderrRead(){let proc=this.proc;let app=this.name;(async function(){let partial="";while(true){let data=await proc.stderr.readString();if(!data.length){ if(partial){Services.console.logStringMessage(`stderr output from native app ${app}: ${partial}`);}
break;}
let lines=data.split(/\r?\n/);lines[0]=partial+lines[0];partial=lines.pop();for(let line of lines){Services.console.logStringMessage(`stderr output from native app ${app}: ${line}`);}}})();}
send(holder){if(this._isDisconnected){throw new ExtensionError("Attempt to postMessage on disconnected port");}
let msg=holder.deserialize(global);if(Cu.getClassName(msg,true)!="ArrayBuffer"){
throw new Error("The message to the native messaging host is not an ArrayBuffer");}
let buffer=msg;if(buffer.byteLength>NativeApp.maxWrite){throw new ExtensionError("Write too big");}
this.sendQueue.push(buffer);if(!this.startupPromise&&!this.writePromise){this._startWrite();}}

async _cleanup(err,fromExtension=false){if(this.cleanupStarted){return;}
this.cleanupStarted=true;this.context.forgetOnClose(this);if(!fromExtension){if(err&&err.errorCode==Subprocess.ERROR_END_OF_FILE){err=null;}
this.emit("disconnect",err);}
await this.startupPromise;if(!this.proc){return;}

this.proc.stdin.close().catch(err=>{if(err.errorCode!=Subprocess.ERROR_END_OF_FILE){Cu.reportError(err);}});let exitPromise=Promise.race([this.proc.wait().then(()=>{this.proc=null;}),promiseTimeout(GRACEFUL_SHUTDOWN_TIME).then(()=>{if(this.proc){this.proc.kill(GRACEFUL_SHUTDOWN_TIME);


return promiseTimeout(2*GRACEFUL_SHUTDOWN_TIME);}}),]);AsyncShutdown.profileBeforeChange.addBlocker(`Native Messaging: Wait for application ${this.name} to exit`,exitPromise);}
close(){this._cleanup(null,true);}
sendMessage(holder){let responsePromise=new Promise((resolve,reject)=>{this.once("message",(what,msg)=>{resolve(msg);});this.once("disconnect",(what,err)=>{reject(err);});});let result=this.startupPromise.then(()=>{this.send(holder);return responsePromise;});result.then(()=>{this._cleanup();},()=>{
responsePromise.catch(()=>{});this._cleanup();});return result;}};XPCOMUtils.defineLazyPreferenceGetter(NativeApp,"maxRead",PREF_MAX_READ,MAX_READ);XPCOMUtils.defineLazyPreferenceGetter(NativeApp,"maxWrite",PREF_MAX_WRITE,MAX_WRITE);