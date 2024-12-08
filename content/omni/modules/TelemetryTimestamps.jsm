//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["TelemetryTimestamps"];var timeStamps={};var TelemetryTimestamps={add:function TT_add(name,value){ if(value==null){value=Date.now();}
if(isNaN(value)){throw new Error("Value must be a timestamp");}
if(timeStamps.hasOwnProperty(name)){return;}
timeStamps[name]=value;},get:function TT_get(){return Cu.cloneInto(timeStamps,{});},};