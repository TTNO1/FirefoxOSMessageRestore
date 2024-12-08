//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{WifiConfigManager}=ChromeUtils.import("resource://gre/modules/WifiConfigManager.jsm");const{WifiConstants}=ChromeUtils.import("resource://gre/modules/WifiConstants.jsm");this.EXPORTED_SYMBOLS=["SavedNetworkSelector"];const BAND_AWARD_5GHZ=40;const LAST_SELECTION_AWARD=480;const CURRENT_NETWORK_BOOST=16;const SAME_BSSID_AWARD=24;const SECURITY_AWARD=80;const NO_INTERNET_PENALTY=150;var gDebug=false;function debug(aMsg){if(gDebug){dump("-*- SavedNetworkSelector: "+aMsg);}}
this.SavedNetworkSelector=function SavedNetworkSelector(){};SavedNetworkSelector.prototype={setDebug(aDebug){gDebug=aDebug;},chooseNetwork(results,wifiInfo){var configuredNetworks=WifiConfigManager.configuredNetworks;var candidate=null;var highestScore=0; for(let result of results){ if(!result.known){continue;}
if(configuredNetworks[result.networkKey].networkSelectionStatus){continue;}
let score=this.calculateBssidScore(result,WifiConfigManager.isLastSelectedNetwork(result.netId),wifiInfo.networkId==result.netId,wifiInfo.bssid?wifiInfo.bssid==result.bssid:false,WifiConfigManager.getLastSelectedTimeStamp());if(score>highestScore){highestScore=score;candidate=result;}}
return this.convertScanResultToConfiguration(candidate);},calculateBssidScore(scanResult,sameSelect,sameNetworkId,sameBssid,timeStamp){var score=0; var rssi=scanResult.signalStrength<=WifiConstants.RSSI_THRESHOLD_GOOD_24G?scanResult.signalStrength:WifiConstants.RSSI_THRESHOLD_GOOD_24G;score+=(parseInt(rssi,10)+WifiConstants.RSSI_SCORE_OFFSET)*WifiConstants.RSSI_SCORE_SLOPE;debug("RSSI score: "+score);if(scanResult.is5G){ score+=BAND_AWARD_5GHZ;debug("5GHz bonus: "+BAND_AWARD_5GHZ);} 
if(sameSelect){var timeDifference=Date.now()-timeStamp;if(timeDifference>0){var bonus=LAST_SELECTION_AWARD-timeDifference/1000/60;score+=bonus>0?bonus:0;debug(" User selected it last time "+
timeDifference/1000/60+" minutes ago, bonus:"+
bonus);}} 
if(sameNetworkId){score+=CURRENT_NETWORK_BOOST;debug("Same network with current associated. Bonus: "+CURRENT_NETWORK_BOOST);} 
if(sameBssid){score+=SAME_BSSID_AWARD;debug("Same BSSID with current association. Bonus: "+SAME_BSSID_AWARD);} 
if(scanResult.security&&scanResult.security!=="OPEN"){score+=SECURITY_AWARD;debug("Secure network Bonus: "+SECURITY_AWARD);}


if(typeof scanResult.hasInternet!=="undefined"&&!scanResult.hasInternet&&(typeof scanResult.captivePortalDetected==="undefined"||!scanResult.captivePortalDetected)){score-=NO_INTERNET_PENALTY;debug(" No internet Penalty: -"+NO_INTERNET_PENALTY);}
debug(" Score for scanResult: "+scanResult.ssid+" final score:"+score);return score;},convertScanResultToConfiguration(candidate){if(!candidate){return null;}
if(candidate.netId===WifiConstants.INVALID_NETWORK_ID){return null;}
let config=candidate;let saved=WifiConfigManager.getNetworkConfiguration(config.netId);for(let item in saved){if(item in config===false){config[item]=saved[item];}}
return config;},};