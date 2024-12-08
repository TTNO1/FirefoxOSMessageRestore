"use strict";const EXPORTED_SYMBOLS=["proxy"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",error:"chrome://marionette/content/error.js",evaluate:"chrome://marionette/content/evaluate.js",MessageManagerDestroyedPromise:"chrome://marionette/content/sync.js",modal:"chrome://marionette/content/modal.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());XPCOMUtils.defineLazyServiceGetter(this,"uuidgen","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");
const ownPriorityGetterTrap={get:(obj,prop)=>{if(obj.hasOwnProperty(prop)){return obj[prop];}
return(...args)=>obj.send(prop,args);},};this.proxy={};proxy.toListener=function(sendAsyncFn,browserFn){let sender=new proxy.AsyncMessageChannel(sendAsyncFn,browserFn);return new Proxy(sender,ownPriorityGetterTrap);};proxy.AsyncMessageChannel=class{constructor(sendAsyncFn,browserFn){this.sendAsync=sendAsyncFn;this.browserFn_=browserFn; this.activeMessageId=null;this.listeners_=new Map();this.dialogHandler=null;this.closeHandler=null;}
get browser(){return this.browserFn_();}
send(name,args=[]){

if(name=="cleanmsg"){for(let path of this.listeners_.keys()){Services.mm.removeMessageListenerHashEntry(path);this.listeners_.delete(path);}
return null;}
let uuid=uuidgen.generateUUID().toString(); this.activeMessageId=uuid;return new Promise((resolve,reject)=>{let path=proxy.AsyncMessageChannel.makePath(uuid);let cb=msg=>{this.activeMessageId=null;let{data,type}=msg.json;switch(msg.json.type){case proxy.AsyncMessageChannel.ReplyType.Ok:case proxy.AsyncMessageChannel.ReplyType.Value:let payload=evaluate.fromJSON(data);resolve(payload);break;case proxy.AsyncMessageChannel.ReplyType.Error:let err=error.WebDriverError.fromJSON(data);reject(err);break;default:throw new TypeError(`Unknown async response type: ${type}`);}};
this.closeHandler=async({type,target})=>{logger.trace(`Received DOM event ${type} for ${target}`);let messageManager;switch(type){case"unload":messageManager=this.browser.window.messageManager;break;case"TabClose":messageManager=this.browser.messageManager;break;}
await new MessageManagerDestroyedPromise(messageManager);this.removeHandlers();resolve();};this.dialogHandler=(action,dialogRef,win)=>{if(win!==this.browser.window){return;}
this.removeAllListeners_();this.sendAsync("cancelRequest");this.removeHandlers();resolve();};
this.addListener_(path,cb);this.addHandlers(); this.sendAsync(name,marshal(args),uuid);});}
addHandlers(){this.browser.driver.dialogObserver.add(this.dialogHandler.bind(this));
if(this.browser){this.browser.window.addEventListener("unload",this.closeHandler);if(this.browser.tab){let node=this.browser.tab.addEventListener?this.browser.tab:this.browser.contentBrowser;node.addEventListener("TabClose",this.closeHandler);}}}
removeHandlers(){this.browser.driver.dialogObserver.remove(this.dialogHandler.bind(this));if(this.browser){this.browser.window.removeEventListener("unload",this.closeHandler);if(this.browser.tab){let node=this.browser.tab.addEventListener?this.browser.tab:this.browser.contentBrowser;if(node){node.removeEventListener("TabClose",this.closeHandler);}}}}
reply(uuid,obj=undefined){

if(typeof obj=="undefined"){this.sendReply_(uuid,proxy.AsyncMessageChannel.ReplyType.Ok);}else if(error.isError(obj)){let err=error.wrap(obj);this.sendReply_(uuid,proxy.AsyncMessageChannel.ReplyType.Error,err);}else{this.sendReply_(uuid,proxy.AsyncMessageChannel.ReplyType.Value,obj);}}
sendReply_(uuid,type,payload=undefined){const path=proxy.AsyncMessageChannel.makePath(uuid);let data=evaluate.toJSON(payload);const msg={type,data};
 this.sendAsync(path,msg);}
static makePath(uuid){return"Marionette:asyncReply:"+uuid;}
addListener_(path,callback){let autoRemover=msg=>{this.removeListener_(path);this.removeHandlers();callback(msg);};Services.mm.addMessageListener(path,autoRemover);this.listeners_.set(path,autoRemover);}
removeListener_(path){if(!this.listeners_.has(path)){return true;}
let l=this.listeners_.get(path);Services.mm.removeMessageListener(path,l);return false;}
removeAllListeners_(){let ok=true;for(let[p]of this.listeners_){ok|=this.removeListener_(p);}
return ok;}};proxy.AsyncMessageChannel.ReplyType={Ok:0,Value:1,Error:2,};function marshal(args){if(args.length==1&&typeof args[0]=="object"){return args[0];}
return args;}