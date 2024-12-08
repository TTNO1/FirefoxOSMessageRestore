//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["UITelemetry"];ChromeUtils.import("resource://gre/modules/Services.jsm",this);ChromeUtils.import("resource://gre/modules/TelemetryUtils.jsm",this);var UITelemetry={_enabled:undefined,_activeSessions:{},_measurements:[],get enabled(){if(this._enabled!==undefined){return this._enabled;}
Services.prefs.addObserver(TelemetryUtils.Preferences.TelemetryEnabled,this);Services.obs.addObserver(this,"profile-before-change");this._enabled=Services.prefs.getBoolPref(TelemetryUtils.Preferences.TelemetryEnabled,false);return this._enabled;},observe(aSubject,aTopic,aData){if(aTopic=="profile-before-change"){Services.obs.removeObserver(this,"profile-before-change");Services.prefs.removeObserver(TelemetryUtils.Preferences.TelemetryEnabled,this);this._enabled=undefined;return;}
if(aTopic=="nsPref:changed"){switch(aData){case TelemetryUtils.Preferences.TelemetryEnabled:let on=Services.prefs.getBoolPref(TelemetryUtils.Preferences.TelemetryEnabled);this._enabled=on;if(!on){this._activeSessions={};this._measurements=[];}
break;}}},get wrappedJSObject(){return this;},uptimeMillis(){return Date.now()-Services.startup.getStartupInfo().process;},addEvent(aAction,aMethod,aTimestamp,aExtras){if(!this.enabled){return;}
let sessions=Object.keys(this._activeSessions);let aEvent={type:"event",action:aAction,method:aMethod,sessions,timestamp:aTimestamp==undefined?this.uptimeMillis():aTimestamp,};if(aExtras){aEvent.extras=aExtras;}
this._recordEvent(aEvent);},startSession(aName,aTimestamp){if(!this.enabled){return;}
if(this._activeSessions[aName]){return;}
this._activeSessions[aName]=aTimestamp==undefined?this.uptimeMillis():aTimestamp;},stopSession(aName,aReason,aTimestamp){if(!this.enabled){return;}
let sessionStart=this._activeSessions[aName];delete this._activeSessions[aName];if(!sessionStart){return;}
let aEvent={type:"session",name:aName,reason:aReason,start:sessionStart,end:aTimestamp==undefined?this.uptimeMillis():aTimestamp,};this._recordEvent(aEvent);},_recordEvent(aEvent){this._measurements.push(aEvent);},getUIMeasurements(aClear){if(!this.enabled){return[];}
let measurements=this._measurements.slice();if(aClear){this._measurements=[];}
return measurements;},};