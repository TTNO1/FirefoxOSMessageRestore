//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["JSONFile"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"AsyncShutdown","resource://gre/modules/AsyncShutdown.jsm");ChromeUtils.defineModuleGetter(this,"DeferredTask","resource://gre/modules/DeferredTask.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");XPCOMUtils.defineLazyGetter(this,"gTextDecoder",function(){return new TextDecoder();});XPCOMUtils.defineLazyGetter(this,"gTextEncoder",function(){return new TextEncoder();});const FileInputStream=Components.Constructor("@mozilla.org/network/file-input-stream;1","nsIFileInputStream","init");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const kSaveDelayMs=1500;const TELEMETRY_BASENAMES=new Set(["logins","autofillprofiles"]); function JSONFile(config){this.path=config.path;if(typeof config.dataPostProcessor==="function"){this._dataPostProcessor=config.dataPostProcessor;}
if(typeof config.beforeSave==="function"){this._beforeSave=config.beforeSave;}
if(config.saveDelayMs===undefined){config.saveDelayMs=kSaveDelayMs;}
this._saver=new DeferredTask(()=>this._save(),config.saveDelayMs);this._options={};if(config.compression){this._options.compression=config.compression;}
if(config.backupTo){this._options.backupTo=config.backupTo;}
this._finalizeAt=config.finalizeAt||AsyncShutdown.profileBeforeChange;this._finalizeInternalBound=this._finalizeInternal.bind(this);this._finalizeAt.addBlocker("JSON store: writing data",this._finalizeInternalBound);Services.telemetry.setEventRecordingEnabled("jsonfile",true);}
JSONFile.prototype={path:"",dataReady:false,_saver:null,_data:null,_finalizeAt:null,_finalizePromise:null,_finalizeInternalBound:null,get data(){if(!this.dataReady){throw new Error("Data is not ready.");}
return this._data;},set data(data){this._data=data;this.dataReady=true;},async load(){if(this.dataReady){return;}
let data={};try{let bytes=await OS.File.read(this.path,this._options);if(this.dataReady){return;}
data=JSON.parse(gTextDecoder.decode(bytes));}catch(ex){

let cleansedBasename=OS.Path.basename(this.path).replace(/\.json$/,"").replaceAll(/[^a-zA-Z0-9_.]/g,"");let errorNo=ex.winLastError||ex.unixErrno;this._recordTelemetry("load",cleansedBasename,errorNo?errorNo.toString():"");if(!(ex instanceof OS.File.Error&&ex.becauseNoSuchFile)){Cu.reportError(ex);try{let openInfo=await OS.File.openUnique(this.path+".corrupt",{humanReadable:true,});await openInfo.file.close();await OS.File.move(this.path,openInfo.path);this._recordTelemetry("load",cleansedBasename,"invalid_json");}catch(e2){Cu.reportError(e2);}}
if(this._options.backupTo){

try{await OS.File.copy(this._options.backupTo,this.path);}catch(e){if(!(e instanceof OS.File.Error&&ex.becauseNoSuchFile)){Cu.reportError(e);}}
try{

let bytes=await OS.File.read(this._options.backupTo,this._options);if(this.dataReady){return;}
data=JSON.parse(gTextDecoder.decode(bytes));this._recordTelemetry("load",cleansedBasename,"used_backup");}catch(e3){if(!(e3 instanceof OS.File.Error&&ex.becauseNoSuchFile)){Cu.reportError(e3);}}}



if(this.dataReady){return;}}
this._processLoadedData(data);},ensureDataReady(){if(this.dataReady){return;}
let data={};try{let inputStream=new FileInputStream(new FileUtils.File(this.path),FileUtils.MODE_RDONLY,FileUtils.PERMS_FILE,0);try{let bytes=NetUtil.readInputStream(inputStream,inputStream.available());data=JSON.parse(gTextDecoder.decode(bytes));}finally{inputStream.close();}}catch(ex){

if(!(ex instanceof Components.Exception&&ex.result==Cr.NS_ERROR_FILE_NOT_FOUND)){Cu.reportError(ex);try{let originalFile=new FileUtils.File(this.path);let backupFile=originalFile.clone();backupFile.leafName+=".corrupt";backupFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,FileUtils.PERMS_FILE);backupFile.remove(false);originalFile.moveTo(backupFile.parent,backupFile.leafName);}catch(e2){Cu.reportError(e2);}}
if(this._options.backupTo){

try{let basename=OS.Path.basename(this.path);let backupFile=new FileUtils.File(this._options.backupTo);backupFile.copyTo(null,basename);}catch(e){if(e.result!=Cr.NS_ERROR_FILE_TARGET_DOES_NOT_EXIST&&e.result!=Cr.NS_ERROR_FILE_NOT_FOUND){Cu.reportError(e);}}
try{

let inputStream=new FileInputStream(new FileUtils.File(this._options.backupTo),FileUtils.MODE_RDONLY,FileUtils.PERMS_FILE,0);try{let bytes=NetUtil.readInputStream(inputStream,inputStream.available());data=JSON.parse(gTextDecoder.decode(bytes));}finally{inputStream.close();}}catch(e3){if(e3.result!=Cr.NS_ERROR_FILE_TARGET_DOES_NOT_EXIST&&e3.result!=Cr.NS_ERROR_FILE_NOT_FOUND){Cu.reportError(e3);}}}}
this._processLoadedData(data);},saveSoon(){return this._saver.arm();},async _save(){let json;try{json=JSON.stringify(this._data);}catch(e){if(typeof this._data.toJSONSafe=="function"){json=JSON.stringify(this._data.toJSONSafe());}else{throw e;}}
let bytes=gTextEncoder.encode(json);if(this._beforeSave){await Promise.resolve(this._beforeSave());}
await OS.File.writeAtomic(this.path,bytes,Object.assign({tmpPath:this.path+".tmp"},this._options));},_processLoadedData(data){if(this._finalizePromise){
return;}
this.data=this._dataPostProcessor?this._dataPostProcessor(data):data;},_recordTelemetry(method,cleansedBasename,value){if(!TELEMETRY_BASENAMES.has(cleansedBasename)){return;}
Services.telemetry.recordEvent("jsonfile",method,cleansedBasename,value);},_finalizeInternal(){if(this._finalizePromise){
return this._finalizePromise;}
this._finalizePromise=(async()=>{await this._saver.finalize();this._data=null;this.dataReady=false;})();return this._finalizePromise;},async finalize(){if(this._finalizePromise){throw new Error(`The file ${this.path} has already been finalized`);}
await this._finalizeInternal();this._finalizeAt.removeBlocker(this._finalizeInternalBound);},};