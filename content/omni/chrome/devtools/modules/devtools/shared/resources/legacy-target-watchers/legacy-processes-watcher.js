"use strict";class LegacyProcessesWatcher{constructor(targetList,onTargetAvailable,onTargetDestroyed){this.targetList=targetList;this.rootFront=targetList.rootFront;this.target=targetList.targetFront;this.onTargetAvailable=onTargetAvailable;this.onTargetDestroyed=onTargetDestroyed;this.descriptors=new Set();this._processListChanged=this._processListChanged.bind(this);}
async _processListChanged(){if(this.targetList.isDestroyed()){return;}
const processes=await this.rootFront.listProcesses();
 for(const descriptor of this.descriptors){if(!processes.includes(descriptor)){

const target=descriptor.getCachedTarget();if(target){this.onTargetDestroyed(target);}
descriptor.destroy();this.descriptors.delete(descriptor);}}
const promises=processes.filter(descriptor=>!this.descriptors.has(descriptor)).map(async descriptor=>{ this.descriptors.add(descriptor);const target=await descriptor.getTarget();if(!target){console.error("Wasn't able to retrieve the target for",descriptor.actorID);return;}
await this.onTargetAvailable(target);});await Promise.all(promises);}
async listen(){this.rootFront.on("processListChanged",this._processListChanged);await this._processListChanged();}
unlisten(){this.rootFront.off("processListChanged",this._processListChanged);}}
module.exports={LegacyProcessesWatcher};