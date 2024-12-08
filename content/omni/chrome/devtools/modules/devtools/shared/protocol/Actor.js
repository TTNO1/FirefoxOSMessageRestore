"use strict";const{extend}=require("devtools/shared/extend");var{Pool}=require("devtools/shared/protocol/Pool");var actorSpecs=new WeakMap();exports.actorSpecs=actorSpecs;class Actor extends Pool{initialize(conn){

if(conn){this.conn=conn;} 
this.actorID=null;this._actorSpec=actorSpecs.get(Object.getPrototypeOf(this));if(this._actorSpec&&this._actorSpec.events){for(const[name,request]of this._actorSpec.events.entries()){this.on(name,(...args)=>{this._sendEvent(name,request,...args);});}}}
toString(){return"[Actor "+this.typeName+"/"+this.actorID+"]";}
_sendEvent(name,request,...args){if(this.isDestroyed()){console.error(`Tried to send a '${name}' event on an already destroyed actor`+` '${this.typeName}'`);return;}
let packet;try{packet=request.write(args,this);}catch(ex){console.error("Error sending event: "+name);throw ex;}
packet.from=packet.from||this.actorID;this.conn.send(packet);}
destroy(){super.destroy();this.actorID=null;}
isDestroyed(){return this.actorID===null;}
form(hint){return{actor:this.actorID};}
writeError(error,typeName,method){console.error(`Error while calling actor '${typeName}'s method '${method}'`,error.message);if(error.stack){console.error(error.stack);}

if(this.isDestroyed()){return;}
this.conn.send({from:this.actorID,
 error:error.error||error.name||"unknownError",message:error.message,
 fileName:error.fileName||error.filename,lineNumber:error.lineNumber,columnNumber:error.columnNumber,});}
_queueResponse(create){const pending=this._pendingResponse||Promise.resolve(null);const response=create(pending);this._pendingResponse=response;}
throwError(error,message){const err=new Error(message);err.error=error;throw err;}}
exports.Actor=Actor;var generateRequestHandlers=function(actorSpec,actorProto){actorProto.typeName=actorSpec.typeName; actorProto.requestTypes=Object.create(null);actorSpec.methods.forEach(spec=>{const handler=function(packet,conn){try{let args;try{args=spec.request.read(packet,this);}catch(ex){console.error("Error reading request: "+packet.type);throw ex;}
if(!this[spec.name]){throw new Error(`Spec for '${actorProto.typeName}' specifies a '${spec.name}'`+` method that isn't implemented by the actor`);}
const ret=this[spec.name].apply(this,args);const sendReturn=retToSend=>{if(spec.oneway){return;}

if(spec.name=="attach"&&actorProto.typeName=="thread"){return;}
if(this.isDestroyed()){console.error(`Tried to send a '${spec.name}' method reply on an already destroyed actor`+` '${this.typeName}'`);return;}
let response;try{response=spec.response.write(retToSend,this);}catch(ex){console.error("Error writing response to: "+spec.name);throw ex;}
response.from=this.actorID;if(spec.release){try{this.destroy();}catch(e){this.writeError(e,actorProto.typeName,spec.name);return;}}
conn.send(response);};this._queueResponse(p=>{return p.then(()=>ret).then(sendReturn).catch(e=>this.writeError(e,actorProto.typeName,spec.name));});}catch(e){this._queueResponse(p=>{return p.then(()=>this.writeError(e,actorProto.typeName,spec.name));});}};actorProto.requestTypes[spec.request.type]=handler;});return actorProto;};var ActorClassWithSpec=function(actorSpec,actorProto){if(!actorSpec.typeName){throw Error("Actor specification must have a typeName member.");}
const cls=function(){const instance=Object.create(cls.prototype);instance.initialize.apply(instance,arguments);return instance;};cls.prototype=extend(Actor.prototype,generateRequestHandlers(actorSpec,actorProto));actorSpecs.set(cls.prototype,actorSpec);return cls;};exports.ActorClassWithSpec=ActorClassWithSpec;