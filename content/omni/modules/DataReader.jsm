//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DataReader"];class DataReader{constructor(data,startByte=0){this._data=data;this._cursor=startByte;}
get buffer(){return this._data.buffer;}
get data(){return this._data;}
get eof(){return this._cursor>=this._data.length;}
getBytes(length=1){if(!length){return new Uint8Array();}
let end=this._cursor+length;if(end>this._data.length){return new Uint8Array();}
let uint8Array=new Uint8Array(this.buffer.slice(this._cursor,end));this._cursor+=length;return uint8Array;}
getString(length){let uint8Array=this.getBytes(length);return _uint8ArrayToString(uint8Array);}
getValue(length){let uint8Array=this.getBytes(length);return _uint8ArrayToValue(uint8Array);}
getLabel(decompressData){let parts=[];let partLength;while((partLength=this.getValue(1))){if(partLength!==0xc0){parts.push(this.getString(partLength));continue;} 
parts.push(String.fromCharCode(0xc0)+this.getString(1));break;}
let label=parts.join(".");return _decompressLabel(label,decompressData||this._data);}}
function _uint8ArrayToValue(uint8Array){let length=uint8Array.length;if(length===0){return null;}
let value=0;for(let i=0;i<length;i++){value=value<<8;value+=uint8Array[i];}
return value;}
function _uint8ArrayToString(uint8Array){let length=uint8Array.length;if(length===0){return"";}
let results=[];for(let i=0;i<length;i+=1024){results.push(String.fromCharCode.apply(null,uint8Array.subarray(i,i+1024)));}
return results.join("");}
function _decompressLabel(label,decompressData){let result="";for(let i=0,length=label.length;i<length;i++){if(label.charCodeAt(i)!==0xc0){result+=label.charAt(i);continue;}
i++;let reader=new DataReader(decompressData,label.charCodeAt(i));result+=_decompressLabel(reader.getLabel(),decompressData);}
return result;}