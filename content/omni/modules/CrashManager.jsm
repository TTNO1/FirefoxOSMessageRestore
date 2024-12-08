//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const myScope=this;ChromeUtils.import("resource://gre/modules/Log.jsm",this);ChromeUtils.import("resource://gre/modules/osfile.jsm",this);const{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");ChromeUtils.import("resource://gre/modules/Services.jsm",this);const{TelemetryController}=ChromeUtils.import("resource://gre/modules/TelemetryController.jsm");ChromeUtils.import("resource://gre/modules/Timer.jsm",this);ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm",this);var EXPORTED_SYMBOLS=["CrashManager","getCrashManager"];const AGGREGATE_STARTUP_DELAY_MS=57000;const MILLISECONDS_IN_DAY=24*60*60*1000;
function dateToDays(date){return Math.floor(date.getTime()/MILLISECONDS_IN_DAY);}
function getAndRemoveField(obj,field){let value=null;if(field in obj){value=obj[field];delete obj[field];}
return value;}
function parseAndRemoveField(obj,field){let value=null;if(field in obj){try{value=JSON.parse(obj[field]);}catch(e){Cu.reportError(e);}
delete obj[field];}
return value;}
var CrashManager=function(options){this._log=Log.repository.getLogger("Crashes.CrashManager");for(let k in options){let value=options[k];switch(k){case"pendingDumpsDir":case"submittedDumpsDir":case"eventsDirs":case"storeDir":let key="_"+k;delete this[key];Object.defineProperty(this,key,{value});break;case"telemetryStoreSizeKey":this._telemetryStoreSizeKey=value;break;default:throw new Error("Unknown property in options: "+k);}}

this._aggregatePromise=null;this._crashPromises=new Map();this._pingPromise=null;this._store=null;
this._getStoreTask=null;this._storeTimer=null;
this._storeProtectedCount=0;};CrashManager.prototype=Object.freeze({PROCESS_TYPE_MAIN:"main",PROCESS_TYPE_CONTENT:"content",PROCESS_TYPE_PLUGIN:"plugin",PROCESS_TYPE_GMPLUGIN:"gmplugin",PROCESS_TYPE_GPU:"gpu",PROCESS_TYPE_VR:"vr",PROCESS_TYPE_RDD:"rdd",PROCESS_TYPE_SOCKET:"socket",CRASH_TYPE_CRASH:"crash",CRASH_TYPE_HANG:"hang",SUBMISSION_RESULT_OK:"ok",SUBMISSION_RESULT_FAILED:"failed",DUMP_REGEX:/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.dmp$/i,SUBMITTED_REGEX:/^bp-(?:hr-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.txt$/i,ALL_REGEX:/^(.*)$/,
STORE_EXPIRATION_MS:60*1000,PURGE_OLDER_THAN_DAYS:180,EVENT_FILE_SUCCESS:"ok",EVENT_FILE_ERROR_MALFORMED:"malformed",EVENT_FILE_ERROR_OBSOLETE:"obsolete",EVENT_FILE_ERROR_UNKNOWN_EVENT:"unknown-event",_lazyGetDir(field,path,leaf){delete this[field];let value=OS.Path.join(path,leaf);Object.defineProperty(this,field,{value});return value;},get _crDir(){return this._lazyGetDir("_crDir",OS.Constants.Path.userApplicationDataDir,"Crash Reports");},get _storeDir(){return this._lazyGetDir("_storeDir",OS.Constants.Path.profileDir,"crashes");},get _pendingDumpsDir(){return this._lazyGetDir("_pendingDumpsDir",this._crDir,"pending");},get _submittedDumpsDir(){return this._lazyGetDir("_submittedDumpsDir",this._crDir,"submitted");},get _eventsDirs(){delete this._eventsDirs;let value=[OS.Path.join(this._crDir,"events"),OS.Path.join(this._storeDir,"events"),];Object.defineProperty(this,"_eventsDirs",{value});return value;},pendingDumps(){return this._getDirectoryEntries(this._pendingDumpsDir,this.DUMP_REGEX);},submittedDumps(){return this._getDirectoryEntries(this._submittedDumpsDir,this.SUBMITTED_REGEX);},aggregateEventsFiles(){if(this._aggregatePromise){return this._aggregatePromise;}
return(this._aggregatePromise=(async()=>{if(this._aggregatePromise){return this._aggregatePromise;}
try{let unprocessedFiles=await this._getUnprocessedEventsFiles();let deletePaths=[];let needsSave=false;this._storeProtectedCount++;for(let entry of unprocessedFiles){try{let result=await this._processEventFile(entry);switch(result){case this.EVENT_FILE_SUCCESS:needsSave=true;case this.EVENT_FILE_ERROR_MALFORMED:case this.EVENT_FILE_ERROR_OBSOLETE:deletePaths.push(entry.path);break;case this.EVENT_FILE_ERROR_UNKNOWN_EVENT:break;default:Cu.reportError("Unhandled crash event file return code. Please "+"file a bug: "+
result);}}catch(ex){if(ex instanceof OS.File.Error){this._log.warn("I/O error reading "+entry.path,ex);}else{


Cu.reportError("Exception when processing crash event file: "+
Log.exceptionStr(ex));deletePaths.push(entry.path);}}}
if(needsSave){let store=await this._getStore();await store.save();}
for(let path of deletePaths){try{await OS.File.remove(path);}catch(ex){this._log.warn("Error removing event file ("+path+")",ex);}}
return unprocessedFiles.length;}finally{this._aggregatePromise=false;this._storeProtectedCount--;}})());},pruneOldCrashes(date){return(async()=>{let store=await this._getStore();store.pruneOldCrashes(date);await store.save();})();},runMaintenanceTasks(){return(async()=>{await this.aggregateEventsFiles();let offset=this.PURGE_OLDER_THAN_DAYS*MILLISECONDS_IN_DAY;await this.pruneOldCrashes(new Date(Date.now()-offset));})();},scheduleMaintenance(delay){let deferred=PromiseUtils.defer();setTimeout(()=>{this.runMaintenanceTasks().then(deferred.resolve,deferred.reject);},delay);return deferred.promise;},addCrash(processType,crashType,id,date,metadata){let promise=(async()=>{let store=await this._getStore();if(store.addCrash(processType,crashType,id,date,metadata)){await store.save();}
let deferred=this._crashPromises.get(id);if(deferred){this._crashPromises.delete(id);deferred.resolve();} 
if(processType===this.PROCESS_TYPE_CONTENT||processType===this.PROCESS_TYPE_GPU||processType===this.PROCESS_TYPE_VR||processType===this.PROCESS_TYPE_RDD||processType===this.PROCESS_TYPE_SOCKET){this._sendCrashPing(id,processType,date,metadata);}})();return promise;},async ensureCrashIsPresent(id){let store=await this._getStore();let crash=store.getCrash(id);if(crash){return Promise.resolve();}
let deferred=PromiseUtils.defer();this._crashPromises.set(id,deferred);return deferred.promise;},async setRemoteCrashID(crashID,remoteID){let store=await this._getStore();if(store.setRemoteCrashID(crashID,remoteID)){await store.save();}},generateSubmissionID(){return("sub-"+
Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString().slice(1,-1));},async addSubmissionAttempt(crashID,submissionID,date){let store=await this._getStore();if(store.addSubmissionAttempt(crashID,submissionID,date)){await store.save();}},async addSubmissionResult(crashID,submissionID,date,result){let store=await this._getStore();if(store.addSubmissionResult(crashID,submissionID,date,result)){await store.save();}},async setCrashClassifications(crashID,classifications){let store=await this._getStore();if(store.setCrashClassifications(crashID,classifications)){await store.save();}},_getUnprocessedEventsFiles(){return(async()=>{let entries=[];for(let dir of this._eventsDirs){for(let e of await this._getDirectoryEntries(dir,this.ALL_REGEX)){entries.push(e);}}
entries.sort((a,b)=>{return a.date-b.date;});return entries;})();},_processEventFile(entry){return(async()=>{let data=await OS.File.read(entry.path);let store=await this._getStore();let decoder=new TextDecoder();data=decoder.decode(data);let type,time;let start=0;for(let i=0;i<2;i++){let index=data.indexOf("\n",start);if(index==-1){return this.EVENT_FILE_ERROR_MALFORMED;}
let sub=data.substring(start,index);switch(i){case 0:type=sub;break;case 1:time=sub;try{time=parseInt(time,10);}catch(ex){return this.EVENT_FILE_ERROR_MALFORMED;}}
start=index+1;}
let date=new Date(time*1000);let payload=data.substring(start);return this._handleEventFilePayload(store,entry,type,date,payload);})();},_filterAnnotations(annotations){let filteredAnnotations={};let crashReporter=Cc["@mozilla.org/toolkit/crash-reporter;1"].getService(Ci.nsICrashReporter);for(let line in annotations){try{if(crashReporter.isAnnotationWhitelistedForPing(line)){filteredAnnotations[line]=annotations[line];}}catch(e){}}
return filteredAnnotations;},_sendCrashPing(crashId,type,date,metadata={}){
let reportMeta=Cu.cloneInto(metadata,myScope);let crashEnvironment=parseAndRemoveField(reportMeta,"TelemetryEnvironment");let sessionId=getAndRemoveField(reportMeta,"TelemetrySessionId");let stackTraces=getAndRemoveField(reportMeta,"StackTraces");let minidumpSha256Hash=getAndRemoveField(reportMeta,"MinidumpSha256Hash"); reportMeta=this._filterAnnotations(reportMeta);this._pingPromise=TelemetryController.submitExternalPing("crash",{version:1,crashDate:date.toISOString().slice(0,10), crashTime:date.toISOString().slice(0,13)+":00:00.000Z", sessionId,crashId,minidumpSha256Hash,processType:type,stackTraces,metadata:reportMeta,hasCrashEnvironment:crashEnvironment!==null,},{addClientId:true,addEnvironment:true,overrideEnvironment:crashEnvironment,});},_handleEventFilePayload(store,entry,type,date,payload){
let lines=payload.split("\n");switch(type){case"crash.main.1":case"crash.main.2":return this.EVENT_FILE_ERROR_OBSOLETE;case"crash.main.3":let crashID=lines[0];let metadata=JSON.parse(lines[1]);store.addCrash(this.PROCESS_TYPE_MAIN,this.CRASH_TYPE_CRASH,crashID,date,metadata);if(!("CrashPingUUID"in metadata)){

this._sendCrashPing(crashID,this.PROCESS_TYPE_MAIN,date,metadata);}
break;case"crash.submission.1":if(lines.length==3){let[crashID,result,remoteID]=lines;store.addCrash(this.PROCESS_TYPE_MAIN,this.CRASH_TYPE_CRASH,crashID,date);let submissionID=this.generateSubmissionID();let succeeded=result==="true";store.addSubmissionAttempt(crashID,submissionID,date);store.addSubmissionResult(crashID,submissionID,date,succeeded?this.SUBMISSION_RESULT_OK:this.SUBMISSION_RESULT_FAILED);if(succeeded){store.setRemoteCrashID(crashID,remoteID);}}else{return this.EVENT_FILE_ERROR_MALFORMED;}
break;default:return this.EVENT_FILE_ERROR_UNKNOWN_EVENT;}
return this.EVENT_FILE_SUCCESS;},_getDirectoryEntries(path,re){return(async function(){try{await OS.File.stat(path);}catch(ex){if(!(ex instanceof OS.File.Error)||!ex.becauseNoSuchFile){throw ex;}
return[];}
let it=new OS.File.DirectoryIterator(path);let entries=[];try{await it.forEach((entry,index,it)=>{if(entry.isDir){return undefined;}
let match=re.exec(entry.name);if(!match){return undefined;}
return OS.File.stat(entry.path).then(info=>{entries.push({path:entry.path,id:match[1],date:info.lastModificationDate,});});});}finally{it.close();}
entries.sort((a,b)=>{return a.date-b.date;});return entries;})();},_getStore(){if(this._getStoreTask){return this._getStoreTask;}
return(this._getStoreTask=(async()=>{try{if(!this._store){await OS.File.makeDir(this._storeDir,{ignoreExisting:true,unixMode:OS.Constants.libc.S_IRWXU,});let store=new CrashStore(this._storeDir,this._telemetryStoreSizeKey);await store.load();this._store=store;this._storeTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}



this._storeTimer.cancel();
let timerCB=()=>{if(this._storeProtectedCount){this._storeTimer.initWithCallback(timerCB,this.STORE_EXPIRATION_MS,this._storeTimer.TYPE_ONE_SHOT);return;}


this._store=null;this._storeTimer=null;};this._storeTimer.initWithCallback(timerCB,this.STORE_EXPIRATION_MS,this._storeTimer.TYPE_ONE_SHOT);return this._store;}finally{this._getStoreTask=null;}})());},getCrashes(){return(async()=>{let store=await this._getStore();return store.crashes;})();},getCrashCountsByDay(){return(async()=>{let store=await this._getStore();return store._countsByDay;})();},});var gCrashManager;function CrashStore(storeDir,telemetrySizeKey){this._storeDir=storeDir;this._telemetrySizeKey=telemetrySizeKey;this._storePath=OS.Path.join(storeDir,"store.json.mozlz4");this._data=null;
this._countsByDay=new Map();}
CrashStore.prototype=Object.freeze({
HIGH_WATER_DAILY_THRESHOLD:500,reset(){this._data={v:1,crashes:new Map(),corruptDate:null,};this._countsByDay=new Map();},load(){return(async()=>{this.reset();try{let decoder=new TextDecoder();let data=await OS.File.read(this._storePath,{compression:"lz4"});data=JSON.parse(decoder.decode(data));if(data.corruptDate){this._data.corruptDate=new Date(data.corruptDate);}

let actualCounts=new Map();



for(let id in data.crashes){if(id.endsWith("-submission")){continue;}
let crash=data.crashes[id];let denormalized=this._denormalize(crash);denormalized.submissions=new Map();if(crash.submissions){for(let submissionID in crash.submissions){let submission=crash.submissions[submissionID];denormalized.submissions.set(submissionID,this._denormalize(submission));}}
this._data.crashes.set(id,denormalized);let key=dateToDays(denormalized.crashDate)+"-"+denormalized.type;actualCounts.set(key,(actualCounts.get(key)||0)+1);
if(denormalized.metadata&&denormalized.metadata.OOMAllocationSize){let oomKey=key+"-oom";actualCounts.set(oomKey,(actualCounts.get(oomKey)||0)+1);}}

for(let dayKey in data.countsByDay){let day=parseInt(dayKey,10);for(let type in data.countsByDay[day]){this._ensureCountsForDay(day);let count=data.countsByDay[day][type];let key=day+"-"+type;
if(!actualCounts.has(key)){continue;}

count=Math.max(count,actualCounts.get(key));this._countsByDay.get(day).set(type,count);}}}catch(ex){if(!(ex instanceof OS.File.Error)||!ex.becauseNoSuchFile){


this._data.corruptDate=new Date();}}})();},save(){return(async()=>{if(!this._data){return;}
let normalized={
v:1,crashes:{},


countsByDay:{},corruptDate:null,};if(this._data.corruptDate){normalized.corruptDate=this._data.corruptDate.getTime();}
for(let[id,crash]of this._data.crashes){let c=this._normalize(crash);c.submissions={};for(let[submissionID,submission]of crash.submissions){c.submissions[submissionID]=this._normalize(submission);}
normalized.crashes[id]=c;}
for(let[day,m]of this._countsByDay){normalized.countsByDay[day]={};for(let[type,count]of m){normalized.countsByDay[day][type]=count;}}
let encoder=new TextEncoder();let data=encoder.encode(JSON.stringify(normalized));let size=await OS.File.writeAtomic(this._storePath,data,{tmpPath:this._storePath+".tmp",compression:"lz4",});if(this._telemetrySizeKey){Services.telemetry.getHistogramById(this._telemetrySizeKey).add(size);}})();},_normalize(o){let normalized={};for(let k in o){let v=o[k];if(v&&k.endsWith("Date")){normalized[k]=v.getTime();}else{normalized[k]=v;}}
return normalized;},_denormalize(o){let n={};for(let k in o){let v=o[k];if(v&&k.endsWith("Date")){n[k]=new Date(parseInt(v,10));}else{n[k]=v;}}
return n;},pruneOldCrashes(date){for(let crash of this.crashes){let newest=crash.newestDate;if(!newest||newest.getTime()<date.getTime()){this._data.crashes.delete(crash.id);}}},get corruptDate(){return this._data.corruptDate;},get crashesCount(){return this._data.crashes.size;},get crashes(){let crashes=[];for(let[,crash]of this._data.crashes){crashes.push(new CrashRecord(crash));}
return crashes;},getCrash(id){for(let crash of this.crashes){if(crash.id==id){return crash;}}
return null;},_ensureCountsForDay(day){if(!this._countsByDay.has(day)){this._countsByDay.set(day,new Map());}},_ensureCrashRecord(processType,crashType,id,date,metadata){if(!id){
return null;}
let type=processType+"-"+crashType;if(!this._data.crashes.has(id)){let day=dateToDays(date);this._ensureCountsForDay(day);let count=(this._countsByDay.get(day).get(type)||0)+1;this._countsByDay.get(day).set(type,count);if(count>this.HIGH_WATER_DAILY_THRESHOLD&&processType!=CrashManager.prototype.PROCESS_TYPE_MAIN){return null;}

if(metadata&&metadata.OOMAllocationSize){let oomType=type+"-oom";let oomCount=(this._countsByDay.get(day).get(oomType)||0)+1;this._countsByDay.get(day).set(oomType,oomCount);}
this._data.crashes.set(id,{id,remoteID:null,type,crashDate:date,submissions:new Map(),classifications:[],metadata,});}
let crash=this._data.crashes.get(id);crash.type=type;crash.crashDate=date;return crash;},addCrash(processType,crashType,id,date,metadata){return!!this._ensureCrashRecord(processType,crashType,id,date,metadata);},setRemoteCrashID(crashID,remoteID){let crash=this._data.crashes.get(crashID);if(!crash||!remoteID){return false;}
crash.remoteID=remoteID;return true;},getCrashesOfType(processType,crashType){let crashes=[];for(let crash of this.crashes){if(crash.isOfType(processType,crashType)){crashes.push(crash);}}
return crashes;},_ensureSubmissionRecord(crashID,submissionID){let crash=this._data.crashes.get(crashID);if(!crash||!submissionID){return null;}
if(!crash.submissions.has(submissionID)){crash.submissions.set(submissionID,{requestDate:null,responseDate:null,result:null,});}
return[crash.submissions.get(submissionID),crash];},addSubmissionAttempt(crashID,submissionID,date){let[submission,crash]=this._ensureSubmissionRecord(crashID,submissionID);if(!submission){return false;}
submission.requestDate=date;Services.telemetry.getKeyedHistogramById("PROCESS_CRASH_SUBMIT_ATTEMPT").add(crash.type,1);return true;},addSubmissionResult(crashID,submissionID,date,result){let crash=this._data.crashes.get(crashID);if(!crash||!submissionID){return false;}
let submission=crash.submissions.get(submissionID);if(!submission){return false;}
submission.responseDate=date;submission.result=result;Services.telemetry.getKeyedHistogramById("PROCESS_CRASH_SUBMIT_SUCCESS").add(crash.type,result=="ok");return true;},setCrashClassifications(crashID,classifications){let crash=this._data.crashes.get(crashID);if(!crash){return false;}
crash.classifications=classifications;return true;},});function CrashRecord(o){this._o=o;}
CrashRecord.prototype=Object.freeze({get id(){return this._o.id;},get remoteID(){return this._o.remoteID;},get crashDate(){return this._o.crashDate;},get newestDate(){return this._o.crashDate;},get oldestDate(){return this._o.crashDate;},get type(){return this._o.type;},isOfType(processType,crashType){return processType+"-"+crashType==this.type;},get submissions(){return this._o.submissions;},get classifications(){return this._o.classifications;},get metadata(){return this._o.metadata;},});XPCOMUtils.defineLazyGetter(CrashManager,"Singleton",function(){if(gCrashManager){return gCrashManager;}
gCrashManager=new CrashManager({telemetryStoreSizeKey:"CRASH_STORE_COMPRESSED_BYTES",});




gCrashManager.scheduleMaintenance(AGGREGATE_STARTUP_DELAY_MS);return gCrashManager;});function getCrashManager(){return CrashManager.Singleton;}