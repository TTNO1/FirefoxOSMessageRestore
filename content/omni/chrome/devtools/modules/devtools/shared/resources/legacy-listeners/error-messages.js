"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");const{MESSAGE_CATEGORY}=require("devtools/shared/constants");module.exports=async function({targetList,targetFront,onAvailable}){


const listenForFrames=targetList.targetFront.isLocalTab;const isAllowed=targetFront.isTopLevel||targetFront.targetType===targetList.TYPES.PROCESS||(targetFront.targetType===targetList.TYPES.FRAME&&listenForFrames);if(!isAllowed){return;}
const webConsoleFront=await targetFront.getFront("console");if(webConsoleFront.isDestroyed()){return;}


await webConsoleFront.startListeners(["PageError"]);
 let{messages}=await webConsoleFront.getCachedMessages(["PageError"]);messages=messages.filter(message=>message.pageError.category!==MESSAGE_CATEGORY.CSS_PARSER);messages.forEach(message=>{message.resourceType=ResourceWatcher.TYPES.ERROR_MESSAGE;});onAvailable(messages);webConsoleFront.on("pageError",message=>{if(message.pageError.category===MESSAGE_CATEGORY.CSS_PARSER){return;}
message.resourceType=ResourceWatcher.TYPES.ERROR_MESSAGE;onAvailable([message]);});};