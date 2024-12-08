//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["TelemetryControllerBase"];ChromeUtils.defineModuleGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const LOGGER_NAME="Toolkit.Telemetry";const LOGGER_PREFIX="TelemetryController::";const PREF_BRANCH_LOG="toolkit.telemetry.log.";const PREF_LOG_LEVEL="toolkit.telemetry.log.level";const PREF_LOG_DUMP="toolkit.telemetry.log.dump";const PREF_TELEMETRY_ENABLED="toolkit.telemetry.enabled";const Preferences=Object.freeze({OverridePreRelease:"toolkit.telemetry.testing.overridePreRelease",Unified:"toolkit.telemetry.unified",});var gLogger=null;var gPrefixLogger=null;var gLogAppenderDump=null;var TelemetryControllerBase=Object.freeze({IS_UNIFIED_TELEMETRY:Services.prefs.getBoolPref(Preferences.Unified,false),Preferences,get isTelemetryEnabled(){return Services.prefs.getBoolPref(PREF_TELEMETRY_ENABLED,false)===true;},get log(){if(!gPrefixLogger){gPrefixLogger=Log.repository.getLoggerWithMessagePrefix(LOGGER_NAME,LOGGER_PREFIX);}
return gPrefixLogger;},configureLogging(){if(!gLogger){gLogger=Log.repository.getLogger(LOGGER_NAME);let consoleAppender=new Log.ConsoleAppender(new Log.BasicFormatter());gLogger.addAppender(consoleAppender);Services.prefs.addObserver(PREF_BRANCH_LOG,this.configureLogging);}
gLogger.level=Log.Level[Services.prefs.getStringPref(PREF_LOG_LEVEL,"Warn")];let logDumping=Services.prefs.getBoolPref(PREF_LOG_DUMP,false);if(logDumping!=!!gLogAppenderDump){if(logDumping){gLogAppenderDump=new Log.DumpAppender(new Log.BasicFormatter());gLogger.addAppender(gLogAppenderDump);}else{gLogger.removeAppender(gLogAppenderDump);gLogAppenderDump=null;}}},setTelemetryRecordingFlags(){
let prereleaseChannels=["nightly","aurora","beta"];if(!AppConstants.MOZILLA_OFFICIAL){prereleaseChannels.push("default");}
const isPrereleaseChannel=prereleaseChannels.includes(AppConstants.MOZ_UPDATE_CHANNEL);const isReleaseCandidateOnBeta=AppConstants.MOZ_UPDATE_CHANNEL==="release"&&Services.prefs.getCharPref("app.update.channel",null)==="beta";Services.telemetry.canRecordBase=true;Services.telemetry.canRecordExtended=isPrereleaseChannel||isReleaseCandidateOnBeta||Services.prefs.getBoolPref(this.Preferences.OverridePreRelease,false);},enableTelemetryRecording:function enableTelemetryRecording(){
if(this.IS_UNIFIED_TELEMETRY){this.setTelemetryRecordingFlags();}else{
Services.telemetry.canRecordBase=Services.telemetry.canRecordExtended=this.isTelemetryEnabled;}
this.log.config("enableTelemetryRecording - canRecordBase:"+
Services.telemetry.canRecordBase+", canRecordExtended: "+
Services.telemetry.canRecordExtended);return Services.telemetry.canRecordBase;},});