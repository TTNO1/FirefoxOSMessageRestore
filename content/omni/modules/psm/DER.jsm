"use strict";







const UNIVERSAL=0<<6;const CONSTRUCTED=1<<5;const CONTEXT_SPECIFIC=2<<6;const INTEGER=UNIVERSAL|0x02;const BIT_STRING=UNIVERSAL|0x03;const NULL=UNIVERSAL|0x05;const OBJECT_IDENTIFIER=UNIVERSAL|0x06;const PrintableString=UNIVERSAL|0x13;const TeletexString=UNIVERSAL|0x14;const IA5String=UNIVERSAL|0x16;const UTCTime=UNIVERSAL|0x17;const GeneralizedTime=UNIVERSAL|0x18;const UTF8String=UNIVERSAL|0x0c;const SEQUENCE=UNIVERSAL|CONSTRUCTED|0x10;const SET=UNIVERSAL|CONSTRUCTED|0x11;const ERROR_INVALID_INPUT="invalid input";const ERROR_DATA_TRUNCATED="data truncated";const ERROR_EXTRA_DATA="extra data";const ERROR_INVALID_LENGTH="invalid length";const ERROR_UNSUPPORTED_ASN1="unsupported asn.1";const ERROR_UNSUPPORTED_LENGTH="unsupported length";const ERROR_INVALID_BIT_STRING="invalid BIT STRING encoding";class BitString{constructor(unusedBits,contents){this._unusedBits=unusedBits;this._contents=contents;}
get unusedBits(){return this._unusedBits;}
get contents(){return this._contents;}}
class DERDecoder{constructor(bytes){if(!Array.isArray(bytes)){throw new Error(ERROR_INVALID_INPUT);}
if(bytes.length>65539){throw new Error(ERROR_UNSUPPORTED_LENGTH);}
if(bytes.some(b=>!Number.isInteger(b)||b<0||b>255)){throw new Error(ERROR_INVALID_INPUT);}
this._bytes=bytes;this._cursor=0;}
assertAtEnd(){if(!this.atEnd()){throw new Error(ERROR_EXTRA_DATA);}}
atEnd(){return this._cursor==this._bytes.length;}
readByte(){if(this._cursor>=this._bytes.length){throw new Error(ERROR_DATA_TRUNCATED);}
let val=this._bytes[this._cursor];this._cursor++;return val;}
_readExpectedTag(expectedTag){let tag=this.readByte();if(tag!=expectedTag){throw new Error(`unexpected tag: found ${tag} instead of ${expectedTag}`);}}
_readLength(){let nextByte=this.readByte();if(nextByte<0x80){return nextByte;}
if(nextByte==0x80){throw new Error(ERROR_UNSUPPORTED_ASN1);}
if(nextByte==0x81){let length=this.readByte();if(length<0x80){throw new Error(ERROR_INVALID_LENGTH);}
return length;}
if(nextByte==0x82){let length1=this.readByte();let length2=this.readByte();let length=(length1<<8)|length2;if(length<256){throw new Error(ERROR_INVALID_LENGTH);}
return length;}
throw new Error(ERROR_UNSUPPORTED_LENGTH);}
readBytes(length){if(length<0){throw new Error(ERROR_INVALID_LENGTH);}
let bytes=[];for(let i=0;i<length;i++){bytes.push(this.readByte());}
return bytes;}
readTagAndGetContents(tag){this._readExpectedTag(tag);let length=this._readLength();return this.readBytes(length);}
_peekByte(){if(this._cursor>=this._bytes.length){throw new Error(ERROR_DATA_TRUNCATED);}
return this._bytes[this._cursor];}
_readExpectedTLV(tag){let mark=this._cursor;this._readExpectedTag(tag);let length=this._readLength();this.readBytes(length);return this._bytes.slice(mark,this._cursor);}
readTLV(){let nextTag=this._peekByte();return this._readExpectedTLV(nextTag);}
readBIT_STRING(){let contents=this.readTagAndGetContents(BIT_STRING);if(contents.length<1){throw new Error(ERROR_INVALID_BIT_STRING);}
let unusedBits=contents[0];if(unusedBits>7){throw new Error(ERROR_INVALID_BIT_STRING);}
if(contents.length==1&&unusedBits!=0){throw new Error(ERROR_INVALID_BIT_STRING);}
return new BitString(unusedBits,contents.slice(1,contents.length));}
peekTag(tag){if(this._cursor>=this._bytes.length){return false;}
return this._bytes[this._cursor]==tag;}
readTLVChoice(tagList){let tag=this._peekByte();if(!tagList.includes(tag)){throw new Error(`unexpected tag: found ${tag} instead of one of ${tagList}`);}
return this._readExpectedTLV(tag);}}
const DER={UNIVERSAL,CONSTRUCTED,CONTEXT_SPECIFIC,INTEGER,BIT_STRING,NULL,OBJECT_IDENTIFIER,PrintableString,TeletexString,IA5String,UTCTime,GeneralizedTime,UTF8String,SEQUENCE,SET,DERDecoder,};var EXPORTED_SYMBOLS=["DER"];