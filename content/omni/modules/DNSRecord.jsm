//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DNSRecord"];const{DataWriter}=ChromeUtils.import("resource://gre/modules/DataWriter.jsm");const{DNS_CLASS_CODES,DNS_RECORD_TYPES}=ChromeUtils.import("resource://gre/modules/DNSTypes.jsm");class DNSRecord{constructor(properties={}){this.name=properties.name||"";this.recordType=properties.recordType||DNS_RECORD_TYPES.ANY;this.classCode=properties.classCode||DNS_CLASS_CODES.IN;this.cacheFlush=properties.cacheFlush||false;}
static parseFromPacketReader(reader){let name=reader.getLabel();let recordType=reader.getValue(2);let classCode=reader.getValue(2);let cacheFlush=!!(classCode&0x8000);classCode&=0xff;return new this({name,recordType,classCode,cacheFlush,});}
serialize(){let writer=new DataWriter();writer.putLabel(this.name);writer.putValue(this.recordType,2);let classCode=this.classCode;if(this.cacheFlush){classCode|=0x8000;}
writer.putValue(classCode,2);return writer.data;}
toJSON(){return JSON.stringify(this.toJSONObject());}
toJSONObject(){return{name:this.name,recordType:this.recordType,classCode:this.classCode,cacheFlush:this.cacheFlush,};}}