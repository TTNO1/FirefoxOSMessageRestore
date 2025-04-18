"use strict";var EXPORTED_SYMBOLS=["AddonUpdateChecker"];const TIMEOUT=60*1000;const TOOLKIT_ID="toolkit@mozilla.org";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"AddonManager","resource://gre/modules/AddonManager.jsm");ChromeUtils.defineModuleGetter(this,"AddonManagerPrivate","resource://gre/modules/AddonManager.jsm");ChromeUtils.defineModuleGetter(this,"Blocklist","resource://gre/modules/Blocklist.jsm");ChromeUtils.defineModuleGetter(this,"CertUtils","resource://gre/modules/CertUtils.jsm");ChromeUtils.defineModuleGetter(this,"ServiceRequest","resource://gre/modules/ServiceRequest.jsm");ChromeUtils.defineModuleGetter(this,"AddonSettings","resource://gre/modules/addons/AddonSettings.jsm");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const LOGGER_ID="addons.update-checker";
var logger=Log.repository.getLogger(LOGGER_ID);const updateTypeHistogram=Services.telemetry.getHistogramById("EXTENSION_UPDATE_TYPE");function sanitizeUpdateURL(aUpdate,aRequest,aHashPattern,aHashString){if(aUpdate.updateURL){let scriptSecurity=Services.scriptSecurityManager;let principal=scriptSecurity.getChannelURIPrincipal(aRequest.channel);try{ scriptSecurity.checkLoadURIStrWithPrincipal(principal,aUpdate.updateURL,scriptSecurity.DISALLOW_SCRIPT);}catch(e){delete aUpdate.updateURL;return;}
if(AddonManager.checkUpdateSecurity&&!aUpdate.updateURL.startsWith("https:")&&!aHashPattern.test(aUpdate.updateHash)){logger.warn(`Update link ${aUpdate.updateURL} is not secure and is not verified `+`by a strong enough hash (needs to be ${aHashString}).`);delete aUpdate.updateURL;delete aUpdate.updateHash;}}}
function parseJSONManifest(aId,aRequest,aManifestData){let TYPE_CHECK={array:val=>Array.isArray(val),object:val=>val&&typeof val=="object"&&!Array.isArray(val),};function getProperty(aObj,aProperty,aType,aDefault=undefined){if(!(aProperty in aObj)){return aDefault;}
let value=aObj[aProperty];let matchesType=aType in TYPE_CHECK?TYPE_CHECK[aType](value):typeof value==aType;if(!matchesType){throw Components.Exception(`Update manifest property '${aProperty}' has incorrect type (expected ${aType})`);}
return value;}
function getRequiredProperty(aObj,aProperty,aType){let value=getProperty(aObj,aProperty,aType);if(value===undefined){throw Components.Exception(`Update manifest is missing a required ${aProperty} property.`);}
return value;}
let manifest=aManifestData;if(!TYPE_CHECK.object(manifest)){throw Components.Exception("Root element of update manifest must be a JSON object literal");} 
let addons=getRequiredProperty(manifest,"addons","object"); let addon=getProperty(addons,aId,"object");
 if(!addon){logger.warn("Update manifest did not contain an entry for "+aId);return[];} 
let updates=getProperty(addon,"updates","array",[]);let results=[];for(let update of updates){let version=getRequiredProperty(update,"version","string");logger.debug(`Found an update entry for ${aId} version ${version}`);let applications=getProperty(update,"applications","object",{gecko:{},});
if(!("gecko"in applications)){logger.debug("gecko not in application entry, skipping update of ${addon}");continue;}
let app=getProperty(applications,"gecko","object");let appEntry={id:TOOLKIT_ID,minVersion:getProperty(app,"strict_min_version","string",AddonManagerPrivate.webExtensionsMinPlatformVersion),maxVersion:"*",};let result={id:aId,version,updateURL:getProperty(update,"update_link","string"),updateHash:getProperty(update,"update_hash","string"),updateInfoURL:getProperty(update,"update_info_url","string"),strictCompatibility:false,targetApplications:[appEntry],};if("strict_max_version"in app){if("advisory_max_version"in app){logger.warn("Ignoring 'advisory_max_version' update manifest property for "+
aId+" property since 'strict_max_version' also present");}
appEntry.maxVersion=getProperty(app,"strict_max_version","string");result.strictCompatibility=appEntry.maxVersion!="*";}else if("advisory_max_version"in app){appEntry.maxVersion=getProperty(app,"advisory_max_version","string");}




result.targetApplications.push(Object.assign({},appEntry,{id:Services.appinfo.ID}));
sanitizeUpdateURL(result,aRequest,/^sha(256|512):/,"sha256 or sha512");results.push(result);}
return results;}
function UpdateParser(aId,aUrl,aObserver){this.id=aId;this.observer=aObserver;this.url=aUrl;logger.debug("Requesting "+aUrl);try{this.request=new ServiceRequest({mozAnon:true});this.request.open("GET",this.url,true);this.request.channel.notificationCallbacks=new CertUtils.BadCertHandler(!AddonSettings.UPDATE_REQUIREBUILTINCERTS);this.request.channel.loadFlags|=Ci.nsIRequest.LOAD_BYPASS_CACHE;this.request.channel.loadFlags|=Ci.nsIRequest.INHIBIT_CACHING;this.request.overrideMimeType("text/plain");this.request.timeout=TIMEOUT;this.request.addEventListener("load",()=>this.onLoad());this.request.addEventListener("error",()=>this.onError());this.request.addEventListener("timeout",()=>this.onTimeout());this.request.send(null);}catch(e){logger.error("Failed to request update manifest",e);}}
UpdateParser.prototype={id:null,observer:null,request:null,url:null,onLoad(){let request=this.request;this.request=null;this._doneAt=new Error("place holder");try{CertUtils.checkCert(request.channel,!AddonSettings.UPDATE_REQUIREBUILTINCERTS);}catch(e){logger.warn("Request failed: "+this.url+" - "+e);this.notifyError(AddonManager.ERROR_DOWNLOAD_ERROR);return;}
if(!Components.isSuccessCode(request.status)){logger.warn("Request failed: "+this.url+" - "+request.status);this.notifyError(AddonManager.ERROR_DOWNLOAD_ERROR);return;}
let channel=request.channel;if(channel instanceof Ci.nsIHttpChannel&&!channel.requestSucceeded){logger.warn("Request failed: "+
this.url+" - "+
channel.responseStatus+": "+
channel.responseStatusText);this.notifyError(AddonManager.ERROR_DOWNLOAD_ERROR);return;}
let results;try{let json=JSON.parse(request.responseText);results=parseJSONManifest(this.id,request,json);updateTypeHistogram.add("JSON");}catch(e){logger.warn("onUpdateCheckComplete failed to parse update manifest",e);this.notifyError(AddonManager.ERROR_PARSE_ERROR);return;}
if("onUpdateCheckComplete"in this.observer){try{this.observer.onUpdateCheckComplete(results);}catch(e){logger.warn("onUpdateCheckComplete notification failed",e);}}else{logger.warn("onUpdateCheckComplete may not properly cancel",new Error("stack marker"));}},onTimeout(){this.request=null;this._doneAt=new Error("Timed out");logger.warn("Request for "+this.url+" timed out");this.notifyError(AddonManager.ERROR_TIMEOUT);},onError(){if(!Components.isSuccessCode(this.request.status)){logger.warn("Request failed: "+this.url+" - "+this.request.status);}else if(this.request.channel instanceof Ci.nsIHttpChannel){try{if(this.request.channel.requestSucceeded){logger.warn("Request failed: "+
this.url+" - "+
this.request.channel.responseStatus+": "+
this.request.channel.responseStatusText);}}catch(e){logger.warn("HTTP Request failed for an unknown reason");}}else{logger.warn("Request failed for an unknown reason");}
this.request=null;this._doneAt=new Error("UP_onError");this.notifyError(AddonManager.ERROR_DOWNLOAD_ERROR);},notifyError(aStatus){if("onUpdateCheckError"in this.observer){try{this.observer.onUpdateCheckError(aStatus);}catch(e){logger.warn("onUpdateCheckError notification failed",e);}}},cancel(){if(!this.request){logger.error("Trying to cancel already-complete request",this._doneAt);return;}
this.request.abort();this.request=null;this._doneAt=new Error("UP_cancel");this.notifyError(AddonManager.ERROR_CANCELLED);},};function matchesVersions(aUpdate,aAppVersion,aPlatformVersion,aIgnoreMaxVersion,aIgnoreStrictCompat){if(aUpdate.strictCompatibility&&!aIgnoreStrictCompat){aIgnoreMaxVersion=false;}
let result=false;for(let app of aUpdate.targetApplications){if(app.id==Services.appinfo.ID){return(Services.vc.compare(aAppVersion,app.minVersion)>=0&&(aIgnoreMaxVersion||Services.vc.compare(aAppVersion,app.maxVersion)<=0));}
if(app.id==TOOLKIT_ID){result=Services.vc.compare(aPlatformVersion,app.minVersion)>=0&&(aIgnoreMaxVersion||Services.vc.compare(aPlatformVersion,app.maxVersion)<=0);}}
return result;}
var AddonUpdateChecker={getCompatibilityUpdate(aUpdates,aVersion,aIgnoreCompatibility,aAppVersion,aPlatformVersion,aIgnoreMaxVersion,aIgnoreStrictCompat){if(!aAppVersion){aAppVersion=Services.appinfo.version;}
if(!aPlatformVersion){aPlatformVersion=Services.appinfo.platformVersion;}
for(let update of aUpdates){if(Services.vc.compare(update.version,aVersion)==0){if(aIgnoreCompatibility){for(let targetApp of update.targetApplications){let id=targetApp.id;if(id==Services.appinfo.ID||id==TOOLKIT_ID){return update;}}}else if(matchesVersions(update,aAppVersion,aPlatformVersion,aIgnoreMaxVersion,aIgnoreStrictCompat)){return update;}}}
return null;},async getNewestCompatibleUpdate(aUpdates,aAppVersion,aPlatformVersion,aIgnoreMaxVersion,aIgnoreStrictCompat){if(!aAppVersion){aAppVersion=Services.appinfo.version;}
if(!aPlatformVersion){aPlatformVersion=Services.appinfo.platformVersion;}
let newest=null;for(let update of aUpdates){if(!update.updateURL){continue;}
let state=await Blocklist.getAddonBlocklistState(update,aAppVersion,aPlatformVersion);if(state!=Ci.nsIBlocklistService.STATE_NOT_BLOCKED){continue;}
if((newest==null||Services.vc.compare(newest.version,update.version)<0)&&matchesVersions(update,aAppVersion,aPlatformVersion,aIgnoreMaxVersion,aIgnoreStrictCompat)){newest=update;}}
return newest;},checkForUpdates(aId,aUrl,aObserver){return new UpdateParser(aId,aUrl,aObserver);},};