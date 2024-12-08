//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["EnsureFxAccountsWebChannel"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{COMMAND_PROFILE_CHANGE,COMMAND_LOGIN,COMMAND_LOGOUT,COMMAND_DELETE,COMMAND_CAN_LINK_ACCOUNT,COMMAND_SYNC_PREFERENCES,COMMAND_CHANGE_PASSWORD,COMMAND_FXA_STATUS,COMMAND_PAIR_HEARTBEAT,COMMAND_PAIR_SUPP_METADATA,COMMAND_PAIR_AUTHORIZE,COMMAND_PAIR_DECLINE,COMMAND_PAIR_COMPLETE,COMMAND_PAIR_PREFERENCES,FX_OAUTH_CLIENT_ID,ON_PROFILE_CHANGE_NOTIFICATION,PREF_LAST_FXA_USER,SCOPE_OLD_SYNC,WEBCHANNEL_ID,log,logPII,}=ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"WebChannel","resource://gre/modules/WebChannel.jsm");ChromeUtils.defineModuleGetter(this,"fxAccounts","resource://gre/modules/FxAccounts.jsm");ChromeUtils.defineModuleGetter(this,"FxAccountsStorageManagerCanStoreField","resource://gre/modules/FxAccountsStorage.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");ChromeUtils.defineModuleGetter(this,"Weave","resource://services-sync/main.js");ChromeUtils.defineModuleGetter(this,"CryptoUtils","resource://services-crypto/utils.js");ChromeUtils.defineModuleGetter(this,"FxAccountsPairingFlow","resource://gre/modules/FxAccountsPairing.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"pairingEnabled","identity.fxaccounts.pairing.enabled");XPCOMUtils.defineLazyPreferenceGetter(this,"separatePrivilegedMozillaWebContentProcess","browser.tabs.remote.separatePrivilegedMozillaWebContentProcess",false);XPCOMUtils.defineLazyPreferenceGetter(this,"separatedMozillaDomains","browser.tabs.remote.separatedMozillaDomains",false,false,val=>val.split(","));XPCOMUtils.defineLazyPreferenceGetter(this,"accountServer","identity.fxaccounts.remote.root",false,false,val=>Services.io.newURI(val));

const EXTRA_ENGINES=["addresses","creditcards"];function getErrorDetails(error){ let cleanMessage=String(error).replace(/\\.*\\/gm,"[REDACTED]").replace(/\/.*\//gm,"[REDACTED]");let details={message:cleanMessage,stack:null};if(error.stack){let frames=[];for(let frame=error.stack;frame;frame=frame.caller){frames.push(String(frame).padStart(4));}
details.stack=frames.join("\n");}
return details;}
this.FxAccountsWebChannel=function(options){if(!options){throw new Error("Missing configuration options");}
if(!options.content_uri){throw new Error("Missing 'content_uri' option");}
this._contentUri=options.content_uri;if(!options.channel_id){throw new Error("Missing 'channel_id' option");}
this._webChannelId=options.channel_id;XPCOMUtils.defineLazyGetter(this,"_helpers",()=>{return options.helpers||new FxAccountsWebChannelHelpers(options);});this._setupChannel();};FxAccountsWebChannel.prototype={_channel:null,_helpers:null,_webChannelId:null,_webChannelOrigin:null,tearDown(){this._channel.stopListening();this._channel=null;this._channelCallback=null;},_setupChannel(){try{this._webChannelOrigin=Services.io.newURI(this._contentUri);this._registerChannel();}catch(e){log.error(e);throw e;}},_receiveMessage(message,sendingContext){const{command,data}=message;let shouldCheckRemoteType=separatePrivilegedMozillaWebContentProcess&&separatedMozillaDomains.some(function(val){return(accountServer.asciiHost==val||accountServer.asciiHost.endsWith("."+val));});let{currentRemoteType}=sendingContext.browsingContext;if(shouldCheckRemoteType&&currentRemoteType!="privilegedmozilla"){log.error(`Rejected FxA webchannel message from remoteType = ${currentRemoteType}`);return;}
let browser=sendingContext.browsingContext.top.embedderElement;switch(command){case COMMAND_PROFILE_CHANGE:Services.obs.notifyObservers(null,ON_PROFILE_CHANGE_NOTIFICATION,data.uid);break;case COMMAND_LOGIN:this._helpers.login(data).catch(error=>this._sendError(error,message,sendingContext));break;case COMMAND_LOGOUT:case COMMAND_DELETE:this._helpers.logout(data.uid).catch(error=>this._sendError(error,message,sendingContext));break;case COMMAND_CAN_LINK_ACCOUNT:let canLinkAccount=this._helpers.shouldAllowRelink(data.email);let response={command,messageId:message.messageId,data:{ok:canLinkAccount},};log.debug("FxAccountsWebChannel response",response);this._channel.send(response,sendingContext);break;case COMMAND_SYNC_PREFERENCES:this._helpers.openSyncPreferences(browser,data.entryPoint);break;case COMMAND_PAIR_PREFERENCES:if(pairingEnabled){browser.loadURI("about:preferences?action=pair#sync",{triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),});}
break;case COMMAND_CHANGE_PASSWORD:this._helpers.changePassword(data).catch(error=>this._sendError(error,message,sendingContext));break;case COMMAND_FXA_STATUS:log.debug("fxa_status received");const service=data&&data.service;const isPairing=data&&data.isPairing;const context=data&&data.context;this._helpers.getFxaStatus(service,sendingContext,isPairing,context).then(fxaStatus=>{let response={command,messageId:message.messageId,data:fxaStatus,};this._channel.send(response,sendingContext);}).catch(error=>this._sendError(error,message,sendingContext));break;case COMMAND_PAIR_HEARTBEAT:case COMMAND_PAIR_SUPP_METADATA:case COMMAND_PAIR_AUTHORIZE:case COMMAND_PAIR_DECLINE:case COMMAND_PAIR_COMPLETE:log.debug(`Pairing command ${command} received`);const{channel_id:channelId}=data;delete data.channel_id;const flow=FxAccountsPairingFlow.get(channelId);if(!flow){log.warn(`Could not find a pairing flow for ${channelId}`);return;}
flow.onWebChannelMessage(command,data).then(replyData=>{this._channel.send({command,messageId:message.messageId,data:replyData,},sendingContext);});break;default:log.warn("Unrecognized FxAccountsWebChannel command",command);FxAccountsPairingFlow.finalizeAll();break;}},_sendError(error,incomingMessage,sendingContext){log.error("Failed to handle FxAccountsWebChannel message",error);this._channel.send({command:incomingMessage.command,messageId:incomingMessage.messageId,data:{error:getErrorDetails(error),},},sendingContext);},_registerChannel(){let listener=(webChannelId,message,sendingContext)=>{if(message){log.debug("FxAccountsWebChannel message received",message.command);if(logPII){log.debug("FxAccountsWebChannel message details",message);}
try{this._receiveMessage(message,sendingContext);}catch(error){this._sendError(error,message,sendingContext);}}};this._channelCallback=listener;this._channel=new WebChannel(this._webChannelId,this._webChannelOrigin);this._channel.listen(listener);log.debug("FxAccountsWebChannel registered: "+
this._webChannelId+" with origin "+
this._webChannelOrigin.prePath);},};this.FxAccountsWebChannelHelpers=function(options){options=options||{};this._fxAccounts=options.fxAccounts||fxAccounts;this._weaveXPCOM=options.weaveXPCOM||null;this._privateBrowsingUtils=options.privateBrowsingUtils||PrivateBrowsingUtils;};FxAccountsWebChannelHelpers.prototype={

shouldAllowRelink(acctName){return(!this._needRelinkWarning(acctName)||this._promptForRelink(acctName));},async login(accountData){
log.debug("Webchannel is logging a user in.");delete accountData.customizeSync;const requestedServices=accountData.services;delete accountData.services;delete accountData.verifiedCanLinkAccount;this.setPreviousAccountNameHashPref(accountData.email);await this._fxAccounts.telemetry.recordConnection(Object.keys(requestedServices||{}),"webchannel");

let xps=this._weaveXPCOM||Cc["@mozilla.org/weave/service;1"].getService(Ci.nsISupports).wrappedJSObject;await xps.whenLoaded();await this._fxAccounts._internal.setSignedInUser(accountData);if(requestedServices){if(requestedServices.sync){const{offeredEngines,declinedEngines}=requestedServices.sync;if(offeredEngines&&declinedEngines){EXTRA_ENGINES.forEach(engine=>{if(offeredEngines.includes(engine)&&!declinedEngines.includes(engine)){Services.prefs.setBoolPref(`services.sync.engine.${engine}`,true);}});log.debug("Received declined engines",declinedEngines);Weave.Service.engineManager.setDeclined(declinedEngines);declinedEngines.forEach(engine=>{Services.prefs.setBoolPref(`services.sync.engine.${engine}`,false);});}
log.debug("Webchannel is enabling sync");await xps.Weave.Service.configure();}}},async logout(uid){let fxa=this._fxAccounts;let userData=await fxa._internal.getUserAccountData(["uid"]);if(userData&&userData.uid===uid){await fxa.telemetry.recordDisconnection(null,"webchannel");
 await fxa.signOut(true);}},isPrivateBrowsingMode(sendingContext){if(!sendingContext){log.error("Unable to check for private browsing mode, assuming true");return true;}
let browser=sendingContext.browsingContext.top.embedderElement;const isPrivateBrowsing=this._privateBrowsingUtils.isBrowserPrivate(browser);log.debug("is private browsing",isPrivateBrowsing);return isPrivateBrowsing;},shouldAllowFxaStatus(service,sendingContext,isPairing,context){






 log.debug("service",service);return(!this.isPrivateBrowsingMode(sendingContext)||service==="sync"||context==="fx_desktop_v3"||isPairing);},async getFxaStatus(service,sendingContext,isPairing,context){let signedInUser=null;if(this.shouldAllowFxaStatus(service,sendingContext,isPairing,context)){const userData=await this._fxAccounts._internal.getUserAccountData(["email","sessionToken","uid","verified",]);if(userData){signedInUser={email:userData.email,sessionToken:userData.sessionToken,uid:userData.uid,verified:userData.verified,};}}
return{signedInUser,clientId:FX_OAUTH_CLIENT_ID,capabilities:{multiService:true,pairing:pairingEnabled,engines:this._getAvailableExtraEngines(),},};},_getAvailableExtraEngines(){return EXTRA_ENGINES.filter(engineName=>{try{return Services.prefs.getBoolPref(`services.sync.engine.${engineName}.available`);}catch(e){return false;}});},async changePassword(credentials){


let newCredentials={device:null,};for(let name of Object.keys(credentials)){if(name=="email"||name=="uid"||FxAccountsStorageManagerCanStoreField(name)){newCredentials[name]=credentials[name];}else{log.info("changePassword ignoring unsupported field",name);}}
await this._fxAccounts._internal.updateUserAccountData(newCredentials);

try{await this._fxAccounts.keys.getKeyForScope(SCOPE_OLD_SYNC);}catch(e){log.error("getKeyForScope errored",e);}
await this._fxAccounts._internal.updateDeviceRegistration();},getPreviousAccountNameHashPref(){try{return Services.prefs.getStringPref(PREF_LAST_FXA_USER);}catch(_){return"";}},setPreviousAccountNameHashPref(acctName){Services.prefs.setStringPref(PREF_LAST_FXA_USER,CryptoUtils.sha256Base64(acctName));},openSyncPreferences(browser,entryPoint){let uri="about:preferences";if(entryPoint){uri+="?entrypoint="+encodeURIComponent(entryPoint);}
uri+="#sync";browser.loadURI(uri,{triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),});},_needRelinkWarning(acctName){let prevAcctHash=this.getPreviousAccountNameHashPref();return prevAcctHash&&prevAcctHash!=CryptoUtils.sha256Base64(acctName);},_promptForRelink(acctName){let sb=Services.strings.createBundle("chrome://browser/locale/syncSetup.properties");let continueLabel=sb.GetStringFromName("continue.label");let title=sb.GetStringFromName("relinkVerify.title");let description=sb.formatStringFromName("relinkVerify.description",[acctName,]);let body=sb.GetStringFromName("relinkVerify.heading")+"\n\n"+description;let ps=Services.prompt;let buttonFlags=ps.BUTTON_POS_0*ps.BUTTON_TITLE_IS_STRING+
ps.BUTTON_POS_1*ps.BUTTON_TITLE_CANCEL+
ps.BUTTON_POS_1_DEFAULT;let pressed=Services.prompt.confirmEx(null,title,body,buttonFlags,continueLabel,null,null,null,{});return pressed===0;},};var singleton;



var EnsureFxAccountsWebChannel=()=>{let contentUri=Services.urlFormatter.formatURLPref("identity.fxaccounts.remote.root");if(singleton&&singleton._contentUri!==contentUri){singleton.tearDown();singleton=null;}
if(!singleton){try{if(contentUri){
singleton=new FxAccountsWebChannel({content_uri:contentUri,channel_id:WEBCHANNEL_ID,});}else{log.warn("FxA WebChannel functionaly is disabled due to no URI pref.");}}catch(ex){log.error("Failed to create FxA WebChannel",ex);}}};