//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";


const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{
Observers:"resource://services-common/observers.js",Services:"resource://gre/modules/Services.jsm",CommonUtils:"resource://services-common/utils.js",CryptoUtils:"resource://services-crypto/utils.js",FxAccountsConfig:"resource://gre/modules/FxAccountsConfig.jsm",jwcrypto:"resource://services-crypto/jwcrypto.jsm",});const{PREF_ACCOUNT_ROOT,log}=ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");const PREF_SANITIZED_UID=PREF_ACCOUNT_ROOT+"telemetry.sanitized_uid";XPCOMUtils.defineLazyPreferenceGetter(this,"pref_sanitizedUid",PREF_SANITIZED_UID,"");class FxAccountsTelemetry{constructor(fxai){this._fxai=fxai;Services.telemetry.setEventRecordingEnabled("fxa",true);this._promiseEnsureEcosystemAnonId=null;}
recordEvent(object,method,value,extra=undefined){ChromeUtils.import("resource://services-sync/telemetry.js");Observers.notify("fxa:telemetry:event",{object,method,value,extra});}
generateUUID(){return Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString().slice(1,-1);}
generateFlowID(){return this.generateUUID();}









async getEcosystemAnonId(){return this._fxai.withCurrentAccountState(async state=>{let{ecosystemAnonId,ecosystemUserId,}=await state.getUserAccountData(["ecosystemAnonId","ecosystemUserId",]);if(!ecosystemUserId){try{const profile=await this._fxai.profile.getProfile();if(profile&&profile.hasOwnProperty("ecosystemAnonId")){ecosystemAnonId=profile.ecosystemAnonId;}}catch(err){log.error("Getting ecosystemAnonId from profile failed",err);}}

if(!ecosystemAnonId){this.ensureEcosystemAnonId().catch(err=>{log.error("Failed ensuring we have an anon-id in the background ",err);});}
return ecosystemAnonId||null;});}



async ensureEcosystemAnonId(){if(!this._promiseEnsureEcosystemAnonId){this._promiseEnsureEcosystemAnonId=this._ensureEcosystemAnonId().finally(()=>{this._promiseEnsureEcosystemAnonId=null;});}
return this._promiseEnsureEcosystemAnonId;}
async _ensureEcosystemAnonId(){return this._fxai.withCurrentAccountState(async state=>{let{ecosystemAnonId,ecosystemUserId,}=await state.getUserAccountData(["ecosystemAnonId","ecosystemUserId",]);if(ecosystemUserId){if(!ecosystemAnonId){ecosystemAnonId=await this._generateAnonIdFromUserId(ecosystemUserId);await state.updateUserAccountData({ecosystemAnonId});}}else{ecosystemAnonId=await this._ensureEcosystemAnonIdInProfile();}
return ecosystemAnonId;});}


async _ensureEcosystemAnonIdInProfile(generatePlaceholder=true){




let options=generatePlaceholder?{staleOk:true}:{forceFresh:true};const profile=await this._fxai.profile.ensureProfile(options);if(profile&&profile.hasOwnProperty("ecosystemAnonId")){return profile.ecosystemAnonId;}
if(!generatePlaceholder){throw new Error("Profile data does not contain an 'ecosystemAnonId'");}

const ecosystemUserId=CommonUtils.bufferToHex(CryptoUtils.generateRandomBytes(32));const ecosystemAnonId=await this._generateAnonIdFromUserId(ecosystemUserId);try{await this._fxai.profile.client.setEcosystemAnonId(ecosystemAnonId);}catch(err){if(err&&err.code&&err.code===412){return this._ensureEcosystemAnonIdInProfile(false);}
throw err;}
return ecosystemAnonId;}

async _generateAnonIdFromUserId(ecosystemUserId){const serverConfig=await FxAccountsConfig.fetchConfigDocument();const ecosystemKeys=serverConfig.ecosystem_anon_id_keys;if(!ecosystemKeys||!ecosystemKeys.length){throw new Error("Unable to fetch ecosystem_anon_id_keys from FxA server");}
const randomKey=Math.floor(Math.random()*Math.floor(ecosystemKeys.length));return jwcrypto.generateJWE(ecosystemKeys[randomKey],new TextEncoder().encode(ecosystemUserId));}




_setHashedUID(hashedUID){if(!hashedUID){Services.prefs.clearUserPref(PREF_SANITIZED_UID);}else{Services.prefs.setStringPref(PREF_SANITIZED_UID,hashedUID);}}
getSanitizedUID(){return pref_sanitizedUid||null;}

sanitizeDeviceId(deviceId){const uid=this.getSanitizedUID();if(!uid){return null;}


return CryptoUtils.sha256(deviceId+uid);}





async recordConnection(services,how=null){try{let extra={};if(!(await this._fxai.getUserAccountData())){extra.fxa="true";}
if(services.includes("sync")){extra.sync="true";}
Services.telemetry.recordEvent("fxa","connect","account",how,extra);}catch(ex){log.error("Failed to record connection telemetry",ex);console.error("Failed to record connection telemetry",ex);}}





async recordDisconnection(service=null,how=null){try{let extra={};if(!service){extra.fxa="true";
if(Services.prefs.prefHasUserValue("services.sync.username")){extra.sync="true";}}else if(service=="sync"){extra[service]="true";}else{log.warn(`recordDisconnection has invalid value for service: ${service}`);}
Services.telemetry.recordEvent("fxa","disconnect","account",how,extra);}catch(ex){log.error("Failed to record disconnection telemetry",ex);console.error("Failed to record disconnection telemetry",ex);}}}
var EXPORTED_SYMBOLS=["FxAccountsTelemetry"];