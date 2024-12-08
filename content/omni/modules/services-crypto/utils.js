var EXPORTED_SYMBOLS=["CryptoUtils"];const{Observers}=ChromeUtils.import("resource://services-common/observers.js");const{CommonUtils}=ChromeUtils.import("resource://services-common/utils.js");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["crypto"]);XPCOMUtils.defineLazyGetter(this,"textEncoder",function(){return new TextEncoder();});var CryptoUtils={xor(a,b){let bytes=[];if(a.length!=b.length){throw new Error("can't xor unequal length strings: "+a.length+" vs "+b.length);}
for(let i=0;i<a.length;i++){bytes[i]=a.charCodeAt(i)^b.charCodeAt(i);}
return String.fromCharCode.apply(String,bytes);},generateRandomBytesLegacy(length){let bytes=CryptoUtils.generateRandomBytes(length);return CommonUtils.arrayBufferToByteString(bytes);},generateRandomBytes(length){return crypto.getRandomValues(new Uint8Array(length));},digestUTF8(message,hasher){let data=this._utf8Converter.convertToByteArray(message,{});hasher.update(data,data.length);let result=hasher.finish(false);if(hasher instanceof Ci.nsICryptoHMAC){hasher.reset();}
return result;},digestBytes(bytes,hasher){if(typeof bytes=="string"||bytes instanceof String){bytes=CommonUtils.byteStringToArrayBuffer(bytes);}
return CryptoUtils.digestBytesArray(bytes,hasher);},digestBytesArray(bytes,hasher){hasher.update(bytes,bytes.length);let result=hasher.finish(false);if(hasher instanceof Ci.nsICryptoHMAC){hasher.reset();}
return result;},updateUTF8(message,hasher){let bytes=this._utf8Converter.convertToByteArray(message,{});hasher.update(bytes,bytes.length);},sha256(message){let hasher=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);hasher.init(hasher.SHA256);return CommonUtils.bytesAsHex(CryptoUtils.digestUTF8(message,hasher));},sha256Base64(message){let data=this._utf8Converter.convertToByteArray(message,{});let hasher=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);hasher.init(hasher.SHA256);hasher.update(data,data.length);return hasher.finish(true);},makeHMACKey:function makeHMACKey(str){return Svc.KeyFactory.keyFromString(Ci.nsIKeyObject.HMAC,str);},makeHMACHasher:function makeHMACHasher(type,key){let hasher=Cc["@mozilla.org/security/hmac;1"].createInstance(Ci.nsICryptoHMAC);hasher.init(type,key);return hasher;},async hmacLegacy(alg,key,data){if(!key||!key.length){key="\0";}
data=CommonUtils.byteStringToArrayBuffer(data);key=CommonUtils.byteStringToArrayBuffer(key);const result=await CryptoUtils.hmac(alg,key,data);return CommonUtils.arrayBufferToByteString(result);},async hkdfLegacy(ikm,xts,info,len){ikm=CommonUtils.byteStringToArrayBuffer(ikm);xts=CommonUtils.byteStringToArrayBuffer(xts);info=textEncoder.encode(info);const okm=await CryptoUtils.hkdf(ikm,xts,info,len);return CommonUtils.arrayBufferToByteString(okm);},async hmac(alg,key,data){const hmacKey=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:alg},false,["sign"]);const result=await crypto.subtle.sign("HMAC",hmacKey,data);return new Uint8Array(result);},async hkdf(ikm,salt,info,len){const key=await crypto.subtle.importKey("raw",ikm,{name:"HKDF"},false,["deriveBits"]);const okm=await crypto.subtle.deriveBits({name:"HKDF",hash:"SHA-256",salt,info,},key,len*8);return new Uint8Array(okm);},async pbkdf2Generate(passphrase,salt,iterations,len){passphrase=CommonUtils.byteStringToArrayBuffer(passphrase);salt=CommonUtils.byteStringToArrayBuffer(salt);const key=await crypto.subtle.importKey("raw",passphrase,{name:"PBKDF2"},false,["deriveBits"]);const output=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations,},key,len*8);return CommonUtils.arrayBufferToByteString(new Uint8Array(output));},async computeHTTPMACSHA1(identifier,key,method,uri,extra){let ts=extra&&extra.ts?extra.ts:Math.floor(Date.now()/1000);let nonce_bytes=extra&&extra.nonce_bytes>0?extra.nonce_bytes:8;let nonce=extra&&extra.nonce?extra.nonce:btoa(CryptoUtils.generateRandomBytesLegacy(nonce_bytes));let host=uri.asciiHost;let port;let usedMethod=method.toUpperCase();if(uri.port!=-1){port=uri.port;}else if(uri.scheme=="http"){port="80";}else if(uri.scheme=="https"){port="443";}else{throw new Error("Unsupported URI scheme: "+uri.scheme);}
let ext=extra&&extra.ext?extra.ext:"";let requestString=ts.toString(10)+"\n"+
nonce+"\n"+
usedMethod+"\n"+
uri.pathQueryRef+"\n"+
host+"\n"+
port+"\n"+
ext+"\n";const mac=await CryptoUtils.hmacLegacy("SHA-1",key,requestString);function getHeader(){return CryptoUtils.getHTTPMACSHA1Header(this.identifier,this.ts,this.nonce,this.mac,this.ext);}
return{identifier,key,method:usedMethod,hostname:host,port,mac,nonce,ts,ext,getHeader,};},getHTTPMACSHA1Header:function getHTTPMACSHA1Header(identifier,ts,nonce,mac,ext){let header='MAC id="'+
identifier+'", '+'ts="'+
ts+'", '+'nonce="'+
nonce+'", '+'mac="'+
btoa(mac)+'"';if(!ext){return header;}
return(header+=', ext="'+ext+'"');},stripHeaderAttributes(value){value=value||"";let i=value.indexOf(";");return value.substring(0,i>=0?i:undefined).trim().toLowerCase();},async computeHAWK(uri,method,options){let credentials=options.credentials;let ts=options.ts||Math.floor(((options.now||Date.now())+(options.localtimeOffsetMsec||0))/1000);let port;if(uri.port!=-1){port=uri.port;}else if(uri.scheme=="http"){port=80;}else if(uri.scheme=="https"){port=443;}else{throw new Error("Unsupported URI scheme: "+uri.scheme);}
let artifacts={ts,nonce:options.nonce||btoa(CryptoUtils.generateRandomBytesLegacy(8)),method:method.toUpperCase(),resource:uri.pathQueryRef,host:uri.asciiHost.toLowerCase(),port:port.toString(10),hash:options.hash,ext:options.ext,};let contentType=CryptoUtils.stripHeaderAttributes(options.contentType);if(!artifacts.hash&&options.hasOwnProperty("payload")&&options.payload){const buffer=textEncoder.encode(`hawk.1.payload\n${contentType}\n${options.payload}\n`);const hash=await crypto.subtle.digest("SHA-256",buffer);
artifacts.hash=ChromeUtils.base64URLEncode(hash,{pad:true}).replace(/-/g,"+").replace(/_/g,"/");}
let requestString="hawk.1.header\n"+
artifacts.ts.toString(10)+"\n"+
artifacts.nonce+"\n"+
artifacts.method+"\n"+
artifacts.resource+"\n"+
artifacts.host+"\n"+
artifacts.port+"\n"+
(artifacts.hash||"")+"\n";if(artifacts.ext){requestString+=artifacts.ext.replace("\\","\\\\").replace("\n","\\n");}
requestString+="\n";const hash=await CryptoUtils.hmacLegacy("SHA-256",credentials.key,requestString);artifacts.mac=btoa(hash);function escape(attribute){return attribute.replace(/\\/g,"\\\\").replace(/\"/g,'\\"');}
let header='Hawk id="'+
credentials.id+'", '+'ts="'+
artifacts.ts+'", '+'nonce="'+
artifacts.nonce+'", '+
(artifacts.hash?'hash="'+artifacts.hash+'", ':"")+
(artifacts.ext?'ext="'+escape(artifacts.ext)+'", ':"")+'mac="'+
artifacts.mac+'"';return{artifacts,field:header,};},};XPCOMUtils.defineLazyGetter(CryptoUtils,"_utf8Converter",function(){let converter=Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);converter.charset="UTF-8";return converter;});var Svc={};XPCOMUtils.defineLazyServiceGetter(Svc,"KeyFactory","@mozilla.org/security/keyobjectfactory;1","nsIKeyObjectFactory");Observers.add("xpcom-shutdown",function unloadServices(){Observers.remove("xpcom-shutdown",unloadServices);for(let k in Svc){delete Svc[k];}});