"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"ShellService","resource:///modules/ShellService.jsm");ChromeUtils.defineModuleGetter(this,"AddonManager","resource://gre/modules/AddonManager.jsm");ChromeUtils.defineModuleGetter(this,"TelemetryArchive","resource://gre/modules/TelemetryArchive.jsm");ChromeUtils.defineModuleGetter(this,"TelemetryController","resource://gre/modules/TelemetryController.jsm");ChromeUtils.defineModuleGetter(this,"UpdateUtils","resource://gre/modules/UpdateUtils.jsm");ChromeUtils.defineModuleGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm");ChromeUtils.defineModuleGetter(this,"AttributionCode","resource:///modules/AttributionCode.jsm");ChromeUtils.defineModuleGetter(this,"WindowsVersionInfo","resource://gre/modules/components-utils/WindowsVersionInfo.jsm");ChromeUtils.defineModuleGetter(this,"NormandyUtils","resource://normandy/lib/NormandyUtils.jsm");var EXPORTED_SYMBOLS=["ClientEnvironmentBase"];class ClientEnvironmentBase{static get distribution(){return Services.prefs.getCharPref("distribution.id","default");}
static get telemetry(){return(async()=>{const pings=await TelemetryArchive.promiseArchivedPingList(); const mostRecentPings={};for(const ping of pings){if(ping.type in mostRecentPings){if(mostRecentPings[ping.type].timestampCreated<ping.timestampCreated){mostRecentPings[ping.type]=ping;}}else{mostRecentPings[ping.type]=ping;}}
const telemetry={};for(const key in mostRecentPings){const ping=mostRecentPings[key];telemetry[ping.type]=await TelemetryArchive.promiseArchivedPingById(ping.id);}
return telemetry;})();}
static get liveTelemetry(){


let target={};try{target.main=TelemetryController.getCurrentPingData();}catch(err){Cu.reportError(err);}
return new Proxy(target,{get(target,prop,receiver){if(prop=="main"){return target.main;}
if(prop=="then"){ return undefined;}
throw new Error(`Live telemetry only includes the main ping, not the ${prop} ping`);},has(target,prop){return prop=="main";},});} 
static get randomizationId(){let id=Services.prefs.getCharPref("app.normandy.user_id","");if(!id){id=NormandyUtils.generateUuid();Services.prefs.setCharPref("app.normandy.user_id",id);}
return id;}
static get version(){return AppConstants.MOZ_APP_VERSION_DISPLAY;}
static get channel(){return UpdateUtils.getUpdateChannel(false);}
static get isDefaultBrowser(){return ShellService.isDefaultBrowser();}
static get searchEngine(){return(async()=>{const defaultEngineInfo=await Services.search.getDefaultEngineInfo();return defaultEngineInfo.defaultSearchEngine;})();}
static get syncSetup(){return Services.prefs.prefHasUserValue("services.sync.username");}
static get syncDesktopDevices(){return Services.prefs.getIntPref("services.sync.clients.devices.desktop",0);}
static get syncMobileDevices(){return Services.prefs.getIntPref("services.sync.clients.devices.mobile",0);}
static get syncTotalDevices(){return this.syncDesktopDevices+this.syncMobileDevices;}
static get addons(){return(async()=>{const addons=await AddonManager.getAllAddons();return addons.reduce((acc,addon)=>{const{id,isActive,name,type,version,installDate:installDateN,}=addon;const installDate=new Date(installDateN);acc[id]={id,isActive,name,type,version,installDate};return acc;},{});})();}
static get plugins(){return(async()=>{const plugins=await AddonManager.getAddonsByTypes(["plugin"]);return plugins.reduce((acc,plugin)=>{const{name,description,version}=plugin;acc[name]={name,description,version};return acc;},{});})();}
static get locale(){return Services.locale.appLocaleAsBCP47;}
static get doNotTrack(){return Services.prefs.getBoolPref("privacy.donottrackheader.enabled",false);}
static get os(){function coerceToNumber(version){const parts=version.split(".");return parseFloat(parts.slice(0,2).join("."));}
function getOsVersion(){let version=null;try{version=Services.sysinfo.getProperty("version",null);}catch(_e){}
if(version){version=coerceToNumber(version);}
return version;}
let osInfo={isWindows:AppConstants.platform=="win",isMac:AppConstants.platform==="macosx",isLinux:AppConstants.platform==="linux",get windowsVersion(){if(!osInfo.isWindows){return null;}
return getOsVersion();},get windowsBuildNumber(){if(!osInfo.isWindows){return null;}
return WindowsVersionInfo.get({throwOnError:false}).buildNumber;},get macVersion(){const darwinVersion=osInfo.darwinVersion; if(darwinVersion>=5){const intPart=Math.floor(darwinVersion);return 10+0.1*(intPart-4);}
return null;},get darwinVersion(){if(!osInfo.isMac){return null;}
return getOsVersion();},
};return osInfo;}
static get attribution(){return AttributionCode.getAttrDataAsync();}
static get appinfo(){Services.appinfo.QueryInterface(Ci.nsIXULAppInfo);Services.appinfo.QueryInterface(Ci.nsIPlatformInfo);return Services.appinfo;}}