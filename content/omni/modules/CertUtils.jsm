//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["CertUtils"];const Ce=Components.Exception;const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function readCertPrefs(aPrefBranch){if(!Services.prefs.getBranch(aPrefBranch).getChildList("").length){return null;}
let certs=[];let counter=1;while(true){let prefBranchCert=Services.prefs.getBranch(aPrefBranch+counter+".");let prefCertAttrs=prefBranchCert.getChildList("");if(!prefCertAttrs.length){break;}
let certAttrs={};for(let prefCertAttr of prefCertAttrs){certAttrs[prefCertAttr]=prefBranchCert.getCharPref(prefCertAttr);}
certs.push(certAttrs);counter++;}
return certs;}
function validateCert(aCertificate,aCerts){ if(!aCerts||!aCerts.length){return;}
if(!aCertificate){const missingCertErr="A required certificate was not present.";Cu.reportError(missingCertErr);throw new Ce(missingCertErr,Cr.NS_ERROR_ILLEGAL_VALUE);}
var errors=[];for(var i=0;i<aCerts.length;++i){var error=false;var certAttrs=aCerts[i];for(var name in certAttrs){if(!(name in aCertificate)){error=true;errors.push("Expected attribute '"+name+"' not present in certificate.");break;}
if(aCertificate[name]!=certAttrs[name]){error=true;errors.push("Expected certificate attribute '"+
name+"' "+"value incorrect, expected: '"+
certAttrs[name]+"', got: '"+
aCertificate[name]+"'.");break;}}
if(!error){break;}}
if(error){errors.forEach(Cu.reportError.bind(Cu));const certCheckErr="Certificate checks failed. See previous errors for details.";Cu.reportError(certCheckErr);throw new Ce(certCheckErr,Cr.NS_ERROR_ILLEGAL_VALUE);}}
function checkCert(aChannel,aAllowNonBuiltInCerts,aCerts){if(!aChannel.originalURI.schemeIs("https")){ if(aCerts){throw new Ce("SSL is required and URI scheme is not https.",Cr.NS_ERROR_UNEXPECTED);}
return;}
let secInfo=aChannel.securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);let cert=secInfo.serverCert;validateCert(cert,aCerts);if(aAllowNonBuiltInCerts===true){return;}
let issuerCert=null;if(secInfo.succeededCertChain.length){issuerCert=secInfo.succeededCertChain[secInfo.succeededCertChain.length-1];}
const certNotBuiltInErr="Certificate issuer is not built-in.";if(!issuerCert){throw new Ce(certNotBuiltInErr,Cr.NS_ERROR_ABORT);}
if(!issuerCert.isBuiltInRoot){throw new Ce(certNotBuiltInErr,Cr.NS_ERROR_ABORT);}}
function BadCertHandler(aAllowNonBuiltInCerts){this.allowNonBuiltInCerts=aAllowNonBuiltInCerts;}
BadCertHandler.prototype={ asyncOnChannelRedirect(oldChannel,newChannel,flags,callback){if(this.allowNonBuiltInCerts){callback.onRedirectVerifyCallback(Cr.NS_OK);return;}

if(!(flags&Ci.nsIChannelEventSink.REDIRECT_INTERNAL)){checkCert(oldChannel);}
callback.onRedirectVerifyCallback(Cr.NS_OK);}, getInterface(iid){return this.QueryInterface(iid);}, QueryInterface:ChromeUtils.generateQI(["nsIChannelEventSink","nsIInterfaceRequestor",]),};var CertUtils={BadCertHandler,checkCert,readCertPrefs,validateCert,};