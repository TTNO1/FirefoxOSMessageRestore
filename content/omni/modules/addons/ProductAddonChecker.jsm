"use strict";var EXPORTED_SYMBOLS=["ProductAddonChecker"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const{CertUtils}=ChromeUtils.import("resource://gre/modules/CertUtils.jsm");const{OS}=ChromeUtils.import("resource://gre/modules/osfile.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["XMLHttpRequest"]);
var CreateXHR=function(){return new XMLHttpRequest();};var logger=Log.repository.getLogger("addons.productaddons");const TIMEOUT_DELAY_MS=20000;const HASH_CHUNK_SIZE=8192;function getRequestStatus(request){let status=null;try{status=request.status;}catch(e){}
if(status!=null){return status;}
return request.channel.QueryInterface(Ci.nsIRequest).status;}
function downloadXML(url,allowNonBuiltIn=false,allowedCerts=null){return new Promise((resolve,reject)=>{let request=CreateXHR(); if(request.wrappedJSObject){request=request.wrappedJSObject;}
request.open("GET",url,true);request.channel.notificationCallbacks=new CertUtils.BadCertHandler(allowNonBuiltIn);request.channel.loadFlags|=Ci.nsIRequest.LOAD_BYPASS_CACHE;request.channel.loadFlags|=Ci.nsIRequest.INHIBIT_CACHING; request.channel.loadFlags|=Ci.nsIRequest.LOAD_ANONYMOUS;if(request.channel instanceof Ci.nsIHttpChannelInternal){request.channel.QueryInterface(Ci.nsIHttpChannelInternal).beConservative=true;}
request.timeout=TIMEOUT_DELAY_MS;request.overrideMimeType("text/xml");

request.setRequestHeader("Cache-Control","no-cache");
 request.setRequestHeader("Pragma","no-cache");let fail=event=>{let request=event.target;let status=getRequestStatus(request);let message="Failed downloading XML, status: "+status+", reason: "+event.type;logger.warn(message);let ex=new Error(message);ex.status=status;reject(ex);};let success=event=>{logger.info("Completed downloading document");let request=event.target;try{CertUtils.checkCert(request.channel,allowNonBuiltIn,allowedCerts);}catch(ex){logger.error("Request failed certificate checks: "+ex);ex.status=getRequestStatus(request);reject(ex);return;}
resolve(request.responseXML);};request.addEventListener("error",fail);request.addEventListener("abort",fail);request.addEventListener("timeout",fail);request.addEventListener("load",success);logger.info("sending request to: "+url);request.send(null);});}
function parseXML(document){ if(document.documentElement.localName!="updates"){throw new Error("got node name: "+
document.documentElement.localName+", expected: updates");} 
let addons=document.querySelector("updates:root > addons");if(!addons){return null;}
let results=[];let addonList=document.querySelectorAll("updates:root > addons > addon");for(let addonElement of addonList){let addon={};for(let name of["id","URL","hashFunction","hashValue","version","size",]){if(addonElement.hasAttribute(name)){addon[name]=addonElement.getAttribute(name);}}
addon.size=Number(addon.size)||undefined;results.push(addon);}
return{usedFallback:false,addons:results,};}
function downloadFile(url,options={httpsOnlyNoUpgrade:false}){return new Promise((resolve,reject)=>{let xhr=new XMLHttpRequest();xhr.onload=function(response){logger.info("downloadXHR File download. status="+xhr.status);if(xhr.status!=200&&xhr.status!=206){reject(Components.Exception("File download failed",xhr.status));return;}
(async function(){let f=await OS.File.openUnique(OS.Path.join(OS.Constants.Path.tmpDir,"tmpaddon"));let path=f.path;logger.info(`Downloaded file will be saved to ${path}`);await f.file.close();await OS.File.writeAtomic(path,new Uint8Array(xhr.response));return path;})().then(resolve,reject);};let fail=event=>{let request=event.target;let status=getRequestStatus(request);let message="Failed downloading via XHR, status: "+
status+", reason: "+
event.type;logger.warn(message);let ex=new Error(message);ex.status=status;reject(ex);};xhr.addEventListener("error",fail);xhr.addEventListener("abort",fail);xhr.responseType="arraybuffer";try{xhr.open("GET",url);if(options.httpsOnlyNoUpgrade){xhr.channel.loadInfo.httpsOnlyStatus|=Ci.nsILoadInfo.HTTPS_ONLY_EXEMPT;} 
xhr.channel.loadInfo.allowDeprecatedSystemRequests=true;if(xhr.channel instanceof Ci.nsIHttpChannelInternal){xhr.channel.QueryInterface(Ci.nsIHttpChannelInternal).beConservative=true;}
xhr.send(null);}catch(ex){reject(ex);}});}
function binaryToHex(input){let result="";for(let i=0;i<input.length;++i){let hex=input.charCodeAt(i).toString(16);if(hex.length==1){hex="0"+hex;}
result+=hex;}
return result;}
var computeHash=async function(hashFunction,path){let file=await OS.File.open(path,{existing:true,read:true});try{let hasher=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);hasher.initWithString(hashFunction);let bytes;do{bytes=await file.read(HASH_CHUNK_SIZE);hasher.update(bytes,bytes.length);}while(bytes.length==HASH_CHUNK_SIZE);return binaryToHex(hasher.finish(false));}finally{await file.close();}};var verifyFile=async function(properties,path){if(properties.size!==undefined){let stat=await OS.File.stat(path);if(stat.size!=properties.size){throw new Error("Downloaded file was "+
stat.size+" bytes but expected "+
properties.size+" bytes.");}}
if(properties.hashFunction!==undefined){let expectedDigest=properties.hashValue.toLowerCase();let digest=await computeHash(properties.hashFunction,path);if(digest!=expectedDigest){throw new Error("Hash was `"+digest+"` but expected `"+expectedDigest+"`.");}}};const ProductAddonChecker={getProductAddonList(url,allowNonBuiltIn=false,allowedCerts=null){return downloadXML(url,allowNonBuiltIn,allowedCerts).then(parseXML);},async downloadAddon(addon,options={httpsOnlyNoUpgrade:false}){let path=await downloadFile(addon.URL,options);try{await verifyFile(addon,path);return path;}catch(e){await OS.File.remove(path);throw e;}},};