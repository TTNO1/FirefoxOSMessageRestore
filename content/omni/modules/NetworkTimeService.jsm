//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{Sntp}=ChromeUtils.import("resource://gre/modules/Sntp.jsm");var RIL_DEBUG=ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");XPCOMUtils.defineLazyServiceGetter(this,"gTime","@mozilla.org/sidl-native/time;1","nsITime");XPCOMUtils.defineLazyServiceGetter(this,"gNetworkManager","@mozilla.org/network/manager;1","nsINetworkManager");XPCOMUtils.defineLazyServiceGetter(this,"gSettingsManager","@mozilla.org/sidl-native/settings;1","nsISettingsManager");const NETWORKTIMESERVICE_CID=Components.ID("{08e5d35e-40fc-4404-ad42-b6c5efa59d68}");const NS_XPCOM_SHUTDOWN_OBSERVER_ID="xpcom-shutdown";const kNetworkActiveChangedTopic="network-active-changed";const OBSERVER_TOPICS_ARRAY=[NS_XPCOM_SHUTDOWN_OBSERVER_ID,kNetworkActiveChangedTopic,];const kSettingsClockAutoUpdateEnabled="time.clock.automatic-update.enabled";const kSettingsClockAutoUpdateAvailable="time.clock.automatic-update.available";const kSettingsTimezoneAutoUpdateEnabled="time.timezone.automatic-update.enabled";const kSettingsTimezoneAutoUpdateAvailable="time.timezone.automatic-update.available";const kSettingsDataDefaultServiceId="ril.data.defaultServiceId";const SETTING_KEYS_ARRAY=[kSettingsClockAutoUpdateEnabled,kSettingsClockAutoUpdateAvailable,kSettingsTimezoneAutoUpdateEnabled,kSettingsTimezoneAutoUpdateAvailable,kSettingsDataDefaultServiceId,];const NETWORK_TYPE_WIFI=Ci.nsINetworkInfo.NETWORK_TYPE_WIFI;const NETWORK_TYPE_MOBILE=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE;const INVALID_UPTIME=undefined;var DEBUG;function updateDebugFlag(){ let debugPref;try{debugPref=debugPref||Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);}catch(e){debugPref=false;}
DEBUG=RIL_DEBUG.DEBUG_RIL||debugPref;}
updateDebugFlag();function NetworkTimeService(){if(DEBUG){this.debug("NetworkTimeService constructor");}
this._lastNitzData=[];this._suggestedTimeRequests=[];this._clockAutoUpdateEnabled=false;this._timezoneAutoUpdateEnabled=false;this._dataDefaultServiceId=-1;this._sntpTimeoutInSecs=Services.prefs.getIntPref("network.sntp.timeout");this._sntp=new Sntp(this.onSntpDataAvailable.bind(this),Services.prefs.getIntPref("network.sntp.maxRetryCount"),Services.prefs.getIntPref("network.sntp.refreshPeriod"),this._sntpTimeoutInSecs,Services.prefs.getCharPref("network.sntp.pools").split(";"),Services.prefs.getIntPref("network.sntp.port"));if(gSettingsManager){

gSettingsManager.getBatch([kSettingsClockAutoUpdateEnabled,kSettingsTimezoneAutoUpdateEnabled,kSettingsDataDefaultServiceId,],{resolve:settings=>{settings.forEach(info=>{this.handle(info.name,JSON.parse(info.value));});},reject:()=>{},});}
this._setClockAutoUpdateAvailable(false);this._setTimezoneAutoUpdateAvailable(false);this._initObservers();if(DEBUG){this.debug("NetworkTimeService constructor end");}}
NetworkTimeService.prototype={classID:NETWORKTIMESERVICE_CID,QueryInterface:ChromeUtils.generateQI([Ci.nsINetworkTimeService,Ci.nsIObserver,Ci.nsISidlDefaultResponse,Ci.nsISettingsObserver,Ci.nsITimeObserver,]),
_lastNitzData:null,
_clockAutoUpdateEnabled:null,
_timezoneAutoUpdateEnabled:null,_sntp:null,_suggestedTimeRequests:null,_dataDefaultServiceId:null,_sntpTimeoutInSecs:null,_sntpTimer:null,debug(aMessage){console.log("NetworkTimeService: "+aMessage);},setTelephonyTime(aSlotId,aNitzData){this._setClockAutoUpdateAvailable(true);this._setTimezoneAutoUpdateAvailable(true);this._lastNitzData[aSlotId]=aNitzData;if(this._clockAutoUpdateEnabled){this.setClockByNitz(aNitzData);}
if(this._timezoneAutoUpdateEnabled){this.setTimezoneByNitz(aNitzData);}},getSuggestedNetworkTime(aCallback){if(this._lastNitzData[0]){this._getClockByNitz(this._lastNitzData[0]).then(suggestion=>{aCallback.onSuggestedNetworkTimeResponse(suggestion);}).catch(()=>{this.debug("getSuggestedNetworkTime rejected");});return;} 
if(gNetworkManager.activeNetworkInfo&&gNetworkManager.activeNetworkInfo.state==Ci.nsINetworkInfo.NETWORK_STATE_CONNECTED){if(!this._sntp.isExpired()){let offset=this._sntp.getOffset();aCallback.onSuggestedNetworkTimeResponse(Date.now()+offset);}else{this._suggestedTimeRequests.push(aCallback);if(this._suggestedTimeRequests.length==1){this._requestSntp();}}
return;}
aCallback.onSuggestedNetworkTimeResponse(Date.now());},handle(aName,aResult){switch(aName){case kSettingsClockAutoUpdateEnabled:this._clockAutoUpdateEnabled=aResult;if(!this._clockAutoUpdateEnabled){break;}
if(this._lastNitzData[0]){this.setClockByNitz(this._lastNitzData[0]);}else if(gNetworkManager.activeNetworkInfo&&gNetworkManager.activeNetworkInfo.state==Ci.nsINetworkInfo.NETWORK_STATE_CONNECTED){if(!this._sntp.isExpired()){this._setClockBySntp(this._sntp.getOffset());}else{this._sntp.request();}}
break;case kSettingsTimezoneAutoUpdateEnabled:this._timezoneAutoUpdateEnabled=aResult;if(this._timezoneAutoUpdateEnabled){if(this._timezoneAutoUpdateEnabled&&this._lastNitzData[0]){this.setTimezoneByNitz(this._lastNitzData[0],true);}}
break;case kSettingsDataDefaultServiceId:this._dataDefaultServiceId=aResult;break;default:break;}},observe(aSubject,aTopic,aData){switch(aTopic){case NS_XPCOM_SHUTDOWN_OBSERVER_ID:this._deinitObservers();break;case kNetworkActiveChangedTopic:if(!aSubject){return;}
let networkInfo=aSubject.QueryInterface(Ci.nsINetworkInfo);if(!networkInfo||networkInfo.state!=Ci.nsINetworkInfo.NETWORK_STATE_CONNECTED){return;}
if(networkInfo.type!=NETWORK_TYPE_WIFI&&networkInfo.type!=NETWORK_TYPE_MOBILE){return;}
if(networkInfo.type==NETWORK_TYPE_MOBILE&&aSubject instanceof Ci.nsIRilNetworkInfo){networkInfo=aSubject.QueryInterface(Ci.nsIRilNetworkInfo);if(networkInfo.serviceId!=this._dataDefaultServiceId){return;}}
if(this._sntp.isExpired()){this.debug("sntp expired, request");this._requestSntp();}
break;default:break;}}, resolve(){if(DEBUG){this.debug("SIDL op success");}},reject(){this.debug("SIDL op error");}, observeSetting(aSettingInfo){if(aSettingInfo){this.handleSettingsChange(aSettingInfo.name,JSON.parse(aSettingInfo.value));}}, notify(aTimeInfo){switch(aTimeInfo.reason){case Ci.nsITime.TIME_CHANGED:let offset=parseInt(aTimeInfo.delta,10);this._sntp.updateOffset(offset);break;}},handleSettingsChange(aName,aResult){
if(aName===kSettingsClockAutoUpdateAvailable){let isClockAutoUpdateAvailable=this._lastNitzData[0]!==null||this._sntp.isAvailable();if(aResult!==isClockAutoUpdateAvailable){if(DEBUG){this.debug("Content processes cannot modify 'time.clock.automatic-update.available'. Restore!");}
this._setClockAutoUpdateAvailable(isClockAutoUpdateAvailable);}
return;}


if(aName===kSettingsTimezoneAutoUpdateAvailable){let isTimezoneAutoUpdateAvailable=this._lastNitzData[0]!==null;if(aResult!==isTimezoneAutoUpdateAvailable){if(DEBUG){this.debug("Content processes cannot modify 'time.timezone.automatic-update.available'. Restore!");}
this._setTimezoneAutoUpdateAvailable(isTimezoneAutoUpdateAvailable);}
return;}
this.handle(aName,aResult);},_setClockAutoUpdateAvailable(aAvailable){this._updateSetting(kSettingsClockAutoUpdateAvailable,aAvailable);},_setTimezoneAutoUpdateAvailable(aAvailable){this._updateSetting(kSettingsTimezoneAutoUpdateAvailable,aAvailable);},setClockByNitz(aNitzData){if(DEBUG){this.debug("setClockByNitz: "+aNitzData.time);}
this._getClockByNitz(aNitzData).then(nitzTime=>{if(nitzTime==INVALID_UPTIME){this.debug("setClockByNitz nitzTime is invalid, skip!");return;}
gTime.setTime(nitzTime,this);}).catch(()=>{});},_getClockByNitz(aNitzData){let self=this;
return new Promise((aResolve,_aReject)=>{let callback={QueryInterface:ChromeUtils.generateQI([Ci.nsITimeGetElapsedRealTime]),resolve(systemUpTime){let upTimeDiff=systemUpTime?systemUpTime-aNitzData.receiveTime:-1;if(DEBUG){self.debug("_getClockByNitz: "+upTimeDiff);}
if(upTimeDiff<0){self.debug("_getClockByNitz upTimeDiff is invalid!");aResolve(INVALID_UPTIME);}
aResolve(aNitzData.time+upTimeDiff);},reject(){aResolve(INVALID_UPTIME);},};let timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);timer.initWithCallback(()=>{if(DEBUG){self.debug("500ms timeout, force reject");}
callback.reject();},500,Ci.nsITimer.TYPE_ONE_SHOT);gTime.getElapsedRealTime(callback);});},setTimezoneByNitz(aNitzData,aForceUpdate=false){


this._updateSetting("time.timezone.dst",aNitzData.dst);if(aForceUpdate||aNitzData.timeZone!=new Date().getTimezoneOffset()){let absTimeZoneInMinutes=Math.abs(aNitzData.timeZone);let timeZoneStr="UTC";timeZoneStr+=aNitzData.timeZone>0?"-":"+";timeZoneStr+=("0"+Math.floor(absTimeZoneInMinutes/60)).slice(-2);timeZoneStr+=":";timeZoneStr+=("0"+(absTimeZoneInMinutes%60)).slice(-2);this._updateSetting("time.timezone",timeZoneStr);}},onSntpDataAvailable(aOffset){this._cancelSntpTimer();this._setClockBySntp(aOffset);this._notifyRequesters(aOffset);},_notifyRequesters(aOffset){if(this._suggestedTimeRequests.length){let suggestion=Date.now()+aOffset;for(let index=0;index<this._suggestedTimeRequests.length;index++){this._suggestedTimeRequests[index].onSuggestedNetworkTimeResponse(suggestion);}
this._suggestedTimeRequests=[];}},_setClockBySntp(aOffset){this._setClockAutoUpdateAvailable(true);if(!this._clockAutoUpdateEnabled){return;}
if(this._lastNitzData[0]){if(DEBUG){this.debug("SNTP: NITZ available, discard SNTP");}
return;}
gTime.setTime(Date.now()+aOffset,this);},_updateSetting(aKey,aValue){if(gSettingsManager){if(DEBUG){this.debug("Update setting key: "+aKey+", value: "+JSON.stringify(aValue));}
gSettingsManager.set([{name:aKey,value:JSON.stringify(aValue),},],{resolve(){},reject(){},});}},_initObservers(){this._initTopicObservers();this._initSettingsObservers();gTime.addObserver(Ci.nsITime.TIME_CHANGED,this,this);},_deinitObservers(){this._deinitTopicObservers();this._deinitSettingsObservers();gTime.removeObserver(Ci.nsITime.TIME_CHANGED,this,this);},_initTopicObservers(){this.debug("init observers: "+OBSERVER_TOPICS_ARRAY);OBSERVER_TOPICS_ARRAY.forEach(topic=>{Services.obs.addObserver(this,topic);});},_deinitTopicObservers(){OBSERVER_TOPICS_ARRAY.forEach(topic=>{Services.obs.removeObserver(this,topic);});},_initSettingsObservers(){this.debug("_initSettingsObservers: "+SETTING_KEYS_ARRAY);SETTING_KEYS_ARRAY.forEach(setting=>{this._addSettingsObserver(setting);});},_deinitSettingsObservers(){SETTING_KEYS_ARRAY.forEach(setting=>{this._removeSettingsObserver(setting);});},_addSettingsObserver(aKey){gSettingsManager.addObserver(aKey,this,{resolve:()=>{if(DEBUG){this.debug("Add SettingObserve "+aKey+" success");}},reject:()=>{this.debug("Add SettingObserve "+aKey+" failed");},});},_removeSettingsObserver(aKey){gSettingsManager.removeObserver(aKey,this,{resolve:()=>{if(DEBUG){this.debug("Remove SettingObserve "+aKey+" success");}},reject:()=>{this.debug("Remove SettingObserve "+aKey+" failed");},});},_requestSntp(){this._sntp.request();this._cancelSntpTimer();this._sntpTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this._sntpTimer.initWithCallback(()=>{this._notifyRequesters(0);this._sntpTimer=null;},this._sntpTimeoutInSecs*1000,Ci.nsITimer.TYPE_ONE_SHOT);},_cancelSntpTimer(){if(this._sntpTimer){if(DEBUG){this.debug("cancel sntp timer");}
this._sntpTimer.cancel();this._sntpTimer=null;}},};var EXPORTED_SYMBOLS=["NetworkTimeService"];