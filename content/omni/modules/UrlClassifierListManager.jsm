//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");


const minDelayMs=5*60*1000;const maxDelayMs=24*60*60*1000;const defaultUpdateIntervalMs=30*60*1000;const PREF_DEBUG_ENABLED="browser.safebrowsing.debug";const PREF_TEST_NOTIFICATIONS="browser.safebrowsing.test-notifications.enabled";let loggingEnabled=false;this.log=function log(...stuff){if(!loggingEnabled){return;}
var d=new Date();let msg="listmanager: "+d.toTimeString()+": "+stuff.join(" ");msg=Services.urlFormatter.trimSensitiveURLs(msg);Services.console.logStringMessage(msg);dump(msg+"\n");};this.PROT_ListManager=function PROT_ListManager(){loggingEnabled=Services.prefs.getBoolPref(PREF_DEBUG_ENABLED);log("Initializing list manager");this.updateInterval=defaultUpdateIntervalMs;
this.tablesData={};this.needsUpdate_={};


this.updateCheckers_={};this.requestBackoffs_={}; this.registered=false;this.dbService_=Cc["@mozilla.org/url-classifier/dbservice;1"].getService(Ci.nsIUrlClassifierDBService);Services.obs.addObserver(this,"quit-application");Services.prefs.addObserver(PREF_DEBUG_ENABLED,this);};PROT_ListManager.prototype.registerTable=function(tableName,providerName,updateUrl,gethashUrl){this.registered=true;this.tablesData[tableName]={};if(!updateUrl){log("Can't register table "+tableName+" without updateUrl");return false;}
log("registering "+tableName+" with "+updateUrl);this.tablesData[tableName].updateUrl=updateUrl;this.tablesData[tableName].gethashUrl=gethashUrl;this.tablesData[tableName].provider=providerName;if(!this.needsUpdate_[updateUrl]){this.needsUpdate_[updateUrl]={};this.requestBackoffs_[updateUrl]=new RequestBackoffV4(4 ,60*60*1000 ,providerName );}
this.needsUpdate_[updateUrl][tableName]=false;return true;};PROT_ListManager.prototype.unregisterTable=function(tableName){log("unregistering "+tableName);var table=this.tablesData[tableName];if(table){if(!this.updatesNeeded_(table.updateUrl)&&this.updateCheckers_[table.updateUrl]){this.updateCheckers_[table.updateUrl].cancel();this.updateCheckers_[table.updateUrl]=null;}
delete this.needsUpdate_[table.updateUrl][tableName];}
delete this.tablesData[tableName];};PROT_ListManager.prototype.shutdown_=function(){this.stopUpdateCheckers();for(var name in this.tablesData){delete this.tablesData[name];}
Services.obs.removeObserver(this,"quit-application");Services.prefs.removeObserver(PREF_DEBUG_ENABLED,this);};PROT_ListManager.prototype.observe=function(aSubject,aTopic,aData){switch(aTopic){case"quit-application":this.shutdown_();break;case"nsPref:changed":if(aData==PREF_DEBUG_ENABLED){loggingEnabled=Services.prefs.getBoolPref(PREF_DEBUG_ENABLED);}
break;}};PROT_ListManager.prototype.getGethashUrl=function(tableName){if(this.tablesData[tableName]&&this.tablesData[tableName].gethashUrl){return this.tablesData[tableName].gethashUrl;}
return"";};PROT_ListManager.prototype.getUpdateUrl=function(tableName){if(this.tablesData[tableName]&&this.tablesData[tableName].updateUrl){return this.tablesData[tableName].updateUrl;}
return"";};PROT_ListManager.prototype.enableUpdate=function(tableName){var table=this.tablesData[tableName];if(table){log("Enabling table updates for "+tableName);this.needsUpdate_[table.updateUrl][tableName]=true;}};PROT_ListManager.prototype.isRegistered=function(){return this.registered;};PROT_ListManager.prototype.updatesNeeded_=function(updateUrl){let updatesNeeded=false;for(var tableName in this.needsUpdate_[updateUrl]){if(this.needsUpdate_[updateUrl][tableName]){updatesNeeded=true;}}
return updatesNeeded;};PROT_ListManager.prototype.disableAllUpdates=function(){for(const tableName of Object.keys(this.tablesData)){this.disableUpdate(tableName);}};PROT_ListManager.prototype.disableUpdate=function(tableName){var table=this.tablesData[tableName];if(table){log("Disabling table updates for "+tableName);this.needsUpdate_[table.updateUrl][tableName]=false;if(!this.updatesNeeded_(table.updateUrl)&&this.updateCheckers_[table.updateUrl]){this.updateCheckers_[table.updateUrl].cancel();this.updateCheckers_[table.updateUrl]=null;}}};PROT_ListManager.prototype.requireTableUpdates=function(){for(var name in this.tablesData){ if(this.needsUpdate_[this.tablesData[name].updateUrl][name]){return true;}}
return false;};PROT_ListManager.prototype.setUpdateCheckTimer=function(updateUrl,delay){this.updateCheckers_[updateUrl]=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this.updateCheckers_[updateUrl].initWithCallback(()=>{this.updateCheckers_[updateUrl]=null;if(updateUrl&&!this.checkForUpdates(updateUrl)){this.setUpdateCheckTimer(updateUrl,this.updateInterval);}},delay,Ci.nsITimer.TYPE_ONE_SHOT);};PROT_ListManager.prototype.kickoffUpdate_=function(){this.startingUpdate_=false;var initialUpdateDelay=3000;initialUpdateDelay+=Math.floor(Math.random()*(1*60*1000));log("needsUpdate: "+JSON.stringify(this.needsUpdate_,undefined,2));for(var updateUrl in this.needsUpdate_){


if(this.updatesNeeded_(updateUrl)&&!this.updateCheckers_[updateUrl]){let provider=null;Object.keys(this.tablesData).forEach(function(table){if(this.tablesData[table].updateUrl===updateUrl){let newProvider=this.tablesData[table].provider;if(provider){if(newProvider!==provider){log("Multiple tables for the same updateURL have a different provider?!");}}else{provider=newProvider;}}},this);log("Initializing update checker for "+
updateUrl+" provided by "+
provider);
let updateDelay=initialUpdateDelay;let nextUpdatePref="browser.safebrowsing.provider."+provider+".nextupdatetime";let nextUpdate=Services.prefs.getCharPref(nextUpdatePref,"");if(nextUpdate){updateDelay=Math.min(maxDelayMs,Math.max(0,nextUpdate-Date.now()));log("Next update at "+nextUpdate);}
log("Next update "+Math.round(updateDelay/60000)+"min from now");this.setUpdateCheckTimer(updateUrl,updateDelay);}else{log("No updates needed or already initialized for "+updateUrl);}}};PROT_ListManager.prototype.stopUpdateCheckers=function(){log("Stopping updates");for(var updateUrl in this.updateCheckers_){if(this.updateCheckers_[updateUrl]){this.updateCheckers_[updateUrl].cancel();this.updateCheckers_[updateUrl]=null;}}};PROT_ListManager.prototype.maybeToggleUpdateChecking=function(){
if(this.requireTableUpdates()){log("Starting managing lists");
if(!this.startingUpdate_){this.startingUpdate_=true; this.kickoffUpdate_();}}else{log("Stopping managing lists (if currently active)");this.stopUpdateCheckers();}};PROT_ListManager.prototype.forceUpdates=function(tables){log("forceUpdates with "+tables);if(!tables){return false;}
let updateUrls=new Set();tables.split(",").forEach(table=>{if(this.tablesData[table]){updateUrls.add(this.tablesData[table].updateUrl);}});let ret=true;updateUrls.forEach(url=>{if(this.updateCheckers_[url]){this.updateCheckers_[url].cancel();this.updateCheckers_[url]=null;}
if(!this.checkForUpdates(url,true)){ret=false;}});return ret;};PROT_ListManager.prototype.checkForUpdates=function(updateUrl,manual=false){log("checkForUpdates with "+updateUrl);if(!updateUrl){return false;}

if(Services.appinfo.inSafeMode&&!manual){log("update is disabled in Safe Mode");return false;}
if(enableTestNotifications){Services.obs.notifyObservers(null,"safebrowsing-update-attempt",updateUrl);}
if(!this.requestBackoffs_[updateUrl]||!this.requestBackoffs_[updateUrl].canMakeRequest()){log("Can't make update request");return false;} 
this.dbService_.getTables(BindToObject(this.makeUpdateRequest_,this,updateUrl));return true;};PROT_ListManager.prototype.makeUpdateRequest_=function(updateUrl,tableData){log("this.tablesData: "+JSON.stringify(this.tablesData,undefined,2));log("existing chunks: "+tableData+"\n"); if(!updateUrl){return;}


var streamerMap={tableList:null,tableNames:{},requestPayload:"",isPostRequest:true,};let useProtobuf=false;let onceThru=false;for(var tableName in this.tablesData){ if(this.tablesData[tableName].updateUrl!=updateUrl){continue;}
let isCurTableProto=tableName.endsWith("-proto");if(!onceThru){useProtobuf=isCurTableProto;onceThru=true;}else if(useProtobuf!==isCurTableProto){log('ERROR: Cannot mix "proto" tables with other types '+"within the same provider.");}
if(this.needsUpdate_[this.tablesData[tableName].updateUrl][tableName]){streamerMap.tableNames[tableName]=true;}
if(!streamerMap.tableList){streamerMap.tableList=tableName;}else{streamerMap.tableList+=","+tableName;}}
if(useProtobuf){let tableArray=[];Object.keys(streamerMap.tableNames).forEach(aTableName=>{if(streamerMap.tableNames[aTableName]){tableArray.push(aTableName);}});let tableState={};tableData.split("\n").forEach(line=>{let p=line.indexOf(";");if(-1===p){return;}
let tableName=line.substring(0,p);if(tableName in streamerMap.tableNames){let metadata=line.substring(p+1).split(":");let stateBase64=metadata[0];log(tableName+" ==> "+stateBase64);tableState[tableName]=stateBase64;}});



let stateArray=[];tableArray.forEach(listName=>{stateArray.push(tableState[listName]||"");});log("stateArray: "+stateArray);let urlUtils=Cc["@mozilla.org/url-classifier/utils;1"].getService(Ci.nsIUrlClassifierUtils);streamerMap.requestPayload=urlUtils.makeUpdateRequestV4(tableArray,stateArray);streamerMap.isPostRequest=false;}else{
 var lines=tableData.split("\n");for(var i=0;i<lines.length;i++){var fields=lines[i].split(";");var name=fields[0];if(streamerMap.tableNames[name]){streamerMap.requestPayload+=lines[i]+"\n";delete streamerMap.tableNames[name];}} 
for(let tableName in streamerMap.tableNames){streamerMap.requestPayload+=tableName+";\n";}
streamerMap.isPostRequest=true;}
log("update request: "+JSON.stringify(streamerMap,undefined,2)+"\n");if(streamerMap.requestPayload.length){this.makeUpdateRequestForEntry_(updateUrl,streamerMap.tableList,streamerMap.requestPayload,streamerMap.isPostRequest);}else{log("Not sending empty request");}};PROT_ListManager.prototype.makeUpdateRequestForEntry_=function(updateUrl,tableList,requestPayload,isPostRequest){log("makeUpdateRequestForEntry_: requestPayload "+
requestPayload+" update: "+
updateUrl+" tablelist: "+
tableList+"\n");var streamer=Cc["@mozilla.org/url-classifier/streamupdater;1"].getService(Ci.nsIUrlClassifierStreamUpdater);this.requestBackoffs_[updateUrl].noteRequest();if(!streamer.downloadUpdates(tableList,requestPayload,isPostRequest,updateUrl,BindToObject(this.updateSuccess_,this,tableList,updateUrl),BindToObject(this.updateError_,this,tableList,updateUrl),BindToObject(this.downloadError_,this,tableList,updateUrl))){log("pending update, queued request until later");}else{let table=Object.keys(this.tablesData).find(key=>{return this.tablesData[key].updateUrl===updateUrl;});let provider=this.tablesData[table].provider;Services.obs.notifyObservers(null,"safebrowsing-update-begin",provider);}};PROT_ListManager.prototype.updateSuccess_=function(tableList,updateUrl,waitForUpdateSec){log("update success for "+
tableList+" from "+
updateUrl+": "+
waitForUpdateSec+"\n");var delay=0;if(waitForUpdateSec){delay=parseInt(waitForUpdateSec,10)*1000;}


if(delay>maxDelayMs){log("Ignoring delay from server (too long), waiting "+
Math.round(maxDelayMs/60000)+"min");delay=maxDelayMs;}else if(delay<minDelayMs){log("Ignoring delay from server (too short), waiting "+
Math.round(this.updateInterval/60000)+"min");delay=this.updateInterval;}else{log("Waiting "+Math.round(delay/60000)+"min");}
this.setUpdateCheckTimer(updateUrl,delay);this.requestBackoffs_[updateUrl].noteServerResponse(200);
 let tables=tableList.split(",");let provider=null;for(let table of tables){let newProvider=this.tablesData[table].provider;if(provider){if(newProvider!==provider){log("Multiple tables for the same updateURL have a different provider?!");}}else{provider=newProvider;}}
let lastUpdatePref="browser.safebrowsing.provider."+provider+".lastupdatetime";let now=Date.now();log("Setting last update of "+provider+" to "+now);Services.prefs.setCharPref(lastUpdatePref,now.toString());let nextUpdatePref="browser.safebrowsing.provider."+provider+".nextupdatetime";let targetTime=now+delay;log("Setting next update of "+
provider+" to "+
targetTime+" ("+
Math.round(delay/60000)+"min from now)");Services.prefs.setCharPref(nextUpdatePref,targetTime.toString());Services.obs.notifyObservers(null,"safebrowsing-update-finished","success");};PROT_ListManager.prototype.updateError_=function(table,updateUrl,result){log("update error for "+table+" from "+updateUrl+": "+result+"\n");
this.setUpdateCheckTimer(updateUrl,this.updateInterval);Services.obs.notifyObservers(null,"safebrowsing-update-finished","update error: "+result);};PROT_ListManager.prototype.downloadError_=function(table,updateUrl,status){log("download error for "+table+": "+status+"\n");
if(!status){status=500;}
status=parseInt(status,10);this.requestBackoffs_[updateUrl].noteServerResponse(status);var delay=this.updateInterval;if(this.requestBackoffs_[updateUrl].isErrorStatus(status)){ delay=this.requestBackoffs_[updateUrl].nextRequestDelay();}else{log("Got non error status for error callback?!");}
this.setUpdateCheckTimer(updateUrl,delay);Services.obs.notifyObservers(null,"safebrowsing-update-finished","download error: "+status);};PROT_ListManager.prototype.getBackOffTime=function(provider){let updateUrl="";for(var table in this.tablesData){if(this.tablesData[table].provider==provider){updateUrl=this.tablesData[table].updateUrl;break;}}
if(!updateUrl||!this.requestBackoffs_[updateUrl]){return 0;}
let delay=this.requestBackoffs_[updateUrl].nextRequestDelay();return delay==0?0:Date.now()+delay;};PROT_ListManager.prototype.QueryInterface=ChromeUtils.generateQI(["nsIUrlListManager","nsIObserver","nsITimerCallback",]);var modScope=this;function Init(){var jslib=Cc["@mozilla.org/url-classifier/jslib;1"].getService().wrappedJSObject;modScope.BindToObject=jslib.BindToObject;modScope.RequestBackoffV4=jslib.RequestBackoffV4;modScope.Init=function(){};}
function RegistrationData(){Init();return new PROT_ListManager();}
XPCOMUtils.defineLazyPreferenceGetter(this,"enableTestNotifications",PREF_TEST_NOTIFICATIONS,false);var EXPORTED_SYMBOLS=["RegistrationData"];