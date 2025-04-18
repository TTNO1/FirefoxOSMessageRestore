"use strict";var EXPORTED_SYMBOLS=["MessagePort","MessageListener"];ChromeUtils.defineModuleGetter(this,"PromiseUtils","resource://gre/modules/PromiseUtils.jsm");class MessageListener{constructor(){this.listeners=new Map();}
keys(){return this.listeners.keys();}
has(name){return this.listeners.has(name);}
callListeners(message){let listeners=this.listeners.get(message.name);if(!listeners){return;}
for(let listener of listeners.values()){try{listener(message);}catch(e){Cu.reportError(e);}}}
addMessageListener(name,callback){if(!this.listeners.has(name)){this.listeners.set(name,new Set([callback]));}else{this.listeners.get(name).add(callback);}}
removeMessageListener(name,callback){if(!this.listeners.has(name)){return;}
this.listeners.get(name).delete(callback);}}
class MessagePort{constructor(messageManagerOrActor,portID){this.messageManager=messageManagerOrActor;this.portID=portID;this.destroyed=false;this.listener=new MessageListener();

this.requests=[];this.message=this.message.bind(this);this.receiveRequest=this.receiveRequest.bind(this);this.receiveResponse=this.receiveResponse.bind(this);this.addMessageListeners();}
addMessageListeners(){if(!(this.messageManager instanceof Ci.nsIMessageSender)){return;}
this.messageManager.addMessageListener("RemotePage:Message",this.message);this.messageManager.addMessageListener("RemotePage:Request",this.receiveRequest);this.messageManager.addMessageListener("RemotePage:Response",this.receiveResponse);}
removeMessageListeners(){if(!(this.messageManager instanceof Ci.nsIMessageSender)){return;}
this.messageManager.removeMessageListener("RemotePage:Message",this.message);this.messageManager.removeMessageListener("RemotePage:Request",this.receiveRequest);this.messageManager.removeMessageListener("RemotePage:Response",this.receiveResponse);}

swapMessageManager(messageManager){this.removeMessageListeners();this.messageManager=messageManager;this.addMessageListeners();}

sendRequest(name,data=null){if(this.destroyed){return this.window.Promise.reject(new Error("Message port has been destroyed"));}
let deferred=PromiseUtils.defer();this.requests.push(deferred);this.messageManager.sendAsyncMessage("RemotePage:Request",{portID:this.portID,requestID:this.requests.length-1,name,data,});return this.wrapPromise(deferred.promise);}
async receiveRequest({data:messagedata}){if(this.destroyed||messagedata.portID!=this.portID){return;}
let data={portID:this.portID,requestID:messagedata.requestID,};try{data.resolve=await this.handleRequest(messagedata.name,messagedata.data);}catch(e){data.reject=e;}
this.messageManager.sendAsyncMessage("RemotePage:Response",data);}
receiveResponse({data:messagedata}){if(this.destroyed||messagedata.portID!=this.portID){return;}
let deferred=this.requests[messagedata.requestID];if(!deferred){Cu.reportError("Received a response to an unknown request.");return;}
delete this.requests[messagedata.requestID];if("resolve"in messagedata){deferred.resolve(messagedata.resolve);}else if("reject"in messagedata){deferred.reject(messagedata.reject);}else{deferred.reject(new Error("Internal RPM error."));}}
message({data:messagedata}){if(this.destroyed||messagedata.portID!=this.portID){return;}
this.handleMessage(messagedata);}
addMessageListener(name,callback){if(this.destroyed){throw new Error("Message port has been destroyed");}
this.listener.addMessageListener(name,callback);}
removeMessageListener(name,callback){if(this.destroyed){throw new Error("Message port has been destroyed");}
this.listener.removeMessageListener(name,callback);} 
sendAsyncMessage(name,data=null){if(this.destroyed){throw new Error("Message port has been destroyed");}
let id;if(this.window){id=this.window.docShell.browsingContext.id;}
if(this.messageManager instanceof Ci.nsIMessageSender){this.messageManager.sendAsyncMessage("RemotePage:Message",{portID:this.portID,browsingContextID:id,name,data,});}else{this.messageManager.sendAsyncMessage(name,data);}} 
destroy(){try{ this.removeMessageListeners();}catch(e){}
for(let deferred of this.requests){if(deferred){deferred.reject(new Error("Message port has been destroyed"));}}
this.messageManager=null;this.destroyed=true;this.portID=null;this.listener=null;this.requests=[];}
wrapPromise(promise){return new this.window.Promise((resolve,reject)=>promise.then(resolve,reject));}}