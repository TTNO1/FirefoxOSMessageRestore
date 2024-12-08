"use strict";class StackFrameCache{constructor(){this._framesToIndices=null;this._framesToForms=null;this._lastEventSize=0;}
initFrames(){if(this._framesToIndices){return;}
this._framesToIndices=new Map();this._framesToForms=new Map();this._lastEventSize=0;}
clearFrames(){this._framesToIndices.clear();this._framesToIndices=null;this._framesToForms.clear();this._framesToForms=null;this._lastEventSize=0;}
addFrame(frame){this._assignFrameIndices(frame);this._createFrameForms(frame);return this._framesToIndices.get(frame);}
updateFramePacket(packet){

const size=this._framesToForms.size;packet.frames=Array(size).fill(null);for(const[stack,index]of this._framesToIndices){packet.frames[index]=this._framesToForms.get(stack);}
return packet;}
makeEvent(){const size=this._framesToForms.size;if(!size||size<=this._lastEventSize){return null;}
const packet=Array(size-this._lastEventSize).fill(null);for(const[stack,index]of this._framesToIndices){if(index>=this._lastEventSize){packet[index-this._lastEventSize]=this._framesToForms.get(stack);}}
this._lastEventSize=size;return packet;}
_assignFrameIndices(frame){if(this._framesToIndices.has(frame)){return;}
if(frame){this._assignFrameIndices(frame.parent);this._assignFrameIndices(frame.asyncParent);}
const index=this._framesToIndices.size;this._framesToIndices.set(frame,index);}
_createFrameForms(frame){if(this._framesToForms.has(frame)){return;}
let form=null;if(frame){form={line:frame.line,column:frame.column,source:frame.source,functionDisplayName:frame.functionDisplayName,parent:this._framesToIndices.get(frame.parent),asyncParent:this._framesToIndices.get(frame.asyncParent),asyncCause:frame.asyncCause,};this._createFrameForms(frame.parent);this._createFrameForms(frame.asyncParent);}
this._framesToForms.set(frame,form);}}
exports.StackFrameCache=StackFrameCache;