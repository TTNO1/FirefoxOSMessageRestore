"use strict";const{Cc,Ci,Cu}=require("chrome");const{reportException}=require("devtools/shared/DevToolsUtils");const{expectState}=require("devtools/server/actors/common");loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");loader.lazyRequireGetter(this,"DeferredTask","resource://gre/modules/DeferredTask.jsm",true);loader.lazyRequireGetter(this,"StackFrameCache","devtools/server/actors/utils/stack",true);loader.lazyRequireGetter(this,"ChromeUtils");loader.lazyRequireGetter(this,"ParentProcessTargetActor","devtools/server/actors/targets/parent-process",true);loader.lazyRequireGetter(this,"ContentProcessTargetActor","devtools/server/actors/targets/content-process",true);function Memory(parent,frameCache=new StackFrameCache()){EventEmitter.decorate(this);this.parent=parent;this._mgr=Cc["@mozilla.org/memory-reporter-manager;1"].getService(Ci.nsIMemoryReporterManager);this.state="detached";this._dbg=null;this._frameCache=frameCache;this._onGarbageCollection=this._onGarbageCollection.bind(this);this._emitAllocations=this._emitAllocations.bind(this);this._onWindowReady=this._onWindowReady.bind(this);EventEmitter.on(this.parent,"window-ready",this._onWindowReady);}
Memory.prototype={destroy:function(){EventEmitter.off(this.parent,"window-ready",this._onWindowReady);this._mgr=null;if(this.state==="attached"){this.detach();}},get dbg(){if(!this._dbg){this._dbg=this.parent.makeDebugger();}
return this._dbg;},attach:expectState("detached",function(){this.dbg.addDebuggees();this.dbg.memory.onGarbageCollection=this._onGarbageCollection.bind(this);this.state="attached";return this.state;},"attaching to the debugger"),detach:expectState("attached",function(){this._clearDebuggees();this.dbg.disable();this._dbg=null;this.state="detached";return this.state;},"detaching from the debugger"),getState:function(){return this.state;},_clearDebuggees:function(){if(this._dbg){if(this.isRecordingAllocations()){this.dbg.memory.drainAllocationsLog();}
this._clearFrames();this.dbg.removeAllDebuggees();}},_clearFrames:function(){if(this.isRecordingAllocations()){this._frameCache.clearFrames();}},_onWindowReady:function({isTopLevel}){if(this.state=="attached"){this._clearDebuggees();if(isTopLevel&&this.isRecordingAllocations()){this._frameCache.initFrames();}
this.dbg.addDebuggees();}},isRecordingAllocations:function(){return this.dbg.memory.trackingAllocationSites;},saveHeapSnapshot:expectState("attached",function(boundaries=null){
if(!boundaries){if(this.parent instanceof ParentProcessTargetActor||this.parent instanceof ContentProcessTargetActor){boundaries={runtime:true};}else{boundaries={debugger:this.dbg};}}
return ChromeUtils.saveHeapSnapshotGetId(boundaries);},"saveHeapSnapshot"),takeCensus:expectState("attached",function(){return this.dbg.memory.takeCensus();},"taking census"),startRecordingAllocations:expectState("attached",function(options={}){if(this.isRecordingAllocations()){return this._getCurrentTime();}
this._frameCache.initFrames();this.dbg.memory.allocationSamplingProbability=options.probability!=null?options.probability:1.0;this.drainAllocationsTimeoutTimer=options.drainAllocationsTimeout;if(this.drainAllocationsTimeoutTimer!=null){if(this._poller){this._poller.disarm();}
this._poller=new DeferredTask(this._emitAllocations,this.drainAllocationsTimeoutTimer,0);this._poller.arm();}
if(options.maxLogLength!=null){this.dbg.memory.maxAllocationsLogLength=options.maxLogLength;}
this.dbg.memory.trackingAllocationSites=true;return this._getCurrentTime();},"starting recording allocations"),stopRecordingAllocations:expectState("attached",function(){if(!this.isRecordingAllocations()){return this._getCurrentTime();}
this.dbg.memory.trackingAllocationSites=false;this._clearFrames();if(this._poller){this._poller.disarm();this._poller=null;}
return this._getCurrentTime();},"stopping recording allocations"),getAllocationsSettings:expectState("attached",function(){return{maxLogLength:this.dbg.memory.maxAllocationsLogLength,probability:this.dbg.memory.allocationSamplingProbability,};},"getting allocations settings"),getAllocations:expectState("attached",function(){if(this.dbg.memory.allocationsLogOverflowed){


reportException("MemoryBridge.prototype.getAllocations","Warning: allocations log overflowed and lost some data.");}
const allocations=this.dbg.memory.drainAllocationsLog();const packet={allocations:[],allocationsTimestamps:[],allocationSizes:[],};for(const{frame:stack,timestamp,size}of allocations){if(stack&&Cu.isDeadWrapper(stack)){continue;}
const waived=Cu.waiveXrays(stack);


const index=this._frameCache.addFrame(waived);packet.allocations.push(index);packet.allocationsTimestamps.push(timestamp);packet.allocationSizes.push(size);}
return this._frameCache.updateFramePacket(packet);},"getting allocations"),forceGarbageCollection:function(){for(let i=0;i<3;i++){Cu.forceGC();}},forceCycleCollection:function(){Cu.forceCC();},measure:function(){const result={};const jsObjectsSize={};const jsStringsSize={};const jsOtherSize={};const domSize={};const styleSize={};const otherSize={};const totalSize={};const jsMilliseconds={};const nonJSMilliseconds={};try{this._mgr.sizeOfTab(this.parent.window,jsObjectsSize,jsStringsSize,jsOtherSize,domSize,styleSize,otherSize,totalSize,jsMilliseconds,nonJSMilliseconds);result.total=totalSize.value;result.domSize=domSize.value;result.styleSize=styleSize.value;result.jsObjectsSize=jsObjectsSize.value;result.jsStringsSize=jsStringsSize.value;result.jsOtherSize=jsOtherSize.value;result.otherSize=otherSize.value;result.jsMilliseconds=jsMilliseconds.value.toFixed(1);result.nonJSMilliseconds=nonJSMilliseconds.value.toFixed(1);}catch(e){reportException("MemoryBridge.prototype.measure",e);}
return result;},residentUnique:function(){return this._mgr.residentUnique;},_onGarbageCollection:function(data){this.emit("garbage-collection",data);if(this._poller){this._poller.disarm();this._emitAllocations();}},_emitAllocations:function(){this.emit("allocations",this.getAllocations());this._poller.arm();},_getCurrentTime:function(){const docShell=this.parent.isRootActor?this.parent.docShell:this.parent.originalDocShell;if(docShell){return docShell.now();} 
return Cu.now();},};exports.Memory=Memory;