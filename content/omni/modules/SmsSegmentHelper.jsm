//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{classes:Cc,interfaces:Ci,utils:Cu,results:Cr}=Components;const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGetter(this,"RIL",function(){let obj=Cu.import("resource://gre/modules/ril_consts.js",null);return obj;});this.SmsSegmentHelper={_segmentRef:0,get nextSegmentRef(){let ref=this._segmentRef++;this._segmentRef%=(this.segmentRef16Bit?65535:255);return ref+1;},countGsm7BitSeptets:function(aMessage,aLangTable,aLangShiftTable,aStrict7BitEncoding){let length=0;for(let msgIndex=0;msgIndex<aMessage.length;msgIndex++){let c=aMessage.charAt(msgIndex);if(aStrict7BitEncoding){c=RIL.GSM_SMS_STRICT_7BIT_CHARMAP[c]||c;}
let septet=aLangTable.indexOf(c);
if(septet==RIL.PDU_NL_EXTENDED_ESCAPE){continue;}
if(septet>=0){length++;continue;}
septet=aLangShiftTable.indexOf(c);if(septet<0){if(!aStrict7BitEncoding){return-1;}

c="*";if(aLangTable.indexOf(c)>=0){length++;}else if(aLangShiftTable.indexOf(c)>=0){length+=2;}else{return-1;}
continue;}


if(septet==RIL.PDU_NL_RESERVED_CONTROL){continue;}



length+=2;}
return length;},enabledGsmTableTuples:[[RIL.PDU_NL_IDENTIFIER_DEFAULT,RIL.PDU_NL_IDENTIFIER_DEFAULT],],segmentRef16Bit:false,calculateUserDataLength7Bit:function(aMessage,aStrict7BitEncoding){let options=null;let minUserDataSeptets=Number.MAX_VALUE;for(let i=0;i<this.enabledGsmTableTuples.length;i++){let[langIndex,langShiftIndex]=this.enabledGsmTableTuples[i];const langTable=RIL.PDU_NL_LOCKING_SHIFT_TABLES[langIndex];const langShiftTable=RIL.PDU_NL_SINGLE_SHIFT_TABLES[langShiftIndex];let bodySeptets=this.countGsm7BitSeptets(aMessage,langTable,langShiftTable,aStrict7BitEncoding);if(bodySeptets<0){continue;}
let headerLen=0;if(langIndex!=RIL.PDU_NL_IDENTIFIER_DEFAULT){headerLen+=3;}
if(langShiftIndex!=RIL.PDU_NL_IDENTIFIER_DEFAULT){headerLen+=3;} 
let headerSeptets=Math.ceil((headerLen?headerLen+1:0)*8/7);let segmentSeptets=RIL.PDU_MAX_USER_DATA_7BIT;if((bodySeptets+headerSeptets)>segmentSeptets){headerLen+=this.segmentRef16Bit?6:5;headerSeptets=Math.ceil((headerLen+1)*8/7);}
segmentSeptets-=headerSeptets;let segments=Math.ceil(bodySeptets/segmentSeptets);let userDataSeptets=bodySeptets+headerSeptets*segments;if(userDataSeptets>=minUserDataSeptets){continue;}
minUserDataSeptets=userDataSeptets;options={dcs:RIL.PDU_DCS_MSG_CODING_7BITS_ALPHABET,encodedFullBodyLength:bodySeptets,userDataHeaderLength:headerLen,langIndex:langIndex,langShiftIndex:langShiftIndex,segmentMaxSeq:segments,segmentChars:segmentSeptets,};}
return options;},calculateUserDataLengthUCS2:function(aMessage){let bodyChars=aMessage.length;let headerLen=0;let headerChars=Math.ceil((headerLen?headerLen+1:0)/2);let segmentChars=RIL.PDU_MAX_USER_DATA_UCS2;if((bodyChars+headerChars)>segmentChars){headerLen+=this.segmentRef16Bit?6:5;headerChars=Math.ceil((headerLen+1)/2);segmentChars-=headerChars;}
let segments=Math.ceil(bodyChars/segmentChars);return{dcs:RIL.PDU_DCS_MSG_CODING_16BITS_ALPHABET,encodedFullBodyLength:bodyChars*2,userDataHeaderLength:headerLen,segmentMaxSeq:segments,segmentChars:segmentChars,};},calculateUserDataLength:function(aMessage,aStrict7BitEncoding){let options=this.calculateUserDataLength7Bit(aMessage,aStrict7BitEncoding);if(!options){options=this.calculateUserDataLengthUCS2(aMessage);}
return options;},fragmentText7Bit:function(aText,aLangTable,aLangShiftTable,aSegmentSeptets,aStrict7BitEncoding){let ret=[];let body="",len=0;if(aText.length===0){ret.push({body:aText,encodedBodyLength:aText.length,});return ret;}
for(let i=0,inc=0;i<aText.length;i++){let c=aText.charAt(i);if(aStrict7BitEncoding){c=RIL.GSM_SMS_STRICT_7BIT_CHARMAP[c]||c;}
let septet=aLangTable.indexOf(c);if(septet==RIL.PDU_NL_EXTENDED_ESCAPE){continue;}
if(septet>=0){inc=1;}else{septet=aLangShiftTable.indexOf(c);if(septet==RIL.PDU_NL_RESERVED_CONTROL){continue;}
inc=2;if(septet<0){if(!aStrict7BitEncoding){throw new Error("Given text cannot be encoded with GSM 7-bit Alphabet!");}

c="*";if(aLangTable.indexOf(c)>=0){inc=1;}}}
if((len+inc)>aSegmentSeptets){ret.push({body:body,encodedBodyLength:len,});body=c;len=inc;}else{body+=c;len+=inc;}}
if(len){ret.push({body:body,encodedBodyLength:len,});}
return ret;},fragmentTextUCS2:function(aText,aSegmentChars){let ret=[];if(aText.length===0){ret.push({body:aText,encodedBodyLength:aText.length,});return ret;}
for(let offset=0;offset<aText.length;offset+=aSegmentChars){let str=aText.substr(offset,aSegmentChars);ret.push({body:str,encodedBodyLength:str.length*2,});}
return ret;},fragmentText:function(aText,aOptions,aStrict7BitEncoding){if(!aOptions){aOptions=this.calculateUserDataLength(aText,aStrict7BitEncoding);}
if(aOptions.dcs==RIL.PDU_DCS_MSG_CODING_7BITS_ALPHABET){const langTable=RIL.PDU_NL_LOCKING_SHIFT_TABLES[aOptions.langIndex];const langShiftTable=RIL.PDU_NL_SINGLE_SHIFT_TABLES[aOptions.langShiftIndex];aOptions.segments=this.fragmentText7Bit(aText,langTable,langShiftTable,aOptions.segmentChars,aStrict7BitEncoding);}else{aOptions.segments=this.fragmentTextUCS2(aText,aOptions.segmentChars);}
aOptions.segmentMaxSeq=aOptions.segments.length;if(aOptions.segmentMaxSeq>1){aOptions.segmentRef16Bit=this.segmentRef16Bit;aOptions.segmentRef=this.nextSegmentRef;}
return aOptions;}};this.EXPORTED_SYMBOLS=['SmsSegmentHelper'];