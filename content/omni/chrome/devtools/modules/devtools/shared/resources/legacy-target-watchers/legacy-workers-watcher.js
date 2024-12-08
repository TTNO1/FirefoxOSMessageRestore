"use strict";loader.lazyRequireGetter(this,"TargetList","devtools/shared/resources/target-list",true);const{LegacyProcessesWatcher,}=require("devtools/shared/resources/legacy-target-watchers/legacy-processes-watcher");class LegacyWorkersWatcher{constructor(targetList,onTargetAvailable,onTargetDestroyed){this.targetList=targetList;this.rootFront=targetList.rootFront;this.onTargetAvailable=onTargetAvailable;this.onTargetDestroyed=onTargetDestroyed;this.targetsByProcess=new WeakMap();this.targetsListeners=new WeakMap();this._onProcessAvailable=this._onProcessAvailable.bind(this);this._onProcessDestroyed=this._onProcessDestroyed.bind(this);}
async _onProcessAvailable({targetFront}){this.targetsByProcess.set(targetFront,new Set()); const listener=this._workerListChanged.bind(this,targetFront);this.targetsListeners.set(targetFront,listener);
const front=targetFront.isParentProcess?this.rootFront:targetFront;front.on("workerListChanged",listener); await this._workerListChanged(targetFront);}
async _onProcessDestroyed({targetFront}){const existingTargets=this.targetsByProcess.get(targetFront);
 for(const target of existingTargets){this.onTargetDestroyed(target);target.destroy();existingTargets.delete(target);}
this.targetsByProcess.delete(targetFront);this.targetsListeners.delete(targetFront);}
_supportWorkerTarget(workerTarget){
return(workerTarget.isDedicatedWorker&&!workerTarget.url.startsWith("resource://gre/modules/subprocess/subprocess_worker"));}
async _workerListChanged(targetFront){


const front=targetFront.isParentProcess?this.rootFront:targetFront;if(!front||front.isDestroyed()||this.targetList.isDestroyed()){return;}
const{workers}=await front.listWorkers();const existingTargets=this.targetsByProcess.get(targetFront);if(!existingTargets){return;}
 
for(const target of existingTargets){if(!workers.includes(target)){this.onTargetDestroyed(target);target.destroy();existingTargets.delete(target);}}
const promises=workers.map(workerTarget=>this._processNewWorkerTarget(workerTarget,existingTargets));await Promise.all(promises);}
_recordWorkerTarget(workerTarget){return this._supportWorkerTarget(workerTarget);}
async _processNewWorkerTarget(workerTarget,existingTargets){if(!this._recordWorkerTarget(workerTarget)||existingTargets.has(workerTarget)||this.targetList.isDestroyed()){return;} 
existingTargets.add(workerTarget);if(this._supportWorkerTarget(workerTarget)){await this.onTargetAvailable(workerTarget);}}
async listen(){this.target=this.targetList.targetFront;if(this.target.isParentProcess){await this.targetList.watchTargets([TargetList.TYPES.PROCESS],this._onProcessAvailable,this._onProcessDestroyed);await this._onProcessAvailable({targetFront:this.target});return;}
if(this._isSharedWorkerWatcher){
return;}
if(this._isServiceWorkerWatcher){this._legacyProcessesWatcher=new LegacyProcessesWatcher(this.targetList,async targetFront=>{if(!targetFront.isParentProcess){await this._onProcessAvailable({targetFront});}},targetFront=>{if(!targetFront.isParentProcess){this._onProcessDestroyed({targetFront});}});await this._legacyProcessesWatcher.listen();return;}
this.targetsByProcess.set(this.target,new Set());this._workerListChangedListener=this._workerListChanged.bind(this,this.target);this.target.on("workerListChanged",this._workerListChangedListener);await this._workerListChanged(this.target);}
_getProcessTargets(){return this.targetList.getAllTargets([TargetList.TYPES.PROCESS]);}
unlisten(){if(this.target.isParentProcess){this.targetList.unwatchTargets([TargetList.TYPES.PROCESS],this._onProcessAvailable,this._onProcessDestroyed);}else if(this._isServiceWorkerWatcher){this._legacyProcessesWatcher.unlisten();}



if(this.target.isParentProcess||this._isServiceWorkerWatcher){for(const targetFront of this._getProcessTargets()){const listener=this.targetsListeners.get(targetFront);targetFront.off("workerListChanged",listener);this.targetsByProcess.delete(targetFront);this.targetsListeners.delete(targetFront);}}else{this.target.off("workerListChanged",this._workerListChangedListener);delete this._workerListChangedListener;this.targetsByProcess.delete(this.target);this.targetsListeners.delete(this.target);}}}
module.exports={LegacyWorkersWatcher};