//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AnqpCache}=ChromeUtils.import("resource://gre/modules/AnqpUtils.jsm");const{WifiConfigUtils}=ChromeUtils.import("resource://gre/modules/WifiConfiguration.jsm");const{WifiConstants}=ChromeUtils.import("resource://gre/modules/WifiConstants.jsm");const{PasspointConfigManager}=ChromeUtils.import("resource://gre/modules/PasspointConfigManager.jsm");const{PasspointProvider,PasspointConfig}=ChromeUtils.import("resource://gre/modules/PasspointConfiguration.jsm");this.EXPORTED_SYMBOLS=["PasspointManager"];var gDebug=false;this.PasspointManager=(function(){var passpointManager={};var passpointEnabled=false;var mAnqpCache=new AnqpCache();var mWifiManager=null;passpointManager.passpointEnabled=passpointEnabled;passpointManager.setDebug=setDebug;passpointManager.setWifiManager=setWifiManager;passpointManager.isPasspointSupported=isPasspointSupported;passpointManager.isProviderEmpty=isProviderEmpty;passpointManager.onANQPResponse=onANQPResponse;passpointManager.sweepCache=sweepCache;passpointManager.matchProvider=matchProvider;passpointManager.hasCarrierProvider=hasCarrierProvider;passpointManager.getAnqpElements=getAnqpElements;passpointManager.setConfiguration=setConfiguration;passpointManager.getConfigurations=getConfigurations;passpointManager.removeConfiguration=removeConfiguration;passpointManager.loadFromStore=loadFromStore;function debug(aMsg){if(gDebug){dump("-*- PasspointManager: "+aMsg);}}
function setDebug(aDebug){gDebug=aDebug;if(PasspointConfigManager){PasspointConfigManager.setDebug(aDebug);}}
function setWifiManager(manager){mWifiManager=manager;}
function isPasspointSupported(){return Services.prefs.getBoolPref("dom.passpoint.supported",false);}
function isProviderEmpty(){return!PasspointConfigManager.providers;}
function onANQPResponse(anqpNetworkKey,response){if(!anqpNetworkKey||!response){return;}
mAnqpCache.addEntry(anqpNetworkKey,response);if(gDebug){mAnqpCache.getEntry(anqpNetworkKey).dumpAnqpElements();}}
function sweepCache(){mAnqpCache.sweep();}
function matchProvider(scanResult){let bestMatch=null;let allMatches=getAllMatchedProviders(scanResult);if(allMatches.length==0){return null;}
for(let match of allMatches){if(match.matchStatus==WifiConstants.PasspointMatch.HomeProvider){bestMatch=match;break;}
if(match.matchStatus==WifiConstants.PasspointMatch.RoamingProvider&&bestMatch==null){bestMatch=match;}}
if(bestMatch!=null){debug("Matched "+scanResult.ssid+" by "+JSON.stringify(bestMatch));}else{debug("No service provider found for "+scanResult.ssid);}
return bestMatch;}
function getAllMatchedProviders(scanResult){let allMatches=[];let anqpNetworkKey=WifiConfigUtils.getAnqpNetworkKey(scanResult);let anqpData=mAnqpCache.getEntry(anqpNetworkKey);if(!anqpData){let request={anqpKey:anqpNetworkKey,bssid:scanResult.bssid,roamingConsortiumOIs:scanResult.passpoint.anqpOICount>0,supportRelease2:scanResult.passpoint.anqpDomainID>WifiConstants.PasspointVersion.R1,};if(mWifiManager){mWifiManager.requestAnqp(request,success=>{debug("getAllMatchedProviders, request ANQP "+
(success?"success":"failed"));});}
return allMatches;}
let providers=PasspointConfigManager.providers;for(let key in providers){let provider=providers[key];let matchStatus=provider.match(anqpData.getElements(),scanResult.passpoint.roamingConsortiums);if(matchStatus==WifiConstants.PasspointMatch.HomeProvider||matchStatus==WifiConstants.PasspointMatch.RoamingProvider){allMatches.push({provider,matchStatus});}}
return allMatches;}
function hasCarrierProvider(mccMnc,mccMncRealm){if(mccMncRealm==null){return false;}
let providers=PasspointConfigManager.providers;for(let key in providers){let provider=providers[key];if(!provider.passpointConfig.credential){continue;}
if(mccMncRealm==key){return true;}
let imsiMccMnc=provider.imsi;if(!imsiMccMnc){continue;}
imsiMccMnc.replace("*","");if(mccMnc==imsiMccMnc){return true;}}
return false;}
function getAnqpElements(scanResult){let anqpNetworkKey=WifiConfigUtils.getAnqpNetworkKey(scanResult);let anqpData=mAnqpCache.getEntry(anqpNetworkKey);return anqpData?anqpData.getElements():null;}
function setConfiguration(passpointConfig,callback){let config=new PasspointConfig(passpointConfig);if(!config.homeSp.fqdn){debug("Invalid passpoint configuration");callback(false);return;}
let provider=new PasspointProvider(config);PasspointConfigManager.addOrUpdateProvider(provider,callback);}
function getConfigurations(){let configs=[];let providers=PasspointConfigManager.providers;for(let key in providers){let provider=providers[key];if(provider.passpointConfig){configs.push(new PasspointConfig(provider.passpointConfig));}}
return configs;}
function removeConfiguration(fqdn,callback){PasspointConfigManager.removeProvider(fqdn,callback);}
function loadFromStore(){PasspointConfigManager.loadFromStore();}
return passpointManager;})();