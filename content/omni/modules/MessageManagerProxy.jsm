//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["MessageManagerProxy"];const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{DefaultMap}=ExtensionUtils;class MessageManagerProxy{constructor(target){this.listeners=new DefaultMap(()=>new Map());this.closed=false;if(target instanceof Ci.nsIMessageSender){this.messageManager=target;}else{this.addListeners(target);}
Services.obs.addObserver(this,"message-manager-close");}
dispose(){if(this.eventTarget){this.removeListeners(this.eventTarget);this.eventTarget=null;}
this.messageManager=null;Services.obs.removeObserver(this,"message-manager-close");}
observe(subject,topic,data){if(topic==="message-manager-close"){if(subject===this.messageManager){this.closed=true;}}}
static matches(target,messageManager){return(target===messageManager||target.messageManager===messageManager);}
sendAsyncMessage(...args){if(this.messageManager){return this.messageManager.sendAsyncMessage(...args);}
Cu.reportError(`Cannot send message: Other side disconnected: ${uneval(args)}`);}
get isDisconnected(){return this.closed||!this.messageManager;}
addMessageListener(message,listener,listenWhenClosed=false){this.messageManager.addMessageListener(message,listener,listenWhenClosed);this.listeners.get(message).set(listener,listenWhenClosed);}
removeMessageListener(message,listener){this.messageManager.removeMessageListener(message,listener);let listeners=this.listeners.get(message);listeners.delete(listener);if(!listeners.size){this.listeners.delete(message);}}
*iterListeners(){for(let[message,listeners]of this.listeners){for(let[listener,listenWhenClosed]of listeners){yield{message,listener,listenWhenClosed};}}}
addListeners(target){target.addEventListener("SwapDocShells",this);this.eventTarget=target;this.messageManager=target.messageManager;for(let{message,listener,listenWhenClosed}of this.iterListeners()){this.messageManager.addMessageListener(message,listener,listenWhenClosed);}}
removeListeners(target){target.removeEventListener("SwapDocShells",this);for(let{message,listener}of this.iterListeners()){this.messageManager.removeMessageListener(message,listener);}}
handleEvent(event){if(event.type=="SwapDocShells"){this.removeListeners(this.eventTarget);

this.eventTarget.addEventListener("EndSwapDocShells",()=>{this.addListeners(event.detail);},{once:true});}}}