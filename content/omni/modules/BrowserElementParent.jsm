//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{BrowserElementPromptService}=ChromeUtils.import("resource://gre/modules/BrowserElementPromptService.jsm");function debug(msg){}
function handleWindowEvent(e){if(this._browserElementParents){let beps=ChromeUtils.nondeterministicGetWeakMapKeys(this._browserElementParents);beps.forEach(bep=>bep._handleOwnerEvent(e));}}
function BrowserElementParent(){debug("Creating new BrowserElementParent object");}
BrowserElementParent.prototype={classDescription:"BrowserElementAPI implementation",classID:Components.ID("{9f171ac4-0939-4ef8-b360-3408aedc3060}"),contractID:"@mozilla.org/dom/browser-element-api;1",QueryInterface:ChromeUtils.generateQI(["nsIBrowserElementAPI","nsISupportsWeakReference",]),setFrameLoader(frameLoader){debug("Setting frameLoader");this._frameLoader=frameLoader;this._frameElement=frameLoader.ownerElement;if(!this._frameElement){debug("No frame element?");return;}







if(!this._window._browserElementParents){this._window._browserElementParents=new WeakMap();let handler=handleWindowEvent.bind(this._window);let windowEvents=["visibilitychange"];for(let event of windowEvents){Services.els.addSystemEventListener(this._window,event,handler,true);}}
this._window._browserElementParents.set(this,null);BrowserElementPromptService.mapFrameToBrowserElementParent(this._frameElement,this);this._setupMessageListener();},destroyFrameScripts(){debug("Destroying frame scripts");this._mm.sendAsyncMessage("browser-element-api:destroy");},_setupMessageListener(){this._mm=this._frameLoader.messageManager;this._mm.addMessageListener("browser-element-api:call",this);},receiveMessage(aMsg){if(!this._isAlive()){return undefined;}
 
let mmCalls={hello:this._recvHello,};let mmSecuritySensitiveCalls={showmodalprompt:this._handleShowModalPrompt,};if(aMsg.data.msg_name in mmCalls){return mmCalls[aMsg.data.msg_name].apply(this,arguments);}else if(aMsg.data.msg_name in mmSecuritySensitiveCalls){return mmSecuritySensitiveCalls[aMsg.data.msg_name].apply(this,arguments);}
return undefined;},_removeMessageListener(){this._mm.removeMessageListener("browser-element-api:call",this);},_isAlive(){return(!Cu.isDeadWrapper(this._frameElement)&&!Cu.isDeadWrapper(this._frameElement.ownerDocument)&&!Cu.isDeadWrapper(this._frameElement.ownerGlobal));},get _window(){return this._frameElement.ownerGlobal;},_sendAsyncMsg(msg,data){try{if(!data){data={};}
data.msg_name=msg;this._mm.sendAsyncMessage("browser-element-api:call",data);}catch(e){return false;}
return true;},_recvHello(){debug("recvHello");


if(this._window.document.hidden){this._ownerVisibilityChange();}},_fireEventFromMsg(data){let detail=data.json;let name=detail.msg_name;
if("_payload_"in detail){detail=detail._payload_;}
debug("fireEventFromMsg: "+name+", "+JSON.stringify(detail));let evt=this._createEvent(name,detail,false);this._frameElement.dispatchEvent(evt);},_handleShowModalPrompt(data){


let detail=data.json;debug("handleShowPrompt "+JSON.stringify(detail));
let windowID=detail.windowID;delete detail.windowID;debug("Event will have detail: "+JSON.stringify(detail));let evt=this._createEvent("showmodalprompt",detail,true);let self=this;let unblockMsgSent=false;function sendUnblockMsg(){if(unblockMsgSent){return;}
unblockMsgSent=true;
let data={windowID,returnValue:evt.detail.returnValue};self._sendAsyncMsg("unblock-modal-prompt",data);}
Cu.exportFunction(sendUnblockMsg,evt.detail,{defineAs:"unblock"});this._frameElement.dispatchEvent(evt);if(!evt.defaultPrevented){
sendUnblockMsg();}},_createEvent(evtName,detail,cancelable){
if(detail!==undefined&&detail!==null){detail=Cu.cloneInto(detail,this._window);return new this._window.CustomEvent("mozbrowser"+evtName,{bubbles:true,cancelable,detail,});}
return new this._window.Event("mozbrowser"+evtName,{bubbles:true,cancelable,});},_ownerVisibilityChange(){this._sendAsyncMsg("owner-visibility-change",{visible:!this._window.document.hidden,});},_handleOwnerEvent(evt){switch(evt.type){case"visibilitychange":this._ownerVisibilityChange();break;}},};var EXPORTED_SYMBOLS=["BrowserElementParent"];