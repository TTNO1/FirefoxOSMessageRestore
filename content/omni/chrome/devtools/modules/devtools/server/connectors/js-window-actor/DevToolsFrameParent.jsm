"use strict";var EXPORTED_SYMBOLS=["DevToolsFrameParent"];const{loader}=ChromeUtils.import("resource://devtools/shared/Loader.jsm");const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{WatcherRegistry}=ChromeUtils.import("resource://devtools/server/actors/watcher/WatcherRegistry.jsm");loader.lazyRequireGetter(this,"JsWindowActorTransport","devtools/shared/transport/js-window-actor-transport",true);class DevToolsFrameParent extends JSWindowActorParent{constructor(){super();this._destroyed=false;










this._connections=new Map();this._onConnectionClosed=this._onConnectionClosed.bind(this);EventEmitter.decorate(this);}
instantiateTarget({watcherActorID,connectionPrefix,browserId,watchedData,}){return this.sendQuery("DevToolsFrameParent:instantiate-already-available",{watcherActorID,connectionPrefix,browserId,watchedData,});}
destroyTarget({watcherActorID,browserId}){this.sendAsyncMessage("DevToolsFrameParent:destroy",{watcherActorID,browserId,});}
addWatcherDataEntry({watcherActorID,browserId,type,entries}){return this.sendQuery("DevToolsFrameParent:addWatcherDataEntry",{watcherActorID,browserId,type,entries,});}
removeWatcherDataEntry({watcherActorID,browserId,type,entries}){this.sendAsyncMessage("DevToolsFrameParent:removeWatcherDataEntry",{watcherActorID,browserId,type,entries,});}
connectFromContent({watcherActorID,forwardingPrefix,actor}){const watcher=WatcherRegistry.getWatcher(watcherActorID);if(!watcher){throw new Error(`Watcher Actor with ID '${watcherActorID}' can't be found.`);}
const connection=watcher.conn;connection.on("closed",this._onConnectionClosed);const transport=new JsWindowActorTransport(this,forwardingPrefix);transport.hooks={onPacket:connection.send.bind(connection),onClosed(){},};transport.ready();connection.setForwarding(forwardingPrefix,transport);this._connections.set(watcher.conn.prefix,{watcher,connection,

forwardingPrefix,transport,actor,});watcher.notifyTargetAvailable(actor);}
_onConnectionClosed(status,prefix){if(this._connections.has(prefix)){const{connection}=this._connections.get(prefix);this._cleanupConnection(connection);}}
async _cleanupConnection(connection){const{forwardingPrefix,transport}=this._connections.get(connection.prefix);connection.off("closed",this._onConnectionClosed);if(transport){
transport.close();}
connection.cancelForwarding(forwardingPrefix);this._connections.delete(connection.prefix);if(!this._connections.size){this._destroy();}}
_destroy(){if(this._destroyed){return;}
this._destroyed=true;for(const{actor,connection,watcher}of this._connections.values()){watcher.notifyTargetDestroyed(actor); if(actor&&connection.transport){
connection.send({from:actor.actor,type:"tabDetached"});}
this._cleanupConnection(connection);}}
sendPacket(packet,prefix){this.sendAsyncMessage("DevToolsFrameParent:packet",{packet,prefix});}
async sendQuery(msg,args){try{const res=await super.sendQuery(msg,args);return res;}catch(e){console.error("Failed to sendQuery in DevToolsFrameParent",msg);console.error(e.toString());throw e;}}
receiveMessage(message){switch(message.name){case"DevToolsFrameChild:connectFromContent":return this.connectFromContent(message.data);case"DevToolsFrameChild:packet":return this.emit("packet-received",message);default:throw new Error("Unsupported message in DevToolsFrameParent: "+message.name);}}
didDestroy(){this._destroy();}}