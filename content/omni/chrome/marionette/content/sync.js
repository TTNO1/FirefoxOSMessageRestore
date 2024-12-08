"use strict";const EXPORTED_SYMBOLS=["executeSoon","DebounceCallback","IdlePromise","MessageManagerDestroyedPromise","PollPromise","Sleep","TimedPromise","waitForEvent","waitForLoadEvent","waitForMessage","waitForObserverTopic",];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AppConstants:"resource://gre/modules/AppConstants.jsm",error:"chrome://marionette/content/error.js",EventDispatcher:"chrome://marionette/content/actors/MarionetteEventsParent.jsm",Log:"chrome://marionette/content/log.js",registerEventsActor:"chrome://marionette/content/actors/MarionetteEventsParent.jsm",truncate:"chrome://marionette/content/format.js",unregisterEventsActor:"chrome://marionette/content/actors/MarionetteEventsParent.jsm",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());const{TYPE_ONE_SHOT,TYPE_REPEATING_SLACK}=Ci.nsITimer;const PROMISE_TIMEOUT=AppConstants.DEBUG?4500:1500;function executeSoon(func){if(typeof func!="function"){throw new TypeError();}
Services.tm.dispatchToMainThread(func);}
function PollPromise(func,{timeout=null,interval=10}={}){const timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);if(typeof func!="function"){throw new TypeError();}
if(timeout!=null&&typeof timeout!="number"){throw new TypeError();}
if(typeof interval!="number"){throw new TypeError();}
if((timeout&&(!Number.isInteger(timeout)||timeout<0))||!Number.isInteger(interval)||interval<0){throw new RangeError();}
return new Promise((resolve,reject)=>{let start,end;if(Number.isInteger(timeout)){start=new Date().getTime();end=start+timeout;}
let evalFn=()=>{new Promise(func).then(resolve,rejected=>{if(error.isError(rejected)){throw rejected;} 
if(typeof end!="undefined"&&(start==end||new Date().getTime()>=end)){resolve(rejected);}}).catch(reject);};evalFn();timer.init(evalFn,interval,TYPE_REPEATING_SLACK);}).then(res=>{timer.cancel();return res;},err=>{timer.cancel();throw err;});}
function TimedPromise(fn,{timeout=PROMISE_TIMEOUT,throws=error.TimeoutError}={}){const timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);if(typeof fn!="function"){throw new TypeError();}
if(typeof timeout!="number"){throw new TypeError();}
if(!Number.isInteger(timeout)||timeout<0){throw new RangeError();}
return new Promise((resolve,reject)=>{let trace;
let bail=()=>{if(throws!==null){let err=new throws();reject(err);}else{logger.warn(`TimedPromise timed out after ${timeout} ms`,trace);resolve();}};trace=error.stack();timer.initWithCallback({notify:bail},timeout,TYPE_ONE_SHOT);try{fn(resolve,reject);}catch(e){reject(e);}}).then(res=>{timer.cancel();return res;},err=>{timer.cancel();throw err;});}
function Sleep(timeout){if(typeof timeout!="number"){throw new TypeError();}
if(!Number.isInteger(timeout)||timeout<0){throw new RangeError();}
return new Promise(resolve=>{const timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);timer.init(()=>{ timer.cancel();resolve();},timeout,TYPE_ONE_SHOT);});}
function MessageManagerDestroyedPromise(messageManager){return new Promise(resolve=>{function observe(subject,topic){logger.trace(`Received observer notification ${topic}`);if(subject==messageManager){Services.obs.removeObserver(this,"message-manager-disconnect");resolve();}}
Services.obs.addObserver(observe,"message-manager-disconnect");});}
function IdlePromise(win){const animationFramePromise=new Promise(resolve=>{executeSoon(()=>{win.requestAnimationFrame(resolve);});}); const windowClosedPromise=new PollPromise(resolve=>{if(win.closed){resolve();}});return Promise.race([animationFramePromise,windowClosedPromise]);}
class DebounceCallback{constructor(fn,{timeout=250}={}){if(typeof fn!="function"||typeof timeout!="number"){throw new TypeError();}
if(!Number.isInteger(timeout)||timeout<0){throw new RangeError();}
this.fn=fn;this.timeout=timeout;this.timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
handleEvent(ev){this.timer.cancel();this.timer.initWithCallback(()=>{this.timer.cancel();this.fn(ev);},this.timeout,TYPE_ONE_SHOT);}}
this.DebounceCallback=DebounceCallback;function waitForEvent(subject,eventName,{capture=false,checkFn=null,wantsUntrusted=false}={}){if(subject==null||!("addEventListener"in subject)){throw new TypeError();}
if(typeof eventName!="string"){throw new TypeError();}
if(capture!=null&&typeof capture!="boolean"){throw new TypeError();}
if(checkFn!=null&&typeof checkFn!="function"){throw new TypeError();}
if(wantsUntrusted!=null&&typeof wantsUntrusted!="boolean"){throw new TypeError();}
return new Promise((resolve,reject)=>{subject.addEventListener(eventName,function listener(event){logger.trace(`Received DOM event ${event.type} for ${event.target}`);try{if(checkFn&&!checkFn(event)){return;}
subject.removeEventListener(eventName,listener,capture);executeSoon(()=>resolve(event));}catch(ex){try{subject.removeEventListener(eventName,listener,capture);}catch(ex2){}
executeSoon(()=>reject(ex));}},capture,wantsUntrusted);});}
function waitForLoadEvent(eventName,browsingContextFn){let onPageLoad;return new Promise(resolve=>{onPageLoad=(_,data)=>{logger.trace(`Received event ${data.type} for ${data.documentURI}`);if(data.browsingContext===browsingContextFn()&&data.type===eventName){EventDispatcher.off("page-load",onPageLoad);resolve(data);}};EventDispatcher.on("page-load",onPageLoad);registerEventsActor();}).finally(()=>{unregisterEventsActor();});}
function waitForMessage(messageManager,messageName,{checkFn=undefined}={}){if(messageManager==null||!("addMessageListener"in messageManager)){throw new TypeError();}
if(typeof messageName!="string"){throw new TypeError();}
if(checkFn&&typeof checkFn!="function"){throw new TypeError();}
return new Promise(resolve=>{messageManager.addMessageListener(messageName,function onMessage(msg){logger.trace(`Received ${messageName} for ${msg.target}`);if(checkFn&&!checkFn(msg)){return;}
messageManager.removeMessageListener(messageName,onMessage);resolve(msg.data);});});}
function waitForObserverTopic(topic,{checkFn=null}={}){if(typeof topic!="string"){throw new TypeError();}
if(checkFn!=null&&typeof checkFn!="function"){throw new TypeError();}
return new Promise((resolve,reject)=>{Services.obs.addObserver(function observer(subject,topic,data){logger.trace(`Received observer notification ${topic}`);try{if(checkFn&&!checkFn(subject,data)){return;}
Services.obs.removeObserver(observer,topic);resolve({subject,data});}catch(ex){Services.obs.removeObserver(observer,topic);reject(ex);}},topic);});}