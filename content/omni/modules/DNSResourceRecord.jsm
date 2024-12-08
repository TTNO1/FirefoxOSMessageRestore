//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DNSResourceRecord"];const{DataReader}=ChromeUtils.import("resource://gre/modules/DataReader.jsm");const{DataWriter}=ChromeUtils.import("resource://gre/modules/DataWriter.jsm");const{DNSRecord}=ChromeUtils.import("resource://gre/modules/DNSRecord.jsm");const{DNS_RECORD_TYPES}=ChromeUtils.import("resource://gre/modules/DNSTypes.jsm");const DNS_RESOURCE_RECORD_DEFAULT_TTL=120;class DNSResourceRecord extends DNSRecord{constructor(properties={}){super(properties);this.ttl=properties.ttl||DNS_RESOURCE_RECORD_DEFAULT_TTL;this.data=properties.data||{};}
static parseFromPacketReader(reader){let record=super.parseFromPacketReader(reader);let ttl=reader.getValue(4);let recordData=reader.getBytes(reader.getValue(2));let packetData=reader.data;let data;switch(record.recordType){case DNS_RECORD_TYPES.A:data=_parseA(recordData,packetData);break;case DNS_RECORD_TYPES.PTR:data=_parsePTR(recordData,packetData);break;case DNS_RECORD_TYPES.TXT:data=_parseTXT(recordData,packetData);break;case DNS_RECORD_TYPES.SRV:data=_parseSRV(recordData,packetData);break;default:data=null;break;}
record.ttl=ttl;record.data=data;return record;}
serialize(){let writer=new DataWriter(super.serialize());writer.putValue(this.ttl,4);let data;switch(this.recordType){case DNS_RECORD_TYPES.A:data=_serializeA(this.data);break;case DNS_RECORD_TYPES.PTR:data=_serializePTR(this.data);break;case DNS_RECORD_TYPES.TXT:data=_serializeTXT(this.data);break;case DNS_RECORD_TYPES.SRV:data=_serializeSRV(this.data);break;default:data=new Uint8Array();break;}
writer.putValue(data.length,2);writer.putBytes(data);return writer.data;}
toJSON(){return JSON.stringify(this.toJSONObject());}
toJSONObject(){let result=super.toJSONObject();result.ttl=this.ttl;result.data=this.data;return result;}}
function _parseA(recordData,packetData){let reader=new DataReader(recordData);let parts=[];for(let i=0;i<4;i++){parts.push(reader.getValue(1));}
return parts.join(".");}
function _parsePTR(recordData,packetData){let reader=new DataReader(recordData);return reader.getLabel(packetData);}
function _parseTXT(recordData,packetData){let reader=new DataReader(recordData);let result={};let label=reader.getLabel(packetData);if(label.length>0){let parts=label.split(".");parts.forEach(part=>{let[name]=part.split("=",1);let value=part.substr(name.length+1);result[name]=value;});}
return result;}
function _parseSRV(recordData,packetData){let reader=new DataReader(recordData);let priority=reader.getValue(2);let weight=reader.getValue(2);let port=reader.getValue(2);let target=reader.getLabel(packetData);return{priority,weight,port,target};}
function _serializeA(data){let writer=new DataWriter();let parts=data.split(".");for(let i=0;i<4;i++){writer.putValue(parseInt(parts[i],10)||0);}
return writer.data;}
function _serializePTR(data){let writer=new DataWriter();writer.putLabel(data);return writer.data;}
function _serializeTXT(data){let writer=new DataWriter();for(let name in data){writer.putLengthString(name+"="+data[name]);}
return writer.data;}
function _serializeSRV(data){let writer=new DataWriter();writer.putValue(data.priority||0,2);writer.putValue(data.weight||0,2);writer.putValue(data.port||0,2);writer.putLabel(data.target);return writer.data;}