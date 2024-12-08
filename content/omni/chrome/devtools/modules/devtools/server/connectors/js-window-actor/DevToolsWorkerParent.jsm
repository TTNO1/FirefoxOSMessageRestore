"use strict";var EXPORTED_SYMBOLS=["DevToolsWorkerParent"];const{loader}=ChromeUtils.import("resource://devtools/shared/Loader.jsm");const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{WatcherRegistry}=ChromeUtils.import("resource://devtools/server/actors/watcher/WatcherRegistry.jsm");loader.lazyRequireGetter(this,"JsWindowActorTransport","devtools/shared/transport/js-window-actor-transport",true);class DevToolsWorkerParent extends JSWindowActorParent{constructor(){super();this._destroyed=false;








this._connections=new Map();this._onConnectionClosed=this._onConnectionClosed.bind(this);EventEmitter.decorate(this);}
instantiateWorkerTargets({watcherActorID,connectionPrefix,browserId,watchedData,}){return this.sendQuery("DevToolsWorkerParent:instantiate-already-available",{watcherActorID,connectionPrefix,browserId,watchedData,});}
destroyWorkerTargets({watcher,browserId}){return this.sendAsyncMessage("DevToolsWorkerParent:destroy",{watcherActorID:watcher.actorID,browserId,});}
addWatcherDataEntry({watcherActorID,type,entries}){return this.sendQuery("DevToolsWorkerParent:addWatcherDataEntry",{watcherActorID,type,entries,});}
removeWatcherDataEntry({watcherActorID,type,entries}){this.sendAsyncMessage("DevToolsWorkerParent:removeWatcherDataEntry",{watcherActorID,type,entries,});}
workerTargetAvailable({watcherActorID,forwardingPrefix,workerTargetForm,}){if(this._destroyed){return;}
const watcher=WatcherRegistry.getWatcher(watcherActorID);if(!watcher){throw new Error(`Watcher Actor with ID '${watcherActorID}' can't be found.`);}
const connection=watcher.conn;const{prefix}=connection;if(!this._connections.has(prefix)){connection.on("closed",this._onConnectionClosed);const transport=new JsWindowActorTransport(this,forwardingPrefix);transport.hooks={onPacket:connection.send.bind(connection),onClosed(){},};transport.ready();connection.setForwarding(forwardingPrefix,transport);this._connections.set(prefix,{watcher,transport,actors:new Map(),});}
const workerTargetActorId=workerTargetForm.actor;this._connections.get(prefix).actors.set(workerTargetActorId,workerTargetForm);watcher.notifyTargetAvailable(workerTargetForm);}
workerTargetDestroyed({watcherActorID,forwardingPrefix,workerTargetForm,}){const watcher=WatcherRegistry.getWatcher(watcherActorID);if(!watcher){throw new Error(`Watcher Actor with ID '${watcherActorID}' can't be found.`);}
const connection=watcher.conn;const{prefix}=connection;if(!this._connections.has(prefix)){return;}
const workerTargetActorId=workerTargetForm.actor;const{actors}=this._connections.get(prefix);if(!actors.has(workerTargetActorId)){return;}
actors.delete(workerTargetActorId);watcher.notifyTargetDestroyed(workerTargetForm);}
_onConnectionClosed(status,prefix){if(this._connections.has(prefix)){const{watcher}=this._connections.get(prefix);this._cleanupConnection(watcher.conn);}}
async _cleanupConnection(connection){if(!this._connections||!this._connections.has(connection.prefix)){return;}
const{transport}=this._connections.get(connection.prefix);connection.off("closed",this._onConnectionClosed);if(transport){
connection.cancelForwarding(transport._prefix);transport.close();}
this._connections.delete(connection.prefix);if(!this._connections.size){this._destroy();}}
_destroy(){if(this._destroyed){return;}
this._destroyed=true;for(const{actors,watcher}of this._connections.values()){for(const actor of actors.values()){watcher.notifyTargetDestroyed(actor);}
this._cleanupConnection(watcher.conn);}}
didDestroy(){this._destroy();}
async sendPacket(packet,prefix){return this.sendAsyncMessage("DevToolsWorkerParent:packet",{packet,prefix,});}
async sendQuery(msg,args){try{const res=await super.sendQuery(msg,args);return res;}catch(e){console.error("Failed to sendQuery in DevToolsWorkerParent",msg,e);throw e;}}
receiveMessage(message){switch(message.name){case"DevToolsWorkerChild:workerTargetAvailable":return this.workerTargetAvailable(message.data);case"DevToolsWorkerChild:workerTargetDestroyed":return this.workerTargetDestroyed(message.data);case"DevToolsWorkerChild:packet":return this.emit("packet-received",message);default:throw new Error("Unsupported message in DevToolsWorkerParent: "+message.name);}}}