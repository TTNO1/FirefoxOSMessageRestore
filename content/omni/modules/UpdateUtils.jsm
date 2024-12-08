//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["UpdateUtils"];const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{FileUtils}=ChromeUtils.import("resource://gre/modules/FileUtils.jsm");const{OS}=ChromeUtils.import("resource://gre/modules/osfile.jsm");const{ctypes}=ChromeUtils.import("resource://gre/modules/ctypes.jsm");ChromeUtils.defineModuleGetter(this,"WindowsVersionInfo","resource://gre/modules/components-utils/WindowsVersionInfo.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["fetch"]);ChromeUtils.defineModuleGetter(this,"WindowsRegistry","resource://gre/modules/WindowsRegistry.jsm");

const FILE_UPDATE_CONFIG_JSON="update-config.json";const FILE_UPDATE_LOCALE="update.locale";const PREF_APP_DISTRIBUTION="distribution.id";const PREF_APP_DISTRIBUTION_VERSION="distribution.version";const PREF_APP_UPDATE_AUTO="app.update.auto";const PREF_APP_UPDATE_AUTO_MIGRATED="app.update.auto.migrated";
const CONFIG_APP_UPDATE_AUTO="app.update.auto";
const DEFAULT_APP_UPDATE_AUTO=true;var UpdateUtils={_locale:undefined,getUpdateChannel(aIncludePartners=true){let defaults=Services.prefs.getDefaultBranch(null);let channel=defaults.getCharPref("app.update.channel",AppConstants.MOZ_UPDATE_CHANNEL);if(aIncludePartners){try{let partners=Services.prefs.getChildList("app.partner.").sort();if(partners.length){channel+="-cck";partners.forEach(function(prefName){channel+="-"+Services.prefs.getCharPref(prefName);});}}catch(e){Cu.reportError(e);}}
return channel;},get UpdateChannel(){return this.getUpdateChannel();},async formatUpdateURL(url){const locale=await this.getLocale();return url.replace(/%(\w+)%/g,(match,name)=>{switch(name){case"PRODUCT":return Services.appinfo.name;case"VERSION":return Services.appinfo.version;case"BUILD_ID":return Services.appinfo.appBuildID;case"BUILD_TARGET":return Services.appinfo.OS+"_"+this.ABI;case"OS_VERSION":return this.OSVersion;case"LOCALE":return locale;case"CHANNEL":return this.UpdateChannel;case"PLATFORM_VERSION":return Services.appinfo.platformVersion;case"SYSTEM_CAPABILITIES":return getSystemCapabilities();case"DISTRIBUTION":return getDistributionPrefValue(PREF_APP_DISTRIBUTION);case"DISTRIBUTION_VERSION":return getDistributionPrefValue(PREF_APP_DISTRIBUTION_VERSION);}
return match;}).replace(/\+/g,"%2B");},async getLocale(){if(this._locale!==undefined){return this._locale;}
for(let res of["app","gre"]){const url="resource://"+res+"/"+FILE_UPDATE_LOCALE;let data;try{data=await fetch(url);}catch(e){continue;}
const locale=await data.text();if(locale){return(this._locale=locale.trim());}}
Cu.reportError(FILE_UPDATE_LOCALE+" file doesn't exist in either the "+"application or GRE directories");return(this._locale=null);},getAppUpdateAutoEnabled(){if(Services.policies){if(!Services.policies.isAllowed("app-auto-updates-off")){return Promise.resolve(true);}
if(!Services.policies.isAllowed("app-auto-updates-on")){return Promise.resolve(false);}}
if(AppConstants.platform!="win"){let prefValue=Services.prefs.getBoolPref(PREF_APP_UPDATE_AUTO,DEFAULT_APP_UPDATE_AUTO);return Promise.resolve(prefValue);}





let readPromise=updateAutoIOPromise.catch(()=>{}).then(async()=>{try{let configValue=await readUpdateAutoConfig();
Services.prefs.setBoolPref(PREF_APP_UPDATE_AUTO_MIGRATED,true);return configValue;}catch(e){
Services.console.logStringMessage("UpdateUtils.getAppUpdateAutoEnabled - Unable to read app update "+"configuration file. Exception: "+
e);let valueMigrated=Services.prefs.getBoolPref(PREF_APP_UPDATE_AUTO_MIGRATED,false);if(!valueMigrated){Services.prefs.setBoolPref(PREF_APP_UPDATE_AUTO_MIGRATED,true);let prefValue=Services.prefs.getBoolPref(PREF_APP_UPDATE_AUTO,DEFAULT_APP_UPDATE_AUTO);try{let writtenValue=await writeUpdateAutoConfig(prefValue);Services.prefs.clearUserPref(PREF_APP_UPDATE_AUTO);return writtenValue;}catch(e){Cu.reportError("UpdateUtils.getAppUpdateAutoEnabled - Migration "+"failed. Exception: "+
e);}}}
return DEFAULT_APP_UPDATE_AUTO;}).then(maybeUpdateAutoConfigChanged);updateAutoIOPromise=readPromise;return readPromise;},setAppUpdateAutoEnabled(enabledValue){if(this.appUpdateAutoSettingIsLocked()){return Promise.reject("setAppUpdateAutoEnabled: Unable to change value of setting because "+"it is locked by policy");}
if(AppConstants.platform!="win"){ let prefValue=!!enabledValue;Services.prefs.setBoolPref(PREF_APP_UPDATE_AUTO,prefValue);


return Promise.resolve(prefValue);}





let writePromise=updateAutoIOPromise.catch(()=>{}).then(async()=>{try{return await writeUpdateAutoConfig(enabledValue);}catch(e){Cu.reportError("UpdateUtils.setAppUpdateAutoEnabled - App update "+"configuration file write failed. Exception: "+
e);
throw e;}}).then(maybeUpdateAutoConfigChanged);updateAutoIOPromise=writePromise;return writePromise;},appUpdateAutoSettingIsLocked(){return(Services.policies&&(!Services.policies.isAllowed("app-auto-updates-off")||!Services.policies.isAllowed("app-auto-updates-on")));},};

var updateAutoIOPromise=Promise.resolve();var updateAutoSettingCachedVal=null;async function readUpdateAutoConfig(){let configFile=FileUtils.getDir("UpdRootD",[],true);configFile.append(FILE_UPDATE_CONFIG_JSON);let binaryData=await OS.File.read(configFile.path);let jsonData=new TextDecoder().decode(binaryData);let configData=JSON.parse(jsonData);return!!configData[CONFIG_APP_UPDATE_AUTO];}
async function writeUpdateAutoConfig(enabledValue){let enabledBoolValue=!!enabledValue;let configFile=FileUtils.getDir("UpdRootD",[],true);configFile.append(FILE_UPDATE_CONFIG_JSON);let configObject={[CONFIG_APP_UPDATE_AUTO]:enabledBoolValue};await OS.File.writeAtomic(configFile.path,JSON.stringify(configObject));return enabledBoolValue;}

function maybeUpdateAutoConfigChanged(newValue){if(newValue!==updateAutoSettingCachedVal){updateAutoSettingCachedVal=newValue;Services.obs.notifyObservers(null,"auto-update-config-change",newValue.toString());}
return newValue;}

if(AppConstants.platform!="win"){Services.prefs.addObserver(PREF_APP_UPDATE_AUTO,async(subject,topic,data)=>{let value=await UpdateUtils.getAppUpdateAutoEnabled();maybeUpdateAutoConfigChanged(value);});}
function getDistributionPrefValue(aPrefName){let value=Services.prefs.getDefaultBranch(null).getCharPref(aPrefName,"default");if(!value){value="default";}
return value;}
function getSystemCapabilities(){return"ISET:"+gInstructionSet+",MEM:"+getMemoryMB();}
function getMemoryMB(){let memoryMB="unknown";try{memoryMB=Services.sysinfo.getProperty("memsize");if(memoryMB){memoryMB=Math.round(memoryMB/1024/1024);}}catch(e){Cu.reportError("Error getting system info memsize property. Exception: "+e);}
return memoryMB;}
XPCOMUtils.defineLazyGetter(this,"gInstructionSet",function aus_gIS(){const CPU_EXTENSIONS=["hasSSE4_2","hasSSE4_1","hasSSE4A","hasSSSE3","hasSSE3","hasSSE2","hasSSE","hasMMX","hasNEON","hasARMv7","hasARMv6",];for(let ext of CPU_EXTENSIONS){if(Services.sysinfo.getProperty(ext)){return ext.substring(3);}}
return"unknown";});XPCOMUtils.defineLazyGetter(this,"gWinCPUArch",function aus_gWinCPUArch(){ let arch="unknown";const WORD=ctypes.uint16_t;const DWORD=ctypes.uint32_t; const SYSTEM_INFO=new ctypes.StructType("SYSTEM_INFO",[{wProcessorArchitecture:WORD},{wReserved:WORD},{dwPageSize:DWORD},{lpMinimumApplicationAddress:ctypes.voidptr_t},{lpMaximumApplicationAddress:ctypes.voidptr_t},{dwActiveProcessorMask:DWORD.ptr},{dwNumberOfProcessors:DWORD},{dwProcessorType:DWORD},{dwAllocationGranularity:DWORD},{wProcessorLevel:WORD},{wProcessorRevision:WORD},]);let kernel32=false;try{kernel32=ctypes.open("Kernel32");}catch(e){Cu.reportError("Unable to open kernel32! Exception: "+e);}
if(kernel32){try{let GetNativeSystemInfo=kernel32.declare("GetNativeSystemInfo",ctypes.winapi_abi,ctypes.void_t,SYSTEM_INFO.ptr);let winSystemInfo=SYSTEM_INFO(); winSystemInfo.wProcessorArchitecture=0xffff;GetNativeSystemInfo(winSystemInfo.address());switch(winSystemInfo.wProcessorArchitecture){case 12:arch="aarch64";break;case 9:arch="x64";break;case 6:arch="IA64";break;case 0:arch="x86";break;}}catch(e){Cu.reportError("Error getting processor architecture. Exception: "+e);}finally{kernel32.close();}}
return arch;});XPCOMUtils.defineLazyGetter(UpdateUtils,"ABI",function(){let abi=null;try{abi=Services.appinfo.XPCOMABI;}catch(e){Cu.reportError("XPCOM ABI unknown");}
if(AppConstants.platform=="win"){abi+="-"+gWinCPUArch;}
if(AppConstants.ASAN){ abi+="-asan";}
return abi;});XPCOMUtils.defineLazyGetter(UpdateUtils,"OSVersion",function(){let osVersion;try{osVersion=Services.sysinfo.getProperty("name")+" "+
Services.sysinfo.getProperty("version");}catch(e){Cu.reportError("OS Version unknown.");}
if(osVersion){if(AppConstants.platform=="win"){ try{const{servicePackMajor,servicePackMinor,buildNumber,}=WindowsVersionInfo.get();osVersion+=`.${servicePackMajor}.${servicePackMinor}.${buildNumber}`;}catch(err){Cu.reportError("Unable to retrieve windows version information: "+err);osVersion+=".unknown";} 
if(Services.vc.compare(Services.sysinfo.getProperty("version"),"10")>=0){const WINDOWS_UBR_KEY_PATH="SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion";let ubr=WindowsRegistry.readRegKey(Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,WINDOWS_UBR_KEY_PATH,"UBR",Ci.nsIWindowsRegKey.WOW64_64);if(ubr!==undefined){osVersion+=`.${ubr}`;}else{osVersion+=".unknown";}} 
osVersion+=" ("+gWinCPUArch+")";}
try{osVersion+=" ("+Services.sysinfo.getProperty("secondaryLibrary")+")";}catch(e){}
osVersion=encodeURIComponent(osVersion);}
return osVersion;});