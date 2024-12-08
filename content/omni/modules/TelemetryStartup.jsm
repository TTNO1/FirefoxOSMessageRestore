//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";ChromeUtils.defineModuleGetter(this,"TelemetryController","resource://gre/modules/TelemetryController.jsm");ChromeUtils.defineModuleGetter(this,"TelemetryEnvironment","resource://gre/modules/TelemetryEnvironment.jsm");function TelemetryStartup(){}
TelemetryStartup.prototype.QueryInterface=ChromeUtils.generateQI(["nsIObserver",]);TelemetryStartup.prototype.observe=function(aSubject,aTopic,aData){if(aTopic=="profile-after-change"){TelemetryController.observe(null,aTopic,null);}
if(aTopic=="profile-after-change"){annotateEnvironment();TelemetryEnvironment.registerChangeListener("CrashAnnotator",annotateEnvironment);TelemetryEnvironment.onInitialized().then(()=>annotateEnvironment());}};function annotateEnvironment(){try{let cr=Cc["@mozilla.org/toolkit/crash-reporter;1"];if(cr){let env=JSON.stringify(TelemetryEnvironment.currentEnvironment);cr.getService(Ci.nsICrashReporter).annotateCrashReport("TelemetryEnvironment",env);}}catch(e){}}
var EXPORTED_SYMBOLS=["TelemetryStartup"];