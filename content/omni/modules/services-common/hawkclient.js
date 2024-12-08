"use strict";var EXPORTED_SYMBOLS=["HawkClient"];const{HAWKAuthenticatedRESTRequest}=ChromeUtils.import("resource://services-common/hawkrequest.js");const{Observers}=ChromeUtils.import("resource://services-common/observers.js");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");


const PREF_LOG_LEVEL="services.common.hawk.log.appender.dump";
const PREF_LOG_SENSITIVE_DETAILS="services.common.hawk.log.sensitive";XPCOMUtils.defineLazyGetter(this,"log",function(){let log=Log.repository.getLogger("Hawk");

log.level=Log.Level.Debug;let appender=new Log.DumpAppender();log.addAppender(appender);appender.level=Log.Level.Error;try{let level=Services.prefs.getPrefType(PREF_LOG_LEVEL)==Ci.nsIPrefBranch.PREF_STRING&&Services.prefs.getCharPref(PREF_LOG_LEVEL);appender.level=Log.Level[level]||Log.Level.Error;}catch(e){log.error(e);}
return log;});
XPCOMUtils.defineLazyGetter(this,"logPII",function(){try{return Services.prefs.getBoolPref(PREF_LOG_SENSITIVE_DETAILS);}catch(_){return false;}});var HawkClient=function(host){this.host=host;
this._localtimeOffsetMsec=0;};this.HawkClient.prototype={_constructError(restResponse,error){let errorObj={error,

errorString:error.toString(),message:restResponse.statusText,code:restResponse.status,errno:restResponse.status,toString(){return this.code+": "+this.message;},};let retryAfter=restResponse.headers&&restResponse.headers["retry-after"];retryAfter=retryAfter?parseInt(retryAfter):retryAfter;if(retryAfter){errorObj.retryAfter=retryAfter; if(this.observerPrefix){Observers.notify(this.observerPrefix+":backoff:interval",retryAfter);}}
return errorObj;},_updateClockOffset(dateString){try{let serverDateMsec=Date.parse(dateString);this._localtimeOffsetMsec=serverDateMsec-this.now();log.debug("Clock offset vs "+this.host+": "+this._localtimeOffsetMsec);}catch(err){log.warn("Bad date header in server response: "+dateString);}},get localtimeOffsetMsec(){return this._localtimeOffsetMsec;},now(){return Date.now();},async request(path,method,credentials=null,payloadObj={},extraHeaders={},retryOK=true){method=method.toLowerCase();let uri=this.host+path;let extra={now:this.now(),localtimeOffsetMsec:this.localtimeOffsetMsec,headers:extraHeaders,};let request=this.newHAWKAuthenticatedRESTRequest(uri,credentials,extra);let error;let restResponse=await request[method](payloadObj).catch(e=>{
error=e;log.warn("hawk request error",error);return request.response;});if(!restResponse){throw error;}
let status=restResponse.status;log.debug("(Response) "+
path+": code: "+
status+" - Status text: "+
restResponse.statusText);if(logPII){log.debug("Response text",restResponse.body);}

this._maybeNotifyBackoff(restResponse,"x-weave-backoff");this._maybeNotifyBackoff(restResponse,"x-backoff");if(error){
throw this._constructError(restResponse,error);}
this._updateClockOffset(restResponse.headers.date);if(status===401&&retryOK&&!("retry-after"in restResponse.headers)){log.debug("Received 401 for "+path+": retrying");return this.request(path,method,credentials,payloadObj,extraHeaders,false);}



let jsonResponse={};try{jsonResponse=JSON.parse(restResponse.body);}catch(notJSON){}
let okResponse=200<=status&&status<300;if(!okResponse||jsonResponse.error){if(jsonResponse.error){throw jsonResponse;}
throw this._constructError(restResponse,"Request failed");}
return restResponse;},observerPrefix:null,_maybeNotifyBackoff(response,headerName){if(!this.observerPrefix||!response.headers){return;}
let headerVal=response.headers[headerName];if(!headerVal){return;}
let backoffInterval;try{backoffInterval=parseInt(headerVal,10);}catch(ex){log.error("hawkclient response had invalid backoff value in '"+
headerName+"' header: "+
headerVal);return;}
Observers.notify(this.observerPrefix+":backoff:interval",backoffInterval);},newHAWKAuthenticatedRESTRequest(uri,credentials,extra){return new HAWKAuthenticatedRESTRequest(uri,credentials,extra);},};