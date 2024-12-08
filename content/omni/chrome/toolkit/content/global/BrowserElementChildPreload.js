"use strict";function debug(msg){}
debug("loaded");var BrowserElementIsReady;var{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var{BrowserElementPromptService}=ChromeUtils.import("resource://gre/modules/BrowserElementPromptService.jsm");function sendAsyncMsg(msg,data){
if(!BrowserElementIsReady){return;}
if(!data){data={};}
data.msg_name=msg;sendAsyncMessage("browser-element-api:call",data);}
var LISTENED_EVENTS=[



{type:"unload",useCapture:false,wantsUntrusted:false},];var global=this;function BrowserElementChild(){this._windowIDDict={};this._init();}
BrowserElementChild.prototype={_init(){debug("Starting up.");BrowserElementPromptService.mapWindowToBrowserElementChild(content,this);this._shuttingDown=false;LISTENED_EVENTS.forEach(event=>{addEventListener(event.type,this,event.useCapture,event.wantsUntrusted);});addMessageListener("browser-element-api:call",this);},destroy(){debug("Destroying");this._shuttingDown=true;BrowserElementPromptService.unmapWindowToBrowserElementChild(content);LISTENED_EVENTS.forEach(event=>{removeEventListener(event.type,this,event.useCapture,event.wantsUntrusted);});removeMessageListener("browser-element-api:call",this);},handleEvent(event){switch(event.type){case"unload":this.destroy(event);break;}},receiveMessage(message){let self=this;let mmCalls={"unblock-modal-prompt":this._recvStopWaiting,"owner-visibility-change":this._recvOwnerVisibilityChange,};if(message.data.msg_name in mmCalls){return mmCalls[message.data.msg_name].apply(self,arguments);}
return undefined;},get _windowUtils(){return content.document.defaultView.windowUtils;},_tryGetInnerWindowID(win){try{return win.windowGlobalChild.innerWindowId;}catch(e){return null;}},showModalPrompt(win,args){args.windowID={outer:win.docShell.outerWindowID,inner:this._tryGetInnerWindowID(win),};sendAsyncMsg("showmodalprompt",args);let returnValue=this._waitForResult(win);if(args.promptType=="prompt"||args.promptType=="confirm"||args.promptType=="custom-prompt"){return returnValue;}
return undefined;},_waitForResult(win){debug("_waitForResult("+win+")");let utils=win.windowUtils;let outerWindowID=win.docShell.outerWindowID;let innerWindowID=this._tryGetInnerWindowID(win);if(innerWindowID===null){
debug("_waitForResult: No inner window. Bailing.");return undefined;}
this._windowIDDict[outerWindowID]=Cu.getWeakReference(win);debug("Entering modal state (outerWindowID="+
outerWindowID+", "+"innerWindowID="+
innerWindowID+")");utils.enterModalState();
if(!win.modalDepth){win.modalDepth=0;}
win.modalDepth++;let origModalDepth=win.modalDepth;debug("Nested event loop - begin");Services.tm.spinEventLoopUntil(()=>{

if(this._tryGetInnerWindowID(win)!==innerWindowID){debug("_waitForResult: Inner window ID changed "+"while in nested event loop.");return true;}
return win.modalDepth!==origModalDepth||this._shuttingDown;});debug("Nested event loop - finish");if(win.modalDepth==0){delete this._windowIDDict[outerWindowID];}

if(innerWindowID!==this._tryGetInnerWindowID(win)){throw Components.Exception("Modal state aborted by navigation",Cr.NS_ERROR_NOT_AVAILABLE);}
let returnValue=win.modalReturnValue;delete win.modalReturnValue;if(!this._shuttingDown){utils.leaveModalState();}
debug("Leaving modal state (outerID="+
outerWindowID+", "+"innerID="+
innerWindowID+")");return returnValue;},_recvStopWaiting(msg){let outerID=msg.json.windowID.outer;let innerID=msg.json.windowID.inner;let returnValue=msg.json.returnValue;debug("recvStopWaiting(outer="+
outerID+", inner="+
innerID+", returnValue="+
returnValue+")");if(!this._windowIDDict[outerID]){debug("recvStopWaiting: No record of outer window ID "+outerID);return;}
let win=this._windowIDDict[outerID].get();if(!win){debug("recvStopWaiting, but window is gone\n");return;}
if(innerID!==this._tryGetInnerWindowID(win)){debug("recvStopWaiting, but inner ID has changed\n");return;}
debug("recvStopWaiting "+win);win.modalReturnValue=returnValue;win.modalDepth--;},_recvOwnerVisibilityChange(data){debug("Received ownerVisibilityChange: ("+data.json.visible+")");var visible=data.json.visible;if(docShell&&docShell.isActive!==visible){docShell.isActive=visible;}},};var api=new BrowserElementChild();