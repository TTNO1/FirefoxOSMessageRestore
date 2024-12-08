//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["WebVTT"];const{Services}=ChromeUtils.import('resource://gre/modules/Services.jsm');const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"supportPseudo","media.webvtt.pseudo.enabled",false);XPCOMUtils.defineLazyPreferenceGetter(this,"DEBUG_LOG","media.webvtt.debug.logging",false);(function(global){function LOG(message){if(DEBUG_LOG){dump("[vtt] "+message+"\n");}}
var _objCreate=Object.create||(function(){function F(){}
return function(o){if(arguments.length!==1){throw new Error('Object.create shim only accepts one parameter.');}
F.prototype=o;return new F();};})();

function ParsingError(errorData,message){this.name="ParsingError";this.code=errorData.code;this.message=message||errorData.message;}
ParsingError.prototype=_objCreate(Error.prototype);ParsingError.prototype.constructor=ParsingError;ParsingError.Errors={BadSignature:{code:0,message:"Malformed WebVTT signature."},BadTimeStamp:{code:1,message:"Malformed time stamp."}};function collectTimeStamp(input){function computeSeconds(h,m,s,f){if(m>59||s>59){return null;}
if(f.length!==3){return null;}
return(h|0)*3600+(m|0)*60+(s|0)+(f|0)/1000;}
let timestamp=input.match(/^(\d+:)?(\d{2}):(\d{2})\.(\d+)/);if(!timestamp||timestamp.length!==5){return null;}
let hours=timestamp[1]?timestamp[1].replace(":",""):0;let minutes=timestamp[2];let seconds=timestamp[3];let milliSeconds=timestamp[4];return computeSeconds(hours,minutes,seconds,milliSeconds);}

function Settings(){this.values=_objCreate(null);}
Settings.prototype={set:function(k,v){if(v!==""){this.values[k]=v;}},


get:function(k,dflt,defaultKey){if(defaultKey){return this.has(k)?this.values[k]:dflt[defaultKey];}
return this.has(k)?this.values[k]:dflt;},has:function(k){return k in this.values;},alt:function(k,v,a){for(let n=0;n<a.length;++n){if(v===a[n]){this.set(k,v);return true;}}
return false;},digitsValue:function(k,v){if(/^-0+(\.[0]*)?$/.test(v)){ this.set(k,0.0);}else if(/^-?\d+(\.[\d]*)?$/.test(v)){this.set(k,parseFloat(v));}},percent:function(k,v){let m;if((m=v.match(/^([\d]{1,3})(\.[\d]*)?%$/))){v=parseFloat(v);if(v>=0&&v<=100){this.set(k,v);return true;}}
return false;}, del:function(k){if(this.has(k)){delete this.values[k];}},};
function parseOptions(input,callback,keyValueDelim,groupDelim){let groups=groupDelim?input.split(groupDelim):[input];for(let i in groups){if(typeof groups[i]!=="string"){continue;}
let kv=groups[i].split(keyValueDelim);if(kv.length!==2){continue;}
let k=kv[0];let v=kv[1];callback(k,v);}}
function parseCue(input,cue,regionList){let oInput=input; function consumeTimeStamp(){let ts=collectTimeStamp(input);if(ts===null){throw new ParsingError(ParsingError.Errors.BadTimeStamp,"Malformed timestamp: "+oInput);}
input=input.replace(/^[^\s\uFFFDa-zA-Z-]+/,"");return ts;} 
function consumeCueSettings(input,cue){let settings=new Settings();parseOptions(input,function(k,v){switch(k){case"region":for(let i=regionList.length-1;i>=0;i--){if(regionList[i].id===v){settings.set(k,regionList[i].region);break;}}
break;case"vertical":settings.alt(k,v,["rl","lr"]);break;case"line":{let vals=v.split(",");let vals0=vals[0];settings.digitsValue(k,vals0);settings.percent(k,vals0)?settings.set("snapToLines",false):null;settings.alt(k,vals0,["auto"]);if(vals.length===2){settings.alt("lineAlign",vals[1],["start","center","end"]);}
break;}
case"position":{let vals=v.split(",");if(settings.percent(k,vals[0])){if(vals.length===2){if(!settings.alt("positionAlign",vals[1],["line-left","center","line-right"])){settings.del(k);}}}
break;}
case"size":settings.percent(k,v);break;case"align":settings.alt(k,v,["start","center","end","left","right"]);break;}},/:/,/\t|\n|\f|\r| /);
 cue.region=settings.get("region",null);cue.vertical=settings.get("vertical","");cue.line=settings.get("line","auto");cue.lineAlign=settings.get("lineAlign","start");cue.snapToLines=settings.get("snapToLines",true);cue.size=settings.get("size",100);cue.align=settings.get("align","center");cue.position=settings.get("position","auto");cue.positionAlign=settings.get("positionAlign","auto");}
function skipWhitespace(){input=input.replace(/^[ \f\n\r\t]+/,"");}
skipWhitespace();cue.startTime=consumeTimeStamp(); skipWhitespace();if(input.substr(0,3)!=="-->"){throw new ParsingError(ParsingError.Errors.BadTimeStamp,"Malformed time stamp (time stamps must be separated by '-->'): "+
oInput);}
input=input.substr(3);skipWhitespace();cue.endTime=consumeTimeStamp();
skipWhitespace();consumeCueSettings(input,cue);}
function emptyOrOnlyContainsWhiteSpaces(input){return input==""||/^[ \f\n\r\t]+$/.test(input);}
function containsTimeDirectionSymbol(input){return input.includes("-->");}
function maybeIsTimeStampFormat(input){return/^\s*(\d+:)?(\d{2}):(\d{2})\.(\d+)\s*-->\s*(\d+:)?(\d{2}):(\d{2})\.(\d+)\s*/.test(input);}
var ESCAPE={"&amp;":"&","&lt;":"<","&gt;":">","&lrm;":"\u200e","&rlm;":"\u200f","&nbsp;":"\u00a0"};var TAG_NAME={c:"span",i:"i",b:"b",u:"u",ruby:"ruby",rt:"rt",v:"span",lang:"span"};var TAG_ANNOTATION={v:"title",lang:"lang"};var NEEDS_PARENT={rt:"ruby"};const PARSE_CONTENT_MODE={NORMAL_CUE:"normal_cue",PSUEDO_CUE:"pseudo_cue",DOCUMENT_FRAGMENT:"document_fragment",REGION_CUE:"region_cue",}
function parseContent(window,input,mode){function nextToken(){if(!input){return null;}
function consume(result){input=input.substr(result.length);return result;}
let m=input.match(/^([^<]*)(<[^>]+>?)?/);if(!m[0]){return null;}

return consume(m[1]?m[1]:m[2]);}
function unescape1(e){return ESCAPE[e];}
function unescape(s){let m;while((m=s.match(/&(amp|lt|gt|lrm|rlm|nbsp);/))){s=s.replace(m[0],unescape1);}
return s;}
function shouldAdd(current,element){return!NEEDS_PARENT[element.localName]||NEEDS_PARENT[element.localName]===current.localName;}
function createElement(type,annotation){let tagName=TAG_NAME[type];if(!tagName){return null;}
let element=window.document.createElement(tagName);let name=TAG_ANNOTATION[type];if(name){element[name]=annotation?annotation.trim():"";}
return element;}
 
function normalizedTimeStamp(secondsWithFrag){let totalsec=parseInt(secondsWithFrag,10);let hours=Math.floor(totalsec/3600);let minutes=Math.floor(totalsec%3600/60);let seconds=Math.floor(totalsec%60);if(hours<10){hours="0"+hours;}
if(minutes<10){minutes="0"+minutes;}
if(seconds<10){seconds="0"+seconds;}
let f=secondsWithFrag.toString().split(".");if(f[1]){f=f[1].slice(0,3).padEnd(3,"0");}else{f="000";}
return hours+':'+minutes+':'+seconds+'.'+f;}
let root;switch(mode){case PARSE_CONTENT_MODE.PSUEDO_CUE:root=window.document.createElement("span",{pseudo:"::cue"});break;case PARSE_CONTENT_MODE.NORMAL_CUE:case PARSE_CONTENT_MODE.REGION_CUE:root=window.document.createElement("span");break;case PARSE_CONTENT_MODE.DOCUMENT_FRAGMENT:root=window.document.createDocumentFragment();break;}
if(!input){root.appendChild(window.document.createTextNode(""));return root;}
let current=root,t,tagStack=[];while((t=nextToken())!==null){if(t[0]==='<'){if(t[1]==="/"){if(tagStack.length&&tagStack[tagStack.length-1]===t.substr(2).replace(">","")){tagStack.pop();current=current.parentNode;}
continue;}
let ts=collectTimeStamp(t.substr(1,t.length-1));let node;if(ts){node=window.document.createProcessingInstruction("timestamp",normalizedTimeStamp(ts));current.appendChild(node);continue;}
let m=t.match(/^<([^.\s/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);if(!m){continue;}
node=createElement(m[1],m[3]);if(!node){continue;}

if(!shouldAdd(current,node)){continue;}
if(m[2]){node.className=m[2].substr(1).replace('.',' ');}

tagStack.push(m[1]);current.appendChild(node);current=node;continue;}
current.appendChild(window.document.createTextNode(unescape(t)));}
return root;}
function StyleBox(){}

StyleBox.prototype.applyStyles=function(styles,div){div=div||this.div;for(let prop in styles){if(styles.hasOwnProperty(prop)){div.style[prop]=styles[prop];}}};StyleBox.prototype.formatStyle=function(val,unit){return val===0?0:val+unit;};class StyleBoxBase{applyStyles(styles,div){div=div||this.div;Object.assign(div.style,styles);}
formatStyle(val,unit){return val===0?0:val+unit;}}

class CueStyleBox extends StyleBoxBase{constructor(window,cue,containerBox){super();this.cue=cue;this.div=window.document.createElement("div");this.cueDiv=parseContent(window,cue.text,supportPseudo?PARSE_CONTENT_MODE.PSUEDO_CUE:PARSE_CONTENT_MODE.NORMAL_CUE);this.div.appendChild(this.cueDiv);this.containerHeight=containerBox.height;this.containerWidth=containerBox.width;this.fontSize=this._getFontSize(containerBox);this.isCueStyleBox=true;
if(supportPseudo){this._applyDefaultStylesOnPseudoBackgroundNode();}else{this._applyDefaultStylesOnNonPseudoBackgroundNode();}
this._applyDefaultStylesOnRootNode();}
getCueBoxPositionAndSize(){

const isWritingDirectionHorizontal=this.cue.vertical=="";let top=this.containerHeight*this._tranferPercentageToFloat(this.div.style.top),left=this.containerWidth*this._tranferPercentageToFloat(this.div.style.left),width=isWritingDirectionHorizontal?this.containerWidth*this._tranferPercentageToFloat(this.div.style.width):this.div.clientWidthDouble,height=isWritingDirectionHorizontal?this.div.clientHeightDouble:this.containerHeight*this._tranferPercentageToFloat(this.div.style.height);return{top,left,width,height};}
getFirstLineBoxSize(){

return this.div.firstLineBoxBSize;}
setBidiRule(){



this.applyStyles({"unicode-bidi":"plaintext"});}
_tranferPercentageToFloat(input){return input.replace("%","")/100.0;}
_getFontSize(containerBox){


return containerBox.height*0.05+"px";}
_applyDefaultStylesOnPseudoBackgroundNode(){
this.cueDiv.style.setProperty("--cue-font-size",this.fontSize,"important");this.cueDiv.style.setProperty("--cue-writing-mode",this._getCueWritingMode(),"important");}
_applyDefaultStylesOnNonPseudoBackgroundNode(){



this.applyStyles({"background-color":"rgba(0, 0, 0, 0.8)",},this.cueDiv);} 
_applyDefaultStylesOnRootNode(){

const writingMode=this._getCueWritingMode();const{width,height,left,top}=this._getCueSizeAndPosition();this.applyStyles({"position":"absolute","writing-mode":writingMode,"top":top,"left":left,"width":width,"height":height,"overflow-wrap":"break-word","white-space":"pre-line","font":this.fontSize+" sans-serif","color":"rgba(255, 255, 255, 1)","white-space":"pre-line","text-align":this.cue.align,});}
_getCueWritingMode(){const cue=this.cue;if(cue.vertical==""){return"horizontal-tb";}
return cue.vertical=="lr"?"vertical-lr":"vertical-rl";}
_getCueSizeAndPosition(){const cue=this.cue;
let maximumSize;let computedPosition=cue.computedPosition;switch(cue.computedPositionAlign){case"line-left":maximumSize=100-computedPosition;break;case"line-right":maximumSize=computedPosition;break;case"center":maximumSize=computedPosition<=50?computedPosition*2:(100-computedPosition)*2;break;}
const size=Math.min(cue.size,maximumSize);
let xPosition=0.0,yPosition=0.0;const isWritingDirectionHorizontal=cue.vertical=="";switch(cue.computedPositionAlign){case"line-left":if(isWritingDirectionHorizontal){xPosition=cue.computedPosition;}else{yPosition=cue.computedPosition;}
break;case"center":if(isWritingDirectionHorizontal){xPosition=cue.computedPosition-(size/2);}else{yPosition=cue.computedPosition-(size/2);}
break;case"line-right":if(isWritingDirectionHorizontal){xPosition=cue.computedPosition-size;}else{yPosition=cue.computedPosition-size;}
break;}


if(!cue.snapToLines){if(isWritingDirectionHorizontal){yPosition=cue.computedLine;}else{xPosition=cue.computedLine;}}else{if(isWritingDirectionHorizontal){yPosition=0;}else{xPosition=0;}}
return{left:xPosition+"%",top:yPosition+"%",width:isWritingDirectionHorizontal?size+"%":"auto",height:isWritingDirectionHorizontal?"auto":size+"%",};}}
function RegionNodeBox(window,region,container){StyleBox.call(this);let boxLineHeight=container.height*0.0533
 let boxHeight=boxLineHeight*region.lines;let boxWidth=container.width*region.width/100; let regionNodeStyles={position:"absolute",height:boxHeight+"px",width:boxWidth+"px",top:(region.viewportAnchorY*container.height/100)-(region.regionAnchorY*boxHeight/100)+"px",left:(region.viewportAnchorX*container.width/100)-(region.regionAnchorX*boxWidth/100)+"px",lineHeight:boxLineHeight+"px",writingMode:"horizontal-tb",backgroundColor:"rgba(0, 0, 0, 0.8)",wordWrap:"break-word",overflowWrap:"break-word",font:(boxLineHeight/1.3)+"px sans-serif",color:"rgba(255, 255, 255, 1)",overflow:"hidden",minHeight:"0px",maxHeight:boxHeight+"px",display:"inline-flex",flexFlow:"column",justifyContent:"flex-end",};this.div=window.document.createElement("div");this.div.id=region.id;this.applyStyles(regionNodeStyles);}
RegionNodeBox.prototype=_objCreate(StyleBox.prototype);RegionNodeBox.prototype.constructor=RegionNodeBox;function RegionCueStyleBox(window,cue){StyleBox.call(this);this.cueDiv=parseContent(window,cue.text,PARSE_CONTENT_MODE.REGION_CUE);let regionCueStyles={position:"relative",writingMode:"horizontal-tb",unicodeBidi:"plaintext",width:"auto",height:"auto",textAlign:cue.align,}; let offset=cue.computedPosition*cue.region.width/100; switch(cue.align){case"start":case"left":regionCueStyles.left=offset+"%";regionCueStyles.right="auto";break;case"end":case"right":regionCueStyles.left="auto";regionCueStyles.right=offset+"%";break;case"middle":break;}
this.div=window.document.createElement("div");this.applyStyles(regionCueStyles);this.div.appendChild(this.cueDiv);}
RegionCueStyleBox.prototype=_objCreate(StyleBox.prototype);RegionCueStyleBox.prototype.constructor=RegionCueStyleBox;
class BoxPosition{constructor(obj){


const isHTMLElement=!obj.isCueStyleBox&&(obj.div||obj.tagName);obj=obj.isCueStyleBox?obj.getCueBoxPositionAndSize():obj.div||obj;this.top=isHTMLElement?obj.offsetTop:obj.top;this.left=isHTMLElement?obj.offsetLeft:obj.left;this.width=isHTMLElement?obj.offsetWidth:obj.width;this.height=isHTMLElement?obj.offsetHeight:obj.height;this.fuzz=0.01;}
get bottom(){return this.top+this.height;}
get right(){return this.left+this.width;}
getBoxInfoInChars(){return`top=${this.top}, bottom=${this.bottom}, left=${this.left}, `+`right=${this.right}, width=${this.width}, height=${this.height}`;}


move(axis,toMove){switch(axis){case"+x":LOG(`box's left moved from ${this.left} to ${this.left + toMove}`);this.left+=toMove;break;case"-x":LOG(`box's left moved from ${this.left} to ${this.left - toMove}`);this.left-=toMove;break;case"+y":LOG(`box's top moved from ${this.top} to ${this.top + toMove}`);this.top+=toMove;break;case"-y":LOG(`box's top moved from ${this.top} to ${this.top - toMove}`);this.top-=toMove;break;}}
overlaps(b2){return(this.left<b2.right-this.fuzz)&&(this.right>b2.left+this.fuzz)&&(this.top<b2.bottom-this.fuzz)&&(this.bottom>b2.top+this.fuzz);}
overlapsAny(boxes){for(let i=0;i<boxes.length;i++){if(this.overlaps(boxes[i])){return true;}}
return false;}
within(container){return(this.top>=container.top-this.fuzz)&&(this.bottom<=container.bottom+this.fuzz)&&(this.left>=container.left-this.fuzz)&&(this.right<=container.right+this.fuzz);}


isOutsideTheAxisBoundary(container,axis){switch(axis){case"+x":return this.right>container.right+this.fuzz;case"-x":return this.left<container.left-this.fuzz;case"+y":return this.bottom>container.bottom+this.fuzz;case"-y":return this.top<container.top-this.fuzz;}}

intersectPercentage(b2){let x=Math.max(0,Math.min(this.right,b2.right)-Math.max(this.left,b2.left)),y=Math.max(0,Math.min(this.bottom,b2.bottom)-Math.max(this.top,b2.top)),intersectArea=x*y;return intersectArea/(this.height*this.width);}}
BoxPosition.prototype.clone=function(){return new BoxPosition(this);};function adjustBoxPosition(styleBox,containerBox,controlBarBox,outputBoxes){const cue=styleBox.cue;const isWritingDirectionHorizontal=cue.vertical=="";let box=new BoxPosition(styleBox);if(!box.width||!box.height){LOG(`No way to adjust a box with zero width or height.`);return;}



const fullDimension=isWritingDirectionHorizontal?containerBox.height:containerBox.width;if(cue.snapToLines){LOG(`Adjust position when 'snap-to-lines' is true.`);



let step=styleBox.getFirstLineBoxSize();if(step==0){return;} 
let line=Math.floor(cue.computedLine+0.5);if(cue.vertical=="rl"){line=-1*(line+1);} 
let position=step*line;if(cue.vertical=="rl"){position=position-box.width+step;} 
if(line<0){position+=fullDimension;step=-1*step;}
const movingDirection=isWritingDirectionHorizontal?"+y":"+x";box.move(movingDirection,position);let specifiedPosition=box.clone();
const titleAreaBox=containerBox.clone();if(controlBarBox){titleAreaBox.height-=controlBarBox.height;}
function isBoxOutsideTheRenderingArea(){if(isWritingDirectionHorizontal){
return step<0&&box.top<0||step>0&&box.bottom>fullDimension;}


return step<0&&box.left<0||step>0&&box.right>fullDimension;}


let switched=false;while(!box.within(titleAreaBox)||box.overlapsAny(outputBoxes)){if(isBoxOutsideTheRenderingArea()){
if(switched){return null;} 
switched=true;box=specifiedPosition.clone();step=-1*step;}
box.move(movingDirection,step);}
if(isWritingDirectionHorizontal){styleBox.applyStyles({top:getPercentagePosition(box.top,fullDimension),});}else{styleBox.applyStyles({left:getPercentagePosition(box.left,fullDimension),});}}else{LOG(`Adjust position when 'snap-to-lines' is false.`); if(cue.lineAlign!="start"){const isCenterAlign=cue.lineAlign=="center";const movingDirection=isWritingDirectionHorizontal?"-y":"-x";if(isWritingDirectionHorizontal){box.move(movingDirection,isCenterAlign?box.height:box.height/2);}else{box.move(movingDirection,isCenterAlign?box.width:box.width/2);}} 
let bestPosition={},specifiedPosition=box.clone(),outsideAreaPercentage=1;let hasFoundBestPosition=false;




function getAxis(writingDirection){if(writingDirection==""){return["+y","-y","+x","-x"];}
if(writingDirection=="lr"){return["+x","-x","+y","-y"];}
return["-x","+x","+y","-y"];}
const axis=getAxis(cue.vertical);



const factor=4;const toMove=styleBox.getFirstLineBoxSize()/factor;for(let i=0;i<axis.length&&!hasFoundBestPosition;i++){while(!box.isOutsideTheAxisBoundary(containerBox,axis[i])&&(!box.within(containerBox)||box.overlapsAny(outputBoxes))){box.move(axis[i],toMove);}

if(box.within(containerBox)){bestPosition=box.clone();hasFoundBestPosition=true;break;}
let p=box.intersectPercentage(containerBox);
if(outsideAreaPercentage>p){bestPosition=box.clone();outsideAreaPercentage=p;}
box=specifiedPosition.clone();}
if(!box.within(containerBox)){return null;}
styleBox.applyStyles({top:getPercentagePosition(box.top,containerBox.height),left:getPercentagePosition(box.left,containerBox.width),});}

function getPercentagePosition(position,fullDimension){return(position/fullDimension)*100+"%";}
return box;}
function WebVTT(){this.isProcessingCues=false;}
WebVTT.StringDecoder=function(){return{decode:function(data){if(!data){return"";}
if(typeof data!=="string"){throw new Error("Error - expected string data.");}
return decodeURIComponent(encodeURIComponent(data));}};};WebVTT.convertCueToDOMTree=function(window,cuetext){if(!window){return null;}
return parseContent(window,cuetext,PARSE_CONTENT_MODE.DOCUMENT_FRAGMENT);};function clearAllCuesDiv(overlay){while(overlay.firstChild){overlay.firstChild.remove();}}
var lastDisplayedCueNums=0;const DIV_COMPUTING_STATE={REUSE:0,REUSE_AND_CLEAR:1,COMPUTE_AND_CLEAR:2};



function processCuesInternal(window,cues,overlay,controls){LOG(`=== processCues ===`);if(!cues){LOG(`clear display and abort processing because of no cue.`);clearAllCuesDiv(overlay);lastDisplayedCueNums=0;return;}
let controlBar,controlBarShown;if(controls){controlBar=controls.parentNode.getElementById("controlBar");controlBarShown=controlBar?!controlBar.hidden:false;}else{
controlBarShown=false;}
function getDIVComputingState(cues){if(overlay.lastControlBarShownStatus!=controlBarShown){return DIV_COMPUTING_STATE.COMPUTE_AND_CLEAR;}
for(let i=0;i<cues.length;i++){if(cues[i].hasBeenReset||!cues[i].displayState){return DIV_COMPUTING_STATE.COMPUTE_AND_CLEAR;}}
if(lastDisplayedCueNums!=cues.length){return DIV_COMPUTING_STATE.REUSE_AND_CLEAR;}
return DIV_COMPUTING_STATE.REUSE;}
const divState=getDIVComputingState(cues);overlay.lastControlBarShownStatus=controlBarShown;if(divState==DIV_COMPUTING_STATE.REUSE){LOG(`reuse current cue's display state and abort processing`);return;}
clearAllCuesDiv(overlay);let rootOfCues=window.document.createElement("div");rootOfCues.style.position="absolute";rootOfCues.style.left="0";rootOfCues.style.right="0";rootOfCues.style.top="0";rootOfCues.style.bottom="0";overlay.appendChild(rootOfCues);if(divState==DIV_COMPUTING_STATE.REUSE_AND_CLEAR){LOG(`clear display but reuse cues' display state.`);for(let cue of cues){rootOfCues.appendChild(cue.displayState);}}else if(divState==DIV_COMPUTING_STATE.COMPUTE_AND_CLEAR){LOG(`clear display and recompute cues' display state.`);let boxPositions=[],containerBox=new BoxPosition(rootOfCues);let styleBox,cue,controlBarBox;if(controlBarShown){controlBarBox=new BoxPosition(controlBar);boxPositions.push(controlBarBox);}
 
let regionNodeBoxes={};let regionNodeBox;LOG(`lastDisplayedCueNums=${lastDisplayedCueNums}, currentCueNums=${cues.length}`);lastDisplayedCueNums=cues.length;for(let i=0;i<cues.length;i++){cue=cues[i];if(cue.region!=null){ styleBox=new RegionCueStyleBox(window,cue);if(!regionNodeBoxes[cue.region.id]){
 let adjustContainerBox=new BoxPosition(rootOfCues);if(controlBarShown){adjustContainerBox.height-=controlBarBox.height;adjustContainerBox.bottom+=controlBarBox.height;}
regionNodeBox=new RegionNodeBox(window,cue.region,adjustContainerBox);regionNodeBoxes[cue.region.id]=regionNodeBox;} 
let currentRegionBox=regionNodeBoxes[cue.region.id];let currentRegionNodeDiv=currentRegionBox.div;

if(cue.region.scroll=="up"&&currentRegionNodeDiv.childElementCount>0){styleBox.div.style.transitionProperty="top";styleBox.div.style.transitionDuration="0.433s";}
currentRegionNodeDiv.appendChild(styleBox.div);rootOfCues.appendChild(currentRegionNodeDiv);cue.displayState=styleBox.div;boxPositions.push(new BoxPosition(currentRegionBox));}else{styleBox=new CueStyleBox(window,cue,containerBox);rootOfCues.appendChild(styleBox.div);

let cueBox=adjustBoxPosition(styleBox,containerBox,controlBarBox,boxPositions);if(cueBox){styleBox.setBidiRule();
cue.displayState=styleBox.div;boxPositions.push(cueBox);LOG(`cue ${i}, `+cueBox.getBoxInfoInChars());}else{LOG(`can not find a proper position to place cue ${i}`);
cue.displayState=null;rootOfCues.removeChild(styleBox.div);}}}}else{LOG(`[ERROR] unknown div computing state`);}};WebVTT.processCues=function(window,cues,overlay,controls){

if(this.isProcessingCues){return;}
this.isProcessingCues=true;processCuesInternal(window,cues,overlay,controls);this.isProcessingCues=false;};WebVTT.Parser=function(window,decoder){this.window=window;this.state="INITIAL";this.substate="";this.substatebuffer="";this.buffer="";this.decoder=decoder||new TextDecoder("utf8");this.regionList=[];};WebVTT.Parser.prototype={
reportOrThrowError:function(e){if(e instanceof ParsingError){this.onparsingerror&&this.onparsingerror(e);}else{throw e;}},parse:function(data){

if(data){this.buffer+=this.decoder.decode(data,{stream:true});}
while(/\r\n|\n|\r/.test(this.buffer)){let buffer=this.buffer;let pos=0;while(buffer[pos]!=='\r'&&buffer[pos]!=='\n'){++pos;}
let line=buffer.substr(0,pos);if(buffer[pos]==='\r'){++pos;}
if(buffer[pos]==='\n'){++pos;}
this.buffer=buffer.substr(pos);line=line.replace(/[\u0000]/g,"\uFFFD");if(!/^NOTE($|[ \t])/.test(line)){this.parseLine(line);}}
return this;},parseLine:function(line){let self=this;function createCueIfNeeded(){if(!self.cue){self.cue=new self.window.VTTCue(0,0,"");}}
function parseCueIdentifier(input){if(maybeIsTimeStampFormat(input)){self.state="CUE";return false;}
createCueIfNeeded();self.cue.id=containsTimeDirectionSymbol(input)?"":input;self.state="CUE";return true;} 
function parseCueMayThrow(input){try{createCueIfNeeded();parseCue(input,self.cue,self.regionList);self.state="CUETEXT";}catch(e){self.reportOrThrowError(e);self.cue=null;self.state="BADCUE";}} 
function parseRegion(input){let settings=new Settings();parseOptions(input,function(k,v){switch(k){case"id":settings.set(k,v);break;case"width":settings.percent(k,v);break;case"lines":settings.digitsValue(k,v);break;case"regionanchor":case"viewportanchor":{let xy=v.split(',');if(xy.length!==2){break;}

let anchor=new Settings();anchor.percent("x",xy[0]);anchor.percent("y",xy[1]);if(!anchor.has("x")||!anchor.has("y")){break;}
settings.set(k+"X",anchor.get("x"));settings.set(k+"Y",anchor.get("y"));break;}
case"scroll":settings.alt(k,v,["up"]);break;}},/:/,/\t|\n|\f|\r| /);


if(settings.has("id")){try{let region=new self.window.VTTRegion();region.id=settings.get("id","");region.width=settings.get("width",100);region.lines=settings.get("lines",3);region.regionAnchorX=settings.get("regionanchorX",0);region.regionAnchorY=settings.get("regionanchorY",100);region.viewportAnchorX=settings.get("viewportanchorX",0);region.viewportAnchorY=settings.get("viewportanchorY",100);region.scroll=settings.get("scroll","");self.onregion&&self.onregion(region);
self.regionList.push({id:settings.get("id"),region:region});}catch(e){dump("VTTRegion Error "+e+"\n");let regionPref=Services.prefs.getBoolPref("media.webvtt.regions.enabled");dump("regionPref "+regionPref+"\n");}}} 
function parseSignatureMayThrow(signature){if(!/^WEBVTT([ \t].*)?$/.test(signature)){throw new ParsingError(ParsingError.Errors.BadSignature);}else{self.state="HEADER";}}
function parseRegionOrStyle(input){switch(self.substate){case"REGION":parseRegion(input);break;case"STYLE":break;}}






function parseHeader(line){if(!self.substate&&/^REGION|^STYLE/.test(line)){self.substate=/^REGION/.test(line)?"REGION":"STYLE";return false;}
if(self.substate==="REGION"||self.substate==="STYLE"){if(maybeIsTimeStampFormat(line)||emptyOrOnlyContainsWhiteSpaces(line)||containsTimeDirectionSymbol(line)){parseRegionOrStyle(self.substatebuffer);self.substatebuffer="";self.substate=null;return parseHeader(line);}
if(/^REGION|^STYLE/.test(line)){parseRegionOrStyle(self.substatebuffer);self.substatebuffer="";self.substate=/^REGION/.test(line)?"REGION":"STYLE";return false;}

self.substatebuffer+=" "+line;return false;}
if(emptyOrOnlyContainsWhiteSpaces(line)){return false;}
if(maybeIsTimeStampFormat(line)){self.state="CUE";return true;} 
self.state="ID";return true;}
try{if(self.state==="INITIAL"){parseSignatureMayThrow(line);return;}
if(self.state==="HEADER"){
if(!parseHeader(line)){return;}}
if(self.state==="ID"){if(line==""){return;}
if(!parseCueIdentifier(line)){return self.parseLine(line);}
return;}
if(self.state==="CUE"){parseCueMayThrow(line);return;}
if(self.state==="CUETEXT"){if(emptyOrOnlyContainsWhiteSpaces(line)||containsTimeDirectionSymbol(line)){self.oncue&&self.oncue(self.cue);self.cue=null;self.state="ID";if(emptyOrOnlyContainsWhiteSpaces(line)){return;}
return self.parseLine(line);}
if(self.cue.text){self.cue.text+="\n";}
self.cue.text+=line;return;}
if(self.state==="BADCUE"){self.state="ID";return self.parseLine(line);}}catch(e){self.reportOrThrowError(e);if(self.state==="CUETEXT"&&self.cue&&self.oncue){self.oncue(self.cue);}
self.cue=null;
self.state=self.state==="INITIAL"?"BADWEBVTT":"BADCUE";}
return this;},flush:function(){let self=this;try{self.buffer+=self.decoder.decode();self.buffer+="\n\n";self.parse();}catch(e){self.reportOrThrowError(e);}
self.onflush&&self.onflush();return this;}};global.WebVTT=WebVTT;}(this));