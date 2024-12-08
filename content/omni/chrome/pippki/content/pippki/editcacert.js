"use strict";var gCertDB=Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);var gCert;function onLoad(){gCert=window.arguments[0];document.addEventListener("dialogaccept",onDialogAccept);let certMsg=document.getElementById("certmsg");document.l10n.setAttributes(certMsg,"edit-trust-ca",{certName:gCert.commonName,});let sslCheckbox=document.getElementById("trustSSL");sslCheckbox.checked=gCertDB.isCertTrusted(gCert,Ci.nsIX509Cert.CA_CERT,Ci.nsIX509CertDB.TRUSTED_SSL);let emailCheckbox=document.getElementById("trustEmail");emailCheckbox.checked=gCertDB.isCertTrusted(gCert,Ci.nsIX509Cert.CA_CERT,Ci.nsIX509CertDB.TRUSTED_EMAIL);}
function onDialogAccept(){let sslCheckbox=document.getElementById("trustSSL");let emailCheckbox=document.getElementById("trustEmail");let trustSSL=sslCheckbox.checked?Ci.nsIX509CertDB.TRUSTED_SSL:0;let trustEmail=emailCheckbox.checked?Ci.nsIX509CertDB.TRUSTED_EMAIL:0;gCertDB.setCertTrust(gCert,Ci.nsIX509Cert.CA_CERT,trustSSL|trustEmail);}