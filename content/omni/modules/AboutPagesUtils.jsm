//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["AboutPagesUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const AboutPagesUtils={};XPCOMUtils.defineLazyGetter(AboutPagesUtils,"visibleAboutUrls",()=>{const urls=[];const rx=/@mozilla.org\/network\/protocol\/about;1\?what\=(.*)$/;for(const cid in Cc){const result=cid.match(rx);if(!result){continue;}
const[,aboutType]=result;try{const am=Cc[cid].getService(Ci.nsIAboutModule);const uri=Services.io.newURI(`about:${aboutType}`);const flags=am.getURIFlags(uri);if(!(flags&Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT)){urls.push(`about:${aboutType}`);}}catch(e){
}}
urls.sort();return urls;});