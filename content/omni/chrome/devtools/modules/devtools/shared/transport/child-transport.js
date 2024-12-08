"use strict";const{Cr}=require("chrome");const flags=require("devtools/shared/flags");function ChildDebuggerTransport(mm,prefix){this._mm=mm;this._messageName="debug:"+prefix+":packet";}
ChildDebuggerTransport.prototype={constructor:ChildDebuggerTransport,hooks:null,_addListener(){this._mm.addMessageListener(this._messageName,this);},_removeListener(){try{this._mm.removeMessageListener(this._messageName,this);}catch(e){if(e.result!=Cr.NS_ERROR_NULL_POINTER){throw e;}


}},ready:function(){this._addListener();},close:function(){this._removeListener();if(this.hooks.onClosed){this.hooks.onClosed();}},receiveMessage:function({data}){this.hooks.onPacket(data);},_canBeSerialized:function(object){try{const holder=new StructuredCloneHolder(object);holder.deserialize(this);}catch(e){return false;}
return true;},pathToUnserializable:function(object){for(const key in object){const value=object[key];if(!this._canBeSerialized(value)){if(typeof value=="object"){return[key].concat(this.pathToUnserializable(value));}
return[key];}}
return[];},send:function(packet){if(flags.testing&&!this._canBeSerialized(packet)){const attributes=this.pathToUnserializable(packet);let msg="Following packet can't be serialized: "+JSON.stringify(packet);msg+="\nBecause of attributes: "+attributes.join(", ")+"\n";msg+="Did you pass a function or an XPCOM object in it?";throw new Error(msg);}
try{this._mm.sendAsyncMessage(this._messageName,packet);}catch(e){if(e.result!=Cr.NS_ERROR_NULL_POINTER){throw e;}


}},startBulkSend:function(){throw new Error("Can't send bulk data to child processes.");},};exports.ChildDebuggerTransport=ChildDebuggerTransport;