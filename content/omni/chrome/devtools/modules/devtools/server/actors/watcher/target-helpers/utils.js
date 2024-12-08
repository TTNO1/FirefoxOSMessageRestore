"use strict";const Services=require("Services");function shouldNotifyWindowGlobal(browsingContext,watchedBrowserId,options={}){const windowGlobal=browsingContext.currentWindowGlobal; if(!windowGlobal){return false;}
if(browsingContext.currentRemoteType=="extension"){return false;}

if(windowGlobal.osPid==-1&&windowGlobal.isInProcess){return false;}
 
if(windowGlobal.documentURI&&windowGlobal.documentURI.spec=="about:blank"){return false;}
if(watchedBrowserId&&browsingContext.browserId!=watchedBrowserId){return false;}
if(options.acceptNonRemoteFrame){return true;} 
return(!browsingContext.parent||windowGlobal.osPid!=browsingContext.parent.currentWindowGlobal.osPid);}
function getAllRemoteBrowsingContexts(topBrowsingContext){const browsingContexts=[];function walk(browsingContext){if(browsingContexts.includes(browsingContext)){return;}
browsingContexts.push(browsingContext);for(const child of browsingContext.children){walk(child);}
if(browsingContext.window){for(const browser of browsingContext.window.document.querySelectorAll(`browser[remote="true"]`)){walk(browser.browsingContext);}}} 
if(topBrowsingContext){walk(topBrowsingContext);browsingContexts.shift();}else{
for(const window of Services.ww.getWindowEnumerator()){if(window.docShell.browsingContext){walk(window.docShell.browsingContext);}}}
return browsingContexts;}
module.exports={getAllRemoteBrowsingContexts,shouldNotifyWindowGlobal,};