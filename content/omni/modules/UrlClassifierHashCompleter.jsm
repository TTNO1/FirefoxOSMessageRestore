//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

const COMPLETE_LENGTH=32;const PARTIAL_LENGTH=4;const MIN_WAIT_DURATION_MAX_VALUE=24*60*60*1000;const PREF_DEBUG_ENABLED="browser.safebrowsing.debug";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{NetUtil}=ChromeUtils.import("resource://gre/modules/NetUtil.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gDbService","@mozilla.org/url-classifier/dbservice;1","nsIUrlClassifierDBService");XPCOMUtils.defineLazyServiceGetter(this,"gUrlUtil","@mozilla.org/url-classifier/utils;1","nsIUrlClassifierUtils");let loggingEnabled=false;function log(...stuff){if(!loggingEnabled){return;}
var d=new Date();let msg="hashcompleter: "+d.toTimeString()+": "+stuff.join(" ");dump(Services.urlFormatter.trimSensitiveURLs(msg)+"\n");}


function httpStatusToBucket(httpStatus){var statusBucket;switch(httpStatus){case 100:case 101: statusBucket=0;break;case 200:statusBucket=1;break;case 201:case 202:case 203:case 205:case 206: statusBucket=2;break;case 204:statusBucket=3;break;case 300:case 301:case 302:case 303:case 304:case 305:case 307:case 308: statusBucket=4;break;case 400:statusBucket=5;break;case 401:case 402:case 405:case 406:case 407:case 409:case 410:case 411:case 412:case 414:case 415:case 416:case 417:case 421:case 426:case 428:case 429:case 431:case 451: statusBucket=6;break;case 403:statusBucket=7;break;case 404: statusBucket=8;break;case 408: statusBucket=9;break;case 413: statusBucket=10;break;case 500:case 501:case 510: statusBucket=11;break;case 502:case 504:case 511:statusBucket=12;break;case 503:
statusBucket=13;break;case 505:
statusBucket=14;break;default:statusBucket=15;}
return statusBucket;}
function FullHashMatch(table,hash,duration){this.tableName=table;this.fullHash=hash;this.cacheDuration=duration;}
FullHashMatch.prototype={QueryInterface:ChromeUtils.generateQI(["nsIFullHashMatch"]),tableName:null,fullHash:null,cacheDuration:null,};function HashCompleter(){

this._currentRequest=null;
this._ongoingRequests=[];this._pendingRequests={};this._backoffs={};this._shuttingDown=false; this._nextGethashTimeMs={};Services.obs.addObserver(this,"quit-application");Services.prefs.addObserver(PREF_DEBUG_ENABLED,this);loggingEnabled=Services.prefs.getBoolPref(PREF_DEBUG_ENABLED);}
HashCompleter.prototype={classID:Components.ID("{9111de73-9322-4bfc-8b65-2b727f3e6ec8}"),QueryInterface:ChromeUtils.generateQI(["nsIUrlClassifierHashCompleter","nsIRunnable","nsIObserver","nsISupportsWeakReference","nsITimerCallback",]),
complete:function HC_complete(aPartialHash,aGethashUrl,aTableName,aCallback){if(!aGethashUrl){throw Components.Exception("",Cr.NS_ERROR_NOT_INITIALIZED);} 
for(let r of this._ongoingRequests){if(r.find(aPartialHash,aGethashUrl,aTableName)){log("Merge gethash request in "+
aTableName+" for prefix : "+
btoa(aPartialHash));r.add(aPartialHash,aCallback,aTableName);return;}}
if(!this._currentRequest){this._currentRequest=new HashCompleterRequest(this,aGethashUrl);}
if(this._currentRequest.gethashUrl==aGethashUrl){this._currentRequest.add(aPartialHash,aCallback,aTableName);}else{if(!this._pendingRequests[aGethashUrl]){this._pendingRequests[aGethashUrl]=new HashCompleterRequest(this,aGethashUrl);}
this._pendingRequests[aGethashUrl].add(aPartialHash,aCallback,aTableName);}
if(!this._backoffs[aGethashUrl]){
var jslib=Cc["@mozilla.org/url-classifier/jslib;1"].getService().wrappedJSObject;this._backoffs[aGethashUrl]=new jslib.RequestBackoffV4(10 ,0 ,gUrlUtil.getProvider(aTableName));}
if(!this._nextGethashTimeMs[aGethashUrl]){this._nextGethashTimeMs[aGethashUrl]=0;}

Services.tm.dispatchToMainThread(this);},

run(){ if(this._shuttingDown){this._currentRequest=null;this._pendingRequests=null;this._nextGethashTimeMs=null;for(var url in this._backoffs){this._backoffs[url]=null;}
throw Components.Exception("",Cr.NS_ERROR_NOT_INITIALIZED);} 
let pendingUrls=Object.keys(this._pendingRequests);if(!this._currentRequest&&pendingUrls.length){let nextUrl=pendingUrls[0];this._currentRequest=this._pendingRequests[nextUrl];delete this._pendingRequests[nextUrl];}
if(this._currentRequest){try{if(this._currentRequest.begin()){this._ongoingRequests.push(this._currentRequest);}}finally{this._currentRequest=null;}}},
finishRequest(aRequest,aStatus){this._ongoingRequests=this._ongoingRequests.filter(v=>v!=aRequest);this._backoffs[aRequest.gethashUrl].noteServerResponse(aStatus);Services.tm.dispatchToMainThread(this);},canMakeRequest(aGethashUrl){return(this._backoffs[aGethashUrl].canMakeRequest()&&Date.now()>=this._nextGethashTimeMs[aGethashUrl]);},
noteRequest(aGethashUrl){return this._backoffs[aGethashUrl].noteRequest();},observe:function HC_observe(aSubject,aTopic,aData){switch(aTopic){case"quit-application":this._shuttingDown=true;Services.obs.removeObserver(this,"quit-application");break;case"nsPref:changed":if(aData==PREF_DEBUG_ENABLED){loggingEnabled=Services.prefs.getBoolPref(PREF_DEBUG_ENABLED);}
break;}},};function HashCompleterRequest(aCompleter,aGethashUrl){this._completer=aCompleter;this._requests=[];this._channel=null;this._response="";this._shuttingDown=false;this.gethashUrl=aGethashUrl;this.provider="";
this.tableNames=new Map();this.telemetryProvider="";this.telemetryClockStart=0;}
HashCompleterRequest.prototype={QueryInterface:ChromeUtils.generateQI(["nsIRequestObserver","nsIStreamListener","nsIObserver",]),
add:function HCR_add(aPartialHash,aCallback,aTableName){this._requests.push({partialHash:aPartialHash,callback:aCallback,tableName:aTableName,response:{matches:[]},});if(aTableName){let isTableNameV4=aTableName.endsWith("-proto");if(0===this.tableNames.size){this.isV4=isTableNameV4;}else if(this.isV4!==isTableNameV4){log('ERROR: Cannot mix "proto" tables with other types within '+"the same gethash URL.");}
if(!this.tableNames.has(aTableName)){this.tableNames.set(aTableName);} 
if(this.provider==""){this.provider=gUrlUtil.getProvider(aTableName);}
if(this.telemetryProvider==""){this.telemetryProvider=gUrlUtil.getTelemetryProvider(aTableName);}}},find:function HCR_find(aPartialHash,aGetHashUrl,aTableName){if(this.gethashUrl!=aGetHashUrl||!this.tableNames.has(aTableName)){return false;}
return this._requests.find(function(r){return r.partialHash===aPartialHash;});},fillTableStatesBase64:function HCR_fillTableStatesBase64(aCallback){gDbService.getTables(aTableData=>{aTableData.split("\n").forEach(line=>{let p=line.indexOf(";");if(-1===p){return;}
let tableName=line.substring(0,p);if(this.tableNames.has(tableName)){let metadata=line.substring(p+1).split(":");let stateBase64=metadata[0];this.tableNames.set(tableName,stateBase64);}});aCallback();});},

begin:function HCR_begin(){if(!this._completer.canMakeRequest(this.gethashUrl)){log("Can't make request to "+this.gethashUrl+"\n");this.notifyFailure(Cr.NS_ERROR_ABORT);return false;}
Services.obs.addObserver(this,"quit-application");

this.fillTableStatesBase64(()=>{try{this.openChannel();
this._completer.noteRequest(this.gethashUrl);}catch(err){this._completer._ongoingRequests=this._completer._ongoingRequests.filter(v=>v!=this);this.notifyFailure(err);throw err;}});return true;},notify:function HCR_notify(){

if(this._channel&&this._channel.isPending()){log("cancelling request to "+this.gethashUrl+" (timeout)\n");Services.telemetry.getKeyedHistogramById("URLCLASSIFIER_COMPLETE_TIMEOUT2").add(this.telemetryProvider,1);this._channel.cancel(Cr.NS_BINDING_ABORTED);}},
openChannel:function HCR_openChannel(){let loadFlags=Ci.nsIChannel.INHIBIT_CACHING|Ci.nsIChannel.LOAD_BYPASS_CACHE|Ci.nsIChannel.LOAD_BYPASS_URL_CLASSIFIER;this.request={url:this.gethashUrl,body:"",};if(this.isV4){this.request.url+="&$req="+this.buildRequestV4();}
log("actualGethashUrl: "+this.request.url);let channel=NetUtil.newChannel({uri:this.request.url,loadUsingSystemPrincipal:true,});channel.loadFlags=loadFlags;channel.loadInfo.originAttributes={
firstPartyDomain:"safebrowsing.86868755-6b82-4842-b301-72671a0db32e.mozilla",};let httpChannel=channel.QueryInterface(Ci.nsIHttpChannel);httpChannel.setRequestHeader("Connection","close",false);this._channel=channel;if(this.isV4){httpChannel.setRequestHeader("X-HTTP-Method-Override","POST",false);}else{let body=this.buildRequest();this.addRequestBody(body);}

this.timer_=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer); let timeout=Services.prefs.getIntPref("urlclassifier.gethash.timeout_ms");this.timer_.initWithCallback(this,timeout,this.timer_.TYPE_ONE_SHOT);channel.asyncOpen(this);this.telemetryClockStart=Date.now();},buildRequestV4:function HCR_buildRequestV4(){let tableNameArray=[];let stateArray=[];this.tableNames.forEach((state,name)=>{if(state){tableNameArray.push(name);stateArray.push(state);}});
 let prefixSet=new Set();this._requests.forEach(r=>prefixSet.add(btoa(r.partialHash)));let prefixArray=Array.from(prefixSet).sort();log("Build v4 gethash request with "+
JSON.stringify(tableNameArray)+", "+
JSON.stringify(stateArray)+", "+
JSON.stringify(prefixArray));return gUrlUtil.makeFindFullHashRequestV4(tableNameArray,stateArray,prefixArray);},
buildRequest:function HCR_buildRequest(){
let prefixes=[];for(let i=0;i<this._requests.length;i++){let request=this._requests[i];if(!prefixes.includes(request.partialHash)){prefixes.push(request.partialHash);}} 
prefixes.sort();let body;body=PARTIAL_LENGTH+":"+
PARTIAL_LENGTH*prefixes.length+"\n"+
prefixes.join("");log("Requesting completions for "+
prefixes.length+" "+
PARTIAL_LENGTH+"-byte prefixes: "+
body);return body;},addRequestBody:function HCR_addRequestBody(aBody){let inputStream=Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);inputStream.setData(aBody,aBody.length);let uploadChannel=this._channel.QueryInterface(Ci.nsIUploadChannel);uploadChannel.setUploadStream(inputStream,"text/plain",-1);let httpChannel=this._channel.QueryInterface(Ci.nsIHttpChannel);httpChannel.requestMethod="POST";},
handleResponse:function HCR_handleResponse(){if(this._response==""){return;}
if(this.isV4){this.handleResponseV4();return;}
let start=0;let length=this._response.length;while(start!=length){start=this.handleTable(start);}},handleResponseV4:function HCR_handleResponseV4(){let callback={
onCompleteHashFound:(aCompleteHash,aTableNames,aPerHashCacheDuration)=>{log("V4 fullhash response complete hash found callback: "+
aTableNames+", CacheDuration("+
aPerHashCacheDuration+")");let filteredTables=aTableNames.split(",").filter(name=>{return this.tableNames.get(name);});if(0===filteredTables.length){log("ERROR: Got complete hash which is from unknown table.");return;}
if(filteredTables.length>1){log("WARNING: Got complete hash which has ambigious threat type.");}
this.handleItem({completeHash:aCompleteHash,tableName:filteredTables[0],cacheDuration:aPerHashCacheDuration,});},

onResponseParsed:(aMinWaitDuration,aNegCacheDuration)=>{log("V4 fullhash response parsed callback: "+"MinWaitDuration("+
aMinWaitDuration+"), "+"NegativeCacheDuration("+
aNegCacheDuration+")");let minWaitDuration=aMinWaitDuration;if(aMinWaitDuration>MIN_WAIT_DURATION_MAX_VALUE){log("WARNING: Minimum wait duration too large, clamping it down "+"to a reasonable value.");minWaitDuration=MIN_WAIT_DURATION_MAX_VALUE;}else if(aMinWaitDuration<0){log("WARNING: Minimum wait duration is negative, reset it to 0");minWaitDuration=0;}
this._completer._nextGethashTimeMs[this.gethashUrl]=Date.now()+minWaitDuration;
this._requests.forEach(request=>{request.response.negCacheDuration=aNegCacheDuration;});},};gUrlUtil.parseFindFullHashResponseV4(this._response,callback);},handleTable:function HCR_handleTable(aStart){let body=this._response.substring(aStart);
let newlineIndex=body.indexOf("\n");if(newlineIndex==-1){throw errorWithStack();}
let header=body.substring(0,newlineIndex);let entries=header.split(":");if(entries.length!=3){throw errorWithStack();}
let list=entries[0];let addChunk=parseInt(entries[1]);let dataLength=parseInt(entries[2]);log("Response includes add chunks for "+list+": "+addChunk);if(dataLength%COMPLETE_LENGTH!=0||dataLength==0||dataLength>body.length-(newlineIndex+1)){throw errorWithStack();}
let data=body.substr(newlineIndex+1,dataLength);for(let i=0;i<dataLength/COMPLETE_LENGTH;i++){this.handleItem({completeHash:data.substr(i*COMPLETE_LENGTH,COMPLETE_LENGTH),tableName:list,chunkId:addChunk,});}
return aStart+newlineIndex+1+dataLength;},
handleItem:function HCR_handleItem(aData){let provider=gUrlUtil.getProvider(aData.tableName);if(provider!=this.provider){log("Ignoring table "+
aData.tableName+" since it belongs to "+
provider+" while the response came from "+
this.provider+".");return;}
for(let i=0;i<this._requests.length;i++){let request=this._requests[i];if(aData.completeHash.startsWith(request.partialHash)){request.response.matches.push(aData);}}},


notifySuccess:function HCR_notifySuccess(){ let completionV2=req=>{req.response.matches.forEach(m=>{req.callback.completionV2(m.completeHash,m.tableName,m.chunkId);});req.callback.completionFinished(Cr.NS_OK);}; let completionV4=req=>{let matches=Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);req.response.matches.forEach(m=>{matches.appendElement(new FullHashMatch(m.tableName,m.completeHash,m.cacheDuration));});req.callback.completionV4(req.partialHash,req.tableName,req.response.negCacheDuration,matches);req.callback.completionFinished(Cr.NS_OK);};let completion=this.isV4?completionV4:completionV2;this._requests.forEach(req=>{completion(req);});},notifyFailure:function HCR_notifyFailure(aStatus){log("notifying failure\n");for(let i=0;i<this._requests.length;i++){let request=this._requests[i];request.callback.completionFinished(aStatus);}},onDataAvailable:function HCR_onDataAvailable(aRequest,aInputStream,aOffset,aCount){let sis=Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);sis.init(aInputStream);this._response+=sis.readBytes(aCount);},onStartRequest:function HCR_onStartRequest(aRequest){
this._completer._nextGethashTimeMs[this.gethashUrl]=0;if(this.telemetryClockStart>0){let msecs=Date.now()-this.telemetryClockStart;Services.telemetry.getKeyedHistogramById("URLCLASSIFIER_COMPLETE_SERVER_RESPONSE_TIME").add(this.telemetryProvider,msecs);}},onStopRequest:function HCR_onStopRequest(aRequest,aStatusCode){Services.obs.removeObserver(this,"quit-application");if(this.timer_){this.timer_.cancel();this.timer_=null;}
this.telemetryClockStart=0;if(this._shuttingDown){throw Components.Exception("",Cr.NS_ERROR_ABORT);}

let httpStatus=503;if(Components.isSuccessCode(aStatusCode)){let channel=aRequest.QueryInterface(Ci.nsIHttpChannel);let success=channel.requestSucceeded;httpStatus=channel.responseStatus;if(!success){aStatusCode=Cr.NS_ERROR_ABORT;}}
let success=Components.isSuccessCode(aStatusCode);log("Received a "+
httpStatus+" status code from the "+
this.provider+" gethash server (success="+
success+"): "+
btoa(this._response));Services.telemetry.getKeyedHistogramById("URLCLASSIFIER_COMPLETE_REMOTE_STATUS2").add(this.telemetryProvider,httpStatusToBucket(httpStatus));if(httpStatus==400){dump("Safe Browsing server returned a 400 during completion: request= "+
this.request.url+",payload= "+
this.request.body+"\n");}
Services.telemetry.getKeyedHistogramById("URLCLASSIFIER_COMPLETE_TIMEOUT2").add(this.telemetryProvider,0);this._completer.finishRequest(this,httpStatus);if(success){try{this.handleResponse();}catch(err){log(err.stack);aStatusCode=err.value;success=false;}}
if(success){this.notifySuccess();}else{this.notifyFailure(aStatusCode);}},observe:function HCR_observe(aSubject,aTopic,aData){if(aTopic=="quit-application"){this._shuttingDown=true;if(this._channel){this._channel.cancel(Cr.NS_ERROR_ABORT);this.telemetryClockStart=0;}
Services.obs.removeObserver(this,"quit-application");}},};function errorWithStack(){let err=new Error();err.value=Cr.NS_ERROR_FAILURE;return err;}
var EXPORTED_SYMBOLS=["HashCompleter"];