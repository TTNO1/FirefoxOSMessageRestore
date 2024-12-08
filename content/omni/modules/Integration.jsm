//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["Integration"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const gIntegrationPoints=new Map();var Integration=new Proxy({},{get(target,name){let integrationPoint=gIntegrationPoints.get(name);if(!integrationPoint){integrationPoint=new IntegrationPoint();gIntegrationPoints.set(name,integrationPoint);}
return integrationPoint;},});var IntegrationPoint=function(){this._overrideFns=new Set();this._combined={ QueryInterface(){let ex=new Components.Exception("Integration objects should not be used with XPCOM because"+" they change when new overrides are registered.",Cr.NS_ERROR_NO_INTERFACE);Cu.reportError(ex);throw ex;},};};IntegrationPoint.prototype={_overrideFns:null,_combined:null,_combinedIsCurrent:false,register(overrideFn){this._overrideFns.add(overrideFn);this._combinedIsCurrent=false;},unregister(overrideFn){this._overrideFns.delete(overrideFn);this._combinedIsCurrent=false;},getCombined(root){if(this._combinedIsCurrent){return this._combined;}


let overrideFnArray=[...this._overrideFns,()=>this._combined];let combined=root;for(let overrideFn of overrideFnArray){try{
let override=overrideFn(combined);

let descriptors={};for(let name of Object.getOwnPropertyNames(override)){descriptors[name]=Object.getOwnPropertyDescriptor(override,name);}
combined=Object.create(combined,descriptors);}catch(ex){Cu.reportError(ex);}}
this._combinedIsCurrent=true;return(this._combined=combined);},defineModuleGetter(targetObject,name,moduleUrl,symbol){let moduleHolder={};XPCOMUtils.defineLazyModuleGetter(moduleHolder,name,moduleUrl,symbol);Object.defineProperty(targetObject,name,{get:()=>this.getCombined(moduleHolder[name]),configurable:true,enumerable:true,});},};