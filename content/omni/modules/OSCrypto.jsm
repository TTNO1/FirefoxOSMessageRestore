//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const EXPORTED_SYMBOLS=["OSCrypto"];this.OSCrypto={};if(AppConstants.platform=="win"){Services.scriptloader.loadSubScript("resource://gre/modules/OSCrypto_win.js",this);}else{throw new Error("OSCrypto.jsm isn't supported on this platform");}