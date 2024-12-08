//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";function SlowScriptDebug(){}
SlowScriptDebug.prototype={classDescription:"Slow script debug handler",QueryInterface:ChromeUtils.generateQI(["nsISlowScriptDebug"]),get activationHandler(){return this._activationHandler;},set activationHandler(cb){return(this._activationHandler=cb);},get remoteActivationHandler(){return this._remoteActivationHandler;},set remoteActivationHandler(cb){return(this._remoteActivationHandler=cb);},};var EXPORTED_SYMBOLS=["SlowScriptDebug"];