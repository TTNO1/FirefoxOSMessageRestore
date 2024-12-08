var EXPORTED_SYMBOLS=["CommonUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");var CommonUtils={union(a,b){let out=new Set(a);for(let x of b){out.add(x);}
return out;},difference(a,b){let out=new Set(a);for(let x of b){out.delete(x);}
return out;},intersection(a,b){let out=new Set();for(let x of a){if(b.has(x)){out.add(x);}}
return out;},setEqual(a,b){if(a.size!=b.size){return false;}
for(let x of a){if(!b.has(x)){return false;}}
return true;},arrayEqual(a,b){if(a.length!==b.length){return false;}
for(let i=0;i<a.length;i++){if(a[i]!==b[i]){return false;}}
return true;},encodeBase64URL:function encodeBase64URL(bytes,pad=true){let s=btoa(bytes).replace(/\+/g,"-").replace(/\//g,"_");if(!pad){return s.replace(/=+$/,"");}
return s;},makeURI:function makeURI(URIString){if(!URIString){return null;}
try{return Services.io.newURI(URIString);}catch(e){let log=Log.repository.getLogger("Common.Utils");log.debug("Could not create URI",e);return null;}},nextTick:function nextTick(callback,thisObj){if(thisObj){callback=callback.bind(thisObj);}
Services.tm.dispatchToMainThread(callback);},namedTimer:function namedTimer(callback,wait,thisObj,name){if(!thisObj||!name){throw new Error("You must provide both an object and a property name for the timer!");} 
if(name in thisObj&&thisObj[name]instanceof Ci.nsITimer){thisObj[name].delay=wait;return thisObj[name];} 
let timer=Object.create(Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer)); timer.clear=function(){thisObj[name]=null;timer.cancel();}; timer.initWithCallback({notify:function notify(){ timer.clear();callback.call(thisObj,timer);},},wait,timer.TYPE_ONE_SHOT);return(thisObj[name]=timer);},encodeUTF8:function encodeUTF8(str){try{str=this._utf8Converter.ConvertFromUnicode(str);return str+this._utf8Converter.Finish();}catch(ex){return null;}},decodeUTF8:function decodeUTF8(str){try{str=this._utf8Converter.ConvertToUnicode(str);return str+this._utf8Converter.Finish();}catch(ex){return null;}},byteArrayToString:function byteArrayToString(bytes){return bytes.map(byte=>String.fromCharCode(byte)).join("");},stringToByteArray:function stringToByteArray(bytesString){return Array.prototype.slice.call(bytesString).map(c=>c.charCodeAt(0));},
byteStringToArrayBuffer(byteString){if(byteString===undefined){return new Uint8Array();}
const bytes=new Uint8Array(byteString.length);for(let i=0;i<byteString.length;++i){bytes[i]=byteString.charCodeAt(i)&0xff;}
return bytes;},arrayBufferToByteString(buffer){return CommonUtils.byteArrayToString([...buffer]);},bufferToHex(buffer){return Array.prototype.map.call(buffer,x=>("00"+x.toString(16)).slice(-2)).join("");},bytesAsHex:function bytesAsHex(bytes){let s="";for(let i=0,len=bytes.length;i<len;i++){let c=(bytes[i].charCodeAt(0)&0xff).toString(16);if(c.length==1){c="0"+c;}
s+=c;}
return s;},stringAsHex:function stringAsHex(str){return CommonUtils.bytesAsHex(CommonUtils.encodeUTF8(str));},stringToBytes:function stringToBytes(str){return CommonUtils.hexToBytes(CommonUtils.stringAsHex(str));},hexToBytes:function hexToBytes(str){let bytes=[];for(let i=0;i<str.length-1;i+=2){bytes.push(parseInt(str.substr(i,2),16));}
return String.fromCharCode.apply(String,bytes);},hexToArrayBuffer(str){const octString=CommonUtils.hexToBytes(str);return CommonUtils.byteStringToArrayBuffer(octString);},hexAsString:function hexAsString(hex){return CommonUtils.decodeUTF8(CommonUtils.hexToBytes(hex));},base64urlToHex(b64str){return CommonUtils.bufferToHex(new Uint8Array(ChromeUtils.base64URLDecode(b64str,{padding:"reject"})));},encodeBase32:function encodeBase32(bytes){const key="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let leftover=bytes.length%5;if(leftover){for(let i=leftover;i<5;i++){bytes+="\0";}}

let ret="";for(let i=0;i<bytes.length;i+=5){let c=Array.prototype.slice.call(bytes.slice(i,i+5)).map(byte=>byte.charCodeAt(0));ret+=key[c[0]>>3]+
key[((c[0]<<2)&0x1f)|(c[1]>>6)]+
key[(c[1]>>1)&0x1f]+
key[((c[1]<<4)&0x1f)|(c[2]>>4)]+
key[((c[2]<<1)&0x1f)|(c[3]>>7)]+
key[(c[3]>>2)&0x1f]+
key[((c[3]<<3)&0x1f)|(c[4]>>5)]+
key[c[4]&0x1f];}
switch(leftover){case 1:return ret.slice(0,-6)+"======";case 2:return ret.slice(0,-4)+"====";case 3:return ret.slice(0,-3)+"===";case 4:return ret.slice(0,-1)+"=";default:return ret;}},decodeBase32:function decodeBase32(str){const key="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let padChar=str.indexOf("=");let chars=padChar==-1?str.length:padChar;let bytes=Math.floor((chars*5)/8);let blocks=Math.ceil(chars/8);function processBlock(ret,cOffset,rOffset){let c,val;
function accumulate(val){ret[rOffset]|=val;}
function advance(){c=str[cOffset++];if(!c||c==""||c=="="){throw new Error("Done");}
val=key.indexOf(c);if(val==-1){throw new Error(`Unknown character in base32: ${c}`);}}
function left(octet,shift){return(octet<<shift)&0xff;}
advance();accumulate(left(val,3));advance();accumulate(val>>2);++rOffset;accumulate(left(val,6));advance();accumulate(left(val,1));advance();accumulate(val>>4);++rOffset;accumulate(left(val,4));advance();accumulate(val>>1);++rOffset;accumulate(left(val,7));advance();accumulate(left(val,2));advance();accumulate(val>>3);++rOffset;accumulate(left(val,5));advance();accumulate(val);++rOffset;}
let ret=new Array(bytes);let i=0;let cOff=0;let rOff=0;for(;i<blocks;++i){try{processBlock(ret,cOff,rOff);}catch(ex){if(ex.message=="Done"){break;}
throw ex;}
cOff+=8;rOff+=5;}
return CommonUtils.byteArrayToString(ret.slice(0,bytes));},safeAtoB:function safeAtoB(b64){let len=b64.length;let over=len%4;return over?atob(b64.substr(0,len-over)):atob(b64);},readJSON(path){return OS.File.read(path,{encoding:"utf-8"}).then(data=>{return JSON.parse(data);});},writeJSON(contents,path){let data=JSON.stringify(contents);return OS.File.writeAtomic(path,data,{encoding:"utf-8",tmpPath:path+".tmp",});},ensureMillisecondsTimestamp:function ensureMillisecondsTimestamp(value){if(!value){return;}
if(!/^[0-9]+$/.test(value)){throw new Error("Timestamp value is not a positive integer: "+value);}
let intValue=parseInt(value,10);if(!intValue){return;}
if(intValue<10000000000){throw new Error("Timestamp appears to be in seconds: "+intValue);}},readBytesFromInputStream:function readBytesFromInputStream(stream,count){let BinaryInputStream=Components.Constructor("@mozilla.org/binaryinputstream;1","nsIBinaryInputStream","setInputStream");if(!count){count=stream.available();}
return new BinaryInputStream(stream).readBytes(count);},generateUUID:function generateUUID(){let uuid=Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();return uuid.substring(1,uuid.length-1);},getEpochPref:function getEpochPref(branch,pref,def=0,log=null){if(!Number.isInteger(def)){throw new Error("Default value is not a number: "+def);}
let valueStr=branch.get(pref,null);if(valueStr!==null){let valueInt=parseInt(valueStr,10);if(Number.isNaN(valueInt)){if(log){log.warn("Preference value is not an integer. Using default. "+
pref+"="+
valueStr+" -> "+
def);}
return def;}
return valueInt;}
return def;},getDatePref:function getDatePref(branch,pref,def=0,log=null,oldestYear=2010){let valueInt=this.getEpochPref(branch,pref,def,log);let date=new Date(valueInt);if(valueInt==def||date.getFullYear()>=oldestYear){return date;}
if(log){log.warn("Unexpected old date seen in pref. Returning default: "+
pref+"="+
date+" -> "+
def);}
return new Date(def);},setDatePref:function setDatePref(branch,pref,date,oldestYear=2010){if(date.getFullYear()<oldestYear){throw new Error("Trying to set "+
pref+" to a very old time: "+
date+". The current time is "+
new Date()+". Is the system clock wrong?");}
branch.set(pref,""+date.getTime());},convertString:function convertString(s,source,dest){if(!s){throw new Error("Input string must be defined.");}
let is=Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);is.setData(s,s.length);let listener=Cc["@mozilla.org/network/stream-loader;1"].createInstance(Ci.nsIStreamLoader);let result;listener.init({onStreamComplete:function onStreamComplete(loader,context,status,length,data){result=String.fromCharCode.apply(this,data);},});let converter=this._converterService.asyncConvertData(source,dest,listener,null);converter.onStartRequest(null,null);converter.onDataAvailable(null,is,0,s.length);converter.onStopRequest(null,null,null);return result;},};XPCOMUtils.defineLazyGetter(CommonUtils,"_utf8Converter",function(){let converter=Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);converter.charset="UTF-8";return converter;});XPCOMUtils.defineLazyGetter(CommonUtils,"_converterService",function(){return Cc["@mozilla.org/streamConverters;1"].getService(Ci.nsIStreamConverterService);});