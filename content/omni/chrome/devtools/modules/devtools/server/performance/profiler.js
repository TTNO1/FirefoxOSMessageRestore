"use strict";const{Cu}=require("chrome");const Services=require("Services");loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");loader.lazyRequireGetter(this,"DevToolsUtils","devtools/shared/DevToolsUtils");loader.lazyRequireGetter(this,"DeferredTask","resource://gre/modules/DeferredTask.jsm",true);const PROFILER_SYSTEM_EVENTS=["console-api-profiler","profiler-started","profiler-stopped",];const BUFFER_STATUS_INTERVAL_DEFAULT=5000;var DEFAULT_PROFILER_OPTIONS={
entries:Math.pow(10,7),
interval:1,features:["js"],threadFilters:["GeckoMain"],};const ProfilerManager=(function(){const consumers=new Set();return{ _profilerStatusInterval:BUFFER_STATUS_INTERVAL_DEFAULT, _profilerStatusSubscribers:0,started:false,addInstance:function(instance){consumers.add(instance); this.registerEventListeners();},removeInstance:function(instance){consumers.delete(instance);if(this.length<0){const msg="Somehow the number of started profilers is now negative.";DevToolsUtils.reportException("Profiler",msg);}
if(this.length===0){this.unregisterEventListeners();this.stop();}},start:function(options={}){const config=(this._profilerStartOptions={entries:options.entries||DEFAULT_PROFILER_OPTIONS.entries,interval:options.interval||DEFAULT_PROFILER_OPTIONS.interval,features:options.features||DEFAULT_PROFILER_OPTIONS.features,threadFilters:options.threadFilters||DEFAULT_PROFILER_OPTIONS.threadFilters,});
const currentTime=Services.profiler.getElapsedTime();try{Services.profiler.StartProfiler(config.entries,config.interval,config.features,config.threadFilters);}catch(e){Cu.reportError(`Could not start the profiler module: ${e.message}`);return{started:false,reason:e,currentTime};}
this.started=true;this._updateProfilerStatusPolling();const{position,totalSize,generation}=this.getBufferInfo();return{started:true,position,totalSize,generation,currentTime};},stop:function(){



if(this.length<=1&&this.started){Services.profiler.StopProfiler();this.started=false;}
this._updateProfilerStatusPolling();return{started:false};},getProfile:function(options){const startTime=options.startTime||0;const profile=options.stringify?Services.profiler.GetProfile(startTime):Services.profiler.getProfileData(startTime);return{profile:profile,currentTime:Services.profiler.getElapsedTime(),};},getFeatures:function(){return{features:Services.profiler.GetFeatures()};},getBufferInfo:function(){const position={},totalSize={},generation={};Services.profiler.GetBufferInfo(position,totalSize,generation);return{position:position.value,totalSize:totalSize.value,generation:generation.value,};},getStartOptions:function(){return this._profilerStartOptions||{};},isActive:function(){const isActive=Services.profiler.IsActive();const elapsedTime=isActive?Services.profiler.getElapsedTime():undefined;const{position,totalSize,generation}=this.getBufferInfo();return{isActive,currentTime:elapsedTime,position,totalSize,generation,};},get sharedLibraries(){return{sharedLibraries:Services.profiler.sharedLibraries,};},get length(){return consumers.size;},observe:sanitizeHandler(function(subject,topic,data){let details;const{action,arguments:args}=subject||{};const profileLabel=args&&args.length>0?`${args[0]}`:void 0;if(topic==="console-api-profiler"&&(action==="profile"||action==="profileEnd")){const{isActive,currentTime}=this.isActive();
if(!isActive&&action==="profile"){this.start();details={profileLabel,currentTime:0};}else if(!isActive){
return;}


details={profileLabel,currentTime};}

this.emitEvent(topic,{subject,topic,data,details});},"ProfilerManager.observe"),registerEventListeners:function(){if(!this._eventsRegistered){PROFILER_SYSTEM_EVENTS.forEach(eventName=>Services.obs.addObserver(this,eventName));this._eventsRegistered=true;}},unregisterEventListeners:function(){if(this._eventsRegistered){PROFILER_SYSTEM_EVENTS.forEach(eventName=>Services.obs.removeObserver(this,eventName));this._eventsRegistered=false;}},emitEvent:function(eventName,data){const subscribers=Array.from(consumers).filter(c=>{return c.subscribedEvents.has(eventName);});for(const subscriber of subscribers){subscriber.emit(eventName,data);}},setProfilerStatusInterval:function(interval){this._profilerStatusInterval=interval;if(this._poller){this._poller._delayMs=interval;}},subscribeToProfilerStatusEvents:function(){this._profilerStatusSubscribers++;this._updateProfilerStatusPolling();},unsubscribeToProfilerStatusEvents:function(){this._profilerStatusSubscribers--;this._updateProfilerStatusPolling();},_updateProfilerStatusPolling:function(){if(this._profilerStatusSubscribers>0&&Services.profiler.IsActive()){if(!this._poller){this._poller=new DeferredTask(this._emitProfilerStatus.bind(this),this._profilerStatusInterval,0);}
this._poller.arm();}else if(this._poller){this._poller.disarm();}},_emitProfilerStatus:function(){this.emitEvent("profiler-status",this.isActive());this._poller.arm();},};})();class Profiler{constructor(){EventEmitter.decorate(this);this.subscribedEvents=new Set();ProfilerManager.addInstance(this);}
destroy(){this.unregisterEventNotifications({events:Array.from(this.subscribedEvents),});this.subscribedEvents=null;ProfilerManager.removeInstance(this);}
start(options){return ProfilerManager.start(options);}
stop(){return ProfilerManager.stop();}
getProfile(request={}){return ProfilerManager.getProfile(request);}
getFeatures(){return ProfilerManager.getFeatures();}
getBufferInfo(){return ProfilerManager.getBufferInfo();}
getStartOptions(){return ProfilerManager.getStartOptions();}
isActive(){return ProfilerManager.isActive();}
sharedLibraries(){return ProfilerManager.sharedLibraries;}
setProfilerStatusInterval(interval){return ProfilerManager.setProfilerStatusInterval(interval);}
registerEventNotifications(data={}){const response=[];(data.events||[]).forEach(e=>{if(!this.subscribedEvents.has(e)){if(e==="profiler-status"){ProfilerManager.subscribeToProfilerStatusEvents();}
this.subscribedEvents.add(e);response.push(e);}});return{registered:response};}
unregisterEventNotifications(data={}){const response=[];(data.events||[]).forEach(e=>{if(this.subscribedEvents.has(e)){if(e==="profiler-status"){ProfilerManager.unsubscribeToProfilerStatusEvents();}
this.subscribedEvents.delete(e);response.push(e);}});return{registered:response};}
static canProfile(){return Services.profiler.CanProfile();}}
function cycleBreaker(key,value){if(key=="wrappedJSObject"){return undefined;}
return value;}
function sanitizeHandler(handler,identifier){return DevToolsUtils.makeInfallible(function(subject,topic,data){subject=(subject&&!Cu.isXrayWrapper(subject)&&subject.wrappedJSObject)||subject;subject=JSON.parse(JSON.stringify(subject,cycleBreaker));data=(data&&!Cu.isXrayWrapper(data)&&data.wrappedJSObject)||data;data=JSON.parse(JSON.stringify(data,cycleBreaker)); return handler.call(this,subject,topic,data);},identifier);}
exports.Profiler=Profiler;