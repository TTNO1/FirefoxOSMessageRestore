//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";function WellKnownOpportunisticUtils(){this.valid=false;this.mixed=false;this.lifetime=0;}
WellKnownOpportunisticUtils.prototype={QueryInterface:ChromeUtils.generateQI(["nsIWellKnownOpportunisticUtils"]),verify(aJSON,aOrigin){try{let arr=JSON.parse(aJSON.toLowerCase());if(!arr.includes(aOrigin.toLowerCase())){throw new Error("invalid origin");}}catch(e){return;}
this.valid=true;},};var EXPORTED_SYMBOLS=["WellKnownOpportunisticUtils"];