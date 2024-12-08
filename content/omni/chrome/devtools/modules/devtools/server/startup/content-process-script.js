"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const SHARED_DATA_KEY_NAME="DevTools:watchedPerWatcher";class ContentProcessStartup{constructor(){
 this._connections=new Map();this.observe=this.observe.bind(this);this.receiveMessage=this.receiveMessage.bind(this);this.addListeners();this.maybeCreateExistingTargetActors();}
observe(subject,topic,data){switch(topic){case"xpcom-shutdown":{this.destroy();break;}}}
destroy(){this.removeListeners();for(const[,connectionInfo]of this._connections){connectionInfo.connection.close();}
this._connections.clear();}
addListeners(){Services.obs.addObserver(this.observe,"xpcom-shutdown");Services.cpmm.addMessageListener("debug:instantiate-already-available",this.receiveMessage);Services.cpmm.addMessageListener("debug:destroy-target",this.receiveMessage);Services.cpmm.addMessageListener("debug:add-watcher-data-entry",this.receiveMessage);Services.cpmm.addMessageListener("debug:remove-watcher-data-entry",this.receiveMessage);Services.cpmm.addMessageListener("debug:destroy-process-script",this.receiveMessage);}
removeListeners(){Services.obs.removeObserver(this.observe,"xpcom-shutdown");Services.cpmm.removeMessageListener("debug:instantiate-already-available",this.receiveMessage);Services.cpmm.removeMessageListener("debug:destroy-target",this.receiveMessage);Services.cpmm.removeMessageListener("debug:add-watcher-data-entry",this.receiveMessage);Services.cpmm.removeMessageListener("debug:remove-watcher-data-entry",this.receiveMessage);Services.cpmm.removeMessageListener("debug:destroy-process-script",this.receiveMessage);}
receiveMessage(msg){switch(msg.name){case"debug:instantiate-already-available":this.createTargetActor(msg.data.watcherActorID,msg.data.connectionPrefix,msg.data.watchedData,true);break;case"debug:destroy-target":this.destroyTarget(msg.data.watcherActorID);break;case"debug:add-watcher-data-entry":this.addWatcherDataEntry(msg.data.watcherActorID,msg.data.type,msg.data.entries);break;case"debug:remove-watcher-data-entry":this.addWatcherDataEntry(msg.data.watcherActorID,msg.data.type,msg.data.entries);break;case"debug:destroy-process-script":this.destroy();break;default:throw new Error(`Unsupported message name ${msg.name}`);}}
maybeCreateExistingTargetActors(){const{sharedData}=Services.cpmm;
if(!sharedData){Services.tm.dispatchToMainThread(this.maybeCreateExistingTargetActors.bind(this));return;}
const watchedDataByWatcherActor=sharedData.get(SHARED_DATA_KEY_NAME);if(!watchedDataByWatcherActor){return;} 
for(const[watcherActorID,watchedData]of watchedDataByWatcherActor){const{connectionPrefix,targets}=watchedData;
 if(targets.includes("process")){this.createTargetActor(watcherActorID,connectionPrefix,watchedData);}}}
createTargetActor(watcherActorID,parentConnectionPrefix,initialData,ignoreAlreadyCreated=false){if(this._connections.get(watcherActorID)){if(ignoreAlreadyCreated){return;}
throw new Error("ContentProcessStartup createTargetActor was called more than once"+` for the Watcher Actor (ID: "${watcherActorID}")`);} 
const prefix=parentConnectionPrefix+"contentProcess"+Services.appinfo.processID; const{initContentProcessTarget}=ChromeUtils.import("resource://devtools/server/startup/content-process.jsm");const{actor,connection}=initContentProcessTarget({target:Services.cpmm,data:{watcherActorID,parentConnectionPrefix,prefix,},});this._connections.set(watcherActorID,{actor,connection,}); for(const type in initialData){actor.addWatcherDataEntry(type,initialData[type]);}}
destroyTarget(watcherActorID){const connectionInfo=this._connections.get(watcherActorID);if(!connectionInfo){throw new Error(`Trying to destroy a content process target actor that doesn't exists, or has already been destroyed. Watcher Actor ID:${watcherActorID}`);}
connectionInfo.connection.close();this._connections.delete(watcherActorID);}
async addWatcherDataEntry(watcherActorID,type,entries){const connectionInfo=this._connections.get(watcherActorID);if(!connectionInfo){throw new Error(`No content process target actor for this Watcher Actor ID:"${watcherActorID}"`);}
const{actor}=connectionInfo;await actor.addWatcherDataEntry(type,entries);Services.cpmm.sendAsyncMessage("debug:add-watcher-data-entry-done",{watcherActorID,});}
removeWatcherDataEntry(watcherActorID,type,entries){const connectionInfo=this._connections.get(watcherActorID);if(!connectionInfo){return;}
const{actor}=connectionInfo;actor.removeWatcherDataEntry(type,entries);}}
if(Services.appinfo.processType==Services.appinfo.PROCESS_TYPE_CONTENT){new ContentProcessStartup();}