//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["AboutCertViewerChild"];const{RemotePageChild}=ChromeUtils.import("resource://gre/actors/RemotePageChild.jsm");class AboutCertViewerChild extends RemotePageChild{}