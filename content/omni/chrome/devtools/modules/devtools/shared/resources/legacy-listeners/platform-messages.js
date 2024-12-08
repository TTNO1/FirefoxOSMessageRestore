"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");module.exports=async function({targetList,targetFront,onAvailable}){const isAllowed=targetFront.isTopLevel||targetFront.targetType===targetList.TYPES.PROCESS;if(!isAllowed){return;}
const webConsoleFront=await targetFront.getFront("console");if(webConsoleFront.isDestroyed()){return;}


await webConsoleFront.startListeners(["PageError"]);
 const{messages}=await webConsoleFront.getCachedMessages(["LogMessage"]);for(const message of messages){if(message._type){delete message._type;}
message.resourceType=ResourceWatcher.TYPES.PLATFORM_MESSAGE;}
onAvailable(messages);webConsoleFront.on("logMessage",message=>{message.resourceType=ResourceWatcher.TYPES.PLATFORM_MESSAGE;onAvailable([message]);});};