//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ExtensionTelemetry","getTrimmedString"];ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const histograms={extensionStartup:"WEBEXT_EXTENSION_STARTUP_MS",backgroundPageLoad:"WEBEXT_BACKGROUND_PAGE_LOAD_MS",browserActionPopupOpen:"WEBEXT_BROWSERACTION_POPUP_OPEN_MS",browserActionPreloadResult:"WEBEXT_BROWSERACTION_POPUP_PRELOAD_RESULT_COUNT",contentScriptInjection:"WEBEXT_CONTENT_SCRIPT_INJECTION_MS",pageActionPopupOpen:"WEBEXT_PAGEACTION_POPUP_OPEN_MS",storageLocalGetJSON:"WEBEXT_STORAGE_LOCAL_GET_MS",storageLocalSetJSON:"WEBEXT_STORAGE_LOCAL_SET_MS",storageLocalGetIDB:"WEBEXT_STORAGE_LOCAL_IDB_GET_MS",storageLocalSetIDB:"WEBEXT_STORAGE_LOCAL_IDB_SET_MS",userScriptInjection:"WEBEXT_USER_SCRIPT_INJECTION_MS",};function getTrimmedString(str){if(str.length<=80){return str;}
const length=str.length;
return`${str.slice(0, 40)}...${str.slice(length - 37, length)}`;}
class ExtensionTelemetryMetric{constructor(metric){this.metric=metric;}
stopwatchStart(extension,obj=extension){this._wrappedStopwatchMethod("start",this.metric,extension,obj);}
stopwatchFinish(extension,obj=extension){this._wrappedStopwatchMethod("finish",this.metric,extension,obj);}
stopwatchCancel(extension,obj=extension){this._wrappedStopwatchMethod("cancel",this.metric,extension,obj);}
histogramAdd(opts){this._histogramAdd(this.metric,opts);}
_wrappedStopwatchMethod(method,metric,extension,obj=extension){if(!extension){throw new Error(`Mandatory extension parameter is undefined`);}
const baseId=histograms[metric];if(!baseId){throw new Error(`Unknown metric ${metric}`);}
TelemetryStopwatch[method](baseId,obj);let extensionId=getTrimmedString(extension.id);TelemetryStopwatch[`${method}Keyed`](`${baseId}_BY_ADDONID`,extensionId,obj);}
_histogramAdd(metric,{category,extension,value}){if(!extension){throw new Error(`Mandatory extension parameter is undefined`);}
const baseId=histograms[metric];if(!baseId){throw new Error(`Unknown metric ${metric}`);}
const histogram=Services.telemetry.getHistogramById(baseId);if(typeof category==="string"){histogram.add(category,value);}else{histogram.add(value);}
const keyedHistogram=Services.telemetry.getKeyedHistogramById(`${baseId}_BY_ADDONID`);const extensionId=getTrimmedString(extension.id);if(typeof category==="string"){keyedHistogram.add(extensionId,category,value);}else{keyedHistogram.add(extensionId,value);}}}

const metricsCache=new Map();var ExtensionTelemetry=new Proxy(metricsCache,{get(target,prop,receiver){if(!(prop in histograms)){throw new Error(`Unknown metric ${prop}`);}
if(!target.has(prop)){target.set(prop,new ExtensionTelemetryMetric(prop));}
return target.get(prop);},});