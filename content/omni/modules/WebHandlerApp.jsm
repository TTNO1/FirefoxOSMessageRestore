//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");function nsWebHandlerApp(){}
nsWebHandlerApp.prototype={classDescription:"A web handler for protocols and content",classID:Components.ID("8b1ae382-51a9-4972-b930-56977a57919d"),contractID:"@mozilla.org/uriloader/web-handler-app;1",QueryInterface:ChromeUtils.generateQI(["nsIWebHandlerApp","nsIHandlerApp"]),_name:null,_detailedDescription:null,_uriTemplate:null, get name(){return this._name;},set name(aName){this._name=aName;},get detailedDescription(){return this._detailedDescription;},set detailedDescription(aDesc){this._detailedDescription=aDesc;},equals(aHandlerApp){if(!aHandlerApp){throw Components.Exception("",Cr.NS_ERROR_NULL_POINTER);}
if(aHandlerApp instanceof Ci.nsIWebHandlerApp&&aHandlerApp.uriTemplate&&this.uriTemplate&&aHandlerApp.uriTemplate==this.uriTemplate){return true;}
return false;},launchWithURI(aURI,aBrowsingContext){

 var escapedUriSpecToHandle=encodeURIComponent(aURI.spec);var uriSpecToSend=this.uriTemplate.replace("%s",escapedUriSpecToHandle);var uriToSend=Services.io.newURI(uriSpecToSend);let policy=WebExtensionPolicy.getByURI(uriToSend);let privateAllowed=!policy||policy.privateBrowsingAllowed;


if(aBrowsingContext&&aBrowsingContext!=aBrowsingContext.top){let{scheme}=aURI;if(!scheme.startsWith("web+")&&!scheme.startsWith("ext+")){aBrowsingContext=null;}} 
if(aBrowsingContext){if(aBrowsingContext.usePrivateBrowsing&&!privateAllowed){throw Components.Exception("Extension not allowed in private windows.",Cr.NS_ERROR_FILE_NOT_FOUND);}
let triggeringPrincipal=Services.scriptSecurityManager.getSystemPrincipal();Services.tm.dispatchToMainThread(()=>aBrowsingContext.loadURI(uriSpecToSend,{triggeringPrincipal}));return;}
let win=Services.wm.getMostRecentWindow("navigator:browser");if(!privateAllowed&&PrivateBrowsingUtils.isWindowPrivate(win)){throw Components.Exception("Extension not allowed in private windows.",Cr.NS_ERROR_FILE_NOT_FOUND);}








 
win.browserDOMWindow.openURI(uriToSend,null, Ci.nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW,Ci.nsIBrowserDOMWindow.OPEN_NEW,Services.scriptSecurityManager.getSystemPrincipal());}, get uriTemplate(){return this._uriTemplate;},set uriTemplate(aURITemplate){this._uriTemplate=aURITemplate;},};var EXPORTED_SYMBOLS=["nsWebHandlerApp"];