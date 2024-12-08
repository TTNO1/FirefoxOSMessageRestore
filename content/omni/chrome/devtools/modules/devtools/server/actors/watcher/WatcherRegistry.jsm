"use strict";var EXPORTED_SYMBOLS=["WatcherRegistry"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{ActorManagerParent}=ChromeUtils.import("resource://gre/modules/ActorManagerParent.jsm");




const watchedDataByWatcherActor=new Map();
const watcherActors=new Map();const SHARED_DATA_KEY_NAME="DevTools:watchedPerWatcher";const SUPPORTED_DATA={TARGETS:"targets",RESOURCES:"resources",};function persistMapToSharedData(){Services.ppmm.sharedData.set(SHARED_DATA_KEY_NAME,watchedDataByWatcherActor);

Services.ppmm.sharedData.flush();}
const WatcherRegistry={isWatchingTargets(watcher,targetType){const watchedData=this.getWatchedData(watcher);return watchedData&&watchedData.targets.includes(targetType);},getWatchedData(watcher,{createData=false}={}){
const watcherActorID=watcher.actorID;let watchedData=watchedDataByWatcherActor.get(watcherActorID);if(!watchedData&&createData){watchedData={


browserId:watcher.browserId, connectionPrefix:watcher.conn.prefix,}; for(const name of Object.values(SUPPORTED_DATA)){watchedData[name]=[];}
watchedDataByWatcherActor.set(watcherActorID,watchedData);watcherActors.set(watcherActorID,watcher);}
return watchedData;},getWatcher(actorID){return watcherActors.get(actorID);},addWatcherDataEntry(watcher,type,entries){const watchedData=this.getWatchedData(watcher,{createData:true,});if(!(type in watchedData)){throw new Error(`Unsupported watcher data type: ${type}`);}
for(const entry of entries){if(watchedData[type].includes(entry)){throw new Error(`'${type}:${entry} already exists for Watcher Actor ${watcher.actorID}`);}}
registerJSWindowActor();for(const entry of entries){watchedData[type].push(entry);}
persistMapToSharedData();},removeWatcherDataEntry(watcher,type,entries){const watchedData=this.getWatchedData(watcher);if(!watchedData){return false;}
if(!(type in watchedData)){throw new Error(`Unsupported watcher data type: ${type}`);}
let includesAtLeastOne=false;for(const entry of entries){const idx=watchedData[type].indexOf(entry);if(idx!==-1){watchedData[type].splice(idx,1);includesAtLeastOne=true;}}
if(!includesAtLeastOne){return false;}
const isWatchingSomething=Object.values(SUPPORTED_DATA).some(dataType=>watchedData[dataType].length>0);if(!isWatchingSomething){watchedDataByWatcherActor.delete(watcher.actorID);watcherActors.delete(watcher.actorID);}
persistMapToSharedData();return true;},watchTargets(watcher,targetType){this.addWatcherDataEntry(watcher,SUPPORTED_DATA.TARGETS,[targetType]);},unwatchTargets(watcher,targetType){return this.removeWatcherDataEntry(watcher,SUPPORTED_DATA.TARGETS,[targetType,]);},watchResources(watcher,resourceTypes){this.addWatcherDataEntry(watcher,SUPPORTED_DATA.RESOURCES,resourceTypes);},unwatchResources(watcher,resourceTypes){return this.removeWatcherDataEntry(watcher,SUPPORTED_DATA.RESOURCES,resourceTypes);},maybeUnregisteringJSWindowActor(){if(watchedDataByWatcherActor.size==0){unregisterJSWindowActor();}},};let isJSWindowActorRegistered=false;const JSWindowActorsConfig={DevToolsFrame:{parent:{moduleURI:"resource://devtools/server/connectors/js-window-actor/DevToolsFrameParent.jsm",},child:{moduleURI:"resource://devtools/server/connectors/js-window-actor/DevToolsFrameChild.jsm",events:{DOMWindowCreated:{},},},allFrames:true,},DevToolsWorker:{parent:{moduleURI:"resource://devtools/server/connectors/js-window-actor/DevToolsWorkerParent.jsm",},child:{moduleURI:"resource://devtools/server/connectors/js-window-actor/DevToolsWorkerChild.jsm",events:{DOMWindowCreated:{},},},allFrames:true,},};function registerJSWindowActor(){if(isJSWindowActorRegistered){return;}
isJSWindowActorRegistered=true;ActorManagerParent.addJSWindowActors(JSWindowActorsConfig);}
function unregisterJSWindowActor(){if(!isJSWindowActorRegistered){return;}
isJSWindowActorRegistered=false;for(const JSWindowActorName of Object.keys(JSWindowActorsConfig)){ChromeUtils.unregisterWindowActor(JSWindowActorName);}}