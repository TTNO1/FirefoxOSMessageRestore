"use strict";try{var chromeGlobal=this;(function(){

let loader,customLoader=false;if(content.document.nodePrincipal.isSystemPrincipal){const{DevToolsLoader}=ChromeUtils.import("resource://devtools/shared/Loader.jsm");loader=new DevToolsLoader({invisibleToDebugger:true,});customLoader=true;}else{loader=ChromeUtils.import("resource://devtools/shared/Loader.jsm");}
const{require}=loader;const DevToolsUtils=require("devtools/shared/DevToolsUtils");const{DevToolsServer}=require("devtools/server/devtools-server");DevToolsServer.init();DevToolsServer.registerActors({target:true});const connections=new Map();const onConnect=DevToolsUtils.makeInfallible(function(msg){removeMessageListener("debug:connect",onConnect);const mm=msg.target;const prefix=msg.data.prefix;const addonId=msg.data.addonId;const conn=DevToolsServer.connectToParent(prefix,mm);conn.parentMessageManager=mm;connections.set(prefix,conn);let actor;if(addonId){const{WebExtensionTargetActor,}=require("devtools/server/actors/targets/webextension");actor=new WebExtensionTargetActor(conn,chromeGlobal,prefix,addonId);}else{const{FrameTargetActor,}=require("devtools/server/actors/targets/frame");const{docShell}=chromeGlobal;
actor=new FrameTargetActor(conn,docShell);}
actor.manage(actor);sendAsyncMessage("debug:actor",{actor:actor.form(),prefix:prefix});});addMessageListener("debug:connect",onConnect);const onDisconnect=DevToolsUtils.makeInfallible(function(msg){const prefix=msg.data.prefix;const conn=connections.get(prefix);if(!conn){

return;}
removeMessageListener("debug:disconnect",onDisconnect);

conn.close();connections.delete(prefix);});addMessageListener("debug:disconnect",onDisconnect);

addEventListener("unload",()=>{for(const conn of connections.values()){conn.close();}
connections.clear();});
function destroyServer(){
if(DevToolsServer.hasConnection()||DevToolsServer.keepAlive){return;}
DevToolsServer.off("connectionchange",destroyServer);DevToolsServer.destroy(); if(customLoader){loader.destroy();}}
DevToolsServer.on("connectionchange",destroyServer);})();}catch(e){dump(`Exception in DevTools frame startup: ${e}\n`);}