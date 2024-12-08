//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["AnqpCache","AnqpData","AnqpMatcher"];const CACHE_SWEEP_INTERVAL_MILLISECONDS=60*1000;const DATA_LIFETIME_MILLISECONDS=60*60*1000;var gDebug=true;function debug(aMsg){if(gDebug){dump("-*- ANQP: "+aMsg);}}
this.AnqpData=function(anqpElements){if(anqpElements){this._anqpElements=anqpElements;}
this._expiredTime=Date.now()+DATA_LIFETIME_MILLISECONDS;};this.AnqpData.prototype={_anqpElements:null,_expiredTime:0,getElements(){return this._anqpElements;},isExpired(time){return this._expiredTime<=time;},dumpAnqpElements(){let elements=this._anqpElements;debug("bssid: "+
elements.bssid+", IP availability"+
JSON.stringify(elements.ipAvailability)+", WAN Metrics"+
JSON.stringify(elements.hsWanMetrics));debug("Venue name: "+JSON.stringify(elements.getVenueName()));debug("Roaming consortium OIs: "+
JSON.stringify(elements.getRoamingConsortiumOIs()));for(let nai of elements.getNaiRealmList()){debug("Realms: "+JSON.stringify(nai.getRealms()));for(let eapMethod of nai.getEapMethods()){debug("EAP method ID: "+eapMethod.eapMethodId);let authParams=eapMethod.authParams;if(authParams){debug("Auth ID: "+
JSON.stringify(authParams.getAuthTypeId())+", Expanded EAP method: "+
JSON.stringify(authParams.getExpandedEapMethod())+", Non EAP Inner auth: "+
JSON.stringify(authParams.getNonEapInnerAuth())+", Inner Auth: "+
JSON.stringify(authParams.getInnerAuth())+", Expanded Inner EAP method: "+
JSON.stringify(authParams.getExpandedInnerEapMethod())+", Credential: "+
JSON.stringify(authParams.getCredential())+", Tunneled Credential: "+
JSON.stringify(authParams.getTunneledCredential())+", Vendor Specific Auth: "+
JSON.stringify(authParams.getVendorSpecificAuth()));}}}
for(let item of elements.getCellularNetwork()){debug("Plmns: "+JSON.stringify(item.getPlmnList()));}
debug("Domain: "+JSON.stringify(elements.getDomainName()));debug("ConnectionCaps: "+JSON.stringify(elements.getConnectionCapability()));let osuProviders=elements.hsOsuProviders;if(osuProviders){debug("OSU ssid: "+osuProviders.osuSsid);for(let provider of osuProviders.getProviders()){debug("Provider server URI: "+provider.serverUri);debug("Provider NAI: "+provider.networkAccessIdentifier);}}},};this.AnqpCache=function(){this._anqpCaches=new Map();this._lastSweep=Date.now();};this.AnqpCache.prototype={_anqpCaches:null,_lastSweep:0,addEntry(anqpNetworkKey,anqpElements){let data=new AnqpData(anqpElements);this._anqpCaches.set(anqpNetworkKey,data);},getEntry(anqpNetworkKey){return this._anqpCaches.get(anqpNetworkKey);},sweep(){let now=Date.now();if(now<this._lastSweep+CACHE_SWEEP_INTERVAL_MILLISECONDS){return;}
let expiredKeys=[];this._anqpCaches.forEach(function(anqpData,anqpNetworkKey,map){if(anqpData.isExpired(now)){expiredKeys.push(anqpNetworkKey);}});for(let key of expiredKeys){this._anqpCaches.delete(key);}
this._lastSweep=now;},};this.AnqpMatcher=(function(){var anqpMatcher={};const PLMNText=["org","3gppnetwork","mcc*","mnc*","wlan"];anqpMatcher.matchDomainName=matchDomainName;anqpMatcher.matchRoamingConsortium=matchRoamingConsortium;anqpMatcher.matchNAIRealm=matchNAIRealm;anqpMatcher.matchThreeGPPNetwork=matchThreeGPPNetwork;anqpMatcher.matchMccMnc=matchMccMnc;function getMccMnc(domain){if(domain.length!=PLMNText.length){return null;}
for(let i in PLMNText){let text=PLMNText[i];text.replace("*","");if(domain[i]!=text){return null;}}
let prefix=domain[2].substring(3)+domain[3].substring(3);for(let i in prefix){if(prefix.charAt(i)<"0"||prefix.charAt(i)>"9"){return null;}}
return prefix;}
function splitDomain(domain){if(domain.endsWith(".")){domain=domain.substring(0,domain.length-1);}
let at=domain.indexOf("@");if(at!==-1){domain=domain.substring(at+1);}
return domain.toLowerCase().split(".");}
function isSubDomain(domain,subDomain){if(!domain||!subDomain){return false;}
let domainList=splitDomain(domain);let subDomainList=splitDomain(subDomain);if(domainList.length<subDomainList.length){return false;}
for(let i in domainList){if(domainList[i]!=subDomainList[i]){return false;}}
return true;}
function matchDomainName(domainListElement,fqdn,imsi,simImsi){if(!domainListElement){return false;}
for(let domain of domainListElement){if(isSubDomain(fqdn,domain)){return true;}
if(!imsi||!simImsi){continue;}
if(matchMccMnc(getMccMnc(splitDomain(domain)),imsi,simImsi)){return true;}}
return false;}
function matchRoamingConsortium(roamingConsortiumElement,providerOIs,matchAll){if(!roamingConsortiumElement||!providerOIs){return false;}
for(let oi of providerOIs){if(roamingConsortiumElement.includes(oi)){if(!matchAll){return true;}}else if(matchAll){return false;}}
return matchAll;}
function matchNAIRealm(naiRealmElement,realm){if(!naiRealmElement||!naiRealmElement.length){return false;}
for(let realmData of naiRealmElement){for(let realmStr of realmData.getRealms()){if(isSubDomain(realm,realmStr)){return true;}}}
return false;}
function matchThreeGPPNetwork(threeGPPNetworkElement,imsi,simImsi){if(!threeGPPNetworkElement){return false;}
for(let network of threeGPPNetworkElement){let plmns=network.getPlmnList();for(let plmn of plmns){if(matchMccMnc(plmn,imsi,simImsi)){return true;}}}
return false;}
function matchMccMnc(mccMnc,imsiParam,simImsi){if(!mccMnc||!imsiParam||!simImsi){return false;}
imsiParam.replace("*","");if(mccMnc!=imsiParam){return false;}
return simImsi.startsWith(mccMnc);}
return anqpMatcher;})();