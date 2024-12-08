"use strict";const EventEmitter=require("devtools/shared/event-emitter");function DocumentEventsListener(targetActor){this.targetActor=targetActor;EventEmitter.decorate(this);this.onWindowReady=this.onWindowReady.bind(this);this.onContentLoaded=this.onContentLoaded.bind(this);this.onLoad=this.onLoad.bind(this);}
exports.DocumentEventsListener=DocumentEventsListener;DocumentEventsListener.prototype={listen(){EventEmitter.on(this.targetActor,"window-ready",this.onWindowReady);this.onWindowReady({window:this.targetActor.window,isTopLevel:true});},onWindowReady({window,isTopLevel}){ if(!isTopLevel){return;}
const time=window.performance.timing.navigationStart;this.emit("dom-loading",time);const{readyState}=window.document;if(readyState!="interactive"&&readyState!="complete"){window.addEventListener("DOMContentLoaded",this.onContentLoaded,{once:true,});}else{this.onContentLoaded({target:window.document});}
if(readyState!="complete"){window.addEventListener("load",this.onLoad,{once:true});}else{this.onLoad({target:window.document});}},onContentLoaded(event){

 const window=event.target.defaultView;const time=window.performance.timing.domInteractive;this.emit("dom-interactive",time);},onLoad(event){

 const window=event.target.defaultView;const time=window.performance.timing.domComplete;this.emit("dom-complete",time);},destroy(){this.listener=null;},};