"use strict";const{Ci,Cu}=require("chrome");
loader.lazyRequireGetter(this,"Memory","devtools/server/performance/memory",true);loader.lazyRequireGetter(this,"Framerate","devtools/server/performance/framerate",true);loader.lazyRequireGetter(this,"StackFrameCache","devtools/server/actors/utils/stack",true);loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");

const DEFAULT_TIMELINE_DATA_PULL_TIMEOUT=200;function Timeline(targetActor){EventEmitter.decorate(this);this.targetActor=targetActor;this._isRecording=false;this._stackFrames=null;this._memory=null;this._framerate=null; this._onWindowReady=this._onWindowReady.bind(this);this._onGarbageCollection=this._onGarbageCollection.bind(this);this.targetActor.on("window-ready",this._onWindowReady);}
Timeline.prototype={destroy:function(){this.stop();this.targetActor.off("window-ready",this._onWindowReady);this.targetActor=null;},get docShells(){let originalDocShell;if(this.targetActor.isRootActor){originalDocShell=this.targetActor.docShell;}else{originalDocShell=this.targetActor.originalDocShell;}
if(!originalDocShell){return[];}
const docShells=originalDocShell.getAllDocShellsInSubtree(Ci.nsIDocShellTreeItem.typeAll,Ci.nsIDocShell.ENUMERATE_FORWARDS);return docShells;},_pullTimelineData:function(){const docShells=this.docShells;if(!this._isRecording||!docShells.length){return;}
const endTime=docShells[0].now();const markers=[];if(this._withMarkers||this._withDocLoadingEvents){for(const docShell of docShells){for(const marker of docShell.popProfileTimelineMarkers()){markers.push(marker);


if(this._withFrames){if(marker.stack){marker.stack=this._stackFrames.addFrame(Cu.waiveXrays(marker.stack));}
if(marker.endStack){marker.endStack=this._stackFrames.addFrame(Cu.waiveXrays(marker.endStack));}}
if(this._withDocLoadingEvents){if(marker.name=="document::DOMContentLoaded"||marker.name=="document::Load"){this.emit("doc-loading",marker,endTime);}}}}}
if(this._withMarkers&&markers.length>0){this.emit("markers",markers,endTime);}
if(this._withTicks){this.emit("ticks",endTime,this._framerate.getPendingTicks());}
if(this._withMemory){this.emit("memory",endTime,this._memory.measure());}
if(this._withFrames&&this._withMarkers){const frames=this._stackFrames.makeEvent();if(frames){this.emit("frames",endTime,frames);}}
this._dataPullTimeout=setTimeout(()=>{this._pullTimelineData();},DEFAULT_TIMELINE_DATA_PULL_TIMEOUT);},isRecording:function(){return this._isRecording;},async start({withMarkers,withTicks,withMemory,withFrames,withGCEvents,withDocLoadingEvents,}){const docShells=this.docShells;if(!docShells.length){return-1;}
const startTime=(this._startTime=docShells[0].now());if(this._isRecording){return startTime;}
this._isRecording=true;this._withMarkers=!!withMarkers;this._withTicks=!!withTicks;this._withMemory=!!withMemory;this._withFrames=!!withFrames;this._withGCEvents=!!withGCEvents;this._withDocLoadingEvents=!!withDocLoadingEvents;if(this._withMarkers||this._withDocLoadingEvents){for(const docShell of docShells){docShell.recordProfileTimelineMarkers=true;}}
if(this._withTicks){this._framerate=new Framerate(this.targetActor);this._framerate.startRecording();}
if(this._withMemory||this._withGCEvents){this._memory=new Memory(this.targetActor,this._stackFrames);this._memory.attach();}
if(this._withGCEvents){this._memory.on("garbage-collection",this._onGarbageCollection);}
if(this._withFrames&&this._withMarkers){this._stackFrames=new StackFrameCache();this._stackFrames.initFrames();}
this._pullTimelineData();return startTime;},async stop(){const docShells=this.docShells;if(!docShells.length){return-1;}
const endTime=(this._startTime=docShells[0].now());if(!this._isRecording){return endTime;}
if(this._withMarkers||this._withDocLoadingEvents){for(const docShell of docShells){docShell.recordProfileTimelineMarkers=false;}}
if(this._withTicks){this._framerate.stopRecording();this._framerate.destroy();this._framerate=null;}
if(this._withMemory||this._withGCEvents){this._memory.detach();this._memory.destroy();}
if(this._withGCEvents){this._memory.off("garbage-collection",this._onGarbageCollection);}
if(this._withFrames&&this._withMarkers){this._stackFrames=null;}
this._isRecording=false;this._withMarkers=false;this._withTicks=false;this._withMemory=false;this._withFrames=false;this._withDocLoadingEvents=false;this._withGCEvents=false;clearTimeout(this._dataPullTimeout);return endTime;},_onWindowReady:function({window}){if(this._isRecording){const docShell=window.docShell;docShell.recordProfileTimelineMarkers=true;}},_onGarbageCollection:function({collections,gcCycleNumber,reason,nonincrementalReason,}){const docShells=this.docShells;if(!this._isRecording||!docShells.length){return;}
const endTime=docShells[0].now();this.emit("markers",collections.map(({startTimestamp:start,endTimestamp:end})=>{return{name:"GarbageCollection",causeName:reason,nonincrementalReason:nonincrementalReason,cycle:gcCycleNumber,start,end,};}),endTime);},};exports.Timeline=Timeline;