"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");function setText(id,value){let element=document.getElementById(id);if(!element){return;}
if(element.hasChildNodes()){element.firstChild.remove();}
element.appendChild(document.createTextNode(value));}
async function viewCertHelper(parent,cert,openingOption="tab"){if(!cert){return;}
let win=Services.wm.getMostRecentBrowserWindow();let results=await asyncDetermineUsages(cert);let chain=getBestChain(results);if(!chain){chain=[cert];}
let certs=chain.map(elem=>encodeURIComponent(elem.getBase64DERString()));let certsStringURL=certs.map(elem=>`cert=${elem}`);certsStringURL=certsStringURL.join("&");let url=`about:certificate?${certsStringURL}`;let opened=win.switchToTabHavingURI(url,false,{});if(!opened){win.openTrustedLinkIn(url,openingOption);}}
function getPKCS7Array(certArray){let certdb=Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);let pkcs7String=certdb.asPKCS7Blob(certArray);let pkcs7Array=new Uint8Array(pkcs7String.length);for(let i=0;i<pkcs7Array.length;i++){pkcs7Array[i]=pkcs7String.charCodeAt(i);}
return pkcs7Array;}
function getPEMString(cert){var derb64=cert.getBase64DERString();
var wrapped=derb64.replace(/(\S{64}(?!$))/g,"$1\r\n");return("-----BEGIN CERTIFICATE-----\r\n"+
wrapped+"\r\n-----END CERTIFICATE-----\r\n");}
function alertPromptService(title,message){
 var ps=Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);ps.alert(window,title,message);}
const DEFAULT_CERT_EXTENSION="crt";function certToFilename(cert){let filename=cert.displayName;filename=filename.replace(/\s/g,"").replace(/\./g,"_").replace(/\\/g,"").replace(/\//g,"");


return`${filename}.${DEFAULT_CERT_EXTENSION}`;}
async function exportToFile(parent,cert){if(!cert){return;}
let results=await asyncDetermineUsages(cert);let chain=getBestChain(results);if(!chain){chain=[cert];}
let formats={base64:"*.crt; *.pem","base64-chain":"*.crt; *.pem",der:"*.der",pkcs7:"*.p7c","pkcs7-chain":"*.p7c",};let[saveCertAs,...formatLabels]=await document.l10n.formatValues(["save-cert-as",...Object.keys(formats).map(f=>"cert-format-"+f),].map(id=>({id})));var fp=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);fp.init(parent,saveCertAs,Ci.nsIFilePicker.modeSave);fp.defaultString=certToFilename(cert);fp.defaultExtension=DEFAULT_CERT_EXTENSION;for(let format of Object.values(formats)){fp.appendFilter(formatLabels.shift(),format);}
fp.appendFilters(Ci.nsIFilePicker.filterAll);let filePickerResult=await new Promise(resolve=>{fp.open(resolve);});if(filePickerResult!=Ci.nsIFilePicker.returnOK&&filePickerResult!=Ci.nsIFilePicker.returnReplace){return;}
var content="";switch(fp.filterIndex){case 1:content=getPEMString(cert);for(let i=1;i<chain.length;i++){content+=getPEMString(chain[i]);}
break;case 2:
content=Uint8Array.from(cert.getRawDER());break;case 3:
content=getPKCS7Array([cert]);break;case 4:content=getPKCS7Array(chain);break;case 0:default:content=getPEMString(cert);break;}
try{await OS.File.writeAtomic(fp.file.path,content);}catch(ex){let title=await document.l10n.formatValue("write-file-failure");alertPromptService(title,ex.toString());}
if(Cu.isInAutomation){Services.obs.notifyObservers(null,"cert-export-finished");}}
const PRErrorCodeSuccess=0;const certificateUsageSSLClient=0x0001;const certificateUsageSSLServer=0x0002;const certificateUsageSSLCA=0x0008;const certificateUsageEmailSigner=0x0010;const certificateUsageEmailRecipient=0x0020;
const certificateUsages={certificateUsageSSLClient,certificateUsageSSLServer,certificateUsageSSLCA,certificateUsageEmailSigner,certificateUsageEmailRecipient,};function asyncDetermineUsages(cert){let promises=[];let now=Date.now()/1000;let certdb=Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);Object.keys(certificateUsages).forEach(usageString=>{promises.push(new Promise((resolve,reject)=>{let usage=certificateUsages[usageString];certdb.asyncVerifyCertAtTime(cert,usage,0,null,now,(aPRErrorCode,aVerifiedChain,aHasEVPolicy)=>{resolve({usageString,errorCode:aPRErrorCode,chain:aVerifiedChain,});});}));});return Promise.all(promises);}
function getBestChain(results){let usages=[certificateUsageSSLServer,certificateUsageSSLClient,certificateUsageEmailSigner,certificateUsageEmailRecipient,certificateUsageSSLCA,];for(let usage of usages){let chain=getChainForUsage(results,usage);if(chain){return chain;}}
return null;}
function getChainForUsage(results,usage){for(let result of results){if(certificateUsages[result.usageString]==usage&&result.errorCode==PRErrorCodeSuccess){return result.chain;}}
return null;}