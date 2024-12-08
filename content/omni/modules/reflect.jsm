//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["Reflect"];const init=Cc["@mozilla.org/jsreflect;1"].createInstance();init();this.Reflect=Reflect;