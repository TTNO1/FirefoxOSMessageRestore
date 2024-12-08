//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");function MainProcessSingleton(){}
MainProcessSingleton.prototype={classID:Components.ID("{0636a680-45cb-11e4-916c-0800200c9a66}"),QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]),observe(subject,topic,data){switch(topic){case"app-startup":{Services.obs.addObserver(this,"ipc:first-content-process-created");ChromeUtils.import("resource://gre/modules/CustomElementsListener.jsm",null);Services.ppmm.loadProcessScript("chrome://global/content/process-content.js",true);break;}
case"ipc:first-content-process-created":{

ChromeUtils.import("resource://gre/modules/L10nRegistry.jsm");break;}}},};var EXPORTED_SYMBOLS=["MainProcessSingleton"];