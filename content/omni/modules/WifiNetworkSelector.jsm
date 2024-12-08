//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{WifiConfigManager}=ChromeUtils.import("resource://gre/modules/WifiConfigManager.jsm");const{WifiConstants}=ChromeUtils.import("resource://gre/modules/WifiConstants.jsm");const{SavedNetworkSelector}=ChromeUtils.import("resource://gre/modules/SavedNetworkSelector.jsm");const{PasspointNetworkSelector}=ChromeUtils.import("resource://gre/modules/PasspointNetworkSelector.jsm");this.EXPORTED_SYMBOLS=["WifiNetworkSelector"];var gDebug=false;function BssidDenylistStatus(){}
BssidDenylistStatus.prototype={counter:0,isDenylisted:false,denylistedTimeStamp:WifiConstants.INVALID_TIME_STAMP,};this.WifiNetworkSelector=(function(){var wifiNetworkSelector={};
const MINIMUM_NETWORK_SELECTION_INTERVAL=10*1000;const MINIMUM_LAST_USER_SELECTION_INTERVAL=30*1000;const BSSID_DENYLIST_THRESHOLD=3;const BSSID_DENYLIST_EXPIRE_TIME=30*60*1000;const REASON_AP_UNABLE_TO_HANDLE_NEW_STA=17;var lastNetworkSelectionTimeStamp=WifiConstants.INVALID_TIME_STAMP;var enableAutoJoinWhenAssociated=true;var bssidDenylist=new Map();var roamingCandidate=null;var savedNetworkSelector=new SavedNetworkSelector();var passpointNetworkSelector=new PasspointNetworkSelector();var networkSelectors=[savedNetworkSelector,passpointNetworkSelector]; wifiNetworkSelector.skipNetworkSelection=false;wifiNetworkSelector.bssidDenylist=bssidDenylist; wifiNetworkSelector.updateBssidDenylist=updateBssidDenylist;wifiNetworkSelector.selectNetwork=selectNetwork;wifiNetworkSelector.trackBssid=trackBssid;wifiNetworkSelector.setDebug=setDebug;function setDebug(aDebug){gDebug=aDebug;if(savedNetworkSelector){savedNetworkSelector.setDebug(aDebug);}
if(passpointNetworkSelector){passpointNetworkSelector.setDebug(aDebug);}}
function debug(aMsg){if(gDebug){dump("-*- WifiNetworkSelector: "+aMsg);}}
function selectNetwork(scanResults,wifiState,wifiInfo,callback){roamingCandidate=null;debug("==========start Network Selection==========");if(scanResults.length==0){debug("Empty connectivity scan result");callback(null);return;}
if(!isNetworkSelectionNeeded(scanResults,wifiState,wifiInfo)){callback(null);return;}
if(roamingCandidate!=null){debug("Found suitable roaming candidate");lastNetworkSelectionTimeStamp=Date.now();roamingCandidate.netId=wifiInfo.networkId;let config=savedNetworkSelector.convertScanResultToConfiguration(roamingCandidate);callback(config);return;}
var candidate=null;var configuredNetworks=WifiConfigManager.configuredNetworks;updateSavedNetworkSelectionStatus(configuredNetworks);var filteredResults=filterScanResults(scanResults,wifiState,wifiInfo.bssid);if(filteredResults.length===0){callback(null);return;}
const selectorCallback=element=>{candidate=element.chooseNetwork(filteredResults,wifiInfo);return candidate!=null;};networkSelectors.some(selectorCallback);if(candidate==null){debug("Can not find any suitable candidates");callback(null);return;}
lastNetworkSelectionTimeStamp=Date.now();callback(candidate);}
function isNetworkSelectionNeeded(scanResults,wifiState,wifiInfo){if(wifiNetworkSelector.skipNetworkSelection){debug("skipNetworkSelection flag is TRUE.");return false;}
if(wifiState=="connected"||wifiState=="associated"){if(!wifiInfo){return false;}
if(!enableAutoJoinWhenAssociated){debug("Switching networks in connected state is not allowed."+" Skip network selection.");return false;}
if(lastNetworkSelectionTimeStamp!=WifiConstants.INVALID_TIME_STAMP){var gap=Date.now()-lastNetworkSelectionTimeStamp;if(gap<MINIMUM_NETWORK_SELECTION_INTERVAL){debug("Too short since last network selection: "+
gap+" ms."+" Skip network selection");return false;}}
if(isCurrentNetworkSufficient(scanResults,wifiInfo)){debug("Current network already sufficient. Skip network selection.");return false;}
debug("Current connected network is not sufficient.");return true;}else if(wifiState=="disconnected"){return true;}
debug("Wifi is neither connected or disconnected. Skip network selection");return false;} 
function findRoamingCadidate(scanResults,wifiInfo){let currentRssi=wifiInfo.rssi;let minDiff=0;roamingCandidate=null;if(currentRssi<-85){ minDiff=1;}else if(currentRssi<-80){ minDiff=2;}else if(currentRssi<-75){ minDiff=3;}else if(currentRssi<-70){ minDiff=4;}else if(currentRssi<0){ minDiff=5;}else{minDiff=2;}
debug("wifiInfo: bssid="+
wifiInfo.bssid+"; rssi="+
wifiInfo.rssi+"; minDiff="+
minDiff);let filterdResult=scanResults.filter(result=>result.security===wifiInfo.security&&result.ssid===wifiInfo.wifiSsid&&result.bssid!==wifiInfo.bssid&&result.signalStrength-wifiInfo.rssi>minDiff);if(filterdResult.length>0){roamingCandidate=filterdResult[0];debug("roamingCandidate: bssid="+
roamingCandidate.bssid+"; signalStrength="+
roamingCandidate.signalStrength);return true;}
return false;}
function isCurrentNetworkSufficient(scanResults,wifiInfo){if(wifiInfo.networkId==WifiConstants.INVALID_NETWORK_ID){debug("WifiWorker in connected state but WifiInfo is not");return false;}
debug("Current connected network: "+
wifiInfo.wifiSsid+" ,ID is: "+
wifiInfo.networkId);let network=WifiConfigManager.getNetworkConfiguration(wifiInfo.networkId);if(!network){debug("Current network is removed");return false;}
let lastNetwork=WifiConfigManager.getLastSelectedNetwork();let lastTimeStamp=WifiConfigManager.getLastSelectedTimeStamp();if(lastNetwork==wifiInfo.networkId&&Date.now()-lastTimeStamp<MINIMUM_LAST_USER_SELECTION_INTERVAL){return true;}
if(findRoamingCadidate(scanResults,wifiInfo)){return false;}
let currentRssi=wifiInfo.rssi;let hasQualifiedRssi=(wifiInfo.is24G&&currentRssi>WifiConstants.RSSI_THRESHOLD_LOW_24G)||(wifiInfo.is5G&&currentRssi>WifiConstants.RSSI_THRESHOLD_LOW_5G);if(!hasQualifiedRssi){debug("Current network RSSI["+
currentRssi+"]-acceptable but not qualified.");return false;}
if(wifiInfo.security=="OPEN"){debug("Current network is a open one");return false;}
return true;}
function filterScanResults(scanResults,wifiState,currentBssid){let filteredResults=[];let resultsContainCurrentBssid=false;for(let scanResult of scanResults){ if(!scanResult.ssid||scanResult.ssid===""){debug("skip bad scan result");continue;}
if(scanResult.bssid.includes(currentBssid)){resultsContainCurrentBssid=true;}
var scanId=scanResult.ssid+":"+scanResult.bssid;debug("scanId = "+scanId); let status=bssidDenylist.get(scanResult.bssid);if(typeof status!=="undefined"&&status.isDenylisted){debug(scanId+" is in deny list.");continue;}
let isWeak24G=scanResult.is24G&&scanResult.signalStrength<WifiConstants.RSSI_THRESHOLD_BAD_24G;let isWeak5G=scanResult.is5G&&scanResult.signalStrength<WifiConstants.RSSI_THRESHOLD_BAD_5G; if(isWeak24G||isWeak5G){debug(scanId+"("+
(scanResult.is24G?"2.4GHz":"5GHz")+")"+
scanResult.signalStrength+" / ");continue;} 
filteredResults.push(scanResult);}
let isConnected=wifiState=="connected"||wifiState=="associated";
if(isConnected&&!resultsContainCurrentBssid){return[];}
return filteredResults;}
function trackBssid(bssid,enable,reason){debug("trackBssid: "+(enable?"enable ":"disable ")+bssid);if(!bssid.length){return false;}
if(enable){return bssidDenylist.delete(bssid);}
let status=bssidDenylist.get(bssid);if(typeof status=="undefined"){ status=new BssidDenylistStatus();bssidDenylist.set(bssid,status);}
status.counter++;status.denylistedTimeStamp=Date.now();if(!status.isDenylisted){if(status.counter>=BSSID_DENYLIST_THRESHOLD||reason==REASON_AP_UNABLE_TO_HANDLE_NEW_STA){status.isDenylisted=true;return true;}}
return false;}
function updateBssidDenylist(callback){let iter=bssidDenylist[Symbol.iterator]();let updated=false;for(let[bssid,status]of iter){debug("BSSID deny list: BSSID="+
bssid+" isDenylisted="+
status.isDenylisted);if(status.isDenylisted&&Date.now()-status.denylistedTimeStamp>=BSSID_DENYLIST_EXPIRE_TIME){bssidDenylist.delete(bssid);updated=true;}}
callback(updated);}
function updateSavedNetworkSelectionStatus(configuredNetworks){if(Object.keys(configuredNetworks).length==0){debug("no saved network");return;}
WifiConfigManager.tryEnableQualifiedNetwork(configuredNetworks);}
return wifiNetworkSelector;})();