"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");module.exports=async function({targetList,targetFront,onAvailable}){const isBrowserToolbox=targetList.targetFront.isParentProcess;const isNonTopLevelFrameTarget=!targetFront.isTopLevel&&targetFront.targetType===targetList.TYPES.FRAME;if(isBrowserToolbox&&isNonTopLevelFrameTarget){
return;}
const threadFront=await targetFront.getFront("thread");

const sourcesActorIDCache=new Set();threadFront.on("newSource",({source})=>{if(sourcesActorIDCache.has(source.actor)){return;}
sourcesActorIDCache.add(source.actor); source.resourceType=ResourceWatcher.TYPES.SOURCE;onAvailable([source]);});


let sources;try{({sources}=await threadFront.sources());}catch(e){if(threadFront.isDestroyed()){return;}
throw e;}

sources=sources.filter(source=>{return!sourcesActorIDCache.has(source.actor);});for(const source of sources){sourcesActorIDCache.add(source.actor); source.resourceType=ResourceWatcher.TYPES.SOURCE;}
onAvailable(sources);};