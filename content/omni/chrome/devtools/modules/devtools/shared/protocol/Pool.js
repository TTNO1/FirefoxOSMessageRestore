"use strict";var EventEmitter=require("devtools/shared/event-emitter");class Pool extends EventEmitter{constructor(conn,label){super();if(conn){this.conn=conn;}
this.label=label;this.__poolMap=null;}
getParent(){return this.conn.poolFor(this.actorID);}
isTopPool(){const parent=this.getParent();return!parent||parent===this;}
poolFor(actorID){return this.conn.poolFor(actorID);}
marshallPool(){return this;}
get _poolMap(){if(this.__poolMap){return this.__poolMap;}
this.__poolMap=new Map();this.conn.addActorPool(this);return this.__poolMap;}
manage(actor){if(!actor.actorID){actor.actorID=this.conn.allocID(actor.typeName);}else{
 const parent=actor.getParent();if(parent){parent.unmanage(actor);}}
this._poolMap.set(actor.actorID,actor);}
unmanageChildren(FrontType){for(const front of this.poolChildren()){if(!FrontType||front instanceof FrontType){this.unmanage(front);}}}
unmanage(actor){this.__poolMap&&this.__poolMap.delete(actor.actorID);}
has(actorID){return this.__poolMap&&this._poolMap.has(actorID);}
getActorByID(actorID){if(this.__poolMap){return this._poolMap.get(actorID);}
return null;}
*poolChildren(){if(!this.__poolMap){return;}
for(const actor of this.__poolMap.values()){if(actor===this){continue;}
yield actor;}}
skipDestroy(){return false;}
destroy(){const parent=this.getParent();if(parent){parent.unmanage(this);}
if(!this.__poolMap){return;}
for(const actor of this.__poolMap.values()){if(actor===this){continue;}

if(typeof actor.skipDestroy==="function"&&actor.skipDestroy()){continue;}
const destroy=actor.destroy;if(destroy){
actor.destroy=null;destroy.call(actor);actor.destroy=destroy;}}
this.conn.removeActorPool(this);this.__poolMap.clear();this.__poolMap=null;}}
exports.Pool=Pool;