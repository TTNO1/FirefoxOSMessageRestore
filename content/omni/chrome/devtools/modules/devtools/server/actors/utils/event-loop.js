"use strict";const xpcInspector=require("xpcInspector");const{Cu}=require("chrome");function EventLoopStack({thread}){this._thread=thread;}
EventLoopStack.prototype={get size(){return xpcInspector.eventLoopNestLevel;},get lastPausedThreadActor(){if(this.size>0){return xpcInspector.lastNestRequestor.thread;}
return null;},push:function(){return new EventLoop({thread:this._thread,});},};function EventLoop({thread}){this._thread=thread;this.enter=this.enter.bind(this);this.resolve=this.resolve.bind(this);}
EventLoop.prototype={entered:false,resolved:false,get thread(){return this._thread;},enter:function(){const preNestData=this.preNest();this.entered=true;xpcInspector.enterNestedEventLoop(this);if(xpcInspector.eventLoopNestLevel>0){const{resolved}=xpcInspector.lastNestRequestor;if(resolved){xpcInspector.exitNestedEventLoop();}}
this.postNest(preNestData);},resolve:function(){if(!this.entered){throw new Error("Can't resolve an event loop before it has been entered!");}
if(this.resolved){throw new Error("Already resolved this nested event loop!");}
this.resolved=true;if(this===xpcInspector.lastNestRequestor){xpcInspector.exitNestedEventLoop();return true;}
return false;},getAllWindowDebuggees(){return this._thread.dbg.getDebuggees().filter(debuggee=>{
 return debuggee.class=="Window";}).map(debuggee=>{ return debuggee.unsafeDereference();}).filter(window=>{if(Cu.isDeadWrapper(window)){return false;} 
if(window.closed){return false;} 
if(Cu.isRemoteProxy(window)){return false;}
if(Cu.isRemoteProxy(window.parent)&&!Cu.isRemoteProxy(window)){return true;}
try{ return window.top===window;}catch(e){
if(!/not initialized/.test(e)){console.warn(`Exception in getAllWindowDebuggees: ${e}`);}
return false;}});},preNest(){const docShells=[];for(const window of this.getAllWindowDebuggees()){const{windowUtils}=window;windowUtils.suppressEventHandling(true);windowUtils.suspendTimeouts();docShells.push(window.docShell);}
return docShells;},postNest(pausedDocShells){ for(const docShell of pausedDocShells){
 if(docShell.isBeingDestroyed()){continue;}
const{windowUtils}=docShell.domWindow;windowUtils.resumeTimeouts();windowUtils.suppressEventHandling(false);}},};exports.EventLoopStack=EventLoopStack;