"use strict";const{AutoRefreshHighlighter,}=require("devtools/server/actors/highlighters/auto-refresh");const{CanvasFrameAnonymousContentHelper,getComputedStyle,}=require("devtools/server/actors/highlighters/utils/markup");const{setIgnoreLayoutChanges,getAdjustedQuads,}=require("devtools/shared/layout/utils");const{getCSSStyleRules}=require("devtools/shared/inspector/css-logic");const GEOMETRY_LABEL_SIZE=6;
const DOM_EVENTS=["mousemove","mouseup","pagehide"];const _dragging=Symbol("geometry/dragging");var GeoProp={SIDES:["top","right","bottom","left"],SIZES:["width","height"],allProps:function(){return[...this.SIDES,...this.SIZES];},isSide:function(name){return this.SIDES.includes(name);},isSize:function(name){return this.SIZES.includes(name);},containsSide:function(names){return names.some(name=>this.SIDES.includes(name));},containsSize:function(names){return names.some(name=>this.SIZES.includes(name));},isHorizontal:function(name){return name==="left"||name==="right"||name==="width";},isInverted:function(name){return name==="right"||name==="bottom";},mainAxisStart:function(name){return this.isHorizontal(name)?"left":"top";},crossAxisStart:function(name){return this.isHorizontal(name)?"top":"left";},mainAxisSize:function(name){return this.isHorizontal(name)?"width":"height";},crossAxisSize:function(name){return this.isHorizontal(name)?"height":"width";},axis:function(name){return this.isHorizontal(name)?"x":"y";},crossAxis:function(name){return this.isHorizontal(name)?"y":"x";},};function getOffsetParent(node){const win=node.ownerGlobal;let offsetParent=node.offsetParent;if(offsetParent&&getComputedStyle(offsetParent).position==="static"){offsetParent=null;}
let width,height;if(!offsetParent){height=win.innerHeight;width=win.innerWidth;}else{height=offsetParent.offsetHeight;width=offsetParent.offsetWidth;}
return{element:offsetParent,dimension:{width,height},};}
function getDefinedGeometryProperties(node){const props=new Map();if(!node){return props;}
const cssRules=getCSSStyleRules(node);for(let i=0;i<cssRules.length;i++){const rule=cssRules[i];for(const name of GeoProp.allProps()){const value=rule.style.getPropertyValue(name);if(value&&value!=="auto"){
props.set(name,{cssRule:rule,});}}}

if(node.style){for(const name of GeoProp.allProps()){const value=node.style.getPropertyValue(name);if(value&&value!=="auto"){props.set(name,{
cssRule:node,});}}}



const{position}=getComputedStyle(node);for(const[name]of props){if(position==="static"&&GeoProp.SIDES.includes(name)){props.delete(name);}

const hasRightAndLeft=name==="right"&&props.has("left");const hasBottomAndTop=name==="bottom"&&props.has("top");if(position==="relative"&&(hasRightAndLeft||hasBottomAndTop)){props.delete(name);}}
return props;}
exports.getDefinedGeometryProperties=getDefinedGeometryProperties;class GeometryEditorHighlighter extends AutoRefreshHighlighter{constructor(highlighterEnv){super(highlighterEnv);this.ID_CLASS_PREFIX="geometry-editor-";this.definedProperties=new Map();this.markup=new CanvasFrameAnonymousContentHelper(highlighterEnv,this._buildMarkup.bind(this));this.isReady=this.initialize();const{pageListenerTarget}=this.highlighterEnv;DOM_EVENTS.forEach(type=>pageListenerTarget.addEventListener(type,this));this.onWillNavigate=this.onWillNavigate.bind(this);this.highlighterEnv.on("will-navigate",this.onWillNavigate);}
async initialize(){await this.markup.initialize();const onMouseDown=this.handleEvent.bind(this);for(const side of GeoProp.SIDES){this.getElement("handler-"+side).addEventListener("mousedown",onMouseDown);}}
_buildMarkup(){const container=this.markup.createNode({attributes:{class:"highlighter-container"},});const root=this.markup.createNode({parent:container,attributes:{id:"root",class:"root",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const svg=this.markup.createSVGNode({nodeType:"svg",parent:root,attributes:{id:"elements",width:"100%",height:"100%",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"polygon",parent:svg,attributes:{class:"offset-parent",id:"offset-parent",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"polygon",parent:svg,attributes:{class:"current-node",id:"current-node",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});for(const name of GeoProp.SIDES){this.markup.createSVGNode({nodeType:"line",parent:svg,attributes:{class:"arrow "+name,id:"arrow-"+name,hidden:"true",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"circle",parent:svg,attributes:{class:"handler-"+name,id:"handler-"+name,r:"4","data-side":name,hidden:"true",},prefix:this.ID_CLASS_PREFIX,});


const labelG=this.markup.createSVGNode({nodeType:"g",parent:svg,attributes:{id:"label-"+name,hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const subG=this.markup.createSVGNode({nodeType:"g",parent:labelG,attributes:{transform:GeoProp.isHorizontal(name)?"translate(-30 -30)":"translate(5 -10)",},});this.markup.createSVGNode({nodeType:"path",parent:subG,attributes:{class:"label-bubble",d:GeoProp.isHorizontal(name)?"M0 0 L60 0 L60 20 L35 20 L30 25 L25 20 L0 20z":"M5 0 L65 0 L65 20 L5 20 L5 15 L0 10 L5 5z",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"text",parent:subG,attributes:{class:"label-text",id:"label-text-"+name,x:GeoProp.isHorizontal(name)?"30":"35",y:"10",},prefix:this.ID_CLASS_PREFIX,});}
return container;}
destroy(){
if(!this.highlighterEnv){return;}
const{pageListenerTarget}=this.highlighterEnv;if(pageListenerTarget){DOM_EVENTS.forEach(type=>pageListenerTarget.removeEventListener(type,this));}
AutoRefreshHighlighter.prototype.destroy.call(this);this.markup.destroy();this.definedProperties.clear();this.definedProperties=null;this.offsetParent=null;}
handleEvent(event,id){ if(this.getElement("root").hasAttribute("hidden")){return;}
const{target,type,pageX,pageY}=event;switch(type){case"pagehide":
if(target.defaultView===this.win){this.destroy();}
break;case"mousedown": if(!id){return;}
const handlerSide=this.markup.getElement(id).getAttribute("data-side");if(handlerSide){const side=handlerSide;const sideProp=this.definedProperties.get(side);if(!sideProp){return;}
let value=sideProp.cssRule.style.getPropertyValue(side);const computedValue=this.computedStyle.getPropertyValue(side);const[unit]=value.match(/[^\d]+$/)||[""];value=parseFloat(value);const ratio=value/parseFloat(computedValue)||1;const dir=GeoProp.isInverted(side)?-1:1; this[_dragging]={side,value,unit,x:pageX,y:pageY,inc:ratio*dir,};this.getElement("handler-"+side).classList.add("dragging");}
this.getElement("root").setAttribute("dragging","true");break;case"mouseup":if(this[_dragging]){const{side}=this[_dragging];this.getElement("root").removeAttribute("dragging");this.getElement("handler-"+side).classList.remove("dragging");this[_dragging]=null;}
break;case"mousemove":if(!this[_dragging]){return;}
const{side,x,y,value,unit,inc}=this[_dragging];const sideProps=this.definedProperties.get(side);if(!sideProps){return;}
const delta=(GeoProp.isHorizontal(side)?pageX-x:pageY-y)*inc;


this.currentNode.style.setProperty(side,value+delta+unit,"important");break;}}
getElement(id){return this.markup.getElement(this.ID_CLASS_PREFIX+id);}
_show(){this.computedStyle=getComputedStyle(this.currentNode);const pos=this.computedStyle.position;if(pos==="sticky"){this.hide();return false;}
const hasUpdated=this._update();if(!hasUpdated){this.hide();return false;}
this.getElement("root").removeAttribute("hidden");return true;}
_update(){
this.definedProperties=getDefinedGeometryProperties(this.currentNode);if(!this.definedProperties.size){console.warn("The element does not have editable geometry properties");return false;}
setIgnoreLayoutChanges(true);this.updateOffsetParent();this.updateCurrentNode();this.updateArrows();const node=this.currentNode;this.markup.scaleRootElement(node,this.ID_CLASS_PREFIX+"root");setIgnoreLayoutChanges(false,this.highlighterEnv.document.documentElement);return true;}
updateOffsetParent(){this.offsetParent=getOffsetParent(this.currentNode);this.parentQuads=getAdjustedQuads(this.win,this.offsetParent.element,"padding");const el=this.getElement("offset-parent");const isPositioned=this.computedStyle.position==="absolute"||this.computedStyle.position==="fixed";const isRelative=this.computedStyle.position==="relative";let isHighlighted=false;if(this.offsetParent.element&&isPositioned){const{p1,p2,p3,p4}=this.parentQuads[0];const points=p1.x+","+
p1.y+" "+
p2.x+","+
p2.y+" "+
p3.x+","+
p3.y+" "+
p4.x+","+
p4.y;el.setAttribute("points",points);isHighlighted=true;}else if(isRelative){const xDelta=parseFloat(this.computedStyle.left);const yDelta=parseFloat(this.computedStyle.top);if(xDelta||yDelta){const{p1,p2,p3,p4}=this.currentQuads.margin[0];const points=p1.x-
xDelta+","+
(p1.y-yDelta)+" "+
(p2.x-xDelta)+","+
(p2.y-yDelta)+" "+
(p3.x-xDelta)+","+
(p3.y-yDelta)+" "+
(p4.x-xDelta)+","+
(p4.y-yDelta);el.setAttribute("points",points);isHighlighted=true;}}
if(isHighlighted){el.removeAttribute("hidden");}else{el.setAttribute("hidden","true");}}
updateCurrentNode(){const box=this.getElement("current-node");const{p1,p2,p3,p4}=this.currentQuads.margin[0];const attr=p1.x+","+
p1.y+" "+
p2.x+","+
p2.y+" "+
p3.x+","+
p3.y+" "+
p4.x+","+
p4.y;box.setAttribute("points",attr);box.removeAttribute("hidden");}
_hide(){setIgnoreLayoutChanges(true);this.getElement("root").setAttribute("hidden","true");this.getElement("current-node").setAttribute("hidden","true");this.getElement("offset-parent").setAttribute("hidden","true");this.hideArrows();this.definedProperties.clear();setIgnoreLayoutChanges(false,this.highlighterEnv.document.documentElement);}
hideArrows(){for(const side of GeoProp.SIDES){this.getElement("arrow-"+side).setAttribute("hidden","true");this.getElement("label-"+side).setAttribute("hidden","true");this.getElement("handler-"+side).setAttribute("hidden","true");}}
updateArrows(){this.hideArrows();const marginBox=this.currentQuads.margin[0].bounds;

const getSideArrowStartPos=side=>{if(this.parentQuads&&this.parentQuads.length){return this.parentQuads[0].bounds[side];}
if(this.computedStyle.position==="relative"){if(GeoProp.isInverted(side)){return marginBox[side]+parseFloat(this.computedStyle[side]);}
return marginBox[side]-parseFloat(this.computedStyle[side]);}
if(GeoProp.isInverted(side)){return this.offsetParent.dimension[GeoProp.mainAxisSize(side)];}
return(-1*this.currentNode.ownerGlobal["scroll"+GeoProp.axis(side).toUpperCase()]);};for(const side of GeoProp.SIDES){const sideProp=this.definedProperties.get(side);if(!sideProp){continue;}
const mainAxisStartPos=getSideArrowStartPos(side);const mainAxisEndPos=marginBox[side];const crossAxisPos=marginBox[GeoProp.crossAxisStart(side)]+
marginBox[GeoProp.crossAxisSize(side)]/2;this.updateArrow(side,mainAxisStartPos,mainAxisEndPos,crossAxisPos,sideProp.cssRule.style.getPropertyValue(side));}}
updateArrow(side,mainStart,mainEnd,crossPos,labelValue){const arrowEl=this.getElement("arrow-"+side);const labelEl=this.getElement("label-"+side);const labelTextEl=this.getElement("label-text-"+side);const handlerEl=this.getElement("handler-"+side);arrowEl.setAttribute(GeoProp.axis(side)+"1",mainStart);arrowEl.setAttribute(GeoProp.crossAxis(side)+"1",crossPos);arrowEl.setAttribute(GeoProp.axis(side)+"2",mainEnd);arrowEl.setAttribute(GeoProp.crossAxis(side)+"2",crossPos);arrowEl.removeAttribute("hidden");handlerEl.setAttribute("c"+GeoProp.axis(side),mainEnd);handlerEl.setAttribute("c"+GeoProp.crossAxis(side),crossPos);handlerEl.removeAttribute("hidden");
const capitalize=str=>str[0].toUpperCase()+str.substring(1);const winMain=this.win["inner"+capitalize(GeoProp.mainAxisSize(side))];let labelMain=mainStart+(mainEnd-mainStart)/2;if((mainStart>0&&mainStart<winMain)||(mainEnd>0&&mainEnd<winMain)){if(labelMain<GEOMETRY_LABEL_SIZE){labelMain=GEOMETRY_LABEL_SIZE;}else if(labelMain>winMain-GEOMETRY_LABEL_SIZE){labelMain=winMain-GEOMETRY_LABEL_SIZE;}}
const labelCross=crossPos;labelEl.setAttribute("transform",GeoProp.isHorizontal(side)?"translate("+labelMain+" "+labelCross+")":"translate("+labelCross+" "+labelMain+")");labelEl.removeAttribute("hidden");labelTextEl.setTextContent(labelValue);}
onWillNavigate({isTopLevel}){if(isTopLevel){this.hide();}}}
exports.GeometryEditorHighlighter=GeometryEditorHighlighter;