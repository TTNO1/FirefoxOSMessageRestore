"use strict";var EXPORTED_SYMBOLS=["BackgroundThumbnailsChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PageThumbUtils","resource://gre/modules/PageThumbUtils.jsm"); const SANDBOXED_AUXILIARY_NAVIGATION=0x2;class BackgroundThumbnailsChild extends JSWindowActorChild{receiveMessage(message){switch(message.name){case"Browser:Thumbnail:ContentInfo":{if(message.data.isImage||this.document instanceof this.contentWindow.ImageDocument){
return PageThumbUtils.createImageThumbnailCanvas(this.contentWindow,this.document.location,message.data.targetWidth,message.data.backgroundColor);}
let[width,height]=PageThumbUtils.getContentSize(this.contentWindow);return{width,height};}
case"Browser:Thumbnail:LoadURL":{let docShell=this.docShell.QueryInterface(Ci.nsIWebNavigation);
docShell.QueryInterface(Ci.nsIDocumentLoader).loadGroup.QueryInterface(Ci.nsISupportsPriority).priority=Ci.nsISupportsPriority.PRIORITY_LOWEST;docShell.allowMedia=false;docShell.allowPlugins=false;docShell.allowContentRetargeting=false;let defaultFlags=Ci.nsIRequest.LOAD_ANONYMOUS|Ci.nsIRequest.LOAD_BYPASS_CACHE|Ci.nsIRequest.INHIBIT_CACHING|Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY;docShell.defaultLoadFlags=defaultFlags;this.browsingContext.sandboxFlags|=SANDBOXED_AUXILIARY_NAVIGATION;docShell.useTrackingProtection=true;
if(!this.document){return false;}
let loadURIOptions={ triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),loadFlags:Ci.nsIWebNavigation.LOAD_FLAGS_STOP_CONTENT,};try{docShell.loadURI(message.data.url,loadURIOptions);}catch(ex){return false;}
return true;}}
return undefined;}
handleEvent(event){if(event.type=="DOMDocElementInserted"){

this.contentWindow.windowUtils.disableDialogs();}}}