"use strict";var EXPORTED_SYMBOLS=["DevToolsFrameChild"];const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const Loader=ChromeUtils.import("resource://devtools/shared/Loader.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{TargetActorRegistry:"resource://devtools/server/actors/targets/target-actor-registry.jsm",});XPCOMUtils.defineLazyModuleGetters(this,{WindowGlobalLogger:"resource://devtools/server/connectors/js-window-actor/WindowGlobalLogger.jsm",});const SHARED_DATA_KEY_NAME="DevTools:watchedPerWatcher";const DEBUG=false;function shouldNotifyWindowGlobal(windowGlobal,watchedBrowserId){const browsingContext=windowGlobal.browsingContext;
const window=Services.wm.getCurrentInnerWindowWithId(windowGlobal.innerWindowId);
if(!window.docShell.hasLoadedNonBlankURI&&!browsingContext.opener){return false;}
if(watchedBrowserId&&browsingContext.browserId!=watchedBrowserId){return false;}

if(!browsingContext.parent&&browsingContext.browserId==watchedBrowserId){return false;}


if(Cu.isRemoteProxy(windowGlobal.window)){return false;}


if(browsingContext.parent&&browsingContext.parent.window&&!Cu.isRemoteProxy(browsingContext.parent.window)){return false;}
return true;}
function logWindowGlobal(windowGlobal,message){if(!DEBUG){return;}
WindowGlobalLogger.logWindowGlobal(windowGlobal,message);}
class DevToolsFrameChild extends JSWindowActorChild{constructor(){super();
 this._connections=new Map();this._onConnectionChange=this._onConnectionChange.bind(this);EventEmitter.decorate(this);}
instantiate(){const{sharedData}=Services.cpmm;const watchedDataByWatcherActor=sharedData.get(SHARED_DATA_KEY_NAME);if(!watchedDataByWatcherActor){throw new Error("Request to instantiate the target(s) for the BrowsingContext, but `sharedData` is empty about watched targets");} 
for(const[watcherActorID,watchedData]of watchedDataByWatcherActor){const{connectionPrefix,browserId}=watchedData;if(watchedData.targets.includes("frame")&&shouldNotifyWindowGlobal(this.manager,browserId)){this._createTargetActor(watcherActorID,connectionPrefix,watchedData);}}}
_createTargetActor(watcherActorID,parentConnectionPrefix,initialData){if(this._connections.get(watcherActorID)){throw new Error("DevToolsFrameChild _createTargetActor was called more than once"+` for the same Watcher (Actor ID: "${watcherActorID}")`);}

const forwardingPrefix=parentConnectionPrefix+"windowGlobal"+this.manager.innerWindowId;logWindowGlobal(this.manager,"Instantiate WindowGlobalTarget with prefix: "+forwardingPrefix);const{connection,targetActor}=this._createConnectionAndActor(forwardingPrefix);this._connections.set(watcherActorID,{connection,actor:targetActor,}); for(const type in initialData){targetActor.addWatcherDataEntry(type,initialData[type]);}




this.sendAsyncMessage("DevToolsFrameChild:connectFromContent",{watcherActorID,forwardingPrefix,actor:targetActor.form(),});}
_destroyTargetActor(watcherActorID){const connectionInfo=this._connections.get(watcherActorID);if(!connectionInfo){throw new Error(`Trying to destroy a target actor that doesn't exists, or has already been destroyed. Watcher Actor ID:${watcherActorID}`);}
connectionInfo.connection.close();this._connections.delete(watcherActorID);if(this._connections.size==0){this.didDestroy();}}
_createConnectionAndActor(forwardingPrefix){this.useCustomLoader=this.document.nodePrincipal.isSystemPrincipal;if(!this.loader){this.loader=this.useCustomLoader?new Loader.DevToolsLoader({invisibleToDebugger:true,}):Loader;}
const{DevToolsServer}=this.loader.require("devtools/server/devtools-server");const{FrameTargetActor}=this.loader.require("devtools/server/actors/targets/frame");DevToolsServer.init();DevToolsServer.registerActors({target:true});DevToolsServer.on("connectionchange",this._onConnectionChange);const connection=DevToolsServer.connectToParentWindowActor(this,forwardingPrefix);const targetActor=new FrameTargetActor(connection,this.docShell,{followWindowGlobalLifeCycle:true,doNotFireFrameUpdates:true,});targetActor.manage(targetActor);return{connection,targetActor};}
_onConnectionChange(){const{DevToolsServer}=this.loader.require("devtools/server/devtools-server");
if(DevToolsServer.hasConnection()||DevToolsServer.keepAlive){return;}
if(this._destroyed){return;}
this._destroyed=true;DevToolsServer.off("connectionchange",this._onConnectionChange);DevToolsServer.destroy();}
sendPacket(packet,prefix){this.sendAsyncMessage("DevToolsFrameChild:packet",{packet,prefix});}
async sendQuery(msg,args){try{const res=await super.sendQuery(msg,args);return res;}catch(e){console.error("Failed to sendQuery in DevToolsFrameChild",msg);console.error(e.toString());throw e;}}
receiveMessage(message){
if(message.name!="DevToolsFrameParent:packet"){const{browserId}=message.data;
if(this.manager.browsingContext.browserId!=browserId&&!shouldNotifyWindowGlobal(this.manager,browserId)){throw new Error("Mismatch between DevToolsFrameParent and DevToolsFrameChild  "+
(this.manager.browsingContext.browserId==browserId?"window global shouldn't be notified (shouldNotifyWindowGlobal mismatch)":`expected browsing context with browserId ${browserId}, but got ${this.manager.browsingContext.browserId}`));}}
switch(message.name){case"DevToolsFrameParent:instantiate-already-available":{const{watcherActorID,connectionPrefix,watchedData}=message.data;return this._createTargetActor(watcherActorID,connectionPrefix,watchedData);}
case"DevToolsFrameParent:destroy":{const{watcherActorID}=message.data;return this._destroyTargetActor(watcherActorID);}
case"DevToolsFrameParent:addWatcherDataEntry":{const{watcherActorID,browserId,type,entries}=message.data;return this._addWatcherDataEntry(watcherActorID,browserId,type,entries);}
case"DevToolsFrameParent:removeWatcherDataEntry":{const{watcherActorID,browserId,type,entries}=message.data;return this._removeWatcherDataEntry(watcherActorID,browserId,type,entries);}
case"DevToolsFrameParent:packet":return this.emit("packet-received",message);default:throw new Error("Unsupported message in DevToolsFrameParent: "+message.name);}}
_getTargetActorForWatcherActorID(watcherActorID,browserId){const connectionInfo=this._connections.get(watcherActorID);let targetActor=connectionInfo?connectionInfo.actor:null;

if(!targetActor&&this.manager.browsingContext.browserId==browserId){ const connectionPrefix=watcherActorID.replace(/watcher\d+$/,"");targetActor=TargetActorRegistry.getTargetActor(browserId,connectionPrefix);}
return targetActor;}
_addWatcherDataEntry(watcherActorID,browserId,type,entries){const targetActor=this._getTargetActorForWatcherActorID(watcherActorID,browserId);if(!targetActor){throw new Error(`No target actor for this Watcher Actor ID:"${watcherActorID}" / BrowserId:${browserId}`);}
return targetActor.addWatcherDataEntry(type,entries);}
_removeWatcherDataEntry(watcherActorID,browserId,type,entries){const targetActor=this._getTargetActorForWatcherActorID(watcherActorID,browserId);if(targetActor){return targetActor.removeWatcherDataEntry(type,entries);}
return null;}
handleEvent({type}){if(type=="DOMWindowCreated"){this.instantiate();}}
didDestroy(){for(const[,connectionInfo]of this._connections){connectionInfo.connection.close();}
this._connections.clear();if(this.useCustomLoader){this.loader.destroy();}}}