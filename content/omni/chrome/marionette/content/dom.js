"use strict";const EXPORTED_SYMBOLS=["ContentEventObserverService","WebElementEventTarget",];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());class WebElementEventTarget{constructor(messageManager){this.mm=messageManager;this.listeners={};this.mm.addMessageListener("Marionette:DOM:OnEvent",this);}
addEventListener(type,listener,{once=false}={}){if(!(type in this.listeners)){this.listeners[type]=[];}
if(!this.listeners[type].includes(listener)){listener.once=once;this.listeners[type].push(listener);}
this.mm.sendAsyncMessage("Marionette:DOM:AddEventListener",{type});}
removeEventListener(type,listener){if(!(type in this.listeners)){return;}
let stack=this.listeners[type];for(let i=stack.length-1;i>=0;--i){if(stack[i]===listener){stack.splice(i,1);if(stack.length==0){this.mm.sendAsyncMessage("Marionette:DOM:RemoveEventListener",{type,});}
return;}}}
dispatchEvent(event){if(!(event.type in this.listeners)){return;}
event.target=this;let stack=this.listeners[event.type].slice(0);stack.forEach(listener=>{if(typeof listener.handleEvent=="function"){listener.handleEvent(event);}else{listener(event);}
if(listener.once){this.removeEventListener(event.type,listener);}});}
receiveMessage({name,data}){if(name!="Marionette:DOM:OnEvent"){return;}
let ev={type:data.type,};this.dispatchEvent(ev);}}
this.WebElementEventTarget=WebElementEventTarget;class ContentEventObserverService{constructor(windowGlobal,sendAsyncMessage){this.window=windowGlobal;this.sendAsyncMessage=sendAsyncMessage;this.events=new Set();}
add(type){if(this.events.has(type)){return;}
this.window.addEventListener(type,this);this.events.add(type);}
remove(type){if(!this.events.has(type)){return;}
this.window.removeEventListener(type,this);this.events.delete(type);}
clear(){for(let ev of this){this.remove(ev);}}*[Symbol.iterator](){for(let ev of this.events){yield ev;}}
handleEvent({type,target}){logger.trace(`Received DOM event ${type}`);this.sendAsyncMessage("Marionette:DOM:OnEvent",{type});}}
this.ContentEventObserverService=ContentEventObserverService;