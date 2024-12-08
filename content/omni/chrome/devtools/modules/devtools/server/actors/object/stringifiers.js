"use strict";const DevToolsUtils=require("devtools/shared/DevToolsUtils");loader.lazyRequireGetter(this,"ObjectUtils","devtools/server/actors/object/utils");function stringify(obj){if(!DevToolsUtils.isSafeDebuggerObject(obj)){const unwrapped=DevToolsUtils.unwrap(obj);if(unwrapped===undefined){return"<invisibleToDebugger>";}else if(unwrapped.isProxy){return"<proxy>";}

return"[object "+obj.class+"]";}else if(obj.class=="DeadObject"){return"<dead object>";}
const stringifier=stringifiers[obj.class]||stringifiers.Object;try{return stringifier(obj);}catch(e){DevToolsUtils.reportException("stringify",e);return"<failed to stringify object>";}}
function createBuiltinStringifier(ctor){return obj=>{try{return ctor.prototype.toString.call(obj.unsafeDereference());}catch(err){

return"[object "+obj.class+"]";}};}
function errorStringify(obj){let name=DevToolsUtils.getProperty(obj,"name");if(name===""||name===undefined){name=obj.class;}else if(isObject(name)){name=stringify(name);}
let message=DevToolsUtils.getProperty(obj,"message");if(isObject(message)){message=stringify(message);}
if(message===""||message===undefined){return name;}
return name+": "+message;}
var seen=null;var stringifiers={Error:errorStringify,EvalError:errorStringify,RangeError:errorStringify,ReferenceError:errorStringify,SyntaxError:errorStringify,TypeError:errorStringify,URIError:errorStringify,Boolean:createBuiltinStringifier(Boolean),Function:createBuiltinStringifier(Function),Number:createBuiltinStringifier(Number),RegExp:createBuiltinStringifier(RegExp),String:createBuiltinStringifier(String),Object:obj=>"[object "+obj.class+"]",Array:obj=>{
const topLevel=!seen;if(topLevel){seen=new Set();}else if(seen.has(obj)){return"";}
seen.add(obj);const len=ObjectUtils.getArrayLength(obj);let string="";for(let i=0;i<len;i++){const desc=obj.getOwnPropertyDescriptor(i);if(desc){const{value}=desc;if(value!=null){string+=isObject(value)?stringify(value):value;}}
if(i<len-1){string+=",";}}
if(topLevel){seen=null;}
return string;},DOMException:obj=>{const message=DevToolsUtils.getProperty(obj,"message")||"<no message>";const result=(+DevToolsUtils.getProperty(obj,"result")).toString(16);const code=DevToolsUtils.getProperty(obj,"code");const name=DevToolsUtils.getProperty(obj,"name")||"<unknown>";return('[Exception... "'+
message+'" '+'code: "'+
code+'" '+'nsresult: "0x'+
result+" ("+
name+')"]');},Promise:obj=>{const{state,value,reason}=ObjectUtils.getPromiseState(obj);let statePreview=state;if(state!="pending"){const settledValue=state==="fulfilled"?value:reason;statePreview+=": "+
(typeof settledValue==="object"&&settledValue!==null?stringify(settledValue):settledValue);}
return"Promise ("+statePreview+")";},};function isObject(value){const type=typeof value;return type=="object"?value!==null:type=="function";}
module.exports=stringify;