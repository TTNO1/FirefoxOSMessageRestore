//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["WebRequestUpload"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");const{DefaultMap}=ExtensionUtils;XPCOMUtils.defineLazyGlobalGetters(this,["TextEncoder"]);XPCOMUtils.defineLazyServiceGetter(this,"mimeHeader","@mozilla.org/network/mime-hdrparam;1","nsIMIMEHeaderParam");const BinaryInputStream=Components.Constructor("@mozilla.org/binaryinputstream;1","nsIBinaryInputStream","setInputStream");const ConverterInputStream=Components.Constructor("@mozilla.org/intl/converter-input-stream;1","nsIConverterInputStream","init");var WebRequestUpload;class Headers extends Map{constructor(headerText){super();if(headerText){this.parseHeaders(headerText);}}
parseHeaders(headerText){let lines=headerText.split("\r\n");let lastHeader;for(let line of lines){if(line===""){return;}

if(/^\s/.test(line)){if(lastHeader){let val=this.get(lastHeader);this.set(lastHeader,`${val}\r\n${line}`);}
continue;}
let match=/^(.*?)\s*:\s+(.*)/.exec(line);if(match){lastHeader=match[1].toLowerCase();this.set(lastHeader,match[2]);}}}
getParam(name,paramName){return Headers.getParam(this.get(name),paramName);}
static getParam(header,paramName){if(header){
let bytes=new TextEncoder().encode(header);let binHeader=String.fromCharCode(...bytes);return mimeHeader.getParameterHTTP(binHeader,paramName,null,false,{});}
return null;}}
function mapToObject(map){let result={};for(let[key,value]of map){result[key]=value;}
return result;}
function rewind(stream){
stream.QueryInterface(Ci.nsISeekableStream);try{stream.seek(0,0);}catch(e){Cu.reportError(e);}}
function*getStreams(outerStream){
let unbuffered=outerStream;if(outerStream instanceof Ci.nsIStreamBufferAccess){unbuffered=outerStream.unbufferedStream;}
if(unbuffered instanceof Ci.nsIMultiplexInputStream){let count=unbuffered.count;for(let i=0;i<count;i++){yield unbuffered.getStream(i);}}else{yield outerStream;}}
function parseFormData(stream,channel,lenient=false){const BUFFER_SIZE=8192;let touchedStreams=new Set();let converterStreams=[];function createTextStream(stream){if(!(stream instanceof Ci.nsISeekableStream)){return null;}
touchedStreams.add(stream);let converterStream=ConverterInputStream(stream,"UTF-8",0,lenient?Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER:0);converterStreams.push(converterStream);return converterStream;}
function readString(stream,length=BUFFER_SIZE){let data={};stream.readString(length,data);return data.value;}
function*getTextStreams(outerStream){for(let stream of getStreams(outerStream)){if(stream instanceof Ci.nsIStringInputStream){touchedStreams.add(outerStream);yield createTextStream(stream);}}}
function*readAllStrings(outerStream){for(let textStream of getTextStreams(outerStream)){let str;while((str=readString(textStream))){yield str;}}}
function*getParts(stream,boundary,tail=""){for(let chunk of readAllStrings(stream)){chunk=tail+chunk;let parts=chunk.split(boundary);tail=parts.pop();yield*parts;}
if(tail){yield tail;}}
function parseMultiPart(stream,boundary){let formData=new DefaultMap(()=>[]);for(let part of getParts(stream,boundary,"\r\n")){if(part===""){continue;}
if(part==="--\r\n"){break;}
let end=part.indexOf("\r\n\r\n");
if(!part.startsWith("\r\n")||end<=0){throw new Error("Invalid MIME stream");}
let content=part.slice(end+4);let headerText=part.slice(2,end);let headers=new Headers(headerText);let name=headers.getParam("content-disposition","name");if(!name||headers.getParam("content-disposition","")!=="form-data"){throw new Error("Invalid MIME stream: No valid Content-Disposition header");}
if(headers.has("content-type")){
let filename=headers.getParam("content-disposition","filename");content=filename||"";}
formData.get(name).push(content);}
return formData;}
function parseUrlEncoded(stream){let formData=new DefaultMap(()=>[]);for(let part of getParts(stream,"&")){let[name,value]=part.replace(/\+/g," ").split("=").map(decodeURIComponent);formData.get(name).push(value);}
return formData;}
try{if(stream instanceof Ci.nsIMIMEInputStream&&stream.data){stream=stream.data;}
channel.QueryInterface(Ci.nsIHttpChannel);let contentType=channel.getRequestHeader("Content-Type");switch(Headers.getParam(contentType,"")){case"multipart/form-data":let boundary=Headers.getParam(contentType,"boundary");return parseMultiPart(stream,`\r\n--${boundary}`);case"application/x-www-form-urlencoded":return parseUrlEncoded(stream);}}finally{for(let stream of touchedStreams){rewind(stream);}
for(let converterStream of converterStreams){

converterStream.init(null,null,0,0);}}
return null;}
function createFormData(stream,channel,lenient){if(!(stream instanceof Ci.nsISeekableStream)){return null;}
try{let formData=parseFormData(stream,channel,lenient);if(formData){return mapToObject(formData);}}catch(e){Cu.reportError(e);}finally{rewind(stream);}
return null;}
function*getRawDataChunked(outerStream,maxRead=WebRequestUpload.MAX_RAW_BYTES){for(let stream of getStreams(outerStream)){
let unbuffered=stream;if(stream instanceof Ci.nsIStreamBufferAccess){unbuffered=stream.unbufferedStream;}

if(unbuffered instanceof Ci.nsIFileInputStream||unbuffered instanceof Ci.mozIRemoteLazyInputStream){yield{file:"<file>"};continue;}
try{let binaryStream=BinaryInputStream(stream);let available;while((available=binaryStream.available())){let buffer=new ArrayBuffer(Math.min(maxRead,available));binaryStream.readArrayBuffer(buffer.byteLength,buffer);maxRead-=buffer.byteLength;let chunk={bytes:buffer};if(buffer.byteLength<available){chunk.truncated=true;chunk.originalSize=available;}
yield chunk;if(maxRead<=0){return;}}}finally{rewind(stream);}}}
WebRequestUpload={createRequestBody(channel){if(!(channel instanceof Ci.nsIUploadChannel)||!channel.uploadStream){return null;}
if(channel instanceof Ci.nsIUploadChannel2&&channel.uploadStreamHasHeaders){return{error:"Upload streams with headers are unsupported"};}
try{let stream=channel.uploadStream;let formData=createFormData(stream,channel);if(formData){return{formData};}


return{raw:Array.from(getRawDataChunked(stream)),lenientFormData:createFormData(stream,channel,true),};}catch(e){Cu.reportError(e);return{error:e.message||String(e)};}},};XPCOMUtils.defineLazyPreferenceGetter(WebRequestUpload,"MAX_RAW_BYTES","webextensions.webRequest.requestBodyMaxRawBytes");