"use strict";const{AutoRefreshHighlighter,}=require("devtools/server/actors/highlighters/auto-refresh");const{CanvasFrameAnonymousContentHelper,getBindingElementAndPseudo,hasPseudoClassLock,isNodeValid,moveInfobar,}=require("devtools/server/actors/highlighters/utils/markup");const{PSEUDO_CLASSES}=require("devtools/shared/css/constants");const{getCurrentZoom,setIgnoreLayoutChanges,}=require("devtools/shared/layout/utils");const{getNodeDisplayName,getNodeGridFlexType,}=require("devtools/server/actors/inspector/utils");const nodeConstants=require("devtools/shared/dom-node-constants");const{LocalizationHelper}=require("devtools/shared/l10n");const STRINGS_URI="devtools/shared/locales/highlighters.properties";const L10N=new LocalizationHelper(STRINGS_URI);
const BOX_MODEL_REGIONS=["margin","border","padding","content"];const BOX_MODEL_SIDES=["top","right","bottom","left"];const GUIDE_STROKE_WIDTH=1;class BoxModelHighlighter extends AutoRefreshHighlighter{constructor(highlighterEnv){super(highlighterEnv);this.ID_CLASS_PREFIX="box-model-";this.markup=new CanvasFrameAnonymousContentHelper(this.highlighterEnv,this._buildMarkup.bind(this));this.isReady=this.markup.initialize();this.onPageHide=this.onPageHide.bind(this);this.onWillNavigate=this.onWillNavigate.bind(this);this.highlighterEnv.on("will-navigate",this.onWillNavigate);const{pageListenerTarget}=highlighterEnv;pageListenerTarget.addEventListener("pagehide",this.onPageHide);}
static get XULSupported(){return true;}
_buildMarkup(){const highlighterContainer=this.markup.anonymousContentDocument.createElement("div");highlighterContainer.className="highlighter-container box-model";


highlighterContainer.setAttribute("aria-hidden","true");const rootWrapper=this.markup.createNode({parent:highlighterContainer,attributes:{id:"root",class:"root",role:"presentation",},prefix:this.ID_CLASS_PREFIX,}); const svg=this.markup.createSVGNode({nodeType:"svg",parent:rootWrapper,attributes:{id:"elements",width:"100%",height:"100%",hidden:"true",role:"presentation",},prefix:this.ID_CLASS_PREFIX,});const regions=this.markup.createSVGNode({nodeType:"g",parent:svg,attributes:{class:"regions",role:"presentation",},prefix:this.ID_CLASS_PREFIX,});for(const region of BOX_MODEL_REGIONS){this.markup.createSVGNode({nodeType:"path",parent:regions,attributes:{class:region,id:region,role:"presentation",},prefix:this.ID_CLASS_PREFIX,});}
for(const side of BOX_MODEL_SIDES){this.markup.createSVGNode({nodeType:"line",parent:svg,attributes:{class:"guide-"+side,id:"guide-"+side,"stroke-width":GUIDE_STROKE_WIDTH,role:"presentation",},prefix:this.ID_CLASS_PREFIX,});} 
const infobarContainer=this.markup.createNode({parent:rootWrapper,attributes:{class:"infobar-container",id:"infobar-container",position:"top",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const infobar=this.markup.createNode({parent:infobarContainer,attributes:{class:"infobar",},prefix:this.ID_CLASS_PREFIX,});const texthbox=this.markup.createNode({parent:infobar,attributes:{class:"infobar-text",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-tagname",id:"infobar-tagname",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-id",id:"infobar-id",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-classes",id:"infobar-classes",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-pseudo-classes",id:"infobar-pseudo-classes",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-dimensions",id:"infobar-dimensions",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-grid-type",id:"infobar-grid-type",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:texthbox,attributes:{class:"infobar-flex-type",id:"infobar-flex-type",},prefix:this.ID_CLASS_PREFIX,});return highlighterContainer;}
destroy(){this.highlighterEnv.off("will-navigate",this.onWillNavigate);const{pageListenerTarget}=this.highlighterEnv;if(pageListenerTarget){pageListenerTarget.removeEventListener("pagehide",this.onPageHide);}
this.markup.destroy();AutoRefreshHighlighter.prototype.destroy.call(this);}
getElement(id){return this.markup.getElement(this.ID_CLASS_PREFIX+id);}
_isNodeValid(node){return(node&&(isNodeValid(node)||isNodeValid(node,nodeConstants.TEXT_NODE)));}
_show(){if(!BOX_MODEL_REGIONS.includes(this.options.region)){this.options.region="content";}
const shown=this._update();this._trackMutations();return shown;}
_trackMutations(){if(isNodeValid(this.currentNode)){const win=this.currentNode.ownerGlobal;this.currentNodeObserver=new win.MutationObserver(this.update);this.currentNodeObserver.observe(this.currentNode,{attributes:true});}}
_untrackMutations(){if(isNodeValid(this.currentNode)&&this.currentNodeObserver){this.currentNodeObserver.disconnect();this.currentNodeObserver=null;}}
_update(){const node=this.currentNode;let shown=false;setIgnoreLayoutChanges(true);if(this._updateBoxModel()){
if(!this.options.hideInfoBar&&(node.nodeType===node.ELEMENT_NODE||node.nodeType===node.TEXT_NODE)){this._showInfobar();}else{this._hideInfobar();}
this._showBoxModel();shown=true;}else{this._hide();}
setIgnoreLayoutChanges(false,this.highlighterEnv.window.document.documentElement);return shown;}
_scrollUpdate(){this._moveInfobar();}
_hide(){setIgnoreLayoutChanges(true);this._untrackMutations();this._hideBoxModel();this._hideInfobar();setIgnoreLayoutChanges(false,this.highlighterEnv.window.document.documentElement);}
_hideInfobar(){this.getElement("infobar-container").setAttribute("hidden","true");}
_showInfobar(){this.getElement("infobar-container").removeAttribute("hidden");this._updateInfobar();}
_hideBoxModel(){this.getElement("elements").setAttribute("hidden","true");}
_showBoxModel(){this.getElement("elements").removeAttribute("hidden");}
_getOuterQuad(region){const quads=this.currentQuads[region];if(!quads||!quads.length){return null;}
const quad={p1:{x:Infinity,y:Infinity},p2:{x:-Infinity,y:Infinity},p3:{x:-Infinity,y:-Infinity},p4:{x:Infinity,y:-Infinity},bounds:{bottom:-Infinity,height:0,left:Infinity,right:-Infinity,top:Infinity,width:0,x:0,y:0,},};for(const q of quads){quad.p1.x=Math.min(quad.p1.x,q.p1.x);quad.p1.y=Math.min(quad.p1.y,q.p1.y);quad.p2.x=Math.max(quad.p2.x,q.p2.x);quad.p2.y=Math.min(quad.p2.y,q.p2.y);quad.p3.x=Math.max(quad.p3.x,q.p3.x);quad.p3.y=Math.max(quad.p3.y,q.p3.y);quad.p4.x=Math.min(quad.p4.x,q.p4.x);quad.p4.y=Math.max(quad.p4.y,q.p4.y);quad.bounds.bottom=Math.max(quad.bounds.bottom,q.bounds.bottom);quad.bounds.top=Math.min(quad.bounds.top,q.bounds.top);quad.bounds.left=Math.min(quad.bounds.left,q.bounds.left);quad.bounds.right=Math.max(quad.bounds.right,q.bounds.right);}
quad.bounds.x=quad.bounds.left;quad.bounds.y=quad.bounds.top;quad.bounds.width=quad.bounds.right-quad.bounds.left;quad.bounds.height=quad.bounds.bottom-quad.bounds.top;return quad;}
_updateBoxModel(){const options=this.options;options.region=options.region||"content";if(!this._nodeNeedsHighlighting()){this._hideBoxModel();return false;}
for(let i=0;i<BOX_MODEL_REGIONS.length;i++){const boxType=BOX_MODEL_REGIONS[i];const nextBoxType=BOX_MODEL_REGIONS[i+1];const box=this.getElement(boxType);
const path=[];for(let j=0;j<this.currentQuads[boxType].length;j++){const boxQuad=this.currentQuads[boxType][j];const nextBoxQuad=this.currentQuads[nextBoxType]?this.currentQuads[nextBoxType][j]:null;path.push(this._getBoxPathCoordinates(boxQuad,nextBoxQuad));}
box.setAttribute("d",path.join(" "));box.removeAttribute("faded");
if(options.showOnly&&options.showOnly!==boxType){if(options.onlyRegionArea){box.setAttribute("faded","true");}else{box.removeAttribute("d");}}
if(boxType===options.region&&!options.hideGuides){this._showGuides(boxType);}else if(options.hideGuides){this._hideGuides();}}
const rootId=this.ID_CLASS_PREFIX+"elements";this.markup.scaleRootElement(this.currentNode,rootId);return true;}
_getBoxPathCoordinates(boxQuad,nextBoxQuad){const{p1,p2,p3,p4}=boxQuad;let path;if(!nextBoxQuad||!this.options.onlyRegionArea){
path="M"+
p1.x+","+
p1.y+" "+"L"+
p2.x+","+
p2.y+" "+"L"+
p3.x+","+
p3.y+" "+"L"+
p4.x+","+
p4.y;}else{const{p1:np1,p2:np2,p3:np3,p4:np4}=nextBoxQuad;path="M"+
p1.x+","+
p1.y+" "+"L"+
p2.x+","+
p2.y+" "+"L"+
p3.x+","+
p3.y+" "+"L"+
p4.x+","+
p4.y+" "+"L"+
p1.x+","+
p1.y+" "+"L"+
np1.x+","+
np1.y+" "+"L"+
np4.x+","+
np4.y+" "+"L"+
np3.x+","+
np3.y+" "+"L"+
np2.x+","+
np2.y+" "+"L"+
np1.x+","+
np1.y;}
return path;}
_nodeNeedsHighlighting(){return(this.currentQuads.margin.length||this.currentQuads.border.length||this.currentQuads.padding.length||this.currentQuads.content.length);}
_getOuterBounds(){for(const region of["margin","border","padding","content"]){const quad=this._getOuterQuad(region);if(!quad){break;}
const{bottom,height,left,right,top,width,x,y}=quad.bounds;if(width>0||height>0){return{bottom,height,left,right,top,width,x,y};}}
return{bottom:0,height:0,left:0,right:0,top:0,width:0,x:0,y:0,};}
_showGuides(region){const quad=this._getOuterQuad(region);if(!quad){return;}
const{p1,p2,p3,p4}=quad;const allX=[p1.x,p2.x,p3.x,p4.x].sort((a,b)=>a-b);const allY=[p1.y,p2.y,p3.y,p4.y].sort((a,b)=>a-b);const toShowX=[];const toShowY=[];for(const arr of[allX,allY]){for(let i=0;i<arr.length;i++){const val=arr[i];if(i!==arr.lastIndexOf(val)){if(arr===allX){toShowX.push(val);}else{toShowY.push(val);}
arr.splice(arr.lastIndexOf(val),1);}}}
this._updateGuide("top",Math.round(toShowY[0]));this._updateGuide("right",Math.round(toShowX[1])-1);this._updateGuide("bottom",Math.round(toShowY[1]-1));this._updateGuide("left",Math.round(toShowX[0]));}
_hideGuides(){for(const side of BOX_MODEL_SIDES){this.getElement("guide-"+side).setAttribute("hidden","true");}}
_updateGuide(side,point=-1){const guide=this.getElement("guide-"+side);if(point<=0){guide.setAttribute("hidden","true");return false;}
if(side==="top"||side==="bottom"){guide.setAttribute("x1","0");guide.setAttribute("y1",point+"");guide.setAttribute("x2","100%");guide.setAttribute("y2",point+"");}else{guide.setAttribute("x1",point+"");guide.setAttribute("y1","0");guide.setAttribute("x2",point+"");guide.setAttribute("y2","100%");}
guide.removeAttribute("hidden");return true;}
_updateInfobar(){if(!this.currentNode){return;}
const{bindingElement:node,pseudo}=getBindingElementAndPseudo(this.currentNode); const displayName=getNodeDisplayName(node);const id=node.id?"#"+node.id:"";const classList=(node.classList||[]).length?"."+[...node.classList].join("."):"";let pseudos=this._getPseudoClasses(node).join("");if(pseudo){ pseudos+=":"+pseudo;}


const zoom=getCurrentZoom(this.win);const quad=this._getOuterQuad("border");if(!quad){return;}
const{width,height}=quad.bounds;const dim=parseFloat((width/zoom).toPrecision(6))+" \u00D7 "+
parseFloat((height/zoom).toPrecision(6));const{grid:gridType,flex:flexType}=getNodeGridFlexType(node);const gridLayoutTextType=this._getLayoutTextType("gridType",gridType);const flexLayoutTextType=this._getLayoutTextType("flexType",flexType);this.getElement("infobar-tagname").setTextContent(displayName);this.getElement("infobar-id").setTextContent(id);this.getElement("infobar-classes").setTextContent(classList);this.getElement("infobar-pseudo-classes").setTextContent(pseudos);this.getElement("infobar-dimensions").setTextContent(dim);this.getElement("infobar-grid-type").setTextContent(gridLayoutTextType);this.getElement("infobar-flex-type").setTextContent(flexLayoutTextType);this._moveInfobar();}
_getLayoutTextType(layoutTypeKey,{isContainer,isItem}){if(!isContainer&&!isItem){return"";}
if(isContainer&&!isItem){return L10N.getStr(`${layoutTypeKey}.container`);}
if(!isContainer&&isItem){return L10N.getStr(`${layoutTypeKey}.item`);}
return L10N.getStr(`${layoutTypeKey}.dual`);}
_getPseudoClasses(node){if(node.nodeType!==nodeConstants.ELEMENT_NODE){return[];}
return PSEUDO_CLASSES.filter(pseudo=>hasPseudoClassLock(node,pseudo));}
_moveInfobar(){const bounds=this._getOuterBounds();const container=this.getElement("infobar-container");moveInfobar(container,bounds,this.win);}
onPageHide({target}){
if(target.defaultView===this.win){this.hide();}}
onWillNavigate({isTopLevel}){if(isTopLevel){this.hide();}}}
exports.BoxModelHighlighter=BoxModelHighlighter;