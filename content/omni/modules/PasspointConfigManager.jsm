//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{WifiConfigStore}=ChromeUtils.import("resource://gre/modules/WifiConfigStore.jsm");const{PasspointProvider}=ChromeUtils.import("resource://gre/modules/PasspointConfiguration.jsm");this.EXPORTED_SYMBOLS=["PasspointConfigManager"];var gDebug=false;this.PasspointConfigManager=(function(){var passpointConfigManager={};var providers=Object.create(null);var providerId=0;passpointConfigManager.providers=providers;passpointConfigManager.addOrUpdateProvider=addOrUpdateProvider;passpointConfigManager.removeProvider=removeProvider;passpointConfigManager.loadFromStore=loadFromStore;passpointConfigManager.saveToStore=saveToStore;passpointConfigManager.setDebug=setDebug;function setDebug(aDebug){gDebug=aDebug;}
function debug(aMsg){if(gDebug){dump("-*- PasspointConfigManager: "+aMsg);}}
function addOrUpdateProvider(provider,callback){if(!provider){debug("Invalid provider");callback(false);return;}
let key=provider.passpointConfig.homeSp.fqdn; if(key in providers){delete providers[key];}
provider.providerId=providerId;providerId++;providers[key]=provider;saveToStore(callback);}
function removeProvider(fqdn,callback){if(!fqdn){callback(false);return;}
if(fqdn in providers){delete providers[fqdn];saveToStore(callback);return;}
debug("Provider "+fqdn+" is not in the list");callback(false);}
function loadFromStore(){let savedProviders=WifiConfigStore.read(WifiConfigStore.PASSPOINT_CONFIG_PATH);if(savedProviders){for(let key in savedProviders){let savedProvider=savedProviders[key];if(savedProvider.passpointConfig&&savedProvider.passpointConfig.homeSp.fqdn){let savedConfig=savedProvider.passpointConfig;let provider=new PasspointProvider(savedConfig);providers[savedConfig.homeSp.fqdn]=provider;}}}
debug("Current providers: "+JSON.stringify(providers));}
function saveToStore(callback){WifiConfigStore.write(WifiConfigStore.PASSPOINT_CONFIG_PATH,providers,callback);}
return passpointConfigManager;})();