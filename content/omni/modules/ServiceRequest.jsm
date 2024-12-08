//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["XMLHttpRequest"]);var EXPORTED_SYMBOLS=["ServiceRequest"];const logger=Log.repository.getLogger("ServiceRequest");logger.level=Log.Level.Debug;logger.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));class ServiceRequest extends XMLHttpRequest{constructor(options){super(options);}
open(method,url,options){super.open(method,url,true); if(super.channel instanceof Ci.nsIHttpChannelInternal){super.channel.QueryInterface(Ci.nsIHttpChannelInternal).beConservative=true;}}}