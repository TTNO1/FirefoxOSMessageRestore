//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{classes:Cc,interfaces:Ci,utils:Cu,results:Cr}=Components;var WSP={};Cu.import("resource://gre/modules/WspPduHelper.jsm",WSP);var WBXML={};Cu.import("resource://gre/modules/WbxmlPduHelper.jsm",WBXML);var DEBUG=WBXML.DEBUG_ALL|false;const PUBLIC_IDENTIFIER_SL="-//WAPFORUM//DTD SL 1.0//EN";this.PduHelper={parse:function parse_sl(data,contentType){ let msg={contentType:contentType};if(contentType==="application/vnd.wap.slc"){let appToken={publicId:PUBLIC_IDENTIFIER_SL,tagTokenList:SL_TAG_FIELDS,attrTokenList:SL_ATTRIBUTE_FIELDS,valueTokenList:SL_VALUE_FIELDS,globalTokenOverride:null}
try{let parseResult=WBXML.PduHelper.parse(data,appToken);msg.content=parseResult.content;msg.contentType="text/vnd.wap.sl";}catch(e){msg.content=data.array;}
return msg;}
try{let stringData=WSP.Octet.decodeMultiple(data,data.array.length);msg.content=WSP.PduHelper.decodeStringContent(stringData,"UTF-8");}catch(e){msg.content=data.array;}
return msg;}};const SL_TAG_FIELDS=(function(){let names={};function add(name,codepage,number){let entry={name:name,number:number,};if(!names[codepage]){names[codepage]={};}
names[codepage][number]=entry;}
add("sl",0,0x05);return names;})();const SL_ATTRIBUTE_FIELDS=(function(){let names={};function add(name,value,codepage,number){let entry={name:name,value:value,number:number,};if(!names[codepage]){names[codepage]={};}
names[codepage][number]=entry;}
add("action","execute-low",0,0x05);add("action","execute-high",0,0x06);add("action","cache",0,0x07);add("href","",0,0x08);add("href","http://",0,0x09);add("href","http://www.",0,0x0A);add("href","https://",0,0x0B);add("href","https://www.",0,0x0C);return names;})();const SL_VALUE_FIELDS=(function(){let names={};function add(value,codepage,number){let entry={value:value,number:number,};if(!names[codepage]){names[codepage]={};}
names[codepage][number]=entry;}
add(".com/",0,0x85);add(".edu/",0,0x86);add(".net/",0,0x87);add(".org/",0,0x88);return names;})();this.EXPORTED_SYMBOLS=["PduHelper",];