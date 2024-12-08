"use strict";function findSourceOffset(source,line,column){const offsets=getSourceLineOffsets(source);const offset=offsets[line-1];if(offset){
return Math.min(offset.start+column,offset.textEnd);}
return line<0?0:offsets[offsets.length-1].end;}
exports.findSourceOffset=findSourceOffset;const NEWLINE=/(\r?\n|\r|\u2028|\u2029)/g;const SOURCE_OFFSETS=new WeakMap();function getSourceLineOffsets(source){const cached=SOURCE_OFFSETS.get(source);if(cached){return cached;}
const{text}=source;const lines=text.split(NEWLINE);const offsets=[];let offset=0;for(let i=0;i<lines.length;i+=2){const line=lines[i];const start=offset;let end=offset; for(const c of line){end++;}
const textEnd=end;if(i+1<lines.length){end+=lines[i+1].length;}
offsets.push(Object.freeze({start,textEnd,end}));offset=end;}
Object.freeze(offsets);SOURCE_OFFSETS.set(source,offsets);return offsets;}
function getActorIdForInternalSourceId(targetActor,id){const actor=targetActor.sourcesManager.getSourceActorByInternalSourceId(id);return actor?actor.actorID:null;}
exports.getActorIdForInternalSourceId=getActorIdForInternalSourceId;