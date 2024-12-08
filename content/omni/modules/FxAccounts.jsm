//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");const{CryptoUtils}=ChromeUtils.import("resource://services-crypto/utils.js");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{clearTimeout,setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const{FxAccountsStorageManager}=ChromeUtils.import("resource://gre/modules/FxAccountsStorage.jsm");const{ASSERTION_LIFETIME,ASSERTION_USE_PERIOD,CERT_LIFETIME,ERRNO_INVALID_AUTH_TOKEN,ERRNO_INVALID_FXA_ASSERTION,ERROR_AUTH_ERROR,ERROR_INVALID_PARAMETER,ERROR_NO_ACCOUNT,ERROR_OFFLINE,ERROR_TO_GENERAL_ERROR_CLASS,ERROR_UNKNOWN,ERROR_UNVERIFIED_ACCOUNT,FXA_PWDMGR_MEMORY_FIELDS,FXA_PWDMGR_PLAINTEXT_FIELDS,FXA_PWDMGR_REAUTH_WHITELIST,FXA_PWDMGR_SECURE_FIELDS,FX_OAUTH_CLIENT_ID,KEY_LIFETIME,ON_ACCOUNT_STATE_CHANGE_NOTIFICATION,ONLOGIN_NOTIFICATION,ONLOGOUT_NOTIFICATION,ON_PRELOGOUT_NOTIFICATION,ONVERIFIED_NOTIFICATION,ON_DEVICE_DISCONNECTED_NOTIFICATION,POLL_SESSION,PREF_ACCOUNT_ROOT,PREF_LAST_FXA_USER,SERVER_ERRNO_TO_ERROR,log,logPII,logManager,}=ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");ChromeUtils.defineModuleGetter(this,"FxAccountsClient","resource://gre/modules/FxAccountsClient.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsOAuthGrantClient","resource://gre/modules/FxAccountsOAuthGrantClient.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsConfig","resource://gre/modules/FxAccountsConfig.jsm");ChromeUtils.defineModuleGetter(this,"jwcrypto","resource://services-crypto/jwcrypto.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsCommands","resource://gre/modules/FxAccountsCommands.js");ChromeUtils.defineModuleGetter(this,"FxAccountsDevice","resource://gre/modules/FxAccountsDevice.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsKeys","resource://gre/modules/FxAccountsKeys.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsProfile","resource://gre/modules/FxAccountsProfile.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsTelemetry","resource://gre/modules/FxAccountsTelemetry.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Preferences:"resource://gre/modules/Preferences.jsm",});XPCOMUtils.defineLazyPreferenceGetter(this,"FXA_ENABLED","identity.fxaccounts.enabled",true);XPCOMUtils.defineLazyPreferenceGetter(this,"USE_SESSION_TOKENS_FOR_OAUTH","identity.fxaccounts.useSessionTokensForOAuth");





var AccountState=(this.AccountState=function(storageManager){this.storageManager=storageManager;this.inFlightTokenRequests=new Map();this.promiseInitialized=this.storageManager.getAccountData().then(data=>{this.oauthTokens=data&&data.oauthTokens?data.oauthTokens:{};}).catch(err=>{log.error("Failed to initialize the storage manager",err);});});AccountState.prototype={oauthTokens:null,whenVerifiedDeferred:null,whenKeysReadyDeferred:null,get isCurrent(){return this.storageManager!=null;},abort(){if(this.whenVerifiedDeferred){this.whenVerifiedDeferred.reject(new Error("Verification aborted; Another user signing in"));this.whenVerifiedDeferred=null;}
if(this.whenKeysReadyDeferred){this.whenKeysReadyDeferred.reject(new Error("Key fetching aborted; Another user signing in"));this.whenKeysReadyDeferred=null;}
this.inFlightTokenRequests.clear();return this.signOut();},async signOut(){this.cert=null;this.keyPair=null;this.oauthTokens=null;this.inFlightTokenRequests.clear();
if(!this.storageManager){return;}
const storageManager=this.storageManager;this.storageManager=null;await storageManager.deleteAccountData();await storageManager.finalize();},

getUserAccountData(fieldNames=null){if(!this.isCurrent){return Promise.reject(new Error("Another user has signed in"));}
return this.storageManager.getAccountData(fieldNames).then(result=>{return this.resolve(result);});},async updateUserAccountData(updatedFields){if("uid"in updatedFields){const existing=await this.getUserAccountData(["uid"]);if(existing.uid!=updatedFields.uid){throw new Error("The specified credentials aren't for the current user");}

updatedFields=Cu.cloneInto(updatedFields,{}); delete updatedFields.uid;}
if(!this.isCurrent){return Promise.reject(new Error("Another user has signed in"));}
return this.storageManager.updateAccountData(updatedFields);},resolve(result){if(!this.isCurrent){log.info("An accountState promise was resolved, but was actually rejected"+" due to a different user being signed in. Originally resolved"+" with",result);return Promise.reject(new Error("A different user signed in"));}
return Promise.resolve(result);},reject(error){


if(!this.isCurrent){log.info("An accountState promise was rejected, but we are ignoring that "+"reason and rejecting it due to a different user being signed in. "+"Originally rejected with",error);return Promise.reject(new Error("A different user signed in"));}
return Promise.reject(error);},



_cachePreamble(){if(!this.isCurrent){throw new Error("Another user has signed in");}},
setCachedToken(scopeArray,tokenData){this._cachePreamble();if(!tokenData.token){throw new Error("No token");}
let key=getScopeKey(scopeArray);this.oauthTokens[key]=tokenData;this._persistCachedTokens();},getCachedToken(scopeArray){this._cachePreamble();let key=getScopeKey(scopeArray);let result=this.oauthTokens[key];if(result){
log.trace("getCachedToken returning cached token");return result;}
return null;},removeCachedToken(token){this._cachePreamble();let data=this.oauthTokens;for(let[key,tokenValue]of Object.entries(data)){if(tokenValue.token==token){delete data[key];this._persistCachedTokens();return tokenValue;}}
return null;},

_persistCachedTokens(){this._cachePreamble();return this.updateUserAccountData({oauthTokens:this.oauthTokens}).catch(err=>{log.error("Failed to update cached tokens",err);});},};function getScopeKey(scopeArray){let normalizedScopes=scopeArray.map(item=>item.toLowerCase());return normalizedScopes.sort().join("|");}
function getPropertyDescriptor(obj,prop){return(Object.getOwnPropertyDescriptor(obj,prop)||getPropertyDescriptor(Object.getPrototypeOf(obj),prop));}
function copyObjectProperties(from,to,thisObj,keys){for(let prop of keys){let desc=getPropertyDescriptor(from,prop);if(typeof desc.value=="function"){desc.value=desc.value.bind(thisObj);}
if(desc.get){desc.get=desc.get.bind(thisObj);}
if(desc.set){desc.set=desc.set.bind(thisObj);}
Object.defineProperty(to,prop,desc);}}
class FxAccounts{constructor(mocks=null){this._internal=new FxAccountsInternal();if(mocks){


copyObjectProperties(mocks,this._internal,this._internal,Object.keys(mocks).filter(key=>!["device","commands"].includes(key)));}
this._internal.initialize();if(mocks){for(let subobject of["currentAccountState","keys","fxaPushService","device","commands",]){if(typeof mocks[subobject]=="object"){copyObjectProperties(mocks[subobject],this._internal[subobject],this._internal[subobject],Object.keys(mocks[subobject]));}}}}
get commands(){return this._internal.commands;}
static get config(){return FxAccountsConfig;}
get device(){return this._internal.device;}
get keys(){return this._internal.keys;}
get telemetry(){return this._internal.telemetry;}
_withCurrentAccountState(func){return this._internal.withCurrentAccountState(func);}
_withVerifiedAccountState(func){return this._internal.withVerifiedAccountState(func);}
_withSessionToken(func,mustBeVerified=true){return this._internal.withSessionToken(func,mustBeVerified);}
async listAttachedOAuthClients(){const ONE_DAY=24*60*60*1000;return this._withSessionToken(async sessionToken=>{const attachedClients=await this._internal.fxAccountsClient.attachedClients(sessionToken); let now=Date.now();return attachedClients.map(client=>{const daysAgo=client.lastAccessTime?Math.max(Math.floor((now-client.lastAccessTime)/ONE_DAY),0):null;return{id:client.clientId,lastAccessedDaysAgo:daysAgo,};});});}
async getOAuthToken(options={}){try{return await this._internal.getOAuthToken(options);}catch(err){throw this._internal._errorToErrorClass(err);}}
removeCachedOAuthToken(options){return this._internal.removeCachedOAuthToken(options);}
getSignedInUser(){
const ACCT_DATA_FIELDS=["email","uid","verified","sessionToken"];const PROFILE_FIELDS=["displayName","avatar","avatarDefault"];return this._withCurrentAccountState(async currentState=>{const data=await currentState.getUserAccountData(ACCT_DATA_FIELDS);if(!data){return null;}
if(!FXA_ENABLED){await this.signOut();return null;}
if(!this._internal.isUserEmailVerified(data)){
this._internal.startVerifiedCheck(data);}
let profileData=null;if(data.sessionToken){delete data.sessionToken;try{profileData=await this._internal.profile.getProfile();}catch(error){log.error("Could not retrieve profile data",error);}}
for(let field of PROFILE_FIELDS){data[field]=profileData?profileData[field]:null;}


if(profileData&&profileData.email){data.email=profileData.email;}
return data;});}
checkAccountStatus(){

let state=this._internal.currentAccountState;return this._internal.checkAccountStatus(state);}
hasLocalSession(){return this._withCurrentAccountState(async state=>{let data=await state.getUserAccountData(["sessionToken"]);return!!(data&&data.sessionToken);});}


notifyDevices(deviceIds,excludedIds,payload,TTL){return this._internal.notifyDevices(deviceIds,excludedIds,payload,TTL);}
resendVerificationEmail(){return this._withSessionToken((token,currentState)=>{this._internal.startPollEmailStatus(currentState,token,"start");return this._internal.fxAccountsClient.resendVerificationEmail(token);},false);}
async signOut(localOnly){

return this._internal.signOut(localOnly);}

updateDeviceRegistration(){return this._withCurrentAccountState(_=>{return this._internal.updateDeviceRegistration();});}
whenVerified(data){return this._withCurrentAccountState(_=>{return this._internal.whenVerified(data);});}
async flushLogFile(){const logType=await logManager.resetFileLog();if(logType==logManager.ERROR_LOG_WRITTEN){Cu.reportError("FxA encountered an error - see about:sync-log for the log file.");}
Services.obs.notifyObservers(null,"service:log-manager:flush-log-file");}}
var FxAccountsInternal=function(){};FxAccountsInternal.prototype={ POLL_SESSION,

VERIFICATION_POLL_TIMEOUT_INITIAL:60000,VERIFICATION_POLL_TIMEOUT_SUBSEQUENT:5*60000,
VERIFICATION_POLL_START_SLOWDOWN_THRESHOLD:5,_fxAccountsClient:null,
initialize(){XPCOMUtils.defineLazyGetter(this,"fxaPushService",function(){return Cc["@mozilla.org/fxaccounts/push;1"].getService(Ci.nsISupports).wrappedJSObject;});this.keys=new FxAccountsKeys(this);if(!this.observerPreloads){


this.observerPreloads=[()=>{let scope={};ChromeUtils.import("resource://services-sync/main.js",scope);return scope.Weave.Service.promiseInitialized;},async()=>{const{EcosystemTelemetry}=ChromeUtils.import("resource://gre/modules/EcosystemTelemetry.jsm",{});await EcosystemTelemetry.prepareForFxANotification();},];}
this.currentTimer=null;
this.currentAccountState=this.newAccountState();},async withCurrentAccountState(func){const state=this.currentAccountState;let result;try{result=await func(state);}catch(ex){return state.reject(ex);}
return state.resolve(result);},async withVerifiedAccountState(func){return this.withCurrentAccountState(async state=>{let data=await state.getUserAccountData();if(!data){ throw this._error(ERROR_NO_ACCOUNT);}
if(!this.isUserEmailVerified(data)){ throw this._error(ERROR_UNVERIFIED_ACCOUNT);}
return func(state);});},async withSessionToken(func,mustBeVerified=true){const state=this.currentAccountState;let data=await state.getUserAccountData();if(!data){ throw this._error(ERROR_NO_ACCOUNT);}
if(mustBeVerified&&!this.isUserEmailVerified(data)){ throw this._error(ERROR_UNVERIFIED_ACCOUNT);}
if(!data.sessionToken){throw this._error(ERROR_AUTH_ERROR,"no session token");}
try{
let result=await func(data.sessionToken,state);return state.resolve(result);}catch(err){return this._handleTokenError(err);}},get fxAccountsClient(){if(!this._fxAccountsClient){this._fxAccountsClient=new FxAccountsClient();}
return this._fxAccountsClient;},get fxAccountsOAuthGrantClient(){if(!this._fxAccountsOAuthGrantClient){this._fxAccountsOAuthGrantClient=new FxAccountsOAuthGrantClient({client_id:FX_OAUTH_CLIENT_ID,});}
return this._fxAccountsOAuthGrantClient;},_profile:null,get profile(){if(!this._profile){let profileServerUrl=Services.urlFormatter.formatURLPref("identity.fxaccounts.remote.profile.uri");this._profile=new FxAccountsProfile({fxa:this,profileServerUrl,});}
return this._profile;},_commands:null,get commands(){if(!this._commands){this._commands=new FxAccountsCommands(this);}
return this._commands;},_device:null,get device(){if(!this._device){this._device=new FxAccountsDevice(this);}
return this._device;},_telemetry:null,get telemetry(){if(!this._telemetry){this._telemetry=new FxAccountsTelemetry(this);}
return this._telemetry;},newAccountState(credentials){let storage=new FxAccountsStorageManager();storage.initialize(credentials);return new AccountState(storage);},notifyDevices(deviceIds,excludedIds,payload,TTL){if(typeof deviceIds=="string"){deviceIds=[deviceIds];}
return this.withSessionToken(sessionToken=>{return this.fxAccountsClient.notifyDevices(sessionToken,deviceIds,excludedIds,payload,TTL);});},now(){return this.fxAccountsClient.now();},get localtimeOffsetMsec(){return this.fxAccountsClient.localtimeOffsetMsec;},checkEmailStatus:function checkEmailStatus(sessionToken,options={}){if(!sessionToken){return Promise.reject(new Error("checkEmailStatus called without a session token"));}
return this.fxAccountsClient.recoveryEmailStatus(sessionToken,options).catch(error=>this._handleTokenError(error));},





async setSignedInUser(credentials){if(!FXA_ENABLED){throw new Error("Cannot call setSignedInUser when FxA is disabled.");}
Preferences.resetBranch(PREF_ACCOUNT_ROOT);log.debug("setSignedInUser - aborting any existing flows");const signedInUser=await this.currentAccountState.getUserAccountData();if(signedInUser){await this._signOutServer(signedInUser.sessionToken,signedInUser.oauthTokens);}
await this.abortExistingFlow();let currentAccountState=(this.currentAccountState=this.newAccountState(Cu.cloneInto(credentials,{})
));

await currentAccountState.promiseInitialized; if(!this.isUserEmailVerified(credentials)){this.startVerifiedCheck(credentials);}
await this.notifyObservers(ONLOGIN_NOTIFICATION);await this.updateDeviceRegistration();return currentAccountState.resolve();},updateUserAccountData(credentials){log.debug("updateUserAccountData called with fields",Object.keys(credentials));if(logPII){log.debug("updateUserAccountData called with data",credentials);}
let currentAccountState=this.currentAccountState;return currentAccountState.promiseInitialized.then(()=>{if(!credentials.uid){throw new Error("The specified credentials have no uid");}
return currentAccountState.updateUserAccountData(credentials);});},getAssertion:function getAssertion(audience){return this._getAssertion(audience);},
_getAssertion(audience){log.debug("enter getAssertion()");return this.withSessionToken(async(_,currentState)=>{let{keyPair,certificate}=await this.getKeypairAndCertificate(currentState);return this.getAssertionFromCert(await currentState.getUserAccountData(),keyPair,certificate,audience);});},abortExistingFlow(){if(this.currentTimer){log.debug("Polling aborted; Another user signing in");clearTimeout(this.currentTimer);this.currentTimer=0;}
if(this._profile){this._profile.tearDown();this._profile=null;}
if(this._commands){this._commands=null;}
if(this._device){this._device.reset();}

return this.currentAccountState.abort();},async checkVerificationStatus(){log.trace("checkVerificationStatus");let state=this.currentAccountState;let data=await state.getUserAccountData();if(!data){log.trace("checkVerificationStatus - no user data");return null;}


log.trace("checkVerificationStatus - forcing verification status check");return this.startPollEmailStatus(state,data.sessionToken,"push");},_destroyOAuthToken(tokenData){return this.fxAccountsClient.oauthDestroy(FX_OAUTH_CLIENT_ID,tokenData.token);},_destroyAllOAuthTokens(tokenInfos){if(!tokenInfos){return Promise.resolve();}
let promises=[];for(let tokenInfo of Object.values(tokenInfos)){promises.push(this._destroyOAuthToken(tokenInfo));}
return Promise.all(promises);},async signOut(localOnly){let sessionToken;let tokensToRevoke;const data=await this.currentAccountState.getUserAccountData();if(data){sessionToken=data.sessionToken;tokensToRevoke=data.oauthTokens;}
await this.notifyObservers(ON_PRELOGOUT_NOTIFICATION);await this._signOutLocal();if(!localOnly){
Services.tm.dispatchToMainThread(async()=>{await this._signOutServer(sessionToken,tokensToRevoke);FxAccountsConfig.resetConfigURLs();this.notifyObservers("testhelper-fxa-signout-complete");});}else{
FxAccountsConfig.resetConfigURLs();}
return this.notifyObservers(ONLOGOUT_NOTIFICATION);},async _signOutLocal(){Preferences.resetBranch(PREF_ACCOUNT_ROOT);await this.currentAccountState.signOut();await this.abortExistingFlow();this.currentAccountState=this.newAccountState();return this.currentAccountState.promiseInitialized;},async _signOutServer(sessionToken,tokensToRevoke){log.debug("Unsubscribing from FxA push.");try{await this.fxaPushService.unsubscribe();}catch(err){log.error("Could not unsubscribe from push.",err);}
if(sessionToken){log.debug("Destroying session and device.");try{await this.fxAccountsClient.signOut(sessionToken,{service:"sync"});}catch(err){log.error("Error during remote sign out of Firefox Accounts",err);}}else{log.warn("Missing session token; skipping remote sign out");}
log.debug("Destroying all OAuth tokens.");try{await this._destroyAllOAuthTokens(tokensToRevoke);}catch(err){log.error("Error during destruction of oauth tokens during signout",err);}},async getAssertionFromCert(data,keyPair,cert,audience){log.debug("getAssertionFromCert");let options={duration:ASSERTION_LIFETIME,localtimeOffsetMsec:this.localtimeOffsetMsec,now:this.now(),};let currentState=this.currentAccountState;let assertion=await new Promise((resolve,reject)=>{jwcrypto.generateAssertion(cert,keyPair,audience,options,(err,signed)=>{if(err){log.error("getAssertionFromCert: "+err);reject(err);}else{log.debug("getAssertionFromCert returning signed: "+!!signed);if(logPII){log.debug("getAssertionFromCert returning signed: "+signed);}
resolve(signed);}});});return currentState.resolve(assertion);},getCertificateSigned(sessionToken,serializedPublicKey,lifetime){log.debug("getCertificateSigned: "+!!sessionToken+" "+!!serializedPublicKey);if(logPII){log.debug("getCertificateSigned: "+sessionToken+" "+serializedPublicKey);}
return this.fxAccountsClient.signCertificate(sessionToken,JSON.parse(serializedPublicKey),lifetime);},async getKeypairAndCertificate(currentState){


let ignoreCachedAuthCredentials=Services.prefs.getBoolPref("services.sync.debug.ignoreCachedAuthCredentials",false);let mustBeValidUntil=this.now()+ASSERTION_USE_PERIOD;let accountData=await currentState.getUserAccountData(["cert","keyPair","sessionToken",]);let keyPairValid=!ignoreCachedAuthCredentials&&accountData.keyPair&&accountData.keyPair.validUntil>mustBeValidUntil;let certValid=!ignoreCachedAuthCredentials&&accountData.cert&&accountData.cert.validUntil>mustBeValidUntil; if(keyPairValid&&certValid){log.debug("getKeypairAndCertificate: already have keyPair and certificate");return{keyPair:accountData.keyPair.rawKeyPair,certificate:accountData.cert.rawCert,};}





if(Services.io.offline){throw new Error(ERROR_OFFLINE);}
let keyPair;if(keyPairValid){keyPair=accountData.keyPair;}else{let keyWillBeValidUntil=this.now()+KEY_LIFETIME;keyPair=await new Promise((resolve,reject)=>{jwcrypto.generateKeyPair("DS160",(err,kp)=>{if(err){reject(err);return;}
log.debug("got keyPair");resolve({rawKeyPair:kp,validUntil:keyWillBeValidUntil,});});});}
let certWillBeValidUntil=this.now()+CERT_LIFETIME;let certificate=await this.getCertificateSigned(accountData.sessionToken,keyPair.rawKeyPair.serializedPublicKey,CERT_LIFETIME);log.debug("getCertificate got a new one: "+!!certificate);if(certificate){let toUpdate={keyPair,cert:{rawCert:certificate,validUntil:certWillBeValidUntil,},};await currentState.updateUserAccountData(toUpdate);}
return{keyPair:keyPair.rawKeyPair,certificate,};},getUserAccountData(fieldNames=null){return this.currentAccountState.getUserAccountData(fieldNames);},isUserEmailVerified:function isUserEmailVerified(data){return!!(data&&data.verified);},loadAndPoll(){let currentState=this.currentAccountState;return currentState.getUserAccountData().then(data=>{if(data){if(!this.isUserEmailVerified(data)){this.startPollEmailStatus(currentState,data.sessionToken,"browser-startup");}}
return data;});},startVerifiedCheck(data){log.debug("startVerifiedCheck",data&&data.verified);if(logPII){log.debug("startVerifiedCheck with user data",data);}


this.whenVerified(data).catch(err=>log.info("startVerifiedCheck promise was rejected: "+err));},whenVerified(data){let currentState=this.currentAccountState;if(data.verified){log.debug("already verified");return currentState.resolve(data);}
if(!currentState.whenVerifiedDeferred){log.debug("whenVerified promise starts polling for verified email");this.startPollEmailStatus(currentState,data.sessionToken,"start");}
return currentState.whenVerifiedDeferred.promise.then(result=>currentState.resolve(result));},async notifyObservers(topic,data){for(let f of this.observerPreloads){try{await f();}catch(O_o){}}
log.debug("Notifying observers of "+topic);Services.obs.notifyObservers(null,topic,data);},startPollEmailStatus(currentState,sessionToken,why){log.debug("entering startPollEmailStatus: "+why);

if(this.currentTimer){log.debug("startPollEmailStatus starting while existing timer is running");clearTimeout(this.currentTimer);this.currentTimer=null;}
this.pollStartDate=Date.now();if(!currentState.whenVerifiedDeferred){currentState.whenVerifiedDeferred=PromiseUtils.defer();


currentState.whenVerifiedDeferred.promise.then(()=>{log.info("the user became verified");

this.notifyObservers(ONVERIFIED_NOTIFICATION);},err=>{log.info("the wait for user verification was stopped: "+err);});}
return this.pollEmailStatus(currentState,sessionToken,why);},async pollEmailStatus(currentState,sessionToken,why){log.debug("entering pollEmailStatus: "+why);let nextPollMs;try{const response=await this.checkEmailStatus(sessionToken,{reason:why,});log.debug("checkEmailStatus -> "+JSON.stringify(response));if(response&&response.verified){await this.onPollEmailSuccess(currentState);return;}}catch(error){if(error&&error.code&&error.code==401){let error=new Error("Verification status check failed");this._rejectWhenVerified(currentState,error);return;}
if(error&&error.retryAfter){nextPollMs=(error.retryAfter+3)*1000;log.warn(`the server rejected our email status check and told us to try again in ${nextPollMs}ms`);}else{log.error(`checkEmailStatus failed to poll`,error);}}
if(why=="push"){return;}
let pollDuration=Date.now()-this.pollStartDate;if(pollDuration>=this.POLL_SESSION){if(currentState.whenVerifiedDeferred){let error=new Error("User email verification timed out.");this._rejectWhenVerified(currentState,error);}
log.debug("polling session exceeded, giving up");return;}
if(nextPollMs===undefined){let currentMinute=Math.ceil(pollDuration/60000);nextPollMs=why=="start"&&currentMinute<this.VERIFICATION_POLL_START_SLOWDOWN_THRESHOLD?this.VERIFICATION_POLL_TIMEOUT_INITIAL:this.VERIFICATION_POLL_TIMEOUT_SUBSEQUENT;}
this._scheduleNextPollEmailStatus(currentState,sessionToken,nextPollMs,why);}, _scheduleNextPollEmailStatus(currentState,sessionToken,nextPollMs,why){log.debug("polling with timeout = "+nextPollMs);this.currentTimer=setTimeout(()=>{this.pollEmailStatus(currentState,sessionToken,why);},nextPollMs);},async onPollEmailSuccess(currentState){try{await currentState.updateUserAccountData({verified:true});const accountData=await currentState.getUserAccountData(); if(currentState.whenVerifiedDeferred){currentState.whenVerifiedDeferred.resolve(accountData);delete currentState.whenVerifiedDeferred;}}catch(e){log.error(e);}},_rejectWhenVerified(currentState,error){currentState.whenVerifiedDeferred.reject(error);delete currentState.whenVerifiedDeferred;},async _doTokenFetch(scopeString,ttl){

let token;let oAuthURL=this.fxAccountsOAuthGrantClient.serverURL.href;let assertion=await this.getAssertion(oAuthURL);try{let result=await this.fxAccountsOAuthGrantClient.getTokenFromAssertion(assertion,scopeString,ttl);token=result.access_token;}catch(err){
if(err.code!==401||err.errno!==ERRNO_INVALID_FXA_ASSERTION){throw err;}
log.warn("OAuth server returned 401, refreshing certificate and retrying token fetch");await this.invalidateCertificate();assertion=await this.getAssertion(oAuthURL);let result=await this.fxAccountsOAuthGrantClient.getTokenFromAssertion(assertion,scopeString,ttl);token=result.access_token;}
return token;},async _doTokenFetchWithSessionToken(scopeString,ttl){return this.withSessionToken(async sessionToken=>{const result=await this.fxAccountsClient.accessTokenWithSessionToken(sessionToken,FX_OAUTH_CLIENT_ID,scopeString,ttl);return result.access_token;});},getOAuthToken(options={}){log.debug("getOAuthToken enter");let scope=options.scope;if(typeof scope==="string"){scope=[scope];}
if(!scope||!scope.length){return Promise.reject(this._error(ERROR_INVALID_PARAMETER,"Missing or invalid 'scope' option"));}
return this.withVerifiedAccountState(async currentState=>{let cached=currentState.getCachedToken(scope);if(cached){log.debug("getOAuthToken returning a cached token");return cached.token;}

let scopeString=scope.sort().join(" ");
let maybeInFlight=currentState.inFlightTokenRequests.get(scopeString);if(maybeInFlight){log.debug("getOAuthToken has an in-flight request for this scope");return maybeInFlight;}
let fetchFunction=this._doTokenFetch.bind(this);if(USE_SESSION_TOKENS_FOR_OAUTH){fetchFunction=this._doTokenFetchWithSessionToken.bind(this);}

let promise=fetchFunction(scopeString,options.ttl).then(token=>{

if(currentState.getCachedToken(scope)){log.error(`detected a race for oauth token with scope ${scope}`);}
if(token){let entry={token};currentState.setCachedToken(scope,entry);}
return token;}).finally(()=>{

currentState.inFlightTokenRequests.delete(scopeString);});currentState.inFlightTokenRequests.set(scopeString,promise);return promise;});},removeCachedOAuthToken(options){if(!options.token||typeof options.token!=="string"){throw this._error(ERROR_INVALID_PARAMETER,"Missing or invalid 'token' option");}
return this.withCurrentAccountState(currentState=>{let existing=currentState.removeCachedToken(options.token);if(existing){this._destroyOAuthToken(existing).catch(err=>{log.warn("FxA failed to revoke a cached token",err);});}});},invalidateCertificate(){return this.withCurrentAccountState(async currentState=>{await currentState.updateUserAccountData({cert:null});});},async _getVerifiedAccountOrReject(){let data=await this.currentAccountState.getUserAccountData();if(!data){ throw this._error(ERROR_NO_ACCOUNT);}
if(!this.isUserEmailVerified(data)){ throw this._error(ERROR_UNVERIFIED_ACCOUNT);}
return data;},
async _handleAccountDestroyed(uid){let state=this.currentAccountState;const accountData=await state.getUserAccountData();const localUid=accountData?accountData.uid:null;if(!localUid){log.info(`Account destroyed push notification received, but we're already logged-out`);return null;}
if(uid==localUid){const data=JSON.stringify({isLocalDevice:true});await this.notifyObservers(ON_DEVICE_DISCONNECTED_NOTIFICATION,data);return this.signOut(true);}
log.info(`The destroyed account uid doesn't match with the local uid. `+`Local: ${localUid}, account uid destroyed: ${uid}`);return null;},async _handleDeviceDisconnection(deviceId){let state=this.currentAccountState;const accountData=await state.getUserAccountData();if(!accountData||!accountData.device){return;}
const localDeviceId=accountData.device.id;const isLocalDevice=deviceId==localDeviceId;if(isLocalDevice){this.signOut(true);}
const data=JSON.stringify({isLocalDevice});await this.notifyObservers(ON_DEVICE_DISCONNECTED_NOTIFICATION,data);},async _handleEmailUpdated(newEmail){Services.prefs.setStringPref(PREF_LAST_FXA_USER,CryptoUtils.sha256Base64(newEmail));await this.currentAccountState.updateUserAccountData({email:newEmail});},_errorToErrorClass(aError){if(aError.errno){let error=SERVER_ERRNO_TO_ERROR[aError.errno];return this._error(ERROR_TO_GENERAL_ERROR_CLASS[error]||ERROR_UNKNOWN,aError);}else if(aError.message&&(aError.message==="INVALID_PARAMETER"||aError.message==="NO_ACCOUNT"||aError.message==="UNVERIFIED_ACCOUNT"||aError.message==="AUTH_ERROR")){return aError;}
return this._error(ERROR_UNKNOWN,aError);},_error(aError,aDetails){log.error("FxA rejecting with error ${aError}, details: ${aDetails}",{aError,aDetails,});let reason=new Error(aError);if(aDetails){reason.details=aDetails;}
return reason;},
updateDeviceRegistration(){return this.device.updateDeviceRegistration();},dropCredentials(state){
let updateData={};let clearField=field=>{if(!FXA_PWDMGR_REAUTH_WHITELIST.has(field)){updateData[field]=null;}};FXA_PWDMGR_PLAINTEXT_FIELDS.forEach(clearField);FXA_PWDMGR_SECURE_FIELDS.forEach(clearField);FXA_PWDMGR_MEMORY_FIELDS.forEach(clearField);return state.updateUserAccountData(updateData);},async checkAccountStatus(state){log.info("checking account status...");let data=await state.getUserAccountData(["uid","sessionToken"]);if(!data){log.info("account status: no user");return false;}

if(data.sessionToken){if(await this.fxAccountsClient.sessionStatus(data.sessionToken)){log.info("account status: ok");return true;}}
let exists=await this.fxAccountsClient.accountStatus(data.uid);if(!exists){
log.info("account status: deleted");await this._handleAccountDestroyed(data.uid);}else{

log.info("account status: needs reauthentication");await this.dropCredentials(this.currentAccountState);await this.notifyObservers(ON_ACCOUNT_STATE_CHANGE_NOTIFICATION);}
return false;},async _handleTokenError(err){if(!err||err.code!=401||err.errno!=ERRNO_INVALID_AUTH_TOKEN){throw err;}
log.warn("handling invalid token error",err);
let state=this.currentAccountState;let ok=await this.checkAccountStatus(state);if(ok){log.warn("invalid token error, but account state appears ok?");}
throw err;},};XPCOMUtils.defineLazyGetter(this,"fxAccounts",function(){let a=new FxAccounts();
 a._internal.loadAndPoll();return a;});var EXPORTED_SYMBOLS=["fxAccounts","FxAccounts"];