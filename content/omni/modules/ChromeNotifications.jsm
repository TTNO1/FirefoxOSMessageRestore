//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["ChromeNotifications"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyServiceGetter(this,"appNotifier","@mozilla.org/system-alerts-service;1","nsIAppNotificationService");const DEBUG=false;function debug(s){dump("-*- ChromeNotifications.jsm: "+s+"\n");}
var ChromeNotifications={init(){Services.obs.addObserver(this,"xpcom-shutdown");Services.cpmm.addMessageListener("Notification:GetAllCrossOrigin:Return:OK",this);},performResend(notifications){let resentNotifications=0;notifications.forEach(function(notification){let behavior;try{behavior=JSON.parse(notification.mozbehavior);behavior.resend=true;}catch(e){behavior={resend:true,};}
if(behavior.showOnlyOnce===true){return;}
appNotifier.showAppNotification(notification.icon,notification.image||"",notification.title,notification.body,null,{id:notification.alertName,origin:notification.origin,dir:notification.dir,lang:notification.lang,tag:notification.tag,dbId:notification.id,timestamp:notification.timestamp,data:notification.data,requireInteraction:notification.requireInteraction||false,actions:notification.actions||"[]",silent:notification.silent||false,mozbehavior:behavior,serviceWorkerRegistrationScope:notification.serviceWorkerRegistrationScope,});resentNotifications++;});try{this.resendCallback&&this.resendCallback(resentNotifications);}catch(ex){if(DEBUG){debug("Content sent exception: "+ex);}}},resendAllNotifications(resendCallback){this.resendCallback=resendCallback;Services.cpmm.sendAsyncMessage("Notification:GetAllCrossOrigin",{});},receiveMessage(message){switch(message.name){case"Notification:GetAllCrossOrigin:Return:OK":this.performResend(message.data.notifications);break;default:if(DEBUG){debug("Unrecognized message: "+message.name);}
break;}},observe(aSubject,aTopic,aData){if(DEBUG){debug("Topic: "+aTopic);}
if(aTopic=="xpcom-shutdown"){Services.obs.removeObserver(this,"xpcom-shutdown");Services.cpmm.removeMessageListener("Notification:GetAllCrossOrigin:Return:OK",this);}},};ChromeNotifications.init();