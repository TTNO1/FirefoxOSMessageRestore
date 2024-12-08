"use strict";const Services=require("Services");const{WatcherRegistry,}=require("devtools/server/actors/watcher/WatcherRegistry.jsm");loader.lazyRequireGetter(this,"ChildDebuggerTransport","devtools/shared/transport/child-transport",true);const CONTENT_PROCESS_SCRIPT="resource://devtools/server/startup/content-process-script.js";const actors=new WeakMap();const watchers=new Set();function onContentProcessActorCreated(msg){const{watcherActorID,prefix,actor}=msg.data;const watcher=WatcherRegistry.getWatcher(watcherActorID);if(!watcher){throw new Error(`Receiving a content process actor without a watcher actor ${watcherActorID}`);}

if(!watchers.has(watcher)){return;}
const messageManager=msg.target;const connection=watcher.conn; const childTransport=new ChildDebuggerTransport(messageManager,prefix);childTransport.hooks={onPacket:connection.send.bind(connection),};childTransport.ready();connection.setForwarding(prefix,childTransport);const list=actors.get(messageManager)||[];list.push({prefix,childTransport,actor,watcher,});actors.set(messageManager,list);watcher.notifyTargetAvailable(actor);}
function onMessageManagerClose(messageManager,topic,data){const list=actors.get(messageManager);if(!list||list.length==0){return;}
for(const{prefix,childTransport,actor,watcher}of list){watcher.notifyTargetDestroyed(actor);
childTransport.close();watcher.conn.cancelForwarding(prefix);}
actors.delete(messageManager);}
function closeWatcherTransports(watcher){for(let i=0;i<Services.ppmm.childCount;i++){const messageManager=Services.ppmm.getChildAt(i);let list=actors.get(messageManager);if(!list||list.length==0){continue;}
list=list.filter(item=>item.watcher!=watcher);for(const item of list){
item.childTransport.close();watcher.conn.cancelForwarding(item.prefix);}
if(list.length==0){actors.delete(messageManager);}else{actors.set(messageManager,list);}}}
function maybeRegisterMessageListeners(watcher){const sizeBefore=watchers.size;watchers.add(watcher);if(sizeBefore==0&&watchers.size==1){Services.ppmm.addMessageListener("debug:content-process-actor",onContentProcessActorCreated);Services.obs.addObserver(onMessageManagerClose,"message-manager-close");

const isContentProcessScripLoaded=Services.ppmm.getDelayedProcessScripts().some(([uri])=>uri===CONTENT_PROCESS_SCRIPT);if(!isContentProcessScripLoaded){Services.ppmm.loadProcessScript(CONTENT_PROCESS_SCRIPT,true);}}}
function maybeUnregisterMessageListeners(watcher){const sizeBefore=watchers.size;watchers.delete(watcher);closeWatcherTransports(watcher);if(sizeBefore==1&&watchers.size==0){Services.ppmm.removeMessageListener("debug:content-process-actor",onContentProcessActorCreated);Services.obs.removeObserver(onMessageManagerClose,"message-manager-close");


Services.ppmm.removeDelayedProcessScript(CONTENT_PROCESS_SCRIPT);Services.ppmm.broadcastAsyncMessage("debug:destroy-process-script");}}
async function createTargets(watcher){maybeRegisterMessageListeners(watcher);

const contentProcessCount=Services.ppmm.childCount-1;if(contentProcessCount==0){return;}
const onTargetsCreated=new Promise(resolve=>{let receivedTargetCount=0;const listener=()=>{if(++receivedTargetCount==contentProcessCount){watcher.off("target-available-form",listener);resolve();}};watcher.on("target-available-form",listener);});Services.ppmm.broadcastAsyncMessage("debug:instantiate-already-available",{watcherActorID:watcher.actorID,connectionPrefix:watcher.conn.prefix,watchedData:watcher.watchedData,});await onTargetsCreated;}
function destroyTargets(watcher){maybeUnregisterMessageListeners(watcher);Services.ppmm.broadcastAsyncMessage("debug:destroy-target",{watcherActorID:watcher.actorID,});}
async function addWatcherDataEntry({watcher,type,entries}){let expectedCount=Services.ppmm.childCount-1;if(expectedCount==0){return;}
const onAllReplied=new Promise(resolve=>{let count=0;const listener=msg=>{if(msg.data.watcherActorID!=watcher.actorID){return;}
count++;maybeResolve();};Services.ppmm.addMessageListener("debug:add-watcher-data-entry-done",listener);const onContentProcessClosed=(messageManager,topic,data)=>{expectedCount--;maybeResolve();};const maybeResolve=()=>{if(count==expectedCount){Services.ppmm.removeMessageListener("debug:add-watcher-data-entry-done",listener);Services.obs.removeObserver(onContentProcessClosed,"message-manager-close");resolve();}};Services.obs.addObserver(onContentProcessClosed,"message-manager-close");});Services.ppmm.broadcastAsyncMessage("debug:add-watcher-data-entry",{watcherActorID:watcher.actorID,type,entries,});await onAllReplied;}
function removeWatcherDataEntry({watcher,type,entries}){Services.ppmm.broadcastAsyncMessage("debug:remove-watcher-data-entry",{watcherActorID:watcher.actorID,type,entries,});}
module.exports={createTargets,destroyTargets,addWatcherDataEntry,removeWatcherDataEntry,};