//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{libcutils}=ChromeUtils.import("resource://gre/modules/systemlibs.js");XPCOMUtils.defineLazyServiceGetter(this,"gNetworkService","@mozilla.org/network/service;1","nsINetworkService");this.EXPORTED_SYMBOLS=["WifiNetUtil"];const DHCP_PROP="init.svc.dhcpcd";const DHCP="dhcpcd";const DEBUG=false;this.WifiNetUtil=function(controlMessage){function debug(msg){if(DEBUG){dump("-*- NetUtil: "+msg);}}
var util={};util.runDhcp=function(ifname,gen,callback){util.stopDhcp(ifname,function(){gNetworkService.dhcpRequest(ifname,function(success,dhcpInfo){if(!success){callback({info:null},gen);return;}
util.runIpConfig(ifname,dhcpInfo,function(data){callback(data,gen);});});});};util.stopDhcp=function(ifname,callback){

let dhcpService=DHCP_PROP+"_"+ifname;let suffix=ifname.substr(0,3)==="p2p"?"p2p":ifname;let processName=DHCP+"_"+suffix;


 setProperty("dhcp."+suffix+".result","ko",function(){stopProcess(dhcpService,processName,callback);});};util.startDhcpServer=function(config,callback){gNetworkService.setDhcpServer(true,config,function(error){callback(!error);});};util.stopDhcpServer=function(callback){gNetworkService.setDhcpServer(false,null,function(error){callback(!error);});};util.runIpConfig=function(name,data,callback){if(!data){debug("IP config failed to run");callback({info:data});return;}
setProperty("net."+name+".dns1",ipToString(data.dns1),function(ok){if(!ok){debug("Unable to set net.<ifname>.dns1");return;}
setProperty("net."+name+".dns2",ipToString(data.dns2),function(ok){if(!ok){debug("Unable to set net.<ifname>.dns2");return;}
setProperty("net."+name+".gw",ipToString(data.gateway),function(ok){if(!ok){debug("Unable to set net.<ifname>.gw");return;}
callback({info:data});});});});};function stopProcess(service,process,callback){var count=0;var timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);function tick(){let result=libcutils.property_get(service);if(result===null){callback();return;}
if(result==="stopped"||++count>=5){timer=null;callback();return;}
timer.initWithCallback(tick,1000,Ci.nsITimer.TYPE_ONE_SHOT);}
setProperty("ctl.stop",process,tick);}

function setProperty(key,value,callback){let ok=true;try{libcutils.property_set(key,value);}catch(e){ok=false;}
callback(ok);}
function ipToString(n){return(String((n>>0)&0xff)+"."+
((n>>8)&0xff)+"."+
((n>>16)&0xff)+"."+
((n>>24)&0xff));}
return util;};