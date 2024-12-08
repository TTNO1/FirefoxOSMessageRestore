//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{ManifestProcessor}=ChromeUtils.import("resource://gre/modules/ManifestProcessor.jsm");var ManifestObtainer={ async browserObtainManifest(aBrowser,aOptions={checkConformance:false}){if(!isXULBrowser(aBrowser)){throw new TypeError("Invalid input. Expected XUL browser.");}
const actor=aBrowser.browsingContext.currentWindowGlobal.getActor("ManifestMessages");const reply=await actor.sendQuery("DOM:ManifestObtainer:Obtain",aOptions);if(!reply.success){const error=toError(reply.result);throw error;}
return reply.result;},async contentObtainManifest(aContent,aOptions={checkConformance:false}){if(!Services.prefs.getBoolPref("dom.manifest.enabled")){throw new Error("Obtaining manifest is disabled by pref: dom.manifest.enabled");}
if(!aContent||isXULBrowser(aContent)){const err=new TypeError("Invalid input. Expected a DOM Window.");return Promise.reject(err);}
const response=await fetchManifest(aContent);const result=await processResponse(response,aContent,aOptions);const clone=Cu.cloneInto(result,aContent);return clone;},};function toError(aErrorClone){let error;switch(aErrorClone.name){case"TypeError":error=new TypeError();break;default:error=new Error();}
Object.getOwnPropertyNames(aErrorClone).forEach(name=>(error[name]=aErrorClone[name]));return error;}
function isXULBrowser(aBrowser){if(!aBrowser||!aBrowser.namespaceURI||!aBrowser.localName){return false;}
const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";return aBrowser.namespaceURI===XUL_NS&&aBrowser.localName==="browser";}
async function processResponse(aResp,aContentWindow,aOptions){const badStatus=aResp.status<200||aResp.status>=300;if(aResp.type==="error"||badStatus){const msg=`Fetch error: ${aResp.status} - ${aResp.statusText} at ${aResp.url}`;throw new Error(msg);}
const text=await aResp.text();const args={jsonText:text,manifestURL:aResp.url,docURL:aContentWindow.location.href,};const processingOptions=Object.assign({},args,aOptions);const manifest=ManifestProcessor.process(processingOptions);return manifest;}
async function fetchManifest(aWindow){if(!aWindow||aWindow.top!==aWindow){const msg="Window must be a top-level browsing context.";throw new Error(msg);}
const elem=aWindow.document.querySelector("link[rel~='manifest']");if(!elem||!elem.getAttribute("href")){return new aWindow.Response("null");} 
const manifestURL=new aWindow.URL(elem.href,elem.baseURI);const reqInit={credentials:"omit",mode:"cors",};if(elem.crossOrigin==="use-credentials"){reqInit.credentials="include";}
const request=new aWindow.Request(manifestURL,reqInit);request.overrideContentPolicyType(Ci.nsIContentPolicy.TYPE_WEB_MANIFEST);return aWindow.fetch(request);}
var EXPORTED_SYMBOLS=["ManifestObtainer"];