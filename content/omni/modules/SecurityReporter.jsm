//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const protocolHandler=Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler);const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["fetch"]);const TLS_ERROR_REPORT_TELEMETRY_SUCCESS=6;const TLS_ERROR_REPORT_TELEMETRY_FAILURE=7;const HISTOGRAM_ID="TLS_ERROR_REPORT_UI";ChromeUtils.defineModuleGetter(this,"UpdateUtils","resource://gre/modules/UpdateUtils.jsm");function SecurityReporter(){}
SecurityReporter.prototype={QueryInterface:ChromeUtils.generateQI(["nsISecurityReporter"]),reportTLSError(transportSecurityInfo,hostname,port){
if(!transportSecurityInfo){return;} 
if(!Services.prefs.getBoolPref("security.ssl.errorReporting.enabled")){return;}

let endpoint=Services.prefs.getCharPref("security.ssl.errorReporting.url");let reportURI=Services.io.newURI(endpoint);if(reportURI.host==hostname){return;}
 
let asciiCertChain=[];if(transportSecurityInfo.failedCertChain){for(let cert of transportSecurityInfo.failedCertChain){asciiCertChain.push(cert.getBase64DERString());}}
let report={hostname,port,timestamp:Math.round(Date.now()/1000),errorCode:transportSecurityInfo.errorCode,failedCertChain:asciiCertChain,userAgent:protocolHandler.userAgent,version:1,build:Services.appinfo.appBuildID,product:Services.appinfo.name,channel:UpdateUtils.UpdateChannel,};fetch(endpoint,{method:"POST",body:JSON.stringify(report),credentials:"omit",headers:{"Content-Type":"application/json",},}).then(function(aResponse){if(!aResponse.ok){ Services.telemetry.getHistogramById(HISTOGRAM_ID).add(TLS_ERROR_REPORT_TELEMETRY_FAILURE);}else{Services.telemetry.getHistogramById(HISTOGRAM_ID).add(TLS_ERROR_REPORT_TELEMETRY_SUCCESS);}}).catch(function(e){ Services.telemetry.getHistogramById(HISTOGRAM_ID).add(TLS_ERROR_REPORT_TELEMETRY_FAILURE);});},};var EXPORTED_SYMBOLS=["SecurityReporter"];