//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var MarionetteController;const{MarionetteRunner}=ChromeUtils.import("resource://gre/modules/MarionetteRunner.jsm");MarionetteController={enableRunner(){MarionetteRunner.run();}}
this.EXPORTED_SYMBOLS=["MarionetteController"];