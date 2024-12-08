(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.asn1js=f()}})(function(){var define,module,exports;return(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){const asn1js=require("asn1js");
module.exports={asn1js,};},{"asn1js":2}],2:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.RawData=exports.Repeated=exports.Any=exports.Choice=exports.TIME=exports.Duration=exports.DateTime=exports.TimeOfDay=exports.DATE=exports.GeneralizedTime=exports.UTCTime=exports.CharacterString=exports.GeneralString=exports.VisibleString=exports.GraphicString=exports.IA5String=exports.VideotexString=exports.TeletexString=exports.PrintableString=exports.NumericString=exports.UniversalString=exports.BmpString=exports.Utf8String=exports.ObjectIdentifier=exports.Enumerated=exports.Integer=exports.BitString=exports.OctetString=exports.Null=exports.Set=exports.Sequence=exports.Boolean=exports.EndOfContent=exports.Constructed=exports.Primitive=exports.BaseBlock=undefined;exports.fromBER=fromBER;exports.compareSchema=compareSchema;exports.verifySchema=verifySchema;exports.fromJSON=fromJSON;var _pvutils=require("pvutils");
const powers2=[new Uint8Array([1])];const digitsString="0123456789";

class LocalBaseBlock{constructor(parameters={}){this.blockLength=(0,_pvutils.getParametersValue)(parameters,"blockLength",0);this.error=(0,_pvutils.getParametersValue)(parameters,"error","");this.warnings=(0,_pvutils.getParametersValue)(parameters,"warnings",[]); if("valueBeforeDecode"in parameters)this.valueBeforeDecode=parameters.valueBeforeDecode.slice(0);else this.valueBeforeDecode=new ArrayBuffer(0);}
static blockName(){return"baseBlock";}
toJSON(){return{blockName:this.constructor.blockName(),blockLength:this.blockLength,error:this.error,warnings:this.warnings,valueBeforeDecode:(0,_pvutils.bufferToHexCodes)(this.valueBeforeDecode,0,this.valueBeforeDecode.byteLength)};}
}


const LocalHexBlock=BaseClass=>class LocalHexBlockMixin extends BaseClass{ constructor(parameters={}){super(parameters);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",false);if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else this.valueHex=new ArrayBuffer(0);}
static blockName(){return"hexBlock";}
fromBER(inputBuffer,inputOffset,inputLength){
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.warnings.push("Zero buffer length");return inputOffset;}
 
this.valueHex=inputBuffer.slice(inputOffset,inputOffset+inputLength); this.blockLength=inputLength;return inputOffset+inputLength;}
toBER(sizeOnly=false){if(this.isHexOnly!==true){this.error="Flag \"isHexOnly\" is not set, abort";return new ArrayBuffer(0);}
if(sizeOnly===true)return new ArrayBuffer(this.valueHex.byteLength); return this.valueHex.slice(0);}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.blockName=this.constructor.blockName();object.isHexOnly=this.isHexOnly;object.valueHex=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);return object;}
};

class LocalIdentificationBlock extends LocalHexBlock(LocalBaseBlock){constructor(parameters={}){super();if("idBlock"in parameters){ this.isHexOnly=(0,_pvutils.getParametersValue)(parameters.idBlock,"isHexOnly",false);this.valueHex=(0,_pvutils.getParametersValue)(parameters.idBlock,"valueHex",new ArrayBuffer(0)); this.tagClass=(0,_pvutils.getParametersValue)(parameters.idBlock,"tagClass",-1);this.tagNumber=(0,_pvutils.getParametersValue)(parameters.idBlock,"tagNumber",-1);this.isConstructed=(0,_pvutils.getParametersValue)(parameters.idBlock,"isConstructed",false);}else{this.tagClass=-1;this.tagNumber=-1;this.isConstructed=false;}}
static blockName(){return"identificationBlock";}
toBER(sizeOnly=false){ let firstOctet=0;let retBuf;let retView; switch(this.tagClass){case 1:firstOctet|=0x00; break;case 2:firstOctet|=0x40; break;case 3:firstOctet|=0x80; break;case 4:firstOctet|=0xC0; break;default:this.error="Unknown tag class";return new ArrayBuffer(0);}
if(this.isConstructed)firstOctet|=0x20;if(this.tagNumber<31&&!this.isHexOnly){retBuf=new ArrayBuffer(1);retView=new Uint8Array(retBuf);if(!sizeOnly){let number=this.tagNumber;number&=0x1F;firstOctet|=number;retView[0]=firstOctet;}
return retBuf;}
if(this.isHexOnly===false){const encodedBuf=(0,_pvutils.utilToBase)(this.tagNumber,7);const encodedView=new Uint8Array(encodedBuf);const size=encodedBuf.byteLength;retBuf=new ArrayBuffer(size+1);retView=new Uint8Array(retBuf);retView[0]=firstOctet|0x1F;if(!sizeOnly){for(let i=0;i<size-1;i++)retView[i+1]=encodedView[i]|0x80;retView[size]=encodedView[size-1];}
return retBuf;}
retBuf=new ArrayBuffer(this.valueHex.byteLength+1);retView=new Uint8Array(retBuf);retView[0]=firstOctet|0x1F;if(sizeOnly===false){const curView=new Uint8Array(this.valueHex);for(let i=0;i<curView.length-1;i++)retView[i+1]=curView[i]|0x80;retView[this.valueHex.byteLength]=curView[curView.length-1];}
return retBuf;}
fromBER(inputBuffer,inputOffset,inputLength){
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.error="Zero buffer length";return-1;}
 
const tagClassMask=intBuffer[0]&0xC0;switch(tagClassMask){case 0x00:this.tagClass=1; break;case 0x40:this.tagClass=2; break;case 0x80:this.tagClass=3; break;case 0xC0:this.tagClass=4; break;default:this.error="Unknown tag class";return-1;}
 
this.isConstructed=(intBuffer[0]&0x20)===0x20;
 this.isHexOnly=false;const tagNumberMask=intBuffer[0]&0x1F;if(tagNumberMask!==0x1F){this.tagNumber=tagNumberMask;this.blockLength=1;}
 
else{let count=1;this.valueHex=new ArrayBuffer(255);let tagNumberBufferMaxLength=255;let intTagNumberBuffer=new Uint8Array(this.valueHex); while(intBuffer[count]&0x80){intTagNumberBuffer[count-1]=intBuffer[count]&0x7F;count++;if(count>=intBuffer.length){this.error="End of input reached before message was fully decoded";return-1;}
if(count===tagNumberBufferMaxLength){tagNumberBufferMaxLength+=255;const tempBuffer=new ArrayBuffer(tagNumberBufferMaxLength);const tempBufferView=new Uint8Array(tempBuffer);for(let i=0;i<intTagNumberBuffer.length;i++)tempBufferView[i]=intTagNumberBuffer[i];this.valueHex=new ArrayBuffer(tagNumberBufferMaxLength);intTagNumberBuffer=new Uint8Array(this.valueHex);}
}
this.blockLength=count+1;intTagNumberBuffer[count-1]=intBuffer[count]&0x7F;
 const tempBuffer=new ArrayBuffer(count);const tempBufferView=new Uint8Array(tempBuffer);for(let i=0;i<count;i++)tempBufferView[i]=intTagNumberBuffer[i];this.valueHex=new ArrayBuffer(count);intTagNumberBuffer=new Uint8Array(this.valueHex);intTagNumberBuffer.set(tempBufferView);
 if(this.blockLength<=9)this.tagNumber=(0,_pvutils.utilFromBase)(intTagNumberBuffer,7);else{this.isHexOnly=true;this.warnings.push("Tag too long, represented as hex-coded");}
}

 
if(this.tagClass===1&&this.isConstructed){switch(this.tagNumber){case 1: case 2: case 5: case 6: case 9: case 14: case 23:case 24:case 31:case 32:case 33:case 34:this.error="Constructed encoding used for primitive type";return-1;default:}} 
return inputOffset+this.blockLength;}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.blockName=this.constructor.blockName();object.tagClass=this.tagClass;object.tagNumber=this.tagNumber;object.isConstructed=this.isConstructed;return object;}
}


class LocalLengthBlock extends LocalBaseBlock{constructor(parameters={}){super();if("lenBlock"in parameters){this.isIndefiniteForm=(0,_pvutils.getParametersValue)(parameters.lenBlock,"isIndefiniteForm",false);this.longFormUsed=(0,_pvutils.getParametersValue)(parameters.lenBlock,"longFormUsed",false);this.length=(0,_pvutils.getParametersValue)(parameters.lenBlock,"length",0);}else{this.isIndefiniteForm=false;this.longFormUsed=false;this.length=0;}}
static blockName(){return"lengthBlock";}
fromBER(inputBuffer,inputOffset,inputLength){
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.error="Zero buffer length";return-1;}
if(intBuffer[0]===0xFF){this.error="Length block 0xFF is reserved by standard";return-1;}
 
this.isIndefiniteForm=intBuffer[0]===0x80;
 if(this.isIndefiniteForm===true){this.blockLength=1;return inputOffset+this.blockLength;}
 
this.longFormUsed=!!(intBuffer[0]&0x80);
 if(this.longFormUsed===false){this.length=intBuffer[0];this.blockLength=1;return inputOffset+this.blockLength;}
 
const count=intBuffer[0]&0x7F;if(count>8)
{this.error="Too big integer";return-1;}
if(count+1>intBuffer.length){this.error="End of input reached before message was fully decoded";return-1;}
const lengthBufferView=new Uint8Array(count);for(let i=0;i<count;i++)lengthBufferView[i]=intBuffer[i+1];if(lengthBufferView[count-1]===0x00)this.warnings.push("Needlessly long encoded length");this.length=(0,_pvutils.utilFromBase)(lengthBufferView,8);if(this.longFormUsed&&this.length<=127)this.warnings.push("Unneccesary usage of long length form");this.blockLength=count+1; return inputOffset+this.blockLength;}
toBER(sizeOnly=false){ let retBuf;let retView; if(this.length>127)this.longFormUsed=true;if(this.isIndefiniteForm){retBuf=new ArrayBuffer(1);if(sizeOnly===false){retView=new Uint8Array(retBuf);retView[0]=0x80;}
return retBuf;}
if(this.longFormUsed===true){const encodedBuf=(0,_pvutils.utilToBase)(this.length,8);if(encodedBuf.byteLength>127){this.error="Too big length";return new ArrayBuffer(0);}
retBuf=new ArrayBuffer(encodedBuf.byteLength+1);if(sizeOnly===true)return retBuf;const encodedView=new Uint8Array(encodedBuf);retView=new Uint8Array(retBuf);retView[0]=encodedBuf.byteLength|0x80;for(let i=0;i<encodedBuf.byteLength;i++)retView[i+1]=encodedView[i];return retBuf;}
retBuf=new ArrayBuffer(1);if(sizeOnly===false){retView=new Uint8Array(retBuf);retView[0]=this.length;}
return retBuf;}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.blockName=this.constructor.blockName();object.isIndefiniteForm=this.isIndefiniteForm;object.longFormUsed=this.longFormUsed;object.length=this.length;return object;}
}


class LocalValueBlock extends LocalBaseBlock{constructor(parameters={}){super(parameters);}
static blockName(){return"valueBlock";} 
fromBER(inputBuffer,inputOffset,inputLength){ throw TypeError("User need to make a specific function in a class which extends \"LocalValueBlock\"");} 
toBER(sizeOnly=false){ throw TypeError("User need to make a specific function in a class which extends \"LocalValueBlock\"");}
}


class BaseBlock extends LocalBaseBlock{constructor(parameters={},valueBlockType=LocalValueBlock){super(parameters);if("name"in parameters)this.name=parameters.name;if("optional"in parameters)this.optional=parameters.optional;if("primitiveSchema"in parameters)this.primitiveSchema=parameters.primitiveSchema;this.idBlock=new LocalIdentificationBlock(parameters);this.lenBlock=new LocalLengthBlock(parameters);this.valueBlock=new valueBlockType(parameters);}
static blockName(){return"BaseBlock";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
toBER(sizeOnly=false){let retBuf;const idBlockBuf=this.idBlock.toBER(sizeOnly);const valueBlockSizeBuf=this.valueBlock.toBER(true);this.lenBlock.length=valueBlockSizeBuf.byteLength;const lenBlockBuf=this.lenBlock.toBER(sizeOnly);retBuf=(0,_pvutils.utilConcatBuf)(idBlockBuf,lenBlockBuf);let valueBlockBuf;if(sizeOnly===false)valueBlockBuf=this.valueBlock.toBER(sizeOnly);else valueBlockBuf=new ArrayBuffer(this.lenBlock.length);retBuf=(0,_pvutils.utilConcatBuf)(retBuf,valueBlockBuf);if(this.lenBlock.isIndefiniteForm===true){const indefBuf=new ArrayBuffer(2);if(sizeOnly===false){const indefView=new Uint8Array(indefBuf);indefView[0]=0x00;indefView[1]=0x00;}
retBuf=(0,_pvutils.utilConcatBuf)(retBuf,indefBuf);}
return retBuf;}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.idBlock=this.idBlock.toJSON();object.lenBlock=this.lenBlock.toJSON();object.valueBlock=this.valueBlock.toJSON();if("name"in this)object.name=this.name;if("optional"in this)object.optional=this.optional;if("primitiveSchema"in this)object.primitiveSchema=this.primitiveSchema.toJSON();return object;}
}
exports.BaseBlock=BaseBlock;

class LocalPrimitiveValueBlock extends LocalValueBlock{constructor(parameters={}){super(parameters); if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else this.valueHex=new ArrayBuffer(0);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",true);}
fromBER(inputBuffer,inputOffset,inputLength){
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.warnings.push("Zero buffer length");return inputOffset;}
 
this.valueHex=new ArrayBuffer(intBuffer.length);const valueHexView=new Uint8Array(this.valueHex);for(let i=0;i<intBuffer.length;i++)valueHexView[i]=intBuffer[i]; this.blockLength=inputLength;return inputOffset+inputLength;} 
toBER(sizeOnly=false){return this.valueHex.slice(0);}
static blockName(){return"PrimitiveValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.valueHex=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);object.isHexOnly=this.isHexOnly;return object;}
}
class Primitive extends BaseBlock{constructor(parameters={}){super(parameters,LocalPrimitiveValueBlock);this.idBlock.isConstructed=false;}
static blockName(){return"PRIMITIVE";}
}
exports.Primitive=Primitive;

class LocalConstructedValueBlock extends LocalValueBlock{constructor(parameters={}){super(parameters);this.value=(0,_pvutils.getParametersValue)(parameters,"value",[]);this.isIndefiniteForm=(0,_pvutils.getParametersValue)(parameters,"isIndefiniteForm",false);}
fromBER(inputBuffer,inputOffset,inputLength){ const initialOffset=inputOffset;const initialLength=inputLength;

 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.warnings.push("Zero buffer length");return inputOffset;}
 
function checkLen(indefiniteLength,length){if(indefiniteLength===true)return 1;return length;} 
let currentOffset=inputOffset;while(checkLen(this.isIndefiniteForm,inputLength)>0){const returnObject=LocalFromBER(inputBuffer,currentOffset,inputLength);if(returnObject.offset===-1){this.error=returnObject.result.error;this.warnings.concat(returnObject.result.warnings);return-1;}
currentOffset=returnObject.offset;this.blockLength+=returnObject.result.blockLength;inputLength-=returnObject.result.blockLength;this.value.push(returnObject.result);if(this.isIndefiniteForm===true&&returnObject.result.constructor.blockName()===EndOfContent.blockName())break;}
if(this.isIndefiniteForm===true){if(this.value[this.value.length-1].constructor.blockName()===EndOfContent.blockName())this.value.pop();else this.warnings.push("No EndOfContent block encoded");}
this.valueBeforeDecode=inputBuffer.slice(initialOffset,initialOffset+initialLength); return currentOffset;}
toBER(sizeOnly=false){let retBuf=new ArrayBuffer(0);for(let i=0;i<this.value.length;i++){const valueBuf=this.value[i].toBER(sizeOnly);retBuf=(0,_pvutils.utilConcatBuf)(retBuf,valueBuf);}
return retBuf;}
static blockName(){return"ConstructedValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.isIndefiniteForm=this.isIndefiniteForm;object.value=[];for(let i=0;i<this.value.length;i++)object.value.push(this.value[i].toJSON());return object;}
}
class Constructed extends BaseBlock{constructor(parameters={}){super(parameters,LocalConstructedValueBlock);this.idBlock.isConstructed=true;}
static blockName(){return"CONSTRUCTED";}
fromBER(inputBuffer,inputOffset,inputLength){this.valueBlock.isIndefiniteForm=this.lenBlock.isIndefiniteForm;const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
}
exports.Constructed=Constructed;

class LocalEndOfContentValueBlock extends LocalValueBlock{constructor(parameters={}){super(parameters);} 
fromBER(inputBuffer,inputOffset,inputLength){ return inputOffset;} 
toBER(sizeOnly=false){return new ArrayBuffer(0);}
static blockName(){return"EndOfContentValueBlock";}
}
class EndOfContent extends BaseBlock{constructor(paramaters={}){super(paramaters,LocalEndOfContentValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=0;}
static blockName(){return"EndOfContent";}
}
exports.EndOfContent=EndOfContent;

class LocalBooleanValueBlock extends LocalValueBlock{constructor(parameters={}){super(parameters);this.value=(0,_pvutils.getParametersValue)(parameters,"value",false);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",false);if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else{this.valueHex=new ArrayBuffer(1);if(this.value===true){const view=new Uint8Array(this.valueHex);view[0]=0xFF;}}}
fromBER(inputBuffer,inputOffset,inputLength){
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1;
 const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength); if(inputLength>1)this.warnings.push("Boolean value encoded in more then 1 octet");this.isHexOnly=true; this.valueHex=new ArrayBuffer(intBuffer.length);const view=new Uint8Array(this.valueHex);for(let i=0;i<intBuffer.length;i++)view[i]=intBuffer[i]; if(_pvutils.utilDecodeTC.call(this)!==0)this.value=true;else this.value=false;this.blockLength=inputLength;return inputOffset+inputLength;} 
toBER(sizeOnly=false){return this.valueHex;}
static blockName(){return"BooleanValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.value;object.isHexOnly=this.isHexOnly;object.valueHex=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);return object;}
}
class Boolean extends BaseBlock{constructor(parameters={}){super(parameters,LocalBooleanValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=1;}
static blockName(){return"Boolean";}
}
exports.Boolean=Boolean;

class Sequence extends Constructed{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=16;}
static blockName(){return"Sequence";}
}
exports.Sequence=Sequence;class Set extends Constructed{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=17;}
static blockName(){return"Set";}
}
exports.Set=Set;

class Null extends BaseBlock{constructor(parameters={}){super(parameters,LocalBaseBlock); this.idBlock.tagClass=1; this.idBlock.tagNumber=5;}
static blockName(){return"Null";} 
fromBER(inputBuffer,inputOffset,inputLength){if(this.lenBlock.length>0)this.warnings.push("Non-zero length of value block for Null type");if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;this.blockLength+=inputLength;if(inputOffset+inputLength>inputBuffer.byteLength){this.error="End of input reached before message was fully decoded (inconsistent offset and length values)";return-1;}
return inputOffset+inputLength;}
toBER(sizeOnly=false){const retBuf=new ArrayBuffer(2);if(sizeOnly===true)return retBuf;const retView=new Uint8Array(retBuf);retView[0]=0x05;retView[1]=0x00;return retBuf;}
}
exports.Null=Null;

class LocalOctetStringValueBlock extends LocalHexBlock(LocalConstructedValueBlock){constructor(parameters={}){super(parameters);this.isConstructed=(0,_pvutils.getParametersValue)(parameters,"isConstructed",false);}
fromBER(inputBuffer,inputOffset,inputLength){let resultOffset=0;if(this.isConstructed===true){this.isHexOnly=false;resultOffset=LocalConstructedValueBlock.prototype.fromBER.call(this,inputBuffer,inputOffset,inputLength);if(resultOffset===-1)return resultOffset;for(let i=0;i<this.value.length;i++){const currentBlockName=this.value[i].constructor.blockName();if(currentBlockName===EndOfContent.blockName()){if(this.isIndefiniteForm===true)break;else{this.error="EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";return-1;}}
if(currentBlockName!==OctetString.blockName()){this.error="OCTET STRING may consists of OCTET STRINGs only";return-1;}}}else{this.isHexOnly=true;resultOffset=super.fromBER(inputBuffer,inputOffset,inputLength);this.blockLength=inputLength;}
return resultOffset;}
toBER(sizeOnly=false){if(this.isConstructed===true)return LocalConstructedValueBlock.prototype.toBER.call(this,sizeOnly);let retBuf=new ArrayBuffer(this.valueHex.byteLength);if(sizeOnly===true)return retBuf;if(this.valueHex.byteLength===0)return retBuf;retBuf=this.valueHex.slice(0);return retBuf;}
static blockName(){return"OctetStringValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.isConstructed=this.isConstructed;object.isHexOnly=this.isHexOnly;object.valueHex=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);return object;}
}
class OctetString extends BaseBlock{constructor(parameters={}){super(parameters,LocalOctetStringValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=4;}
fromBER(inputBuffer,inputOffset,inputLength){this.valueBlock.isConstructed=this.idBlock.isConstructed;this.valueBlock.isIndefiniteForm=this.lenBlock.isIndefiniteForm; if(inputLength===0){if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;return inputOffset;} 
return super.fromBER(inputBuffer,inputOffset,inputLength);}
static blockName(){return"OctetString";} 
isEqual(octetString){ if(octetString instanceof OctetString===false)return false;
 if(JSON.stringify(this)!==JSON.stringify(octetString))return false; return true;}
}
exports.OctetString=OctetString;

class LocalBitStringValueBlock extends LocalHexBlock(LocalConstructedValueBlock){constructor(parameters={}){super(parameters);this.unusedBits=(0,_pvutils.getParametersValue)(parameters,"unusedBits",0);this.isConstructed=(0,_pvutils.getParametersValue)(parameters,"isConstructed",false);this.blockLength=this.valueHex.byteLength;}
fromBER(inputBuffer,inputOffset,inputLength){ if(inputLength===0)return inputOffset; let resultOffset=-1; if(this.isConstructed===true){resultOffset=LocalConstructedValueBlock.prototype.fromBER.call(this,inputBuffer,inputOffset,inputLength);if(resultOffset===-1)return resultOffset;for(let i=0;i<this.value.length;i++){const currentBlockName=this.value[i].constructor.blockName();if(currentBlockName===EndOfContent.blockName()){if(this.isIndefiniteForm===true)break;else{this.error="EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";return-1;}}
if(currentBlockName!==BitString.blockName()){this.error="BIT STRING may consists of BIT STRINGs only";return-1;}
if(this.unusedBits>0&&this.value[i].valueBlock.unusedBits>0){this.error="Usign of \"unused bits\" inside constructive BIT STRING allowed for least one only";return-1;}
this.unusedBits=this.value[i].valueBlock.unusedBits;if(this.unusedBits>7){this.error="Unused bits for BitString must be in range 0-7";return-1;}}
return resultOffset;}


 
if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1; const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);this.unusedBits=intBuffer[0];if(this.unusedBits>7){this.error="Unused bits for BitString must be in range 0-7";return-1;} 
this.valueHex=new ArrayBuffer(intBuffer.length-1);const view=new Uint8Array(this.valueHex);for(let i=0;i<inputLength-1;i++)view[i]=intBuffer[i+1]; this.blockLength=intBuffer.length;return inputOffset+inputLength;}
toBER(sizeOnly=false){if(this.isConstructed===true)return LocalConstructedValueBlock.prototype.toBER.call(this,sizeOnly);if(sizeOnly===true)return new ArrayBuffer(this.valueHex.byteLength+1);if(this.valueHex.byteLength===0)return new ArrayBuffer(0);const curView=new Uint8Array(this.valueHex);const retBuf=new ArrayBuffer(this.valueHex.byteLength+1);const retView=new Uint8Array(retBuf);retView[0]=this.unusedBits;for(let i=0;i<this.valueHex.byteLength;i++)retView[i+1]=curView[i];return retBuf;}
static blockName(){return"BitStringValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.unusedBits=this.unusedBits;object.isConstructed=this.isConstructed;object.isHexOnly=this.isHexOnly;object.valueHex=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);return object;}
}
class BitString extends BaseBlock{constructor(parameters={}){super(parameters,LocalBitStringValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=3;}
static blockName(){return"BitString";}
fromBER(inputBuffer,inputOffset,inputLength){ if(inputLength===0)return inputOffset; this.valueBlock.isConstructed=this.idBlock.isConstructed;this.valueBlock.isIndefiniteForm=this.lenBlock.isIndefiniteForm;return super.fromBER(inputBuffer,inputOffset,inputLength);}
isEqual(bitString){ if(bitString instanceof BitString===false)return false;
 if(JSON.stringify(this)!==JSON.stringify(bitString))return false; return true;}
}
exports.BitString=BitString;

class LocalIntegerValueBlock extends LocalHexBlock(LocalValueBlock){constructor(parameters={}){super(parameters);if("value"in parameters)this.valueDec=parameters.value;}
set valueHex(_value){this._valueHex=_value.slice(0);if(_value.byteLength>=4){this.warnings.push("Too big Integer for decoding, hex only");this.isHexOnly=true;this._valueDec=0;}else{this.isHexOnly=false;if(_value.byteLength>0)this._valueDec=_pvutils.utilDecodeTC.call(this);}}
get valueHex(){return this._valueHex;}
set valueDec(_value){this._valueDec=_value;this.isHexOnly=false;this._valueHex=(0,_pvutils.utilEncodeTC)(_value);}
get valueDec(){return this._valueDec;}
fromDER(inputBuffer,inputOffset,inputLength,expectedLength=0){const offset=this.fromBER(inputBuffer,inputOffset,inputLength);if(offset===-1)return offset;const view=new Uint8Array(this._valueHex);if(view[0]===0x00&&(view[1]&0x80)!==0){const updatedValueHex=new ArrayBuffer(this._valueHex.byteLength-1);const updatedView=new Uint8Array(updatedValueHex);updatedView.set(new Uint8Array(this._valueHex,1,this._valueHex.byteLength-1));this._valueHex=updatedValueHex.slice(0);}else{if(expectedLength!==0){if(this._valueHex.byteLength<expectedLength){if(expectedLength-this._valueHex.byteLength>1)expectedLength=this._valueHex.byteLength+1;const updatedValueHex=new ArrayBuffer(expectedLength);const updatedView=new Uint8Array(updatedValueHex);updatedView.set(view,expectedLength-this._valueHex.byteLength);this._valueHex=updatedValueHex.slice(0);}}}
return offset;}
toDER(sizeOnly=false){const view=new Uint8Array(this._valueHex);switch(true){case(view[0]&0x80)!==0:{const updatedValueHex=new ArrayBuffer(this._valueHex.byteLength+1);const updatedView=new Uint8Array(updatedValueHex);updatedView[0]=0x00;updatedView.set(view,1);this._valueHex=updatedValueHex.slice(0);}
break;case view[0]===0x00&&(view[1]&0x80)===0:{const updatedValueHex=new ArrayBuffer(this._valueHex.byteLength-1);const updatedView=new Uint8Array(updatedValueHex);updatedView.set(new Uint8Array(this._valueHex,1,this._valueHex.byteLength-1));this._valueHex=updatedValueHex.slice(0);}
break;default:}
return this.toBER(sizeOnly);}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=super.fromBER(inputBuffer,inputOffset,inputLength);if(resultOffset===-1)return resultOffset;this.blockLength=inputLength;return inputOffset+inputLength;}
toBER(sizeOnly=false){ return this.valueHex.slice(0);}
static blockName(){return"IntegerValueBlock";} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.valueDec=this.valueDec;return object;}
toString(){ function viewAdd(first,second){ const c=new Uint8Array([0]);let firstView=new Uint8Array(first);let secondView=new Uint8Array(second);let firstViewCopy=firstView.slice(0);const firstViewCopyLength=firstViewCopy.length-1;let secondViewCopy=secondView.slice(0);const secondViewCopyLength=secondViewCopy.length-1;let value=0;const max=secondViewCopyLength<firstViewCopyLength?firstViewCopyLength:secondViewCopyLength;let counter=0; for(let i=max;i>=0;i--,counter++){switch(true){case counter<secondViewCopy.length:value=firstViewCopy[firstViewCopyLength-counter]+secondViewCopy[secondViewCopyLength-counter]+c[0];break;default:value=firstViewCopy[firstViewCopyLength-counter]+c[0];}
c[0]=value/10;switch(true){case counter>=firstViewCopy.length:firstViewCopy=(0,_pvutils.utilConcatView)(new Uint8Array([value%10]),firstViewCopy);break;default:firstViewCopy[firstViewCopyLength-counter]=value%10;}}
if(c[0]>0)firstViewCopy=(0,_pvutils.utilConcatView)(c,firstViewCopy);return firstViewCopy.slice(0);}
function power2(n){if(n>=powers2.length){for(let p=powers2.length;p<=n;p++){const c=new Uint8Array([0]);let digits=powers2[p-1].slice(0);for(let i=digits.length-1;i>=0;i--){const newValue=new Uint8Array([(digits[i]<<1)+c[0]]);c[0]=newValue[0]/10;digits[i]=newValue[0]%10;}
if(c[0]>0)digits=(0,_pvutils.utilConcatView)(c,digits);powers2.push(digits);}}
return powers2[n];}
function viewSub(first,second){ let b=0;let firstView=new Uint8Array(first);let secondView=new Uint8Array(second);let firstViewCopy=firstView.slice(0);const firstViewCopyLength=firstViewCopy.length-1;let secondViewCopy=secondView.slice(0);const secondViewCopyLength=secondViewCopy.length-1;let value;let counter=0; for(let i=secondViewCopyLength;i>=0;i--,counter++){value=firstViewCopy[firstViewCopyLength-counter]-secondViewCopy[secondViewCopyLength-counter]-b;switch(true){case value<0:b=1;firstViewCopy[firstViewCopyLength-counter]=value+10;break;default:b=0;firstViewCopy[firstViewCopyLength-counter]=value;}}
if(b>0){for(let i=firstViewCopyLength-secondViewCopyLength+1;i>=0;i--,counter++){value=firstViewCopy[firstViewCopyLength-counter]-b;if(value<0){b=1;firstViewCopy[firstViewCopyLength-counter]=value+10;}else{b=0;firstViewCopy[firstViewCopyLength-counter]=value;break;}}}
return firstViewCopy.slice();}
 
const firstBit=this._valueHex.byteLength*8-1;let digits=new Uint8Array(this._valueHex.byteLength*8/3);let bitNumber=0;let currentByte;const asn1View=new Uint8Array(this._valueHex);let result="";let flag=false;
 for(let byteNumber=this._valueHex.byteLength-1;byteNumber>=0;byteNumber--){currentByte=asn1View[byteNumber];for(let i=0;i<8;i++){if((currentByte&1)===1){switch(bitNumber){case firstBit:digits=viewSub(power2(bitNumber),digits);result="-";break;default:digits=viewAdd(digits,power2(bitNumber));}}
bitNumber++;currentByte>>=1;}}
 
for(let i=0;i<digits.length;i++){if(digits[i])flag=true;if(flag)result+=digitsString.charAt(digits[i]);}
if(flag===false)result+=digitsString.charAt(0); return result;}
}
class Integer extends BaseBlock{constructor(parameters={}){super(parameters,LocalIntegerValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=2;}
static blockName(){return"Integer";} 
isEqual(otherValue){if(otherValue instanceof Integer){if(this.valueBlock.isHexOnly&&otherValue.valueBlock.isHexOnly) 
return(0,_pvutils.isEqualBuffer)(this.valueBlock.valueHex,otherValue.valueBlock.valueHex);if(this.valueBlock.isHexOnly===otherValue.valueBlock.isHexOnly)return this.valueBlock.valueDec===otherValue.valueBlock.valueDec;return false;}
if(otherValue instanceof ArrayBuffer)return(0,_pvutils.isEqualBuffer)(this.valueBlock.valueHex,otherValue);return false;}
convertToDER(){const integer=new Integer({valueHex:this.valueBlock.valueHex});integer.valueBlock.toDER();return integer;}
convertFromDER(){const expectedLength=this.valueBlock.valueHex.byteLength%2?this.valueBlock.valueHex.byteLength+1:this.valueBlock.valueHex.byteLength;const integer=new Integer({valueHex:this.valueBlock.valueHex});integer.valueBlock.fromDER(integer.valueBlock.valueHex,0,integer.valueBlock.valueHex.byteLength,expectedLength);return integer;}
}
exports.Integer=Integer;

class Enumerated extends Integer{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=10;}
static blockName(){return"Enumerated";}
}
exports.Enumerated=Enumerated;

class LocalSidValueBlock extends LocalHexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.valueDec=(0,_pvutils.getParametersValue)(parameters,"valueDec",-1);this.isFirstSid=(0,_pvutils.getParametersValue)(parameters,"isFirstSid",false);}
static blockName(){return"sidBlock";}
fromBER(inputBuffer,inputOffset,inputLength){if(inputLength===0)return inputOffset;
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1; const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);this.valueHex=new ArrayBuffer(inputLength);let view=new Uint8Array(this.valueHex);for(let i=0;i<inputLength;i++){view[i]=intBuffer[i]&0x7F;this.blockLength++;if((intBuffer[i]&0x80)===0x00)break;} 
const tempValueHex=new ArrayBuffer(this.blockLength);const tempView=new Uint8Array(tempValueHex);for(let i=0;i<this.blockLength;i++)tempView[i]=view[i]; this.valueHex=tempValueHex.slice(0);view=new Uint8Array(this.valueHex); if((intBuffer[this.blockLength-1]&0x80)!==0x00){this.error="End of input reached before message was fully decoded";return-1;}
if(view[0]===0x00)this.warnings.push("Needlessly long format of SID encoding");if(this.blockLength<=8)this.valueDec=(0,_pvutils.utilFromBase)(view,7);else{this.isHexOnly=true;this.warnings.push("Too big SID for decoding, hex only");}
return inputOffset+this.blockLength;}
toBER(sizeOnly=false){ let retBuf;let retView; if(this.isHexOnly){if(sizeOnly===true)return new ArrayBuffer(this.valueHex.byteLength);const curView=new Uint8Array(this.valueHex);retBuf=new ArrayBuffer(this.blockLength);retView=new Uint8Array(retBuf);for(let i=0;i<this.blockLength-1;i++)retView[i]=curView[i]|0x80;retView[this.blockLength-1]=curView[this.blockLength-1];return retBuf;}
const encodedBuf=(0,_pvutils.utilToBase)(this.valueDec,7);if(encodedBuf.byteLength===0){this.error="Error during encoding SID value";return new ArrayBuffer(0);}
retBuf=new ArrayBuffer(encodedBuf.byteLength);if(sizeOnly===false){const encodedView=new Uint8Array(encodedBuf);retView=new Uint8Array(retBuf);for(let i=0;i<encodedBuf.byteLength-1;i++)retView[i]=encodedView[i]|0x80;retView[encodedBuf.byteLength-1]=encodedView[encodedBuf.byteLength-1];}
return retBuf;}
toString(){let result="";if(this.isHexOnly===true)result=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);else{if(this.isFirstSid){let sidValue=this.valueDec;if(this.valueDec<=39)result="0.";else{if(this.valueDec<=79){result="1.";sidValue-=40;}else{result="2.";sidValue-=80;}}
result+=sidValue.toString();}else result=this.valueDec.toString();}
return result;} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.valueDec=this.valueDec;object.isFirstSid=this.isFirstSid;return object;}
}
class LocalObjectIdentifierValueBlock extends LocalValueBlock{constructor(parameters={}){super(parameters);this.fromString((0,_pvutils.getParametersValue)(parameters,"value",""));}
fromBER(inputBuffer,inputOffset,inputLength){let resultOffset=inputOffset;while(inputLength>0){const sidBlock=new LocalSidValueBlock();resultOffset=sidBlock.fromBER(inputBuffer,resultOffset,inputLength);if(resultOffset===-1){this.blockLength=0;this.error=sidBlock.error;return resultOffset;}
if(this.value.length===0)sidBlock.isFirstSid=true;this.blockLength+=sidBlock.blockLength;inputLength-=sidBlock.blockLength;this.value.push(sidBlock);}
return resultOffset;}
toBER(sizeOnly=false){let retBuf=new ArrayBuffer(0);for(let i=0;i<this.value.length;i++){const valueBuf=this.value[i].toBER(sizeOnly);if(valueBuf.byteLength===0){this.error=this.value[i].error;return new ArrayBuffer(0);}
retBuf=(0,_pvutils.utilConcatBuf)(retBuf,valueBuf);}
return retBuf;}
fromString(string){this.value=[]; let pos1=0;let pos2=0;let sid="";let flag=false;do{pos2=string.indexOf(".",pos1);if(pos2===-1)sid=string.substr(pos1);else sid=string.substr(pos1,pos2-pos1);pos1=pos2+1;if(flag){const sidBlock=this.value[0];let plus=0;switch(sidBlock.valueDec){case 0:break;case 1:plus=40;break;case 2:plus=80;break;default:this.value=[]; return false;}
const parsedSID=parseInt(sid,10);if(isNaN(parsedSID))return true;sidBlock.valueDec=parsedSID+plus;flag=false;}else{const sidBlock=new LocalSidValueBlock();sidBlock.valueDec=parseInt(sid,10);if(isNaN(sidBlock.valueDec))return true;if(this.value.length===0){sidBlock.isFirstSid=true;flag=true;}
this.value.push(sidBlock);}}while(pos2!==-1);return true;}
toString(){let result="";let isHexOnly=false;for(let i=0;i<this.value.length;i++){isHexOnly=this.value[i].isHexOnly;let sidStr=this.value[i].toString();if(i!==0)result=`${result}.`;if(isHexOnly){sidStr=`{${sidStr}}`;if(this.value[i].isFirstSid)result=`2.{${sidStr} - 80}`;else result+=sidStr;}else result+=sidStr;}
return result;}
static blockName(){return"ObjectIdentifierValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.toString();object.sidArray=[];for(let i=0;i<this.value.length;i++)object.sidArray.push(this.value[i].toJSON());return object;}
}
class ObjectIdentifier extends BaseBlock{constructor(parameters={}){super(parameters,LocalObjectIdentifierValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=6;}
static blockName(){return"ObjectIdentifier";}
}
exports.ObjectIdentifier=ObjectIdentifier;

class LocalUtf8StringValueBlock extends LocalHexBlock(LocalBaseBlock){ constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
static blockName(){return"Utf8StringValueBlock";} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.value;return object;}
}
class Utf8String extends BaseBlock{constructor(parameters={}){super(parameters,LocalUtf8StringValueBlock);if("value"in parameters)this.fromString(parameters.value);this.idBlock.tagClass=1; this.idBlock.tagNumber=12;}
static blockName(){return"Utf8String";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){this.valueBlock.value=String.fromCharCode.apply(null,new Uint8Array(inputBuffer));try{ this.valueBlock.value=decodeURIComponent(escape(this.valueBlock.value));}catch(ex){this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);}}
fromString(inputString){ const str=unescape(encodeURIComponent(inputString));const strLen=str.length;this.valueBlock.valueHex=new ArrayBuffer(strLen);const view=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<strLen;i++)view[i]=str.charCodeAt(i);this.valueBlock.value=inputString;}
}
exports.Utf8String=Utf8String;class LocalBmpStringValueBlock extends LocalHexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
static blockName(){return"BmpStringValueBlock";} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.value;return object;}
}
class BmpString extends BaseBlock{constructor(parameters={}){super(parameters,LocalBmpStringValueBlock);if("value"in parameters)this.fromString(parameters.value);this.idBlock.tagClass=1; this.idBlock.tagNumber=30;}
static blockName(){return"BmpString";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){ const copyBuffer=inputBuffer.slice(0);const valueView=new Uint8Array(copyBuffer);for(let i=0;i<valueView.length;i+=2){const temp=valueView[i];valueView[i]=valueView[i+1];valueView[i+1]=temp;}
this.valueBlock.value=String.fromCharCode.apply(null,new Uint16Array(copyBuffer));}
fromString(inputString){const strLength=inputString.length;this.valueBlock.valueHex=new ArrayBuffer(strLength*2);const valueHexView=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<strLength;i++){const codeBuf=(0,_pvutils.utilToBase)(inputString.charCodeAt(i),8);const codeView=new Uint8Array(codeBuf);if(codeView.length>2)continue;const dif=2-codeView.length;for(let j=codeView.length-1;j>=0;j--)valueHexView[i*2+j+dif]=codeView[j];}
this.valueBlock.value=inputString;}
}
exports.BmpString=BmpString;class LocalUniversalStringValueBlock extends LocalHexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
static blockName(){return"UniversalStringValueBlock";} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.value;return object;}
}
class UniversalString extends BaseBlock{constructor(parameters={}){super(parameters,LocalUniversalStringValueBlock);if("value"in parameters)this.fromString(parameters.value);this.idBlock.tagClass=1; this.idBlock.tagNumber=28;}
static blockName(){return"UniversalString";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){ const copyBuffer=inputBuffer.slice(0);const valueView=new Uint8Array(copyBuffer);for(let i=0;i<valueView.length;i+=4){valueView[i]=valueView[i+3];valueView[i+1]=valueView[i+2];valueView[i+2]=0x00;valueView[i+3]=0x00;}
this.valueBlock.value=String.fromCharCode.apply(null,new Uint32Array(copyBuffer));}
fromString(inputString){const strLength=inputString.length;this.valueBlock.valueHex=new ArrayBuffer(strLength*4);const valueHexView=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<strLength;i++){const codeBuf=(0,_pvutils.utilToBase)(inputString.charCodeAt(i),8);const codeView=new Uint8Array(codeBuf);if(codeView.length>4)continue;const dif=4-codeView.length;for(let j=codeView.length-1;j>=0;j--)valueHexView[i*4+j+dif]=codeView[j];}
this.valueBlock.value=inputString;}
}
exports.UniversalString=UniversalString;class LocalSimpleStringValueBlock extends LocalHexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.value="";this.isHexOnly=true;}
static blockName(){return"SimpleStringValueBlock";} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.value;return object;}
}
class LocalSimpleStringBlock extends BaseBlock{constructor(parameters={}){super(parameters,LocalSimpleStringValueBlock);if("value"in parameters)this.fromString(parameters.value);}
static blockName(){return"SIMPLESTRING";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){this.valueBlock.value=String.fromCharCode.apply(null,new Uint8Array(inputBuffer));}
fromString(inputString){const strLen=inputString.length;this.valueBlock.valueHex=new ArrayBuffer(strLen);const view=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<strLen;i++)view[i]=inputString.charCodeAt(i);this.valueBlock.value=inputString;}
}
class NumericString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=18;}
static blockName(){return"NumericString";}
}
exports.NumericString=NumericString;class PrintableString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=19;}
static blockName(){return"PrintableString";}
}
exports.PrintableString=PrintableString;class TeletexString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=20;}
static blockName(){return"TeletexString";}
}
exports.TeletexString=TeletexString;class VideotexString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=21;}
static blockName(){return"VideotexString";}
}
exports.VideotexString=VideotexString;class IA5String extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=22;}
static blockName(){return"IA5String";}
}
exports.IA5String=IA5String;class GraphicString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=25;}
static blockName(){return"GraphicString";}
}
exports.GraphicString=GraphicString;class VisibleString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=26;}
static blockName(){return"VisibleString";}
}
exports.VisibleString=VisibleString;class GeneralString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=27;}
static blockName(){return"GeneralString";}
}
exports.GeneralString=GeneralString;class CharacterString extends LocalSimpleStringBlock{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=29;}
static blockName(){return"CharacterString";}
}
exports.CharacterString=CharacterString;

class UTCTime extends VisibleString{constructor(parameters={}){super(parameters);this.year=0;this.month=0;this.day=0;this.hour=0;this.minute=0;this.second=0; if("value"in parameters){this.fromString(parameters.value);this.valueBlock.valueHex=new ArrayBuffer(parameters.value.length);const view=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<parameters.value.length;i++)view[i]=parameters.value.charCodeAt(i);}
 
if("valueDate"in parameters){this.fromDate(parameters.valueDate);this.valueBlock.valueHex=this.toBuffer();} 
this.idBlock.tagClass=1; this.idBlock.tagNumber=23;}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){this.fromString(String.fromCharCode.apply(null,new Uint8Array(inputBuffer)));}
toBuffer(){const str=this.toString();const buffer=new ArrayBuffer(str.length);const view=new Uint8Array(buffer);for(let i=0;i<str.length;i++)view[i]=str.charCodeAt(i);return buffer;}
fromDate(inputDate){this.year=inputDate.getUTCFullYear();this.month=inputDate.getUTCMonth()+1;this.day=inputDate.getUTCDate();this.hour=inputDate.getUTCHours();this.minute=inputDate.getUTCMinutes();this.second=inputDate.getUTCSeconds();} 
toDate(){return new Date(Date.UTC(this.year,this.month-1,this.day,this.hour,this.minute,this.second));}
fromString(inputString){ const parser=/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/ig;const parserArray=parser.exec(inputString);if(parserArray===null){this.error="Wrong input string for convertion";return;}
 
const year=parseInt(parserArray[1],10);if(year>=50)this.year=1900+year;else this.year=2000+year;this.month=parseInt(parserArray[2],10);this.day=parseInt(parserArray[3],10);this.hour=parseInt(parserArray[4],10);this.minute=parseInt(parserArray[5],10);this.second=parseInt(parserArray[6],10);}
toString(){const outputArray=new Array(7);outputArray[0]=(0,_pvutils.padNumber)(this.year<2000?this.year-1900:this.year-2000,2);outputArray[1]=(0,_pvutils.padNumber)(this.month,2);outputArray[2]=(0,_pvutils.padNumber)(this.day,2);outputArray[3]=(0,_pvutils.padNumber)(this.hour,2);outputArray[4]=(0,_pvutils.padNumber)(this.minute,2);outputArray[5]=(0,_pvutils.padNumber)(this.second,2);outputArray[6]="Z";return outputArray.join("");}
static blockName(){return"UTCTime";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.year=this.year;object.month=this.month;object.day=this.day;object.hour=this.hour;object.minute=this.minute;object.second=this.second;return object;}
}
exports.UTCTime=UTCTime;class GeneralizedTime extends VisibleString{constructor(parameters={}){super(parameters);this.year=0;this.month=0;this.day=0;this.hour=0;this.minute=0;this.second=0;this.millisecond=0; if("value"in parameters){this.fromString(parameters.value);this.valueBlock.valueHex=new ArrayBuffer(parameters.value.length);const view=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<parameters.value.length;i++)view[i]=parameters.value.charCodeAt(i);}
 
if("valueDate"in parameters){this.fromDate(parameters.valueDate);this.valueBlock.valueHex=this.toBuffer();} 
this.idBlock.tagClass=1; this.idBlock.tagNumber=24;}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
this.fromBuffer(this.valueBlock.valueHex);if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
fromBuffer(inputBuffer){this.fromString(String.fromCharCode.apply(null,new Uint8Array(inputBuffer)));}
toBuffer(){const str=this.toString();const buffer=new ArrayBuffer(str.length);const view=new Uint8Array(buffer);for(let i=0;i<str.length;i++)view[i]=str.charCodeAt(i);return buffer;}
fromDate(inputDate){this.year=inputDate.getUTCFullYear();this.month=inputDate.getUTCMonth()+1;this.day=inputDate.getUTCDate();this.hour=inputDate.getUTCHours();this.minute=inputDate.getUTCMinutes();this.second=inputDate.getUTCSeconds();this.millisecond=inputDate.getUTCMilliseconds();} 
toDate(){return new Date(Date.UTC(this.year,this.month-1,this.day,this.hour,this.minute,this.second,this.millisecond));}
fromString(inputString){ let isUTC=false;let timeString="";let dateTimeString="";let fractionPart=0;let parser;let hourDifference=0;let minuteDifference=0;
 if(inputString[inputString.length-1]==="Z"){timeString=inputString.substr(0,inputString.length-1);isUTC=true;}
 
else{ const number=new Number(inputString[inputString.length-1]);if(isNaN(number.valueOf()))throw new Error("Wrong input string for convertion");timeString=inputString;}
 
if(isUTC){if(timeString.indexOf("+")!==-1)throw new Error("Wrong input string for convertion");if(timeString.indexOf("-")!==-1)throw new Error("Wrong input string for convertion");}
 
else{let multiplier=1;let differencePosition=timeString.indexOf("+");let differenceString="";if(differencePosition===-1){differencePosition=timeString.indexOf("-");multiplier=-1;}
if(differencePosition!==-1){differenceString=timeString.substr(differencePosition+1);timeString=timeString.substr(0,differencePosition);if(differenceString.length!==2&&differenceString.length!==4)throw new Error("Wrong input string for convertion"); let number=new Number(differenceString.substr(0,2));if(isNaN(number.valueOf()))throw new Error("Wrong input string for convertion");hourDifference=multiplier*number;if(differenceString.length===4){ number=new Number(differenceString.substr(2,2));if(isNaN(number.valueOf()))throw new Error("Wrong input string for convertion");minuteDifference=multiplier*number;}}}
 
let fractionPointPosition=timeString.indexOf("."); if(fractionPointPosition===-1)fractionPointPosition=timeString.indexOf(",");

 if(fractionPointPosition!==-1){ const fractionPartCheck=new Number(`0${timeString.substr(fractionPointPosition)}`);if(isNaN(fractionPartCheck.valueOf()))throw new Error("Wrong input string for convertion");fractionPart=fractionPartCheck.valueOf();dateTimeString=timeString.substr(0,fractionPointPosition);}else dateTimeString=timeString;
 switch(true){case dateTimeString.length===8:parser=/(\d{4})(\d{2})(\d{2})/ig;if(fractionPointPosition!==-1)throw new Error("Wrong input string for convertion");break;case dateTimeString.length===10:parser=/(\d{4})(\d{2})(\d{2})(\d{2})/ig;if(fractionPointPosition!==-1){let fractionResult=60*fractionPart;this.minute=Math.floor(fractionResult);fractionResult=60*(fractionResult-this.minute);this.second=Math.floor(fractionResult);fractionResult=1000*(fractionResult-this.second);this.millisecond=Math.floor(fractionResult);}
break;case dateTimeString.length===12:parser=/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/ig;if(fractionPointPosition!==-1){let fractionResult=60*fractionPart;this.second=Math.floor(fractionResult);fractionResult=1000*(fractionResult-this.second);this.millisecond=Math.floor(fractionResult);}
break;case dateTimeString.length===14:parser=/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/ig;if(fractionPointPosition!==-1){const fractionResult=1000*fractionPart;this.millisecond=Math.floor(fractionResult);}
break;default:throw new Error("Wrong input string for convertion");}
 
const parserArray=parser.exec(dateTimeString);if(parserArray===null)throw new Error("Wrong input string for convertion");for(let j=1;j<parserArray.length;j++){switch(j){case 1:this.year=parseInt(parserArray[j],10);break;case 2:this.month=parseInt(parserArray[j],10);break;case 3:this.day=parseInt(parserArray[j],10);break;case 4:this.hour=parseInt(parserArray[j],10)+hourDifference;break;case 5:this.minute=parseInt(parserArray[j],10)+minuteDifference;break;case 6:this.second=parseInt(parserArray[j],10);break;default:throw new Error("Wrong input string for convertion");}}
 
if(isUTC===false){const tempDate=new Date(this.year,this.month,this.day,this.hour,this.minute,this.second,this.millisecond);this.year=tempDate.getUTCFullYear();this.month=tempDate.getUTCMonth();this.day=tempDate.getUTCDay();this.hour=tempDate.getUTCHours();this.minute=tempDate.getUTCMinutes();this.second=tempDate.getUTCSeconds();this.millisecond=tempDate.getUTCMilliseconds();}
}
toString(){const outputArray=[];outputArray.push((0,_pvutils.padNumber)(this.year,4));outputArray.push((0,_pvutils.padNumber)(this.month,2));outputArray.push((0,_pvutils.padNumber)(this.day,2));outputArray.push((0,_pvutils.padNumber)(this.hour,2));outputArray.push((0,_pvutils.padNumber)(this.minute,2));outputArray.push((0,_pvutils.padNumber)(this.second,2));if(this.millisecond!==0){outputArray.push(".");outputArray.push((0,_pvutils.padNumber)(this.millisecond,3));}
outputArray.push("Z");return outputArray.join("");}
static blockName(){return"GeneralizedTime";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.year=this.year;object.month=this.month;object.day=this.day;object.hour=this.hour;object.minute=this.minute;object.second=this.second;object.millisecond=this.millisecond;return object;}
}
exports.GeneralizedTime=GeneralizedTime;class DATE extends Utf8String{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=31;}
static blockName(){return"DATE";}
}
exports.DATE=DATE;class TimeOfDay extends Utf8String{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=32;}
static blockName(){return"TimeOfDay";}
}
exports.TimeOfDay=TimeOfDay;class DateTime extends Utf8String{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=33;}
static blockName(){return"DateTime";}
}
exports.DateTime=DateTime;class Duration extends Utf8String{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=34;}
static blockName(){return"Duration";}
}
exports.Duration=Duration;class TIME extends Utf8String{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=14;}
static blockName(){return"TIME";}
}
exports.TIME=TIME;

class Choice{constructor(parameters={}){this.value=(0,_pvutils.getParametersValue)(parameters,"value",[]);this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);}
}
exports.Choice=Choice;

class Any{constructor(parameters={}){this.name=(0,_pvutils.getParametersValue)(parameters,"name","");this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);}
}
exports.Any=Any;

class Repeated{constructor(parameters={}){this.name=(0,_pvutils.getParametersValue)(parameters,"name","");this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);this.value=(0,_pvutils.getParametersValue)(parameters,"value",new Any());this.local=(0,_pvutils.getParametersValue)(parameters,"local",false);}
}
exports.Repeated=Repeated;

class RawData{constructor(parameters={}){this.data=(0,_pvutils.getParametersValue)(parameters,"data",new ArrayBuffer(0));}
fromBER(inputBuffer,inputOffset,inputLength){this.data=inputBuffer.slice(inputOffset,inputLength);return inputOffset+inputLength;}
toBER(sizeOnly=false){return this.data;}
}
exports.RawData=RawData;

function LocalFromBER(inputBuffer,inputOffset,inputLength){const incomingOffset=inputOffset;
 function localChangeType(inputObject,newType){if(inputObject instanceof newType)return inputObject;const newObject=new newType();newObject.idBlock=inputObject.idBlock;newObject.lenBlock=inputObject.lenBlock;newObject.warnings=inputObject.warnings; newObject.valueBeforeDecode=inputObject.valueBeforeDecode.slice(0);return newObject;}
 
let returnObject=new BaseBlock({},Object);
 if((0,_pvutils.checkBufferParams)(new LocalBaseBlock(),inputBuffer,inputOffset,inputLength)===false){returnObject.error="Wrong input parameters";return{offset:-1,result:returnObject};}
 
const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);
 if(intBuffer.length===0){this.error="Zero buffer length";return{offset:-1,result:returnObject};}
 
let resultOffset=returnObject.idBlock.fromBER(inputBuffer,inputOffset,inputLength);returnObject.warnings.concat(returnObject.idBlock.warnings);if(resultOffset===-1){returnObject.error=returnObject.idBlock.error;return{offset:-1,result:returnObject};}
inputOffset=resultOffset;inputLength-=returnObject.idBlock.blockLength;
 resultOffset=returnObject.lenBlock.fromBER(inputBuffer,inputOffset,inputLength);returnObject.warnings.concat(returnObject.lenBlock.warnings);if(resultOffset===-1){returnObject.error=returnObject.lenBlock.error;return{offset:-1,result:returnObject};}
inputOffset=resultOffset;inputLength-=returnObject.lenBlock.blockLength;
 if(returnObject.idBlock.isConstructed===false&&returnObject.lenBlock.isIndefiniteForm===true){returnObject.error="Indefinite length form used for primitive encoding form";return{offset:-1,result:returnObject};}
 
let newASN1Type=BaseBlock;switch(returnObject.idBlock.tagClass){ case 1: if(returnObject.idBlock.tagNumber>=37&&returnObject.idBlock.isHexOnly===false){returnObject.error="UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";return{offset:-1,result:returnObject};} 
switch(returnObject.idBlock.tagNumber){ case 0: if(returnObject.idBlock.isConstructed===true&&returnObject.lenBlock.length>0){returnObject.error="Type [UNIVERSAL 0] is reserved";return{offset:-1,result:returnObject};} 
newASN1Type=EndOfContent;break;
 case 1:newASN1Type=Boolean;break;
 case 2:newASN1Type=Integer;break;
 case 3:newASN1Type=BitString;break;
 case 4:newASN1Type=OctetString;break;
 case 5:newASN1Type=Null;break;
 case 6:newASN1Type=ObjectIdentifier;break;
 case 10:newASN1Type=Enumerated;break;
 case 12:newASN1Type=Utf8String;break;
 case 14:newASN1Type=TIME;break;
 case 15:returnObject.error="[UNIVERSAL 15] is reserved by ASN.1 standard";return{offset:-1,result:returnObject};
 case 16:newASN1Type=Sequence;break;
 case 17:newASN1Type=Set;break;
 case 18:newASN1Type=NumericString;break;
 case 19:newASN1Type=PrintableString;break;
 case 20:newASN1Type=TeletexString;break;
 case 21:newASN1Type=VideotexString;break;
 case 22:newASN1Type=IA5String;break;
 case 23:newASN1Type=UTCTime;break;
 case 24:newASN1Type=GeneralizedTime;break;
 case 25:newASN1Type=GraphicString;break;
 case 26:newASN1Type=VisibleString;break;
 case 27:newASN1Type=GeneralString;break;
 case 28:newASN1Type=UniversalString;break;
 case 29:newASN1Type=CharacterString;break;
 case 30:newASN1Type=BmpString;break;
 case 31:newASN1Type=DATE;break;
 case 32:newASN1Type=TimeOfDay;break;
 case 33:newASN1Type=DateTime;break;
 case 34:newASN1Type=Duration;break;
 default:{let newObject;if(returnObject.idBlock.isConstructed===true)newObject=new Constructed();else newObject=new Primitive();newObject.idBlock=returnObject.idBlock;newObject.lenBlock=returnObject.lenBlock;newObject.warnings=returnObject.warnings;returnObject=newObject;resultOffset=returnObject.fromBER(inputBuffer,inputOffset,inputLength);}
}
break;
 case 2: case 3: case 4: default:{if(returnObject.idBlock.isConstructed===true)newASN1Type=Constructed;else newASN1Type=Primitive;}
}
 
returnObject=localChangeType(returnObject,newASN1Type);resultOffset=returnObject.fromBER(inputBuffer,inputOffset,returnObject.lenBlock.isIndefiniteForm===true?inputLength:returnObject.lenBlock.length);
 returnObject.valueBeforeDecode=inputBuffer.slice(incomingOffset,incomingOffset+returnObject.blockLength); return{offset:resultOffset,result:returnObject};}
function fromBER(inputBuffer){if(inputBuffer.byteLength===0){const result=new BaseBlock({},Object);result.error="Input buffer has zero length";return{offset:-1,result};}
return LocalFromBER(inputBuffer,0,inputBuffer.byteLength);}


function compareSchema(root,inputData,inputSchema){ if(inputSchema instanceof Choice){const choiceResult=false;for(let j=0;j<inputSchema.value.length;j++){const result=compareSchema(root,inputData,inputSchema.value[j]);if(result.verified===true){return{verified:true,result:root};}}
if(choiceResult===false){const _result={verified:false,result:{error:"Wrong values for Choice type"}};if(inputSchema.hasOwnProperty("name"))_result.name=inputSchema.name;return _result;}}
 
if(inputSchema instanceof Any){ if(inputSchema.hasOwnProperty("name"))root[inputSchema.name]=inputData; return{verified:true,result:root};}
 
if(root instanceof Object===false){return{verified:false,result:{error:"Wrong root object"}};}
if(inputData instanceof Object===false){return{verified:false,result:{error:"Wrong ASN.1 data"}};}
if(inputSchema instanceof Object===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if("idBlock"in inputSchema===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}



if("fromBER"in inputSchema.idBlock===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if("toBER"in inputSchema.idBlock===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
const encodedId=inputSchema.idBlock.toBER(false);if(encodedId.byteLength===0){return{verified:false,result:{error:"Error encoding idBlock for ASN.1 schema"}};}
const decodedOffset=inputSchema.idBlock.fromBER(encodedId,0,encodedId.byteLength);if(decodedOffset===-1){return{verified:false,result:{error:"Error decoding idBlock for ASN.1 schema"}};}
 
if(inputSchema.idBlock.hasOwnProperty("tagClass")===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if(inputSchema.idBlock.tagClass!==inputData.idBlock.tagClass){return{verified:false,result:root};}
 
if(inputSchema.idBlock.hasOwnProperty("tagNumber")===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if(inputSchema.idBlock.tagNumber!==inputData.idBlock.tagNumber){return{verified:false,result:root};}
 
if(inputSchema.idBlock.hasOwnProperty("isConstructed")===false){return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if(inputSchema.idBlock.isConstructed!==inputData.idBlock.isConstructed){return{verified:false,result:root};}
 
if("isHexOnly"in inputSchema.idBlock===false)
{return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
if(inputSchema.idBlock.isHexOnly!==inputData.idBlock.isHexOnly){return{verified:false,result:root};}
 
if(inputSchema.idBlock.isHexOnly===true){if("valueHex"in inputSchema.idBlock===false)
{return{verified:false,result:{error:"Wrong ASN.1 schema"}};}
const schemaView=new Uint8Array(inputSchema.idBlock.valueHex);const asn1View=new Uint8Array(inputData.idBlock.valueHex);if(schemaView.length!==asn1View.length){return{verified:false,result:root};}
for(let i=0;i<schemaView.length;i++){if(schemaView[i]!==asn1View[1]){return{verified:false,result:root};}}}

 
if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!=="")root[inputSchema.name]=inputData;}
 
if(inputSchema.idBlock.isConstructed===true){let admission=0;let result={verified:false};let maxLength=inputSchema.valueBlock.value.length;if(maxLength>0){if(inputSchema.valueBlock.value[0]instanceof Repeated)maxLength=inputData.valueBlock.value.length;} 
if(maxLength===0){return{verified:true,result:root};}
 
if(inputData.valueBlock.value.length===0&&inputSchema.valueBlock.value.length!==0){let _optional=true;for(let i=0;i<inputSchema.valueBlock.value.length;i++)_optional=_optional&&(inputSchema.valueBlock.value[i].optional||false);if(_optional===true){return{verified:true,result:root};} 
if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!=="")delete root[inputSchema.name];} 
root.error="Inconsistent object length";return{verified:false,result:root};} 
for(let i=0;i<maxLength;i++){ if(i-admission>=inputData.valueBlock.value.length){if(inputSchema.valueBlock.value[i].optional===false){const _result={verified:false,result:root};root.error="Inconsistent length between ASN.1 data and schema"; if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!==""){delete root[inputSchema.name];_result.name=inputSchema.name;}} 
return _result;}} 
else{ if(inputSchema.valueBlock.value[0]instanceof Repeated){result=compareSchema(root,inputData.valueBlock.value[i],inputSchema.valueBlock.value[0].value);if(result.verified===false){if(inputSchema.valueBlock.value[0].optional===true)admission++;else{ if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!=="")delete root[inputSchema.name];} 
return result;}}
if("name"in inputSchema.valueBlock.value[0]&&inputSchema.valueBlock.value[0].name.length>0){let arrayRoot={};if("local"in inputSchema.valueBlock.value[0]&&inputSchema.valueBlock.value[0].local===true)arrayRoot=inputData;else arrayRoot=root;if(typeof arrayRoot[inputSchema.valueBlock.value[0].name]==="undefined")arrayRoot[inputSchema.valueBlock.value[0].name]=[];arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);}} 
else{result=compareSchema(root,inputData.valueBlock.value[i-admission],inputSchema.valueBlock.value[i]);if(result.verified===false){if(inputSchema.valueBlock.value[i].optional===true)admission++;else{ if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!=="")delete root[inputSchema.name];} 
return result;}}}}}
if(result.verified===false)
{const _result={verified:false,result:root}; if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!==""){delete root[inputSchema.name];_result.name=inputSchema.name;}} 
return _result;}
return{verified:true,result:root};}

if("primitiveSchema"in inputSchema&&"valueHex"in inputData.valueBlock){ const asn1=fromBER(inputData.valueBlock.valueHex);if(asn1.offset===-1){const _result={verified:false,result:asn1.result}; if(inputSchema.hasOwnProperty("name")){inputSchema.name=inputSchema.name.replace(/^\s+|\s+$/g,"");if(inputSchema.name!==""){delete root[inputSchema.name];_result.name=inputSchema.name;}} 
return _result;} 
return compareSchema(root,asn1.result,inputSchema.primitiveSchema);}
return{verified:true,result:root};} 
function verifySchema(inputBuffer,inputSchema){ if(inputSchema instanceof Object===false){return{verified:false,result:{error:"Wrong ASN.1 schema type"}};}
 
const asn1=fromBER(inputBuffer);if(asn1.offset===-1){return{verified:false,result:asn1.result};}
 
return compareSchema(asn1.result,asn1.result,inputSchema);}

 
function fromJSON(json){}


},{"pvutils":3}],3:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.getUTCDate=getUTCDate;exports.getParametersValue=getParametersValue;exports.bufferToHexCodes=bufferToHexCodes;exports.checkBufferParams=checkBufferParams;exports.utilFromBase=utilFromBase;exports.utilToBase=utilToBase;exports.utilConcatBuf=utilConcatBuf;exports.utilConcatView=utilConcatView;exports.utilDecodeTC=utilDecodeTC;exports.utilEncodeTC=utilEncodeTC;exports.isEqualBuffer=isEqualBuffer;exports.padNumber=padNumber;exports.toBase64=toBase64;exports.fromBase64=fromBase64;exports.arrayBufferToString=arrayBufferToString;exports.stringToArrayBuffer=stringToArrayBuffer;exports.nearestPowerOf2=nearestPowerOf2;exports.clearProps=clearProps;function getUTCDate(date){ return new Date(date.getTime()+date.getTimezoneOffset()*60000);} 
function getParametersValue(parameters,name,defaultValue){ if(parameters instanceof Object===false)return defaultValue; if(name in parameters)return parameters[name];return defaultValue;}
function bufferToHexCodes(inputBuffer,inputOffset=0,inputLength=inputBuffer.byteLength-inputOffset,insertSpace=false){let result="";var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=new Uint8Array(inputBuffer,inputOffset,inputLength)[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const item=_step.value; const str=item.toString(16).toUpperCase(); if(str.length===1)result+="0";result+=str; if(insertSpace)result+=" ";}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
return result.trim();} 
function checkBufferParams(baseBlock,inputBuffer,inputOffset,inputLength){ if(inputBuffer instanceof ArrayBuffer===false){ baseBlock.error="Wrong parameter: inputBuffer must be \"ArrayBuffer\"";return false;} 
if(inputBuffer.byteLength===0){ baseBlock.error="Wrong parameter: inputBuffer has zero length";return false;} 
if(inputOffset<0){ baseBlock.error="Wrong parameter: inputOffset less than zero";return false;} 
if(inputLength<0){ baseBlock.error="Wrong parameter: inputLength less than zero";return false;} 
if(inputBuffer.byteLength-inputOffset-inputLength<0){ baseBlock.error="End of input reached before message was fully decoded (inconsistent offset and length values)";return false;}
return true;} 
function utilFromBase(inputBuffer,inputBase){let result=0; if(inputBuffer.length===1)return inputBuffer[0]; for(let i=inputBuffer.length-1;i>=0;i--)result+=inputBuffer[inputBuffer.length-1-i]*Math.pow(2,inputBase*i);return result;} 
function utilToBase(value,base,reserved=-1){const internalReserved=reserved;let internalValue=value;let result=0;let biggest=Math.pow(2,base); for(let i=1;i<8;i++){if(value<biggest){let retBuf; if(internalReserved<0){retBuf=new ArrayBuffer(i);result=i;}else{ if(internalReserved<i)return new ArrayBuffer(0);retBuf=new ArrayBuffer(internalReserved);result=internalReserved;}
const retView=new Uint8Array(retBuf); for(let j=i-1;j>=0;j--){const basis=Math.pow(2,j*base);retView[result-j-1]=Math.floor(internalValue/basis);internalValue-=retView[result-j-1]*basis;}
return retBuf;}
biggest*=Math.pow(2,base);}
return new ArrayBuffer(0);} 
function utilConcatBuf(...buffers){ let outputLength=0;let prevLength=0;

 var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=buffers[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const buffer=_step2.value;outputLength+=buffer.byteLength;}
}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}
const retBuf=new ArrayBuffer(outputLength);const retView=new Uint8Array(retBuf);var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=buffers[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const buffer=_step3.value; retView.set(new Uint8Array(buffer),prevLength);prevLength+=buffer.byteLength;}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}
return retBuf;} 
function utilConcatView(...views){ let outputLength=0;let prevLength=0;

 var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=views[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){const view=_step4.value;outputLength+=view.length;}
}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}
const retBuf=new ArrayBuffer(outputLength);const retView=new Uint8Array(retBuf);var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=views[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){const view=_step5.value;retView.set(view,prevLength);prevLength+=view.length;}}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}
return retView;} 
function utilDecodeTC(){const buf=new Uint8Array(this.valueHex); if(this.valueHex.byteLength>=2){ const condition1=buf[0]===0xFF&&buf[1]&0x80; const condition2=buf[0]===0x00&&(buf[1]&0x80)===0x00; if(condition1||condition2)this.warnings.push("Needlessly long format");} 
const bigIntBuffer=new ArrayBuffer(this.valueHex.byteLength);const bigIntView=new Uint8Array(bigIntBuffer); for(let i=0;i<this.valueHex.byteLength;i++)bigIntView[i]=0; bigIntView[0]=buf[0]&0x80; const bigInt=utilFromBase(bigIntView,8);
 const smallIntBuffer=new ArrayBuffer(this.valueHex.byteLength);const smallIntView=new Uint8Array(smallIntBuffer); for(let j=0;j<this.valueHex.byteLength;j++)smallIntView[j]=buf[j]; smallIntView[0]&=0x7F; const smallInt=utilFromBase(smallIntView,8); return smallInt-bigInt;} 
function utilEncodeTC(value){ const modValue=value<0?value*-1:value;let bigInt=128; for(let i=1;i<8;i++){if(modValue<=bigInt){ if(value<0){const smallInt=bigInt-modValue;const retBuf=utilToBase(smallInt,8,i);const retView=new Uint8Array(retBuf); retView[0]|=0x80;return retBuf;}
let retBuf=utilToBase(modValue,8,i);let retView=new Uint8Array(retBuf); if(retView[0]&0x80){ const tempBuf=retBuf.slice(0);const tempView=new Uint8Array(tempBuf);retBuf=new ArrayBuffer(retBuf.byteLength+1); retView=new Uint8Array(retBuf); for(let k=0;k<tempBuf.byteLength;k++)retView[k+1]=tempView[k]; retView[0]=0x00;}
return retBuf;}
bigInt*=Math.pow(2,8);}
return new ArrayBuffer(0);} 
function isEqualBuffer(inputBuffer1,inputBuffer2){ if(inputBuffer1.byteLength!==inputBuffer2.byteLength)return false; const view1=new Uint8Array(inputBuffer1); const view2=new Uint8Array(inputBuffer2);for(let i=0;i<view1.length;i++){ if(view1[i]!==view2[i])return false;}
return true;} 
function padNumber(inputNumber,fullLength){const str=inputNumber.toString(10); if(fullLength<str.length)return"";const dif=fullLength-str.length;const padding=new Array(dif); for(let i=0;i<dif;i++)padding[i]="0";const paddingString=padding.join("");return paddingString.concat(str);}
const base64Template="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";const base64UrlTemplate="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_="; function toBase64(input,useUrlTemplate=false,skipPadding=false,skipLeadingZeros=false){let i=0; let flag1=0; let flag2=0;let output=""; const template=useUrlTemplate?base64UrlTemplate:base64Template;if(skipLeadingZeros){let nonZeroPosition=0;for(let i=0;i<input.length;i++){ if(input.charCodeAt(i)!==0){nonZeroPosition=i; break;}} 
input=input.slice(nonZeroPosition);}
while(i<input.length){ const chr1=input.charCodeAt(i++); if(i>=input.length)flag1=1; const chr2=input.charCodeAt(i++); if(i>=input.length)flag2=1; const chr3=input.charCodeAt(i++); const enc1=chr1>>2; const enc2=(chr1&0x03)<<4|chr2>>4; let enc3=(chr2&0x0F)<<2|chr3>>6; let enc4=chr3&0x3F; if(flag1===1){ enc3=enc4=64;}else{ if(flag2===1){ enc4=64;}} 
if(skipPadding){ if(enc3===64)output+=`${template.charAt(enc1)}${template.charAt(enc2)}`;else{ if(enc4===64)output+=`${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}`;else output+=`${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;}}else output+=`${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;}
return output;} 
function fromBase64(input,useUrlTemplate=false,cutTailZeros=false){ const template=useUrlTemplate?base64UrlTemplate:base64Template;
 function indexof(toSearch){ for(let i=0;i<64;i++){ if(template.charAt(i)===toSearch)return i;} 
return 64;} 
function test(incoming){ return incoming===64?0x00:incoming;} 
let i=0;let output="";while(i<input.length){ const enc1=indexof(input.charAt(i++)); const enc2=i>=input.length?0x00:indexof(input.charAt(i++)); const enc3=i>=input.length?0x00:indexof(input.charAt(i++)); const enc4=i>=input.length?0x00:indexof(input.charAt(i++)); const chr1=test(enc1)<<2|test(enc2)>>4; const chr2=(test(enc2)&0x0F)<<4|test(enc3)>>2; const chr3=(test(enc3)&0x03)<<6|test(enc4);output+=String.fromCharCode(chr1); if(enc3!==64)output+=String.fromCharCode(chr2); if(enc4!==64)output+=String.fromCharCode(chr3);}
if(cutTailZeros){const outputLength=output.length;let nonZeroStart=-1; for(let i=outputLength-1;i>=0;i--){ if(output.charCodeAt(i)!==0){nonZeroStart=i; break;}} 
if(nonZeroStart!==-1)output=output.slice(0,nonZeroStart+1);else output="";}
return output;}
function arrayBufferToString(buffer){let resultString="";const view=new Uint8Array(buffer); var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=view[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){const element=_step6.value;resultString+=String.fromCharCode(element);}}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}
return resultString;}
function stringToArrayBuffer(str){const stringLength=str.length;const resultBuffer=new ArrayBuffer(stringLength);const resultView=new Uint8Array(resultBuffer); for(let i=0;i<stringLength;i++)resultView[i]=str.charCodeAt(i);return resultBuffer;}
const log2=Math.log(2); function nearestPowerOf2(length){const base=Math.log(length)/log2;const floor=Math.floor(base);const round=Math.round(base); return floor===round?floor:round;}
function clearProps(object,propsArray){var _iteratorNormalCompletion7=true;var _didIteratorError7=false;var _iteratorError7=undefined;try{for(var _iterator7=propsArray[Symbol.iterator](),_step7;!(_iteratorNormalCompletion7=(_step7=_iterator7.next()).done);_iteratorNormalCompletion7=true){const prop=_step7.value;delete object[prop];}}catch(err){_didIteratorError7=true;_iteratorError7=err;}finally{try{if(!_iteratorNormalCompletion7&&_iterator7.return){_iterator7.return();}}finally{if(_didIteratorError7){throw _iteratorError7;}}}}
},{}]},{},[1])(1)});