"use strict";var Services=require("Services");var DevToolsUtils=require("devtools/shared/DevToolsUtils");var{dumpn}=DevToolsUtils;const{Pool}=require("devtools/shared/protocol/Pool");loader.lazyRequireGetter(this,"DevToolsServer","devtools/server/devtools-server",true);loader.lazyRequireGetter(this,"ChildDebuggerTransport","devtools/shared/transport/child-transport",true);loader.lazyRequireGetter(this,"EventEmitter","devtools/shared/event-emitter");function connectToFrame(connection,frame,onDestroy,{addonId}={}){return new Promise(resolve=>{
const mm=frame.messageManager||frame.frameLoader.messageManager;mm.loadFrameScript("resource://devtools/server/startup/frame.js",false);const spawnInParentActorPool=new Pool(connection,"connectToFrame-spawnInParent");connection.addActor(spawnInParentActorPool);const trackMessageManager=()=>{mm.addMessageListener("debug:setup-in-parent",onSetupInParent);mm.addMessageListener("debug:spawn-actor-in-parent",onSpawnActorInParent);if(!actor){mm.addMessageListener("debug:actor",onActorCreated);}};const untrackMessageManager=()=>{mm.removeMessageListener("debug:setup-in-parent",onSetupInParent);mm.removeMessageListener("debug:spawn-actor-in-parent",onSpawnActorInParent);if(!actor){mm.removeMessageListener("debug:actor",onActorCreated);}};let actor,childTransport;const prefix=connection.allocID("child"); const connPrefix=prefix+"/";
 const parentModules=[];const onSetupInParent=function(msg){
if(msg.json.prefix!=connPrefix){return false;}
const{module,setupParent}=msg.json;let m;try{m=require(module);if(!(setupParent in m)){dumpn(`ERROR: module '${module}' does not export '${setupParent}'`);return false;}
parentModules.push(m[setupParent]({mm,prefix:connPrefix}));return true;}catch(e){const errorMessage="Exception during actor module setup running in the parent process: ";DevToolsUtils.reportException(errorMessage+e);dumpn(`ERROR: ${errorMessage}\n\t module: '${module}'\n\t `+`setupParent: '${setupParent}'\n${DevToolsUtils.safeErrorString(e)}`);return false;}};const parentActors=[];const onSpawnActorInParent=function(msg){
if(msg.json.prefix!=connPrefix){return;}
const{module,constructor,args,spawnedByActorID}=msg.json;let m;try{m=require(module);if(!(constructor in m)){dump(`ERROR: module '${module}' does not export '${constructor}'`);return;}
const Constructor=m[constructor];

 const instance=new Constructor(connection,...args,mm);instance.conn=connection;instance.parentID=spawnedByActorID;
const contentPrefix=spawnedByActorID.replace(connection.prefix,"").replace("/","-");instance.actorID=connection.allocID(contentPrefix+"/"+instance.typeName);spawnInParentActorPool.manage(instance);mm.sendAsyncMessage("debug:spawn-actor-in-parent:actor",{prefix:connPrefix,actorID:instance.actorID,});parentActors.push(instance);}catch(e){const errorMessage="Exception during actor module setup running in the parent process: ";DevToolsUtils.reportException(errorMessage+e+"\n"+e.stack);dumpn(`ERROR: ${errorMessage}\n\t module: '${module}'\n\t `+`constructor: '${constructor}'\n${DevToolsUtils.safeErrorString(e)}`);}};const onActorCreated=DevToolsUtils.makeInfallible(function(msg){if(msg.json.prefix!=prefix){return;}
mm.removeMessageListener("debug:actor",onActorCreated); childTransport=new ChildDebuggerTransport(mm,prefix);childTransport.hooks={
onPacket:connection.send.bind(connection),};childTransport.ready();connection.setForwarding(prefix,childTransport);dumpn(`Start forwarding for frame with prefix ${prefix}`);actor=msg.json.actor;resolve(actor);});const destroy=DevToolsUtils.makeInfallible(function(){EventEmitter.off(connection,"closed",destroy);Services.obs.removeObserver(onMessageManagerClose,"message-manager-close");
 parentModules.forEach(mod=>{if(mod.onDisconnected){mod.onDisconnected();}});DevToolsServer.emit("disconnected-from-child:"+connPrefix,{mm,prefix:connPrefix,});
 spawnInParentActorPool.destroy();if(actor){
connection.send({from:actor.actor,type:"tabDetached"});actor=null;}
if(childTransport){
childTransport.close();childTransport=null;connection.cancelForwarding(prefix);try{
mm.sendAsyncMessage("debug:disconnect",{prefix});}catch(e){}}else{

resolve(null);}
if(onDestroy){onDestroy(mm);} 
untrackMessageManager();}); trackMessageManager(); const onMessageManagerClose=function(subject,topic,data){if(subject==mm){destroy();}};Services.obs.addObserver(onMessageManagerClose,"message-manager-close");
EventEmitter.on(connection,"closed",destroy);mm.sendAsyncMessage("debug:connect",{prefix,addonId});});}
exports.connectToFrame=connectToFrame;