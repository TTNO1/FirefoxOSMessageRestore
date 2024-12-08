"use strict";const{extend}=require("devtools/shared/extend");const{Pool}=require("devtools/shared/protocol");function LazyPool(conn){this.conn=conn;}
LazyPool.prototype=extend(Pool.prototype,{ getActorByID:function(actorID){if(this.__poolMap){const entry=this._poolMap.get(actorID);if(entry instanceof LazyActor){return entry.createActor();}
return entry;}
return null;},});exports.LazyPool=LazyPool;function createExtraActors(registeredActors,pool,parent){const nameMap={};for(const name in registeredActors){let actor=parent._extraActors[name];if(!actor){actor=new LazyActor(registeredActors[name],parent,pool);parent._extraActors[name]=actor;}
if(!pool.has(actor.actorID)){pool.manage(actor);}
nameMap[name]=actor.actorID;}
return nameMap;}
exports.createExtraActors=createExtraActors;function LazyActor(factory,parent,pool){this._options=factory.options;this._parentActor=parent;this._name=factory.name;this._pool=pool; this.typeName=factory.name;}
LazyActor.prototype={loadModule(id){const options=this._options;try{return require(id);}catch(e){throw new Error(`Unable to load actor module '${options.id}'\n${e.message}\n${e.stack}\n`);}},getConstructor(){const options=this._options;if(options.constructorFun){ return options.constructorFun;}


this.name=options.constructorName;const module=this.loadModule(options.id);const constructor=module[options.constructorName];if(!constructor){throw new Error(`Unable to find actor constructor named '${this.name}'. (Is it exported?)`);}
return constructor;},getParent:function(){return this.conn&&this.conn.poolFor(this.actorID);},destroy(){const parent=this.getParent();if(parent){parent.unmanage(this);}},createActor(){ const Constructor=this.getConstructor(); const conn=this._parentActor.conn; const instance=new Constructor(conn,this._parentActor);instance.conn=conn;

instance.actorID=this.actorID;this._pool.manage(instance);return instance;},};