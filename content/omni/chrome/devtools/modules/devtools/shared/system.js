"use strict";const{Cc,Ci}=require("chrome");loader.lazyRequireGetter(this,"Services");loader.lazyRequireGetter(this,"DevToolsServer","devtools/server/devtools-server",true);loader.lazyRequireGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm",true);loader.lazyGetter(this,"hostname",()=>{try{return Cc["@mozilla.org/network/dns-service;1"].getService(Ci.nsIDNSService).myHostName;}catch(e){return"";}});loader.lazyGetter(this,"endianness",()=>{if(new Uint32Array(new Uint8Array([1,2,3,4]).buffer)[0]===0x04030201){return"LE";}
return"BE";});const APP_MAP={"{ec8030f7-c20a-464f-9b0e-13a3a9e97384}":"firefox","{3550f703-e582-4d05-9a08-453d09bdfdc6}":"thunderbird","{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}":"seamonkey","{718e30fb-e89b-41dd-9da7-e25a45638b28}":"sunbird","{aa3c5121-dab2-40e2-81ca-7ea25febc110}":"mobile/android",};var CACHED_INFO=null;function getSystemInfo(){if(CACHED_INFO){return CACHED_INFO;}
const appInfo=Services.appinfo;const win=Services.wm.getMostRecentWindow(DevToolsServer.chromeWindowType);const[processor,compiler]=appInfo.XPCOMABI.split("-");let dpi,useragent,width,height,physicalWidth,physicalHeight,brandName;const appid=appInfo.ID;const apptype=APP_MAP[appid];const geckoVersion=appInfo.platformVersion;const hardware="unknown";let version="unknown";const os=appInfo.OS;version=appInfo.version;const bundle=Services.strings.createBundle("chrome://branding/locale/brand.properties");if(bundle){brandName=bundle.GetStringFromName("brandFullName");}else{brandName=null;}
if(win){const utils=win.windowUtils;dpi=utils.displayDPI;useragent=win.navigator.userAgent;width=win.screen.width;height=win.screen.height;physicalWidth=win.screen.width*win.devicePixelRatio;physicalHeight=win.screen.height*win.devicePixelRatio;}
const info={appid, apptype,vendor:appInfo.vendor,name:appInfo.name,version,appbuildid:appInfo.appBuildID,platformbuildid:appInfo.platformBuildID,geckobuildid:appInfo.platformBuildID,
platformversion:geckoVersion,geckoversion:geckoVersion, locale:Services.locale.appLocaleAsBCP47,endianness:endianness, hostname:hostname, os,platform:os,hardware,deviceName:getDeviceName(), arch:processor,processor,compiler, profile:getProfileLocation(), channel:AppConstants.MOZ_UPDATE_CHANNEL,dpi,useragent,width,height,physicalWidth,physicalHeight,brandName,};CACHED_INFO=info;return info;}
function getDeviceName(){try{return Services.sysinfo.getProperty("device");}catch(e){return null;}}
function getProfileLocation(){try{

const profd=Services.dirsvc.get("ProfD",Ci.nsIFile);const profservice=Cc["@mozilla.org/toolkit/profile-service;1"].getService(Ci.nsIToolkitProfileService);if(profservice.currentProfile){return profservice.currentProfile.name;}
return profd.leafName;}catch(e){return"";}}
exports.getSystemInfo=getSystemInfo;