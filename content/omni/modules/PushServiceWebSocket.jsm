//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{PushDB}=ChromeUtils.import("resource://gre/modules/PushDB.jsm");const{PushRecord}=ChromeUtils.import("resource://gre/modules/PushRecord.jsm");const{PushCrypto}=ChromeUtils.import("resource://gre/modules/PushCrypto.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const isGonk=AppConstants.platform==="gonk";ChromeUtils.defineModuleGetter(this,"AlarmService","resource://gre/modules/AlarmService.jsm");ChromeUtils.defineModuleGetter(this,"PushCredential","resource://gre/modules/PushCredential.jsm");ChromeUtils.defineModuleGetter(this,"pushBroadcastService","resource://gre/modules/PushBroadcastService.jsm");ChromeUtils.defineModuleGetter(this,"ObjectUtils","resource://gre/modules/ObjectUtils.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gPowerManagerService","@mozilla.org/power/powermanagerservice;1","nsIPowerManagerService");const kPUSHWSDB_DB_NAME="pushapi";const kPUSHWSDB_DB_VERSION=6;const kPUSHWSDB_STORE_NAME="pushapi";
const kBACKOFF_WS_STATUS_CODE=4774;const kMinRequestTimeOut=1000;

const kACK_STATUS_TO_CODE={[Ci.nsIPushErrorReporter.ACK_DELIVERED]:100,[Ci.nsIPushErrorReporter.ACK_DECRYPTION_ERROR]:101,[Ci.nsIPushErrorReporter.ACK_NOT_DELIVERED]:102,};const kUNREGISTER_REASON_TO_CODE={[Ci.nsIPushErrorReporter.UNSUBSCRIBE_MANUAL]:200,[Ci.nsIPushErrorReporter.UNSUBSCRIBE_QUOTA_EXCEEDED]:201,[Ci.nsIPushErrorReporter.UNSUBSCRIBE_PERMISSION_REVOKED]:202,[Ci.nsIPushErrorReporter.UNSUBSCRIBE_PENDING_RECORD]:203,};const kDELIVERY_REASON_TO_CODE={[Ci.nsIPushErrorReporter.DELIVERY_UNCAUGHT_EXCEPTION]:301,[Ci.nsIPushErrorReporter.DELIVERY_UNHANDLED_REJECTION]:302,[Ci.nsIPushErrorReporter.DELIVERY_INTERNAL_ERROR]:303,};const prefs=Services.prefs.getBranch("dom.push.");const EXPORTED_SYMBOLS=["PushServiceWebSocket"];XPCOMUtils.defineLazyGetter(this,"console",()=>{let{ConsoleAPI}=ChromeUtils.import("resource://gre/modules/Console.jsm");return new ConsoleAPI({maxLogLevelPref:"dom.push.loglevel",prefix:"PushServiceWebSocket",});});var PushWebSocketListener=function(pushService){this._pushService=pushService;};PushWebSocketListener.prototype={onStart(context){if(!this._pushService){return;}
this._pushService._wsOnStart(context);},onStop(context,statusCode){if(!this._pushService){return;}
this._pushService._wsOnStop(context,statusCode);},onAcknowledge(context,size){},onBinaryMessageAvailable(context,message){},onMessageAvailable(context,message){if(!this._pushService){return;}
this._pushService._wsOnMessageAvailable(context,message);},onServerClose(context,aStatusCode,aReason){if(!this._pushService){return;}
this._pushService._wsOnServerClose(context,aStatusCode,aReason);},};
const STATE_SHUT_DOWN=0;const STATE_WAITING_FOR_WS_START=1;const STATE_WAITING_FOR_HELLO=2;const STATE_READY=3;var PushServiceWebSocket={_mainPushService:null,_serverURI:null,_currentlyRegistering:new Set(),_alarmID:null,newPushDB(){return new PushDB(kPUSHWSDB_DB_NAME,kPUSHWSDB_DB_VERSION,kPUSHWSDB_STORE_NAME,"channelID",PushRecordWebSocket);},disconnect(){this._shutdownWS();},observe(aSubject,aTopic,aData){if(aTopic=="nsPref:changed"&&aData=="dom.push.userAgentID"){this._onUAIDChanged();}else if(aTopic=="timer-callback"){this._onTimerFired(aSubject);}},_onUAIDChanged(){console.debug("onUAIDChanged()");this._shutdownWS();if(this._alarmEnabled){this._startBackoffAlarm();}else{this._startBackoffTimer();}},_onTimerFired(timer){console.debug("onTimerFired()");if(timer==this._pingTimer){this._sendPing();return;}
if(timer==this._backoffTimer){console.debug("onTimerFired: Reconnecting after backoff");this._beginWSSetup();return;}
if(timer==this._requestTimeoutTimer){this._timeOutRequests();}},_onAlarmFired(){if(this._lastPingTime>0){console.debug("Did not receive pong in time. Reconnecting WebSocket.");this._shutdownWS();this._startBackoffAlarm();}else if(this._currentState==STATE_READY){

this._sendPing();}else if(this._alarmID!==null){console.debug("reconnect alarm fired.");



this._beginWSSetup();}},_sendPing(){console.debug("sendPing()");if(this._alarmEnabled){this._setAlarm(prefs.getIntPref("requestTimeout"));}else{this._startRequestTimeoutTimer();}
try{this._wsSendMessage({});this._lastPingTime=Date.now();}catch(e){console.debug("sendPing: Error sending ping",e);this._reconnect();}},_timeOutRequests(){console.debug("timeOutRequests()");if(!this._hasPendingRequests()){
this._requestTimeoutTimer.cancel();this._requestTimeout=this._requestTimeoutBase;return;}
let now=Date.now();
let requestTimedOut=false;if(!this._alarmEnabled&&this._lastPingTime>0&&now-this._lastPingTime>this._requestTimeout){console.debug("timeOutRequests: Did not receive pong in time");requestTimedOut=true;}else{for(let[key,request]of this._pendingRequests){let duration=now-request.ctime;

requestTimedOut|=duration>this._requestTimeout;if(requestTimedOut){request.reject(new Error("Request timed out: "+key));this._pendingRequests.delete(key);}}}

if(requestTimedOut){this._reconnect();}},get _UAID(){return prefs.getStringPref("userAgentID");},set _UAID(newID){if(typeof newID!=="string"){console.warn("Got invalid, non-string UAID",newID,"Not updating userAgentID");return;}
console.debug("New _UAID",newID);prefs.setStringPref("userAgentID",newID);},_ws:null,_pendingRequests:new Map(),_currentState:STATE_SHUT_DOWN,_requestTimeout:0,_requestTimeoutTimer:null,_requestTimeoutBase:0,_retryFailCount:0,_adaptiveEnabled:false,_skipReconnect:false,_dataEnabled:false,_socketWakeLock:{},_lastPingTime:0,_recalculatePing:true,_pingIntervalRetryTimes:{},_lastGoodPingInterval:0,_upperLimit:0,_pingTimer:null,_backoffTimer:null,_alarmEnabled:isGonk,_wsSendMessage(msg){if(!this._ws){console.warn("wsSendMessage: No WebSocket initialized.","Cannot send a message");return;}
msg=JSON.stringify(msg);console.debug("wsSendMessage: Sending message",msg);this._ws.sendMsg(msg);},init(options,mainPushService,serverURI){console.debug("init()");this._mainPushService=mainPushService;this._serverURI=serverURI; this._broadcastListeners=null;

if(options.makeWebSocket){this._makeWebSocket=options.makeWebSocket;}
this._networkInfo=options.networkInfo;if(!this._networkInfo){this._networkInfo=PushNetworkInfo;}
this._requestTimeoutBase=prefs.getIntPref("requestTimeout");if(this._requestTimeoutBase<kMinRequestTimeOut){this._requestTimeoutBase=kMinRequestTimeOut;console.warn("requestTimeout smaller than min, set it as default");}
this._requestTimeout=this._requestTimeoutBase;this._adaptiveEnabled=prefs.getBoolPref("adaptive.enabled",false);this._upperLimit=prefs.getIntPref("adaptive.upperLimit");if(prefs.getBoolPref("authorization.enabled",false)){this.credential=new PushCredential();}
return Promise.resolve();},_reconnect(){console.debug("reconnect()");this._shutdownWS(false);if(this._alarmEnabled){this._startBackoffAlarm();}else{this._startBackoffTimer();}},_shutdownWS(shouldCancelPending=true){console.debug("shutdownWS()");if(this._currentState==STATE_READY){prefs.removeObserver("userAgentID",this);}
this._currentState=STATE_SHUT_DOWN;this._skipReconnect=false;if(this._wsListener){this._wsListener._pushService=null;}
if(this._ws&&this._currentState>=STATE_WAITING_FOR_WS_START){try{this._ws.close(0,null);}catch(e){}}
this._ws=null;this._lastPingTime=0;if(this._pingTimer){this._pingTimer.cancel();}
if(shouldCancelPending){this._cancelPendingRequests();}
if(this._notifyRequestQueue){this._notifyRequestQueue();this._notifyRequestQueue=null;}
if(this._alarmEnabled){this._stopAlarm();}},uninit(){

this._shutdownWS();for(var index in this._socketWakeLock){this._releaseWakeLock(index);}
if(this._backoffTimer){this._backoffTimer.cancel();}
if(this._requestTimeoutTimer){this._requestTimeoutTimer.cancel();this._requestTimeout=this._requestTimeoutBase;}
this._mainPushService=null;this._dataEnabled=false;if(this.credential){this.credential=null;}},_startBackoffTimer(){console.debug("startBackoffTimer()");let retryTimeout=prefs.getIntPref("retryBaseInterval")*Math.pow(2,this._retryFailCount);retryTimeout=Math.min(retryTimeout,prefs.getIntPref("pingInterval"));this._retryFailCount++;console.debug("startBackoffTimer: Retry in",retryTimeout,"Try number",this._retryFailCount);if(!this._backoffTimer){this._backoffTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
this._backoffTimer.init(this,retryTimeout,Ci.nsITimer.TYPE_ONE_SHOT);},_startBackoffAlarm(){console.debug("startBackoffAlarm()"); this._calculateAdaptivePing(true );let retryTimeout=prefs.getIntPref("retryBaseInterval")*Math.pow(2,this._retryFailCount);retryTimeout=Math.min(retryTimeout,prefs.getIntPref("pingInterval"));this._retryFailCount++;console.debug("startBackoffAlarm: Retry in",retryTimeout,"Try number",this._retryFailCount);this._setAlarm(retryTimeout);},_hasPendingRequests(){return this._lastPingTime>0||this._pendingRequests.size>0;},_startRequestTimeoutTimer(){if(this._hasPendingRequests()){return;}
if(!this._requestTimeoutTimer){this._requestTimeoutTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
let extendTimeout=0;if(!this._ws){if(this.credential&&this.credential.isExpired){extendTimeout+=prefs.getIntPref("extendTimeout.token",0);}}
if(extendTimeout>0){this._requestTimeout=this._requestTimeoutBase+extendTimeout;}
this._requestTimeoutTimer.init(this,this._requestTimeout,Ci.nsITimer.TYPE_REPEATING_SLACK);},_startPingTimer(){if(!this._pingTimer){this._pingTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
this._pingTimer.init(this,prefs.getIntPref("pingInterval"),Ci.nsITimer.TYPE_ONE_SHOT);},_setAlarm(delay){
if(this._settingAlarm){
this._queuedAlarmDelay=delay;this._waitingForAlarmSet=true;return;}
this._stopAlarm();this._settingAlarm=true;AlarmService.add({date:new Date(Date.now()+delay),ignoreTimezone:true,},this._onAlarmFired.bind(this),function onSuccess(alarmID){this._alarmID=alarmID;console.debug("Set alarm "+delay+" in the future "+this._alarmID);this._settingAlarm=false;if(this._waitingForAlarmSet){this._waitingForAlarmSet=false;this._setAlarm(this._queuedAlarmDelay);}}.bind(this));},_stopAlarm(){if(this._alarmID!==null){console.debug("Stopped existing alarm "+this._alarmID);AlarmService.remove(this._alarmID);this._alarmID=null;}},_calculateAdaptivePing(wsWentDown){console.debug("_calculateAdaptivePing()");if(!this._adaptiveEnabled){console.debug("calculateAdaptivePing: Adaptive ping is disabled");return;}
if(this._retryFailCount>0){console.warn("calculateAdaptivePing: Push has failed to connect to the","Push Server",this._retryFailCount,"times. Do not calculate a new","pingInterval now");return;}
if(!this._recalculatePing&&!wsWentDown){console.debug("calculateAdaptivePing: We do not need to recalculate the","ping now, based on previous data");return;} 
let ns=this._networkInfo.getNetworkInformation();if(ns.ip){ console.debug("calculateAdaptivePing: mobile");let oldNetwork=prefs.getStringPref("adaptive.mobile","");let newNetwork="mobile-"+ns.mcc+"-"+ns.mnc; if(oldNetwork!==newNetwork){ console.debug("calculateAdaptivePing: Mobile networks differ. Old","network is",oldNetwork,"and new is",newNetwork);prefs.setStringPref("adaptive.mobile",newNetwork); this._recalculatePing=true;this._pingIntervalRetryTimes={}; let defaultPing=prefs.getIntPref("pingInterval.default");prefs.setIntPref("pingInterval",defaultPing);this._lastGoodPingInterval=defaultPing;}else{ prefs.setIntPref("pingInterval",prefs.getIntPref("pingInterval.mobile"));this._lastGoodPingInterval=prefs.getIntPref("adaptive.lastGoodPingInterval.mobile");}}else{ console.debug("calculateAdaptivePing: wifi");prefs.setIntPref("pingInterval",prefs.getIntPref("pingInterval.wifi"));this._lastGoodPingInterval=prefs.getIntPref("adaptive.lastGoodPingInterval.wifi");}
let nextPingInterval;let lastTriedPingInterval=prefs.getIntPref("pingInterval");if(wsWentDown){console.debug("calculateAdaptivePing: The WebSocket was disconnected.","Calculating next ping"); this._pingIntervalRetryTimes[lastTriedPingInterval]=(this._pingIntervalRetryTimes[lastTriedPingInterval]||0)+1;
if(this._pingIntervalRetryTimes[lastTriedPingInterval]<2){console.debug("calculateAdaptivePing: pingInterval=",lastTriedPingInterval,"tried only",this._pingIntervalRetryTimes[lastTriedPingInterval],"times");return;} 
nextPingInterval=Math.floor(lastTriedPingInterval/2);
if(nextPingInterval-this._lastGoodPingInterval<prefs.getIntPref("adaptive.gap")){console.debug("calculateAdaptivePing: We have reached the gap, we","have finished the calculation. nextPingInterval=",nextPingInterval,"lastGoodPing=",this._lastGoodPingInterval);nextPingInterval=this._lastGoodPingInterval;this._recalculatePing=false;}else{console.debug("calculateAdaptivePing: We need to calculate next time");this._recalculatePing=true;}}else{console.debug("calculateAdaptivePing: The WebSocket is still up");this._lastGoodPingInterval=lastTriedPingInterval;nextPingInterval=Math.floor(lastTriedPingInterval*1.5);} 
if(this._upperLimit<nextPingInterval){console.debug("calculateAdaptivePing: Next ping will be bigger than the","configured upper limit, capping interval");this._recalculatePing=false;this._lastGoodPingInterval=lastTriedPingInterval;nextPingInterval=lastTriedPingInterval;}
console.debug("calculateAdaptivePing: Setting the pingInterval to",nextPingInterval);prefs.setIntPref("pingInterval",nextPingInterval); if(ns.ip){prefs.setIntPref("pingInterval.mobile",nextPingInterval);prefs.setIntPref("adaptive.lastGoodPingInterval.mobile",this._lastGoodPingInterval);}else{prefs.setIntPref("pingInterval.wifi",nextPingInterval);prefs.setIntPref("adaptive.lastGoodPingInterval.wifi",this._lastGoodPingInterval);}},_makeWebSocket(uri){if(!prefs.getBoolPref("connection.enabled")){console.warn("makeWebSocket: connection.enabled is not set to true.","Aborting.");return null;}
if(Services.io.offline){console.warn("makeWebSocket: Network is offline.");return null;}
let contractId=uri.scheme=="ws"?"@mozilla.org/network/protocol;1?name=ws":"@mozilla.org/network/protocol;1?name=wss";let socket=Cc[contractId].createInstance(Ci.nsIWebSocketChannel);socket.initLoadInfo(null, Services.scriptSecurityManager.getSystemPrincipal(),null, Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,Ci.nsIContentPolicy.TYPE_WEBSOCKET); socket.loadInfo.allowDeprecatedSystemRequests=true;return socket;},_beginWSSetup(){console.debug("beginWSSetup()");if(this._currentState!=STATE_SHUT_DOWN){console.error("_beginWSSetup: Not in shutdown state! Current state",this._currentState);return Promise.resolve();}
if(this._backoffTimer){this._backoffTimer.cancel();}
let uri=this._serverURI;if(!uri){return Promise.resolve();}
let socket=this._makeWebSocket(uri);if(!socket){return Promise.resolve();}
this._ws=socket.QueryInterface(Ci.nsIWebSocketChannel);this._wsListener=new PushWebSocketListener(this);this._ws.protocol="push-notification";function tryOpenWS(){console.debug("beginWSSetup: Connecting to",uri.spec);try{
this._ws.asyncOpen(uri,uri.spec,0,this._wsListener,null);this._acquireWakeLock("WebSocketSetup",this._requestTimeout);this._currentState=STATE_WAITING_FOR_WS_START;}catch(e){console.error("beginWSSetup: Error opening websocket.","asyncOpen failed",e);this._reconnect();}
return Promise.resolve();}
if(this.credential){return this.credential.requireAccessToken().then(_=>{return tryOpenWS.bind(this)();},errorStatus=>{if(!this._hasPendingRequests()){if(errorStatus>0){return this._mainPushService.getAllUnexpired().then(records=>{if(records.length>0){this._reconnect();}else{this._shutdownWS();}
return Promise.resolve();});}
this._shutdownWS();return Promise.resolve();}
return Promise.resolve();});}
return tryOpenWS.bind(this)();},connect(broadcastListeners){console.debug("connect()",broadcastListeners);this._broadcastListeners=broadcastListeners;this._beginWSSetup();},isConnected(){return!!this._ws;},_acquireWakeLock(reason,duration){if(!AppConstants.MOZ_B2G){return;}
if(!this._socketWakeLock[reason]){this._socketWakeLock[reason]={wakeLock:null,timer:null,};console.debug("acquireWakeLock: Acquiring "+reason+" Wakelock and Creating Timer");this._socketWakeLock[reason].wakeLock=gPowerManagerService.newWakeLock("cpu");this._socketWakeLock[reason].timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}else{if(!this._socketWakeLock[reason].wakeLock){console.debug("acquireWakeLock: Acquiring "+reason+" Wakelock");this._socketWakeLock[reason].wakeLock=gPowerManagerService.newWakeLock("cpu");}
if(!this._socketWakeLock[reason].timer){console.debug("acquireWakeLock: Creating "+reason+" WakeLock Timer");this._socketWakeLock[reason].timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}}
let timeout=this._requestTimeoutBase;if(typeof duration==="number"&&duration>0){timeout=duration;}
console.debug("acquireWakeLock: Setting  "+reason+"  WakeLock Timer");this._socketWakeLock[reason].timer.initWithCallback(this._releaseWakeLock.bind(this,reason),


timeout+1000,Ci.nsITimer.TYPE_ONE_SHOT);},_releaseWakeLock(reason){if(!AppConstants.MOZ_B2G){return;}
if(!this._socketWakeLock[reason]){console.warn("Drop releasing "+reason+" wakeLock due to nonexistent!");return;}
console.debug("releaseWakeLock: Releasing "+reason+" WakeLock");if(this._socketWakeLock[reason].timer){this._socketWakeLock[reason].timer.cancel();}
if(this._socketWakeLock[reason].wakeLock){this._socketWakeLock[reason].wakeLock.unlock();this._socketWakeLock[reason].wakeLock=null;}},_handleHelloReply(reply){console.debug("handleHelloReply()");if(this._currentState!=STATE_WAITING_FOR_HELLO){console.error("handleHelloReply: Unexpected state",this._currentState,"(expected STATE_WAITING_FOR_HELLO)");this._shutdownWS();return;}
if(reply.status==401){console.error("handleHelloReply: Invalid Token");this._shutdownWS();if(this.credential){this._mainPushService.getAllUnexpired().then(records=>{if(records.length>0){this.credential.refreshAccessToken();this._reconnect();}});}
return;}
if(typeof reply.uaid!=="string"){console.error("handleHelloReply: Received invalid UAID",reply.uaid);this._shutdownWS();return;}
if(reply.uaid===""){console.error("handleHelloReply: Received empty UAID");this._shutdownWS();return;}
if(reply.uaid.length>128){console.error("handleHelloReply: UAID received from server was too long",reply.uaid);this._shutdownWS();return;}
this._retryFailCount=0;let sendRequests=()=>{if(this._notifyRequestQueue){this._notifyRequestQueue();this._notifyRequestQueue=null;}
this._sendPendingRequests();};function finishHandshake(){this._UAID=reply.uaid;this._currentState=STATE_READY;prefs.addObserver("userAgentID",this);if(!ObjectUtils.isEmpty(reply.broadcasts)){
const context={phase:pushBroadcastService.PHASES.HELLO};this._mainPushService.receivedBroadcastMessage(reply,context);}
this._dataEnabled=!!reply.use_webpush;if(this._dataEnabled){this._mainPushService.executeAllPendingUnregistering();this._mainPushService.getAllUnexpired().then(records=>Promise.all(records.map(record=>this._mainPushService.ensureCrypto(record).catch(error=>{console.error("finishHandshake: Error updating record",record.keyID,error);})))).then(sendRequests);}else{sendRequests();}}



if(this._UAID!=reply.uaid){console.debug("handleHelloReply: Received new UAID");this._mainPushService.dropUnexpiredRegistrations().then(finishHandshake.bind(this));return;} 
finishHandshake.bind(this)();},_handleRegisterReply(reply){console.debug("handleRegisterReply()");let tmp=this._takeRequestForReply(reply);if(!tmp){return;}
if(reply.status==200){try{Services.io.newURI(reply.pushEndpoint);}catch(e){tmp.reject(new Error("Invalid push endpoint: "+reply.pushEndpoint));return;}
let record=new PushRecordWebSocket({channelID:reply.channelID,pushEndpoint:reply.pushEndpoint,scope:tmp.record.scope,originAttributes:tmp.record.originAttributes,version:null,systemRecord:tmp.record.systemRecord,appServerKey:tmp.record.appServerKey,ctime:Date.now(),});tmp.resolve(record);}else{console.error("handleRegisterReply: Unexpected server response",reply);tmp.reject(new Error("Wrong status code for register reply: "+reply.status));}},_handleUnregisterReply(reply){console.debug("handleUnregisterReply()");let request=this._takeRequestForReply(reply);if(!request){return;}
let success=reply.status===200;request.resolve(success);if(success){if(typeof reply.channelID!=="string"){console.warn("handleUnregisterReply: Discarding delete db without channel ID");return;}
this._mainPushService.removePendingUnsubscribe(reply.channelID);}},_queueUpdateStart:Promise.resolve(),_queueUpdate:null,_enqueueUpdateCount:0,_enqueueUpdate(op){console.debug("enqueueUpdate()");if(!this._queueUpdate){this._queueUpdate=this._queueUpdateStart;this._enqueueUpdateCount=0;}
this._enqueueUpdateCount++;this._queueUpdate=this._queueUpdate.then(op).catch(_=>{}).then(_=>{this._enqueueUpdateCount--;if(this._enqueueUpdateCount==0){this._releaseWakeLock("DataUpdate");}});},_handleDataUpdate(update){this._acquireWakeLock("DataUpdate");let promise;if(typeof update.channelID!="string"){console.warn("handleDataUpdate: Discarding update without channel ID",update);return;}
function updateRecord(record){


if(record.hasRecentMessageID(update.version)){console.warn("handleDataUpdate: Ignoring duplicate message",update.version);return null;}
record.noteRecentMessageID(update.version);return record;}
if(typeof update.data!="string"){promise=this._mainPushService.receivedPushMessage(update.channelID,update.version,null,null,updateRecord);}else{let message=ChromeUtils.base64URLDecode(update.data,{padding:"ignore",});promise=this._mainPushService.receivedPushMessage(update.channelID,update.version,update.headers,message,updateRecord);}
promise.then(status=>{this._sendAck(update.channelID,update.version,status);},err=>{console.error("handleDataUpdate: Error delivering message",update,err);this._sendAck(update.channelID,update.version,Ci.nsIPushErrorReporter.ACK_DECRYPTION_ERROR);}).catch(err=>{console.error("handleDataUpdate: Error acknowledging message",update,err);});},_handleNotificationReply(reply){console.debug("handleNotificationReply()");if(this._dataEnabled){this._enqueueUpdate(_=>this._handleDataUpdate(reply));return;}
if(typeof reply.updates!=="object"){console.warn("handleNotificationReply: Missing updates",reply.updates);return;}
console.debug("handleNotificationReply: Got updates",reply.updates);for(let i=0;i<reply.updates.length;i++){let update=reply.updates[i];console.debug("handleNotificationReply: Handling update",update);if(typeof update.channelID!=="string"){console.debug("handleNotificationReply: Invalid update at index",i,update);continue;}
if(update.version===undefined){console.debug("handleNotificationReply: Missing version",update);continue;}
let version=update.version;if(typeof version==="string"){version=parseInt(version,10);}
if(typeof version==="number"&&version>=0){ this._receivedUpdate(update.channelID,version);}}},_handleBroadcastReply(reply){let phase=pushBroadcastService.PHASES.BROADCAST;for(const id of Object.keys(reply.broadcasts)){const wasRegistering=this._currentlyRegistering.delete(id);if(wasRegistering){phase=pushBroadcastService.PHASES.REGISTER;}}
const context={phase};this._mainPushService.receivedBroadcastMessage(reply,context);},reportDeliveryError(messageID,reason){console.debug("reportDeliveryError()");let code=kDELIVERY_REASON_TO_CODE[reason];if(!code){throw new Error("Invalid delivery error reason");}
let data={messageType:"nack",version:messageID,code};this._queueRequest(data);},_sendAck(channelID,version,status){console.debug("sendAck()");let code=kACK_STATUS_TO_CODE[status];if(!code){throw new Error("Invalid ack status");}
let data={messageType:"ack",updates:[{channelID,version,code}]};this._queueRequest(data);},_generateID(){let uuidGenerator=Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);return uuidGenerator.generateUUID().toString().slice(1,-1);},register(record){console.debug("register() ",record);let data={channelID:this._generateID(),messageType:"register"};if(record.appServerKey){data.key=ChromeUtils.base64URLEncode(record.appServerKey,{pad:true,});}
if(record.scope){data.scope=record.scope;}
return this._sendRequestForReply(record,data).then(record=>{if(!this._dataEnabled){return record;}
return PushCrypto.generateKeys().then(([publicKey,privateKey])=>{record.p256dhPublicKey=publicKey;record.p256dhPrivateKey=privateKey;record.authenticationSecret=PushCrypto.generateAuthenticationSecret();return record;});});},unregister(record,reason){console.debug("unregister() ",record,reason);return Promise.resolve().then(_=>{let code=kUNREGISTER_REASON_TO_CODE[reason];if(!code){throw new Error("Invalid unregister reason");}
let data={channelID:record.channelID,messageType:"unregister",code,};return this._sendRequestForReply(record,data);});},_queueStart:Promise.resolve(),_notifyRequestQueue:null,_queue:null,_enqueue(op){console.debug("enqueue()");if(!this._queue){this._queue=this._queueStart;}
this._queue=this._queue.then(op).catch(_=>{});},_send(data){if(this._currentState!=STATE_READY){console.warn("send: Unexpected state; ignoring message",this._currentState);return;}
if(!this._requestHasReply(data)){this._wsSendMessage(data);return;}
let key=this._makePendingRequestKey(data);if(!this._pendingRequests.has(key)){console.log("send: Request cancelled; ignoring message",key);return;}
this._wsSendMessage(data);},_requestHasReply(data){return data.messageType=="register"||data.messageType=="unregister";},_sendPendingRequests(){this._enqueue(_=>{for(let request of this._pendingRequests.values()){this._send(request.data);}});},_queueRequest(data){console.debug("queueRequest()",data);if(this._currentState==STATE_READY){this._send(data);return;}
if(!this._notifyRequestQueue){let promise=new Promise((resolve,reject)=>{this._notifyRequestQueue=resolve;});this._enqueue(_=>promise);}
let isRequest=this._requestHasReply(data);if(!isRequest){

this._enqueue(_=>this._send(data));}
if(!this._ws){this._beginWSSetup().then(_=>{
if(!this._ws&&this._notifyRequestQueue){this._notifyRequestQueue();this._notifyRequestQueue=null;}});}},_receivedUpdate(aChannelID,aLatestVersion){console.debug("receivedUpdate: Updating",aChannelID,"->",aLatestVersion);this._mainPushService.receivedPushMessage(aChannelID,"",null,null,record=>{if(record.version===null||record.version<aLatestVersion){console.debug("receivedUpdate: Version changed for",aChannelID,aLatestVersion);record.version=aLatestVersion;return record;}
console.debug("receivedUpdate: No significant version change for",aChannelID,aLatestVersion);return null;}).then(status=>{this._sendAck(aChannelID,aLatestVersion,status);}).catch(err=>{console.error("receivedUpdate: Error acknowledging message",aChannelID,aLatestVersion,err);});}, _wsOnStart(context){console.debug("wsOnStart()");this._releaseWakeLock("WebSocketSetup");if(this._currentState!=STATE_WAITING_FOR_WS_START){console.error("wsOnStart: NOT in STATE_WAITING_FOR_WS_START. Current","state",this._currentState,"Skipping");return;}
this._mainPushService.getAllUnexpired().then(records=>this._sendHello(records),err=>{console.warn("Error fetching existing records before handshake; assuming none",err);this._sendHello([]);}).catch(err=>{console.warn("Failed to send handshake; reconnecting",err);this._reconnect();});},_sendHello(records){let data={messageType:"hello",broadcasts:this._broadcastListeners,use_webpush:true,};if(this._UAID){data.uaid=this._UAID;}
if(this.credential&&this.credential.token){data.token=this.credential.token;}
this._wsSendMessage(data);this._currentState=STATE_WAITING_FOR_HELLO;},_wsOnStop(context,statusCode){console.debug("wsOnStop()");this._releaseWakeLock("WebSocketSetup");if(statusCode!=Cr.NS_OK&&!this._skipReconnect){console.debug("wsOnStop: Reconnecting after socket error",statusCode);this._reconnect();return;}
this._shutdownWS();},_wsOnMessageAvailable(context,message){console.debug("wsOnMessageAvailable()",message);this._lastPingTime=0;let reply;try{reply=JSON.parse(message);}catch(e){console.warn("wsOnMessageAvailable: Invalid JSON",message,e);return;}

if(this._currentState==STATE_READY){this._retryFailCount=0;this._pingIntervalRetryTimes={};}
let doNotHandle=false;if(message==="{}"||reply.messageType===undefined||reply.messageType==="ping"||typeof reply.messageType!="string"){console.debug("wsOnMessageAvailable: Pong received");this._calculateAdaptivePing(false);doNotHandle=true;}

if(this._alarmEnabled){this._setAlarm(prefs.getIntPref("pingInterval"));}else{this._startPingTimer();}
if(doNotHandle){return;}

let handlers=["Hello","Register","Unregister","Notification","Broadcast",];let handlerName=reply.messageType[0].toUpperCase()+
reply.messageType.slice(1).toLowerCase();if(!handlers.includes(handlerName)){console.warn("wsOnMessageAvailable: No whitelisted handler",handlerName,"for message",reply.messageType);return;}
let handler="_handle"+handlerName+"Reply";if(typeof this[handler]!=="function"){console.warn("wsOnMessageAvailable: Handler",handler,"whitelisted but not implemented");return;}
this[handler](reply);},_wsOnServerClose(context,aStatusCode,aReason){console.debug("wsOnServerClose()",aStatusCode,aReason);if(aStatusCode==kBACKOFF_WS_STATUS_CODE){console.debug("wsOnServerClose: Skipping automatic reconnect");this._skipReconnect=true;}},_cancelPendingRequests(){for(let request of this._pendingRequests.values()){request.reject(new Error("Request aborted"));}
this._pendingRequests.clear();},_makePendingRequestKey(data){return(data.messageType+"|"+data.channelID).toLowerCase();},_sendRequestForReply(record,data){return Promise.resolve().then(_=>{ this._startRequestTimeoutTimer();let key=this._makePendingRequestKey(data);if(!this._pendingRequests.has(key)){let request={data,record,ctime:Date.now(),};request.promise=new Promise((resolve,reject)=>{request.resolve=resolve;request.reject=reject;});this._pendingRequests.set(key,request);this._queueRequest(data);}
return this._pendingRequests.get(key).promise;});},_takeRequestForReply(reply){if(typeof reply.channelID!=="string"){return null;}
let key=this._makePendingRequestKey(reply);let request=this._pendingRequests.get(key);if(!request){return null;}
this._pendingRequests.delete(key);if(!this._hasPendingRequests()){this._requestTimeoutTimer.cancel();this._requestTimeout=this._requestTimeoutBase;}
return request;},sendSubscribeBroadcast(serviceId,version){this._currentlyRegistering.add(serviceId);let data={messageType:"broadcast_subscribe",broadcasts:{[serviceId]:version,},};this._queueRequest(data);},};var PushNetworkInfo={getNetworkInformation(){console.debug("PushNetworkInfo: getNetworkInformation()");try{let nm=Cc["@mozilla.org/network/manager;1"].getService(Ci.nsINetworkManager);if(nm.activeNetworkInfo&&nm.activeNetworkInfo.type==Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE){let iccService=Cc["@mozilla.org/icc/iccservice;1"].getService(Ci.nsIIccService);



let clientId=0;let icc=iccService.getIccByServiceId(clientId);let iccInfo=icc&&icc.iccInfo;if(iccInfo){console.debug("getNetworkInformation: Running on mobile data");let ips={};let prefixLengths={};nm.activeNetworkInfo.getAddresses(ips,prefixLengths);return{mcc:iccInfo.mcc,mnc:iccInfo.mnc,ip:ips.value[0],};}}}catch(e){console.error("getNetworkInformation: Error recovering mobile network","information",e);}
console.debug("getNetworkInformation: Running on wifi");return{mcc:0,mnc:0,ip:undefined,};},};function PushRecordWebSocket(record){PushRecord.call(this,record);this.channelID=record.channelID;this.version=record.version;}
PushRecordWebSocket.prototype=Object.create(PushRecord.prototype,{keyID:{get(){return this.channelID;},},});PushRecordWebSocket.prototype.toSubscription=function(){let subscription=PushRecord.prototype.toSubscription.call(this);subscription.version=this.version;return subscription;};