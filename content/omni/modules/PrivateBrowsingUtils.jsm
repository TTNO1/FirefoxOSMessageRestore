//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["PrivateBrowsingUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const kAutoStartPref="browser.privatebrowsing.autostart";
var gTemporaryAutoStartMode=false;var PrivateBrowsingUtils={get enabled(){return Services.policies.isAllowed("privatebrowsing");},
isWindowPrivate:function pbu_isWindowPrivate(aWindow){if(!aWindow.isChromeWindow){dump("WARNING: content window passed to PrivateBrowsingUtils.isWindowPrivate. "+"Use isContentWindowPrivate instead (but only for frame scripts).\n"+
new Error().stack);}
return this.privacyContextFromWindow(aWindow).usePrivateBrowsing;},isContentWindowPrivate:function pbu_isWindowPrivate(aWindow){return this.privacyContextFromWindow(aWindow).usePrivateBrowsing;},isBrowserPrivate(aBrowser){let chromeWin=aBrowser.ownerGlobal;if(chromeWin.gMultiProcessBrowser||!aBrowser.contentWindow){



return this.isWindowPrivate(chromeWin);}
return this.privacyContextFromWindow(aBrowser.contentWindow).usePrivateBrowsing;},privacyContextFromWindow:function pbu_privacyContextFromWindow(aWindow){return aWindow.docShell.QueryInterface(Ci.nsILoadContext);},get permanentPrivateBrowsing(){try{return(gTemporaryAutoStartMode||Services.prefs.getBoolPref(kAutoStartPref));}catch(e){ return false;}}, enterTemporaryAutoStartMode:function pbu_enterTemporaryAutoStartMode(){gTemporaryAutoStartMode=true;},get isInTemporaryAutoStartMode(){return gTemporaryAutoStartMode;},};