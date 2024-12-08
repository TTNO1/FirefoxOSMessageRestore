"use strict";const{Cc,Ci,Cr,Cu,components:Components}=require("chrome");const ChromeUtils=require("ChromeUtils");const Services=require("Services");loader.lazyRequireGetter(this,"NetworkHelper","devtools/shared/webconsole/network-helper");loader.lazyRequireGetter(this,"DevToolsUtils","devtools/shared/DevToolsUtils");loader.lazyRequireGetter(this,"CacheEntry","devtools/shared/platform/cache-entry",true);loader.lazyImporter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");loader.lazyGetter(this,"WebExtensionPolicy",()=>Cu.getGlobalForObject(Cu).WebExtensionPolicy); function NetworkResponseListener(owner,httpActivity){this.owner=owner;this.receivedData="";this.httpActivity=httpActivity;this.bodySize=0;this.truncated=false;const channel=this.httpActivity.channel;this._wrappedNotificationCallbacks=channel.notificationCallbacks;channel.notificationCallbacks=this;}
exports.NetworkResponseListener=NetworkResponseListener;NetworkResponseListener.prototype={QueryInterface:ChromeUtils.generateQI(["nsIStreamListener","nsIInputStreamCallback","nsIRequestObserver","nsIInterfaceRequestor",]), getInterface(iid){if(iid.equals(Ci.nsIProgressEventSink)){return this;}
if(this._wrappedNotificationCallbacks){return this._wrappedNotificationCallbacks.getInterface(iid);}
throw Components.Exception("",Cr.NS_ERROR_NO_INTERFACE);},_forwardNotification(iid,method,args){if(!this._wrappedNotificationCallbacks){return;}
try{const impl=this._wrappedNotificationCallbacks.getInterface(iid);impl[method].apply(impl,args);}catch(e){if(e.result!=Cr.NS_ERROR_NO_INTERFACE){throw e;}}},_foundOpenResponse:false,_wrappedNotificationCallbacks:null,owner:null,sink:null,httpActivity:null,receivedData:null,bodySize:null,transferredSize:null,request:null,setAsyncListener:function(stream,listener){stream.asyncWait(listener,0,0,Services.tm.mainThread);},onDataAvailable:function(request,inputStream,offset,count){this._findOpenResponse();const data=NetUtil.readInputStreamToString(inputStream,count);this.bodySize+=count;if(!this.httpActivity.discardResponseBody){const limit=Services.prefs.getIntPref("devtools.netmonitor.responseBodyLimit");if(this.receivedData.length<=limit||limit==0){this.receivedData+=NetworkHelper.convertToUnicode(data,request.contentCharset);}
if(this.receivedData.length>limit&&limit>0){this.receivedData=this.receivedData.substr(0,limit);this.truncated=true;}}},onStartRequest:function(request){request=request.QueryInterface(Ci.nsIChannel);if(this.request){return;}
this.request=request;this._getSecurityInfo();this._findOpenResponse();
this.offset=0;const channel=this.request;



let isOptimizedContent=false;try{if(channel instanceof Ci.nsICacheInfoChannel){isOptimizedContent=channel.alternativeDataType;}}catch(e){}
if(isOptimizedContent){let charset;try{charset=this.request.contentCharset;}catch(e){
}
if(!charset){charset=this.httpActivity.charset;}
NetworkHelper.loadFromCache(this.httpActivity.url,charset,this._onComplete.bind(this));return;}





if(!this.httpActivity.fromServiceWorker&&channel instanceof Ci.nsIEncodedChannel&&channel.contentEncodings&&!channel.applyConversion){const encodingHeader=channel.getResponseHeader("Content-Encoding");const scs=Cc["@mozilla.org/streamConverters;1"].getService(Ci.nsIStreamConverterService);const encodings=encodingHeader.split(/\s*\t*,\s*\t*/);let nextListener=this;const acceptedEncodings=["gzip","deflate","br","x-gzip","x-deflate",];for(const i in encodings){ const enc=encodings[i].toLowerCase();if(acceptedEncodings.indexOf(enc)>-1){this.converter=scs.asyncConvertData(enc,"uncompressed",nextListener,null);nextListener=this.converter;}}
if(this.converter){this.converter.onStartRequest(this.request,null);}}
this.setAsyncListener(this.sink.inputStream,this);},_getSecurityInfo:DevToolsUtils.makeInfallible(function(){

if(Services.appinfo.processType==Ci.nsIXULRuntime.PROCESS_TYPE_CONTENT){return;}



const secinfo=this.httpActivity.channel.securityInfo;if(secinfo){secinfo.QueryInterface(Ci.nsITransportSecurityInfo);}
const info=NetworkHelper.parseSecurityInfo(secinfo,this.httpActivity);let isRacing=false;try{const channel=this.httpActivity.channel;if(channel instanceof Ci.nsICacheInfoChannel){isRacing=channel.isRacing();}}catch(err){}
this.httpActivity.owner.addSecurityInfo(info,isRacing);}),_fetchCacheInformation:function(){const httpActivity=this.httpActivity;CacheEntry.getCacheEntry(this.request,descriptor=>{httpActivity.owner.addResponseCache({responseCache:descriptor,});});},onStopRequest:function(){
if(!this.httpActivity){return;}
this._findOpenResponse();this.sink.outputStream.close();}, onProgress:function(request,progress,progressMax){this.transferredSize=progress;
this._forwardNotification(Ci.nsIProgressEventSink,"onProgress",arguments);},onStatus:function(){this._forwardNotification(Ci.nsIProgressEventSink,"onStatus",arguments);},_findOpenResponse:function(){if(!this.owner||this._foundOpenResponse){return;}
const channel=this.httpActivity.channel;const openResponse=this.owner.openResponses.getChannelById(channel.channelId);if(!openResponse){return;}
this._foundOpenResponse=true;this.owner.openResponses.delete(channel);this.httpActivity.owner.addResponseHeaders(openResponse.headers);this.httpActivity.owner.addResponseCookies(openResponse.cookies);},onStreamClose:function(){if(!this.httpActivity){return;}
this.setAsyncListener(this.sink.inputStream,null);this._findOpenResponse();if(this.request.fromCache||this.httpActivity.responseStatus==304){this._fetchCacheInformation();}
if(!this.httpActivity.discardResponseBody&&this.receivedData.length){this._onComplete(this.receivedData);}else if(!this.httpActivity.discardResponseBody&&this.httpActivity.responseStatus==304){let charset;try{charset=this.request.contentCharset;}catch(e){
}
if(!charset){charset=this.httpActivity.charset;}
NetworkHelper.loadFromCache(this.httpActivity.url,charset,this._onComplete.bind(this));}else{this._onComplete();}},_onComplete:function(data){const response={mimeType:"",text:data||"",};response.size=this.bodySize;response.transferredSize=this.transferredSize+this.httpActivity.headersSize;try{response.mimeType=this.request.contentType;}catch(ex){}
if(!response.mimeType||!NetworkHelper.isTextMimeType(response.mimeType)){response.encoding="base64";try{response.text=btoa(response.text);}catch(err){}}
if(response.mimeType&&this.request.contentCharset){response.mimeType+="; charset="+this.request.contentCharset;}
this.receivedData="";let id;let reason;try{const properties=this.request.QueryInterface(Ci.nsIPropertyBag);reason=this.request.loadInfo.requestBlockingReason;id=properties.getProperty("cancelledByExtension"); if(typeof WebExtensionPolicy!=="undefined"){id=WebExtensionPolicy.getByID(id).name;}}catch(err){}
this.httpActivity.owner.addResponseContent(response,{discardResponseBody:this.httpActivity.discardResponseBody,truncated:this.truncated,blockedReason:reason,blockingExtension:id,});this._wrappedNotificationCallbacks=null;this.httpActivity=null;this.sink=null;this.inputStream=null;this.converter=null;this.request=null;this.owner=null;},onInputStreamReady:function(stream){if(!(stream instanceof Ci.nsIAsyncInputStream)||!this.httpActivity){return;}
let available=-1;try{available=stream.available();}catch(ex){}
if(available!=-1){if(available!=0){if(this.converter){this.converter.onDataAvailable(this.request,stream,this.offset,available);}else{this.onDataAvailable(this.request,stream,this.offset,available);}}
this.offset+=available;this.setAsyncListener(stream,this);}else{this.onStreamClose();this.offset=0;}},};