










"use strict";const{Ci}=require("chrome");loader.lazyRequireGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm",true);loader.lazyRequireGetter(this,"OS","resource://gre/modules/osfile.jsm",true);function getHeapSnapshotFileTemplate(){return OS.Path.join(OS.Constants.Path.tmpDir,`${Date.now()}.fxsnapshot`);}
exports.getNewUniqueHeapSnapshotTempFilePath=function(){const file=new FileUtils.File(getHeapSnapshotFileTemplate());

file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,0o666);return file.path;};function isValidSnapshotFileId(snapshotId){return/^\d+(\-\d+)?$/.test(snapshotId);}
exports.getHeapSnapshotTempFilePath=function(snapshotId){
if(!isValidSnapshotFileId(snapshotId)){return null;}
return OS.Path.join(OS.Constants.Path.tmpDir,snapshotId+".fxsnapshot");};exports.haveHeapSnapshotTempFile=function(snapshotId){const path=exports.getHeapSnapshotTempFilePath(snapshotId);if(!path){return Promise.resolve(false);}
return OS.File.stat(path).then(()=>true,()=>false);};