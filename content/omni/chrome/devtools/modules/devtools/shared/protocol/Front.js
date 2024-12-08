"use strict";var{settleAll}=require("devtools/shared/DevToolsUtils");var EventEmitter=require("devtools/shared/event-emitter");var{Pool}=require("devtools/shared/protocol/Pool");var{getStack,callFunctionWithAsyncStack,}=require("devtools/shared/platform/stack");const defer=require("devtools/shared/defer");class Front extends Pool{constructor(conn=null,targetFront=null,parentFront=null){super(conn);this.actorID=null;
this.targetFront=targetFront;
this.parentFront=parentFront;this._requests=[];this._frontCreationListeners=new EventEmitter();this._frontDestructionListeners=new EventEmitter();
this._beforeListeners=new Map();}
getParent(){return this.parentFront&&this.parentFront.actorID?this.parentFront:null;}
destroy(){
this.baseFrontClassDestroy();
this.clearEvents();}

baseFrontClassDestroy(){
while(this._requests.length>0){const{deferred,to,type,stack}=this._requests.shift();const msg="Connection closed, pending request to "+
to+", type "+
type+" failed"+"\n\nRequest stack:\n"+
stack.formattedStack;deferred.reject(new Error(msg));}
if(this.actorID){super.destroy();this.actorID=null;}
this.targetFront=null;this.parentFront=null;this._frontCreationListeners=null;this._frontDestructionListeners=null;this._beforeListeners=null;}
isDestroyed(){return this.actorID===null;}
async manage(front,form,ctx){if(!front.actorID){throw new Error("Can't manage front without an actor ID.\n"+"Ensure server supports "+
front.typeName+".");}
if(front.parentFront&&front.parentFront!==this){throw new Error(`${this.actorID} (${this.typeName}) can't manage ${front.actorID}
        (${front.typeName}) since it has a different parentFront ${
          front.parentFront
            ? front.parentFront.actordID +
              "(" +
              front.parentFront.typeName +
              ")"
            : "<no parentFront>"
        }`);}
super.manage(front);if(typeof front.initialize=="function"){await front.initialize();}

if(form){front.form(form,ctx);}

if(this._frontCreationListeners){this._frontCreationListeners.emit(front.typeName,front);}}
async unmanage(front){super.unmanage(front); this._frontDestructionListeners.emit(front.typeName,front);}
watchFronts(typeName,onAvailable,onDestroy){if(this.isDestroyed()){console.error(`Tried to call watchFronts for the '${typeName}' type on an `+`already destroyed front '${this.typeName}'.`);return;}
if(onAvailable){ for(const front of this.poolChildren()){if(front.typeName==typeName){onAvailable(front);}} 
this._frontCreationListeners.on(typeName,onAvailable);}
if(onDestroy){this._frontDestructionListeners.on(typeName,onDestroy);}}
unwatchFronts(typeName,onAvailable,onDestroy){if(this.isDestroyed()){console.error(`Tried to call unwatchFronts for the '${typeName}' type on an `+`already destroyed front '${this.typeName}'.`);return;}
if(onAvailable){this._frontCreationListeners.off(typeName,onAvailable);}
if(onDestroy){this._frontDestructionListeners.off(typeName,onDestroy);}}
before(type,callback){if(this._beforeListeners.has(type)){throw new Error(`Can't register multiple before listeners for "${type}".`);}
this._beforeListeners.set(type,callback);}
toString(){return"[Front for "+this.typeName+"/"+this.actorID+"]";}
form(form){}
send(packet){if(packet.to){this.conn._transport.send(packet);}else{packet.to=this.actorID; if(this.conn&&this.conn._transport){this.conn._transport.send(packet);}}}
request(packet){const deferred=defer(); const{to,type}=packet;this._requests.push({deferred,to:to||this.actorID,type,stack:getStack(),});this.send(packet);return deferred.promise;}
onPacket(packet){if(this.isDestroyed()){
return;} 
const type=packet.type||undefined;if(this._clientSpec.events&&this._clientSpec.events.has(type)){const event=this._clientSpec.events.get(packet.type);let args;try{args=event.request.read(packet,this);}catch(ex){console.error("Error reading event: "+packet.type);console.exception(ex);throw ex;}


const beforeEvent=this._beforeListeners.get(event.name);if(beforeEvent){const result=beforeEvent.apply(this,args);if(result&&typeof result.then=="function"){result.then(()=>{super.emit(event.name,...args);});return;}}
super.emit(event.name,...args);return;}
if(this._requests.length===0){const msg="Unexpected packet "+this.actorID+", "+JSON.stringify(packet);const err=Error(msg);console.error(err);throw err;}
const{deferred,stack}=this._requests.shift();callFunctionWithAsyncStack(()=>{if(packet.error){let message;if(packet.error&&packet.message){message="Protocol error ("+packet.error+"): "+packet.message;}else{message=packet.error;}
message+=" from: "+this.actorID;if(packet.fileName){const{fileName,columnNumber,lineNumber}=packet;message+=` (${fileName}:${lineNumber}:${columnNumber})`;}
const packetError=new Error(message);deferred.reject(packetError);}else{deferred.resolve(packet);}},stack,"DevTools RDP");}
hasRequests(){return!!this._requests.length;}
waitForRequestsToSettle(){return settleAll(this._requests.map(({deferred})=>deferred.promise));}}
exports.Front=Front;