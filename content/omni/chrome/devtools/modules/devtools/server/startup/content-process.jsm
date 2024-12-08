"use strict";const EXPORTED_SYMBOLS=["initContentProcessTarget"];let gLoader;function setupServer(mm){
 if(gLoader){return gLoader;}
const{DevToolsLoader}=ChromeUtils.import("resource://devtools/shared/Loader.jsm");

gLoader=new DevToolsLoader({invisibleToDebugger:true,});const{DevToolsServer}=gLoader.require("devtools/server/devtools-server");DevToolsServer.init();

DevToolsServer.registerActors({root:true,target:true});
function destroyServer(){
if(DevToolsServer.hasConnection()){return;}
DevToolsServer.off("connectionchange",destroyServer);DevToolsServer.destroy();gLoader.destroy();gLoader=null;}
DevToolsServer.on("connectionchange",destroyServer);return gLoader;}
function initContentProcessTarget(msg){const mm=msg.target;const prefix=msg.data.prefix;const watcherActorID=msg.data.watcherActorID; const loader=setupServer(mm);
 const{DevToolsServer}=loader.require("devtools/server/devtools-server");const conn=DevToolsServer.connectToParent(prefix,mm);conn.parentMessageManager=mm;const{ContentProcessTargetActor}=loader.require("devtools/server/actors/targets/content-process");const actor=new ContentProcessTargetActor(conn);actor.manage(actor);const response={watcherActorID,prefix,actor:actor.form()};mm.sendAsyncMessage("debug:content-process-actor",response); mm.addMessageListener("debug:content-process-disconnect",function onDestroy(message){if(message.data.prefix!=prefix){
return;}
mm.removeMessageListener("debug:content-process-disconnect",onDestroy);

conn.close();});return{actor,connection:conn,};}