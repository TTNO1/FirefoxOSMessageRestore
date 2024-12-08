//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DeferredTask"];ChromeUtils.defineModuleGetter(this,"PromiseUtils","resource://gre/modules/PromiseUtils.jsm");const Timer=Components.Constructor("@mozilla.org/timer;1","nsITimer","initWithCallback"); var DeferredTask=function(aTaskFn,aDelayMs,aIdleTimeoutMs){this._taskFn=aTaskFn;this._delayMs=aDelayMs;this._timeoutMs=aIdleTimeoutMs;};DeferredTask.prototype={_taskFn:null,_delayMs:null,get isArmed(){return this._armed;},_armed:false,get isRunning(){return!!this._runningPromise;},_runningPromise:null,_timer:null,_startTimer(){let callback,timer;if(this._timeoutMs===0){callback=()=>this._timerCallback();}else{callback=()=>{this._startIdleDispatch(()=>{if(this._timer===timer){this._timerCallback();}},this._timeoutMs);};}
timer=new Timer(callback,this._delayMs,Ci.nsITimer.TYPE_ONE_SHOT);this._timer=timer;},_startIdleDispatch(callback,timeout){ChromeUtils.idleDispatch(callback,{timeout});},arm(){if(this._finalized){throw new Error("Unable to arm timer, the object has been finalized.");}
this._armed=true;
if(!this._runningPromise&&!this._timer){this._startTimer();}},disarm(){this._armed=false;if(this._timer){

this._timer.cancel();this._timer=null;}},finalize(){if(this._finalized){throw new Error("The object has been already finalized.");}
this._finalized=true;
if(this._timer){this.disarm();this._timerCallback();}
if(this._runningPromise){return this._runningPromise;}
return Promise.resolve();},_finalized:false,_timerCallback(){let runningDeferred=PromiseUtils.defer();



this._timer=null;this._armed=false;this._runningPromise=runningDeferred.promise;runningDeferred.resolve((async()=>{await this._runTask();
if(this._armed){if(!this._finalized){this._startTimer();}else{

this._armed=false;await this._runTask();}}

this._runningPromise=null;})().catch(Cu.reportError));},async _runTask(){try{await this._taskFn();}catch(ex){Cu.reportError(ex);}},};