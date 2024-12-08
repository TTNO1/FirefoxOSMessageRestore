"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{ActivityChannel}=ChromeUtils.import("resource://gre/modules/ActivityChannel.jsm");function MailtoProtocolHandler(){}
MailtoProtocolHandler.prototype={scheme:"mailto",defaultPort:-1,protocolFlags:Ci.nsIProtocolHandler.URI_NORELATIVE|Ci.nsIProtocolHandler.URI_NOAUTH|Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE|Ci.nsIProtocolHandler.URI_DOES_NOT_RETURN_DATA,allowPort:()=>false,newURI(aSpec,aOriginCharset){let uri=Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);uri.spec=aSpec;return uri;},newChannel(aURI,aLoadInfo){return new ActivityChannel(aURI,aLoadInfo,"mail-handler",{URI:aURI.spec,type:"mail",});},classID:Components.ID("{50777e53-0331-4366-a191-900999be386c}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIProtocolHandler]),};this.NSGetFactory=ComponentUtils.generateNSGetFactory([MailtoProtocolHandler,]);