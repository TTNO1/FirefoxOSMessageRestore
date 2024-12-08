"use strict";function mapRecordingOptions(type,options){if(type==="profiler"){return{entries:options.bufferSize,interval:options.sampleFrequency?1000/options.sampleFrequency:void 0,};}
if(type==="memory"){return{probability:options.allocationsSampleProbability,maxLogLength:options.allocationsMaxLogLength,};}
if(type==="timeline"){return{withMarkers:true,withTicks:options.withTicks,withMemory:options.withMemory,withFrames:true,withGCEvents:true,withDocLoadingEvents:false,};}
return options;}
function normalizePerformanceFeatures(options,supportedFeatures){return Object.keys(options).reduce((modifiedOptions,feature)=>{if(supportedFeatures[feature]!==false){modifiedOptions[feature]=options[feature];}
return modifiedOptions;},Object.create(null));}
function filterSamples(profile,profilerStartTime){const firstThread=profile.threads[0];const TIME_SLOT=firstThread.samples.schema.time;firstThread.samples.data=firstThread.samples.data.filter(e=>{return e[TIME_SLOT]>=profilerStartTime;});}
function offsetSampleTimes(profile,timeOffset){const firstThread=profile.threads[0];const TIME_SLOT=firstThread.samples.schema.time;const samplesData=firstThread.samples.data;for(let i=0;i<samplesData.length;i++){samplesData[i][TIME_SLOT]-=timeOffset;}}
function offsetMarkerTimes(markers,timeOffset){for(const marker of markers){marker.start-=timeOffset;marker.end-=timeOffset;}}
function offsetAndScaleTimestamps(timestamps,timeOffset,timeScale){for(let i=0,len=timestamps.length;i<len;i++){timestamps[i]-=timeOffset;if(timeScale){timestamps[i]/=timeScale;}}}
function pushAll(dest,src){const length=src.length;for(let i=0;i<length;i++){dest.push(src[i]);}}
var gProfileThreadFromAllocationCache=new WeakMap();function getProfileThreadFromAllocations(allocations){const cached=gProfileThreadFromAllocationCache.get(allocations);if(cached){return cached;}
const{sites,timestamps,frames,sizes}=allocations;const uniqueStrings=new UniqueStrings();






const stackTable=new Array(frames.length);const frameTable=new Array(frames.length);const locationConcatArray=new Array(5);for(let i=0;i<frames.length;i++){const frame=frames[i];if(!frame){stackTable[i]=frameTable[i]=null;continue;}
const prefix=frame.parent;stackTable[i]=[frames[prefix]?prefix:null,i];


locationConcatArray[0]=frame.source;locationConcatArray[1]=":";locationConcatArray[2]=String(frame.line);locationConcatArray[3]=":";locationConcatArray[4]=String(frame.column);locationConcatArray[5]="";let location=locationConcatArray.join("");const funcName=frame.functionDisplayName;if(funcName){locationConcatArray[0]=funcName;locationConcatArray[1]=" (";locationConcatArray[2]=location;locationConcatArray[3]=")";locationConcatArray[4]="";locationConcatArray[5]="";location=locationConcatArray.join("");}
frameTable[i]=[uniqueStrings.getOrAddStringIndex(location)];}
const samples=new Array(sites.length);let writePos=0;for(let i=0;i<sites.length;i++){


const stackIndex=sites[i];if(frames[stackIndex]){samples[writePos++]=[stackIndex,timestamps[i],sizes[i]];}}
samples.length=writePos;const thread={name:"allocations",samples:allocationsWithSchema(samples),stackTable:stackTableWithSchema(stackTable),frameTable:frameTableWithSchema(frameTable),stringTable:uniqueStrings.stringTable,};gProfileThreadFromAllocationCache.set(allocations,thread);return thread;}
function allocationsWithSchema(data){let slot=0;return{schema:{stack:slot++,time:slot++,size:slot++,},data:data,};}
function deflateProfile(profile){profile.threads=profile.threads.map(thread=>{const uniqueStacks=new UniqueStacks();return deflateThread(thread,uniqueStacks);});profile.meta.version=3;return profile;}
function deflateStack(frames,uniqueStacks){
let prefixIndex=null;for(let i=0;i<frames.length;i++){const frameIndex=uniqueStacks.getOrAddFrameIndex(frames[i]);prefixIndex=uniqueStacks.getOrAddStackIndex(prefixIndex,frameIndex);}
return prefixIndex;}
function deflateSamples(samples,uniqueStacks){const deflatedSamples=new Array(samples.length);for(let i=0;i<samples.length;i++){const sample=samples[i];deflatedSamples[i]=[deflateStack(sample.frames,uniqueStacks),sample.time,sample.responsiveness,sample.rss,sample.uss,];}
return samplesWithSchema(deflatedSamples);}
function deflateMarkers(markers,uniqueStacks){const deflatedMarkers=new Array(markers.length);for(let i=0;i<markers.length;i++){const marker=markers[i];if(marker.data&&marker.data.type==="tracing"&&marker.data.stack){marker.data.stack=deflateThread(marker.data.stack,uniqueStacks);}
deflatedMarkers[i]=[uniqueStacks.getOrAddStringIndex(marker.name),marker.time,marker.data,];}
let slot=0;return{schema:{name:slot++,time:slot++,data:slot++,},data:deflatedMarkers,};}
function deflateThread(thread,uniqueStacks){

 if(typeof thread==="string"){thread=JSON.parse(thread);}
if(!thread.samples){thread.samples=[];}
if(!thread.markers){thread.markers=[];}
return{name:thread.name,tid:thread.tid,samples:deflateSamples(thread.samples,uniqueStacks),markers:deflateMarkers(thread.markers,uniqueStacks),stackTable:uniqueStacks.getStackTableWithSchema(),frameTable:uniqueStacks.getFrameTableWithSchema(),stringTable:uniqueStacks.getStringTable(),};}
function stackTableWithSchema(data){let slot=0;return{schema:{prefix:slot++,frame:slot++,},data:data,};}
function frameTableWithSchema(data){let slot=0;return{schema:{location:slot++,implementation:slot++,optimizations:slot++,line:slot++,category:slot++,},data:data,};}
function samplesWithSchema(data){let slot=0;return{schema:{stack:slot++,time:slot++,responsiveness:slot++,rss:slot++,uss:slot++,},data:data,};}
function UniqueStrings(){this.stringTable=[];this._stringHash=Object.create(null);}
UniqueStrings.prototype.getOrAddStringIndex=function(s){if(!s){return null;}
const stringHash=this._stringHash;const stringTable=this.stringTable;let index=stringHash[s];if(index!==undefined){return index;}
index=stringTable.length;stringHash[s]=index;stringTable.push(s);return index;};function UniqueStacks(){this._frameTable=[];this._stackTable=[];this._frameHash=Object.create(null);this._stackHash=Object.create(null);this._uniqueStrings=new UniqueStrings();}
UniqueStacks.prototype.getStackTableWithSchema=function(){return stackTableWithSchema(this._stackTable);};UniqueStacks.prototype.getFrameTableWithSchema=function(){return frameTableWithSchema(this._frameTable);};UniqueStacks.prototype.getStringTable=function(){return this._uniqueStrings.stringTable;};UniqueStacks.prototype.getOrAddFrameIndex=function(frame){const frameHash=this._frameHash;const frameTable=this._frameTable;const locationIndex=this.getOrAddStringIndex(frame.location);const implementationIndex=this.getOrAddStringIndex(frame.implementation);const hash=`${locationIndex} ${implementationIndex || ""} `+`${frame.line || ""} ${frame.category || ""}`;let index=frameHash[hash];if(index!==undefined){return index;}
index=frameTable.length;frameHash[hash]=index;frameTable.push([this.getOrAddStringIndex(frame.location),this.getOrAddStringIndex(frame.implementation),
null,frame.line,frame.category,]);return index;};UniqueStacks.prototype.getOrAddStackIndex=function(prefixIndex,frameIndex){const stackHash=this._stackHash;const stackTable=this._stackTable;const hash=prefixIndex+" "+frameIndex;let index=stackHash[hash];if(index!==undefined){return index;}
index=stackTable.length;stackHash[hash]=index;stackTable.push([prefixIndex,frameIndex]);return index;};UniqueStacks.prototype.getOrAddStringIndex=function(s){return this._uniqueStrings.getOrAddStringIndex(s);};exports.pushAll=pushAll;exports.mapRecordingOptions=mapRecordingOptions;exports.normalizePerformanceFeatures=normalizePerformanceFeatures;exports.filterSamples=filterSamples;exports.offsetSampleTimes=offsetSampleTimes;exports.offsetMarkerTimes=offsetMarkerTimes;exports.offsetAndScaleTimestamps=offsetAndScaleTimestamps;exports.getProfileThreadFromAllocations=getProfileThreadFromAllocations;exports.deflateProfile=deflateProfile;exports.deflateThread=deflateThread;exports.UniqueStrings=UniqueStrings;exports.UniqueStacks=UniqueStacks;