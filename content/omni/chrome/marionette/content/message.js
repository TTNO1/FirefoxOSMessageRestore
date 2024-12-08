"use strict";const EXPORTED_SYMBOLS=["Command","Message","Response"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{assert:"chrome://marionette/content/assert.js",error:"chrome://marionette/content/error.js",truncate:"chrome://marionette/content/format.js",});class Message{constructor(messageID){this.id=assert.integer(messageID);}
toString(){let content=JSON.stringify(this.toPacket());return truncate`${content}`;}
static fromPacket(data){const[type]=data;switch(type){case Command.Type:return Command.fromPacket(data);case Response.Type:return Response.fromPacket(data);default:throw new TypeError("Unrecognised message type in packet: "+JSON.stringify(data));}}}
Message.Origin={Client:0,Server:1,};class Command extends Message{constructor(messageID,name,params={}){super(messageID);this.name=assert.string(name);this.parameters=assert.object(params);this.onerror=null;this.onresult=null;this.origin=Message.Origin.Client;this.sent=false;}
onresponse(resp){if(this.onerror&&resp.error){this.onerror(resp.error);}else if(this.onresult&&resp.body){this.onresult(resp.body);}}
toPacket(){return[Command.Type,this.id,this.name,this.parameters];}
static fromPacket(payload){let[type,msgID,name,params]=payload;assert.that(n=>n===Command.Type)(type); if(params===null){params=undefined;}
return new Command(msgID,name,params);}}
Command.Type=0;class Response extends Message{constructor(messageID,respHandler=()=>{}){super(messageID);this.respHandler_=assert.callable(respHandler);this.error=null;this.body={value:null};this.origin=Message.Origin.Server;this.sent=false;}
sendConditionally(predicate){if(predicate(this)){this.send();}}
send(){if(this.sent){throw new RangeError("Response has already been sent: "+this);}
this.respHandler_(this);this.sent=true;}
sendError(err){this.error=error.wrap(err).toJSON();this.body=null;this.send(); if(!error.isWebDriverError(err)){throw err;}}
toPacket(){return[Response.Type,this.id,this.error,this.body];}
static fromPacket(payload){let[type,msgID,err,body]=payload;assert.that(n=>n===Response.Type)(type);let resp=new Response(msgID);resp.error=assert.string(err);resp.body=body;return resp;}}
Response.Type=1;this.Message=Message;this.Command=Command;this.Response=Response;