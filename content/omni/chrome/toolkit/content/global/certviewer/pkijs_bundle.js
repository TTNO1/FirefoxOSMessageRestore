(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pkijs=f()}})(function(){var define,module,exports;return(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.parseByteMap=parseByteMap;class ByteStream{ constructor(parameters={}){this.clear();var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=Object.keys(parameters)[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const key=_step.value;switch(key){case"length":this.length=parameters.length;break;case"stub": for(let i=0;i<this._view.length;i++)this._view[i]=parameters.stub;break;case"view":this.fromUint8Array(parameters.view);break;case"buffer":this.fromArrayBuffer(parameters.buffer);break;case"string":this.fromString(parameters.string);break;case"hexstring":this.fromHexString(parameters.hexstring);break;default:}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}}
set buffer(value){this._buffer=value.slice(0);this._view=new Uint8Array(this._buffer);}
get buffer(){return this._buffer;}
set view(value){this._buffer=new ArrayBuffer(value.length);this._view=new Uint8Array(this._buffer);this._view.set(value);}
get view(){return this._view;}
get length(){return this._buffer.byteLength;}
set length(value){this._buffer=new ArrayBuffer(value);this._view=new Uint8Array(this._buffer);}
clear(){this._buffer=new ArrayBuffer(0);this._view=new Uint8Array(this._buffer);}
fromArrayBuffer(array){this.buffer=array;} 
fromUint8Array(array){this._buffer=new ArrayBuffer(array.length);this._view=new Uint8Array(this._buffer);this._view.set(array);}
fromString(string){const stringLength=string.length;this.length=stringLength; for(let i=0;i<stringLength;i++)this.view[i]=string.charCodeAt(i);}
toString(start=0,length=this.view.length-start){ let result="";

 if(start>=this.view.length||start<0){ start=0;} 
if(length>=this.view.length||length<0){ length=this.view.length-start;}

 
for(let i=start;i<start+length;i++)result+=String.fromCharCode(this.view[i]); return result;} 
fromHexString(hexString){ const stringLength=hexString.length;this.buffer=new ArrayBuffer(stringLength>>1);this.view=new Uint8Array(this.buffer);const hexMap=new Map(); hexMap.set("0",0x00); hexMap.set("1",0x01); hexMap.set("2",0x02); hexMap.set("3",0x03); hexMap.set("4",0x04); hexMap.set("5",0x05); hexMap.set("6",0x06); hexMap.set("7",0x07); hexMap.set("8",0x08); hexMap.set("9",0x09); hexMap.set("A",0x0A); hexMap.set("a",0x0A); hexMap.set("B",0x0B); hexMap.set("b",0x0B); hexMap.set("C",0x0C); hexMap.set("c",0x0C); hexMap.set("D",0x0D); hexMap.set("d",0x0D); hexMap.set("E",0x0E); hexMap.set("e",0x0E); hexMap.set("F",0x0F); hexMap.set("f",0x0F);let j=0; let temp=0x00;
 for(let i=0;i<stringLength;i++){ if(!(i%2)){ temp=hexMap.get(hexString.charAt(i))<<4;}else{ temp|=hexMap.get(hexString.charAt(i));this.view[j]=temp;j++;}}
} 
toHexString(start=0,length=this.view.length-start){ let result="";

 if(start>=this.view.length||start<0){ start=0;} 
if(length>=this.view.length||length<0){ length=this.view.length-start;} 
for(let i=start;i<start+length;i++){ const str=this.view[i].toString(16).toUpperCase(); result=result+(str.length==1?"0":"")+str;}
return result;} 
copy(start=0,length=this._buffer.byteLength-start){
 if(start===0&&this._buffer.byteLength===0)return new ByteStream(); if(start<0||start>this._buffer.byteLength-1)throw new Error(`Wrong start position: ${start}`); const stream=new ByteStream();stream._buffer=this._buffer.slice(start,start+length);stream._view=new Uint8Array(stream._buffer);return stream;} 
slice(start=0,end=this._buffer.byteLength){
 if(start===0&&this._buffer.byteLength===0)return new ByteStream(); if(start<0||start>this._buffer.byteLength-1)throw new Error(`Wrong start position: ${start}`); const stream=new ByteStream();stream._buffer=this._buffer.slice(start,end);stream._view=new Uint8Array(stream._buffer);return stream;}
realloc(size){ const buffer=new ArrayBuffer(size);const view=new Uint8Array(buffer);

 if(size>this._view.length)view.set(this._view);else{ view.set(new Uint8Array(this._buffer,0,size));}

this._buffer=buffer.slice(0);this._view=new Uint8Array(this._buffer);} 
append(stream){ const initialSize=this._buffer.byteLength;const streamViewLength=stream._buffer.byteLength;const copyView=stream._view.slice();
 this.realloc(initialSize+streamViewLength);
 this._view.set(copyView,initialSize);} 
insert(stream,start=0,length=this._buffer.byteLength-start){
 if(start>this._buffer.byteLength-1)return false;if(length>this._buffer.byteLength-start){ length=this._buffer.byteLength-start;}
 
if(length>stream._buffer.byteLength){ length=stream._buffer.byteLength;}

 
if(length==stream._buffer.byteLength)this._view.set(stream._view,start);else{ this._view.set(stream._view.slice(0,length),start);} 
return true;} 
isEqual(stream){
 if(this._buffer.byteLength!=stream._buffer.byteLength)return false;
 for(let i=0;i<stream._buffer.byteLength;i++){ if(this.view[i]!=stream.view[i])return false;} 
return true;} 
isEqualView(view){
 if(view.length!=this.view.length)return false;
 for(let i=0;i<view.length;i++){ if(this.view[i]!=view[i])return false;} 
return true;} 
findPattern(pattern,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}}
 
const patternLength=pattern.buffer.byteLength; if(patternLength>length)return-1;
 const patternArray=[]; for(let i=0;i<patternLength;i++)patternArray.push(pattern.view[i]);
 for(let i=0;i<=length-patternLength;i++){let equal=true; const equalStart=backward?start-patternLength-i:start+i;for(let j=0;j<patternLength;j++){ if(this.view[j+equalStart]!=patternArray[j]){equal=false; break;}}
if(equal){ return backward?start-patternLength-i:start+patternLength+i;}} 
return-1;} 
findFirstIn(patterns,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}} 
const result={id:-1,position:backward?0:start+length,length:0}; for(let i=0;i<patterns.length;i++){const position=this.findPattern(patterns[i],start,length,backward); if(position!=-1){let valid=false;const patternLength=patterns[i].length;if(backward){ if(position-patternLength>=result.position-result.length)valid=true;}else{ if(position-patternLength<=result.position-result.length)valid=true;}
if(valid){result.position=position;result.id=i;result.length=patternLength;}}}
return result;} 
findAllIn(patterns,start=0,length=this.buffer.byteLength-start){ const result=[]; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return result; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
let patternFound={id:-1,position:start};
 do{const position=patternFound.position;patternFound=this.findFirstIn(patterns,patternFound.position,length); if(patternFound.id==-1){ break;} 
length-=patternFound.position-position;result.push({id:patternFound.id,position:patternFound.position});}while(true);
 return result;} 
findAllPatternIn(pattern,start=0,length=this.buffer.byteLength-start){
 if(start==null){ start=0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;} 
if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
 
const result=[];const patternLength=pattern.buffer.byteLength; if(patternLength>length)return-1;
 const patternArray=Array.from(pattern.view);
 for(let i=0;i<=length-patternLength;i++){let equal=true;const equalStart=start+i;for(let j=0;j<patternLength;j++){ if(this.view[j+equalStart]!=patternArray[j]){equal=false; break;}}
if(equal){result.push(start+patternLength+i); i+=patternLength-1;}} 
return result;} 
findFirstNotIn(patterns,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}}
const result={left:{id:-1,position:start},right:{id:-1,position:0},value:new ByteStream()};let currentLength=length;
 while(currentLength>0){ result.right=this.findFirstIn(patterns,backward?start-length+currentLength:start+length-currentLength,currentLength,backward);

 if(result.right.id==-1){ length=currentLength;if(backward){ start-=length;}else{ start=result.left.position;}
result.value=new ByteStream();result.value._buffer=this._buffer.slice(start,start+length);result.value._view=new Uint8Array(result.value._buffer); break;}

 
if(result.right.position!=(backward?result.left.position-patterns[result.right.id].buffer.byteLength:result.left.position+patterns[result.right.id].buffer.byteLength)){if(backward){ start=result.right.position+patterns[result.right.id].buffer.byteLength; length=result.left.position-result.right.position-patterns[result.right.id].buffer.byteLength;}else{ start=result.left.position; length=result.right.position-result.left.position-patterns[result.right.id].buffer.byteLength;}
result.value=new ByteStream();result.value._buffer=this._buffer.slice(start,start+length);result.value._view=new Uint8Array(result.value._buffer); break;}
 
result.left=result.right;
 currentLength-=patterns[result.right.id]._buffer.byteLength;} 
if(backward){const temp=result.right;result.right=result.left;result.left=temp;} 
return result;} 
findAllNotIn(patterns,start=null,length=null){ const result=[]; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return result; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
let patternFound={left:{id:-1,position:start},right:{id:-1,position:start},value:new ByteStream()};

 do{const position=patternFound.right.position;patternFound=this.findFirstNotIn(patterns,patternFound.right.position,length); length-=patternFound.right.position-position;result.push({left:{id:patternFound.left.id,position:patternFound.left.position},right:{id:patternFound.right.id,position:patternFound.right.position},value:patternFound.value});}while(patternFound.right.id!=-1); return result;} 
findFirstSequence(patterns,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}}
 
const firstIn=this.skipNotPatterns(patterns,start,length,backward); if(firstIn==-1){return{position:-1,value:new ByteStream()};}

 
const firstNotIn=this.skipPatterns(patterns,firstIn,length-(backward?start-firstIn:firstIn-start),backward);
 if(backward){ start=firstNotIn; length=firstIn-firstNotIn;}else{ start=firstIn; length=firstNotIn-firstIn;}
const value=new ByteStream();value._buffer=this._buffer.slice(start,start+length);value._view=new Uint8Array(value._buffer); return{position:firstNotIn,value};} 
findAllSequences(patterns,start=null,length=null){ const result=[]; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return result; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
let patternFound={position:start,value:new ByteStream()};

 do{const position=patternFound.position;patternFound=this.findFirstSequence(patterns,patternFound.position,length); if(patternFound.position!=-1){ length-=patternFound.position-position;result.push({position:patternFound.position,value:patternFound.value});}}while(patternFound.position!=-1); return result;} 
findPairedPatterns(leftPattern,rightPattern,start=null,length=null){ const result=[]; if(leftPattern.isEqual(rightPattern))return result; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return result; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
let currentPositionLeft=0;
 const leftPatterns=this.findAllPatternIn(leftPattern,start,length); if(leftPatterns.length==0)return result;
 const rightPatterns=this.findAllPatternIn(rightPattern,start,length); if(rightPatterns.length==0)return result;
 while(currentPositionLeft<leftPatterns.length){ if(rightPatterns.length==0){ break;} 
if(leftPatterns[0]==rightPatterns[0]){

result.push({left:leftPatterns[0],right:rightPatterns[0]});leftPatterns.splice(0,1);rightPatterns.splice(0,1); continue;}
if(leftPatterns[currentPositionLeft]>rightPatterns[0]){ break;}
while(leftPatterns[currentPositionLeft]<rightPatterns[0]){currentPositionLeft++;if(currentPositionLeft>=leftPatterns.length){ break;}}
result.push({left:leftPatterns[currentPositionLeft-1],right:rightPatterns[0]});leftPatterns.splice(currentPositionLeft-1,1);rightPatterns.splice(0,1);currentPositionLeft=0;}
 
result.sort((a,b)=>a.left-b.left); return result;} 
findPairedArrays(inputLeftPatterns,inputRightPatterns,start=null,length=null){ const result=[]; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return result; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}
let currentPositionLeft=0;
 const leftPatterns=this.findAllIn(inputLeftPatterns,start,length); if(leftPatterns.length==0)return result;
 const rightPatterns=this.findAllIn(inputRightPatterns,start,length); if(rightPatterns.length==0)return result;
 while(currentPositionLeft<leftPatterns.length){ if(rightPatterns.length==0){ break;} 
if(leftPatterns[0].position==rightPatterns[0].position){

result.push({left:leftPatterns[0],right:rightPatterns[0]});leftPatterns.splice(0,1);rightPatterns.splice(0,1); continue;}
if(leftPatterns[currentPositionLeft].position>rightPatterns[0].position){ break;}
while(leftPatterns[currentPositionLeft].position<rightPatterns[0].position){currentPositionLeft++;if(currentPositionLeft>=leftPatterns.length){ break;}}
result.push({left:leftPatterns[currentPositionLeft-1],right:rightPatterns[0]});leftPatterns.splice(currentPositionLeft-1,1);rightPatterns.splice(0,1);currentPositionLeft=0;}
 
result.sort((a,b)=>a.left.position-b.left.position); return result;} 
replacePattern(searchPattern,replacePattern,start=null,length=null,findAllResult=null){ let result;let i;const output={status:-1,searchPatternPositions:[],replacePatternPositions:[]}; if(start==null){ start=0;} 
if(start>this.buffer.byteLength-1)return false; if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}

 
if(findAllResult==null){result=this.findAllIn([searchPattern],start,length); if(result.length==0)return output;}else result=findAllResult; output.searchPatternPositions.push(...Array.from(result,element=>element.position));
 const patternDifference=searchPattern.buffer.byteLength-replacePattern.buffer.byteLength;const changedBuffer=new ArrayBuffer(this.view.length-result.length*patternDifference);const changedView=new Uint8Array(changedBuffer);

 changedView.set(new Uint8Array(this.buffer,0,start));
 for(i=0;i<result.length;i++){
 const currentPosition=i==0?start:result[i-1].position;

 changedView.set(new Uint8Array(this.buffer,currentPosition,result[i].position-searchPattern.buffer.byteLength-currentPosition),currentPosition-i*patternDifference);
 changedView.set(replacePattern.view,result[i].position-searchPattern.buffer.byteLength-i*patternDifference);output.replacePatternPositions.push(result[i].position-searchPattern.buffer.byteLength-i*patternDifference);}
 
i--; changedView.set(new Uint8Array(this.buffer,result[i].position,this.buffer.byteLength-result[i].position),result[i].position-searchPattern.buffer.byteLength+replacePattern.buffer.byteLength-i*patternDifference);
 this.buffer=changedBuffer;this.view=new Uint8Array(this.buffer); output.status=1;return output;} 
skipPatterns(patterns,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}}
let result=start;
 for(let k=0;k<patterns.length;k++){const patternLength=patterns[k].buffer.byteLength; const equalStart=backward?result-patternLength:result;let equal=true;for(let j=0;j<patternLength;j++){ if(this.view[j+equalStart]!=patterns[k].view[j]){equal=false; break;}}
if(equal){k=-1;if(backward){result-=patternLength; if(result<=0)return result;}else{result+=patternLength; if(result>=start+length)return result;}}} 
return result;} 
skipNotPatterns(patterns,start=null,length=null,backward=false){
 if(start==null){ start=backward?this.buffer.byteLength:0;}
if(start>this.buffer.byteLength){ start=this.buffer.byteLength;}
if(backward){ if(length==null){ length=start;}
if(length>start){ length=start;}}else{ if(length==null){ length=this.buffer.byteLength-start;}
if(length>this.buffer.byteLength-start){ length=this.buffer.byteLength-start;}}
let result=-1;
 for(let i=0;i<length;i++){for(let k=0;k<patterns.length;k++){const patternLength=patterns[k].buffer.byteLength; const equalStart=backward?start-i-patternLength:start+i;let equal=true;for(let j=0;j<patternLength;j++){ if(this.view[j+equalStart]!=patterns[k].view[j]){equal=false; break;}}
if(equal){ result=backward?start-i:start+i;
 break;}} 
if(result!=-1){ break;}} 
return result;}
}
exports.ByteStream=ByteStream;class SeqStream{constructor(parameters={}){this.stream=new ByteStream();this._length=0;this.backward=false;this._start=0;this.appendBlock=0;this.prevLength=0;this.prevStart=0;var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=Object.keys(parameters)[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const key=_step2.value;switch(key){case"stream":this.stream=parameters.stream;break;case"backward":this.backward=parameters.backward; this._start=this.stream.buffer.byteLength;break;case"length": this._length=parameters.length;break;case"start": this._start=parameters.start;break;case"appendBlock":this.appendBlock=parameters.appendBlock;break;case"view":this.stream=new ByteStream({view:parameters.view});break;case"buffer":this.stream=new ByteStream({buffer:parameters.buffer});break;case"string":this.stream=new ByteStream({string:parameters.string});break;case"hexstring":this.stream=new ByteStream({hexstring:parameters.hexstring});break;default:}}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}}
set stream(value){this._stream=value;this.prevLength=this._length; this._length=value._buffer.byteLength;this.prevStart=this._start; this._start=0;}
get stream(){return this._stream;}
set length(value){this.prevLength=this._length; this._length=value;} 
get length(){ if(this.appendBlock)return this.start;return this._length;} 
set start(value){ if(value>this.stream.buffer.byteLength)return; this.prevStart=this._start;this.prevLength=this._length;
 this._length-=this.backward?this._start-value:value-this._start; this._start=value;}
get start(){return this._start;}
get buffer(){return this._stream._buffer.slice(0,this._length);} 
resetPosition(){ this._start=this.prevStart; this._length=this.prevLength;} 
findPattern(pattern,gap=null){
 if(gap==null||gap>this.length){ gap=this.length;}
 
const result=this.stream.findPattern(pattern,this.start,this.length,this.backward); if(result==-1)return result;if(this.backward){ if(result<this.start-pattern.buffer.byteLength-gap)return-1;}else{ if(result>this.start+pattern.buffer.byteLength+gap)return-1;}
 
this.start=result;return result;} 
findFirstIn(patterns,gap=null){
 if(gap==null||gap>this.length){ gap=this.length;}
 
const result=this.stream.findFirstIn(patterns,this.start,this.length,this.backward); if(result.id==-1)return result;if(this.backward){if(result.position<this.start-patterns[result.id].buffer.byteLength-gap){ return{id:-1,position:this.backward?0:this.start+this.length};}}else{if(result.position>this.start+patterns[result.id].buffer.byteLength+gap){ return{id:-1,position:this.backward?0:this.start+this.length};}}
 
this.start=result.position;return result;} 
findAllIn(patterns){ const start=this.backward?this.start-this.length:this.start;return this.stream.findAllIn(patterns,start,this.length);} 
findFirstNotIn(patterns,gap=null){
 if(gap==null||gap>this._length){ gap=this._length;}
 
const result=this._stream.findFirstNotIn(patterns,this._start,this._length,this.backward); if(result.left.id==-1&&result.right.id==-1)return result;if(this.backward){ if(result.right.id!=-1){if(result.right.position<this._start-patterns[result.right.id]._buffer.byteLength-gap){return{left:{id:-1,position:this._start},right:{id:-1,position:0},value:new ByteStream()};}}}else{ if(result.left.id!=-1){if(result.left.position>this._start+patterns[result.left.id]._buffer.byteLength+gap){return{left:{id:-1,position:this._start},right:{id:-1,position:0},value:new ByteStream()};}}}
 
if(this.backward){ if(result.left.id==-1)this.start=0;else this.start=result.left.position;}else{ if(result.right.id==-1)this.start=this._start+this._length;else this.start=result.right.position;}
return result;} 
findAllNotIn(patterns){ const start=this.backward?this._start-this._length:this._start;return this._stream.findAllNotIn(patterns,start,this._length);} 
findFirstSequence(patterns,length=null,gap=null){
 if(length==null||length>this._length){ length=this._length;} 
if(gap==null||gap>length){ gap=length;}
 
const result=this._stream.findFirstSequence(patterns,this._start,length,this.backward); if(result.value.buffer.byteLength==0)return result;if(this.backward){if(result.position<this._start-result.value._buffer.byteLength-gap){return{position:-1,value:new ByteStream()};}}else{if(result.position>this._start+result.value._buffer.byteLength+gap){return{position:-1,value:new ByteStream()};}}
 
this.start=result.position;return result;} 
findAllSequences(patterns){ const start=this.backward?this.start-this.length:this.start;return this.stream.findAllSequences(patterns,start,this.length);} 
findPairedPatterns(leftPattern,rightPattern,gap=null){
 if(gap==null||gap>this.length){ gap=this.length;}
 
const start=this.backward?this.start-this.length:this.start; const result=this.stream.findPairedPatterns(leftPattern,rightPattern,start,this.length);if(result.length){if(this.backward){ if(result[0].right<this.start-rightPattern.buffer.byteLength-gap)return[];}else{ if(result[0].left>this.start+leftPattern.buffer.byteLength+gap)return[];}} 
return result;} 
findPairedArrays(leftPatterns,rightPatterns,gap=null){
 if(gap==null||gap>this.length){ gap=this.length;}
 
const start=this.backward?this.start-this.length:this.start; const result=this.stream.findPairedArrays(leftPatterns,rightPatterns,start,this.length);if(result.length){if(this.backward){ if(result[0].right.position<this.start-rightPatterns[result[0].right.id].buffer.byteLength-gap)return[];}else{ if(result[0].left.position>this.start+leftPatterns[result[0].left.id].buffer.byteLength+gap)return[];}} 
return result;} 
replacePattern(searchPattern,replacePattern){ const start=this.backward?this.start-this.length:this.start;return this.stream.replacePattern(searchPattern,replacePattern,start,this.length);} 
skipPatterns(patterns){const result=this.stream.skipPatterns(patterns,this.start,this.length,this.backward); this.start=result;return result;} 
skipNotPatterns(patterns){const result=this.stream.skipNotPatterns(patterns,this.start,this.length,this.backward); if(result==-1)return-1; this.start=result;return result;} 
append(stream){if(this._start+stream._buffer.byteLength>this._stream._buffer.byteLength){if(stream._buffer.byteLength>this.appendBlock){ this.appendBlock=stream._buffer.byteLength+1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
this._stream._view.set(stream._view,this._start);this._length+=stream._buffer.byteLength*2;this.start=this._start+stream._buffer.byteLength;this.prevLength-=stream._buffer.byteLength*2;} 
appendView(view){if(this._start+view.length>this._stream._buffer.byteLength){if(view.length>this.appendBlock){ this.appendBlock=view.length+1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
this._stream._view.set(view,this._start);this._length+=view.length*2;this.start=this._start+view.length;this.prevLength-=view.length*2;} 
appendChar(char){if(this._start+1>this._stream._buffer.byteLength){ if(1>this.appendBlock){ this.appendBlock=1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
this._stream._view[this._start]=char;this._length+=2;this.start=this._start+1;this.prevLength-=2;} 
appendUint16(number){if(this._start+2>this._stream._buffer.byteLength){ if(2>this.appendBlock){ this.appendBlock=1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
const value=new Uint16Array([number]);const view=new Uint8Array(value.buffer);this._stream._view[this._start]=view[1];this._stream._view[this._start+1]=view[0];this._length+=4;this.start=this._start+2;this.prevLength-=4;} 
appendUint24(number){if(this._start+3>this._stream._buffer.byteLength){ if(3>this.appendBlock){ this.appendBlock=1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
const value=new Uint32Array([number]);const view=new Uint8Array(value.buffer);this._stream._view[this._start]=view[2];this._stream._view[this._start+1]=view[1];this._stream._view[this._start+2]=view[0];this._length+=6;this.start=this._start+3;this.prevLength-=6;} 
appendUint32(number){if(this._start+4>this._stream._buffer.byteLength){ if(4>this.appendBlock){ this.appendBlock=1000;}
this._stream.realloc(this._stream._buffer.byteLength+this.appendBlock);}
const value=new Uint32Array([number]);const view=new Uint8Array(value.buffer);this._stream._view[this._start]=view[3];this._stream._view[this._start+1]=view[2];this._stream._view[this._start+2]=view[1];this._stream._view[this._start+3]=view[0];this._length+=8;this.start=this._start+4;this.prevLength-=8;} 
getBlock(size,changeLength=true){
 if(this._length<=0)return[];if(this._length<size){ size=this._length;}
 
let result;
 if(this.backward){const buffer=this._stream._buffer.slice(this._length-size,this._length);const view=new Uint8Array(buffer);result=new Array(size); for(let i=0;i<size;i++)result[size-1-i]=view[i];}else{const buffer=this._stream._buffer.slice(this._start,this._start+size); result=Array.from(new Uint8Array(buffer));}
 
if(changeLength){ this.start+=this.backward?-1*size:size;} 
return result;} 
getUint16(changeLength=true){const block=this.getBlock(2,changeLength);
 if(block.length<2)return 0;
 const value=new Uint16Array(1);const view=new Uint8Array(value.buffer);view[0]=block[1];view[1]=block[0]; return value[0];} 
getInt16(changeLength=true){const block=this.getBlock(2,changeLength);
 if(block.length<2)return 0;
 const value=new Int16Array(1);const view=new Uint8Array(value.buffer);view[0]=block[1];view[1]=block[0]; return value[0];} 
getUint24(changeLength=true){const block=this.getBlock(3,changeLength);
 if(block.length<3)return 0;
 const value=new Uint32Array(1);const view=new Uint8Array(value.buffer); for(let i=3;i>=1;i--)view[3-i]=block[i-1]; return value[0];} 
getUint32(changeLength=true){const block=this.getBlock(4,changeLength);
 if(block.length<4)return 0;
 const value=new Uint32Array(1);const view=new Uint8Array(value.buffer); for(let i=3;i>=0;i--)view[3-i]=block[i]; return value[0];}
getInt32(changeLength=true){const block=this.getBlock(4,changeLength);
 if(block.length<4)return 0;
 const value=new Int32Array(1);const view=new Uint8Array(value.buffer); for(let i=3;i>=0;i--)view[3-i]=block[i]; return value[0];}
}
exports.SeqStream=SeqStream; function parseByteMap(stream,map,elements,start=null,length=null){
 if(start===null){ start=0;} 
if(start>stream.buffer.byteLength-1)return false; if(length===null){ length=stream.buffer.byteLength-start;}
if(length>stream.buffer.byteLength-start){ length=stream.buffer.byteLength-start;}
let dataView; if(start==0&&length==stream.buffer.byteLength)dataView=stream.view;else dataView=new Uint8Array(stream.buffer,start,length);const resultArray=new Array(elements);let elementsCount=0;let count=0;const mapLength=map.length;
 while(count<length){let structureLength=0;resultArray[elementsCount]={};for(let i=0;i<mapLength;i++){ if(map[i].maxlength==0){ if("defaultValue"in map[i])resultArray[elementsCount][map[i].name]=map[i].defaultValue; continue;} 
const array=new Array(map[i].maxlength); for(let j=0;j<map[i].maxlength;j++){ array[j]=dataView[count++];} 
const result=map[i].func(array); if(result.status==-1){ if(resultArray.length==1)return[];return resultArray.slice(0,resultArray.length-1);} 
if(map[i].type!="check")resultArray[elementsCount][map[i].name]=result.value; count-=map[i].maxlength-result.length;structureLength+=result.length;} 
resultArray[elementsCount++].structureLength=structureLength;} 
return resultArray;}
const bitsToStringArray=["00000000","00000001","00000010","00000011","00000100","00000101","00000110","00000111","00001000","00001001","00001010","00001011","00001100","00001101","00001110","00001111","00010000","00010001","00010010","00010011","00010100","00010101","00010110","00010111","00011000","00011001","00011010","00011011","00011100","00011101","00011110","00011111","00100000","00100001","00100010","00100011","00100100","00100101","00100110","00100111","00101000","00101001","00101010","00101011","00101100","00101101","00101110","00101111","00110000","00110001","00110010","00110011","00110100","00110101","00110110","00110111","00111000","00111001","00111010","00111011","00111100","00111101","00111110","00111111","01000000","01000001","01000010","01000011","01000100","01000101","01000110","01000111","01001000","01001001","01001010","01001011","01001100","01001101","01001110","01001111","01010000","01010001","01010010","01010011","01010100","01010101","01010110","01010111","01011000","01011001","01011010","01011011","01011100","01011101","01011110","01011111","01100000","01100001","01100010","01100011","01100100","01100101","01100110","01100111","01101000","01101001","01101010","01101011","01101100","01101101","01101110","01101111","01110000","01110001","01110010","01110011","01110100","01110101","01110110","01110111","01111000","01111001","01111010","01111011","01111100","01111101","01111110","01111111","10000000","10000001","10000010","10000011","10000100","10000101","10000110","10000111","10001000","10001001","10001010","10001011","10001100","10001101","10001110","10001111","10010000","10010001","10010010","10010011","10010100","10010101","10010110","10010111","10011000","10011001","10011010","10011011","10011100","10011101","10011110","10011111","10100000","10100001","10100010","10100011","10100100","10100101","10100110","10100111","10101000","10101001","10101010","10101011","10101100","10101101","10101110","10101111","10110000","10110001","10110010","10110011","10110100","10110101","10110110","10110111","10111000","10111001","10111010","10111011","10111100","10111101","10111110","10111111","11000000","11000001","11000010","11000011","11000100","11000101","11000110","11000111","11001000","11001001","11001010","11001011","11001100","11001101","11001110","11001111","11010000","11010001","11010010","11010011","11010100","11010101","11010110","11010111","11011000","11011001","11011010","11011011","11011100","11011101","11011110","11011111","11100000","11100001","11100010","11100011","11100100","11100101","11100110","11100111","11101000","11101001","11101010","11101011","11101100","11101101","11101110","11101111","11110000","11110001","11110010","11110011","11110100","11110101","11110110","11110111","11111000","11111001","11111010","11111011","11111100","11111101","11111110","11111111"];
class BitStream{constructor(parameters={}){this.buffer=new ArrayBuffer(0);this.view=new Uint8Array(this.buffer);this.bitsCount=0;var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=Object.keys(parameters)[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const key=_step3.value;switch(key){case"byteStream":this.fromByteStream(parameters.byteStream);break;case"view":this.fromUint8Array(parameters.view);break;case"buffer":this.fromArrayBuffer(parameters.buffer);break;case"string":this.fromString(parameters.string);break;case"uint32":this.fromUint32(parameters.uint32);break;case"bitsCount":this.bitsCount=parameters.bitsCount;break;default:}}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}}
clear(){this.buffer=new ArrayBuffer(0);this.view=new Uint8Array(this.buffer);this.bitsCount=0;}
fromByteStream(stream){this.buffer=stream.buffer.slice(0);this.view=new Uint8Array(this.buffer);this.bitsCount=this.view.length<<3;}
fromArrayBuffer(array){this.buffer=array.slice(0);this.view=new Uint8Array(this.buffer);this.bitsCount=this.view.length<<3;} 
fromUint8Array(array){this.buffer=new ArrayBuffer(array.length);this.view=new Uint8Array(this.buffer);this.view.set(array);this.bitsCount=this.view.length<<3;}
fromString(string){ const stringLength=string.length; this.buffer=new ArrayBuffer((stringLength>>3)+(stringLength%8?1:0));this.view=new Uint8Array(this.buffer);this.bitsCount=(stringLength>>3)+1<<3; let byteIndex=0;
 for(let i=0;i<stringLength;i++){ if(string[i]=="1")this.view[byteIndex]|=1<<7-i%8; if(i&&(i+1)%8==0)byteIndex++;}

 
if(stringLength%8)this.shiftRight(8-stringLength%8);
this.bitsCount=stringLength;}
fromUint32(uint32){this.buffer=new ArrayBuffer(4);this.view=new Uint8Array(this.buffer);const value=new Uint32Array([uint32]);const view=new Uint8Array(value.buffer);for(let i=3;i>=0;i--)this.view[i]=view[3-i];this.bitsCount=32;}
toString(start=null,length=null){
 if(start==null){ start=0;} 
if(start>=this.view.length||start<0){ start=0;} 
if(length==null){ length=this.view.length-start;} 
if(length>=this.view.length||length<0){ length=this.view.length-start;}
 
const result=[];
 for(let i=start;i<start+length;i++)result.push(bitsToStringArray[this.view[i]]);
 return result.join("").slice((this.view.length<<3)-this.bitsCount);} 
shiftRight(shift,needShrink=true){
 if(this.view.length==0)return; if(shift<0||shift>8)throw new Error("The \"shift\" parameter must be in range 0-8"); if(shift>this.bitsCount)throw new Error("The \"shift\" parameter can not be bigger than \"this.bitsCount\"");

 const shiftMask=0xFF>>8-shift;this.view[this.view.length-1]>>=shift;

 for(let i=this.view.length-2;i>=0;i--){ this.view[i+1]|=(this.view[i]&shiftMask)<<8-shift;this.view[i]>>=shift;}
 
this.bitsCount-=shift; if(this.bitsCount==0)this.clear();

 if(needShrink)this.shrink();} 
shiftLeft(shift){
 if(this.view.length==0)return; if(shift<0||shift>8)throw new Error("The \"shift\" parameter must be in range 0-8"); if(shift>this.bitsCount)throw new Error("The \"shift\" parameter can not be bigger than \"this.bitsCount\"");

 const bitsOffset=this.bitsCount&0x07;if(bitsOffset>shift){ this.view[0]&=0xFF>>bitsOffset+shift;}else{ const buffer=new ArrayBuffer(this.buffer.byteLength-1);const view=new Uint8Array(buffer); view.set(new Uint8Array(this.buffer,1,this.buffer.byteLength-1));

 view[0]&=0xFF>>shift-bitsOffset;
 this.buffer=buffer.slice(0);this.view=new Uint8Array(this.buffer);}
 
this.bitsCount-=shift; if(this.bitsCount==0)this.clear();} 
slice(start=null,end=null){ let valueShift=0; if(this.bitsCount%8)valueShift=8-this.bitsCount%8; start+=valueShift; end+=valueShift;

 if(start==null){ start=0;} 
if(start<0||start>(this.view.length<<3)-1)return new BitStream(); if(end==null){ end=(this.view.length<<3)-1;} 
if(end<0||end>(this.view.length<<3)-1)return new BitStream(); if(end-start+1>this.bitsCount)return new BitStream();const startIndex=start>>3; const startOffset=start&0x07;const endIndex=end>>3; const endOffset=end&0x07; const bitsLength=endIndex-startIndex==0?1:endIndex-startIndex+1;const result=new BitStream();
result.buffer=new ArrayBuffer(bitsLength);result.view=new Uint8Array(result.buffer);result.bitsCount=bitsLength<<3; result.view.set(new Uint8Array(this.buffer,startIndex,bitsLength));
 result.view[0]&=0xFF>>startOffset;
 result.view[bitsLength]&=0xFF<<7-endOffset;

 if(7-endOffset)result.shiftRight(7-endOffset,false);
 result.bitsCount=end-start+1;
 result.shrink(); return result;} 
copy(start=null,length=null){
 if(start<0||start>(this.view.length<<3)-1)return new BitStream(); if(length===null){ length=(this.view.length<<3)-start-1;} 
if(length>this.bitsCount)return new BitStream(); return this.slice(start,start+length-1);}
shrink(){ const currentLength=(this.bitsCount>>3)+(this.bitsCount%8?1:0);if(currentLength<this.buffer.byteLength){ const buffer=new ArrayBuffer(currentLength);const view=new Uint8Array(buffer); view.set(new Uint8Array(this.buffer,this.buffer.byteLength-currentLength,currentLength));
 this.buffer=buffer.slice(0);this.view=new Uint8Array(this.buffer);}} 
reverseBytes(){ for(let i=0;i<this.view.length;i++){ this.view[i]=(this.view[i]*0x0802&0x22110|this.view[i]*0x8020&0x88440)*0x10101>>16;}
 
if(this.bitsCount%8){ const currentLength=(this.bitsCount>>3)+(this.bitsCount%8?1:0); this.view[this.view.length-currentLength]>>=8-(this.bitsCount&0x07);}
} 
reverseValue(){const initialValue=this.toString();const initialValueLength=initialValue.length;const reversedValue=new Array(initialValueLength); for(let i=0;i<initialValueLength;i++)reversedValue[initialValueLength-1-i]=initialValue[i]; this.fromString(reversedValue.join(""));} 
getNumberValue(){ const byteLength=this.buffer.byteLength-1;

 if(byteLength>3)return-1; if(byteLength==-1)return 0;
 const value=new Uint32Array(1);const view=new Uint8Array(value.buffer); for(let i=byteLength;i>=0;i--)view[byteLength-i]=this.view[i]; return value[0];} 
findPattern(pattern,start=null,length=null,backward=false){const stringStream=new ByteStream({string:this.toString()});const stringPattern=new ByteStream({string:pattern.toString()}); return stringStream.findPattern(stringPattern,start,length,backward);} 
findFirstIn(patterns,start=null,length=null,backward=false){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findFirstIn(stringPatterns,start,length,backward);} 
findAllIn(patterns,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findAllIn(stringPatterns,start,length);} 
findAllPatternIn(pattern,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringPattern=new ByteStream({string:pattern.toString()}); return stringStream.findAllPatternIn(stringPattern,start,length);} 
findFirstNotIn(patterns,start=null,length=null,backward=false){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findFirstNotIn(stringPatterns,start,length,backward);} 
findAllNotIn(patterns,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findAllNotIn(stringPatterns,start,length);} 
findFirstSequence(patterns,start=null,length=null,backward=false){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findFirstSequence(stringPatterns,start,length,backward);} 
findAllSequences(patterns,start,length){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.findAllSequences(stringPatterns,start,length);} 
findPairedPatterns(leftPattern,rightPattern,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringLeftPattern=new ByteStream({string:leftPattern.toString()});const stringRightPattern=new ByteStream({string:rightPattern.toString()}); return stringStream.findPairedPatterns(stringLeftPattern,stringRightPattern,start,length);} 
findPairedArrays(inputLeftPatterns,inputRightPatterns,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringLeftPatterns=new Array(inputLeftPatterns.length);for(let i=0;i<inputLeftPatterns.length;i++){stringLeftPatterns[i]=new ByteStream({string:inputLeftPatterns[i].toString()});}
const stringRightPatterns=new Array(inputRightPatterns.length);for(let i=0;i<inputRightPatterns.length;i++){stringRightPatterns[i]=new ByteStream({string:inputRightPatterns[i].toString()});} 
return stringStream.findPairedArrays(stringLeftPatterns,stringRightPatterns,start,length);} 
replacePattern(searchPattern,replacePattern,start=null,length=null){const stringStream=new ByteStream({string:this.toString()});const stringSearchPattern=new ByteStream({string:searchPattern.toString()});const stringReplacePattern=new ByteStream({string:replacePattern.toString()});
 if(stringStream.findPairedPatterns(stringSearchPattern,stringReplacePattern,start,length)){ this.fromString(stringStream.toString());return true;} 
return false;} 
skipPatterns(patterns,start,length,backward){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.skipPatterns(stringPatterns,start,length,backward);} 
skipNotPatterns(patterns,start,length,backward){const stringStream=new ByteStream({string:this.toString()});const stringPatterns=new Array(patterns.length);for(let i=0;i<patterns.length;i++){stringPatterns[i]=new ByteStream({string:patterns[i].toString()});} 
return stringStream.skipNotPatterns(stringPatterns,start,length,backward);} 
append(stream){
 this.fromString([this.toString(),stream.toString()].join(""));}
}
exports.BitStream=BitStream;class SeqBitStream{constructor(parameters={}){ this.stream=new BitStream();this._start=0;this._length=this.stream.bitsCount;this.backward=false;this.appendBlock=0; var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=Object.keys(parameters)[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){const key=_step4.value;switch(key){case"stream":case"start":case"length":case"backward":case"appendBlock":this[key]=parameters[key];break;default:}}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}} 
set start(value){ if(value>this.stream.bitsCount)return; this._length-=this.backward?this._start-value:value-this._start;this._start=value;
 this.prevStart=this._start; this.prevLength=this._length;}
get start(){return this._start;} 
set length(value){ if(value>this.stream.bitsCount)return; this.prevLength=this._length;this._length=value;}
get length(){return this._length;}
set stream(value){this._stream=value; this.prevLength=this._length;this._length=value.bitsCount; this.prevStart=this._start; this._start=this.backward?this.length:0;}
get stream(){return this._stream;} 
getBits(length){ if(this.start+length>this.stream.bitsCount){ length=this.stream.bitsCount-this.start;}
 
let result;
 if(this.backward){result=this.stream.copy(this.start-length,length);this.start-=result.bitsCount;}else{result=this.stream.copy(this.start,length);this.start+=result.bitsCount;} 
return result;} 
getBitsString(length){ if(this.start+length>this.stream.bitsCount){ length=this.stream.bitsCount-this.start;}
 
let result=[];let start; if(this.backward)start=this.start-length;else start=this.start;let end=this.start+length-1; let valueShift=0; if(this.stream.bitsCount%8)valueShift=8-this.stream.bitsCount%8;start+=valueShift;end+=valueShift; const startIndex=start>>3; const startOffset=start&0x07;const endIndex=end>>3; const endOffset=end&0x07; const bitsLengthIndex=startIndex+(endIndex-startIndex==0?1:endIndex-startIndex+1);
 for(let i=startIndex;i<bitsLengthIndex;i++){let value=bitsToStringArray[this.stream.view[i]]; if(i==startIndex)value=value.slice(startOffset); if(i==bitsLengthIndex-1)value=value.slice(0,endOffset-7+value.length);result.push(value);}
result=result.join("");

 if(this.backward)this.start-=result.length;else this.start+=result.length; return result;} 
getBitsReversedValue(length){ const initialValue=this.getBitsString(length);const initialValueLength=initialValue.length;let byteIndex;const initialOffset=8-initialValueLength%8;const reversedValue=new Array(initialValueLength);const value=new Uint32Array(1);const valueView=new Uint8Array(value.buffer,0,4);let i; if(initialValueLength>32)return-1; if(length==32)byteIndex=3;else byteIndex=initialValueLength-1>>3;

 for(i=0;i<initialValueLength;i++)reversedValue[initialValueLength-1-i]=initialValue[i];
 for(i=initialOffset;i<initialOffset+initialValueLength;i++){ if(reversedValue[i-initialOffset]=="1"){ valueView[byteIndex]|=0x01<<7-i%8;} 
if(i&&(i+1)%8==0)byteIndex--;} 
return value[0];}
toString(){const streamToDisplay=this.stream.copy(this.start,this.length);return streamToDisplay.toString();}
}
exports.SeqBitStream=SeqBitStream;},{}],2:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AccessDescription{constructor(parameters={}){ this.accessMethod=(0,_pvutils.getParametersValue)(parameters,"accessMethod",AccessDescription.defaultValues("accessMethod"));this.accessLocation=(0,_pvutils.getParametersValue)(parameters,"accessLocation",AccessDescription.defaultValues("accessLocation"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"accessMethod":return"";case"accessLocation":return new _GeneralName.default();default:throw new Error(`Invalid member name for AccessDescription class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.accessMethod||""}),_GeneralName.default.schema(names.accessLocation||{})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["accessMethod","accessLocation"]);
 const asn1=asn1js.compareSchema(schema,schema,AccessDescription.schema({names:{accessMethod:"accessMethod",accessLocation:{names:{blockName:"accessLocation"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AccessDescription");
 this.accessMethod=asn1.result.accessMethod.valueBlock.toString();this.accessLocation=new _GeneralName.default({schema:asn1.result.accessLocation});}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.accessMethod}),this.accessLocation.toSchema()]});}
toJSON(){return{accessMethod:this.accessMethod,accessLocation:this.accessLocation.toJSON()};}
}
exports.default=AccessDescription;},{"./GeneralName.js":40,"asn1js":112,"pvutils":113}],3:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Accuracy{constructor(parameters={}){ if("seconds"in parameters)
this.seconds=(0,_pvutils.getParametersValue)(parameters,"seconds",Accuracy.defaultValues("seconds"));if("millis"in parameters)
this.millis=(0,_pvutils.getParametersValue)(parameters,"millis",Accuracy.defaultValues("millis"));if("micros"in parameters)
this.micros=(0,_pvutils.getParametersValue)(parameters,"micros",Accuracy.defaultValues("micros"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"seconds":case"millis":case"micros":return 0;default:throw new Error(`Invalid member name for Accuracy class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"seconds":case"millis":case"micros":return memberValue===Accuracy.defaultValues(memberName);default:throw new Error(`Invalid member name for Accuracy class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",optional:true,value:[new asn1js.Integer({optional:true,name:names.seconds||""}),new asn1js.Primitive({name:names.millis||"",optional:true,idBlock:{tagClass:3, tagNumber:0
}}),new asn1js.Primitive({name:names.micros||"",optional:true,idBlock:{tagClass:3, tagNumber:1
}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["seconds","millis","micros"]);
 const asn1=asn1js.compareSchema(schema,schema,Accuracy.schema({names:{seconds:"seconds",millis:"millis",micros:"micros"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Accuracy");
 if("seconds"in asn1.result)this.seconds=asn1.result.seconds.valueBlock.valueDec;if("millis"in asn1.result){const intMillis=new asn1js.Integer({valueHex:asn1.result.millis.valueBlock.valueHex});this.millis=intMillis.valueBlock.valueDec;}
if("micros"in asn1.result){const intMicros=new asn1js.Integer({valueHex:asn1.result.micros.valueBlock.valueHex});this.micros=intMicros.valueBlock.valueDec;}
}
toSchema(){ const outputArray=[];if("seconds"in this)outputArray.push(new asn1js.Integer({value:this.seconds}));if("millis"in this){const intMillis=new asn1js.Integer({value:this.millis});outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:0
},valueHex:intMillis.valueBlock.valueHex}));}
if("micros"in this){const intMicros=new asn1js.Integer({value:this.micros});outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:1
},valueHex:intMicros.valueBlock.valueHex}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={};if("seconds"in this)_object.seconds=this.seconds;if("millis"in this)_object.millis=this.millis;if("micros"in this)_object.micros=this.micros;return _object;}
}
exports.default=Accuracy;},{"asn1js":112,"pvutils":113}],4:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AlgorithmIdentifier{constructor(parameters={}){ this.algorithmId=(0,_pvutils.getParametersValue)(parameters,"algorithmId",AlgorithmIdentifier.defaultValues("algorithmId"));if("algorithmParams"in parameters)
this.algorithmParams=(0,_pvutils.getParametersValue)(parameters,"algorithmParams",AlgorithmIdentifier.defaultValues("algorithmParams"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"algorithmId":return"";case"algorithmParams":return new asn1js.Any();default:throw new Error(`Invalid member name for AlgorithmIdentifier class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"algorithmId":return memberValue==="";case"algorithmParams":return memberValue instanceof asn1js.Any;default:throw new Error(`Invalid member name for AlgorithmIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",optional:names.optional||false,value:[new asn1js.ObjectIdentifier({name:names.algorithmIdentifier||""}),new asn1js.Any({name:names.algorithmParams||"",optional:true})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["algorithm","params"]);
 const asn1=asn1js.compareSchema(schema,schema,AlgorithmIdentifier.schema({names:{algorithmIdentifier:"algorithm",algorithmParams:"params"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AlgorithmIdentifier");
 this.algorithmId=asn1.result.algorithm.valueBlock.toString();if("params"in asn1.result)this.algorithmParams=asn1.result.params;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.algorithmId}));if("algorithmParams"in this&&this.algorithmParams instanceof asn1js.Any===false)outputArray.push(this.algorithmParams);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={algorithmId:this.algorithmId};if("algorithmParams"in this&&this.algorithmParams instanceof asn1js.Any===false)object.algorithmParams=this.algorithmParams.toJSON();return object;}
isEqual(algorithmIdentifier){ if(algorithmIdentifier instanceof AlgorithmIdentifier===false)return false;
if(this.algorithmId!==algorithmIdentifier.algorithmId)return false;
if("algorithmParams"in this){if("algorithmParams"in algorithmIdentifier)return JSON.stringify(this.algorithmParams)===JSON.stringify(algorithmIdentifier.algorithmParams);return false;}
if("algorithmParams"in algorithmIdentifier)return false; return true;}
}
exports.default=AlgorithmIdentifier;},{"asn1js":112,"pvutils":113}],5:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AltName{constructor(parameters={}){ this.altNames=(0,_pvutils.getParametersValue)(parameters,"altNames",AltName.defaultValues("altNames"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"altNames":return[];default:throw new Error(`Invalid member name for AltName class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.altNames||"",value:_GeneralName.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["altNames"]);
 const asn1=asn1js.compareSchema(schema,schema,AltName.schema({names:{altNames:"altNames"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AltName");
 if("altNames"in asn1.result)this.altNames=Array.from(asn1.result.altNames,element=>new _GeneralName.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.altNames,element=>element.toSchema())});}
toJSON(){return{altNames:Array.from(this.altNames,element=>element.toJSON())};}
}
exports.default=AltName;},{"./GeneralName.js":40,"asn1js":112,"pvutils":113}],6:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Attribute{constructor(parameters={}){ this.type=(0,_pvutils.getParametersValue)(parameters,"type",Attribute.defaultValues("type"));this.values=(0,_pvutils.getParametersValue)(parameters,"values",Attribute.defaultValues("values"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"type":return"";case"values":return[];default:throw new Error(`Invalid member name for Attribute class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"type":return memberValue==="";case"values":return memberValue.length===0;default:throw new Error(`Invalid member name for Attribute class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.type||""}),new asn1js.Set({name:names.setName||"",value:[new asn1js.Repeated({name:names.values||"",value:new asn1js.Any()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["type","values"]);
 const asn1=asn1js.compareSchema(schema,schema,Attribute.schema({names:{type:"type",values:"values"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Attribute");
 this.type=asn1.result.type.valueBlock.toString();this.values=asn1.result.values;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.type}),new asn1js.Set({value:this.values})]});}
toJSON(){return{type:this.type,values:Array.from(this.values,element=>element.toJSON())};}
}
exports.default=Attribute;},{"asn1js":112,"pvutils":113}],7:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.AttributeCertificateInfoV1=exports.IssuerSerial=exports.AttCertValidityPeriod=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralNames=_interopRequireDefault(require("./GeneralNames.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AttCertValidityPeriod{constructor(parameters={}){ this.notBeforeTime=(0,_pvutils.getParametersValue)(parameters,"notBeforeTime",AttCertValidityPeriod.defaultValues("notBeforeTime"));this.notAfterTime=(0,_pvutils.getParametersValue)(parameters,"notAfterTime",AttCertValidityPeriod.defaultValues("notAfterTime"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"notBeforeTime":case"notAfterTime":return new Date(0,0,0);default:throw new Error(`Invalid member name for AttCertValidityPeriod class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.GeneralizedTime({name:names.notBeforeTime||""}),new asn1js.GeneralizedTime({name:names.notAfterTime||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["notBeforeTime","notAfterTime"]);
 const asn1=asn1js.compareSchema(schema,schema,AttCertValidityPeriod.schema({names:{notBeforeTime:"notBeforeTime",notAfterTime:"notAfterTime"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttCertValidityPeriod");
 this.notBeforeTime=asn1.result.notBeforeTime.toDate();this.notAfterTime=asn1.result.notAfterTime.toDate();}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.GeneralizedTime({valueDate:this.notBeforeTime}),new asn1js.GeneralizedTime({valueDate:this.notAfterTime})]});}
toJSON(){return{notBeforeTime:this.notBeforeTime,notAfterTime:this.notAfterTime};}
}
exports.AttCertValidityPeriod=AttCertValidityPeriod;class IssuerSerial{constructor(parameters={}){ this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",IssuerSerial.defaultValues("issuer"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",IssuerSerial.defaultValues("serialNumber"));if("issuerUID"in parameters)
this.issuerUID=(0,_pvutils.getParametersValue)(parameters,"issuerUID",IssuerSerial.defaultValues("issuerUID"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"issuer":return new _GeneralNames.default();case"serialNumber":return new asn1js.Integer();case"issuerUID":return new asn1js.BitString();default:throw new Error(`Invalid member name for IssuerSerial class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_GeneralNames.default.schema(names.issuer||{}),new asn1js.Integer({name:names.serialNumber||""}),new asn1js.BitString({optional:true,name:names.issuerUID||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["issuer","serialNumber","issuerUID"]);
 const asn1=asn1js.compareSchema(schema,schema,IssuerSerial.schema({names:{issuer:{names:{blockName:"issuer"}},serialNumber:"serialNumber",issuerUID:"issuerUID"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for IssuerSerial");
 this.issuer=new _GeneralNames.default({schema:asn1.result.issuer});this.serialNumber=asn1.result.serialNumber;if("issuerUID"in asn1.result)this.issuerUID=asn1.result.issuerUID;}
toSchema(){const result=new asn1js.Sequence({value:[this.issuer.toSchema(),this.serialNumber]});if("issuerUID"in this)result.valueBlock.value.push(this.issuerUID); return result;}
toJSON(){const result={issuer:this.issuer.toJSON(),serialNumber:this.serialNumber.toJSON()};if("issuerUID"in this)result.issuerUID=this.issuerUID.toJSON();return result;}
}
exports.IssuerSerial=IssuerSerial;class AttributeCertificateInfoV1{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",AttributeCertificateInfoV1.defaultValues("version"));if("baseCertificateID"in parameters)
this.baseCertificateID=(0,_pvutils.getParametersValue)(parameters,"baseCertificateID",AttributeCertificateInfoV1.defaultValues("baseCertificateID"));if("subjectName"in parameters)
this.subjectName=(0,_pvutils.getParametersValue)(parameters,"subjectName",AttributeCertificateInfoV1.defaultValues("subjectName"));this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",AttributeCertificateInfoV1.defaultValues("issuer"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",AttributeCertificateInfoV1.defaultValues("signature"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",AttributeCertificateInfoV1.defaultValues("serialNumber"));this.attrCertValidityPeriod=(0,_pvutils.getParametersValue)(parameters,"attrCertValidityPeriod",AttributeCertificateInfoV1.defaultValues("attrCertValidityPeriod"));this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",AttributeCertificateInfoV1.defaultValues("attributes"));if("issuerUniqueID"in parameters)
this.issuerUniqueID=(0,_pvutils.getParametersValue)(parameters,"issuerUniqueID",AttributeCertificateInfoV1.defaultValues("issuerUniqueID"));if("extensions"in parameters)
this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",AttributeCertificateInfoV1.defaultValues("extensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"baseCertificateID":return new IssuerSerial();case"subjectName":return new _GeneralNames.default();case"issuer":return{};case"signature":return new _AlgorithmIdentifier.default();case"serialNumber":return new asn1js.Integer();case"attrCertValidityPeriod":return new AttCertValidityPeriod();case"attributes":return[];case"issuerUniqueID":return new asn1js.BitString();case"extensions":return new _Extensions.default();default:throw new Error(`Invalid member name for AttributeCertificateInfoV1 class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.Choice({value:[new asn1js.Constructed({name:names.baseCertificateID||"",idBlock:{tagClass:3,tagNumber:0
},value:IssuerSerial.schema().valueBlock.value}),new asn1js.Constructed({name:names.subjectName||"",idBlock:{tagClass:3,tagNumber:1
},value:_GeneralNames.default.schema().valueBlock.value})]}),_GeneralNames.default.schema({names:{blockName:names.issuer||""}}),_AlgorithmIdentifier.default.schema(names.signature||{}),new asn1js.Integer({name:names.serialNumber||""}),AttCertValidityPeriod.schema(names.attrCertValidityPeriod||{}),new asn1js.Sequence({name:names.attributes||"",value:[new asn1js.Repeated({value:_Attribute.default.schema()})]}),new asn1js.BitString({optional:true,name:names.issuerUniqueID||""}),_Extensions.default.schema(names.extensions||{},true)]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","baseCertificateID","subjectName","issuer","signature","serialNumber","attrCertValidityPeriod","attributes","issuerUniqueID","extensions"]);
 const asn1=asn1js.compareSchema(schema,schema,AttributeCertificateInfoV1.schema({names:{version:"version",baseCertificateID:"baseCertificateID",subjectName:"subjectName",issuer:"issuer",signature:{names:{blockName:"signature"}},serialNumber:"serialNumber",attrCertValidityPeriod:{names:{blockName:"attrCertValidityPeriod"}},attributes:"attributes",issuerUniqueID:"issuerUniqueID",extensions:{names:{blockName:"extensions"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttributeCertificateInfoV1");
 this.version=asn1.result.version.valueBlock.valueDec;if("baseCertificateID"in asn1.result){this.baseCertificateID=new IssuerSerial({schema:new asn1js.Sequence({value:asn1.result.baseCertificateID.valueBlock.value})});}
if("subjectName"in asn1.result){this.subjectName=new _GeneralNames.default({schema:new asn1js.Sequence({value:asn1.result.subjectName.valueBlock.value})});}
this.issuer=asn1.result.issuer;this.signature=new _AlgorithmIdentifier.default({schema:asn1.result.signature});this.serialNumber=asn1.result.serialNumber;this.attrCertValidityPeriod=new AttCertValidityPeriod({schema:asn1.result.attrCertValidityPeriod});this.attributes=Array.from(asn1.result.attributes.valueBlock.value,element=>new _Attribute.default({schema:element}));if("issuerUniqueID"in asn1.result)this.issuerUniqueID=asn1.result.issuerUniqueID;if("extensions"in asn1.result)this.extensions=new _Extensions.default({schema:asn1.result.extensions});}
toSchema(){const result=new asn1js.Sequence({value:[new asn1js.Integer({value:this.version})]});if("baseCertificateID"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:0
},value:this.baseCertificateID.toSchema().valueBlock.value}));}
if("subjectName"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:1
},value:this.subjectName.toSchema().valueBlock.value}));}
result.valueBlock.value.push(this.issuer.toSchema());result.valueBlock.value.push(this.signature.toSchema());result.valueBlock.value.push(this.serialNumber);result.valueBlock.value.push(this.attrCertValidityPeriod.toSchema());result.valueBlock.value.push(new asn1js.Sequence({value:Array.from(this.attributes,element=>element.toSchema())}));if("issuerUniqueID"in this)result.valueBlock.value.push(this.issuerUniqueID);if("extensions"in this)result.valueBlock.value.push(this.extensions.toSchema());return result;}
toJSON(){const result={version:this.version};if("baseCertificateID"in this)result.baseCertificateID=this.baseCertificateID.toJSON();if("subjectName"in this)result.subjectName=this.subjectName.toJSON();result.issuer=this.issuer.toJSON();result.signature=this.signature.toJSON();result.serialNumber=this.serialNumber.toJSON();result.attrCertValidityPeriod=this.attrCertValidityPeriod.toJSON();result.attributes=Array.from(this.attributes,element=>element.toJSON());if("issuerUniqueID"in this)result.issuerUniqueID=this.issuerUniqueID.toJSON();if("extensions"in this)result.extensions=this.extensions.toJSON();return result;}
}
exports.AttributeCertificateInfoV1=AttributeCertificateInfoV1;class AttributeCertificateV1{constructor(parameters={}){ this.acinfo=(0,_pvutils.getParametersValue)(parameters,"acinfo",AttributeCertificateV1.defaultValues("acinfo"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",AttributeCertificateV1.defaultValues("signatureAlgorithm"));this.signatureValue=(0,_pvutils.getParametersValue)(parameters,"signatureValue",AttributeCertificateV1.defaultValues("signatureValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"acinfo":return new AttributeCertificateInfoV1();case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signatureValue":return new asn1js.BitString();default:throw new Error(`Invalid member name for AttributeCertificateV1 class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[AttributeCertificateInfoV1.schema(names.acinfo||{}),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{}),new asn1js.BitString({name:names.signatureValue||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["acinfo","signatureValue","signatureAlgorithm"]);
 const asn1=asn1js.compareSchema(schema,schema,AttributeCertificateV1.schema({names:{acinfo:{names:{blockName:"acinfo"}},signatureAlgorithm:{names:{blockName:"signatureAlgorithm"}},signatureValue:"signatureValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttributeCertificateV1");
 this.acinfo=new AttributeCertificateInfoV1({schema:asn1.result.acinfo});this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signatureValue=asn1.result.signatureValue;}
toSchema(){return new asn1js.Sequence({value:[this.acinfo.toSchema(),this.signatureAlgorithm.toSchema(),this.signatureValue]});}
toJSON(){return{acinfo:this.acinfo.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signatureValue:this.signatureValue.toJSON()};}
}
exports.default=AttributeCertificateV1;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./Extensions.js":39,"./GeneralNames.js":41,"asn1js":112,"pvutils":113}],8:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.AttributeCertificateInfoV2=exports.Holder=exports.V2Form=exports.ObjectDigestInfo=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralNames=_interopRequireDefault(require("./GeneralNames.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));var _AttributeCertificateV=require("./AttributeCertificateV1.js");function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ObjectDigestInfo{constructor(parameters={}){ this.digestedObjectType=(0,_pvutils.getParametersValue)(parameters,"digestedObjectType",ObjectDigestInfo.defaultValues("digestedObjectType"));if("otherObjectTypeID"in parameters)
this.otherObjectTypeID=(0,_pvutils.getParametersValue)(parameters,"otherObjectTypeID",ObjectDigestInfo.defaultValues("otherObjectTypeID"));this.digestAlgorithm=(0,_pvutils.getParametersValue)(parameters,"digestAlgorithm",ObjectDigestInfo.defaultValues("digestAlgorithm"));this.objectDigest=(0,_pvutils.getParametersValue)(parameters,"objectDigest",ObjectDigestInfo.defaultValues("objectDigest"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"digestedObjectType":return new asn1js.Enumerated();case"otherObjectTypeID":return new asn1js.ObjectIdentifier();case"digestAlgorithm":return new _AlgorithmIdentifier.default();case"objectDigest":return new asn1js.BitString();default:throw new Error(`Invalid member name for ObjectDigestInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Enumerated({name:names.digestedObjectType||""}),new asn1js.ObjectIdentifier({optional:true,name:names.otherObjectTypeID||""}),_AlgorithmIdentifier.default.schema(names.digestAlgorithm||{}),new asn1js.BitString({name:names.objectDigest||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["digestedObjectType","otherObjectTypeID","digestAlgorithm","objectDigest"]);
 const asn1=asn1js.compareSchema(schema,schema,ObjectDigestInfo.schema({names:{digestedObjectType:"digestedObjectType",otherObjectTypeID:"otherObjectTypeID",digestAlgorithm:{names:{blockName:"digestAlgorithm"}},objectDigest:"objectDigest"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ObjectDigestInfo");
 this.digestedObjectType=asn1.result.digestedObjectType;if("otherObjectTypeID"in asn1.result)this.otherObjectTypeID=asn1.result.otherObjectTypeID;this.digestAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.digestAlgorithm});this.objectDigest=asn1.result.objectDigest;}
toSchema(){const result=new asn1js.Sequence({value:[this.digestedObjectType]});if("otherObjectTypeID"in this)result.value.push(this.otherObjectTypeID);result.value.push(this.digestAlgorithm.toSchema());result.value.push(this.objectDigest);return result;}
toJSON(){const result={digestedObjectType:this.digestedObjectType.toJSON()};if("otherObjectTypeID"in this)result.otherObjectTypeID=this.otherObjectTypeID.toJSON();result.digestAlgorithm=this.digestAlgorithm.toJSON();result.objectDigest=this.objectDigest.toJSON();return result;}
}
exports.ObjectDigestInfo=ObjectDigestInfo;class V2Form{constructor(parameters={}){ if("issuerName"in parameters)
this.issuerName=(0,_pvutils.getParametersValue)(parameters,"issuerName",V2Form.defaultValues("issuerName"));if("baseCertificateID"in parameters)
this.baseCertificateID=(0,_pvutils.getParametersValue)(parameters,"baseCertificateID",V2Form.defaultValues("baseCertificateID"));if("objectDigestInfo"in parameters)
this.objectDigestInfo=(0,_pvutils.getParametersValue)(parameters,"objectDigestInfo",V2Form.defaultValues("objectDigestInfo"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"issuerName":return new _GeneralNames.default();case"baseCertificateID":return new _AttributeCertificateV.IssuerSerial();case"objectDigestInfo":return new ObjectDigestInfo();default:throw new Error(`Invalid member name for V2Form class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_GeneralNames.default.schema({names:{blockName:names.issuerName}},true),new asn1js.Constructed({optional:true,name:names.baseCertificateID||"",idBlock:{tagClass:3,tagNumber:0
},value:_AttributeCertificateV.IssuerSerial.schema().valueBlock.value}),new asn1js.Constructed({optional:true,name:names.objectDigestInfo||"",idBlock:{tagClass:3,tagNumber:1
},value:ObjectDigestInfo.schema().valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["issuerName","baseCertificateID","objectDigestInfo"]);
 const asn1=asn1js.compareSchema(schema,schema,V2Form.schema({names:{issuerName:"issuerName",baseCertificateID:"baseCertificateID",objectDigestInfo:"objectDigestInfo"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for V2Form");
 if("issuerName"in asn1.result)this.issuerName=new _GeneralNames.default({schema:asn1.result.issuerName});if("baseCertificateID"in asn1.result){this.baseCertificateID=new _AttributeCertificateV.IssuerSerial({schema:new asn1js.Sequence({value:asn1.result.baseCertificateID.valueBlock.value})});}
if("objectDigestInfo"in asn1.result){this.objectDigestInfo=new ObjectDigestInfo({schema:new asn1js.Sequence({value:asn1.result.objectDigestInfo.valueBlock.value})});}
}
toSchema(){const result=new asn1js.Sequence();if("issuerName"in this)result.valueBlock.value.push(this.issuerName.toSchema());if("baseCertificateID"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:0
},value:this.baseCertificateID.toSchema().valueBlock.value}));}
if("objectDigestInfo"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:1
},value:this.objectDigestInfo.toSchema().valueBlock.value}));} 
return result;}
toJSON(){const result={};if("issuerName"in this)result.issuerName=this.issuerName.toJSON();if("baseCertificateID"in this)result.baseCertificateID=this.baseCertificateID.toJSON();if("objectDigestInfo"in this)result.objectDigestInfo=this.objectDigestInfo.toJSON();return result;}
}
exports.V2Form=V2Form;class Holder{constructor(parameters={}){ if("baseCertificateID"in parameters)
this.baseCertificateID=(0,_pvutils.getParametersValue)(parameters,"baseCertificateID",Holder.defaultValues("baseCertificateID"));if("entityName"in parameters)
this.entityName=(0,_pvutils.getParametersValue)(parameters,"entityName",Holder.defaultValues("entityName"));if("objectDigestInfo"in parameters)
this.objectDigestInfo=(0,_pvutils.getParametersValue)(parameters,"objectDigestInfo",Holder.defaultValues("objectDigestInfo"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"baseCertificateID":return new _AttributeCertificateV.IssuerSerial();case"entityName":return new _GeneralNames.default();case"objectDigestInfo":return new ObjectDigestInfo();default:throw new Error(`Invalid member name for Holder class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({optional:true,name:names.baseCertificateID||"",idBlock:{tagClass:3,tagNumber:0
},value:_AttributeCertificateV.IssuerSerial.schema().valueBlock.value}),new asn1js.Constructed({optional:true,name:names.entityName||"",idBlock:{tagClass:3,tagNumber:1
},value:_GeneralNames.default.schema().valueBlock.value}),new asn1js.Constructed({optional:true,name:names.objectDigestInfo||"",idBlock:{tagClass:3,tagNumber:2
},value:ObjectDigestInfo.schema().valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["baseCertificateID","entityName","objectDigestInfo"]);
 const asn1=asn1js.compareSchema(schema,schema,Holder.schema({names:{baseCertificateID:"baseCertificateID",entityName:"entityName",objectDigestInfo:"objectDigestInfo"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Holder");
 if("baseCertificateID"in asn1.result){this.baseCertificateID=new _AttributeCertificateV.IssuerSerial({schema:new asn1js.Sequence({value:asn1.result.baseCertificateID.valueBlock.value})});}
if("entityName"in asn1.result){this.entityName=new _GeneralNames.default({schema:new asn1js.Sequence({value:asn1.result.entityName.valueBlock.value})});}
if("objectDigestInfo"in asn1.result){this.objectDigestInfo=new ObjectDigestInfo({schema:new asn1js.Sequence({value:asn1.result.objectDigestInfo.valueBlock.value})});}
}
toSchema(){const result=new asn1js.Sequence();if("baseCertificateID"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:0
},value:this.baseCertificateID.toSchema().valueBlock.value}));}
if("entityName"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:1
},value:this.entityName.toSchema().valueBlock.value}));}
if("objectDigestInfo"in this){result.valueBlock.value.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:2
},value:this.objectDigestInfo.toSchema().valueBlock.value}));}
return result;}
toJSON(){const result={};if("baseCertificateID"in this)result.baseCertificateID=this.baseCertificateID.toJSON();if("entityName"in this)result.entityName=this.entityName.toJSON();if("objectDigestInfo"in this)result.objectDigestInfo=this.objectDigestInfo.toJSON();return result;}
}
exports.Holder=Holder;class AttributeCertificateInfoV2{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",AttributeCertificateInfoV2.defaultValues("version"));this.holder=(0,_pvutils.getParametersValue)(parameters,"holder",AttributeCertificateInfoV2.defaultValues("holder"));this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",AttributeCertificateInfoV2.defaultValues("issuer"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",AttributeCertificateInfoV2.defaultValues("signature"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",AttributeCertificateInfoV2.defaultValues("serialNumber"));this.attrCertValidityPeriod=(0,_pvutils.getParametersValue)(parameters,"attrCertValidityPeriod",AttributeCertificateInfoV2.defaultValues("attrCertValidityPeriod"));this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",AttributeCertificateInfoV2.defaultValues("attributes"));if("issuerUniqueID"in parameters)
this.issuerUniqueID=(0,_pvutils.getParametersValue)(parameters,"issuerUniqueID",AttributeCertificateInfoV2.defaultValues("issuerUniqueID"));if("extensions"in parameters)
this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",AttributeCertificateInfoV2.defaultValues("extensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 1;case"holder":return new Holder();case"issuer":return{};case"signature":return new _AlgorithmIdentifier.default();case"serialNumber":return new asn1js.Integer();case"attrCertValidityPeriod":return new _AttributeCertificateV.AttCertValidityPeriod();case"attributes":return[];case"issuerUniqueID":return new asn1js.BitString();case"extensions":return new _Extensions.default();default:throw new Error(`Invalid member name for AttributeCertificateInfoV2 class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),Holder.schema(names.holder||{}),new asn1js.Choice({value:[_GeneralNames.default.schema({names:{blockName:names.issuer||""}}),new asn1js.Constructed({name:names.issuer||"",idBlock:{tagClass:3, tagNumber:0
},value:V2Form.schema().valueBlock.value})]}),_AlgorithmIdentifier.default.schema(names.signature||{}),new asn1js.Integer({name:names.serialNumber||""}),_AttributeCertificateV.AttCertValidityPeriod.schema(names.attrCertValidityPeriod||{}),new asn1js.Sequence({name:names.attributes||"",value:[new asn1js.Repeated({value:_Attribute.default.schema()})]}),new asn1js.BitString({optional:true,name:names.issuerUniqueID||""}),_Extensions.default.schema(names.extensions||{},true)]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","holder","issuer","signature","serialNumber","attrCertValidityPeriod","attributes","issuerUniqueID","extensions"]);
 const asn1=asn1js.compareSchema(schema,schema,AttributeCertificateInfoV2.schema({names:{version:"version",holder:{names:{blockName:"holder"}},issuer:"issuer",signature:{names:{blockName:"signature"}},serialNumber:"serialNumber",attrCertValidityPeriod:{names:{blockName:"attrCertValidityPeriod"}},attributes:"attributes",issuerUniqueID:"issuerUniqueID",extensions:{names:{blockName:"extensions"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttributeCertificateInfoV2");
 this.version=asn1.result.version.valueBlock.valueDec;this.holder=new Holder({schema:asn1.result.holder});switch(asn1.result.issuer.idBlock.tagClass){case 3: this.issuer=new V2Form({schema:new asn1js.Sequence({value:asn1.result.issuer.valueBlock.value})});break;case 1:default:throw new Error("Incorect value for 'issuer' in AttributeCertificateInfoV2");}
this.signature=new _AlgorithmIdentifier.default({schema:asn1.result.signature});this.serialNumber=asn1.result.serialNumber;this.attrCertValidityPeriod=new _AttributeCertificateV.AttCertValidityPeriod({schema:asn1.result.attrCertValidityPeriod});this.attributes=Array.from(asn1.result.attributes.valueBlock.value,element=>new _Attribute.default({schema:element}));if("issuerUniqueID"in asn1.result)this.issuerUniqueID=asn1.result.issuerUniqueID;if("extensions"in asn1.result)this.extensions=new _Extensions.default({schema:asn1.result.extensions});}
toSchema(){const result=new asn1js.Sequence({value:[new asn1js.Integer({value:this.version}),this.holder.toSchema(),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:this.issuer.toSchema().valueBlock.value}),this.signature.toSchema(),this.serialNumber,this.attrCertValidityPeriod.toSchema(),new asn1js.Sequence({value:Array.from(this.attributes,element=>element.toSchema())})]});if("issuerUniqueID"in this)result.valueBlock.value.push(this.issuerUniqueID);if("extensions"in this)result.valueBlock.value.push(this.extensions.toSchema());return result;}
toJSON(){const result={version:this.version,holder:this.holder.toJSON(),issuer:this.issuer.toJSON(),signature:this.signature.toJSON(),serialNumber:this.serialNumber.toJSON(),attrCertValidityPeriod:this.attrCertValidityPeriod.toJSON(),attributes:Array.from(this.attributes,element=>element.toJSON())};if("issuerUniqueID"in this)result.issuerUniqueID=this.issuerUniqueID.toJSON();if("extensions"in this)result.extensions=this.extensions.toJSON();return result;}
}
exports.AttributeCertificateInfoV2=AttributeCertificateInfoV2;class AttributeCertificateV2{constructor(parameters={}){ this.acinfo=(0,_pvutils.getParametersValue)(parameters,"acinfo",AttributeCertificateV2.defaultValues("acinfo"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",AttributeCertificateV2.defaultValues("signatureAlgorithm"));this.signatureValue=(0,_pvutils.getParametersValue)(parameters,"signatureValue",AttributeCertificateV2.defaultValues("signatureValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"acinfo":return new AttributeCertificateInfoV2();case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signatureValue":return new asn1js.BitString();default:throw new Error(`Invalid member name for AttributeCertificateV2 class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[AttributeCertificateInfoV2.schema(names.acinfo||{}),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{}),new asn1js.BitString({name:names.signatureValue||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["acinfo","signatureAlgorithm","signatureValue"]);
 const asn1=asn1js.compareSchema(schema,schema,AttributeCertificateV2.schema({names:{acinfo:{names:{blockName:"acinfo"}},signatureAlgorithm:{names:{blockName:"signatureAlgorithm"}},signatureValue:"signatureValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttributeCertificateV2");
 this.acinfo=new AttributeCertificateInfoV2({schema:asn1.result.acinfo});this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signatureValue=asn1.result.signatureValue;}
toSchema(){return new asn1js.Sequence({value:[this.acinfo.toSchema(),this.signatureAlgorithm.toSchema(),this.signatureValue]});}
toJSON(){return{acinfo:this.acinfo.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signatureValue:this.signatureValue.toJSON()};}
}
exports.default=AttributeCertificateV2;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./AttributeCertificateV1.js":7,"./Extensions.js":39,"./GeneralNames.js":41,"asn1js":112,"pvutils":113}],9:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AttributeTypeAndValue{constructor(parameters={}){ this.type=(0,_pvutils.getParametersValue)(parameters,"type",AttributeTypeAndValue.defaultValues("type"));this.value=(0,_pvutils.getParametersValue)(parameters,"value",AttributeTypeAndValue.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"type":return"";case"value":return{};default:throw new Error(`Invalid member name for AttributeTypeAndValue class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.type||""}),new asn1js.Any({name:names.value||""})]});}
static blockName(){return"AttributeTypeAndValue";}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["type","typeValue"]);
 const asn1=asn1js.compareSchema(schema,schema,AttributeTypeAndValue.schema({names:{type:"type",value:"typeValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AttributeTypeAndValue");
 this.type=asn1.result.type.valueBlock.toString(); this.value=asn1.result.typeValue;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.type}),this.value]});}
toJSON(){const _object={type:this.type};if(Object.keys(this.value).length!==0)_object.value=this.value.toJSON();else _object.value=this.value;return _object;}
isEqual(compareTo){const stringBlockNames=[asn1js.Utf8String.blockName(),asn1js.BmpString.blockName(),asn1js.UniversalString.blockName(),asn1js.NumericString.blockName(),asn1js.PrintableString.blockName(),asn1js.TeletexString.blockName(),asn1js.VideotexString.blockName(),asn1js.IA5String.blockName(),asn1js.GraphicString.blockName(),asn1js.VisibleString.blockName(),asn1js.GeneralString.blockName(),asn1js.CharacterString.blockName()];if(compareTo.constructor.blockName()===AttributeTypeAndValue.blockName()){if(this.type!==compareTo.type)return false; let isString=false;const thisName=this.value.constructor.blockName();if(thisName===compareTo.value.constructor.blockName()){for(var _i=0,_stringBlockNames=stringBlockNames;_i<_stringBlockNames.length;_i++){const name=_stringBlockNames[_i];if(thisName===name){isString=true;break;}}} 
if(isString){const value1=(0,_common.stringPrep)(this.value.valueBlock.value);const value2=(0,_common.stringPrep)(compareTo.value.valueBlock.value);if(value1.localeCompare(value2)!==0)return false;}else
{if((0,_pvutils.isEqualBuffer)(this.value.valueBeforeDecode,compareTo.value.valueBeforeDecode)===false)return false;}
return true;}
if(compareTo instanceof ArrayBuffer)return(0,_pvutils.isEqualBuffer)(this.value.valueBeforeDecode,compareTo);return false;}
}
exports.default=AttributeTypeAndValue;},{"./common.js":110,"asn1js":112,"pvutils":113}],10:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _ContentInfo=_interopRequireDefault(require("./ContentInfo.js"));var _SafeContents=_interopRequireDefault(require("./SafeContents.js"));var _EnvelopedData=_interopRequireDefault(require("./EnvelopedData.js"));var _EncryptedData=_interopRequireDefault(require("./EncryptedData.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_nonIterableRest();}
function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance");}
function _iterableToArrayLimit(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"]!=null)_i["return"]();}finally{if(_d)throw _e;}}return _arr;}
function _arrayWithHoles(arr){if(Array.isArray(arr))return arr;}
class AuthenticatedSafe{constructor(parameters={}){ this.safeContents=(0,_pvutils.getParametersValue)(parameters,"safeContents",AuthenticatedSafe.defaultValues("safeContents"));if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",AuthenticatedSafe.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"safeContents":return[];case"parsedValue":return{};default:throw new Error(`Invalid member name for AuthenticatedSafe class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"safeContents":return memberValue.length===0;case"parsedValue":return memberValue instanceof Object&&Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for AuthenticatedSafe class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.contentInfos||"",value:_ContentInfo.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["contentInfos"]);
 const asn1=asn1js.compareSchema(schema,schema,AuthenticatedSafe.schema({names:{contentInfos:"contentInfos"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AuthenticatedSafe");
 this.safeContents=Array.from(asn1.result.contentInfos,element=>new _ContentInfo.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.safeContents,element=>element.toSchema())});}
toJSON(){return{safeContents:Array.from(this.safeContents,element=>element.toJSON())};}
parseInternalValues(parameters){if(parameters instanceof Object===false)return Promise.reject("The \"parameters\" must has \"Object\" type");if("safeContents"in parameters===false)return Promise.reject("Absent mandatory parameter \"safeContents\"");if(parameters.safeContents instanceof Array===false)return Promise.reject("The \"parameters.safeContents\" must has \"Array\" type");if(parameters.safeContents.length!==this.safeContents.length)return Promise.reject("Length of \"parameters.safeContents\" must be equal to \"this.safeContents.length\"");
 let sequence=Promise.resolve();
this.parsedValue={safeContents:[]};var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.safeContents.entries()[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const _step$value=_slicedToArray(_step.value,2),index=_step$value[0],content=_step$value[1];switch(content.contentType){ case"1.2.840.113549.1.7.1":{if(content.content instanceof asn1js.OctetString===false)return Promise.reject("Wrong type of \"this.safeContents[j].content\"");
 let authSafeContent=new ArrayBuffer(0);if(content.content.valueBlock.isConstructed){var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=content.content.valueBlock.value[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const contentValue=_step2.value;authSafeContent=(0,_pvutils.utilConcatBuf)(authSafeContent,contentValue.valueBlock.valueHex);}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}}else authSafeContent=content.content.valueBlock.valueHex;
 const asn1=asn1js.fromBER(authSafeContent);if(asn1.offset===-1)return Promise.reject("Error during parsing of ASN.1 data inside \"content.content\"");
 this.parsedValue.safeContents.push({privacyMode:0, value:new _SafeContents.default({schema:asn1.result})});}
break;
 case"1.2.840.113549.1.7.3":{ const cmsEnveloped=new _EnvelopedData.default({schema:content.content});
 if("recipientCertificate"in parameters.safeContents[index]===false)return Promise.reject("Absent mandatory parameter \"recipientCertificate\" in \"parameters.safeContents[j]\"");const recipientCertificate=parameters.safeContents[index].recipientCertificate;if("recipientKey"in parameters.safeContents[index]===false)return Promise.reject("Absent mandatory parameter \"recipientKey\" in \"parameters.safeContents[j]\""); const recipientKey=parameters.safeContents[index].recipientKey;
 sequence=sequence.then(()=>cmsEnveloped.decrypt(0,{recipientCertificate,recipientPrivateKey:recipientKey}));sequence=sequence.then(result=>{const asn1=asn1js.fromBER(result);if(asn1.offset===-1)return Promise.reject("Error during parsing of decrypted data");this.parsedValue.safeContents.push({privacyMode:2, value:new _SafeContents.default({schema:asn1.result})});return Promise.resolve();});}
break;
 case"1.2.840.113549.1.7.6":{ const cmsEncrypted=new _EncryptedData.default({schema:content.content});
 if("password"in parameters.safeContents[index]===false)return Promise.reject("Absent mandatory parameter \"password\" in \"parameters.safeContents[j]\"");const password=parameters.safeContents[index].password;
 sequence=sequence.then(()=>cmsEncrypted.decrypt({password}),error=>Promise.reject(error));
 sequence=sequence.then(result=>{const asn1=asn1js.fromBER(result);if(asn1.offset===-1)return Promise.reject("Error during parsing of decrypted data");this.parsedValue.safeContents.push({privacyMode:1, value:new _SafeContents.default({schema:asn1.result})});return Promise.resolve();},error=>Promise.reject(error));}
break;
 default:throw new Error(`Unknown "contentType" for AuthenticatedSafe: " ${content.contentType}`);}}
}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
return sequence;}
makeInternalValues(parameters){if("parsedValue"in this===false)return Promise.reject("Please run \"parseValues\" first or add \"parsedValue\" manually");if(this.parsedValue instanceof Object===false)return Promise.reject("The \"this.parsedValue\" must has \"Object\" type");if(this.parsedValue.safeContents instanceof Array===false)return Promise.reject("The \"this.parsedValue.safeContents\" must has \"Array\" type");
if(parameters instanceof Object===false)return Promise.reject("The \"parameters\" must has \"Object\" type");if("safeContents"in parameters===false)return Promise.reject("Absent mandatory parameter \"safeContents\"");if(parameters.safeContents instanceof Array===false)return Promise.reject("The \"parameters.safeContents\" must has \"Array\" type");if(parameters.safeContents.length!==this.parsedValue.safeContents.length)return Promise.reject("Length of \"parameters.safeContents\" must be equal to \"this.parsedValue.safeContents\"");
 let sequence=Promise.resolve();
 this.safeContents=[];var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=this.parsedValue.safeContents.entries()[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const _step3$value=_slicedToArray(_step3.value,2),index=_step3$value[0],content=_step3$value[1]; if("privacyMode"in content===false)return Promise.reject("The \"privacyMode\" is a mandatory parameter for \"content\"");if("value"in content===false)return Promise.reject("The \"value\" is a mandatory parameter for \"content\"");if(content.value instanceof _SafeContents.default===false)return Promise.reject("The \"content.value\" must has \"SafeContents\" type"); switch(content.privacyMode){ case 0:{const contentBuffer=content.value.toSchema().toBER(false);sequence=sequence.then(()=>{this.safeContents.push(new _ContentInfo.default({contentType:"1.2.840.113549.1.7.1",content:new asn1js.OctetString({valueHex:contentBuffer})}));});}
break;
 case 1:{ const cmsEncrypted=new _EncryptedData.default();const currentParameters=parameters.safeContents[index];currentParameters.contentToEncrypt=content.value.toSchema().toBER(false);
 sequence=sequence.then(()=>cmsEncrypted.encrypt(currentParameters),error=>Promise.reject(error));
 sequence=sequence.then(()=>{this.safeContents.push(new _ContentInfo.default({contentType:"1.2.840.113549.1.7.6",content:cmsEncrypted.toSchema()}));},error=>Promise.reject(error));}
break;
 case 2:{ const cmsEnveloped=new _EnvelopedData.default();const contentToEncrypt=content.value.toSchema().toBER(false);
 if("encryptingCertificate"in parameters.safeContents[index]===false)return Promise.reject("Absent mandatory parameter \"encryptingCertificate\" in \"parameters.safeContents[i]\"");if("encryptionAlgorithm"in parameters.safeContents[index]===false)return Promise.reject("Absent mandatory parameter \"encryptionAlgorithm\" in \"parameters.safeContents[i]\"");switch(true){case parameters.safeContents[index].encryptionAlgorithm.name.toLowerCase()==="aes-cbc":case parameters.safeContents[index].encryptionAlgorithm.name.toLowerCase()==="aes-gcm":break;default:return Promise.reject(`Incorrect parameter "encryptionAlgorithm" in "parameters.safeContents[i]": ${parameters.safeContents[index].encryptionAlgorithm}`);}
switch(true){case parameters.safeContents[index].encryptionAlgorithm.length===128:case parameters.safeContents[index].encryptionAlgorithm.length===192:case parameters.safeContents[index].encryptionAlgorithm.length===256:break;default:return Promise.reject(`Incorrect parameter "encryptionAlgorithm.length" in "parameters.safeContents[i]": ${parameters.safeContents[index].encryptionAlgorithm.length}`);}
 
const encryptionAlgorithm=parameters.safeContents[index].encryptionAlgorithm;
 cmsEnveloped.addRecipientByCertificate(parameters.safeContents[index].encryptingCertificate);
 sequence=sequence.then(()=>cmsEnveloped.encrypt(encryptionAlgorithm,contentToEncrypt));sequence=sequence.then(()=>{this.safeContents.push(new _ContentInfo.default({contentType:"1.2.840.113549.1.7.3",content:cmsEnveloped.toSchema()}));});}
break;
 default:return Promise.reject(`Incorrect value for "content.privacyMode": ${content.privacyMode}`);}}

}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return!=null){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}
return sequence.then(()=>this,error=>Promise.reject(`Error during parsing: ${error}`));}
}
exports.default=AuthenticatedSafe;},{"./ContentInfo.js":26,"./EncryptedData.js":35,"./EnvelopedData.js":36,"./SafeContents.js":96,"asn1js":112,"pvutils":113}],11:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class AuthorityKeyIdentifier{constructor(parameters={}){ if("keyIdentifier"in parameters)
this.keyIdentifier=(0,_pvutils.getParametersValue)(parameters,"keyIdentifier",AuthorityKeyIdentifier.defaultValues("keyIdentifier"));if("authorityCertIssuer"in parameters)
this.authorityCertIssuer=(0,_pvutils.getParametersValue)(parameters,"authorityCertIssuer",AuthorityKeyIdentifier.defaultValues("authorityCertIssuer"));if("authorityCertSerialNumber"in parameters)
this.authorityCertSerialNumber=(0,_pvutils.getParametersValue)(parameters,"authorityCertSerialNumber",AuthorityKeyIdentifier.defaultValues("authorityCertSerialNumber"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyIdentifier":return new asn1js.OctetString();case"authorityCertIssuer":return[];case"authorityCertSerialNumber":return new asn1js.Integer();default:throw new Error(`Invalid member name for AuthorityKeyIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Primitive({name:names.keyIdentifier||"",optional:true,idBlock:{tagClass:3, tagNumber:0
}}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Repeated({name:names.authorityCertIssuer||"",value:_GeneralName.default.schema()})]}),new asn1js.Primitive({name:names.authorityCertSerialNumber||"",optional:true,idBlock:{tagClass:3, tagNumber:2
}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyIdentifier","authorityCertIssuer","authorityCertSerialNumber"]);
 const asn1=asn1js.compareSchema(schema,schema,AuthorityKeyIdentifier.schema({names:{keyIdentifier:"keyIdentifier",authorityCertIssuer:"authorityCertIssuer",authorityCertSerialNumber:"authorityCertSerialNumber"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for AuthorityKeyIdentifier");
 if("keyIdentifier"in asn1.result)this.keyIdentifier=new asn1js.OctetString({valueHex:asn1.result.keyIdentifier.valueBlock.valueHex});if("authorityCertIssuer"in asn1.result)this.authorityCertIssuer=Array.from(asn1.result.authorityCertIssuer,element=>new _GeneralName.default({schema:element}));if("authorityCertSerialNumber"in asn1.result)this.authorityCertSerialNumber=new asn1js.Integer({valueHex:asn1.result.authorityCertSerialNumber.valueBlock.valueHex});}
toSchema(){ const outputArray=[];if("keyIdentifier"in this){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:0
},valueHex:this.keyIdentifier.valueBlock.valueHex}));}
if("authorityCertIssuer"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.authorityCertIssuer,element=>element.toSchema())}));}
if("authorityCertSerialNumber"in this){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:2
},valueHex:this.authorityCertSerialNumber.valueBlock.valueHex}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("keyIdentifier"in this)object.keyIdentifier=this.keyIdentifier.toJSON();if("authorityCertIssuer"in this)object.authorityCertIssuer=Array.from(this.authorityCertIssuer,element=>element.toJSON());if("authorityCertSerialNumber"in this)object.authorityCertSerialNumber=this.authorityCertSerialNumber.toJSON();return object;}
}
exports.default=AuthorityKeyIdentifier;},{"./GeneralName.js":40,"asn1js":112,"pvutils":113}],12:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class BasicConstraints{constructor(parameters={}){ this.cA=(0,_pvutils.getParametersValue)(parameters,"cA",false);if("pathLenConstraint"in parameters)
this.pathLenConstraint=(0,_pvutils.getParametersValue)(parameters,"pathLenConstraint",0);
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"cA":return false;default:throw new Error(`Invalid member name for BasicConstraints class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Boolean({optional:true,name:names.cA||""}),new asn1js.Integer({optional:true,name:names.pathLenConstraint||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["cA","pathLenConstraint"]);
 const asn1=asn1js.compareSchema(schema,schema,BasicConstraints.schema({names:{cA:"cA",pathLenConstraint:"pathLenConstraint"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for BasicConstraints");
 if("cA"in asn1.result)this.cA=asn1.result.cA.valueBlock.value;if("pathLenConstraint"in asn1.result){if(asn1.result.pathLenConstraint.valueBlock.isHexOnly)this.pathLenConstraint=asn1.result.pathLenConstraint;else this.pathLenConstraint=asn1.result.pathLenConstraint.valueBlock.valueDec;}
}
toSchema(){ const outputArray=[];if(this.cA!==BasicConstraints.defaultValues("cA"))outputArray.push(new asn1js.Boolean({value:this.cA}));if("pathLenConstraint"in this){if(this.pathLenConstraint instanceof asn1js.Integer)outputArray.push(this.pathLenConstraint);else outputArray.push(new asn1js.Integer({value:this.pathLenConstraint}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if(this.cA!==BasicConstraints.defaultValues("cA"))object.cA=this.cA;if("pathLenConstraint"in this){if(this.pathLenConstraint instanceof asn1js.Integer)object.pathLenConstraint=this.pathLenConstraint.toJSON();else object.pathLenConstraint=this.pathLenConstraint;}
return object;}
}
exports.default=BasicConstraints;},{"asn1js":112,"pvutils":113}],13:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _ResponseData=_interopRequireDefault(require("./ResponseData.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _CertID=_interopRequireDefault(require("./CertID.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _CertificateChainValidationEngine=_interopRequireDefault(require("./CertificateChainValidationEngine.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_nonIterableRest();}
function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance");}
function _iterableToArrayLimit(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"]!=null)_i["return"]();}finally{if(_d)throw _e;}}return _arr;}
function _arrayWithHoles(arr){if(Array.isArray(arr))return arr;}
class BasicOCSPResponse{constructor(parameters={}){ this.tbsResponseData=(0,_pvutils.getParametersValue)(parameters,"tbsResponseData",BasicOCSPResponse.defaultValues("tbsResponseData"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",BasicOCSPResponse.defaultValues("signatureAlgorithm"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",BasicOCSPResponse.defaultValues("signature"));if("certs"in parameters)
this.certs=(0,_pvutils.getParametersValue)(parameters,"certs",BasicOCSPResponse.defaultValues("certs"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbsResponseData":return new _ResponseData.default();case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signature":return new asn1js.BitString();case"certs":return[];default:throw new Error(`Invalid member name for BasicOCSPResponse class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"type":{ let comparisonResult=_ResponseData.default.compareWithDefault("tbs",memberValue.tbs)&&_ResponseData.default.compareWithDefault("responderID",memberValue.responderID)&&_ResponseData.default.compareWithDefault("producedAt",memberValue.producedAt)&&_ResponseData.default.compareWithDefault("responses",memberValue.responses);if("responseExtensions"in memberValue)comparisonResult=comparisonResult&&_ResponseData.default.compareWithDefault("responseExtensions",memberValue.responseExtensions);return comparisonResult;}
case"signatureAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"signature":return memberValue.isEqual(BasicOCSPResponse.defaultValues(memberName));case"certs":return memberValue.length===0;default:throw new Error(`Invalid member name for BasicOCSPResponse class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"BasicOCSPResponse",value:[_ResponseData.default.schema(names.tbsResponseData||{names:{blockName:"BasicOCSPResponse.tbsResponseData"}}),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{names:{blockName:"BasicOCSPResponse.signatureAlgorithm"}}),new asn1js.BitString({name:names.signature||"BasicOCSPResponse.signature"}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Sequence({value:[new asn1js.Repeated({name:"BasicOCSPResponse.certs",value:_Certificate.default.schema(names.certs||{})})]})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["BasicOCSPResponse.tbsResponseData","BasicOCSPResponse.signatureAlgorithm","BasicOCSPResponse.signature","BasicOCSPResponse.certs"]);
 const asn1=asn1js.compareSchema(schema,schema,BasicOCSPResponse.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for BasicOCSPResponse");
 this.tbsResponseData=new _ResponseData.default({schema:asn1.result["BasicOCSPResponse.tbsResponseData"]});this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result["BasicOCSPResponse.signatureAlgorithm"]});this.signature=asn1.result["BasicOCSPResponse.signature"];if("BasicOCSPResponse.certs"in asn1.result)this.certs=Array.from(asn1.result["BasicOCSPResponse.certs"],element=>new _Certificate.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(this.tbsResponseData.toSchema());outputArray.push(this.signatureAlgorithm.toSchema());outputArray.push(this.signature); if("certs"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Sequence({value:Array.from(this.certs,element=>element.toSchema())})]}));}

 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={tbsResponseData:this.tbsResponseData.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signature:this.signature.toJSON()};if("certs"in this)_object.certs=Array.from(this.certs,element=>element.toJSON());return _object;}
getCertificateStatus(certificate,issuerCertificate){ let sequence=Promise.resolve();const result={isForCertificate:false,status:2
};const hashesObject={};const certIDs=[];const certIDPromises=[];
 var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.tbsResponseData.responses[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const response=_step.value;const hashAlgorithm=(0,_common.getAlgorithmByOID)(response.certID.hashAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return Promise.reject(`Wrong CertID hashing algorithm: ${response.certID.hashAlgorithm.algorithmId}`);if(hashAlgorithm.name in hashesObject===false){hashesObject[hashAlgorithm.name]=1;const certID=new _CertID.default();certIDs.push(certID);certIDPromises.push(certID.createForCertificate(certificate,{hashAlgorithm:hashAlgorithm.name,issuerCertificate}));}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
sequence=sequence.then(()=>Promise.all(certIDPromises));
 sequence=sequence.then(()=>{var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=this.tbsResponseData.responses[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const response=_step2.value;for(var _i=0,_certIDs=certIDs;_i<_certIDs.length;_i++){const id=_certIDs[_i];if(response.certID.isEqual(id)){result.isForCertificate=true;try{switch(response.certStatus.idBlock.isConstructed){case true:if(response.certStatus.idBlock.tagNumber===1)result.status=1; break;case false:switch(response.certStatus.idBlock.tagNumber){case 0: result.status=0;break;case 2: result.status=2;break;default:}
break;default:}}catch(ex){}
return result;}}}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}
return result;}); return sequence;}
sign(privateKey,hashAlgorithm="SHA-1"){
 if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");

 let sequence=Promise.resolve();let parameters;const engine=(0,_common.getEngine)();
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{this.tbsResponseData.tbs=this.tbsResponseData.toSchema(true).toBER(false);});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(this.tbsResponseData.tbs,privateKey,parameters));sequence=sequence.then(result=>{this.signature=new asn1js.BitString({valueHex:result});}); return sequence;}
verify(parameters={}){ let signerCert=null;let certIndex=-1;let sequence=Promise.resolve();let trustedCerts=[];const _this=this;const engine=(0,_common.getEngine)();
 if("certs"in this===false)return Promise.reject("No certificates attached to the BasicOCSPResponce");
 if("trustedCerts"in parameters)trustedCerts=parameters.trustedCerts;
 function checkCA(cert){ if(cert.issuer.isEqual(signerCert.issuer)===true&&cert.serialNumber.isEqual(signerCert.serialNumber)===true)return null; let isCA=false;var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=cert.extensions[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const extension=_step3.value;if(extension.extnID==="2.5.29.19")
{if("cA"in extension.parsedValue){if(extension.parsedValue.cA===true)isCA=true;}}}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return!=null){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}
if(isCA)return cert;return null;}
 
const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
switch(true){case this.tbsResponseData.responderID instanceof _RelativeDistinguishedNames.default: sequence=sequence.then(()=>{var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=_this.certs.entries()[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){const _step4$value=_slicedToArray(_step4.value,2),index=_step4$value[0],certificate=_step4$value[1];if(certificate.subject.isEqual(_this.tbsResponseData.responderID)){certIndex=index;break;}}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return!=null){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}});break;case this.tbsResponseData.responderID instanceof asn1js.OctetString: sequence=sequence.then(()=>Promise.all(Array.from(_this.certs,element=>crypto.digest({name:"sha-1"},new Uint8Array(element.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex)))).then(results=>{var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=_this.certs.entries()[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){const _step5$value=_slicedToArray(_step5.value,1),index=_step5$value[0];if((0,_pvutils.isEqualBuffer)(results[index],_this.tbsResponseData.responderID.valueBlock.valueHex)){certIndex=index;break;}}}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return!=null){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}}));break;default:return Promise.reject("Wrong value for responderID");}
 
sequence=sequence.then(()=>{if(certIndex===-1)return Promise.reject("Correct certificate was not found in OCSP response");signerCert=this.certs[certIndex];return Promise.all(Array.from(_this.certs,element=>checkCA(element))).then(promiseResults=>{const additionalCerts=[];additionalCerts.push(signerCert);var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=promiseResults[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){const promiseResult=_step6.value;if(promiseResult!==null)additionalCerts.push(promiseResult);}}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return!=null){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}
const certChain=new _CertificateChainValidationEngine.default({certs:additionalCerts,trustedCerts});return certChain.verify().then(verificationResult=>{if(verificationResult.result===true)return Promise.resolve();return Promise.reject("Validation of signer's certificate failed");},error=>Promise.reject(`Validation of signer's certificate failed with error: ${error instanceof Object ? error.resultMessage : error}`));},promiseError=>Promise.reject(`Error during checking certificates for CA flag: ${promiseError}`));}); sequence=sequence.then(()=>engine.subtle.verifyWithPublicKey(this.tbsResponseData.tbs,this.signature,this.certs[certIndex].subjectPublicKeyInfo,this.signatureAlgorithm));return sequence;}
}
exports.default=BasicOCSPResponse;},{"./AlgorithmIdentifier.js":4,"./CertID.js":18,"./Certificate.js":19,"./CertificateChainValidationEngine.js":20,"./RelativeDistinguishedNames.js":89,"./ResponseData.js":92,"./common.js":110,"asn1js":112,"pvutils":113}],14:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CAVersion{constructor(parameters={}){ this.certificateIndex=(0,_pvutils.getParametersValue)(parameters,"certificateIndex",CAVersion.defaultValues("certificateIndex"));this.keyIndex=(0,_pvutils.getParametersValue)(parameters,"keyIndex",CAVersion.defaultValues("keyIndex"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certificateIndex":case"keyIndex":return 0;default:throw new Error(`Invalid member name for CAVersion class: ${memberName}`);}}
static schema(parameters={}){return new asn1js.Integer();}
fromSchema(schema){ if(schema.constructor.blockName()!==asn1js.Integer.blockName())throw new Error("Object's schema was not verified against input data for CAVersion");
 let value=schema.valueBlock.valueHex.slice(0);const valueView=new Uint8Array(value);switch(true){case value.byteLength<4:{const tempValue=new ArrayBuffer(4);const tempValueView=new Uint8Array(tempValue);tempValueView.set(valueView,4-value.byteLength);value=tempValue.slice(0);}
break;case value.byteLength>4:{const tempValue=new ArrayBuffer(4);const tempValueView=new Uint8Array(tempValue);tempValueView.set(valueView.slice(0,4));value=tempValue.slice(0);}
break;default:}
 
const keyIndexBuffer=value.slice(0,2);const keyIndexView8=new Uint8Array(keyIndexBuffer);let temp=keyIndexView8[0];keyIndexView8[0]=keyIndexView8[1];keyIndexView8[1]=temp;const keyIndexView16=new Uint16Array(keyIndexBuffer);this.keyIndex=keyIndexView16[0];const certificateIndexBuffer=value.slice(2);const certificateIndexView8=new Uint8Array(certificateIndexBuffer);temp=certificateIndexView8[0];certificateIndexView8[0]=certificateIndexView8[1];certificateIndexView8[1]=temp;const certificateIndexView16=new Uint16Array(certificateIndexBuffer);this.certificateIndex=certificateIndexView16[0];}
toSchema(){ const certificateIndexBuffer=new ArrayBuffer(2);const certificateIndexView=new Uint16Array(certificateIndexBuffer);certificateIndexView[0]=this.certificateIndex;const certificateIndexView8=new Uint8Array(certificateIndexBuffer);let temp=certificateIndexView8[0];certificateIndexView8[0]=certificateIndexView8[1];certificateIndexView8[1]=temp;const keyIndexBuffer=new ArrayBuffer(2);const keyIndexView=new Uint16Array(keyIndexBuffer);keyIndexView[0]=this.keyIndex;const keyIndexView8=new Uint8Array(keyIndexBuffer);temp=keyIndexView8[0];keyIndexView8[0]=keyIndexView8[1];keyIndexView8[1]=temp;
 return new asn1js.Integer({valueHex:(0,_pvutils.utilConcatBuf)(keyIndexBuffer,certificateIndexBuffer)});}
toJSON(){return{certificateIndex:this.certificateIndex,keyIndex:this.keyIndex};}
}
exports.default=CAVersion;},{"asn1js":112,"pvutils":113}],15:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CertificateRevocationList=_interopRequireDefault(require("./CertificateRevocationList.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CRLBag{constructor(parameters={}){ this.crlId=(0,_pvutils.getParametersValue)(parameters,"crlId",CRLBag.defaultValues("crlId"));this.crlValue=(0,_pvutils.getParametersValue)(parameters,"crlValue",CRLBag.defaultValues("crlValue"));if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",CRLBag.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"crlId":return"";case"crlValue":return new asn1js.Any();case"parsedValue":return{};default:throw new Error(`Invalid member name for CRLBag class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"crlId":return memberValue==="";case"crlValue":return memberValue instanceof asn1js.Any;case"parsedValue":return memberValue instanceof Object&&Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for CRLBag class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.id||"id"}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.value||"value"})]
})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["crlId","crlValue"]);
 const asn1=asn1js.compareSchema(schema,schema,CRLBag.schema({names:{id:"crlId",value:"crlValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CRLBag");
 this.crlId=asn1.result.crlId.valueBlock.toString();this.crlValue=asn1.result.crlValue;switch(this.crlId){case"1.2.840.113549.1.9.23.1":{const asn1Inner=asn1js.fromBER(this.certValue.valueBlock.valueHex);this.parsedValue=new _CertificateRevocationList.default({schema:asn1Inner.result});}
break;default:throw new Error(`Incorrect "crlId" value in CRLBag: ${this.crlId}`);}
}
toSchema(){ if("parsedValue"in this){this.certId="1.2.840.113549.1.9.23.1";this.certValue=new asn1js.OctetString({valueHex:this.parsedValue.toSchema().toBER(false)});}
return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.crlId}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.crlValue.toSchema()]})]});}
toJSON(){return{crlId:this.crlId,crlValue:this.crlValue.toJSON()};}
}
exports.default=CRLBag;},{"./CertificateRevocationList.js":22,"asn1js":112,"pvutils":113}],16:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _DistributionPoint=_interopRequireDefault(require("./DistributionPoint.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CRLDistributionPoints{constructor(parameters={}){ this.distributionPoints=(0,_pvutils.getParametersValue)(parameters,"distributionPoints",CRLDistributionPoints.defaultValues("distributionPoints"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"distributionPoints":return[];default:throw new Error(`Invalid member name for CRLDistributionPoints class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.distributionPoints||"",value:_DistributionPoint.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["distributionPoints"]);
 const asn1=asn1js.compareSchema(schema,schema,CRLDistributionPoints.schema({names:{distributionPoints:"distributionPoints"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CRLDistributionPoints");
 this.distributionPoints=Array.from(asn1.result.distributionPoints,element=>new _DistributionPoint.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.distributionPoints,element=>element.toSchema())});}
toJSON(){return{distributionPoints:Array.from(this.distributionPoints,element=>element.toJSON())};}
}
exports.default=CRLDistributionPoints;},{"./DistributionPoint.js":29,"asn1js":112,"pvutils":113}],17:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _AttributeCertificateV=_interopRequireDefault(require("./AttributeCertificateV2.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CertBag{constructor(parameters={}){ this.certId=(0,_pvutils.getParametersValue)(parameters,"certId",CertBag.defaultValues("certId"));this.certValue=(0,_pvutils.getParametersValue)(parameters,"certValue",CertBag.defaultValues("certValue"));if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",CertBag.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certId":return"";case"certValue":return new asn1js.Any();case"parsedValue":return{};default:throw new Error(`Invalid member name for CertBag class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"certId":return memberValue==="";case"certValue":return memberValue instanceof asn1js.Any;case"parsedValue":return memberValue instanceof Object&&Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for CertBag class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.id||"id"}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.value||"value"})]
})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["certId","certValue"]);
 const asn1=asn1js.compareSchema(schema,schema,CertBag.schema({names:{id:"certId",value:"certValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertBag");
 this.certId=asn1.result.certId.valueBlock.toString();this.certValue=asn1.result.certValue;switch(this.certId){case"1.2.840.113549.1.9.22.1":{const asn1Inner=asn1js.fromBER(this.certValue.valueBlock.valueHex);try{this.parsedValue=new _Certificate.default({schema:asn1Inner.result});}catch(ex)
{this.parsedValue=new _AttributeCertificateV.default({schema:asn1Inner.result});}}
break;case"1.2.840.113549.1.9.22.3":{const asn1Inner=asn1js.fromBER(this.certValue.valueBlock.valueHex);this.parsedValue=new _AttributeCertificateV.default({schema:asn1Inner.result});}
break;case"1.2.840.113549.1.9.22.2": default:throw new Error(`Incorrect "certId" value in CertBag: ${this.certId}`);}
}
toSchema(){ if("parsedValue"in this){if("acinfo"in this.parsedValue) 
this.certId="1.2.840.113549.1.9.22.3";else
 this.certId="1.2.840.113549.1.9.22.1";this.certValue=new asn1js.OctetString({valueHex:this.parsedValue.toSchema().toBER(false)});}
return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.certId}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:["toSchema"in this.certValue?this.certValue.toSchema():this.certValue]})]});}
toJSON(){return{certId:this.certId,certValue:this.certValue.toJSON()};}
}
exports.default=CertBag;},{"./AttributeCertificateV2.js":8,"./Certificate.js":19,"asn1js":112,"pvutils":113}],18:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CertID{constructor(parameters={}){ this.hashAlgorithm=(0,_pvutils.getParametersValue)(parameters,"hashAlgorithm",CertID.defaultValues("hashAlgorithm"));this.issuerNameHash=(0,_pvutils.getParametersValue)(parameters,"issuerNameHash",CertID.defaultValues("issuerNameHash"));this.issuerKeyHash=(0,_pvutils.getParametersValue)(parameters,"issuerKeyHash",CertID.defaultValues("issuerKeyHash"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",CertID.defaultValues("serialNumber"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"hashAlgorithm":return new _AlgorithmIdentifier.default();case"issuerNameHash":case"issuerKeyHash":return new asn1js.OctetString();case"serialNumber":return new asn1js.Integer();default:throw new Error(`Invalid member name for CertID class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"hashAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"issuerNameHash":case"issuerKeyHash":case"serialNumber":return memberValue.isEqual(CertID.defaultValues(memberName));default:throw new Error(`Invalid member name for CertID class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.hashAlgorithmObject||{names:{blockName:names.hashAlgorithm||""}}),new asn1js.OctetString({name:names.issuerNameHash||""}),new asn1js.OctetString({name:names.issuerKeyHash||""}),new asn1js.Integer({name:names.serialNumber||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["hashAlgorithm","issuerNameHash","issuerKeyHash","serialNumber"]);
 const asn1=asn1js.compareSchema(schema,schema,CertID.schema({names:{hashAlgorithm:"hashAlgorithm",issuerNameHash:"issuerNameHash",issuerKeyHash:"issuerKeyHash",serialNumber:"serialNumber"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertID");
 this.hashAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.hashAlgorithm});this.issuerNameHash=asn1.result.issuerNameHash;this.issuerKeyHash=asn1.result.issuerKeyHash;this.serialNumber=asn1.result.serialNumber;}
toSchema(){ return new asn1js.Sequence({value:[this.hashAlgorithm.toSchema(),this.issuerNameHash,this.issuerKeyHash,this.serialNumber]});}
toJSON(){return{hashAlgorithm:this.hashAlgorithm.toJSON(),issuerNameHash:this.issuerNameHash.toJSON(),issuerKeyHash:this.issuerKeyHash.toJSON(),serialNumber:this.serialNumber.toJSON()};}
isEqual(certificateID){if(!this.hashAlgorithm.algorithmId===certificateID.hashAlgorithm.algorithmId)return false;
if((0,_pvutils.isEqualBuffer)(this.issuerNameHash.valueBlock.valueHex,certificateID.issuerNameHash.valueBlock.valueHex)===false)return false;
if((0,_pvutils.isEqualBuffer)(this.issuerKeyHash.valueBlock.valueHex,certificateID.issuerKeyHash.valueBlock.valueHex)===false)return false;
if(!this.serialNumber.isEqual(certificateID.serialNumber))return false; return true;}
createForCertificate(certificate,parameters){ let sequence=Promise.resolve();let issuerCertificate;
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 if("hashAlgorithm"in parameters===false)return Promise.reject("Parameter \"hashAlgorithm\" is mandatory for \"OCSP_REQUEST.createForCertificate\"");const hashOID=(0,_common.getOIDByAlgorithm)({name:parameters.hashAlgorithm});if(hashOID==="")return Promise.reject(`Incorrect "hashAlgorithm": ${this.hashAlgorithm}`);this.hashAlgorithm=new _AlgorithmIdentifier.default({algorithmId:hashOID,algorithmParams:new asn1js.Null()});if("issuerCertificate"in parameters)issuerCertificate=parameters.issuerCertificate;else return Promise.reject("Parameter \"issuerCertificate\" is mandatory for \"OCSP_REQUEST.createForCertificate\"");
 this.serialNumber=certificate.serialNumber;
sequence=sequence.then(()=>crypto.digest({name:parameters.hashAlgorithm},issuerCertificate.subject.toSchema().toBER(false)),error=>Promise.reject(error));
sequence=sequence.then(result=>{this.issuerNameHash=new asn1js.OctetString({valueHex:result});const issuerKeyBuffer=issuerCertificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex;return crypto.digest({name:parameters.hashAlgorithm},issuerKeyBuffer);},error=>Promise.reject(error)).then(result=>{this.issuerKeyHash=new asn1js.OctetString({valueHex:result});},error=>Promise.reject(error)); return sequence;}
}
exports.default=CertID;},{"./AlgorithmIdentifier.js":4,"./common.js":110,"asn1js":112,"pvutils":113}],19:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _Time=_interopRequireDefault(require("./Time.js"));var _PublicKeyInfo=_interopRequireDefault(require("./PublicKeyInfo.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function tbsCertificate(parameters={}){



const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"tbsCertificate",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({name:names.tbsCertificateVersion||"tbsCertificate.version"})
]}),new asn1js.Integer({name:names.tbsCertificateSerialNumber||"tbsCertificate.serialNumber"}),_AlgorithmIdentifier.default.schema(names.signature||{names:{blockName:"tbsCertificate.signature"}}),_RelativeDistinguishedNames.default.schema(names.issuer||{names:{blockName:"tbsCertificate.issuer"}}),new asn1js.Sequence({name:names.tbsCertificateValidity||"tbsCertificate.validity",value:[_Time.default.schema(names.notBefore||{names:{utcTimeName:"tbsCertificate.notBefore",generalTimeName:"tbsCertificate.notBefore"}}),_Time.default.schema(names.notAfter||{names:{utcTimeName:"tbsCertificate.notAfter",generalTimeName:"tbsCertificate.notAfter"}})]}),_RelativeDistinguishedNames.default.schema(names.subject||{names:{blockName:"tbsCertificate.subject"}}),_PublicKeyInfo.default.schema(names.subjectPublicKeyInfo||{names:{blockName:"tbsCertificate.subjectPublicKeyInfo"}}),new asn1js.Primitive({name:names.tbsCertificateIssuerUniqueID||"tbsCertificate.issuerUniqueID",optional:true,idBlock:{tagClass:3, tagNumber:1
}}), new asn1js.Primitive({name:names.tbsCertificateSubjectUniqueID||"tbsCertificate.subjectUniqueID",optional:true,idBlock:{tagClass:3, tagNumber:2
}}), new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:3
},value:[_Extensions.default.schema(names.extensions||{names:{blockName:"tbsCertificate.extensions"}})]})
]});}
class Certificate{constructor(parameters={}){ this.tbs=(0,_pvutils.getParametersValue)(parameters,"tbs",Certificate.defaultValues("tbs"));this.version=(0,_pvutils.getParametersValue)(parameters,"version",Certificate.defaultValues("version"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",Certificate.defaultValues("serialNumber"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",Certificate.defaultValues("signature"));this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",Certificate.defaultValues("issuer"));this.notBefore=(0,_pvutils.getParametersValue)(parameters,"notBefore",Certificate.defaultValues("notBefore"));this.notAfter=(0,_pvutils.getParametersValue)(parameters,"notAfter",Certificate.defaultValues("notAfter"));this.subject=(0,_pvutils.getParametersValue)(parameters,"subject",Certificate.defaultValues("subject"));this.subjectPublicKeyInfo=(0,_pvutils.getParametersValue)(parameters,"subjectPublicKeyInfo",Certificate.defaultValues("subjectPublicKeyInfo"));if("issuerUniqueID"in parameters)
this.issuerUniqueID=(0,_pvutils.getParametersValue)(parameters,"issuerUniqueID",Certificate.defaultValues("issuerUniqueID"));if("subjectUniqueID"in parameters)
this.subjectUniqueID=(0,_pvutils.getParametersValue)(parameters,"subjectUniqueID",Certificate.defaultValues("subjectUniqueID"));if("extensions"in parameters)
this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",Certificate.defaultValues("extensions"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",Certificate.defaultValues("signatureAlgorithm"));this.signatureValue=(0,_pvutils.getParametersValue)(parameters,"signatureValue",Certificate.defaultValues("signatureValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbs":return new ArrayBuffer(0);case"version":return 0;case"serialNumber":return new asn1js.Integer();case"signature":return new _AlgorithmIdentifier.default();case"issuer":return new _RelativeDistinguishedNames.default();case"notBefore":return new _Time.default();case"notAfter":return new _Time.default();case"subject":return new _RelativeDistinguishedNames.default();case"subjectPublicKeyInfo":return new _PublicKeyInfo.default();case"issuerUniqueID":return new ArrayBuffer(0);case"subjectUniqueID":return new ArrayBuffer(0);case"extensions":return[];case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signatureValue":return new asn1js.BitString();default:throw new Error(`Invalid member name for Certificate class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[tbsCertificate(names.tbsCertificate),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{names:{blockName:"signatureAlgorithm"}}),new asn1js.BitString({name:names.signatureValue||"signatureValue"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["tbsCertificate","tbsCertificate.extensions","tbsCertificate.version","tbsCertificate.serialNumber","tbsCertificate.signature","tbsCertificate.issuer","tbsCertificate.notBefore","tbsCertificate.notAfter","tbsCertificate.subject","tbsCertificate.subjectPublicKeyInfo","tbsCertificate.issuerUniqueID","tbsCertificate.subjectUniqueID","signatureAlgorithm","signatureValue"]);
 const asn1=asn1js.compareSchema(schema,schema,Certificate.schema({names:{tbsCertificate:{names:{extensions:{names:{extensions:"tbsCertificate.extensions"}}}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Certificate");
 this.tbs=asn1.result.tbsCertificate.valueBeforeDecode;if("tbsCertificate.version"in asn1.result)this.version=asn1.result["tbsCertificate.version"].valueBlock.valueDec;this.serialNumber=asn1.result["tbsCertificate.serialNumber"];this.signature=new _AlgorithmIdentifier.default({schema:asn1.result["tbsCertificate.signature"]});this.issuer=new _RelativeDistinguishedNames.default({schema:asn1.result["tbsCertificate.issuer"]});this.notBefore=new _Time.default({schema:asn1.result["tbsCertificate.notBefore"]});this.notAfter=new _Time.default({schema:asn1.result["tbsCertificate.notAfter"]});this.subject=new _RelativeDistinguishedNames.default({schema:asn1.result["tbsCertificate.subject"]});this.subjectPublicKeyInfo=new _PublicKeyInfo.default({schema:asn1.result["tbsCertificate.subjectPublicKeyInfo"]});if("tbsCertificate.issuerUniqueID"in asn1.result)this.issuerUniqueID=asn1.result["tbsCertificate.issuerUniqueID"].valueBlock.valueHex;if("tbsCertificate.subjectUniqueID"in asn1.result)this.subjectUniqueID=asn1.result["tbsCertificate.subjectUniqueID"].valueBlock.valueHex;if("tbsCertificate.extensions"in asn1.result)this.extensions=Array.from(asn1.result["tbsCertificate.extensions"],element=>new _Extension.default({schema:element}));this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signatureValue=asn1.result.signatureValue;}
encodeTBS(){ const outputArray=[];if("version"in this&&this.version!==Certificate.defaultValues("version")){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({value:this.version})
]}));}
outputArray.push(this.serialNumber);outputArray.push(this.signature.toSchema());outputArray.push(this.issuer.toSchema());outputArray.push(new asn1js.Sequence({value:[this.notBefore.toSchema(),this.notAfter.toSchema()]}));outputArray.push(this.subject.toSchema());outputArray.push(this.subjectPublicKeyInfo.toSchema());if("issuerUniqueID"in this){outputArray.push(new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:1
},valueHex:this.issuerUniqueID}));}
if("subjectUniqueID"in this){outputArray.push(new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:2
},valueHex:this.subjectUniqueID}));}
if("extensions"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:3
},value:[new asn1js.Sequence({value:Array.from(this.extensions,element=>element.toSchema())})]}));}
 
return new asn1js.Sequence({value:outputArray});}
toSchema(encodeFlag=false){let tbsSchema={}; if(encodeFlag===false){if(this.tbs.length===0) 
return Certificate.schema().value[0];tbsSchema=asn1js.fromBER(this.tbs).result;}
 
else tbsSchema=this.encodeTBS();
 return new asn1js.Sequence({value:[tbsSchema,this.signatureAlgorithm.toSchema(),this.signatureValue]});}
toJSON(){const object={tbs:(0,_pvutils.bufferToHexCodes)(this.tbs,0,this.tbs.byteLength),serialNumber:this.serialNumber.toJSON(),signature:this.signature.toJSON(),issuer:this.issuer.toJSON(),notBefore:this.notBefore.toJSON(),notAfter:this.notAfter.toJSON(),subject:this.subject.toJSON(),subjectPublicKeyInfo:this.subjectPublicKeyInfo.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signatureValue:this.signatureValue.toJSON()};if("version"in this&&this.version!==Certificate.defaultValues("version"))object.version=this.version;if("issuerUniqueID"in this)object.issuerUniqueID=(0,_pvutils.bufferToHexCodes)(this.issuerUniqueID,0,this.issuerUniqueID.byteLength);if("subjectUniqueID"in this)object.subjectUniqueID=(0,_pvutils.bufferToHexCodes)(this.subjectUniqueID,0,this.subjectUniqueID.byteLength);if("extensions"in this)object.extensions=Array.from(this.extensions,element=>element.toJSON());return object;}
getPublicKey(parameters=null){return(0,_common.getEngine)().subtle.getPublicKey(this.subjectPublicKeyInfo,this.signatureAlgorithm,parameters);}
getKeyHash(hashAlgorithm="SHA-1"){ const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object"); return crypto.digest({name:hashAlgorithm},new Uint8Array(this.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex));}
sign(privateKey,hashAlgorithm="SHA-1"){
 if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");

 let sequence=Promise.resolve();let parameters;const engine=(0,_common.getEngine)();
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.signature=result.signatureAlgorithm;this.signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{this.tbs=this.encodeTBS().toBER(false);});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(this.tbs,privateKey,parameters));sequence=sequence.then(result=>{this.signatureValue=new asn1js.BitString({valueHex:result});}); return sequence;}
verify(issuerCertificate=null){ let subjectPublicKeyInfo={};
 if(issuerCertificate!==null)subjectPublicKeyInfo=issuerCertificate.subjectPublicKeyInfo;else{if(this.issuer.isEqual(this.subject)) 
subjectPublicKeyInfo=this.subjectPublicKeyInfo;}
if(subjectPublicKeyInfo instanceof _PublicKeyInfo.default===false)return Promise.reject("Please provide issuer certificate as a parameter"); return(0,_common.getEngine)().subtle.verifyWithPublicKey(this.tbs,this.signatureValue,subjectPublicKeyInfo,this.signatureAlgorithm);}
}
exports.default=Certificate;},{"./AlgorithmIdentifier.js":4,"./Extension.js":38,"./Extensions.js":39,"./PublicKeyInfo.js":78,"./RelativeDistinguishedNames.js":89,"./Time.js":107,"./common.js":110,"asn1js":112,"pvutils":113}],20:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var _pvutils=require("pvutils");var _common=require("./common.js");function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg);var value=info.value;}catch(error){reject(error);return;}if(info.done){resolve(value);}else{Promise.resolve(value).then(_next,_throw);}}
function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise(function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"next",value);}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"throw",err);}_next(undefined);});};}
class CertificateChainValidationEngine{constructor(parameters={}){ this.trustedCerts=(0,_pvutils.getParametersValue)(parameters,"trustedCerts",this.defaultValues("trustedCerts"));this.certs=(0,_pvutils.getParametersValue)(parameters,"certs",this.defaultValues("certs"));this.crls=(0,_pvutils.getParametersValue)(parameters,"crls",this.defaultValues("crls"));this.ocsps=(0,_pvutils.getParametersValue)(parameters,"ocsps",this.defaultValues("ocsps"));this.checkDate=(0,_pvutils.getParametersValue)(parameters,"checkDate",this.defaultValues("checkDate"));this.findOrigin=(0,_pvutils.getParametersValue)(parameters,"findOrigin",this.defaultValues("findOrigin"));this.findIssuer=(0,_pvutils.getParametersValue)(parameters,"findIssuer",this.defaultValues("findIssuer"));}
static defaultFindOrigin(certificate,validationEngine){ if(certificate.tbs.byteLength===0)certificate.tbs=certificate.encodeTBS();
 var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=validationEngine.certs[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const localCert=_step.value; if(localCert.tbs.byteLength===0)localCert.tbs=localCert.encodeTBS(); if((0,_pvutils.isEqualBuffer)(certificate.tbs,localCert.tbs))return"Intermediate Certificates";}

}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=validationEngine.trustedCerts[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const trustedCert=_step2.value; if(trustedCert.tbs.byteLength===0)trustedCert.tbs=trustedCert.encodeTBS(); if((0,_pvutils.isEqualBuffer)(certificate.tbs,trustedCert.tbs))return"Trusted Certificates";}
}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}
return"Unknown";}
defaultFindIssuer(certificate,validationEngine){return _asyncToGenerator(function*(){ let result=[];let keyIdentifier=null;let authorityCertIssuer=null;let authorityCertSerialNumber=null;
 if(certificate.subject.isEqual(certificate.issuer)){try{const verificationResult=yield certificate.verify();if(verificationResult===true)return[certificate];}catch(ex){}}
 
if("extensions"in certificate){var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=certificate.extensions[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const extension=_step3.value;if(extension.extnID==="2.5.29.35")
{if("keyIdentifier"in extension.parsedValue)keyIdentifier=extension.parsedValue.keyIdentifier;else{if("authorityCertIssuer"in extension.parsedValue)authorityCertIssuer=extension.parsedValue.authorityCertIssuer;if("authorityCertSerialNumber"in extension.parsedValue)authorityCertSerialNumber=extension.parsedValue.authorityCertSerialNumber;}
break;}}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return!=null){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}}
 
function checkCertificate(possibleIssuer){ if(keyIdentifier!==null){if("extensions"in possibleIssuer){let extensionFound=false;var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=possibleIssuer.extensions[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){const extension=_step4.value;if(extension.extnID==="2.5.29.14")
{extensionFound=true;if((0,_pvutils.isEqualBuffer)(extension.parsedValue.valueBlock.valueHex,keyIdentifier.valueBlock.valueHex))result.push(possibleIssuer);break;}}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return!=null){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}
if(extensionFound)return;}}
 
let authorityCertSerialNumberEqual=false;if(authorityCertSerialNumber!==null)authorityCertSerialNumberEqual=possibleIssuer.serialNumber.isEqual(authorityCertSerialNumber);
 if(authorityCertIssuer!==null){if(possibleIssuer.subject.isEqual(authorityCertIssuer)){if(authorityCertSerialNumberEqual)result.push(possibleIssuer);}}else{if(certificate.issuer.isEqual(possibleIssuer.subject))result.push(possibleIssuer);}
}
 
var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=validationEngine.trustedCerts[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){const trustedCert=_step5.value;checkCertificate(trustedCert);}

}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return!=null){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}
var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=validationEngine.certs[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){const intermediateCert=_step6.value;checkCertificate(intermediateCert);}

}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return!=null){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}
for(let i=0;i<result.length;i++){try{const verificationResult=yield certificate.verify(result[i]);if(verificationResult===false)result.splice(i,1);}catch(ex){result.splice(i,1);}} 
return result;})();}
defaultValues(memberName){switch(memberName){case"trustedCerts":return[];case"certs":return[];case"crls":return[];case"ocsps":return[];case"checkDate":return new Date();case"findOrigin":return CertificateChainValidationEngine.defaultFindOrigin;case"findIssuer":return this.defaultFindIssuer;default:throw new Error(`Invalid member name for CertificateChainValidationEngine class: ${memberName}`);}}
sort(passedWhenNotRevValues=false){var _this2=this;return _asyncToGenerator(function*(){ const localCerts=[];const _this=_this2;
 function buildPath(_x){return _buildPath.apply(this,arguments);}
 
function _buildPath(){_buildPath=_asyncToGenerator(function*(certificate){const result=[]; function checkUnique(array){let unique=true;for(let i=0;i<array.length;i++){for(let j=0;j<array.length;j++){if(j===i)continue;if(array[i]===array[j]){unique=false;break;}}
if(!unique)break;}
return unique;} 
const findIssuerResult=yield _this.findIssuer(certificate,_this);if(findIssuerResult.length===0)throw new Error("No valid certificate paths found");for(let i=0;i<findIssuerResult.length;i++){if((0,_pvutils.isEqualBuffer)(findIssuerResult[i].tbs,certificate.tbs)){result.push([findIssuerResult[i]]);continue;}
const buildPathResult=yield buildPath(findIssuerResult[i]);for(let j=0;j<buildPathResult.length;j++){const copy=buildPathResult[j].slice();copy.splice(0,0,findIssuerResult[i]);if(checkUnique(copy))result.push(copy);else result.push(buildPathResult[j]);}}
return result;});return _buildPath.apply(this,arguments);}
function findCRL(_x2){return _findCRL.apply(this,arguments);}
 
function _findCRL(){_findCRL=_asyncToGenerator(function*(certificate){ const issuerCertificates=[];const crls=[];const crlsAndCertificates=[];
 issuerCertificates.push(...localCerts.filter(element=>certificate.issuer.isEqual(element.subject)));if(issuerCertificates.length===0){return{status:1,statusMessage:"No certificate's issuers"};}
 
crls.push(..._this.crls.filter(element=>element.issuer.isEqual(certificate.issuer)));if(crls.length===0){return{status:2,statusMessage:"No CRLs for specific certificate issuer"};}
 
for(let i=0;i<crls.length;i++){
if(crls[i].nextUpdate.value<_this.checkDate)continue; for(let j=0;j<issuerCertificates.length;j++){try{const result=yield crls[i].verify({issuerCertificate:issuerCertificates[j]});if(result){crlsAndCertificates.push({crl:crls[i],certificate:issuerCertificates[j]});break;}}catch(ex){}}} 
if(crlsAndCertificates.length){return{status:0,statusMessage:"",result:crlsAndCertificates};}
return{status:3,statusMessage:"No valid CRLs found"};});return _findCRL.apply(this,arguments);}
function findOCSP(_x3,_x4){return _findOCSP.apply(this,arguments);}
 
function _findOCSP(){_findOCSP=_asyncToGenerator(function*(certificate,issuerCertificate){ const hashAlgorithm=(0,_common.getAlgorithmByOID)(certificate.signatureAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return 1;if("hash"in hashAlgorithm===false)return 1;
 for(let i=0;i<_this.ocsps.length;i++){const result=yield _this.ocsps[i].getCertificateStatus(certificate,issuerCertificate);if(result.isForCertificate){if(result.status===0)return 0;return 1;}} 
return 2;});return _findOCSP.apply(this,arguments);}
function checkForCA(_x5){return _checkForCA.apply(this,arguments);}
 
function _checkForCA(){_checkForCA=_asyncToGenerator(function*(certificate,needToCheckCRL=false){ let isCA=false;let mustBeCA=false;let keyUsagePresent=false;let cRLSign=false; if("extensions"in certificate){for(let j=0;j<certificate.extensions.length;j++){if(certificate.extensions[j].critical===true&&"parsedValue"in certificate.extensions[j]===false){return{result:false,resultCode:6,resultMessage:`Unable to parse critical certificate extension: ${certificate.extensions[j].extnID}`};}
if(certificate.extensions[j].extnID==="2.5.29.15")
{keyUsagePresent=true;const view=new Uint8Array(certificate.extensions[j].parsedValue.valueBlock.valueHex);if((view[0]&0x04)===0x04)
mustBeCA=true;if((view[0]&0x02)===0x02)
cRLSign=true;}
if(certificate.extensions[j].extnID==="2.5.29.19")
{if("cA"in certificate.extensions[j].parsedValue){if(certificate.extensions[j].parsedValue.cA===true)isCA=true;}}}
if(mustBeCA===true&&isCA===false){return{result:false,resultCode:3,resultMessage:"Unable to build certificate chain - using \"keyCertSign\" flag set without BasicConstaints"};}
if(keyUsagePresent===true&&isCA===true&&mustBeCA===false){return{result:false,resultCode:4,resultMessage:"Unable to build certificate chain - \"keyCertSign\" flag was not set"};} 
if(isCA===true&&keyUsagePresent===true&&needToCheckCRL&&cRLSign===false){return{result:false,resultCode:5,resultMessage:"Unable to build certificate chain - intermediate certificate must have \"cRLSign\" key usage flag"};}}
if(isCA===false){return{result:false,resultCode:7,resultMessage:"Unable to build certificate chain - more than one possible end-user certificate"};}
return{result:true,resultCode:0,resultMessage:""};});return _checkForCA.apply(this,arguments);}
function basicCheck(_x6,_x7){return _basicCheck.apply(this,arguments);}

 
function _basicCheck(){_basicCheck=_asyncToGenerator(function*(path,checkDate){ for(let i=0;i<path.length;i++){if(path[i].notBefore.value>checkDate||path[i].notAfter.value<checkDate){return{result:false,resultCode:8,resultMessage:"The certificate is either not yet valid or expired"};}}

 
if(path.length<2){return{result:false,resultCode:9,resultMessage:"Too short certificate path"};}
for(let i=path.length-2;i>=0;i--){ if(path[i].issuer.isEqual(path[i].subject)===false){if(path[i].issuer.isEqual(path[i+1].subject)===false){return{result:false,resultCode:10,resultMessage:"Incorrect name chaining"};}}
}
 
if(_this.crls.length!==0||_this.ocsps.length!==0)
{for(let i=0;i<path.length-1;i++){ let ocspResult=2;let crlResult={status:0,statusMessage:""};
 if(_this.ocsps.length!==0){ocspResult=yield findOCSP(path[i],path[i+1]);switch(ocspResult){case 0:continue;case 1:return{result:false,resultCode:12,resultMessage:"One of certificates was revoked via OCSP response"};case 2: break;default:}}
 
if(_this.crls.length!==0){crlResult=yield findCRL(path[i]);if(crlResult.status===0){for(let j=0;j<crlResult.result.length;j++){ const isCertificateRevoked=crlResult.result[j].crl.isCertificateRevoked(path[i]);if(isCertificateRevoked){return{result:false,resultCode:12,resultMessage:"One of certificates had been revoked"};}
 
const isCertificateCA=yield checkForCA(crlResult.result[j].certificate,true);if(isCertificateCA.result===false){return{result:false,resultCode:13,resultMessage:"CRL issuer certificate is not a CA certificate or does not have crlSign flag"};}
}}else{if(passedWhenNotRevValues===false){throw{result:false,resultCode:11,resultMessage:`No revocation values found for one of certificates: ${crlResult.statusMessage}`};}}}else{if(ocspResult===2){return{result:false,resultCode:11,resultMessage:"No revocation values found for one of certificates"};}}
 
if(ocspResult===2&&crlResult.status===2&&passedWhenNotRevValues){const issuerCertificate=path[i+1];let extensionFound=false;if("extensions"in issuerCertificate){var _iteratorNormalCompletion7=true;var _didIteratorError7=false;var _iteratorError7=undefined;try{for(var _iterator7=issuerCertificate.extensions[Symbol.iterator](),_step7;!(_iteratorNormalCompletion7=(_step7=_iterator7.next()).done);_iteratorNormalCompletion7=true){const extension=_step7.value;switch(extension.extnID){case"2.5.29.31": case"2.5.29.46": case"1.3.6.1.5.5.7.1.1": extensionFound=true;break;default:}}}catch(err){_didIteratorError7=true;_iteratorError7=err;}finally{try{if(!_iteratorNormalCompletion7&&_iterator7.return!=null){_iterator7.return();}}finally{if(_didIteratorError7){throw _iteratorError7;}}}}
if(extensionFound){throw{result:false,resultCode:11,resultMessage:`No revocation values found for one of certificates: ${crlResult.statusMessage}`};}}
}}
 
for(let i=1;i<path.length;i++){const result=yield checkForCA(path[i]);if(result.result===false){return{result:false,resultCode:14,resultMessage:"One of intermediate certificates is not a CA certificate"};}} 
return{result:true};});return _basicCheck.apply(this,arguments);}
localCerts.push(..._this.trustedCerts);localCerts.push(..._this.certs);
 for(let i=0;i<localCerts.length;i++){for(let j=0;j<localCerts.length;j++){if(i===j)continue;if((0,_pvutils.isEqualBuffer)(localCerts[i].tbs,localCerts[j].tbs)){localCerts.splice(j,1);i=0;break;}}}
 
let result;const certificatePath=[localCerts[localCerts.length-1]];

 result=yield buildPath(localCerts[localCerts.length-1]);if(result.length===0){return{result:false,resultCode:60,resultMessage:"Unable to find certificate path"};}

for(let i=0;i<result.length;i++){let found=false;for(let j=0;j<result[i].length;j++){const certificate=result[i][j];for(let k=0;k<_this.trustedCerts.length;k++){if((0,_pvutils.isEqualBuffer)(certificate.tbs,_this.trustedCerts[k].tbs)){found=true;break;}}
if(found)break;}
if(!found){result.splice(i,1);i=0;}}
if(result.length===0){throw{result:false,resultCode:97,resultMessage:"No valid certificate paths found"};}

let shortestLength=result[0].length;let shortestIndex=0;for(let i=0;i<result.length;i++){if(result[i].length<shortestLength){shortestLength=result[i].length;shortestIndex=i;}}
 
for(let i=0;i<result[shortestIndex].length;i++)certificatePath.push(result[shortestIndex][i]);
 result=yield basicCheck(certificatePath,_this.checkDate);if(result.result===false)throw result; return certificatePath;})();}
verify(parameters={}){var _this3=this;return _asyncToGenerator(function*(){ function compareDNSName(name,constraint){ const namePrepared=(0,_common.stringPrep)(name);const constraintPrepared=(0,_common.stringPrep)(constraint);
const nameSplitted=namePrepared.split(".");const constraintSplitted=constraintPrepared.split(".");
 const nameLen=nameSplitted.length;const constrLen=constraintSplitted.length;if(nameLen===0||constrLen===0||nameLen<constrLen)return false;
 for(let i=0;i<nameLen;i++){if(nameSplitted[i].length===0)return false;}
 
for(let i=0;i<constrLen;i++){if(constraintSplitted[i].length===0){if(i===0){if(constrLen===1)return false;continue;}
return false;}}

for(let i=0;i<constrLen;i++){if(constraintSplitted[constrLen-1-i].length===0)continue;if(nameSplitted[nameLen-1-i].localeCompare(constraintSplitted[constrLen-1-i])!==0)return false;} 
return true;}
function compareRFC822Name(name,constraint){ const namePrepared=(0,_common.stringPrep)(name);const constraintPrepared=(0,_common.stringPrep)(constraint);
const nameSplitted=namePrepared.split("@");const constraintSplitted=constraintPrepared.split("@");
 if(nameSplitted.length===0||constraintSplitted.length===0||nameSplitted.length<constraintSplitted.length)return false; if(constraintSplitted.length===1){const result=compareDNSName(nameSplitted[1],constraintSplitted[0]);if(result){const ns=nameSplitted[1].split(".");const cs=constraintSplitted[0].split("."); if(cs[0].length===0)return true;return ns.length===cs.length;}
return false;}
return namePrepared.localeCompare(constraintPrepared)===0;}
function compareUniformResourceIdentifier(name,constraint){ let namePrepared=(0,_common.stringPrep)(name);const constraintPrepared=(0,_common.stringPrep)(constraint);
 const ns=namePrepared.split("/");const cs=constraintPrepared.split("/");if(cs.length>1) 
return false;if(ns.length>1)
{for(let i=0;i<ns.length;i++){if(ns[i].length>0&&ns[i].charAt(ns[i].length-1)!==":"){const nsPort=ns[i].split(":");namePrepared=nsPort[0];break;}}} 
const result=compareDNSName(namePrepared,constraintPrepared);if(result){const nameSplitted=namePrepared.split(".");const constraintSplitted=constraintPrepared.split("."); if(constraintSplitted[0].length===0)return true;return nameSplitted.length===constraintSplitted.length;}
return false;}
function compareIPAddress(name,constraint){ const nameView=new Uint8Array(name.valueBlock.valueHex);const constraintView=new Uint8Array(constraint.valueBlock.valueHex);
 if(nameView.length===4&&constraintView.length===8){for(let i=0;i<4;i++){if((nameView[i]^constraintView[i])&constraintView[i+4])return false;}
return true;}
 
if(nameView.length===16&&constraintView.length===32){for(let i=0;i<16;i++){if((nameView[i]^constraintView[i])&constraintView[i+16])return false;}
return true;} 
return false;}
function compareDirectoryName(name,constraint){ if(name.typesAndValues.length===0||constraint.typesAndValues.length===0)return true;if(name.typesAndValues.length<constraint.typesAndValues.length)return false;
 let result=true;let nameStart=0; for(let i=0;i<constraint.typesAndValues.length;i++){let localResult=false;for(let j=nameStart;j<name.typesAndValues.length;j++){localResult=name.typesAndValues[j].isEqual(constraint.typesAndValues[i]);if(name.typesAndValues[j].type===constraint.typesAndValues[i].type)result=result&&localResult;if(localResult===true){if(nameStart===0||nameStart===j){nameStart=j+1;break;}else
return false;}}
if(localResult===false)return false;}
return nameStart===0?false:result;} 
try{ if(_this3.certs.length===0)throw"Empty certificate array";
 let passedWhenNotRevValues=false;if("passedWhenNotRevValues"in parameters)passedWhenNotRevValues=parameters.passedWhenNotRevValues;let initialPolicySet=[];initialPolicySet.push("2.5.29.32.0");let initialExplicitPolicy=false;let initialPolicyMappingInhibit=false;let initialInhibitPolicy=false;let initialPermittedSubtreesSet=[];let initialExcludedSubtreesSet=[];let initialRequiredNameForms=[];if("initialPolicySet"in parameters)initialPolicySet=parameters.initialPolicySet;if("initialExplicitPolicy"in parameters)initialExplicitPolicy=parameters.initialExplicitPolicy;if("initialPolicyMappingInhibit"in parameters)initialPolicyMappingInhibit=parameters.initialPolicyMappingInhibit;if("initialInhibitPolicy"in parameters)initialInhibitPolicy=parameters.initialInhibitPolicy;if("initialPermittedSubtreesSet"in parameters)initialPermittedSubtreesSet=parameters.initialPermittedSubtreesSet;if("initialExcludedSubtreesSet"in parameters)initialExcludedSubtreesSet=parameters.initialExcludedSubtreesSet;if("initialRequiredNameForms"in parameters)initialRequiredNameForms=parameters.initialRequiredNameForms;let explicitPolicyIndicator=initialExplicitPolicy;let policyMappingInhibitIndicator=initialPolicyMappingInhibit;let inhibitAnyPolicyIndicator=initialInhibitPolicy;const pendingConstraints=new Array(3);pendingConstraints[0]=false;pendingConstraints[1]=false;pendingConstraints[2]=false;let explicitPolicyPending=0;let policyMappingInhibitPending=0;let inhibitAnyPolicyPending=0;let permittedSubtrees=initialPermittedSubtreesSet;let excludedSubtrees=initialExcludedSubtreesSet;const requiredNameForms=initialRequiredNameForms;let pathDepth=1;
 _this3.certs=yield _this3.sort(passedWhenNotRevValues);

 const allPolicies=[];allPolicies.push("2.5.29.32.0"); const policiesAndCerts=[];const anyPolicyArray=new Array(_this3.certs.length-1);for(let ii=0;ii<_this3.certs.length-1;ii++)anyPolicyArray[ii]=true;policiesAndCerts.push(anyPolicyArray);const policyMappings=new Array(_this3.certs.length-1); const certPolicies=new Array(_this3.certs.length-1); let explicitPolicyStart=explicitPolicyIndicator?_this3.certs.length-1:-1;
 for(let i=_this3.certs.length-2;i>=0;i--,pathDepth++){if("extensions"in _this3.certs[i]){ for(let j=0;j<_this3.certs[i].extensions.length;j++){ if(_this3.certs[i].extensions[j].extnID==="2.5.29.32"){certPolicies[i]=_this3.certs[i].extensions[j].parsedValue; for(let s=0;s<allPolicies.length;s++){if(allPolicies[s]==="2.5.29.32.0"){delete policiesAndCerts[s][i];break;}} 
for(let k=0;k<_this3.certs[i].extensions[j].parsedValue.certificatePolicies.length;k++){let policyIndex=-1; for(let s=0;s<allPolicies.length;s++){if(_this3.certs[i].extensions[j].parsedValue.certificatePolicies[k].policyIdentifier===allPolicies[s]){policyIndex=s;break;}} 
if(policyIndex===-1){allPolicies.push(_this3.certs[i].extensions[j].parsedValue.certificatePolicies[k].policyIdentifier);const certArray=new Array(_this3.certs.length-1);certArray[i]=true;policiesAndCerts.push(certArray);}else policiesAndCerts[policyIndex][i]=true;}}
 
if(_this3.certs[i].extensions[j].extnID==="2.5.29.33"){if(policyMappingInhibitIndicator){return{result:false,resultCode:98,resultMessage:"Policy mapping prohibited"};}
policyMappings[i]=_this3.certs[i].extensions[j].parsedValue;}
 
if(_this3.certs[i].extensions[j].extnID==="2.5.29.36"){if(explicitPolicyIndicator===false){ if(_this3.certs[i].extensions[j].parsedValue.requireExplicitPolicy===0){explicitPolicyIndicator=true;explicitPolicyStart=i;}else{if(pendingConstraints[0]===false){pendingConstraints[0]=true;explicitPolicyPending=_this3.certs[i].extensions[j].parsedValue.requireExplicitPolicy;}else explicitPolicyPending=explicitPolicyPending>_this3.certs[i].extensions[j].parsedValue.requireExplicitPolicy?_this3.certs[i].extensions[j].parsedValue.requireExplicitPolicy:explicitPolicyPending;}
 
if(_this3.certs[i].extensions[j].parsedValue.inhibitPolicyMapping===0)policyMappingInhibitIndicator=true;else{if(pendingConstraints[1]===false){pendingConstraints[1]=true;policyMappingInhibitPending=_this3.certs[i].extensions[j].parsedValue.inhibitPolicyMapping+1;}else policyMappingInhibitPending=policyMappingInhibitPending>_this3.certs[i].extensions[j].parsedValue.inhibitPolicyMapping+1?_this3.certs[i].extensions[j].parsedValue.inhibitPolicyMapping+1:policyMappingInhibitPending;}
}}
 
if(_this3.certs[i].extensions[j].extnID==="2.5.29.54"){if(inhibitAnyPolicyIndicator===false){if(_this3.certs[i].extensions[j].parsedValue.valueBlock.valueDec===0)inhibitAnyPolicyIndicator=true;else{if(pendingConstraints[2]===false){pendingConstraints[2]=true;inhibitAnyPolicyPending=_this3.certs[i].extensions[j].parsedValue.valueBlock.valueDec;}else inhibitAnyPolicyPending=inhibitAnyPolicyPending>_this3.certs[i].extensions[j].parsedValue.valueBlock.valueDec?_this3.certs[i].extensions[j].parsedValue.valueBlock.valueDec:inhibitAnyPolicyPending;}}}
}

if(inhibitAnyPolicyIndicator===true){let policyIndex=-1; for(let searchAnyPolicy=0;searchAnyPolicy<allPolicies.length;searchAnyPolicy++){if(allPolicies[searchAnyPolicy]==="2.5.29.32.0"){policyIndex=searchAnyPolicy;break;}} 
if(policyIndex!==-1)delete policiesAndCerts[0][i];}

if(explicitPolicyIndicator===false){if(pendingConstraints[0]===true){explicitPolicyPending--;if(explicitPolicyPending===0){explicitPolicyIndicator=true;explicitPolicyStart=i;pendingConstraints[0]=false;}}}
if(policyMappingInhibitIndicator===false){if(pendingConstraints[1]===true){policyMappingInhibitPending--;if(policyMappingInhibitPending===0){policyMappingInhibitIndicator=true;pendingConstraints[1]=false;}}}
if(inhibitAnyPolicyIndicator===false){if(pendingConstraints[2]===true){inhibitAnyPolicyPending--;if(inhibitAnyPolicyPending===0){inhibitAnyPolicyIndicator=true;pendingConstraints[2]=false;}}}
}}
 
for(let i=0;i<_this3.certs.length-1;i++){if(i<_this3.certs.length-2&&typeof policyMappings[i+1]!=="undefined"){for(let k=0;k<policyMappings[i+1].mappings.length;k++){ if(policyMappings[i+1].mappings[k].issuerDomainPolicy==="2.5.29.32.0"||policyMappings[i+1].mappings[k].subjectDomainPolicy==="2.5.29.32.0"){return{result:false,resultCode:99,resultMessage:"The \"anyPolicy\" should not be a part of policy mapping scheme"};}
 
let issuerDomainPolicyIndex=-1;let subjectDomainPolicyIndex=-1;
 for(let n=0;n<allPolicies.length;n++){if(allPolicies[n]===policyMappings[i+1].mappings[k].issuerDomainPolicy)issuerDomainPolicyIndex=n;if(allPolicies[n]===policyMappings[i+1].mappings[k].subjectDomainPolicy)subjectDomainPolicyIndex=n;}
 
if(typeof policiesAndCerts[issuerDomainPolicyIndex][i]!=="undefined")delete policiesAndCerts[issuerDomainPolicyIndex][i];
 for(let j=0;j<certPolicies[i].certificatePolicies.length;j++){if(policyMappings[i+1].mappings[k].subjectDomainPolicy===certPolicies[i].certificatePolicies[j].policyIdentifier){ if(issuerDomainPolicyIndex!==-1&&subjectDomainPolicyIndex!==-1){for(let m=0;m<=i;m++){if(typeof policiesAndCerts[subjectDomainPolicyIndex][m]!=="undefined"){policiesAndCerts[issuerDomainPolicyIndex][m]=true;delete policiesAndCerts[subjectDomainPolicyIndex][m];}}}
}}
}}
}

for(let i=0;i<allPolicies.length;i++){if(allPolicies[i]==="2.5.29.32.0"){for(let j=0;j<explicitPolicyStart;j++)delete policiesAndCerts[i][j];}}

const authConstrPolicies=[];for(let i=0;i<policiesAndCerts.length;i++){let found=true;for(let j=0;j<_this3.certs.length-1;j++){let anyPolicyFound=false;if(j<explicitPolicyStart&&allPolicies[i]==="2.5.29.32.0"&&allPolicies.length>1){found=false;break;}
if(typeof policiesAndCerts[i][j]==="undefined"){if(j>=explicitPolicyStart){ for(let k=0;k<allPolicies.length;k++){if(allPolicies[k]==="2.5.29.32.0"){if(policiesAndCerts[k][j]===true)anyPolicyFound=true;break;}}
}
if(!anyPolicyFound){found=false;break;}}}
if(found===true)authConstrPolicies.push(allPolicies[i]);}

let userConstrPolicies=[];if(initialPolicySet.length===1&&initialPolicySet[0]==="2.5.29.32.0"&&explicitPolicyIndicator===false)userConstrPolicies=initialPolicySet;else{if(authConstrPolicies.length===1&&authConstrPolicies[0]==="2.5.29.32.0")userConstrPolicies=initialPolicySet;else{for(let i=0;i<authConstrPolicies.length;i++){for(let j=0;j<initialPolicySet.length;j++){if(initialPolicySet[j]===authConstrPolicies[i]||initialPolicySet[j]==="2.5.29.32.0"){userConstrPolicies.push(authConstrPolicies[i]);break;}}}}}
 
const policyResult={result:userConstrPolicies.length>0,resultCode:0,resultMessage:userConstrPolicies.length>0?"":"Zero \"userConstrPolicies\" array, no intersections with \"authConstrPolicies\"",authConstrPolicies,userConstrPolicies,explicitPolicyIndicator,policyMappings,certificatePath:_this3.certs};if(userConstrPolicies.length===0)return policyResult;


 if(policyResult.result===false)return policyResult;
pathDepth=1;for(let i=_this3.certs.length-2;i>=0;i--,pathDepth++){ let subjectAltNames=[];let certPermittedSubtrees=[];let certExcludedSubtrees=[]; if("extensions"in _this3.certs[i]){for(let j=0;j<_this3.certs[i].extensions.length;j++){ if(_this3.certs[i].extensions[j].extnID==="2.5.29.30"){if("permittedSubtrees"in _this3.certs[i].extensions[j].parsedValue)certPermittedSubtrees=certPermittedSubtrees.concat(_this3.certs[i].extensions[j].parsedValue.permittedSubtrees);if("excludedSubtrees"in _this3.certs[i].extensions[j].parsedValue)certExcludedSubtrees=certExcludedSubtrees.concat(_this3.certs[i].extensions[j].parsedValue.excludedSubtrees);}
 
if(_this3.certs[i].extensions[j].extnID==="2.5.29.17")subjectAltNames=subjectAltNames.concat(_this3.certs[i].extensions[j].parsedValue.altNames);}}
let formFound=requiredNameForms.length<=0;for(let j=0;j<requiredNameForms.length;j++){switch(requiredNameForms[j].base.type){case 4:{if(requiredNameForms[j].base.value.typesAndValues.length!==_this3.certs[i].subject.typesAndValues.length)continue;formFound=true;for(let k=0;k<_this3.certs[i].subject.typesAndValues.length;k++){if(_this3.certs[i].subject.typesAndValues[k].type!==requiredNameForms[j].base.value.typesAndValues[k].type){formFound=false;break;}}
if(formFound===true)break;}
break;default:}}
if(formFound===false){policyResult.result=false;policyResult.resultCode=21;policyResult.resultMessage="No neccessary name form found";throw policyResult;}
 
const constrGroups=[]; constrGroups[0]=[]; constrGroups[1]=[]; constrGroups[2]=[]; constrGroups[3]=[]; constrGroups[4]=[]; for(let j=0;j<permittedSubtrees.length;j++){switch(permittedSubtrees[j].base.type){ case 1:constrGroups[0].push(permittedSubtrees[j]);break;
 case 2:constrGroups[1].push(permittedSubtrees[j]);break;
 case 4:constrGroups[2].push(permittedSubtrees[j]);break;
 case 6:constrGroups[3].push(permittedSubtrees[j]);break;
 case 7:constrGroups[4].push(permittedSubtrees[j]);break;
 default:}}
 
for(let p=0;p<5;p++){let groupPermitted=false;let valueExists=false;const group=constrGroups[p];for(let j=0;j<group.length;j++){switch(p){ case 0:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===1)
{valueExists=true;groupPermitted=groupPermitted||compareRFC822Name(subjectAltNames[k].value,group[j].base.value);}}}else
{for(let k=0;k<_this3.certs[i].subject.typesAndValues.length;k++){if(_this3.certs[i].subject.typesAndValues[k].type==="1.2.840.113549.1.9.1"|| _this3.certs[i].subject.typesAndValues[k].type==="0.9.2342.19200300.100.1.3")
{valueExists=true;groupPermitted=groupPermitted||compareRFC822Name(_this3.certs[i].subject.typesAndValues[k].value.valueBlock.value,group[j].base.value);}}}
break;
 case 1:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===2)
{valueExists=true;groupPermitted=groupPermitted||compareDNSName(subjectAltNames[k].value,group[j].base.value);}}}
break;
 case 2:valueExists=true;groupPermitted=compareDirectoryName(_this3.certs[i].subject,group[j].base.value);break;
 case 3:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===6)
{valueExists=true;groupPermitted=groupPermitted||compareUniformResourceIdentifier(subjectAltNames[k].value,group[j].base.value);}}}
break;
 case 4:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===7)
{valueExists=true;groupPermitted=groupPermitted||compareIPAddress(subjectAltNames[k].value,group[j].base.value);}}}
break;
 default:}
if(groupPermitted)break;}
if(groupPermitted===false&&group.length>0&&valueExists){policyResult.result=false;policyResult.resultCode=41;policyResult.resultMessage="Failed to meet \"permitted sub-trees\" name constraint";throw policyResult;}}


let excluded=false;for(let j=0;j<excludedSubtrees.length;j++){switch(excludedSubtrees[j].base.type){ case 1:if(subjectAltNames.length>=0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===1) 
excluded=excluded||compareRFC822Name(subjectAltNames[k].value,excludedSubtrees[j].base.value);}}else
{for(let k=0;k<_this3.certs[i].subject.typesAndValues.length;k++){if(_this3.certs[i].subject.typesAndValues[k].type==="1.2.840.113549.1.9.1"|| _this3.certs[i].subject.typesAndValues[k].type==="0.9.2342.19200300.100.1.3") 
excluded=excluded||compareRFC822Name(_this3.certs[i].subject.typesAndValues[k].value.valueBlock.value,excludedSubtrees[j].base.value);}}
break;
 case 2:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===2) 
excluded=excluded||compareDNSName(subjectAltNames[k].value,excludedSubtrees[j].base.value);}}
break;
 case 4:excluded=excluded||compareDirectoryName(_this3.certs[i].subject,excludedSubtrees[j].base.value);break;
 case 6:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===6) 
excluded=excluded||compareUniformResourceIdentifier(subjectAltNames[k].value,excludedSubtrees[j].base.value);}}
break;
 case 7:if(subjectAltNames.length>0){for(let k=0;k<subjectAltNames.length;k++){if(subjectAltNames[k].type===7) 
excluded=excluded||compareIPAddress(subjectAltNames[k].value,excludedSubtrees[j].base.value);}}
break;
 default:}
if(excluded)break;}
if(excluded===true){policyResult.result=false;policyResult.resultCode=42;policyResult.resultMessage="Failed to meet \"excluded sub-trees\" name constraint";throw policyResult;}

permittedSubtrees=permittedSubtrees.concat(certPermittedSubtrees);excludedSubtrees=excludedSubtrees.concat(certExcludedSubtrees);} 
return policyResult;}catch(error){if(error instanceof Object){if("resultMessage"in error)return error;if("message"in error){return{result:false,resultCode:-1,resultMessage:error.message};}}
return{result:false,resultCode:-1,resultMessage:error};}})();}
}
exports.default=CertificateChainValidationEngine;},{"./common.js":110,"pvutils":113}],21:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _PolicyInformation=_interopRequireDefault(require("./PolicyInformation.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CertificatePolicies{constructor(parameters={}){ this.certificatePolicies=(0,_pvutils.getParametersValue)(parameters,"certificatePolicies",CertificatePolicies.defaultValues("certificatePolicies"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certificatePolicies":return[];default:throw new Error(`Invalid member name for CertificatePolicies class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.certificatePolicies||"",value:_PolicyInformation.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["certificatePolicies"]);
 const asn1=asn1js.compareSchema(schema,schema,CertificatePolicies.schema({names:{certificatePolicies:"certificatePolicies"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertificatePolicies");
 this.certificatePolicies=Array.from(asn1.result.certificatePolicies,element=>new _PolicyInformation.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.certificatePolicies,element=>element.toSchema())});}
toJSON(){return{certificatePolicies:Array.from(this.certificatePolicies,element=>element.toJSON())};}
}
exports.default=CertificatePolicies;},{"./PolicyInformation.js":72,"asn1js":112,"pvutils":113}],22:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _Time=_interopRequireDefault(require("./Time.js"));var _RevokedCertificate=_interopRequireDefault(require("./RevokedCertificate.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function tbsCertList(parameters={}){




const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"tbsCertList",value:[new asn1js.Integer({optional:true,name:names.tbsCertListVersion||"tbsCertList.version",value:2}),_AlgorithmIdentifier.default.schema(names.signature||{names:{blockName:"tbsCertList.signature"}}),_RelativeDistinguishedNames.default.schema(names.issuer||{names:{blockName:"tbsCertList.issuer"}}),_Time.default.schema(names.tbsCertListThisUpdate||{names:{utcTimeName:"tbsCertList.thisUpdate",generalTimeName:"tbsCertList.thisUpdate"}}),_Time.default.schema(names.tbsCertListNextUpdate||{names:{utcTimeName:"tbsCertList.nextUpdate",generalTimeName:"tbsCertList.nextUpdate"}},true),new asn1js.Sequence({optional:true,value:[new asn1js.Repeated({name:names.tbsCertListRevokedCertificates||"tbsCertList.revokedCertificates",value:new asn1js.Sequence({value:[new asn1js.Integer(),_Time.default.schema(),_Extensions.default.schema({},true)]})})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[_Extensions.default.schema(names.crlExtensions||{names:{blockName:"tbsCertList.extensions"}})]})
]});}
class CertificateRevocationList{constructor(parameters={}){ this.tbs=(0,_pvutils.getParametersValue)(parameters,"tbs",CertificateRevocationList.defaultValues("tbs"));this.version=(0,_pvutils.getParametersValue)(parameters,"version",CertificateRevocationList.defaultValues("version"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",CertificateRevocationList.defaultValues("signature"));this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",CertificateRevocationList.defaultValues("issuer"));this.thisUpdate=(0,_pvutils.getParametersValue)(parameters,"thisUpdate",CertificateRevocationList.defaultValues("thisUpdate"));if("nextUpdate"in parameters)
this.nextUpdate=(0,_pvutils.getParametersValue)(parameters,"nextUpdate",CertificateRevocationList.defaultValues("nextUpdate"));if("revokedCertificates"in parameters)
this.revokedCertificates=(0,_pvutils.getParametersValue)(parameters,"revokedCertificates",CertificateRevocationList.defaultValues("revokedCertificates"));if("crlExtensions"in parameters)
this.crlExtensions=(0,_pvutils.getParametersValue)(parameters,"crlExtensions",CertificateRevocationList.defaultValues("crlExtensions"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",CertificateRevocationList.defaultValues("signatureAlgorithm"));this.signatureValue=(0,_pvutils.getParametersValue)(parameters,"signatureValue",CertificateRevocationList.defaultValues("signatureValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbs":return new ArrayBuffer(0);case"version":return 1;case"signature":return new _AlgorithmIdentifier.default();case"issuer":return new _RelativeDistinguishedNames.default();case"thisUpdate":return new _Time.default();case"nextUpdate":return new _Time.default();case"revokedCertificates":return[];case"crlExtensions":return new _Extensions.default();case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signatureValue":return new asn1js.BitString();default:throw new Error(`Invalid member name for CertificateRevocationList class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"CertificateList",value:[tbsCertList(parameters),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{names:{blockName:"signatureAlgorithm"}}),new asn1js.BitString({name:names.signatureValue||"signatureValue"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["tbsCertList","tbsCertList.version","tbsCertList.signature","tbsCertList.issuer","tbsCertList.thisUpdate","tbsCertList.nextUpdate","tbsCertList.revokedCertificates","tbsCertList.extensions","signatureAlgorithm","signatureValue"]);
 const asn1=asn1js.compareSchema(schema,schema,CertificateRevocationList.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertificateRevocationList");

 this.tbs=asn1.result.tbsCertList.valueBeforeDecode;if("tbsCertList.version"in asn1.result)this.version=asn1.result["tbsCertList.version"].valueBlock.valueDec;this.signature=new _AlgorithmIdentifier.default({schema:asn1.result["tbsCertList.signature"]});this.issuer=new _RelativeDistinguishedNames.default({schema:asn1.result["tbsCertList.issuer"]});this.thisUpdate=new _Time.default({schema:asn1.result["tbsCertList.thisUpdate"]});if("tbsCertList.nextUpdate"in asn1.result)this.nextUpdate=new _Time.default({schema:asn1.result["tbsCertList.nextUpdate"]});if("tbsCertList.revokedCertificates"in asn1.result)this.revokedCertificates=Array.from(asn1.result["tbsCertList.revokedCertificates"],element=>new _RevokedCertificate.default({schema:element}));if("tbsCertList.extensions"in asn1.result)this.crlExtensions=new _Extensions.default({schema:asn1.result["tbsCertList.extensions"]});this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signatureValue=asn1.result.signatureValue;}
encodeTBS(){ const outputArray=[];if(this.version!==CertificateRevocationList.defaultValues("version"))outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(this.signature.toSchema());outputArray.push(this.issuer.toSchema());outputArray.push(this.thisUpdate.toSchema());if("nextUpdate"in this)outputArray.push(this.nextUpdate.toSchema());if("revokedCertificates"in this){outputArray.push(new asn1js.Sequence({value:Array.from(this.revokedCertificates,element=>element.toSchema())}));}
if("crlExtensions"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[this.crlExtensions.toSchema()]}));} 
return new asn1js.Sequence({value:outputArray});}
toSchema(encodeFlag=false){ let tbsSchema;if(encodeFlag===false){if(this.tbs.length===0) 
return CertificateRevocationList.schema();tbsSchema=asn1js.fromBER(this.tbs).result;}
 
else tbsSchema=this.encodeTBS();
 return new asn1js.Sequence({value:[tbsSchema,this.signatureAlgorithm.toSchema(),this.signatureValue]});}
toJSON(){const object={tbs:(0,_pvutils.bufferToHexCodes)(this.tbs,0,this.tbs.byteLength),signature:this.signature.toJSON(),issuer:this.issuer.toJSON(),thisUpdate:this.thisUpdate.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signatureValue:this.signatureValue.toJSON()};if(this.version!==CertificateRevocationList.defaultValues("version"))object.version=this.version;if("nextUpdate"in this)object.nextUpdate=this.nextUpdate.toJSON();if("revokedCertificates"in this)object.revokedCertificates=Array.from(this.revokedCertificates,element=>element.toJSON());if("crlExtensions"in this)object.crlExtensions=this.crlExtensions.toJSON();return object;}
isCertificateRevoked(certificate){ if(this.issuer.isEqual(certificate.issuer)===false)return false;
 if("revokedCertificates"in this===false)return false;
 var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.revokedCertificates[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const revokedCertificate=_step.value;if(revokedCertificate.userCertificate.isEqual(certificate.serialNumber))return true;}
}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
return false;}
sign(privateKey,hashAlgorithm="SHA-1"){
 if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");

 let sequence=Promise.resolve();let parameters;const engine=(0,_common.getEngine)();
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.signature=result.signatureAlgorithm;this.signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{this.tbs=this.encodeTBS().toBER(false);});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(this.tbs,privateKey,parameters));sequence=sequence.then(result=>{this.signatureValue=new asn1js.BitString({valueHex:result});}); return sequence;}
verify(parameters={}){ let sequence=Promise.resolve();let subjectPublicKeyInfo=-1;const engine=(0,_common.getEngine)();
 if("issuerCertificate"in parameters)
{subjectPublicKeyInfo=parameters.issuerCertificate.subjectPublicKeyInfo; if(this.issuer.isEqual(parameters.issuerCertificate.subject)===false)return Promise.resolve(false);} 
if("publicKeyInfo"in parameters)subjectPublicKeyInfo=parameters.publicKeyInfo; if("subjectPublicKey"in subjectPublicKeyInfo===false)return Promise.reject("Issuer's certificate must be provided as an input parameter");
 if("crlExtensions"in this){var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=this.crlExtensions.extensions[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const extension=_step2.value;if(extension.critical){ if("parsedValue"in extension===false)return Promise.resolve(false);}}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}} 
sequence=sequence.then(()=>engine.subtle.verifyWithPublicKey(this.tbs,this.signatureValue,subjectPublicKeyInfo,this.signatureAlgorithm));return sequence;}
}
exports.default=CertificateRevocationList;},{"./AlgorithmIdentifier.js":4,"./Extensions.js":39,"./RelativeDistinguishedNames.js":89,"./RevokedCertificate.js":94,"./Time.js":107,"./common.js":110,"asn1js":112,"pvutils":113}],23:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _AttributeCertificateV=_interopRequireDefault(require("./AttributeCertificateV1.js"));var _AttributeCertificateV2=_interopRequireDefault(require("./AttributeCertificateV2.js"));var _OtherCertificateFormat=_interopRequireDefault(require("./OtherCertificateFormat.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CertificateSet{constructor(parameters={}){ this.certificates=(0,_pvutils.getParametersValue)(parameters,"certificates",CertificateSet.defaultValues("certificates"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certificates":return[];default:throw new Error(`Invalid member name for Attribute class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Set({name:names.blockName||"",value:[new asn1js.Repeated({name:names.certificates||"certificates",value:new asn1js.Choice({value:[_Certificate.default.schema(),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any()]}), new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:_AttributeCertificateV.default.schema().valueBlock.value}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:_AttributeCertificateV2.default.schema().valueBlock.value}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:3
},value:_OtherCertificateFormat.default.schema().valueBlock.value})]})})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["certificates"]);
 const asn1=asn1js.compareSchema(schema,schema,CertificateSet.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertificateSet");
 this.certificates=Array.from(asn1.result.certificates||[],element=>{const initialTagNumber=element.idBlock.tagNumber;if(element.idBlock.tagClass===1)return new _Certificate.default({schema:element}); const elementSequence=new asn1js.Sequence({value:element.valueBlock.value}); switch(initialTagNumber){case 1:return new _AttributeCertificateV.default({schema:elementSequence});case 2:return new _AttributeCertificateV2.default({schema:elementSequence});case 3:return new _OtherCertificateFormat.default({schema:elementSequence});case 0:default:}
return element;});}
toSchema(){ return new asn1js.Set({value:Array.from(this.certificates,element=>{switch(true){case element instanceof _Certificate.default:return element.toSchema();case element instanceof _AttributeCertificateV.default:return new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:1
},value:element.toSchema().valueBlock.value});case element instanceof _AttributeCertificateV2.default:return new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:2
},value:element.toSchema().valueBlock.value});case element instanceof _OtherCertificateFormat.default:return new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:3
},value:element.toSchema().valueBlock.value});default:}
return element;})});}
toJSON(){return{certificates:Array.from(this.certificates,element=>element.toJSON())};}
}
exports.default=CertificateSet;},{"./AttributeCertificateV1.js":7,"./AttributeCertificateV2.js":8,"./Certificate.js":19,"./OtherCertificateFormat.js":60,"asn1js":112,"pvutils":113}],24:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class CertificateTemplate{constructor(parameters={}){ this.templateID=(0,_pvutils.getParametersValue)(parameters,"templateID",CertificateTemplate.defaultValues("templateID"));if("templateMajorVersion"in parameters)
this.templateMajorVersion=(0,_pvutils.getParametersValue)(parameters,"templateMajorVersion",CertificateTemplate.defaultValues("templateMajorVersion"));if("templateMinorVersion"in parameters)
this.templateMinorVersion=(0,_pvutils.getParametersValue)(parameters,"templateMinorVersion",CertificateTemplate.defaultValues("templateMinorVersion"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"templateID":return"";case"templateMajorVersion":case"templateMinorVersion":return 0;default:throw new Error(`Invalid member name for CertificateTemplate class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.templateID||""}),new asn1js.Integer({name:names.templateMajorVersion||"",optional:true}),new asn1js.Integer({name:names.templateMinorVersion||"",optional:true})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["templateID","templateMajorVersion","templateMinorVersion"]);
 let asn1=asn1js.compareSchema(schema,schema,CertificateTemplate.schema({names:{templateID:"templateID",templateMajorVersion:"templateMajorVersion",templateMinorVersion:"templateMinorVersion"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertificateTemplate");
 this.templateID=asn1.result.templateID.valueBlock.toString();if("templateMajorVersion"in asn1.result)this.templateMajorVersion=asn1.result.templateMajorVersion.valueBlock.valueDec;if("templateMinorVersion"in asn1.result)this.templateMinorVersion=asn1.result.templateMinorVersion.valueBlock.valueDec;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.templateID}));if("templateMajorVersion"in this)outputArray.push(new asn1js.Integer({value:this.templateMajorVersion}));if("templateMinorVersion"in this)outputArray.push(new asn1js.Integer({value:this.templateMinorVersion}));
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={extnID:this.templateID};if("templateMajorVersion"in this)object.templateMajorVersion=this.templateMajorVersion;if("templateMinorVersion"in this)object.templateMinorVersion=this.templateMinorVersion;return object;}
}
exports.default=CertificateTemplate;},{"asn1js":112,"pvutils":113}],25:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _PublicKeyInfo=_interopRequireDefault(require("./PublicKeyInfo.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function CertificationRequestInfo(parameters={}){
const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.CertificationRequestInfo||"CertificationRequestInfo",value:[new asn1js.Integer({name:names.CertificationRequestInfoVersion||"CertificationRequestInfo.version"}),_RelativeDistinguishedNames.default.schema(names.subject||{names:{blockName:"CertificationRequestInfo.subject"}}),_PublicKeyInfo.default.schema({names:{blockName:"CertificationRequestInfo.subjectPublicKeyInfo"}}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({optional:true, name:names.CertificationRequestInfoAttributes||"CertificationRequestInfo.attributes",value:_Attribute.default.schema(names.attributes||{})})]})]});}
class CertificationRequest{constructor(parameters={}){ this.tbs=(0,_pvutils.getParametersValue)(parameters,"tbs",CertificationRequest.defaultValues("tbs"));this.version=(0,_pvutils.getParametersValue)(parameters,"version",CertificationRequest.defaultValues("version"));this.subject=(0,_pvutils.getParametersValue)(parameters,"subject",CertificationRequest.defaultValues("subject"));this.subjectPublicKeyInfo=(0,_pvutils.getParametersValue)(parameters,"subjectPublicKeyInfo",CertificationRequest.defaultValues("subjectPublicKeyInfo"));if("attributes"in parameters)
this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",CertificationRequest.defaultValues("attributes"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",CertificationRequest.defaultValues("signatureAlgorithm"));this.signatureValue=(0,_pvutils.getParametersValue)(parameters,"signatureValue",CertificationRequest.defaultValues("signatureValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbs":return new ArrayBuffer(0);case"version":return 0;case"subject":return new _RelativeDistinguishedNames.default();case"subjectPublicKeyInfo":return new _PublicKeyInfo.default();case"attributes":return[];case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signatureValue":return new asn1js.BitString();default:throw new Error(`Invalid member name for CertificationRequest class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({value:[CertificationRequestInfo(names.certificationRequestInfo||{}),new asn1js.Sequence({name:names.signatureAlgorithm||"signatureAlgorithm",value:[new asn1js.ObjectIdentifier(),new asn1js.Any({optional:true})]}),new asn1js.BitString({name:names.signatureValue||"signatureValue"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["CertificationRequestInfo","CertificationRequestInfo.version","CertificationRequestInfo.subject","CertificationRequestInfo.subjectPublicKeyInfo","CertificationRequestInfo.attributes","signatureAlgorithm","signatureValue"]);
 const asn1=asn1js.compareSchema(schema,schema,CertificationRequest.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for CertificationRequest");
 this.tbs=asn1.result.CertificationRequestInfo.valueBeforeDecode;this.version=asn1.result["CertificationRequestInfo.version"].valueBlock.valueDec;this.subject=new _RelativeDistinguishedNames.default({schema:asn1.result["CertificationRequestInfo.subject"]});this.subjectPublicKeyInfo=new _PublicKeyInfo.default({schema:asn1.result["CertificationRequestInfo.subjectPublicKeyInfo"]});if("CertificationRequestInfo.attributes"in asn1.result)this.attributes=Array.from(asn1.result["CertificationRequestInfo.attributes"],element=>new _Attribute.default({schema:element}));this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signatureValue=asn1.result.signatureValue;}
encodeTBS(){ const outputArray=[new asn1js.Integer({value:this.version}),this.subject.toSchema(),this.subjectPublicKeyInfo.toSchema()];if("attributes"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.attributes,element=>element.toSchema())}));} 
return new asn1js.Sequence({value:outputArray});}
toSchema(encodeFlag=false){ let tbsSchema;if(encodeFlag===false){if(this.tbs.byteLength===0) 
return CertificationRequest.schema();tbsSchema=asn1js.fromBER(this.tbs).result;}
 
else tbsSchema=this.encodeTBS();
 return new asn1js.Sequence({value:[tbsSchema,this.signatureAlgorithm.toSchema(),this.signatureValue]});}
toJSON(){const object={tbs:(0,_pvutils.bufferToHexCodes)(this.tbs,0,this.tbs.byteLength),version:this.version,subject:this.subject.toJSON(),subjectPublicKeyInfo:this.subjectPublicKeyInfo.toJSON(),signatureAlgorithm:this.signatureAlgorithm.toJSON(),signatureValue:this.signatureValue.toJSON()};if("attributes"in this)object.attributes=Array.from(this.attributes,element=>element.toJSON());return object;}
sign(privateKey,hashAlgorithm="SHA-1"){
 if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");

 let sequence=Promise.resolve();let parameters;const engine=(0,_common.getEngine)();
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{this.tbs=this.encodeTBS().toBER(false);});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(this.tbs,privateKey,parameters));sequence=sequence.then(result=>{this.signatureValue=new asn1js.BitString({valueHex:result});}); return sequence;}
verify(){return(0,_common.getEngine)().subtle.verifyWithPublicKey(this.tbs,this.signatureValue,this.subjectPublicKeyInfo,this.signatureAlgorithm);}
getPublicKey(parameters=null){return(0,_common.getEngine)().getPublicKey(this.subjectPublicKeyInfo,this.signatureAlgorithm,parameters);}
}
exports.default=CertificationRequest;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./PublicKeyInfo.js":78,"./RelativeDistinguishedNames.js":89,"./common.js":110,"asn1js":112,"pvutils":113}],26:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ContentInfo{constructor(parameters={}){ this.contentType=(0,_pvutils.getParametersValue)(parameters,"contentType",ContentInfo.defaultValues("contentType"));this.content=(0,_pvutils.getParametersValue)(parameters,"content",ContentInfo.defaultValues("content"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"contentType":return"";case"content":return new asn1js.Any();default:throw new Error(`Invalid member name for ContentInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"contentType":return memberValue==="";case"content":return memberValue instanceof asn1js.Any;default:throw new Error(`Invalid member name for ContentInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});if("optional"in names===false)names.optional=false;return new asn1js.Sequence({name:names.blockName||"ContentInfo",optional:names.optional,value:[new asn1js.ObjectIdentifier({name:names.contentType||"contentType"}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.content||"content"})]
})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["contentType","content"]);
 const asn1=asn1js.compareSchema(schema,schema,ContentInfo.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ContentInfo");
 this.contentType=asn1.result.contentType.valueBlock.toString();this.content=asn1.result.content;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.contentType}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.content]
})]});}
toJSON(){const object={contentType:this.contentType};if(!(this.content instanceof asn1js.Any))object.content=this.content.toJSON();return object;}
}
exports.default=ContentInfo;},{"asn1js":112,"pvutils":113}],27:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _PublicKeyInfo=_interopRequireDefault(require("./PublicKeyInfo.js"));var _PrivateKeyInfo=_interopRequireDefault(require("./PrivateKeyInfo.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _EncryptedContentInfo=_interopRequireDefault(require("./EncryptedContentInfo.js"));var _RSASSAPSSParams=_interopRequireDefault(require("./RSASSAPSSParams.js"));var _PBKDF2Params=_interopRequireDefault(require("./PBKDF2Params.js"));var _PBES2Params=_interopRequireDefault(require("./PBES2Params.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function makePKCS12B2Key(cryptoEngine,hashAlgorithm,keyLength,password,salt,iterationCount){ let u;let v;const result=[];
 switch(hashAlgorithm.toUpperCase()){case"SHA-1":u=20; v=64; break;case"SHA-256":u=32; v=64; break;case"SHA-384":u=48; v=128; break;case"SHA-512":u=64; v=128; break;default:throw new Error("Unsupported hashing algorithm");}

 
const passwordViewInitial=new Uint8Array(password);const passwordTransformed=new ArrayBuffer(password.byteLength*2+2);const passwordTransformedView=new Uint8Array(passwordTransformed);for(let i=0;i<passwordViewInitial.length;i++){passwordTransformedView[i*2]=0x00;passwordTransformedView[i*2+1]=passwordViewInitial[i];}
passwordTransformedView[passwordTransformedView.length-2]=0x00;passwordTransformedView[passwordTransformedView.length-1]=0x00;password=passwordTransformed.slice(0);
 const D=new ArrayBuffer(v);const dView=new Uint8Array(D);for(let i=0;i<D.byteLength;i++)dView[i]=3;

const saltLength=salt.byteLength;const sLen=v*Math.ceil(saltLength/v);const S=new ArrayBuffer(sLen);const sView=new Uint8Array(S);const saltView=new Uint8Array(salt);for(let i=0;i<sLen;i++)sView[i]=saltView[i%saltLength];
const passwordLength=password.byteLength;const pLen=v*Math.ceil(passwordLength/v);const P=new ArrayBuffer(pLen);const pView=new Uint8Array(P);const passwordView=new Uint8Array(password);for(let i=0;i<pLen;i++)pView[i]=passwordView[i%passwordLength];
 const sPlusPLength=S.byteLength+P.byteLength;let I=new ArrayBuffer(sPlusPLength);let iView=new Uint8Array(I);iView.set(sView);iView.set(pView,sView.length);
const c=Math.ceil((keyLength>>3)/u);
 let internalSequence=Promise.resolve(I);
for(let i=0;i<=c;i++){internalSequence=internalSequence.then(_I=>{ const dAndI=new ArrayBuffer(D.byteLength+_I.byteLength);const dAndIView=new Uint8Array(dAndI);dAndIView.set(dView);dAndIView.set(iView,dView.length); return dAndI;}); for(let j=0;j<iterationCount;j++)internalSequence=internalSequence.then(roundBuffer=>cryptoEngine.digest({name:hashAlgorithm},new Uint8Array(roundBuffer))); internalSequence=internalSequence.then(roundBuffer=>{const B=new ArrayBuffer(v);const bView=new Uint8Array(B);for(let j=0;j<B.byteLength;j++)bView[j]=roundBuffer[j%roundBuffer.length];
 const k=Math.ceil(saltLength/v)+Math.ceil(passwordLength/v);const iRound=[];let sliceStart=0;let sliceLength=v;for(let j=0;j<k;j++){const chunk=Array.from(new Uint8Array(I.slice(sliceStart,sliceStart+sliceLength)));sliceStart+=v;if(sliceStart+v>I.byteLength)sliceLength=I.byteLength-sliceStart;let x=0x1ff;for(let l=B.byteLength-1;l>=0;l--){x>>=8;x+=bView[l]+chunk[l];chunk[l]=x&0xff;}
iRound.push(...chunk);}
I=new ArrayBuffer(iRound.length);iView=new Uint8Array(I);iView.set(iRound); result.push(...new Uint8Array(roundBuffer));return I;});}
 
internalSequence=internalSequence.then(()=>{const resultBuffer=new ArrayBuffer(keyLength>>3);const resultView=new Uint8Array(resultBuffer);resultView.set(new Uint8Array(result).slice(0,keyLength>>3));return resultBuffer;});
 return internalSequence;}
class CryptoEngine{constructor(parameters={}){ this.crypto=(0,_pvutils.getParametersValue)(parameters,"crypto",{});this.subtle=(0,_pvutils.getParametersValue)(parameters,"subtle",{});this.name=(0,_pvutils.getParametersValue)(parameters,"name","");}
importKey(format,keyData,algorithm,extractable,keyUsages){ let jwk={};
 if(keyData instanceof Uint8Array)keyData=keyData.buffer; switch(format.toLowerCase()){case"raw":return this.subtle.importKey("raw",keyData,algorithm,extractable,keyUsages);case"spki":{const asn1=asn1js.fromBER(keyData);if(asn1.offset===-1)return Promise.reject("Incorrect keyData");const publicKeyInfo=new _PublicKeyInfo.default();try{publicKeyInfo.fromSchema(asn1.result);}catch(ex){return Promise.reject("Incorrect keyData");} 
switch(algorithm.name.toUpperCase()){case"RSA-PSS":{ switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="PS1";break;case"SHA-256":jwk.alg="PS256";break;case"SHA-384":jwk.alg="PS384";break;case"SHA-512":jwk.alg="PS512";break;default:return Promise.reject(`Incorrect hash algorithm: ${algorithm.hash.name.toUpperCase()}`);}
} 
case"RSASSA-PKCS1-V1_5":{keyUsages=["verify"]; jwk.kty="RSA";jwk.ext=extractable;jwk.key_ops=keyUsages;if(publicKeyInfo.algorithm.algorithmId!=="1.2.840.113549.1.1.1")return Promise.reject(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`); if("alg"in jwk===false){switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="RS1";break;case"SHA-256":jwk.alg="RS256";break;case"SHA-384":jwk.alg="RS384";break;case"SHA-512":jwk.alg="RS512";break;default:return Promise.reject(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`);}}
 
const publicKeyJSON=publicKeyInfo.toJSON();for(var _i=0,_Object$keys=Object.keys(publicKeyJSON);_i<_Object$keys.length;_i++){const key=_Object$keys[_i];jwk[key]=publicKeyJSON[key];}
}
break;case"ECDSA":keyUsages=["verify"];
 case"ECDH":{ jwk={kty:"EC",ext:extractable,key_ops:keyUsages};
 if(publicKeyInfo.algorithm.algorithmId!=="1.2.840.10045.2.1")return Promise.reject(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`);
 const publicKeyJSON=publicKeyInfo.toJSON();for(var _i2=0,_Object$keys2=Object.keys(publicKeyJSON);_i2<_Object$keys2.length;_i2++){const key=_Object$keys2[_i2];jwk[key]=publicKeyJSON[key];}
}
break;case"RSA-OAEP":{jwk.kty="RSA";jwk.ext=extractable;jwk.key_ops=keyUsages;if(this.name.toLowerCase()==="safari")jwk.alg="RSA-OAEP";else{switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="RSA-OAEP";break;case"SHA-256":jwk.alg="RSA-OAEP-256";break;case"SHA-384":jwk.alg="RSA-OAEP-384";break;case"SHA-512":jwk.alg="RSA-OAEP-512";break;default:return Promise.reject(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`);}} 
const publicKeyJSON=publicKeyInfo.toJSON();for(var _i3=0,_Object$keys3=Object.keys(publicKeyJSON);_i3<_Object$keys3.length;_i3++){const key=_Object$keys3[_i3];jwk[key]=publicKeyJSON[key];}
}
break;default:return Promise.reject(`Incorrect algorithm name: ${algorithm.name.toUpperCase()}`);}}
break;case"pkcs8":{const privateKeyInfo=new _PrivateKeyInfo.default(); const asn1=asn1js.fromBER(keyData);if(asn1.offset===-1)return Promise.reject("Incorrect keyData");try{privateKeyInfo.fromSchema(asn1.result);}catch(ex){return Promise.reject("Incorrect keyData");}
if("parsedKey"in privateKeyInfo===false)return Promise.reject("Incorrect keyData");

 switch(algorithm.name.toUpperCase()){case"RSA-PSS":{ switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="PS1";break;case"SHA-256":jwk.alg="PS256";break;case"SHA-384":jwk.alg="PS384";break;case"SHA-512":jwk.alg="PS512";break;default:return Promise.reject(`Incorrect hash algorithm: ${algorithm.hash.name.toUpperCase()}`);}
} 
case"RSASSA-PKCS1-V1_5":{keyUsages=["sign"]; jwk.kty="RSA";jwk.ext=extractable;jwk.key_ops=keyUsages; if(privateKeyInfo.privateKeyAlgorithm.algorithmId!=="1.2.840.113549.1.1.1")return Promise.reject(`Incorrect private key algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`);
 if("alg"in jwk===false){switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="RS1";break;case"SHA-256":jwk.alg="RS256";break;case"SHA-384":jwk.alg="RS384";break;case"SHA-512":jwk.alg="RS512";break;default:return Promise.reject(`Incorrect hash algorithm: ${algorithm.hash.name.toUpperCase()}`);}}
 
const privateKeyJSON=privateKeyInfo.toJSON();for(var _i4=0,_Object$keys4=Object.keys(privateKeyJSON);_i4<_Object$keys4.length;_i4++){const key=_Object$keys4[_i4];jwk[key]=privateKeyJSON[key];}
}
break;case"ECDSA":keyUsages=["sign"];
 case"ECDH":{ jwk={kty:"EC",ext:extractable,key_ops:keyUsages};
 if(privateKeyInfo.privateKeyAlgorithm.algorithmId!=="1.2.840.10045.2.1")return Promise.reject(`Incorrect algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`);
 const privateKeyJSON=privateKeyInfo.toJSON();for(var _i5=0,_Object$keys5=Object.keys(privateKeyJSON);_i5<_Object$keys5.length;_i5++){const key=_Object$keys5[_i5];jwk[key]=privateKeyJSON[key];}
}
break;case"RSA-OAEP":{jwk.kty="RSA";jwk.ext=extractable;jwk.key_ops=keyUsages; if(this.name.toLowerCase()==="safari")jwk.alg="RSA-OAEP";else{switch(algorithm.hash.name.toUpperCase()){case"SHA-1":jwk.alg="RSA-OAEP";break;case"SHA-256":jwk.alg="RSA-OAEP-256";break;case"SHA-384":jwk.alg="RSA-OAEP-384";break;case"SHA-512":jwk.alg="RSA-OAEP-512";break;default:return Promise.reject(`Incorrect hash algorithm: ${algorithm.hash.name.toUpperCase()}`);}}
 
const privateKeyJSON=privateKeyInfo.toJSON();for(var _i6=0,_Object$keys6=Object.keys(privateKeyJSON);_i6<_Object$keys6.length;_i6++){const key=_Object$keys6[_i6];jwk[key]=privateKeyJSON[key];}
}
break;default:return Promise.reject(`Incorrect algorithm name: ${algorithm.name.toUpperCase()}`);}}
break;case"jwk":jwk=keyData;break;default:return Promise.reject(`Incorrect format: ${format}`);}
if(this.name.toLowerCase()==="safari"){return Promise.resolve().then(()=>this.subtle.importKey("jwk",(0,_pvutils.stringToArrayBuffer)(JSON.stringify(jwk)),algorithm,extractable,keyUsages)).then(result=>result,()=>this.subtle.importKey("jwk",jwk,algorithm,extractable,keyUsages));} 
return this.subtle.importKey("jwk",jwk,algorithm,extractable,keyUsages);}
exportKey(format,key){let sequence=this.subtle.exportKey("jwk",key); if(this.name.toLowerCase()==="safari"){sequence=sequence.then(result=>{ if(result instanceof ArrayBuffer)return JSON.parse((0,_pvutils.arrayBufferToString)(result));return result;});} 
switch(format.toLowerCase()){case"raw":return this.subtle.exportKey("raw",key);case"spki":sequence=sequence.then(result=>{const publicKeyInfo=new _PublicKeyInfo.default();try{publicKeyInfo.fromJSON(result);}catch(ex){return Promise.reject("Incorrect key data");}
return publicKeyInfo.toSchema().toBER(false);});break;case"pkcs8":sequence=sequence.then(result=>{const privateKeyInfo=new _PrivateKeyInfo.default();try{privateKeyInfo.fromJSON(result);}catch(ex){return Promise.reject("Incorrect key data");}
return privateKeyInfo.toSchema().toBER(false);});break;case"jwk":break;default:return Promise.reject(`Incorrect format: ${format}`);}
return sequence;}
convert(inputFormat,outputFormat,keyData,algorithm,extractable,keyUsages){switch(inputFormat.toLowerCase()){case"raw":switch(outputFormat.toLowerCase()){case"raw":return Promise.resolve(keyData);case"spki":return Promise.resolve().then(()=>this.importKey("raw",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("spki",result));case"pkcs8":return Promise.resolve().then(()=>this.importKey("raw",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("pkcs8",result));case"jwk":return Promise.resolve().then(()=>this.importKey("raw",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("jwk",result));default:return Promise.reject(`Incorrect outputFormat: ${outputFormat}`);}
case"spki":switch(outputFormat.toLowerCase()){case"raw":return Promise.resolve().then(()=>this.importKey("spki",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("raw",result));case"spki":return Promise.resolve(keyData);case"pkcs8":return Promise.reject("Impossible to convert between SPKI/PKCS8");case"jwk":return Promise.resolve().then(()=>this.importKey("spki",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("jwk",result));default:return Promise.reject(`Incorrect outputFormat: ${outputFormat}`);}
case"pkcs8":switch(outputFormat.toLowerCase()){case"raw":return Promise.resolve().then(()=>this.importKey("pkcs8",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("raw",result));case"spki":return Promise.reject("Impossible to convert between SPKI/PKCS8");case"pkcs8":return Promise.resolve(keyData);case"jwk":return Promise.resolve().then(()=>this.importKey("pkcs8",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("jwk",result));default:return Promise.reject(`Incorrect outputFormat: ${outputFormat}`);}
case"jwk":switch(outputFormat.toLowerCase()){case"raw":return Promise.resolve().then(()=>this.importKey("jwk",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("raw",result));case"spki":return Promise.resolve().then(()=>this.importKey("jwk",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("spki",result));case"pkcs8":return Promise.resolve().then(()=>this.importKey("jwk",keyData,algorithm,extractable,keyUsages)).then(result=>this.exportKey("pkcs8",result));case"jwk":return Promise.resolve(keyData);default:return Promise.reject(`Incorrect outputFormat: ${outputFormat}`);}
default:return Promise.reject(`Incorrect inputFormat: ${inputFormat}`);}}
encrypt(...args){return this.subtle.encrypt(...args);}
decrypt(...args){return this.subtle.decrypt(...args);}
sign(...args){return this.subtle.sign(...args);}
verify(...args){return this.subtle.verify(...args);}
digest(...args){return this.subtle.digest(...args);}
generateKey(...args){return this.subtle.generateKey(...args);}
deriveKey(...args){return this.subtle.deriveKey(...args);}
deriveBits(...args){return this.subtle.deriveBits(...args);}
wrapKey(...args){return this.subtle.wrapKey(...args);}
unwrapKey(...args){return this.subtle.unwrapKey(...args);}
getRandomValues(view){if("getRandomValues"in this.crypto===false)throw new Error("No support for getRandomValues");return this.crypto.getRandomValues(view);}
getAlgorithmByOID(oid){switch(oid){case"1.2.840.113549.1.1.1":case"1.2.840.113549.1.1.5":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-1"}};case"1.2.840.113549.1.1.11":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}};case"1.2.840.113549.1.1.12":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-384"}};case"1.2.840.113549.1.1.13":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-512"}};case"1.2.840.113549.1.1.10":return{name:"RSA-PSS"};case"1.2.840.113549.1.1.7":return{name:"RSA-OAEP"};case"1.2.840.10045.2.1":case"1.2.840.10045.4.1":return{name:"ECDSA",hash:{name:"SHA-1"}};case"1.2.840.10045.4.3.2":return{name:"ECDSA",hash:{name:"SHA-256"}};case"1.2.840.10045.4.3.3":return{name:"ECDSA",hash:{name:"SHA-384"}};case"1.2.840.10045.4.3.4":return{name:"ECDSA",hash:{name:"SHA-512"}};case"1.3.133.16.840.63.0.2":return{name:"ECDH",kdf:"SHA-1"};case"1.3.132.1.11.1":return{name:"ECDH",kdf:"SHA-256"};case"1.3.132.1.11.2":return{name:"ECDH",kdf:"SHA-384"};case"1.3.132.1.11.3":return{name:"ECDH",kdf:"SHA-512"};case"2.16.840.1.101.3.4.1.2":return{name:"AES-CBC",length:128};case"2.16.840.1.101.3.4.1.22":return{name:"AES-CBC",length:192};case"2.16.840.1.101.3.4.1.42":return{name:"AES-CBC",length:256};case"2.16.840.1.101.3.4.1.6":return{name:"AES-GCM",length:128};case"2.16.840.1.101.3.4.1.26":return{name:"AES-GCM",length:192};case"2.16.840.1.101.3.4.1.46":return{name:"AES-GCM",length:256};case"2.16.840.1.101.3.4.1.4":return{name:"AES-CFB",length:128};case"2.16.840.1.101.3.4.1.24":return{name:"AES-CFB",length:192};case"2.16.840.1.101.3.4.1.44":return{name:"AES-CFB",length:256};case"2.16.840.1.101.3.4.1.5":return{name:"AES-KW",length:128};case"2.16.840.1.101.3.4.1.25":return{name:"AES-KW",length:192};case"2.16.840.1.101.3.4.1.45":return{name:"AES-KW",length:256};case"1.2.840.113549.2.7":return{name:"HMAC",hash:{name:"SHA-1"}};case"1.2.840.113549.2.9":return{name:"HMAC",hash:{name:"SHA-256"}};case"1.2.840.113549.2.10":return{name:"HMAC",hash:{name:"SHA-384"}};case"1.2.840.113549.2.11":return{name:"HMAC",hash:{name:"SHA-512"}};case"1.2.840.113549.1.9.16.3.5":return{name:"DH"};case"1.3.14.3.2.26":return{name:"SHA-1"};case"2.16.840.1.101.3.4.2.1":return{name:"SHA-256"};case"2.16.840.1.101.3.4.2.2":return{name:"SHA-384"};case"2.16.840.1.101.3.4.2.3":return{name:"SHA-512"};case"1.2.840.113549.1.5.12":return{name:"PBKDF2"}; case"1.2.840.10045.3.1.7":return{name:"P-256"};case"1.3.132.0.34":return{name:"P-384"};case"1.3.132.0.35":return{name:"P-521"}; default:}
return{};}
getOIDByAlgorithm(algorithm){let result="";switch(algorithm.name.toUpperCase()){case"RSASSA-PKCS1-V1_5":switch(algorithm.hash.name.toUpperCase()){case"SHA-1":result="1.2.840.113549.1.1.5";break;case"SHA-256":result="1.2.840.113549.1.1.11";break;case"SHA-384":result="1.2.840.113549.1.1.12";break;case"SHA-512":result="1.2.840.113549.1.1.13";break;default:}
break;case"RSA-PSS":result="1.2.840.113549.1.1.10";break;case"RSA-OAEP":result="1.2.840.113549.1.1.7";break;case"ECDSA":switch(algorithm.hash.name.toUpperCase()){case"SHA-1":result="1.2.840.10045.4.1";break;case"SHA-256":result="1.2.840.10045.4.3.2";break;case"SHA-384":result="1.2.840.10045.4.3.3";break;case"SHA-512":result="1.2.840.10045.4.3.4";break;default:}
break;case"ECDH":switch(algorithm.kdf.toUpperCase()){ case"SHA-1":result="1.3.133.16.840.63.0.2"; break;case"SHA-256":result="1.3.132.1.11.1"; break;case"SHA-384":result="1.3.132.1.11.2"; break;case"SHA-512":result="1.3.132.1.11.3"; break;default:}
break;case"AES-CTR":break;case"AES-CBC":switch(algorithm.length){case 128:result="2.16.840.1.101.3.4.1.2";break;case 192:result="2.16.840.1.101.3.4.1.22";break;case 256:result="2.16.840.1.101.3.4.1.42";break;default:}
break;case"AES-CMAC":break;case"AES-GCM":switch(algorithm.length){case 128:result="2.16.840.1.101.3.4.1.6";break;case 192:result="2.16.840.1.101.3.4.1.26";break;case 256:result="2.16.840.1.101.3.4.1.46";break;default:}
break;case"AES-CFB":switch(algorithm.length){case 128:result="2.16.840.1.101.3.4.1.4";break;case 192:result="2.16.840.1.101.3.4.1.24";break;case 256:result="2.16.840.1.101.3.4.1.44";break;default:}
break;case"AES-KW":switch(algorithm.length){case 128:result="2.16.840.1.101.3.4.1.5";break;case 192:result="2.16.840.1.101.3.4.1.25";break;case 256:result="2.16.840.1.101.3.4.1.45";break;default:}
break;case"HMAC":switch(algorithm.hash.name.toUpperCase()){case"SHA-1":result="1.2.840.113549.2.7";break;case"SHA-256":result="1.2.840.113549.2.9";break;case"SHA-384":result="1.2.840.113549.2.10";break;case"SHA-512":result="1.2.840.113549.2.11";break;default:}
break;case"DH":result="1.2.840.113549.1.9.16.3.5";break;case"SHA-1":result="1.3.14.3.2.26";break;case"SHA-256":result="2.16.840.1.101.3.4.2.1";break;case"SHA-384":result="2.16.840.1.101.3.4.2.2";break;case"SHA-512":result="2.16.840.1.101.3.4.2.3";break;case"CONCAT":break;case"HKDF":break;case"PBKDF2":result="1.2.840.113549.1.5.12";break; case"P-256":result="1.2.840.10045.3.1.7";break;case"P-384":result="1.3.132.0.34";break;case"P-521":result="1.3.132.0.35";break; default:}
return result;}
getAlgorithmParameters(algorithmName,operation){let result={algorithm:{},usages:[]};switch(algorithmName.toUpperCase()){case"RSASSA-PKCS1-V1_5":switch(operation.toLowerCase()){case"generatekey":result={algorithm:{name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([0x01,0x00,0x01]),hash:{name:"SHA-256"}},usages:["sign","verify"]};break;case"verify":case"sign":case"importkey":result={algorithm:{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}},usages:["verify"]
};break;case"exportkey":default:return{algorithm:{name:"RSASSA-PKCS1-v1_5"},usages:[]};}
break;case"RSA-PSS":switch(operation.toLowerCase()){case"sign":case"verify":result={algorithm:{name:"RSA-PSS",hash:{name:"SHA-1"},saltLength:20},usages:["sign","verify"]};break;case"generatekey":result={algorithm:{name:"RSA-PSS",modulusLength:2048,publicExponent:new Uint8Array([0x01,0x00,0x01]),hash:{name:"SHA-1"}},usages:["sign","verify"]};break;case"importkey":result={algorithm:{name:"RSA-PSS",hash:{name:"SHA-1"}},usages:["verify"]
};break;case"exportkey":default:return{algorithm:{name:"RSA-PSS"},usages:[]};}
break;case"RSA-OAEP":switch(operation.toLowerCase()){case"encrypt":case"decrypt":result={algorithm:{name:"RSA-OAEP"},usages:["encrypt","decrypt"]};break;case"generatekey":result={algorithm:{name:"RSA-OAEP",modulusLength:2048,publicExponent:new Uint8Array([0x01,0x00,0x01]),hash:{name:"SHA-256"}},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;case"importkey":result={algorithm:{name:"RSA-OAEP",hash:{name:"SHA-256"}},usages:["encrypt"]
};break;case"exportkey":default:return{algorithm:{name:"RSA-OAEP"},usages:[]};}
break;case"ECDSA":switch(operation.toLowerCase()){case"generatekey":result={algorithm:{name:"ECDSA",namedCurve:"P-256"},usages:["sign","verify"]};break;case"importkey":result={algorithm:{name:"ECDSA",namedCurve:"P-256"},usages:["verify"]
};break;case"verify":case"sign":result={algorithm:{name:"ECDSA",hash:{name:"SHA-256"}},usages:["sign"]};break;default:return{algorithm:{name:"ECDSA"},usages:[]};}
break;case"ECDH":switch(operation.toLowerCase()){case"exportkey":case"importkey":case"generatekey":result={algorithm:{name:"ECDH",namedCurve:"P-256"},usages:["deriveKey","deriveBits"]};break;case"derivekey":case"derivebits":result={algorithm:{name:"ECDH",namedCurve:"P-256",public:[]
},usages:["encrypt","decrypt"]};break;default:return{algorithm:{name:"ECDH"},usages:[]};}
break;case"AES-CTR":switch(operation.toLowerCase()){case"importkey":case"exportkey":case"generatekey":result={algorithm:{name:"AES-CTR",length:256},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;case"decrypt":case"encrypt":result={algorithm:{name:"AES-CTR",counter:new Uint8Array(16),length:10},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;default:return{algorithm:{name:"AES-CTR"},usages:[]};}
break;case"AES-CBC":switch(operation.toLowerCase()){case"importkey":case"exportkey":case"generatekey":result={algorithm:{name:"AES-CBC",length:256},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;case"decrypt":case"encrypt":result={algorithm:{name:"AES-CBC",iv:this.getRandomValues(new Uint8Array(16))
},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;default:return{algorithm:{name:"AES-CBC"},usages:[]};}
break;case"AES-GCM":switch(operation.toLowerCase()){case"importkey":case"exportkey":case"generatekey":result={algorithm:{name:"AES-GCM",length:256},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;case"decrypt":case"encrypt":result={algorithm:{name:"AES-GCM",iv:this.getRandomValues(new Uint8Array(16))
},usages:["encrypt","decrypt","wrapKey","unwrapKey"]};break;default:return{algorithm:{name:"AES-GCM"},usages:[]};}
break;case"AES-KW":switch(operation.toLowerCase()){case"importkey":case"exportkey":case"generatekey":case"wrapkey":case"unwrapkey":result={algorithm:{name:"AES-KW",length:256},usages:["wrapKey","unwrapKey"]};break;default:return{algorithm:{name:"AES-KW"},usages:[]};}
break;case"HMAC":switch(operation.toLowerCase()){case"sign":case"verify":result={algorithm:{name:"HMAC"},usages:["sign","verify"]};break;case"importkey":case"exportkey":case"generatekey":result={algorithm:{name:"HMAC",length:32,hash:{name:"SHA-256"}},usages:["sign","verify"]};break;default:return{algorithm:{name:"HMAC"},usages:[]};}
break;case"HKDF":switch(operation.toLowerCase()){case"derivekey":result={algorithm:{name:"HKDF",hash:"SHA-256",salt:new Uint8Array([]),info:new Uint8Array([])},usages:["encrypt","decrypt"]};break;default:return{algorithm:{name:"HKDF"},usages:[]};}
break;case"PBKDF2":switch(operation.toLowerCase()){case"derivekey":result={algorithm:{name:"PBKDF2",hash:{name:"SHA-256"},salt:new Uint8Array([]),iterations:10000},usages:["encrypt","decrypt"]};break;default:return{algorithm:{name:"PBKDF2"},usages:[]};}
break;default:}
return result;}
getHashAlgorithm(signatureAlgorithm){let result="";switch(signatureAlgorithm.algorithmId){case"1.2.840.10045.4.1": case"1.2.840.113549.1.1.5":result="SHA-1";break;case"1.2.840.10045.4.3.2": case"1.2.840.113549.1.1.11":result="SHA-256";break;case"1.2.840.10045.4.3.3": case"1.2.840.113549.1.1.12":result="SHA-384";break;case"1.2.840.10045.4.3.4": case"1.2.840.113549.1.1.13":result="SHA-512";break;case"1.2.840.113549.1.1.10":{try{const params=new _RSASSAPSSParams.default({schema:signatureAlgorithm.algorithmParams});if("hashAlgorithm"in params){const algorithm=this.getAlgorithmByOID(params.hashAlgorithm.algorithmId);if("name"in algorithm===false)return"";result=algorithm.name;}else result="SHA-1";}catch(ex){}}
break;default:}
return result;}
encryptEncryptedContentInfo(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");if("contentEncryptionAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"contentEncryptionAlgorithm\"");if("hmacHashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"hmacHashAlgorithm\"");if("iterationCount"in parameters===false)return Promise.reject("Absent mandatory parameter \"iterationCount\"");if("contentToEncrypt"in parameters===false)return Promise.reject("Absent mandatory parameter \"contentToEncrypt\"");if("contentType"in parameters===false)return Promise.reject("Absent mandatory parameter \"contentType\"");const contentEncryptionOID=this.getOIDByAlgorithm(parameters.contentEncryptionAlgorithm);if(contentEncryptionOID==="")return Promise.reject("Wrong \"contentEncryptionAlgorithm\" value");const pbkdf2OID=this.getOIDByAlgorithm({name:"PBKDF2"});if(pbkdf2OID==="")return Promise.reject("Can not find OID for PBKDF2");const hmacOID=this.getOIDByAlgorithm({name:"HMAC",hash:{name:parameters.hmacHashAlgorithm}});if(hmacOID==="")return Promise.reject(`Incorrect value for "hmacHashAlgorithm": ${parameters.hmacHashAlgorithm}`);
 let sequence=Promise.resolve();const ivBuffer=new ArrayBuffer(16); const ivView=new Uint8Array(ivBuffer);this.getRandomValues(ivView);const saltBuffer=new ArrayBuffer(64);const saltView=new Uint8Array(saltBuffer);this.getRandomValues(saltView);const contentView=new Uint8Array(parameters.contentToEncrypt);const pbkdf2Params=new _PBKDF2Params.default({salt:new asn1js.OctetString({valueHex:saltBuffer}),iterationCount:parameters.iterationCount,prf:new _AlgorithmIdentifier.default({algorithmId:hmacOID,algorithmParams:new asn1js.Null()})});
 sequence=sequence.then(()=>{const passwordView=new Uint8Array(parameters.password);return this.importKey("raw",passwordView,"PBKDF2",false,["deriveKey"]);},error=>Promise.reject(error));
sequence=sequence.then(result=>this.deriveKey({name:"PBKDF2",hash:{name:parameters.hmacHashAlgorithm},salt:saltView,iterations:parameters.iterationCount},result,parameters.contentEncryptionAlgorithm,false,["encrypt"]),error=>Promise.reject(error));
 sequence=sequence.then(result=>this.encrypt({name:parameters.contentEncryptionAlgorithm.name,iv:ivView},result,contentView),error=>Promise.reject(error));
 sequence=sequence.then(result=>{const pbes2Parameters=new _PBES2Params.default({keyDerivationFunc:new _AlgorithmIdentifier.default({algorithmId:pbkdf2OID,algorithmParams:pbkdf2Params.toSchema()}),encryptionScheme:new _AlgorithmIdentifier.default({algorithmId:contentEncryptionOID,algorithmParams:new asn1js.OctetString({valueHex:ivBuffer})})});return new _EncryptedContentInfo.default({contentType:parameters.contentType,contentEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.5.13", algorithmParams:pbes2Parameters.toSchema()}),encryptedContent:new asn1js.OctetString({valueHex:result})});},error=>Promise.reject(error)); return sequence;}
decryptEncryptedContentInfo(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");if("encryptedContentInfo"in parameters===false)return Promise.reject("Absent mandatory parameter \"encryptedContentInfo\"");if(parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId!=="1.2.840.113549.1.5.13") 
return Promise.reject(`Unknown "contentEncryptionAlgorithm": ${parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`);
 let sequence=Promise.resolve();let pbes2Parameters;try{pbes2Parameters=new _PBES2Params.default({schema:parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmParams});}catch(ex){return Promise.reject("Incorrectly encoded \"pbes2Parameters\"");}
let pbkdf2Params;try{pbkdf2Params=new _PBKDF2Params.default({schema:pbes2Parameters.keyDerivationFunc.algorithmParams});}catch(ex){return Promise.reject("Incorrectly encoded \"pbkdf2Params\"");}
const contentEncryptionAlgorithm=this.getAlgorithmByOID(pbes2Parameters.encryptionScheme.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect OID for "contentEncryptionAlgorithm": ${pbes2Parameters.encryptionScheme.algorithmId}`);const ivBuffer=pbes2Parameters.encryptionScheme.algorithmParams.valueBlock.valueHex;const ivView=new Uint8Array(ivBuffer);const saltBuffer=pbkdf2Params.salt.valueBlock.valueHex;const saltView=new Uint8Array(saltBuffer);const iterationCount=pbkdf2Params.iterationCount;let hmacHashAlgorithm="SHA-1";if("prf"in pbkdf2Params){const algorithm=this.getAlgorithmByOID(pbkdf2Params.prf.algorithmId);if("name"in algorithm===false)return Promise.reject("Incorrect OID for HMAC hash algorithm");hmacHashAlgorithm=algorithm.hash.name;}
 
sequence=sequence.then(()=>this.importKey("raw",parameters.password,"PBKDF2",false,["deriveKey"]),error=>Promise.reject(error));
sequence=sequence.then(result=>this.deriveKey({name:"PBKDF2",hash:{name:hmacHashAlgorithm},salt:saltView,iterations:iterationCount},result,contentEncryptionAlgorithm,false,["decrypt"]),error=>Promise.reject(error));
 sequence=sequence.then(result=>{ let dataBuffer=new ArrayBuffer(0);if(parameters.encryptedContentInfo.encryptedContent.idBlock.isConstructed===false)dataBuffer=parameters.encryptedContentInfo.encryptedContent.valueBlock.valueHex;else{var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=parameters.encryptedContentInfo.encryptedContent.valueBlock.value[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const content=_step.value;dataBuffer=(0,_pvutils.utilConcatBuf)(dataBuffer,content.valueBlock.valueHex);}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}} 
return this.decrypt({name:contentEncryptionAlgorithm.name,iv:ivView},result,dataBuffer);},error=>Promise.reject(error)); return sequence;}
stampDataWithPassword(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");if("hashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"hashAlgorithm\"");if("salt"in parameters===false)return Promise.reject("Absent mandatory parameter \"iterationCount\"");if("iterationCount"in parameters===false)return Promise.reject("Absent mandatory parameter \"salt\"");if("contentToStamp"in parameters===false)return Promise.reject("Absent mandatory parameter \"contentToStamp\"");
 let length;switch(parameters.hashAlgorithm.toLowerCase()){case"sha-1":length=160;break;case"sha-256":length=256;break;case"sha-384":length=384;break;case"sha-512":length=512;break;default:return Promise.reject(`Incorrect "parameters.hashAlgorithm" parameter: ${parameters.hashAlgorithm}`);}
 
let sequence=Promise.resolve();const hmacAlgorithm={name:"HMAC",length,hash:{name:parameters.hashAlgorithm}};
 sequence=sequence.then(()=>makePKCS12B2Key(this,parameters.hashAlgorithm,length,parameters.password,parameters.salt,parameters.iterationCount));

 sequence=sequence.then(result=>this.importKey("raw",new Uint8Array(result),hmacAlgorithm,false,["sign"]));
 sequence=sequence.then(result=>this.sign(hmacAlgorithm,result,new Uint8Array(parameters.contentToStamp)),error=>Promise.reject(error)); return sequence;}
verifyDataStampedWithPassword(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");if("hashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"hashAlgorithm\"");if("salt"in parameters===false)return Promise.reject("Absent mandatory parameter \"iterationCount\"");if("iterationCount"in parameters===false)return Promise.reject("Absent mandatory parameter \"salt\"");if("contentToVerify"in parameters===false)return Promise.reject("Absent mandatory parameter \"contentToVerify\"");if("signatureToVerify"in parameters===false)return Promise.reject("Absent mandatory parameter \"signatureToVerify\"");
 let length;switch(parameters.hashAlgorithm.toLowerCase()){case"sha-1":length=160;break;case"sha-256":length=256;break;case"sha-384":length=384;break;case"sha-512":length=512;break;default:return Promise.reject(`Incorrect "parameters.hashAlgorithm" parameter: ${parameters.hashAlgorithm}`);}
 
let sequence=Promise.resolve();const hmacAlgorithm={name:"HMAC",length,hash:{name:parameters.hashAlgorithm}};
 sequence=sequence.then(()=>makePKCS12B2Key(this,parameters.hashAlgorithm,length,parameters.password,parameters.salt,parameters.iterationCount));

 sequence=sequence.then(result=>this.importKey("raw",new Uint8Array(result),hmacAlgorithm,false,["verify"]));
 sequence=sequence.then(result=>this.verify(hmacAlgorithm,result,new Uint8Array(parameters.signatureToVerify),new Uint8Array(parameters.contentToVerify)),error=>Promise.reject(error)); return sequence;}
getSignatureParameters(privateKey,hashAlgorithm="SHA-1"){ const oid=this.getOIDByAlgorithm({name:hashAlgorithm});if(oid==="")return Promise.reject(`Unsupported hash algorithm: ${hashAlgorithm}`);
 const signatureAlgorithm=new _AlgorithmIdentifier.default();
 const parameters=this.getAlgorithmParameters(privateKey.algorithm.name,"sign");parameters.algorithm.hash.name=hashAlgorithm;
switch(privateKey.algorithm.name.toUpperCase()){case"RSASSA-PKCS1-V1_5":case"ECDSA":signatureAlgorithm.algorithmId=this.getOIDByAlgorithm(parameters.algorithm);break;case"RSA-PSS":{ switch(hashAlgorithm.toUpperCase()){case"SHA-256":parameters.algorithm.saltLength=32;break;case"SHA-384":parameters.algorithm.saltLength=48;break;case"SHA-512":parameters.algorithm.saltLength=64;break;default:}
 
const paramsObject={};if(hashAlgorithm.toUpperCase()!=="SHA-1"){const hashAlgorithmOID=this.getOIDByAlgorithm({name:hashAlgorithm});if(hashAlgorithmOID==="")return Promise.reject(`Unsupported hash algorithm: ${hashAlgorithm}`);paramsObject.hashAlgorithm=new _AlgorithmIdentifier.default({algorithmId:hashAlgorithmOID,algorithmParams:new asn1js.Null()});paramsObject.maskGenAlgorithm=new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.8", algorithmParams:paramsObject.hashAlgorithm.toSchema()});}
if(parameters.algorithm.saltLength!==20)paramsObject.saltLength=parameters.algorithm.saltLength;const pssParameters=new _RSASSAPSSParams.default(paramsObject);
 signatureAlgorithm.algorithmId="1.2.840.113549.1.1.10";signatureAlgorithm.algorithmParams=pssParameters.toSchema();}
break;default:return Promise.reject(`Unsupported signature algorithm: ${privateKey.algorithm.name}`);} 
return Promise.resolve().then(()=>({signatureAlgorithm,parameters}));}
signWithPrivateKey(data,privateKey,parameters){return this.sign(parameters.algorithm,privateKey,new Uint8Array(data)).then(result=>{ if(parameters.algorithm.name==="ECDSA")result=(0,_common.createCMSECDSASignature)(result); return result;},error=>Promise.reject(`Signing error: ${error}`));}
fillPublicKeyParameters(publicKeyInfo,signatureAlgorithm){const parameters={}; const shaAlgorithm=this.getHashAlgorithm(signatureAlgorithm);if(shaAlgorithm==="")return Promise.reject(`Unsupported signature algorithm: ${signatureAlgorithm.algorithmId}`);
 let algorithmId;if(signatureAlgorithm.algorithmId==="1.2.840.113549.1.1.10")algorithmId=signatureAlgorithm.algorithmId;else algorithmId=publicKeyInfo.algorithm.algorithmId;const algorithmObject=this.getAlgorithmByOID(algorithmId);if("name"in algorithmObject==="")return Promise.reject(`Unsupported public key algorithm: ${signatureAlgorithm.algorithmId}`);parameters.algorithm=this.getAlgorithmParameters(algorithmObject.name,"importkey");if("hash"in parameters.algorithm.algorithm)parameters.algorithm.algorithm.hash.name=shaAlgorithm; if(algorithmObject.name==="ECDSA"){ let algorithmParamsChecked=false;if("algorithmParams"in publicKeyInfo.algorithm===true){if("idBlock"in publicKeyInfo.algorithm.algorithmParams){if(publicKeyInfo.algorithm.algorithmParams.idBlock.tagClass===1&&publicKeyInfo.algorithm.algorithmParams.idBlock.tagNumber===6)algorithmParamsChecked=true;}}
if(algorithmParamsChecked===false)return Promise.reject("Incorrect type for ECDSA public key parameters");const curveObject=this.getAlgorithmByOID(publicKeyInfo.algorithm.algorithmParams.valueBlock.toString());if("name"in curveObject===false)return Promise.reject(`Unsupported named curve algorithm: ${publicKeyInfo.algorithm.algorithmParams.valueBlock.toString()}`); parameters.algorithm.algorithm.namedCurve=curveObject.name;}
 
return parameters;}
getPublicKey(publicKeyInfo,signatureAlgorithm,parameters=null){if(parameters===null)parameters=this.fillPublicKeyParameters(publicKeyInfo,signatureAlgorithm);const publicKeyInfoSchema=publicKeyInfo.toSchema();const publicKeyInfoBuffer=publicKeyInfoSchema.toBER(false);const publicKeyInfoView=new Uint8Array(publicKeyInfoBuffer);return this.importKey("spki",publicKeyInfoView,parameters.algorithm.algorithm,true,parameters.algorithm.usages);}
verifyWithPublicKey(data,signature,publicKeyInfo,signatureAlgorithm,shaAlgorithm=null){ let sequence=Promise.resolve();
 if(shaAlgorithm===null){shaAlgorithm=this.getHashAlgorithm(signatureAlgorithm);if(shaAlgorithm==="")return Promise.reject(`Unsupported signature algorithm: ${signatureAlgorithm.algorithmId}`); sequence=sequence.then(()=>this.getPublicKey(publicKeyInfo,signatureAlgorithm));}else{const parameters={}; let algorithmId;if(signatureAlgorithm.algorithmId==="1.2.840.113549.1.1.10")algorithmId=signatureAlgorithm.algorithmId;else algorithmId=publicKeyInfo.algorithm.algorithmId;const algorithmObject=this.getAlgorithmByOID(algorithmId);if("name"in algorithmObject==="")return Promise.reject(`Unsupported public key algorithm: ${signatureAlgorithm.algorithmId}`);parameters.algorithm=this.getAlgorithmParameters(algorithmObject.name,"importkey");if("hash"in parameters.algorithm.algorithm)parameters.algorithm.algorithm.hash.name=shaAlgorithm; if(algorithmObject.name==="ECDSA"){ let algorithmParamsChecked=false;if("algorithmParams"in publicKeyInfo.algorithm===true){if("idBlock"in publicKeyInfo.algorithm.algorithmParams){if(publicKeyInfo.algorithm.algorithmParams.idBlock.tagClass===1&&publicKeyInfo.algorithm.algorithmParams.idBlock.tagNumber===6)algorithmParamsChecked=true;}}
if(algorithmParamsChecked===false)return Promise.reject("Incorrect type for ECDSA public key parameters");const curveObject=this.getAlgorithmByOID(publicKeyInfo.algorithm.algorithmParams.valueBlock.toString());if("name"in curveObject===false)return Promise.reject(`Unsupported named curve algorithm: ${publicKeyInfo.algorithm.algorithmParams.valueBlock.toString()}`); parameters.algorithm.algorithm.namedCurve=curveObject.name;}

 
sequence=sequence.then(()=>this.getPublicKey(publicKeyInfo,null,parameters));}
 
sequence=sequence.then(publicKey=>{ const algorithm=this.getAlgorithmParameters(publicKey.algorithm.name,"verify");if("hash"in algorithm.algorithm)algorithm.algorithm.hash.name=shaAlgorithm;
 let signatureValue=signature.valueBlock.valueHex;if(publicKey.algorithm.name==="ECDSA"){const asn1=asn1js.fromBER(signatureValue); signatureValue=(0,_common.createECDSASignatureFromCMS)(asn1.result);}
 
if(publicKey.algorithm.name==="RSA-PSS"){let pssParameters;try{pssParameters=new _RSASSAPSSParams.default({schema:signatureAlgorithm.algorithmParams});}catch(ex){return Promise.reject(ex);}
if("saltLength"in pssParameters)algorithm.algorithm.saltLength=pssParameters.saltLength;else algorithm.algorithm.saltLength=20;let hashAlgo="SHA-1";if("hashAlgorithm"in pssParameters){const hashAlgorithm=this.getAlgorithmByOID(pssParameters.hashAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return Promise.reject(`Unrecognized hash algorithm: ${pssParameters.hashAlgorithm.algorithmId}`);hashAlgo=hashAlgorithm.name;}
algorithm.algorithm.hash.name=hashAlgo;} 
return this.verify(algorithm.algorithm,publicKey,new Uint8Array(signatureValue),new Uint8Array(data));}); return sequence;}
}
exports.default=CryptoEngine;},{"./AlgorithmIdentifier.js":4,"./EncryptedContentInfo.js":34,"./PBES2Params.js":65,"./PBKDF2Params.js":66,"./PrivateKeyInfo.js":76,"./PublicKeyInfo.js":78,"./RSASSAPSSParams.js":83,"./common.js":110,"asn1js":112,"pvutils":113}],28:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class DigestInfo{constructor(parameters={}){ this.digestAlgorithm=(0,_pvutils.getParametersValue)(parameters,"digestAlgorithm",DigestInfo.defaultValues("digestAlgorithm"));this.digest=(0,_pvutils.getParametersValue)(parameters,"digest",DigestInfo.defaultValues("digest"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"digestAlgorithm":return new _AlgorithmIdentifier.default();case"digest":return new asn1js.OctetString();default:throw new Error(`Invalid member name for DigestInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"digestAlgorithm":return _AlgorithmIdentifier.default.compareWithDefault("algorithmId",memberValue.algorithmId)&&"algorithmParams"in memberValue===false;case"digest":return memberValue.isEqual(DigestInfo.defaultValues(memberName));default:throw new Error(`Invalid member name for DigestInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.digestAlgorithm||{names:{blockName:"digestAlgorithm"}}),new asn1js.OctetString({name:names.digest||"digest"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["digestAlgorithm","digest"]);
 const asn1=asn1js.compareSchema(schema,schema,DigestInfo.schema({names:{digestAlgorithm:{names:{blockName:"digestAlgorithm"}},digest:"digest"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for DigestInfo");
 this.digestAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.digestAlgorithm});this.digest=asn1.result.digest;}
toSchema(){ return new asn1js.Sequence({value:[this.digestAlgorithm.toSchema(),this.digest]});}
toJSON(){return{digestAlgorithm:this.digestAlgorithm.toJSON(),digest:this.digest.toJSON()};}
}
exports.default=DigestInfo;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],29:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class DistributionPoint{constructor(parameters={}){ if("distributionPoint"in parameters)
this.distributionPoint=(0,_pvutils.getParametersValue)(parameters,"distributionPoint",DistributionPoint.defaultValues("distributionPoint"));if("reasons"in parameters)
this.reasons=(0,_pvutils.getParametersValue)(parameters,"reasons",DistributionPoint.defaultValues("reasons"));if("cRLIssuer"in parameters)
this.cRLIssuer=(0,_pvutils.getParametersValue)(parameters,"cRLIssuer",DistributionPoint.defaultValues("cRLIssuer"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"distributionPoint":return[];case"reasons":return new asn1js.BitString();case"cRLIssuer":return[];default:throw new Error(`Invalid member name for DistributionPoint class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Choice({value:[new asn1js.Constructed({name:names.distributionPoint||"",optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({name:names.distributionPointNames||"",value:_GeneralName.default.schema()})]}),new asn1js.Constructed({name:names.distributionPoint||"",optional:true,idBlock:{tagClass:3, tagNumber:1
},value:_RelativeDistinguishedNames.default.schema().valueBlock.value})]})]}),new asn1js.Primitive({name:names.reasons||"",optional:true,idBlock:{tagClass:3, tagNumber:1
}}), new asn1js.Constructed({name:names.cRLIssuer||"",optional:true,idBlock:{tagClass:3, tagNumber:2
},value:[new asn1js.Repeated({name:names.cRLIssuerNames||"",value:_GeneralName.default.schema()})]})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["distributionPoint","distributionPointNames","reasons","cRLIssuer","cRLIssuerNames"]);
 const asn1=asn1js.compareSchema(schema,schema,DistributionPoint.schema({names:{distributionPoint:"distributionPoint",distributionPointNames:"distributionPointNames",reasons:"reasons",cRLIssuer:"cRLIssuer",cRLIssuerNames:"cRLIssuerNames"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for DistributionPoint");
 if("distributionPoint"in asn1.result){if(asn1.result.distributionPoint.idBlock.tagNumber===0) 
this.distributionPoint=Array.from(asn1.result.distributionPointNames,element=>new _GeneralName.default({schema:element}));if(asn1.result.distributionPoint.idBlock.tagNumber===1)
{this.distributionPoint=new _RelativeDistinguishedNames.default({schema:new asn1js.Sequence({value:asn1.result.distributionPoint.valueBlock.value})});}}
if("reasons"in asn1.result)this.reasons=new asn1js.BitString({valueHex:asn1.result.reasons.valueBlock.valueHex});if("cRLIssuer"in asn1.result)this.cRLIssuer=Array.from(asn1.result.cRLIssuerNames,element=>new _GeneralName.default({schema:element}));}
toSchema(){ const outputArray=[];if("distributionPoint"in this){let internalValue;if(this.distributionPoint instanceof Array){internalValue=new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.distributionPoint,element=>element.toSchema())});}else{internalValue=new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[this.distributionPoint.toSchema()]});}
outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[internalValue]}));}
if("reasons"in this){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:1
},valueHex:this.reasons.valueBlock.valueHex}));}
if("cRLIssuer"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:Array.from(this.cRLIssuer,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("distributionPoint"in this){if(this.distributionPoint instanceof Array)object.distributionPoint=Array.from(this.distributionPoint,element=>element.toJSON());else object.distributionPoint=this.distributionPoint.toJSON();}
if("reasons"in this)object.reasons=this.reasons.toJSON();if("cRLIssuer"in this)object.cRLIssuer=Array.from(this.cRLIssuer,element=>element.toJSON());return object;}
}
exports.default=DistributionPoint;},{"./GeneralName.js":40,"./RelativeDistinguishedNames.js":89,"asn1js":112,"pvutils":113}],30:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ECCCMSSharedInfo{constructor(parameters={}){ this.keyInfo=(0,_pvutils.getParametersValue)(parameters,"keyInfo",ECCCMSSharedInfo.defaultValues("keyInfo"));if("entityUInfo"in parameters)
this.entityUInfo=(0,_pvutils.getParametersValue)(parameters,"entityUInfo",ECCCMSSharedInfo.defaultValues("entityUInfo"));this.suppPubInfo=(0,_pvutils.getParametersValue)(parameters,"suppPubInfo",ECCCMSSharedInfo.defaultValues("suppPubInfo"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyInfo":return new _AlgorithmIdentifier.default();case"entityUInfo":return new asn1js.OctetString();case"suppPubInfo":return new asn1js.OctetString();default:throw new Error(`Invalid member name for ECCCMSSharedInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"keyInfo":case"entityUInfo":case"suppPubInfo":return memberValue.isEqual(ECCCMSSharedInfo.defaultValues(memberName));default:throw new Error(`Invalid member name for ECCCMSSharedInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.keyInfo||{}),new asn1js.Constructed({name:names.entityUInfo||"",idBlock:{tagClass:3, tagNumber:0
},optional:true,value:[new asn1js.OctetString()]}),new asn1js.Constructed({name:names.suppPubInfo||"",idBlock:{tagClass:3, tagNumber:2
},value:[new asn1js.OctetString()]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyInfo","entityUInfo","suppPubInfo"]);
 const asn1=asn1js.compareSchema(schema,schema,ECCCMSSharedInfo.schema({names:{keyInfo:{names:{blockName:"keyInfo"}},entityUInfo:"entityUInfo",suppPubInfo:"suppPubInfo"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ECCCMSSharedInfo");
 this.keyInfo=new _AlgorithmIdentifier.default({schema:asn1.result.keyInfo});if("entityUInfo"in asn1.result)this.entityUInfo=asn1.result.entityUInfo.valueBlock.value[0];this.suppPubInfo=asn1.result.suppPubInfo.valueBlock.value[0];}
toSchema(){ const outputArray=[];outputArray.push(this.keyInfo.toSchema());if("entityUInfo"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.entityUInfo]}));}
outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:[this.suppPubInfo]}));
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={keyInfo:this.keyInfo.toJSON()};if("entityUInfo"in this)_object.entityUInfo=this.entityUInfo.toJSON();_object.suppPubInfo=this.suppPubInfo.toJSON();return _object;}
}
exports.default=ECCCMSSharedInfo;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],31:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _ECPublicKey=_interopRequireDefault(require("./ECPublicKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ECPrivateKey{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",ECPrivateKey.defaultValues("version"));this.privateKey=(0,_pvutils.getParametersValue)(parameters,"privateKey",ECPrivateKey.defaultValues("privateKey"));if("namedCurve"in parameters)
this.namedCurve=(0,_pvutils.getParametersValue)(parameters,"namedCurve",ECPrivateKey.defaultValues("namedCurve"));if("publicKey"in parameters)
this.publicKey=(0,_pvutils.getParametersValue)(parameters,"publicKey",ECPrivateKey.defaultValues("publicKey"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"version":return 1;case"privateKey":return new asn1js.OctetString();case"namedCurve":return"";case"publicKey":return new _ECPublicKey.default();default:throw new Error(`Invalid member name for ECCPrivateKey class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===ECPrivateKey.defaultValues(memberName);case"privateKey":return memberValue.isEqual(ECPrivateKey.defaultValues(memberName));case"namedCurve":return memberValue==="";case"publicKey":return _ECPublicKey.default.compareWithDefault("namedCurve",memberValue.namedCurve)&&_ECPublicKey.default.compareWithDefault("x",memberValue.x)&&_ECPublicKey.default.compareWithDefault("y",memberValue.y);default:throw new Error(`Invalid member name for ECCPrivateKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.OctetString({name:names.privateKey||""}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.ObjectIdentifier({name:names.namedCurve||""})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.BitString({name:names.publicKey||""})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","privateKey","namedCurve","publicKey"]);
 const asn1=asn1js.compareSchema(schema,schema,ECPrivateKey.schema({names:{version:"version",privateKey:"privateKey",namedCurve:"namedCurve",publicKey:"publicKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ECPrivateKey");
 this.version=asn1.result.version.valueBlock.valueDec;this.privateKey=asn1.result.privateKey;if("namedCurve"in asn1.result)this.namedCurve=asn1.result.namedCurve.valueBlock.toString();if("publicKey"in asn1.result){const publicKeyData={schema:asn1.result.publicKey.valueBlock.valueHex};if("namedCurve"in this)publicKeyData.namedCurve=this.namedCurve;this.publicKey=new _ECPublicKey.default(publicKeyData);}
}
toSchema(){const outputArray=[new asn1js.Integer({value:this.version}),this.privateKey];if("namedCurve"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.ObjectIdentifier({value:this.namedCurve})]}));}
if("publicKey"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.BitString({valueHex:this.publicKey.toSchema().toBER(false)})]}));}
return new asn1js.Sequence({value:outputArray});}
toJSON(){if("namedCurve"in this===false||ECPrivateKey.compareWithDefault("namedCurve",this.namedCurve))throw new Error("Not enough information for making JSON: absent \"namedCurve\" value");let crvName="";switch(this.namedCurve){case"1.2.840.10045.3.1.7": crvName="P-256";break;case"1.3.132.0.34": crvName="P-384";break;case"1.3.132.0.35": crvName="P-521";break;default:}
const privateKeyJSON={crv:crvName,d:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.privateKey.valueBlock.valueHex),true,true,false)};if("publicKey"in this){const publicKeyJSON=this.publicKey.toJSON();privateKeyJSON.x=publicKeyJSON.x;privateKeyJSON.y=publicKeyJSON.y;}
return privateKeyJSON;}
fromJSON(json){let coodinateLength=0;if("crv"in json){switch(json.crv.toUpperCase()){case"P-256":this.namedCurve="1.2.840.10045.3.1.7";coodinateLength=32;break;case"P-384":this.namedCurve="1.3.132.0.34";coodinateLength=48;break;case"P-521":this.namedCurve="1.3.132.0.35";coodinateLength=66;break;default:}}else throw new Error("Absent mandatory parameter \"crv\"");if("d"in json){const convertBuffer=(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.d,true));if(convertBuffer.byteLength<coodinateLength){const buffer=new ArrayBuffer(coodinateLength);const view=new Uint8Array(buffer);const convertBufferView=new Uint8Array(convertBuffer);view.set(convertBufferView,1);this.privateKey=new asn1js.OctetString({valueHex:buffer});}else this.privateKey=new asn1js.OctetString({valueHex:convertBuffer.slice(0,coodinateLength)});}else throw new Error("Absent mandatory parameter \"d\"");if("x"in json&&"y"in json)this.publicKey=new _ECPublicKey.default({json});}
}
exports.default=ECPrivateKey;},{"./ECPublicKey.js":32,"asn1js":112,"pvutils":113}],32:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ECPublicKey{constructor(parameters={}){ this.x=(0,_pvutils.getParametersValue)(parameters,"x",ECPublicKey.defaultValues("x"));this.y=(0,_pvutils.getParametersValue)(parameters,"y",ECPublicKey.defaultValues("y"));this.namedCurve=(0,_pvutils.getParametersValue)(parameters,"namedCurve",ECPublicKey.defaultValues("namedCurve"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"x":case"y":return new ArrayBuffer(0);case"namedCurve":return"";default:throw new Error(`Invalid member name for ECCPublicKey class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"x":case"y":return(0,_pvutils.isEqualBuffer)(memberValue,ECPublicKey.defaultValues(memberName));case"namedCurve":return memberValue==="";default:throw new Error(`Invalid member name for ECCPublicKey class: ${memberName}`);}}
static schema(parameters={}){return new asn1js.RawData();}
fromSchema(schema){ if(schema instanceof ArrayBuffer===false)throw new Error("Object's schema was not verified against input data for ECPublicKey");const view=new Uint8Array(schema);if(view[0]!==0x04)throw new Error("Object's schema was not verified against input data for ECPublicKey");
 let coordinateLength;switch(this.namedCurve){case"1.2.840.10045.3.1.7": coordinateLength=32;break;case"1.3.132.0.34": coordinateLength=48;break;case"1.3.132.0.35": coordinateLength=66;break;default:throw new Error(`Incorrect curve OID: ${this.namedCurve}`);}
if(schema.byteLength!==coordinateLength*2+1)throw new Error("Object's schema was not verified against input data for ECPublicKey");this.x=schema.slice(1,coordinateLength+1);this.y=schema.slice(1+coordinateLength,coordinateLength*2+1);}
toSchema(){return new asn1js.RawData({data:(0,_pvutils.utilConcatBuf)(new Uint8Array([0x04]).buffer,this.x,this.y)});}
toJSON(){let crvName="";switch(this.namedCurve){case"1.2.840.10045.3.1.7": crvName="P-256";break;case"1.3.132.0.34": crvName="P-384";break;case"1.3.132.0.35": crvName="P-521";break;default:}
return{crv:crvName,x:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.x),true,true,false),y:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.y),true,true,false)};}
fromJSON(json){let coodinateLength=0;if("crv"in json){switch(json.crv.toUpperCase()){case"P-256":this.namedCurve="1.2.840.10045.3.1.7";coodinateLength=32;break;case"P-384":this.namedCurve="1.3.132.0.34";coodinateLength=48;break;case"P-521":this.namedCurve="1.3.132.0.35";coodinateLength=66;break;default:}}else throw new Error("Absent mandatory parameter \"crv\"");if("x"in json){const convertBuffer=(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.x,true));if(convertBuffer.byteLength<coodinateLength){this.x=new ArrayBuffer(coodinateLength);const view=new Uint8Array(this.x);const convertBufferView=new Uint8Array(convertBuffer);view.set(convertBufferView,1);}else this.x=convertBuffer.slice(0,coodinateLength);}else throw new Error("Absent mandatory parameter \"x\"");if("y"in json){const convertBuffer=(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.y,true));if(convertBuffer.byteLength<coodinateLength){this.y=new ArrayBuffer(coodinateLength);const view=new Uint8Array(this.y);const convertBufferView=new Uint8Array(convertBuffer);view.set(convertBufferView,1);}else this.y=convertBuffer.slice(0,coodinateLength);}else throw new Error("Absent mandatory parameter \"y\"");}
}
exports.default=ECPublicKey;},{"asn1js":112,"pvutils":113}],33:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class EncapsulatedContentInfo{constructor(parameters={}){ this.eContentType=(0,_pvutils.getParametersValue)(parameters,"eContentType",EncapsulatedContentInfo.defaultValues("eContentType"));if("eContent"in parameters){this.eContent=(0,_pvutils.getParametersValue)(parameters,"eContent",EncapsulatedContentInfo.defaultValues("eContent"));if(this.eContent.idBlock.tagClass===1&&this.eContent.idBlock.tagNumber===4){ if(this.eContent.idBlock.isConstructed===false){const constrString=new asn1js.OctetString({idBlock:{isConstructed:true},isConstructed:true});let offset=0;let length=this.eContent.valueBlock.valueHex.byteLength;while(length>0){const pieceView=new Uint8Array(this.eContent.valueBlock.valueHex,offset,offset+65536>this.eContent.valueBlock.valueHex.byteLength?this.eContent.valueBlock.valueHex.byteLength-offset:65536);const _array=new ArrayBuffer(pieceView.length);const _view=new Uint8Array(_array);for(let i=0;i<_view.length;i++)_view[i]=pieceView[i];constrString.valueBlock.value.push(new asn1js.OctetString({valueHex:_array}));length-=pieceView.length;offset+=pieceView.length;}
this.eContent=constrString;}
}}
 
if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"eContentType":return"";case"eContent":return new asn1js.OctetString();default:throw new Error(`Invalid member name for EncapsulatedContentInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"eContentType":return memberValue==="";case"eContent":{if(memberValue.idBlock.tagClass===1&&memberValue.idBlock.tagNumber===4)return memberValue.isEqual(EncapsulatedContentInfo.defaultValues("eContent"));return false;}
default:throw new Error(`Invalid member name for EncapsulatedContentInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.eContentType||""}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.eContent||""})
]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["eContentType","eContent"]);
 const asn1=asn1js.compareSchema(schema,schema,EncapsulatedContentInfo.schema({names:{eContentType:"eContentType",eContent:"eContent"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for EncapsulatedContentInfo");
 this.eContentType=asn1.result.eContentType.valueBlock.toString();if("eContent"in asn1.result)this.eContent=asn1.result.eContent;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.eContentType}));if("eContent"in this){if(EncapsulatedContentInfo.compareWithDefault("eContent",this.eContent)===false){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[this.eContent]}));}}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={eContentType:this.eContentType};if("eContent"in this){if(EncapsulatedContentInfo.compareWithDefault("eContent",this.eContent)===false)_object.eContent=this.eContent.toJSON();}
return _object;}
}
exports.default=EncapsulatedContentInfo;},{"asn1js":112,"pvutils":113}],34:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class EncryptedContentInfo{constructor(parameters={}){ this.contentType=(0,_pvutils.getParametersValue)(parameters,"contentType",EncryptedContentInfo.defaultValues("contentType"));this.contentEncryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"contentEncryptionAlgorithm",EncryptedContentInfo.defaultValues("contentEncryptionAlgorithm"));if("encryptedContent"in parameters){this.encryptedContent=parameters.encryptedContent;if(this.encryptedContent.idBlock.tagClass===1&&this.encryptedContent.idBlock.tagNumber===4){ if(this.encryptedContent.idBlock.isConstructed===false){const constrString=new asn1js.OctetString({idBlock:{isConstructed:true},isConstructed:true});let offset=0;let length=this.encryptedContent.valueBlock.valueHex.byteLength;while(length>0){const pieceView=new Uint8Array(this.encryptedContent.valueBlock.valueHex,offset,offset+1024>this.encryptedContent.valueBlock.valueHex.byteLength?this.encryptedContent.valueBlock.valueHex.byteLength-offset:1024);const _array=new ArrayBuffer(pieceView.length);const _view=new Uint8Array(_array);for(let i=0;i<_view.length;i++)_view[i]=pieceView[i];constrString.valueBlock.value.push(new asn1js.OctetString({valueHex:_array}));length-=pieceView.length;offset+=pieceView.length;}
this.encryptedContent=constrString;}
}}
 
if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"contentType":return"";case"contentEncryptionAlgorithm":return new _AlgorithmIdentifier.default();case"encryptedContent":return new asn1js.OctetString();default:throw new Error(`Invalid member name for EncryptedContentInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"contentType":return memberValue==="";case"contentEncryptionAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"encryptedContent":return memberValue.isEqual(EncryptedContentInfo.defaultValues(memberName));default:throw new Error(`Invalid member name for EncryptedContentInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.contentType||""}),_AlgorithmIdentifier.default.schema(names.contentEncryptionAlgorithm||{}), new asn1js.Choice({value:[new asn1js.Constructed({name:names.encryptedContent||"",idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({value:new asn1js.OctetString()})]}),new asn1js.Primitive({name:names.encryptedContent||"",idBlock:{tagClass:3, tagNumber:0
}})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["contentType","contentEncryptionAlgorithm","encryptedContent"]);
 const asn1=asn1js.compareSchema(schema,schema,EncryptedContentInfo.schema({names:{contentType:"contentType",contentEncryptionAlgorithm:{names:{blockName:"contentEncryptionAlgorithm"}},encryptedContent:"encryptedContent"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for EncryptedContentInfo");
 this.contentType=asn1.result.contentType.valueBlock.toString();this.contentEncryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.contentEncryptionAlgorithm});if("encryptedContent"in asn1.result){this.encryptedContent=asn1.result.encryptedContent;this.encryptedContent.idBlock.tagClass=1; this.encryptedContent.idBlock.tagNumber=4;}
}
toSchema(){ const sequenceLengthBlock={isIndefiniteForm:false};const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.contentType}));outputArray.push(this.contentEncryptionAlgorithm.toSchema());if("encryptedContent"in this){sequenceLengthBlock.isIndefiniteForm=this.encryptedContent.idBlock.isConstructed;const encryptedValue=this.encryptedContent;encryptedValue.idBlock.tagClass=3; encryptedValue.idBlock.tagNumber=0;encryptedValue.lenBlock.isIndefiniteForm=this.encryptedContent.idBlock.isConstructed;outputArray.push(encryptedValue);}
 
return new asn1js.Sequence({lenBlock:sequenceLengthBlock,value:outputArray});}
toJSON(){const _object={contentType:this.contentType,contentEncryptionAlgorithm:this.contentEncryptionAlgorithm.toJSON()};if("encryptedContent"in this)_object.encryptedContent=this.encryptedContent.toJSON();return _object;}
}
exports.default=EncryptedContentInfo;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],35:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _EncryptedContentInfo=_interopRequireDefault(require("./EncryptedContentInfo.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class EncryptedData{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",EncryptedData.defaultValues("version"));this.encryptedContentInfo=(0,_pvutils.getParametersValue)(parameters,"encryptedContentInfo",EncryptedData.defaultValues("encryptedContentInfo"));if("unprotectedAttrs"in parameters)
this.unprotectedAttrs=(0,_pvutils.getParametersValue)(parameters,"unprotectedAttrs",EncryptedData.defaultValues("unprotectedAttrs"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"encryptedContentInfo":return new _EncryptedContentInfo.default();case"unprotectedAttrs":return[];default:throw new Error(`Invalid member name for EncryptedData class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===0;case"encryptedContentInfo":return _EncryptedContentInfo.default.compareWithDefault("contentType",memberValue.contentType)&&_EncryptedContentInfo.default.compareWithDefault("contentEncryptionAlgorithm",memberValue.contentEncryptionAlgorithm)&&_EncryptedContentInfo.default.compareWithDefault("encryptedContent",memberValue.encryptedContent);case"unprotectedAttrs":return memberValue.length===0;default:throw new Error(`Invalid member name for EncryptedData class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),_EncryptedContentInfo.default.schema(names.encryptedContentInfo||{}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Repeated({name:names.unprotectedAttrs||"",value:_Attribute.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","encryptedContentInfo","unprotectedAttrs"]);
 const asn1=asn1js.compareSchema(schema,schema,EncryptedData.schema({names:{version:"version",encryptedContentInfo:{names:{blockName:"encryptedContentInfo"}},unprotectedAttrs:"unprotectedAttrs"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for EncryptedData");
 this.version=asn1.result.version.valueBlock.valueDec;this.encryptedContentInfo=new _EncryptedContentInfo.default({schema:asn1.result.encryptedContentInfo});if("unprotectedAttrs"in asn1.result)this.unprotectedAttrs=Array.from(asn1.result.unprotectedAttrs,element=>new _Attribute.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(this.encryptedContentInfo.toSchema());if("unprotectedAttrs"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.unprotectedAttrs,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version,encryptedContentInfo:this.encryptedContentInfo.toJSON()};if("unprotectedAttrs"in this)_object.unprotectedAttrs=Array.from(this.unprotectedAttrs,element=>element.toJSON());return _object;}
encrypt(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");
 const engine=(0,_common.getEngine)();if(typeof engine==="undefined")return Promise.reject("Unable to initialize cryptographic engine");
 parameters.contentType="1.2.840.113549.1.7.1"; if("encryptEncryptedContentInfo"in engine.subtle){return engine.subtle.encryptEncryptedContentInfo(parameters).then(result=>{this.encryptedContentInfo=result;});}
return Promise.reject(`No support for "encryptEncryptedContentInfo" in current crypto engine ${engine.name}`);}
decrypt(parameters){ if(parameters instanceof Object===false)return Promise.reject("Parameters must have type \"Object\"");
 const engine=(0,_common.getEngine)();if(typeof engine==="undefined")return Promise.reject("Unable to initialize cryptographic engine");
 parameters.encryptedContentInfo=this.encryptedContentInfo; if("decryptEncryptedContentInfo"in engine.subtle)return engine.subtle.decryptEncryptedContentInfo(parameters);return Promise.reject(`No support for "decryptEncryptedContentInfo" in current crypto engine ${engine.name}`);}
}
exports.default=EncryptedData;},{"./Attribute.js":6,"./EncryptedContentInfo.js":34,"./common.js":110,"asn1js":112,"pvutils":113}],36:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _OriginatorInfo=_interopRequireDefault(require("./OriginatorInfo.js"));var _RecipientInfo=_interopRequireDefault(require("./RecipientInfo.js"));var _EncryptedContentInfo=_interopRequireDefault(require("./EncryptedContentInfo.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _RSAESOAEPParams=_interopRequireDefault(require("./RSAESOAEPParams.js"));var _KeyTransRecipientInfo=_interopRequireDefault(require("./KeyTransRecipientInfo.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _RecipientEncryptedKey=_interopRequireDefault(require("./RecipientEncryptedKey.js"));var _KeyAgreeRecipientIdentifier=_interopRequireDefault(require("./KeyAgreeRecipientIdentifier.js"));var _KeyAgreeRecipientInfo=_interopRequireDefault(require("./KeyAgreeRecipientInfo.js"));var _RecipientEncryptedKeys=_interopRequireDefault(require("./RecipientEncryptedKeys.js"));var _KEKRecipientInfo=_interopRequireDefault(require("./KEKRecipientInfo.js"));var _KEKIdentifier=_interopRequireDefault(require("./KEKIdentifier.js"));var _PBKDF2Params=_interopRequireDefault(require("./PBKDF2Params.js"));var _PasswordRecipientinfo=_interopRequireDefault(require("./PasswordRecipientinfo.js"));var _ECCCMSSharedInfo=_interopRequireDefault(require("./ECCCMSSharedInfo.js"));var _OriginatorIdentifierOrKey=_interopRequireDefault(require("./OriginatorIdentifierOrKey.js"));var _OriginatorPublicKey=_interopRequireDefault(require("./OriginatorPublicKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class EnvelopedData{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",EnvelopedData.defaultValues("version"));if("originatorInfo"in parameters)
this.originatorInfo=(0,_pvutils.getParametersValue)(parameters,"originatorInfo",EnvelopedData.defaultValues("originatorInfo"));this.recipientInfos=(0,_pvutils.getParametersValue)(parameters,"recipientInfos",EnvelopedData.defaultValues("recipientInfos"));this.encryptedContentInfo=(0,_pvutils.getParametersValue)(parameters,"encryptedContentInfo",EnvelopedData.defaultValues("encryptedContentInfo"));if("unprotectedAttrs"in parameters)
this.unprotectedAttrs=(0,_pvutils.getParametersValue)(parameters,"unprotectedAttrs",EnvelopedData.defaultValues("unprotectedAttrs"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"originatorInfo":return new _OriginatorInfo.default();case"recipientInfos":return[];case"encryptedContentInfo":return new _EncryptedContentInfo.default();case"unprotectedAttrs":return[];default:throw new Error(`Invalid member name for EnvelopedData class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===EnvelopedData.defaultValues(memberName);case"originatorInfo":return memberValue.certs.certificates.length===0&&memberValue.crls.crls.length===0;case"recipientInfos":case"unprotectedAttrs":return memberValue.length===0;case"encryptedContentInfo":return _EncryptedContentInfo.default.compareWithDefault("contentType",memberValue.contentType)&&_EncryptedContentInfo.default.compareWithDefault("contentEncryptionAlgorithm",memberValue.contentEncryptionAlgorithm)&&_EncryptedContentInfo.default.compareWithDefault("encryptedContent",memberValue.encryptedContent);default:throw new Error(`Invalid member name for EnvelopedData class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.Constructed({name:names.originatorInfo||"",optional:true,idBlock:{tagClass:3, tagNumber:0
},value:_OriginatorInfo.default.schema().valueBlock.value}),new asn1js.Set({value:[new asn1js.Repeated({name:names.recipientInfos||"",value:_RecipientInfo.default.schema()})]}),_EncryptedContentInfo.default.schema(names.encryptedContentInfo||{}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Repeated({name:names.unprotectedAttrs||"",value:_Attribute.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","originatorInfo","recipientInfos","encryptedContentInfo","unprotectedAttrs"]);
 const asn1=asn1js.compareSchema(schema,schema,EnvelopedData.schema({names:{version:"version",originatorInfo:"originatorInfo",recipientInfos:"recipientInfos",encryptedContentInfo:{names:{blockName:"encryptedContentInfo"}},unprotectedAttrs:"unprotectedAttrs"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for EnvelopedData");
 this.version=asn1.result.version.valueBlock.valueDec;if("originatorInfo"in asn1.result){this.originatorInfo=new _OriginatorInfo.default({schema:new asn1js.Sequence({value:asn1.result.originatorInfo.valueBlock.value})});}
this.recipientInfos=Array.from(asn1.result.recipientInfos,element=>new _RecipientInfo.default({schema:element}));this.encryptedContentInfo=new _EncryptedContentInfo.default({schema:asn1.result.encryptedContentInfo});if("unprotectedAttrs"in asn1.result)this.unprotectedAttrs=Array.from(asn1.result.unprotectedAttrs,element=>new _Attribute.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));if("originatorInfo"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:this.originatorInfo.toSchema().valueBlock.value}));}
outputArray.push(new asn1js.Set({value:Array.from(this.recipientInfos,element=>element.toSchema())}));outputArray.push(this.encryptedContentInfo.toSchema());if("unprotectedAttrs"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.unprotectedAttrs,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version};if("originatorInfo"in this)_object.originatorInfo=this.originatorInfo.toJSON();_object.recipientInfos=Array.from(this.recipientInfos,element=>element.toJSON());_object.encryptedContentInfo=this.encryptedContentInfo.toJSON();if("unprotectedAttrs"in this)_object.unprotectedAttrs=Array.from(this.unprotectedAttrs,element=>element.toJSON());return _object;}
addRecipientByCertificate(certificate,parameters,variant){ const encryptionParameters=parameters||{};
 if(certificate.subjectPublicKeyInfo.algorithm.algorithmId.indexOf("1.2.840.113549")!==-1)variant=1; else{if(certificate.subjectPublicKeyInfo.algorithm.algorithmId.indexOf("1.2.840.10045")!==-1)variant=2; else throw new Error(`Unknown type of certificate's public key: ${certificate.subjectPublicKeyInfo.algorithm.algorithmId}`);}
 
if("oaepHashAlgorithm"in encryptionParameters===false)encryptionParameters.oaepHashAlgorithm="SHA-512";if("kdfAlgorithm"in encryptionParameters===false)encryptionParameters.kdfAlgorithm="SHA-512";if("kekEncryptionLength"in encryptionParameters===false)encryptionParameters.kekEncryptionLength=256;
 switch(variant){case 1:{ const oaepOID=(0,_common.getOIDByAlgorithm)({name:"RSA-OAEP"});if(oaepOID==="")throw new Error("Can not find OID for OAEP");
 const hashOID=(0,_common.getOIDByAlgorithm)({name:encryptionParameters.oaepHashAlgorithm});if(hashOID==="")throw new Error(`Unknown OAEP hash algorithm: ${encryptionParameters.oaepHashAlgorithm}`);const hashAlgorithm=new _AlgorithmIdentifier.default({algorithmId:hashOID,algorithmParams:new asn1js.Null()});const rsaOAEPParams=new _RSAESOAEPParams.default({hashAlgorithm,maskGenAlgorithm:new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.8", algorithmParams:hashAlgorithm.toSchema()})});
 const keyInfo=new _KeyTransRecipientInfo.default({version:0,rid:new _IssuerAndSerialNumber.default({issuer:certificate.issuer,serialNumber:certificate.serialNumber}),keyEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:oaepOID,algorithmParams:rsaOAEPParams.toSchema()}),recipientCertificate:certificate
});
this.recipientInfos.push(new _RecipientInfo.default({variant:1,value:keyInfo}));}
break;case 2:{ const encryptedKey=new _RecipientEncryptedKey.default({rid:new _KeyAgreeRecipientIdentifier.default({variant:1,value:new _IssuerAndSerialNumber.default({issuer:certificate.issuer,serialNumber:certificate.serialNumber})})
});
 const aesKWoid=(0,_common.getOIDByAlgorithm)({name:"AES-KW",length:encryptionParameters.kekEncryptionLength});if(aesKWoid==="")throw new Error(`Unknown length for key encryption algorithm: ${encryptionParameters.kekEncryptionLength}`);const aesKW=new _AlgorithmIdentifier.default({algorithmId:aesKWoid,algorithmParams:new asn1js.Null()});
 const ecdhOID=(0,_common.getOIDByAlgorithm)({name:"ECDH",kdf:encryptionParameters.kdfAlgorithm});if(ecdhOID==="")throw new Error(`Unknown KDF algorithm: ${encryptionParameters.kdfAlgorithm}`);
 const ukmBuffer=new ArrayBuffer(64);const ukmView=new Uint8Array(ukmBuffer);(0,_common.getRandomValues)(ukmView); const keyInfo=new _KeyAgreeRecipientInfo.default({version:3, ukm:new asn1js.OctetString({valueHex:ukmBuffer}),keyEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:ecdhOID,algorithmParams:aesKW.toSchema()}),recipientEncryptedKeys:new _RecipientEncryptedKeys.default({encryptedKeys:[encryptedKey]}),recipientCertificate:certificate});
this.recipientInfos.push(new _RecipientInfo.default({variant:2,value:keyInfo}));}
break;default:throw new Error(`Unknown "variant" value: ${variant}`);} 
return true;}
addRecipientByPreDefinedData(preDefinedData,parameters,variant){ const encryptionParameters=parameters||{};
 if(preDefinedData instanceof ArrayBuffer===false)throw new Error("Please pass \"preDefinedData\" in ArrayBuffer type");if(preDefinedData.byteLength===0)throw new Error("Pre-defined data could have zero length");
 if("keyIdentifier"in encryptionParameters===false){const keyIdentifierBuffer=new ArrayBuffer(16);const keyIdentifierView=new Uint8Array(keyIdentifierBuffer);(0,_common.getRandomValues)(keyIdentifierView);encryptionParameters.keyIdentifier=keyIdentifierBuffer;}
if("hmacHashAlgorithm"in encryptionParameters===false)encryptionParameters.hmacHashAlgorithm="SHA-512";if("iterationCount"in encryptionParameters===false)encryptionParameters.iterationCount=2048;if("keyEncryptionAlgorithm"in encryptionParameters===false){encryptionParameters.keyEncryptionAlgorithm={name:"AES-KW",length:256};}
if("keyEncryptionAlgorithmParams"in encryptionParameters===false)encryptionParameters.keyEncryptionAlgorithmParams=new asn1js.Null();
 switch(variant){case 1:{ const kekOID=(0,_common.getOIDByAlgorithm)(encryptionParameters.keyEncryptionAlgorithm);if(kekOID==="")throw new Error("Incorrect value for \"keyEncryptionAlgorithm\"");
 const keyInfo=new _KEKRecipientInfo.default({version:4,kekid:new _KEKIdentifier.default({keyIdentifier:new asn1js.OctetString({valueHex:encryptionParameters.keyIdentifier})}),keyEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:kekOID,algorithmParams:encryptionParameters.keyEncryptionAlgorithmParams}),preDefinedKEK:preDefinedData
});
this.recipientInfos.push(new _RecipientInfo.default({variant:3,value:keyInfo}));}
break;case 2:{ const pbkdf2OID=(0,_common.getOIDByAlgorithm)({name:"PBKDF2"});if(pbkdf2OID==="")throw new Error("Can not find OID for PBKDF2");
 const saltBuffer=new ArrayBuffer(64);const saltView=new Uint8Array(saltBuffer);(0,_common.getRandomValues)(saltView);
 const hmacOID=(0,_common.getOIDByAlgorithm)({name:"HMAC",hash:{name:encryptionParameters.hmacHashAlgorithm}});if(hmacOID==="")throw new Error(`Incorrect value for "hmacHashAlgorithm": ${encryptionParameters.hmacHashAlgorithm}`);
 const pbkdf2Params=new _PBKDF2Params.default({salt:new asn1js.OctetString({valueHex:saltBuffer}),iterationCount:encryptionParameters.iterationCount,prf:new _AlgorithmIdentifier.default({algorithmId:hmacOID,algorithmParams:new asn1js.Null()})});
 const kekOID=(0,_common.getOIDByAlgorithm)(encryptionParameters.keyEncryptionAlgorithm);if(kekOID==="")throw new Error("Incorrect value for \"keyEncryptionAlgorithm\"");
 const keyInfo=new _PasswordRecipientinfo.default({version:0,keyDerivationAlgorithm:new _AlgorithmIdentifier.default({algorithmId:pbkdf2OID,algorithmParams:pbkdf2Params.toSchema()}),keyEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:kekOID,algorithmParams:encryptionParameters.keyEncryptionAlgorithmParams}),password:preDefinedData
});
this.recipientInfos.push(new _RecipientInfo.default({variant:4,value:keyInfo}));}
break;default:throw new Error(`Unknown value for "variant": ${variant}`);}
}
encrypt(contentEncryptionAlgorithm,contentToEncrypt){ let sequence=Promise.resolve();const ivBuffer=new ArrayBuffer(16); const ivView=new Uint8Array(ivBuffer);(0,_common.getRandomValues)(ivView);const contentView=new Uint8Array(contentToEncrypt);let sessionKey;let encryptedContent;let exportedSessionKey;const recipientsPromises=[];const _this=this;
 const contentEncryptionOID=(0,_common.getOIDByAlgorithm)(contentEncryptionAlgorithm);if(contentEncryptionOID==="")return Promise.reject("Wrong \"contentEncryptionAlgorithm\" value");
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 sequence=sequence.then(()=>crypto.generateKey(contentEncryptionAlgorithm,true,["encrypt"]));
 sequence=sequence.then(result=>{sessionKey=result;return crypto.encrypt({name:contentEncryptionAlgorithm.name,iv:ivView},sessionKey,contentView);},error=>Promise.reject(error));
 sequence=sequence.then(result=>{ encryptedContent=result; return crypto.exportKey("raw",sessionKey);},error=>Promise.reject(error)).then(result=>{exportedSessionKey=result;return true;},error=>Promise.reject(error));
 sequence=sequence.then(()=>{this.version=2;this.encryptedContentInfo=new _EncryptedContentInfo.default({contentType:"1.2.840.113549.1.7.1",contentEncryptionAlgorithm:new _AlgorithmIdentifier.default({algorithmId:contentEncryptionOID,algorithmParams:new asn1js.OctetString({valueHex:ivBuffer})}),encryptedContent:new asn1js.OctetString({valueHex:encryptedContent})});},error=>Promise.reject(error));
 function SubKeyAgreeRecipientInfo(index){ let currentSequence=Promise.resolve();let ecdhPublicKey;let ecdhPrivateKey;let recipientCurve;let recipientCurveLength;let exportedECDHPublicKey;
 currentSequence=currentSequence.then(()=>{const curveObject=_this.recipientInfos[index].value.recipientCertificate.subjectPublicKeyInfo.algorithm.algorithmParams;if(curveObject instanceof asn1js.ObjectIdentifier===false)return Promise.reject(`Incorrect "recipientCertificate" for index ${index}`);const curveOID=curveObject.valueBlock.toString();switch(curveOID){case"1.2.840.10045.3.1.7":recipientCurve="P-256";recipientCurveLength=256;break;case"1.3.132.0.34":recipientCurve="P-384";recipientCurveLength=384;break;case"1.3.132.0.35":recipientCurve="P-521";recipientCurveLength=528;break;default:return Promise.reject(`Incorrect curve OID for index ${index}`);}
return recipientCurve;},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.generateKey({name:"ECDH",namedCurve:result},true,["deriveBits"]),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ecdhPublicKey=result.publicKey;ecdhPrivateKey=result.privateKey;return crypto.exportKey("spki",ecdhPublicKey);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{exportedECDHPublicKey=result;return _this.recipientInfos[index].value.recipientCertificate.getPublicKey({algorithm:{algorithm:{name:"ECDH",namedCurve:recipientCurve},usages:[]}});},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.deriveBits({name:"ECDH",public:result},ecdhPrivateKey,recipientCurveLength),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const aesKWAlgorithm=new _AlgorithmIdentifier.default({schema:_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams});const KWalgorithm=(0,_common.getAlgorithmByOID)(aesKWAlgorithm.algorithmId);if("name"in KWalgorithm===false)return Promise.reject(`Incorrect OID for key encryption algorithm: ${aesKWAlgorithm.algorithmId}`);
 let kwLength=KWalgorithm.length;const kwLengthBuffer=new ArrayBuffer(4);const kwLengthView=new Uint8Array(kwLengthBuffer);for(let j=3;j>=0;j--){kwLengthView[j]=kwLength;kwLength>>=8;}
 
const eccInfo=new _ECCCMSSharedInfo.default({keyInfo:new _AlgorithmIdentifier.default({algorithmId:aesKWAlgorithm.algorithmId,algorithmParams:new asn1js.Null()}),entityUInfo:_this.recipientInfos[index].value.ukm,suppPubInfo:new asn1js.OctetString({valueHex:kwLengthBuffer})});const encodedInfo=eccInfo.toSchema().toBER(false);
 const ecdhAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in ecdhAlgorithm===false)return Promise.reject(`Incorrect OID for key encryption algorithm: ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`); return(0,_common.kdf)(ecdhAlgorithm.kdf,result,KWalgorithm.length,encodedInfo);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.importKey("raw",result,{name:"AES-KW"},true,["wrapKey"]),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.wrapKey("raw",sessionKey,result,{name:"AES-KW"}),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const asn1=asn1js.fromBER(exportedECDHPublicKey);const originator=new _OriginatorIdentifierOrKey.default();originator.variant=3;originator.value=new _OriginatorPublicKey.default({schema:asn1.result}); if("algorithmParams"in originator.value.algorithm)delete originator.value.algorithm.algorithmParams;_this.recipientInfos[index].value.originator=originator;
 _this.recipientInfos[index].value.recipientEncryptedKeys.encryptedKeys[0].encryptedKey=new asn1js.OctetString({valueHex:result});},error=>Promise.reject(error)); return currentSequence;}
function SubKeyTransRecipientInfo(index){ let currentSequence=Promise.resolve();
 currentSequence=currentSequence.then(()=>{ const schema=_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams;const rsaOAEPParams=new _RSAESOAEPParams.default({schema});const hashAlgorithm=(0,_common.getAlgorithmByOID)(rsaOAEPParams.hashAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return Promise.reject(`Incorrect OID for hash algorithm: ${rsaOAEPParams.hashAlgorithm.algorithmId}`); return _this.recipientInfos[index].value.recipientCertificate.getPublicKey({algorithm:{algorithm:{name:"RSA-OAEP",hash:{name:hashAlgorithm.name}},usages:["encrypt","wrapKey"]}});},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.encrypt(result.algorithm,result,exportedSessionKey),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ _this.recipientInfos[index].value.encryptedKey=new asn1js.OctetString({valueHex:result});},error=>Promise.reject(error)); return currentSequence;}
function SubKEKRecipientInfo(index){ let currentSequence=Promise.resolve();let kekAlgorithm;
 currentSequence=currentSequence.then(()=>{kekAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in kekAlgorithm===false)return Promise.reject(`Incorrect OID for "keyEncryptionAlgorithm": ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`); return crypto.importKey("raw",new Uint8Array(_this.recipientInfos[index].value.preDefinedKEK),kekAlgorithm,true,["wrapKey"]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.wrapKey("raw",sessionKey,result,kekAlgorithm),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ _this.recipientInfos[index].value.encryptedKey=new asn1js.OctetString({valueHex:result});},error=>Promise.reject(error)); return currentSequence;}
function SubPasswordRecipientinfo(index){ let currentSequence=Promise.resolve();let pbkdf2Params;let kekAlgorithm;
 currentSequence=currentSequence.then(()=>{if("keyDerivationAlgorithm"in _this.recipientInfos[index].value===false)return Promise.reject("Please append encoded \"keyDerivationAlgorithm\"");if("algorithmParams"in _this.recipientInfos[index].value.keyDerivationAlgorithm===false)return Promise.reject("Incorrectly encoded \"keyDerivationAlgorithm\"");try{pbkdf2Params=new _PBKDF2Params.default({schema:_this.recipientInfos[index].value.keyDerivationAlgorithm.algorithmParams});}catch(ex){return Promise.reject("Incorrectly encoded \"keyDerivationAlgorithm\"");}
return Promise.resolve();},error=>Promise.reject(error));
 currentSequence=currentSequence.then(()=>{const passwordView=new Uint8Array(_this.recipientInfos[index].value.password);return crypto.importKey("raw",passwordView,"PBKDF2",false,["deriveKey"]);},error=>Promise.reject(error));
currentSequence=currentSequence.then(result=>{kekAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in kekAlgorithm===false)return Promise.reject(`Incorrect OID for "keyEncryptionAlgorithm": ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`);
 let hmacHashAlgorithm="SHA-1";if("prf"in pbkdf2Params){const algorithm=(0,_common.getAlgorithmByOID)(pbkdf2Params.prf.algorithmId);if("name"in algorithm===false)return Promise.reject("Incorrect OID for HMAC hash algorithm");hmacHashAlgorithm=algorithm.hash.name;}
 
const saltView=new Uint8Array(pbkdf2Params.salt.valueBlock.valueHex);
 const iterations=pbkdf2Params.iterationCount; return crypto.deriveKey({name:"PBKDF2",hash:{name:hmacHashAlgorithm},salt:saltView,iterations},result,kekAlgorithm,true,["wrapKey"]);},error=>Promise.reject(error));
currentSequence=currentSequence.then(result=>crypto.wrapKey("raw",sessionKey,result,kekAlgorithm),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ _this.recipientInfos[index].value.encryptedKey=new asn1js.OctetString({valueHex:result});},error=>Promise.reject(error)); return currentSequence;}

sequence=sequence.then(()=>{for(let i=0;i<this.recipientInfos.length;i++){ let currentSequence=Promise.resolve(); switch(this.recipientInfos[i].variant){case 1: currentSequence=SubKeyTransRecipientInfo(i);break;case 2: currentSequence=SubKeyAgreeRecipientInfo(i);break;case 3: currentSequence=SubKEKRecipientInfo(i);break;case 4: currentSequence=SubPasswordRecipientinfo(i);break;default:return Promise.reject(`Uknown recipient type in array with index ${i}`);}
recipientsPromises.push(currentSequence);}
return Promise.all(recipientsPromises);},error=>Promise.reject(error)); return sequence;}
decrypt(recipientIndex,parameters){ let sequence=Promise.resolve();const decryptionParameters=parameters||{};const _this=this;
 if(recipientIndex+1>this.recipientInfos.length)return Promise.reject(`Maximum value for "index" is: ${this.recipientInfos.length - 1}`);
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 function SubKeyAgreeRecipientInfo(index){ let currentSequence=Promise.resolve();let recipientCurve;let recipientCurveLength;let curveOID;let ecdhPrivateKey;
 currentSequence=currentSequence.then(()=>{if("recipientCertificate"in decryptionParameters===false)return Promise.reject("Parameter \"recipientCertificate\" is mandatory for \"KeyAgreeRecipientInfo\"");if("recipientPrivateKey"in decryptionParameters===false)return Promise.reject("Parameter \"recipientPrivateKey\" is mandatory for \"KeyAgreeRecipientInfo\"");const curveObject=decryptionParameters.recipientCertificate.subjectPublicKeyInfo.algorithm.algorithmParams;if(curveObject instanceof asn1js.ObjectIdentifier===false)return Promise.reject(`Incorrect "recipientCertificate" for index ${index}`);curveOID=curveObject.valueBlock.toString();switch(curveOID){case"1.2.840.10045.3.1.7":recipientCurve="P-256";recipientCurveLength=256;break;case"1.3.132.0.34":recipientCurve="P-384";recipientCurveLength=384;break;case"1.3.132.0.35":recipientCurve="P-521";recipientCurveLength=528;break;default:return Promise.reject(`Incorrect curve OID for index ${index}`);}
return crypto.importKey("pkcs8",decryptionParameters.recipientPrivateKey,{name:"ECDH",namedCurve:recipientCurve},true,["deriveBits"]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ecdhPrivateKey=result; if("algorithmParams"in _this.recipientInfos[index].value.originator.value.algorithm===false)_this.recipientInfos[index].value.originator.value.algorithm.algorithmParams=new asn1js.ObjectIdentifier({value:curveOID});
 const buffer=_this.recipientInfos[index].value.originator.value.toSchema().toBER(false); return crypto.importKey("spki",buffer,{name:"ECDH",namedCurve:recipientCurve},true,[]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.deriveBits({name:"ECDH",public:result},ecdhPrivateKey,recipientCurveLength),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const aesKWAlgorithm=new _AlgorithmIdentifier.default({schema:_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams});const KWalgorithm=(0,_common.getAlgorithmByOID)(aesKWAlgorithm.algorithmId);if("name"in KWalgorithm===false)return Promise.reject(`Incorrect OID for key encryption algorithm: ${aesKWAlgorithm.algorithmId}`);
 let kwLength=KWalgorithm.length;const kwLengthBuffer=new ArrayBuffer(4);const kwLengthView=new Uint8Array(kwLengthBuffer);for(let j=3;j>=0;j--){kwLengthView[j]=kwLength;kwLength>>=8;}
 
const eccInfo=new _ECCCMSSharedInfo.default({keyInfo:new _AlgorithmIdentifier.default({algorithmId:aesKWAlgorithm.algorithmId,algorithmParams:new asn1js.Null()}),entityUInfo:_this.recipientInfos[index].value.ukm,suppPubInfo:new asn1js.OctetString({valueHex:kwLengthBuffer})});const encodedInfo=eccInfo.toSchema().toBER(false);
 const ecdhAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in ecdhAlgorithm===false)return Promise.reject(`Incorrect OID for key encryption algorithm: ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`); return(0,_common.kdf)(ecdhAlgorithm.kdf,result,KWalgorithm.length,encodedInfo);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.importKey("raw",result,{name:"AES-KW"},true,["unwrapKey"]),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const contentEncryptionAlgorithm=(0,_common.getAlgorithmByOID)(_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect "contentEncryptionAlgorithm": ${_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`); return crypto.unwrapKey("raw",_this.recipientInfos[index].value.recipientEncryptedKeys.encryptedKeys[0].encryptedKey.valueBlock.valueHex,result,{name:"AES-KW"},contentEncryptionAlgorithm,true,["decrypt"]);},error=>Promise.reject(error)); return currentSequence;}
function SubKeyTransRecipientInfo(index){ let currentSequence=Promise.resolve();
 currentSequence=currentSequence.then(()=>{if("recipientPrivateKey"in decryptionParameters===false)return Promise.reject("Parameter \"recipientPrivateKey\" is mandatory for \"KeyTransRecipientInfo\""); const schema=_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmParams;const rsaOAEPParams=new _RSAESOAEPParams.default({schema});const hashAlgorithm=(0,_common.getAlgorithmByOID)(rsaOAEPParams.hashAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return Promise.reject(`Incorrect OID for hash algorithm: ${rsaOAEPParams.hashAlgorithm.algorithmId}`); return crypto.importKey("pkcs8",decryptionParameters.recipientPrivateKey,{name:"RSA-OAEP",hash:{name:hashAlgorithm.name}},true,["decrypt"]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>crypto.decrypt(result.algorithm,result,_this.recipientInfos[index].value.encryptedKey.valueBlock.valueHex),error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const contentEncryptionAlgorithm=(0,_common.getAlgorithmByOID)(_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect "contentEncryptionAlgorithm": ${_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`); return crypto.importKey("raw",result,contentEncryptionAlgorithm,true,["decrypt"]);},error=>Promise.reject(error)); return currentSequence;}
function SubKEKRecipientInfo(index){ let currentSequence=Promise.resolve();let kekAlgorithm;
 currentSequence=currentSequence.then(()=>{if("preDefinedData"in decryptionParameters===false)return Promise.reject("Parameter \"preDefinedData\" is mandatory for \"KEKRecipientInfo\"");kekAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in kekAlgorithm===false)return Promise.reject(`Incorrect OID for "keyEncryptionAlgorithm": ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`); return crypto.importKey("raw",decryptionParameters.preDefinedData,kekAlgorithm,true,["unwrapKey"]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const contentEncryptionAlgorithm=(0,_common.getAlgorithmByOID)(_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect "contentEncryptionAlgorithm": ${_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`); return crypto.unwrapKey("raw",_this.recipientInfos[index].value.encryptedKey.valueBlock.valueHex,result,kekAlgorithm,contentEncryptionAlgorithm,true,["decrypt"]);},error=>Promise.reject(error)); return currentSequence;}
function SubPasswordRecipientinfo(index){ let currentSequence=Promise.resolve();let pbkdf2Params;let kekAlgorithm;
 currentSequence=currentSequence.then(()=>{if("preDefinedData"in decryptionParameters===false)return Promise.reject("Parameter \"preDefinedData\" is mandatory for \"KEKRecipientInfo\"");if("keyDerivationAlgorithm"in _this.recipientInfos[index].value===false)return Promise.reject("Please append encoded \"keyDerivationAlgorithm\"");if("algorithmParams"in _this.recipientInfos[index].value.keyDerivationAlgorithm===false)return Promise.reject("Incorrectly encoded \"keyDerivationAlgorithm\"");try{pbkdf2Params=new _PBKDF2Params.default({schema:_this.recipientInfos[index].value.keyDerivationAlgorithm.algorithmParams});}catch(ex){return Promise.reject("Incorrectly encoded \"keyDerivationAlgorithm\"");}
return crypto.importKey("raw",decryptionParameters.preDefinedData,"PBKDF2",false,["deriveKey"]);},error=>Promise.reject(error));
currentSequence=currentSequence.then(result=>{kekAlgorithm=(0,_common.getAlgorithmByOID)(_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId);if("name"in kekAlgorithm===false)return Promise.reject(`Incorrect OID for "keyEncryptionAlgorithm": ${_this.recipientInfos[index].value.keyEncryptionAlgorithm.algorithmId}`);
 let hmacHashAlgorithm="SHA-1";if("prf"in pbkdf2Params){const algorithm=(0,_common.getAlgorithmByOID)(pbkdf2Params.prf.algorithmId);if("name"in algorithm===false)return Promise.reject("Incorrect OID for HMAC hash algorithm");hmacHashAlgorithm=algorithm.hash.name;}
 
const saltView=new Uint8Array(pbkdf2Params.salt.valueBlock.valueHex);
 const iterations=pbkdf2Params.iterationCount; return crypto.deriveKey({name:"PBKDF2",hash:{name:hmacHashAlgorithm},salt:saltView,iterations},result,kekAlgorithm,true,["unwrapKey"]);},error=>Promise.reject(error));
 currentSequence=currentSequence.then(result=>{ const contentEncryptionAlgorithm=(0,_common.getAlgorithmByOID)(_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect "contentEncryptionAlgorithm": ${_this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`); return crypto.unwrapKey("raw",_this.recipientInfos[index].value.encryptedKey.valueBlock.valueHex,result,kekAlgorithm,contentEncryptionAlgorithm,true,["decrypt"]);},error=>Promise.reject(error)); return currentSequence;}
 
sequence=sequence.then(()=>{ let currentSequence=Promise.resolve(); switch(this.recipientInfos[recipientIndex].variant){case 1: currentSequence=SubKeyTransRecipientInfo(recipientIndex);break;case 2: currentSequence=SubKeyAgreeRecipientInfo(recipientIndex);break;case 3: currentSequence=SubKEKRecipientInfo(recipientIndex);break;case 4: currentSequence=SubPasswordRecipientinfo(recipientIndex);break;default:return Promise.reject(`Uknown recipient type in array with index ${recipientIndex}`);}
return currentSequence;},error=>Promise.reject(error));
 sequence=sequence.then(result=>{ const contentEncryptionAlgorithm=(0,_common.getAlgorithmByOID)(this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId);if("name"in contentEncryptionAlgorithm===false)return Promise.reject(`Incorrect "contentEncryptionAlgorithm": ${this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`);
 const ivBuffer=this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmParams.valueBlock.valueHex;const ivView=new Uint8Array(ivBuffer);
 let dataBuffer=new ArrayBuffer(0);if(this.encryptedContentInfo.encryptedContent.idBlock.isConstructed===false)dataBuffer=this.encryptedContentInfo.encryptedContent.valueBlock.valueHex;else{var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.encryptedContentInfo.encryptedContent.valueBlock.value[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const content=_step.value;dataBuffer=(0,_pvutils.utilConcatBuf)(dataBuffer,content.valueBlock.valueHex);}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}} 
return crypto.decrypt({name:contentEncryptionAlgorithm.name,iv:ivView},result,dataBuffer);},error=>Promise.reject(error)); return sequence;}
}
exports.default=EnvelopedData;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./ECCCMSSharedInfo.js":30,"./EncryptedContentInfo.js":34,"./IssuerAndSerialNumber.js":44,"./KEKIdentifier.js":46,"./KEKRecipientInfo.js":47,"./KeyAgreeRecipientIdentifier.js":48,"./KeyAgreeRecipientInfo.js":49,"./KeyTransRecipientInfo.js":51,"./OriginatorIdentifierOrKey.js":57,"./OriginatorInfo.js":58,"./OriginatorPublicKey.js":59,"./PBKDF2Params.js":66,"./PasswordRecipientinfo.js":70,"./RSAESOAEPParams.js":80,"./RecipientEncryptedKey.js":84,"./RecipientEncryptedKeys.js":85,"./RecipientInfo.js":87,"./common.js":110,"asn1js":112,"pvutils":113}],37:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ExtKeyUsage{constructor(parameters={}){ this.keyPurposes=(0,_pvutils.getParametersValue)(parameters,"keyPurposes",ExtKeyUsage.defaultValues("keyPurposes"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyPurposes":return[];default:throw new Error(`Invalid member name for ExtKeyUsage class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.keyPurposes||"",value:new asn1js.ObjectIdentifier()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyPurposes"]);
 const asn1=asn1js.compareSchema(schema,schema,ExtKeyUsage.schema({names:{keyPurposes:"keyPurposes"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ExtKeyUsage");
 this.keyPurposes=Array.from(asn1.result.keyPurposes,element=>element.valueBlock.toString());}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.keyPurposes,element=>new asn1js.ObjectIdentifier({value:element}))});}
toJSON(){return{keyPurposes:Array.from(this.keyPurposes)};}
}
exports.default=ExtKeyUsage;},{"asn1js":112,"pvutils":113}],38:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _SubjectDirectoryAttributes=_interopRequireDefault(require("./SubjectDirectoryAttributes.js"));var _PrivateKeyUsagePeriod=_interopRequireDefault(require("./PrivateKeyUsagePeriod.js"));var _AltName=_interopRequireDefault(require("./AltName.js"));var _BasicConstraints=_interopRequireDefault(require("./BasicConstraints.js"));var _IssuingDistributionPoint=_interopRequireDefault(require("./IssuingDistributionPoint.js"));var _GeneralNames=_interopRequireDefault(require("./GeneralNames.js"));var _NameConstraints=_interopRequireDefault(require("./NameConstraints.js"));var _CRLDistributionPoints=_interopRequireDefault(require("./CRLDistributionPoints.js"));var _CertificatePolicies=_interopRequireDefault(require("./CertificatePolicies.js"));var _PolicyMappings=_interopRequireDefault(require("./PolicyMappings.js"));var _AuthorityKeyIdentifier=_interopRequireDefault(require("./AuthorityKeyIdentifier.js"));var _PolicyConstraints=_interopRequireDefault(require("./PolicyConstraints.js"));var _ExtKeyUsage=_interopRequireDefault(require("./ExtKeyUsage.js"));var _InfoAccess=_interopRequireDefault(require("./InfoAccess.js"));var _SignedCertificateTimestampList=_interopRequireDefault(require("./SignedCertificateTimestampList.js"));var _CertificateTemplate=_interopRequireDefault(require("./CertificateTemplate.js"));var _CAVersion=_interopRequireDefault(require("./CAVersion.js"));var _QCStatements=_interopRequireDefault(require("./QCStatements.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Extension{constructor(parameters={}){ this.extnID=(0,_pvutils.getParametersValue)(parameters,"extnID",Extension.defaultValues("extnID"));this.critical=(0,_pvutils.getParametersValue)(parameters,"critical",Extension.defaultValues("critical"));if("extnValue"in parameters)this.extnValue=new asn1js.OctetString({valueHex:parameters.extnValue});else this.extnValue=Extension.defaultValues("extnValue");if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",Extension.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"extnID":return"";case"critical":return false;case"extnValue":return new asn1js.OctetString();case"parsedValue":return{};default:throw new Error(`Invalid member name for Extension class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.extnID||""}),new asn1js.Boolean({name:names.critical||"",optional:true}),new asn1js.OctetString({name:names.extnValue||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["extnID","critical","extnValue"]);
 let asn1=asn1js.compareSchema(schema,schema,Extension.schema({names:{extnID:"extnID",critical:"critical",extnValue:"extnValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Extension");
 this.extnID=asn1.result.extnID.valueBlock.toString();if("critical"in asn1.result)this.critical=asn1.result.critical.valueBlock.value;this.extnValue=asn1.result.extnValue; asn1=asn1js.fromBER(this.extnValue.valueBlock.valueHex);if(asn1.offset===-1)return;switch(this.extnID){case"2.5.29.9": try{this.parsedValue=new _SubjectDirectoryAttributes.default({schema:asn1.result});}catch(ex){this.parsedValue=new _SubjectDirectoryAttributes.default();this.parsedValue.parsingError="Incorrectly formated SubjectDirectoryAttributes";}
break;case"2.5.29.14": this.parsedValue=asn1.result; break;case"2.5.29.15": this.parsedValue=asn1.result; break;case"2.5.29.16": try{this.parsedValue=new _PrivateKeyUsagePeriod.default({schema:asn1.result});}catch(ex){this.parsedValue=new _PrivateKeyUsagePeriod.default();this.parsedValue.parsingError="Incorrectly formated PrivateKeyUsagePeriod";}
break;case"2.5.29.17": case"2.5.29.18": try{this.parsedValue=new _AltName.default({schema:asn1.result});}catch(ex){this.parsedValue=new _AltName.default();this.parsedValue.parsingError="Incorrectly formated AltName";}
break;case"2.5.29.19": try{this.parsedValue=new _BasicConstraints.default({schema:asn1.result});}catch(ex){this.parsedValue=new _BasicConstraints.default();this.parsedValue.parsingError="Incorrectly formated BasicConstraints";}
break;case"2.5.29.20": case"2.5.29.27":this.parsedValue=asn1.result; break;case"2.5.29.21": this.parsedValue=asn1.result; break;case"2.5.29.24": this.parsedValue=asn1.result; break;case"2.5.29.28": try{this.parsedValue=new _IssuingDistributionPoint.default({schema:asn1.result});}catch(ex){this.parsedValue=new _IssuingDistributionPoint.default();this.parsedValue.parsingError="Incorrectly formated IssuingDistributionPoint";}
break;case"2.5.29.29": try{this.parsedValue=new _GeneralNames.default({schema:asn1.result});}catch(ex){this.parsedValue=new _GeneralNames.default();this.parsedValue.parsingError="Incorrectly formated GeneralNames";}
break;case"2.5.29.30": try{this.parsedValue=new _NameConstraints.default({schema:asn1.result});}catch(ex){this.parsedValue=new _NameConstraints.default();this.parsedValue.parsingError="Incorrectly formated NameConstraints";}
break;case"2.5.29.31": case"2.5.29.46": try{this.parsedValue=new _CRLDistributionPoints.default({schema:asn1.result});}catch(ex){this.parsedValue=new _CRLDistributionPoints.default();this.parsedValue.parsingError="Incorrectly formated CRLDistributionPoints";}
break;case"2.5.29.32": case"1.3.6.1.4.1.311.21.10": try{this.parsedValue=new _CertificatePolicies.default({schema:asn1.result});}catch(ex){this.parsedValue=new _CertificatePolicies.default();this.parsedValue.parsingError="Incorrectly formated CertificatePolicies";}
break;case"2.5.29.33": try{this.parsedValue=new _PolicyMappings.default({schema:asn1.result});}catch(ex){this.parsedValue=new _PolicyMappings.default();this.parsedValue.parsingError="Incorrectly formated CertificatePolicies";}
break;case"2.5.29.35": try{this.parsedValue=new _AuthorityKeyIdentifier.default({schema:asn1.result});}catch(ex){this.parsedValue=new _AuthorityKeyIdentifier.default();this.parsedValue.parsingError="Incorrectly formated AuthorityKeyIdentifier";}
break;case"2.5.29.36": try{this.parsedValue=new _PolicyConstraints.default({schema:asn1.result});}catch(ex){this.parsedValue=new _PolicyConstraints.default();this.parsedValue.parsingError="Incorrectly formated PolicyConstraints";}
break;case"2.5.29.37": try{this.parsedValue=new _ExtKeyUsage.default({schema:asn1.result});}catch(ex){this.parsedValue=new _ExtKeyUsage.default();this.parsedValue.parsingError="Incorrectly formated ExtKeyUsage";}
break;case"2.5.29.54": this.parsedValue=asn1.result; break;case"1.3.6.1.5.5.7.1.1": case"1.3.6.1.5.5.7.1.11": try{this.parsedValue=new _InfoAccess.default({schema:asn1.result});}catch(ex){this.parsedValue=new _InfoAccess.default();this.parsedValue.parsingError="Incorrectly formated InfoAccess";}
break;case"1.3.6.1.4.1.11129.2.4.2": try{this.parsedValue=new _SignedCertificateTimestampList.default({schema:asn1.result});}catch(ex){this.parsedValue=new _SignedCertificateTimestampList.default();this.parsedValue.parsingError="Incorrectly formated SignedCertificateTimestampList";}
break;case"1.3.6.1.4.1.311.20.2": this.parsedValue=asn1.result; break;case"1.3.6.1.4.1.311.21.2": this.parsedValue=asn1.result; break;case"1.3.6.1.4.1.311.21.7": try{this.parsedValue=new _CertificateTemplate.default({schema:asn1.result});}catch(ex){this.parsedValue=new _CertificateTemplate.default();this.parsedValue.parsingError="Incorrectly formated CertificateTemplate";}
break;case"1.3.6.1.4.1.311.21.1": try{this.parsedValue=new _CAVersion.default({schema:asn1.result});}catch(ex){this.parsedValue=new _CAVersion.default();this.parsedValue.parsingError="Incorrectly formated CAVersion";}
break;case"1.3.6.1.5.5.7.1.3": try{this.parsedValue=new _QCStatements.default({schema:asn1.result});}catch(ex){this.parsedValue=new _QCStatements.default();this.parsedValue.parsingError="Incorrectly formated QCStatements";}
break;default:}

}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.extnID}));if(this.critical!==Extension.defaultValues("critical"))outputArray.push(new asn1js.Boolean({value:this.critical}));outputArray.push(this.extnValue);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={extnID:this.extnID,extnValue:this.extnValue.toJSON()};if(this.critical!==Extension.defaultValues("critical"))object.critical=this.critical;if("parsedValue"in this){if("toJSON"in this.parsedValue)object.parsedValue=this.parsedValue.toJSON();}
return object;}
}
exports.default=Extension;},{"./AltName.js":5,"./AuthorityKeyIdentifier.js":11,"./BasicConstraints.js":12,"./CAVersion.js":14,"./CRLDistributionPoints.js":16,"./CertificatePolicies.js":21,"./CertificateTemplate.js":24,"./ExtKeyUsage.js":37,"./GeneralNames.js":41,"./InfoAccess.js":43,"./IssuingDistributionPoint.js":45,"./NameConstraints.js":54,"./PolicyConstraints.js":71,"./PolicyMappings.js":74,"./PrivateKeyUsagePeriod.js":77,"./QCStatements.js":79,"./SignedCertificateTimestampList.js":100,"./SubjectDirectoryAttributes.js":104,"asn1js":112,"pvutils":113}],39:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Extension=_interopRequireDefault(require("./Extension.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Extensions{constructor(parameters={}){ this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",Extensions.defaultValues("extensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"extensions":return[];default:throw new Error(`Invalid member name for Extensions class: ${memberName}`);}}
static schema(parameters={},optional=false){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({optional,name:names.blockName||"",value:[new asn1js.Repeated({name:names.extensions||"",value:_Extension.default.schema(names.extension||{})})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["extensions"]);
 const asn1=asn1js.compareSchema(schema,schema,Extensions.schema({names:{extensions:"extensions"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Extensions");
 this.extensions=Array.from(asn1.result.extensions,element=>new _Extension.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.extensions,element=>element.toSchema())});}
toJSON(){return{extensions:Array.from(this.extensions,element=>element.toJSON())};}
}
exports.default=Extensions;},{"./Extension.js":38,"asn1js":112,"pvutils":113}],40:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}

function builtInStandardAttributes(parameters={},optional=false){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({optional,value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:2, tagNumber:1
},name:names.country_name||"",value:[new asn1js.Choice({value:[new asn1js.NumericString(),new asn1js.PrintableString()]})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:2, tagNumber:2
},name:names.administration_domain_name||"",value:[new asn1js.Choice({value:[new asn1js.NumericString(),new asn1js.PrintableString()]})]}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:0
},name:names.network_address||"",isHexOnly:true}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:1
},name:names.terminal_identifier||"",isHexOnly:true}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:2
},name:names.private_domain_name||"",value:[new asn1js.Choice({value:[new asn1js.NumericString(),new asn1js.PrintableString()]})]}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:3
},name:names.organization_name||"",isHexOnly:true}),new asn1js.Primitive({optional:true,name:names.numeric_user_identifier||"",idBlock:{tagClass:3, tagNumber:4
},isHexOnly:true}),new asn1js.Constructed({optional:true,name:names.personal_name||"",idBlock:{tagClass:3, tagNumber:5
},value:[new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:0
},isHexOnly:true}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:1
},isHexOnly:true}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:2
},isHexOnly:true}),new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:3
},isHexOnly:true})]}),new asn1js.Constructed({optional:true,name:names.organizational_unit_names||"",idBlock:{tagClass:3, tagNumber:6
},value:[new asn1js.Repeated({value:new asn1js.PrintableString()})]})]});}
function builtInDomainDefinedAttributes(optional=false){return new asn1js.Sequence({optional,value:[new asn1js.PrintableString(),new asn1js.PrintableString()]});}
function extensionAttributes(optional=false){return new asn1js.Set({optional,value:[new asn1js.Primitive({optional:true,idBlock:{tagClass:3, tagNumber:0
},isHexOnly:true}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Any()]})]});}

class GeneralName{constructor(parameters={}){ this.type=(0,_pvutils.getParametersValue)(parameters,"type",GeneralName.defaultValues("type"));this.value=(0,_pvutils.getParametersValue)(parameters,"value",GeneralName.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"type":return 9;case"value":return{};default:throw new Error(`Invalid member name for GeneralName class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"type":return memberValue===GeneralName.defaultValues(memberName);case"value":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for GeneralName class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({value:[new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},name:names.blockName||"",value:[new asn1js.ObjectIdentifier(),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any()]})]}),new asn1js.Primitive({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:1
}}),new asn1js.Primitive({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:2
}}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:3
},name:names.blockName||"",value:[builtInStandardAttributes(names.builtInStandardAttributes||{},false),builtInDomainDefinedAttributes(true),extensionAttributes(true)]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:4
},name:names.blockName||"",value:[_RelativeDistinguishedNames.default.schema(names.directoryName||{})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:5
},name:names.blockName||"",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Choice({value:[new asn1js.TeletexString(),new asn1js.PrintableString(),new asn1js.UniversalString(),new asn1js.Utf8String(),new asn1js.BmpString()]})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Choice({value:[new asn1js.TeletexString(),new asn1js.PrintableString(),new asn1js.UniversalString(),new asn1js.Utf8String(),new asn1js.BmpString()]})]})]}),new asn1js.Primitive({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:6
}}),new asn1js.Primitive({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:7
}}),new asn1js.Primitive({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:8
}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["blockName","otherName","rfc822Name","dNSName","x400Address","directoryName","ediPartyName","uniformResourceIdentifier","iPAddress","registeredID"]);
 const asn1=asn1js.compareSchema(schema,schema,GeneralName.schema({names:{blockName:"blockName",otherName:"otherName",rfc822Name:"rfc822Name",dNSName:"dNSName",x400Address:"x400Address",directoryName:{names:{blockName:"directoryName"}},ediPartyName:"ediPartyName",uniformResourceIdentifier:"uniformResourceIdentifier",iPAddress:"iPAddress",registeredID:"registeredID"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for GeneralName");
 this.type=asn1.result.blockName.idBlock.tagNumber;switch(this.type){case 0: this.value=asn1.result.blockName;break;case 1: case 2:case 6:{const value=asn1.result.blockName;value.idBlock.tagClass=1; value.idBlock.tagNumber=22; const valueBER=value.toBER(false);this.value=asn1js.fromBER(valueBER).result.valueBlock.value;}
break;case 3: this.value=asn1.result.blockName;break;case 4: this.value=new _RelativeDistinguishedNames.default({schema:asn1.result.directoryName});break;case 5: this.value=asn1.result.ediPartyName;break;case 7: this.value=new asn1js.OctetString({valueHex:asn1.result.blockName.valueBlock.valueHex});break;case 8:{const value=asn1.result.blockName;value.idBlock.tagClass=1; value.idBlock.tagNumber=6; const valueBER=value.toBER(false);this.value=asn1js.fromBER(valueBER).result.valueBlock.toString();}
break;default:}
}
toSchema(){ switch(this.type){case 0:case 3:case 5:return new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:this.type},value:[this.value]});case 1:case 2:case 6:{const value=new asn1js.IA5String({value:this.value});value.idBlock.tagClass=3;value.idBlock.tagNumber=this.type;return value;}
case 4:return new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:4},value:[this.value.toSchema()]});case 7:{const value=this.value;value.idBlock.tagClass=3;value.idBlock.tagNumber=this.type;return value;}
case 8:{const value=new asn1js.ObjectIdentifier({value:this.value});value.idBlock.tagClass=3;value.idBlock.tagNumber=this.type;return value;}
default:return GeneralName.schema();}
}
toJSON(){const _object={type:this.type,value:""};if(typeof this.value==="string")_object.value=this.value;else{try{_object.value=this.value.toJSON();}catch(ex){}}
return _object;}
}
exports.default=GeneralName;},{"./RelativeDistinguishedNames.js":89,"asn1js":112,"pvutils":113}],41:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class GeneralNames{constructor(parameters={}){ this.names=(0,_pvutils.getParametersValue)(parameters,"names",GeneralNames.defaultValues("names"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"names":return[];default:throw new Error(`Invalid member name for GeneralNames class: ${memberName}`);}}
static schema(parameters={},optional=false){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({optional,name:names.blockName||"",value:[new asn1js.Repeated({name:names.generalNames||"",value:_GeneralName.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["names","generalNames"]);
 const asn1=asn1js.compareSchema(schema,schema,GeneralNames.schema({names:{blockName:"names",generalNames:"generalNames"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for GeneralNames");
 this.names=Array.from(asn1.result.generalNames,element=>new _GeneralName.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.names,element=>element.toSchema())});}
toJSON(){return{names:Array.from(this.names,element=>element.toJSON())};}
}
exports.default=GeneralNames;},{"./GeneralName.js":40,"asn1js":112,"pvutils":113}],42:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class GeneralSubtree{constructor(parameters={}){ this.base=(0,_pvutils.getParametersValue)(parameters,"base",GeneralSubtree.defaultValues("base"));this.minimum=(0,_pvutils.getParametersValue)(parameters,"minimum",GeneralSubtree.defaultValues("minimum"));if("maximum"in parameters)
this.maximum=(0,_pvutils.getParametersValue)(parameters,"maximum",GeneralSubtree.defaultValues("maximum"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"base":return new _GeneralName.default();case"minimum":return 0;case"maximum":return 0;default:throw new Error(`Invalid member name for GeneralSubtree class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_GeneralName.default.schema(names.base||{}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({name:names.minimum||""})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Integer({name:names.maximum||""})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["base","minimum","maximum"]);
 const asn1=asn1js.compareSchema(schema,schema,GeneralSubtree.schema({names:{base:{names:{blockName:"base"}},minimum:"minimum",maximum:"maximum"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for GeneralSubtree");
 this.base=new _GeneralName.default({schema:asn1.result.base});if("minimum"in asn1.result){if(asn1.result.minimum.valueBlock.isHexOnly)this.minimum=asn1.result.minimum;else this.minimum=asn1.result.minimum.valueBlock.valueDec;}
if("maximum"in asn1.result){if(asn1.result.maximum.valueBlock.isHexOnly)this.maximum=asn1.result.maximum;else this.maximum=asn1.result.maximum.valueBlock.valueDec;}
}
toSchema(){ const outputArray=[];outputArray.push(this.base.toSchema());if(this.minimum!==0){let valueMinimum=0;if(this.minimum instanceof asn1js.Integer)valueMinimum=this.minimum;else valueMinimum=new asn1js.Integer({value:this.minimum});outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[valueMinimum]}));}
if("maximum"in this){let valueMaximum=0;if(this.maximum instanceof asn1js.Integer)valueMaximum=this.maximum;else valueMaximum=new asn1js.Integer({value:this.maximum});outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[valueMaximum]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={base:this.base.toJSON()};if(this.minimum!==0){if(typeof this.minimum==="number")object.minimum=this.minimum;else object.minimum=this.minimum.toJSON();}
if("maximum"in this){if(typeof this.maximum==="number")object.maximum=this.maximum;else object.maximum=this.maximum.toJSON();}
return object;}
}
exports.default=GeneralSubtree;},{"./GeneralName.js":40,"asn1js":112,"pvutils":113}],43:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AccessDescription=_interopRequireDefault(require("./AccessDescription.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class InfoAccess{constructor(parameters={}){ this.accessDescriptions=(0,_pvutils.getParametersValue)(parameters,"accessDescriptions",InfoAccess.defaultValues("accessDescriptions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"accessDescriptions":return[];default:throw new Error(`Invalid member name for InfoAccess class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.accessDescriptions||"",value:_AccessDescription.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["accessDescriptions"]);
 const asn1=asn1js.compareSchema(schema,schema,InfoAccess.schema({names:{accessDescriptions:"accessDescriptions"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for InfoAccess");
 this.accessDescriptions=Array.from(asn1.result.accessDescriptions,element=>new _AccessDescription.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.accessDescriptions,element=>element.toSchema())});}
toJSON(){return{accessDescriptions:Array.from(this.accessDescriptions,element=>element.toJSON())};}
}
exports.default=InfoAccess;},{"./AccessDescription.js":2,"asn1js":112,"pvutils":113}],44:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class IssuerAndSerialNumber{constructor(parameters={}){ this.issuer=(0,_pvutils.getParametersValue)(parameters,"issuer",IssuerAndSerialNumber.defaultValues("issuer"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",IssuerAndSerialNumber.defaultValues("serialNumber"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"issuer":return new _RelativeDistinguishedNames.default();case"serialNumber":return new asn1js.Integer();default:throw new Error(`Invalid member name for IssuerAndSerialNumber class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_RelativeDistinguishedNames.default.schema(names.issuer||{}),new asn1js.Integer({name:names.serialNumber||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["issuer","serialNumber"]);
 const asn1=asn1js.compareSchema(schema,schema,IssuerAndSerialNumber.schema({names:{issuer:{names:{blockName:"issuer"}},serialNumber:"serialNumber"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for IssuerAndSerialNumber");
 this.issuer=new _RelativeDistinguishedNames.default({schema:asn1.result.issuer});this.serialNumber=asn1.result.serialNumber;}
toSchema(){ return new asn1js.Sequence({value:[this.issuer.toSchema(),this.serialNumber]});}
toJSON(){return{issuer:this.issuer.toJSON(),serialNumber:this.serialNumber.toJSON()};}
}
exports.default=IssuerAndSerialNumber;},{"./RelativeDistinguishedNames.js":89,"asn1js":112,"pvutils":113}],45:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class IssuingDistributionPoint{constructor(parameters={}){ if("distributionPoint"in parameters)
this.distributionPoint=(0,_pvutils.getParametersValue)(parameters,"distributionPoint",IssuingDistributionPoint.defaultValues("distributionPoint"));this.onlyContainsUserCerts=(0,_pvutils.getParametersValue)(parameters,"onlyContainsUserCerts",IssuingDistributionPoint.defaultValues("onlyContainsUserCerts"));this.onlyContainsCACerts=(0,_pvutils.getParametersValue)(parameters,"onlyContainsCACerts",IssuingDistributionPoint.defaultValues("onlyContainsCACerts"));if("onlySomeReasons"in parameters)
this.onlySomeReasons=(0,_pvutils.getParametersValue)(parameters,"onlySomeReasons",IssuingDistributionPoint.defaultValues("onlySomeReasons"));this.indirectCRL=(0,_pvutils.getParametersValue)(parameters,"indirectCRL",IssuingDistributionPoint.defaultValues("indirectCRL"));this.onlyContainsAttributeCerts=(0,_pvutils.getParametersValue)(parameters,"onlyContainsAttributeCerts",IssuingDistributionPoint.defaultValues("onlyContainsAttributeCerts"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"distributionPoint":return[];case"onlyContainsUserCerts":return false;case"onlyContainsCACerts":return false;case"onlySomeReasons":return 0;case"indirectCRL":return false;case"onlyContainsAttributeCerts":return false;default:throw new Error(`Invalid member name for IssuingDistributionPoint class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Choice({value:[new asn1js.Constructed({name:names.distributionPoint||"",idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({name:names.distributionPointNames||"",value:_GeneralName.default.schema()})]}),new asn1js.Constructed({name:names.distributionPoint||"",idBlock:{tagClass:3, tagNumber:1
},value:_RelativeDistinguishedNames.default.schema().valueBlock.value})]})]}),new asn1js.Primitive({name:names.onlyContainsUserCerts||"",optional:true,idBlock:{tagClass:3, tagNumber:1
}}), new asn1js.Primitive({name:names.onlyContainsCACerts||"",optional:true,idBlock:{tagClass:3, tagNumber:2
}}), new asn1js.Primitive({name:names.onlySomeReasons||"",optional:true,idBlock:{tagClass:3, tagNumber:3
}}), new asn1js.Primitive({name:names.indirectCRL||"",optional:true,idBlock:{tagClass:3, tagNumber:4
}}), new asn1js.Primitive({name:names.onlyContainsAttributeCerts||"",optional:true,idBlock:{tagClass:3, tagNumber:5
}})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["distributionPoint","distributionPointNames","onlyContainsUserCerts","onlyContainsCACerts","onlySomeReasons","indirectCRL","onlyContainsAttributeCerts"]);
 const asn1=asn1js.compareSchema(schema,schema,IssuingDistributionPoint.schema({names:{distributionPoint:"distributionPoint",distributionPointNames:"distributionPointNames",onlyContainsUserCerts:"onlyContainsUserCerts",onlyContainsCACerts:"onlyContainsCACerts",onlySomeReasons:"onlySomeReasons",indirectCRL:"indirectCRL",onlyContainsAttributeCerts:"onlyContainsAttributeCerts"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for IssuingDistributionPoint");
 if("distributionPoint"in asn1.result){switch(true){case asn1.result.distributionPoint.idBlock.tagNumber===0: this.distributionPoint=Array.from(asn1.result.distributionPointNames,element=>new _GeneralName.default({schema:element}));break;case asn1.result.distributionPoint.idBlock.tagNumber===1:{this.distributionPoint=new _RelativeDistinguishedNames.default({schema:new asn1js.Sequence({value:asn1.result.distributionPoint.valueBlock.value})});}
break;default:throw new Error("Unknown tagNumber for distributionPoint: {$asn1.result.distributionPoint.idBlock.tagNumber}");}}
if("onlyContainsUserCerts"in asn1.result){const view=new Uint8Array(asn1.result.onlyContainsUserCerts.valueBlock.valueHex);this.onlyContainsUserCerts=view[0]!==0x00;}
if("onlyContainsCACerts"in asn1.result){const view=new Uint8Array(asn1.result.onlyContainsCACerts.valueBlock.valueHex);this.onlyContainsCACerts=view[0]!==0x00;}
if("onlySomeReasons"in asn1.result){const view=new Uint8Array(asn1.result.onlySomeReasons.valueBlock.valueHex);this.onlySomeReasons=view[0];}
if("indirectCRL"in asn1.result){const view=new Uint8Array(asn1.result.indirectCRL.valueBlock.valueHex);this.indirectCRL=view[0]!==0x00;}
if("onlyContainsAttributeCerts"in asn1.result){const view=new Uint8Array(asn1.result.onlyContainsAttributeCerts.valueBlock.valueHex);this.onlyContainsAttributeCerts=view[0]!==0x00;}
}
toSchema(){ const outputArray=[];if("distributionPoint"in this){let value;if(this.distributionPoint instanceof Array){value=new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.distributionPoint,element=>element.toSchema())});}else{value=this.distributionPoint.toSchema();value.idBlock.tagClass=3; value.idBlock.tagNumber=1;}
outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[value]}));}
if(this.onlyContainsUserCerts!==IssuingDistributionPoint.defaultValues("onlyContainsUserCerts")){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:1
},valueHex:new Uint8Array([0xFF]).buffer}));}
if(this.onlyContainsCACerts!==IssuingDistributionPoint.defaultValues("onlyContainsCACerts")){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:2
},valueHex:new Uint8Array([0xFF]).buffer}));}
if("onlySomeReasons"in this){const buffer=new ArrayBuffer(1);const view=new Uint8Array(buffer);view[0]=this.onlySomeReasons;outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:3
},valueHex:buffer}));}
if(this.indirectCRL!==IssuingDistributionPoint.defaultValues("indirectCRL")){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:4
},valueHex:new Uint8Array([0xFF]).buffer}));}
if(this.onlyContainsAttributeCerts!==IssuingDistributionPoint.defaultValues("onlyContainsAttributeCerts")){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:5
},valueHex:new Uint8Array([0xFF]).buffer}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("distributionPoint"in this){if(this.distributionPoint instanceof Array)object.distributionPoint=Array.from(this.distributionPoint,element=>element.toJSON());else object.distributionPoint=this.distributionPoint.toJSON();}
if(this.onlyContainsUserCerts!==IssuingDistributionPoint.defaultValues("onlyContainsUserCerts"))object.onlyContainsUserCerts=this.onlyContainsUserCerts;if(this.onlyContainsCACerts!==IssuingDistributionPoint.defaultValues("onlyContainsCACerts"))object.onlyContainsCACerts=this.onlyContainsCACerts;if("onlySomeReasons"in this)object.onlySomeReasons=this.onlySomeReasons;if(this.indirectCRL!==IssuingDistributionPoint.defaultValues("indirectCRL"))object.indirectCRL=this.indirectCRL;if(this.onlyContainsAttributeCerts!==IssuingDistributionPoint.defaultValues("onlyContainsAttributeCerts"))object.onlyContainsAttributeCerts=this.onlyContainsAttributeCerts;return object;}
}
exports.default=IssuingDistributionPoint;},{"./GeneralName.js":40,"./RelativeDistinguishedNames.js":89,"asn1js":112,"pvutils":113}],46:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _OtherKeyAttribute=_interopRequireDefault(require("./OtherKeyAttribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class KEKIdentifier{constructor(parameters={}){ this.keyIdentifier=(0,_pvutils.getParametersValue)(parameters,"keyIdentifier",KEKIdentifier.defaultValues("keyIdentifier"));if("date"in parameters)
this.date=(0,_pvutils.getParametersValue)(parameters,"date",KEKIdentifier.defaultValues("date"));if("other"in parameters)
this.other=(0,_pvutils.getParametersValue)(parameters,"other",KEKIdentifier.defaultValues("other"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyIdentifier":return new asn1js.OctetString();case"date":return new asn1js.GeneralizedTime();case"other":return new _OtherKeyAttribute.default();default:throw new Error(`Invalid member name for KEKIdentifier class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"keyIdentifier":return memberValue.isEqual(KEKIdentifier.defaultValues("keyIdentifier"));case"date": return memberValue.year===0&&memberValue.month===0&&memberValue.day===0&&memberValue.hour===0&&memberValue.minute===0&&memberValue.second===0&&memberValue.millisecond===0;case"other":return memberValue.compareWithDefault("keyAttrId",memberValue.keyAttrId)&&"keyAttr"in memberValue===false;default:throw new Error(`Invalid member name for KEKIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.OctetString({name:names.keyIdentifier||""}),new asn1js.GeneralizedTime({optional:true,name:names.date||""}),_OtherKeyAttribute.default.schema(names.other||{})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyIdentifier","date","other"]);
 const asn1=asn1js.compareSchema(schema,schema,KEKIdentifier.schema({names:{keyIdentifier:"keyIdentifier",date:"date",other:{names:{blockName:"other"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for KEKIdentifier");
 this.keyIdentifier=asn1.result.keyIdentifier;if("date"in asn1.result)this.date=asn1.result.date;if("other"in asn1.result)this.other=new _OtherKeyAttribute.default({schema:asn1.result.other});}
toSchema(){ const outputArray=[];outputArray.push(this.keyIdentifier);if("date"in this)outputArray.push(this.date);if("other"in this)outputArray.push(this.other.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={keyIdentifier:this.keyIdentifier.toJSON()};if("date"in this)_object.date=this.date;if("other"in this)_object.other=this.other.toJSON();return _object;}
}
exports.default=KEKIdentifier;},{"./OtherKeyAttribute.js":61,"asn1js":112,"pvutils":113}],47:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _KEKIdentifier=_interopRequireDefault(require("./KEKIdentifier.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class KEKRecipientInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",KEKRecipientInfo.defaultValues("version"));this.kekid=(0,_pvutils.getParametersValue)(parameters,"kekid",KEKRecipientInfo.defaultValues("kekid"));this.keyEncryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"keyEncryptionAlgorithm",KEKRecipientInfo.defaultValues("keyEncryptionAlgorithm"));this.encryptedKey=(0,_pvutils.getParametersValue)(parameters,"encryptedKey",KEKRecipientInfo.defaultValues("encryptedKey"));this.preDefinedKEK=(0,_pvutils.getParametersValue)(parameters,"preDefinedKEK",KEKRecipientInfo.defaultValues("preDefinedKEK"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"kekid":return new _KEKIdentifier.default();case"keyEncryptionAlgorithm":return new _AlgorithmIdentifier.default();case"encryptedKey":return new asn1js.OctetString();case"preDefinedKEK":return new ArrayBuffer(0);default:throw new Error(`Invalid member name for KEKRecipientInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"KEKRecipientInfo":return memberValue===KEKRecipientInfo.defaultValues("version");case"kekid":return memberValue.compareWithDefault("keyIdentifier",memberValue.keyIdentifier)&&"date"in memberValue===false&&"other"in memberValue===false;case"keyEncryptionAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"encryptedKey":return memberValue.isEqual(KEKRecipientInfo.defaultValues("encryptedKey"));case"preDefinedKEK":return memberValue.byteLength===0;default:throw new Error(`Invalid member name for KEKRecipientInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),_KEKIdentifier.default.schema(names.kekid||{}),_AlgorithmIdentifier.default.schema(names.keyEncryptionAlgorithm||{}),new asn1js.OctetString({name:names.encryptedKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","kekid","keyEncryptionAlgorithm","encryptedKey"]);
 const asn1=asn1js.compareSchema(schema,schema,KEKRecipientInfo.schema({names:{version:"version",kekid:{names:{blockName:"kekid"}},keyEncryptionAlgorithm:{names:{blockName:"keyEncryptionAlgorithm"}},encryptedKey:"encryptedKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for KEKRecipientInfo");
 this.version=asn1.result.version.valueBlock.valueDec;this.kekid=new _KEKIdentifier.default({schema:asn1.result.kekid});this.keyEncryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.keyEncryptionAlgorithm});this.encryptedKey=asn1.result.encryptedKey;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.Integer({value:this.version}),this.kekid.toSchema(),this.keyEncryptionAlgorithm.toSchema(),this.encryptedKey]});}
toJSON(){return{version:this.version,kekid:this.kekid.toJSON(),keyEncryptionAlgorithm:this.keyEncryptionAlgorithm.toJSON(),encryptedKey:this.encryptedKey.toJSON()};}
}
exports.default=KEKRecipientInfo;},{"./AlgorithmIdentifier.js":4,"./KEKIdentifier.js":46,"asn1js":112,"pvutils":113}],48:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _RecipientKeyIdentifier=_interopRequireDefault(require("./RecipientKeyIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class KeyAgreeRecipientIdentifier{constructor(parameters={}){ this.variant=(0,_pvutils.getParametersValue)(parameters,"variant",KeyAgreeRecipientIdentifier.defaultValues("variant"));this.value=(0,_pvutils.getParametersValue)(parameters,"value",KeyAgreeRecipientIdentifier.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"variant":return-1;case"value":return{};default:throw new Error(`Invalid member name for KeyAgreeRecipientIdentifier class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"variant":return memberValue===-1;case"value":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for KeyAgreeRecipientIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({value:[_IssuerAndSerialNumber.default.schema(names.issuerAndSerialNumber||{names:{blockName:names.blockName||""}}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:0
},value:_RecipientKeyIdentifier.default.schema(names.rKeyId||{names:{blockName:names.blockName||""}}).valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["blockName"]);
 const asn1=asn1js.compareSchema(schema,schema,KeyAgreeRecipientIdentifier.schema({names:{blockName:"blockName"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for KeyAgreeRecipientIdentifier");
 if(asn1.result.blockName.idBlock.tagClass===1){this.variant=1;this.value=new _IssuerAndSerialNumber.default({schema:asn1.result.blockName});}else{this.variant=2;this.value=new _RecipientKeyIdentifier.default({schema:new asn1js.Sequence({value:asn1.result.blockName.valueBlock.value})});}
}
toSchema(){ switch(this.variant){case 1:return this.value.toSchema();case 2:return new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:this.value.toSchema().valueBlock.value});default:return new asn1js.Any();}
}
toJSON(){const _object={variant:this.variant};if(this.variant===1||this.variant===2)_object.value=this.value.toJSON();return _object;}
}
exports.default=KeyAgreeRecipientIdentifier;},{"./IssuerAndSerialNumber.js":44,"./RecipientKeyIdentifier.js":88,"asn1js":112,"pvutils":113}],49:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _OriginatorIdentifierOrKey=_interopRequireDefault(require("./OriginatorIdentifierOrKey.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _RecipientEncryptedKeys=_interopRequireDefault(require("./RecipientEncryptedKeys.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class KeyAgreeRecipientInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",KeyAgreeRecipientInfo.defaultValues("version"));this.originator=(0,_pvutils.getParametersValue)(parameters,"originator",KeyAgreeRecipientInfo.defaultValues("originator"));if("ukm"in parameters)
this.ukm=(0,_pvutils.getParametersValue)(parameters,"ukm",KeyAgreeRecipientInfo.defaultValues("ukm"));this.keyEncryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"keyEncryptionAlgorithm",KeyAgreeRecipientInfo.defaultValues("keyEncryptionAlgorithm"));this.recipientEncryptedKeys=(0,_pvutils.getParametersValue)(parameters,"recipientEncryptedKeys",KeyAgreeRecipientInfo.defaultValues("recipientEncryptedKeys"));this.recipientCertificate=(0,_pvutils.getParametersValue)(parameters,"recipientCertificate",KeyAgreeRecipientInfo.defaultValues("recipientCertificate"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"originator":return new _OriginatorIdentifierOrKey.default();case"ukm":return new asn1js.OctetString();case"keyEncryptionAlgorithm":return new _AlgorithmIdentifier.default();case"recipientEncryptedKeys":return new _RecipientEncryptedKeys.default();case"recipientCertificate":return new _Certificate.default();default:throw new Error(`Invalid member name for KeyAgreeRecipientInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===0;case"originator":return memberValue.variant===-1&&"value"in memberValue===false;case"ukm":return memberValue.isEqual(KeyAgreeRecipientInfo.defaultValues("ukm"));case"keyEncryptionAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"recipientEncryptedKeys":return memberValue.encryptedKeys.length===0;case"recipientCertificate":return false; default:throw new Error(`Invalid member name for KeyAgreeRecipientInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[_OriginatorIdentifierOrKey.default.schema(names.originator||{})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.OctetString({name:names.ukm||""})]}),_AlgorithmIdentifier.default.schema(names.keyEncryptionAlgorithm||{}),_RecipientEncryptedKeys.default.schema(names.recipientEncryptedKeys||{})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","originator","ukm","keyEncryptionAlgorithm","recipientEncryptedKeys"]);
 const asn1=asn1js.compareSchema(schema,schema,KeyAgreeRecipientInfo.schema({names:{version:"version",originator:{names:{blockName:"originator"}},ukm:"ukm",keyEncryptionAlgorithm:{names:{blockName:"keyEncryptionAlgorithm"}},recipientEncryptedKeys:{names:{blockName:"recipientEncryptedKeys"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for KeyAgreeRecipientInfo");
 this.version=asn1.result.version.valueBlock.valueDec;this.originator=new _OriginatorIdentifierOrKey.default({schema:asn1.result.originator});if("ukm"in asn1.result)this.ukm=asn1.result.ukm;this.keyEncryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.keyEncryptionAlgorithm});this.recipientEncryptedKeys=new _RecipientEncryptedKeys.default({schema:asn1.result.recipientEncryptedKeys});}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.originator.toSchema()]}));if("ukm"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[this.ukm]}));}
outputArray.push(this.keyEncryptionAlgorithm.toSchema());outputArray.push(this.recipientEncryptedKeys.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version,originator:this.originator.toJSON()};if("ukm"in this)_object.ukm=this.ukm.toJSON();_object.keyEncryptionAlgorithm=this.keyEncryptionAlgorithm.toJSON();_object.recipientEncryptedKeys=this.recipientEncryptedKeys.toJSON();return _object;}
}
exports.default=KeyAgreeRecipientInfo;},{"./AlgorithmIdentifier.js":4,"./Certificate.js":19,"./OriginatorIdentifierOrKey.js":57,"./RecipientEncryptedKeys.js":85,"asn1js":112,"pvutils":113}],50:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var _PrivateKeyInfo=_interopRequireDefault(require("./PrivateKeyInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
class KeyBag extends _PrivateKeyInfo.default{constructor(parameters={}){super(parameters);}
}
exports.default=KeyBag;},{"./PrivateKeyInfo.js":76}],51:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _RecipientIdentifier=_interopRequireDefault(require("./RecipientIdentifier.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class KeyTransRecipientInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",KeyTransRecipientInfo.defaultValues("version"));this.rid=(0,_pvutils.getParametersValue)(parameters,"rid",KeyTransRecipientInfo.defaultValues("rid"));this.keyEncryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"keyEncryptionAlgorithm",KeyTransRecipientInfo.defaultValues("keyEncryptionAlgorithm"));this.encryptedKey=(0,_pvutils.getParametersValue)(parameters,"encryptedKey",KeyTransRecipientInfo.defaultValues("encryptedKey"));this.recipientCertificate=(0,_pvutils.getParametersValue)(parameters,"recipientCertificate",KeyTransRecipientInfo.defaultValues("recipientCertificate"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return-1;case"rid":return{};case"keyEncryptionAlgorithm":return new _AlgorithmIdentifier.default();case"encryptedKey":return new asn1js.OctetString();case"recipientCertificate":return new _Certificate.default();default:throw new Error(`Invalid member name for KeyTransRecipientInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===KeyTransRecipientInfo.defaultValues("version");case"rid":return Object.keys(memberValue).length===0;case"keyEncryptionAlgorithm":case"encryptedKey":return memberValue.isEqual(KeyTransRecipientInfo.defaultValues(memberName));case"recipientCertificate":return false;default:throw new Error(`Invalid member name for KeyTransRecipientInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),_RecipientIdentifier.default.schema(names.rid||{}),_AlgorithmIdentifier.default.schema(names.keyEncryptionAlgorithm||{}),new asn1js.OctetString({name:names.encryptedKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","rid","keyEncryptionAlgorithm","encryptedKey"]);
 const asn1=asn1js.compareSchema(schema,schema,KeyTransRecipientInfo.schema({names:{version:"version",rid:{names:{blockName:"rid"}},keyEncryptionAlgorithm:{names:{blockName:"keyEncryptionAlgorithm"}},encryptedKey:"encryptedKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for KeyTransRecipientInfo");
 this.version=asn1.result.version.valueBlock.valueDec;if(asn1.result.rid.idBlock.tagClass===3)this.rid=asn1.result.rid.valueBlock.value[0]; else this.rid=new _IssuerAndSerialNumber.default({schema:asn1.result.rid});this.keyEncryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.keyEncryptionAlgorithm});this.encryptedKey=asn1.result.encryptedKey;}
toSchema(){ const outputArray=[];if(this.rid instanceof _IssuerAndSerialNumber.default){this.version=0;outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(this.rid.toSchema());}else{this.version=2;outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.rid]}));}
outputArray.push(this.keyEncryptionAlgorithm.toSchema());outputArray.push(this.encryptedKey);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){return{version:this.version,rid:this.rid.toJSON(),keyEncryptionAlgorithm:this.keyEncryptionAlgorithm.toJSON(),encryptedKey:this.encryptedKey.toJSON()};}
}
exports.default=KeyTransRecipientInfo;},{"./AlgorithmIdentifier.js":4,"./Certificate.js":19,"./IssuerAndSerialNumber.js":44,"./RecipientIdentifier.js":86,"asn1js":112,"pvutils":113}],52:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _DigestInfo=_interopRequireDefault(require("./DigestInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class MacData{constructor(parameters={}){ this.mac=(0,_pvutils.getParametersValue)(parameters,"mac",MacData.defaultValues("mac"));this.macSalt=(0,_pvutils.getParametersValue)(parameters,"macSalt",MacData.defaultValues("macSalt"));if("iterations"in parameters)
this.iterations=(0,_pvutils.getParametersValue)(parameters,"iterations",MacData.defaultValues("iterations"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"mac":return new _DigestInfo.default();case"macSalt":return new asn1js.OctetString();case"iterations":return 1;default:throw new Error(`Invalid member name for MacData class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"mac":return _DigestInfo.default.compareWithDefault("digestAlgorithm",memberValue.digestAlgorithm)&&_DigestInfo.default.compareWithDefault("digest",memberValue.digest);case"macSalt":return memberValue.isEqual(MacData.defaultValues(memberName));case"iterations":return memberValue===MacData.defaultValues(memberName);default:throw new Error(`Invalid member name for MacData class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",optional:names.optional||true,value:[_DigestInfo.default.schema(names.mac||{names:{blockName:"mac"}}),new asn1js.OctetString({name:names.macSalt||"macSalt"}),new asn1js.Integer({optional:true,name:names.iterations||"iterations"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["mac","macSalt","iterations"]);
 const asn1=asn1js.compareSchema(schema,schema,MacData.schema({names:{mac:{names:{blockName:"mac"}},macSalt:"macSalt",iterations:"iterations"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for MacData");
 this.mac=new _DigestInfo.default({schema:asn1.result.mac});this.macSalt=asn1.result.macSalt;if("iterations"in asn1.result)this.iterations=asn1.result.iterations.valueBlock.valueDec;}
toSchema(){ const outputArray=[this.mac.toSchema(),this.macSalt];if("iterations"in this)outputArray.push(new asn1js.Integer({value:this.iterations}));return new asn1js.Sequence({value:outputArray});}
toJSON(){const output={mac:this.mac.toJSON(),macSalt:this.macSalt.toJSON()};if("iterations"in this)output.iterations=this.iterations.toJSON();return output;}
}
exports.default=MacData;},{"./DigestInfo.js":28,"asn1js":112,"pvutils":113}],53:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class MessageImprint{constructor(parameters={}){ this.hashAlgorithm=(0,_pvutils.getParametersValue)(parameters,"hashAlgorithm",MessageImprint.defaultValues("hashAlgorithm"));this.hashedMessage=(0,_pvutils.getParametersValue)(parameters,"hashedMessage",MessageImprint.defaultValues("hashedMessage"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"hashAlgorithm":return new _AlgorithmIdentifier.default();case"hashedMessage":return new asn1js.OctetString();default:throw new Error(`Invalid member name for MessageImprint class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"hashAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"hashedMessage":return memberValue.isEqual(MessageImprint.defaultValues(memberName))===0;default:throw new Error(`Invalid member name for MessageImprint class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.hashAlgorithm||{}),new asn1js.OctetString({name:names.hashedMessage||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["hashAlgorithm","hashedMessage"]);
 const asn1=asn1js.compareSchema(schema,schema,MessageImprint.schema({names:{hashAlgorithm:{names:{blockName:"hashAlgorithm"}},hashedMessage:"hashedMessage"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for MessageImprint");
 this.hashAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.hashAlgorithm});this.hashedMessage=asn1.result.hashedMessage;}
toSchema(){ return new asn1js.Sequence({value:[this.hashAlgorithm.toSchema(),this.hashedMessage]});}
toJSON(){return{hashAlgorithm:this.hashAlgorithm.toJSON(),hashedMessage:this.hashedMessage.toJSON()};}
}
exports.default=MessageImprint;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],54:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralSubtree=_interopRequireDefault(require("./GeneralSubtree.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class NameConstraints{constructor(parameters={}){ if("permittedSubtrees"in parameters)
this.permittedSubtrees=(0,_pvutils.getParametersValue)(parameters,"permittedSubtrees",NameConstraints.defaultValues("permittedSubtrees"));if("excludedSubtrees"in parameters)
this.excludedSubtrees=(0,_pvutils.getParametersValue)(parameters,"excludedSubtrees",NameConstraints.defaultValues("excludedSubtrees"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"permittedSubtrees":return[];case"excludedSubtrees":return[];default:throw new Error(`Invalid member name for NameConstraints class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({name:names.permittedSubtrees||"",value:_GeneralSubtree.default.schema()})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Repeated({name:names.excludedSubtrees||"",value:_GeneralSubtree.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["permittedSubtrees","excludedSubtrees"]);
 const asn1=asn1js.compareSchema(schema,schema,NameConstraints.schema({names:{permittedSubtrees:"permittedSubtrees",excludedSubtrees:"excludedSubtrees"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for NameConstraints");
 if("permittedSubtrees"in asn1.result)this.permittedSubtrees=Array.from(asn1.result.permittedSubtrees,element=>new _GeneralSubtree.default({schema:element}));if("excludedSubtrees"in asn1.result)this.excludedSubtrees=Array.from(asn1.result.excludedSubtrees,element=>new _GeneralSubtree.default({schema:element}));}
toSchema(){ const outputArray=[];if("permittedSubtrees"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.permittedSubtrees,element=>element.toSchema())}));}
if("excludedSubtrees"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.excludedSubtrees,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("permittedSubtrees"in this)object.permittedSubtrees=Array.from(this.permittedSubtrees,element=>element.toJSON());if("excludedSubtrees"in this)object.excludedSubtrees=Array.from(this.excludedSubtrees,element=>element.toJSON());return object;}
}
exports.default=NameConstraints;},{"./GeneralSubtree.js":42,"asn1js":112,"pvutils":113}],55:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _TBSRequest=_interopRequireDefault(require("./TBSRequest.js"));var _Signature=_interopRequireDefault(require("./Signature.js"));var _Request=_interopRequireDefault(require("./Request.js"));var _CertID=_interopRequireDefault(require("./CertID.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OCSPRequest{constructor(parameters={}){ this.tbsRequest=(0,_pvutils.getParametersValue)(parameters,"tbsRequest",OCSPRequest.defaultValues("tbsRequest"));if("optionalSignature"in parameters)
this.optionalSignature=(0,_pvutils.getParametersValue)(parameters,"optionalSignature",OCSPRequest.defaultValues("optionalSignature"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbsRequest":return new _TBSRequest.default();case"optionalSignature":return new _Signature.default();default:throw new Error(`Invalid member name for OCSPRequest class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"tbsRequest": return _TBSRequest.default.compareWithDefault("tbs",memberValue.tbs)&&_TBSRequest.default.compareWithDefault("version",memberValue.version)&&_TBSRequest.default.compareWithDefault("requestorName",memberValue.requestorName)&&_TBSRequest.default.compareWithDefault("requestList",memberValue.requestList)&&_TBSRequest.default.compareWithDefault("requestExtensions",memberValue.requestExtensions);case"optionalSignature":return _Signature.default.compareWithDefault("signatureAlgorithm",memberValue.signatureAlgorithm)&&_Signature.default.compareWithDefault("signature",memberValue.signature)&&_Signature.default.compareWithDefault("certs",memberValue.certs);default:throw new Error(`Invalid member name for OCSPRequest class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"OCSPRequest",value:[_TBSRequest.default.schema(names.tbsRequest||{names:{blockName:"tbsRequest"}}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[_Signature.default.schema(names.optionalSignature||{names:{blockName:"optionalSignature"}})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["tbsRequest","optionalSignature"]);
 const asn1=asn1js.compareSchema(schema,schema,OCSPRequest.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OCSPRequest");
 this.tbsRequest=new _TBSRequest.default({schema:asn1.result.tbsRequest});if("optionalSignature"in asn1.result)this.optionalSignature=new _Signature.default({schema:asn1.result.optionalSignature});}
toSchema(encodeFlag=false){ const outputArray=[];outputArray.push(this.tbsRequest.toSchema(encodeFlag));if("optionalSignature"in this)outputArray.push(this.optionalSignature.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={tbsRequest:this.tbsRequest.toJSON()};if("optionalSignature"in this)_object.optionalSignature=this.optionalSignature.toJSON();return _object;}
createForCertificate(certificate,parameters){ let sequence=Promise.resolve();const certID=new _CertID.default();
 sequence=sequence.then(()=>certID.createForCertificate(certificate,parameters));
 sequence=sequence.then(()=>{this.tbsRequest=new _TBSRequest.default({requestList:[new _Request.default({reqCert:certID})]});},error=>Promise.reject(error)); return sequence;}
sign(privateKey,hashAlgorithm="SHA-1"){
 if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");
 if("optionalSignature"in this===false)return Promise.reject("Need to create \"optionalSignature\" field before signing");

 let sequence=Promise.resolve();let parameters;let tbs;const engine=(0,_common.getEngine)();
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.optionalSignature.signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{tbs=this.tbsRequest.toSchema(true).toBER(false);});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(tbs,privateKey,parameters));sequence=sequence.then(result=>{this.optionalSignature.signature=new asn1js.BitString({valueHex:result});}); return sequence;}
verify(){}

}
exports.default=OCSPRequest;},{"./CertID.js":18,"./Request.js":90,"./Signature.js":98,"./TBSRequest.js":105,"./common.js":110,"asn1js":112,"pvutils":113}],56:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _ResponseBytes=_interopRequireDefault(require("./ResponseBytes.js"));var _BasicOCSPResponse=_interopRequireDefault(require("./BasicOCSPResponse.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OCSPResponse{constructor(parameters={}){ this.responseStatus=(0,_pvutils.getParametersValue)(parameters,"responseStatus",OCSPResponse.defaultValues("responseStatus"));if("responseBytes"in parameters)
this.responseBytes=(0,_pvutils.getParametersValue)(parameters,"responseBytes",OCSPResponse.defaultValues("responseBytes"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"responseStatus":return new asn1js.Enumerated();case"responseBytes":return new _ResponseBytes.default();default:throw new Error(`Invalid member name for OCSPResponse class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"responseStatus":return memberValue.isEqual(OCSPResponse.defaultValues(memberName));case"responseBytes":return _ResponseBytes.default.compareWithDefault("responseType",memberValue.responseType)&&_ResponseBytes.default.compareWithDefault("response",memberValue.response);default:throw new Error(`Invalid member name for OCSPResponse class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"OCSPResponse",value:[new asn1js.Enumerated({name:names.responseStatus||"responseStatus"}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[_ResponseBytes.default.schema(names.responseBytes||{names:{blockName:"responseBytes"}})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["responseStatus","responseBytes"]);
 const asn1=asn1js.compareSchema(schema,schema,OCSPResponse.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OCSPResponse");
 this.responseStatus=asn1.result.responseStatus;if("responseBytes"in asn1.result)this.responseBytes=new _ResponseBytes.default({schema:asn1.result.responseBytes});}
toSchema(){ const outputArray=[];outputArray.push(this.responseStatus);if("responseBytes"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.responseBytes.toSchema()]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={responseStatus:this.responseStatus.toJSON()};if("responseBytes"in this)_object.responseBytes=this.responseBytes.toJSON();return _object;}
getCertificateStatus(certificate,issuerCertificate){ let basicResponse;const result={isForCertificate:false,status:2
};
if("responseBytes"in this===false)return result;if(this.responseBytes.responseType!=="1.3.6.1.5.5.7.48.1.1") 
return result;try{const asn1Basic=asn1js.fromBER(this.responseBytes.response.valueBlock.valueHex);basicResponse=new _BasicOCSPResponse.default({schema:asn1Basic.result});}catch(ex){return result;} 
return basicResponse.getCertificateStatus(certificate,issuerCertificate);}
sign(privateKey,hashAlgorithm){ if(this.responseBytes.responseType==="1.3.6.1.5.5.7.48.1.1"){const asn1=asn1js.fromBER(this.responseBytes.response.valueBlock.valueHex);const basicResponse=new _BasicOCSPResponse.default({schema:asn1.result});return basicResponse.sign(privateKey,hashAlgorithm);}
return Promise.reject(`Unknown ResponseBytes type: ${this.responseBytes.responseType}`);}
verify(issuerCertificate=null){ if("responseBytes"in this===false)return Promise.reject("Empty ResponseBytes field");
 if(this.responseBytes.responseType==="1.3.6.1.5.5.7.48.1.1"){const asn1=asn1js.fromBER(this.responseBytes.response.valueBlock.valueHex);const basicResponse=new _BasicOCSPResponse.default({schema:asn1.result});if(issuerCertificate!==null){if("certs"in basicResponse===false)basicResponse.certs=[];basicResponse.certs.push(issuerCertificate);}
return basicResponse.verify();}
return Promise.reject(`Unknown ResponseBytes type: ${this.responseBytes.responseType}`);}
}
exports.default=OCSPResponse;},{"./BasicOCSPResponse.js":13,"./ResponseBytes.js":91,"asn1js":112,"pvutils":113}],57:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _OriginatorPublicKey=_interopRequireDefault(require("./OriginatorPublicKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OriginatorIdentifierOrKey{constructor(parameters={}){ this.variant=(0,_pvutils.getParametersValue)(parameters,"variant",OriginatorIdentifierOrKey.defaultValues("variant"));if("value"in parameters)
this.value=(0,_pvutils.getParametersValue)(parameters,"value",OriginatorIdentifierOrKey.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"variant":return-1;case"value":return{};default:throw new Error(`Invalid member name for OriginatorIdentifierOrKey class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"variant":return memberValue===-1;case"value":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for OriginatorIdentifierOrKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({value:[_IssuerAndSerialNumber.default.schema({names:{blockName:names.blockName||""}}),new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:0
},name:names.blockName||""}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},name:names.blockName||"",value:_OriginatorPublicKey.default.schema().valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["blockName"]);
 const asn1=asn1js.compareSchema(schema,schema,OriginatorIdentifierOrKey.schema({names:{blockName:"blockName"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OriginatorIdentifierOrKey");
 if(asn1.result.blockName.idBlock.tagClass===1){this.variant=1;this.value=new _IssuerAndSerialNumber.default({schema:asn1.result.blockName});}else{if(asn1.result.blockName.idBlock.tagNumber===0){asn1.result.blockName.idBlock.tagClass=1; asn1.result.blockName.idBlock.tagNumber=4;
 this.variant=2;this.value=asn1.result.blockName;}else{this.variant=3;this.value=new _OriginatorPublicKey.default({schema:new asn1js.Sequence({value:asn1.result.blockName.valueBlock.value})});}}
}
toSchema(){ switch(this.variant){case 1:return this.value.toSchema();case 2:this.value.idBlock.tagClass=3; this.value.idBlock.tagNumber=0;return this.value;case 3:{const _schema=this.value.toSchema();_schema.idBlock.tagClass=3; _schema.idBlock.tagNumber=1;return _schema;}
default:return new asn1js.Any();}
}
toJSON(){const _object={variant:this.variant};if(this.variant===1||this.variant===2||this.variant===3)_object.value=this.value.toJSON();return _object;}
}
exports.default=OriginatorIdentifierOrKey;},{"./IssuerAndSerialNumber.js":44,"./OriginatorPublicKey.js":59,"asn1js":112,"pvutils":113}],58:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CertificateSet=_interopRequireDefault(require("./CertificateSet.js"));var _RevocationInfoChoices=_interopRequireDefault(require("./RevocationInfoChoices.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OriginatorInfo{constructor(parameters={}){ if("certs"in parameters)
this.certs=(0,_pvutils.getParametersValue)(parameters,"certs",OriginatorInfo.defaultValues("certs"));if("crls"in parameters)
this.crls=(0,_pvutils.getParametersValue)(parameters,"crls",OriginatorInfo.defaultValues("crls"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certs":return new _CertificateSet.default();case"crls":return new _RevocationInfoChoices.default();default:throw new Error(`Invalid member name for OriginatorInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"certs":return memberValue.certificates.length===0;case"crls":return memberValue.crls.length===0&&memberValue.otherRevocationInfos.length===0;default:throw new Error(`Invalid member name for OriginatorInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({name:names.certs||"",optional:true,idBlock:{tagClass:3, tagNumber:0
},value:_CertificateSet.default.schema().valueBlock.value}),new asn1js.Constructed({name:names.crls||"",optional:true,idBlock:{tagClass:3, tagNumber:1
},value:_RevocationInfoChoices.default.schema().valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["certs","crls"]);
 const asn1=asn1js.compareSchema(schema,schema,OriginatorInfo.schema({names:{certs:"certs",crls:"crls"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OriginatorInfo");
 if("certs"in asn1.result){this.certs=new _CertificateSet.default({schema:new asn1js.Set({value:asn1.result.certs.valueBlock.value})});}
if("crls"in asn1.result){this.crls=new _RevocationInfoChoices.default({schema:new asn1js.Set({value:asn1.result.crls.valueBlock.value})});}
}
toSchema(){const sequenceValue=[];if("certs"in this){sequenceValue.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:this.certs.toSchema().valueBlock.value}));}
if("crls"in this){sequenceValue.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:this.crls.toSchema().valueBlock.value}));} 
return new asn1js.Sequence({value:sequenceValue});}
toJSON(){const object={};if("certs"in this)object.certs=this.certs.toJSON();if("crls"in this)object.crls=this.crls.toJSON();return object;}
}
exports.default=OriginatorInfo;},{"./CertificateSet.js":23,"./RevocationInfoChoices.js":93,"asn1js":112,"pvutils":113}],59:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OriginatorPublicKey{constructor(parameters={}){ this.algorithm=(0,_pvutils.getParametersValue)(parameters,"algorithm",OriginatorPublicKey.defaultValues("algorithm"));this.publicKey=(0,_pvutils.getParametersValue)(parameters,"publicKey",OriginatorPublicKey.defaultValues("publicKey"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"algorithm":return new _AlgorithmIdentifier.default();case"publicKey":return new asn1js.BitString();default:throw new Error(`Invalid member name for OriginatorPublicKey class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"algorithm":case"publicKey":return memberValue.isEqual(OriginatorPublicKey.defaultValues(memberName));default:throw new Error(`Invalid member name for OriginatorPublicKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.algorithm||{}),new asn1js.BitString({name:names.publicKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["algorithm","publicKey"]);
 const asn1=asn1js.compareSchema(schema,schema,OriginatorPublicKey.schema({names:{algorithm:{names:{blockName:"algorithm"}},publicKey:"publicKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OriginatorPublicKey");
 this.algorithm=new _AlgorithmIdentifier.default({schema:asn1.result.algorithm});this.publicKey=asn1.result.publicKey;}
toSchema(){ return new asn1js.Sequence({value:[this.algorithm.toSchema(),this.publicKey]});}
toJSON(){return{algorithm:this.algorithm.toJSON(),publicKey:this.publicKey.toJSON()};}
}
exports.default=OriginatorPublicKey;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],60:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OtherCertificateFormat{constructor(parameters={}){ this.otherCertFormat=(0,_pvutils.getParametersValue)(parameters,"otherCertFormat",OtherCertificateFormat.defaultValues("otherCertFormat"));this.otherCert=(0,_pvutils.getParametersValue)(parameters,"otherCert",OtherCertificateFormat.defaultValues("otherCert"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"otherCertFormat":return"";case"otherCert":return new asn1js.Any();default:throw new Error(`Invalid member name for OtherCertificateFormat class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.otherCertFormat||"otherCertFormat"}),new asn1js.Any({name:names.otherCert||"otherCert"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["otherCertFormat","otherCert"]);
 const asn1=asn1js.compareSchema(schema,schema,OtherCertificateFormat.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OtherCertificateFormat");
 this.otherCertFormat=asn1.result.otherCertFormat.valueBlock.toString();this.otherCert=asn1.result.otherCert;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.otherCertFormat}),this.otherCert]});}
toJSON(){const object={otherCertFormat:this.otherCertFormat};if(!(this.otherCert instanceof asn1js.Any))object.otherCert=this.otherCert.toJSON();return object;}
}
exports.default=OtherCertificateFormat;},{"asn1js":112,"pvutils":113}],61:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OtherKeyAttribute{constructor(parameters={}){ this.keyAttrId=(0,_pvutils.getParametersValue)(parameters,"keyAttrId",OtherKeyAttribute.defaultValues("keyAttrId"));if("keyAttr"in parameters)
this.keyAttr=(0,_pvutils.getParametersValue)(parameters,"keyAttr",OtherKeyAttribute.defaultValues("keyAttr"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyAttrId":return"";case"keyAttr":return{};default:throw new Error(`Invalid member name for OtherKeyAttribute class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"keyAttrId":return memberValue==="";case"keyAttr":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for OtherKeyAttribute class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({optional:names.optional||true,name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.keyAttrId||""}),new asn1js.Any({optional:true,name:names.keyAttr||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyAttrId","keyAttr"]);
 const asn1=asn1js.compareSchema(schema,schema,OtherKeyAttribute.schema({names:{keyAttrId:"keyAttrId",keyAttr:"keyAttr"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OtherKeyAttribute");
 this.keyAttrId=asn1.result.keyAttrId.valueBlock.toString();if("keyAttr"in asn1.result)this.keyAttr=asn1.result.keyAttr;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.keyAttrId}));if("keyAttr"in this)outputArray.push(this.keyAttr);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={keyAttrId:this.keyAttrId};if("keyAttr"in this)_object.keyAttr=this.keyAttr.toJSON();return _object;}
}
exports.default=OtherKeyAttribute;},{"asn1js":112,"pvutils":113}],62:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OtherPrimeInfo{constructor(parameters={}){ this.prime=(0,_pvutils.getParametersValue)(parameters,"prime",OtherPrimeInfo.defaultValues("prime"));this.exponent=(0,_pvutils.getParametersValue)(parameters,"exponent",OtherPrimeInfo.defaultValues("exponent"));this.coefficient=(0,_pvutils.getParametersValue)(parameters,"coefficient",OtherPrimeInfo.defaultValues("coefficient"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"prime":return new asn1js.Integer();case"exponent":return new asn1js.Integer();case"coefficient":return new asn1js.Integer();default:throw new Error(`Invalid member name for OtherPrimeInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.prime||""}),new asn1js.Integer({name:names.exponent||""}),new asn1js.Integer({name:names.coefficient||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["prime","exponent","coefficient"]);
 const asn1=asn1js.compareSchema(schema,schema,OtherPrimeInfo.schema({names:{prime:"prime",exponent:"exponent",coefficient:"coefficient"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OtherPrimeInfo");
 this.prime=asn1.result.prime.convertFromDER();this.exponent=asn1.result.exponent.convertFromDER();this.coefficient=asn1.result.coefficient.convertFromDER();}
toSchema(){ return new asn1js.Sequence({value:[this.prime.convertToDER(),this.exponent.convertToDER(),this.coefficient.convertToDER()]});}
toJSON(){return{r:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.prime.valueBlock.valueHex),true,true),d:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.exponent.valueBlock.valueHex),true,true),t:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.coefficient.valueBlock.valueHex),true,true)};}
fromJSON(json){if("r"in json)this.prime=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.r,true))});else throw new Error("Absent mandatory parameter \"r\"");if("d"in json)this.exponent=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.d,true))});else throw new Error("Absent mandatory parameter \"d\"");if("t"in json)this.coefficient=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.t,true))});else throw new Error("Absent mandatory parameter \"t\"");}
}
exports.default=OtherPrimeInfo;},{"asn1js":112,"pvutils":113}],63:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OtherRecipientInfo{constructor(parameters={}){ this.oriType=(0,_pvutils.getParametersValue)(parameters,"oriType",OtherRecipientInfo.defaultValues("oriType"));this.oriValue=(0,_pvutils.getParametersValue)(parameters,"oriValue",OtherRecipientInfo.defaultValues("oriValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"oriType":return"";case"oriValue":return{};default:throw new Error(`Invalid member name for OtherRecipientInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"oriType":return memberValue==="";case"oriValue":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for OtherRecipientInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.oriType||""}),new asn1js.Any({name:names.oriValue||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["oriType","oriValue"]);
 const asn1=asn1js.compareSchema(schema,schema,OtherRecipientInfo.schema({names:{oriType:"oriType",oriValue:"oriValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OtherRecipientInfo");
 this.oriType=asn1.result.oriType.valueBlock.toString();this.oriValue=asn1.result.oriValue;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.oriType}),this.oriValue]});}
toJSON(){const _object={oriType:this.oriType};if(OtherRecipientInfo.compareWithDefault("oriValue",this.oriValue)===false)_object.oriValue=this.oriValue.toJSON();return _object;}
}
exports.default=OtherRecipientInfo;},{"asn1js":112,"pvutils":113}],64:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class OtherRevocationInfoFormat{constructor(parameters={}){ this.otherRevInfoFormat=(0,_pvutils.getParametersValue)(parameters,"otherRevInfoFormat",OtherRevocationInfoFormat.defaultValues("otherRevInfoFormat"));this.otherRevInfo=(0,_pvutils.getParametersValue)(parameters,"otherRevInfo",OtherRevocationInfoFormat.defaultValues("otherRevInfo"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"otherRevInfoFormat":return"";case"otherRevInfo":return new asn1js.Any();default:throw new Error(`Invalid member name for OtherRevocationInfoFormat class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.otherRevInfoFormat||"otherRevInfoFormat"}),new asn1js.Any({name:names.otherRevInfo||"otherRevInfo"})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["otherRevInfoFormat","otherRevInfo"]);
 const asn1=asn1js.compareSchema(schema,schema,OtherRevocationInfoFormat.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for OtherRevocationInfoFormat");
 this.otherRevInfoFormat=asn1.result.otherRevInfoFormat.valueBlock.toString();this.otherRevInfo=asn1.result.otherRevInfo;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.otherRevInfoFormat}),this.otherRevInfo]});}
toJSON(){const object={otherRevInfoFormat:this.otherRevInfoFormat};if(!(this.otherRevInfo instanceof asn1js.Any))object.otherRevInfo=this.otherRevInfo.toJSON();return object;}
}
exports.default=OtherRevocationInfoFormat;},{"asn1js":112,"pvutils":113}],65:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PBES2Params{constructor(parameters={}){ this.keyDerivationFunc=(0,_pvutils.getParametersValue)(parameters,"keyDerivationFunc",PBES2Params.defaultValues("keyDerivationFunc"));this.encryptionScheme=(0,_pvutils.getParametersValue)(parameters,"encryptionScheme",PBES2Params.defaultValues("encryptionScheme"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"keyDerivationFunc":return new _AlgorithmIdentifier.default();case"encryptionScheme":return new _AlgorithmIdentifier.default();default:throw new Error(`Invalid member name for PBES2Params class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.keyDerivationFunc||{}),_AlgorithmIdentifier.default.schema(names.encryptionScheme||{})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["keyDerivationFunc","encryptionScheme"]);
 const asn1=asn1js.compareSchema(schema,schema,PBES2Params.schema({names:{keyDerivationFunc:{names:{blockName:"keyDerivationFunc"}},encryptionScheme:{names:{blockName:"encryptionScheme"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PBES2Params");
 this.keyDerivationFunc=new _AlgorithmIdentifier.default({schema:asn1.result.keyDerivationFunc});this.encryptionScheme=new _AlgorithmIdentifier.default({schema:asn1.result.encryptionScheme});}
toSchema(){ return new asn1js.Sequence({value:[this.keyDerivationFunc.toSchema(),this.encryptionScheme.toSchema()]});}
toJSON(){return{keyDerivationFunc:this.keyDerivationFunc.toJSON(),encryptionScheme:this.encryptionScheme.toJSON()};}
}
exports.default=PBES2Params;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],66:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PBKDF2Params{constructor(parameters={}){ this.salt=(0,_pvutils.getParametersValue)(parameters,"salt",PBKDF2Params.defaultValues("salt"));this.iterationCount=(0,_pvutils.getParametersValue)(parameters,"iterationCount",PBKDF2Params.defaultValues("iterationCount"));if("keyLength"in parameters)
this.keyLength=(0,_pvutils.getParametersValue)(parameters,"keyLength",PBKDF2Params.defaultValues("keyLength"));if("prf"in parameters)
this.prf=(0,_pvutils.getParametersValue)(parameters,"prf",PBKDF2Params.defaultValues("prf"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"salt":return{};case"iterationCount":return-1;case"keyLength":return 0;case"prf":return new _AlgorithmIdentifier.default({algorithmId:"1.3.14.3.2.26", algorithmParams:new asn1js.Null()});default:throw new Error(`Invalid member name for PBKDF2Params class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Choice({value:[new asn1js.OctetString({name:names.saltPrimitive||""}),_AlgorithmIdentifier.default.schema(names.saltConstructed||{})]}),new asn1js.Integer({name:names.iterationCount||""}),new asn1js.Integer({name:names.keyLength||"",optional:true}),_AlgorithmIdentifier.default.schema(names.prf||{names:{optional:true}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["salt","iterationCount","keyLength","prf"]);
 const asn1=asn1js.compareSchema(schema,schema,PBKDF2Params.schema({names:{saltPrimitive:"salt",saltConstructed:{names:{blockName:"salt"}},iterationCount:"iterationCount",keyLength:"keyLength",prf:{names:{blockName:"prf",optional:true}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PBKDF2Params");
 this.salt=asn1.result.salt;this.iterationCount=asn1.result.iterationCount.valueBlock.valueDec;if("keyLength"in asn1.result)this.keyLength=asn1.result.keyLength.valueBlock.valueDec;if("prf"in asn1.result)this.prf=new _AlgorithmIdentifier.default({schema:asn1.result.prf});}
toSchema(){ const outputArray=[];outputArray.push(this.salt);outputArray.push(new asn1js.Integer({value:this.iterationCount}));if("keyLength"in this){if(PBKDF2Params.defaultValues("keyLength")!==this.keyLength)outputArray.push(new asn1js.Integer({value:this.keyLength}));}
if("prf"in this){if(PBKDF2Params.defaultValues("prf").isEqual(this.prf)===false)outputArray.push(this.prf.toSchema());}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={salt:this.salt.toJSON(),iterationCount:this.iterationCount};if("keyLength"in this){if(PBKDF2Params.defaultValues("keyLength")!==this.keyLength)_object.keyLength=this.keyLength;}
if("prf"in this){if(PBKDF2Params.defaultValues("prf").isEqual(this.prf)===false)_object.prf=this.prf.toJSON();}
return _object;}
}
exports.default=PBKDF2Params;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],67:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _ContentInfo=_interopRequireDefault(require("./ContentInfo.js"));var _MacData=_interopRequireDefault(require("./MacData.js"));var _DigestInfo=_interopRequireDefault(require("./DigestInfo.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _SignedData=_interopRequireDefault(require("./SignedData.js"));var _EncapsulatedContentInfo=_interopRequireDefault(require("./EncapsulatedContentInfo.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _SignerInfo=_interopRequireDefault(require("./SignerInfo.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _SignedAndUnsignedAttributes=_interopRequireDefault(require("./SignedAndUnsignedAttributes.js"));var _AuthenticatedSafe=_interopRequireDefault(require("./AuthenticatedSafe.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PFX{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",PFX.defaultValues("version"));this.authSafe=(0,_pvutils.getParametersValue)(parameters,"authSafe",PFX.defaultValues("authSafe"));if("macData"in parameters)
this.macData=(0,_pvutils.getParametersValue)(parameters,"macData",PFX.defaultValues("macData"));if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",PFX.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 3;case"authSafe":return new _ContentInfo.default();case"macData":return new _MacData.default();case"parsedValue":return{};default:throw new Error(`Invalid member name for PFX class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===PFX.defaultValues(memberName);case"authSafe":return _ContentInfo.default.compareWithDefault("contentType",memberValue.contentType)&&_ContentInfo.default.compareWithDefault("content",memberValue.content);case"macData":return _MacData.default.compareWithDefault("mac",memberValue.mac)&&_MacData.default.compareWithDefault("macSalt",memberValue.macSalt)&&_MacData.default.compareWithDefault("iterations",memberValue.iterations);case"parsedValue":return memberValue instanceof Object&&Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for PFX class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||"version"}),_ContentInfo.default.schema(names.authSafe||{names:{blockName:"authSafe"}}),_MacData.default.schema(names.macData||{names:{blockName:"macData",optional:true}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","authSafe","macData"]);
 const asn1=asn1js.compareSchema(schema,schema,PFX.schema({names:{version:"version",authSafe:{names:{blockName:"authSafe"}},macData:{names:{blockName:"macData"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PFX");
 this.version=asn1.result.version.valueBlock.valueDec;this.authSafe=new _ContentInfo.default({schema:asn1.result.authSafe});if("macData"in asn1.result)this.macData=new _MacData.default({schema:asn1.result.macData});}
toSchema(){ const outputArray=[new asn1js.Integer({value:this.version}),this.authSafe.toSchema()];if("macData"in this)outputArray.push(this.macData.toSchema());return new asn1js.Sequence({value:outputArray});}
toJSON(){const output={version:this.version,authSafe:this.authSafe.toJSON()};if("macData"in this)output.macData=this.macData.toJSON();return output;}
makeInternalValues(parameters={}){ if(parameters instanceof Object===false)return Promise.reject("The \"parameters\" must has \"Object\" type");if("parsedValue"in this===false)return Promise.reject("Please call \"parseValues\" function first in order to make \"parsedValue\" data");if("integrityMode"in this.parsedValue===false)return Promise.reject("Absent mandatory parameter \"integrityMode\" inside \"parsedValue\"");
 let sequence=Promise.resolve();
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");

 if("authenticatedSafe"in this.parsedValue===false)return Promise.reject("Absent mandatory parameter \"authenticatedSafe\" in \"parsedValue\""); switch(this.parsedValue.integrityMode){ case 0:{ if("iterations"in parameters===false)return Promise.reject("Absent mandatory parameter \"iterations\"");if("pbkdf2HashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"pbkdf2HashAlgorithm\"");if("hmacHashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"hmacHashAlgorithm\"");if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");
 const saltBuffer=new ArrayBuffer(64);const saltView=new Uint8Array(saltBuffer);(0,_common.getRandomValues)(saltView);const data=this.parsedValue.authenticatedSafe.toSchema().toBER(false);this.authSafe=new _ContentInfo.default({contentType:"1.2.840.113549.1.7.1",content:new asn1js.OctetString({valueHex:data})});
 const engine=(0,_common.getEngine)();if("stampDataWithPassword"in engine.subtle===false)return Promise.reject(`No support for "stampDataWithPassword" in current engine "${engine.name}"`);sequence=sequence.then(()=>engine.subtle.stampDataWithPassword({password:parameters.password,hashAlgorithm:parameters.hmacHashAlgorithm,salt:saltBuffer,iterationCount:parameters.iterations,contentToStamp:data}));
 sequence=sequence.then(result=>{this.macData=new _MacData.default({mac:new _DigestInfo.default({digestAlgorithm:new _AlgorithmIdentifier.default({algorithmId:(0,_common.getOIDByAlgorithm)({name:parameters.hmacHashAlgorithm})}),digest:new asn1js.OctetString({valueHex:result})}),macSalt:new asn1js.OctetString({valueHex:saltBuffer}),iterations:parameters.iterations});},error=>Promise.reject(error));
}
break;
 case 1:{ if("signingCertificate"in parameters===false)return Promise.reject("Absent mandatory parameter \"signingCertificate\"");if("privateKey"in parameters===false)return Promise.reject("Absent mandatory parameter \"privateKey\"");if("hashAlgorithm"in parameters===false)return Promise.reject("Absent mandatory parameter \"hashAlgorithm\"");

const toBeSigned=this.parsedValue.authenticatedSafe.toSchema().toBER(false);
 const cmsSigned=new _SignedData.default({version:1,encapContentInfo:new _EncapsulatedContentInfo.default({eContentType:"1.2.840.113549.1.7.1", eContent:new asn1js.OctetString({valueHex:toBeSigned})}),certificates:[parameters.signingCertificate]});

 sequence=sequence.then(()=>crypto.digest({name:parameters.hashAlgorithm},new Uint8Array(toBeSigned)));
 sequence=sequence.then(result=>{ const signedAttr=[];
 signedAttr.push(new _Attribute.default({type:"1.2.840.113549.1.9.3",values:[new asn1js.ObjectIdentifier({value:"1.2.840.113549.1.7.1"})]}));
 signedAttr.push(new _Attribute.default({type:"1.2.840.113549.1.9.5",values:[new asn1js.UTCTime({valueDate:new Date()})]}));
 signedAttr.push(new _Attribute.default({type:"1.2.840.113549.1.9.4",values:[new asn1js.OctetString({valueHex:result})]}));
 cmsSigned.signerInfos.push(new _SignerInfo.default({version:1,sid:new _IssuerAndSerialNumber.default({issuer:parameters.signingCertificate.issuer,serialNumber:parameters.signingCertificate.serialNumber}),signedAttrs:new _SignedAndUnsignedAttributes.default({type:0,attributes:signedAttr})}));},error=>Promise.reject(`Error during making digest for message: ${error}`));

 sequence=sequence.then(()=>cmsSigned.sign(parameters.privateKey,0,parameters.hashAlgorithm));
 sequence=sequence.then(()=>{this.authSafe=new _ContentInfo.default({contentType:"1.2.840.113549.1.7.2",content:cmsSigned.toSchema(true)});},error=>Promise.reject(`Error during making signature: ${error}`));}
break;
 default:return Promise.reject(`Parameter "integrityMode" has unknown value: ${parameters.integrityMode}`);} 
return sequence;}
parseInternalValues(parameters){if(parameters instanceof Object===false)return Promise.reject("The \"parameters\" must has \"Object\" type");if("checkIntegrity"in parameters===false)parameters.checkIntegrity=true;
 let sequence=Promise.resolve();
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 this.parsedValue={};switch(this.authSafe.contentType){ case"1.2.840.113549.1.7.1":{ if("password"in parameters===false)return Promise.reject("Absent mandatory parameter \"password\"");
 this.parsedValue.integrityMode=0;
if(this.authSafe.content instanceof asn1js.OctetString===false)return Promise.reject("Wrong type of \"this.authSafe.content\"");
 let authSafeContent=new ArrayBuffer(0);if(this.authSafe.content.valueBlock.isConstructed){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.authSafe.content.valueBlock.value[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const contentValue=_step.value;authSafeContent=(0,_pvutils.utilConcatBuf)(authSafeContent,contentValue.valueBlock.valueHex);}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}}else authSafeContent=this.authSafe.content.valueBlock.valueHex;
 const asn1=asn1js.fromBER(authSafeContent);if(asn1.offset===-1)return Promise.reject("Error during parsing of ASN.1 data inside \"this.authSafe.content\"");
 this.parsedValue.authenticatedSafe=new _AuthenticatedSafe.default({schema:asn1.result});
 if(parameters.checkIntegrity){ if("macData"in this===false)return Promise.reject("Absent \"macData\" value, can not check PKCS#12 data integrity");
 const hashAlgorithm=(0,_common.getAlgorithmByOID)(this.macData.mac.digestAlgorithm.algorithmId);if("name"in hashAlgorithm===false)return Promise.reject(`Unsupported digest algorithm: ${this.macData.mac.digestAlgorithm.algorithmId}`);
 const engine=(0,_common.getEngine)();sequence=sequence.then(()=>engine.subtle.verifyDataStampedWithPassword({password:parameters.password,hashAlgorithm:hashAlgorithm.name,salt:this.macData.macSalt.valueBlock.valueHex,iterationCount:this.macData.iterations,contentToVerify:authSafeContent,signatureToVerify:this.macData.mac.digest.valueBlock.valueHex}));
 sequence=sequence.then(result=>{if(result===false)return Promise.reject("Integrity for the PKCS#12 data is broken!");return Promise.resolve();},error=>Promise.reject(error));}
}
break;
 case"1.2.840.113549.1.7.2":{ this.parsedValue.integrityMode=1;
 const cmsSigned=new _SignedData.default({schema:this.authSafe.content});
if("eContent"in cmsSigned.encapContentInfo===false)return Promise.reject("Absent of attached data in \"cmsSigned.encapContentInfo\"");if(cmsSigned.encapContentInfo.eContent instanceof asn1js.OctetString===false)return Promise.reject("Wrong type of \"cmsSigned.encapContentInfo.eContent\"");
 let data=new ArrayBuffer(0);if(cmsSigned.encapContentInfo.eContent.idBlock.isConstructed===false)data=cmsSigned.encapContentInfo.eContent.valueBlock.valueHex;else{for(let i=0;i<cmsSigned.encapContentInfo.eContent.valueBlock.value.length;i++)data=(0,_pvutils.utilConcatBuf)(data,cmsSigned.encapContentInfo.eContent.valueBlock.value[i].valueBlock.valueHex);}
 
const asn1=asn1js.fromBER(data);if(asn1.offset===-1)return Promise.reject("Error during parsing of ASN.1 data inside \"this.authSafe.content\"");
 this.parsedValue.authenticatedSafe=new _AuthenticatedSafe.default({schema:asn1.result});
 sequence=sequence.then(()=>cmsSigned.verify({signer:0,checkChain:false})).then(result=>{if(result===false)return Promise.reject("Integrity for the PKCS#12 data is broken!");return Promise.resolve();},error=>Promise.reject(`Error during integrity verification: ${error}`));}
break;
 default:return Promise.reject(`Incorrect value for "this.authSafe.contentType": ${this.authSafe.contentType}`);}
 
return sequence.then(()=>this,error=>Promise.reject(`Error during parsing: ${error}`));}
}
exports.default=PFX;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./AuthenticatedSafe.js":10,"./ContentInfo.js":26,"./DigestInfo.js":28,"./EncapsulatedContentInfo.js":33,"./IssuerAndSerialNumber.js":44,"./MacData.js":52,"./SignedAndUnsignedAttributes.js":99,"./SignedData.js":101,"./SignerInfo.js":102,"./common.js":110,"asn1js":112,"pvutils":113}],68:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _EncryptedData=_interopRequireDefault(require("./EncryptedData.js"));var _EncryptedContentInfo=_interopRequireDefault(require("./EncryptedContentInfo.js"));var _PrivateKeyInfo=_interopRequireDefault(require("./PrivateKeyInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PKCS8ShroudedKeyBag{constructor(parameters={}){ this.encryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"encryptionAlgorithm",PKCS8ShroudedKeyBag.defaultValues("encryptionAlgorithm"));this.encryptedData=(0,_pvutils.getParametersValue)(parameters,"encryptedData",PKCS8ShroudedKeyBag.defaultValues("encryptedData"));if("parsedValue"in parameters)
this.parsedValue=(0,_pvutils.getParametersValue)(parameters,"parsedValue",PKCS8ShroudedKeyBag.defaultValues("parsedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"encryptionAlgorithm":return new _AlgorithmIdentifier.default();case"encryptedData":return new asn1js.OctetString();case"parsedValue":return{};default:throw new Error(`Invalid member name for PKCS8ShroudedKeyBag class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"encryptionAlgorithm":return _AlgorithmIdentifier.default.compareWithDefault("algorithmId",memberValue.algorithmId)&&"algorithmParams"in memberValue===false;case"encryptedData":return memberValue.isEqual(PKCS8ShroudedKeyBag.defaultValues(memberName));case"parsedValue":return memberValue instanceof Object&&Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for PKCS8ShroudedKeyBag class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.encryptionAlgorithm||{names:{blockName:"encryptionAlgorithm"}}),new asn1js.Choice({value:[new asn1js.OctetString({name:names.encryptedData||"encryptedData"}),new asn1js.OctetString({idBlock:{isConstructed:true},name:names.encryptedData||"encryptedData"})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["encryptionAlgorithm","encryptedData"]);
 const asn1=asn1js.compareSchema(schema,schema,PKCS8ShroudedKeyBag.schema({names:{encryptionAlgorithm:{names:{blockName:"encryptionAlgorithm"}},encryptedData:"encryptedData"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PKCS8ShroudedKeyBag");
 this.encryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.encryptionAlgorithm});this.encryptedData=asn1.result.encryptedData;}
toSchema(){ return new asn1js.Sequence({value:[this.encryptionAlgorithm.toSchema(),this.encryptedData]});}
toJSON(){return{encryptionAlgorithm:this.encryptionAlgorithm.toJSON(),encryptedData:this.encryptedData.toJSON()};}
parseInternalValues(parameters){ let sequence=Promise.resolve();const cmsEncrypted=new _EncryptedData.default({encryptedContentInfo:new _EncryptedContentInfo.default({contentEncryptionAlgorithm:this.encryptionAlgorithm,encryptedContent:this.encryptedData})});
 sequence=sequence.then(()=>cmsEncrypted.decrypt(parameters),error=>Promise.reject(error));
 sequence=sequence.then(result=>{const asn1=asn1js.fromBER(result);if(asn1.offset===-1)return Promise.reject("Error during parsing ASN.1 data");this.parsedValue=new _PrivateKeyInfo.default({schema:asn1.result});return Promise.resolve();},error=>Promise.reject(error)); return sequence;}
makeInternalValues(parameters){if("parsedValue"in this===false)return Promise.reject("Please initialize \"parsedValue\" first");
 let sequence=Promise.resolve();const cmsEncrypted=new _EncryptedData.default();
 sequence=sequence.then(()=>{parameters.contentToEncrypt=this.parsedValue.toSchema().toBER(false);return cmsEncrypted.encrypt(parameters);},error=>Promise.reject(error));
 sequence=sequence.then(()=>{this.encryptionAlgorithm=cmsEncrypted.encryptedContentInfo.contentEncryptionAlgorithm;this.encryptedData=cmsEncrypted.encryptedContentInfo.encryptedContent;}); return sequence;}
}
exports.default=PKCS8ShroudedKeyBag;},{"./AlgorithmIdentifier.js":4,"./EncryptedContentInfo.js":34,"./EncryptedData.js":35,"./PrivateKeyInfo.js":76,"asn1js":112,"pvutils":113}],69:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PKIStatusInfo{constructor(parameters={}){ this.status=(0,_pvutils.getParametersValue)(parameters,"status",PKIStatusInfo.defaultValues("status"));if("statusStrings"in parameters)
this.statusStrings=(0,_pvutils.getParametersValue)(parameters,"statusStrings",PKIStatusInfo.defaultValues("statusStrings"));if("failInfo"in parameters)
this.failInfo=(0,_pvutils.getParametersValue)(parameters,"failInfo",PKIStatusInfo.defaultValues("failInfo"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"status":return 2;case"statusStrings":return[];case"failInfo":return new asn1js.BitString();default:throw new Error(`Invalid member name for PKIStatusInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"status":return memberValue===PKIStatusInfo.defaultValues(memberName);case"statusStrings":return memberValue.length===0;case"failInfo":return memberValue.isEqual(PKIStatusInfo.defaultValues(memberName));default:throw new Error(`Invalid member name for PKIStatusInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.status||""}),new asn1js.Sequence({optional:true,value:[new asn1js.Repeated({name:names.statusStrings||"",value:new asn1js.Utf8String()})]}),new asn1js.BitString({name:names.failInfo||"",optional:true})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["status","statusStrings","failInfo"]);
 const asn1=asn1js.compareSchema(schema,schema,PKIStatusInfo.schema({names:{status:"status",statusStrings:"statusStrings",failInfo:"failInfo"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PKIStatusInfo");
 const _status=asn1.result.status;if(_status.valueBlock.isHexOnly===true||_status.valueBlock.valueDec<0||_status.valueBlock.valueDec>5)throw new Error("PKIStatusInfo \"status\" has invalid value");this.status=_status.valueBlock.valueDec;if("statusStrings"in asn1.result)this.statusStrings=asn1.result.statusStrings;if("failInfo"in asn1.result)this.failInfo=asn1.result.failInfo;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.status}));if("statusStrings"in this){outputArray.push(new asn1js.Sequence({optional:true,value:this.statusStrings}));}
if("failInfo"in this)outputArray.push(this.failInfo);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={status:this.status};if("statusStrings"in this)_object.statusStrings=Array.from(this.statusStrings,element=>element.toJSON());if("failInfo"in this)_object.failInfo=this.failInfo.toJSON();return _object;}
}
exports.default=PKIStatusInfo;},{"asn1js":112,"pvutils":113}],70:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PasswordRecipientinfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",PasswordRecipientinfo.defaultValues("version"));if("keyDerivationAlgorithm"in parameters)
this.keyDerivationAlgorithm=(0,_pvutils.getParametersValue)(parameters,"keyDerivationAlgorithm",PasswordRecipientinfo.defaultValues("keyDerivationAlgorithm"));this.keyEncryptionAlgorithm=(0,_pvutils.getParametersValue)(parameters,"keyEncryptionAlgorithm",PasswordRecipientinfo.defaultValues("keyEncryptionAlgorithm"));this.encryptedKey=(0,_pvutils.getParametersValue)(parameters,"encryptedKey",PasswordRecipientinfo.defaultValues("encryptedKey"));this.password=(0,_pvutils.getParametersValue)(parameters,"password",PasswordRecipientinfo.defaultValues("password"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return-1;case"keyDerivationAlgorithm":return new _AlgorithmIdentifier.default();case"keyEncryptionAlgorithm":return new _AlgorithmIdentifier.default();case"encryptedKey":return new asn1js.OctetString();case"password":return new ArrayBuffer(0);default:throw new Error(`Invalid member name for PasswordRecipientinfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===-1;case"keyDerivationAlgorithm":case"keyEncryptionAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"encryptedKey":return memberValue.isEqual(PasswordRecipientinfo.defaultValues("encryptedKey"));case"password":return memberValue.byteLength===0;default:throw new Error(`Invalid member name for PasswordRecipientinfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.Constructed({name:names.keyDerivationAlgorithm||"",optional:true,idBlock:{tagClass:3, tagNumber:0
},value:_AlgorithmIdentifier.default.schema().valueBlock.value}),_AlgorithmIdentifier.default.schema(names.keyEncryptionAlgorithm||{}),new asn1js.OctetString({name:names.encryptedKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","keyDerivationAlgorithm","keyEncryptionAlgorithm","encryptedKey"]);
 const asn1=asn1js.compareSchema(schema,schema,PasswordRecipientinfo.schema({names:{version:"version",keyDerivationAlgorithm:"keyDerivationAlgorithm",keyEncryptionAlgorithm:{names:{blockName:"keyEncryptionAlgorithm"}},encryptedKey:"encryptedKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PasswordRecipientinfo");
 this.version=asn1.result.version.valueBlock.valueDec;if("keyDerivationAlgorithm"in asn1.result){this.keyDerivationAlgorithm=new _AlgorithmIdentifier.default({schema:new asn1js.Sequence({value:asn1.result.keyDerivationAlgorithm.valueBlock.value})});}
this.keyEncryptionAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.keyEncryptionAlgorithm});this.encryptedKey=asn1.result.encryptedKey;}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));if("keyDerivationAlgorithm"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:this.keyDerivationAlgorithm.toSchema().valueBlock.value}));}
outputArray.push(this.keyEncryptionAlgorithm.toSchema());outputArray.push(this.encryptedKey);
 return new asn1js.Sequence({value:outputArray});}
toJSON(){return{version:this.version,keyDerivationAlgorithm:this.keyDerivationAlgorithm.toJSON(),keyEncryptionAlgorithm:this.keyEncryptionAlgorithm.toJSON(),encryptedKey:this.encryptedKey.toJSON()};}
}
exports.default=PasswordRecipientinfo;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],71:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PolicyConstraints{constructor(parameters={}){ if("requireExplicitPolicy"in parameters)
this.requireExplicitPolicy=(0,_pvutils.getParametersValue)(parameters,"requireExplicitPolicy",PolicyConstraints.defaultValues("requireExplicitPolicy"));if("inhibitPolicyMapping"in parameters)
this.inhibitPolicyMapping=(0,_pvutils.getParametersValue)(parameters,"inhibitPolicyMapping",PolicyConstraints.defaultValues("inhibitPolicyMapping"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"requireExplicitPolicy":return 0;case"inhibitPolicyMapping":return 0;default:throw new Error(`Invalid member name for PolicyConstraints class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Primitive({name:names.requireExplicitPolicy||"",optional:true,idBlock:{tagClass:3, tagNumber:0
}}), new asn1js.Primitive({name:names.inhibitPolicyMapping||"",optional:true,idBlock:{tagClass:3, tagNumber:1
}})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["requireExplicitPolicy","inhibitPolicyMapping"]);
 const asn1=asn1js.compareSchema(schema,schema,PolicyConstraints.schema({names:{requireExplicitPolicy:"requireExplicitPolicy",inhibitPolicyMapping:"inhibitPolicyMapping"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PolicyConstraints");
 if("requireExplicitPolicy"in asn1.result){const field1=asn1.result.requireExplicitPolicy;field1.idBlock.tagClass=1; field1.idBlock.tagNumber=2; const ber1=field1.toBER(false);const int1=asn1js.fromBER(ber1);this.requireExplicitPolicy=int1.result.valueBlock.valueDec;}
if("inhibitPolicyMapping"in asn1.result){const field2=asn1.result.inhibitPolicyMapping;field2.idBlock.tagClass=1; field2.idBlock.tagNumber=2; const ber2=field2.toBER(false);const int2=asn1js.fromBER(ber2);this.inhibitPolicyMapping=int2.result.valueBlock.valueDec;}
}
toSchema(){ const outputArray=[];if("requireExplicitPolicy"in this){const int1=new asn1js.Integer({value:this.requireExplicitPolicy});int1.idBlock.tagClass=3; int1.idBlock.tagNumber=0;outputArray.push(int1);}
if("inhibitPolicyMapping"in this){const int2=new asn1js.Integer({value:this.inhibitPolicyMapping});int2.idBlock.tagClass=3; int2.idBlock.tagNumber=1;outputArray.push(int2);}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("requireExplicitPolicy"in this)object.requireExplicitPolicy=this.requireExplicitPolicy;if("inhibitPolicyMapping"in this)object.inhibitPolicyMapping=this.inhibitPolicyMapping;return object;}
}
exports.default=PolicyConstraints;},{"asn1js":112,"pvutils":113}],72:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _PolicyQualifierInfo=_interopRequireDefault(require("./PolicyQualifierInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PolicyInformation{constructor(parameters={}){ this.policyIdentifier=(0,_pvutils.getParametersValue)(parameters,"policyIdentifier",PolicyInformation.defaultValues("policyIdentifier"));if("policyQualifiers"in parameters)
this.policyQualifiers=(0,_pvutils.getParametersValue)(parameters,"policyQualifiers",PolicyInformation.defaultValues("policyQualifiers"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"policyIdentifier":return"";case"policyQualifiers":return[];default:throw new Error(`Invalid member name for PolicyInformation class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.policyIdentifier||""}),new asn1js.Sequence({optional:true,value:[new asn1js.Repeated({name:names.policyQualifiers||"",value:_PolicyQualifierInfo.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["policyIdentifier","policyQualifiers"]);
 const asn1=asn1js.compareSchema(schema,schema,PolicyInformation.schema({names:{policyIdentifier:"policyIdentifier",policyQualifiers:"policyQualifiers"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PolicyInformation");
 this.policyIdentifier=asn1.result.policyIdentifier.valueBlock.toString();if("policyQualifiers"in asn1.result)this.policyQualifiers=Array.from(asn1.result.policyQualifiers,element=>new _PolicyQualifierInfo.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.ObjectIdentifier({value:this.policyIdentifier}));if("policyQualifiers"in this){outputArray.push(new asn1js.Sequence({value:Array.from(this.policyQualifiers,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={policyIdentifier:this.policyIdentifier};if("policyQualifiers"in this)object.policyQualifiers=Array.from(this.policyQualifiers,element=>element.toJSON());return object;}
}
exports.default=PolicyInformation;},{"./PolicyQualifierInfo.js":75,"asn1js":112,"pvutils":113}],73:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PolicyMapping{constructor(parameters={}){ this.issuerDomainPolicy=(0,_pvutils.getParametersValue)(parameters,"issuerDomainPolicy",PolicyMapping.defaultValues("issuerDomainPolicy"));this.subjectDomainPolicy=(0,_pvutils.getParametersValue)(parameters,"subjectDomainPolicy",PolicyMapping.defaultValues("subjectDomainPolicy"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"issuerDomainPolicy":return"";case"subjectDomainPolicy":return"";default:throw new Error(`Invalid member name for PolicyMapping class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.issuerDomainPolicy||""}),new asn1js.ObjectIdentifier({name:names.subjectDomainPolicy||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["issuerDomainPolicy","subjectDomainPolicy"]);
 const asn1=asn1js.compareSchema(schema,schema,PolicyMapping.schema({names:{issuerDomainPolicy:"issuerDomainPolicy",subjectDomainPolicy:"subjectDomainPolicy"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PolicyMapping");
 this.issuerDomainPolicy=asn1.result.issuerDomainPolicy.valueBlock.toString();this.subjectDomainPolicy=asn1.result.subjectDomainPolicy.valueBlock.toString();}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.issuerDomainPolicy}),new asn1js.ObjectIdentifier({value:this.subjectDomainPolicy})]});}
toJSON(){return{issuerDomainPolicy:this.issuerDomainPolicy,subjectDomainPolicy:this.subjectDomainPolicy};}
}
exports.default=PolicyMapping;},{"asn1js":112,"pvutils":113}],74:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _PolicyMapping=_interopRequireDefault(require("./PolicyMapping.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PolicyMappings{constructor(parameters={}){ this.mappings=(0,_pvutils.getParametersValue)(parameters,"mappings",PolicyMappings.defaultValues("mappings"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"mappings":return[];default:throw new Error(`Invalid member name for PolicyMappings class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.mappings||"",value:_PolicyMapping.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["mappings"]);
 const asn1=asn1js.compareSchema(schema,schema,PolicyMappings.schema({names:{mappings:"mappings"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PolicyMappings");
 this.mappings=Array.from(asn1.result.mappings,element=>new _PolicyMapping.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.mappings,element=>element.toSchema())});}
toJSON(){return{mappings:Array.from(this.mappings,element=>element.toJSON())};}
}
exports.default=PolicyMappings;},{"./PolicyMapping.js":73,"asn1js":112,"pvutils":113}],75:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PolicyQualifierInfo{constructor(parameters={}){ this.policyQualifierId=(0,_pvutils.getParametersValue)(parameters,"policyQualifierId",PolicyQualifierInfo.defaultValues("policyQualifierId"));this.qualifier=(0,_pvutils.getParametersValue)(parameters,"qualifier",PolicyQualifierInfo.defaultValues("qualifier"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"policyQualifierId":return"";case"qualifier":return new asn1js.Any();default:throw new Error(`Invalid member name for PolicyQualifierInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.policyQualifierId||""}),new asn1js.Any({name:names.qualifier||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["policyQualifierId","qualifier"]);
 const asn1=asn1js.compareSchema(schema,schema,PolicyQualifierInfo.schema({names:{policyQualifierId:"policyQualifierId",qualifier:"qualifier"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PolicyQualifierInfo");
 this.policyQualifierId=asn1.result.policyQualifierId.valueBlock.toString();this.qualifier=asn1.result.qualifier;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.policyQualifierId}),this.qualifier]});}
toJSON(){return{policyQualifierId:this.policyQualifierId,qualifier:this.qualifier.toJSON()};}
}
exports.default=PolicyQualifierInfo;},{"asn1js":112,"pvutils":113}],76:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _ECPrivateKey=_interopRequireDefault(require("./ECPrivateKey.js"));var _RSAPrivateKey=_interopRequireDefault(require("./RSAPrivateKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PrivateKeyInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",PrivateKeyInfo.defaultValues("version"));this.privateKeyAlgorithm=(0,_pvutils.getParametersValue)(parameters,"privateKeyAlgorithm",PrivateKeyInfo.defaultValues("privateKeyAlgorithm"));this.privateKey=(0,_pvutils.getParametersValue)(parameters,"privateKey",PrivateKeyInfo.defaultValues("privateKey"));if("attributes"in parameters)
this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",PrivateKeyInfo.defaultValues("attributes"));if("parsedKey"in parameters)
this.parsedKey=(0,_pvutils.getParametersValue)(parameters,"parsedKey",PrivateKeyInfo.defaultValues("parsedKey"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"privateKeyAlgorithm":return new _AlgorithmIdentifier.default();case"privateKey":return new asn1js.OctetString();case"attributes":return[];case"parsedKey":return{};default:throw new Error(`Invalid member name for PrivateKeyInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),_AlgorithmIdentifier.default.schema(names.privateKeyAlgorithm||{}),new asn1js.OctetString({name:names.privateKey||""}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({name:names.attributes||"",value:_Attribute.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","privateKeyAlgorithm","privateKey","attributes"]);
 const asn1=asn1js.compareSchema(schema,schema,PrivateKeyInfo.schema({names:{version:"version",privateKeyAlgorithm:{names:{blockName:"privateKeyAlgorithm"}},privateKey:"privateKey",attributes:"attributes"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PrivateKeyInfo");
 this.version=asn1.result.version.valueBlock.valueDec;this.privateKeyAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.privateKeyAlgorithm});this.privateKey=asn1.result.privateKey;if("attributes"in asn1.result)this.attributes=Array.from(asn1.result.attributes,element=>new _Attribute.default({schema:element}));switch(this.privateKeyAlgorithm.algorithmId){case"1.2.840.113549.1.1.1":{const privateKeyASN1=asn1js.fromBER(this.privateKey.valueBlock.valueHex);if(privateKeyASN1.offset!==-1)this.parsedKey=new _RSAPrivateKey.default({schema:privateKeyASN1.result});}
break;case"1.2.840.10045.2.1": if("algorithmParams"in this.privateKeyAlgorithm){if(this.privateKeyAlgorithm.algorithmParams instanceof asn1js.ObjectIdentifier){const privateKeyASN1=asn1js.fromBER(this.privateKey.valueBlock.valueHex);if(privateKeyASN1.offset!==-1){this.parsedKey=new _ECPrivateKey.default({namedCurve:this.privateKeyAlgorithm.algorithmParams.valueBlock.toString(),schema:privateKeyASN1.result});}}}
break;default:}
}
toSchema(){ const outputArray=[new asn1js.Integer({value:this.version}),this.privateKeyAlgorithm.toSchema(),this.privateKey];if("attributes"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.attributes,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){ if("parsedKey"in this===false){const object={version:this.version,privateKeyAlgorithm:this.privateKeyAlgorithm.toJSON(),privateKey:this.privateKey.toJSON()};if("attributes"in this)object.attributes=Array.from(this.attributes,element=>element.toJSON());return object;}
 
const jwk={};switch(this.privateKeyAlgorithm.algorithmId){case"1.2.840.10045.2.1": jwk.kty="EC";break;case"1.2.840.113549.1.1.1": jwk.kty="RSA";break;default:}
const publicKeyJWK=this.parsedKey.toJSON();for(var _i=0,_Object$keys=Object.keys(publicKeyJWK);_i<_Object$keys.length;_i++){const key=_Object$keys[_i];jwk[key]=publicKeyJWK[key];}
return jwk;}
fromJSON(json){if("kty"in json){switch(json.kty.toUpperCase()){case"EC":this.parsedKey=new _ECPrivateKey.default({json});this.privateKeyAlgorithm=new _AlgorithmIdentifier.default({algorithmId:"1.2.840.10045.2.1",algorithmParams:new asn1js.ObjectIdentifier({value:this.parsedKey.namedCurve})});break;case"RSA":this.parsedKey=new _RSAPrivateKey.default({json});this.privateKeyAlgorithm=new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.1",algorithmParams:new asn1js.Null()});break;default:throw new Error(`Invalid value for "kty" parameter: ${json.kty}`);}
this.privateKey=new asn1js.OctetString({valueHex:this.parsedKey.toSchema().toBER(false)});}}
}
exports.default=PrivateKeyInfo;},{"./AlgorithmIdentifier.js":4,"./Attribute.js":6,"./ECPrivateKey.js":31,"./RSAPrivateKey.js":81,"asn1js":112,"pvutils":113}],77:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PrivateKeyUsagePeriod{constructor(parameters={}){ if("notBefore"in parameters)
this.notBefore=(0,_pvutils.getParametersValue)(parameters,"notBefore",PrivateKeyUsagePeriod.defaultValues("notBefore"));if("notAfter"in parameters)
this.notAfter=(0,_pvutils.getParametersValue)(parameters,"notAfter",PrivateKeyUsagePeriod.defaultValues("notAfter"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"notBefore":return new Date();case"notAfter":return new Date();default:throw new Error(`Invalid member name for PrivateKeyUsagePeriod class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Primitive({name:names.notBefore||"",optional:true,idBlock:{tagClass:3, tagNumber:0
}}),new asn1js.Primitive({name:names.notAfter||"",optional:true,idBlock:{tagClass:3, tagNumber:1
}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["notBefore","notAfter"]);
 const asn1=asn1js.compareSchema(schema,schema,PrivateKeyUsagePeriod.schema({names:{notBefore:"notBefore",notAfter:"notAfter"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PrivateKeyUsagePeriod");
 if("notBefore"in asn1.result){const localNotBefore=new asn1js.GeneralizedTime();localNotBefore.fromBuffer(asn1.result.notBefore.valueBlock.valueHex);this.notBefore=localNotBefore.toDate();}
if("notAfter"in asn1.result){const localNotAfter=new asn1js.GeneralizedTime({valueHex:asn1.result.notAfter.valueBlock.valueHex});localNotAfter.fromBuffer(asn1.result.notAfter.valueBlock.valueHex);this.notAfter=localNotAfter.toDate();}
}
toSchema(){ const outputArray=[];if("notBefore"in this){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:0
},valueHex:new asn1js.GeneralizedTime({valueDate:this.notBefore}).valueBlock.valueHex}));}
if("notAfter"in this){outputArray.push(new asn1js.Primitive({idBlock:{tagClass:3, tagNumber:1
},valueHex:new asn1js.GeneralizedTime({valueDate:this.notAfter}).valueBlock.valueHex}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if("notBefore"in this)object.notBefore=this.notBefore;if("notAfter"in this)object.notAfter=this.notAfter;return object;}
}
exports.default=PrivateKeyUsagePeriod;},{"asn1js":112,"pvutils":113}],78:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _ECPublicKey=_interopRequireDefault(require("./ECPublicKey.js"));var _RSAPublicKey=_interopRequireDefault(require("./RSAPublicKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class PublicKeyInfo{constructor(parameters={}){ this.algorithm=(0,_pvutils.getParametersValue)(parameters,"algorithm",PublicKeyInfo.defaultValues("algorithm"));this.subjectPublicKey=(0,_pvutils.getParametersValue)(parameters,"subjectPublicKey",PublicKeyInfo.defaultValues("subjectPublicKey"));if("parsedKey"in parameters)
this.parsedKey=(0,_pvutils.getParametersValue)(parameters,"parsedKey",PublicKeyInfo.defaultValues("parsedKey"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"algorithm":return new _AlgorithmIdentifier.default();case"subjectPublicKey":return new asn1js.BitString();default:throw new Error(`Invalid member name for PublicKeyInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.algorithm||{}),new asn1js.BitString({name:names.subjectPublicKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["algorithm","subjectPublicKey"]);
 const asn1=asn1js.compareSchema(schema,schema,PublicKeyInfo.schema({names:{algorithm:{names:{blockName:"algorithm"}},subjectPublicKey:"subjectPublicKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for PublicKeyInfo");
 this.algorithm=new _AlgorithmIdentifier.default({schema:asn1.result.algorithm});this.subjectPublicKey=asn1.result.subjectPublicKey;switch(this.algorithm.algorithmId){case"1.2.840.10045.2.1": if("algorithmParams"in this.algorithm){if(this.algorithm.algorithmParams.constructor.blockName()===asn1js.ObjectIdentifier.blockName()){try{this.parsedKey=new _ECPublicKey.default({namedCurve:this.algorithm.algorithmParams.valueBlock.toString(),schema:this.subjectPublicKey.valueBlock.valueHex});}catch(ex){}
}}
break;case"1.2.840.113549.1.1.1":{const publicKeyASN1=asn1js.fromBER(this.subjectPublicKey.valueBlock.valueHex);if(publicKeyASN1.offset!==-1){try{this.parsedKey=new _RSAPublicKey.default({schema:publicKeyASN1.result});}catch(ex){}
}}
break;default:}
}
toSchema(){ return new asn1js.Sequence({value:[this.algorithm.toSchema(),this.subjectPublicKey]});}
toJSON(){ if("parsedKey"in this===false){return{algorithm:this.algorithm.toJSON(),subjectPublicKey:this.subjectPublicKey.toJSON()};}
 
const jwk={};switch(this.algorithm.algorithmId){case"1.2.840.10045.2.1": jwk.kty="EC";break;case"1.2.840.113549.1.1.1": jwk.kty="RSA";break;default:}
const publicKeyJWK=this.parsedKey.toJSON();for(var _i=0,_Object$keys=Object.keys(publicKeyJWK);_i<_Object$keys.length;_i++){const key=_Object$keys[_i];jwk[key]=publicKeyJWK[key];}
return jwk;}
fromJSON(json){if("kty"in json){switch(json.kty.toUpperCase()){case"EC":this.parsedKey=new _ECPublicKey.default({json});this.algorithm=new _AlgorithmIdentifier.default({algorithmId:"1.2.840.10045.2.1",algorithmParams:new asn1js.ObjectIdentifier({value:this.parsedKey.namedCurve})});break;case"RSA":this.parsedKey=new _RSAPublicKey.default({json});this.algorithm=new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.1",algorithmParams:new asn1js.Null()});break;default:throw new Error(`Invalid value for "kty" parameter: ${json.kty}`);}
this.subjectPublicKey=new asn1js.BitString({valueHex:this.parsedKey.toSchema().toBER(false)});}}
importKey(publicKey){ let sequence=Promise.resolve();const _this=this;
 if(typeof publicKey==="undefined")return Promise.reject("Need to provide publicKey input parameter");
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 sequence=sequence.then(()=>crypto.exportKey("spki",publicKey));
 sequence=sequence.then(exportedKey=>{const asn1=asn1js.fromBER(exportedKey);try{_this.fromSchema(asn1.result);}catch(exception){return Promise.reject("Error during initializing object from schema");}
return undefined;},error=>Promise.reject(`Error during exporting public key: ${error}`)); return sequence;}
}
exports.default=PublicKeyInfo;},{"./AlgorithmIdentifier.js":4,"./ECPublicKey.js":32,"./RSAPublicKey.js":82,"./common.js":110,"asn1js":112,"pvutils":113}],79:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.QCStatement=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class QCStatement{constructor(parameters={}){ this.id=(0,_pvutils.getParametersValue)(parameters,"id",QCStatement.defaultValues("id"));if("type"in parameters){this.type=(0,_pvutils.getParametersValue)(parameters,"type",QCStatement.defaultValues("type"));}
 
if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"id":return"";case"type":return new asn1js.Null();default:throw new Error(`Invalid member name for QCStatement class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"id":return memberValue==="";case"type":return memberValue instanceof asn1js.Null;default:throw new Error(`Invalid member name for QCStatement class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.id||""}),new asn1js.Any({name:names.type||"",optional:true})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["id","type"]);
 const asn1=asn1js.compareSchema(schema,schema,QCStatement.schema({names:{id:"id",type:"type"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for QCStatement");
 this.id=asn1.result.id.valueBlock.toString();if("type"in asn1.result)this.type=asn1.result.type;}
toSchema(){const value=[new asn1js.ObjectIdentifier({value:this.id})];if("type"in this)value.push(this.type); return new asn1js.Sequence({value});}
toJSON(){const object={id:this.id};if("type"in this)object.type=this.type.toJSON();return object;}
}
exports.QCStatement=QCStatement;class QCStatements{constructor(parameters={}){ this.values=(0,_pvutils.getParametersValue)(parameters,"values",QCStatements.defaultValues("values"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"values":return[];default:throw new Error(`Invalid member name for QCStatements class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"values":return memberValue.length===0;default:throw new Error(`Invalid member name for QCStatements class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.values||"",value:QCStatement.schema(names.value||{})})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["values"]);
 const asn1=asn1js.compareSchema(schema,schema,QCStatements.schema({names:{values:"values"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for QCStatements");
 this.values=Array.from(asn1.result.values,element=>new QCStatement({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.values,element=>element.toSchema())});}
toJSON(){return{extensions:Array.from(this.values,element=>element.toJSON())};}
}
exports.default=QCStatements;},{"asn1js":112,"pvutils":113}],80:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RSAESOAEPParams{constructor(parameters={}){ this.hashAlgorithm=(0,_pvutils.getParametersValue)(parameters,"hashAlgorithm",RSAESOAEPParams.defaultValues("hashAlgorithm"));this.maskGenAlgorithm=(0,_pvutils.getParametersValue)(parameters,"maskGenAlgorithm",RSAESOAEPParams.defaultValues("maskGenAlgorithm"));this.pSourceAlgorithm=(0,_pvutils.getParametersValue)(parameters,"pSourceAlgorithm",RSAESOAEPParams.defaultValues("pSourceAlgorithm"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"hashAlgorithm":return new _AlgorithmIdentifier.default({algorithmId:"1.3.14.3.2.26", algorithmParams:new asn1js.Null()});case"maskGenAlgorithm":return new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.8", algorithmParams:new _AlgorithmIdentifier.default({algorithmId:"1.3.14.3.2.26", algorithmParams:new asn1js.Null()}).toSchema()});case"pSourceAlgorithm":return new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.9", algorithmParams:new asn1js.OctetString({valueHex:new Uint8Array([0xda,0x39,0xa3,0xee,0x5e,0x6b,0x4b,0x0d,0x32,0x55,0xbf,0xef,0x95,0x60,0x18,0x90,0xaf,0xd8,0x07,0x09]).buffer})
});default:throw new Error(`Invalid member name for RSAESOAEPParams class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},optional:true,value:[_AlgorithmIdentifier.default.schema(names.hashAlgorithm||{})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},optional:true,value:[_AlgorithmIdentifier.default.schema(names.maskGenAlgorithm||{})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},optional:true,value:[_AlgorithmIdentifier.default.schema(names.pSourceAlgorithm||{})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["hashAlgorithm","maskGenAlgorithm","pSourceAlgorithm"]);
 const asn1=asn1js.compareSchema(schema,schema,RSAESOAEPParams.schema({names:{hashAlgorithm:{names:{blockName:"hashAlgorithm"}},maskGenAlgorithm:{names:{blockName:"maskGenAlgorithm"}},pSourceAlgorithm:{names:{blockName:"pSourceAlgorithm"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RSAESOAEPParams");
 if("hashAlgorithm"in asn1.result)this.hashAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.hashAlgorithm});if("maskGenAlgorithm"in asn1.result)this.maskGenAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.maskGenAlgorithm});if("pSourceAlgorithm"in asn1.result)this.pSourceAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.pSourceAlgorithm});}
toSchema(){ const outputArray=[];if(!this.hashAlgorithm.isEqual(RSAESOAEPParams.defaultValues("hashAlgorithm"))){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.hashAlgorithm.toSchema()]}));}
if(!this.maskGenAlgorithm.isEqual(RSAESOAEPParams.defaultValues("maskGenAlgorithm"))){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[this.maskGenAlgorithm.toSchema()]}));}
if(!this.pSourceAlgorithm.isEqual(RSAESOAEPParams.defaultValues("pSourceAlgorithm"))){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:[this.pSourceAlgorithm.toSchema()]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if(!this.hashAlgorithm.isEqual(RSAESOAEPParams.defaultValues("hashAlgorithm")))object.hashAlgorithm=this.hashAlgorithm.toJSON();if(!this.maskGenAlgorithm.isEqual(RSAESOAEPParams.defaultValues("maskGenAlgorithm")))object.maskGenAlgorithm=this.maskGenAlgorithm.toJSON();if(!this.pSourceAlgorithm.isEqual(RSAESOAEPParams.defaultValues("pSourceAlgorithm")))object.pSourceAlgorithm=this.pSourceAlgorithm.toJSON();return object;}
}
exports.default=RSAESOAEPParams;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],81:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _OtherPrimeInfo=_interopRequireDefault(require("./OtherPrimeInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RSAPrivateKey{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",RSAPrivateKey.defaultValues("version"));this.modulus=(0,_pvutils.getParametersValue)(parameters,"modulus",RSAPrivateKey.defaultValues("modulus"));this.publicExponent=(0,_pvutils.getParametersValue)(parameters,"publicExponent",RSAPrivateKey.defaultValues("publicExponent"));this.privateExponent=(0,_pvutils.getParametersValue)(parameters,"privateExponent",RSAPrivateKey.defaultValues("privateExponent"));this.prime1=(0,_pvutils.getParametersValue)(parameters,"prime1",RSAPrivateKey.defaultValues("prime1"));this.prime2=(0,_pvutils.getParametersValue)(parameters,"prime2",RSAPrivateKey.defaultValues("prime2"));this.exponent1=(0,_pvutils.getParametersValue)(parameters,"exponent1",RSAPrivateKey.defaultValues("exponent1"));this.exponent2=(0,_pvutils.getParametersValue)(parameters,"exponent2",RSAPrivateKey.defaultValues("exponent2"));this.coefficient=(0,_pvutils.getParametersValue)(parameters,"coefficient",RSAPrivateKey.defaultValues("coefficient"));if("otherPrimeInfos"in parameters)
this.otherPrimeInfos=(0,_pvutils.getParametersValue)(parameters,"otherPrimeInfos",RSAPrivateKey.defaultValues("otherPrimeInfos"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"modulus":return new asn1js.Integer();case"publicExponent":return new asn1js.Integer();case"privateExponent":return new asn1js.Integer();case"prime1":return new asn1js.Integer();case"prime2":return new asn1js.Integer();case"exponent1":return new asn1js.Integer();case"exponent2":return new asn1js.Integer();case"coefficient":return new asn1js.Integer();case"otherPrimeInfos":return[];default:throw new Error(`Invalid member name for RSAPrivateKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.version||""}),new asn1js.Integer({name:names.modulus||""}),new asn1js.Integer({name:names.publicExponent||""}),new asn1js.Integer({name:names.privateExponent||""}),new asn1js.Integer({name:names.prime1||""}),new asn1js.Integer({name:names.prime2||""}),new asn1js.Integer({name:names.exponent1||""}),new asn1js.Integer({name:names.exponent2||""}),new asn1js.Integer({name:names.coefficient||""}),new asn1js.Sequence({optional:true,value:[new asn1js.Repeated({name:names.otherPrimeInfosName||"",value:_OtherPrimeInfo.default.schema(names.otherPrimeInfo||{})})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["version","modulus","publicExponent","privateExponent","prime1","prime2","exponent1","exponent2","coefficient","otherPrimeInfos"]);
 const asn1=asn1js.compareSchema(schema,schema,RSAPrivateKey.schema({names:{version:"version",modulus:"modulus",publicExponent:"publicExponent",privateExponent:"privateExponent",prime1:"prime1",prime2:"prime2",exponent1:"exponent1",exponent2:"exponent2",coefficient:"coefficient",otherPrimeInfo:{names:{blockName:"otherPrimeInfos"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RSAPrivateKey");
 this.version=asn1.result.version.valueBlock.valueDec;this.modulus=asn1.result.modulus.convertFromDER(256);this.publicExponent=asn1.result.publicExponent;this.privateExponent=asn1.result.privateExponent.convertFromDER(256);this.prime1=asn1.result.prime1.convertFromDER(128);this.prime2=asn1.result.prime2.convertFromDER(128);this.exponent1=asn1.result.exponent1.convertFromDER(128);this.exponent2=asn1.result.exponent2.convertFromDER(128);this.coefficient=asn1.result.coefficient.convertFromDER(128);if("otherPrimeInfos"in asn1.result)this.otherPrimeInfos=Array.from(asn1.result.otherPrimeInfos,element=>new _OtherPrimeInfo.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(this.modulus.convertToDER());outputArray.push(this.publicExponent);outputArray.push(this.privateExponent.convertToDER());outputArray.push(this.prime1.convertToDER());outputArray.push(this.prime2.convertToDER());outputArray.push(this.exponent1.convertToDER());outputArray.push(this.exponent2.convertToDER());outputArray.push(this.coefficient.convertToDER());if("otherPrimeInfos"in this){outputArray.push(new asn1js.Sequence({value:Array.from(this.otherPrimeInfos,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const jwk={n:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.modulus.valueBlock.valueHex),true,true,true),e:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.publicExponent.valueBlock.valueHex),true,true,true),d:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.privateExponent.valueBlock.valueHex),true,true,true),p:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.prime1.valueBlock.valueHex),true,true,true),q:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.prime2.valueBlock.valueHex),true,true,true),dp:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.exponent1.valueBlock.valueHex),true,true,true),dq:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.exponent2.valueBlock.valueHex),true,true,true),qi:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.coefficient.valueBlock.valueHex),true,true,true)};if("otherPrimeInfos"in this)jwk.oth=Array.from(this.otherPrimeInfos,element=>element.toJSON());return jwk;}
fromJSON(json){if("n"in json)this.modulus=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.n,true,true))});else throw new Error("Absent mandatory parameter \"n\"");if("e"in json)this.publicExponent=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.e,true,true))});else throw new Error("Absent mandatory parameter \"e\"");if("d"in json)this.privateExponent=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.d,true,true))});else throw new Error("Absent mandatory parameter \"d\"");if("p"in json)this.prime1=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.p,true,true))});else throw new Error("Absent mandatory parameter \"p\"");if("q"in json)this.prime2=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.q,true,true))});else throw new Error("Absent mandatory parameter \"q\"");if("dp"in json)this.exponent1=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.dp,true,true))});else throw new Error("Absent mandatory parameter \"dp\"");if("dq"in json)this.exponent2=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.dq,true,true))});else throw new Error("Absent mandatory parameter \"dq\"");if("qi"in json)this.coefficient=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.qi,true,true))});else throw new Error("Absent mandatory parameter \"qi\"");if("oth"in json)this.otherPrimeInfos=Array.from(json.oth,element=>new _OtherPrimeInfo.default({json:element}));}
}
exports.default=RSAPrivateKey;},{"./OtherPrimeInfo.js":62,"asn1js":112,"pvutils":113}],82:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RSAPublicKey{constructor(parameters={}){ this.modulus=(0,_pvutils.getParametersValue)(parameters,"modulus",RSAPublicKey.defaultValues("modulus"));this.publicExponent=(0,_pvutils.getParametersValue)(parameters,"publicExponent",RSAPublicKey.defaultValues("publicExponent"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
 if("json"in parameters)this.fromJSON(parameters.json);}
static defaultValues(memberName){switch(memberName){case"modulus":return new asn1js.Integer();case"publicExponent":return new asn1js.Integer();default:throw new Error(`Invalid member name for RSAPublicKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.modulus||""}),new asn1js.Integer({name:names.publicExponent||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["modulus","publicExponent"]);
 const asn1=asn1js.compareSchema(schema,schema,RSAPublicKey.schema({names:{modulus:"modulus",publicExponent:"publicExponent"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RSAPublicKey");
 this.modulus=asn1.result.modulus.convertFromDER(256);this.publicExponent=asn1.result.publicExponent;}
toSchema(){ return new asn1js.Sequence({value:[this.modulus.convertToDER(),this.publicExponent]});}
toJSON(){return{n:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.modulus.valueBlock.valueHex),true,true,true),e:(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(this.publicExponent.valueBlock.valueHex),true,true,true)};}
fromJSON(json){if("n"in json){const array=(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.n,true));this.modulus=new asn1js.Integer({valueHex:array.slice(0,Math.pow(2,(0,_pvutils.nearestPowerOf2)(array.byteLength)))});}else throw new Error("Absent mandatory parameter \"n\"");if("e"in json)this.publicExponent=new asn1js.Integer({valueHex:(0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(json.e,true)).slice(0,3)});else throw new Error("Absent mandatory parameter \"e\"");}
}
exports.default=RSAPublicKey;},{"asn1js":112,"pvutils":113}],83:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RSASSAPSSParams{constructor(parameters={}){ this.hashAlgorithm=(0,_pvutils.getParametersValue)(parameters,"hashAlgorithm",RSASSAPSSParams.defaultValues("hashAlgorithm"));this.maskGenAlgorithm=(0,_pvutils.getParametersValue)(parameters,"maskGenAlgorithm",RSASSAPSSParams.defaultValues("maskGenAlgorithm"));this.saltLength=(0,_pvutils.getParametersValue)(parameters,"saltLength",RSASSAPSSParams.defaultValues("saltLength"));this.trailerField=(0,_pvutils.getParametersValue)(parameters,"trailerField",RSASSAPSSParams.defaultValues("trailerField"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"hashAlgorithm":return new _AlgorithmIdentifier.default({algorithmId:"1.3.14.3.2.26", algorithmParams:new asn1js.Null()});case"maskGenAlgorithm":return new _AlgorithmIdentifier.default({algorithmId:"1.2.840.113549.1.1.8", algorithmParams:new _AlgorithmIdentifier.default({algorithmId:"1.3.14.3.2.26", algorithmParams:new asn1js.Null()}).toSchema()});case"saltLength":return 20;case"trailerField":return 1;default:throw new Error(`Invalid member name for RSASSAPSSParams class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},optional:true,value:[_AlgorithmIdentifier.default.schema(names.hashAlgorithm||{})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},optional:true,value:[_AlgorithmIdentifier.default.schema(names.maskGenAlgorithm||{})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},optional:true,value:[new asn1js.Integer({name:names.saltLength||""})]}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:3
},optional:true,value:[new asn1js.Integer({name:names.trailerField||""})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["hashAlgorithm","maskGenAlgorithm","saltLength","trailerField"]);
 const asn1=asn1js.compareSchema(schema,schema,RSASSAPSSParams.schema({names:{hashAlgorithm:{names:{blockName:"hashAlgorithm"}},maskGenAlgorithm:{names:{blockName:"maskGenAlgorithm"}},saltLength:"saltLength",trailerField:"trailerField"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RSASSAPSSParams");
 if("hashAlgorithm"in asn1.result)this.hashAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.hashAlgorithm});if("maskGenAlgorithm"in asn1.result)this.maskGenAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.maskGenAlgorithm});if("saltLength"in asn1.result)this.saltLength=asn1.result.saltLength.valueBlock.valueDec;if("trailerField"in asn1.result)this.trailerField=asn1.result.trailerField.valueBlock.valueDec;}
toSchema(){ const outputArray=[];if(!this.hashAlgorithm.isEqual(RSASSAPSSParams.defaultValues("hashAlgorithm"))){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.hashAlgorithm.toSchema()]}));}
if(!this.maskGenAlgorithm.isEqual(RSASSAPSSParams.defaultValues("maskGenAlgorithm"))){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[this.maskGenAlgorithm.toSchema()]}));}
if(this.saltLength!==RSASSAPSSParams.defaultValues("saltLength")){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:[new asn1js.Integer({value:this.saltLength})]}));}
if(this.trailerField!==RSASSAPSSParams.defaultValues("trailerField")){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:3
},value:[new asn1js.Integer({value:this.trailerField})]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={};if(!this.hashAlgorithm.isEqual(RSASSAPSSParams.defaultValues("hashAlgorithm")))object.hashAlgorithm=this.hashAlgorithm.toJSON();if(!this.maskGenAlgorithm.isEqual(RSASSAPSSParams.defaultValues("maskGenAlgorithm")))object.maskGenAlgorithm=this.maskGenAlgorithm.toJSON();if(this.saltLength!==RSASSAPSSParams.defaultValues("saltLength"))object.saltLength=this.saltLength;if(this.trailerField!==RSASSAPSSParams.defaultValues("trailerField"))object.trailerField=this.trailerField;return object;}
}
exports.default=RSASSAPSSParams;},{"./AlgorithmIdentifier.js":4,"asn1js":112,"pvutils":113}],84:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _KeyAgreeRecipientIdentifier=_interopRequireDefault(require("./KeyAgreeRecipientIdentifier.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RecipientEncryptedKey{constructor(parameters={}){ this.rid=(0,_pvutils.getParametersValue)(parameters,"rid",RecipientEncryptedKey.defaultValues("rid"));this.encryptedKey=(0,_pvutils.getParametersValue)(parameters,"encryptedKey",RecipientEncryptedKey.defaultValues("encryptedKey"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"rid":return new _KeyAgreeRecipientIdentifier.default();case"encryptedKey":return new asn1js.OctetString();default:throw new Error(`Invalid member name for RecipientEncryptedKey class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"rid":return memberValue.variant===-1&&"value"in memberValue===false;case"encryptedKey":return memberValue.isEqual(RecipientEncryptedKey.defaultValues("encryptedKey"));default:throw new Error(`Invalid member name for RecipientEncryptedKey class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_KeyAgreeRecipientIdentifier.default.schema(names.rid||{}),new asn1js.OctetString({name:names.encryptedKey||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["rid","encryptedKey"]);
 const asn1=asn1js.compareSchema(schema,schema,RecipientEncryptedKey.schema({names:{rid:{names:{blockName:"rid"}},encryptedKey:"encryptedKey"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RecipientEncryptedKey");
 this.rid=new _KeyAgreeRecipientIdentifier.default({schema:asn1.result.rid});this.encryptedKey=asn1.result.encryptedKey;}
toSchema(){ return new asn1js.Sequence({value:[this.rid.toSchema(),this.encryptedKey]});}
toJSON(){return{rid:this.rid.toJSON(),encryptedKey:this.encryptedKey.toJSON()};}
}
exports.default=RecipientEncryptedKey;},{"./KeyAgreeRecipientIdentifier.js":48,"asn1js":112,"pvutils":113}],85:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _RecipientEncryptedKey=_interopRequireDefault(require("./RecipientEncryptedKey.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RecipientEncryptedKeys{constructor(parameters={}){ this.encryptedKeys=(0,_pvutils.getParametersValue)(parameters,"encryptedKeys",RecipientEncryptedKeys.defaultValues("encryptedKeys"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"encryptedKeys":return[];default:throw new Error(`Invalid member name for RecipientEncryptedKeys class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"encryptedKeys":return memberValue.length===0;default:throw new Error(`Invalid member name for RecipientEncryptedKeys class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.RecipientEncryptedKeys||"",value:_RecipientEncryptedKey.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["RecipientEncryptedKeys"]);
 const asn1=asn1js.compareSchema(schema,schema,RecipientEncryptedKeys.schema({names:{RecipientEncryptedKeys:"RecipientEncryptedKeys"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RecipientEncryptedKeys");
 this.encryptedKeys=Array.from(asn1.result.RecipientEncryptedKeys,element=>new _RecipientEncryptedKey.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.encryptedKeys,element=>element.toSchema())});}
toJSON(){return{encryptedKeys:Array.from(this.encryptedKeys,element=>element.toJSON())};}
}
exports.default=RecipientEncryptedKeys;},{"./RecipientEncryptedKey.js":84,"asn1js":112,"pvutils":113}],86:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RecipientIdentifier{constructor(parameters={}){ this.variant=(0,_pvutils.getParametersValue)(parameters,"variant",RecipientIdentifier.defaultValues("variant"));if("value"in parameters)
this.value=(0,_pvutils.getParametersValue)(parameters,"value",RecipientIdentifier.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"variant":return-1;case"value":return{};default:throw new Error(`Invalid member name for RecipientIdentifier class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"variant":return memberValue===-1;case"values":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for RecipientIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({value:[_IssuerAndSerialNumber.default.schema({names:{blockName:names.blockName||""}}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.OctetString()]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["blockName"]);
 const asn1=asn1js.compareSchema(schema,schema,RecipientIdentifier.schema({names:{blockName:"blockName"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RecipientIdentifier");
 if(asn1.result.blockName.idBlock.tagClass===1){this.variant=1;this.value=new _IssuerAndSerialNumber.default({schema:asn1.result.blockName});}else{this.variant=2;this.value=asn1.result.blockName.valueBlock.value[0];}
}
toSchema(){ switch(this.variant){case 1:return this.value.toSchema();case 2:return new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.value]});default:return new asn1js.Any();}
}
toJSON(){const _object={variant:this.variant};if(this.variant===1||this.variant===2)_object.value=this.value.toJSON();return _object;}
}
exports.default=RecipientIdentifier;},{"./IssuerAndSerialNumber.js":44,"asn1js":112,"pvutils":113}],87:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _KeyTransRecipientInfo=_interopRequireDefault(require("./KeyTransRecipientInfo.js"));var _KeyAgreeRecipientInfo=_interopRequireDefault(require("./KeyAgreeRecipientInfo.js"));var _KEKRecipientInfo=_interopRequireDefault(require("./KEKRecipientInfo.js"));var _PasswordRecipientinfo=_interopRequireDefault(require("./PasswordRecipientinfo.js"));var _OtherRecipientInfo=_interopRequireDefault(require("./OtherRecipientInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RecipientInfo{constructor(parameters={}){ this.variant=(0,_pvutils.getParametersValue)(parameters,"variant",RecipientInfo.defaultValues("variant"));if("value"in parameters)
this.value=(0,_pvutils.getParametersValue)(parameters,"value",RecipientInfo.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"variant":return-1;case"value":return{};default:throw new Error(`Invalid member name for RecipientInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"variant":return memberValue===RecipientInfo.defaultValues(memberName);case"value":return Object.keys(memberValue).length===0;default:throw new Error(`Invalid member name for RecipientInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({value:[_KeyTransRecipientInfo.default.schema({names:{blockName:names.blockName||""}}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:1
},value:_KeyAgreeRecipientInfo.default.schema().valueBlock.value}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:2
},value:_KEKRecipientInfo.default.schema().valueBlock.value}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:3
},value:_PasswordRecipientinfo.default.schema().valueBlock.value}),new asn1js.Constructed({name:names.blockName||"",idBlock:{tagClass:3, tagNumber:4
},value:_OtherRecipientInfo.default.schema().valueBlock.value})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["blockName"]);
 const asn1=asn1js.compareSchema(schema,schema,RecipientInfo.schema({names:{blockName:"blockName"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RecipientInfo");
 if(asn1.result.blockName.idBlock.tagClass===1){this.variant=1;this.value=new _KeyTransRecipientInfo.default({schema:asn1.result.blockName});}else{const blockSequence=new asn1js.Sequence({value:asn1.result.blockName.valueBlock.value}); switch(asn1.result.blockName.idBlock.tagNumber){case 1:this.variant=2;this.value=new _KeyAgreeRecipientInfo.default({schema:blockSequence});break;case 2:this.variant=3;this.value=new _KEKRecipientInfo.default({schema:blockSequence});break;case 3:this.variant=4;this.value=new _PasswordRecipientinfo.default({schema:blockSequence});break;case 4:this.variant=5;this.value=new _OtherRecipientInfo.default({schema:blockSequence});break;default:throw new Error("Incorrect structure of RecipientInfo block");}}
}
toSchema(){ const _schema=this.value.toSchema();switch(this.variant){case 1:return _schema;case 2:case 3:case 4:_schema.idBlock.tagClass=3; _schema.idBlock.tagNumber=this.variant-1; return _schema;default:return new asn1js.Any();}
}
toJSON(){const _object={variant:this.variant};if(this.variant>=1&&this.variant<=4)_object.value=this.value.toJSON();return _object;}
}
exports.default=RecipientInfo;},{"./KEKRecipientInfo.js":47,"./KeyAgreeRecipientInfo.js":49,"./KeyTransRecipientInfo.js":51,"./OtherRecipientInfo.js":63,"./PasswordRecipientinfo.js":70,"asn1js":112,"pvutils":113}],88:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _OtherKeyAttribute=_interopRequireDefault(require("./OtherKeyAttribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RecipientKeyIdentifier{constructor(parameters={}){ this.subjectKeyIdentifier=(0,_pvutils.getParametersValue)(parameters,"subjectKeyIdentifier",RecipientKeyIdentifier.defaultValues("subjectKeyIdentifier"));if("date"in parameters)
this.date=(0,_pvutils.getParametersValue)(parameters,"date",RecipientKeyIdentifier.defaultValues("date"));if("other"in parameters)
this.other=(0,_pvutils.getParametersValue)(parameters,"other",RecipientKeyIdentifier.defaultValues("other"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"subjectKeyIdentifier":return new asn1js.OctetString();case"date":return new asn1js.GeneralizedTime();case"other":return new _OtherKeyAttribute.default();default:throw new Error(`Invalid member name for RecipientKeyIdentifier class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"subjectKeyIdentifier":return memberValue.isEqual(RecipientKeyIdentifier.defaultValues("subjectKeyIdentifier"));case"date": return memberValue.year===0&&memberValue.month===0&&memberValue.day===0&&memberValue.hour===0&&memberValue.minute===0&&memberValue.second===0&&memberValue.millisecond===0;case"other":return memberValue.keyAttrId===""&&"keyAttr"in memberValue===false;default:throw new Error(`Invalid member name for RecipientKeyIdentifier class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.OctetString({name:names.subjectKeyIdentifier||""}),new asn1js.GeneralizedTime({optional:true,name:names.date||""}),_OtherKeyAttribute.default.schema(names.other||{})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["subjectKeyIdentifier","date","other"]);
 const asn1=asn1js.compareSchema(schema,schema,RecipientKeyIdentifier.schema({names:{subjectKeyIdentifier:"subjectKeyIdentifier",date:"date",other:{names:{blockName:"other"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RecipientKeyIdentifier");
 this.subjectKeyIdentifier=asn1.result.subjectKeyIdentifier;if("date"in asn1.result)this.date=asn1.result.date;if("other"in asn1.result)this.other=new _OtherKeyAttribute.default({schema:asn1.result.other});}
toSchema(){ const outputArray=[];outputArray.push(this.subjectKeyIdentifier);if("date"in this)outputArray.push(this.date);if("other"in this)outputArray.push(this.other.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={subjectKeyIdentifier:this.subjectKeyIdentifier.toJSON()};if("date"in this)_object.date=this.date;if("other"in this)_object.other=this.other.toJSON();return _object;}
}
exports.default=RecipientKeyIdentifier;},{"./OtherKeyAttribute.js":61,"asn1js":112,"pvutils":113}],89:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AttributeTypeAndValue=_interopRequireDefault(require("./AttributeTypeAndValue.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_nonIterableRest();}
function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance");}
function _iterableToArrayLimit(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"]!=null)_i["return"]();}finally{if(_d)throw _e;}}return _arr;}
function _arrayWithHoles(arr){if(Array.isArray(arr))return arr;}
class RelativeDistinguishedNames{constructor(parameters={}){ this.typesAndValues=(0,_pvutils.getParametersValue)(parameters,"typesAndValues",RelativeDistinguishedNames.defaultValues("typesAndValues"));this.valueBeforeDecode=(0,_pvutils.getParametersValue)(parameters,"valueBeforeDecode",RelativeDistinguishedNames.defaultValues("valueBeforeDecode"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"typesAndValues":return[];case"valueBeforeDecode":return new ArrayBuffer(0);default:throw new Error(`Invalid member name for RelativeDistinguishedNames class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"typesAndValues":return memberValue.length===0;case"valueBeforeDecode":return memberValue.byteLength===0;default:throw new Error(`Invalid member name for RelativeDistinguishedNames class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.repeatedSequence||"",value:new asn1js.Set({value:[new asn1js.Repeated({name:names.repeatedSet||"",value:_AttributeTypeAndValue.default.schema(names.typeAndValue||{})})]})})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["RDN","typesAndValues"]);
 const asn1=asn1js.compareSchema(schema,schema,RelativeDistinguishedNames.schema({names:{blockName:"RDN",repeatedSet:"typesAndValues"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RelativeDistinguishedNames");
 if("typesAndValues"in asn1.result)
this.typesAndValues=Array.from(asn1.result.typesAndValues,element=>new _AttributeTypeAndValue.default({schema:element})); this.valueBeforeDecode=asn1.result.RDN.valueBeforeDecode;}
toSchema(){ if(this.valueBeforeDecode.byteLength===0)
{return new asn1js.Sequence({value:[new asn1js.Set({value:Array.from(this.typesAndValues,element=>element.toSchema())})]});}
const asn1=asn1js.fromBER(this.valueBeforeDecode);
 return asn1.result;}
toJSON(){return{typesAndValues:Array.from(this.typesAndValues,element=>element.toJSON())};}
isEqual(compareTo){if(compareTo instanceof RelativeDistinguishedNames){if(this.typesAndValues.length!==compareTo.typesAndValues.length)return false;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.typesAndValues.entries()[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const _step$value=_slicedToArray(_step.value,2),index=_step$value[0],typeAndValue=_step$value[1];if(typeAndValue.isEqual(compareTo.typesAndValues[index])===false)return false;}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
return true;}
if(compareTo instanceof ArrayBuffer)return(0,_pvutils.isEqualBuffer)(this.valueBeforeDecode,compareTo);return false;}
}
exports.default=RelativeDistinguishedNames;},{"./AttributeTypeAndValue.js":9,"asn1js":112,"pvutils":113}],90:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CertID=_interopRequireDefault(require("./CertID.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Request{constructor(parameters={}){ this.reqCert=(0,_pvutils.getParametersValue)(parameters,"reqCert",Request.defaultValues("reqCert"));if("singleRequestExtensions"in parameters)
this.singleRequestExtensions=(0,_pvutils.getParametersValue)(parameters,"singleRequestExtensions",Request.defaultValues("singleRequestExtensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"reqCert":return new _CertID.default();case"singleRequestExtensions":return[];default:throw new Error(`Invalid member name for Request class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"reqCert":return memberValue.isEqual(Request.defaultValues(memberName));case"singleRequestExtensions":return memberValue.length===0;default:throw new Error(`Invalid member name for Request class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_CertID.default.schema(names.reqCert||{}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[_Extension.default.schema(names.extensions||{names:{blockName:names.singleRequestExtensions||""}})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["reqCert","singleRequestExtensions"]);
 const asn1=asn1js.compareSchema(schema,schema,Request.schema({names:{reqCert:{names:{blockName:"reqCert"}},singleRequestExtensions:{names:{blockName:"singleRequestExtensions"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Request");
 this.reqCert=new _CertID.default({schema:asn1.result.reqCert});if("singleRequestExtensions"in asn1.result)this.singleRequestExtensions=Array.from(asn1.result.singleRequestExtensions.valueBlock.value,element=>new _Extension.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(this.reqCert.toSchema());if("singleRequestExtensions"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Sequence({value:Array.from(this.singleRequestExtensions,element=>element.toSchema())})]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={reqCert:this.reqCert.toJSON()};if("singleRequestExtensions"in this)_object.singleRequestExtensions=Array.from(this.singleRequestExtensions,element=>element.toJSON());return _object;}
}
exports.default=Request;},{"./CertID.js":18,"./Extension.js":38,"asn1js":112,"pvutils":113}],91:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ResponseBytes{constructor(parameters={}){ this.responseType=(0,_pvutils.getParametersValue)(parameters,"responseType",ResponseBytes.defaultValues("responseType"));this.response=(0,_pvutils.getParametersValue)(parameters,"response",ResponseBytes.defaultValues("response"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"responseType":return"";case"response":return new asn1js.OctetString();default:throw new Error(`Invalid member name for ResponseBytes class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"responseType":return memberValue==="";case"response":return memberValue.isEqual(ResponseBytes.defaultValues(memberName));default:throw new Error(`Invalid member name for ResponseBytes class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.responseType||""}),new asn1js.OctetString({name:names.response||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["responseType","response"]);
 const asn1=asn1js.compareSchema(schema,schema,ResponseBytes.schema({names:{responseType:"responseType",response:"response"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ResponseBytes");
 this.responseType=asn1.result.responseType.valueBlock.toString();this.response=asn1.result.response;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.responseType}),this.response]});}
toJSON(){return{responseType:this.responseType,response:this.response.toJSON()};}
}
exports.default=ResponseBytes;},{"asn1js":112,"pvutils":113}],92:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _SingleResponse=_interopRequireDefault(require("./SingleResponse.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class ResponseData{constructor(parameters={}){ this.tbs=(0,_pvutils.getParametersValue)(parameters,"tbs",ResponseData.defaultValues("tbs"));this.responderID=(0,_pvutils.getParametersValue)(parameters,"responderID",ResponseData.defaultValues("responderID"));this.producedAt=(0,_pvutils.getParametersValue)(parameters,"producedAt",ResponseData.defaultValues("producedAt"));this.responses=(0,_pvutils.getParametersValue)(parameters,"responses",ResponseData.defaultValues("responses"));if("responseExtensions"in parameters)
this.responseExtensions=(0,_pvutils.getParametersValue)(parameters,"responseExtensions",ResponseData.defaultValues("responseExtensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbs":return new ArrayBuffer(0);case"responderID":return{};case"producedAt":return new Date(0,0,0);case"responses":case"responseExtensions":return[];default:throw new Error(`Invalid member name for ResponseData class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"tbs":return memberValue.byteLength===0;case"responderID":return Object.keys(memberValue).length===0;case"producedAt":return memberValue===ResponseData.defaultValues(memberName);case"responses":case"responseExtensions":return memberValue.length===0;default:throw new Error(`Invalid member name for ResponseData class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"ResponseData",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({name:names.version||"ResponseData.version"})]}),new asn1js.Choice({value:[new asn1js.Constructed({name:names.responderID||"ResponseData.responderID",idBlock:{tagClass:3, tagNumber:1
},value:[_RelativeDistinguishedNames.default.schema(names.ResponseDataByName||{names:{blockName:"ResponseData.byName"}})]}),new asn1js.Constructed({name:names.responderID||"ResponseData.responderID",idBlock:{tagClass:3, tagNumber:2
},value:[new asn1js.OctetString({name:names.ResponseDataByKey||"ResponseData.byKey"})]})]}),new asn1js.GeneralizedTime({name:names.producedAt||"ResponseData.producedAt"}),new asn1js.Sequence({value:[new asn1js.Repeated({name:"ResponseData.responses",value:_SingleResponse.default.schema(names.response||{})})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[_Extensions.default.schema(names.extensions||{names:{blockName:"ResponseData.responseExtensions"}})]})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["ResponseData","ResponseData.version","ResponseData.responderID","ResponseData.producedAt","ResponseData.responses","ResponseData.responseExtensions"]);
 const asn1=asn1js.compareSchema(schema,schema,ResponseData.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for ResponseData");
 this.tbs=asn1.result.ResponseData.valueBeforeDecode;if("ResponseData.version"in asn1.result)this.version=asn1.result["ResponseData.version"].valueBlock.valueDec;if(asn1.result["ResponseData.responderID"].idBlock.tagNumber===1)this.responderID=new _RelativeDistinguishedNames.default({schema:asn1.result["ResponseData.responderID"].valueBlock.value[0]});else this.responderID=asn1.result["ResponseData.responderID"].valueBlock.value[0]; this.producedAt=asn1.result["ResponseData.producedAt"].toDate();this.responses=Array.from(asn1.result["ResponseData.responses"],element=>new _SingleResponse.default({schema:element}));if("ResponseData.responseExtensions"in asn1.result)this.responseExtensions=Array.from(asn1.result["ResponseData.responseExtensions"].valueBlock.value,element=>new _Extension.default({schema:element}));}
toSchema(encodeFlag=false){ let tbsSchema;if(encodeFlag===false){if(this.tbs.length===0) 
return ResponseData.schema();tbsSchema=asn1js.fromBER(this.tbs).result;}
 
else{const outputArray=[];if("version"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({value:this.version})]}));}
if(this.responderID instanceof _RelativeDistinguishedNames.default){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[this.responderID.toSchema()]}));}else{outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:[this.responderID]}));}
outputArray.push(new asn1js.GeneralizedTime({valueDate:this.producedAt}));outputArray.push(new asn1js.Sequence({value:Array.from(this.responses,element=>element.toSchema())}));if("responseExtensions"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Sequence({value:Array.from(this.responseExtensions,element=>element.toSchema())})]}));}
tbsSchema=new asn1js.Sequence({value:outputArray});}
 
return tbsSchema;}
toJSON(){const _object={};if("version"in this)_object.version=this.version;if("responderID"in this)_object.responderID=this.responderID;if("producedAt"in this)_object.producedAt=this.producedAt;if("responses"in this)_object.responses=Array.from(this.responses,element=>element.toJSON());if("responseExtensions"in this)_object.responseExtensions=Array.from(this.responseExtensions,element=>element.toJSON());return _object;}
}
exports.default=ResponseData;},{"./Extension.js":38,"./Extensions.js":39,"./RelativeDistinguishedNames.js":89,"./SingleResponse.js":103,"asn1js":112,"pvutils":113}],93:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CertificateRevocationList=_interopRequireDefault(require("./CertificateRevocationList.js"));var _OtherRevocationInfoFormat=_interopRequireDefault(require("./OtherRevocationInfoFormat.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RevocationInfoChoices{constructor(parameters={}){ this.crls=(0,_pvutils.getParametersValue)(parameters,"crls",RevocationInfoChoices.defaultValues("crls"));this.otherRevocationInfos=(0,_pvutils.getParametersValue)(parameters,"otherRevocationInfos",RevocationInfoChoices.defaultValues("otherRevocationInfos"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"crls":return[];case"otherRevocationInfos":return[];default:throw new Error(`Invalid member name for RevocationInfoChoices class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Set({name:names.blockName||"",value:[new asn1js.Repeated({name:names.crls||"",value:new asn1js.Choice({value:[_CertificateRevocationList.default.schema(),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.ObjectIdentifier(),new asn1js.Any()]})]})})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["crls"]);
 const asn1=asn1js.compareSchema(schema,schema,RevocationInfoChoices.schema({names:{crls:"crls"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RevocationInfoChoices");
 var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=asn1.result.crls[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const element=_step.value;if(element.idBlock.tagClass===1)this.crls.push(new _CertificateRevocationList.default({schema:element}));else this.otherRevocationInfos.push(new _OtherRevocationInfoFormat.default({schema:element}));}
}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}}
toSchema(){ const outputArray=[];outputArray.push(...Array.from(this.crls,element=>element.toSchema()));outputArray.push(...Array.from(this.otherRevocationInfos,element=>{const schema=element.toSchema();schema.idBlock.tagClass=3;schema.idBlock.tagNumber=1;return schema;}));
 return new asn1js.Set({value:outputArray});}
toJSON(){return{crls:Array.from(this.crls,element=>element.toJSON()),otherRevocationInfos:Array.from(this.otherRevocationInfos,element=>element.toJSON())};}
}
exports.default=RevocationInfoChoices;},{"./CertificateRevocationList.js":22,"./OtherRevocationInfoFormat.js":64,"asn1js":112,"pvutils":113}],94:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Time=_interopRequireDefault(require("./Time.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class RevokedCertificate{constructor(parameters={}){ this.userCertificate=(0,_pvutils.getParametersValue)(parameters,"userCertificate",RevokedCertificate.defaultValues("userCertificate"));this.revocationDate=(0,_pvutils.getParametersValue)(parameters,"revocationDate",RevokedCertificate.defaultValues("revocationDate"));if("crlEntryExtensions"in parameters)
this.crlEntryExtensions=(0,_pvutils.getParametersValue)(parameters,"crlEntryExtensions",RevokedCertificate.defaultValues("crlEntryExtensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"userCertificate":return new asn1js.Integer();case"revocationDate":return new _Time.default();case"crlEntryExtensions":return new _Extensions.default();default:throw new Error(`Invalid member name for RevokedCertificate class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Integer({name:names.userCertificate||"userCertificate"}),_Time.default.schema({names:{utcTimeName:names.revocationDate||"revocationDate",generalTimeName:names.revocationDate||"revocationDate"}}),_Extensions.default.schema({names:{blockName:names.crlEntryExtensions||"crlEntryExtensions"}},true)]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["userCertificate","revocationDate","crlEntryExtensions"]);
 const asn1=asn1js.compareSchema(schema,schema,RevokedCertificate.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for RevokedCertificate");
 this.userCertificate=asn1.result.userCertificate;this.revocationDate=new _Time.default({schema:asn1.result.revocationDate});if("crlEntryExtensions"in asn1.result)this.crlEntryExtensions=new _Extensions.default({schema:asn1.result.crlEntryExtensions});}
toSchema(){ const outputArray=[this.userCertificate,this.revocationDate.toSchema()];if("crlEntryExtensions"in this)outputArray.push(this.crlEntryExtensions.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const object={userCertificate:this.userCertificate.toJSON(),revocationDate:this.revocationDate.toJSON};if("crlEntryExtensions"in this)object.crlEntryExtensions=this.crlEntryExtensions.toJSON();return object;}
}
exports.default=RevokedCertificate;},{"./Extensions.js":39,"./Time.js":107,"asn1js":112,"pvutils":113}],95:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _PrivateKeyInfo=_interopRequireDefault(require("./PrivateKeyInfo.js"));var _PKCS8ShroudedKeyBag=_interopRequireDefault(require("./PKCS8ShroudedKeyBag.js"));var _CertBag=_interopRequireDefault(require("./CertBag.js"));var _CRLBag=_interopRequireDefault(require("./CRLBag.js"));var _SecretBag=_interopRequireDefault(require("./SecretBag.js"));var _SafeContents=_interopRequireDefault(require("./SafeContents.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SafeBag{constructor(parameters={}){ this.bagId=(0,_pvutils.getParametersValue)(parameters,"bagId",SafeBag.defaultValues("bagId"));this.bagValue=(0,_pvutils.getParametersValue)(parameters,"bagValue",SafeBag.defaultValues("bagValue"));if("bagAttributes"in parameters)
this.bagAttributes=(0,_pvutils.getParametersValue)(parameters,"bagAttributes",SafeBag.defaultValues("bagAttributes"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"bagId":return"";case"bagValue":return new asn1js.Any();case"bagAttributes":return[];default:throw new Error(`Invalid member name for SafeBag class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"bagId":return memberValue==="";case"bagValue":return memberValue instanceof asn1js.Any;case"bagAttributes":return memberValue.length===0;default:throw new Error(`Invalid member name for SafeBag class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.bagId||"bagId"}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.bagValue||"bagValue"})]
}),new asn1js.Set({optional:true,value:[new asn1js.Repeated({name:names.bagAttributes||"bagAttributes",value:_Attribute.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["bagId","bagValue","bagAttributes"]);
 const asn1=asn1js.compareSchema(schema,schema,SafeBag.schema({names:{bagId:"bagId",bagValue:"bagValue",bagAttributes:"bagAttributes"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SafeBag");
 this.bagId=asn1.result.bagId.valueBlock.toString();switch(this.bagId){case"1.2.840.113549.1.12.10.1.1": this.bagValue=new _PrivateKeyInfo.default({schema:asn1.result.bagValue});break;case"1.2.840.113549.1.12.10.1.2": this.bagValue=new _PKCS8ShroudedKeyBag.default({schema:asn1.result.bagValue});break;case"1.2.840.113549.1.12.10.1.3": this.bagValue=new _CertBag.default({schema:asn1.result.bagValue});break;case"1.2.840.113549.1.12.10.1.4": this.bagValue=new _CRLBag.default({schema:asn1.result.bagValue});break;case"1.2.840.113549.1.12.10.1.5": this.bagValue=new _SecretBag.default({schema:asn1.result.bagValue});break;case"1.2.840.113549.1.12.10.1.6": this.bagValue=new _SafeContents.default({schema:asn1.result.bagValue});break;default:throw new Error(`Invalid "bagId" for SafeBag: ${this.bagId}`);}
if("bagAttributes"in asn1.result)this.bagAttributes=Array.from(asn1.result.bagAttributes,element=>new _Attribute.default({schema:element}));}
toSchema(){ const outputArray=[new asn1js.ObjectIdentifier({value:this.bagId}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.bagValue.toSchema()]})];if("bagAttributes"in this){outputArray.push(new asn1js.Set({value:Array.from(this.bagAttributes,element=>element.toSchema())}));}
return new asn1js.Sequence({value:outputArray});}
toJSON(){const output={bagId:this.bagId,bagValue:this.bagValue.toJSON()};if("bagAttributes"in this)output.bagAttributes=Array.from(this.bagAttributes,element=>element.toJSON());return output;}
}
exports.default=SafeBag;},{"./Attribute.js":6,"./CRLBag.js":15,"./CertBag.js":17,"./PKCS8ShroudedKeyBag.js":68,"./PrivateKeyInfo.js":76,"./SafeContents.js":96,"./SecretBag.js":97,"asn1js":112,"pvutils":113}],96:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _SafeBag=_interopRequireDefault(require("./SafeBag.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SafeContents{constructor(parameters={}){ this.safeBags=(0,_pvutils.getParametersValue)(parameters,"safeBags",SafeContents.defaultValues("safeBags"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"safeBags":return[];default:throw new Error(`Invalid member name for SafeContents class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"safeBags":return memberValue.length===0;default:throw new Error(`Invalid member name for SafeContents class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.safeBags||"",value:_SafeBag.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["safeBags"]);
 const asn1=asn1js.compareSchema(schema,schema,SafeContents.schema({names:{safeBags:"safeBags"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SafeContents");
 this.safeBags=Array.from(asn1.result.safeBags,element=>new _SafeBag.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.safeBags,element=>element.toSchema())});}
toJSON(){return{safeBags:Array.from(this.safeBags,element=>element.toJSON())};}
}
exports.default=SafeContents;},{"./SafeBag.js":95,"asn1js":112,"pvutils":113}],97:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SecretBag{constructor(parameters={}){ this.secretTypeId=(0,_pvutils.getParametersValue)(parameters,"secretTypeId",SecretBag.defaultValues("secretTypeId"));this.secretValue=(0,_pvutils.getParametersValue)(parameters,"secretValue",SecretBag.defaultValues("secretValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"secretTypeId":return"";case"secretValue":return new asn1js.Any();default:throw new Error(`Invalid member name for SecretBag class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"secretTypeId":return memberValue==="";case"secretValue":return memberValue instanceof asn1js.Any;default:throw new Error(`Invalid member name for SecretBag class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.ObjectIdentifier({name:names.id||"id"}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Any({name:names.value||"value"})]
})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["secretTypeId","secretValue"]);
 const asn1=asn1js.compareSchema(schema,schema,SecretBag.schema({names:{id:"secretTypeId",value:"secretValue"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SecretBag");
 this.secretTypeId=asn1.result.secretTypeId.valueBlock.toString();this.secretValue=asn1.result.secretValue;}
toSchema(){ return new asn1js.Sequence({value:[new asn1js.ObjectIdentifier({value:this.secretTypeId}),new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[this.secretValue.toSchema()]})]});}
toJSON(){return{secretTypeId:this.secretTypeId,secretValue:this.secretValue.toJSON()};}
}
exports.default=SecretBag;},{"asn1js":112,"pvutils":113}],98:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Signature{constructor(parameters={}){ this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",Signature.defaultValues("signatureAlgorithm"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",Signature.defaultValues("signature"));if("certs"in parameters)
this.certs=(0,_pvutils.getParametersValue)(parameters,"certs",Signature.defaultValues("certs"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signature":return new asn1js.BitString();case"certs":return[];default:throw new Error(`Invalid member name for Signature class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"signatureAlgorithm":return memberValue.algorithmId===""&&"algorithmParams"in memberValue===false;case"signature":return memberValue.isEqual(Signature.defaultValues(memberName));case"certs":return memberValue.length===0;default:throw new Error(`Invalid member name for Signature class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{}),new asn1js.BitString({name:names.signature||""}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Sequence({value:[new asn1js.Repeated({name:names.certs||"",value:_Certificate.default.schema(names.certs||{})})]})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["signatureAlgorithm","signature","certs"]);
 const asn1=asn1js.compareSchema(schema,schema,Signature.schema({names:{signatureAlgorithm:{names:{blockName:"signatureAlgorithm"}},signature:"signature",certs:"certs"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Signature");
 this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result.signatureAlgorithm});this.signature=asn1.result.signature;if("certs"in asn1.result)this.certs=Array.from(asn1.result.certs,element=>new _Certificate.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(this.signatureAlgorithm.toSchema());outputArray.push(this.signature);if("certs"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Sequence({value:Array.from(this.certs,element=>element.toSchema())})]}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={signatureAlgorithm:this.signatureAlgorithm.toJSON(),signature:this.signature.toJSON()};if("certs"in this)_object.certs=Array.from(this.certs,element=>element.toJSON());return _object;}
}
exports.default=Signature;},{"./AlgorithmIdentifier.js":4,"./Certificate.js":19,"asn1js":112,"pvutils":113}],99:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Attribute=_interopRequireDefault(require("./Attribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SignedAndUnsignedAttributes{constructor(parameters={}){ this.type=(0,_pvutils.getParametersValue)(parameters,"type",SignedAndUnsignedAttributes.defaultValues("type"));this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",SignedAndUnsignedAttributes.defaultValues("attributes"));this.encodedValue=(0,_pvutils.getParametersValue)(parameters,"encodedValue",SignedAndUnsignedAttributes.defaultValues("encodedValue"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"type":return-1;case"attributes":return[];case"encodedValue":return new ArrayBuffer(0);default:throw new Error(`Invalid member name for SignedAndUnsignedAttributes class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"type":return memberValue===SignedAndUnsignedAttributes.defaultValues("type");case"attributes":return memberValue.length===0;case"encodedValue":return memberValue.byteLength===0;default:throw new Error(`Invalid member name for SignedAndUnsignedAttributes class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Constructed({name:names.blockName||"",optional:true,idBlock:{tagClass:3, tagNumber:names.tagNumber
},value:[new asn1js.Repeated({name:names.attributes||"",value:_Attribute.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["attributes"]);
 const asn1=asn1js.compareSchema(schema,schema,SignedAndUnsignedAttributes.schema({names:{tagNumber:this.type,attributes:"attributes"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SignedAndUnsignedAttributes");
 this.type=asn1.result.idBlock.tagNumber;this.encodedValue=asn1.result.valueBeforeDecode; const encodedView=new Uint8Array(this.encodedValue);encodedView[0]=0x31; if("attributes"in asn1.result===false){if(this.type===0)throw new Error("Wrong structure of SignedUnsignedAttributes");else return;}
this.attributes=Array.from(asn1.result.attributes,element=>new _Attribute.default({schema:element}));}
toSchema(){if(SignedAndUnsignedAttributes.compareWithDefault("type",this.type)||SignedAndUnsignedAttributes.compareWithDefault("attributes",this.attributes))throw new Error("Incorrectly initialized \"SignedAndUnsignedAttributes\" class"); return new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:this.type
},value:Array.from(this.attributes,element=>element.toSchema())});}
toJSON(){if(SignedAndUnsignedAttributes.compareWithDefault("type",this.type)||SignedAndUnsignedAttributes.compareWithDefault("attributes",this.attributes))throw new Error("Incorrectly initialized \"SignedAndUnsignedAttributes\" class");return{type:this.type,attributes:Array.from(this.attributes,element=>element.toJSON())};}
}
exports.default=SignedAndUnsignedAttributes;},{"./Attribute.js":6,"asn1js":112,"pvutils":113}],100:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.verifySCTsForCertificate=verifySCTsForCertificate;exports.default=exports.SignedCertificateTimestamp=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _bytestreamjs=require("bytestreamjs");var _common=require("./common.js");var _PublicKeyInfo=_interopRequireDefault(require("./PublicKeyInfo.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg);var value=info.value;}catch(error){reject(error);return;}if(info.done){resolve(value);}else{Promise.resolve(value).then(_next,_throw);}}
function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise(function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"next",value);}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"throw",err);}_next(undefined);});};}
class SignedCertificateTimestamp{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",SignedCertificateTimestamp.defaultValues("version"));this.logID=(0,_pvutils.getParametersValue)(parameters,"logID",SignedCertificateTimestamp.defaultValues("logID"));this.timestamp=(0,_pvutils.getParametersValue)(parameters,"timestamp",SignedCertificateTimestamp.defaultValues("timestamp"));this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",SignedCertificateTimestamp.defaultValues("extensions"));this.hashAlgorithm=(0,_pvutils.getParametersValue)(parameters,"hashAlgorithm",SignedCertificateTimestamp.defaultValues("hashAlgorithm"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",SignedCertificateTimestamp.defaultValues("signatureAlgorithm"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",SignedCertificateTimestamp.defaultValues("signature"));
 if("schema"in parameters)this.fromSchema(parameters.schema);
if("stream"in parameters)this.fromStream(parameters.stream);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"logID":case"extensions":return new ArrayBuffer(0);case"timestamp":return new Date(0);case"hashAlgorithm":case"signatureAlgorithm":return"";case"signature":return new asn1js.Any();default:throw new Error(`Invalid member name for SignedCertificateTimestamp class: ${memberName}`);}}
fromSchema(schema){if(schema instanceof asn1js.RawData===false)throw new Error("Object's schema was not verified against input data for SignedCertificateTimestamp");const seqStream=new _bytestreamjs.SeqStream({stream:new _bytestreamjs.ByteStream({buffer:schema.data})});this.fromStream(seqStream);}
fromStream(stream){const blockLength=stream.getUint16();this.version=stream.getBlock(1)[0];if(this.version===0){this.logID=new Uint8Array(stream.getBlock(32)).buffer.slice(0);this.timestamp=new Date((0,_pvutils.utilFromBase)(new Uint8Array(stream.getBlock(8)),8)); const extensionsLength=stream.getUint16();this.extensions=new Uint8Array(stream.getBlock(extensionsLength)).buffer.slice(0);
 switch(stream.getBlock(1)[0]){case 0:this.hashAlgorithm="none";break;case 1:this.hashAlgorithm="md5";break;case 2:this.hashAlgorithm="sha1";break;case 3:this.hashAlgorithm="sha224";break;case 4:this.hashAlgorithm="sha256";break;case 5:this.hashAlgorithm="sha384";break;case 6:this.hashAlgorithm="sha512";break;default:throw new Error("Object's stream was not correct for SignedCertificateTimestamp");}
 
switch(stream.getBlock(1)[0]){case 0:this.signatureAlgorithm="anonymous";break;case 1:this.signatureAlgorithm="rsa";break;case 2:this.signatureAlgorithm="dsa";break;case 3:this.signatureAlgorithm="ecdsa";break;default:throw new Error("Object's stream was not correct for SignedCertificateTimestamp");}
 
const signatureLength=stream.getUint16();const signatureData=new Uint8Array(stream.getBlock(signatureLength)).buffer.slice(0);const asn1=asn1js.fromBER(signatureData);if(asn1.offset===-1)throw new Error("Object's stream was not correct for SignedCertificateTimestamp");this.signature=asn1.result; if(blockLength!==47+extensionsLength+signatureLength)throw new Error("Object's stream was not correct for SignedCertificateTimestamp");}}
toSchema(){const stream=this.toStream();return new asn1js.RawData({data:stream.stream.buffer});}
toStream(){const stream=new _bytestreamjs.SeqStream();stream.appendUint16(47+this.extensions.byteLength+this.signature.valueBeforeDecode.byteLength);stream.appendChar(this.version);stream.appendView(new Uint8Array(this.logID));const timeBuffer=new ArrayBuffer(8);const timeView=new Uint8Array(timeBuffer);const baseArray=(0,_pvutils.utilToBase)(this.timestamp.valueOf(),8);timeView.set(new Uint8Array(baseArray),8-baseArray.byteLength);stream.appendView(timeView);stream.appendUint16(this.extensions.byteLength);if(this.extensions.byteLength)stream.appendView(new Uint8Array(this.extensions));let _hashAlgorithm;switch(this.hashAlgorithm.toLowerCase()){case"none":_hashAlgorithm=0;break;case"md5":_hashAlgorithm=1;break;case"sha1":_hashAlgorithm=2;break;case"sha224":_hashAlgorithm=3;break;case"sha256":_hashAlgorithm=4;break;case"sha384":_hashAlgorithm=5;break;case"sha512":_hashAlgorithm=6;break;default:throw new Error(`Incorrect data for hashAlgorithm: ${this.hashAlgorithm}`);}
stream.appendChar(_hashAlgorithm);let _signatureAlgorithm;switch(this.signatureAlgorithm.toLowerCase()){case"anonymous":_signatureAlgorithm=0;break;case"rsa":_signatureAlgorithm=1;break;case"dsa":_signatureAlgorithm=2;break;case"ecdsa":_signatureAlgorithm=3;break;default:throw new Error(`Incorrect data for signatureAlgorithm: ${this.signatureAlgorithm}`);}
stream.appendChar(_signatureAlgorithm);const _signature=this.signature.toBER(false);stream.appendUint16(_signature.byteLength);stream.appendView(new Uint8Array(_signature));return stream;}
toJSON(){return{version:this.version,logID:(0,_pvutils.bufferToHexCodes)(this.logID),timestamp:this.timestamp,extensions:(0,_pvutils.bufferToHexCodes)(this.extensions),hashAlgorithm:this.hashAlgorithm,signatureAlgorithm:this.signatureAlgorithm,signature:this.signature.toJSON()};}
verify(logs,data,dataType=0){var _this=this;return _asyncToGenerator(function*(){ let logId=(0,_pvutils.toBase64)((0,_pvutils.arrayBufferToString)(_this.logID));let publicKeyBase64=null;let publicKeyInfo;let stream=new _bytestreamjs.SeqStream();
 var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=logs[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const log=_step.value;if(log.log_id===logId){publicKeyBase64=log.key;break;}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
if(publicKeyBase64===null)throw new Error(`Public key not found for CT with logId: ${logId}`);const asn1=asn1js.fromBER((0,_pvutils.stringToArrayBuffer)((0,_pvutils.fromBase64)(publicKeyBase64)));if(asn1.offset===-1)throw new Error(`Incorrect key value for CT Log with logId: ${logId}`);publicKeyInfo=new _PublicKeyInfo.default({schema:asn1.result});
 stream.appendChar(0x00); stream.appendChar(0x00); const timeBuffer=new ArrayBuffer(8);const timeView=new Uint8Array(timeBuffer);const baseArray=(0,_pvutils.utilToBase)(_this.timestamp.valueOf(),8);timeView.set(new Uint8Array(baseArray),8-baseArray.byteLength);stream.appendView(timeView);stream.appendUint16(dataType);if(dataType===0)stream.appendUint24(data.byteLength);stream.appendView(new Uint8Array(data));stream.appendUint16(_this.extensions.byteLength);if(_this.extensions.byteLength!==0)stream.appendView(new Uint8Array(_this.extensions));
 return(0,_common.getEngine)().subtle.verifyWithPublicKey(stream._stream._buffer.slice(0,stream._length),{valueBlock:{valueHex:_this.signature.toBER(false)}},publicKeyInfo,{algorithmId:""},"SHA-256");})();}
}
exports.SignedCertificateTimestamp=SignedCertificateTimestamp;class SignedCertificateTimestampList{constructor(parameters={}){ this.timestamps=(0,_pvutils.getParametersValue)(parameters,"timestamps",SignedCertificateTimestampList.defaultValues("timestamps"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"timestamps":return[];default:throw new Error(`Invalid member name for SignedCertificateTimestampList class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"timestamps":return memberValue.length===0;default:throw new Error(`Invalid member name for SignedCertificateTimestampList class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});if("optional"in names===false)names.optional=false;return new asn1js.OctetString({name:names.blockName||"SignedCertificateTimestampList",optional:names.optional});}
fromSchema(schema){ if(schema instanceof asn1js.OctetString===false)throw new Error("Object's schema was not verified against input data for SignedCertificateTimestampList");
 const seqStream=new _bytestreamjs.SeqStream({stream:new _bytestreamjs.ByteStream({buffer:schema.valueBlock.valueHex})});let dataLength=seqStream.getUint16();if(dataLength!==seqStream.length)throw new Error("Object's schema was not verified against input data for SignedCertificateTimestampList");while(seqStream.length)this.timestamps.push(new SignedCertificateTimestamp({stream:seqStream}));}
toSchema(){ const stream=new _bytestreamjs.SeqStream();let overallLength=0;const timestampsData=[];
 var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=this.timestamps[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const timestamp=_step2.value;const timestampStream=timestamp.toStream();timestampsData.push(timestampStream);overallLength+=timestampStream.stream.buffer.byteLength;}
}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}
stream.appendUint16(overallLength); for(var _i=0,_timestampsData=timestampsData;_i<_timestampsData.length;_i++){const timestamp=_timestampsData[_i];stream.appendView(timestamp.stream.view);} 
return new asn1js.OctetString({valueHex:stream.stream.buffer.slice(0)});}
toJSON(){return{timestamps:Array.from(this.timestamps,element=>element.toJSON())};}
}
exports.default=SignedCertificateTimestampList;function verifySCTsForCertificate(_x,_x2,_x3){return _verifySCTsForCertificate.apply(this,arguments);}
function _verifySCTsForCertificate(){_verifySCTsForCertificate=_asyncToGenerator(function*(certificate,issuerCertificate,logs,index=-1){ let parsedValue=null;let tbs;let issuerId;const stream=new _bytestreamjs.SeqStream();let preCert;
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 for(let i=0;i<certificate.extensions.length;i++){switch(certificate.extensions[i].extnID){case"1.3.6.1.4.1.11129.2.4.2":{parsedValue=certificate.extensions[i].parsedValue;if(parsedValue.timestamps.length===0)throw new Error("Nothing to verify in the certificate");certificate.extensions.splice(i,1);}
break;default:}}
 
if(parsedValue===null)throw new Error("No SignedCertificateTimestampList extension in the specified certificate");
 tbs=certificate.encodeTBS().toBER(false);
 issuerId=yield crypto.digest({name:"SHA-256"},new Uint8Array(issuerCertificate.subjectPublicKeyInfo.toSchema().toBER(false)));
 stream.appendView(new Uint8Array(issuerId));stream.appendUint24(tbs.byteLength);stream.appendView(new Uint8Array(tbs));preCert=stream._stream._buffer.slice(0,stream._length);
 if(index===-1){const verifyArray=[];var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=parsedValue.timestamps[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const timestamp=_step3.value;const verifyResult=yield timestamp.verify(logs,preCert,1);verifyArray.push(verifyResult);}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return!=null){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}
return verifyArray;}
if(index>=parsedValue.timestamps.length)index=parsedValue.timestamps.length-1;return[yield parsedValue.timestamps[index].verify(logs,preCert,1)];});return _verifySCTsForCertificate.apply(this,arguments);}},{"./PublicKeyInfo.js":78,"./common.js":110,"asn1js":112,"bytestreamjs":1,"pvutils":113}],101:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _EncapsulatedContentInfo=_interopRequireDefault(require("./EncapsulatedContentInfo.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _CertificateRevocationList=_interopRequireDefault(require("./CertificateRevocationList.js"));var _OtherRevocationInfoFormat=_interopRequireDefault(require("./OtherRevocationInfoFormat.js"));var _SignerInfo=_interopRequireDefault(require("./SignerInfo.js"));var _CertificateSet=_interopRequireDefault(require("./CertificateSet.js"));var _RevocationInfoChoices=_interopRequireDefault(require("./RevocationInfoChoices.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _TSTInfo=_interopRequireDefault(require("./TSTInfo.js"));var _CertificateChainValidationEngine=_interopRequireDefault(require("./CertificateChainValidationEngine.js"));var _BasicOCSPResponse=_interopRequireDefault(require("./BasicOCSPResponse.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_nonIterableRest();}
function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance");}
function _iterableToArrayLimit(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"]!=null)_i["return"]();}finally{if(_d)throw _e;}}return _arr;}
function _arrayWithHoles(arr){if(Array.isArray(arr))return arr;}
class SignedData{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",SignedData.defaultValues("version"));this.digestAlgorithms=(0,_pvutils.getParametersValue)(parameters,"digestAlgorithms",SignedData.defaultValues("digestAlgorithms"));this.encapContentInfo=(0,_pvutils.getParametersValue)(parameters,"encapContentInfo",SignedData.defaultValues("encapContentInfo"));if("certificates"in parameters)
this.certificates=(0,_pvutils.getParametersValue)(parameters,"certificates",SignedData.defaultValues("certificates"));if("crls"in parameters)
this.crls=(0,_pvutils.getParametersValue)(parameters,"crls",SignedData.defaultValues("crls"));if("ocsps"in parameters)
this.ocsps=(0,_pvutils.getParametersValue)(parameters,"ocsps",SignedData.defaultValues("ocsps"));this.signerInfos=(0,_pvutils.getParametersValue)(parameters,"signerInfos",SignedData.defaultValues("signerInfos"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"digestAlgorithms":return[];case"encapContentInfo":return new _EncapsulatedContentInfo.default();case"certificates":return[];case"crls":return[];case"ocsps":return[];case"signerInfos":return[];default:throw new Error(`Invalid member name for SignedData class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return memberValue===SignedData.defaultValues("version");case"encapContentInfo":return new _EncapsulatedContentInfo.default();case"digestAlgorithms":case"certificates":case"crls":case"ocsps":case"signerInfos":return memberValue.length===0;default:throw new Error(`Invalid member name for SignedData class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});if("optional"in names===false)names.optional=false;return new asn1js.Sequence({name:names.blockName||"SignedData",optional:names.optional,value:[new asn1js.Integer({name:names.version||"SignedData.version"}),new asn1js.Set({value:[new asn1js.Repeated({name:names.digestAlgorithms||"SignedData.digestAlgorithms",value:_AlgorithmIdentifier.default.schema()})]}),_EncapsulatedContentInfo.default.schema(names.encapContentInfo||{names:{blockName:"SignedData.encapContentInfo"}}),new asn1js.Constructed({name:names.certificates||"SignedData.certificates",optional:true,idBlock:{tagClass:3, tagNumber:0
},value:_CertificateSet.default.schema().valueBlock.value}), new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:_RevocationInfoChoices.default.schema(names.crls||{names:{crls:"SignedData.crls"}}).valueBlock.value}), new asn1js.Set({value:[new asn1js.Repeated({name:names.signerInfos||"SignedData.signerInfos",value:_SignerInfo.default.schema()})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["SignedData.version","SignedData.digestAlgorithms","SignedData.encapContentInfo","SignedData.certificates","SignedData.crls","SignedData.signerInfos"]);
 const asn1=asn1js.compareSchema(schema,schema,SignedData.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SignedData");
 this.version=asn1.result["SignedData.version"].valueBlock.valueDec;if("SignedData.digestAlgorithms"in asn1.result) 
this.digestAlgorithms=Array.from(asn1.result["SignedData.digestAlgorithms"],algorithm=>new _AlgorithmIdentifier.default({schema:algorithm}));this.encapContentInfo=new _EncapsulatedContentInfo.default({schema:asn1.result["SignedData.encapContentInfo"]});if("SignedData.certificates"in asn1.result){const certificateSet=new _CertificateSet.default({schema:new asn1js.Set({value:asn1.result["SignedData.certificates"].valueBlock.value})});this.certificates=certificateSet.certificates.slice(0);}
if("SignedData.crls"in asn1.result){this.crls=Array.from(asn1.result["SignedData.crls"],crl=>{if(crl.idBlock.tagClass===1)return new _CertificateRevocationList.default({schema:crl});crl.idBlock.tagClass=1; crl.idBlock.tagNumber=16;
 return new _OtherRevocationInfoFormat.default({schema:crl});});}
if("SignedData.signerInfos"in asn1.result) 
this.signerInfos=Array.from(asn1.result["SignedData.signerInfos"],signerInfoSchema=>new _SignerInfo.default({schema:signerInfoSchema}));}
toSchema(encodeFlag=false){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version})); outputArray.push(new asn1js.Set({value:Array.from(this.digestAlgorithms,algorithm=>algorithm.toSchema(encodeFlag))})); outputArray.push(this.encapContentInfo.toSchema());if("certificates"in this){const certificateSet=new _CertificateSet.default({certificates:this.certificates});const certificateSetSchema=certificateSet.toSchema();outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3,tagNumber:0},value:certificateSetSchema.valueBlock.value}));}
if("crls"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.crls,crl=>{if(crl instanceof _OtherRevocationInfoFormat.default){const crlSchema=crl.toSchema(encodeFlag);crlSchema.idBlock.tagClass=3;crlSchema.idBlock.tagNumber=1;return crlSchema;}
return crl.toSchema(encodeFlag);})}));} 
outputArray.push(new asn1js.Set({value:Array.from(this.signerInfos,signerInfo=>signerInfo.toSchema(encodeFlag))}));

 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version,digestAlgorithms:Array.from(this.digestAlgorithms,algorithm=>algorithm.toJSON()),encapContentInfo:this.encapContentInfo.toJSON()};if("certificates"in this)_object.certificates=Array.from(this.certificates,certificate=>certificate.toJSON());if("crls"in this)_object.crls=Array.from(this.crls,crl=>crl.toJSON());_object.signerInfos=Array.from(this.signerInfos,signerInfo=>signerInfo.toJSON());return _object;}
verify({signer=-1,data=new ArrayBuffer(0),trustedCerts=[],checkDate=new Date(),checkChain=false,extendedMode=false,passedWhenNotRevValues=false,findOrigin=null,findIssuer=null}={}){ let sequence=Promise.resolve();let messageDigestValue=new ArrayBuffer(0);let shaAlgorithm="";let signerCertificate={};let timestampSerial=null;let certificatePath=[];const engine=(0,_common.getEngine)();
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 if(signer===-1){if(extendedMode){return Promise.reject({date:checkDate,code:1,message:"Unable to get signer index from input parameters",signatureVerified:null,signerCertificate:null,signerCertificateVerified:null});}
return Promise.reject("Unable to get signer index from input parameters");}
 
if("certificates"in this===false){if(extendedMode){return Promise.reject({date:checkDate,code:2,message:"No certificates attached to this signed data",signatureVerified:null,signerCertificate:null,signerCertificateVerified:null});}
return Promise.reject("No certificates attached to this signed data");}
 
if(this.signerInfos[signer].sid instanceof _IssuerAndSerialNumber.default){sequence=sequence.then(()=>{var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=this.certificates[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const certificate=_step.value;if(certificate instanceof _Certificate.default===false)continue;if(certificate.issuer.isEqual(this.signerInfos[signer].sid.issuer)&&certificate.serialNumber.isEqual(this.signerInfos[signer].sid.serialNumber)){signerCertificate=certificate;return Promise.resolve();}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
if(extendedMode){return Promise.reject({date:checkDate,code:3,message:"Unable to find signer certificate",signatureVerified:null,signerCertificate:null,signerCertificateVerified:null});}
return Promise.reject("Unable to find signer certificate");});}else
{sequence=sequence.then(()=>Promise.all(Array.from(this.certificates.filter(certificate=>certificate instanceof _Certificate.default),certificate=>crypto.digest({name:"sha-1"},new Uint8Array(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex)))).then(results=>{var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=this.certificates.entries()[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){const _step2$value=_slicedToArray(_step2.value,2),index=_step2$value[0],certificate=_step2$value[1];if(certificate instanceof _Certificate.default===false)continue;if((0,_pvutils.isEqualBuffer)(results[index],this.signerInfos[signer].sid.valueBlock.valueHex)){signerCertificate=certificate;return Promise.resolve();}}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return!=null){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}
if(extendedMode){return Promise.reject({date:checkDate,code:3,message:"Unable to find signer certificate",signatureVerified:null,signerCertificate:null,signerCertificateVerified:null});}
return Promise.reject("Unable to find signer certificate");},()=>{if(extendedMode){return Promise.reject({date:checkDate,code:3,message:"Unable to find signer certificate",signatureVerified:null,signerCertificate:null,signerCertificateVerified:null});}
return Promise.reject("Unable to find signer certificate");}));}
 
sequence=sequence.then(()=>{if(this.encapContentInfo.eContentType==="1.2.840.113549.1.9.16.1.4"){ if("eContent"in this.encapContentInfo===false)return false;
 const asn1=asn1js.fromBER(this.encapContentInfo.eContent.valueBlock.valueHex);let tstInfo;try{tstInfo=new _TSTInfo.default({schema:asn1.result});}catch(ex){return false;}

checkDate=tstInfo.genTime;timestampSerial=tstInfo.serialNumber.valueBlock.valueHex;
 if(data.byteLength===0){if(extendedMode){return Promise.reject({date:checkDate,code:4,message:"Missed detached data input array",signatureVerified:null,signerCertificate,signerCertificateVerified:null});}
return Promise.reject("Missed detached data input array");} 
return tstInfo.verify({data});}
return true;});
 function checkCA(cert){ if(cert.issuer.isEqual(signerCertificate.issuer)===true&&cert.serialNumber.isEqual(signerCertificate.serialNumber)===true)return null; let isCA=false;if("extensions"in cert){var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=cert.extensions[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){const extension=_step3.value;if(extension.extnID==="2.5.29.19")
{if("cA"in extension.parsedValue){if(extension.parsedValue.cA===true)isCA=true;}}}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return!=null){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}}
if(isCA)return cert;return null;}
if(checkChain){sequence=sequence.then(result=>{ if(result===false)return false; const promiseResults=Array.from(this.certificates.filter(certificate=>certificate instanceof _Certificate.default),certificate=>checkCA(certificate));const certificateChainValidationEngineParameters={checkDate,certs:Array.from(promiseResults.filter(_result=>_result!==null)),trustedCerts};if(findIssuer!==null)certificateChainValidationEngineParameters.findIssuer=findIssuer;if(findOrigin!==null)certificateChainValidationEngineParameters.findOrigin=findOrigin;const certificateChainEngine=new _CertificateChainValidationEngine.default(certificateChainValidationEngineParameters);certificateChainEngine.certs.push(signerCertificate);if("crls"in this){var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=this.crls[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){const crl=_step4.value;if("thisUpdate"in crl)certificateChainEngine.crls.push(crl);else
{if(crl.otherRevInfoFormat==="1.3.6.1.5.5.7.48.1.1") 
certificateChainEngine.ocsps.push(new _BasicOCSPResponse.default({schema:crl.otherRevInfo}));}}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return!=null){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}}
if("ocsps"in this)certificateChainEngine.ocsps.push(...this.ocsps);return certificateChainEngine.verify({passedWhenNotRevValues}).then(verificationResult=>{if("certificatePath"in verificationResult)certificatePath=verificationResult.certificatePath;if(verificationResult.result===true)return Promise.resolve(true);if(extendedMode){return Promise.reject({date:checkDate,code:5,message:`Validation of signer's certificate failed: ${verificationResult.resultMessage}`,signatureVerified:null,signerCertificate,signerCertificateVerified:false});}
return Promise.reject("Validation of signer's certificate failed");},error=>{if(extendedMode){return Promise.reject({date:checkDate,code:5,message:`Validation of signer's certificate failed with error: ${error instanceof Object ? error.resultMessage : error}`,signatureVerified:null,signerCertificate,signerCertificateVerified:false});}
return Promise.reject(`Validation of signer's certificate failed with error: ${error instanceof Object ? error.resultMessage : error}`);});});}
 
sequence=sequence.then(result=>{ if(result===false)return false; const signerInfoHashAlgorithm=(0,_common.getAlgorithmByOID)(this.signerInfos[signer].digestAlgorithm.algorithmId);if("name"in signerInfoHashAlgorithm===false){if(extendedMode){return Promise.reject({date:checkDate,code:7,message:`Unsupported signature algorithm: ${this.signerInfos[signer].digestAlgorithm.algorithmId}`,signatureVerified:null,signerCertificate,signerCertificateVerified:true});}
return Promise.reject(`Unsupported signature algorithm: ${this.signerInfos[signer].digestAlgorithm.algorithmId}`);}
shaAlgorithm=signerInfoHashAlgorithm.name;return true;});
 sequence=sequence.then(result=>{ if(result===false)return false; if("eContent"in this.encapContentInfo)
{if(this.encapContentInfo.eContent.idBlock.tagClass===1&&this.encapContentInfo.eContent.idBlock.tagNumber===4){if(this.encapContentInfo.eContent.idBlock.isConstructed===false)data=this.encapContentInfo.eContent.valueBlock.valueHex;else{var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=this.encapContentInfo.eContent.valueBlock.value[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){const contentValue=_step5.value;data=(0,_pvutils.utilConcatBuf)(data,contentValue.valueBlock.valueHex);}}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return!=null){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}}}else data=this.encapContentInfo.eContent.valueBlock.valueBeforeDecode;}else
{if(data.byteLength===0)
{if(extendedMode){return Promise.reject({date:checkDate,code:8,message:"Missed detached data input array",signatureVerified:null,signerCertificate,signerCertificateVerified:true});}
return Promise.reject("Missed detached data input array");}}
if("signedAttrs"in this.signerInfos[signer]){ let foundContentType=false;let foundMessageDigest=false;var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=this.signerInfos[signer].signedAttrs.attributes[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){const attribute=_step6.value; if(attribute.type==="1.2.840.113549.1.9.3")foundContentType=true;
 if(attribute.type==="1.2.840.113549.1.9.4"){foundMessageDigest=true;messageDigestValue=attribute.values[0].valueBlock.valueHex;}
 
if(foundContentType&&foundMessageDigest)break;}}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return!=null){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}
if(foundContentType===false){if(extendedMode){return Promise.reject({date:checkDate,code:9,message:"Attribute \"content-type\" is a mandatory attribute for \"signed attributes\"",signatureVerified:null,signerCertificate,signerCertificateVerified:true});}
return Promise.reject("Attribute \"content-type\" is a mandatory attribute for \"signed attributes\"");}
if(foundMessageDigest===false){if(extendedMode){return Promise.reject({date:checkDate,code:10,message:"Attribute \"message-digest\" is a mandatory attribute for \"signed attributes\"",signatureVerified:null,signerCertificate,signerCertificateVerified:true});}
return Promise.reject("Attribute \"message-digest\" is a mandatory attribute for \"signed attributes\"");}
}
return true;});
sequence=sequence.then(result=>{ if(result===false)return false; if("signedAttrs"in this.signerInfos[signer])return crypto.digest(shaAlgorithm,new Uint8Array(data));return true;}).then(result=>{ if(result===false)return false; if("signedAttrs"in this.signerInfos[signer]){if((0,_pvutils.isEqualBuffer)(result,messageDigestValue)){data=this.signerInfos[signer].signedAttrs.encodedValue;return true;}
return false;}
return true;}); sequence=sequence.then(result=>{ if(result===false)return false; return engine.subtle.verifyWithPublicKey(data,this.signerInfos[signer].signature,signerCertificate.subjectPublicKeyInfo,signerCertificate.signatureAlgorithm,shaAlgorithm);}); sequence=sequence.then(result=>{if(extendedMode){return{date:checkDate,code:14,message:"",signatureVerified:result,signerCertificate,timestampSerial,signerCertificateVerified:true,certificatePath};}
return result;},error=>{if(extendedMode){if("code"in error)return Promise.reject(error);return Promise.reject({date:checkDate,code:15,message:`Error during verification: ${error.message}`,signatureVerified:null,signerCertificate,timestampSerial,signerCertificateVerified:true});}
return Promise.reject(error);}); return sequence;}
sign(privateKey,signerIndex,hashAlgorithm="SHA-1",data=new ArrayBuffer(0)){ if(typeof privateKey==="undefined")return Promise.reject("Need to provide a private key for signing");
 let sequence=Promise.resolve();let parameters;const engine=(0,_common.getEngine)();
 const hashAlgorithmOID=(0,_common.getOIDByAlgorithm)({name:hashAlgorithm});if(hashAlgorithmOID==="")return Promise.reject(`Unsupported hash algorithm: ${hashAlgorithm}`);
 if(this.digestAlgorithms.filter(algorithm=>algorithm.algorithmId===hashAlgorithmOID).length===0){this.digestAlgorithms.push(new _AlgorithmIdentifier.default({algorithmId:hashAlgorithmOID,algorithmParams:new asn1js.Null()}));}
this.signerInfos[signerIndex].digestAlgorithm=new _AlgorithmIdentifier.default({algorithmId:hashAlgorithmOID,algorithmParams:new asn1js.Null()});
 sequence=sequence.then(()=>engine.subtle.getSignatureParameters(privateKey,hashAlgorithm));sequence=sequence.then(result=>{parameters=result.parameters;this.signerInfos[signerIndex].signatureAlgorithm=result.signatureAlgorithm;});
 sequence=sequence.then(()=>{if("signedAttrs"in this.signerInfos[signerIndex]){if(this.signerInfos[signerIndex].signedAttrs.encodedValue.byteLength!==0)data=this.signerInfos[signerIndex].signedAttrs.encodedValue;else{data=this.signerInfos[signerIndex].signedAttrs.toSchema(true).toBER(false); const view=new Uint8Array(data);view[0]=0x31;}}else{if("eContent"in this.encapContentInfo)
{if(this.encapContentInfo.eContent.idBlock.tagClass===1&&this.encapContentInfo.eContent.idBlock.tagNumber===4){if(this.encapContentInfo.eContent.idBlock.isConstructed===false)data=this.encapContentInfo.eContent.valueBlock.valueHex;else{var _iteratorNormalCompletion7=true;var _didIteratorError7=false;var _iteratorError7=undefined;try{for(var _iterator7=this.encapContentInfo.eContent.valueBlock.value[Symbol.iterator](),_step7;!(_iteratorNormalCompletion7=(_step7=_iterator7.next()).done);_iteratorNormalCompletion7=true){const content=_step7.value;data=(0,_pvutils.utilConcatBuf)(data,content.valueBlock.valueHex);}}catch(err){_didIteratorError7=true;_iteratorError7=err;}finally{try{if(!_iteratorNormalCompletion7&&_iterator7.return!=null){_iterator7.return();}}finally{if(_didIteratorError7){throw _iteratorError7;}}}}}else data=this.encapContentInfo.eContent.valueBlock.valueBeforeDecode;}else
{if(data.byteLength===0) 
return Promise.reject("Missed detached data input array");}}
return Promise.resolve();});
 sequence=sequence.then(()=>engine.subtle.signWithPrivateKey(data,privateKey,parameters));sequence=sequence.then(result=>{this.signerInfos[signerIndex].signature=new asn1js.OctetString({valueHex:result});return result;}); return sequence;}
}
exports.default=SignedData;},{"./AlgorithmIdentifier.js":4,"./BasicOCSPResponse.js":13,"./Certificate.js":19,"./CertificateChainValidationEngine.js":20,"./CertificateRevocationList.js":22,"./CertificateSet.js":23,"./EncapsulatedContentInfo.js":33,"./IssuerAndSerialNumber.js":44,"./OtherRevocationInfoFormat.js":64,"./RevocationInfoChoices.js":93,"./SignerInfo.js":102,"./TSTInfo.js":106,"./common.js":110,"asn1js":112,"pvutils":113}],102:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _SignedAndUnsignedAttributes=_interopRequireDefault(require("./SignedAndUnsignedAttributes.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SignerInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",SignerInfo.defaultValues("version"));this.sid=(0,_pvutils.getParametersValue)(parameters,"sid",SignerInfo.defaultValues("sid"));this.digestAlgorithm=(0,_pvutils.getParametersValue)(parameters,"digestAlgorithm",SignerInfo.defaultValues("digestAlgorithm"));if("signedAttrs"in parameters)
this.signedAttrs=(0,_pvutils.getParametersValue)(parameters,"signedAttrs",SignerInfo.defaultValues("signedAttrs"));this.signatureAlgorithm=(0,_pvutils.getParametersValue)(parameters,"signatureAlgorithm",SignerInfo.defaultValues("signatureAlgorithm"));this.signature=(0,_pvutils.getParametersValue)(parameters,"signature",SignerInfo.defaultValues("signature"));if("unsignedAttrs"in parameters)
this.unsignedAttrs=(0,_pvutils.getParametersValue)(parameters,"unsignedAttrs",SignerInfo.defaultValues("unsignedAttrs"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"sid":return new asn1js.Any();case"digestAlgorithm":return new _AlgorithmIdentifier.default();case"signedAttrs":return new _SignedAndUnsignedAttributes.default({type:0});case"signatureAlgorithm":return new _AlgorithmIdentifier.default();case"signature":return new asn1js.OctetString();case"unsignedAttrs":return new _SignedAndUnsignedAttributes.default({type:1});default:throw new Error(`Invalid member name for SignerInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":return SignerInfo.defaultValues("version")===memberValue;case"sid":return memberValue instanceof asn1js.Any;case"digestAlgorithm":if(memberValue instanceof _AlgorithmIdentifier.default===false)return false;return memberValue.isEqual(SignerInfo.defaultValues("digestAlgorithm"));case"signedAttrs":return _SignedAndUnsignedAttributes.default.compareWithDefault("type",memberValue.type)&&_SignedAndUnsignedAttributes.default.compareWithDefault("attributes",memberValue.attributes)&&_SignedAndUnsignedAttributes.default.compareWithDefault("encodedValue",memberValue.encodedValue);case"signatureAlgorithm":if(memberValue instanceof _AlgorithmIdentifier.default===false)return false;return memberValue.isEqual(SignerInfo.defaultValues("signatureAlgorithm"));case"signature":case"unsignedAttrs":return _SignedAndUnsignedAttributes.default.compareWithDefault("type",memberValue.type)&&_SignedAndUnsignedAttributes.default.compareWithDefault("attributes",memberValue.attributes)&&_SignedAndUnsignedAttributes.default.compareWithDefault("encodedValue",memberValue.encodedValue);default:throw new Error(`Invalid member name for SignerInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:"SignerInfo",value:[new asn1js.Integer({name:names.version||"SignerInfo.version"}),new asn1js.Choice({value:[_IssuerAndSerialNumber.default.schema(names.sid||{names:{blockName:"SignerInfo.sid"}}),new asn1js.Constructed({optional:true,name:names.sid||"SignerInfo.sid",idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.OctetString()]})]}),_AlgorithmIdentifier.default.schema(names.digestAlgorithm||{names:{blockName:"SignerInfo.digestAlgorithm"}}),_SignedAndUnsignedAttributes.default.schema(names.signedAttrs||{names:{blockName:"SignerInfo.signedAttrs",tagNumber:0}}),_AlgorithmIdentifier.default.schema(names.signatureAlgorithm||{names:{blockName:"SignerInfo.signatureAlgorithm"}}),new asn1js.OctetString({name:names.signature||"SignerInfo.signature"}),_SignedAndUnsignedAttributes.default.schema(names.unsignedAttrs||{names:{blockName:"SignerInfo.unsignedAttrs",tagNumber:1}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["SignerInfo.version","SignerInfo.sid","SignerInfo.digestAlgorithm","SignerInfo.signedAttrs","SignerInfo.signatureAlgorithm","SignerInfo.signature","SignerInfo.unsignedAttrs"]);
 const asn1=asn1js.compareSchema(schema,schema,SignerInfo.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SignerInfo");
 this.version=asn1.result["SignerInfo.version"].valueBlock.valueDec;const currentSid=asn1.result["SignerInfo.sid"];if(currentSid.idBlock.tagClass===1)this.sid=new _IssuerAndSerialNumber.default({schema:currentSid});else this.sid=currentSid;this.digestAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result["SignerInfo.digestAlgorithm"]});if("SignerInfo.signedAttrs"in asn1.result)this.signedAttrs=new _SignedAndUnsignedAttributes.default({type:0,schema:asn1.result["SignerInfo.signedAttrs"]});this.signatureAlgorithm=new _AlgorithmIdentifier.default({schema:asn1.result["SignerInfo.signatureAlgorithm"]});this.signature=asn1.result["SignerInfo.signature"];if("SignerInfo.unsignedAttrs"in asn1.result)this.unsignedAttrs=new _SignedAndUnsignedAttributes.default({type:1,schema:asn1.result["SignerInfo.unsignedAttrs"]});}
toSchema(){if(SignerInfo.compareWithDefault("sid",this.sid))throw new Error("Incorrectly initialized \"SignerInfo\" class"); const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));if(this.sid instanceof _IssuerAndSerialNumber.default)outputArray.push(this.sid.toSchema());else outputArray.push(this.sid);outputArray.push(this.digestAlgorithm.toSchema());if("signedAttrs"in this){if(SignerInfo.compareWithDefault("signedAttrs",this.signedAttrs)===false)outputArray.push(this.signedAttrs.toSchema());}
outputArray.push(this.signatureAlgorithm.toSchema());outputArray.push(this.signature);if("unsignedAttrs"in this){if(SignerInfo.compareWithDefault("unsignedAttrs",this.unsignedAttrs)===false)outputArray.push(this.unsignedAttrs.toSchema());}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){if(SignerInfo.compareWithDefault("sid",this.sid))throw new Error("Incorrectly initialized \"SignerInfo\" class");const _object={version:this.version};if(!(this.sid instanceof asn1js.Any))_object.sid=this.sid.toJSON();_object.digestAlgorithm=this.digestAlgorithm.toJSON();if(SignerInfo.compareWithDefault("signedAttrs",this.signedAttrs)===false)_object.signedAttrs=this.signedAttrs.toJSON();_object.signatureAlgorithm=this.signatureAlgorithm.toJSON();_object.signature=this.signature.toJSON();if(SignerInfo.compareWithDefault("unsignedAttrs",this.unsignedAttrs)===false)_object.unsignedAttrs=this.unsignedAttrs.toJSON();return _object;}
}
exports.default=SignerInfo;},{"./AlgorithmIdentifier.js":4,"./IssuerAndSerialNumber.js":44,"./SignedAndUnsignedAttributes.js":99,"asn1js":112,"pvutils":113}],103:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CertID=_interopRequireDefault(require("./CertID.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SingleResponse{constructor(parameters={}){ this.certID=(0,_pvutils.getParametersValue)(parameters,"certID",SingleResponse.defaultValues("certID"));this.certStatus=(0,_pvutils.getParametersValue)(parameters,"certStatus",SingleResponse.defaultValues("certStatus"));this.thisUpdate=(0,_pvutils.getParametersValue)(parameters,"thisUpdate",SingleResponse.defaultValues("thisUpdate"));if("nextUpdate"in parameters)
this.nextUpdate=(0,_pvutils.getParametersValue)(parameters,"nextUpdate",SingleResponse.defaultValues("nextUpdate"));if("singleExtensions"in parameters)
this.singleExtensions=(0,_pvutils.getParametersValue)(parameters,"singleExtensions",SingleResponse.defaultValues("singleExtensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"certID":return new _CertID.default();case"certStatus":return{};case"thisUpdate":case"nextUpdate":return new Date(0,0,0);case"singleExtensions":return[];default:throw new Error(`Invalid member name for SingleResponse class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"certID": return _CertID.default.compareWithDefault("hashAlgorithm",memberValue.hashAlgorithm)&&_CertID.default.compareWithDefault("issuerNameHash",memberValue.issuerNameHash)&&_CertID.default.compareWithDefault("issuerKeyHash",memberValue.issuerKeyHash)&&_CertID.default.compareWithDefault("serialNumber",memberValue.serialNumber);case"certStatus":return Object.keys(memberValue).length===0;case"thisUpdate":case"nextUpdate":return memberValue===SingleResponse.defaultValues(memberName);default:throw new Error(`Invalid member name for SingleResponse class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[_CertID.default.schema(names.certID||{}),new asn1js.Choice({value:[new asn1js.Primitive({name:names.certStatus||"",idBlock:{tagClass:3, tagNumber:0
},lenBlockLength:1
}),new asn1js.Constructed({name:names.certStatus||"",idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.GeneralizedTime(),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Enumerated()]})]}),new asn1js.Primitive({name:names.certStatus||"",idBlock:{tagClass:3, tagNumber:2
},lenBlock:{length:1}})
]}),new asn1js.GeneralizedTime({name:names.thisUpdate||""}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.GeneralizedTime({name:names.nextUpdate||""})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[_Extensions.default.schema(names.singleExtensions||{})]})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["certID","certStatus","thisUpdate","nextUpdate","singleExtensions"]);
 const asn1=asn1js.compareSchema(schema,schema,SingleResponse.schema({names:{certID:{names:{blockName:"certID"}},certStatus:"certStatus",thisUpdate:"thisUpdate",nextUpdate:"nextUpdate",singleExtensions:{names:{blockName:"singleExtensions"}}}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SingleResponse");
 this.certID=new _CertID.default({schema:asn1.result.certID});this.certStatus=asn1.result.certStatus;this.thisUpdate=asn1.result.thisUpdate.toDate();if("nextUpdate"in asn1.result)this.nextUpdate=asn1.result.nextUpdate.toDate();if("singleExtensions"in asn1.result)this.singleExtensions=Array.from(asn1.result.singleExtensions.valueBlock.value,element=>new _Extension.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(this.certID.toSchema());outputArray.push(this.certStatus);outputArray.push(new asn1js.GeneralizedTime({valueDate:this.thisUpdate}));if("nextUpdate"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.GeneralizedTime({valueDate:this.nextUpdate})]}));}
if("singleExtensions"in this){outputArray.push(new asn1js.Sequence({value:Array.from(this.singleExtensions,element=>element.toSchema())}));}
 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={certID:this.certID.toJSON(),certStatus:this.certStatus.toJSON(),thisUpdate:this.thisUpdate};if("nextUpdate"in this)_object.nextUpdate=this.nextUpdate;if("singleExtensions"in this)_object.singleExtensions=Array.from(this.singleExtensions,element=>element.toJSON());return _object;}
}
exports.default=SingleResponse;},{"./CertID.js":18,"./Extension.js":38,"./Extensions.js":39,"asn1js":112,"pvutils":113}],104:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _Attribute=_interopRequireDefault(require("./Attribute.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class SubjectDirectoryAttributes{constructor(parameters={}){ this.attributes=(0,_pvutils.getParametersValue)(parameters,"attributes",SubjectDirectoryAttributes.defaultValues("attributes"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"attributes":return[];default:throw new Error(`Invalid member name for SubjectDirectoryAttributes class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"",value:[new asn1js.Repeated({name:names.attributes||"",value:_Attribute.default.schema()})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["attributes"]);
 const asn1=asn1js.compareSchema(schema,schema,SubjectDirectoryAttributes.schema({names:{attributes:"attributes"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for SubjectDirectoryAttributes");
 this.attributes=Array.from(asn1.result.attributes,element=>new _Attribute.default({schema:element}));}
toSchema(){ return new asn1js.Sequence({value:Array.from(this.attributes,element=>element.toSchema())});}
toJSON(){return{attributes:Array.from(this.attributes,element=>element.toJSON())};}
}
exports.default=SubjectDirectoryAttributes;},{"./Attribute.js":6,"asn1js":112,"pvutils":113}],105:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));var _Request=_interopRequireDefault(require("./Request.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class TBSRequest{constructor(parameters={}){ this.tbs=(0,_pvutils.getParametersValue)(parameters,"tbs",TBSRequest.defaultValues("tbs"));if("version"in parameters)
this.version=(0,_pvutils.getParametersValue)(parameters,"version",TBSRequest.defaultValues("version"));if("requestorName"in parameters)
this.requestorName=(0,_pvutils.getParametersValue)(parameters,"requestorName",TBSRequest.defaultValues("requestorName"));this.requestList=(0,_pvutils.getParametersValue)(parameters,"requestList",TBSRequest.defaultValues("requestList"));if("requestExtensions"in parameters)
this.requestExtensions=(0,_pvutils.getParametersValue)(parameters,"requestExtensions",TBSRequest.defaultValues("requestExtensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"tbs":return new ArrayBuffer(0);case"version":return 0;case"requestorName":return new _GeneralName.default();case"requestList":case"requestExtensions":return[];default:throw new Error(`Invalid member name for TBSRequest class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"tbs":return memberValue.byteLength===0;case"version":return memberValue===TBSRequest.defaultValues(memberName);case"requestorName":return memberValue.type===_GeneralName.default.defaultValues("type")&&Object.keys(memberValue.value).length===0;case"requestList":case"requestExtensions":return memberValue.length===0;default:throw new Error(`Invalid member name for TBSRequest class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"TBSRequest",value:[new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({name:names.TBSRequestVersion||"TBSRequest.version"})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[_GeneralName.default.schema(names.requestorName||{names:{blockName:"TBSRequest.requestorName"}})]}),new asn1js.Sequence({name:names.requestList||"TBSRequest.requestList",value:[new asn1js.Repeated({name:names.requests||"TBSRequest.requests",value:_Request.default.schema(names.requestNames||{})})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:2
},value:[_Extensions.default.schema(names.extensions||{names:{blockName:names.requestExtensions||"TBSRequest.requestExtensions"}})]})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["TBSRequest","TBSRequest.version","TBSRequest.requestorName","TBSRequest.requests","TBSRequest.requestExtensions"]);
 const asn1=asn1js.compareSchema(schema,schema,TBSRequest.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for TBSRequest");
 this.tbs=asn1.result.TBSRequest.valueBeforeDecode;if("TBSRequest.version"in asn1.result)this.version=asn1.result["TBSRequest.version"].valueBlock.valueDec;if("TBSRequest.requestorName"in asn1.result)this.requestorName=new _GeneralName.default({schema:asn1.result["TBSRequest.requestorName"]});this.requestList=Array.from(asn1.result["TBSRequest.requests"],element=>new _Request.default({schema:element}));if("TBSRequest.requestExtensions"in asn1.result)this.requestExtensions=Array.from(asn1.result["TBSRequest.requestExtensions"].valueBlock.value,element=>new _Extension.default({schema:element}));}
toSchema(encodeFlag=false){ let tbsSchema;if(encodeFlag===false){if(this.tbs.byteLength===0) 
return TBSRequest.schema();tbsSchema=asn1js.fromBER(this.tbs).result;}
 
else{const outputArray=[];if("version"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Integer({value:this.version})]}));}
if("requestorName"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:1
},value:[this.requestorName.toSchema()]}));}
outputArray.push(new asn1js.Sequence({value:Array.from(this.requestList,element=>element.toSchema())}));if("requestExtensions"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:2
},value:[new asn1js.Sequence({value:Array.from(this.requestExtensions,element=>element.toSchema())})]}));}
tbsSchema=new asn1js.Sequence({value:outputArray});}
 
return tbsSchema;}
toJSON(){const _object={};if("version"in this)_object.version=this.version;if("requestorName"in this)_object.requestorName=this.requestorName.toJSON();_object.requestList=Array.from(this.requestList,element=>element.toJSON());if("requestExtensions"in this)_object.requestExtensions=Array.from(this.requestExtensions,element=>element.toJSON());return _object;}
}
exports.default=TBSRequest;},{"./Extension.js":38,"./Extensions.js":39,"./GeneralName.js":40,"./Request.js":90,"asn1js":112,"pvutils":113}],106:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _common=require("./common.js");var _MessageImprint=_interopRequireDefault(require("./MessageImprint.js"));var _Accuracy=_interopRequireDefault(require("./Accuracy.js"));var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class TSTInfo{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",TSTInfo.defaultValues("version"));this.policy=(0,_pvutils.getParametersValue)(parameters,"policy",TSTInfo.defaultValues("policy"));this.messageImprint=(0,_pvutils.getParametersValue)(parameters,"messageImprint",TSTInfo.defaultValues("messageImprint"));this.serialNumber=(0,_pvutils.getParametersValue)(parameters,"serialNumber",TSTInfo.defaultValues("serialNumber"));this.genTime=(0,_pvutils.getParametersValue)(parameters,"genTime",TSTInfo.defaultValues("genTime"));if("accuracy"in parameters)
this.accuracy=(0,_pvutils.getParametersValue)(parameters,"accuracy",TSTInfo.defaultValues("accuracy"));if("ordering"in parameters)
this.ordering=(0,_pvutils.getParametersValue)(parameters,"ordering",TSTInfo.defaultValues("ordering"));if("nonce"in parameters)
this.nonce=(0,_pvutils.getParametersValue)(parameters,"nonce",TSTInfo.defaultValues("nonce"));if("tsa"in parameters)
this.tsa=(0,_pvutils.getParametersValue)(parameters,"tsa",TSTInfo.defaultValues("tsa"));if("extensions"in parameters)
this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",TSTInfo.defaultValues("extensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"policy":return"";case"messageImprint":return new _MessageImprint.default();case"serialNumber":return new asn1js.Integer();case"genTime":return new Date(0,0,0);case"accuracy":return new _Accuracy.default();case"ordering":return false;case"nonce":return new asn1js.Integer();case"tsa":return new _GeneralName.default();case"extensions":return[];default:throw new Error(`Invalid member name for TSTInfo class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":case"policy":case"genTime":case"ordering":return memberValue===TSTInfo.defaultValues(memberName);case"messageImprint":return _MessageImprint.default.compareWithDefault("hashAlgorithm",memberValue.hashAlgorithm)&&_MessageImprint.default.compareWithDefault("hashedMessage",memberValue.hashedMessage);case"serialNumber":case"nonce":return memberValue.isEqual(TSTInfo.defaultValues(memberName));case"accuracy":return _Accuracy.default.compareWithDefault("seconds",memberValue.seconds)&&_Accuracy.default.compareWithDefault("millis",memberValue.millis)&&_Accuracy.default.compareWithDefault("micros",memberValue.micros);case"tsa":return _GeneralName.default.compareWithDefault("type",memberValue.type)&&_GeneralName.default.compareWithDefault("value",memberValue.value);case"extensions":return memberValue.length===0;default:throw new Error(`Invalid member name for TSTInfo class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"TSTInfo",value:[new asn1js.Integer({name:names.version||"TSTInfo.version"}),new asn1js.ObjectIdentifier({name:names.policy||"TSTInfo.policy"}),_MessageImprint.default.schema(names.messageImprint||{names:{blockName:"TSTInfo.messageImprint"}}),new asn1js.Integer({name:names.serialNumber||"TSTInfo.serialNumber"}),new asn1js.GeneralizedTime({name:names.genTime||"TSTInfo.genTime"}),_Accuracy.default.schema(names.accuracy||{names:{blockName:"TSTInfo.accuracy"}}),new asn1js.Boolean({name:names.ordering||"TSTInfo.ordering",optional:true}),new asn1js.Integer({name:names.nonce||"TSTInfo.nonce",optional:true}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[_GeneralName.default.schema(names.tsa||{names:{blockName:"TSTInfo.tsa"}})]}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:[new asn1js.Repeated({name:names.extensions||"TSTInfo.extensions",value:_Extension.default.schema(names.extension||{})})]})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["TSTInfo.version","TSTInfo.policy","TSTInfo.messageImprint","TSTInfo.serialNumber","TSTInfo.genTime","TSTInfo.accuracy","TSTInfo.ordering","TSTInfo.nonce","TSTInfo.tsa","TSTInfo.extensions"]);
 const asn1=asn1js.compareSchema(schema,schema,TSTInfo.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for TSTInfo");
 this.version=asn1.result["TSTInfo.version"].valueBlock.valueDec;this.policy=asn1.result["TSTInfo.policy"].valueBlock.toString();this.messageImprint=new _MessageImprint.default({schema:asn1.result["TSTInfo.messageImprint"]});this.serialNumber=asn1.result["TSTInfo.serialNumber"];this.genTime=asn1.result["TSTInfo.genTime"].toDate();if("TSTInfo.accuracy"in asn1.result)this.accuracy=new _Accuracy.default({schema:asn1.result["TSTInfo.accuracy"]});if("TSTInfo.ordering"in asn1.result)this.ordering=asn1.result["TSTInfo.ordering"].valueBlock.value;if("TSTInfo.nonce"in asn1.result)this.nonce=asn1.result["TSTInfo.nonce"];if("TSTInfo.tsa"in asn1.result)this.tsa=new _GeneralName.default({schema:asn1.result["TSTInfo.tsa"]});if("TSTInfo.extensions"in asn1.result)this.extensions=Array.from(asn1.result["TSTInfo.extensions"],element=>new _Extension.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(new asn1js.ObjectIdentifier({value:this.policy}));outputArray.push(this.messageImprint.toSchema());outputArray.push(this.serialNumber);outputArray.push(new asn1js.GeneralizedTime({valueDate:this.genTime}));if("accuracy"in this)outputArray.push(this.accuracy.toSchema());if("ordering"in this)outputArray.push(new asn1js.Boolean({value:this.ordering}));if("nonce"in this)outputArray.push(this.nonce);if("tsa"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[this.tsa.toSchema()]}));} 
if("extensions"in this){outputArray.push(new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:1
},value:Array.from(this.extensions,element=>element.toSchema())}));}

 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version,policy:this.policy,messageImprint:this.messageImprint.toJSON(),serialNumber:this.serialNumber.toJSON(),genTime:this.genTime};if("accuracy"in this)_object.accuracy=this.accuracy.toJSON();if("ordering"in this)_object.ordering=this.ordering;if("nonce"in this)_object.nonce=this.nonce.toJSON();if("tsa"in this)_object.tsa=this.tsa.toJSON();if("extensions"in this)_object.extensions=Array.from(this.extensions,element=>element.toJSON());return _object;}
verify(parameters={}){ let sequence=Promise.resolve();let data;let notBefore=null;let notAfter=null;
 const crypto=(0,_common.getCrypto)();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 if("data"in parameters)data=parameters.data;else return Promise.reject("\"data\" is a mandatory attribute for TST_INFO verification");if("notBefore"in parameters)notBefore=parameters.notBefore;if("notAfter"in parameters)notAfter=parameters.notAfter;
 if(notBefore!==null){if(this.genTime<notBefore)return Promise.reject("Generation time for TSTInfo object is less than notBefore value");}
if(notAfter!==null){if(this.genTime>notAfter)return Promise.reject("Generation time for TSTInfo object is more than notAfter value");}
 
const shaAlgorithm=(0,_common.getAlgorithmByOID)(this.messageImprint.hashAlgorithm.algorithmId);if("name"in shaAlgorithm===false)return Promise.reject(`Unsupported signature algorithm: ${this.messageImprint.hashAlgorithm.algorithmId}`);

 sequence=sequence.then(()=>crypto.digest(shaAlgorithm.name,new Uint8Array(data))).then(result=>(0,_pvutils.isEqualBuffer)(result,this.messageImprint.hashedMessage.valueBlock.valueHex)); return sequence;}
}
exports.default=TSTInfo;},{"./Accuracy.js":3,"./Extension.js":38,"./GeneralName.js":40,"./MessageImprint.js":53,"./common.js":110,"asn1js":112,"pvutils":113}],107:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class Time{constructor(parameters={}){ this.type=(0,_pvutils.getParametersValue)(parameters,"type",Time.defaultValues("type"));this.value=(0,_pvutils.getParametersValue)(parameters,"value",Time.defaultValues("value"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"type":return 0;case"value":return new Date(0,0,0);default:throw new Error(`Invalid member name for Time class: ${memberName}`);}}
static schema(parameters={},optional=false){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Choice({optional,value:[new asn1js.UTCTime({name:names.utcTimeName||""}),new asn1js.GeneralizedTime({name:names.generalTimeName||""})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["utcTimeName","generalTimeName"]);
 const asn1=asn1js.compareSchema(schema,schema,Time.schema({names:{utcTimeName:"utcTimeName",generalTimeName:"generalTimeName"}}));if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for Time");
 if("utcTimeName"in asn1.result){this.type=0;this.value=asn1.result.utcTimeName.toDate();}
if("generalTimeName"in asn1.result){this.type=1;this.value=asn1.result.generalTimeName.toDate();}
}
toSchema(){ let result={};if(this.type===0)result=new asn1js.UTCTime({valueDate:this.value});if(this.type===1)result=new asn1js.GeneralizedTime({valueDate:this.value});return result;}
toJSON(){return{type:this.type,value:this.value};}
}
exports.default=Time;},{"asn1js":112,"pvutils":113}],108:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _MessageImprint=_interopRequireDefault(require("./MessageImprint.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class TimeStampReq{constructor(parameters={}){ this.version=(0,_pvutils.getParametersValue)(parameters,"version",TimeStampReq.defaultValues("version"));this.messageImprint=(0,_pvutils.getParametersValue)(parameters,"messageImprint",TimeStampReq.defaultValues("messageImprint"));if("reqPolicy"in parameters)
this.reqPolicy=(0,_pvutils.getParametersValue)(parameters,"reqPolicy",TimeStampReq.defaultValues("reqPolicy"));if("nonce"in parameters)
this.nonce=(0,_pvutils.getParametersValue)(parameters,"nonce",TimeStampReq.defaultValues("nonce"));if("certReq"in parameters)
this.certReq=(0,_pvutils.getParametersValue)(parameters,"certReq",TimeStampReq.defaultValues("certReq"));if("extensions"in parameters)
this.extensions=(0,_pvutils.getParametersValue)(parameters,"extensions",TimeStampReq.defaultValues("extensions"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"version":return 0;case"messageImprint":return new _MessageImprint.default();case"reqPolicy":return"";case"nonce":return new asn1js.Integer();case"certReq":return false;case"extensions":return[];default:throw new Error(`Invalid member name for TimeStampReq class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"version":case"reqPolicy":case"certReq":return memberValue===TimeStampReq.defaultValues(memberName);case"messageImprint":return _MessageImprint.default.compareWithDefault("hashAlgorithm",memberValue.hashAlgorithm)&&_MessageImprint.default.compareWithDefault("hashedMessage",memberValue.hashedMessage);case"nonce":return memberValue.isEqual(TimeStampReq.defaultValues(memberName));case"extensions":return memberValue.length===0;default:throw new Error(`Invalid member name for TimeStampReq class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"TimeStampReq",value:[new asn1js.Integer({name:names.version||"TimeStampReq.version"}),_MessageImprint.default.schema(names.messageImprint||{names:{blockName:"TimeStampReq.messageImprint"}}),new asn1js.ObjectIdentifier({name:names.reqPolicy||"TimeStampReq.reqPolicy",optional:true}),new asn1js.Integer({name:names.nonce||"TimeStampReq.nonce",optional:true}),new asn1js.Boolean({name:names.certReq||"TimeStampReq.certReq",optional:true}),new asn1js.Constructed({optional:true,idBlock:{tagClass:3, tagNumber:0
},value:[new asn1js.Repeated({name:names.extensions||"TimeStampReq.extensions",value:_Extension.default.schema()})]})
]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["TimeStampReq.version","TimeStampReq.messageImprint","TimeStampReq.reqPolicy","TimeStampReq.nonce","TimeStampReq.certReq","TimeStampReq.extensions"]);
 const asn1=asn1js.compareSchema(schema,schema,TimeStampReq.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for TimeStampReq");
 this.version=asn1.result["TimeStampReq.version"].valueBlock.valueDec;this.messageImprint=new _MessageImprint.default({schema:asn1.result["TimeStampReq.messageImprint"]});if("TimeStampReq.reqPolicy"in asn1.result)this.reqPolicy=asn1.result["TimeStampReq.reqPolicy"].valueBlock.toString();if("TimeStampReq.nonce"in asn1.result)this.nonce=asn1.result["TimeStampReq.nonce"];if("TimeStampReq.certReq"in asn1.result)this.certReq=asn1.result["TimeStampReq.certReq"].valueBlock.value;if("TimeStampReq.extensions"in asn1.result)this.extensions=Array.from(asn1.result["TimeStampReq.extensions"],element=>new _Extension.default({schema:element}));}
toSchema(){ const outputArray=[];outputArray.push(new asn1js.Integer({value:this.version}));outputArray.push(this.messageImprint.toSchema());if("reqPolicy"in this)outputArray.push(new asn1js.ObjectIdentifier({value:this.reqPolicy}));if("nonce"in this)outputArray.push(this.nonce);if("certReq"in this&&TimeStampReq.compareWithDefault("certReq",this.certReq)===false)outputArray.push(new asn1js.Boolean({value:this.certReq})); if("extensions"in this){outputArray.push(new asn1js.Constructed({idBlock:{tagClass:3, tagNumber:0
},value:Array.from(this.extensions,element=>element.toSchema())}));}

 
return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={version:this.version,messageImprint:this.messageImprint.toJSON()};if("reqPolicy"in this)_object.reqPolicy=this.reqPolicy;if("nonce"in this)_object.nonce=this.nonce.toJSON();if("certReq"in this&&TimeStampReq.compareWithDefault("certReq",this.certReq)===false)_object.certReq=this.certReq;if("extensions"in this)_object.extensions=Array.from(this.extensions,element=>element.toJSON());return _object;}
}
exports.default=TimeStampReq;},{"./Extension.js":38,"./MessageImprint.js":53,"asn1js":112,"pvutils":113}],109:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=void 0;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _PKIStatusInfo=_interopRequireDefault(require("./PKIStatusInfo.js"));var _ContentInfo=_interopRequireDefault(require("./ContentInfo.js"));var _SignedData=_interopRequireDefault(require("./SignedData.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
class TimeStampResp{constructor(parameters={}){ this.status=(0,_pvutils.getParametersValue)(parameters,"status",TimeStampResp.defaultValues("status"));if("timeStampToken"in parameters)
this.timeStampToken=(0,_pvutils.getParametersValue)(parameters,"timeStampToken",TimeStampResp.defaultValues("timeStampToken"));
 if("schema"in parameters)this.fromSchema(parameters.schema);}
static defaultValues(memberName){switch(memberName){case"status":return new _PKIStatusInfo.default();case"timeStampToken":return new _ContentInfo.default();default:throw new Error(`Invalid member name for TimeStampResp class: ${memberName}`);}}
static compareWithDefault(memberName,memberValue){switch(memberName){case"status":return _PKIStatusInfo.default.compareWithDefault("status",memberValue.status)&&"statusStrings"in memberValue===false&&"failInfo"in memberValue===false;case"timeStampToken":return memberValue.contentType===""&&memberValue.content instanceof asn1js.Any;default:throw new Error(`Invalid member name for TimeStampResp class: ${memberName}`);}}
static schema(parameters={}){const names=(0,_pvutils.getParametersValue)(parameters,"names",{});return new asn1js.Sequence({name:names.blockName||"TimeStampResp",value:[_PKIStatusInfo.default.schema(names.status||{names:{blockName:"TimeStampResp.status"}}),_ContentInfo.default.schema(names.timeStampToken||{names:{blockName:"TimeStampResp.timeStampToken",optional:true}})]});}
fromSchema(schema){(0,_pvutils.clearProps)(schema,["TimeStampResp.status","TimeStampResp.timeStampToken"]);
 const asn1=asn1js.compareSchema(schema,schema,TimeStampResp.schema());if(asn1.verified===false)throw new Error("Object's schema was not verified against input data for TimeStampResp");
 this.status=new _PKIStatusInfo.default({schema:asn1.result["TimeStampResp.status"]});if("TimeStampResp.timeStampToken"in asn1.result)this.timeStampToken=new _ContentInfo.default({schema:asn1.result["TimeStampResp.timeStampToken"]});}
toSchema(){ const outputArray=[];outputArray.push(this.status.toSchema());if("timeStampToken"in this)outputArray.push(this.timeStampToken.toSchema());
 return new asn1js.Sequence({value:outputArray});}
toJSON(){const _object={status:this.status};if("timeStampToken"in this)_object.timeStampToken=this.timeStampToken.toJSON();return _object;}
sign(privateKey,hashAlgorithm){ if("timeStampToken"in this===false)return Promise.reject("timeStampToken is absent in TSP response");
 if(this.timeStampToken.contentType!=="1.2.840.113549.1.7.2") 
return Promise.reject(`Wrong format of timeStampToken: ${this.timeStampToken.contentType}`);
 const signed=new _ContentInfo.default({schema:this.timeStampToken.content});return signed.sign(privateKey,0,hashAlgorithm);}
verify(verificationParameters={signer:0,trustedCerts:[],data:new ArrayBuffer(0)}){ if("timeStampToken"in this===false)return Promise.reject("timeStampToken is absent in TSP response");
 if(this.timeStampToken.contentType!=="1.2.840.113549.1.7.2") 
return Promise.reject(`Wrong format of timeStampToken: ${this.timeStampToken.contentType}`);
 const signed=new _SignedData.default({schema:this.timeStampToken.content});return signed.verify(verificationParameters);}
}
exports.default=TimeStampResp;},{"./ContentInfo.js":26,"./PKIStatusInfo.js":69,"./SignedData.js":101,"asn1js":112,"pvutils":113}],110:[function(require,module,exports){(function(process,global){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.setEngine=setEngine;exports.getEngine=getEngine;exports.getCrypto=getCrypto;exports.getRandomValues=getRandomValues;exports.getOIDByAlgorithm=getOIDByAlgorithm;exports.getAlgorithmParameters=getAlgorithmParameters;exports.createCMSECDSASignature=createCMSECDSASignature;exports.stringPrep=stringPrep;exports.createECDSASignatureFromCMS=createECDSASignatureFromCMS;exports.getAlgorithmByOID=getAlgorithmByOID;exports.getHashAlgorithm=getHashAlgorithm;exports.kdfWithCounter=kdfWithCounter;exports.kdf=kdf;var asn1js=_interopRequireWildcard(require("asn1js"));var _pvutils=require("pvutils");var _CryptoEngine=_interopRequireDefault(require("./CryptoEngine.js"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}
function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}

let engine={name:"none",crypto:null,subtle:null};function setEngine(name,crypto,subtle){
 if(typeof process!=="undefined"&&"pid"in process&&typeof global!=="undefined"&&typeof window==="undefined"){ if(typeof global[process.pid]==="undefined"){ global[process.pid]={};}else{ if(typeof global[process.pid]!=="object"){ throw new Error(`Name global.${process.pid} already exists and it is not an object`);}} 
if(typeof global[process.pid].pkijs==="undefined"){ global[process.pid].pkijs={};}else{ if(typeof global[process.pid].pkijs!=="object"){ throw new Error(`Name global.${process.pid}.pkijs already exists and it is not an object`);}} 
global[process.pid].pkijs.engine={name:name,crypto:crypto,subtle:subtle};}
 
else{engine={name:name,crypto:crypto,subtle:subtle};}
}
function getEngine(){
 if(typeof process!=="undefined"&&"pid"in process&&typeof global!=="undefined"&&typeof window==="undefined"){let _engine;try{ _engine=global[process.pid].pkijs.engine;}catch(ex){throw new Error("Please call \"setEngine\" before call to \"getEngine\"");}
return _engine;} 
return engine;}
(function initCryptoEngine(){if(typeof self!=="undefined"){if("crypto"in self){let engineName="webcrypto";const cryptoObject=self.crypto;let subtleObject; if("webkitSubtle"in self.crypto){try{subtleObject=self.crypto.webkitSubtle;}catch(ex){subtleObject=self.crypto.subtle;}
engineName="safari";}
if("subtle"in self.crypto)subtleObject=self.crypto.subtle;if(typeof subtleObject==="undefined"){engine={name:engineName,crypto:cryptoObject,subtle:null};}else{engine={name:engineName,crypto:cryptoObject,subtle:new _CryptoEngine.default({name:engineName,crypto:self.crypto,subtle:subtleObject})};}}}
setEngine(engine.name,engine.crypto,engine.subtle);})();

function getCrypto(){const _engine=getEngine();if(_engine.subtle!==null)return _engine.subtle;return undefined;}
function getRandomValues(view){return getEngine().subtle.getRandomValues(view);}
function getOIDByAlgorithm(algorithm){return getEngine().subtle.getOIDByAlgorithm(algorithm);}
function getAlgorithmParameters(algorithmName,operation){return getEngine().subtle.getAlgorithmParameters(algorithmName,operation);}
function createCMSECDSASignature(signatureBuffer){ if(signatureBuffer.byteLength%2!==0)return new ArrayBuffer(0);
 const length=signatureBuffer.byteLength/2; const rBuffer=new ArrayBuffer(length);const rView=new Uint8Array(rBuffer);rView.set(new Uint8Array(signatureBuffer,0,length));const rInteger=new asn1js.Integer({valueHex:rBuffer});const sBuffer=new ArrayBuffer(length);const sView=new Uint8Array(sBuffer);sView.set(new Uint8Array(signatureBuffer,length,length));const sInteger=new asn1js.Integer({valueHex:sBuffer}); return new asn1js.Sequence({value:[rInteger.convertToDER(),sInteger.convertToDER()]}).toBER(false);}
function stringPrep(inputString){ let isSpace=false;let cuttedResult=""; const result=inputString.trim();
 for(let i=0;i<result.length;i++){if(result.charCodeAt(i)===32){if(isSpace===false)isSpace=true;}else{if(isSpace){cuttedResult+=" ";isSpace=false;}
cuttedResult+=result[i];}} 
return cuttedResult.toLowerCase();}
function createECDSASignatureFromCMS(cmsSignature){ if(cmsSignature instanceof asn1js.Sequence===false)return new ArrayBuffer(0);if(cmsSignature.valueBlock.value.length!==2)return new ArrayBuffer(0);if(cmsSignature.valueBlock.value[0]instanceof asn1js.Integer===false)return new ArrayBuffer(0);if(cmsSignature.valueBlock.value[1]instanceof asn1js.Integer===false)return new ArrayBuffer(0); const rValue=cmsSignature.valueBlock.value[0].convertFromDER();const sValue=cmsSignature.valueBlock.value[1].convertFromDER(); switch(true){case rValue.valueBlock.valueHex.byteLength<sValue.valueBlock.valueHex.byteLength:{if(sValue.valueBlock.valueHex.byteLength-rValue.valueBlock.valueHex.byteLength!==1)throw new Error("Incorrect DER integer decoding");const correctedLength=sValue.valueBlock.valueHex.byteLength;const rValueView=new Uint8Array(rValue.valueBlock.valueHex);const rValueBufferCorrected=new ArrayBuffer(correctedLength);const rValueViewCorrected=new Uint8Array(rValueBufferCorrected);rValueViewCorrected.set(rValueView,1);rValueViewCorrected[0]=0x00; return(0,_pvutils.utilConcatBuf)(rValueBufferCorrected,sValue.valueBlock.valueHex);}
case rValue.valueBlock.valueHex.byteLength>sValue.valueBlock.valueHex.byteLength:{if(rValue.valueBlock.valueHex.byteLength-sValue.valueBlock.valueHex.byteLength!==1)throw new Error("Incorrect DER integer decoding");const correctedLength=rValue.valueBlock.valueHex.byteLength;const sValueView=new Uint8Array(sValue.valueBlock.valueHex);const sValueBufferCorrected=new ArrayBuffer(correctedLength);const sValueViewCorrected=new Uint8Array(sValueBufferCorrected);sValueViewCorrected.set(sValueView,1);sValueViewCorrected[0]=0x00; return(0,_pvutils.utilConcatBuf)(rValue.valueBlock.valueHex,sValueBufferCorrected);}
default:{ if(rValue.valueBlock.valueHex.byteLength%2){const correctedLength=rValue.valueBlock.valueHex.byteLength+1;const rValueView=new Uint8Array(rValue.valueBlock.valueHex);const rValueBufferCorrected=new ArrayBuffer(correctedLength);const rValueViewCorrected=new Uint8Array(rValueBufferCorrected);rValueViewCorrected.set(rValueView,1);rValueViewCorrected[0]=0x00; const sValueView=new Uint8Array(sValue.valueBlock.valueHex);const sValueBufferCorrected=new ArrayBuffer(correctedLength);const sValueViewCorrected=new Uint8Array(sValueBufferCorrected);sValueViewCorrected.set(sValueView,1);sValueViewCorrected[0]=0x00; return(0,_pvutils.utilConcatBuf)(rValueBufferCorrected,sValueBufferCorrected);}
}} 
return(0,_pvutils.utilConcatBuf)(rValue.valueBlock.valueHex,sValue.valueBlock.valueHex);}
function getAlgorithmByOID(oid){return getEngine().subtle.getAlgorithmByOID(oid);}
function getHashAlgorithm(signatureAlgorithm){return getEngine().subtle.getHashAlgorithm(signatureAlgorithm);}
function kdfWithCounter(hashFunction,Zbuffer,Counter,SharedInfo){ switch(hashFunction.toUpperCase()){case"SHA-1":case"SHA-256":case"SHA-384":case"SHA-512":break;default:return Promise.reject(`Unknown hash function: ${hashFunction}`);}
if(Zbuffer instanceof ArrayBuffer===false)return Promise.reject("Please set \"Zbuffer\" as \"ArrayBuffer\"");if(Zbuffer.byteLength===0)return Promise.reject("\"Zbuffer\" has zero length, error");if(SharedInfo instanceof ArrayBuffer===false)return Promise.reject("Please set \"SharedInfo\" as \"ArrayBuffer\"");if(Counter>255)return Promise.reject("Please set \"Counter\" variable to value less or equal to 255");
 const counterBuffer=new ArrayBuffer(4);const counterView=new Uint8Array(counterBuffer);counterView[0]=0x00;counterView[1]=0x00;counterView[2]=0x00;counterView[3]=Counter;let combinedBuffer=new ArrayBuffer(0);
 const crypto=getCrypto();if(typeof crypto==="undefined")return Promise.reject("Unable to create WebCrypto object");
 combinedBuffer=(0,_pvutils.utilConcatBuf)(combinedBuffer,Zbuffer);combinedBuffer=(0,_pvutils.utilConcatBuf)(combinedBuffer,counterBuffer);combinedBuffer=(0,_pvutils.utilConcatBuf)(combinedBuffer,SharedInfo);
 return crypto.digest({name:hashFunction},combinedBuffer).then(result=>({counter:Counter,result}));}
function kdf(hashFunction,Zbuffer,keydatalen,SharedInfo){ let hashLength=0;let maxCounter=1;const kdfArray=[];
 switch(hashFunction.toUpperCase()){case"SHA-1":hashLength=160; break;case"SHA-256":hashLength=256; break;case"SHA-384":hashLength=384; break;case"SHA-512":hashLength=512; break;default:return Promise.reject(`Unknown hash function: ${hashFunction}`);}
if(Zbuffer instanceof ArrayBuffer===false)return Promise.reject("Please set \"Zbuffer\" as \"ArrayBuffer\"");if(Zbuffer.byteLength===0)return Promise.reject("\"Zbuffer\" has zero length, error");if(SharedInfo instanceof ArrayBuffer===false)return Promise.reject("Please set \"SharedInfo\" as \"ArrayBuffer\"");
 const quotient=keydatalen/hashLength;if(Math.floor(quotient)>0){maxCounter=Math.floor(quotient);if(quotient-maxCounter>0)maxCounter++;}

for(let i=1;i<=maxCounter;i++)kdfArray.push(kdfWithCounter(hashFunction,Zbuffer,i,SharedInfo));
 return Promise.all(kdfArray).then(incomingResult=>{ let combinedBuffer=new ArrayBuffer(0);let currentCounter=1;let found=true;
 while(found){found=false;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=incomingResult[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){const result=_step.value;if(result.counter===currentCounter){combinedBuffer=(0,_pvutils.utilConcatBuf)(combinedBuffer,result.result);found=true;break;}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return!=null){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}
currentCounter++;}
 
keydatalen>>=3; if(combinedBuffer.byteLength>keydatalen){const newBuffer=new ArrayBuffer(keydatalen);const newView=new Uint8Array(newBuffer);const combinedView=new Uint8Array(combinedBuffer);for(let i=0;i<keydatalen;i++)newView[i]=combinedView[i];return newBuffer;}
return combinedBuffer;});}

}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./CryptoEngine.js":27,"_process":114,"asn1js":112,"pvutils":113}],111:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});Object.defineProperty(exports,"setEngine",{enumerable:true,get:function get(){return _common.setEngine;}});Object.defineProperty(exports,"getEngine",{enumerable:true,get:function get(){return _common.getEngine;}});Object.defineProperty(exports,"getCrypto",{enumerable:true,get:function get(){return _common.getCrypto;}});Object.defineProperty(exports,"getRandomValues",{enumerable:true,get:function get(){return _common.getRandomValues;}});Object.defineProperty(exports,"getOIDByAlgorithm",{enumerable:true,get:function get(){return _common.getOIDByAlgorithm;}});Object.defineProperty(exports,"getAlgorithmParameters",{enumerable:true,get:function get(){return _common.getAlgorithmParameters;}});Object.defineProperty(exports,"createCMSECDSASignature",{enumerable:true,get:function get(){return _common.createCMSECDSASignature;}});Object.defineProperty(exports,"stringPrep",{enumerable:true,get:function get(){return _common.stringPrep;}});Object.defineProperty(exports,"createECDSASignatureFromCMS",{enumerable:true,get:function get(){return _common.createECDSASignatureFromCMS;}});Object.defineProperty(exports,"getAlgorithmByOID",{enumerable:true,get:function get(){return _common.getAlgorithmByOID;}});Object.defineProperty(exports,"getHashAlgorithm",{enumerable:true,get:function get(){return _common.getHashAlgorithm;}});Object.defineProperty(exports,"kdfWithCounter",{enumerable:true,get:function get(){return _common.kdfWithCounter;}});Object.defineProperty(exports,"kdf",{enumerable:true,get:function get(){return _common.kdf;}});Object.defineProperty(exports,"AccessDescription",{enumerable:true,get:function get(){return _AccessDescription.default;}});Object.defineProperty(exports,"Accuracy",{enumerable:true,get:function get(){return _Accuracy.default;}});Object.defineProperty(exports,"AlgorithmIdentifier",{enumerable:true,get:function get(){return _AlgorithmIdentifier.default;}});Object.defineProperty(exports,"AltName",{enumerable:true,get:function get(){return _AltName.default;}});Object.defineProperty(exports,"Attribute",{enumerable:true,get:function get(){return _Attribute.default;}});Object.defineProperty(exports,"AttributeTypeAndValue",{enumerable:true,get:function get(){return _AttributeTypeAndValue.default;}});Object.defineProperty(exports,"AuthenticatedSafe",{enumerable:true,get:function get(){return _AuthenticatedSafe.default;}});Object.defineProperty(exports,"AuthorityKeyIdentifier",{enumerable:true,get:function get(){return _AuthorityKeyIdentifier.default;}});Object.defineProperty(exports,"BasicConstraints",{enumerable:true,get:function get(){return _BasicConstraints.default;}});Object.defineProperty(exports,"BasicOCSPResponse",{enumerable:true,get:function get(){return _BasicOCSPResponse.default;}});Object.defineProperty(exports,"CRLBag",{enumerable:true,get:function get(){return _CRLBag.default;}});Object.defineProperty(exports,"CRLDistributionPoints",{enumerable:true,get:function get(){return _CRLDistributionPoints.default;}});Object.defineProperty(exports,"CertBag",{enumerable:true,get:function get(){return _CertBag.default;}});Object.defineProperty(exports,"CertID",{enumerable:true,get:function get(){return _CertID.default;}});Object.defineProperty(exports,"Certificate",{enumerable:true,get:function get(){return _Certificate.default;}});Object.defineProperty(exports,"CertificateChainValidationEngine",{enumerable:true,get:function get(){return _CertificateChainValidationEngine.default;}});Object.defineProperty(exports,"CertificatePolicies",{enumerable:true,get:function get(){return _CertificatePolicies.default;}});Object.defineProperty(exports,"CertificateRevocationList",{enumerable:true,get:function get(){return _CertificateRevocationList.default;}});Object.defineProperty(exports,"CertificateSet",{enumerable:true,get:function get(){return _CertificateSet.default;}});Object.defineProperty(exports,"CertificationRequest",{enumerable:true,get:function get(){return _CertificationRequest.default;}});Object.defineProperty(exports,"ContentInfo",{enumerable:true,get:function get(){return _ContentInfo.default;}});Object.defineProperty(exports,"CryptoEngine",{enumerable:true,get:function get(){return _CryptoEngine.default;}});Object.defineProperty(exports,"DigestInfo",{enumerable:true,get:function get(){return _DigestInfo.default;}});Object.defineProperty(exports,"DistributionPoint",{enumerable:true,get:function get(){return _DistributionPoint.default;}});Object.defineProperty(exports,"ECCCMSSharedInfo",{enumerable:true,get:function get(){return _ECCCMSSharedInfo.default;}});Object.defineProperty(exports,"ECPrivateKey",{enumerable:true,get:function get(){return _ECPrivateKey.default;}});Object.defineProperty(exports,"ECPublicKey",{enumerable:true,get:function get(){return _ECPublicKey.default;}});Object.defineProperty(exports,"EncapsulatedContentInfo",{enumerable:true,get:function get(){return _EncapsulatedContentInfo.default;}});Object.defineProperty(exports,"EncryptedContentInfo",{enumerable:true,get:function get(){return _EncryptedContentInfo.default;}});Object.defineProperty(exports,"EncryptedData",{enumerable:true,get:function get(){return _EncryptedData.default;}});Object.defineProperty(exports,"EnvelopedData",{enumerable:true,get:function get(){return _EnvelopedData.default;}});Object.defineProperty(exports,"ExtKeyUsage",{enumerable:true,get:function get(){return _ExtKeyUsage.default;}});Object.defineProperty(exports,"Extension",{enumerable:true,get:function get(){return _Extension.default;}});Object.defineProperty(exports,"Extensions",{enumerable:true,get:function get(){return _Extensions.default;}});Object.defineProperty(exports,"GeneralName",{enumerable:true,get:function get(){return _GeneralName.default;}});Object.defineProperty(exports,"GeneralNames",{enumerable:true,get:function get(){return _GeneralNames.default;}});Object.defineProperty(exports,"GeneralSubtree",{enumerable:true,get:function get(){return _GeneralSubtree.default;}});Object.defineProperty(exports,"InfoAccess",{enumerable:true,get:function get(){return _InfoAccess.default;}});Object.defineProperty(exports,"IssuerAndSerialNumber",{enumerable:true,get:function get(){return _IssuerAndSerialNumber.default;}});Object.defineProperty(exports,"IssuingDistributionPoint",{enumerable:true,get:function get(){return _IssuingDistributionPoint.default;}});Object.defineProperty(exports,"KEKIdentifier",{enumerable:true,get:function get(){return _KEKIdentifier.default;}});Object.defineProperty(exports,"KEKRecipientInfo",{enumerable:true,get:function get(){return _KEKRecipientInfo.default;}});Object.defineProperty(exports,"KeyAgreeRecipientIdentifier",{enumerable:true,get:function get(){return _KeyAgreeRecipientIdentifier.default;}});Object.defineProperty(exports,"KeyAgreeRecipientInfo",{enumerable:true,get:function get(){return _KeyAgreeRecipientInfo.default;}});Object.defineProperty(exports,"KeyBag",{enumerable:true,get:function get(){return _KeyBag.default;}});Object.defineProperty(exports,"KeyTransRecipientInfo",{enumerable:true,get:function get(){return _KeyTransRecipientInfo.default;}});Object.defineProperty(exports,"MacData",{enumerable:true,get:function get(){return _MacData.default;}});Object.defineProperty(exports,"MessageImprint",{enumerable:true,get:function get(){return _MessageImprint.default;}});Object.defineProperty(exports,"NameConstraints",{enumerable:true,get:function get(){return _NameConstraints.default;}});Object.defineProperty(exports,"OCSPRequest",{enumerable:true,get:function get(){return _OCSPRequest.default;}});Object.defineProperty(exports,"OCSPResponse",{enumerable:true,get:function get(){return _OCSPResponse.default;}});Object.defineProperty(exports,"OriginatorIdentifierOrKey",{enumerable:true,get:function get(){return _OriginatorIdentifierOrKey.default;}});Object.defineProperty(exports,"OriginatorInfo",{enumerable:true,get:function get(){return _OriginatorInfo.default;}});Object.defineProperty(exports,"OriginatorPublicKey",{enumerable:true,get:function get(){return _OriginatorPublicKey.default;}});Object.defineProperty(exports,"OtherCertificateFormat",{enumerable:true,get:function get(){return _OtherCertificateFormat.default;}});Object.defineProperty(exports,"OtherKeyAttribute",{enumerable:true,get:function get(){return _OtherKeyAttribute.default;}});Object.defineProperty(exports,"OtherPrimeInfo",{enumerable:true,get:function get(){return _OtherPrimeInfo.default;}});Object.defineProperty(exports,"OtherRecipientInfo",{enumerable:true,get:function get(){return _OtherRecipientInfo.default;}});Object.defineProperty(exports,"OtherRevocationInfoFormat",{enumerable:true,get:function get(){return _OtherRevocationInfoFormat.default;}});Object.defineProperty(exports,"PBES2Params",{enumerable:true,get:function get(){return _PBES2Params.default;}});Object.defineProperty(exports,"PBKDF2Params",{enumerable:true,get:function get(){return _PBKDF2Params.default;}});Object.defineProperty(exports,"PFX",{enumerable:true,get:function get(){return _PFX.default;}});Object.defineProperty(exports,"PKCS8ShroudedKeyBag",{enumerable:true,get:function get(){return _PKCS8ShroudedKeyBag.default;}});Object.defineProperty(exports,"PKIStatusInfo",{enumerable:true,get:function get(){return _PKIStatusInfo.default;}});Object.defineProperty(exports,"PasswordRecipientinfo",{enumerable:true,get:function get(){return _PasswordRecipientinfo.default;}});Object.defineProperty(exports,"PolicyConstraints",{enumerable:true,get:function get(){return _PolicyConstraints.default;}});Object.defineProperty(exports,"PolicyInformation",{enumerable:true,get:function get(){return _PolicyInformation.default;}});Object.defineProperty(exports,"PolicyMapping",{enumerable:true,get:function get(){return _PolicyMapping.default;}});Object.defineProperty(exports,"PolicyMappings",{enumerable:true,get:function get(){return _PolicyMappings.default;}});Object.defineProperty(exports,"PolicyQualifierInfo",{enumerable:true,get:function get(){return _PolicyQualifierInfo.default;}});Object.defineProperty(exports,"PrivateKeyInfo",{enumerable:true,get:function get(){return _PrivateKeyInfo.default;}});Object.defineProperty(exports,"PrivateKeyUsagePeriod",{enumerable:true,get:function get(){return _PrivateKeyUsagePeriod.default;}});Object.defineProperty(exports,"PublicKeyInfo",{enumerable:true,get:function get(){return _PublicKeyInfo.default;}});Object.defineProperty(exports,"RSAESOAEPParams",{enumerable:true,get:function get(){return _RSAESOAEPParams.default;}});Object.defineProperty(exports,"RSAPrivateKey",{enumerable:true,get:function get(){return _RSAPrivateKey.default;}});Object.defineProperty(exports,"RSAPublicKey",{enumerable:true,get:function get(){return _RSAPublicKey.default;}});Object.defineProperty(exports,"RSASSAPSSParams",{enumerable:true,get:function get(){return _RSASSAPSSParams.default;}});Object.defineProperty(exports,"RecipientEncryptedKey",{enumerable:true,get:function get(){return _RecipientEncryptedKey.default;}});Object.defineProperty(exports,"RecipientEncryptedKeys",{enumerable:true,get:function get(){return _RecipientEncryptedKeys.default;}});Object.defineProperty(exports,"RecipientIdentifier",{enumerable:true,get:function get(){return _RecipientIdentifier.default;}});Object.defineProperty(exports,"RecipientInfo",{enumerable:true,get:function get(){return _RecipientInfo.default;}});Object.defineProperty(exports,"RecipientKeyIdentifier",{enumerable:true,get:function get(){return _RecipientKeyIdentifier.default;}});Object.defineProperty(exports,"RelativeDistinguishedNames",{enumerable:true,get:function get(){return _RelativeDistinguishedNames.default;}});Object.defineProperty(exports,"Request",{enumerable:true,get:function get(){return _Request.default;}});Object.defineProperty(exports,"ResponseBytes",{enumerable:true,get:function get(){return _ResponseBytes.default;}});Object.defineProperty(exports,"ResponseData",{enumerable:true,get:function get(){return _ResponseData.default;}});Object.defineProperty(exports,"RevocationInfoChoices",{enumerable:true,get:function get(){return _RevocationInfoChoices.default;}});Object.defineProperty(exports,"RevokedCertificate",{enumerable:true,get:function get(){return _RevokedCertificate.default;}});Object.defineProperty(exports,"SafeBag",{enumerable:true,get:function get(){return _SafeBag.default;}});Object.defineProperty(exports,"SafeContents",{enumerable:true,get:function get(){return _SafeContents.default;}});Object.defineProperty(exports,"SecretBag",{enumerable:true,get:function get(){return _SecretBag.default;}});Object.defineProperty(exports,"Signature",{enumerable:true,get:function get(){return _Signature.default;}});Object.defineProperty(exports,"SignedAndUnsignedAttributes",{enumerable:true,get:function get(){return _SignedAndUnsignedAttributes.default;}});Object.defineProperty(exports,"SignedData",{enumerable:true,get:function get(){return _SignedData.default;}});Object.defineProperty(exports,"SignerInfo",{enumerable:true,get:function get(){return _SignerInfo.default;}});Object.defineProperty(exports,"SingleResponse",{enumerable:true,get:function get(){return _SingleResponse.default;}});Object.defineProperty(exports,"SubjectDirectoryAttributes",{enumerable:true,get:function get(){return _SubjectDirectoryAttributes.default;}});Object.defineProperty(exports,"TBSRequest",{enumerable:true,get:function get(){return _TBSRequest.default;}});Object.defineProperty(exports,"TSTInfo",{enumerable:true,get:function get(){return _TSTInfo.default;}});Object.defineProperty(exports,"Time",{enumerable:true,get:function get(){return _Time.default;}});Object.defineProperty(exports,"TimeStampReq",{enumerable:true,get:function get(){return _TimeStampReq.default;}});Object.defineProperty(exports,"TimeStampResp",{enumerable:true,get:function get(){return _TimeStampResp.default;}});Object.defineProperty(exports,"SignedCertificateTimestampList",{enumerable:true,get:function get(){return _SignedCertificateTimestampList.default;}});Object.defineProperty(exports,"SignedCertificateTimestamp",{enumerable:true,get:function get(){return _SignedCertificateTimestampList.SignedCertificateTimestamp;}});Object.defineProperty(exports,"verifySCTsForCertificate",{enumerable:true,get:function get(){return _SignedCertificateTimestampList.verifySCTsForCertificate;}});Object.defineProperty(exports,"CertificateTemplate",{enumerable:true,get:function get(){return _CertificateTemplate.default;}});Object.defineProperty(exports,"CAVersion",{enumerable:true,get:function get(){return _CAVersion.default;}});Object.defineProperty(exports,"QCStatements",{enumerable:true,get:function get(){return _CAVersion.default;}});Object.defineProperty(exports,"QCStatement",{enumerable:true,get:function get(){return _QCStatements.QCStatement;}});var _common=require("./common.js");var _AccessDescription=_interopRequireDefault(require("./AccessDescription.js"));var _Accuracy=_interopRequireDefault(require("./Accuracy.js"));var _AlgorithmIdentifier=_interopRequireDefault(require("./AlgorithmIdentifier.js"));var _AltName=_interopRequireDefault(require("./AltName.js"));var _Attribute=_interopRequireDefault(require("./Attribute.js"));var _AttributeTypeAndValue=_interopRequireDefault(require("./AttributeTypeAndValue.js"));var _AuthenticatedSafe=_interopRequireDefault(require("./AuthenticatedSafe.js"));var _AuthorityKeyIdentifier=_interopRequireDefault(require("./AuthorityKeyIdentifier.js"));var _BasicConstraints=_interopRequireDefault(require("./BasicConstraints.js"));var _BasicOCSPResponse=_interopRequireDefault(require("./BasicOCSPResponse.js"));var _CRLBag=_interopRequireDefault(require("./CRLBag.js"));var _CRLDistributionPoints=_interopRequireDefault(require("./CRLDistributionPoints.js"));var _CertBag=_interopRequireDefault(require("./CertBag.js"));var _CertID=_interopRequireDefault(require("./CertID.js"));var _Certificate=_interopRequireDefault(require("./Certificate.js"));var _CertificateChainValidationEngine=_interopRequireDefault(require("./CertificateChainValidationEngine.js"));var _CertificatePolicies=_interopRequireDefault(require("./CertificatePolicies.js"));var _CertificateRevocationList=_interopRequireDefault(require("./CertificateRevocationList.js"));var _CertificateSet=_interopRequireDefault(require("./CertificateSet.js"));var _CertificationRequest=_interopRequireDefault(require("./CertificationRequest.js"));var _ContentInfo=_interopRequireDefault(require("./ContentInfo.js"));var _CryptoEngine=_interopRequireDefault(require("./CryptoEngine.js"));var _DigestInfo=_interopRequireDefault(require("./DigestInfo.js"));var _DistributionPoint=_interopRequireDefault(require("./DistributionPoint.js"));var _ECCCMSSharedInfo=_interopRequireDefault(require("./ECCCMSSharedInfo.js"));var _ECPrivateKey=_interopRequireDefault(require("./ECPrivateKey.js"));var _ECPublicKey=_interopRequireDefault(require("./ECPublicKey.js"));var _EncapsulatedContentInfo=_interopRequireDefault(require("./EncapsulatedContentInfo.js"));var _EncryptedContentInfo=_interopRequireDefault(require("./EncryptedContentInfo.js"));var _EncryptedData=_interopRequireDefault(require("./EncryptedData.js"));var _EnvelopedData=_interopRequireDefault(require("./EnvelopedData.js"));var _ExtKeyUsage=_interopRequireDefault(require("./ExtKeyUsage.js"));var _Extension=_interopRequireDefault(require("./Extension.js"));var _Extensions=_interopRequireDefault(require("./Extensions.js"));var _GeneralName=_interopRequireDefault(require("./GeneralName.js"));var _GeneralNames=_interopRequireDefault(require("./GeneralNames.js"));var _GeneralSubtree=_interopRequireDefault(require("./GeneralSubtree.js"));var _InfoAccess=_interopRequireDefault(require("./InfoAccess.js"));var _IssuerAndSerialNumber=_interopRequireDefault(require("./IssuerAndSerialNumber.js"));var _IssuingDistributionPoint=_interopRequireDefault(require("./IssuingDistributionPoint.js"));var _KEKIdentifier=_interopRequireDefault(require("./KEKIdentifier.js"));var _KEKRecipientInfo=_interopRequireDefault(require("./KEKRecipientInfo.js"));var _KeyAgreeRecipientIdentifier=_interopRequireDefault(require("./KeyAgreeRecipientIdentifier.js"));var _KeyAgreeRecipientInfo=_interopRequireDefault(require("./KeyAgreeRecipientInfo.js"));var _KeyBag=_interopRequireDefault(require("./KeyBag.js"));var _KeyTransRecipientInfo=_interopRequireDefault(require("./KeyTransRecipientInfo.js"));var _MacData=_interopRequireDefault(require("./MacData.js"));var _MessageImprint=_interopRequireDefault(require("./MessageImprint.js"));var _NameConstraints=_interopRequireDefault(require("./NameConstraints.js"));var _OCSPRequest=_interopRequireDefault(require("./OCSPRequest.js"));var _OCSPResponse=_interopRequireDefault(require("./OCSPResponse.js"));var _OriginatorIdentifierOrKey=_interopRequireDefault(require("./OriginatorIdentifierOrKey.js"));var _OriginatorInfo=_interopRequireDefault(require("./OriginatorInfo.js"));var _OriginatorPublicKey=_interopRequireDefault(require("./OriginatorPublicKey.js"));var _OtherCertificateFormat=_interopRequireDefault(require("./OtherCertificateFormat.js"));var _OtherKeyAttribute=_interopRequireDefault(require("./OtherKeyAttribute.js"));var _OtherPrimeInfo=_interopRequireDefault(require("./OtherPrimeInfo.js"));var _OtherRecipientInfo=_interopRequireDefault(require("./OtherRecipientInfo.js"));var _OtherRevocationInfoFormat=_interopRequireDefault(require("./OtherRevocationInfoFormat.js"));var _PBES2Params=_interopRequireDefault(require("./PBES2Params.js"));var _PBKDF2Params=_interopRequireDefault(require("./PBKDF2Params.js"));var _PFX=_interopRequireDefault(require("./PFX.js"));var _PKCS8ShroudedKeyBag=_interopRequireDefault(require("./PKCS8ShroudedKeyBag.js"));var _PKIStatusInfo=_interopRequireDefault(require("./PKIStatusInfo.js"));var _PasswordRecipientinfo=_interopRequireDefault(require("./PasswordRecipientinfo.js"));var _PolicyConstraints=_interopRequireDefault(require("./PolicyConstraints.js"));var _PolicyInformation=_interopRequireDefault(require("./PolicyInformation.js"));var _PolicyMapping=_interopRequireDefault(require("./PolicyMapping.js"));var _PolicyMappings=_interopRequireDefault(require("./PolicyMappings.js"));var _PolicyQualifierInfo=_interopRequireDefault(require("./PolicyQualifierInfo.js"));var _PrivateKeyInfo=_interopRequireDefault(require("./PrivateKeyInfo.js"));var _PrivateKeyUsagePeriod=_interopRequireDefault(require("./PrivateKeyUsagePeriod.js"));var _PublicKeyInfo=_interopRequireDefault(require("./PublicKeyInfo.js"));var _RSAESOAEPParams=_interopRequireDefault(require("./RSAESOAEPParams.js"));var _RSAPrivateKey=_interopRequireDefault(require("./RSAPrivateKey.js"));var _RSAPublicKey=_interopRequireDefault(require("./RSAPublicKey.js"));var _RSASSAPSSParams=_interopRequireDefault(require("./RSASSAPSSParams.js"));var _RecipientEncryptedKey=_interopRequireDefault(require("./RecipientEncryptedKey.js"));var _RecipientEncryptedKeys=_interopRequireDefault(require("./RecipientEncryptedKeys.js"));var _RecipientIdentifier=_interopRequireDefault(require("./RecipientIdentifier.js"));var _RecipientInfo=_interopRequireDefault(require("./RecipientInfo.js"));var _RecipientKeyIdentifier=_interopRequireDefault(require("./RecipientKeyIdentifier.js"));var _RelativeDistinguishedNames=_interopRequireDefault(require("./RelativeDistinguishedNames.js"));var _Request=_interopRequireDefault(require("./Request.js"));var _ResponseBytes=_interopRequireDefault(require("./ResponseBytes.js"));var _ResponseData=_interopRequireDefault(require("./ResponseData.js"));var _RevocationInfoChoices=_interopRequireDefault(require("./RevocationInfoChoices.js"));var _RevokedCertificate=_interopRequireDefault(require("./RevokedCertificate.js"));var _SafeBag=_interopRequireDefault(require("./SafeBag.js"));var _SafeContents=_interopRequireDefault(require("./SafeContents.js"));var _SecretBag=_interopRequireDefault(require("./SecretBag.js"));var _Signature=_interopRequireDefault(require("./Signature.js"));var _SignedAndUnsignedAttributes=_interopRequireDefault(require("./SignedAndUnsignedAttributes.js"));var _SignedData=_interopRequireDefault(require("./SignedData.js"));var _SignerInfo=_interopRequireDefault(require("./SignerInfo.js"));var _SingleResponse=_interopRequireDefault(require("./SingleResponse.js"));var _SubjectDirectoryAttributes=_interopRequireDefault(require("./SubjectDirectoryAttributes.js"));var _TBSRequest=_interopRequireDefault(require("./TBSRequest.js"));var _TSTInfo=_interopRequireDefault(require("./TSTInfo.js"));var _Time=_interopRequireDefault(require("./Time.js"));var _TimeStampReq=_interopRequireDefault(require("./TimeStampReq.js"));var _TimeStampResp=_interopRequireDefault(require("./TimeStampResp.js"));var _SignedCertificateTimestampList=_interopRequireWildcard(require("./SignedCertificateTimestampList.js"));var _CertificateTemplate=_interopRequireDefault(require("./CertificateTemplate.js"));var _CAVersion=_interopRequireDefault(require("./CAVersion.js"));var _QCStatements=require("./QCStatements.js");function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){var desc=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(obj,key):{};if(desc.get||desc.set){Object.defineProperty(newObj,key,desc);}else{newObj[key]=obj[key];}}}}newObj.default=obj;return newObj;}}
function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}},{"./AccessDescription.js":2,"./Accuracy.js":3,"./AlgorithmIdentifier.js":4,"./AltName.js":5,"./Attribute.js":6,"./AttributeTypeAndValue.js":9,"./AuthenticatedSafe.js":10,"./AuthorityKeyIdentifier.js":11,"./BasicConstraints.js":12,"./BasicOCSPResponse.js":13,"./CAVersion.js":14,"./CRLBag.js":15,"./CRLDistributionPoints.js":16,"./CertBag.js":17,"./CertID.js":18,"./Certificate.js":19,"./CertificateChainValidationEngine.js":20,"./CertificatePolicies.js":21,"./CertificateRevocationList.js":22,"./CertificateSet.js":23,"./CertificateTemplate.js":24,"./CertificationRequest.js":25,"./ContentInfo.js":26,"./CryptoEngine.js":27,"./DigestInfo.js":28,"./DistributionPoint.js":29,"./ECCCMSSharedInfo.js":30,"./ECPrivateKey.js":31,"./ECPublicKey.js":32,"./EncapsulatedContentInfo.js":33,"./EncryptedContentInfo.js":34,"./EncryptedData.js":35,"./EnvelopedData.js":36,"./ExtKeyUsage.js":37,"./Extension.js":38,"./Extensions.js":39,"./GeneralName.js":40,"./GeneralNames.js":41,"./GeneralSubtree.js":42,"./InfoAccess.js":43,"./IssuerAndSerialNumber.js":44,"./IssuingDistributionPoint.js":45,"./KEKIdentifier.js":46,"./KEKRecipientInfo.js":47,"./KeyAgreeRecipientIdentifier.js":48,"./KeyAgreeRecipientInfo.js":49,"./KeyBag.js":50,"./KeyTransRecipientInfo.js":51,"./MacData.js":52,"./MessageImprint.js":53,"./NameConstraints.js":54,"./OCSPRequest.js":55,"./OCSPResponse.js":56,"./OriginatorIdentifierOrKey.js":57,"./OriginatorInfo.js":58,"./OriginatorPublicKey.js":59,"./OtherCertificateFormat.js":60,"./OtherKeyAttribute.js":61,"./OtherPrimeInfo.js":62,"./OtherRecipientInfo.js":63,"./OtherRevocationInfoFormat.js":64,"./PBES2Params.js":65,"./PBKDF2Params.js":66,"./PFX.js":67,"./PKCS8ShroudedKeyBag.js":68,"./PKIStatusInfo.js":69,"./PasswordRecipientinfo.js":70,"./PolicyConstraints.js":71,"./PolicyInformation.js":72,"./PolicyMapping.js":73,"./PolicyMappings.js":74,"./PolicyQualifierInfo.js":75,"./PrivateKeyInfo.js":76,"./PrivateKeyUsagePeriod.js":77,"./PublicKeyInfo.js":78,"./QCStatements.js":79,"./RSAESOAEPParams.js":80,"./RSAPrivateKey.js":81,"./RSAPublicKey.js":82,"./RSASSAPSSParams.js":83,"./RecipientEncryptedKey.js":84,"./RecipientEncryptedKeys.js":85,"./RecipientIdentifier.js":86,"./RecipientInfo.js":87,"./RecipientKeyIdentifier.js":88,"./RelativeDistinguishedNames.js":89,"./Request.js":90,"./ResponseBytes.js":91,"./ResponseData.js":92,"./RevocationInfoChoices.js":93,"./RevokedCertificate.js":94,"./SafeBag.js":95,"./SafeContents.js":96,"./SecretBag.js":97,"./Signature.js":98,"./SignedAndUnsignedAttributes.js":99,"./SignedCertificateTimestampList.js":100,"./SignedData.js":101,"./SignerInfo.js":102,"./SingleResponse.js":103,"./SubjectDirectoryAttributes.js":104,"./TBSRequest.js":105,"./TSTInfo.js":106,"./Time.js":107,"./TimeStampReq.js":108,"./TimeStampResp.js":109,"./common.js":110}],112:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.fromBER=fromBER;exports.compareSchema=compareSchema;exports.verifySchema=verifySchema;exports.fromJSON=fromJSON;exports.RawData=exports.Repeated=exports.Any=exports.Choice=exports.TIME=exports.Duration=exports.DateTime=exports.TimeOfDay=exports.DATE=exports.GeneralizedTime=exports.UTCTime=exports.CharacterString=exports.GeneralString=exports.VisibleString=exports.GraphicString=exports.IA5String=exports.VideotexString=exports.TeletexString=exports.PrintableString=exports.NumericString=exports.UniversalString=exports.BmpString=exports.RelativeObjectIdentifier=exports.Utf8String=exports.ObjectIdentifier=exports.Enumerated=exports.Integer=exports.BitString=exports.OctetString=exports.Null=exports.Set=exports.Sequence=exports.Boolean=exports.EndOfContent=exports.Constructed=exports.Primitive=exports.BaseBlock=exports.ValueBlock=exports.HexBlock=void 0;var _pvutils=require("pvutils");
const powers2=[new Uint8Array([1])];const digitsString="0123456789";

class LocalBaseBlock{constructor(parameters={}){this.blockLength=(0,_pvutils.getParametersValue)(parameters,"blockLength",0);this.error=(0,_pvutils.getParametersValue)(parameters,"error","");this.warnings=(0,_pvutils.getParametersValue)(parameters,"warnings",[]); if("valueBeforeDecode"in parameters)this.valueBeforeDecode=parameters.valueBeforeDecode.slice(0);else this.valueBeforeDecode=new ArrayBuffer(0);}
static blockName(){return"baseBlock";}
toJSON(){return{blockName:this.constructor.blockName(),blockLength:this.blockLength,error:this.error,warnings:this.warnings,valueBeforeDecode:(0,_pvutils.bufferToHexCodes)(this.valueBeforeDecode,0,this.valueBeforeDecode.byteLength)};}
}


const HexBlock=BaseClass=>class LocalHexBlockMixin extends BaseClass{ constructor(parameters={}){super(parameters);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",false);if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else this.valueHex=new ArrayBuffer(0);}
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

exports.HexBlock=HexBlock;class LocalIdentificationBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super();if("idBlock"in parameters){ this.isHexOnly=(0,_pvutils.getParametersValue)(parameters.idBlock,"isHexOnly",false);this.valueHex=(0,_pvutils.getParametersValue)(parameters.idBlock,"valueHex",new ArrayBuffer(0)); this.tagClass=(0,_pvutils.getParametersValue)(parameters.idBlock,"tagClass",-1);this.tagNumber=(0,_pvutils.getParametersValue)(parameters.idBlock,"tagNumber",-1);this.isConstructed=(0,_pvutils.getParametersValue)(parameters.idBlock,"isConstructed",false);}else{this.tagClass=-1;this.tagNumber=-1;this.isConstructed=false;}}
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

 
if(this.tagClass===1&&this.isConstructed){switch(this.tagNumber){case 1: case 2: case 5: case 6: case 9: case 13: case 14: case 23:case 24:case 31:case 32:case 33:case 34:this.error="Constructed encoding used for primitive type";return-1;default:}} 
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


class ValueBlock extends LocalBaseBlock{constructor(parameters={}){super(parameters);}
static blockName(){return"valueBlock";} 
fromBER(inputBuffer,inputOffset,inputLength){ throw TypeError("User need to make a specific function in a class which extends \"ValueBlock\"");} 
toBER(sizeOnly=false){ throw TypeError("User need to make a specific function in a class which extends \"ValueBlock\"");}
}


exports.ValueBlock=ValueBlock;class BaseBlock extends LocalBaseBlock{constructor(parameters={},valueBlockType=ValueBlock){super(parameters);if("name"in parameters)this.name=parameters.name;if("optional"in parameters)this.optional=parameters.optional;if("primitiveSchema"in parameters)this.primitiveSchema=parameters.primitiveSchema;this.idBlock=new LocalIdentificationBlock(parameters);this.lenBlock=new LocalLengthBlock(parameters);this.valueBlock=new valueBlockType(parameters);}
static blockName(){return"BaseBlock";}
fromBER(inputBuffer,inputOffset,inputLength){const resultOffset=this.valueBlock.fromBER(inputBuffer,inputOffset,this.lenBlock.isIndefiniteForm===true?inputLength:this.lenBlock.length);if(resultOffset===-1){this.error=this.valueBlock.error;return resultOffset;}
if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;if(this.valueBlock.error.length===0)this.blockLength+=this.valueBlock.blockLength;return resultOffset;}
toBER(sizeOnly=false){let retBuf;const idBlockBuf=this.idBlock.toBER(sizeOnly);const valueBlockSizeBuf=this.valueBlock.toBER(true);this.lenBlock.length=valueBlockSizeBuf.byteLength;const lenBlockBuf=this.lenBlock.toBER(sizeOnly);retBuf=(0,_pvutils.utilConcatBuf)(idBlockBuf,lenBlockBuf);let valueBlockBuf;if(sizeOnly===false)valueBlockBuf=this.valueBlock.toBER(sizeOnly);else valueBlockBuf=new ArrayBuffer(this.lenBlock.length);retBuf=(0,_pvutils.utilConcatBuf)(retBuf,valueBlockBuf);if(this.lenBlock.isIndefiniteForm===true){const indefBuf=new ArrayBuffer(2);if(sizeOnly===false){const indefView=new Uint8Array(indefBuf);indefView[0]=0x00;indefView[1]=0x00;}
retBuf=(0,_pvutils.utilConcatBuf)(retBuf,indefBuf);}
return retBuf;}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.idBlock=this.idBlock.toJSON();object.lenBlock=this.lenBlock.toJSON();object.valueBlock=this.valueBlock.toJSON();if("name"in this)object.name=this.name;if("optional"in this)object.optional=this.optional;if("primitiveSchema"in this)object.primitiveSchema=this.primitiveSchema.toJSON();return object;}
}


exports.BaseBlock=BaseBlock;class LocalPrimitiveValueBlock extends ValueBlock{constructor(parameters={}){super(parameters); if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else this.valueHex=new ArrayBuffer(0);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",true);}
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


exports.Primitive=Primitive;class LocalConstructedValueBlock extends ValueBlock{constructor(parameters={}){super(parameters);this.value=(0,_pvutils.getParametersValue)(parameters,"value",[]);this.isIndefiniteForm=(0,_pvutils.getParametersValue)(parameters,"isIndefiniteForm",false);}
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


exports.Constructed=Constructed;class LocalEndOfContentValueBlock extends ValueBlock{constructor(parameters={}){super(parameters);} 
fromBER(inputBuffer,inputOffset,inputLength){ return inputOffset;} 
toBER(sizeOnly=false){return new ArrayBuffer(0);}
static blockName(){return"EndOfContentValueBlock";}
}
class EndOfContent extends BaseBlock{constructor(paramaters={}){super(paramaters,LocalEndOfContentValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=0;}
static blockName(){return"EndOfContent";}
}


exports.EndOfContent=EndOfContent;class LocalBooleanValueBlock extends ValueBlock{constructor(parameters={}){super(parameters);this.value=(0,_pvutils.getParametersValue)(parameters,"value",false);this.isHexOnly=(0,_pvutils.getParametersValue)(parameters,"isHexOnly",false);if("valueHex"in parameters)this.valueHex=parameters.valueHex.slice(0);else{this.valueHex=new ArrayBuffer(1);if(this.value===true){const view=new Uint8Array(this.valueHex);view[0]=0xFF;}}}
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


exports.Boolean=Boolean;class Sequence extends Constructed{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=16;}
static blockName(){return"Sequence";}
}
exports.Sequence=Sequence;class Set extends Constructed{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=17;}
static blockName(){return"Set";}
}


exports.Set=Set;class Null extends BaseBlock{constructor(parameters={}){super(parameters,LocalBaseBlock); this.idBlock.tagClass=1; this.idBlock.tagNumber=5;}
static blockName(){return"Null";} 
fromBER(inputBuffer,inputOffset,inputLength){if(this.lenBlock.length>0)this.warnings.push("Non-zero length of value block for Null type");if(this.idBlock.error.length===0)this.blockLength+=this.idBlock.blockLength;if(this.lenBlock.error.length===0)this.blockLength+=this.lenBlock.blockLength;this.blockLength+=inputLength;if(inputOffset+inputLength>inputBuffer.byteLength){this.error="End of input reached before message was fully decoded (inconsistent offset and length values)";return-1;}
return inputOffset+inputLength;}
toBER(sizeOnly=false){const retBuf=new ArrayBuffer(2);if(sizeOnly===true)return retBuf;const retView=new Uint8Array(retBuf);retView[0]=0x05;retView[1]=0x00;return retBuf;}
}


exports.Null=Null;class LocalOctetStringValueBlock extends HexBlock(LocalConstructedValueBlock){constructor(parameters={}){super(parameters);this.isConstructed=(0,_pvutils.getParametersValue)(parameters,"isConstructed",false);}
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


exports.OctetString=OctetString;class LocalBitStringValueBlock extends HexBlock(LocalConstructedValueBlock){constructor(parameters={}){super(parameters);this.unusedBits=(0,_pvutils.getParametersValue)(parameters,"unusedBits",0);this.isConstructed=(0,_pvutils.getParametersValue)(parameters,"isConstructed",false);this.blockLength=this.valueHex.byteLength;}
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


exports.BitString=BitString;class LocalIntegerValueBlock extends HexBlock(ValueBlock){constructor(parameters={}){super(parameters);if("value"in parameters)this.valueDec=parameters.value;}
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


exports.Integer=Integer;class Enumerated extends Integer{constructor(parameters={}){super(parameters);this.idBlock.tagClass=1; this.idBlock.tagNumber=10;}
static blockName(){return"Enumerated";}
}


exports.Enumerated=Enumerated;class LocalSidValueBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.valueDec=(0,_pvutils.getParametersValue)(parameters,"valueDec",-1);this.isFirstSid=(0,_pvutils.getParametersValue)(parameters,"isFirstSid",false);}
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
class LocalObjectIdentifierValueBlock extends ValueBlock{constructor(parameters={}){super(parameters);this.fromString((0,_pvutils.getParametersValue)(parameters,"value",""));}
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


exports.ObjectIdentifier=ObjectIdentifier;class LocalUtf8StringValueBlock extends HexBlock(LocalBaseBlock){ constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
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

exports.Utf8String=Utf8String;class LocalRelativeSidValueBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.valueDec=(0,_pvutils.getParametersValue)(parameters,"valueDec",-1);}
static blockName(){return"relativeSidBlock";}
fromBER(inputBuffer,inputOffset,inputLength){if(inputLength===0)return inputOffset;
 if((0,_pvutils.checkBufferParams)(this,inputBuffer,inputOffset,inputLength)===false)return-1; const intBuffer=new Uint8Array(inputBuffer,inputOffset,inputLength);this.valueHex=new ArrayBuffer(inputLength);let view=new Uint8Array(this.valueHex);for(let i=0;i<inputLength;i++){view[i]=intBuffer[i]&0x7F;this.blockLength++;if((intBuffer[i]&0x80)===0x00)break;} 
const tempValueHex=new ArrayBuffer(this.blockLength);const tempView=new Uint8Array(tempValueHex);for(let i=0;i<this.blockLength;i++)tempView[i]=view[i]; this.valueHex=tempValueHex.slice(0);view=new Uint8Array(this.valueHex); if((intBuffer[this.blockLength-1]&0x80)!==0x00){this.error="End of input reached before message was fully decoded";return-1;}
if(view[0]===0x00)this.warnings.push("Needlessly long format of SID encoding");if(this.blockLength<=8)this.valueDec=(0,_pvutils.utilFromBase)(view,7);else{this.isHexOnly=true;this.warnings.push("Too big SID for decoding, hex only");}
return inputOffset+this.blockLength;}
toBER(sizeOnly=false){ let retBuf;let retView; if(this.isHexOnly){if(sizeOnly===true)return new ArrayBuffer(this.valueHex.byteLength);const curView=new Uint8Array(this.valueHex);retBuf=new ArrayBuffer(this.blockLength);retView=new Uint8Array(retBuf);for(let i=0;i<this.blockLength-1;i++)retView[i]=curView[i]|0x80;retView[this.blockLength-1]=curView[this.blockLength-1];return retBuf;}
const encodedBuf=(0,_pvutils.utilToBase)(this.valueDec,7);if(encodedBuf.byteLength===0){this.error="Error during encoding SID value";return new ArrayBuffer(0);}
retBuf=new ArrayBuffer(encodedBuf.byteLength);if(sizeOnly===false){const encodedView=new Uint8Array(encodedBuf);retView=new Uint8Array(retBuf);for(let i=0;i<encodedBuf.byteLength-1;i++)retView[i]=encodedView[i]|0x80;retView[encodedBuf.byteLength-1]=encodedView[encodedBuf.byteLength-1];}
return retBuf;}
toString(){let result="";if(this.isHexOnly===true)result=(0,_pvutils.bufferToHexCodes)(this.valueHex,0,this.valueHex.byteLength);else{result=this.valueDec.toString();}
return result;} 
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.valueDec=this.valueDec;return object;}
}
class LocalRelativeObjectIdentifierValueBlock extends ValueBlock{constructor(parameters={}){super(parameters);this.fromString((0,_pvutils.getParametersValue)(parameters,"value",""));}
fromBER(inputBuffer,inputOffset,inputLength){let resultOffset=inputOffset;while(inputLength>0){const sidBlock=new LocalRelativeSidValueBlock();resultOffset=sidBlock.fromBER(inputBuffer,resultOffset,inputLength);if(resultOffset===-1){this.blockLength=0;this.error=sidBlock.error;return resultOffset;}
this.blockLength+=sidBlock.blockLength;inputLength-=sidBlock.blockLength;this.value.push(sidBlock);}
return resultOffset;}
toBER(sizeOnly=false){let retBuf=new ArrayBuffer(0);for(let i=0;i<this.value.length;i++){const valueBuf=this.value[i].toBER(sizeOnly);if(valueBuf.byteLength===0){this.error=this.value[i].error;return new ArrayBuffer(0);}
retBuf=(0,_pvutils.utilConcatBuf)(retBuf,valueBuf);}
return retBuf;}
fromString(string){this.value=[]; let pos1=0;let pos2=0;let sid="";do{pos2=string.indexOf(".",pos1);if(pos2===-1)sid=string.substr(pos1);else sid=string.substr(pos1,pos2-pos1);pos1=pos2+1;const sidBlock=new LocalRelativeSidValueBlock();sidBlock.valueDec=parseInt(sid,10);if(isNaN(sidBlock.valueDec))return true;this.value.push(sidBlock);}while(pos2!==-1);return true;}
toString(){let result="";let isHexOnly=false;for(let i=0;i<this.value.length;i++){isHexOnly=this.value[i].isHexOnly;let sidStr=this.value[i].toString();if(i!==0)result=`${result}.`;if(isHexOnly){sidStr=`{${sidStr}}`;result+=sidStr;}else result+=sidStr;}
return result;}
static blockName(){return"RelativeObjectIdentifierValueBlock";}
toJSON(){let object={}; try{object=super.toJSON();}catch(ex){} 
object.value=this.toString();object.sidArray=[];for(let i=0;i<this.value.length;i++)object.sidArray.push(this.value[i].toJSON());return object;}
}
class RelativeObjectIdentifier extends BaseBlock{constructor(parameters={}){super(parameters,LocalRelativeObjectIdentifierValueBlock);this.idBlock.tagClass=1; this.idBlock.tagNumber=13;}
static blockName(){return"RelativeObjectIdentifier";}
}

exports.RelativeObjectIdentifier=RelativeObjectIdentifier;class LocalBmpStringValueBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
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
exports.BmpString=BmpString;class LocalUniversalStringValueBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.isHexOnly=true;this.value="";}
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
exports.UniversalString=UniversalString;class LocalSimpleStringValueBlock extends HexBlock(LocalBaseBlock){constructor(parameters={}){super(parameters);this.value="";this.isHexOnly=true;}
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


exports.CharacterString=CharacterString;class UTCTime extends VisibleString{constructor(parameters={}){super(parameters);this.year=0;this.month=0;this.day=0;this.hour=0;this.minute=0;this.second=0; if("value"in parameters){this.fromString(parameters.value);this.valueBlock.valueHex=new ArrayBuffer(parameters.value.length);const view=new Uint8Array(this.valueBlock.valueHex);for(let i=0;i<parameters.value.length;i++)view[i]=parameters.value.charCodeAt(i);}
 
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


exports.TIME=TIME;class Choice{constructor(parameters={}){this.value=(0,_pvutils.getParametersValue)(parameters,"value",[]);this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);}
}


exports.Choice=Choice;class Any{constructor(parameters={}){this.name=(0,_pvutils.getParametersValue)(parameters,"name","");this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);}
}


exports.Any=Any;class Repeated{constructor(parameters={}){this.name=(0,_pvutils.getParametersValue)(parameters,"name","");this.optional=(0,_pvutils.getParametersValue)(parameters,"optional",false);this.value=(0,_pvutils.getParametersValue)(parameters,"value",new Any());this.local=(0,_pvutils.getParametersValue)(parameters,"local",false);}
}


exports.Repeated=Repeated;class RawData{constructor(parameters={}){this.data=(0,_pvutils.getParametersValue)(parameters,"data",new ArrayBuffer(0));}
fromBER(inputBuffer,inputOffset,inputLength){this.data=inputBuffer.slice(inputOffset,inputLength);return inputOffset+inputLength;}
toBER(sizeOnly=false){return this.data;}
}


exports.RawData=RawData;function LocalFromBER(inputBuffer,inputOffset,inputLength){const incomingOffset=inputOffset;
 function localChangeType(inputObject,newType){if(inputObject instanceof newType)return inputObject;const newObject=new newType();newObject.idBlock=inputObject.idBlock;newObject.lenBlock=inputObject.lenBlock;newObject.warnings=inputObject.warnings; newObject.valueBeforeDecode=inputObject.valueBeforeDecode.slice(0);return newObject;}
 
let returnObject=new BaseBlock({},Object);
 const baseBlock=new LocalBaseBlock();if((0,_pvutils.checkBufferParams)(baseBlock,inputBuffer,inputOffset,inputLength)===false){returnObject.error=baseBlock.error;return{offset:-1,result:returnObject};}
 
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

 case 13:newASN1Type=RelativeObjectIdentifier;break; case 14:newASN1Type=TIME;break;
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


},{"pvutils":113}],113:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.getUTCDate=getUTCDate;exports.getParametersValue=getParametersValue;exports.bufferToHexCodes=bufferToHexCodes;exports.checkBufferParams=checkBufferParams;exports.utilFromBase=utilFromBase;exports.utilToBase=utilToBase;exports.utilConcatBuf=utilConcatBuf;exports.utilConcatView=utilConcatView;exports.utilDecodeTC=utilDecodeTC;exports.utilEncodeTC=utilEncodeTC;exports.isEqualBuffer=isEqualBuffer;exports.padNumber=padNumber;exports.toBase64=toBase64;exports.fromBase64=fromBase64;exports.arrayBufferToString=arrayBufferToString;exports.stringToArrayBuffer=stringToArrayBuffer;exports.nearestPowerOf2=nearestPowerOf2;exports.clearProps=clearProps;function getUTCDate(date){ return new Date(date.getTime()+date.getTimezoneOffset()*60000);} 
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
},{}],114:[function(require,module,exports){var process=module.exports={};


var cachedSetTimeout;var cachedClearTimeout;function defaultSetTimout(){throw new Error('setTimeout has not been defined');}
function defaultClearTimeout(){throw new Error('clearTimeout has not been defined');}
(function(){try{if(typeof setTimeout==='function'){cachedSetTimeout=setTimeout;}else{cachedSetTimeout=defaultSetTimout;}}catch(e){cachedSetTimeout=defaultSetTimout;}
try{if(typeof clearTimeout==='function'){cachedClearTimeout=clearTimeout;}else{cachedClearTimeout=defaultClearTimeout;}}catch(e){cachedClearTimeout=defaultClearTimeout;}}())
function runTimeout(fun){if(cachedSetTimeout===setTimeout){ return setTimeout(fun,0);} 
if((cachedSetTimeout===defaultSetTimout||!cachedSetTimeout)&&setTimeout){cachedSetTimeout=setTimeout;return setTimeout(fun,0);}
try{ return cachedSetTimeout(fun,0);}catch(e){try{ return cachedSetTimeout.call(null,fun,0);}catch(e){ return cachedSetTimeout.call(this,fun,0);}}}
function runClearTimeout(marker){if(cachedClearTimeout===clearTimeout){ return clearTimeout(marker);} 
if((cachedClearTimeout===defaultClearTimeout||!cachedClearTimeout)&&clearTimeout){cachedClearTimeout=clearTimeout;return clearTimeout(marker);}
try{ return cachedClearTimeout(marker);}catch(e){try{ return cachedClearTimeout.call(null,marker);}catch(e){ return cachedClearTimeout.call(this,marker);}}}
var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){if(!draining||!currentQueue){return;}
draining=false;if(currentQueue.length){queue=currentQueue.concat(queue);}else{queueIndex=-1;}
if(queue.length){drainQueue();}}
function drainQueue(){if(draining){return;}
var timeout=runTimeout(cleanUpNextTick);draining=true;var len=queue.length;while(len){currentQueue=queue;queue=[];while(++queueIndex<len){if(currentQueue){currentQueue[queueIndex].run();}}
queueIndex=-1;len=queue.length;}
currentQueue=null;draining=false;runClearTimeout(timeout);}
process.nextTick=function(fun){var args=new Array(arguments.length-1);if(arguments.length>1){for(var i=1;i<arguments.length;i++){args[i-1]=arguments[i];}}
queue.push(new Item(fun,args));if(queue.length===1&&!draining){runTimeout(drainQueue);}};function Item(fun,array){this.fun=fun;this.array=array;}
Item.prototype.run=function(){this.fun.apply(null,this.array);};process.title='browser';process.browser=true;process.env={};process.argv=[];process.version='';process.versions={};function noop(){}
process.on=noop;process.addListener=noop;process.once=noop;process.off=noop;process.removeListener=noop;process.removeAllListeners=noop;process.emit=noop;process.prependListener=noop;process.prependOnceListener=noop;process.listeners=function(name){return[]}
process.binding=function(name){throw new Error('process.binding is not supported');};process.cwd=function(){return'/'};process.chdir=function(dir){throw new Error('process.chdir is not supported');};process.umask=function(){return 0;};},{}],115:[function(require,module,exports){const pkijs=require("pkijs");module.exports={pkijs,};},{"pkijs":111}]},{},[115])(115)});