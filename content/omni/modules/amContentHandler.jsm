//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const XPI_CONTENT_TYPE="application/x-xpinstall";const MSG_INSTALL_ADDON="WebInstallerInstallAddonFromWebpage";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function amContentHandler(){}
amContentHandler.prototype={handleContent(aMimetype,aContext,aRequest){if(aMimetype!=XPI_CONTENT_TYPE){throw Components.Exception("",Cr.NS_ERROR_WONT_HANDLE_CONTENT);}
if(!(aRequest instanceof Ci.nsIChannel)){throw Components.Exception("",Cr.NS_ERROR_WONT_HANDLE_CONTENT);}
let uri=aRequest.URI;aRequest.cancel(Cr.NS_BINDING_ABORTED);let{loadInfo}=aRequest;const{triggeringPrincipal}=loadInfo;let browsingContext=loadInfo.targetBrowsingContext;let sourceHost;let sourceURL;try{sourceURL=triggeringPrincipal.spec!=""?triggeringPrincipal.spec:undefined;sourceHost=triggeringPrincipal.host;}catch(error){
}
let install={uri:uri.spec,hash:null,name:null,icon:null,mimetype:XPI_CONTENT_TYPE,triggeringPrincipal,callbackID:-1,method:"link",sourceHost,sourceURL,browsingContext,};Services.cpmm.sendAsyncMessage(MSG_INSTALL_ADDON,install);},classID:Components.ID("{7beb3ba8-6ec3-41b4-b67c-da89b8518922}"),QueryInterface:ChromeUtils.generateQI(["nsIContentHandler"]),log(aMsg){let msg="amContentHandler.js: "+(aMsg.join?aMsg.join(""):aMsg);Services.console.logStringMessage(msg);dump(msg+"\n");},};var EXPORTED_SYMBOLS=["amContentHandler"];