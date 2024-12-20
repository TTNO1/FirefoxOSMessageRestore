//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"Preferences","resource://gre/modules/Preferences.jsm");ChromeUtils.defineModuleGetter(this,"Log","resource://gre/modules/Log.jsm");ChromeUtils.defineModuleGetter(this,"TelemetryController","resource://gre/modules/TelemetryController.jsm");ChromeUtils.defineModuleGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gUpdateTimerManager","@mozilla.org/updates/timer-manager;1","nsIUpdateTimerManager");XPCOMUtils.defineLazyServiceGetter(this,"Telemetry","@mozilla.org/base/telemetry;1","nsITelemetry");var EXPORTED_SYMBOLS=["TelemetryModules"];const LOGGER_NAME="Toolkit.Telemetry";const LOGGER_PREFIX="TelemetryModules::";const MODULES_PING_INTERVAL_SECONDS=7*24*60*60;const MODULES_PING_INTERVAL_PREFERENCE="toolkit.telemetry.modulesPing.interval";const MAX_MODULES_NUM=512;const MAX_NAME_LENGTH=64;const TRUNCATION_DELIMITER="\u2026";var TelemetryModules=Object.freeze({_log:Log.repository.getLoggerWithMessagePrefix(LOGGER_NAME,LOGGER_PREFIX),start(){if(!AppConstants.MOZ_GECKO_PROFILER){return;}
let interval=Preferences.get(MODULES_PING_INTERVAL_PREFERENCE,MODULES_PING_INTERVAL_SECONDS);gUpdateTimerManager.registerTimer("telemetry_modules_ping",this,interval,interval!=0
);},notify(){try{Telemetry.getLoadedModules().then(modules=>{modules=modules.filter(module=>!!module.name.length);if(modules.length>MAX_MODULES_NUM){modules=modules.slice(0,MAX_MODULES_NUM);}
for(let module of modules){if(module.name.length>MAX_NAME_LENGTH){module.name=module.name.substr(0,MAX_NAME_LENGTH-1)+
TRUNCATION_DELIMITER;}
if(module.debugName!==null&&module.debugName.length>MAX_NAME_LENGTH){module.debugName=module.debugName.substr(0,MAX_NAME_LENGTH-1)+
TRUNCATION_DELIMITER;}
if(module.certSubject!==undefined&&module.certSubject.length>MAX_NAME_LENGTH){module.certSubject=module.certSubject.substr(0,MAX_NAME_LENGTH-1)+
TRUNCATION_DELIMITER;}}
TelemetryController.submitExternalPing("modules",{version:1,modules,},{addClientId:true,addEnvironment:true,});},err=>this._log.error("notify - promise failed",err));}catch(ex){this._log.error("notify - caught exception",ex);}},});