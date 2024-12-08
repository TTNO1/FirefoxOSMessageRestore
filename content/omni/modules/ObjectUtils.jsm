//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

"use strict";var EXPORTED_SYMBOLS=["ObjectUtils"];var pSlice=Array.prototype.slice;var ObjectUtils={deepEqual(a,b){return _deepEqual(a,b);},strict(obj){return _strict(obj);},isEmpty(obj){if(!obj){return true;}
if(typeof obj!="object"){return false;}
if(Array.isArray(obj)){return!obj.length;}
for(let key in obj){return false;}
return true;},};
function _deepEqual(a,b){if(a===b){return true;
}
let aIsDate=instanceOf(a,"Date");let bIsDate=instanceOf(b,"Date");if(aIsDate||bIsDate){if(!aIsDate||!bIsDate){return false;}
if(isNaN(a.getTime())&&isNaN(b.getTime())){return true;}
return a.getTime()===b.getTime();

}
let aIsRegExp=instanceOf(a,"RegExp");let bIsRegExp=instanceOf(b,"RegExp");if(aIsRegExp||bIsRegExp){return(aIsRegExp&&bIsRegExp&&a.source===b.source&&a.global===b.global&&a.multiline===b.multiline&&a.lastIndex===b.lastIndex&&a.ignoreCase===b.ignoreCase);}
if(typeof a!="object"||typeof b!="object"){return a==b;}





return objEquiv(a,b);}
function instanceOf(object,type){return Object.prototype.toString.call(object)=="[object "+type+"]";}
function isUndefinedOrNull(value){return value===null||value===undefined;}
function isArguments(object){return instanceOf(object,"Arguments");}
function objEquiv(a,b){if(isUndefinedOrNull(a)||isUndefinedOrNull(b)){return false;}
if((a.prototype||undefined)!=(b.prototype||undefined)){return false;}

if(isArguments(a)){if(!isArguments(b)){return false;}
a=pSlice.call(a);b=pSlice.call(b);return _deepEqual(a,b);}
let ka,kb;try{ka=Object.keys(a);kb=Object.keys(b);}catch(e){ return false;}

if(ka.length!=kb.length){return false;}
ka.sort();kb.sort();
 for(let key of ka){if(!_deepEqual(a[key],b[key])){return false;}}
return true;}
function _strict(obj){if(typeof obj!="object"){throw new TypeError("Expected an object");}
return new Proxy(obj,{get(target,name){if(name in obj){return obj[name];}
let error=new TypeError(`No such property: "${name}"`);Promise.reject(error);throw error;},});}