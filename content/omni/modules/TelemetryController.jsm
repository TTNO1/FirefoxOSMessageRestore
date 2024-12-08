//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["TelemetryController"];

const isParentProcess= Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).processType===Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT;var TelemetryController;if(isParentProcess){({TelemetryController}=ChromeUtils.import("resource://gre/modules/TelemetryControllerParent.jsm"));}else{({TelemetryController}=ChromeUtils.import("resource://gre/modules/TelemetryControllerContent.jsm"));}