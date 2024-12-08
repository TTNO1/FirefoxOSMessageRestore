//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{AlarmService}=ChromeUtils.import("resource://gre/modules/AlarmService.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");this.EXPORTED_SYMBOLS=["AppsUtils"];function debug(msg){dump(`AppsUtils.js: ${msg}\n`);}
this.AppsUtils={clearBrowserData(url){debug("clearBrowserData: "+url);let uri=Services.io.newURI(url);const kFlags=Ci.nsIClearDataService.CLEAR_COOKIES|Ci.nsIClearDataService.CLEAR_DOM_STORAGES|Ci.nsIClearDataService.CLEAR_SECURITY_SETTINGS|Ci.nsIClearDataService.CLEAR_PLUGIN_DATA|Ci.nsIClearDataService.CLEAR_EME|Ci.nsIClearDataService.CLEAR_ALL_CACHES;Services.clearData.deleteDataFromHost(uri.host,true,kFlags,result=>{debug("result: "+result);});},clearStorage(url){debug("clearStorage: "+url);let uri=Services.io.newURI(url); let principal=Services.scriptSecurityManager.createContentPrincipal(uri,{});Services.qms.clearStoragesForPrincipal(principal);AlarmService.removeByHost(principal.origin);},};