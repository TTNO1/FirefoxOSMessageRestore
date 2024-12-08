//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ProfileAge"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{TelemetryUtils}=ChromeUtils.import("resource://gre/modules/TelemetryUtils.jsm");const{OS}=ChromeUtils.import("resource://gre/modules/osfile.jsm");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const{CommonUtils}=ChromeUtils.import("resource://services-common/utils.js");const FILE_TIMES="times.json";function getElapsedTimeInDays(aStartDate,aEndDate){return TelemetryUtils.millisecondsToDays(aEndDate-aStartDate);}
async function getOldestProfileTimestamp(profilePath,log){let start=Date.now();let oldest=start+1000;let iterator=new OS.File.DirectoryIterator(profilePath);log.debug("Iterating over profile "+profilePath);if(!iterator){throw new Error("Unable to fetch oldest profile entry: no profile iterator.");}
Services.telemetry.scalarAdd("telemetry.profile_directory_scans",1);let histogram=Services.telemetry.getHistogramById("PROFILE_DIRECTORY_FILE_AGE");try{await iterator.forEach(async entry=>{try{let info=await OS.File.stat(entry.path);let date=info.winBirthDate||info.macBirthDate;if(!date||!date.getTime()){

log.debug("No birth date. Using mtime.");date=info.lastModificationDate;}
if(date){let timestamp=date.getTime();let age_in_days=Math.max(0,getElapsedTimeInDays(timestamp,start));histogram.add(age_in_days);log.debug("Using date: "+entry.path+" = "+date);if(timestamp<oldest){oldest=timestamp;}}}catch(e){log.debug("Stat failure",e);}});}catch(reason){throw new Error("Unable to fetch oldest profile entry: "+reason);}finally{iterator.close();}
return oldest;}
class ProfileAgeImpl{constructor(profile,times){this.profilePath=profile||OS.Constants.Path.profileDir;this._times=times;this._log=Log.repository.getLogger("Toolkit.ProfileAge");if("firstUse"in this._times&&this._times.firstUse===null){this._times.firstUse=Date.now();this.writeTimes();}}
get created(){if(this._created){return this._created;}
if(!this._times.created){this._created=this.computeAndPersistCreated();}else{this._created=Promise.resolve(this._times.created);}
return this._created;}
get firstUse(){if("firstUse"in this._times){return Promise.resolve(this._times.firstUse);}
return Promise.resolve(undefined);}
writeTimes(){return CommonUtils.writeJSON(this._times,OS.Path.join(this.profilePath,FILE_TIMES));}
async computeAndPersistCreated(){let oldest=await getOldestProfileTimestamp(this.profilePath,this._log);this._times.created=oldest;Services.telemetry.scalarSet("telemetry.profile_directory_scan_date",TelemetryUtils.millisecondsToDays(Date.now()));await this.writeTimes();return oldest;}
recordProfileReset(time=Date.now()){this._times.reset=time;return this.writeTimes();}
get reset(){if("reset"in this._times){return Promise.resolve(this._times.reset);}
return Promise.resolve(undefined);}}
const PROFILES=new Map();async function initProfileAge(profile){let timesPath=OS.Path.join(profile,FILE_TIMES);try{let times=await CommonUtils.readJSON(timesPath);return new ProfileAgeImpl(profile,times||{});}catch(e){

 return new ProfileAgeImpl(profile,{firstUse:null});}}
function ProfileAge(profile=OS.Constants.Path.profileDir){if(PROFILES.has(profile)){return PROFILES.get(profile);}
let promise=initProfileAge(profile);PROFILES.set(profile,promise);return promise;}