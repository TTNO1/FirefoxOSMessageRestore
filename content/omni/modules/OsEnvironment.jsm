//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["OsEnvironment"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AppConstants:"resource://gre/modules/AppConstants.jsm",Services:"resource://gre/modules/Services.jsm",WindowsRegistry:"resource://gre/modules/WindowsRegistry.jsm",WindowsVersionInfo:"resource://gre/modules/components-utils/WindowsVersionInfo.jsm",});let OsEnvironment={Policy:{getAllowedAppSources:()=>WindowsRegistry.readRegKey(Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer","AicEnabled"),windowsVersionHasAppSourcesFeature:()=>{let windowsVersion=parseFloat(Services.sysinfo.getProperty("version"));if(isNaN(windowsVersion)){throw new Error("Unable to parse Windows version");}
if(windowsVersion<10){return false;}
const{buildNumber}=WindowsVersionInfo.get();return buildNumber>=15063;},},reportAllowedAppSources(){if(AppConstants.platform!="win"){return;}
const appSourceScalar="os.environment.allowed_app_sources";let haveAppSourcesFeature;try{haveAppSourcesFeature=OsEnvironment.Policy.windowsVersionHasAppSourcesFeature();}catch(ex){Cu.reportError(ex);Services.telemetry.scalarSet(appSourceScalar,"Error");return;}
if(!haveAppSourcesFeature){Services.telemetry.scalarSet(appSourceScalar,"NoSuchFeature");return;}
let allowedAppSources;try{allowedAppSources=OsEnvironment.Policy.getAllowedAppSources();}catch(ex){Cu.reportError(ex);Services.telemetry.scalarSet(appSourceScalar,"Error");return;}
if(allowedAppSources===undefined){




allowedAppSources="Anywhere";}
const expectedValues=["Anywhere","Recommendations","PreferStore","StoreOnly",];if(!expectedValues.includes(allowedAppSources)){allowedAppSources="Error";}
Services.telemetry.scalarSet(appSourceScalar,allowedAppSources);},};