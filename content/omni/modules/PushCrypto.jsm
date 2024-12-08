//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGetter(this,"gDOMBundle",()=>Services.strings.createBundle("chrome://global/locale/dom/dom.properties"));XPCOMUtils.defineLazyGlobalGetters(this,["crypto"]);const EXPORTED_SYMBOLS=["PushCrypto"];const UTF8=new TextEncoder("utf-8");const ECDH_KEY={name:"ECDH",namedCurve:"P-256"};const ECDSA_KEY={name:"ECDSA",namedCurve:"P-256"};const HMAC_SHA256={name:"HMAC",hash:"SHA-256"};const NONCE_INFO=UTF8.encode("Content-Encoding: nonce");const DEFAULT_KEYID="";const BAD_ENCRYPTION_HEADER="PushMessageBadEncryptionHeader";const BAD_CRYPTO_KEY_HEADER="PushMessageBadCryptoKeyHeader";const BAD_ENCRYPTION_KEY_HEADER="PushMessageBadEncryptionKeyHeader";const BAD_ENCODING_HEADER="PushMessageBadEncodingHeader";const BAD_DH_PARAM="PushMessageBadSenderKey";const BAD_SALT_PARAM="PushMessageBadSalt";const BAD_RS_PARAM="PushMessageBadRecordSize";const BAD_PADDING="PushMessageBadPaddingError";const BAD_CRYPTO="PushMessageBadCryptoError";class CryptoError extends Error{constructor(message,property,...params){super(message);this.isCryptoError=true;this.property=property;this.params=params;}
format(scope){let params=[scope,...this.params].map(String);return gDOMBundle.formatStringFromName(this.property,params);}}
function getEncryptionKeyParams(encryptKeyField){if(!encryptKeyField){return null;}
var params=encryptKeyField.split(",");return params.reduce((m,p)=>{var pmap=p.split(";").reduce(parseHeaderFieldParams,{});if(pmap.keyid&&pmap.dh){m[pmap.keyid]=pmap.dh;}
if(!m[DEFAULT_KEYID]&&pmap.dh){m[DEFAULT_KEYID]=pmap.dh;}
return m;},{});}
function getEncryptionParams(encryptField){if(!encryptField){throw new CryptoError("Missing encryption header",BAD_ENCRYPTION_HEADER);}
var p=encryptField.split(",",1)[0];if(!p){throw new CryptoError("Encryption header missing params",BAD_ENCRYPTION_HEADER);}
return p.split(";").reduce(parseHeaderFieldParams,{});}

function getCryptoParamsFromPayload(payload){if(payload.byteLength<21){throw new CryptoError("Truncated header",BAD_CRYPTO);}
let rs=(payload[16]<<24)|(payload[17]<<16)|(payload[18]<<8)|payload[19];let keyIdLen=payload[20];if(keyIdLen!=65){throw new CryptoError("Invalid sender public key",BAD_DH_PARAM);}
if(payload.byteLength<=21+keyIdLen){throw new CryptoError("Truncated payload",BAD_CRYPTO);}
return{salt:payload.slice(0,16),rs,senderKey:payload.slice(21,21+keyIdLen),ciphertext:payload.slice(21+keyIdLen),};}

function getCryptoParamsFromHeaders(headers){if(!headers){return null;}
var keymap;if(headers.encoding==AESGCM_ENCODING){
 keymap=getEncryptionKeyParams(headers.crypto_key);if(!keymap){throw new CryptoError("Missing Crypto-Key header",BAD_CRYPTO_KEY_HEADER);}}else if(headers.encoding==AESGCM128_ENCODING){ keymap=getEncryptionKeyParams(headers.encryption_key);if(!keymap){throw new CryptoError("Missing Encryption-Key header",BAD_ENCRYPTION_KEY_HEADER);}}
var enc=getEncryptionParams(headers.encryption);var dh=keymap[enc.keyid||DEFAULT_KEYID];var senderKey=base64URLDecode(dh);if(!senderKey){throw new CryptoError("Invalid dh parameter",BAD_DH_PARAM);}
var salt=base64URLDecode(enc.salt);if(!salt){throw new CryptoError("Invalid salt parameter",BAD_SALT_PARAM);}
var rs=enc.rs?parseInt(enc.rs,10):4096;if(isNaN(rs)){throw new CryptoError("rs parameter must be a number",BAD_RS_PARAM);}
return{salt,rs,senderKey,};}
function base64URLDecode(string){if(!string){return null;}
try{return ChromeUtils.base64URLDecode(string,{padding:"reject",});}catch(ex){}
return null;}
var parseHeaderFieldParams=(m,v)=>{var i=v.indexOf("=");if(i>=0){
m[v.substring(0,i).trim()]=v.substring(i+1).trim().replace(/^"(.*)"$/,"$1");}
return m;};function chunkArray(array,size){var start=array.byteOffset||0;array=array.buffer||array;var index=0;var result=[];while(index+size<=array.byteLength){result.push(new Uint8Array(array,start+index,size));index+=size;}
if(index<array.byteLength){result.push(new Uint8Array(array,start+index));}
return result;}
function concatArray(arrays){var size=arrays.reduce((total,a)=>total+a.byteLength,0);var index=0;return arrays.reduce((result,a)=>{result.set(new Uint8Array(a),index);index+=a.byteLength;return result;},new Uint8Array(size));}
function hmac(key){this.keyPromise=crypto.subtle.importKey("raw",key,HMAC_SHA256,false,["sign",]);}
hmac.prototype.hash=function(input){return this.keyPromise.then(k=>crypto.subtle.sign("HMAC",k,input));};function hkdf(salt,ikm){this.prkhPromise=new hmac(salt).hash(ikm).then(prk=>new hmac(prk));}
hkdf.prototype.extract=function(info,len){var input=concatArray([info,new Uint8Array([1])]);return this.prkhPromise.then(prkh=>prkh.hash(input)).then(h=>{if(h.byteLength<len){throw new CryptoError("HKDF length is too long",BAD_CRYPTO);}
return h.slice(0,len);});};function generateNonce(base,index){if(index>=Math.pow(2,48)){throw new CryptoError("Nonce index is too large",BAD_CRYPTO);}
var nonce=base.slice(0,12);nonce=new Uint8Array(nonce);for(var i=0;i<6;++i){nonce[nonce.byteLength-1-i]^=(index/Math.pow(256,i))&0xff;}
return nonce;}
function encodeLength(buffer){return new Uint8Array([0,buffer.byteLength]);}
class Decoder{constructor(privateKey,publicKey,authenticationSecret,cryptoParams,ciphertext){this.privateKey=privateKey;this.publicKey=publicKey;this.authenticationSecret=authenticationSecret;this.senderKey=cryptoParams.senderKey;this.salt=cryptoParams.salt;this.rs=cryptoParams.rs;this.ciphertext=ciphertext;}
async decode(){if(this.ciphertext.byteLength===0){return null;}
try{let ikm=await this.computeSharedSecret();let[gcmBits,nonce]=await this.deriveKeyAndNonce(ikm);let key=await crypto.subtle.importKey("raw",gcmBits,"AES-GCM",false,["decrypt"]);let r=await Promise.all(chunkArray(this.ciphertext,this.chunkSize).map((slice,index,chunks)=>this.decodeChunk(slice,index,nonce,key,index>=chunks.length-1)));return concatArray(r);}catch(error){if(error.isCryptoError){throw error;}


throw new CryptoError("Bad encryption",BAD_CRYPTO);}}
async computeSharedSecret(){let[appServerKey,subscriptionPrivateKey]=await Promise.all([crypto.subtle.importKey("raw",this.senderKey,ECDH_KEY,false,["deriveBits",]),crypto.subtle.importKey("jwk",this.privateKey,ECDH_KEY,false,["deriveBits",]),]);return crypto.subtle.deriveBits({name:"ECDH",public:appServerKey},subscriptionPrivateKey,256);}
async deriveKeyAndNonce(ikm){throw new Error("Missing `deriveKeyAndNonce` implementation");}
async decodeChunk(slice,index,nonce,key,last){let params={name:"AES-GCM",iv:generateNonce(nonce,index),};let decoded=await crypto.subtle.decrypt(params,key,slice);return this.unpadChunk(new Uint8Array(decoded),last);}
unpadChunk(chunk,last){throw new Error("Missing `unpadChunk` implementation");}
get chunkSize(){throw new Error("Missing `chunkSize` implementation");}}
class OldSchemeDecoder extends Decoder{async decode(){
if(this.ciphertext.byteLength>0&&this.ciphertext.byteLength%this.chunkSize===0){throw new CryptoError("Encrypted data truncated",BAD_CRYPTO);}
return super.decode();}
unpadChunk(decoded){if(decoded.length<this.padSize){throw new CryptoError("Decoded array is too short!",BAD_PADDING);}
var pad=decoded[0];if(this.padSize==2){pad=(pad<<8)|decoded[1];}
if(pad>decoded.length-this.padSize){throw new CryptoError("Padding is wrong!",BAD_PADDING);}
for(var i=this.padSize;i<this.padSize+pad;i++){if(decoded[i]!==0){throw new CryptoError("Padding is wrong!",BAD_PADDING);}}
return decoded.slice(pad+this.padSize);}
get chunkSize(){return this.rs+16;}
get padSize(){throw new Error("Missing `padSize` implementation");}}
const AES128GCM_ENCODING="aes128gcm";const AES128GCM_KEY_INFO=UTF8.encode("Content-Encoding: aes128gcm\0");const AES128GCM_AUTH_INFO=UTF8.encode("WebPush: info\0");const AES128GCM_NONCE_INFO=UTF8.encode("Content-Encoding: nonce\0");class aes128gcmDecoder extends Decoder{async deriveKeyAndNonce(ikm){let authKdf=new hkdf(this.authenticationSecret,ikm);let authInfo=concatArray([AES128GCM_AUTH_INFO,this.publicKey,this.senderKey,]);let prk=await authKdf.extract(authInfo,32);let prkKdf=new hkdf(this.salt,prk);return Promise.all([prkKdf.extract(AES128GCM_KEY_INFO,16),prkKdf.extract(AES128GCM_NONCE_INFO,12),]);}
unpadChunk(decoded,last){let length=decoded.length;while(length--){if(decoded[length]===0){continue;}
let recordPad=last?2:1;if(decoded[length]!=recordPad){throw new CryptoError("Padding is wrong!",BAD_PADDING);}
return decoded.slice(0,length);}
throw new CryptoError("Zero plaintext",BAD_PADDING);}
get chunkSize(){return this.rs;}}
const AESGCM_ENCODING="aesgcm";const AESGCM_KEY_INFO=UTF8.encode("Content-Encoding: aesgcm\0");const AESGCM_AUTH_INFO=UTF8.encode("Content-Encoding: auth\0");const AESGCM_P256DH_INFO=UTF8.encode("P-256\0");class aesgcmDecoder extends OldSchemeDecoder{async deriveKeyAndNonce(ikm){
let authKdf=new hkdf(this.authenticationSecret,ikm);let prk=await authKdf.extract(AESGCM_AUTH_INFO,32);let prkKdf=new hkdf(this.salt,prk);let keyInfo=concatArray([AESGCM_KEY_INFO,AESGCM_P256DH_INFO,encodeLength(this.publicKey),this.publicKey,encodeLength(this.senderKey),this.senderKey,]);let nonceInfo=concatArray([NONCE_INFO,new Uint8Array([0]),AESGCM_P256DH_INFO,encodeLength(this.publicKey),this.publicKey,encodeLength(this.senderKey),this.senderKey,]);return Promise.all([prkKdf.extract(keyInfo,16),prkKdf.extract(nonceInfo,12),]);}
get padSize(){return 2;}}
const AESGCM128_ENCODING="aesgcm128";const AESGCM128_KEY_INFO=UTF8.encode("Content-Encoding: aesgcm128");class aesgcm128Decoder extends OldSchemeDecoder{constructor(privateKey,publicKey,cryptoParams,ciphertext){super(privateKey,publicKey,null,cryptoParams,ciphertext);}
deriveKeyAndNonce(ikm){let prkKdf=new hkdf(this.salt,ikm);return Promise.all([prkKdf.extract(AESGCM128_KEY_INFO,16),prkKdf.extract(NONCE_INFO,12),]);}
get padSize(){return 1;}}
var PushCrypto={concatArray,generateAuthenticationSecret(){return crypto.getRandomValues(new Uint8Array(16));},validateAppServerKey(key){return crypto.subtle.importKey("raw",key,ECDSA_KEY,true,["verify"]).then(_=>key);},generateKeys(){return crypto.subtle.generateKey(ECDH_KEY,true,["deriveBits"]).then(cryptoKey=>Promise.all([crypto.subtle.exportKey("raw",cryptoKey.publicKey),crypto.subtle.exportKey("jwk",cryptoKey.privateKey),]));},async decrypt(privateKey,publicKey,authenticationSecret,headers,payload){if(!headers){return null;}
let encoding=headers.encoding;if(!headers.encoding){throw new CryptoError("Missing Content-Encoding header",BAD_ENCODING_HEADER);}
let decoder;if(encoding==AES128GCM_ENCODING){
let cryptoParams=getCryptoParamsFromPayload(new Uint8Array(payload));decoder=new aes128gcmDecoder(privateKey,publicKey,authenticationSecret,cryptoParams,cryptoParams.ciphertext);}else if(encoding==AESGCM128_ENCODING||encoding==AESGCM_ENCODING){
let cryptoParams=getCryptoParamsFromHeaders(headers);if(headers.encoding==AESGCM_ENCODING){decoder=new aesgcmDecoder(privateKey,publicKey,authenticationSecret,cryptoParams,payload);}else{decoder=new aesgcm128Decoder(privateKey,publicKey,cryptoParams,payload);}}
if(!decoder){throw new CryptoError("Unsupported Content-Encoding: "+encoding,BAD_ENCODING_HEADER);}
return decoder.decode();},async encrypt(plaintext,receiverPublicKey,receiverAuthSecret,options={}){const encoding=options.encoding||AES128GCM_ENCODING;if(encoding!=AES128GCM_ENCODING){throw new CryptoError(`Only ${AES128GCM_ENCODING} is supported`,BAD_ENCODING_HEADER);}

const senderKeyPair=options.senderKeyPair||(await crypto.subtle.generateKey(ECDH_KEY,true,["deriveBits"]));const salt=options.salt||crypto.getRandomValues(new Uint8Array(16));const rs=options.rs===undefined?4096:options.rs;const encoder=new aes128gcmEncoder(plaintext,receiverPublicKey,receiverAuthSecret,senderKeyPair,salt,rs);return encoder.encode();},};class aes128gcmEncoder{constructor(plaintext,receiverPublicKey,receiverAuthSecret,senderKeyPair,salt,rs){this.receiverPublicKey=receiverPublicKey;this.receiverAuthSecret=receiverAuthSecret;this.senderKeyPair=senderKeyPair;this.salt=salt;this.rs=rs;this.plaintext=plaintext;}
async encode(){const sharedSecret=await this.computeSharedSecret(this.receiverPublicKey,this.senderKeyPair.privateKey);const rawSenderPublicKey=await crypto.subtle.exportKey("raw",this.senderKeyPair.publicKey);const[gcmBits,nonce]=await this.deriveKeyAndNonce(sharedSecret,rawSenderPublicKey);const contentEncryptionKey=await crypto.subtle.importKey("raw",gcmBits,"AES-GCM",false,["encrypt"]);const payloadHeader=this.createHeader(rawSenderPublicKey);const ciphertextChunks=await this.encrypt(contentEncryptionKey,nonce);return{ciphertext:concatArray([payloadHeader,...ciphertextChunks]),encoding:"aes128gcm",};}
async encrypt(key,nonce){if(this.rs<18){throw new CryptoError("recordsize is too small",BAD_RS_PARAM);}
let chunks;if(this.plaintext.byteLength===0){chunks=[await crypto.subtle.encrypt({name:"AES-GCM",iv:generateNonce(nonce,0),},key,new Uint8Array([2])),];}else{
let inChunks=chunkArray(this.plaintext,this.rs-1-16);chunks=await Promise.all(inChunks.map(async function(slice,index){let isLast=index==inChunks.length-1;let padding=new Uint8Array([isLast?2:1]);let input=concatArray([slice,padding]);return crypto.subtle.encrypt({name:"AES-GCM",iv:generateNonce(nonce,index),},key,input);}));}
return chunks;}

async deriveKeyAndNonce(sharedSecret,senderPublicKey){const authKdf=new hkdf(this.receiverAuthSecret,sharedSecret);const authInfo=concatArray([AES128GCM_AUTH_INFO,this.receiverPublicKey,senderPublicKey,]);const prk=await authKdf.extract(authInfo,32);const prkKdf=new hkdf(this.salt,prk);return Promise.all([prkKdf.extract(AES128GCM_KEY_INFO,16),prkKdf.extract(AES128GCM_NONCE_INFO,12),]);}

async computeSharedSecret(receiverPublicKey,senderPrivateKey){const receiverPublicCryptoKey=await crypto.subtle.importKey("raw",receiverPublicKey,ECDH_KEY,false,["deriveBits"]);return crypto.subtle.deriveBits({name:"ECDH",public:receiverPublicCryptoKey},senderPrivateKey,256);}
createHeader(key){if(key.byteLength!=65){throw new CryptoError("Invalid key length for header",BAD_DH_PARAM);} 
let ints=new Uint8Array(5);let intsv=new DataView(ints.buffer);intsv.setUint32(0,this.rs); intsv.setUint8(4,key.byteLength);return concatArray([this.salt,ints,key]);}}