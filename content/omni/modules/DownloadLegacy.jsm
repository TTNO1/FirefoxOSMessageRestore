//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");ChromeUtils.defineModuleGetter(this,"DownloadError","resource://gre/modules/DownloadCore.jsm");function DownloadLegacyTransfer(){this._promiseDownload=new Promise(r=>(this._resolveDownload=r));}
DownloadLegacyTransfer.prototype={classID:Components.ID("{1b4c85df-cbdd-4bb6-b04e-613caece083c}"),QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener","nsIWebProgressListener2","nsITransfer",]), onStateChange:function DLT_onStateChange(aWebProgress,aRequest,aStateFlags,aStatus){if(!Components.isSuccessCode(aStatus)){this._componentFailed=true;}
if(aStateFlags&Ci.nsIWebProgressListener.STATE_START&&aStateFlags&Ci.nsIWebProgressListener.STATE_IS_NETWORK){let blockedByParentalControls=false;try{
blockedByParentalControls=aRequest instanceof Ci.nsIHttpChannel&&aRequest.responseStatus==450;}catch(e){if(e.result==Cr.NS_ERROR_NOT_AVAILABLE){aRequest.cancel(Cr.NS_BINDING_ABORTED);}}
if(blockedByParentalControls){aRequest.cancel(Cr.NS_BINDING_ABORTED);}

this._promiseDownload.then(download=>{

if(blockedByParentalControls){download._blockedByParentalControls=true;}
download.saver.onTransferStarted(aRequest);



return download.saver.deferCanceled.promise.then(()=>{if(this._cancelable&&!this._componentFailed){this._cancelable.cancel(Cr.NS_ERROR_ABORT);}});}).catch(Cu.reportError);}else if(aStateFlags&Ci.nsIWebProgressListener.STATE_STOP&&aStateFlags&Ci.nsIWebProgressListener.STATE_IS_NETWORK){
this._promiseDownload.then(download=>{
if(Components.isSuccessCode(aStatus)){download.saver.setSha256Hash(this._sha256Hash);download.saver.setSignatureInfo(this._signatureInfo);download.saver.setRedirects(this._redirects);}
download.saver.onTransferFinished(aStatus);}).catch(Cu.reportError);this._cancelable=null;}}, onProgressChange:function DLT_onProgressChange(aWebProgress,aRequest,aCurSelfProgress,aMaxSelfProgress,aCurTotalProgress,aMaxTotalProgress){this.onProgressChange64(aWebProgress,aRequest,aCurSelfProgress,aMaxSelfProgress,aCurTotalProgress,aMaxTotalProgress);},onLocationChange(){}, onStatusChange:function DLT_onStatusChange(aWebProgress,aRequest,aStatus,aMessage){

if(!Components.isSuccessCode(aStatus)){this._componentFailed=true;this._promiseDownload.then(download=>{download.saver.onTransferFinished(aStatus);}).catch(Cu.reportError);}},onSecurityChange(){},onContentBlockingEvent(){}, onProgressChange64:function DLT_onProgressChange64(aWebProgress,aRequest,aCurSelfProgress,aMaxSelfProgress,aCurTotalProgress,aMaxTotalProgress){

if(this._download){this._hasDelayedProgress=false;this._download.saver.onProgressBytes(aCurTotalProgress,aMaxTotalProgress);return;}


this._delayedCurTotalProgress=aCurTotalProgress;this._delayedMaxTotalProgress=aMaxTotalProgress;if(this._hasDelayedProgress){return;}
this._hasDelayedProgress=true;this._promiseDownload.then(download=>{
if(!this._hasDelayedProgress){return;}
download.saver.onProgressBytes(this._delayedCurTotalProgress,this._delayedMaxTotalProgress);}).catch(Cu.reportError);},_hasDelayedProgress:false,_delayedCurTotalProgress:0,_delayedMaxTotalProgress:0, onRefreshAttempted:function DLT_onRefreshAttempted(aWebProgress,aRefreshURI,aMillis,aSameURI){return true;}, init:function DLT_init(aSource,aTarget,aDisplayName,aMIMEInfo,aStartTime,aTempFile,aCancelable,aIsPrivate,aDownloadClassification){return this._nsITransferInitInternal(aSource,aTarget,aDisplayName,aMIMEInfo,aStartTime,aTempFile,aCancelable,aIsPrivate,aDownloadClassification);}, initWithBrowsingContext(aSource,aTarget,aDisplayName,aMIMEInfo,aStartTime,aTempFile,aCancelable,aIsPrivate,aDownloadClassification,aBrowsingContext,aHandleInternally){let browsingContextId;let userContextId;if(aBrowsingContext&&aBrowsingContext.currentWindowGlobal){browsingContextId=aBrowsingContext.id;let windowGlobal=aBrowsingContext.currentWindowGlobal;let originAttributes=windowGlobal.documentPrincipal.originAttributes;userContextId=originAttributes.userContextId;}
return this._nsITransferInitInternal(aSource,aTarget,aDisplayName,aMIMEInfo,aStartTime,aTempFile,aCancelable,aIsPrivate,aDownloadClassification,userContextId,browsingContextId,aHandleInternally);},_nsITransferInitInternal(aSource,aTarget,aDisplayName,aMIMEInfo,aStartTime,aTempFile,aCancelable,isPrivate,aDownloadClassification,userContextId=0,browsingContextId=0,handleInternally=false){if(aDownloadClassification==Ci.nsITransfer.DOWNLOAD_ACCEPTABLE){
this._cancelable=aCancelable;}
let launchWhenSucceeded=false,contentType=null,launcherPath=null;if(aMIMEInfo instanceof Ci.nsIMIMEInfo){launchWhenSucceeded=aMIMEInfo.preferredAction!=Ci.nsIMIMEInfo.saveToDisk;contentType=aMIMEInfo.type;let appHandler=aMIMEInfo.preferredApplicationHandler;if(aMIMEInfo.preferredAction==Ci.nsIMIMEInfo.useHelperApp&&appHandler instanceof Ci.nsILocalHandlerApp){launcherPath=appHandler.executable.path;}}


let serialisedDownload={source:{url:aSource.spec,isPrivate,userContextId,browsingContextId,},target:{path:aTarget.QueryInterface(Ci.nsIFileURL).file.path,partFilePath:aTempFile&&aTempFile.path,},saver:"legacy",launchWhenSucceeded,contentType,launcherPath,handleInternally,};

if(aDownloadClassification==Ci.nsITransfer.DOWNLOAD_POTENTIALLY_UNSAFE){serialisedDownload.errorObj={becauseBlockedByReputationCheck:true,reputationCheckVerdict:DownloadError.BLOCK_VERDICT_INSECURE,};

serialisedDownload.hasBlockedData=true;

serialisedDownload.saver="copy";}
Downloads.createDownload(serialisedDownload).then(async aDownload=>{if(aTempFile){aDownload.tryToKeepPartialData=true;}
aDownload.start().catch(()=>{});this._download=aDownload;this._resolveDownload(aDownload);await(await Downloads.getList(Downloads.ALL)).add(aDownload);if(serialisedDownload.errorObj){


aDownload._notifyChange();}}).catch(Cu.reportError);},setSha256Hash(hash){this._sha256Hash=hash;},setSignatureInfo(signatureInfo){this._signatureInfo=signatureInfo;},setRedirects(redirects){this._redirects=redirects;},_download:null,_promiseDownload:null,_resolveDownload:null,_cancelable:null,_componentFailed:false,_sha256Hash:null,_signatureInfo:null,};var EXPORTED_SYMBOLS=["DownloadLegacyTransfer"];