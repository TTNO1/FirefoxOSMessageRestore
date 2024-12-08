//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var EXPORTED_SYMBOLS=["ForgetAboutSite"];var ForgetAboutSite={async removeDataFromDomain(aDomain){let promises=[new Promise(resolve=>Services.clearData.deleteDataFromHost(aDomain,true ,Ci.nsIClearDataService.CLEAR_FORGET_ABOUT_SITE,errorCode=>resolve(bitCounting(errorCode)))),];try{let baseDomain=Services.eTLD.getBaseDomainFromHost(aDomain);let cookies=Services.cookies.cookies;let hosts=new Set();for(let cookie of cookies){if(Services.eTLD.hasRootDomain(cookie.rawHost,baseDomain)){hosts.add(cookie.rawHost);}}
for(let host of hosts){promises.push(new Promise(resolve=>Services.clearData.deleteDataFromHost(host,true ,Ci.nsIClearDataService.CLEAR_COOKIES,errorCode=>resolve(bitCounting(errorCode)))));}}catch(e){
if(e.result!=Cr.NS_ERROR_HOST_IS_IP_ADDRESS&&e.result!=Cr.NS_ERROR_INSUFFICIENT_DOMAIN_LEVELS){throw e;}}
let errorCount=(await Promise.all(promises)).reduce((a,b)=>a+b);if(errorCount!==0){throw new Error(`There were a total of ${errorCount} errors during removal`);}},};function bitCounting(value){
const count=value-((value>>1)&0o33333333333)-((value>>2)&0o11111111111);return((count+(count>>3))&0o30707070707)%63;}