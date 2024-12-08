//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["BasePromiseWorker"];ChromeUtils.defineModuleGetter(this,"PromiseUtils","resource://gre/modules/PromiseUtils.jsm");function Queue(){this._array=[];}
Queue.prototype={pop:function pop(){return this._array.shift();},push:function push(x){return this._array.push(x);},isEmpty:function isEmpty(){return!this._array.length;},};const EXCEPTION_CONSTRUCTORS={EvalError(error){let result=new EvalError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},InternalError(error){let result=new InternalError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},RangeError(error){let result=new RangeError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},ReferenceError(error){let result=new ReferenceError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},SyntaxError(error){let result=new SyntaxError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},TypeError(error){let result=new TypeError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},URIError(error){let result=new URIError(error.message,error.fileName,error.lineNumber);result.stack=error.stack;return result;},};var BasePromiseWorker=function(url){if(typeof url!="string"){throw new TypeError("Expecting a string");}
this._url=url;this.ExceptionHandlers=Object.create(EXCEPTION_CONSTRUCTORS);this._queue=new Queue();this._id=0;this.launchTimeStamp=null;this.workerTimeStamps=null;};BasePromiseWorker.prototype={log(){},get _worker(){if(this.__worker){return this.__worker;}
let worker=(this.__worker=new ChromeWorker(this._url));
this.launchTimeStamp=Date.now();worker.onerror=error=>{this.log("Received uncaught error from worker",error.message,error.filename,error.lineno);error.preventDefault();let{deferred}=this._queue.pop();deferred.reject(error);};worker.onmessage=msg=>{this.log("Received message from worker",msg.data);let handler=this._queue.pop();let deferred=handler.deferred;let data=msg.data;if(data.id!=handler.id){throw new Error("Internal error: expecting msg "+
handler.id+", "+" got "+
data.id+": "+
JSON.stringify(msg.data));}
if("timeStamps"in data){this.workerTimeStamps=data.timeStamps;}
if("ok"in data){deferred.resolve(data);}else if("fail"in data){
deferred.reject(new WorkerError(data.fail));}};return worker;},post(fun,args,closure,transfers){return async function postMessage(){ if(args){args=await Promise.resolve(Promise.all(args));}
if(transfers){transfers=await Promise.resolve(Promise.all(transfers));}else{transfers=[];}
if(args){ args=args.map(arg=>{if(arg instanceof BasePromiseWorker.Meta){if(arg.meta&&"transfers"in arg.meta){transfers.push(...arg.meta.transfers);}
return arg.data;}
return arg;});}
let id=++this._id;let message={fun,args,id};this.log("Posting message",message);try{this._worker.postMessage(message,...[transfers]);}catch(ex){if(typeof ex=="number"){this.log("Could not post message",message,"due to xpcom error",ex);throw new Components.Exception("Error in postMessage",ex);}
this.log("Could not post message",message,"due to error",ex);throw ex;}
let deferred=PromiseUtils.defer();this._queue.push({deferred,closure,id});this.log("Message posted");let reply;try{this.log("Expecting reply");reply=await deferred.promise;}catch(error){this.log("Got error",error);reply=error;if(error instanceof WorkerError){ throw this.ExceptionHandlers[error.data.exn](error.data);}
if(error instanceof ErrorEvent){ this.log("Error serialized by DOM",error.message,error.filename,error.lineno);throw new Error(error.message,error.filename,error.lineno);} 
throw error;}
let options=null;if(args){options=args[args.length-1];}
if(!options||typeof options!=="object"||!("outExecutionDuration"in options)){return reply.ok;}

if(!("durationMs"in reply)){return reply.ok;}

let durationMs=Math.max(0,reply.durationMs); if(typeof options.outExecutionDuration=="number"){options.outExecutionDuration+=durationMs;}else{options.outExecutionDuration=durationMs;}
return reply.ok;}.bind(this)();},terminate(){if(!this.__worker){return;}
try{this.__worker.terminate();delete this.__worker;}catch(ex){this.log("Error whilst terminating ChromeWorker: "+ex.message);}
let error;while(!this._queue.isEmpty()){if(!error){error=new Error("Internal error: worker terminated");}
let{deferred}=this._queue.pop();deferred.reject(error);}},};function WorkerError(data){this.data=data;}
BasePromiseWorker.Meta=function(data,meta){this.data=data;this.meta=meta;};