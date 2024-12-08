"use strict";const ChromeUtils=require("ChromeUtils");const protocol=require("devtools/shared/protocol");const EventEmitter=require("devtools/shared/event-emitter");const{reflowSpec}=require("devtools/shared/specs/reflow");exports.ReflowActor=protocol.ActorClassWithSpec(reflowSpec,{initialize:function(conn,targetActor){protocol.Actor.prototype.initialize.call(this,conn);this.targetActor=targetActor;this._onReflow=this._onReflow.bind(this);this.observer=getLayoutChangesObserver(targetActor);this._isStarted=false;},destroy:function(){this.stop();releaseLayoutChangesObserver(this.targetActor);this.observer=null;this.targetActor=null;protocol.Actor.prototype.destroy.call(this);},start:function(){if(!this._isStarted){this.observer.on("reflows",this._onReflow);this._isStarted=true;}},stop:function(){if(this._isStarted){this.observer.off("reflows",this._onReflow);this._isStarted=false;}},_onReflow:function(reflows){if(this._isStarted){this.emit("reflows",reflows);}},});function Observable(targetActor,callback){this.targetActor=targetActor;this.callback=callback;this._onWindowReady=this._onWindowReady.bind(this);this._onWindowDestroyed=this._onWindowDestroyed.bind(this);this.targetActor.on("window-ready",this._onWindowReady);this.targetActor.on("window-destroyed",this._onWindowDestroyed);}
Observable.prototype={isObserving:false,destroy:function(){if(this.isDestroyed){return;}
this.isDestroyed=true;this.stop();this.targetActor.off("window-ready",this._onWindowReady);this.targetActor.off("window-destroyed",this._onWindowDestroyed);this.callback=null;this.targetActor=null;},start:function(){if(this.isObserving){return;}
this.isObserving=true;this._startListeners(this.targetActor.windows);},stop:function(){if(!this.isObserving){return;}
this.isObserving=false;if(this.targetActor.attached&&this.targetActor.docShell){ this._stopListeners(this.targetActor.windows);}},_onWindowReady:function({window}){if(this.isObserving){this._startListeners([window]);}},_onWindowDestroyed:function({window}){if(this.isObserving){this._stopListeners([window]);}},_startListeners:function(windows){},_stopListeners:function(windows){},notifyCallback:function(...args){this.isObserving&&this.callback&&this.callback.apply(null,args);},};var gIgnoreLayoutChanges=false;exports.setIgnoreLayoutChanges=function(ignore,syncReflowNode){if(syncReflowNode){let forceSyncReflow=syncReflowNode.offsetWidth;}
gIgnoreLayoutChanges=ignore;};function LayoutChangesObserver(targetActor){this.targetActor=targetActor;this._startEventLoop=this._startEventLoop.bind(this);this._onReflow=this._onReflow.bind(this);this._onResize=this._onResize.bind(this);
 this.reflowObserver=new ReflowObserver(this.targetActor,this._onReflow);this.resizeObserver=new WindowResizeObserver(this.targetActor,this._onResize);EventEmitter.decorate(this);}
exports.LayoutChangesObserver=LayoutChangesObserver;LayoutChangesObserver.prototype={EVENT_BATCHING_DELAY:300,destroy:function(){this.isObserving=false;this.reflowObserver.destroy();this.reflows=null;this.resizeObserver.destroy();this.hasResized=false;this.targetActor=null;},start:function(){if(this.isObserving){return;}
this.isObserving=true;this.reflows=[];this.hasResized=false;this._startEventLoop();this.reflowObserver.start();this.resizeObserver.start();},stop:function(){if(!this.isObserving){return;}
this.isObserving=false;this._stopEventLoop();this.reflows=[];this.hasResized=false;this.reflowObserver.stop();this.resizeObserver.stop();},_startEventLoop:function(){
if(!this.targetActor||!this.targetActor.attached){return;} 
if(this.reflows&&this.reflows.length){this.emit("reflows",this.reflows);this.reflows=[];} 
if(this.hasResized){this.emit("resize");this.hasResized=false;}
this.eventLoopTimer=this._setTimeout(this._startEventLoop,this.EVENT_BATCHING_DELAY);},_stopEventLoop:function(){this._clearTimeout(this.eventLoopTimer);}, _setTimeout:function(cb,ms){return setTimeout(cb,ms);},_clearTimeout:function(t){return clearTimeout(t);},_onReflow:function(start,end,isInterruptible){if(gIgnoreLayoutChanges){return;}

this.reflows.push({start:start,end:end,isInterruptible:isInterruptible,});},_onResize:function(){if(gIgnoreLayoutChanges){return;}
this.hasResized=true;},};var observedWindows=new Map();function getLayoutChangesObserver(targetActor){const observerData=observedWindows.get(targetActor);if(observerData){observerData.refCounting++;return observerData.observer;}
const obs=new LayoutChangesObserver(targetActor);observedWindows.set(targetActor,{observer:obs,
refCounting:1,});obs.start();return obs;}
exports.getLayoutChangesObserver=getLayoutChangesObserver;function releaseLayoutChangesObserver(targetActor){const observerData=observedWindows.get(targetActor);if(!observerData){return;}
observerData.refCounting--;if(!observerData.refCounting){observerData.observer.destroy();observedWindows.delete(targetActor);}}
exports.releaseLayoutChangesObserver=releaseLayoutChangesObserver;class ReflowObserver extends Observable{constructor(targetActor,callback){super(targetActor,callback);}
_startListeners(windows){for(const window of windows){window.docShell.addWeakReflowObserver(this);}}
_stopListeners(windows){for(const window of windows){try{window.docShell.removeWeakReflowObserver(this);}catch(e){
}}}
reflow(start,end){this.notifyCallback(start,end,false);}
reflowInterruptible(start,end){this.notifyCallback(start,end,true);}}
ReflowObserver.prototype.QueryInterface=ChromeUtils.generateQI(["nsIReflowObserver","nsISupportsWeakReference",]);class WindowResizeObserver extends Observable{constructor(targetActor,callback){super(targetActor,callback);this.onNavigate=this.onNavigate.bind(this);this.onResize=this.onResize.bind(this);this.targetActor.on("navigate",this.onNavigate);}
_startListeners(){this.listenerTarget.addEventListener("resize",this.onResize);}
_stopListeners(){this.listenerTarget.removeEventListener("resize",this.onResize);}
onNavigate(){if(this.isObserving){this._stopListeners();this._startListeners();}}
onResize(){this.notifyCallback();}
destroy(){this.targetActor.off("navigate",this.onNavigate);}
get listenerTarget(){if(this.targetActor.isRootActor){return this.targetActor.window;}
return this.targetActor.chromeEventHandler;}}