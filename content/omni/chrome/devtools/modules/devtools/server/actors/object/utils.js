"use strict";const{Cu}=require("chrome");const{DevToolsServer}=require("devtools/server/devtools-server");const DevToolsUtils=require("devtools/shared/DevToolsUtils");const{assert}=DevToolsUtils;loader.lazyRequireGetter(this,"LongStringActor","devtools/server/actors/string",true);loader.lazyRequireGetter(this,"symbolGrip","devtools/server/actors/object/symbol",true);loader.lazyRequireGetter(this,"ObjectActor","devtools/server/actors/object",true);loader.lazyRequireGetter(this,"EnvironmentActor","devtools/server/actors/environment",true);function getPromiseState(obj){if(obj.class!="Promise"){throw new Error("Can't call `getPromiseState` on `Debugger.Object`s that don't "+"refer to Promise objects.");}
const state={state:obj.promiseState};if(state.state==="fulfilled"){state.value=obj.promiseValue;}else if(state.state==="rejected"){state.reason=obj.promiseReason;}
return state;}
function isObjectOrFunction(value){return value&&(typeof value=="object"||typeof value=="function");}
function makeDebuggeeValueIfNeeded(obj,value){if(isObjectOrFunction(value)){return obj.makeDebuggeeValue(value);}
return value;}
function unwrapDebuggeeValue(value){if(value&&typeof value=="object"){return value.unsafeDereference();}
return value;}
function createValueGrip(value,pool,makeObjectGrip){switch(typeof value){case"boolean":return value;case"string":if(stringIsLong(value)){for(const child of pool.poolChildren()){if(child instanceof LongStringActor&&child.str==value){return child.form();}}
const actor=new LongStringActor(pool.conn,value);pool.manage(actor);return actor.form();}
return value;case"number":if(value===Infinity){return{type:"Infinity"};}else if(value===-Infinity){return{type:"-Infinity"};}else if(Number.isNaN(value)){return{type:"NaN"};}else if(!value&&1/value===-Infinity){return{type:"-0"};}
return value;case"bigint":return{type:"BigInt",text:value.toString(),};case"undefined":return{type:"undefined"};case"object":if(value===null){return{type:"null"};}else if(value.optimizedOut||value.uninitialized||value.missingArguments){
 return{type:"null",optimizedOut:value.optimizedOut,uninitialized:value.uninitialized,missingArguments:value.missingArguments,};}
return makeObjectGrip(value,pool);case"symbol":return symbolGrip(value,pool);default:assert(false,"Failed to provide a grip for: "+value);return null;}}
function stringIsLong(str){return str.length>=DevToolsServer.LONG_STRING_LENGTH;}
const TYPED_ARRAY_CLASSES=["Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array","Int8Array","Int16Array","Int32Array","Float32Array","Float64Array","BigInt64Array","BigUint64Array",];function isTypedArray(object){return TYPED_ARRAY_CLASSES.includes(object.class);}
function isArray(object){return isTypedArray(object)||object.class==="Array";}
function getArrayLength(object){if(!isArray(object)){throw new Error("Expected an array, got a "+object.class);}
if(object.class==="Array"){return DevToolsUtils.getProperty(object,"length");}

const typedProto=Object.getPrototypeOf(Uint8Array.prototype);const getter=Object.getOwnPropertyDescriptor(typedProto,"length").get;return getter.call(object.unsafeDereference());}
function isArrayIndex(str){const num=str>>>0;return(num+""===str&&num!=-1>>>0);}
function isStorage(object){return object.class==="Storage";}
function getStorageLength(object){if(!isStorage(object)){throw new Error("Expected a storage object, got a "+object.class);}
return DevToolsUtils.getProperty(object,"length");}
function getPropsForEvent(className){const positionProps=["buttons","clientX","clientY","layerX","layerY"];const eventToPropsMap={MouseEvent:positionProps,DragEvent:positionProps,PointerEvent:positionProps,SimpleGestureEvent:positionProps,WheelEvent:positionProps,KeyboardEvent:["key","charCode","keyCode"],TransitionEvent:["propertyName","pseudoElement"],AnimationEvent:["animationName","pseudoElement"],ClipboardEvent:["clipboardData"],};if(className in eventToPropsMap){return eventToPropsMap[className];}
return[];}
function getPropNamesFromObject(obj,rawObj){let names=[];try{if(isStorage(obj)){


for(let j=0;j<rawObj.length;j++){names.push(rawObj.key(j));}}else{names=obj.getOwnPropertyNames();}}catch(ex){
}
return names;}
function getSafeOwnPropertySymbols(obj){try{return obj.getOwnPropertySymbols();}catch(ex){return[];}}
function getModifiersForEvent(rawObj){const modifiers=[];const keysToModifiersMap={altKey:"Alt",ctrlKey:"Control",metaKey:"Meta",shiftKey:"Shift",};for(const key in keysToModifiersMap){if(keysToModifiersMap.hasOwnProperty(key)&&rawObj[key]){modifiers.push(keysToModifiersMap[key]);}}
return modifiers;}
function makeDebuggeeValue(targetActor,value){if(isObject(value)){try{const global=Cu.getGlobalForObject(value);const dbgGlobal=targetActor.dbg.makeGlobalObjectReference(global);return dbgGlobal.makeDebuggeeValue(value);}catch(ex){
}}
const dbgGlobal=targetActor.dbg.makeGlobalObjectReference(targetActor.window||targetActor.workerGlobal);return dbgGlobal.makeDebuggeeValue(value);}
function isObject(value){return Object(value)===value;}
function createStringGrip(targetActor,string){if(string&&stringIsLong(string)){const actor=new LongStringActor(targetActor.conn,string);targetActor.manage(actor);return actor.form();}
return string;}
function createValueGripForTarget(targetActor,value,depth=0){return createValueGrip(value,targetActor,createObjectGrip.bind(null,targetActor,depth));}
function createEnvironmentActor(environment,targetActor){if(!environment){return undefined;}
if(environment.actor){return environment.actor;}
const actor=new EnvironmentActor(environment,targetActor);targetActor.manage(actor);environment.actor=actor;return actor;}
function createObjectGrip(targetActor,depth,object,pool){let gripDepth=depth;const actor=new ObjectActor(object,{thread:targetActor.threadActor,getGripDepth:()=>gripDepth,incrementGripDepth:()=>gripDepth++,decrementGripDepth:()=>gripDepth--,createValueGrip:v=>createValueGripForTarget(targetActor,v,gripDepth),createEnvironmentActor:env=>createEnvironmentActor(env,targetActor),},targetActor.conn);pool.manage(actor);return actor.form();}
module.exports={getPromiseState,makeDebuggeeValueIfNeeded,unwrapDebuggeeValue,createValueGrip,stringIsLong,isTypedArray,isArray,isStorage,getArrayLength,getStorageLength,isArrayIndex,getPropsForEvent,getPropNamesFromObject,getSafeOwnPropertySymbols,getModifiersForEvent,isObjectOrFunction,createStringGrip,makeDebuggeeValue,createValueGripForTarget,};