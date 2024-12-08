"use strict;";ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");ChromeUtils.defineModuleGetter(this,"Log","resource://gre/modules/Log.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"CommonUtils","resource://services-common/utils.js");const{Preferences}=ChromeUtils.import("resource://gre/modules/Preferences.jsm");var EXPORTED_SYMBOLS=["LogManager"];const DEFAULT_MAX_ERROR_AGE=20*24*60*60;






var formatter;var dumpAppender;var consoleAppender;var allBranches=new Set();const ONE_BYTE=1;const ONE_KILOBYTE=1024*ONE_BYTE;const ONE_MEGABYTE=1024*ONE_KILOBYTE;const STREAM_SEGMENT_SIZE=4096;const PR_UINT32_MAX=0xffffffff;class StorageStreamAppender extends Log.Appender{constructor(formatter){super(formatter);this._name="StorageStreamAppender";this._converterStream=null; this._outputStream=null; this._ss=null;}
get outputStream(){if(!this._outputStream){this._outputStream=this.newOutputStream();if(!this._outputStream){return null;}

if(!this._converterStream){this._converterStream=Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);}
this._converterStream.init(this._outputStream,"UTF-8");}
return this._converterStream;}
newOutputStream(){let ss=(this._ss=Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream));ss.init(STREAM_SEGMENT_SIZE,PR_UINT32_MAX,null);return ss.getOutputStream(0);}
getInputStream(){if(!this._ss){return null;}
return this._ss.newInputStream(0);}
reset(){if(!this._outputStream){return;}
this.outputStream.close();this._outputStream=null;this._ss=null;}
doAppend(formatted){if(!formatted){return;}
try{this.outputStream.writeString(formatted+"\n");}catch(ex){if(ex.result==Cr.NS_BASE_STREAM_CLOSED){
this._outputStream=null;}
try{this.outputStream.writeString(formatted+"\n");}catch(ex){}}}}



class FlushableStorageAppender extends StorageStreamAppender{constructor(formatter){super(formatter);this.sawError=false;}
append(message){if(message.level>=Log.Level.Error){this.sawError=true;}
StorageStreamAppender.prototype.append.call(this,message);}
reset(){super.reset();this.sawError=false;}

async flushToFile(subdirArray,filename,log){let inStream=this.getInputStream();this.reset();if(!inStream){log.debug("Failed to flush log to a file - no input stream");return;}
log.debug("Flushing file log");log.trace("Beginning stream copy to "+filename+": "+Date.now());try{await this._copyStreamToFile(inStream,subdirArray,filename,log);log.trace("onCopyComplete",Date.now());}catch(ex){log.error("Failed to copy log stream to file",ex);}}
async _copyStreamToFile(inputStream,subdirArray,outputFileName,log){
const BUFFER_SIZE=8192; let binaryStream=Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);binaryStream.setInputStream(inputStream);let outputDirectory=OS.Path.join(OS.Constants.Path.profileDir,...subdirArray);await OS.File.makeDir(outputDirectory,{ignoreExisting:true,from:OS.Constants.Path.profileDir,});let fullOutputFileName=OS.Path.join(outputDirectory,outputFileName);let output=await OS.File.open(fullOutputFileName,{write:true});try{while(true){let available=binaryStream.available();if(!available){break;}
let chunk=binaryStream.readByteArray(Math.min(available,BUFFER_SIZE));await output.write(new Uint8Array(chunk));}}finally{try{binaryStream.close(); await output.close();}catch(ex){log.error("Failed to close the input stream",ex);}}
log.trace("finished copy to",fullOutputFileName);}}
function LogManager(prefRoot,logNames,logFilePrefix){this._prefObservers=[];this.init(prefRoot,logNames,logFilePrefix);}
LogManager.StorageStreamAppender=StorageStreamAppender;LogManager.prototype={_cleaningUpFileLogs:false,init(prefRoot,logNames,logFilePrefix){if(prefRoot instanceof Preferences){this._prefs=prefRoot;}else{this._prefs=new Preferences(prefRoot);}
this.logFilePrefix=logFilePrefix;if(!formatter){formatter=new Log.BasicFormatter();consoleAppender=new Log.ConsoleAppender(formatter);dumpAppender=new Log.DumpAppender(formatter);}
allBranches.add(this._prefs._branchStr);
let setupAppender=(appender,prefName,defaultLevel,findSmallest=false)=>{let observer=newVal=>{let level=Log.Level[newVal]||defaultLevel;if(findSmallest){


for(let branch of allBranches){let lookPrefBranch=new Preferences(branch);let lookVal=Log.Level[lookPrefBranch.get(prefName)];if(lookVal&&lookVal<level){level=lookVal;}}}
appender.level=level;};this._prefs.observe(prefName,observer,this);this._prefObservers.push([prefName,observer]);observer(this._prefs.get(prefName));return observer;};this._observeConsolePref=setupAppender(consoleAppender,"log.appender.console",Log.Level.Fatal,true);this._observeDumpPref=setupAppender(dumpAppender,"log.appender.dump",Log.Level.Error,true);let fapp=(this._fileAppender=new FlushableStorageAppender(formatter));
this._observeStreamPref=setupAppender(fapp,"log.appender.file.level",Log.Level.Debug);for(let logName of logNames){let log=Log.repository.getLogger(logName);for(let appender of[fapp,dumpAppender,consoleAppender]){log.addAppender(appender);}}
this._log=Log.repository.getLogger(logNames[0]+".LogManager");},finalize(){for(let[name,pref]of this._prefObservers){this._prefs.ignore(name,pref,this);}
this._prefObservers=[];try{allBranches.delete(this._prefs._branchStr);}catch(e){}
this._prefs=null;},get _logFileSubDirectoryEntries(){

return["weave","logs"];},get sawError(){return this._fileAppender.sawError;},SUCCESS_LOG_WRITTEN:"success-log-written",ERROR_LOG_WRITTEN:"error-log-written",async resetFileLog(){try{let flushToFile;let reasonPrefix;let reason;if(this._fileAppender.sawError){reason=this.ERROR_LOG_WRITTEN;flushToFile=this._prefs.get("log.appender.file.logOnError",true);reasonPrefix="error";}else{reason=this.SUCCESS_LOG_WRITTEN;flushToFile=this._prefs.get("log.appender.file.logOnSuccess",false);reasonPrefix="success";}
if(!flushToFile){this._fileAppender.reset();return null;}
let filename=reasonPrefix+"-"+this.logFilePrefix+"-"+Date.now()+".txt";await this._fileAppender.flushToFile(this._logFileSubDirectoryEntries,filename,this._log);


if(reason==this.ERROR_LOG_WRITTEN&&!this._cleaningUpFileLogs){this._log.trace("Running cleanup.");try{await this.cleanupLogs();}catch(err){this._log.error("Failed to cleanup logs",err);}}
return reason;}catch(ex){this._log.error("Failed to resetFileLog",ex);return null;}},cleanupLogs(){let maxAge=this._prefs.get("log.appender.file.maxErrorAge",DEFAULT_MAX_ERROR_AGE);let threshold=Date.now()-1000*maxAge;this._log.debug("Log cleanup threshold time: "+threshold);let shouldDelete=fileInfo=>{return fileInfo.lastModificationDate.getTime()<threshold;};return this._deleteLogFiles(shouldDelete);},removeAllLogs(){return this._deleteLogFiles(()=>true);},
async _deleteLogFiles(cbShouldDelete){this._cleaningUpFileLogs=true;let logDir=FileUtils.getDir("ProfD",this._logFileSubDirectoryEntries);let iterator=new OS.File.DirectoryIterator(logDir.path);await iterator.forEach(async entry=>{

if(!entry.name.startsWith("error-")&&!entry.name.startsWith("success-")){return;}
try{let info=await OS.File.stat(entry.path);if(!cbShouldDelete(info)){return;}
this._log.trace(" > Cleanup removing "+
entry.name+" ("+
info.lastModificationDate.getTime()+")");await OS.File.remove(entry.path);this._log.trace("Deleted "+entry.name);}catch(ex){this._log.debug("Encountered error trying to clean up old log file "+entry.name,ex);}});
try{await iterator.close();}catch(e){this._log.warn("Failed to close directory iterator",e);}
this._cleaningUpFileLogs=false;this._log.debug("Done deleting files.");Services.obs.notifyObservers(null,"services-tests:common:log-manager:cleanup-logs");},};