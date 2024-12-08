"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");module.exports=async function({targetList,targetFront,onAvailable}){

 const listenForFrames=targetList.targetFront.isLocalTab;const listenForWorkers=!targetList.rootFront.traits.workerConsoleApiMessagesDispatchedToMainThread;const acceptTarget=targetFront.isTopLevel||targetFront.targetType===targetList.TYPES.PROCESS||(targetFront.targetType===targetList.TYPES.FRAME&&listenForFrames)||(targetFront.targetType===targetList.TYPES.WORKER&&listenForWorkers);if(!acceptTarget){return;}
const webConsoleFront=await targetFront.getFront("console");if(webConsoleFront.isDestroyed()){return;} 
await webConsoleFront.startListeners(["ConsoleAPI"]);
 let{messages}=await webConsoleFront.getCachedMessages(["ConsoleAPI"]);messages=messages.map(message=>{ if(message._type){return{message,resourceType:ResourceWatcher.TYPES.CONSOLE_MESSAGE,};}
message.resourceType=ResourceWatcher.TYPES.CONSOLE_MESSAGE;return message;});onAvailable(messages); webConsoleFront.on("consoleAPICall",message=>{message.resourceType=ResourceWatcher.TYPES.CONSOLE_MESSAGE;onAvailable([message]);});};