"use strict";const DEBUG=false;function debug(s){dump("-*- KillSwitch.js: "+s+"\n");}
const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{DOMRequestIpcHelper}=ChromeUtils.import("resource://gre/modules/DOMRequestHelper.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyServiceGetter(this,"cpmm","@mozilla.org/childprocessmessagemanager;1","nsIMessageSender");const KILLSWITCH_CID="{b6eae5c6-971c-4772-89e5-5df626bf3f09}";const KILLSWITCH_CONTRACTID="@mozilla.org/moz-kill-switch;1";const kEnableKillSwitch="KillSwitch:Enable";const kEnableKillSwitchOK="KillSwitch:Enable:OK";const kEnableKillSwitchKO="KillSwitch:Enable:KO";const kDisableKillSwitch="KillSwitch:Disable";const kDisableKillSwitchOK="KillSwitch:Disable:OK";const kDisableKillSwitchKO="KillSwitch:Disable:KO";function KillSwitch(){this._window=null;}
KillSwitch.prototype={__proto__:DOMRequestIpcHelper.prototype,init(aWindow){DEBUG&&debug("init");this._window=aWindow;this.initDOMRequestHelper(this._window);},enable(){DEBUG&&debug("KillSwitch: enable");cpmm.addMessageListener(kEnableKillSwitchOK,this);cpmm.addMessageListener(kEnableKillSwitchKO,this);return this.createPromise((aResolve,aReject)=>{cpmm.sendAsyncMessage(kEnableKillSwitch,{requestID:this.getPromiseResolverId({resolve:aResolve,reject:aReject,}),});});},disable(){DEBUG&&debug("KillSwitch: disable");cpmm.addMessageListener(kDisableKillSwitchOK,this);cpmm.addMessageListener(kDisableKillSwitchKO,this);return this.createPromise((aResolve,aReject)=>{cpmm.sendAsyncMessage(kDisableKillSwitch,{requestID:this.getPromiseResolverId({resolve:aResolve,reject:aReject,}),});});},receiveMessage(message){DEBUG&&debug("Received: "+message.name);cpmm.removeMessageListener(kEnableKillSwitchOK,this);cpmm.removeMessageListener(kEnableKillSwitchKO,this);cpmm.removeMessageListener(kDisableKillSwitchOK,this);cpmm.removeMessageListener(kDisableKillSwitchKO,this);let req=this.takePromiseResolver(message.data.requestID);switch(message.name){case kEnableKillSwitchKO:case kDisableKillSwitchKO:req.reject(false);break;case kEnableKillSwitchOK:case kDisableKillSwitchOK:req.resolve(true);break;default:DEBUG&&debug("Unrecognized message: "+message.name);break;}},classID:Components.ID(KILLSWITCH_CID),contractID:KILLSWITCH_CONTRACTID,QueryInterface:ChromeUtils.generateQI([Ci.nsIKillSwitch,Ci.nsIDOMGlobalPropertyInitializer,Ci.nsIObserver,Ci.nsIMessageListener,Ci.nsISupportsWeakReference,]),};this.NSGetFactory=ComponentUtils.generateNSGetFactory([KillSwitch]);