//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");


if(AppConstants.MOZ_BITS_DOWNLOAD){XPCOMUtils.defineLazyServiceGetter(this,"gBits","@mozilla.org/bits;1","nsIBits");}





const kBitsMethodTimeoutMs=10*60*1000; class BitsError extends Error{constructor(type,action,stage,codeType,code){let message=`${BitsError.name} {type: ${type}, action: ${action}, `+`stage: ${stage}`;switch(codeType){case gBits.ERROR_CODE_TYPE_NONE:code=null;message+=", codeType: none}";break;case gBits.ERROR_CODE_TYPE_NSRESULT:message+=`, codeType: nsresult, code: ${code}}`;break;case gBits.ERROR_CODE_TYPE_HRESULT:message+=`, codeType: hresult, code: ${code}}`;break;case gBits.ERROR_CODE_TYPE_STRING:message+=`, codeType: string, code: ${JSON.stringify(code)}}`;break;case gBits.ERROR_CODE_TYPE_EXCEPTION:message+=`, codeType: exception, code: ${code}}`;break;default:message+=", codeType: invalid}";break;}
super(message);this.type=type;this.action=action;this.stage=stage;this.codeType=codeType;this.code=code;this.name=this.constructor.name;this.succeeded=false;}}

class BitsVerificationError extends BitsError{constructor(){super(Ci.nsIBits.ERROR_TYPE_VERIFICATION_FAILURE,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_VERIFICATION,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}}
class BitsUnknownError extends BitsError{constructor(){super(Ci.nsIBits.ERROR_TYPE_UNKNOWN,Ci.nsIBits.ERROR_ACTION_UNKNOWN,Ci.nsIBits.ERROR_STAGE_UNKNOWN,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}}
function makeTimeout(reject,errorAction){let timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);timer.initWithCallback(()=>{let error=new BitsError(gBits.ERROR_TYPE_METHOD_TIMEOUT,errorAction,gBits.ERROR_STAGE_UNKNOWN,gBits.ERROR_CODE_TYPE_NONE);reject(error);},kBitsMethodTimeoutMs,Ci.nsITimer.TYPE_ONE_SHOT);return timer;}
async function requestPromise(errorAction,actionFn){return new Promise((resolve,reject)=>{let timer=makeTimeout(reject,errorAction);let callback={QueryInterface:ChromeUtils.generateQI(["nsIBitsCallback"]),success(){timer.cancel();resolve();},failure(type,action,stage){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_NONE);reject(error);},failureNsresult(type,action,stage,code){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_NSRESULT,code);reject(error);},failureHresult(type,action,stage,code){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_HRESULT,code);reject(error);},failureString(type,action,stage,message){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_STRING,message);reject(error);},};try{actionFn(callback);}catch(e){let error=new BitsError(gBits.ERROR_TYPE_METHOD_THREW,errorAction,gBits.ERROR_STAGE_PRETASK,gBits.ERROR_CODE_TYPE_EXCEPTION,e);reject(error);}});}
class BitsRequest{constructor(request){this._request=request;this._request.QueryInterface(Ci.nsIBitsRequest);}
shutdown(){if(this.hasShutdown){return;} 
this._name=this._request.name;this._status=this._request.status;this._bitsId=this._request.bitsId;this._transferError=this._request.transferError;this._request=null;}
get hasShutdown(){return!this._request;}
get name(){if(!this._request){return this._name;}
return this._request.name;}
isPending(){if(!this._request){return false;}
return this._request.isPending();}
get status(){if(!this._request){return this._status;}
return this._request.status;}
cancel(status){return this.cancelAsync(status);}
suspend(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_SUSPEND,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
return this._request.suspend();}
resume(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_RESUME,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
return this._request.resume();}
get loadGroup(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
return this._request.loadGroup;}
set loadGroup(group){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
this._request.loadGroup=group;}
get loadFlags(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
return this._request.loadFlags;}
set loadFlags(flags){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
this._request.loadFlags=flags;}
get bitsId(){if(!this._request){return this._bitsId;}
return this._request.bitsId;}
get transferError(){let result;if(this._request){result=this._request.transferError;}else{result=this._transferError;}
if(result==Ci.nsIBits.ERROR_TYPE_SUCCESS){return null;}
return new BitsError(result,Ci.nsIBits.ERROR_ACTION_NONE,Ci.nsIBits.ERROR_STAGE_MONITOR,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
async changeMonitorInterval(monitorIntervalMs){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_CHANGE_MONITOR_INTERVAL,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_CHANGE_MONITOR_INTERVAL;return requestPromise(action,callback=>{this._request.changeMonitorInterval(monitorIntervalMs,callback);});}
async cancelAsync(status){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_CANCEL,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
if(status===undefined){status=Cr.NS_ERROR_ABORT;}
let action=gBits.ERROR_ACTION_CANCEL;return requestPromise(action,callback=>{this._request.cancelAsync(status,callback);}).then(()=>this.shutdown());}
async setPriorityHigh(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_SET_PRIORITY,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_SET_PRIORITY;return requestPromise(action,callback=>{this._request.setPriorityHigh(callback);});}
async setPriorityLow(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_SET_PRIORITY,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_SET_PRIORITY;return requestPromise(action,callback=>{this._request.setPriorityLow(callback);});}
async setNoProgressTimeout(timeoutSecs){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_SET_NO_PROGRESS_TIMEOUT,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_SET_NO_PROGRESS_TIMEOUT;return requestPromise(action,callback=>{this._request.setNoProgressTimeout(timeoutSecs,callback);});}
async complete(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_COMPLETE,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_COMPLETE;return requestPromise(action,callback=>{this._request.complete(callback);}).then(()=>this.shutdown());}
async suspendAsync(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_SUSPEND,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_SUSPEND;return requestPromise(action,callback=>{this._request.suspendAsync(callback);});}
async resumeAsync(){if(!this._request){throw new BitsError(Ci.nsIBits.ERROR_TYPE_USE_AFTER_REQUEST_SHUTDOWN,Ci.nsIBits.ERROR_ACTION_RESUME,Ci.nsIBits.ERROR_STAGE_PRETASK,Ci.nsIBits.ERROR_CODE_TYPE_NONE);}
let action=gBits.ERROR_ACTION_RESUME;return requestPromise(action,callback=>{this._request.resumeAsync(callback);});}}
BitsRequest.prototype.QueryInterface=ChromeUtils.generateQI(["nsIRequest"]);async function servicePromise(errorAction,observer,actionFn){return new Promise((resolve,reject)=>{if(!observer){let error=new BitsError(gBits.ERROR_TYPE_NULL_ARGUMENT,errorAction,gBits.ERROR_STAGE_PRETASK,gBits.ERROR_CODE_TYPE_NONE);reject(error);return;}
try{observer.QueryInterface(Ci.nsIRequestObserver);}catch(e){let error=new BitsError(gBits.ERROR_TYPE_INVALID_ARGUMENT,errorAction,gBits.ERROR_STAGE_PRETASK,gBits.ERROR_CODE_TYPE_EXCEPTION,e);reject(error);return;}
let isProgressEventSink=false;try{observer.QueryInterface(Ci.nsIProgressEventSink);isProgressEventSink=true;}catch(e){}


let wrappedRequest;let wrappedObserver={onStartRequest:function wrappedObserver_onStartRequest(request){if(!wrappedRequest){wrappedRequest=new BitsRequest(request);}
observer.onStartRequest(wrappedRequest);},onStopRequest:function wrappedObserver_onStopRequest(request,status){if(!wrappedRequest){wrappedRequest=new BitsRequest(request);}
observer.onStopRequest(wrappedRequest,status);},onProgress:function wrappedObserver_onProgress(request,progress,progressMax){if(isProgressEventSink){if(!wrappedRequest){wrappedRequest=new BitsRequest(request);}
observer.onProgress(wrappedRequest,progress,progressMax);}},onStatus:function wrappedObserver_onStatus(request,status,statusArg){if(isProgressEventSink){if(!wrappedRequest){wrappedRequest=new BitsRequest(request);}
observer.onStatus(wrappedRequest,status,statusArg);}},QueryInterface:ChromeUtils.generateQI(["nsIRequestObserver","nsIProgressEventSink",]),};let timer=makeTimeout(reject,errorAction);let callback={QueryInterface:ChromeUtils.generateQI(["nsIBitsNewRequestCallback"]),success(request){timer.cancel();if(!wrappedRequest){wrappedRequest=new BitsRequest(request);}
resolve(wrappedRequest);},failure(type,action,stage){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_NONE);reject(error);},failureNsresult(type,action,stage,code){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_NSRESULT,code);reject(error);},failureHresult(type,action,stage,code){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_HRESULT,code);reject(error);},failureString(type,action,stage,message){timer.cancel();let error=new BitsError(type,action,stage,gBits.ERROR_CODE_TYPE_STRING,message);reject(error);},};try{actionFn(wrappedObserver,callback);}catch(e){let error=new BitsError(gBits.ERROR_TYPE_METHOD_THREW,errorAction,gBits.ERROR_STAGE_PRETASK,gBits.ERROR_CODE_TYPE_EXCEPTION,e);reject(error);}});}
var Bits={get initialized(){return gBits.initialized;},init(jobName,savePathPrefix,monitorTimeoutMs){return gBits.init(jobName,savePathPrefix,monitorTimeoutMs);},async startDownload(downloadURL,saveRelPath,proxy,noProgressTimeoutSecs,monitorIntervalMs,observer,context){let action=gBits.ERROR_ACTION_START_DOWNLOAD;return servicePromise(action,observer,(wrappedObserver,callback)=>{gBits.startDownload(downloadURL,saveRelPath,proxy,noProgressTimeoutSecs,monitorIntervalMs,wrappedObserver,context,callback);});},async monitorDownload(id,monitorIntervalMs,observer,context){let action=gBits.ERROR_ACTION_MONITOR_DOWNLOAD;return servicePromise(action,observer,(wrappedObserver,callback)=>{gBits.monitorDownload(id,monitorIntervalMs,wrappedObserver,context,callback);});},};const EXPORTED_SYMBOLS=["Bits","BitsError","BitsRequest","BitsSuccess","BitsUnknownError","BitsVerificationError",];