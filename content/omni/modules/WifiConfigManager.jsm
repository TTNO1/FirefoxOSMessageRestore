//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{WifiConfigStore}=ChromeUtils.import("resource://gre/modules/WifiConfigStore.jsm");const{WifiConfigUtils}=ChromeUtils.import("resource://gre/modules/WifiConfiguration.jsm");const{WifiConstants}=ChromeUtils.import("resource://gre/modules/WifiConstants.jsm");this.EXPORTED_SYMBOLS=["WifiConfigManager"];var gDebug=false;this.WifiConfigManager=(function(){var configManager={};var NETWORK_SELECTION_DISABLE_THRESHOLD=[-1, 1, 5, 5, 5, 5, 6, 1, 1, 1, 1, 1,];var NETWORK_SELECTION_DISABLE_TIMEOUT=[Number.MAX_VALUE, 15, 5, 5, 5, 5, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE,];var QUALITY_NETWORK_SELECTION_DISABLE_REASON=["NETWORK_SELECTION_ENABLE","NETWORK_SELECTION_DISABLED_BAD_LINK","NETWORK_SELECTION_DISABLED_ASSOCIATION_REJECTION ","NETWORK_SELECTION_DISABLED_AUTHENTICATION_FAILURE","NETWORK_SELECTION_DISABLED_DHCP_FAILURE","NETWORK_SELECTION_DISABLED_DNS_FAILURE","NETWORK_SELECTION_DISABLED_TLS_VERSION","NETWORK_SELECTION_DISABLED_AUTHENTICATION_NO_CREDENTIALS","NETWORK_SELECTION_DISABLED_NO_INTERNET","NETWORK_SELECTION_DISABLED_BY_WIFI_MANAGER","NETWORK_SELECTION_DISABLED_BY_WRONG_PASSWORD","NETWORK_SELECTION_DISABLED_AUTHENTICATION_NO_SUBSCRIBED",];var lastUserSelectedNetworkId=WifiConstants.INVALID_NETWORK_ID;var lastUserSelectedNetworkTimeStamp=0;var configuredNetworks=Object.create(null); var useNetworkId=0; configManager.configuredNetworks=configuredNetworks;configManager.QUALITY_NETWORK_SELECTION_DISABLE_REASON=QUALITY_NETWORK_SELECTION_DISABLE_REASON; configManager.updateNetworkSelectionStatus=updateNetworkSelectionStatus;configManager.updateNetworkInternetAccess=updateNetworkInternetAccess;configManager.tryEnableQualifiedNetwork=tryEnableQualifiedNetwork;configManager.isLastSelectedNetwork=isLastSelectedNetwork;configManager.clearLastSelectedNetwork=clearLastSelectedNetwork;configManager.updateLastSelectedNetwork=updateLastSelectedNetwork;configManager.getLastSelectedNetwork=getLastSelectedNetwork;configManager.getLastSelectedTimeStamp=getLastSelectedTimeStamp;configManager.clearDisableReasonCounter=clearDisableReasonCounter;configManager.setEverConnected=setEverConnected;configManager.getNetworkConfiguration=getNetworkConfiguration;configManager.getNetworkId=getNetworkId;configManager.fetchNetworkConfiguration=fetchNetworkConfiguration;configManager.getHiddenNetworks=getHiddenNetworks;configManager.addOrUpdateNetwork=addOrUpdateNetwork;configManager.removeNetwork=removeNetwork;configManager.clearCurrentConfigBssid=clearCurrentConfigBssid;configManager.loadFromStore=loadFromStore;configManager.saveToStore=saveToStore;configManager.setDebug=setDebug;function setDebug(aDebug){gDebug=aDebug;if(WifiConfigStore){WifiConfigStore.setDebug(gDebug);}}
function debug(aMsg){if(gDebug){dump("-*- WifiConfigManager: "+aMsg);}}
function updateNetworkSelectionStatus(netId,reason,callback){let network=getNetworkConfiguration(netId);if(!network){debug("netId:"+netId+" not found in configuredNetworks");callback(false);return;}
if(!network.networkSeclectionDisableCounter){network.networkSeclectionDisableCounter=Array(WifiConstants.NETWORK_SELECTION_DISABLED_MAX).fill(0);}
if(reason==WifiConstants.NETWORK_SELECTION_ENABLE){updateNetworkStatus(network,reason,function(doDisable){debug("Enable network:"+uneval(network));callback(doDisable);});return;}
incrementDisableReasonCounter(network,reason);debug("Network:"+
network.ssid+"disable counter of "+
QUALITY_NETWORK_SELECTION_DISABLE_REASON[reason]+" is: "+
network.networkSeclectionDisableCounter[reason]+" and threshold is: "+
NETWORK_SELECTION_DISABLE_THRESHOLD[reason]);if(network.networkSeclectionDisableCounter[reason]>=NETWORK_SELECTION_DISABLE_THRESHOLD[reason]){updateNetworkStatus(network,reason,function(doDisable){callback(doDisable);});return;}
callback(false);}
function updateNetworkStatus(config,reason,callback){if(reason==WifiConstants.NETWORK_SELECTION_ENABLE){if(typeof config.networkSelectionStatus=="undefined"||!config.networkSelectionStatus){debug("Need not change Qualified network Selection status since"+" already enabled");callback(false);return;}
config.networkSelectionStatus=WifiConstants.NETWORK_SELECTION_ENABLED;config.networkSelectionDisableReason=reason;config.disableTime=WifiConstants.INVALID_TIME_STAMP;config.networkSeclectionDisableCounter=Array(WifiConstants.NETWORK_SELECTION_DISABLED_MAX).fill(0);callback(false);return;}
if(isNetworkPermanentlyDisabled(config)){debug("Do nothing. Alreay permanent disabled!");callback(false);return;}else if(isNetworkTemporaryDisabled(config)&&reason<WifiConstants.DISABLED_TLS_VERSION_MISMATCH){debug("Do nothing. Already temporarily disabled!");callback(false);return;}
if(reason<WifiConstants.DISABLED_TLS_VERSION_MISMATCH){config.networkSelectionStatus=WifiConstants.NETWORK_SELECTION_TEMPORARY_DISABLED;}else{config.networkSelectionStatus=WifiConstants.NETWORK_SELECTION_PERMANENTLY_DISABLED;}
config.disableTime=Date.now();config.networkSelectionDisableReason=reason;debug("Network:"+
config.ssid+"Configure new status:"+
config.networkSelectionStatus+" with reason:"+
config.networkSelectionDisableReason+" at: "+
config.disableTime);callback(true);}
function updateNetworkInternetAccess(netId,validated,captivePortal,callback){if(netId===WifiConstants.INVALID_NETWORK_ID){callback(false);return;}
let config=getNetworkConfiguration(netId);if(config==null){callback(false);return;}
config.hasInternet=!!validated;config.captivePortalDetected=!!captivePortal;saveToStore(callback);}
function clearDisableReasonCounter(networkKey){if(networkKey in configuredNetworks){configuredNetworks[networkKey].networkSeclectionDisableCounter=Array(WifiConstants.NETWORK_SELECTION_DISABLED_MAX).fill(0);}}
function incrementDisableReasonCounter(config,reason){if(!config.networkSeclectionDisableCounter){config.networkSeclectionDisableCounter=Array(WifiConstants.NETWORK_SELECTION_DISABLED_MAX).fill(0);}
config.networkSeclectionDisableCounter[reason]++;}
function isNetworkPermanentlyDisabled(config){return config.networkSelectionStatus==null?false:config.networkSelectionStatus==WifiConstants.NETWORK_SELECTION_PERMANENTLY_DISABLED;}
function isNetworkTemporaryDisabled(config){return config.networkSelectionStatus==null?false:config.networkSelectionStatus==WifiConstants.NETWORK_SELECTION_TEMPORARY_DISABLED;}
function getLastSelectedTimeStamp(){return lastUserSelectedNetworkTimeStamp;}
function getLastSelectedNetwork(){return lastUserSelectedNetworkId;}
function clearLastSelectedNetwork(){lastUserSelectedNetworkId=WifiConstants.INVALID_NETWORK_ID;lastUserSelectedNetworkTimeStamp=WifiConstants.INVALID_TIME_STAMP;}
function updateLastSelectedNetwork(netId,callback){debug("updateLastSelectedNetwork "+netId);lastUserSelectedNetworkId=netId;lastUserSelectedNetworkTimeStamp=Date.now();updateNetworkSelectionStatus(netId,WifiConstants.NETWORK_SELECTION_ENABLE,callback);}
function isLastSelectedNetwork(netId){return lastUserSelectedNetworkId===netId;}
function tryEnableQualifiedNetwork(configuredNetworks){for(let i in configuredNetworks){if(isNetworkTemporaryDisabled(configuredNetworks[i])){let timeDiff=(Date.now()-configuredNetworks[i].disableTime)/1000/60;if(timeDiff<0||timeDiff>=NETWORK_SELECTION_DISABLE_TIMEOUT[configuredNetworks[i].networkSelectionDisableReason]){updateNetworkSelectionStatus(configuredNetworks[i].netId,WifiConstants.NETWORK_SELECTION_ENABLE,function(){});}}}}
function setEverConnected(config,everConnected){let networkKey=WifiConfigUtils.getNetworkKey(config);if(networkKey in configuredNetworks){configuredNetworks[networkKey].hasEverConnected=everConnected;}}
function getNetworkId(config){if(config==null){return WifiConstants.INVALID_NETWORK_ID;}
let networkKey=WifiConfigUtils.getNetworkKey(config);return networkKey in configuredNetworks?configuredNetworks[networkKey].netId:WifiConstants.INVALID_NETWORK_ID;}
function getNetworkConfiguration(netId){if(netId===WifiConstants.INVALID_NETWORK_ID){return null;}

for(let net in configuredNetworks){if(netId==configuredNetworks[net].netId){return configuredNetworks[net];}}
return null;}
function fetchNetworkConfiguration(config,callback){let network=getNetworkConfiguration(config.netId);if(network==null){callback(null);return;}
for(let field in network){if(config[field]){continue;}
config[field]=network[field];}
callback(config);}
function getHiddenNetworks(){let networks=[];for(let i in configuredNetworks){if(configuredNetworks[i].scanSsid){networks.push(configuredNetworks[i].ssid);}}
return networks;}
function addOrUpdateNetwork(config,callback){if(config==null){callback(false);return;}
let networkKey=WifiConfigUtils.getNetworkKey(config);if(networkKey in configuredNetworks){ let existConfig=configuredNetworks[networkKey];for(let field in config){if(config[field]){existConfig[field]=config[field];}}}else{if(config.netId!==WifiConstants.INVALID_NETWORK_ID){debug("Network id is exist");} 
config.netId=useNetworkId;useNetworkId=useNetworkId+1;configuredNetworks[networkKey]=config;}
saveToStore(callback);}
function removeNetwork(networkId,callback){if(networkId===WifiConstants.INVALID_NETWORK_ID){debug("Trying to remove network by invalid network ID");callback(false);return;}
for(let networkKey in configuredNetworks){if(configuredNetworks[networkKey].netId===networkId){delete configuredNetworks[networkKey];saveToStore(callback);return;}}
debug("Network "+networkId+" is not in the list");callback(false);}
function clearCurrentConfigBssid(netId,callback){let network=getNetworkConfiguration(netId);if(network==null){callback(false);return;}
let networkKey=WifiConfigUtils.getNetworkKey(network);if(networkKey in configuredNetworks){configuredNetworks[networkKey].bssid=WifiConstants.SUPPLICANT_BSSID_ANY;saveToStore(callback);return;}
callback(false);}
function loadFromStore(){let wifiConfig=WifiConfigStore.read(WifiConfigStore.WIFI_CONFIG_PATH);if(wifiConfig){for(let i in wifiConfig){let config=wifiConfig[i];let networkKey=WifiConfigUtils.getNetworkKey(config);config.netId=useNetworkId++;configuredNetworks[networkKey]=config;}}}
function saveToStore(callback){WifiConfigStore.write(WifiConfigStore.WIFI_CONFIG_PATH,configuredNetworks,callback);}
return configManager;})();