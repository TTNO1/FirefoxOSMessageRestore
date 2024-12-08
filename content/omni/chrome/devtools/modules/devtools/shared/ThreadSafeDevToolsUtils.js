"use strict";exports.immutableUpdate=function(...objs){return Object.freeze(Object.assign({},...objs));};exports.update=function update(target,...args){for(const attrs of args){for(const key in attrs){const desc=Object.getOwnPropertyDescriptor(attrs,key);if(desc){Object.defineProperty(target,key,desc);}}}
return target;};exports.values=function values(object){return Object.keys(object).map(k=>object[k]);};exports.reportException=function reportException(who,exception){const msg=`${who} threw an exception: ${exports.safeErrorString(
    exception
  )}`;dump(msg+"\n");if(typeof console!=="undefined"&&console&&console.error){console.error(exception);}};exports.makeInfallible=function(handler,name=handler.name){return function(){try{return handler.apply(this,arguments);}catch(ex){let who="Handler function";if(name){who+=" "+name;}
exports.reportException(who,ex);return undefined;}};};exports.safeErrorString=function(error){try{let errorString=error.toString();if(typeof errorString=="string"){
try{if(error.stack){const stack=error.stack.toString();if(typeof stack=="string"){errorString+="\nStack: "+stack;}}}catch(ee){}
if(typeof error.lineNumber=="number"&&typeof error.columnNumber=="number"){errorString+="Line: "+error.lineNumber+", column: "+error.columnNumber;}
return errorString;}}catch(ee){}
return Object.prototype.toString.call(error);};exports.zip=function(a,b){if(!b){return a;}
if(!a){return b;}
const pairs=[];for(let i=0,aLength=a.length,bLength=b.length;i<aLength||i<bLength;i++){pairs.push([a[i],b[i]]);}
return pairs;};exports.entries=function entries(obj){return Object.keys(obj).map(k=>[k,obj[k]]);};exports.toObject=function(arr){const obj={};for(const[k,v]of arr){obj[k]=v;}
return obj;};exports.compose=function compose(...funcs){return(...args)=>{const initialValue=funcs[funcs.length-1](...args);const leftFuncs=funcs.slice(0,-1);return leftFuncs.reduceRight((composed,f)=>f(composed),initialValue);};};exports.isGenerator=function(fn){if(typeof fn!=="function"){return false;}
const proto=Object.getPrototypeOf(fn);if(!proto){return false;}
const ctor=proto.constructor;if(!ctor){return false;}
return ctor.name=="GeneratorFunction";};exports.isAsyncFunction=function(fn){if(typeof fn!=="function"){return false;}
const proto=Object.getPrototypeOf(fn);if(!proto){return false;}
const ctor=proto.constructor;if(!ctor){return false;}
return ctor.name=="AsyncFunction";};exports.isPromise=function(p){return p&&typeof p.then==="function";};exports.isSavedFrame=function(thing){return Object.prototype.toString.call(thing)==="[object SavedFrame]";};exports.isSet=function(thing){return Object.prototype.toString.call(thing)==="[object Set]";};exports.flatten=function(lists){return Array.prototype.concat.apply([],lists);};exports.settleAll=values=>{if(values===null||typeof values[Symbol.iterator]!="function"){throw new Error("settleAll() expects an iterable.");}
return new Promise((resolve,reject)=>{values=Array.isArray(values)?values:[...values];let countdown=values.length;const resolutionValues=new Array(countdown);let rejectionValue;let rejectionOccurred=false;if(!countdown){resolve(resolutionValues);return;}
function checkForCompletion(){if(--countdown>0){return;}
if(!rejectionOccurred){resolve(resolutionValues);}else{reject(rejectionValue);}}
for(let i=0;i<values.length;i++){const index=i;const value=values[i];const resolver=result=>{resolutionValues[index]=result;checkForCompletion();};const rejecter=error=>{if(!rejectionOccurred){rejectionValue=error;rejectionOccurred=true;}
checkForCompletion();};if(value&&typeof value.then=="function"){value.then(resolver,rejecter);}else{resolver(value);}}});};