const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const XRE_OS_UPDATE_APPLY_TO_DIR="OSUpdApplyToD";const UPDATE_ARCHIVE_DIR="UpdArchD";const LOCAL_DIR="/data/local";const UPDATES_DIR="updates/0";const FOTA_DIR="updates/fota";XPCOMUtils.defineLazyServiceGetter(Services,"env","@mozilla.org/process/environment;1","nsIEnvironment");XPCOMUtils.defineLazyServiceGetter(Services,"um","@mozilla.org/updates/update-manager;1","nsIUpdateManager");XPCOMUtils.defineLazyServiceGetter(Services,"volumeService","@mozilla.org/telephony/volume-service;1","nsIVolumeService");XPCOMUtils.defineLazyGetter(this,"gExtStorage",function dp_gExtStorage(){return Services.env.get("EXTERNAL_STORAGE");});const gUseSDCard=true;const VERBOSE=1;var log=VERBOSE?function log_dump(msg){dump("DirectoryProvider: "+msg+"\n");}:function log_noop(msg){};function DirectoryProvider(){}
DirectoryProvider.prototype={classID:Components.ID("{9181eb7c-6f87-11e1-90b1-4f59d80dd2e5}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIDirectoryServiceProvider]),_xpcom_factory:ComponentUtils.generateSingletonFactory(DirectoryProvider),_profD:null,getFile(prop,persistent){if(AppConstants.platform==="gonk"){return this.getFileOnGonk(prop,persistent);}
return this.getFileNotGonk(prop,persistent);},getFileOnGonk(prop,persistent){if(prop==UPDATE_ARCHIVE_DIR){

 return this.getUpdateDir(persistent,UPDATES_DIR,2.1);}
if(prop==XRE_OS_UPDATE_APPLY_TO_DIR){

 return this.getUpdateDir(persistent,FOTA_DIR,1.1);}
return null;},getFileNotGonk(prop,persistent){if(prop=="ProfD"){let inParent=Services.appinfo.processType==Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT;if(inParent){return null;}
if(!this._profD){this._profD=Services.cpmm.sendSyncMessage("getProfD",{})[0];}
let file=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);file.initWithPath(this._profD);persistent.value=true;return file;}
return null;}, volumeHasFreeSpace:function dp_volumeHasFreeSpace(volumePath,requiredSpace){if(!volumePath){return false;}
if(!Services.volumeService){return false;}
let volume=Services.volumeService.createOrGetVolumeByPath(volumePath);if(!volume||volume.state!==Ci.nsIVolume.STATE_MOUNTED){return false;}
let stat=volume.getStats();if(!stat){return false;}
return requiredSpace<=stat.freeBytes;},findUpdateDirWithFreeSpace:function dp_findUpdateDirWithFreeSpace(requiredSpace,subdir){if(!Services.volumeService){return this.createUpdatesDir(LOCAL_DIR,subdir);}
let activeUpdate=Services.um.activeUpdate;if(gUseSDCard){if(this.volumeHasFreeSpace(gExtStorage,requiredSpace)){let extUpdateDir=this.createUpdatesDir(gExtStorage,subdir);if(extUpdateDir!==null){return extUpdateDir;}
log("Warning: "+
gExtStorage+" has enough free space for update "+
activeUpdate.name+", but is not writable");}}
if(this.volumeHasFreeSpace(LOCAL_DIR,requiredSpace)){let localUpdateDir=this.createUpdatesDir(LOCAL_DIR,subdir);if(localUpdateDir!==null){return localUpdateDir;}
log("Warning: "+
LOCAL_DIR+" has enough free space for update "+
activeUpdate.name+", but is not writable");}
return null;},getUpdateDir:function dp_getUpdateDir(persistent,subdir,multiple){let defaultUpdateDir=this.getDefaultUpdateDir();persistent.value=false;let activeUpdate=Services.um.activeUpdate;if(!activeUpdate){log("Warning: No active update found, using default update dir: "+
defaultUpdateDir);return defaultUpdateDir;}
let selectedPatch=activeUpdate.selectedPatch;if(!selectedPatch){log("Warning: No selected patch, using default update dir: "+
defaultUpdateDir);return defaultUpdateDir;}
let requiredSpace=selectedPatch.size*multiple;let updateDir=this.findUpdateDirWithFreeSpace(requiredSpace,subdir);if(updateDir){return updateDir;}


log("Error: No volume found with "+
requiredSpace+" bytes for downloading"+" update "+
activeUpdate.name);activeUpdate.errorCode=Cr.NS_ERROR_FILE_TOO_BIG;return null;},createUpdatesDir:function dp_createUpdatesDir(root,subdir){let dir=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);dir.initWithPath(root);if(!dir.isWritable()){log("Error: "+dir.path+" isn't writable");return null;}
dir.appendRelativePath(subdir);if(dir.exists()){if(dir.isDirectory()&&dir.isWritable()){return dir;}

log("Error: "+dir.path+" is a file or isn't writable");return null;}

try{dir.create(Ci.nsIFile.DIRECTORY_TYPE,parseInt("0770",8));}catch(e){log("Error: "+dir.path+" unable to create directory");return null;}
return dir;},getDefaultUpdateDir:function dp_getDefaultUpdateDir(){let path=gExtStorage;if(!path){path=LOCAL_DIR;}
if(Services.volumeService){let extVolume=Services.volumeService.createOrGetVolumeByPath(path);if(!extVolume){path=LOCAL_DIR;}}
let dir=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);dir.initWithPath(path);if(!dir.exists()&&path!=LOCAL_DIR){ dir.initWithPath(LOCAL_DIR);if(!dir.exists()){throw Components.Exception("",Cr.NS_ERROR_FILE_NOT_FOUND);}}
dir.appendRelativePath("updates");return dir;},};this.NSGetFactory=ComponentUtils.generateNSGetFactory([DirectoryProvider]);