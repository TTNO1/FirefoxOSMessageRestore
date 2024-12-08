const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const browser=Services.appShell.createWindowlessBrowser(true);const{WebSocket}=browser.document.ownerGlobal;const EXPORTED_SYMBOLS=["FxAccountsPairingChannel"];var FxAccountsPairingChannel=(function(modules){   var installedModules={}; function __webpack_require__(moduleId){ if(installedModules[moduleId]){return installedModules[moduleId].exports;}
var module=installedModules[moduleId]={i:moduleId,l:false,exports:{}
}; modules[moduleId].call(module.exports,module,module.exports,__webpack_require__); module.l=true; return module.exports;}
__webpack_require__.m=modules; __webpack_require__.c=installedModules; __webpack_require__.d=function(exports,name,getter){if(!__webpack_require__.o(exports,name)){Object.defineProperty(exports,name,{enumerable:true,get:getter});}
}; __webpack_require__.r=function(exports){if(typeof Symbol!=='undefined'&&Symbol.toStringTag){Object.defineProperty(exports,Symbol.toStringTag,{value:'Module'});}
Object.defineProperty(exports,'__esModule',{value:true});};         __webpack_require__.t=function(value,mode){if(mode&1)value=__webpack_require__(value);if(mode&8)return value;if((mode&4)&&typeof value==='object'&&value&&value.__esModule)return value;var ns=Object.create(null);__webpack_require__.r(ns);Object.defineProperty(ns,'default',{enumerable:true,value:value});if(mode&2&&typeof value!='string')for(var key in value)__webpack_require__.d(ns,key,function(key){return value[key];}.bind(null,key));return ns;}; __webpack_require__.n=function(module){var getter=module&&module.__esModule?function getDefault(){return module['default'];}:function getModuleExports(){return module;};__webpack_require__.d(getter,'a',getter);return getter;}; __webpack_require__.o=function(object,property){return Object.prototype.hasOwnProperty.call(object,property);}; __webpack_require__.p=""; return __webpack_require__(__webpack_require__.s=0);})
([(function(module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.r(__webpack_exports__);  const ALERT_LEVEL={WARNING:1,FATAL:2};const ALERT_DESCRIPTION={CLOSE_NOTIFY:0,UNEXPECTED_MESSAGE:10,BAD_RECORD_MAC:20,RECORD_OVERFLOW:22,HANDSHAKE_FAILURE:40,ILLEGAL_PARAMETER:47,DECODE_ERROR:50,DECRYPT_ERROR:51,PROTOCOL_VERSION:70,INTERNAL_ERROR:80,MISSING_EXTENSION:109,UNSUPPORTED_EXTENSION:110,UNKNOWN_PSK_IDENTITY:115,NO_APPLICATION_PROTOCOL:120,};function alertTypeToName(type){for(const name in ALERT_DESCRIPTION){if(ALERT_DESCRIPTION[name]===type){return`${name} (${type})`;}}
return`UNKNOWN (${type})`;}
class TLSAlert extends Error{constructor(description,level){super(`TLS Alert: ${alertTypeToName(description)}`);this.description=description;this.level=level;}
static fromBytes(bytes){if(bytes.byteLength!==2){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
switch(bytes[1]){case ALERT_DESCRIPTION.CLOSE_NOTIFY:if(bytes[0]!==ALERT_LEVEL.WARNING){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
return new TLSCloseNotify();default:return new TLSError(bytes[1]);}}
toBytes(){return new Uint8Array([this.level,this.description]);}}
class TLSCloseNotify extends TLSAlert{constructor(){super(ALERT_DESCRIPTION.CLOSE_NOTIFY,ALERT_LEVEL.WARNING);}}
class TLSError extends TLSAlert{constructor(description=ALERT_DESCRIPTION.INTERNAL_ERROR){super(description,ALERT_LEVEL.FATAL);}}     
  
const UTF8_ENCODER=new TextEncoder();const UTF8_DECODER=new TextDecoder();function noop(){}
function assert(cond,msg){if(!cond){throw new Error('assert failed: '+msg);}}
function assertIsBytes(value,msg='value must be a Uint8Array'){
assert(ArrayBuffer.isView(value),msg);assert(value.BYTES_PER_ELEMENT===1,msg);return value;}
const EMPTY=new Uint8Array(0);function zeros(n){return new Uint8Array(n);}
function arrayToBytes(value){return new Uint8Array(value);}
function bytesToHex(bytes){return Array.prototype.map.call(bytes,byte=>{let s=byte.toString(16);if(s.length===1){s='0'+s;}
return s;}).join('');}
function hexToBytes(hexstr){assert(hexstr.length%2===0,'hexstr.length must be even');return new Uint8Array(Array.prototype.map.call(hexstr,(c,n)=>{if(n%2===1){return hexstr[n-1]+c;}else{return'';}}).filter(s=>{return!!s;}).map(s=>{return parseInt(s,16);}));}
function bytesToUtf8(bytes){return UTF8_DECODER.decode(bytes);}
function utf8ToBytes(str){return UTF8_ENCODER.encode(str);}
function bytesToBase64url(bytes){
const charCodes=String.fromCharCode.apply(String,bytes);return btoa(charCodes).replace(/\+/g,'-').replace(/\//g,'_');}
function base64urlToBytes(str){
str=atob(str.replace(/-/g,'+').replace(/_/g,'/'));const bytes=new Uint8Array(str.length);for(let i=0;i<str.length;i++){bytes[i]=str.charCodeAt(i);}
return bytes;}
function bytesAreEqual(v1,v2){assertIsBytes(v1);assertIsBytes(v2);if(v1.length!==v2.length){return false;}
for(let i=0;i<v1.length;i++){if(v1[i]!==v2[i]){return false;}}
return true;}



class utils_BufferWithPointer{constructor(buf){this._buffer=buf;this._dataview=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);this._pos=0;}
length(){return this._buffer.byteLength;}
tell(){return this._pos;}
seek(pos){if(pos<0){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
if(pos>this.length()){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
this._pos=pos;}
incr(offset){this.seek(this._pos+offset);}}





class utils_BufferReader extends utils_BufferWithPointer{hasMoreBytes(){return this.tell()<this.length();}
readBytes(length){const start=this._buffer.byteOffset+this.tell();this.incr(length);return new Uint8Array(this._buffer.buffer,start,length);}
_rangeErrorToAlert(cb){try{return cb(this);}catch(err){if(err instanceof RangeError){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
throw err;}}
readUint8(){return this._rangeErrorToAlert(()=>{const n=this._dataview.getUint8(this._pos);this.incr(1);return n;});}
readUint16(){return this._rangeErrorToAlert(()=>{const n=this._dataview.getUint16(this._pos);this.incr(2);return n;});}
readUint24(){return this._rangeErrorToAlert(()=>{let n=this._dataview.getUint16(this._pos);n=(n<<8)|this._dataview.getUint8(this._pos+2);this.incr(3);return n;});}
readUint32(){return this._rangeErrorToAlert(()=>{const n=this._dataview.getUint32(this._pos);this.incr(4);return n;});}
_readVector(length,cb){const contentsBuf=new utils_BufferReader(this.readBytes(length));const expectedEnd=this.tell();let n=0;while(contentsBuf.hasMoreBytes()){const prevPos=contentsBuf.tell();cb(contentsBuf,n);if(contentsBuf.tell()<=prevPos){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
n+=1;}
if(this.tell()!==expectedEnd){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}}
readVector8(cb){const length=this.readUint8();return this._readVector(length,cb);}
readVector16(cb){const length=this.readUint16();return this._readVector(length,cb);}
readVector24(cb){const length=this.readUint24();return this._readVector(length,cb);}
readVectorBytes8(){return this.readBytes(this.readUint8());}
readVectorBytes16(){return this.readBytes(this.readUint16());}
readVectorBytes24(){return this.readBytes(this.readUint24());}}
class utils_BufferWriter extends utils_BufferWithPointer{constructor(size=1024){super(new Uint8Array(size));}
_maybeGrow(n){const curSize=this._buffer.byteLength;const newPos=this._pos+n;const shortfall=newPos-curSize;if(shortfall>0){const incr=Math.min(curSize,4*1024);const newbuf=new Uint8Array(curSize+Math.ceil(shortfall/incr)*incr);newbuf.set(this._buffer,0);this._buffer=newbuf;this._dataview=new DataView(newbuf.buffer,newbuf.byteOffset,newbuf.byteLength);}}
slice(start=0,end=this.tell()){if(end<0){end=this.tell()+end;}
if(start<0){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
if(end<0){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
if(end>this.length()){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
return this._buffer.slice(start,end);}
flush(){const slice=this.slice();this.seek(0);return slice;}
writeBytes(data){this._maybeGrow(data.byteLength);this._buffer.set(data,this.tell());this.incr(data.byteLength);}
writeUint8(n){this._maybeGrow(1);this._dataview.setUint8(this._pos,n);this.incr(1);}
writeUint16(n){this._maybeGrow(2);this._dataview.setUint16(this._pos,n);this.incr(2);}
writeUint24(n){this._maybeGrow(3);this._dataview.setUint16(this._pos,n>>8);this._dataview.setUint8(this._pos+2,n&0xFF);this.incr(3);}
writeUint32(n){this._maybeGrow(4);this._dataview.setUint32(this._pos,n);this.incr(4);}





_writeVector(maxLength,writeLength,cb){const lengthPos=this.tell();writeLength(0);const bodyPos=this.tell();cb(this);const length=this.tell()-bodyPos;if(length>=maxLength){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
this.seek(lengthPos);writeLength(length);this.incr(length);return length;}
writeVector8(cb){return this._writeVector(Math.pow(2,8),len=>this.writeUint8(len),cb);}
writeVector16(cb){return this._writeVector(Math.pow(2,16),len=>this.writeUint16(len),cb);}
writeVector24(cb){return this._writeVector(Math.pow(2,24),len=>this.writeUint24(len),cb);}
writeVectorBytes8(bytes){return this.writeVector8(buf=>{buf.writeBytes(bytes);});}
writeVectorBytes16(bytes){return this.writeVector16(buf=>{buf.writeBytes(bytes);});}
writeVectorBytes24(bytes){return this.writeVector24(buf=>{buf.writeBytes(bytes);});}}     
  
const AEAD_SIZE_INFLATION=16;const KEY_LENGTH=16;const IV_LENGTH=12;const HASH_LENGTH=32;async function prepareKey(key,mode){return crypto.subtle.importKey('raw',key,{name:'AES-GCM'},false,[mode]);}
async function encrypt(key,iv,plaintext,additionalData){const ciphertext=await crypto.subtle.encrypt({additionalData,iv,name:'AES-GCM',tagLength:AEAD_SIZE_INFLATION*8},key,plaintext);return new Uint8Array(ciphertext);}
async function decrypt(key,iv,ciphertext,additionalData){try{const plaintext=await crypto.subtle.decrypt({additionalData,iv,name:'AES-GCM',tagLength:AEAD_SIZE_INFLATION*8},key,ciphertext);return new Uint8Array(plaintext);}catch(err){throw new TLSError(ALERT_DESCRIPTION.BAD_RECORD_MAC);}}
async function hash(message){return new Uint8Array(await crypto.subtle.digest({name:'SHA-256'},message));}
async function hmac(keyBytes,message){const key=await crypto.subtle.importKey('raw',keyBytes,{hash:{name:'SHA-256'},name:'HMAC',},false,['sign']);const sig=await crypto.subtle.sign({name:'HMAC'},key,message);return new Uint8Array(sig);}
async function verifyHmac(keyBytes,signature,message){const key=await crypto.subtle.importKey('raw',keyBytes,{hash:{name:'SHA-256'},name:'HMAC',},false,['verify']);if(!await crypto.subtle.verify({name:'HMAC'},key,signature,message)){throw new TLSError(ALERT_DESCRIPTION.DECRYPT_ERROR);}}
async function hkdfExtract(salt,ikm){ return await hmac(salt,ikm);}
async function hkdfExpand(prk,info,length){ const N=Math.ceil(length/HASH_LENGTH);if(N<=0){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
if(N>=255){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
const input=new utils_BufferWriter();const output=new utils_BufferWriter();let T=new Uint8Array(0);for(let i=1;i<=N;i++){input.writeBytes(T);input.writeBytes(info);input.writeUint8(i);T=await hmac(prk,input.flush());output.writeBytes(T);}
return output.slice(0,length);}
async function hkdfExpandLabel(secret,label,context,length){const hkdfLabel=new utils_BufferWriter();hkdfLabel.writeUint16(length);hkdfLabel.writeVectorBytes8(utf8ToBytes('tls13 '+label));hkdfLabel.writeVectorBytes8(context);return hkdfExpand(secret,hkdfLabel.flush(),length);}
async function getRandomBytes(size){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytes;}     
   
const EXTENSION_TYPE={PRE_SHARED_KEY:41,SUPPORTED_VERSIONS:43,PSK_KEY_EXCHANGE_MODES:45,};
class extensions_Extension{get TYPE_TAG(){throw new Error('not implemented');}
static read(messageType,buf){const type=buf.readUint16();let ext={TYPE_TAG:type,};buf.readVector16(buf=>{switch(type){case EXTENSION_TYPE.PRE_SHARED_KEY:ext=extensions_PreSharedKeyExtension._read(messageType,buf);break;case EXTENSION_TYPE.SUPPORTED_VERSIONS:ext=extensions_SupportedVersionsExtension._read(messageType,buf);break;case EXTENSION_TYPE.PSK_KEY_EXCHANGE_MODES:ext=extensions_PskKeyExchangeModesExtension._read(messageType,buf);break;default:buf.incr(buf.length());}
if(buf.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}});return ext;}
write(messageType,buf){buf.writeUint16(this.TYPE_TAG);buf.writeVector16(buf=>{this._write(messageType,buf);});}
static _read(messageType,buf){throw new Error('not implemented');}
static _write(messageType,buf){throw new Error('not implemented');}}
class extensions_PreSharedKeyExtension extends extensions_Extension{constructor(identities,binders,selectedIdentity){super();this.identities=identities;this.binders=binders;this.selectedIdentity=selectedIdentity;}
get TYPE_TAG(){return EXTENSION_TYPE.PRE_SHARED_KEY;}
static _read(messageType,buf){let identities=null,binders=null,selectedIdentity=null;switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:identities=[];binders=[];buf.readVector16(buf=>{const identity=buf.readVectorBytes16();buf.readBytes(4);identities.push(identity);});buf.readVector16(buf=>{const binder=buf.readVectorBytes8();if(binder.byteLength<HASH_LENGTH){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
binders.push(binder);});if(identities.length!==binders.length){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
break;case HANDSHAKE_TYPE.SERVER_HELLO:selectedIdentity=buf.readUint16();break;default:throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
return new this(identities,binders,selectedIdentity);}
_write(messageType,buf){switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:buf.writeVector16(buf=>{this.identities.forEach(pskId=>{buf.writeVectorBytes16(pskId);buf.writeUint32(0);});});buf.writeVector16(buf=>{this.binders.forEach(pskBinder=>{buf.writeVectorBytes8(pskBinder);});});break;case HANDSHAKE_TYPE.SERVER_HELLO:buf.writeUint16(this.selectedIdentity);break;default:throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}}}
class extensions_SupportedVersionsExtension extends extensions_Extension{constructor(versions,selectedVersion){super();this.versions=versions;this.selectedVersion=selectedVersion;}
get TYPE_TAG(){return EXTENSION_TYPE.SUPPORTED_VERSIONS;}
static _read(messageType,buf){let versions=null,selectedVersion=null;switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:versions=[];buf.readVector8(buf=>{versions.push(buf.readUint16());});break;case HANDSHAKE_TYPE.SERVER_HELLO:selectedVersion=buf.readUint16();break;default:throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
return new this(versions,selectedVersion);}
_write(messageType,buf){switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:buf.writeVector8(buf=>{this.versions.forEach(version=>{buf.writeUint16(version);});});break;case HANDSHAKE_TYPE.SERVER_HELLO:buf.writeUint16(this.selectedVersion);break;default:throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}}}
class extensions_PskKeyExchangeModesExtension extends extensions_Extension{constructor(modes){super();this.modes=modes;}
get TYPE_TAG(){return EXTENSION_TYPE.PSK_KEY_EXCHANGE_MODES;}
static _read(messageType,buf){const modes=[];switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:buf.readVector8(buf=>{modes.push(buf.readUint8());});break;default:throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
return new this(modes);}
_write(messageType,buf){switch(messageType){case HANDSHAKE_TYPE.CLIENT_HELLO:buf.writeVector8(buf=>{this.modes.forEach(mode=>{buf.writeUint8(mode);});});break;default:throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}}} 
const VERSION_TLS_1_0=0x0301;const VERSION_TLS_1_2=0x0303;const VERSION_TLS_1_3=0x0304;const TLS_AES_128_GCM_SHA256=0x1301;const PSK_MODE_KE=0;     
   const HANDSHAKE_TYPE={CLIENT_HELLO:1,SERVER_HELLO:2,NEW_SESSION_TICKET:4,ENCRYPTED_EXTENSIONS:8,FINISHED:20,};class messages_HandshakeMessage{get TYPE_TAG(){throw new Error('not implemented');}
static fromBytes(bytes){
 const buf=new utils_BufferReader(bytes);const msg=this.read(buf);if(buf.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
return msg;}
toBytes(){const buf=new utils_BufferWriter();this.write(buf);return buf.flush();}
static read(buf){const type=buf.readUint8();let msg=null;buf.readVector24(buf=>{switch(type){case HANDSHAKE_TYPE.CLIENT_HELLO:msg=messages_ClientHello._read(buf);break;case HANDSHAKE_TYPE.SERVER_HELLO:msg=messages_ServerHello._read(buf);break;case HANDSHAKE_TYPE.NEW_SESSION_TICKET:msg=messages_NewSessionTicket._read(buf);break;case HANDSHAKE_TYPE.ENCRYPTED_EXTENSIONS:msg=EncryptedExtensions._read(buf);break;case HANDSHAKE_TYPE.FINISHED:msg=messages_Finished._read(buf);break;}
if(buf.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}});if(msg===null){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
return msg;}
write(buf){buf.writeUint8(this.TYPE_TAG);buf.writeVector24(buf=>{this._write(buf);});}
static _read(buf){throw new Error('not implemented');}
_write(buf){throw new Error('not implemented');}

static _readExtensions(messageType,buf){const extensions=new Map();buf.readVector16(buf=>{const ext=extensions_Extension.read(messageType,buf);if(extensions.has(ext.TYPE_TAG)){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
extensions.set(ext.TYPE_TAG,ext);extensions.lastSeenExtension=ext.TYPE_TAG;});return extensions;}
_writeExtensions(buf,extensions){buf.writeVector16(buf=>{extensions.forEach(ext=>{ext.write(this.TYPE_TAG,buf);});});}}
class messages_ClientHello extends messages_HandshakeMessage{constructor(random,sessionId,extensions){super();this.random=random;this.sessionId=sessionId;this.extensions=extensions;}
get TYPE_TAG(){return HANDSHAKE_TYPE.CLIENT_HELLO;}
static _read(buf){
if(buf.readUint16()<VERSION_TLS_1_0){throw new TLSError(ALERT_DESCRIPTION.PROTOCOL_VERSION);}
const random=buf.readBytes(32);const sessionId=buf.readVectorBytes8();let found=false;buf.readVector16(buf=>{const cipherSuite=buf.readUint16();if(cipherSuite===TLS_AES_128_GCM_SHA256){found=true;}});if(!found){throw new TLSError(ALERT_DESCRIPTION.HANDSHAKE_FAILURE);}

const legacyCompressionMethods=buf.readVectorBytes8();if(legacyCompressionMethods.byteLength!==1){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
if(legacyCompressionMethods[0]!==0x00){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
const extensions=this._readExtensions(HANDSHAKE_TYPE.CLIENT_HELLO,buf);if(!extensions.has(EXTENSION_TYPE.SUPPORTED_VERSIONS)){throw new TLSError(ALERT_DESCRIPTION.MISSING_EXTENSION);}
if(extensions.get(EXTENSION_TYPE.SUPPORTED_VERSIONS).versions.indexOf(VERSION_TLS_1_3)===-1){throw new TLSError(ALERT_DESCRIPTION.PROTOCOL_VERSION);}
if(extensions.has(EXTENSION_TYPE.PRE_SHARED_KEY)){if(extensions.lastSeenExtension!==EXTENSION_TYPE.PRE_SHARED_KEY){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}}
return new this(random,sessionId,extensions);}
_write(buf){buf.writeUint16(VERSION_TLS_1_2);buf.writeBytes(this.random);buf.writeVectorBytes8(this.sessionId); buf.writeVector16(buf=>{buf.writeUint16(TLS_AES_128_GCM_SHA256);}); buf.writeVectorBytes8(new Uint8Array(1));this._writeExtensions(buf,this.extensions);}}
class messages_ServerHello extends messages_HandshakeMessage{constructor(random,sessionId,extensions){super();this.random=random;this.sessionId=sessionId;this.extensions=extensions;}
get TYPE_TAG(){return HANDSHAKE_TYPE.SERVER_HELLO;}
static _read(buf){if(buf.readUint16()!==VERSION_TLS_1_2){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
const random=buf.readBytes(32);const sessionId=buf.readVectorBytes8();if(buf.readUint16()!==TLS_AES_128_GCM_SHA256){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
if(buf.readUint8()!==0){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
const extensions=this._readExtensions(HANDSHAKE_TYPE.SERVER_HELLO,buf);if(!extensions.has(EXTENSION_TYPE.SUPPORTED_VERSIONS)){throw new TLSError(ALERT_DESCRIPTION.MISSING_EXTENSION);}
if(extensions.get(EXTENSION_TYPE.SUPPORTED_VERSIONS).selectedVersion!==VERSION_TLS_1_3){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
return new this(random,sessionId,extensions);}
_write(buf){buf.writeUint16(VERSION_TLS_1_2);buf.writeBytes(this.random);buf.writeVectorBytes8(this.sessionId); buf.writeUint16(TLS_AES_128_GCM_SHA256); buf.writeUint8(0);this._writeExtensions(buf,this.extensions);}}
class EncryptedExtensions extends messages_HandshakeMessage{constructor(extensions){super();this.extensions=extensions;}
get TYPE_TAG(){return HANDSHAKE_TYPE.ENCRYPTED_EXTENSIONS;}
static _read(buf){const extensions=this._readExtensions(HANDSHAKE_TYPE.ENCRYPTED_EXTENSIONS,buf);return new this(extensions);}
_write(buf){this._writeExtensions(buf,this.extensions);}}
class messages_Finished extends messages_HandshakeMessage{constructor(verifyData){super();this.verifyData=verifyData;}
get TYPE_TAG(){return HANDSHAKE_TYPE.FINISHED;}
static _read(buf){const verifyData=buf.readBytes(HASH_LENGTH);return new this(verifyData);}
_write(buf){buf.writeBytes(this.verifyData);}}

class messages_NewSessionTicket extends messages_HandshakeMessage{constructor(ticketLifetime,ticketAgeAdd,ticketNonce,ticket,extensions){super();this.ticketLifetime=ticketLifetime;this.ticketAgeAdd=ticketAgeAdd;this.ticketNonce=ticketNonce;this.ticket=ticket;this.extensions=extensions;}
get TYPE_TAG(){return HANDSHAKE_TYPE.NEW_SESSION_TICKET;}
static _read(buf){const ticketLifetime=buf.readUint32();const ticketAgeAdd=buf.readUint32();const ticketNonce=buf.readVectorBytes8();const ticket=buf.readVectorBytes16();if(ticket.byteLength<1){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
const extensions=this._readExtensions(HANDSHAKE_TYPE.NEW_SESSION_TICKET,buf);return new this(ticketLifetime,ticketAgeAdd,ticketNonce,ticket,extensions);}
_write(buf){buf.writeUint32(this.ticketLifetime);buf.writeUint32(this.ticketAgeAdd);buf.writeVectorBytes8(this.ticketNonce);buf.writeVectorBytes16(this.ticket);this._writeExtensions(buf,this.extensions);}}     
 
 
 
  
class states_State{constructor(conn){this.conn=conn;}
async initialize(){}
async sendApplicationData(bytes){
throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
async recvApplicationData(bytes){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
async recvHandshakeMessage(msg){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
async recvAlertMessage(alert){switch(alert.description){case ALERT_DESCRIPTION.CLOSE_NOTIFY:this.conn._closeForRecv(alert);throw alert;default:return await this.handleErrorAndRethrow(alert);}}
async recvChangeCipherSpec(bytes){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
async handleErrorAndRethrow(err){let alert=err;if(!(alert instanceof TLSAlert)){alert=new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}

try{await this.conn._sendAlertMessage(alert);}catch(_){}
await this.conn._transition(ERROR,err);throw err;}
async close(){const alert=new TLSCloseNotify();await this.conn._sendAlertMessage(alert);this.conn._closeForSend(alert);}}

class UNINITIALIZED extends states_State{async initialize(){throw new Error('uninitialized state');}
async sendApplicationData(bytes){throw new Error('uninitialized state');}
async recvApplicationData(bytes){throw new Error('uninitialized state');}
async recvHandshakeMessage(msg){throw new Error('uninitialized state');}
async recvChangeCipherSpec(bytes){throw new Error('uninitialized state');}
async handleErrorAndRethrow(err){throw err;}
async close(){throw new Error('uninitialized state');}}

class ERROR extends states_State{async initialize(err){this.error=err;this.conn._setConnectionFailure(err);this.conn._recordlayer.setSendError(err);this.conn._recordlayer.setRecvError(err);}
async sendApplicationData(bytes){throw this.error;}
async recvApplicationData(bytes){throw this.error;}
async recvHandshakeMessage(msg){throw this.error;}
async recvAlertMessage(err){throw this.error;}
async recvChangeCipherSpec(bytes){throw this.error;}
async handleErrorAndRethrow(err){throw err;}
async close(){throw this.error;}}

class states_CONNECTED extends states_State{async initialize(){this.conn._setConnectionSuccess();}
async sendApplicationData(bytes){await this.conn._sendApplicationData(bytes);}
async recvApplicationData(bytes){return bytes;}
async recvChangeCipherSpec(bytes){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}}



class states_MidHandshakeState extends states_State{async recvChangeCipherSpec(bytes){if(this.conn._hasSeenChangeCipherSpec){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
if(bytes.byteLength!==1||bytes[0]!==1){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
this.conn._hasSeenChangeCipherSpec=true;}}








class states_CLIENT_START extends states_State{async initialize(){const keyschedule=this.conn._keyschedule;await keyschedule.addPSK(this.conn.psk);const clientHello=new messages_ClientHello(await getRandomBytes(32),
await getRandomBytes(32),[new extensions_SupportedVersionsExtension([VERSION_TLS_1_3]),new extensions_PskKeyExchangeModesExtension([PSK_MODE_KE]),new extensions_PreSharedKeyExtension([this.conn.pskId],[zeros(HASH_LENGTH)]),],);const buf=new utils_BufferWriter();clientHello.write(buf);
const PSK_BINDERS_SIZE=HASH_LENGTH+1+2;const truncatedTranscript=buf.slice(0,buf.tell()-PSK_BINDERS_SIZE);const pskBinder=await keyschedule.calculateFinishedMAC(keyschedule.extBinderKey,truncatedTranscript);buf.incr(-HASH_LENGTH);buf.writeBytes(pskBinder);await this.conn._sendHandshakeMessageBytes(buf.flush());await this.conn._transition(states_CLIENT_WAIT_SH,clientHello.sessionId);}}
class states_CLIENT_WAIT_SH extends states_State{async initialize(sessionId){this._sessionId=sessionId;}
async recvHandshakeMessage(msg){if(!(msg instanceof messages_ServerHello)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
if(!bytesAreEqual(msg.sessionId,this._sessionId)){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
const pskExt=msg.extensions.get(EXTENSION_TYPE.PRE_SHARED_KEY);if(!pskExt){throw new TLSError(ALERT_DESCRIPTION.MISSING_EXTENSION);}
if(msg.extensions.size!==2){throw new TLSError(ALERT_DESCRIPTION.UNSUPPORTED_EXTENSION);}
if(pskExt.selectedIdentity!==0){throw new TLSError(ALERT_DESCRIPTION.ILLEGAL_PARAMETER);}
await this.conn._keyschedule.addECDHE(null);await this.conn._setSendKey(this.conn._keyschedule.clientHandshakeTrafficSecret);await this.conn._setRecvKey(this.conn._keyschedule.serverHandshakeTrafficSecret);await this.conn._transition(states_CLIENT_WAIT_EE);}}
class states_CLIENT_WAIT_EE extends states_MidHandshakeState{async recvHandshakeMessage(msg){
if(!(msg instanceof EncryptedExtensions)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
if(msg.extensions.size!==0){throw new TLSError(ALERT_DESCRIPTION.UNSUPPORTED_EXTENSION);}
const keyschedule=this.conn._keyschedule;const serverFinishedTranscript=keyschedule.getTranscript();await this.conn._transition(states_CLIENT_WAIT_FINISHED,serverFinishedTranscript);}}
class states_CLIENT_WAIT_FINISHED extends states_State{async initialize(serverFinishedTranscript){this._serverFinishedTranscript=serverFinishedTranscript;}
async recvHandshakeMessage(msg){if(!(msg instanceof messages_Finished)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
const keyschedule=this.conn._keyschedule;await keyschedule.verifyFinishedMAC(keyschedule.serverHandshakeTrafficSecret,msg.verifyData,this._serverFinishedTranscript);const clientFinishedMAC=await keyschedule.calculateFinishedMAC(keyschedule.clientHandshakeTrafficSecret);await keyschedule.finalize();await this.conn._sendHandshakeMessage(new messages_Finished(clientFinishedMAC));await this.conn._setSendKey(keyschedule.clientApplicationTrafficSecret);await this.conn._setRecvKey(keyschedule.serverApplicationTrafficSecret);await this.conn._transition(states_CLIENT_CONNECTED);}}
class states_CLIENT_CONNECTED extends states_CONNECTED{async recvHandshakeMessage(msg){

if(!(msg instanceof messages_NewSessionTicket)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}}}








class states_SERVER_START extends states_State{async recvHandshakeMessage(msg){if(!(msg instanceof messages_ClientHello)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}

const pskExt=msg.extensions.get(EXTENSION_TYPE.PRE_SHARED_KEY);const pskModesExt=msg.extensions.get(EXTENSION_TYPE.PSK_KEY_EXCHANGE_MODES);if(!pskExt||!pskModesExt){throw new TLSError(ALERT_DESCRIPTION.MISSING_EXTENSION);}
if(pskModesExt.modes.indexOf(PSK_MODE_KE)===-1){throw new TLSError(ALERT_DESCRIPTION.HANDSHAKE_FAILURE);}
const pskIndex=pskExt.identities.findIndex(pskId=>bytesAreEqual(pskId,this.conn.pskId));if(pskIndex===-1){throw new TLSError(ALERT_DESCRIPTION.UNKNOWN_PSK_IDENTITY);}
await this.conn._keyschedule.addPSK(this.conn.psk);const keyschedule=this.conn._keyschedule;const transcript=keyschedule.getTranscript();let pskBindersSize=2;for(const binder of pskExt.binders){pskBindersSize+=binder.byteLength+1;}
await keyschedule.verifyFinishedMAC(keyschedule.extBinderKey,pskExt.binders[pskIndex],transcript.slice(0,-pskBindersSize));await this.conn._transition(states_SERVER_NEGOTIATED,msg.sessionId,pskIndex);}}
class states_SERVER_NEGOTIATED extends states_MidHandshakeState{async initialize(sessionId,pskIndex){await this.conn._sendHandshakeMessage(new messages_ServerHello( await getRandomBytes(32),sessionId,[new extensions_SupportedVersionsExtension(null,VERSION_TLS_1_3),new extensions_PreSharedKeyExtension(null,null,pskIndex),]));if(sessionId.byteLength>0){await this.conn._sendChangeCipherSpec();}
const keyschedule=this.conn._keyschedule;await keyschedule.addECDHE(null);await this.conn._setSendKey(keyschedule.serverHandshakeTrafficSecret);await this.conn._setRecvKey(keyschedule.clientHandshakeTrafficSecret);await this.conn._sendHandshakeMessage(new EncryptedExtensions([]));const serverFinishedMAC=await keyschedule.calculateFinishedMAC(keyschedule.serverHandshakeTrafficSecret);await this.conn._sendHandshakeMessage(new messages_Finished(serverFinishedMAC));
const clientFinishedTranscript=await keyschedule.getTranscript();const clientHandshakeTrafficSecret=keyschedule.clientHandshakeTrafficSecret;await keyschedule.finalize();await this.conn._setSendKey(keyschedule.serverApplicationTrafficSecret);await this.conn._transition(states_SERVER_WAIT_FINISHED,clientHandshakeTrafficSecret,clientFinishedTranscript);}}
class states_SERVER_WAIT_FINISHED extends states_MidHandshakeState{async initialize(clientHandshakeTrafficSecret,clientFinishedTranscript){this._clientHandshakeTrafficSecret=clientHandshakeTrafficSecret;this._clientFinishedTranscript=clientFinishedTranscript;}
async recvHandshakeMessage(msg){if(!(msg instanceof messages_Finished)){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
const keyschedule=this.conn._keyschedule;await keyschedule.verifyFinishedMAC(this._clientHandshakeTrafficSecret,msg.verifyData,this._clientFinishedTranscript);this._clientHandshakeTrafficSecret=this._clientFinishedTranscript=null;await this.conn._setRecvKey(keyschedule.clientApplicationTrafficSecret);await this.conn._transition(states_CONNECTED);}}    
 
 
  
   
   
 
   
 
   
 
  
 
const STAGE_UNINITIALIZED=0;const STAGE_EARLY_SECRET=1;const STAGE_HANDSHAKE_SECRET=2;const STAGE_MASTER_SECRET=3;class keyschedule_KeySchedule{constructor(){this.stage=STAGE_UNINITIALIZED;
this.transcript=new utils_BufferWriter();this.secret=null;this.extBinderKey=null;this.clientHandshakeTrafficSecret=null;this.serverHandshakeTrafficSecret=null;this.clientApplicationTrafficSecret=null;this.serverApplicationTrafficSecret=null;}
async addPSK(psk){if(psk===null){psk=zeros(HASH_LENGTH);}
if(this.stage!==STAGE_UNINITIALIZED){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
this.stage=STAGE_EARLY_SECRET;this.secret=await hkdfExtract(zeros(HASH_LENGTH),psk);this.extBinderKey=await this.deriveSecret('ext binder',EMPTY);this.secret=await this.deriveSecret('derived',EMPTY);}
async addECDHE(ecdhe){if(ecdhe===null){ecdhe=zeros(HASH_LENGTH);}
if(this.stage!==STAGE_EARLY_SECRET){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
this.stage=STAGE_HANDSHAKE_SECRET;this.extBinderKey=null;this.secret=await hkdfExtract(this.secret,ecdhe);this.clientHandshakeTrafficSecret=await this.deriveSecret('c hs traffic');this.serverHandshakeTrafficSecret=await this.deriveSecret('s hs traffic');this.secret=await this.deriveSecret('derived',EMPTY);}
async finalize(){if(this.stage!==STAGE_HANDSHAKE_SECRET){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
this.stage=STAGE_MASTER_SECRET;this.clientHandshakeTrafficSecret=null;this.serverHandshakeTrafficSecret=null;this.secret=await hkdfExtract(this.secret,zeros(HASH_LENGTH));this.clientApplicationTrafficSecret=await this.deriveSecret('c ap traffic');this.serverApplicationTrafficSecret=await this.deriveSecret('s ap traffic');this.secret=null;}
addToTranscript(bytes){this.transcript.writeBytes(bytes);}
getTranscript(){return this.transcript.slice();}
async deriveSecret(label,transcript=undefined){transcript=transcript||this.getTranscript();return await hkdfExpandLabel(this.secret,label,await hash(transcript),HASH_LENGTH);}
async calculateFinishedMAC(baseKey,transcript=undefined){transcript=transcript||this.getTranscript();const finishedKey=await hkdfExpandLabel(baseKey,'finished',EMPTY,HASH_LENGTH);return await hmac(finishedKey,await hash(transcript));}
async verifyFinishedMAC(baseKey,mac,transcript=undefined){transcript=transcript||this.getTranscript();const finishedKey=await hkdfExpandLabel(baseKey,'finished',EMPTY,HASH_LENGTH);await verifyHmac(finishedKey,mac,await hash(transcript));}}   
   
 
   
            
         
      
  
      
const RECORD_TYPE={CHANGE_CIPHER_SPEC:20,ALERT:21,HANDSHAKE:22,APPLICATION_DATA:23,};


const MAX_SEQUENCE_NUMBER=Math.pow(2,24);const MAX_RECORD_SIZE=Math.pow(2,14);const MAX_ENCRYPTED_RECORD_SIZE=MAX_RECORD_SIZE+256;const RECORD_HEADER_SIZE=5;
class recordlayer_CipherState{constructor(key,iv){this.key=key;this.iv=iv;this.seqnum=0;}
static async create(baseKey,mode){ const key=await prepareKey(await hkdfExpandLabel(baseKey,'key',EMPTY,KEY_LENGTH),mode);const iv=await hkdfExpandLabel(baseKey,'iv',EMPTY,IV_LENGTH);return new this(key,iv);}
nonce(){


const nonce=this.iv.slice();const dv=new DataView(nonce.buffer,nonce.byteLength-4,4);dv.setUint32(0,dv.getUint32(0)^this.seqnum);this.seqnum+=1;if(this.seqnum>MAX_SEQUENCE_NUMBER){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
return nonce;}}
class recordlayer_EncryptionState extends recordlayer_CipherState{static async create(key){return super.create(key,'encrypt');}
async encrypt(plaintext,additionalData){return await encrypt(this.key,this.nonce(),plaintext,additionalData);}}
class recordlayer_DecryptionState extends recordlayer_CipherState{static async create(key){return super.create(key,'decrypt');}
async decrypt(ciphertext,additionalData){return await decrypt(this.key,this.nonce(),ciphertext,additionalData);}}
class recordlayer_RecordLayer{constructor(sendCallback){this.sendCallback=sendCallback;this._sendEncryptState=null;this._sendError=null;this._recvDecryptState=null;this._recvError=null;this._pendingRecordType=0;this._pendingRecordBuf=null;}
async setSendKey(key){await this.flush();this._sendEncryptState=await recordlayer_EncryptionState.create(key);}
async setRecvKey(key){this._recvDecryptState=await recordlayer_DecryptionState.create(key);}
async setSendError(err){this._sendError=err;}
async setRecvError(err){this._recvError=err;}
async send(type,data){if(this._sendError!==null){throw this._sendError;}
if(data.byteLength>MAX_RECORD_SIZE){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
if(this._pendingRecordType&&this._pendingRecordType!==type){await this.flush();}
if(this._pendingRecordBuf!==null){if(this._pendingRecordBuf.tell()+data.byteLength>MAX_RECORD_SIZE){await this.flush();}}
if(this._pendingRecordBuf===null){this._pendingRecordType=type;this._pendingRecordBuf=new utils_BufferWriter();this._pendingRecordBuf.incr(RECORD_HEADER_SIZE);}
this._pendingRecordBuf.writeBytes(data);}
async flush(){const buf=this._pendingRecordBuf;let type=this._pendingRecordType;if(!type){if(buf!==null){throw new TLSError(ALERT_DESCRIPTION.INTERNAL_ERROR);}
return;}
if(this._sendError!==null){throw this._sendError;}

let inflation=0,innerPlaintext=null;if(this._sendEncryptState!==null){buf.writeUint8(type);innerPlaintext=buf.slice(RECORD_HEADER_SIZE);inflation=AEAD_SIZE_INFLATION;type=RECORD_TYPE.APPLICATION_DATA;}
const length=buf.tell()-RECORD_HEADER_SIZE+inflation;buf.seek(0);buf.writeUint8(type);buf.writeUint16(VERSION_TLS_1_2);buf.writeUint16(length);if(this._sendEncryptState!==null){const additionalData=buf.slice(0,RECORD_HEADER_SIZE);const ciphertext=await this._sendEncryptState.encrypt(innerPlaintext,additionalData);buf.writeBytes(ciphertext);}else{buf.incr(length);}
this._pendingRecordBuf=null;this._pendingRecordType=0;await this.sendCallback(buf.flush());}
async recv(data){if(this._recvError!==null){throw this._recvError;}






const buf=new utils_BufferReader(data);let type=buf.readUint8();const version=buf.readUint16();if(version!==VERSION_TLS_1_2){if(this._recvDecryptState!==null||version!==VERSION_TLS_1_0){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}}
const length=buf.readUint16();let plaintext;if(this._recvDecryptState===null||type===RECORD_TYPE.CHANGE_CIPHER_SPEC){[type,plaintext]=await this._readPlaintextRecord(type,length,buf);}else{[type,plaintext]=await this._readEncryptedRecord(type,length,buf);}
if(buf.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
return[type,plaintext];} 
async _readPlaintextRecord(type,length,buf){if(length>MAX_RECORD_SIZE){throw new TLSError(ALERT_DESCRIPTION.RECORD_OVERFLOW);}
return[type,buf.readBytes(length)];}
async _readEncryptedRecord(type,length,buf){if(length>MAX_ENCRYPTED_RECORD_SIZE){throw new TLSError(ALERT_DESCRIPTION.RECORD_OVERFLOW);}
if(type!==RECORD_TYPE.APPLICATION_DATA){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}

buf.incr(-RECORD_HEADER_SIZE);const additionalData=buf.readBytes(RECORD_HEADER_SIZE);const ciphertext=buf.readBytes(length);const paddedPlaintext=await this._recvDecryptState.decrypt(ciphertext,additionalData);
let i;for(i=paddedPlaintext.byteLength-1;i>=0;i--){if(paddedPlaintext[i]!==0){break;}}
if(i<0){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
type=paddedPlaintext[i];if(type===RECORD_TYPE.CHANGE_CIPHER_SPEC){throw new TLSError(ALERT_DESCRIPTION.DECODE_ERROR);}
return[type,paddedPlaintext.slice(0,i)];}}  
 
           
     
  
 
          
 
     
          
 
class tlsconnection_Connection{constructor(psk,pskId,sendCallback){this.psk=assertIsBytes(psk);this.pskId=assertIsBytes(pskId);this.connected=new Promise((resolve,reject)=>{this._onConnectionSuccess=resolve;this._onConnectionFailure=reject;});this._state=new UNINITIALIZED(this);this._handshakeRecvBuffer=null;this._hasSeenChangeCipherSpec=false;this._recordlayer=new recordlayer_RecordLayer(sendCallback);this._keyschedule=new keyschedule_KeySchedule();this._lastPromise=Promise.resolve();}
static async create(psk,pskId,sendCallback){return new this(psk,pskId,sendCallback);}

async send(data){assertIsBytes(data);await this.connected;await this._synchronized(async()=>{await this._state.sendApplicationData(data);});}
async recv(data){assertIsBytes(data);return await this._synchronized(async()=>{const[type,bytes]=await this._recordlayer.recv(data);switch(type){case RECORD_TYPE.CHANGE_CIPHER_SPEC:await this._state.recvChangeCipherSpec(bytes);return null;case RECORD_TYPE.ALERT:await this._state.recvAlertMessage(TLSAlert.fromBytes(bytes));return null;case RECORD_TYPE.APPLICATION_DATA:return await this._state.recvApplicationData(bytes);case RECORD_TYPE.HANDSHAKE:
this._handshakeRecvBuffer=new utils_BufferReader(bytes);if(!this._handshakeRecvBuffer.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
do{
 this._handshakeRecvBuffer.incr(1);const mlength=this._handshakeRecvBuffer.readUint24();this._handshakeRecvBuffer.incr(-4);const messageBytes=this._handshakeRecvBuffer.readBytes(mlength+4);this._keyschedule.addToTranscript(messageBytes);await this._state.recvHandshakeMessage(messages_HandshakeMessage.fromBytes(messageBytes));}while(this._handshakeRecvBuffer.hasMoreBytes());this._handshakeRecvBuffer=null;return null;default:throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}});}
async close(){await this._synchronized(async()=>{await this._state.close();});}


_synchronized(cb){const nextPromise=this._lastPromise.then(()=>{return cb();}).catch(async err=>{if(err instanceof TLSCloseNotify){throw err;}
await this._state.handleErrorAndRethrow(err);});this._lastPromise=nextPromise.then(noop,noop);return nextPromise;}
async _transition(State,...args){this._state=new State(this);await this._state.initialize(...args);await this._recordlayer.flush();}

async _sendApplicationData(bytes){await this._recordlayer.send(RECORD_TYPE.APPLICATION_DATA,bytes);await this._recordlayer.flush();}
async _sendHandshakeMessage(msg){await this._sendHandshakeMessageBytes(msg.toBytes());}
async _sendHandshakeMessageBytes(bytes){this._keyschedule.addToTranscript(bytes);await this._recordlayer.send(RECORD_TYPE.HANDSHAKE,bytes);
}
async _sendAlertMessage(err){await this._recordlayer.send(RECORD_TYPE.ALERT,err.toBytes());await this._recordlayer.flush();}
async _sendChangeCipherSpec(){await this._recordlayer.send(RECORD_TYPE.CHANGE_CIPHER_SPEC,new Uint8Array([0x01]));await this._recordlayer.flush();}
async _setSendKey(key){return await this._recordlayer.setSendKey(key);}
async _setRecvKey(key){if(this._handshakeRecvBuffer&&this._handshakeRecvBuffer.hasMoreBytes()){throw new TLSError(ALERT_DESCRIPTION.UNEXPECTED_MESSAGE);}
return await this._recordlayer.setRecvKey(key);}
_setConnectionSuccess(){if(this._onConnectionSuccess!==null){this._onConnectionSuccess();this._onConnectionSuccess=null;this._onConnectionFailure=null;}}
_setConnectionFailure(err){if(this._onConnectionFailure!==null){this._onConnectionFailure(err);this._onConnectionSuccess=null;this._onConnectionFailure=null;}}
_closeForSend(alert){this._recordlayer.setSendError(alert);}
_closeForRecv(alert){this._recordlayer.setRecvError(alert);}}
class tlsconnection_ClientConnection extends tlsconnection_Connection{static async create(psk,pskId,sendCallback){const instance=await super.create(psk,pskId,sendCallback);await instance._transition(states_CLIENT_START);return instance;}}
class tlsconnection_ServerConnection extends tlsconnection_Connection{static async create(psk,pskId,sendCallback){const instance=await super.create(psk,pskId,sendCallback);await instance._transition(states_SERVER_START);return instance;}}   
const privateData=new WeakMap();const wrappers=new WeakMap();function pd(event){const retv=privateData.get(event);console.assert(retv!=null,"'this' is expected an Event object, but got",event);return retv}
function setCancelFlag(data){if(data.passiveListener!=null){if(typeof console!=="undefined"&&typeof console.error==="function"){console.error("Unable to preventDefault inside passive event listener invocation.",data.passiveListener);}
return}
if(!data.event.cancelable){return}
data.canceled=true;if(typeof data.event.preventDefault==="function"){data.event.preventDefault();}}
function Event(eventTarget,event){privateData.set(this,{eventTarget,event,eventPhase:2,currentTarget:eventTarget,canceled:false,stopped:false,immediateStopped:false,passiveListener:null,timeStamp:event.timeStamp||Date.now(),}); Object.defineProperty(this,"isTrusted",{value:false,enumerable:true}); const keys=Object.keys(event);for(let i=0;i<keys.length;++i){const key=keys[i];if(!(key in this)){Object.defineProperty(this,key,defineRedirectDescriptor(key));}}}
Event.prototype={get type(){return pd(this).event.type},get target(){return pd(this).eventTarget},get currentTarget(){return pd(this).currentTarget},composedPath(){const currentTarget=pd(this).currentTarget;if(currentTarget==null){return[]}
return[currentTarget]},get NONE(){return 0},get CAPTURING_PHASE(){return 1},get AT_TARGET(){return 2},get BUBBLING_PHASE(){return 3},get eventPhase(){return pd(this).eventPhase},stopPropagation(){const data=pd(this);data.stopped=true;if(typeof data.event.stopPropagation==="function"){data.event.stopPropagation();}},stopImmediatePropagation(){const data=pd(this);data.stopped=true;data.immediateStopped=true;if(typeof data.event.stopImmediatePropagation==="function"){data.event.stopImmediatePropagation();}},get bubbles(){return Boolean(pd(this).event.bubbles)},get cancelable(){return Boolean(pd(this).event.cancelable)},preventDefault(){setCancelFlag(pd(this));},get defaultPrevented(){return pd(this).canceled},get composed(){return Boolean(pd(this).event.composed)},get timeStamp(){return pd(this).timeStamp},get srcElement(){return pd(this).eventTarget},get cancelBubble(){return pd(this).stopped},set cancelBubble(value){if(!value){return}
const data=pd(this);data.stopped=true;if(typeof data.event.cancelBubble==="boolean"){data.event.cancelBubble=true;}},get returnValue(){return!pd(this).canceled},set returnValue(value){if(!value){setCancelFlag(pd(this));}},initEvent(){},};Object.defineProperty(Event.prototype,"constructor",{value:Event,configurable:true,writable:true,});if(typeof window!=="undefined"&&typeof window.Event!=="undefined"){Object.setPrototypeOf(Event.prototype,window.Event.prototype);wrappers.set(window.Event.prototype,Event);}
function defineRedirectDescriptor(key){return{get(){return pd(this).event[key]},set(value){pd(this).event[key]=value;},configurable:true,enumerable:true,}}
function defineCallDescriptor(key){return{value(){const event=pd(this).event;return event[key].apply(event,arguments)},configurable:true,enumerable:true,}}
function defineWrapper(BaseEvent,proto){const keys=Object.keys(proto);if(keys.length===0){return BaseEvent}
function CustomEvent(eventTarget,event){BaseEvent.call(this,eventTarget,event);}
CustomEvent.prototype=Object.create(BaseEvent.prototype,{constructor:{value:CustomEvent,configurable:true,writable:true},});for(let i=0;i<keys.length;++i){const key=keys[i];if(!(key in BaseEvent.prototype)){const descriptor=Object.getOwnPropertyDescriptor(proto,key);const isFunc=typeof descriptor.value==="function";Object.defineProperty(CustomEvent.prototype,key,isFunc?defineCallDescriptor(key):defineRedirectDescriptor(key));}}
return CustomEvent}
function getWrapper(proto){if(proto==null||proto===Object.prototype){return Event}
let wrapper=wrappers.get(proto);if(wrapper==null){wrapper=defineWrapper(getWrapper(Object.getPrototypeOf(proto)),proto);wrappers.set(proto,wrapper);}
return wrapper}
function wrapEvent(eventTarget,event){const Wrapper=getWrapper(Object.getPrototypeOf(event));return new Wrapper(eventTarget,event)}
function isStopped(event){return pd(event).immediateStopped}
function setEventPhase(event,eventPhase){pd(event).eventPhase=eventPhase;}
function setCurrentTarget(event,currentTarget){pd(event).currentTarget=currentTarget;}
function setPassiveListener(event,passiveListener){pd(event).passiveListener=passiveListener;}
const listenersMap=new WeakMap();const CAPTURE=1;const BUBBLE=2;const ATTRIBUTE=3;function isObject(x){return x!==null&&typeof x==="object"}
function getListeners(eventTarget){const listeners=listenersMap.get(eventTarget);if(listeners==null){throw new TypeError("'this' is expected an EventTarget object, but got another value.")}
return listeners}
function defineEventAttributeDescriptor(eventName){return{get(){const listeners=getListeners(this);let node=listeners.get(eventName);while(node!=null){if(node.listenerType===ATTRIBUTE){return node.listener}
node=node.next;}
return null},set(listener){if(typeof listener!=="function"&&!isObject(listener)){listener=null;}
const listeners=getListeners(this);let prev=null;let node=listeners.get(eventName);while(node!=null){if(node.listenerType===ATTRIBUTE){if(prev!==null){prev.next=node.next;}else if(node.next!==null){listeners.set(eventName,node.next);}else{listeners.delete(eventName);}}else{prev=node;}
node=node.next;}
if(listener!==null){const newNode={listener,listenerType:ATTRIBUTE,passive:false,once:false,next:null,};if(prev===null){listeners.set(eventName,newNode);}else{prev.next=newNode;}}},configurable:true,enumerable:true,}}
function defineEventAttribute(eventTargetPrototype,eventName){Object.defineProperty(eventTargetPrototype,`on${eventName}`,defineEventAttributeDescriptor(eventName));}
function defineCustomEventTarget(eventNames){function CustomEventTarget(){EventTarget.call(this);}
CustomEventTarget.prototype=Object.create(EventTarget.prototype,{constructor:{value:CustomEventTarget,configurable:true,writable:true,},});for(let i=0;i<eventNames.length;++i){defineEventAttribute(CustomEventTarget.prototype,eventNames[i]);}
return CustomEventTarget}
function EventTarget(){if(this instanceof EventTarget){listenersMap.set(this,new Map());return}
if(arguments.length===1&&Array.isArray(arguments[0])){return defineCustomEventTarget(arguments[0])}
if(arguments.length>0){const types=new Array(arguments.length);for(let i=0;i<arguments.length;++i){types[i]=arguments[i];}
return defineCustomEventTarget(types)}
throw new TypeError("Cannot call a class as a function")
}
EventTarget.prototype={addEventListener(eventName,listener,options){if(listener==null){return}
if(typeof listener!=="function"&&!isObject(listener)){throw new TypeError("'listener' should be a function or an object.")}
const listeners=getListeners(this);const optionsIsObj=isObject(options);const capture=optionsIsObj?Boolean(options.capture):Boolean(options);const listenerType=capture?CAPTURE:BUBBLE;const newNode={listener,listenerType,passive:optionsIsObj&&Boolean(options.passive),once:optionsIsObj&&Boolean(options.once),next:null,};let node=listeners.get(eventName);if(node===undefined){listeners.set(eventName,newNode);return}
let prev=null;while(node!=null){if(node.listener===listener&&node.listenerType===listenerType){return}
prev=node;node=node.next;}
prev.next=newNode;},removeEventListener(eventName,listener,options){if(listener==null){return}
const listeners=getListeners(this);const capture=isObject(options)?Boolean(options.capture):Boolean(options);const listenerType=capture?CAPTURE:BUBBLE;let prev=null;let node=listeners.get(eventName);while(node!=null){if(node.listener===listener&&node.listenerType===listenerType){if(prev!==null){prev.next=node.next;}else if(node.next!==null){listeners.set(eventName,node.next);}else{listeners.delete(eventName);}
return}
prev=node;node=node.next;}},dispatchEvent(event){if(event==null||typeof event.type!=="string"){throw new TypeError('"event.type" should be a string.')}
const listeners=getListeners(this);const eventName=event.type;let node=listeners.get(eventName);if(node==null){return true}
const wrappedEvent=wrapEvent(this,event);let prev=null;while(node!=null){ if(node.once){if(prev!==null){prev.next=node.next;}else if(node.next!==null){listeners.set(eventName,node.next);}else{listeners.delete(eventName);}}else{prev=node;} 
setPassiveListener(wrappedEvent,node.passive?node.listener:null);if(typeof node.listener==="function"){try{node.listener.call(this,wrappedEvent);}catch(err){if(typeof console!=="undefined"&&typeof console.error==="function"){console.error(err);}}}else if(node.listenerType!==ATTRIBUTE&&typeof node.listener.handleEvent==="function"){node.listener.handleEvent(wrappedEvent);}
if(isStopped(wrappedEvent)){break}
node=node.next;}
setPassiveListener(wrappedEvent,null);setEventPhase(wrappedEvent,0);setCurrentTarget(wrappedEvent,null);return!wrappedEvent.defaultPrevented},};Object.defineProperty(EventTarget.prototype,"constructor",{value:EventTarget,configurable:true,writable:true,});if(typeof window!=="undefined"&&typeof window.EventTarget!=="undefined"){Object.setPrototypeOf(EventTarget.prototype,window.EventTarget.prototype);}
var event_target_shim=(EventTarget); __webpack_require__.d(__webpack_exports__,"PairingChannel",function(){return src_PairingChannel;});__webpack_require__.d(__webpack_exports__,"_internals",function(){return _internals;});__webpack_require__.d(__webpack_exports__,"base64urlToBytes",function(){return base64urlToBytes;});__webpack_require__.d(__webpack_exports__,"bytesToBase64url",function(){return bytesToBase64url;});__webpack_require__.d(__webpack_exports__,"bytesToHex",function(){return bytesToHex;});__webpack_require__.d(__webpack_exports__,"bytesToUtf8",function(){return bytesToUtf8;});__webpack_require__.d(__webpack_exports__,"hexToBytes",function(){return hexToBytes;});__webpack_require__.d(__webpack_exports__,"TLSCloseNotify",function(){return TLSCloseNotify;});__webpack_require__.d(__webpack_exports__,"TLSError",function(){return TLSError;});__webpack_require__.d(__webpack_exports__,"utf8ToBytes",function(){return utf8ToBytes;});
const CLOSE_FLUSH_BUFFER_INTERVAL_MS=200;const CLOSE_FLUSH_BUFFER_MAX_TRIES=5;class src_PairingChannel extends EventTarget{constructor(channelId,channelKey,socket,connection){super();this._channelId=channelId;this._channelKey=channelKey;this._socket=socket;this._connection=connection;this._selfClosed=false;this._peerClosed=false;this._setupListeners();}
static create(channelServerURI){const wsURI=new URL('/v1/ws/',channelServerURI).href;const channelKey=crypto.getRandomValues(new Uint8Array(32));return this._makePairingChannel(wsURI,tlsconnection_ServerConnection,channelKey);}
static connect(channelServerURI,channelId,channelKey){const wsURI=new URL(`/v1/ws/${channelId}`,channelServerURI).href;return this._makePairingChannel(wsURI,tlsconnection_ClientConnection,channelKey);}
static _makePairingChannel(wsUri,ConnectionClass,psk){const socket=new WebSocket(wsUri);return new Promise((resolve,reject)=>{ let stopListening;const onConnectionError=async()=>{stopListening();reject(new Error('Error while creating the pairing channel'));};const onFirstMessage=async event=>{stopListening();try{const{channelid:channelId}=JSON.parse(event.data);const pskId=utf8ToBytes(channelId);const connection=await ConnectionClass.create(psk,pskId,data=>{
socket.send(bytesToBase64url(data));});const instance=new this(channelId,psk,socket,connection);resolve(instance);}catch(err){reject(err);}};stopListening=()=>{socket.removeEventListener('error',onConnectionError);socket.removeEventListener('message',onFirstMessage);};socket.addEventListener('error',onConnectionError);socket.addEventListener('message',onFirstMessage);});}
_setupListeners(){this._socket.addEventListener('message',async event=>{try{const channelServerEnvelope=JSON.parse(event.data);const payload=await this._connection.recv(base64urlToBytes(channelServerEnvelope.message));if(payload!==null){const data=JSON.parse(bytesToUtf8(payload));this.dispatchEvent(new CustomEvent('message',{detail:{data,sender:channelServerEnvelope.sender,},}));}}catch(error){let event;if(error instanceof TLSCloseNotify){this._peerClosed=true;if(this._selfClosed){this._shutdown();}
event=new CustomEvent('close');}else{event=new CustomEvent('error',{detail:{error,}});}
this.dispatchEvent(event);}});this._socket.addEventListener('error',()=>{this._shutdown();this.dispatchEvent(new CustomEvent('error',{detail:{error:new Error('WebSocket error.'),},}));});this._socket.addEventListener('close',()=>{this._shutdown();if(!this._peerClosed){this.dispatchEvent(new CustomEvent('error',{detail:{error:new Error('WebSocket unexpectedly closed'),}}));}});}
async send(data){const payload=utf8ToBytes(JSON.stringify(data));await this._connection.send(payload);}
async close(){this._selfClosed=true;await this._connection.close();try{let tries=0;while(this._socket.bufferedAmount>0){if(++tries>CLOSE_FLUSH_BUFFER_MAX_TRIES){throw new Error('Could not flush the outgoing buffer in time.');}
await new Promise(res=>setTimeout(res,CLOSE_FLUSH_BUFFER_INTERVAL_MS));}}finally{if(this._peerClosed){this._shutdown();}}}
_shutdown(){if(this._socket){this._socket.close();this._socket=null;this._connection=null;}}
get closed(){return(!this._socket)||(this._socket.readyState===3);}
get channelId(){return this._channelId;}
get channelKey(){return this._channelKey;}}
const _internals={arrayToBytes:arrayToBytes,BufferReader:utils_BufferReader,BufferWriter:utils_BufferWriter,bytesAreEqual:bytesAreEqual,bytesToHex:bytesToHex,bytesToUtf8:bytesToUtf8,ClientConnection:tlsconnection_ClientConnection,Connection:tlsconnection_Connection,DecryptionState:recordlayer_DecryptionState,EncryptedExtensions:EncryptedExtensions,EncryptionState:recordlayer_EncryptionState,Finished:messages_Finished,HASH_LENGTH:HASH_LENGTH,hexToBytes:hexToBytes,hkdfExpand:hkdfExpand,KeySchedule:keyschedule_KeySchedule,NewSessionTicket:messages_NewSessionTicket,RecordLayer:recordlayer_RecordLayer,ServerConnection:tlsconnection_ServerConnection,utf8ToBytes:utf8ToBytes,zeros:zeros,};})
])["PairingChannel"];