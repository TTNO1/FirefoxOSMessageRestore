//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ContentPrefsChild","ContentPrefServiceChild"];const{ContentPref,_methodsCallableFromChild,cbHandleCompletion,cbHandleError,cbHandleResult,safeCallback,}=ChromeUtils.import("resource://gre/modules/ContentPrefUtils.jsm");function contextArg(context){return context&&context.usePrivateBrowsing?{usePrivateBrowsing:true}:null;}
function NYI(){throw new Error("Do not add any new users of these functions");}
function CallbackCaller(callback){this._callback=callback;}
CallbackCaller.prototype={handleResult(contentPref){cbHandleResult(this._callback,new ContentPref(contentPref.domain,contentPref.name,contentPref.value));},handleError(result){cbHandleError(this._callback,result);},handleCompletion(reason){cbHandleCompletion(this._callback,reason);},};class ContentPrefsChild extends JSProcessActorChild{constructor(){super(); this._observers=new Map(); this._requests=new Map();}
_getRandomId(){return Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();}
receiveMessage(msg){let data=msg.data;let callback;switch(msg.name){case"ContentPrefs:HandleResult":callback=this._requests.get(data.requestId);callback.handleResult(data.contentPref);break;case"ContentPrefs:HandleError":callback=this._requests.get(data.requestId);callback.handleError(data.error);break;case"ContentPrefs:HandleCompletion":callback=this._requests.get(data.requestId);this._requests.delete(data.requestId);callback.handleCompletion(data.reason);break;case"ContentPrefs:NotifyObservers":{let observerList=this._observers.get(data.name);if(!observerList){break;}
for(let observer of observerList){safeCallback(observer,data.callback,data.args);}
break;}}}
callFunction(call,args,callback){let requestId=this._getRandomId();let data={call,args,requestId};this._requests.set(requestId,new CallbackCaller(callback));this.sendAsyncMessage("ContentPrefs:FunctionCall",data);}
addObserverForName(name,observer){let set=this._observers.get(name);if(!set){set=new Set();
this.sendAsyncMessage("ContentPrefs:AddObserverForName",{name,});this._observers.set(name,set);}
set.add(observer);}
removeObserverForName(name,observer){let set=this._observers.get(name);if(!set){return;}
set.delete(observer);if(set.size===0){this.sendAsyncMessage("ContentPrefs:RemoveObserverForName",{name,});this._observers.delete(name);}}}
var ContentPrefServiceChild={QueryInterface:ChromeUtils.generateQI(["nsIContentPrefService2"]),addObserverForName:(name,observer)=>{ChromeUtils.domProcessChild.getActor("ContentPrefs").addObserverForName(name,observer);},removeObserverForName:(name,observer)=>{ChromeUtils.domProcessChild.getActor("ContentPrefs").removeObserverForName(name,observer);},getCachedByDomainAndName:NYI,getCachedBySubdomainAndName:NYI,getCachedGlobal:NYI,extractDomain:NYI,};function forwardMethodToParent(method,signature,...args){ args=args.slice(0,signature.length); let contextIndex=signature.indexOf("context");if(contextIndex>-1){args[contextIndex]=contextArg(args[contextIndex]);}
let callbackIndex=signature.indexOf("callback");let callback=null;if(callbackIndex>-1&&args.length>callbackIndex){callback=args.splice(callbackIndex,1)[0];}
let actor=ChromeUtils.domProcessChild.getActor("ContentPrefs");actor.callFunction(method,args,callback);}
for(let[method,signature]of _methodsCallableFromChild){ContentPrefServiceChild[method]=forwardMethodToParent.bind(ContentPrefServiceChild,method,signature);}