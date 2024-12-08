//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["ctypes"];const init=Cc["@mozilla.org/jsctypes;1"].createInstance();init();