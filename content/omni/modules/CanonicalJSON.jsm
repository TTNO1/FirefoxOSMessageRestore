//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["CanonicalJSON"];var CanonicalJSON={stringify:function stringify(source,jsescFn){if(typeof jsescFn!="function"){const{jsesc}=ChromeUtils.import("resource://gre/modules/third_party/jsesc/jsesc.js");jsescFn=jsesc;}
if(Array.isArray(source)){const jsonArray=source.map(x=>(typeof x==="undefined"?null:x));return("["+jsonArray.map(item=>stringify(item,jsescFn)).join(",")+"]");}
if(typeof source==="number"){if(source===0){return Object.is(source,-0)?"-0":"0";}}
const toJSON=input=>jsescFn(input,{lowercaseHex:true,json:true});if(typeof source!=="object"||source===null){return toJSON(source);}
const sortedKeys=Object.keys(source).sort();const lastIndex=sortedKeys.length-1;return(sortedKeys.reduce((serial,key,index)=>{const value=source[key];if(typeof value==="undefined"){return serial;}
const jsonValue=value&&value.toJSON?value.toJSON():value;const suffix=index!==lastIndex?",":"";const escapedKey=toJSON(key);return(serial+escapedKey+":"+stringify(jsonValue,jsescFn)+suffix);},"{")+"}");},};