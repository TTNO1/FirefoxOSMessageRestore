"use strict";const{CC}=require("chrome");const DevToolsUtils=require("devtools/shared/DevToolsUtils");const{dumpn}=DevToolsUtils;const flags=require("devtools/shared/flags");const StreamUtils=require("devtools/shared/transport/stream-utils");loader.lazyGetter(this,"Pipe",()=>{return CC("@mozilla.org/pipe;1","nsIPipe","init");});function LocalDebuggerTransport(other){this.other=other;this.hooks=null;
this._serial=this.other?this.other._serial:{count:0};this.close=this.close.bind(this);}
LocalDebuggerTransport.prototype={send:function(packet){const serial=this._serial.count++;if(flags.wantLogging){if(packet.from){dumpn("Packet "+serial+" sent from "+JSON.stringify(packet.from));}else if(packet.to){dumpn("Packet "+serial+" sent to "+JSON.stringify(packet.to));}}
this._deepFreeze(packet);const other=this.other;if(other){DevToolsUtils.executeSoon(DevToolsUtils.makeInfallible(()=>{if(flags.wantLogging){dumpn("Received packet "+
serial+": "+
JSON.stringify(packet,null,2));}
if(other.hooks){other.hooks.onPacket(packet);}},"LocalDebuggerTransport instance's this.other.hooks.onPacket"));}},startBulkSend:function({actor,type,length}){const serial=this._serial.count++;dumpn("Sent bulk packet "+serial+" for actor "+actor);if(!this.other){const error=new Error("startBulkSend: other side of transport missing");return Promise.reject(error);}
const pipe=new Pipe(true,true,0,0,null);DevToolsUtils.executeSoon(DevToolsUtils.makeInfallible(()=>{dumpn("Received bulk packet "+serial);if(!this.other.hooks){return;} 
new Promise(receiverResolve=>{const packet={actor:actor,type:type,length:length,copyTo:output=>{const copying=StreamUtils.copyStream(pipe.inputStream,output,length);receiverResolve(copying);return copying;},stream:pipe.inputStream,done:receiverResolve,};this.other.hooks.onBulkPacket(packet);})
.then(()=>pipe.inputStream.close(),this.close);},"LocalDebuggerTransport instance's this.other.hooks.onBulkPacket")); return new Promise(senderResolve=>{
DevToolsUtils.executeSoon(()=>{return(new Promise(copyResolve=>{senderResolve({copyFrom:input=>{const copying=StreamUtils.copyStream(input,pipe.outputStream,length);copyResolve(copying);return copying;},stream:pipe.outputStream,done:copyResolve,});})
.then(()=>pipe.outputStream.close(),this.close));});});},close:function(){if(this.other){
const other=this.other;this.other=null;other.close();}
if(this.hooks){try{if(this.hooks.onClosed){this.hooks.onClosed();}}catch(ex){console.error(ex);}
this.hooks=null;}},ready:function(){},_deepFreeze:function(object){Object.freeze(object);for(const prop in object){


if(object.hasOwnProperty(prop)&&typeof object==="object"&&!Object.isFrozen(object)){this._deepFreeze(object[prop]);}}},};exports.LocalDebuggerTransport=LocalDebuggerTransport;