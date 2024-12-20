//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DataWriter"];class DataWriter{constructor(data,maxBytes=512){if(typeof data==="number"){maxBytes=data;data=undefined;}
this._buffer=new ArrayBuffer(maxBytes);this._data=new Uint8Array(this._buffer);this._cursor=0;if(data){this.putBytes(data);}}
get buffer(){return this._buffer.slice(0,this._cursor);}
get data(){return new Uint8Array(this.buffer);}
putBytes(data){if(this._cursor+data.length>this._data.length){throw new Error("DataWriter buffer is exceeded");}
for(let i=0,length=data.length;i<length;i++){this._data[this._cursor]=data[i];this._cursor++;}}
putByte(byte){if(this._cursor+1>this._data.length){throw new Error("DataWriter buffer is exceeded");}
this._data[this._cursor]=byte;this._cursor++;}
putValue(value,length){length=length||1;if(length==1){this.putByte(value);}else{this.putBytes(_valueToUint8Array(value,length));}}
putLabel(label){label=label.replace(/\.$/,"");let parts=label.split(".");parts.forEach(part=>{this.putLengthString(part);});this.putValue(0);}
putLengthString(string){if(string.length>0xff){throw new Error("String too long.");}
this.putValue(string.length);for(let i=0;i<string.length;i++){this.putValue(string.charCodeAt(i));}}}
function _valueToUint8Array(value,length){let arrayBuffer=new ArrayBuffer(length);let uint8Array=new Uint8Array(arrayBuffer);for(let i=length-1;i>=0;i--){uint8Array[i]=value&0xff;value=value>>8;}
return uint8Array;}