//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["EcosystemTelemetry"];ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm",this);XPCOMUtils.defineLazyModuleGetters(this,{ONLOGIN_NOTIFICATION:"resource://gre/modules/FxAccountsCommon.js",ONLOGOUT_NOTIFICATION:"resource://gre/modules/FxAccountsCommon.js",ONVERIFIED_NOTIFICATION:"resource://gre/modules/FxAccountsCommon.js",ON_PRELOGOUT_NOTIFICATION:"resource://gre/modules/FxAccountsCommon.js",TelemetryController:"resource://gre/modules/TelemetryController.jsm",TelemetryUtils:"resource://gre/modules/TelemetryUtils.jsm",TelemetryEnvironment:"resource://gre/modules/TelemetryEnvironment.jsm",Log:"resource://gre/modules/Log.jsm",Services:"resource://gre/modules/Services.jsm",fxAccounts:"resource://gre/modules/FxAccounts.jsm",FxAccounts:"resource://gre/modules/FxAccounts.jsm",ClientID:"resource://gre/modules/ClientID.jsm",});XPCOMUtils.defineLazyServiceGetters(this,{Telemetry:["@mozilla.org/base/telemetry;1","nsITelemetry"],});const LOGGER_NAME="Toolkit.Telemetry";const LOGGER_PREFIX="EcosystemTelemetry::";XPCOMUtils.defineLazyGetter(this,"log",()=>{return Log.repository.getLoggerWithMessagePrefix(LOGGER_NAME,LOGGER_PREFIX);});var Policy={sendPing:(type,payload,options)=>TelemetryController.submitExternalPing(type,payload,options),monotonicNow:()=>TelemetryUtils.monotonicNow(),async getEcosystemAnonId(){try{let userData=await fxAccounts.getSignedInUser();if(!userData||!userData.verified){log.debug("No ecosystem anonymized ID - no user or unverified user");return null;}
return await fxAccounts.telemetry.ensureEcosystemAnonId();}catch(ex){log.error("Failed to fetch the ecosystem anonymized ID",ex);return null;}},getEcosystemClientId(){return ClientID.getEcosystemClientID();},resetEcosystemClientId(){return ClientID.resetEcosystemClientID();},};var EcosystemTelemetry={Reason:Object.freeze({PERIODIC:"periodic", SHUTDOWN:"shutdown", LOGOUT:"logout",}),PING_TYPE:"account-ecosystem",METRICS_STORE:"account-ecosystem",_lastSendTime:0,_initialized:false,_promiseEcosystemAnonId:null,
prepareEcosystemAnonId(){this._promiseEcosystemAnonId=Policy.getEcosystemAnonId();},enabled(){



if(!Services.prefs.getBoolPref(TelemetryUtils.Preferences.Unified,false)){return false;}
if(!Services.prefs.getBoolPref(TelemetryUtils.Preferences.EcosystemTelemetryEnabled,false)){return false;}
if(!FxAccounts.config.isProductionConfig()&&!Services.prefs.getBoolPref(TelemetryUtils.Preferences.EcosystemTelemetryAllowForNonProductionFxA,false)){log.info("Ecosystem telemetry disabled due to FxA non-production user");return false;}
return true;},async prepareForFxANotification(){this.startup();
if(this._promiseEcosystemAnonId){await this._promiseEcosystemAnonId;}},startup(){if(!this.enabled()||this._initialized){return;}
log.trace("Starting up.");

this.prepareEcosystemAnonId();this._addObservers();this._initialized=true;},shutdown(){if(!this._initialized){return;}
log.trace("Shutting down.");this._submitPing(this.Reason.SHUTDOWN);this._removeObservers();this._initialized=false;},_addObservers(){Services.obs.addObserver(this,ONLOGIN_NOTIFICATION);Services.obs.addObserver(this,ONVERIFIED_NOTIFICATION);Services.obs.addObserver(this,ONLOGOUT_NOTIFICATION);Services.obs.addObserver(this,ON_PRELOGOUT_NOTIFICATION);},_removeObservers(){try{Services.obs.removeObserver(this,ONLOGIN_NOTIFICATION);Services.obs.removeObserver(this,ONVERIFIED_NOTIFICATION);Services.obs.removeObserver(this,ONLOGOUT_NOTIFICATION);Services.obs.removeObserver(this,ON_PRELOGOUT_NOTIFICATION);}catch(ex){}},observe(subject,topic,data){log.trace(`observe, topic: ${topic}`);switch(topic){






case ONLOGIN_NOTIFICATION:case ONVERIFIED_NOTIFICATION:


this.prepareEcosystemAnonId();break;case ONLOGOUT_NOTIFICATION:return this._submitPing(this.Reason.LOGOUT).then(async()=>{this.prepareEcosystemAnonId();

await Policy.resetEcosystemClientId();}).catch(e=>{log.error("ONLOGOUT promise chain failed",e);});case ON_PRELOGOUT_NOTIFICATION:

break;}
return null;},periodicPing(){log.trace("periodic ping triggered");return this._submitPing(this.Reason.PERIODIC);},async _submitPing(reason){if(!this.enabled()){
log.trace(`_submitPing was called, but ping is not enabled.`);return;}
if(!this._initialized){log.trace(`Not initialized when sending. Bug?`);return;}
log.trace(`_submitPing, reason: ${reason}`);let now=Policy.monotonicNow(); let duration=Math.round((now-this._lastSendTime)/1000);this._lastSendTime=now;let payload=await this._payload(reason,duration);if(!payload){return;}
const options={addClientId:false,addEnvironment:true,overrideEnvironment:this._environment(),usePingSender:reason===this.Reason.SHUTDOWN,};let id=await Policy.sendPing(this.PING_TYPE,payload,options);log.info(`submitted ping ${id}`);},async _payload(reason,duration){let ecosystemAnonId=await this._promiseEcosystemAnonId;if(!ecosystemAnonId){
log.info("Unable to determine the ecosystem anon id; skipping this ping");return null;}
let payload={reason,ecosystemAnonId,ecosystemClientId:await Policy.getEcosystemClientId(),duration,scalars:Telemetry.getSnapshotForScalars(this.METRICS_STORE,true,true),keyedScalars:Telemetry.getSnapshotForKeyedScalars(this.METRICS_STORE,true,true),histograms:Telemetry.getSnapshotForHistograms(this.METRICS_STORE,true,true),keyedHistograms:Telemetry.getSnapshotForKeyedHistograms(this.METRICS_STORE,true,true),};return payload;},_environment(){let currentEnv=TelemetryEnvironment.currentEnvironment;let environment={settings:{locale:currentEnv.settings.locale,},system:{memoryMB:currentEnv.system.memoryMB,os:{name:currentEnv.system.os.name,version:currentEnv.system.os.version,locale:currentEnv.system.os.locale,},cpu:{speedMHz:currentEnv.system.cpu.speedMHz,},},profile:{},};if(currentEnv.profile.creationDate){environment.profile.creationDate=currentEnv.profile.creationDate;}
if(currentEnv.profile.firstUseDate){environment.profile.firstUseDate=currentEnv.profile.firstUseDate;}
return environment;},testReset(){this._initialized=false;this._lastSendTime=0;this.startup();},};