"use strict";const{extend}=require("devtools/shared/extend");const{Ci,Cu,Cc}=require("chrome");const Services=require("Services");const{ParentProcessTargetActor,parentProcessTargetPrototype,}=require("devtools/server/actors/targets/parent-process");const makeDebugger=require("devtools/server/actors/utils/make-debugger");const{webExtensionTargetSpec,}=require("devtools/shared/specs/targets/webextension");const DevToolsUtils=require("devtools/shared/DevToolsUtils");const Targets=require("devtools/server/actors/targets/index");const TargetActorMixin=require("devtools/server/actors/targets/target-actor-mixin");loader.lazyRequireGetter(this,"unwrapDebuggerObjectGlobal","devtools/server/actors/thread",true);const FALLBACK_DOC_URL="chrome://devtools/content/shared/webextension-fallback.html";const webExtensionTargetPrototype=extend({},parentProcessTargetPrototype);webExtensionTargetPrototype.initialize=function(conn,chromeGlobal,prefix,addonId){this.addonId=addonId;this.chromeGlobal=chromeGlobal;
const extensionWindow=this._searchForExtensionWindow();parentProcessTargetPrototype.initialize.call(this,conn,extensionWindow);this._chromeGlobal=chromeGlobal;this._prefix=prefix;


Object.defineProperty(this,"messageManager",{enumerable:true,configurable:true,get:()=>{return this._chromeGlobal;},});
this._allowSource=this._allowSource.bind(this);this._onParentExit=this._onParentExit.bind(this);this._chromeGlobal.addMessageListener("debug:webext_parent_exit",this._onParentExit);
this.consoleAPIListenerOptions={addonId:this.addonId,};this.aps=Cc["@mozilla.org/addons/policy-service;1"].getService(Ci.nsIAddonPolicyService);this.makeDebugger=makeDebugger.bind(null,{findDebuggees:dbg=>{return dbg.findAllGlobals().filter(this._shouldAddNewGlobalAsDebuggee);},shouldAddNewGlobalAsDebuggee:this._shouldAddNewGlobalAsDebuggee.bind(this),});};

webExtensionTargetPrototype.isRootActor=true;webExtensionTargetPrototype.exit=function(){if(this._chromeGlobal){const chromeGlobal=this._chromeGlobal;this._chromeGlobal=null;chromeGlobal.removeMessageListener("debug:webext_parent_exit",this._onParentExit);chromeGlobal.sendAsyncMessage("debug:webext_child_exit",{actor:this.actorID,});}
this.addon=null;this.addonId=null;return ParentProcessTargetActor.prototype.exit.apply(this);};webExtensionTargetPrototype._searchFallbackWindow=function(){if(this.fallbackWindow){return this.fallbackWindow;}



this.fallbackWindow=this.chromeGlobal.content;this.fallbackWindow.document.location.href=FALLBACK_DOC_URL;return this.fallbackWindow;};webExtensionTargetPrototype._destroyFallbackWindow=function(){if(this.fallbackWindow){this.fallbackWindow=null;}};

webExtensionTargetPrototype._searchForExtensionWindow=function(){for(const window of Services.ww.getWindowEnumerator(null)){if(window.document.nodePrincipal.addonId==this.addonId){return window;}}
return this._searchFallbackWindow();};webExtensionTargetPrototype._onDocShellDestroy=function(docShell){
this._unwatchDocShell(docShell);const webProgress=docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);this._notifyDocShellDestroy(webProgress);
 if(this.attached&&docShell==this.docShell){this._changeTopLevelDocument(this._searchForExtensionWindow());}};webExtensionTargetPrototype._onNewExtensionWindow=function(window){if(!this.window||this.window===this.fallbackWindow){this._changeTopLevelDocument(window);}};webExtensionTargetPrototype._attach=function(){

if(!this.window||this.window.document.nodePrincipal.addonId!==this.addonId){this._setWindow(this._searchForExtensionWindow());}

ParentProcessTargetActor.prototype._attach.apply(this);};webExtensionTargetPrototype._detach=function(){
ParentProcessTargetActor.prototype._detach.apply(this);this._destroyFallbackWindow();};webExtensionTargetPrototype._docShellToWindow=function(docShell){const baseWindowDetails=ParentProcessTargetActor.prototype._docShellToWindow.call(this,docShell);const webProgress=docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);const window=webProgress.DOMWindow;
const addonID=window.document.nodePrincipal.addonId;const sameTypeRootAddonID=docShell.sameTypeRootTreeItem.domWindow.document.nodePrincipal.addonId;return Object.assign(baseWindowDetails,{addonID,sameTypeRootAddonID,});};webExtensionTargetPrototype._docShellsToWindows=function(docshells){return ParentProcessTargetActor.prototype._docShellsToWindows.call(this,docshells).filter(windowDetails=>{
return(windowDetails.addonID===this.addonId||windowDetails.sameTypeRootAddonID===this.addonId);});};webExtensionTargetPrototype.isExtensionWindow=function(window){return window.document.nodePrincipal.addonId==this.addonId;};webExtensionTargetPrototype.isExtensionWindowDescendent=function(window){const rootWin=window.docShell.sameTypeRootTreeItem.domWindow;return this.isExtensionWindow(rootWin);};webExtensionTargetPrototype._allowSource=function(source){if(source.element){try{const domEl=unwrapDebuggerObjectGlobal(source.element);return(this.isExtensionWindow(domEl.ownerGlobal)||this.isExtensionWindowDescendent(domEl.ownerGlobal));}catch(e){DevToolsUtils.reportException("WebExtensionTarget.allowSource",e);return false;}}
const url=source.url.split(" -> ").pop();if(url==="debugger eval code"||url==="debugger eager eval code"){return false;}
let uri;try{uri=Services.io.newURI(url);}catch(err){Cu.reportError(`Unexpected invalid url: ${url}`);return false;}
if(["resource","chrome","file"].includes(uri.scheme)){return false;}
try{const addonID=this.aps.extensionURIToAddonId(uri);return addonID==this.addonId;}catch(err){return false;}};webExtensionTargetPrototype._shouldAddNewGlobalAsDebuggee=function(newGlobal){const global=unwrapDebuggerObjectGlobal(newGlobal);if(global instanceof Ci.nsIDOMWindow){try{global.document;}catch(e){


return false;}
if(global.document.ownerGlobal&&this.isExtensionWindow(global)){this._onNewExtensionWindow(global.document.ownerGlobal);}
return(global.document.ownerGlobal&&this.isExtensionWindowDescendent(global.document.ownerGlobal));}
try{const metadata=Cu.getSandboxMetadata(global);if(metadata){return metadata.addonID===this.addonId;}}catch(e){}
return false;};webExtensionTargetPrototype._onParentExit=function(msg){if(msg.json.actor!==this.actorID){return;}
this.exit();};exports.WebExtensionTargetActor=TargetActorMixin(Targets.TYPES.FRAME,webExtensionTargetSpec,webExtensionTargetPrototype);