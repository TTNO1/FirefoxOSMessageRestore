"use strict";const nsIConsoleListenerWatcher=require("devtools/server/actors/resources/utils/nsi-console-listener-watcher");const{Ci}=require("chrome");const{TYPES:{PLATFORM_MESSAGE},}=require("devtools/server/actors/resources/index");const{createStringGrip}=require("devtools/server/actors/object/utils");class PlatformMessageWatcher extends nsIConsoleListenerWatcher{shouldHandleTarget(targetActor){return this.isProcessTarget(targetActor);}
shouldHandleMessage(targetActor,message){
if(message instanceof Ci.nsIScriptError){return false;}
return true;}
buildResource(targetActor,message){return{message:createStringGrip(targetActor,message.message),timeStamp:message.timeStamp,resourceType:PLATFORM_MESSAGE,};}}
module.exports=PlatformMessageWatcher;