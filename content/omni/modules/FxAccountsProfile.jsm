//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FxAccountsProfile"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{ON_PROFILE_CHANGE_NOTIFICATION,log}=ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");const{fxAccounts}=ChromeUtils.import("resource://gre/modules/FxAccounts.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsProfileClient","resource://gre/modules/FxAccountsProfileClient.jsm");var FxAccountsProfile=function(options={}){this._currentFetchPromise=null;this._cachedAt=0;this._isNotifying=false;this.fxai=options.fxai||fxAccounts._internal;this.client=options.profileClient||new FxAccountsProfileClient({fxai:this.fxai,serverURL:options.profileServerUrl,});
Services.obs.addObserver(this,ON_PROFILE_CHANGE_NOTIFICATION,true); if(options.channel){this.channel=options.channel;}};FxAccountsProfile.prototype={
PROFILE_FRESHNESS_THRESHOLD:120000, observe(subject,topic,data){

if(topic==ON_PROFILE_CHANGE_NOTIFICATION&&!this._isNotifying){log.debug("FxAccountsProfile observed profile change");this._cachedAt=0;}},tearDown(){this.fxai=null;this.client=null;Services.obs.removeObserver(this,ON_PROFILE_CHANGE_NOTIFICATION);},_notifyProfileChange(uid){this._isNotifying=true;Services.obs.notifyObservers(null,ON_PROFILE_CHANGE_NOTIFICATION,uid);this._isNotifying=false;},_cacheProfile(response){return this.fxai.withCurrentAccountState(async state=>{const profile=response.body;const userData=await state.getUserAccountData();if(profile.uid!=userData.uid){throw new Error("The fetched profile does not correspond with the current account.");}
let profileCache={profile,etag:response.etag,};await state.updateUserAccountData({profileCache});if(profile.email!=userData.email){await this.fxai._handleEmailUpdated(profile.email);}
log.debug("notifying profile changed for user ${uid}",userData);this._notifyProfileChange(userData.uid);return profile;});},async _getProfileCache(){let data=await this.fxai.currentAccountState.getUserAccountData(["profileCache",]);return data?data.profileCache:null;},async _fetchAndCacheProfileInternal(){try{const profileCache=await this._getProfileCache();const etag=profileCache?profileCache.etag:null;let response;try{response=await this.client.fetchProfile(etag);}catch(err){await this.fxai._handleTokenError(err);throw new Error("not reached!");}
if(!response){return null;}
return await this._cacheProfile(response);}finally{this._cachedAt=Date.now();this._currentFetchPromise=null;}},_fetchAndCacheProfile(){if(!this._currentFetchPromise){this._currentFetchPromise=this._fetchAndCacheProfileInternal();}
return this._currentFetchPromise;},


async getProfile(){const profileCache=await this._getProfileCache();if(!profileCache){this._fetchAndCacheProfile().catch(err=>{log.error("Background refresh of initial profile failed",err);});return null;}
if(Date.now()>this._cachedAt+this.PROFILE_FRESHNESS_THRESHOLD){
this._fetchAndCacheProfile().catch(err=>{log.error("Background refresh of profile failed",err);});}else{log.trace("not checking freshness of profile as it remains recent");}
return profileCache.profile;},
async ensureProfile({staleOk=false,forceFresh=false}={}){if(staleOk&&forceFresh){throw new Error("contradictory options specified");}
const profileCache=await this._getProfileCache();if(forceFresh||!profileCache||(Date.now()>this._cachedAt+this.PROFILE_FRESHNESS_THRESHOLD&&!staleOk)){const profile=await this._fetchAndCacheProfile().catch(err=>{log.error("Background refresh of profile failed",err);});if(profile){return profile;}}
log.trace("not checking freshness of profile as it remains recent");return profileCache?profileCache.profile:null;},QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]),};