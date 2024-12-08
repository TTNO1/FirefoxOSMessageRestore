"use strict";class JsWindowActorTransport{constructor(jsWindowActor,prefix){this.hooks=null;this._jsWindowActor=jsWindowActor;this._prefix=prefix;this._onPacketReceived=this._onPacketReceived.bind(this);}
_addListener(){this._jsWindowActor.on("packet-received",this._onPacketReceived);}
_removeListener(){this._jsWindowActor.off("packet-received",this._onPacketReceived);}
ready(){this._addListener();}
close(){this._removeListener();if(this.hooks.onClosed){this.hooks.onClosed();}}
_onPacketReceived(eventName,{data}){const{prefix,packet}=data;if(prefix===this._prefix){this.hooks.onPacket(packet);}}
send(packet){this._jsWindowActor.sendPacket(packet,this._prefix);}
startBulkSend(){throw new Error("startBulkSend not implemented for JsWindowActorTransport");}}
exports.JsWindowActorTransport=JsWindowActorTransport;