"use strict";const{Cu}=require("chrome");loader.lazyRequireGetter(this,"Services");loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");loader.lazyRequireGetter(this,"Memory","devtools/server/performance/memory",true);loader.lazyRequireGetter(this,"Timeline","devtools/server/performance/timeline",true);loader.lazyRequireGetter(this,"Profiler","devtools/server/performance/profiler",true);loader.lazyRequireGetter(this,"PerformanceRecordingActor","devtools/server/actors/performance-recording",true);loader.lazyRequireGetter(this,"mapRecordingOptions","devtools/shared/performance/recording-utils",true);loader.lazyRequireGetter(this,"getSystemInfo","devtools/shared/system",true);const PROFILER_EVENTS=["console-api-profiler","profiler-started","profiler-stopped","profiler-status",];
const DRAIN_ALLOCATIONS_TIMEOUT=2000;function PerformanceRecorder(conn,targetActor){EventEmitter.decorate(this);this.conn=conn;this.targetActor=targetActor;this._pendingConsoleRecordings=[];this._recordings=[];this._onTimelineData=this._onTimelineData.bind(this);this._onProfilerEvent=this._onProfilerEvent.bind(this);}
PerformanceRecorder.prototype={connect:function(options){if(this._connected){return;}

this._connectComponents();this._registerListeners();this._systemClient=options.systemClient;this._connected=true;},destroy:function(){this._unregisterListeners();this._disconnectComponents();this._connected=null;this._profiler=null;this._timeline=null;this._memory=null;this._target=null;this._client=null;},_connectComponents:function(){this._profiler=new Profiler(this.targetActor);this._memory=new Memory(this.targetActor);this._timeline=new Timeline(this.targetActor);this._profiler.registerEventNotifications({events:PROFILER_EVENTS});},_registerListeners:function(){this._timeline.on("*",this._onTimelineData);this._memory.on("*",this._onTimelineData);this._profiler.on("*",this._onProfilerEvent);},_unregisterListeners:function(){this._timeline.off("*",this._onTimelineData);this._memory.off("*",this._onTimelineData);this._profiler.off("*",this._onProfilerEvent);},_disconnectComponents:function(){this._profiler.unregisterEventNotifications({events:PROFILER_EVENTS});this._profiler.destroy();this._timeline.destroy();this._memory.destroy();},_onProfilerEvent:function(topic,data){if(topic==="console-api-profiler"){if(data.subject.action==="profile"){this._onConsoleProfileStart(data.details);}else if(data.subject.action==="profileEnd"){this._onConsoleProfileEnd(data.details);}}else if(topic==="profiler-stopped"){}else if(topic==="profiler-status"){this.emit("profiler-status",data);}},async _onConsoleProfileStart({profileLabel,currentTime}){const recordings=this._recordings;if(recordings.find(e=>e.getLabel()===profileLabel)){return;}
this.emit("console-profile-start");await this.startRecording(Object.assign({},getPerformanceRecordingPrefs(),{console:true,label:profileLabel,}));},async _onConsoleProfileEnd(data){
if(!data){return;}
const{profileLabel}=data;const pending=this._recordings.filter(r=>r.isConsole()&&r.isRecording());if(pending.length===0){return;}
let model;
if(profileLabel){model=pending.find(e=>e.getLabel()===profileLabel);}else{ model=pending[pending.length-1];}

if(!model){Cu.reportError("console.profileEnd() called with label that does not match a recording.");return;}
await this.stopRecording(model);},_onTimelineData:function(eventName,...data){let eventData=Object.create(null);switch(eventName){case"markers":{eventData={markers:data[0],endTime:data[1]};break;}
case"ticks":{eventData={delta:data[0],timestamps:data[1]};break;}
case"memory":{eventData={delta:data[0],measurement:data[1]};break;}
case"frames":{eventData={delta:data[0],frames:data[1]};break;}
case"allocations":{eventData=data[0];break;}}
const activeRecordings=this._recordings.filter(r=>r.isRecording());if(activeRecordings.length){this.emit("timeline-data",eventName,eventData,activeRecordings);}},canCurrentlyRecord:function(){let success=true;const reasons=[];if(!Profiler.canProfile()){success=false;reasons.push("profiler-unavailable");}

return{success,reasons};},async startRecording(options){let timelineStart,memoryStart;const profilerStart=async function(){const data=await this._profiler.isActive();if(data.isActive){return data;}
const startData=await this._profiler.start(mapRecordingOptions("profiler",options));

if(startData.currentTime==null){startData.currentTime=0;}
return startData;}.bind(this)();
if(options.withMarkers||options.withTicks||options.withMemory){timelineStart=this._timeline.start(mapRecordingOptions("timeline",options));}
if(options.withAllocations){if(this._memory.getState()==="detached"){this._memory.attach();}
const recordingOptions=Object.assign(mapRecordingOptions("memory",options),{drainAllocationsTimeout:DRAIN_ALLOCATIONS_TIMEOUT,});memoryStart=this._memory.startRecordingAllocations(recordingOptions);}
const[profilerStartData,timelineStartData,memoryStartData,]=await Promise.all([profilerStart,timelineStart,memoryStart]);const data=Object.create(null);
const startTimes=[profilerStartData.currentTime,memoryStartData,timelineStartData,].filter(Boolean);data.startTime=Math.min(...startTimes);data.position=profilerStartData.position;data.generation=profilerStartData.generation;data.totalSize=profilerStartData.totalSize;data.systemClient=this._systemClient;data.systemHost=await getSystemInfo();const model=new PerformanceRecordingActor(this.conn,options,data);this._recordings.push(model);this.emit("recording-started",model);return model;},async stopRecording(model){
if(!this._recordings.includes(model)){return model;}

this.emit("recording-stopping",model);



this._recordings.splice(this._recordings.indexOf(model),1);const startTime=model._startTime;const profilerData=this._profiler.getProfile({startTime});

if(!this.isRecording()){
if(this._memory.isRecordingAllocations()){this._memory.stopRecordingAllocations();}
this._timeline.stop();}
const recordingData={profile:profilerData.profile,duration:profilerData.currentTime-startTime,};this.emit("recording-stopped",model,recordingData);return model;},isRecording:function(){return this._recordings.some(h=>h.isRecording());},getRecordings:function(){return this._recordings;},setProfilerStatusInterval:function(n){this._profiler.setProfilerStatusInterval(n);},getConfiguration:function(){let allocationSettings=Object.create(null);if(this._memory.getState()==="attached"){allocationSettings=this._memory.getAllocationsSettings();}
return Object.assign({},allocationSettings,this._profiler.getStartOptions());},toString:()=>"[object PerformanceRecorder]",};function getPerformanceRecordingPrefs(){return{withMarkers:true,withMemory:Services.prefs.getBoolPref("devtools.performance.ui.enable-memory"),withTicks:Services.prefs.getBoolPref("devtools.performance.ui.enable-framerate"),withAllocations:Services.prefs.getBoolPref("devtools.performance.ui.enable-allocations"),allocationsSampleProbability:+Services.prefs.getCharPref("devtools.performance.memory.sample-probability"),allocationsMaxLogLength:Services.prefs.getIntPref("devtools.performance.memory.max-log-length"),};}
exports.PerformanceRecorder=PerformanceRecorder;