//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["ExtensionActivityLog"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");ChromeUtils.defineModuleGetter(this,"ExtensionParent","resource://gre/modules/ExtensionParent.jsm");XPCOMUtils.defineLazyGetter(this,"tabTracker",()=>{return ExtensionParent.apiManager.global.tabTracker;});var{DefaultMap}=ExtensionUtils;const MSG_SET_ENABLED="Extension:ActivityLog:SetEnabled";const MSG_LOG="Extension:ActivityLog:DoLog";const ExtensionActivityLog={initialized:false,listeners:new DefaultMap(()=>new Set()),watchedIds:new Set(),init(){if(this.initialized){return;}
this.initialized=true;Services.ppmm.sharedData.set("extensions/logging",this.watchedIds);Services.ppmm.addMessageListener(MSG_LOG,this);},log(id,viewType,type,name,data,timeStamp){if(!this.initialized){return;}
let callbacks=this.listeners.get(id);if(callbacks){if(!timeStamp){timeStamp=new Date();}
for(let callback of callbacks){try{callback({id,viewType,timeStamp,type,name,data});}catch(e){Cu.reportError(e);}}}},addListener(id,callback){this.init();let callbacks=this.listeners.get(id);if(callbacks.size===0){this.watchedIds.add(id);Services.ppmm.sharedData.set("extensions/logging",this.watchedIds);Services.ppmm.sharedData.flush();Services.ppmm.broadcastAsyncMessage(MSG_SET_ENABLED,{id,value:true});}
callbacks.add(callback);},removeListener(id,callback){let callbacks=this.listeners.get(id);if(callbacks.size>0){callbacks.delete(callback);if(callbacks.size===0){this.watchedIds.delete(id);Services.ppmm.sharedData.set("extensions/logging",this.watchedIds);Services.ppmm.sharedData.flush();Services.ppmm.broadcastAsyncMessage(MSG_SET_ENABLED,{id,value:false,});}}},receiveMessage({name,data}){if(name===MSG_LOG){let{viewType,browsingContextId}=data;if(browsingContextId&&(!viewType||viewType=="tab")){let browser=BrowsingContext.get(browsingContextId).top.embedderElement;let browserData=tabTracker.getBrowserData(browser);if(browserData&&browserData.tabId!==undefined){data.data.tabId=browserData.tabId;}}
this.log(data.id,data.viewType,data.type,data.name,data.data,new Date(data.timeStamp));}},};