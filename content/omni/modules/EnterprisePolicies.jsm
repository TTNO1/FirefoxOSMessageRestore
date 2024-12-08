//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["EnterprisePolicies"];function EnterprisePolicies(){ const appinfo=Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);if(appinfo.processType==appinfo.PROCESS_TYPE_DEFAULT){const{EnterprisePoliciesManager}=ChromeUtils.import("resource://gre/modules/EnterprisePoliciesParent.jsm");return new EnterprisePoliciesManager();}
const{EnterprisePoliciesManagerContent}=ChromeUtils.import("resource://gre/modules/EnterprisePoliciesContent.jsm");return new EnterprisePoliciesManagerContent();}