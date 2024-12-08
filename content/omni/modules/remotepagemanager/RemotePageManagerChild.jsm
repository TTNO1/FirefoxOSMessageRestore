"use strict";var EXPORTED_SYMBOLS=["ChildMessagePort"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{MessagePort}=ChromeUtils.import("resource://gre/modules/remotepagemanager/MessagePort.jsm");class ChildMessagePort extends MessagePort{constructor(window){let portID=Services.appinfo.processID+":"+ChildMessagePort.nextPortID++;super(window.docShell.messageManager,portID);this.window=window; Cu.exportFunction(this.sendAsyncMessage.bind(this),window,{defineAs:"RPMSendAsyncMessage",});Cu.exportFunction(this.addMessageListener.bind(this),window,{defineAs:"RPMAddMessageListener",allowCallbacks:true,});Cu.exportFunction(this.removeMessageListener.bind(this),window,{defineAs:"RPMRemoveMessageListener",allowCallbacks:true,});
if(!(this.messageManager instanceof Ci.nsIMessageSender)){return;} 
let loadListener=()=>{this.sendAsyncMessage("RemotePage:Load");window.removeEventListener("load",loadListener);};window.addEventListener("load",loadListener); window.addEventListener("unload",()=>{try{this.sendAsyncMessage("RemotePage:Unload");}catch(e){
}
this.destroy();});this.messageManager.sendAsyncMessage("RemotePage:InitPort",{portID,url:window.document.documentURI.replace(/[\#|\?].*$/,""),});}
async handleRequest(name,data){throw new Error(`Unknown request ${name}.`);}
handleMessage(messagedata){let message={name:messagedata.name,data:messagedata.data,};this.listener.callListeners(Cu.cloneInto(message,this.window));}
destroy(){this.window=null;super.destroy.call(this);}}
ChildMessagePort.nextPortID=0;