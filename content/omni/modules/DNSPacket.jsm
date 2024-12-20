//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DNSPacket"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{DataReader}=ChromeUtils.import("resource://gre/modules/DataReader.jsm");const{DataWriter}=ChromeUtils.import("resource://gre/modules/DataWriter.jsm");const{DNSRecord}=ChromeUtils.import("resource://gre/modules/DNSRecord.jsm");const{DNSResourceRecord}=ChromeUtils.import("resource://gre/modules/DNSResourceRecord.jsm");const DEBUG=true;function debug(msg){Services.console.logStringMessage("DNSPacket: "+msg);}
let DNS_PACKET_SECTION_TYPES=["QD","AN","NS","AR",];class DNSPacket{constructor(){this._flags=_valueToFlags(0x0000);this._records={};DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{this._records[sectionType]=[];});}
static parse(data){let reader=new DataReader(data);if(reader.getValue(2)!==0x0000){throw new Error("Packet must start with 0x0000");}
let packet=new DNSPacket();packet._flags=_valueToFlags(reader.getValue(2));let recordCounts={};DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{recordCounts[sectionType]=reader.getValue(2);});DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{let recordCount=recordCounts[sectionType];for(let i=0;i<recordCount;i++){if(sectionType==="QD"){packet.addRecord(sectionType,DNSRecord.parseFromPacketReader(reader));}else{packet.addRecord(sectionType,DNSResourceRecord.parseFromPacketReader(reader));}}});if(!reader.eof){DEBUG&&debug("Did not complete parsing packet data");}
return packet;}
getFlag(flag){return this._flags[flag];}
setFlag(flag,value){this._flags[flag]=value;}
addRecord(sectionType,record){this._records[sectionType].push(record);}
getRecords(sectionTypes,recordType){let records=[];sectionTypes.forEach(sectionType=>{records=records.concat(this._records[sectionType]);});if(!recordType){return records;}
return records.filter(r=>r.recordType===recordType);}
serialize(){let writer=new DataWriter();writer.putValue(0x0000,2);writer.putValue(_flagsToValue(this._flags),2);DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{writer.putValue(this._records[sectionType].length,2);}); DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{this._records[sectionType].forEach(record=>{writer.putBytes(record.serialize());});});return writer.data;}
toJSON(){return JSON.stringify(this.toJSONObject());}
toJSONObject(){let result={flags:this._flags};DNS_PACKET_SECTION_TYPES.forEach(sectionType=>{result[sectionType]=[];let records=this._records[sectionType];records.forEach(record=>{result[sectionType].push(record.toJSONObject());});});return result;}}
function _valueToFlags(value){return{QR:(value&0x8000)>>15,OP:(value&0x7800)>>11,AA:(value&0x0400)>>10,TC:(value&0x0200)>>9,RD:(value&0x0100)>>8,RA:(value&0x0080)>>7,UN:(value&0x0040)>>6,AD:(value&0x0020)>>5,CD:(value&0x0010)>>4,RC:(value&0x000f)>>0,};}
function _flagsToValue(flags){let value=0x0000;value+=flags.QR&0x01;value<<=4;value+=flags.OP&0x0f;value<<=1;value+=flags.AA&0x01;value<<=1;value+=flags.TC&0x01;value<<=1;value+=flags.RD&0x01;value<<=1;value+=flags.RA&0x01;value<<=1;value+=flags.UN&0x01;value<<=1;value+=flags.AD&0x01;value<<=1;value+=flags.CD&0x01;value<<=4;value+=flags.RC&0x0f;return value;}