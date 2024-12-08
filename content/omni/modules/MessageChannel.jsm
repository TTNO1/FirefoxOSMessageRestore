//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["MessageChannel"];const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"MessageManagerProxy","resource://gre/modules/MessageManagerProxy.jsm");function getMessageManager(target){if(typeof target.sendAsyncMessage==="function"){return target;}
return new MessageManagerProxy(target);}
function matches(target,messageManager){return target===messageManager||target.messageManager===messageManager;}
const{DEBUG}=AppConstants;const LOW_PRIORITY_TIMEOUT_MS=250;const MESSAGE_MESSAGES="MessageChannel:Messages";const MESSAGE_RESPONSE="MessageChannel:Response";
var _deferredResult;var _makeDeferred=(resolve,reject)=>{
_deferredResult.resolve=resolve;_deferredResult.reject=reject;};let Deferred=()=>{let res={};this._deferredResult=res;res.promise=new Promise(_makeDeferred);this._deferredResult=null;return res;};class FilteringMessageManager{constructor(messageName,callback,messageManager){this.messageName=messageName;this.callback=callback;this.messageManager=messageManager;this.messageManager.addMessageListener(this.messageName,this,true);this.handlers=new Map();}
receiveMessage({data,target}){data.forEach(msg=>{if(msg){let handlers=Array.from(this.getHandlers(msg.messageName,msg.sender||null,msg.recipient));msg.target=target;this.callback(handlers,msg);}});}
*getHandlers(messageName,sender,recipient){let handlers=this.handlers.get(messageName)||new Set();for(let handler of handlers){if(MessageChannel.matchesFilter(handler.messageFilterStrict||null,recipient)&&MessageChannel.matchesFilter(handler.messageFilterPermissive||null,recipient,false)&&(!handler.filterMessage||handler.filterMessage(sender,recipient))){yield handler;}}}
addHandler(messageName,handler){if(!this.handlers.has(messageName)){this.handlers.set(messageName,new Set());}
this.handlers.get(messageName).add(handler);}
removeHandler(messageName,handler){if(this.handlers.has(messageName)){this.handlers.get(messageName).delete(handler);}}}
class ResponseManager extends FilteringMessageManager{constructor(messageName,callback,messageManager){super(messageName,callback,messageManager);this.idleMessages=[];this.idleScheduled=false;this.onIdle=this.onIdle.bind(this);}
scheduleIdleCallback(){if(!this.idleScheduled){ChromeUtils.idleDispatch(this.onIdle,{timeout:LOW_PRIORITY_TIMEOUT_MS,});this.idleScheduled=true;}}
onIdle(deadline){this.idleScheduled=false;let messages=this.idleMessages;this.idleMessages=[];let msgs=messages.map(msg=>msg.getMessage());try{this.messageManager.sendAsyncMessage(MESSAGE_MESSAGES,msgs);}catch(e){for(let msg of messages){msg.reject(e);}}}
sendMessage(message,options={}){if(options.lowPriority){this.idleMessages.push(message);this.scheduleIdleCallback();}else{this.messageManager.sendAsyncMessage(MESSAGE_MESSAGES,[message.getMessage(),]);}}
receiveMessage({data,target}){data.target=target;this.callback(this.handlers.get(data.messageName),data);}*getHandlers(messageName,sender,recipient){let handler=this.handlers.get(messageName);if(handler){yield handler;}}
addHandler(messageName,handler){if(DEBUG&&this.handlers.has(messageName)){throw new Error(`Handler already registered for response ID ${messageName}`);}
this.handlers.set(messageName,handler);}
removeHandler(messageName,handler){if(DEBUG&&this.handlers.get(messageName)!==handler){Cu.reportError(`Attempting to remove unexpected response handler for ${messageName}`);}
this.handlers.delete(messageName);}}
class FilteringMessageManagerMap extends Map{
constructor(messageName,callback,constructor=FilteringMessageManager){super();this.messageName=messageName;this.callback=callback;this._constructor=constructor;}
get(target){let broker=super.get(target);if(broker){return broker;}
broker=new this._constructor(this.messageName,this.callback,target);this.set(target,broker);if(EventTarget.isInstance(target)){let onUnload=event=>{target.removeEventListener("unload",onUnload);this.delete(target);};target.addEventListener("unload",onUnload);}
return broker;}}
class PendingMessage{constructor(channelId,message,sender,broker){this.channelId=channelId;this.message=message;this.sender=sender;this.broker=broker;this.deferred=Deferred();MessageChannel.pendingResponses.add(this);}
cleanup(){if(this.broker){this.broker.removeHandler(this.channelId,this);MessageChannel.pendingResponses.delete(this);this.message=null;this.broker=null;}}
get promise(){return this.deferred.promise;}
resolve(value){this.cleanup();this.deferred.resolve(value);}
reject(value){this.cleanup();this.deferred.reject(value);}
get messageManager(){return this.broker.messageManager;}
getMessage(){let msg=null;if(this.broker){this.broker.addHandler(this.channelId,this);msg=this.message;this.message=null;}
return msg;}}
this.MessageChannel={init(){Services.obs.addObserver(this,"message-manager-close");Services.obs.addObserver(this,"message-manager-disconnect");this.messageManagers=new FilteringMessageManagerMap(MESSAGE_MESSAGES,this._handleMessage.bind(this));this.responseManagers=new FilteringMessageManagerMap(MESSAGE_RESPONSE,this._handleResponse.bind(this),ResponseManager);this.pendingResponses=new Set();this.abortedResponses=new ExtensionUtils.LimitedSet(30);},RESULT_SUCCESS:0,RESULT_DISCONNECTED:1,RESULT_NO_HANDLER:2,RESULT_MULTIPLE_HANDLERS:3,RESULT_ERROR:4,RESULT_NO_RESPONSE:5,REASON_DISCONNECTED:{result:1, message:"Message manager disconnected",},RESPONSE_SINGLE:0,RESPONSE_FIRST:1,RESPONSE_ALL:2,RESPONSE_NONE:3,setupMessageManagers(messageManagers){for(let mm of messageManagers){


this.messageManagers.get(mm);}},matchesFilter(filter,data,strict=true){if(!filter){return true;}
if(strict){return Object.keys(filter).every(key=>{return key in data&&data[key]===filter[key];});}
return Object.keys(filter).every(key=>{return!(key in data)||data[key]===filter[key];});},addListener(targets,messageName,handler){if(!Array.isArray(targets)){targets=[targets];}
for(let target of targets){this.messageManagers.get(target).addHandler(messageName,handler);}},removeListener(targets,messageName,handler){if(!Array.isArray(targets)){targets=[targets];}
for(let target of targets){if(this.messageManagers.has(target)){this.messageManagers.get(target).removeHandler(messageName,handler);}}},sendMessage(target,messageName,data,options={}){let sender=options.sender||{};let recipient=options.recipient||{};let responseType=options.responseType||this.RESPONSE_SINGLE;let channelId=ExtensionUtils.getUniqueId();let message={messageName,channelId,sender,recipient,data,responseType,};data=null;if(responseType==this.RESPONSE_NONE){try{target.sendAsyncMessage(MESSAGE_MESSAGES,[message]);}catch(e){Cu.reportError(e);return Promise.reject(e);}
return Promise.resolve();}
let broker=this.responseManagers.get(target);let pending=new PendingMessage(channelId,message,recipient,broker);message=null;try{broker.sendMessage(pending,options);}catch(e){pending.reject(e);}
return pending.promise;},_callHandlers(handlers,data){let responseType=data.responseType;
if(!handlers.length&&responseType!=this.RESPONSE_ALL){return Promise.reject({result:MessageChannel.RESULT_NO_HANDLER,message:"No matching message handler",});}
if(responseType==this.RESPONSE_SINGLE){if(handlers.length>1){return Promise.reject({result:MessageChannel.RESULT_MULTIPLE_HANDLERS,message:`Multiple matching handlers for ${data.messageName}`,});}


return new Promise(resolve=>{resolve(handlers[0].receiveMessage(data));});}
let responses=handlers.map((handler,i)=>{try{return handler.receiveMessage(data,i+1==handlers.length);}catch(e){return Promise.reject(e);}});data=null;responses=responses.filter(response=>response!==undefined);switch(responseType){case this.RESPONSE_FIRST:if(!responses.length){return Promise.reject({result:MessageChannel.RESULT_NO_RESPONSE,message:"No handler returned a response",});}
return Promise.race(responses);case this.RESPONSE_ALL:return Promise.all(responses);}
return Promise.reject({message:"Invalid response type"});},_handleMessage(handlers,data){if(data.responseType==this.RESPONSE_NONE){handlers.forEach(handler=>{new Promise(resolve=>{resolve(handler.receiveMessage(data));}).catch(e=>{Cu.reportError(e.stack?`${e}\n${e.stack}`:e.message||e);});});data=null;return;}
let target=getMessageManager(data.target);let deferred={sender:data.sender,messageManager:target,channelId:data.channelId,respondingSide:true,};let cleanup=()=>{this.pendingResponses.delete(deferred);if(target.dispose){target.dispose();}};this.pendingResponses.add(deferred);deferred.promise=new Promise((resolve,reject)=>{deferred.reject=reject;this._callHandlers(handlers,data).then(resolve,reject);data=null;}).then(value=>{let response={result:this.RESULT_SUCCESS,messageName:deferred.channelId,recipient:{},value,};if(target.isDisconnected){
return;}
target.sendAsyncMessage(MESSAGE_RESPONSE,response);},error=>{if(target.isDisconnected){
if(error.result!==this.RESULT_DISCONNECTED&&error.result!==this.RESULT_NO_RESPONSE){Cu.reportError(Cu.getClassName(error,false)==="Object"?error.message:error);}
return;}
let response={result:this.RESULT_ERROR,messageName:deferred.channelId,recipient:{},error:{},};if(error&&typeof error=="object"){if(error.result){response.result=error.result;}

for(let key of["fileName","filename","lineNumber","columnNumber","message","stack","result","mozWebExtLocation",]){if(key in error){response.error[key]=error[key];}}}
target.sendAsyncMessage(MESSAGE_RESPONSE,response);}).then(cleanup,e=>{cleanup();Cu.reportError(e);});},_handleResponse(handler,data){if(!handler){if(this.abortedResponses.has(data.messageName)){this.abortedResponses.delete(data.messageName);Services.console.logStringMessage(`Ignoring response to aborted listener for ${data.messageName}`);}else{Cu.reportError(`No matching message response handler for ${data.messageName}`);}}else if(data.result===this.RESULT_SUCCESS){handler.resolve(data.value);}else{handler.reject(data.error);}},abortChannel(channelId,reason){for(let response of this.pendingResponses){if(channelId===response.channelId&&response.respondingSide){this.pendingResponses.delete(response);response.reject(reason);}}},abortResponses(sender,reason=this.REASON_DISCONNECTED){for(let response of this.pendingResponses){if(this.matchesFilter(sender,response.sender)){this.pendingResponses.delete(response);this.abortedResponses.add(response.channelId);response.reject(reason);}}},abortMessageManager(target,reason){for(let response of this.pendingResponses){if(matches(response.messageManager,target)){this.abortedResponses.add(response.channelId);response.reject(reason);}}},observe(subject,topic,data){switch(topic){case"message-manager-close":case"message-manager-disconnect":try{if(this.responseManagers.has(subject)){this.abortMessageManager(subject,this.REASON_DISCONNECTED);}}finally{this.responseManagers.delete(subject);this.messageManagers.delete(subject);}
break;}},};MessageChannel.init();