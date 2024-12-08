"use strict";const protocol=require("devtools/shared/protocol");const{Arg,RetVal,generateActorSpec}=protocol;const longStringSpec=generateActorSpec({typeName:"longstractor",methods:{substring:{request:{start:Arg(0),end:Arg(1),},response:{substring:RetVal()},},release:{release:true},},});exports.longStringSpec=longStringSpec;class SimpleStringFront{constructor(str){this.str=str;}
get length(){return this.str.length;}
get initial(){return this.str;}
string(){return Promise.resolve(this.str);}
substring(start,end){return Promise.resolve(this.str.substring(start,end));}
release(){this.str=null;return Promise.resolve(undefined);}}
exports.SimpleStringFront=SimpleStringFront;
var stringActorType=protocol.types.getType("longstractor");protocol.types.addType("longstring",{_actor:true,write:(value,context,detail)=>{if(!(context instanceof protocol.Actor)){throw Error("Passing a longstring as an argument isn't supported.");}
if(value.short){return value.str;}
return stringActorType.write(value,context,detail);},read:(value,context,detail)=>{if(context instanceof protocol.Actor){throw Error("Passing a longstring as an argument isn't supported.");}
if(typeof value==="string"){return new SimpleStringFront(value);}
return stringActorType.read(value,context,detail);},});