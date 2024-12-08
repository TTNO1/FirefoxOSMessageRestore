"use strict";var EXPORTED_SYMBOLS=["RemotePageChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"AsyncPrefs","resource://gre/modules/AsyncPrefs.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");ChromeUtils.defineModuleGetter(this,"RemotePageAccessManager","resource://gre/modules/RemotePageAccessManager.jsm");class RemotePageChild extends JSWindowActorChild{actorCreated(){this.listeners=new Map();this.exportBaseFunctions();}
exportBaseFunctions(){const exportableFunctions=["RPMSendAsyncMessage","RPMSendQuery","RPMAddMessageListener","RPMRemoveMessageListener","RPMGetIntPref","RPMGetStringPref","RPMGetBoolPref","RPMSetBoolPref","RPMGetFormatURLPref","RPMIsWindowPrivate",];this.exportFunctions(exportableFunctions);}
exportFunctions(functions){let document=this.document;let principal=document.nodePrincipal;if(!principal){return;}
let window=this.contentWindow;for(let fnname of functions){let allowAccess=RemotePageAccessManager.checkAllowAccessToFeature(principal,fnname,document);if(allowAccess){function accessCheckedFn(...args){this.checkAllowAccess(fnname,args[0]);return this[fnname](...args);}
Cu.exportFunction(accessCheckedFn.bind(this),window,{defineAs:fnname,});}}}
handleEvent(){
}
receiveMessage(messagedata){let message={name:messagedata.name,data:messagedata.data,};let listeners=this.listeners.get(message.name);if(!listeners){return;}
let clonedMessage=Cu.cloneInto(message,this.contentWindow);for(let listener of listeners.values()){try{listener(clonedMessage);}catch(e){Cu.reportError(e);}}}
wrapPromise(promise){return new this.contentWindow.Promise((resolve,reject)=>promise.then(resolve,reject));}
checkAllowAccess(aFeature,aValue){let doc=this.document;if(!RemotePageAccessManager.checkAllowAccess(doc,aFeature,aValue)){throw new Error("RemotePageAccessManager does not allow access to "+aFeature);}
return true;}
RPMSendAsyncMessage(aName,aData=null){this.sendAsyncMessage(aName,aData);}
RPMSendQuery(aName,aData=null){return this.wrapPromise(new Promise(resolve=>{this.sendQuery(aName,aData).then(result=>{resolve(Cu.cloneInto(result,this.contentWindow));});}));}
RPMAddMessageListener(aName,aCallback){if(!this.listeners.has(aName)){this.listeners.set(aName,new Set([aCallback]));}else{this.listeners.get(aName).add(aCallback);}}
RPMRemoveMessageListener(aName,aCallback){if(!this.listeners.has(aName)){return;}
this.listeners.get(aName).delete(aCallback);}
RPMGetIntPref(aPref,defaultValue){
if(defaultValue!==undefined){return Services.prefs.getIntPref(aPref,defaultValue);}
return Services.prefs.getIntPref(aPref);}
RPMGetStringPref(aPref){return Services.prefs.getStringPref(aPref);}
RPMGetBoolPref(aPref,defaultValue){
if(defaultValue!==undefined){return Services.prefs.getBoolPref(aPref,defaultValue);}
return Services.prefs.getBoolPref(aPref);}
RPMSetBoolPref(aPref,aVal){return this.wrapPromise(AsyncPrefs.set(aPref,aVal));}
RPMGetFormatURLPref(aFormatURL){return Services.urlFormatter.formatURLPref(aFormatURL);}
RPMIsWindowPrivate(){return PrivateBrowsingUtils.isContentWindowPrivate(this.contentWindow);}}