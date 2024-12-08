"use strict";const{FileUtils}=ChromeUtils.import("resource://gre/modules/FileUtils.jsm");const DEBUG=false;var debug=function(str){dump("AdbController: "+str+"\n");};const kDefaultTimeoutHours=12;var AdbController={locked:undefined,remoteDebuggerEnabled:undefined,lockEnabled:undefined,disableAdbTimer:null,disableAdbTimeoutHours:kDefaultTimeoutHours,umsActive:false,setLockscreenEnabled(value){this.lockEnabled=value;DEBUG&&debug("setLockscreenEnabled = "+this.lockEnabled);this.updateState();},setLockscreenState(value){this.locked=value;DEBUG&&debug("setLockscreenState = "+this.locked);this.updateState();},setRemoteDebuggerState(value){this.remoteDebuggerEnabled=value;DEBUG&&debug("setRemoteDebuggerState = "+this.remoteDebuggerEnabled);this.updateState();},startDisableAdbTimer(){if(this.disableAdbTimer){this.disableAdbTimer.cancel();}else{this.disableAdbTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this.disableAdbTimeoutHours=Services.prefs.getIntPref("b2g.adb.timeout-hours",kDefaultTimeoutHours);}
if(this.disableAdbTimeoutHours<=0){DEBUG&&debug("Timer to disable ADB not started due to zero timeout");return;}
DEBUG&&debug("Starting timer to disable ADB in "+
this.disableAdbTimeoutHours+" hours");let timeoutMilliseconds=this.disableAdbTimeoutHours*60*60*1000;this.disableAdbTimer.initWithCallback(this,timeoutMilliseconds,Ci.nsITimer.TYPE_ONE_SHOT);},stopDisableAdbTimer(){DEBUG&&debug("Stopping timer to disable ADB");if(this.disableAdbTimer){this.disableAdbTimer.cancel();this.disableAdbTimer=null;}},notify(aTimer){if(aTimer==this.disableAdbTimer){this.disableAdbTimer=null;
debug("ADB timer expired - disabling ADB\n");navigator.mozSettings.createLock().set({"debugger.remote-mode":"disabled"});}},updateState(){this.umsActive=false;this.storages=navigator.b2g.getDeviceStorages("sdcard");this.updateStorageState(0);},updateStorageState(storageIndex){if(storageIndex>=this.storages.length){
this.updateStateInternal();return;}
let storage=this.storages[storageIndex];DEBUG&&debug("Checking availability of storage: '"+storage.storageName+"'");let req=storage.available();req.onsuccess=function(e){DEBUG&&debug("Storage: '"+storage.storageName+"' is '"+e.target.result+"'");if(e.target.result=="shared"){this.umsActive=true;this.updateStateInternal();return;}
this.updateStorageState(storageIndex+1);}.bind(this);req.onerror=function(e){Cu.reportError("AdbController: error querying storage availability for '"+
this.storages[storageIndex].storageName+"' (ignoring)\n");this.updateStorageState(storageIndex+1);}.bind(this);},updateStateInternal(){DEBUG&&debug("updateStateInternal: called");if(this.remoteDebuggerEnabled===undefined||this.lockEnabled===undefined||this.locked===undefined){










DEBUG&&debug("updateState: Waiting for all vars to be initialized");return;}

let isDebugging=USBRemoteDebugger.isDebugging;DEBUG&&debug("isDebugging="+isDebugging);let sysUsbConfig=libcutils.property_get("sys.usb.config").split(",");let usbFuncActive=this.umsActive||isDebugging;usbFuncActive|=sysUsbConfig.includes("rndis");usbFuncActive|=sysUsbConfig.includes("mtp");let enableAdb=this.remoteDebuggerEnabled&&(!(this.lockEnabled&&this.locked)||usbFuncActive);let useDisableAdbTimer=true;try{if(Services.prefs.getBoolPref("marionette.defaultPrefs.enabled")){


enableAdb=true;useDisableAdbTimer=false;}}catch(e){
} 
let lockFile=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);lockFile.initWithPath("/sys/power/wake_lock");if(lockFile.exists()){let foStream=Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);let coStream=Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);let str={};foStream.init(lockFile,FileUtils.MODE_RDONLY,0,0);coStream.init(foStream,"UTF-8",0,0);coStream.readString(-1,str);coStream.close();foStream.close();let wakeLockContents=str.value.replace(/\n/,"");let wakeLockList=wakeLockContents.split(" ");if(wakeLockList.includes("adb")){enableAdb=true;useDisableAdbTimer=false;DEBUG&&debug("Keeping ADB enabled as ADB wakelock is present.");}else{DEBUG&&debug("ADB wakelock not found.");}}else{DEBUG&&debug("Wake_lock file not found.");}
DEBUG&&debug("updateState: enableAdb = "+
enableAdb+" remoteDebuggerEnabled = "+
this.remoteDebuggerEnabled+" lockEnabled = "+
this.lockEnabled+" locked = "+
this.locked+" usbFuncActive = "+
usbFuncActive);let currentConfig=libcutils.property_get("persist.sys.usb.config");let configFuncs=currentConfig.split(",");if(currentConfig==""||currentConfig=="none"){configFuncs=[];}
let adbIndex=configFuncs.indexOf("adb");if(enableAdb){ if(adbIndex<0){configFuncs.push("adb");}}else if(adbIndex>=0){ configFuncs.splice(adbIndex,1);}
let newConfig=configFuncs.join(",");if(newConfig==""){
newConfig="none";}
if(newConfig!=currentConfig){DEBUG&&debug("updateState: currentConfig = "+currentConfig);DEBUG&&debug("updateState:     newConfig = "+newConfig);try{libcutils.property_set("persist.sys.usb.config",newConfig);}catch(e){Cu.reportError("Error configuring adb: "+e);}}
if(useDisableAdbTimer){if(enableAdb&&!usbFuncActive){this.startDisableAdbTimer();}else{this.stopDisableAdbTimer();}}},init(){},};