"use strict";const protocol=require("devtools/shared/protocol");const{symbolSpec}=require("devtools/shared/specs/symbol");loader.lazyRequireGetter(this,"createValueGrip","devtools/server/actors/object/utils",true);const SymbolActor=protocol.ActorClassWithSpec(symbolSpec,{initialize(conn,symbol){protocol.Actor.prototype.initialize.call(this,conn);this.symbol=symbol;},rawValue:function(){return this.symbol;},destroy:function(){

this._releaseActor();protocol.Actor.prototype.destroy.call(this);},form:function(){const form={type:this.typeName,actor:this.actorID,};const name=getSymbolName(this.symbol);if(name!==undefined){form.name=createValueGrip(name,this.getParent());}
return form;},release:function(){

this._releaseActor();this.destroy();return{};},_releaseActor:function(){const parent=this.getParent();if(parent&&parent.symbolActors){delete parent.symbolActors[this.symbol];}},});const symbolProtoToString=Symbol.prototype.toString;function getSymbolName(symbol){const name=symbolProtoToString.call(symbol).slice("Symbol(".length,-1);return name||undefined;}
function symbolGrip(sym,pool){if(!pool.symbolActors){pool.symbolActors=Object.create(null);}
if(sym in pool.symbolActors){return pool.symbolActors[sym].form();}
const actor=new SymbolActor(pool.conn,sym);pool.manage(actor);pool.symbolActors[sym]=actor;return actor.form();}
module.exports={SymbolActor,symbolGrip,};