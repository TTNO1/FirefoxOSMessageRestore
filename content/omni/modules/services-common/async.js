var EXPORTED_SYMBOLS=["Async"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const Timer=Components.Constructor("@mozilla.org/timer;1","nsITimer");var Async={chain:function chain(...funcs){let thisObj=this;return function callback(){if(funcs.length){let args=[...arguments,callback];let f=funcs.shift();f.apply(thisObj,args);}};},checkAppReady:function checkAppReady(){ Services.obs.addObserver(function onQuitApplication(){Services.obs.removeObserver(onQuitApplication,"quit-application");Async.checkAppReady=Async.promiseYield=function(){let exception=Components.Exception("App. Quitting",Cr.NS_ERROR_ABORT);exception.appIsShuttingDown=true;throw exception;};},"quit-application"); return(Async.checkAppReady=function(){return true;})();},isAppReady(){try{return Async.checkAppReady();}catch(ex){if(!Async.isShutdownException(ex)){throw ex;}}
return false;},isShutdownException(exception){return exception&&exception.appIsShuttingDown===true;},promiseYield(){return new Promise(resolve=>{Services.tm.currentThread.dispatch(resolve,Ci.nsIThread.DISPATCH_NORMAL);});},yieldState(yieldEvery=50){let iterations=0;return{shouldYield(){++iterations;return iterations%yieldEvery===0;},};},async yieldingForEach(iterable,fn,yieldEvery=50){const yieldState=typeof yieldEvery==="number"?Async.yieldState(yieldEvery):yieldEvery;let iteration=0;for(const item of iterable){let result=fn(item,iteration++);if(typeof result!=="undefined"&&typeof result.then!=="undefined"){

result=await result;}
if(result===true){return true;}
if(yieldState.shouldYield()){await Async.promiseYield();Async.checkAppReady();}}
return false;},asyncQueueCaller(log){return new AsyncQueueCaller(log);},asyncObserver(log,obj){return new AsyncObserver(log,obj);},watchdog(){return new Watchdog();},};class AsyncQueueCaller{constructor(log){this._log=log;this._queue=Promise.resolve();this.QueryInterface=ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]);}
enqueueCall(func){this._queue=(async()=>{await this._queue;try{return await func();}catch(e){this._log.error(e);return false;}})();}
promiseCallsComplete(){return this._queue;}}
class AsyncObserver extends AsyncQueueCaller{constructor(obj,log){super(log);this.obj=obj;}
observe(subject,topic,data){this.enqueueCall(()=>this.obj.observe(subject,topic,data));}
promiseObserversComplete(){return this.promiseCallsComplete();}}
class Watchdog{constructor(){this.controller=new AbortController();this.timer=new Timer();this.abortReason=null;}
get signal(){return this.controller.signal;}
start(delay){if(!this.signal.aborted){Services.obs.addObserver(this,"quit-application");this.timer.init(this,delay,Ci.nsITimer.TYPE_ONE_SHOT);}}
stop(){if(!this.signal.aborted){Services.obs.removeObserver(this,"quit-application");this.timer.cancel();}}
observe(subject,topic,data){if(topic=="timer-callback"){this.abortReason="timeout";}else if(topic=="quit-application"){this.abortReason="shutdown";}
this.stop();this.controller.abort();}}