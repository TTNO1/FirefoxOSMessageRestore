//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["BinderServices"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");var BinderServices={};XPCOMUtils.defineLazyGetter(BinderServices,"connectivity",function(){try{return Cc["@mozilla.org/b2g/connectivitybinderservice;1"].getService(Ci.nsIConnectivityBinderService);}catch(e){}
return{onCaptivePortalChanged(wifiState,usbState){},onTetheringChanged(captivePortalLanding){},};});XPCOMUtils.defineLazyGetter(BinderServices,"wifi",function(){try{return Cc["@mozilla.org/b2g/wifibinderservice;1"].getService(Ci.nsIWifiBinderService);}catch(e){}
return{onWifiStateChanged(state){},};});XPCOMUtils.defineLazyGetter(BinderServices,"datacall",function(){try{return Cc["@mozilla.org/b2g/databinderservice;1"].getService(Ci.nsIDataBinderService);}catch(e){}
return{onDefaultSlotIdChanged(id){},onApnReady(id,types){},};});XPCOMUtils.defineLazyServiceGetters(BinderServices,{});