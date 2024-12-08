"use strict";var USERSCRIPT_PREFNAME="extensions.webextensions.userScripts.enabled";var USERSCRIPT_DISABLED_ERRORMSG=`userScripts APIs are currently experimental and must be enabled with the ${USERSCRIPT_PREFNAME} preference.`;ChromeUtils.defineModuleGetter(this,"Schemas","resource://gre/modules/Schemas.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"userScriptsEnabled",USERSCRIPT_PREFNAME,false);var{ExtensionError}=ExtensionUtils;const TYPEOF_PRIMITIVES=["bigint","boolean","number","string","symbol"];class UserScript{constructor({context,metadata,scriptSandbox}){this.context=context;this.extension=context.extension;this.apiSandbox=context.cloneScope;this.metadata=metadata;this.scriptSandbox=scriptSandbox;this.ScriptError=scriptSandbox.Error;this.ScriptPromise=scriptSandbox.Promise;}
api(){return{metadata:this.metadata,defineGlobals:sourceObject=>this.defineGlobals(sourceObject),export:value=>this.export(value),};}
defineGlobals(sourceObject){let className;try{className=ChromeUtils.getClassName(sourceObject,true);}catch(e){}
if(className!=="Object"){throw new this.context.Error("Invalid sourceObject type, plain object expected.");}
this.exportLazyGetters(sourceObject,this.scriptSandbox);}
export(valueToExport,privateOptions={}){const ExportError=privateOptions.Error||this.context.Error;if(this.canAccess(valueToExport,this.scriptSandbox)){
return valueToExport;}
let className;try{className=ChromeUtils.getClassName(valueToExport,true);}catch(e){}
if(className==="Function"){return this.wrapFunction(valueToExport);}
if(className==="Object"){return this.exportLazyGetters(valueToExport);}
if(className==="Array"){return this.exportArray(valueToExport);}
let valueType=className||typeof valueToExport;throw new ExportError(privateOptions.errorMessage||`${valueType} cannot be exported to the userScript`);}
exportArray(srcArray){const destArray=Cu.cloneInto([],this.scriptSandbox);for(let[idx,value]of this.shallowCloneEntries(srcArray)){destArray[idx]=this.export(value,{errorMessage:`Error accessing disallowed element at index "${idx}"`,Error:this.UserScriptError,});}
return destArray;}
exportLazyGetters(src,dest=undefined){dest=dest||Cu.createObjectIn(this.scriptSandbox);for(let[key,value]of this.shallowCloneEntries(src)){Schemas.exportLazyGetter(dest,key,()=>{return this.export(value,{

Error:this.ScriptError,errorMessage:`Error accessing disallowed property "${key}"`,});});}
return dest;}
wrapFunction(fn){return Cu.exportFunction((...args)=>{let res;try{
for(let arg of args){if(!this.canAccess(arg,this.apiSandbox)){throw new this.ScriptError(`Parameter not accessible to the userScript API`);}}
res=fn(...args);}catch(err){this.handleAPIScriptError(err);}
if(!Cu.isProxy(res)&&res instanceof this.context.Promise){return this.ScriptPromise.resolve().then(async()=>{let value;try{value=await res;}catch(err){this.handleAPIScriptError(err);}
return this.ensureAccessible(value);});}
return this.ensureAccessible(res);},this.scriptSandbox);}
*shallowCloneEntries(obj){const clonedObj=ChromeUtils.shallowClone(obj);for(let entry of Object.entries(clonedObj)){yield entry;}}
canAccess(val,targetScope){if(val==null||TYPEOF_PRIMITIVES.includes(typeof val)){return true;}

try{const targetPrincipal=Cu.getObjectPrincipal(targetScope);if(!targetPrincipal.subsumes(Cu.getObjectPrincipal(val))){return false;}}catch(err){Cu.reportError(err);return false;}
return true;}
ensureAccessible(res){if(this.canAccess(res,this.scriptSandbox)){return res;}
throw new this.ScriptError("Return value not accessible to the userScript");}
handleAPIScriptError(err){if(this.canAccess(err,this.scriptSandbox)){throw err;}

try{const debugName=this.extension.policy.debugName;Cu.reportError(`An unexpected apiScript error occurred for '${debugName}': ${err} :: ${err.stack}`);}catch(e){}
throw new this.ScriptError(`An unexpected apiScript error occurred`);}}
this.userScriptsContent=class extends ExtensionAPI{getAPI(context){return{userScripts:{onBeforeScript:new EventManager({context,name:"userScripts.onBeforeScript",register:fire=>{if(!userScriptsEnabled){throw new ExtensionError(USERSCRIPT_DISABLED_ERRORMSG);}
let handler=(event,metadata,scriptSandbox,eventResult)=>{const us=new UserScript({context,metadata,scriptSandbox,});const apiObj=Cu.cloneInto(us.api(),context.cloneScope,{cloneFunctions:true,});Object.defineProperty(apiObj,"global",{value:scriptSandbox,enumerable:true,configurable:true,writable:true,});fire.raw(apiObj);};context.userScriptsEvents.on("on-before-script",handler);return()=>{context.userScriptsEvents.off("on-before-script",handler);};},}).api(),},};}};