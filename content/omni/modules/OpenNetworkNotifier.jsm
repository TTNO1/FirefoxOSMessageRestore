//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["OpenNetworkNotifier"];var gDebug=false;this.OpenNetworkNotifier=(function(){var openNetworkNotifier={};const MIN_NUMBER_SCANS_BEFORE_SHOW_NOTIFICATION=3;const NOTIFICATION_REPEAT_DELAY_MS=900*1000;var settingsEnabled=false;var notificationRepeatTime=0;var numScansSinceNetworkStateChange=0;openNetworkNotifier.isEnabled=isEnabled;openNetworkNotifier.setOpenNetworkNotifyEnabled=setOpenNetworkNotifyEnabled;openNetworkNotifier.handleOpenNetworkFound=handleOpenNetworkFound;openNetworkNotifier.clearPendingNotification=clearPendingNotification;openNetworkNotifier.setDebug=setDebug;function setDebug(aDebug){gDebug=aDebug;}
function debug(aMsg){if(gDebug){dump("-*- OpenNetworkNotifier: "+aMsg);}}
function isEnabled(){return settingsEnabled;}
function setOpenNetworkNotifyEnabled(enable){debug("setOpenNetworkNotifyEnabled: "+enable);settingsEnabled=enable;clearPendingNotification();}
function handleOpenNetworkFound(){if(!settingsEnabled){return;}
if(++numScansSinceNetworkStateChange<=MIN_NUMBER_SCANS_BEFORE_SHOW_NOTIFICATION){setNotificationVisible(false);return;}
setNotificationVisible(true);}
function setNotificationVisible(visible){debug("setNotificationVisible: visible = "+visible);if(visible){let now=Date.now();debug("now = "+now+" , notificationRepeatTime = "+notificationRepeatTime); if(now<notificationRepeatTime){return;}
notificationRepeatTime=now+NOTIFICATION_REPEAT_DELAY_MS;notify("opennetworknotification",{enabled:true});}else{notify("opennetworknotification",{enabled:false});}}
function clearPendingNotification(){notificationRepeatTime=0;numScansSinceNetworkStateChange=0;setNotificationVisible(false);}
function notify(eventName,eventObject){var handler=openNetworkNotifier["on"+eventName];if(!handler){return;}
if(!eventObject){eventObject={};}
handler.call(eventObject);}
return openNetworkNotifier;})();