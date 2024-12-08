//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["DOMRequestIpcHelper"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function DOMRequestIpcHelper(){




this._listeners=null;this._requests=null;this._window=null;}
DOMRequestIpcHelper.prototype={QueryInterface:ChromeUtils.generateQI(["nsISupportsWeakReference","nsIObserver",]),addMessageListeners(aMessages){if(!aMessages){return;}
if(!this._listeners){this._listeners={};}
if(!Array.isArray(aMessages)){aMessages=[aMessages];}
aMessages.forEach(aMsg=>{let name=aMsg.name||aMsg;
if(this._listeners[name]!=undefined){if(!!aMsg.weakRef==this._listeners[name].weakRef){this._listeners[name].count++;return;}else{throw Components.Exception("",Cr.NS_ERROR_FAILURE);}}
aMsg.weakRef?Services.cpmm.addWeakMessageListener(name,this):Services.cpmm.addMessageListener(name,this);this._listeners[name]={weakRef:!!aMsg.weakRef,count:1,};});},removeMessageListeners(aMessages){if(!this._listeners||!aMessages){return;}
if(!Array.isArray(aMessages)){aMessages=[aMessages];}
aMessages.forEach(aName=>{if(this._listeners[aName]==undefined){return;}

if(!--this._listeners[aName].count){this._listeners[aName].weakRef?Services.cpmm.removeWeakMessageListener(aName,this):Services.cpmm.removeMessageListener(aName,this);delete this._listeners[aName];}});},initDOMRequestHelper(aWindow,aMessages){
this.QueryInterface(Ci.nsISupportsWeakReference);this.QueryInterface(Ci.nsIObserver);if(aMessages){this.addMessageListeners(aMessages);}
this._id=this._getRandomId();this._window=aWindow;if(this._window){this.innerWindowID=this._window.windowGlobalChild.innerWindowId;}
this._destroyed=false;Services.obs.addObserver(this,"inner-window-destroyed",true);},destroyDOMRequestHelper(){if(this._destroyed){return;}
this._destroyed=true;Services.obs.removeObserver(this,"inner-window-destroyed");if(this._listeners){Object.keys(this._listeners).forEach(aName=>{this._listeners[aName].weakRef?Services.cpmm.removeWeakMessageListener(aName,this):Services.cpmm.removeMessageListener(aName,this);});}
this._listeners=null;this._requests=null;if(this.uninit){this.uninit();}
this._window=null;},observe(aSubject,aTopic,aData){if(aTopic!=="inner-window-destroyed"){return;}
let wId=aSubject.QueryInterface(Ci.nsISupportsPRUint64).data;if(wId!=this.innerWindowID){return;}
this.destroyDOMRequestHelper();},getRequestId(aRequest){if(!this._requests){this._requests={};}
let id="id"+this._getRandomId();this._requests[id]=aRequest;return id;},getPromiseResolverId(aPromiseResolver){
return this.getRequestId(aPromiseResolver);},getRequest(aId){if(this._requests&&this._requests[aId]){return this._requests[aId];}},getPromiseResolver(aId){
return this.getRequest(aId);},removeRequest(aId){if(this._requests&&this._requests[aId]){delete this._requests[aId];}},removePromiseResolver(aId){
this.removeRequest(aId);},takeRequest(aId){if(!this._requests||!this._requests[aId]){return null;}
let request=this._requests[aId];delete this._requests[aId];return request;},takePromiseResolver(aId){
return this.takeRequest(aId);},_getRandomId(){return Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();},createRequest(){if(!this._window){Cu.reportError("DOMRequestHelper trying to create a DOMRequest without a valid window, failing.");throw Components.Exception("",Cr.NS_ERROR_FAILURE);}
return Services.DOMRequest.createRequest(this._window);},createPromise(aPromiseInit){if(!this._window){Cu.reportError("DOMRequestHelper trying to create a Promise without a valid window, failing.");throw Components.Exception("",Cr.NS_ERROR_FAILURE);}
return new this._window.Promise(aPromiseInit);},createPromiseWithId(aCallback){return this.createPromise((aResolve,aReject)=>{let resolverId=this.getPromiseResolverId({resolve:aResolve,reject:aReject,});aCallback(resolverId);});},forEachRequest(aCallback){if(!this._requests){return;}
Object.keys(this._requests).forEach(aKey=>{if(this.getRequest(aKey)instanceof this._window.DOMRequest){aCallback(aKey);}});},forEachPromiseResolver(aCallback){if(!this._requests){return;}
Object.keys(this._requests).forEach(aKey=>{if("resolve"in this.getPromiseResolver(aKey)&&"reject"in this.getPromiseResolver(aKey)){aCallback(aKey);}});},};