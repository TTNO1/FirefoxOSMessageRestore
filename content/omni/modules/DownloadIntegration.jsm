//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DownloadIntegration"];const{Integration}=ChromeUtils.import("resource://gre/modules/Integration.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"AsyncShutdown","resource://gre/modules/AsyncShutdown.jsm");ChromeUtils.defineModuleGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm");ChromeUtils.defineModuleGetter(this,"DeferredTask","resource://gre/modules/DeferredTask.jsm");ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");ChromeUtils.defineModuleGetter(this,"DownloadStore","resource://gre/modules/DownloadStore.jsm");ChromeUtils.defineModuleGetter(this,"DownloadUIHelper","resource://gre/modules/DownloadUIHelper.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");ChromeUtils.defineModuleGetter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"PlacesUtils","resource://gre/modules/PlacesUtils.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");ChromeUtils.defineModuleGetter(this,"CloudStorage","resource://gre/modules/CloudStorage.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gDownloadPlatform","@mozilla.org/toolkit/download-platform;1","mozIDownloadPlatform");XPCOMUtils.defineLazyServiceGetter(this,"gEnvironment","@mozilla.org/process/environment;1","nsIEnvironment");XPCOMUtils.defineLazyServiceGetter(this,"gMIMEService","@mozilla.org/mime;1","nsIMIMEService");XPCOMUtils.defineLazyServiceGetter(this,"gExternalProtocolService","@mozilla.org/uriloader/external-protocol-service;1","nsIExternalProtocolService");ChromeUtils.defineModuleGetter(this,"RuntimePermissions","resource://gre/modules/RuntimePermissions.jsm");XPCOMUtils.defineLazyServiceGetter(this,"volumeService","@mozilla.org/telephony/volume-service;1","nsIVolumeService");XPCOMUtils.defineLazyGetter(this,"gParentalControlsService",function(){if("@mozilla.org/parental-controls-service;1"in Cc){return Cc["@mozilla.org/parental-controls-service;1"].createInstance(Ci.nsIParentalControlsService);}
return null;});XPCOMUtils.defineLazyServiceGetter(this,"gApplicationReputationService","@mozilla.org/reputationservice/application-reputation-service;1",Ci.nsIApplicationReputationService);
Integration.downloads.defineModuleGetter(this,"gCombinedDownloadIntegration","resource://gre/modules/DownloadIntegration.jsm","DownloadIntegration");const Timer=Components.Constructor("@mozilla.org/timer;1","nsITimer","initWithCallback");const kSaveDelayMs=1500;const kObserverTopics=["quit-application-requested","offline-requested","last-pb-context-exiting","last-pb-context-exited","sleep_notification","suspend_process_notification","wake_notification","resume_process_notification","network:offline-about-to-go-offline","network:offline-status-changed","xpcom-will-shutdown",];const kVerdictMap={[Ci.nsIApplicationReputationService.VERDICT_DANGEROUS]:Downloads.Error.BLOCK_VERDICT_MALWARE,[Ci.nsIApplicationReputationService.VERDICT_UNCOMMON]:Downloads.Error.BLOCK_VERDICT_UNCOMMON,[Ci.nsIApplicationReputationService.VERDICT_POTENTIALLY_UNWANTED]:Downloads.Error.BLOCK_VERDICT_POTENTIALLY_UNWANTED,[Ci.nsIApplicationReputationService.VERDICT_DANGEROUS_HOST]:Downloads.Error.BLOCK_VERDICT_MALWARE,};var DownloadIntegration={_store:null,shouldKeepBlockedData(){const FIREFOX_ID="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";return Services.appinfo.ID==FIREFOX_ID;},async initializePublicDownloadList(list){try{await this.loadPublicDownloadListFromStore(list);}catch(ex){Cu.reportError(ex);}
if(AppConstants.MOZ_PLACES){

new DownloadHistoryObserver(list);}},async loadPublicDownloadListFromStore(list){if(this._store){throw new Error("Initialization may be performed only once.");}
this._store=new DownloadStore(list,OS.Path.join(OS.Constants.Path.profileDir,"downloads.json"));this._store.onsaveitem=this.shouldPersistDownload.bind(this);try{await this._store.load();}catch(ex){Cu.reportError(ex);}


await new DownloadAutoSaveView(list,this._store).initialize();},async _getDefaultDownloadDirectory(){let directoryPath;let win=Services.wm.getMostRecentWindow("navigator:browser");let storages=win.navigator.b2g.getDeviceStorages("sdcard");let preferredStorageName;storages.forEach(aStorage=>{if(aStorage.default||!preferredStorageName){preferredStorageName=aStorage.storageName;}});if(preferredStorageName){let volume=volumeService.getVolumeByName(preferredStorageName);if(volume&&volume.state===Ci.nsIVolume.STATE_MOUNTED){directoryPath=OS.Path.join(volume.mountPoint,"downloads");await OS.File.makeDir(directoryPath,{ignoreExisting:true});}}
if(directoryPath){return directoryPath;}
throw new Components.Exception("No suitable storage for downloads.",Cr.NS_ERROR_FILE_UNRECOGNIZED_PATH);},shouldPersistDownload(aDownload){



return(!aDownload.stopped||aDownload.hasPartialData||aDownload.hasBlockedData||AppConstants.platform=="android"||AppConstants.platform=="gonk");},async getSystemDownloadsDirectory(){if(this._downloadsDirectory){return this._downloadsDirectory;}
if(AppConstants.platform=="android"){
 this._downloadsDirectory=gEnvironment.get("DOWNLOADS_DIRECTORY");if(!this._downloadsDirectory){throw new Components.Exception("DOWNLOADS_DIRECTORY is not set.",Cr.NS_ERROR_FILE_UNRECOGNIZED_PATH);}}else if(AppConstants.platform=="gonk"){this._downloadsDirectory=this._getDefaultDownloadDirectory();}else{try{this._downloadsDirectory=this._getDirectory("DfltDwnld");}catch(e){this._downloadsDirectory=await this._createDownloadsDirectory("Home");}}
return this._downloadsDirectory;},_downloadsDirectory:null,async getPreferredDownloadsDirectory(){let directoryPath=null;if(AppConstants.platform=="gonk"){directoryPath=this._getDefaultDownloadDirectory();}else{let prefValue=Services.prefs.getIntPref("browser.download.folderList",1);switch(prefValue){case 0: directoryPath=this._getDirectory("Desk");break;case 1: directoryPath=await this.getSystemDownloadsDirectory();break;case 2: try{let directory=Services.prefs.getComplexValue("browser.download.dir",Ci.nsIFile);directoryPath=directory.path;await OS.File.makeDir(directoryPath,{ignoreExisting:true});}catch(ex){directoryPath=await this.getSystemDownloadsDirectory();}
break;case 3: try{directoryPath=await CloudStorage.getDownloadFolder();}catch(ex){}
if(!directoryPath){directoryPath=await this.getSystemDownloadsDirectory();}
break;default:directoryPath=await this.getSystemDownloadsDirectory();}}
return directoryPath;},async getTemporaryDownloadsDirectory(){let directoryPath=null;if(AppConstants.platform=="macosx"){directoryPath=await this.getPreferredDownloadsDirectory();}else if(AppConstants.platform=="android"){directoryPath=await this.getSystemDownloadsDirectory();}else{directoryPath=this._getDirectory("TmpD");}
return directoryPath;},shouldBlockForParentalControls(aDownload){let isEnabled=gParentalControlsService&&gParentalControlsService.parentalControlsEnabled;let shouldBlock=isEnabled&&gParentalControlsService.blockFileDownloadsEnabled;if(isEnabled&&gParentalControlsService.loggingEnabled){gParentalControlsService.log(gParentalControlsService.ePCLog_FileDownload,shouldBlock,NetUtil.newURI(aDownload.source.url),null);}
return Promise.resolve(shouldBlock);},async shouldBlockForRuntimePermissions(){return(AppConstants.platform=="android"&&!(await RuntimePermissions.waitForPermissions(RuntimePermissions.WRITE_EXTERNAL_STORAGE)));},shouldBlockForReputationCheck(aDownload){let hash;let sigInfo;let channelRedirects;try{hash=aDownload.saver.getSha256Hash();sigInfo=aDownload.saver.getSignatureInfo();channelRedirects=aDownload.saver.getRedirects();}catch(ex){return Promise.resolve({shouldBlock:false,verdict:"",});}
if(!hash||!sigInfo){return Promise.resolve({shouldBlock:false,verdict:"",});}
return new Promise(resolve=>{gApplicationReputationService.queryReputation({sourceURI:NetUtil.newURI(aDownload.source.url),referrerInfo:aDownload.source.referrerInfo,fileSize:aDownload.currentBytes,sha256Hash:hash,suggestedFileName:OS.Path.basename(aDownload.target.path),signatureInfo:sigInfo,redirects:channelRedirects,},function onComplete(aShouldBlock,aRv,aVerdict){resolve({shouldBlock:aShouldBlock,verdict:(aShouldBlock&&kVerdictMap[aVerdict])||"",});});});},_shouldSaveZoneInformation(){let key=Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey);try{key.open(Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,"Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Attachments",Ci.nsIWindowsRegKey.ACCESS_QUERY_VALUE);try{return key.readIntValue("SaveZoneInformation")!=1;}finally{key.close();}}catch(ex){return true;}},_zoneIdKey(aKey,aUrl,aFallback){try{let url;const uri=NetUtil.newURI(aUrl);if(["http","https","ftp"].includes(uri.scheme)){url=uri.mutate().setUserPass("").finalize().spec;}else if(aFallback){url=aFallback;}else{return"";}
return aKey+"="+url+"\r\n";}catch(e){return"";}},async downloadDone(aDownload){





if(AppConstants.platform=="win"&&this._shouldSaveZoneInformation()){let zone;try{zone=gDownloadPlatform.mapUrlToZone(aDownload.source.url);}catch(e){
zone=Ci.mozIDownloadPlatform.ZONE_INTERNET;}
try{
if(zone>=Ci.mozIDownloadPlatform.ZONE_INTERNET){let streamPath=aDownload.target.path+":Zone.Identifier";let stream=await OS.File.open(streamPath,{create:true},{winAllowLengthBeyondMaxPathWithCaveats:true});try{let zoneId="[ZoneTransfer]\r\nZoneId="+zone+"\r\n";let{url,isPrivate,referrerInfo}=aDownload.source;if(!isPrivate){let referrer=referrerInfo?referrerInfo.computedReferrerSpec:"";zoneId+=this._zoneIdKey("ReferrerUrl",referrer)+
this._zoneIdKey("HostUrl",url,"about:internet");}
await stream.write(new TextEncoder().encode(zoneId));}finally{await stream.close();}}}catch(ex){


if(!(ex instanceof OS.File.Error)||ex.winLastError!=123){Cu.reportError(ex);}}}




try{


let isTemporaryDownload=aDownload.launchWhenSucceeded&&(aDownload.source.isPrivate||Services.prefs.getBoolPref("browser.helperApps.deleteTempFileOnExit"));
let options={};if(isTemporaryDownload){options.unixMode=0o400;options.winAttributes={readOnly:true};}else{options.unixMode=0o666;}
await OS.File.setPermissions(aDownload.target.path,options);}catch(ex){


if(!(ex instanceof OS.File.Error)||ex.unixErrno!=OS.Constants.libc.EPERM){Cu.reportError(ex);}}
let aReferrer=null;if(aDownload.source.referrerInfo){aReferrer=aDownload.source.referrerInfo.originalReferrer;}
await gDownloadPlatform.downloadDone(NetUtil.newURI(aDownload.source.url),aReferrer,new FileUtils.File(aDownload.target.path),aDownload.contentType,aDownload.source.isPrivate);},shouldViewDownloadInternally(aMimeType,aExtension){
return false;},async launchDownload(aDownload,{openWhere,useSystemDefault=null}){let file=new FileUtils.File(aDownload.target.path);

let fileExtension=null,mimeInfo=null;let match=file.leafName.match(/\.([^.]+)$/);if(match){fileExtension=match[1];}
let isWindowsExe=AppConstants.platform=="win"&&fileExtension&&fileExtension.toLowerCase()=="exe";





if(file.isExecutable()&&!isWindowsExe&&!(await this.confirmLaunchExecutable(file.path))){return;}
try{

mimeInfo=gMIMEService.getFromTypeAndExtension(aDownload.contentType,fileExtension);}catch(e){}
if(aDownload.launcherPath){if(!mimeInfo){

throw new Error("Unable to create nsIMIMEInfo to launch a custom application");} 
let localHandlerApp=Cc["@mozilla.org/uriloader/local-handler-app;1"].createInstance(Ci.nsILocalHandlerApp);localHandlerApp.executable=new FileUtils.File(aDownload.launcherPath);mimeInfo.preferredApplicationHandler=localHandlerApp;mimeInfo.preferredAction=Ci.nsIMIMEInfo.useHelperApp;this.launchFile(file,mimeInfo);

aDownload.launchWhenSucceeded=false;return;}
if(!useSystemDefault&&mimeInfo){useSystemDefault=mimeInfo.preferredAction==mimeInfo.useSystemDefault;}
if(!useSystemDefault){if(aDownload.handleInternally||(mimeInfo&&this.shouldViewDownloadInternally(mimeInfo.type,fileExtension)&&!mimeInfo.alwaysAskBeforeHandling&&mimeInfo.preferredAction===Ci.nsIHandlerInfo.handleInternally&&!aDownload.launchWhenSucceeded)){DownloadUIHelper.loadFileIn(file,{browsingContextId:aDownload.source.browsingContextId,isPrivate:aDownload.source.isPrivate,openWhere,userContextId:aDownload.source.userContextId,});return;}}


aDownload.launchWhenSucceeded=false;



if(!fileExtension&&AppConstants.platform=="win"){
this.showContainingDirectory(aDownload.target.path);return;}

if(mimeInfo){mimeInfo.preferredAction=Ci.nsIMIMEInfo.useSystemDefault;try{this.launchFile(file,mimeInfo);return;}catch(ex){}}
try{this.launchFile(file);return;}catch(ex){}

gExternalProtocolService.loadURI(NetUtil.newURI(file),Services.scriptSecurityManager.getSystemPrincipal());},async confirmLaunchExecutable(path){

return DownloadUIHelper.getPrompter().confirmLaunchExecutable(path);},launchFile(file,mimeInfo){if(mimeInfo){mimeInfo.launchWithFile(file);}else{file.launch();}},async showContainingDirectory(aFilePath){let file=new FileUtils.File(aFilePath);try{file.reveal();return;}catch(ex){}

let parent=file.parent;if(!parent){throw new Error("Unexpected reference to a top-level directory instead of a file");}
try{parent.launch();return;}catch(ex){}

gExternalProtocolService.loadURI(NetUtil.newURI(parent),Services.scriptSecurityManager.getSystemPrincipal());},_createDownloadsDirectory(aName){

let directoryPath=OS.Path.join(this._getDirectory(aName),DownloadUIHelper.strings.downloadsFolder);return OS.File.makeDir(directoryPath,{ignoreExisting:true}).then(()=>directoryPath);},_getDirectory(name){return Services.dirsvc.get(name,Ci.nsIFile).path;},addListObservers(aList,aIsPrivate){DownloadObserver.registerView(aList,aIsPrivate);if(!DownloadObserver.observersAdded){DownloadObserver.observersAdded=true;for(let topic of kObserverTopics){Services.obs.addObserver(DownloadObserver,topic);}}
return Promise.resolve();},forceSave(){if(this._store){return this._store.save();}
return Promise.resolve();},};var DownloadObserver={observersAdded:false,_wakeTimer:null,_publicInProgressDownloads:new Set(),_privateInProgressDownloads:new Set(),_canceledOfflineDownloads:new Set(),registerView:function DO_registerView(aList,aIsPrivate){let downloadsSet=aIsPrivate?this._privateInProgressDownloads:this._publicInProgressDownloads;let downloadsView={onDownloadAdded:aDownload=>{if(!aDownload.stopped){downloadsSet.add(aDownload);}},onDownloadChanged:aDownload=>{if(aDownload.stopped){downloadsSet.delete(aDownload);}else{downloadsSet.add(aDownload);}},onDownloadRemoved:aDownload=>{downloadsSet.delete(aDownload);this._canceledOfflineDownloads.delete(aDownload);},};aList.addView(downloadsView).catch(Cu.reportError);},_confirmCancelDownloads:function DO_confirmCancelDownload(aCancel,aDownloadsCount,aPromptType){ if(gCombinedDownloadIntegration._testPromptDownloads){gCombinedDownloadIntegration._testPromptDownloads=aDownloadsCount;return;}
if(!aDownloadsCount){return;}
if(aCancel instanceof Ci.nsISupportsPRBool&&aCancel.data){return;}
let prompter=DownloadUIHelper.getPrompter();aCancel.data=prompter.confirmCancelDownloads(aDownloadsCount,prompter[aPromptType]);},_resumeOfflineDownloads:function DO_resumeOfflineDownloads(){this._wakeTimer=null;for(let download of this._canceledOfflineDownloads){download.start().catch(()=>{});}
this._canceledOfflineDownloads.clear();}, observe:function DO_observe(aSubject,aTopic,aData){let downloadsCount;switch(aTopic){case"quit-application-requested":downloadsCount=this._publicInProgressDownloads.size+
this._privateInProgressDownloads.size;this._confirmCancelDownloads(aSubject,downloadsCount,"ON_QUIT");break;case"offline-requested":downloadsCount=this._publicInProgressDownloads.size+
this._privateInProgressDownloads.size;this._confirmCancelDownloads(aSubject,downloadsCount,"ON_OFFLINE");break;case"last-pb-context-exiting":downloadsCount=this._privateInProgressDownloads.size;this._confirmCancelDownloads(aSubject,downloadsCount,"ON_LEAVE_PRIVATE_BROWSING");break;case"last-pb-context-exited":let promise=(async function(){let list=await Downloads.getList(Downloads.PRIVATE);let downloads=await list.getAll();for(let download of downloads){list.remove(download).catch(Cu.reportError);download.finalize(true).catch(Cu.reportError);}})(); if(gCombinedDownloadIntegration._testResolveClearPrivateList){gCombinedDownloadIntegration._testResolveClearPrivateList(promise);}else{promise.catch(ex=>Cu.reportError(ex));}
break;case"sleep_notification":case"suspend_process_notification":case"network:offline-about-to-go-offline":for(let download of this._publicInProgressDownloads){download.cancel();this._canceledOfflineDownloads.add(download);}
for(let download of this._privateInProgressDownloads){download.cancel();this._canceledOfflineDownloads.add(download);}
break;case"wake_notification":case"resume_process_notification":let wakeDelay=Services.prefs.getIntPref("browser.download.manager.resumeOnWakeDelay",10000);if(wakeDelay>=0){this._wakeTimer=new Timer(this._resumeOfflineDownloads.bind(this),wakeDelay,Ci.nsITimer.TYPE_ONE_SHOT);}
break;case"network:offline-status-changed":if(aData=="online"){this._resumeOfflineDownloads();}
break;




case"xpcom-will-shutdown":for(let topic of kObserverTopics){Services.obs.removeObserver(this,topic);}
break;}},QueryInterface:ChromeUtils.generateQI(["nsIObserver"]),};var DownloadHistoryObserver=function(aList){this._list=aList;PlacesUtils.history.addObserver(this);};DownloadHistoryObserver.prototype={_list:null,QueryInterface:ChromeUtils.generateQI(["nsINavHistoryObserver"]), onDeleteURI:function DL_onDeleteURI(aURI,aGUID){this._list.removeFinished(download=>aURI.equals(NetUtil.newURI(download.source.url)));}, onClearHistory:function DL_onClearHistory(){this._list.removeFinished();},onTitleChanged(){},onBeginUpdateBatch(){},onEndUpdateBatch(){},onPageChanged(){},onDeleteVisits(){},};var DownloadAutoSaveView=function(aList,aStore){this._list=aList;this._store=aStore;this._downloadsMap=new Map();this._writer=new DeferredTask(()=>this._store.save(),kSaveDelayMs);AsyncShutdown.profileBeforeChange.addBlocker("DownloadAutoSaveView: writing data",()=>this._writer.finalize());};DownloadAutoSaveView.prototype={_list:null,_store:null,_initialized:false,initialize(){
return this._list.addView(this).then(()=>(this._initialized=true));},_downloadsMap:null,_writer:null,saveSoon(){this._writer.arm();}, onDownloadAdded(aDownload){if(gCombinedDownloadIntegration.shouldPersistDownload(aDownload)){this._downloadsMap.set(aDownload,aDownload.getSerializationHash());if(this._initialized){this.saveSoon();}}}, onDownloadChanged(aDownload){if(!gCombinedDownloadIntegration.shouldPersistDownload(aDownload)){if(this._downloadsMap.has(aDownload)){this._downloadsMap.delete(aDownload);this.saveSoon();}
return;}
let hash=aDownload.getSerializationHash();if(this._downloadsMap.get(aDownload)!=hash){this._downloadsMap.set(aDownload,hash);this.saveSoon();}}, onDownloadRemoved(aDownload){if(this._downloadsMap.has(aDownload)){this._downloadsMap.delete(aDownload);this.saveSoon();}},};