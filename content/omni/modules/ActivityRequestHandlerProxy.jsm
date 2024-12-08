//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function debug(aMsg){}
function ActivityRequestHandlerProxy(){}
ActivityRequestHandlerProxy.prototype={notifyActivityReady(id){debug(`${id} notifyActivityReady`);let handlerPID=Services.appinfo.processID;Services.cpmm.sendAsyncMessage("Activity:Ready",{id,handlerPID});},postActivityResult(id,result){debug(`${id} postActivityResult`);Services.cpmm.sendAsyncMessage("Activity:PostResult",{id,result,});},postActivityError(id,error){debug(`${id} postActivityError`);Services.cpmm.sendAsyncMessage("Activity:PostError",{id,error,});},contractID:"@mozilla.org/dom/activities/handlerproxy;1",classID:Components.ID("{47f2248f-2c8e-4829-a4bb-6ec1e886b2d6}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIActivityRequestHandlerProxy]),};var EXPORTED_SYMBOLS=["ActivityRequestHandlerProxy"];