//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyModuleGetters(this,{clearTimeout:"resource://gre/modules/Timer.jsm",LocationHelper:"resource://gre/modules/LocationHelper.jsm",setTimeout:"resource://gre/modules/Timer.jsm",});XPCOMUtils.defineLazyGlobalGetters(this,["fetch"]);const POSITION_UNAVAILABLE=2;const TELEMETRY_KEY="REGION_LOCATION_SERVICES_DIFFERENCE";XPCOMUtils.defineLazyPreferenceGetter(this,"gLoggingEnabled","geo.provider.network.logging.enabled",false);function LOG(aMsg){if(gLoggingEnabled){dump("*** WIFI GEO: "+aMsg+"\n");}}
function CachedRequest(loc,cellInfo,wifiList){this.location=loc;let wifis=new Set();if(wifiList){for(let i=0;i<wifiList.length;i++){wifis.add(wifiList[i].macAddress);}}

function makeCellKey(cell){return(""+
cell.radio+":"+
cell.mobileCountryCode+":"+
cell.mobileNetworkCode+":"+
cell.locationAreaCode+":"+
cell.cellId);}
let cells=new Set();if(cellInfo){for(let i=0;i<cellInfo.length;i++){cells.add(makeCellKey(cellInfo[i]));}}
this.hasCells=()=>cells.size>0;this.hasWifis=()=>wifis.size>0; this.isCellEqual=function(cellInfo){if(!this.hasCells()){return false;}
let len1=cells.size;let len2=cellInfo.length;if(len1!=len2){LOG("cells not equal len");return false;}
for(let i=0;i<len2;i++){if(!cells.has(makeCellKey(cellInfo[i]))){return false;}}
return true;}; this.isWifiApproxEqual=function(wifiList){if(!this.hasWifis()){return false;} 
let common=0;for(let i=0;i<wifiList.length;i++){if(wifis.has(wifiList[i].macAddress)){common++;}}
let kPercentMatch=0.5;return common>=Math.max(wifis.size,wifiList.length)*kPercentMatch;};this.isGeoip=function(){return!this.hasCells()&&!this.hasWifis();};this.isCellAndWifi=function(){return this.hasCells()&&this.hasWifis();};this.isCellOnly=function(){return this.hasCells()&&!this.hasWifis();};this.isWifiOnly=function(){return this.hasWifis()&&!this.hasCells();};}
var gCachedRequest=null;var gDebugCacheReasoning="";





function isCachedRequestMoreAccurateThanServerRequest(newCell,newWifiList){gDebugCacheReasoning="";let isNetworkRequestCacheEnabled=true;try{ isNetworkRequestCacheEnabled=Services.prefs.getBoolPref("geo.provider.network.debug.requestCache.enabled");if(!isNetworkRequestCacheEnabled){gCachedRequest=null;}}catch(e){}
if(!gCachedRequest||!isNetworkRequestCacheEnabled){gDebugCacheReasoning="No cached data";return false;}
if(!newCell&&!newWifiList){gDebugCacheReasoning="New req. is GeoIP.";return true;}
if(newCell&&newWifiList&&(gCachedRequest.isCellOnly()||gCachedRequest.isWifiOnly())){gDebugCacheReasoning="New req. is cell+wifi, cache only cell or wifi.";return false;}
if(newCell&&gCachedRequest.isWifiOnly()){
 var isHighAccuracyWifi=gCachedRequest.location.coords.accuracy<5000;gDebugCacheReasoning="Req. is cell, cache is wifi, isHigh:"+isHighAccuracyWifi;return isHighAccuracyWifi;}
let hasEqualCells=false;if(newCell){hasEqualCells=gCachedRequest.isCellEqual(newCell);}
let hasEqualWifis=false;if(newWifiList){hasEqualWifis=gCachedRequest.isWifiApproxEqual(newWifiList);}
gDebugCacheReasoning="EqualCells:"+hasEqualCells+" EqualWifis:"+hasEqualWifis;if(gCachedRequest.isCellOnly()){gDebugCacheReasoning+=", Cell only.";if(hasEqualCells){return true;}}else if(gCachedRequest.isWifiOnly()&&hasEqualWifis){gDebugCacheReasoning+=", Wifi only.";return true;}else if(gCachedRequest.isCellAndWifi()){gDebugCacheReasoning+=", Cache has Cell+Wifi.";if((hasEqualCells&&hasEqualWifis)||(!newWifiList&&hasEqualCells)||(!newCell&&hasEqualWifis)){return true;}}
return false;}
function NetworkGeoCoordsObject(lat,lon,acc){this.latitude=lat;this.longitude=lon;this.accuracy=acc;

this.altitude=NaN;this.altitudeAccuracy=NaN;this.heading=NaN;this.speed=NaN;}
NetworkGeoCoordsObject.prototype={QueryInterface:ChromeUtils.generateQI(["nsIDOMGeoPositionCoords"]),};function NetworkGeoPositionObject(lat,lng,acc){this.coords=new NetworkGeoCoordsObject(lat,lng,acc);this.address=null;this.timestamp=Date.now();}
NetworkGeoPositionObject.prototype={QueryInterface:ChromeUtils.generateQI(["nsIDOMGeoPosition"]),};function NetworkGeolocationProvider(){XPCOMUtils.defineLazyPreferenceGetter(this,"_wifiMonitorTimeout","geo.provider.network.timeToWaitBeforeSending",5000);XPCOMUtils.defineLazyPreferenceGetter(this,"_wifiScanningEnabled","geo.provider.network.scan",true);XPCOMUtils.defineLazyPreferenceGetter(this,"_wifiCompareURL","geo.provider.network.compare.url",null);this.wifiService=null;this.timer=null;this.started=false;}
NetworkGeolocationProvider.prototype={classID:Components.ID("{77DA64D3-7458-4920-9491-86CC9914F904}"),QueryInterface:ChromeUtils.generateQI(["nsIGeolocationProvider","nsIWifiListener","nsITimerCallback","nsIObserver",]),listener:null,get isWifiScanningEnabled(){return Cc["@mozilla.org/wifi/monitor;1"]&&this._wifiScanningEnabled;},resetTimer(){if(this.timer){this.timer.cancel();this.timer=null;}
this.timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this.timer.initWithCallback(this,this._wifiMonitorTimeout,this.timer.TYPE_REPEATING_SLACK);},startup(){if(this.started){return;}
this.started=true;if(this.isWifiScanningEnabled){if(this.wifiService){this.wifiService.stopWatching(this);}
this.wifiService=Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);this.wifiService.startWatching(this);}
this.resetTimer();LOG("startup called.");},watch(c){this.listener=c;},shutdown(){LOG("shutdown called");if(!this.started){return;}
 
gCachedRequest=null;if(this.timer){this.timer.cancel();this.timer=null;}
if(this.wifiService){this.wifiService.stopWatching(this);this.wifiService=null;}
this.listener=null;this.started=false;},setHighAccuracy(enable){},onChange(accessPoints){this.resetTimer();let wifiData=null;if(accessPoints){wifiData=LocationHelper.formatWifiAccessPoints(accessPoints);}
this.sendLocationRequest(wifiData);},onError(code){LOG("wifi error: "+code);this.sendLocationRequest(null);},onStatus(err,statusMessage){if(!this.listener){return;}
LOG("onStatus called."+statusMessage);if(statusMessage&&this.listener.notifyStatus){this.listener.notifyStatus(statusMessage);}
if(err&&this.listener.notifyError){this.listener.notifyError(POSITION_UNAVAILABLE,statusMessage);}},notify(timer){this.onStatus(false,"wifi-timeout");this.sendLocationRequest(null);},async sendLocationRequest(wifiData){let data={cellTowers:undefined,wifiAccessPoints:undefined};if(wifiData&&wifiData.length>=2){data.wifiAccessPoints=wifiData;}
let useCached=isCachedRequestMoreAccurateThanServerRequest(data.cellTowers,data.wifiAccessPoints);LOG("Use request cache:"+useCached+" reason:"+gDebugCacheReasoning);if(useCached){gCachedRequest.location.timestamp=Date.now();if(this.listener){this.listener.update(gCachedRequest.location);}
return;}
let url=Services.urlFormatter.formatURLPref("geo.provider.network.url");LOG("Sending request");let result;try{result=await this.makeRequest(url,wifiData);LOG(`geo provider reported: ${result.location.lng}:${result.location.lat}`);let newLocation=new NetworkGeoPositionObject(result.location.lat,result.location.lng,result.accuracy);if(this.listener){this.listener.update(newLocation);}
gCachedRequest=new CachedRequest(newLocation,data.cellTowers,data.wifiAccessPoints);}catch(err){LOG("Location request hit error: "+err.name);Cu.reportError(err);if(err.name=="AbortError"){this.onStatus(true,"xhr-timeout");}else{this.onStatus(true,"xhr-error");}}
if(!this._wifiCompareURL){return;}
let compareUrl=Services.urlFormatter.formatURL(this._wifiCompareURL);let compare=await this.makeRequest(compareUrl,wifiData);let distance=LocationHelper.distance(result.location,compare.location);LOG(`compare reported reported: ${compare.location.lng}:${compare.location.lat}`);LOG(`distance between results: ${distance}`);if(!isNaN(distance)){Services.telemetry.getHistogramById(TELEMETRY_KEY).add(distance);}},async makeRequest(url,wifiData){this.onStatus(false,"xhr-start");let fetchController=new AbortController();let fetchOpts={method:"POST",headers:{"Content-Type":"application/json; charset=UTF-8"},credentials:"omit",signal:fetchController.signal,};if(wifiData){fetchOpts.body=JSON.stringify({wifiAccessPoints:wifiData});}
let timeoutId=setTimeout(()=>fetchController.abort(),Services.prefs.getIntPref("geo.provider.network.timeout"));let req=await fetch(url,fetchOpts);clearTimeout(timeoutId);let result=req.json();return result;},};var EXPORTED_SYMBOLS=["NetworkGeolocationProvider"];