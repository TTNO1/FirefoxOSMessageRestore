"use strict";const{Ci}=require("chrome");const Services=require("Services");loader.lazyImporter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");loader.lazyRequireGetter(this,"RecordingUtils","devtools/shared/performance-new/recording-utils");const IS_SUPPORTED_PLATFORM="nsIProfiler"in Ci;class ActorReadyGeckoProfilerInterface{constructor(options={gzipped:true,}){if(IS_SUPPORTED_PLATFORM){this._observer={observe:this._observe.bind(this),};Services.obs.addObserver(this._observer,"profiler-started");Services.obs.addObserver(this._observer,"profiler-stopped");Services.obs.addObserver(this._observer,"chrome-document-global-created");Services.obs.addObserver(this._observer,"last-pb-context-exited");}
this.gzipped=options.gzipped;EventEmitter.decorate(this);}
destroy(){if(!IS_SUPPORTED_PLATFORM){return;}
Services.obs.removeObserver(this._observer,"profiler-started");Services.obs.removeObserver(this._observer,"profiler-stopped");Services.obs.removeObserver(this._observer,"chrome-document-global-created");Services.obs.removeObserver(this._observer,"last-pb-context-exited");}
startProfiler(options){if(!IS_SUPPORTED_PLATFORM){return false;}

const settings={entries:options.entries||1000000,duration:options.duration||0,interval:options.interval||1,features:options.features||["js","stackwalk","responsiveness","threads","leaf",],threads:options.threads||["GeckoMain","Compositor"],activeBrowsingContextID:RecordingUtils.getActiveBrowsingContextID(),};try{Services.profiler.StartProfiler(settings.entries,settings.interval,settings.features,settings.threads,settings.activeBrowsingContextID,settings.duration);}catch(e){return false;}
return true;}
stopProfilerAndDiscardProfile(){if(!IS_SUPPORTED_PLATFORM){return;}
Services.profiler.StopProfiler();}
async getSymbolTable(debugPath,breakpadId){const[addr,index,buffer]=await Services.profiler.getSymbolTable(debugPath,breakpadId);
return[Array.from(addr),Array.from(index),Array.from(buffer)];}
async getProfileAndStopProfiler(){if(!IS_SUPPORTED_PLATFORM){return null;}

Services.profiler.Pause();let profile;try{if(this.gzipped){profile=await Services.profiler.getProfileDataAsGzippedArrayBuffer();}else{profile=await Services.profiler.getProfileDataAsync();if(Object.keys(profile).length===0){console.error("An empty object was received from getProfileDataAsync.getProfileDataAsync(), "+"meaning that a profile could not successfully be serialized and captured.");profile=null;}}}catch(e){profile=null;console.error(`There was an error fetching a profile (gzipped: ${this.gzipped})`,e);}
Services.profiler.StopProfiler();return profile;}
isActive(){if(!IS_SUPPORTED_PLATFORM){return false;}
return Services.profiler.IsActive();}
isSupportedPlatform(){return IS_SUPPORTED_PLATFORM;}
isLockedForPrivateBrowsing(){if(!IS_SUPPORTED_PLATFORM){return false;}
return!Services.profiler.CanProfile();}
_observe(subject,topic,_data){
switch(topic){case"chrome-document-global-created":if(PrivateBrowsingUtils.isWindowPrivate(subject)){this.emit("profile-locked-by-private-browsing");}
break;case"last-pb-context-exited":this.emit("profile-unlocked-from-private-browsing");break;case"profiler-started":const param=subject.QueryInterface(Ci.nsIProfilerStartParams);this.emit(topic,param.entries,param.interval,param.features,param.duration,param.activeBrowsingContextID);break;case"profiler-stopped":this.emit(topic);break;}}
getSupportedFeatures(){if(!IS_SUPPORTED_PLATFORM){return[];}
return Services.profiler.GetFeatures();}
on(type,listener){
}
off(type,listener){
}}
exports.ActorReadyGeckoProfilerInterface=ActorReadyGeckoProfilerInterface;