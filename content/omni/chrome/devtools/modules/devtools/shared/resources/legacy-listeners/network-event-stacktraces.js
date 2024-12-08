"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");module.exports=async function({targetList,targetFront,onAvailable}){function onNetworkEventStackTrace(packet){const actor=packet.eventActor;onAvailable([{resourceType:ResourceWatcher.TYPES.NETWORK_EVENT_STACKTRACE,resourceId:actor.channelId,stacktraceAvailable:actor.cause.stacktraceAvailable,lastFrame:actor.cause.lastFrame,},]);}
const webConsoleFront=await targetFront.getFront("console");webConsoleFront.on("serverNetworkStackTrace",onNetworkEventStackTrace);};