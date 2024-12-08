"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{TelURIParser}=ChromeUtils.import("resource:///modules/TelURIParser.jsm");const{ActivityChannel}=ChromeUtils.import("resource://gre/modules/ActivityChannel.jsm");function SmsProtocolHandler(){}
SmsProtocolHandler.prototype={scheme:"sms",defaultPort:-1,protocolFlags:Ci.nsIProtocolHandler.URI_NORELATIVE|Ci.nsIProtocolHandler.URI_NOAUTH|Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE|Ci.nsIProtocolHandler.URI_DOES_NOT_RETURN_DATA,allowPort:()=>false,newURI(aSpec,aOriginCharset){let uri=Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);uri.spec=aSpec;return uri;},newChannel(aURI,aLoadInfo){let number=TelURIParser.parseURI("sms",aURI.spec);let body="";let query=aURI.spec.split("?")[1];if(query){let params=query.split("&");params.forEach(function(aParam){let[name,value]=aParam.split("=");if(name==="body"){body=decodeURIComponent(value);}});}
if(number||body){return new ActivityChannel(aURI,aLoadInfo,"sms-handler",{number:number||"",type:"websms/sms",body,});}
throw Components.Exception("",Cr.NS_ERROR_ILLEGAL_VALUE);},classID:Components.ID("{81ca20cb-0dad-4e32-8566-979c8998bd73}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIProtocolHandler]),};this.NSGetFactory=ComponentUtils.generateNSGetFactory([SmsProtocolHandler]);