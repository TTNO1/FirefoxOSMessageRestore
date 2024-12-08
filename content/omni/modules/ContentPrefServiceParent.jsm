//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ContentPrefsParent"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"_methodsCallableFromChild","resource://gre/modules/ContentPrefUtils.jsm");let loadContext=Cu.createLoadContext();let privateLoadContext=Cu.createPrivateLoadContext();function contextArg(context){return context&&context.usePrivateBrowsing?privateLoadContext:loadContext;}
class ContentPrefsParent extends JSProcessActorParent{constructor(){super();

this._prefsToObserve=new Set();this._observer=null;}
didDestroy(){if(this._observer){for(let i of this._prefsToObserve){cps2.removeObserverForName(i,this._observer);}
this._observer=null;}}
receiveMessage(msg){switch(msg.name){case"ContentPrefs:AddObserverForName":{
let actor=this;if(!this._observer){this._observer={onContentPrefSet(group,name,value,isPrivate){actor.onContentPrefSet(group,name,value,isPrivate);},onContentPrefRemoved(group,name,isPrivate){actor.onContentPrefRemoved(group,name,isPrivate);},};}
let prefName=msg.data.name;this._prefsToObserve.add(prefName);cps2.addObserverForName(prefName,this._observer);break;}
case"ContentPrefs:RemoveObserverForName":{let prefName=msg.data.name;this._prefsToObserve.delete(prefName);if(this._prefsToObserve.size==0){cps2.removeObserverForName(prefName,this._observer);this._observer=null;}
break;}
case"ContentPrefs:FunctionCall":let data=msg.data;let signature;if(!_methodsCallableFromChild.some(([method,args])=>{if(method==data.call){signature=args;return true;}
return false;})){throw new Error(`Can't call ${data.call} from child!`);}
let actor=this;let args=data.args;return new Promise(resolve=>{let listener={handleResult(pref){actor.sendAsyncMessage("ContentPrefs:HandleResult",{requestId:data.requestId,contentPref:{domain:pref.domain,name:pref.name,value:pref.value,},});},handleError(error){actor.sendAsyncMessage("ContentPrefs:HandleError",{requestId:data.requestId,error,});},handleCompletion(reason){actor.sendAsyncMessage("ContentPrefs:HandleCompletion",{requestId:data.requestId,reason,});},};args.push(listener); let contextIndex=signature.indexOf("context");if(contextIndex>-1){args[contextIndex]=contextArg(args[contextIndex]);}
cps2[data.call](...args);});}
return undefined;}
onContentPrefSet(group,name,value,isPrivate){this.sendAsyncMessage("ContentPrefs:NotifyObservers",{name,callback:"onContentPrefSet",args:[group,name,value,isPrivate],});}
onContentPrefRemoved(group,name,isPrivate){this.sendAsyncMessage("ContentPrefs:NotifyObservers",{name,callback:"onContentPrefRemoved",args:[group,name,isPrivate],});}}
XPCOMUtils.defineLazyServiceGetter(this,"cps2","@mozilla.org/content-pref/service;1","nsIContentPrefService2");