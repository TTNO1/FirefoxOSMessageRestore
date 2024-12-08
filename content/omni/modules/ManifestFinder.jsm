//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var ManifestFinder={ contentHasManifestLink(aContent){if(!aContent||isXULBrowser(aContent)){throw new TypeError("Invalid input.");}
return checkForManifest(aContent);},async browserHasManifestLink(aBrowser){if(!isXULBrowser(aBrowser)){throw new TypeError("Invalid input.");}
const actor=aBrowser.browsingContext.currentWindowGlobal.getActor("ManifestMessages");const reply=await actor.sendQuery("DOM:WebManifest:hasManifestLink");return reply.result;},};function isXULBrowser(aBrowser){if(!aBrowser||!aBrowser.namespaceURI||!aBrowser.localName){return false;}
const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";return aBrowser.namespaceURI===XUL_NS&&aBrowser.localName==="browser";}
function checkForManifest(aWindow){if(!aWindow||aWindow.top!==aWindow){return false;}
const elem=aWindow.document.querySelector("link[rel~='manifest']");if(!elem||!elem.getAttribute("href")){return false;}
return true;}
var EXPORTED_SYMBOLS=["ManifestFinder",];