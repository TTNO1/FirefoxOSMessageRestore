//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["SecurityInfo"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const wpl=Ci.nsIWebProgressListener;XPCOMUtils.defineLazyServiceGetter(this,"NSSErrorsService","@mozilla.org/nss_errors_service;1","nsINSSErrorsService");XPCOMUtils.defineLazyServiceGetter(this,"sss","@mozilla.org/ssservice;1","nsISiteSecurityService");

const SecurityInfo={getSecurityInfo(channel,options={}){const info={state:"insecure",};let securityInfo=channel.securityInfo;if(!securityInfo){return info;}
securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);if(NSSErrorsService.isNSSErrorCode(securityInfo.errorCode)){info.state="broken";info.errorMessage=securityInfo.errorMessage;if(options.certificateChain&&securityInfo.failedCertChain){info.certificates=this.getCertificateChain(securityInfo.failedCertChain,options);}
return info;}
const state=securityInfo.securityState;let uri=channel.URI;if(uri&&!uri.schemeIs("https")&&!uri.schemeIs("wss")){

}else if(state&wpl.STATE_IS_SECURE){ info.state="secure";}else if(state&wpl.STATE_IS_BROKEN){
info.state="weak";info.weaknessReasons=this.getReasonsForWeakness(state);}else if(state&wpl.STATE_IS_INSECURE){
return info;}else{return info;}
info.cipherSuite=securityInfo.cipherName;if(securityInfo.keaGroupName!=="none"){info.keaGroupName=securityInfo.keaGroupName;}
if(securityInfo.signatureSchemeName!=="none"){info.signatureSchemeName=securityInfo.signatureSchemeName;}
info.isDomainMismatch=securityInfo.isDomainMismatch;info.isExtendedValidation=securityInfo.isExtendedValidation;info.isNotValidAtThisTime=securityInfo.isNotValidAtThisTime;info.isUntrusted=securityInfo.isUntrusted;info.certificateTransparencyStatus=this.getTransparencyStatus(securityInfo.certificateTransparencyStatus);info.protocolVersion=this.formatSecurityProtocol(securityInfo.protocolVersion);if(options.certificateChain&&securityInfo.succeededCertChain){info.certificates=this.getCertificateChain(securityInfo.succeededCertChain,options);}else{info.certificates=[this.parseCertificateInfo(securityInfo.serverCert,options),];}
if(uri&&uri.host){

let flags=0;if(channel instanceof Ci.nsIPrivateBrowsingChannel&&channel.isChannelPrivate){flags=Ci.nsISocketProvider.NO_PERMANENT_STORAGE;}
info.hsts=sss.isSecureURI(sss.HEADER_HSTS,uri,flags);info.hpkp=sss.isSecureURI(sss.STATIC_PINNING,uri,flags);}else{info.hsts=false;info.hpkp=false;}
return info;},getCertificateChain(certChain,options={}){let certificates=[];for(let cert of certChain){certificates.push(this.parseCertificateInfo(cert,options));}
return certificates;},parseCertificateInfo(cert,options={}){if(!cert){return{};}
let certData={subject:cert.subjectName,issuer:cert.issuerName,validity:{start:cert.validity.notBefore?Math.trunc(cert.validity.notBefore/1000):0,end:cert.validity.notAfter?Math.trunc(cert.validity.notAfter/1000):0,},fingerprint:{sha1:cert.sha1Fingerprint,sha256:cert.sha256Fingerprint,},serialNumber:cert.serialNumber,isBuiltInRoot:cert.isBuiltInRoot,subjectPublicKeyInfoDigest:{sha256:cert.sha256SubjectPublicKeyInfoDigest,},};if(options.rawDER){certData.rawDER=cert.getRawDER();}
return certData;}, getTransparencyStatus(status){switch(status){case Ci.nsITransportSecurityInfo.CERTIFICATE_TRANSPARENCY_NOT_APPLICABLE:return"not_applicable";case Ci.nsITransportSecurityInfo.CERTIFICATE_TRANSPARENCY_POLICY_COMPLIANT:return"policy_compliant";case Ci.nsITransportSecurityInfo.CERTIFICATE_TRANSPARENCY_POLICY_NOT_ENOUGH_SCTS:return"policy_not_enough_scts";case Ci.nsITransportSecurityInfo.CERTIFICATE_TRANSPARENCY_POLICY_NOT_DIVERSE_SCTS:return"policy_not_diverse_scts";}
return"unknown";},formatSecurityProtocol(version){switch(version){case Ci.nsITransportSecurityInfo.TLS_VERSION_1:return"TLSv1";case Ci.nsITransportSecurityInfo.TLS_VERSION_1_1:return"TLSv1.1";case Ci.nsITransportSecurityInfo.TLS_VERSION_1_2:return"TLSv1.2";case Ci.nsITransportSecurityInfo.TLS_VERSION_1_3:return"TLSv1.3";}
return"unknown";},getReasonsForWeakness(state){

 let reasons=[];if(state&wpl.STATE_IS_BROKEN){if(state&wpl.STATE_USES_WEAK_CRYPTO){reasons.push("cipher");}}
return reasons;},};