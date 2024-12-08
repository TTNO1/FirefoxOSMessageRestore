//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{clearTimeout,setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");var PushServiceWebSocket,PushServiceHttp2;XPCOMUtils.defineLazyServiceGetter(this,"gPushNotifier","@mozilla.org/push/Notifier;1","nsIPushNotifier");XPCOMUtils.defineLazyServiceGetter(this,"eTLDService","@mozilla.org/network/effective-tld-service;1","nsIEffectiveTLDService");XPCOMUtils.defineLazyServiceGetter(this,"gPowerManagerService","@mozilla.org/power/powermanagerservice;1","nsIPowerManagerService");ChromeUtils.defineModuleGetter(this,"pushBroadcastService","resource://gre/modules/PushBroadcastService.jsm");ChromeUtils.defineModuleGetter(this,"PushCrypto","resource://gre/modules/PushCrypto.jsm");ChromeUtils.defineModuleGetter(this,"PushServiceAndroidGCM","resource://gre/modules/PushServiceAndroidGCM.jsm");const CONNECTION_PROTOCOLS=(function(){if("android"!=AppConstants.MOZ_WIDGET_TOOLKIT){({PushServiceWebSocket}=ChromeUtils.import("resource://gre/modules/PushServiceWebSocket.jsm"));({PushServiceHttp2}=ChromeUtils.import("resource://gre/modules/PushServiceHttp2.jsm"));return[PushServiceWebSocket,PushServiceHttp2];}
return[PushServiceAndroidGCM];})();const EXPORTED_SYMBOLS=["PushService"];XPCOMUtils.defineLazyGetter(this,"console",()=>{let{ConsoleAPI}=ChromeUtils.import("resource://gre/modules/Console.jsm");return new ConsoleAPI({maxLogLevelPref:"dom.push.loglevel",prefix:"PushService",});});const prefs=Services.prefs.getBranch("dom.push.");const PUSH_SERVICE_UNINIT=0;const PUSH_SERVICE_INIT=1;const PUSH_SERVICE_ACTIVATING=2;const PUSH_SERVICE_CONNECTION_DISABLE=3;const PUSH_SERVICE_ACTIVE_OFFLINE=4;const PUSH_SERVICE_RUNNING=5;const STARTING_SERVICE_EVENT=0;const CHANGING_SERVICE_EVENT=1;const STOPPING_SERVICE_EVENT=2;const UNINIT_EVENT=3;const kWAKE_LOCK_TIMEOUT_PUSH_EVENT_DISPATCH=6000;function getServiceForServerURI(uri){let allowInsecure=prefs.getBoolPref("testing.allowInsecureServerURL",false);if(AppConstants.MOZ_WIDGET_TOOLKIT=="android"){if(uri.scheme=="https"||(allowInsecure&&uri.scheme=="http")){return CONNECTION_PROTOCOLS;}
return null;}
if(uri.scheme=="wss"||(allowInsecure&&uri.scheme=="ws")){return PushServiceWebSocket;}
if(uri.scheme=="https"||(allowInsecure&&uri.scheme=="http")){return PushServiceHttp2;}
return null;}
function errorWithResult(message,result=Cr.NS_ERROR_FAILURE){let error=new Error(message);error.result=result;return error;}
var PushService={_service:null,_state:PUSH_SERVICE_UNINIT,_db:null,_options:null,_visibleNotifications:new Map(),
_updateQuotaTestCallback:null,_updateQuotaTimeouts:new Set(),
_stateChangeProcessQueue:null,_stateChangeProcessEnqueue(op){if(!this._stateChangeProcessQueue){this._stateChangeProcessQueue=Promise.resolve();}
this._stateChangeProcessQueue=this._stateChangeProcessQueue.then(op).catch(error=>{console.error("stateChangeProcessEnqueue: Error transitioning state",error);return this._shutdownService();}).catch(error=>{console.error("stateChangeProcessEnqueue: Error shutting down service",error);});return this._stateChangeProcessQueue;},

_pendingRegisterRequest:{},_notifyActivated:null,_activated:null,_checkActivated(){if(this._state<PUSH_SERVICE_ACTIVATING){return Promise.reject(new Error("Push service not active"));}
if(this._state>PUSH_SERVICE_ACTIVATING){return Promise.resolve();}
if(!this._activated){this._activated=new Promise((resolve,reject)=>{this._notifyActivated={resolve,reject};});}
return this._activated;},_acquireWakeLock(timeOut=0){if(!AppConstants.MOZ_B2G||timeOut<=0){return;}
if(!this._serviceWakeLock){console.debug("acquireWakeLock: Acquiring PushService Wakelock");this._serviceWakeLock=gPowerManagerService.newWakeLock("cpu");}
if(!this._serviceWakeLockTimer){console.debug("acquireWakeLock: Creating PushService WakeLock Timer");this._serviceWakeLockTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
console.debug("acquireWakeLock: Setting PushService WakeLock Timer");this._serviceWakeLockTimer.initWithCallback(this._releaseWakeLock.bind(this),timeOut,Ci.nsITimer.TYPE_ONE_SHOT);},_releaseWakeLock(){if(!AppConstants.MOZ_B2G){return;}
console.debug("releaseWakeLock: Releasing PushService WakeLock");if(this._serviceWakeLockTimer){this._serviceWakeLockTimer.cancel();}
if(this._serviceWakeLock){this._serviceWakeLock.unlock();this._serviceWakeLock=null;}},_makePendingKey(aPageRecord){return aPageRecord.scope+"|"+aPageRecord.originAttributes;},_lookupOrPutPendingRequest(aPageRecord){let key=this._makePendingKey(aPageRecord);if(this._pendingRegisterRequest[key]){return this._pendingRegisterRequest[key];}
return(this._pendingRegisterRequest[key]=this._registerWithServer(aPageRecord));},_deletePendingRequest(aPageRecord){let key=this._makePendingKey(aPageRecord);if(this._pendingRegisterRequest[key]){delete this._pendingRegisterRequest[key];}},_setState(aNewState){console.debug("setState()","new state",aNewState,"old state",this._state);if(this._state==aNewState){return;}
if(this._state==PUSH_SERVICE_ACTIVATING){
 if(this._notifyActivated){if(aNewState<PUSH_SERVICE_ACTIVATING){this._notifyActivated.reject(new Error("Push service not active"));}else{this._notifyActivated.resolve();}}
this._notifyActivated=null;this._activated=null;}
this._state=aNewState;},async _changeStateOfflineEvent(offline,calledFromConnEnabledEvent){console.debug("changeStateOfflineEvent()",offline);if(this._state<PUSH_SERVICE_ACTIVE_OFFLINE&&this._state!=PUSH_SERVICE_ACTIVATING&&!calledFromConnEnabledEvent){return;}
if(offline){if(this._state==PUSH_SERVICE_RUNNING){this._service.disconnect();}
this._setState(PUSH_SERVICE_ACTIVE_OFFLINE);return;}
if(this._state==PUSH_SERVICE_RUNNING){
this._service.disconnect();}
let records=await this.getAllUnexpired();let broadcastListeners=await pushBroadcastService.getListeners();





this._setState(PUSH_SERVICE_RUNNING);if(records.length>0){this._service.connect(broadcastListeners);}
this._dropExpiredRegistrations().catch(error=>{console.error("Failed to drop expired registrations on idle",error);});},_changeStateConnectionEnabledEvent(enabled){console.debug("changeStateConnectionEnabledEvent()",enabled);if(this._state<PUSH_SERVICE_CONNECTION_DISABLE&&this._state!=PUSH_SERVICE_ACTIVATING){return Promise.resolve();}
if(enabled){return this._changeStateOfflineEvent(Services.io.offline,true);}
if(this._state==PUSH_SERVICE_RUNNING){this._service.disconnect();}
this._setState(PUSH_SERVICE_CONNECTION_DISABLE);return Promise.resolve();},changeTestServer(url,options={}){console.debug("changeTestServer()");return this._stateChangeProcessEnqueue(_=>{if(this._state<PUSH_SERVICE_ACTIVATING){console.debug("changeTestServer: PushService not activated?");return Promise.resolve();}
return this._changeServerURL(url,CHANGING_SERVICE_EVENT,options);});},observe:function observe(aSubject,aTopic,aData){switch(aTopic){case"quit-application":this.uninit();break;case"network-active-changed":this._stateChangeProcessEnqueue(_=>{let activeNetworkInfo=aSubject;let offline=false;if(!activeNetworkInfo){offline=true;}else{activeNetworkInfo=activeNetworkInfo.QueryInterface(Ci.nsINetworkInfo);offline=activeNetworkInfo.state!=Ci.nsINetworkInfo.NETWORK_STATE_CONNECTED;}
this._changeStateOfflineEvent(offline,false);});break;case"network:offline-status-changed":this._stateChangeProcessEnqueue(_=>this._changeStateOfflineEvent(aData==="offline",false));break;case"nsPref:changed":if(aData=="serverURL"){console.debug("observe: dom.push.serverURL changed for websocket",prefs.getStringPref("serverURL"));this._stateChangeProcessEnqueue(_=>this._changeServerURL(prefs.getStringPref("serverURL"),CHANGING_SERVICE_EVENT));}else if(aData=="connection.enabled"){this._stateChangeProcessEnqueue(_=>this._changeStateConnectionEnabledEvent(prefs.getBoolPref("connection.enabled")));}
break;case"idle-daily":this._dropExpiredRegistrations().catch(error=>{console.error("Failed to drop expired registrations on idle",error);});break;case"perm-changed":this._onPermissionChange(aSubject,aData).catch(error=>{console.error("onPermissionChange: Error updating registrations:",error);});break;case"clear-origin-attributes-data":this._clearOriginData(aData).catch(error=>{console.error("clearOriginData: Error clearing origin data:",error);});break;}},_clearOriginData(data){console.log("clearOriginData()");if(!data){return Promise.resolve();}
let pattern=JSON.parse(data);return this._dropRegistrationsIf(record=>record.matchesOriginAttributes(pattern));},_backgroundUnregister(record,reason){console.debug("backgroundUnregister()");if(!record){return;}
this._db.getByKeyID(record.keyID,"unsubscribeDb").then(isExist=>{if(!isExist){this._db.put(record,"unsubscribeDb").then(_=>{},reason=>{console.error("backgroundUnregister: Reject putting unsubscribeDb",reason);}).catch(_=>{console.error("backgroundUnregister: Error putting unsubscribeDb");});}}).catch(_=>{console.error("backgroundUnregister: Error getting a record by ID from unsubscribeDb");});if(!this._service.isConnected()){return;}
console.debug("backgroundUnregister: Notifying server",record);this._sendUnregister(record,reason).then(()=>{gPushNotifier.notifySubscriptionModified(record.scope,record.principal);}).catch(e=>{console.error("backgroundUnregister: Error notifying server",e);});},
getNetworkStateChangeEventName(){try{let networkManager=Cc["@mozilla.org/network/manager;1"];if(networkManager){networkManager.getService(Ci.nsINetworkManager);return"network-active-changed";}}catch(e){}
return"network:offline-status-changed";},_findService(serverURL){console.debug("findService()");if(!serverURL){console.warn("findService: No dom.push.serverURL found");return[];}
let uri;try{uri=Services.io.newURI(serverURL);}catch(e){console.warn("findService: Error creating valid URI from","dom.push.serverURL",serverURL);return[];}
let service=getServiceForServerURI(uri);return[service,uri];},_changeServerURL(serverURI,event,options={}){console.debug("changeServerURL()");switch(event){case UNINIT_EVENT:return this._stopService(event);case STARTING_SERVICE_EVENT:{let[service,uri]=this._findService(serverURI);if(!service){this._setState(PUSH_SERVICE_INIT);return Promise.resolve();}
return this._startService(service,uri,options).then(_=>this._changeStateConnectionEnabledEvent(prefs.getBoolPref("connection.enabled")));}
case CHANGING_SERVICE_EVENT:let[service,uri]=this._findService(serverURI);if(service){if(this._state==PUSH_SERVICE_INIT){this._setState(PUSH_SERVICE_ACTIVATING);return this._startService(service,uri,options).then(_=>this._changeStateConnectionEnabledEvent(prefs.getBoolPref("connection.enabled")));}
this._setState(PUSH_SERVICE_ACTIVATING);

return this._stopService(CHANGING_SERVICE_EVENT).then(_=>this._startService(service,uri,options)).then(_=>this._changeStateConnectionEnabledEvent(prefs.getBoolPref("connection.enabled")));}
if(this._state==PUSH_SERVICE_INIT){return Promise.resolve();}
this._setState(PUSH_SERVICE_INIT);return this._stopService(STOPPING_SERVICE_EVENT);default:console.error("Unexpected event in _changeServerURL",event);return Promise.reject(new Error(`Unexpected event ${event}`));}},async init(options={}){console.debug("init()");if(this._state>PUSH_SERVICE_UNINIT){return;}
this._setState(PUSH_SERVICE_ACTIVATING);prefs.addObserver("serverURL",this);Services.obs.addObserver(this,"quit-application");if(options.serverURI){await this._stateChangeProcessEnqueue(_=>this._changeServerURL(options.serverURI,STARTING_SERVICE_EVENT,options));}else{
await this._stateChangeProcessEnqueue(_=>this._changeServerURL(prefs.getStringPref("serverURL"),STARTING_SERVICE_EVENT));}},_startObservers(){console.debug("startObservers()");if(this._state!=PUSH_SERVICE_ACTIVATING){return;}
Services.obs.addObserver(this,"clear-origin-attributes-data");









this._networkStateChangeEventName=this.getNetworkStateChangeEventName();Services.obs.addObserver(this,this._networkStateChangeEventName);prefs.addObserver("connection.enabled",this);Services.obs.addObserver(this,"idle-daily");
Services.obs.addObserver(this,"perm-changed");},_startService(service,serverURI,options){console.debug("startService()");if(this._state!=PUSH_SERVICE_ACTIVATING){return Promise.reject();}
this._service=service;this._recordsIDCache=null;this._db=options.db;if(!this._db){this._db=this._service.newPushDB();}
return this._service.init(options,this,serverURI).then(()=>{this._startObservers();if(AppConstants.MOZ_B2G){return this._db.getAllKeyIDs().then(records=>{this._recordsIDCache=new Map();for(let record of records){this._setRecordID(record);}}).catch(()=>{console.error("Setup records ID cache error");}).finally(()=>{return this._dropExpiredRegistrations();});}
return this._dropExpiredRegistrations();});},_stopService(event){console.debug("stopService()");if(this._state<PUSH_SERVICE_ACTIVATING){return Promise.resolve();}
this._stopObservers();this._service.disconnect();this._service.uninit();this._service=null;this._updateQuotaTimeouts.forEach(timeoutID=>clearTimeout(timeoutID));this._updateQuotaTimeouts.clear();if(!this._db){return Promise.resolve();}
if(event==UNINIT_EVENT){this._db.close();this._db=null;return Promise.resolve();}
return this.dropUnexpiredRegistrations().then(_=>{this._db.close();this._db=null;},err=>{this._db.close();this._db=null;});},_stopObservers(){console.debug("stopObservers()");if(this._state<PUSH_SERVICE_ACTIVATING){return;}
prefs.removeObserver("connection.enabled",this);Services.obs.removeObserver(this,this._networkStateChangeEventName);Services.obs.removeObserver(this,"clear-origin-attributes-data");Services.obs.removeObserver(this,"idle-daily");Services.obs.removeObserver(this,"perm-changed");},_shutdownService(){let promiseChangeURL=this._changeServerURL("",UNINIT_EVENT);this._setState(PUSH_SERVICE_UNINIT);console.debug("shutdownService: shutdown complete!");return promiseChangeURL;},async uninit(){console.debug("uninit()");if(this._state==PUSH_SERVICE_UNINIT){return;}
prefs.removeObserver("serverURL",this);Services.obs.removeObserver(this,"quit-application");await this._stateChangeProcessEnqueue(_=>this._shutdownService());},dropUnexpiredRegistrations(){this._db.drop("unsubscribeDb").catch(_=>{console.error("dropUnexpiredRegistrations: Error dropping records of unsubscribeDb");});return this._db.clearIf(record=>{if(record.isExpired()){return false;}
this._notifySubscriptionChangeObservers(record);this._deleteRecordID(record);return true;});},_notifySubscriptionChangeObservers(record){if(!record){return;}
gPushNotifier.notifySubscriptionChange(record.scope,record.principal);},removePendingUnsubscribe(aKeyID){return this._db.delete(aKeyID,"unsubscribeDb").catch(_=>{console.error("removePendingUnsubscribe: Error deleting a record of unsubscribeDb");});},dropRegistrationAndNotifyApp(aKeyID){return this._db.delete(aKeyID).then(record=>{this._notifySubscriptionChangeObservers(record);this._deleteRecordID(record);});},updateRegistrationAndNotifyApp(aOldKey,aNewRecord){return this.updateRecordAndNotifyApp(aOldKey,_=>aNewRecord);},updateRecordAndNotifyApp(aKeyID,aUpdateFunc){return this._db.update(aKeyID,aUpdateFunc).then(record=>{this._notifySubscriptionChangeObservers(record);return record;});},ensureCrypto(record){if(record.hasAuthenticationSecret()&&record.p256dhPublicKey&&record.p256dhPrivateKey){return Promise.resolve(record);}
let keygen=Promise.resolve([]);if(!record.p256dhPublicKey||!record.p256dhPrivateKey){keygen=PushCrypto.generateKeys();}

return keygen.then(([pubKey,privKey])=>{return this.updateRecordAndNotifyApp(record.keyID,record=>{if(!record.p256dhPublicKey||!record.p256dhPrivateKey){record.p256dhPublicKey=pubKey;record.p256dhPrivateKey=privKey;}
if(!record.hasAuthenticationSecret()){record.authenticationSecret=PushCrypto.generateAuthenticationSecret();}
return record;});},error=>{return this.dropRegistrationAndNotifyApp(record.keyID).then(()=>Promise.reject(error));});},receivedPushMessage(keyID,messageID,headers,data,updateFunc){console.debug("receivedPushMessage()");return this._updateRecordAfterPush(keyID,updateFunc).then(record=>{if(record.quotaApplies()){
let timeoutID=setTimeout(_=>{this._updateQuota(keyID);if(!this._updateQuotaTimeouts.delete(timeoutID)){console.debug("receivedPushMessage: quota update timeout missing?");}},prefs.getIntPref("quotaUpdateDelay"));this._updateQuotaTimeouts.add(timeoutID);}
return this._decryptAndNotifyApp(record,messageID,headers,data);}).catch(error=>{console.error("receivedPushMessage: Error notifying app",error);return Ci.nsIPushErrorReporter.ACK_NOT_DELIVERED;});},receivedBroadcastMessage(message,context){pushBroadcastService.receivedBroadcastMessage(message.broadcasts,context).catch(e=>{console.error(e);});},_updateRecordAfterPush(keyID,updateFunc){return this.getByKeyID(keyID).then(record=>{if(!record){this.executePendingUnregisteringByKeyID(keyID);throw new Error("No record for key ID "+keyID);}
return record.getLastVisit().then(lastVisit=>{
if(!isFinite(lastVisit)){throw new Error("Ignoring message sent to unvisited origin");}
return lastVisit;}).then(lastVisit=>{
return this._db.update(keyID,record=>{let newRecord=updateFunc(record);if(!newRecord){return null;}



if(newRecord.isExpired()){this.executePendingUnregisteringByKeyID(newRecord.keyID);return null;}
newRecord.receivedPush(lastVisit);return newRecord;});});}).then(record=>{gPushNotifier.notifySubscriptionModified(record.scope,record.principal);return record;});},_decryptAndNotifyApp(record,messageID,headers,data){return PushCrypto.decrypt(record.p256dhPrivateKey,record.p256dhPublicKey,record.authenticationSecret,headers,data).then(message=>this._notifyApp(record,messageID,message),error=>{console.warn("decryptAndNotifyApp: Error decrypting message",record.scope,messageID,error);let message=error.format(record.scope);gPushNotifier.notifyError(record.scope,record.principal,message,Ci.nsIScriptError.errorFlag);return Ci.nsIPushErrorReporter.ACK_DECRYPTION_ERROR;});},_updateQuota(keyID){console.debug("updateQuota()");this._db.update(keyID,record=>{if(record.isExpired()){console.debug("updateQuota: Trying to update quota for expired record",record);return null;}

if(record.uri&&!this._visibleNotifications.has(record.uri.prePath)){record.reduceQuota();}
return record;}).then(record=>{if(record.isExpired()){
this._backgroundUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_QUOTA_EXCEEDED);}else{gPushNotifier.notifySubscriptionModified(record.scope,record.principal);}
if(this._updateQuotaTestCallback){this._updateQuotaTestCallback();}}).catch(error=>{console.debug("updateQuota: Error while trying to update quota",error);});},notificationForOriginShown(origin){console.debug("notificationForOriginShown()",origin);let count;if(this._visibleNotifications.has(origin)){count=this._visibleNotifications.get(origin);}else{count=0;}
this._visibleNotifications.set(origin,count+1);},notificationForOriginClosed(origin){console.debug("notificationForOriginClosed()",origin);let count;if(this._visibleNotifications.has(origin)){count=this._visibleNotifications.get(origin);}else{console.debug("notificationForOriginClosed: closing notification that has not been shown?");return;}
if(count>1){this._visibleNotifications.set(origin,count-1);}else{this._visibleNotifications.delete(origin);}},visitURI(uri){if(this._recordsIDCache){if(uri.prePath&&this._recordsIDCache.has(uri.prePath)){let keyID=this._recordsIDCache.get(uri.prePath);this._db.update(keyID,record=>{record.lastVisit=Date.now();console.debug("update lastVisit "+record.lastVisit);return record;});}}},reportDeliveryError(messageID,reason){console.debug("reportDeliveryError()",messageID,reason);if(this._state==PUSH_SERVICE_RUNNING&&this._service.isConnected()){this._service.reportDeliveryError(messageID,reason);}},_notifyApp(aPushRecord,messageID,message){if(!aPushRecord||!aPushRecord.scope||aPushRecord.originAttributes===undefined){console.error("notifyApp: Invalid record",aPushRecord);return Ci.nsIPushErrorReporter.ACK_NOT_DELIVERED;}
console.debug("notifyApp()",aPushRecord.scope);if(!aPushRecord.hasPermission()){console.warn("notifyApp: Missing push permission",aPushRecord);return Ci.nsIPushErrorReporter.ACK_NOT_DELIVERED;}
let payload=ArrayBuffer.isView(message)?new Uint8Array(message.buffer):message;if(aPushRecord.quotaApplies()){Services.telemetry.getHistogramById("PUSH_API_NOTIFY").add();}
if(!aPushRecord.systemRecord){this._acquireWakeLock(kWAKE_LOCK_TIMEOUT_PUSH_EVENT_DISPATCH);}
if(payload){gPushNotifier.notifyPushWithData(aPushRecord.scope,aPushRecord.principal,messageID,payload);}else{gPushNotifier.notifyPush(aPushRecord.scope,aPushRecord.principal,messageID);}
return Ci.nsIPushErrorReporter.ACK_DELIVERED;},getByKeyID(aKeyID){return this._db.getByKeyID(aKeyID);},getAllUnexpired(){return this._db.getAllUnexpired();},_sendRequest(action,...params){if(this._state==PUSH_SERVICE_CONNECTION_DISABLE){return Promise.reject(new Error("Push service disabled"));}
if(this._state==PUSH_SERVICE_ACTIVE_OFFLINE){return Promise.reject(new Error("Push service offline"));}


return this._checkActivated().then(_=>{switch(action){case"register":return this._service.register(...params);case"unregister":return this._service.unregister(...params);}
return Promise.reject(new Error("Unknown request type: "+action));});},_registerWithServer(aPageRecord){console.debug("registerWithServer()",aPageRecord);return this._sendRequest("register",aPageRecord).then(record=>this._onRegisterSuccess(record),err=>this._onRegisterError(err)).then(record=>{this._deletePendingRequest(aPageRecord);gPushNotifier.notifySubscriptionModified(record.scope,record.principal);return record.toSubscription();},err=>{this._deletePendingRequest(aPageRecord);throw err;});},_sendUnregister(aRecord,aReason){return this._sendRequest("unregister",aRecord,aReason);},_onRegisterSuccess(aRecord){console.debug("_onRegisterSuccess()");return this._db.put(aRecord).then(record=>{this._setRecordID(record);return record;}).catch(error=>{this._backgroundUnregister(aRecord,Ci.nsIPushErrorReporter.UNSUBSCRIBE_MANUAL);throw error;});},_onRegisterError(reply){console.debug("_onRegisterError()");if(!reply.error){console.warn("onRegisterError: Called without valid error message!",reply);throw new Error("Registration error");}
throw reply.error;},notificationsCleared(){this._visibleNotifications.clear();},_getByPageRecord(pageRecord){return this._checkActivated().then(_=>this._db.getByIdentifiers(pageRecord));},register(aPageRecord){console.debug("register()",aPageRecord);let keyPromise;if(aPageRecord.appServerKey&&aPageRecord.appServerKey.length!=0){let keyView=new Uint8Array(aPageRecord.appServerKey);keyPromise=PushCrypto.validateAppServerKey(keyView).catch(error=>{

throw errorWithResult("Invalid app server key",Cr.NS_ERROR_DOM_PUSH_INVALID_KEY_ERR);});}else{keyPromise=Promise.resolve(null);}
return Promise.all([keyPromise,this._getByPageRecord(aPageRecord)]).then(([appServerKey,record])=>{aPageRecord.appServerKey=appServerKey;if(!record){return this._lookupOrPutPendingRequest(aPageRecord);}
if(!record.matchesAppServerKey(appServerKey)){throw errorWithResult("Mismatched app server key",Cr.NS_ERROR_DOM_PUSH_MISMATCHED_KEY_ERR);}
if(record.isExpired()){return record.quotaChanged().then(isChanged=>{if(isChanged){
return this.dropRegistrationAndNotifyApp(record.keyID);}
throw new Error("Push subscription expired");}).then(_=>this._lookupOrPutPendingRequest(aPageRecord));}
return record.toSubscription();});},async subscribeBroadcast(broadcastId,version){if(this._state!=PUSH_SERVICE_RUNNING){
return;}
await this._service.sendSubscribeBroadcast(broadcastId,version);},unregister(aPageRecord){console.debug("unregister()",aPageRecord);return this._getByPageRecord(aPageRecord).then(record=>{if(record===null){return false;}
return this._db.getByKeyID(record.keyID,"unsubscribeDb").then(isExist=>{if(!isExist){this._db.put(record,"unsubscribeDb").catch(_=>{console.error("unregister: Error putting a record into unsubscribeDb");});}}).catch(_=>{console.error("unregister: Error getting a record by ID from unsubscribeDb");}).then(_=>{let reason=Ci.nsIPushErrorReporter.UNSUBSCRIBE_MANUAL;return Promise.all([this._sendUnregister(record,reason),this._db.delete(record.keyID).then(rec=>{if(rec){gPushNotifier.notifySubscriptionModified(rec.scope,rec.principal);}
if(this._service.isConnected()){
this.executeAllPendingUnregistering(record.keyID);}
this._deleteRecordID(record);}),]).then(([success])=>success);});});},clear(info){return this._checkActivated().then(_=>{return this._dropRegistrationsIf(record=>info.domain=="*"||(record.uri&&eTLDService.hasRootDomain(record.uri.prePath,info.domain)));}).catch(e=>{console.warn("clear: Error dropping subscriptions for domain",info.domain,e);return Promise.resolve();});},registration(aPageRecord){console.debug("registration()");return this._getByPageRecord(aPageRecord).then(record=>{if(!record){return null;}
if(record.isExpired()){return record.quotaChanged().then(isChanged=>{if(isChanged){return this.dropRegistrationAndNotifyApp(record.keyID).then(_=>null);}
return null;});}
return record.toSubscription();});},_dropExpiredRegistrations(){console.debug("dropExpiredRegistrations()");return this._db.getAllExpired().then(records=>{return Promise.all(records.map(record=>record.quotaChanged().then(isChanged=>{if(isChanged){if(this._state!=PUSH_SERVICE_RUNNING){return;}

this.dropRegistrationAndNotifyApp(record.keyID);}}).catch(error=>{console.error("dropExpiredRegistrations: Error dropping registration",record.keyID,error);})));});},executePendingUnregisteringByKeyID(aKeyID){console.debug("executePendingUnregisteringByKeyID()");this._db.getByKeyID(aKeyID,"unsubscribeDb").then(record=>{if(!record){return;}
console.debug("channel ID: ",record.keyID);if(!record.reachMaxUnregisterTries()){this._db.update(record.keyID,record=>{record.unregisterTries++;return record;},"unsubscribeDb").catch(_=>{console.error("executeAllPendingUnregistering: Error updating a record unregister retry count in unsubscribeDb");}).then(_=>{this._sendUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_PENDING_RECORD).catch(e=>{console.error("executePendingUnregisteringByKeyID: Error notifying server",e);});});}else{console.error("Retry count exceeded, drop the record");this.removePendingUnsubscribe(record.keyID);}});},executeAllPendingUnregistering(aNewKeyID=null){console.debug("executeAllPendingUnregistering()");this._db.getAllKeyIDs("unsubscribeDb").then(records=>{return Promise.all(records.map(record=>{if(aNewKeyID&&record.keyID==aNewKeyID){return;}
console.debug("channel ID: ",record.keyID);if(!record.reachMaxUnregisterTries()){this._db.update(record.keyID,record=>{record.unregisterTries++;return record;},"unsubscribeDb").catch(_=>{console.error("executeAllPendingUnregistering: Error updating a record unregister retry count in unsubscribeDb");}).then(_=>{this._sendUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_PENDING_RECORD).catch(e=>{console.error("executePendingUnregisteringByKeyID: Error notifying server",e);});});}else{console.error("Retry count exceeded, drop the record");this.removePendingUnsubscribe(record.keyID);}}));});},_onPermissionChange(subject,data){console.debug("onPermissionChange()");if(data=="cleared"){return this._clearPermissions();}
let permission=subject.QueryInterface(Ci.nsIPermission);if(permission.type!="desktop-notification"){return Promise.resolve();}
return this._updatePermission(permission,data);},_clearPermissions(){console.debug("clearPermissions()");return this._db.clearIf(record=>{if(!record.quotaApplies()){return false;}
this._backgroundUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_PERMISSION_REVOKED);this._deleteRecordID(record);return true;});},_updatePermission(permission,type){console.debug("updatePermission()");let isAllow=permission.capability==Ci.nsIPermissionManager.ALLOW_ACTION;let isChange=type=="added"||type=="changed";if(isAllow&&isChange){

return this._forEachPrincipal(permission.principal,(record,cursor)=>this._permissionAllowed(record,cursor));}else if(isChange||(isAllow&&type=="deleted")){
return this._forEachPrincipal(permission.principal,(record,cursor)=>this._permissionDenied(record,cursor));}
return Promise.resolve();},_forEachPrincipal(principal,callback){return this._db.forEachOrigin(principal.URI.prePath,ChromeUtils.originAttributesToSuffix(principal.originAttributes),callback);},_permissionDenied(record,cursor){console.debug("permissionDenied()");if(!record.quotaApplies()||record.isExpired()){return;}
this._backgroundUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_PERMISSION_REVOKED);record.setQuota(0);cursor.update(record);},_permissionAllowed(record,cursor){console.debug("permissionAllowed()");if(!record.quotaApplies()){return;}
if(record.isExpired()){if(this._state!=PUSH_SERVICE_RUNNING){return;}

this._notifySubscriptionChangeObservers(record);cursor.delete();return;}
record.resetQuota();cursor.update(record);},_dropRegistrationsIf(predicate){return this._db.clearIf(record=>{if(!predicate(record)){return false;}
if(record.hasPermission()){

this._notifySubscriptionChangeObservers(record);}
if(!record.isExpired()){
this._backgroundUnregister(record,Ci.nsIPushErrorReporter.UNSUBSCRIBE_MANUAL);}
this._deleteRecordID(record);return true;});},_setRecordID(record){if(this._recordsIDCache){let recordURI=record.uri;this._recordsIDCache.set(recordURI.prePath,record.channelID);}},_deleteRecordID(record){if(this._recordsIDCache){let recordURI=record.uri;this._recordsIDCache.delete(recordURI.prePath);}},};