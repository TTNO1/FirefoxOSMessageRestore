"use strict";







var Cu=this.require?require("chrome").Cu:Components.utils;var Cc=this.require?require("chrome").Cc:Components.classes;var Ci=this.require?require("chrome").Ci:Components.interfaces;

var Components_=this.require?require("chrome").components:Components;if(Cu){Cu.import("resource://gre/modules/Services.jsm",this);Cu.import("resource://gre/modules/XPCOMUtils.jsm",this);XPCOMUtils.defineLazyServiceGetter(this,"FinalizationWitnessService","@mozilla.org/toolkit/finalizationwitness;1","nsIFinalizationWitnessService");}
const STATUS_PENDING=0;const STATUS_RESOLVED=1;const STATUS_REJECTED=2;



const salt=Math.floor(Math.random()*100);const N_INTERNALS="{private:internals:"+salt+"}";const DOMPromise=Cu?Promise:null;








var PendingErrors={_counter:0,
_observers:new Set(),_map:new Map(),init(){Services.obs.addObserver(function observe(aSubject,aTopic,aValue){PendingErrors.report(aValue);},"promise-finalization-witness");},register(error){let id="pending-error-"+this._counter++;






let value={date:new Date(),message:""+error,fileName:null,stack:null,lineNumber:null,};try{ if(error&&error instanceof Ci.nsIException){try{
value.message=error.message;}catch(ex){}
try{value.fileName=error.filename;}catch(ex){}
try{value.lineNumber=error.lineNumber;}catch(ex){}}else if(typeof error=="object"&&error){for(let k of["fileName","stack","lineNumber"]){try{ let v=error[k];value[k]=v?""+v:null;}catch(ex){}}}
if(!value.stack){let stack=null;if(error&&error.location&&error.location instanceof Ci.nsIStackFrame){stack=error.location;}else{stack=Components_.stack;while(stack){if(!stack.filename.endsWith("/Promise.jsm")){break;}
stack=stack.caller;}}
if(stack){let frames=[];while(stack){frames.push(stack);stack=stack.caller;}
value.stack=frames.join("\n");}}}catch(ex){}
this._map.set(id,value);return id;},report(id){let value=this._map.get(id);if(!value){return;}
this._map.delete(id);for(let obs of this._observers.values()){obs(value);}},flush(){for(let key of Array.from(this._map.keys())){this.report(key);}},unregister(id){this._map.delete(id);},addObserver(observer){this._observers.add(observer);},removeObserver(observer){this._observers.delete(observer);},removeAllObservers(){this._observers.clear();},};if(Cu){PendingErrors.init();}
PendingErrors.addObserver(function(details){const generalDescription="A promise chain failed to handle a rejection."+" Did you forget to '.catch', or did you forget to 'return'?\nSee"+" https://developer.mozilla.org/Mozilla/JavaScript_code_modules/Promise.jsm/Promise\n\n";let error=Cc["@mozilla.org/scripterror;1"].createInstance(Ci.nsIScriptError);if(!error||!Services.console){ dump("*************************\n");dump(generalDescription);dump("On: "+details.date+"\n");dump("Full message: "+details.message+"\n");dump("Full stack: "+(details.stack||"not available")+"\n");dump("*************************\n");return;}
let message=details.message;if(details.stack){message+="\nFull Stack: "+details.stack;}
error.init(generalDescription+"Date: "+
details.date+"\nFull Message: "+
message,details.fileName,details.lineNumber?""+details.lineNumber:0,details.lineNumber||0,0,Ci.nsIScriptError.errorFlag,"chrome javascript");Services.console.logMessage(error);});

const ERRORS_TO_REPORT=["EvalError","RangeError","ReferenceError","TypeError",]; this.Promise=function Promise(aExecutor){if(typeof aExecutor!="function"){throw new TypeError("Promise constructor must be called with an executor.");}
Object.defineProperty(this,N_INTERNALS,{value:{status:STATUS_PENDING,value:undefined,handlers:[],witness:undefined,},});Object.seal(this);let resolve=PromiseWalker.completePromise.bind(PromiseWalker,this,STATUS_RESOLVED);let reject=PromiseWalker.completePromise.bind(PromiseWalker,this,STATUS_REJECTED);try{aExecutor(resolve,reject);}catch(ex){reject(ex);}};Promise.prototype.then=function(aOnResolve,aOnReject){let handler=new Handler(this,aOnResolve,aOnReject);this[N_INTERNALS].handlers.push(handler);
if(this[N_INTERNALS].status!=STATUS_PENDING){if(this[N_INTERNALS].witness!=null){let[id,witness]=this[N_INTERNALS].witness;this[N_INTERNALS].witness=null;witness.forget();PendingErrors.unregister(id);}
PromiseWalker.schedulePromise(this);}
return handler.nextPromise;};Promise.prototype.catch=function(aOnReject){return this.then(undefined,aOnReject);};Promise.defer=function(){return new Deferred();};Promise.resolve=function(aValue){if(aValue&&typeof aValue=="function"&&aValue.isAsyncFunction){throw new TypeError("Cannot resolve a promise with an async function. "+"You should either invoke the async function first "+"or use 'Task.spawn' instead of 'Task.async' to start "+"the Task and return its promise.");}
if(aValue instanceof Promise){return aValue;}
return new Promise(aResolve=>aResolve(aValue));};Promise.reject=function(aReason){return new Promise((_,aReject)=>aReject(aReason));};Promise.all=function(aValues){if(aValues==null||typeof aValues[Symbol.iterator]!="function"){throw new Error("Promise.all() expects an iterable.");}
return new Promise((resolve,reject)=>{let values=Array.isArray(aValues)?aValues:[...aValues];let countdown=values.length;let resolutionValues=new Array(countdown);if(!countdown){resolve(resolutionValues);return;}
function checkForCompletion(aValue,aIndex){resolutionValues[aIndex]=aValue;if(--countdown===0){resolve(resolutionValues);}}
for(let i=0;i<values.length;i++){let index=i;let value=values[i];let resolver=val=>checkForCompletion(val,index);if(value&&typeof value.then=="function"){value.then(resolver,reject);}else{resolver(value);}}});};Promise.race=function(aValues){if(aValues==null||typeof aValues[Symbol.iterator]!="function"){throw new Error("Promise.race() expects an iterable.");}
return new Promise((resolve,reject)=>{for(let value of aValues){Promise.resolve(value).then(resolve,reject);}});};Promise.Debugging={addUncaughtErrorObserver(observer){PendingErrors.addObserver(observer);},removeUncaughtErrorObserver(observer){PendingErrors.removeObserver(observer);},clearUncaughtErrorObservers(){PendingErrors.removeAllObservers();},flushUncaughtErrors(){PendingErrors.flush();},};Object.freeze(Promise.Debugging);Object.freeze(Promise);
if(this.module){module.exports=Promise;} 
this.PromiseWalker={handlers:[],completePromise(aPromise,aStatus,aValue){if(aPromise[N_INTERNALS].status!=STATUS_PENDING){return;}

if(aStatus==STATUS_RESOLVED&&aValue&&typeof aValue.then=="function"){aValue.then(this.completePromise.bind(this,aPromise,STATUS_RESOLVED),this.completePromise.bind(this,aPromise,STATUS_REJECTED));return;}
aPromise[N_INTERNALS].status=aStatus;aPromise[N_INTERNALS].value=aValue;if(aPromise[N_INTERNALS].handlers.length){this.schedulePromise(aPromise);}else if(Cu&&aStatus==STATUS_REJECTED){let id=PendingErrors.register(aValue);let witness=FinalizationWitnessService.make("promise-finalization-witness",id);aPromise[N_INTERNALS].witness=[id,witness];}},scheduleWalkerLoop(){this.walkerLoopScheduled=true;








if(Cu){let stack=Components_?Components_.stack:null;if(stack){DOMPromise.resolve().then(()=>{Cu.callFunctionWithAsyncStack(this.walkerLoop.bind(this),stack,"Promise");});}else{DOMPromise.resolve().then(()=>this.walkerLoop());}}else{setImmediate(this.walkerLoop);}},schedulePromise(aPromise){for(let handler of aPromise[N_INTERNALS].handlers){this.handlers.push(handler);}
aPromise[N_INTERNALS].handlers.length=0;if(!this.walkerLoopScheduled){this.scheduleWalkerLoop();}},walkerLoopScheduled:false,walkerLoop(){








if(this.handlers.length>1){this.scheduleWalkerLoop();}else{this.walkerLoopScheduled=false;}
while(this.handlers.length){this.handlers.shift().process();}},};PromiseWalker.walkerLoop=PromiseWalker.walkerLoop.bind(PromiseWalker); function Deferred(){this.promise=new Promise((aResolve,aReject)=>{this.resolve=aResolve;this.reject=aReject;});Object.freeze(this);}
Deferred.prototype={promise:null,resolve:null,reject:null,}; function Handler(aThisPromise,aOnResolve,aOnReject){this.thisPromise=aThisPromise;this.onResolve=aOnResolve;this.onReject=aOnReject;this.nextPromise=new Promise(()=>{});}
Handler.prototype={thisPromise:null,onResolve:null,onReject:null,nextPromise:null,process(){let nextStatus=this.thisPromise[N_INTERNALS].status;let nextValue=this.thisPromise[N_INTERNALS].value;try{

if(nextStatus==STATUS_RESOLVED){if(typeof this.onResolve=="function"){nextValue=this.onResolve.call(undefined,nextValue);}}else if(typeof this.onReject=="function"){nextValue=this.onReject.call(undefined,nextValue);nextStatus=STATUS_RESOLVED;}}catch(ex){if(ex&&typeof ex=="object"&&"name"in ex&&ERRORS_TO_REPORT.includes(ex.name)){


dump("*************************\n");dump("A coding exception was thrown in a Promise "+
(nextStatus==STATUS_RESOLVED?"resolution":"rejection")+" callback.\n");dump("See https://developer.mozilla.org/Mozilla/JavaScript_code_modules/Promise.jsm/Promise\n\n");dump("Full message: "+ex+"\n");dump("Full stack: "+("stack"in ex?ex.stack:"not available")+"\n");dump("*************************\n");}
nextStatus=STATUS_REJECTED;nextValue=ex;}
PromiseWalker.completePromise(this.nextPromise,nextStatus,nextValue);},};