"use strict";var{Actor}=require("devtools/shared/protocol/Actor");var{lazyLoadSpec,lazyLoadFront}=require("devtools/shared/specs/index");var types=Object.create(null);exports.types=types;var registeredTypes=(types.registeredTypes=new Map());exports.registeredTypes=registeredTypes;types.getType=function(type){if(!type){return types.Primitive;}
if(typeof type!=="string"){return type;}
let reg=registeredTypes.get(type);if(reg){return reg;}
if(lazyLoadSpec(type)){
reg=registeredTypes.get(type);if(reg){return reg;}}
const sep=type.indexOf(":");if(sep>=0){const collection=type.substring(0,sep);const subtype=types.getType(type.substring(sep+1));if(collection==="array"){return types.addArrayType(subtype);}else if(collection==="nullable"){return types.addNullableType(subtype);}
throw Error("Unknown collection type: "+collection);} 
const pieces=type.split("#",2);if(pieces.length>1){if(pieces[1]!="actorid"){throw new Error("Unsupported detail, only support 'actorid', got: "+pieces[1]);}
return types.addActorDetail(type,pieces[0],pieces[1]);}
throw Error("Unknown type: "+type);};function identityWrite(v){if(v===undefined){throw Error("undefined passed where a value is required");}

if(v&&typeof v.next==="function"){return[...v];}
return v;}
types.addType=function(name,typeObject={},options={}){if(registeredTypes.has(name)){throw Error("Type '"+name+"' already exists.");}
const type=Object.assign({toString(){return"[protocol type:"+name+"]";},name:name,primitive:!(typeObject.read||typeObject.write),read:identityWrite,write:identityWrite,},typeObject);registeredTypes.set(name,type);return type;};types.removeType=function(name){
const type=registeredTypes.get(name);type.name="DEFUNCT:"+name;type.category="defunct";type.primitive=false;type.read=type.write=function(){throw new Error("Using defunct type: "+name);};registeredTypes.delete(name);};types.addArrayType=function(subtype){subtype=types.getType(subtype);const name="array:"+subtype.name;if(subtype.primitive){return types.addType(name);}
return types.addType(name,{category:"array",read:(v,ctx)=>{if(v&&typeof v.next==="function"){v=[...v];}
return v.map(i=>subtype.read(i,ctx));},write:(v,ctx)=>{if(v&&typeof v.next==="function"){v=[...v];}
return v.map(i=>subtype.write(i,ctx));},});};types.addDictType=function(name,specializations){const specTypes={};for(const prop in specializations){try{specTypes[prop]=types.getType(specializations[prop]);}catch(e){

loader.lazyGetter(specTypes,prop,()=>{return types.getType(specializations[prop]);});}}
return types.addType(name,{category:"dict",specializations,read:(v,ctx)=>{const ret={};for(const prop in v){if(prop in specTypes){ret[prop]=specTypes[prop].read(v[prop],ctx);}else{ret[prop]=v[prop];}}
return ret;},write:(v,ctx)=>{const ret={};for(const prop in v){if(prop in specTypes){ret[prop]=specTypes[prop].write(v[prop],ctx);}else{ret[prop]=v[prop];}}
return ret;},});};types.addActorType=function(name){ if(registeredTypes.has(name)){return registeredTypes.get(name);}
const type=types.addType(name,{_actor:true,category:"actor",read:(v,ctx,detail)=>{
if(ctx instanceof Actor){return ctx.conn.getActor(v);}


const actorID=typeof v==="string"?v:v.actor; let front=ctx.conn.getFrontByID(actorID);

let form=null;if(detail!="actorid"){form=identityWrite(v);}
if(!front){
if(!type.frontClass){lazyLoadFront(name);}
const parentFront=ctx.marshallPool();const targetFront=parentFront.targetFront;
const Class=type.frontClass;front=new Class(ctx.conn,targetFront,parentFront);front.actorID=actorID;parentFront.manage(front,form,ctx);}else if(form){front.form(form,ctx);}
return front;},write:(v,ctx,detail)=>{
if(v instanceof Actor){if(!v.actorID){ctx.marshallPool().manage(v);}
if(detail=="actorid"){return v.actorID;}
return identityWrite(v.form(detail));}
return v.actorID;},});return type;};types.addPolymorphicType=function(name,subtypes){for(const subTypeName of subtypes){const subtype=types.getType(subTypeName);if(subtype.category!="actor"){throw new Error(`In polymorphic type '${subtypes.join(
          ","
        )}', the type '${subTypeName}' isn't an actor`);}}
return types.addType(name,{category:"polymorphic",read:(value,ctx)=>{
 const actorID=typeof value==="string"?value:value.actor;if(!actorID){throw new Error(`Was expecting one of these actors '${subtypes}' but instead got value: '${value}'`);}

const typeName=actorID.match(/\.([a-zA-Z]+)\d+$/)[1];if(!subtypes.includes(typeName)){throw new Error(`Was expecting one of these actors '${subtypes}' but instead got an actor of type: '${typeName}'`);}
const subtype=types.getType(typeName);return subtype.read(value,ctx);},write:(value,ctx)=>{if(!value){throw new Error(`Was expecting one of these actors '${subtypes}' but instead got an empty value.`);}
const typeName=value.typeName;if(!typeName){throw new Error(`Was expecting one of these actors '${subtypes}' but instead got value: '${value}'. Did you pass a form instead of an Actor?`);}
if(!subtypes.includes(typeName)){throw new Error(`Was expecting one of these actors '${subtypes}' but instead got an actor of type: '${typeName}'`);}
const subtype=types.getType(typeName);return subtype.write(value,ctx);},});};types.addNullableType=function(subtype){subtype=types.getType(subtype);return types.addType("nullable:"+subtype.name,{category:"nullable",read:(value,ctx)=>{if(value==null){return value;}
return subtype.read(value,ctx);},write:(value,ctx)=>{if(value==null){return value;}
return subtype.write(value,ctx);},});};types.addActorDetail=function(name,actorType,detail){actorType=types.getType(actorType);if(!actorType._actor){throw Error(`Details only apply to actor types, tried to add detail '${detail}' `+`to ${actorType.name}`);}
return types.addType(name,{_actor:true,category:"detail",read:(v,ctx)=>actorType.read(v,ctx,detail),write:(v,ctx)=>actorType.write(v,ctx,detail),});};types.Primitive=types.addType("primitive");types.String=types.addType("string");types.Number=types.addType("number");types.Boolean=types.addType("boolean");types.JSON=types.addType("json");exports.registerFront=function(cls){const{typeName}=cls.prototype;if(!registeredTypes.has(typeName)){types.addActorType(typeName);}
registeredTypes.get(typeName).frontClass=cls;};function createFront(client,typeName,target=null){const type=types.getType(typeName);if(!type){throw new Error(`No spec for front type '${typeName}'.`);}else if(!type.frontClass){lazyLoadFront(typeName);}

const Class=type.frontClass;return new Class(client,target,target);}
async function getFront(client,typeName,form,target=null){const front=createFront(client,typeName,target);const{formAttributeName}=front;if(!formAttributeName){throw new Error(`Can't find the form attribute name for ${typeName}`);} 
front.actorID=form[formAttributeName];if(!front.actorID){throw new Error(`Can't find the actor ID for ${typeName} from root or target`+` actor's form.`);}
if(!target){await front.manage(front);}else{await target.manage(front);}
return front;}
exports.getFront=getFront;function createRootFront(client,packet){const rootFront=createFront(client,"root");rootFront.form(packet);rootFront.manage(rootFront);return rootFront;}
exports.createRootFront=createRootFront;