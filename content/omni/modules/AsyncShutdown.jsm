//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm",this);ChromeUtils.import("resource://gre/modules/Services.jsm",this);ChromeUtils.defineModuleGetter(this,"PromiseUtils","resource://gre/modules/PromiseUtils.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gDebug","@mozilla.org/xpcom/debug;1","nsIDebug2");Object.defineProperty(this,"gCrashReporter",{get(){delete this.gCrashReporter;try{let reporter=Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsICrashReporter);return(this.gCrashReporter=reporter);}catch(ex){return(this.gCrashReporter=null);}},configurable:true,});

const isContent= Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).processType==Ci.nsIXULRuntime.PROCESS_TYPE_CONTENT;const DELAY_WARNING_MS=10*1000;
const PREF_DELAY_CRASH_MS="toolkit.asyncshutdown.crash_timeout";var DELAY_CRASH_MS=Services.prefs.getIntPref(PREF_DELAY_CRASH_MS,60*1000);Services.prefs.addObserver(PREF_DELAY_CRASH_MS,function(){DELAY_CRASH_MS=Services.prefs.getIntPref(PREF_DELAY_CRASH_MS);});function PromiseSet(){this._indirections=new Map();

this._done=false;}
PromiseSet.prototype={wait(){let entry=this._indirections.entries().next();if(entry.done){this._done=true;return Promise.resolve();}
let[,indirection]=entry.value;let promise=indirection.promise;promise=promise.then(()=>this.wait());return promise;},add(key){if(this._done){throw new Error("Wait is complete, cannot add further promises.");}
this._ensurePromise(key);let indirection=PromiseUtils.defer();key.then(x=>{
this._indirections.delete(key);indirection.resolve(x);},err=>{this._indirections.delete(key);indirection.reject(err);}).finally(()=>{this._indirections.delete(key);

indirection.reject(new Error("Promise not fulfilled, did it lost its global?"));});this._indirections.set(key,indirection);},delete(key){this._ensurePromise(key);let value=this._indirections.get(key);if(!value){return false;}
this._indirections.delete(key);value.resolve();return true;},_ensurePromise(key){if(!key||typeof key!="object"){throw new Error("Expected an object");}
if(!("then"in key)||typeof key.then!="function"){throw new Error("Expected a Promise");}},};function log(msg,prefix="",error=null){try{dump(prefix+msg+"\n");if(error){dump(prefix+error+"\n");if(typeof error=="object"&&"stack"in error){dump(prefix+error.stack+"\n");}}}catch(ex){dump("INTERNAL ERROR in AsyncShutdown: cannot log message.\n");}}
const PREF_DEBUG_LOG="toolkit.asyncshutdown.log";var DEBUG_LOG=Services.prefs.getBoolPref(PREF_DEBUG_LOG,false);Services.prefs.addObserver(PREF_DEBUG_LOG,function(){DEBUG_LOG=Services.prefs.getBoolPref(PREF_DEBUG_LOG);});function debug(msg,error=null){if(DEBUG_LOG){log(msg,"DEBUG: ",error);}}
function warn(msg,error=null){log(msg,"WARNING: ",error);}
function fatalerr(msg,error=null){log(msg,"FATAL ERROR: ",error);}


function safeGetState(fetchState){if(!fetchState){return"(none)";}
let data,string;try{
let state=fetchState();if(!state){return"(none)";}
string=JSON.stringify(state);data=JSON.parse(string);
if(data&&typeof data=="object"){data.toString=function(){return string;};}
return data;}catch(ex){ Promise.reject(ex);if(string){return string;}
try{return"Error getting state: "+ex+" at "+ex.stack;}catch(ex2){return"Error getting state but could not display error";}}}
function looseTimer(delay){let DELAY_BEAT=1000;let timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);let beats=Math.ceil(delay/DELAY_BEAT);let deferred=PromiseUtils.defer();timer.initWithCallback(function(){if(beats<=0){deferred.resolve();}
--beats;},DELAY_BEAT,Ci.nsITimer.TYPE_REPEATING_PRECISE_CAN_SKIP);
deferred.promise.then(()=>timer.cancel(),()=>timer.cancel());return deferred;}
function getOrigin(topFrame,filename=null,lineNumber=null,stack=null){try{let frame=topFrame;for(;frame&&frame.filename==topFrame.filename;frame=frame.caller){}
if(filename==null){filename=frame?frame.filename:"?";}
if(lineNumber==null){lineNumber=frame?frame.lineNumber:0;}
if(stack==null){
stack=[];while(frame!=null){stack.push(frame.filename+":"+frame.name+":"+frame.lineNumber);frame=frame.caller;}}
return{filename,lineNumber,stack,};}catch(ex){return{filename:"<internal error: could not get origin>",lineNumber:-1,stack:"<internal error: could not get origin>",};}}
var EXPORTED_SYMBOLS=["AsyncShutdown"];var gPhases=new Map();var AsyncShutdown={get _getPhase(){let accepted=Services.prefs.getBoolPref("toolkit.asyncshutdown.testing",false);if(accepted){return getPhase;}
return undefined;},get DELAY_CRASH_MS(){return DELAY_CRASH_MS;},};function getPhase(topic){let phase=gPhases.get(topic);if(phase){return phase;}
let spinner=new Spinner(topic);phase=Object.freeze({addBlocker(name,condition,details=null){spinner.addBlocker(name,condition,details);},removeBlocker(condition){return spinner.removeBlocker(condition);},get name(){return spinner.name;},get _trigger(){let accepted=Services.prefs.getBoolPref("toolkit.asyncshutdown.testing",false);if(accepted){return()=>spinner.observe();}
return undefined;},});gPhases.set(topic,phase);return phase;}
function Spinner(topic){this._barrier=new Barrier(topic);this._topic=topic;Services.obs.addObserver(this,topic);}
Spinner.prototype={addBlocker(name,condition,details){this._barrier.client.addBlocker(name,condition,details);},removeBlocker(condition){return this._barrier.client.removeBlocker(condition);},get name(){return this._barrier.client.name;}, observe(){let topic=this._topic;debug(`Starting phase ${topic}`);Services.obs.removeObserver(this,topic);let satisfied=false; let promise;try{promise=this._barrier.wait({warnAfterMS:DELAY_WARNING_MS,crashAfterMS:DELAY_CRASH_MS,}).catch

();}catch(ex){debug("Error waiting for notification");throw ex;} 
debug("Spinning the event loop");promise.then(()=>(satisfied=true)); let thread=Services.tm.mainThread;while(!satisfied){try{thread.processNextEvent(true);}catch(ex){
Promise.reject(ex);}}
debug(`Finished phase ${topic}`);},};function Barrier(name){if(!name){throw new TypeError("Instances of Barrier need a (non-empty) name");}
this._waitForMe=new PromiseSet();this._conditionToPromise=new Map();this._promiseToBlocker=new Map();if(typeof name!="string"){throw new TypeError("The name of the barrier must be a string");}
this._name=name;this._promise=null;this._isStarted=false;this.client={get name(){return name;},addBlocker:(name,condition,details)=>{if(typeof name!="string"){throw new TypeError("Expected a human-readable name as first argument");}
if(details&&typeof details=="function"){details={fetchState:details,};}else if(!details){details={};}
if(typeof details!="object"){throw new TypeError("Expected an object as third argument to `addBlocker`, got "+details);}
if(!this._waitForMe){throw new Error(`Phase "${this._name}" is finished, it is too late to register completion condition "${name}"`);}
debug(`Adding blocker ${name} for phase ${this._name}`); let fetchState=details.fetchState||null;if(fetchState!=null&&typeof fetchState!="function"){throw new TypeError("Expected a function for option `fetchState`");}
let filename=details.filename||null;let lineNumber=details.lineNumber||null;let stack=details.stack||null;
let trigger;let promise;if(typeof condition=="function"){promise=new Promise((resolve,reject)=>{trigger=()=>{try{resolve(condition());}catch(ex){reject(ex);}};});}else{
trigger=()=>{};promise=Promise.resolve(condition);}
promise=promise.catch(error=>{let msg=`A blocker encountered an error while we were waiting.
          Blocker:  ${name}
          Phase: ${this._name}
          State: ${safeGetState(fetchState)}`;warn(msg,error);
Promise.reject(error);}).catch


();let topFrame=null;if(filename==null||lineNumber==null||stack==null){topFrame=Components.stack;}
let blocker={trigger,promise,name,fetchState,getOrigin:()=>getOrigin(topFrame,filename,lineNumber,stack),};this._waitForMe.add(promise);this._promiseToBlocker.set(promise,blocker);this._conditionToPromise.set(condition,promise);

promise=promise.then(()=>{debug(`Completed blocker ${name} for phase ${this._name}`);this._removeBlocker(condition);});if(this._isStarted){

Promise.resolve().then(trigger);}},removeBlocker:condition=>{return this._removeBlocker(condition);},};}
Barrier.prototype=Object.freeze({get state(){if(!this._isStarted){return"Not started";}
if(!this._waitForMe){return"Complete";}
let frozen=[];for(let blocker of this._promiseToBlocker.values()){let{name,fetchState}=blocker;let{stack,filename,lineNumber}=blocker.getOrigin();frozen.push({name,state:safeGetState(fetchState),filename,lineNumber,stack,});}
return frozen;},wait(options={}){if(this._promise){return this._promise;}
return(this._promise=this._wait(options));},_wait(options){ if(this._isStarted){throw new TypeError("Internal error: already started "+this._name);}
if(!this._waitForMe||!this._conditionToPromise||!this._promiseToBlocker){throw new TypeError("Internal error: already finished "+this._name);}
let topic=this._name; for(let blocker of this._promiseToBlocker.values()){blocker.trigger();}
this._isStarted=true; let promise=this._waitForMe.wait();promise=promise.catch(function onError(error){let msg="An uncaught error appeared while completing the phase."+" Phase: "+
topic;warn(msg,error);});promise=promise.then(()=>{ this._waitForMe=null;this._promiseToBlocker=null;this._conditionToPromise=null;}); let warnAfterMS=DELAY_WARNING_MS;if(options&&"warnAfterMS"in options){if(typeof options.warnAfterMS=="number"||options.warnAfterMS==null){ warnAfterMS=options.warnAfterMS;}else{throw new TypeError("Wrong option value for warnAfterMS");}}
if(warnAfterMS&&warnAfterMS>0){let timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);timer.initWithCallback(()=>{let msg="At least one completion condition is taking too long to complete."+" Conditions: "+
JSON.stringify(this.state)+" Barrier: "+
topic;warn(msg);},warnAfterMS,Ci.nsITimer.TYPE_ONE_SHOT);promise=promise.then(function onSuccess(){timer.cancel();
});}
let crashAfterMS=DELAY_CRASH_MS;if(options&&"crashAfterMS"in options){if(typeof options.crashAfterMS=="number"||options.crashAfterMS==null){ crashAfterMS=options.crashAfterMS;}else{throw new TypeError("Wrong option value for crashAfterMS");}}
if(crashAfterMS>0){let timeToCrash=null;




timeToCrash=looseTimer(crashAfterMS);timeToCrash.promise.then(()=>{let state=this.state;


let msg="AsyncShutdown timeout in "+
topic+" Conditions: "+
JSON.stringify(state)+" At least one completion condition failed to complete"+" within a reasonable amount of time. Causing a crash to"+" ensure that we do not leave the user with an unresponsive"+" process draining resources.";fatalerr(msg);if(gCrashReporter&&gCrashReporter.enabled){let data={phase:topic,conditions:state,};gCrashReporter.annotateCrashReport("AsyncShutdownTimeout",JSON.stringify(data));}else{warn("No crash reporter available");}



let filename="?";let lineNumber=-1;for(let blocker of this._promiseToBlocker.values()){({filename,lineNumber}=blocker.getOrigin());break;}
gDebug.abort(filename,lineNumber);},function onSatisfied(){
});promise=promise.then(function(){timeToCrash.reject();});}
return promise;},_removeBlocker(condition){if(!this._waitForMe||!this._promiseToBlocker||!this._conditionToPromise){return false;}
let promise=this._conditionToPromise.get(condition);if(!promise){ return false;}
this._conditionToPromise.delete(condition);this._promiseToBlocker.delete(promise);return this._waitForMe.delete(promise);},});


if(!isContent){AsyncShutdown.profileChangeTeardown=getPhase("profile-change-teardown");AsyncShutdown.profileBeforeChange=getPhase("profile-before-change");AsyncShutdown.sendTelemetry=getPhase("profile-before-change-telemetry");}

if(!isContent){AsyncShutdown.quitApplicationGranted=getPhase("quit-application-granted");}

AsyncShutdown.webWorkersShutdown=getPhase("web-workers-shutdown");AsyncShutdown.xpcomWillShutdown=getPhase("xpcom-will-shutdown");AsyncShutdown.Barrier=Barrier;Object.freeze(AsyncShutdown);