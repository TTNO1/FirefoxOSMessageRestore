//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";ChromeUtils.defineModuleGetter(this,"AsyncShutdown","resource://gre/modules/AsyncShutdown.jsm");var PropertyBagConverter={ toObject(bag){if(!(bag instanceof Ci.nsIPropertyBag)){throw new TypeError("Not a property bag");}
let result={};for(let{name,value:property}of bag.enumerator){let value=this.toValue(property);result[name]=value;}
return result;},toValue(property){if(typeof property!="object"){return property;}
if(Array.isArray(property)){return property.map(this.toValue,this);}
if(property&&property instanceof Ci.nsIPropertyBag){return this.toObject(property);}
return property;}, fromObject(obj){if(obj==null||typeof obj!="object"){throw new TypeError("Invalid object: "+obj);}
let bag=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);for(let k of Object.keys(obj)){let value=this.fromValue(obj[k]);bag.setProperty(k,value);}
return bag;},fromValue(value){if(typeof value=="function"){return null;}
if(Array.isArray(value)){return value.map(this.fromValue,this);}
if(value==null||typeof value!="object"){ return value;}
return this.fromObject(value);},};function nsAsyncShutdownClient(moduleClient){if(!moduleClient){throw new TypeError("nsAsyncShutdownClient expects one argument");}
this._moduleClient=moduleClient;this._byName=new Map();}
nsAsyncShutdownClient.prototype={_getPromisified(xpcomBlocker){let candidate=this._byName.get(xpcomBlocker.name);if(!candidate){return null;}
if(candidate.xpcom===xpcomBlocker){return candidate.jsm;}
return null;},_setPromisified(xpcomBlocker,moduleBlocker){let candidate=this._byName.get(xpcomBlocker.name);if(!candidate){this._byName.set(xpcomBlocker.name,{xpcom:xpcomBlocker,jsm:moduleBlocker,});return;}
if(candidate.xpcom===xpcomBlocker){return;}
throw new Error("We have already registered a distinct blocker with the same name: "+
xpcomBlocker.name);},_deletePromisified(xpcomBlocker){let candidate=this._byName.get(xpcomBlocker.name);if(!candidate||candidate.xpcom!==xpcomBlocker){return false;}
this._byName.delete(xpcomBlocker.name);return true;},get jsclient(){return this._moduleClient;},get name(){return this._moduleClient.name;},addBlocker(xpcomBlocker,fileName,lineNumber,stack){





let moduleBlocker=this._getPromisified(xpcomBlocker);if(!moduleBlocker){moduleBlocker=()=>new Promise(

()=>xpcomBlocker.blockShutdown(this));this._setPromisified(xpcomBlocker,moduleBlocker);}
this._moduleClient.addBlocker(xpcomBlocker.name,moduleBlocker,{fetchState:()=>{let state=xpcomBlocker.state;if(state){return PropertyBagConverter.toValue(state);}
return null;},filename:fileName,lineNumber,stack,});},removeBlocker(xpcomBlocker){let moduleBlocker=this._getPromisified(xpcomBlocker);if(!moduleBlocker){return false;}
this._deletePromisified(xpcomBlocker);return this._moduleClient.removeBlocker(moduleBlocker);},QueryInterface:ChromeUtils.generateQI(["nsIAsyncShutdownBarrier"]),};function nsAsyncShutdownBarrier(moduleBarrier){this._client=new nsAsyncShutdownClient(moduleBarrier.client);this._moduleBarrier=moduleBarrier;}
nsAsyncShutdownBarrier.prototype={get state(){return PropertyBagConverter.fromValue(this._moduleBarrier.state);},get client(){return this._client;},wait(onReady){this._moduleBarrier.wait().then(()=>{onReady.done();});},QueryInterface:ChromeUtils.generateQI(["nsIAsyncShutdownBarrier"]),};function nsAsyncShutdownService(){ for(let _k of["profileBeforeChange","profileChangeTeardown","quitApplicationGranted","sendTelemetry","contentChildShutdown","webWorkersShutdown","xpcomWillShutdown",]){let k=_k;Object.defineProperty(this,k,{configurable:true,get(){delete this[k];let wrapped=AsyncShutdown[k];let result=wrapped?new nsAsyncShutdownClient(wrapped):undefined;Object.defineProperty(this,k,{value:result,});return result;},});} 
this.wrappedJSObject={_propertyBagConverter:PropertyBagConverter,};}
nsAsyncShutdownService.prototype={makeBarrier(name){return new nsAsyncShutdownBarrier(new AsyncShutdown.Barrier(name));},QueryInterface:ChromeUtils.generateQI(["nsIAsyncShutdownService"]),};var EXPORTED_SYMBOLS=["nsAsyncShutdownService"];