"use strict";const{Cu,Cr}=require("chrome");const{getCurrentZoom,getWindowDimensions,getViewportDimensions,loadSheet,removeSheet,}=require("devtools/shared/layout/utils");const EventEmitter=require("devtools/shared/event-emitter");const InspectorUtils=require("InspectorUtils");const lazyContainer={};loader.lazyRequireGetter(lazyContainer,"CssLogic","devtools/server/actors/inspector/css-logic",true);loader.lazyRequireGetter(this,"isDocumentReady","devtools/server/actors/inspector/utils",true);exports.getComputedStyle=node=>lazyContainer.CssLogic.getComputedStyle(node);exports.getBindingElementAndPseudo=node=>lazyContainer.CssLogic.getBindingElementAndPseudo(node);exports.hasPseudoClassLock=(...args)=>InspectorUtils.hasPseudoClassLock(...args);exports.addPseudoClassLock=(...args)=>InspectorUtils.addPseudoClassLock(...args);exports.removePseudoClassLock=(...args)=>InspectorUtils.removePseudoClassLock(...args);const SVG_NS="http://www.w3.org/2000/svg";const XHTML_NS="http://www.w3.org/1999/xhtml";const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const XUL_HIGHLIGHTER_STYLES_SHEET=`data:text/css;charset=utf-8,
:root > iframe.devtools-highlighter-renderer {
  border: none;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}`;const STYLESHEET_URI="resource://devtools/server/actors/"+"highlighters.css";const _tokens=Symbol("classList/tokens");function ClassList(className){const trimmed=(className||"").trim();this[_tokens]=trimmed?trimmed.split(/\s+/):[];}
ClassList.prototype={item(index){return this[_tokens][index];},contains(token){return this[_tokens].includes(token);},add(token){if(!this.contains(token)){this[_tokens].push(token);}
EventEmitter.emit(this,"update");},remove(token){const index=this[_tokens].indexOf(token);if(index>-1){this[_tokens].splice(index,1);}
EventEmitter.emit(this,"update");},toggle(token,force){ if(force===undefined){if(this.contains(token)){this.remove(token);}else{this.add(token);}}else if(force){ this.add(token);}else{ this.remove(token);}},get length(){return this[_tokens].length;},[Symbol.iterator]:function*(){for(let i=0;i<this.tokens.length;i++){yield this[_tokens][i];}},toString(){return this[_tokens].join(" ");},};function isXUL(window){

return(window.document.documentElement.namespaceURI===XUL_NS||(window.isChromeWindow&&window.document.documentElement.getAttribute("scrolling")==="false"));}
exports.isXUL=isXUL;function isNodeValid(node,nodeType=Node.ELEMENT_NODE){if(!node||Cu.isDeadWrapper(node)){return false;}
if(node.nodeType!==nodeType){return false;}
const doc=node.nodeType===Node.DOCUMENT_NODE?node:node.ownerDocument;if(!doc||!doc.defaultView){return false;}
if(!node.isConnected){return false;}
return true;}
exports.isNodeValid=isNodeValid;function CanvasFrameAnonymousContentHelper(highlighterEnv,nodeBuilder){this.highlighterEnv=highlighterEnv;this.nodeBuilder=nodeBuilder;this._onWindowReady=this._onWindowReady.bind(this);this.highlighterEnv.on("window-ready",this._onWindowReady);this.listeners=new Map();this.elements=new Map();}
CanvasFrameAnonymousContentHelper.prototype={initialize(){ const onInitialized=new Promise(resolve=>{this._initialized=resolve;});const doc=this.highlighterEnv.document;if(doc.documentElement&&(isDocumentReady(doc)||doc.readyState!=="uninitialized")){this._insert();}
return onInitialized;},destroy(){this._remove();if(this._iframe){
const numberOfHighlighters=parseInt(this._iframe.dataset.numberOfHighlighters,10)-1;this._iframe.dataset.numberOfHighlighters=numberOfHighlighters;
if(numberOfHighlighters===0){this._iframe.remove();removeSheet(this.highlighterEnv.window,XUL_HIGHLIGHTER_STYLES_SHEET);}
this._iframe=null;}
this.highlighterEnv.off("window-ready",this._onWindowReady);this.highlighterEnv=this.nodeBuilder=this._content=null;this.anonymousContentDocument=null;this.anonymousContentWindow=null;this.pageListenerTarget=null;this._removeAllListeners();this.elements.clear();},async _insert(){await waitForContentLoaded(this.highlighterEnv.window);if(!this.highlighterEnv){return;}
if(isXUL(this.highlighterEnv.window)){




if(!this._iframe){const{documentElement}=this.highlighterEnv.window.document;this._iframe=documentElement.querySelector(":scope > .devtools-highlighter-renderer");if(this._iframe){
const numberOfHighlighters=parseInt(this._iframe.dataset.numberOfHighlighters,10)+1;this._iframe.dataset.numberOfHighlighters=numberOfHighlighters;}else{this._iframe=this.highlighterEnv.window.document.createElement("iframe");this._iframe.classList.add("devtools-highlighter-renderer");
this._iframe.dataset.numberOfHighlighters=1;documentElement.append(this._iframe);loadSheet(this.highlighterEnv.window,XUL_HIGHLIGHTER_STYLES_SHEET);}}
await waitForContentLoaded(this._iframe);if(!this.highlighterEnv){return;}

this.anonymousContentDocument=this._iframe.contentDocument;this.anonymousContentWindow=this._iframe.contentWindow;this.pageListenerTarget=this._iframe.contentWindow;}else{
this.anonymousContentDocument=this.highlighterEnv.document;this.anonymousContentWindow=this.highlighterEnv.window;this.pageListenerTarget=this.highlighterEnv.pageListenerTarget;}


loadSheet(this.anonymousContentWindow,STYLESHEET_URI);const node=this.nodeBuilder();


try{this._content=this.anonymousContentDocument.insertAnonymousContent(node);}catch(e){


if(e.result===Cr.NS_ERROR_UNEXPECTED&&this.anonymousContentDocument.readyState==="interactive"){await new Promise(resolve=>{this.anonymousContentDocument.addEventListener("readystatechange",resolve,{once:true});});this._content=this.anonymousContentDocument.insertAnonymousContent(node);}else{throw e;}}
this._initialized();},_remove(){try{this.anonymousContentDocument.removeAnonymousContent(this._content);}catch(e){
}},_onWindowReady({isTopLevel}){if(isTopLevel){this._removeAllListeners();this.elements.clear();if(this._iframe){

this._iframe.remove();removeSheet(this.highlighterEnv.window,XUL_HIGHLIGHTER_STYLES_SHEET);this._iframe=null;}
this._insert();}},getComputedStylePropertyValue(id,property){return(this.content&&this.content.getComputedStylePropertyValue(id,property));},getTextContentForElement(id){return this.content&&this.content.getTextContentForElement(id);},setTextContentForElement(id,text){if(this.content){this.content.setTextContentForElement(id,text);}},setAttributeForElement(id,name,value){if(this.content){this.content.setAttributeForElement(id,name,value);}},getAttributeForElement(id,name){return this.content&&this.content.getAttributeForElement(id,name);},removeAttributeForElement(id,name){if(this.content){this.content.removeAttributeForElement(id,name);}},hasAttributeForElement(id,name){return typeof this.getAttributeForElement(id,name)==="string";},getCanvasContext(id,type="2d"){return this.content&&this.content.getCanvasContext(id,type);},addEventListenerForElement(id,type,handler){if(typeof id!=="string"){throw new Error("Expected a string ID in addEventListenerForElement but"+" got: "+id);}
if(!this.listeners.has(type)){const target=this.pageListenerTarget;target.addEventListener(type,this,true);this.listeners.set(type,new Map());}
const listeners=this.listeners.get(type);listeners.set(id,handler);},removeEventListenerForElement(id,type){const listeners=this.listeners.get(type);if(!listeners){return;}
listeners.delete(id);if(!this.listeners.has(type)){const target=this.pageListenerTarget;target.removeEventListener(type,this,true);}},handleEvent(event){const listeners=this.listeners.get(event.type);if(!listeners){return;}

let isPropagationStopped=false;const eventProxy=new Proxy(event,{get:(obj,name)=>{if(name==="originalTarget"){return null;}else if(name==="stopPropagation"){return()=>{isPropagationStopped=true;};}
return obj[name];},});
let node=event.originalTarget;while(node){const handler=listeners.get(node.id);if(handler){handler(eventProxy,node.id);if(isPropagationStopped){break;}}
node=node.parentNode;}},_removeAllListeners(){if(this.pageListenerTarget){const target=this.pageListenerTarget;for(const[type]of this.listeners){target.removeEventListener(type,this,true);}}
this.listeners.clear();},getElement(id){if(this.elements.has(id)){return this.elements.get(id);}
const classList=new ClassList(this.getAttributeForElement(id,"class"));EventEmitter.on(classList,"update",()=>{this.setAttributeForElement(id,"class",classList.toString());});const element={getTextContent:()=>this.getTextContentForElement(id),setTextContent:text=>this.setTextContentForElement(id,text),setAttribute:(name,val)=>this.setAttributeForElement(id,name,val),getAttribute:name=>this.getAttributeForElement(id,name),removeAttribute:name=>this.removeAttributeForElement(id,name),hasAttribute:name=>this.hasAttributeForElement(id,name),getCanvasContext:type=>this.getCanvasContext(id,type),addEventListener:(type,handler)=>{return this.addEventListenerForElement(id,type,handler);},removeEventListener:(type,handler)=>{return this.removeEventListenerForElement(id,type,handler);},computedStyle:{getPropertyValue:property=>this.getComputedStylePropertyValue(id,property),},classList,};this.elements.set(id,element);return element;},get content(){if(!this._content||Cu.isDeadWrapper(this._content)){return null;}
return this._content;},scaleRootElement(node,id){const boundaryWindow=this.highlighterEnv.window;const zoom=getCurrentZoom(node);
this.setAttributeForElement(id,"style","display: none");node.offsetWidth;let{width,height}=getWindowDimensions(boundaryWindow);let value="";if(zoom!==1){value=`transform-origin:top left; transform:scale(${1 / zoom}); `;width*=zoom;height*=zoom;}
value+=`position:absolute; width:${width}px;height:${height}px; overflow:hidden`;this.setAttributeForElement(id,"style",value);},createSVGNode(options){if(!options.nodeType){options.nodeType="box";}
options.namespace=SVG_NS;return this.createNode(options);},createNode(options){const type=options.nodeType||"div";const namespace=options.namespace||XHTML_NS;const doc=this.anonymousContentDocument;const node=doc.createElementNS(namespace,type);for(const name in options.attributes||{}){let value=options.attributes[name];if(options.prefix&&(name==="class"||name==="id")){value=options.prefix+value;}
node.setAttribute(name,value);}
if(options.parent){options.parent.appendChild(node);}
if(options.text){node.appendChild(doc.createTextNode(options.text));}
return node;},};exports.CanvasFrameAnonymousContentHelper=CanvasFrameAnonymousContentHelper;function waitForContentLoaded(iframeOrWindow){let loadEvent="DOMContentLoaded";
if(iframeOrWindow.contentWindow&&iframeOrWindow.ownerGlobal!==iframeOrWindow.contentWindow.browsingContext.topChromeWindow){loadEvent="load";}
const doc=iframeOrWindow.contentDocument||iframeOrWindow.document;if(isDocumentReady(doc)){return Promise.resolve();}
return new Promise(resolve=>{iframeOrWindow.addEventListener(loadEvent,resolve,{once:true});});}
function moveInfobar(container,bounds,win,options={}){const zoom=getCurrentZoom(win);const viewport=getViewportDimensions(win);const{computedStyle}=container;const margin=2;const arrowSize=parseFloat(computedStyle.getPropertyValue("--highlighter-bubble-arrow-size"));const containerHeight=parseFloat(computedStyle.getPropertyValue("height"));const containerWidth=parseFloat(computedStyle.getPropertyValue("width"));const containerHalfWidth=containerWidth/2;const viewportWidth=viewport.width*zoom;const viewportHeight=viewport.height*zoom;let{pageXOffset,pageYOffset}=win;pageYOffset*=zoom;pageXOffset*=zoom;const topBoundary=margin;const bottomBoundary=viewportHeight-containerHeight-margin-1;const leftBoundary=containerHalfWidth+margin;const rightBoundary=viewportWidth-containerHalfWidth-margin;let top=bounds.y-containerHeight-arrowSize;const bottom=bounds.bottom+margin+arrowSize;let left=bounds.x+bounds.width/2;let isOverlapTheNode=false;let positionAttribute="top";let position="absolute";


const canBePlacedOnTop=top>=pageYOffset;const canBePlacedOnBottom=bottomBoundary+pageYOffset-bottom>0;const forcedOnTop=options.position==="top";const forcedOnBottom=options.position==="bottom";if((!canBePlacedOnTop&&canBePlacedOnBottom&&!forcedOnTop)||forcedOnBottom){top=bottom;positionAttribute="bottom";}
const isOffscreenOnTop=top<topBoundary+pageYOffset;const isOffscreenOnBottom=top>bottomBoundary+pageYOffset;const isOffscreenOnLeft=left<leftBoundary+pageXOffset;const isOffscreenOnRight=left>rightBoundary+pageXOffset;if(isOffscreenOnTop){top=topBoundary;isOverlapTheNode=true;}else if(isOffscreenOnBottom){top=bottomBoundary;isOverlapTheNode=true;}else if(isOffscreenOnLeft||isOffscreenOnRight){isOverlapTheNode=true;top-=pageYOffset;}
if(isOverlapTheNode&&options.hideIfOffscreen){container.setAttribute("hidden","true");return;}else if(isOverlapTheNode){left=Math.min(Math.max(leftBoundary,left-pageXOffset),rightBoundary);position="fixed";container.setAttribute("hide-arrow","true");}else{position="absolute";container.removeAttribute("hide-arrow");}



container.setAttribute("style",`
    position:${position};
    transform-origin: 0 0;
    transform: scale(${1 / zoom}) translate(calc(${left}px - 50%), ${top}px)`);container.setAttribute("position",positionAttribute);}
exports.moveInfobar=moveInfobar;