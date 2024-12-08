//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["LightweightThemeManager"];
var _fallbackThemeData=null;var LightweightThemeManager={set fallbackThemeData(data){if(data&&Object.getOwnPropertyNames(data).length){_fallbackThemeData=Object.assign({},data);}else{_fallbackThemeData=null;}},get currentThemeWithFallback(){return _fallbackThemeData&&_fallbackThemeData.theme;},get themeData(){return _fallbackThemeData||{theme:null};},};