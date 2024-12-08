//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FinderHighlighter"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"Color","resource://gre/modules/Color.jsm");ChromeUtils.defineModuleGetter(this,"Rect","resource://gre/modules/Geometry.jsm");XPCOMUtils.defineLazyGetter(this,"kDebug",()=>{const kDebugPref="findbar.modalHighlight.debug";return(Services.prefs.getPrefType(kDebugPref)&&Services.prefs.getBoolPref(kDebugPref));});const kContentChangeThresholdPx=5;const kBrightTextSampleSize=5;

const kPageIsTooBigPx=500000;const kModalHighlightRepaintLoFreqMs=100;const kModalHighlightRepaintHiFreqMs=16;const kHighlightAllPref="findbar.highlightAll";const kModalHighlightPref="findbar.modalHighlight";const kFontPropsCSS=["color","font-family","font-kerning","font-size","font-size-adjust","font-stretch","font-variant","font-weight","line-height","letter-spacing","text-emphasis","text-orientation","text-transform","word-spacing",];const kFontPropsCamelCase=kFontPropsCSS.map(prop=>{let parts=prop.split("-");return(parts.shift()+
parts.map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(""));});const kRGBRE=/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/i;
const kModalIdPrefix="cedee4d0-74c5-4f2d-ab43-4d37c0f9d463";const kModalOutlineId=kModalIdPrefix+"-findbar-modalHighlight-outline";const kOutlineBoxColor="255,197,53";const kOutlineBoxBorderSize=1;const kOutlineBoxBorderRadius=2;const kModalStyles={outlineNode:[["background-color",`rgb(${kOutlineBoxColor})`],["background-clip","padding-box"],["border",`${kOutlineBoxBorderSize}px solid rgba(${kOutlineBoxColor},.7)`],["border-radius",`${kOutlineBoxBorderRadius}px`],["box-shadow",`0 2px 0 0 rgba(0,0,0,.1)`],["color","#000"],["display","-moz-box"],["margin",`-${kOutlineBoxBorderSize}px 0 0 -${kOutlineBoxBorderSize}px !important`,],["overflow","hidden"],["pointer-events","none"],["position","absolute"],["white-space","nowrap"],["will-change","transform"],["z-index",2],],outlineNodeDebug:[["z-index",2147483647]],outlineText:[["margin","0 !important"],["padding","0 !important"],["vertical-align","top !important"],],maskNode:[["background","rgba(0,0,0,.25)"],["pointer-events","none"],["position","absolute"],["z-index",1],],maskNodeTransition:[["transition","background .2s ease-in"]],maskNodeDebug:[["z-index",2147483646],["top",0],["left",0],],maskNodeBrightText:[["background","rgba(255,255,255,.25)"]],};const kModalOutlineAnim={keyframes:[{transform:"scaleX(1) scaleY(1)"},{transform:"scaleX(1.5) scaleY(1.5)",offset:0.5,easing:"ease-in"},{transform:"scaleX(1) scaleY(1)"},],duration:50,};const kNSHTML="http://www.w3.org/1999/xhtml";const kRepaintSchedulerStopped=1;const kRepaintSchedulerPaused=2;const kRepaintSchedulerRunning=3;function mockAnonymousContentNode(domNode){return{setTextContentForElement(id,text){(domNode.querySelector("#"+id)||domNode).textContent=text;},getAttributeForElement(id,attrName){let node=domNode.querySelector("#"+id)||domNode;if(!node.hasAttribute(attrName)){return undefined;}
return node.getAttribute(attrName);},setAttributeForElement(id,attrName,attrValue){(domNode.querySelector("#"+id)||domNode).setAttribute(attrName,attrValue);},removeAttributeForElement(id,attrName){let node=domNode.querySelector("#"+id)||domNode;if(!node.hasAttribute(attrName)){return;}
node.removeAttribute(attrName);},remove(){try{domNode.remove();}catch(ex){}},setAnimationForElement(id,keyframes,duration){return(domNode.querySelector("#"+id)||domNode).animate(keyframes,duration);},setCutoutRectsForElement(id,rects){},};}
let gWindows=new WeakMap();function FinderHighlighter(finder,useTop=false){this._highlightAll=Services.prefs.getBoolPref(kHighlightAllPref);this._modal=Services.prefs.getBoolPref(kModalHighlightPref);this._useSubFrames=false;this._useTop=useTop;this.finder=finder;}
FinderHighlighter.prototype={get iterator(){return this.finder.iterator;},

getTopWindow(window,checkUseTop){if(this._useSubFrames||(checkUseTop&&this._useTop)){try{return window.top;}catch(ex){}}
return window;},useModal(){
return this._modal&&this._useSubFrames;},getForWindow(window,propName=null){if(!gWindows.has(window)){gWindows.set(window,{detectedGeometryChange:false,dynamicRangesSet:new Set(),frames:new Map(),lastWindowDimensions:{width:0,height:0},modalHighlightRectsMap:new Map(),previousRangeRectsAndTexts:{rectList:[],textList:[]},repaintSchedulerState:kRepaintSchedulerStopped,});}
return gWindows.get(window);},notifyFinished(highlight){for(let l of this.finder._listeners){try{l.onHighlightFinished(highlight);}catch(ex){}}},async highlight(highlight,word,linksOnly,drawOutline,useSubFrames){let window=this.finder._getWindow();let dict=this.getForWindow(window);let controller=this.finder._getSelectionController(window);let doc=window.document;this._found=false;this._useSubFrames=useSubFrames;let result={searchString:word,highlight,found:false};if(!controller||!doc||!doc.documentElement){ return result;}
if(highlight){let params={allowDistance:1,caseSensitive:this.finder._fastFind.caseSensitive,entireWord:this.finder._fastFind.entireWord,linksOnly,word,finder:this.finder,listener:this,matchDiacritics:this.finder._fastFind.matchDiacritics,useCache:true,useSubFrames,window,};if(this.iterator.isAlreadyRunning(params)||(this.useModal()&&this.iterator._areParamsEqual(params,dict.lastIteratorParams))){return result;}
if(!this.useModal()){dict.visible=true;}
await this.iterator.start(params);if(this._found){this.finder._outlineLink(drawOutline);}}else{this.hide(window);this._found=true;}
result.found=this._found;this.notifyFinished(result);return result;}, onIteratorRangeFound(range){this.highlightRange(range);this._found=true;},onIteratorReset(){},onIteratorRestart(){this.clear(this.finder._getWindow());},onIteratorStart(params){let window=this.finder._getWindow();let dict=this.getForWindow(window);dict.lastIteratorParams=params;if(!this.useModal()){this.hide(window,this.finder._fastFind.getFoundRange());}
this.clear(window);},highlightRange(range){let node=range.startContainer;let editableNode=this._getEditableNode(node);let window=node.ownerGlobal;let controller=this.finder._getSelectionController(window);if(editableNode){controller=editableNode.editor.selectionController;}
if(this.useModal()){this._modalHighlight(range,controller,window);}else{let findSelection=controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);findSelection.addRange(range);if(window!=this.getTopWindow(window)){let dict=this.getForWindow(this.getTopWindow(window));
dict.frames.set(window,{});}}
if(editableNode){
 this._addEditorListeners(editableNode.editor);}},show(window=null){window=this.getTopWindow(window||this.finder._getWindow());let dict=this.getForWindow(window);if(!this.useModal()||dict.visible){return;}
dict.visible=true;this._maybeCreateModalHighlightNodes(window);this._addModalHighlightListeners(window);},hide(window,skipRange=null,event=null){try{window=this.getTopWindow(window);}catch(ex){Cu.reportError(ex);return;}
let dict=this.getForWindow(window);let isBusySelecting=dict.busySelecting;dict.busySelecting=false;if(event&&event.type=="click"&&(event.button!==0||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.relatedTarget||isBusySelecting||(event.target.localName=="a"&&event.target.href))){return;}
this._clearSelection(this.finder._getSelectionController(window),skipRange);for(let frame of dict.frames.keys()){this._clearSelection(this.finder._getSelectionController(frame),skipRange);}
 
if(this._editors){let doc=window.document;for(let x=this._editors.length-1;x>=0;--x){if(this._editors[x].document==doc){this._clearSelection(this._editors[x].selectionController,skipRange); this._unhookListenersAtIndex(x);}}}
if(dict.modalRepaintScheduler){window.clearTimeout(dict.modalRepaintScheduler);dict.modalRepaintScheduler=null;dict.repaintSchedulerState=kRepaintSchedulerStopped;}
dict.lastWindowDimensions={width:0,height:0};this._removeRangeOutline(window);this._removeHighlightAllMask(window);this._removeModalHighlightListeners(window);dict.visible=false;},async update(data,foundInThisFrame){let window=this.finder._getWindow();let dict=this.getForWindow(window);let foundRange=this.finder._fastFind.getFoundRange();if(data.result==Ci.nsITypeAheadFind.FIND_NOTFOUND||!data.searchString||(foundInThisFrame&&!foundRange)){this.hide(window);return;}
this._useSubFrames=data.useSubFrames;if(!this.useModal()){if(this._highlightAll){dict.previousFoundRange=dict.currentFoundRange;dict.currentFoundRange=foundRange;let params=this.iterator.params;if(dict.visible&&this.iterator._areParamsEqual(params,dict.lastIteratorParams)){return;}
if(!dict.visible&&!params){params={word:data.searchString,linksOnly:data.linksOnly};}
if(params){await this.highlight(true,params.word,params.linksOnly,params.drawOutline,data.useSubFrames);}}
return;}
dict.animateOutline=true;this._finishOutlineAnimations(dict);if(foundRange!==dict.currentFoundRange||data.findAgain){dict.previousFoundRange=dict.currentFoundRange;dict.currentFoundRange=foundRange;if(!dict.visible){this.show(window);}else{this._maybeCreateModalHighlightNodes(window);}}
if(this._highlightAll){await this.highlight(true,data.searchString,data.linksOnly,data.drawOutline,data.useSubFrames);}},clear(window=null){if(!window||!this.getTopWindow(window)){return;}
let dict=this.getForWindow(this.getTopWindow(window));this._finishOutlineAnimations(dict);dict.dynamicRangesSet.clear();dict.frames.clear();dict.modalHighlightRectsMap.clear();dict.brightText=null;},clearCurrentOutline(window=null){let dict=this.getForWindow(this.getTopWindow(window));this._finishOutlineAnimations(dict);this._removeRangeOutline(window);},onLocationChange(){let window=this.finder._getWindow();if(!window||!this.getTopWindow(window)){return;}
this.hide(window);this.clear(window);this._removeRangeOutline(window);gWindows.delete(this.getTopWindow(window));},onModalHighlightChange(useModalHighlight){let window=this.finder._getWindow();if(window&&this.useModal()&&!useModalHighlight){this.hide(window);this.clear(window);}
this._modal=useModalHighlight;},onHighlightAllChange(highlightAll){this._highlightAll=highlightAll;if(!highlightAll){let window=this.finder._getWindow();if(!this.useModal()){this.hide(window);}
this.clear(window);this._scheduleRepaintOfMask(window);}},_clearSelection(controller,restoreRange=null){if(!controller){return;}
let sel=controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);sel.removeAllRanges();if(restoreRange){sel=controller.getSelection(Ci.nsISelectionController.SELECTION_NORMAL);sel.addRange(restoreRange);controller.setDisplaySelection(Ci.nsISelectionController.SELECTION_ATTENTION);controller.repaintSelection(Ci.nsISelectionController.SELECTION_NORMAL);}},_getDWU(window=null){return(window||this.finder._getWindow()).windowUtils;},_getRootBounds(window,includeScroll=true){let dwu=this._getDWU(this.getTopWindow(window,true));let cssPageRect=Rect.fromRect(dwu.getRootBounds());let scrollX={};let scrollY={};if(includeScroll&&window==this.getTopWindow(window,true)){dwu.getScrollXY(false,scrollX,scrollY);cssPageRect.translate(scrollX.value,scrollY.value);}
let currWin=window;while(currWin!=this.getTopWindow(window,true)){let frameOffsets=this._getFrameElementOffsets(currWin);cssPageRect.translate(frameOffsets.x,frameOffsets.y);
let el=currWin.browsingContext.embedderElement;currWin=currWin.parent;dwu=this._getDWU(currWin);let parentRect=Rect.fromRect(dwu.getBoundsWithoutFlushing(el));if(includeScroll){dwu.getScrollXY(false,scrollX,scrollY);parentRect.translate(scrollX.value,scrollY.value);


if(el.getAttribute("scrolling")=="no"&&currWin!=this.getTopWindow(window,true)){let docEl=currWin.document.documentElement;parentRect.translate(-docEl.scrollLeft,-docEl.scrollTop);}}
cssPageRect.translate(parentRect.left,parentRect.top);}
let frameOffsets=this._getFrameElementOffsets(currWin);cssPageRect.translate(frameOffsets.x,frameOffsets.y);return cssPageRect;},_getFrameElementOffsets(window){let frame=window.frameElement;if(!frame){return{x:0,y:0};}

let dict=this.getForWindow(this.getTopWindow(window,true));let frameData=dict.frames.get(window);if(!frameData){dict.frames.set(window,(frameData={}));}
if(frameData.offset){return frameData.offset;}
let style=frame.ownerGlobal.getComputedStyle(frame);
let borderOffset=[parseInt(style.borderLeftWidth,10)||0,parseInt(style.borderTopWidth,10)||0,];let paddingOffset=[parseInt(style.paddingLeft,10)||0,parseInt(style.paddingTop,10)||0,];return(frameData.offset={x:borderOffset[0]+paddingOffset[0],y:borderOffset[1]+paddingOffset[1],});},_getWindowDimensions(window){let dwu=this._getDWU(window);let{width,height}=dwu.getRootBounds();if(!width||!height){width=window.innerWidth+window.scrollMaxX-window.scrollMinX;height=window.innerHeight+window.scrollMaxY-window.scrollMinY;let scrollbarHeight={};let scrollbarWidth={};dwu.getScrollbarSize(false,scrollbarWidth,scrollbarHeight);width-=scrollbarWidth.value;height-=scrollbarHeight.value;}
return{width,height};},_getRangeFontStyle(range){let node=range.startContainer;while(node.nodeType!=1){node=node.parentNode;}
let style=node.ownerGlobal.getComputedStyle(node);let props={};for(let prop of kFontPropsCamelCase){if(prop in style&&style[prop]){props[prop]=style[prop];}}
return props;},_getHTMLFontStyle(fontStyle){let style=[];for(let prop of Object.getOwnPropertyNames(fontStyle)){let idx=kFontPropsCamelCase.indexOf(prop);if(idx==-1){continue;}
style.push(`${kFontPropsCSS[idx]}: ${fontStyle[prop]}`);}
return style.join("; ");},_getStyleString(stylePairs,...additionalStyles){let baseStyle=new Map(stylePairs);for(let additionalStyle of additionalStyles){for(let[prop,value]of additionalStyle){baseStyle.set(prop,value);}}
return[...baseStyle].map(([cssProp,cssVal])=>`${cssProp}: ${cssVal}`).join("; ");},_isColorBright(cssColor){cssColor=cssColor.match(kRGBRE);if(!cssColor||!cssColor.length){return false;}
cssColor.shift();return!new Color(...cssColor).useBrightText;},_detectBrightText(dict){let sampleSize=Math.min(dict.modalHighlightRectsMap.size,kBrightTextSampleSize);let ranges=[...dict.modalHighlightRectsMap.keys()];let rangesCount=ranges.length;if(sampleSize%2==0){if(dict.previousFoundRange||dict.currentFoundRange){ranges.push(dict.previousFoundRange||dict.currentFoundRange);++sampleSize;++rangesCount;}else{--sampleSize;}}
let brightCount=0;for(let i=0;i<sampleSize;++i){let range=ranges[Math.floor((rangesCount/sampleSize)*i)];let fontStyle=this._getRangeFontStyle(range);if(this._isColorBright(fontStyle.color)){++brightCount;}}
dict.brightText=brightCount>=Math.ceil(sampleSize/2);},_isInDynamicContainer(range){const kFixed=new Set(["fixed","sticky","scroll","auto"]);let node=range.startContainer;while(node.nodeType!=1){node=node.parentNode;}
let document=node.ownerDocument;let window=document.defaultView;let dict=this.getForWindow(this.getTopWindow(window));if(window!=this.getTopWindow(window)){if(!dict.frames.has(window)){dict.frames.set(window,{});}
return true;}
do{let style=window.getComputedStyle(node);if(kFixed.has(style.position)||kFixed.has(style.overflow)||kFixed.has(style.overflowX)||kFixed.has(style.overflowY)){return true;}
node=node.parentNode;}while(node&&node!=document.documentElement);return false;},_getRangeRectsAndTexts(range,dict=null){let window=range.startContainer.ownerGlobal;let bounds;if(dict&&dict.frames.has(window)){let frameData=dict.frames.get(window);bounds=frameData.bounds;if(!bounds){bounds=frameData.bounds=this._getRootBounds(window);}}else{bounds=this._getRootBounds(window);}
let topBounds=this._getRootBounds(this.getTopWindow(window,true),false);let rects=[];

let{rectList,textList}=range.getClientRectsAndTexts();for(let rect of rectList){rect=Rect.fromRect(rect);rect.x+=bounds.x;rect.y+=bounds.y;if(rect.intersects(topBounds)){rects.push(rect);}}
return{rectList:rects,textList};},_updateRangeRects(range,checkIfDynamic=true,dict=null){let window=range.startContainer.ownerGlobal;let rectsAndTexts=this._getRangeRectsAndTexts(range,dict);dict=dict||this.getForWindow(this.getTopWindow(window));let oldRectsAndTexts=dict.modalHighlightRectsMap.get(range);dict.modalHighlightRectsMap.set(range,rectsAndTexts);if(oldRectsAndTexts&&oldRectsAndTexts.rectList.length&&!rectsAndTexts.rectList.length){dict.detectedGeometryChange=true;}
if(checkIfDynamic&&this._isInDynamicContainer(range)){dict.dynamicRangesSet.add(range);}
return rectsAndTexts;},_updateDynamicRangesRects(dict){for(let frameData of dict.frames.values()){frameData.bounds=null;}
for(let range of dict.dynamicRangesSet){this._updateRangeRects(range,false,dict);}},_updateRangeOutline(dict){let range=dict.currentFoundRange;if(!range){return;}
let fontStyle=this._getRangeFontStyle(range);delete fontStyle.color;let rectsAndTexts=this._updateRangeRects(range,true,dict);let outlineAnonNode=dict.modalHighlightOutline;let rectCount=rectsAndTexts.rectList.length;let previousRectCount=dict.previousRangeRectsAndTexts.rectList.length;



let rebuildOutline=!outlineAnonNode||rectCount!==previousRectCount||rectCount!=1;dict.previousRangeRectsAndTexts=rectsAndTexts;let window=this.getTopWindow(range.startContainer.ownerGlobal);let document=window.document;if(rebuildOutline){this._removeRangeOutline(window);}

if(!rectsAndTexts.textList.length||(!rebuildOutline&&dict.previousUpdatedRange==range&&!dict.dynamicRangesSet.has(range))){return;}
let outlineBox;if(rebuildOutline){outlineBox=document.createElementNS(kNSHTML,"div");outlineBox.setAttribute("id",kModalOutlineId);}
const kModalOutlineTextId=kModalOutlineId+"-text";let i=0;for(let rect of rectsAndTexts.rectList){let text=rectsAndTexts.textList[i];


let intersectingSides=new Set();let previous=rectsAndTexts.rectList[i-1];if(previous&&rect.left-previous.right<=2*kOutlineBoxBorderSize){intersectingSides.add("left");}
let next=rectsAndTexts.rectList[i+1];if(next&&next.left-rect.right<=2*kOutlineBoxBorderSize){intersectingSides.add("right");}
let borderStyles=[...intersectingSides].map(side=>["border-"+side,0,]);if(intersectingSides.size){borderStyles.push(["margin",`-${kOutlineBoxBorderSize}px 0 0 ${
            intersectingSides.has("left") ? 0 : -kOutlineBoxBorderSize
          }px !important`,]);borderStyles.push(["border-radius",(intersectingSides.has("left")?0:kOutlineBoxBorderRadius)+"px "+
(intersectingSides.has("right")?0:kOutlineBoxBorderRadius)+"px "+
(intersectingSides.has("right")?0:kOutlineBoxBorderRadius)+"px "+
(intersectingSides.has("left")?0:kOutlineBoxBorderRadius)+"px",]);}
let outlineStyle=this._getStyleString(kModalStyles.outlineNode,[["top",rect.top+"px"],["left",rect.left+"px"],["height",rect.height+"px"],["width",rect.width+"px"],],borderStyles,kDebug?kModalStyles.outlineNodeDebug:[]);fontStyle.lineHeight=rect.height+"px";let textStyle=this._getStyleString(kModalStyles.outlineText)+"; "+
this._getHTMLFontStyle(fontStyle);if(rebuildOutline){let textBoxParent=outlineBox.appendChild(document.createElementNS(kNSHTML,"div"));textBoxParent.setAttribute("id",kModalOutlineId+i);textBoxParent.setAttribute("style",outlineStyle);let textBox=document.createElementNS(kNSHTML,"span");textBox.setAttribute("id",kModalOutlineTextId+i);textBox.setAttribute("style",textStyle);textBox.textContent=text;textBoxParent.appendChild(textBox);}else{
outlineAnonNode.setAttributeForElement(kModalOutlineId+i,"style",outlineStyle);outlineAnonNode.setAttributeForElement(kModalOutlineTextId+i,"style",textStyle);outlineAnonNode.setTextContentForElement(kModalOutlineTextId+i,text);}
++i;}
if(rebuildOutline){dict.modalHighlightOutline=kDebug?mockAnonymousContentNode((document.body||document.documentElement).appendChild(outlineBox)):document.insertAnonymousContent(outlineBox);}
if(dict.animateOutline&&!this._isPageTooBig(dict)){let animation;dict.animations=new Set();for(let i=rectsAndTexts.rectList.length-1;i>=0;--i){animation=dict.modalHighlightOutline.setAnimationForElement(kModalOutlineId+i,Cu.cloneInto(kModalOutlineAnim.keyframes,window),kModalOutlineAnim.duration);animation.onfinish=function(){dict.animations.delete(this);};dict.animations.add(animation);}}
dict.animateOutline=false;dict.ignoreNextContentChange=true;dict.previousUpdatedRange=range;},_finishOutlineAnimations(dict){if(!dict.animations){return;}
for(let animation of dict.animations){animation.finish();}},_removeRangeOutline(window){let dict=this.getForWindow(window);if(!dict.modalHighlightOutline){return;}
if(kDebug){dict.modalHighlightOutline.remove();}else{try{window.document.removeAnonymousContent(dict.modalHighlightOutline);}catch(ex){}}
dict.modalHighlightOutline=null;},_modalHighlight(range,controller,window){this._updateRangeRects(range);this.show(window);
this._scheduleRepaintOfMask(window);},_maybeCreateModalHighlightNodes(window){window=this.getTopWindow(window);let dict=this.getForWindow(window);if(dict.modalHighlightOutline){if(!dict.modalHighlightAllMask){this._repaintHighlightAllMask(window,false);this._scheduleRepaintOfMask(window);}else{this._scheduleRepaintOfMask(window,{contentChanged:true});}
return;}
let document=window.document;if(document.hidden){let onVisibilityChange=()=>{document.removeEventListener("visibilitychange",onVisibilityChange);this._maybeCreateModalHighlightNodes(window);};document.addEventListener("visibilitychange",onVisibilityChange);return;}
this._repaintHighlightAllMask(window,false);},_repaintHighlightAllMask(window,paintContent=true){window=this.getTopWindow(window);let dict=this.getForWindow(window);const kMaskId=kModalIdPrefix+"-findbar-modalHighlight-outlineMask";if(!dict.modalHighlightAllMask){let document=window.document;let maskNode=document.createElementNS(kNSHTML,"div");maskNode.setAttribute("id",kMaskId);dict.modalHighlightAllMask=kDebug?mockAnonymousContentNode((document.body||document.documentElement).appendChild(maskNode)):document.insertAnonymousContent(maskNode);}
let{width,height,}=(dict.lastWindowDimensions=this._getWindowDimensions(window));if(typeof dict.brightText!="boolean"||dict.updateAllRanges){this._detectBrightText(dict);}
let maskStyle=this._getStyleString(kModalStyles.maskNode,[["width",width+"px"],["height",height+"px"],],dict.brightText?kModalStyles.maskNodeBrightText:[],paintContent?kModalStyles.maskNodeTransition:[],kDebug?kModalStyles.maskNodeDebug:[]);dict.modalHighlightAllMask.setAttributeForElement(kMaskId,"style",maskStyle);this._updateRangeOutline(dict);let allRects=[];if(!dict.busyScrolling&&(paintContent||dict.modalHighlightAllMask)){
if(!dict.updateAllRanges){this._updateDynamicRangesRects(dict);}
let DOMRect=window.DOMRect;for(let[range,rectsAndTexts]of dict.modalHighlightRectsMap){if(!this.finder._fastFind.isRangeVisible(range,false)){continue;}
if(dict.updateAllRanges){rectsAndTexts=this._updateRangeRects(range);}

if(dict.detectedGeometryChange){return;}
for(let rect of rectsAndTexts.rectList){allRects.push(new DOMRect(rect.x,rect.y,rect.width,rect.height));}}
dict.updateAllRanges=false;}
dict.modalHighlightAllMask.setCutoutRectsForElement(kMaskId,allRects);dict.ignoreNextContentChange=true;},_removeHighlightAllMask(window){window=this.getTopWindow(window);let dict=this.getForWindow(window);if(!dict.modalHighlightAllMask){return;}

if(kDebug){dict.modalHighlightAllMask.remove();}else{try{window.document.removeAnonymousContent(dict.modalHighlightAllMask);}catch(ex){}}
dict.modalHighlightAllMask=null;},_isPageTooBig(dict){let{height,width}=dict.lastWindowDimensions;return height>=kPageIsTooBigPx||width>=kPageIsTooBigPx;},_scheduleRepaintOfMask(window,{contentChanged=false,scrollOnly=false,updateAllRanges=false}={}){if(!this.useModal()){return;}
window=this.getTopWindow(window);let dict=this.getForWindow(window);
if(dict.repaintSchedulerState==kRepaintSchedulerPaused||(contentChanged&&dict.ignoreNextContentChange)){dict.ignoreNextContentChange=false;return;}
let hasDynamicRanges=!!dict.dynamicRangesSet.size;let pageIsTooBig=this._isPageTooBig(dict);let repaintDynamicRanges=(scrollOnly||contentChanged)&&hasDynamicRanges&&!pageIsTooBig;let startedScrolling=!dict.busyScrolling&&scrollOnly;if(startedScrolling){dict.busyScrolling=startedScrolling;this._repaintHighlightAllMask(window);}


if(dict.busyScrolling&&(pageIsTooBig||hasDynamicRanges)){dict.ignoreNextContentChange=true;this._updateRangeOutline(dict);
if(dict.modalRepaintScheduler){window.clearTimeout(dict.modalRepaintScheduler);dict.modalRepaintScheduler=null;}}

if(!dict.unconditionalRepaintRequested){dict.unconditionalRepaintRequested=!contentChanged||repaintDynamicRanges;}
if(!dict.updateAllRanges){dict.updateAllRanges=updateAllRanges;}
if(dict.modalRepaintScheduler){return;}
let timeoutMs=hasDynamicRanges&&!dict.busyScrolling?kModalHighlightRepaintHiFreqMs:kModalHighlightRepaintLoFreqMs;dict.modalRepaintScheduler=window.setTimeout(()=>{dict.modalRepaintScheduler=null;dict.repaintSchedulerState=kRepaintSchedulerStopped;dict.busyScrolling=false;let pageContentChanged=dict.detectedGeometryChange;if(!pageContentChanged&&!pageIsTooBig){let{width:previousWidth,height:previousHeight,}=dict.lastWindowDimensions;let{width,height,}=(dict.lastWindowDimensions=this._getWindowDimensions(window));pageContentChanged=dict.detectedGeometryChange||Math.abs(previousWidth-width)>kContentChangeThresholdPx||Math.abs(previousHeight-height)>kContentChangeThresholdPx;}
dict.detectedGeometryChange=false;
if(pageContentChanged&&!pageIsTooBig){this.iterator.restart(this.finder);}
if(dict.unconditionalRepaintRequested||(dict.modalHighlightRectsMap.size&&pageContentChanged)){dict.unconditionalRepaintRequested=false;this._repaintHighlightAllMask(window);}},timeoutMs);dict.repaintSchedulerState=kRepaintSchedulerRunning;},_addModalHighlightListeners(window){window=this.getTopWindow(window);let dict=this.getForWindow(window);if(dict.highlightListeners){return;}
dict.highlightListeners=[this._scheduleRepaintOfMask.bind(this,window,{contentChanged:true}),this._scheduleRepaintOfMask.bind(this,window,{updateAllRanges:true}),this._scheduleRepaintOfMask.bind(this,window,{scrollOnly:true}),this.hide.bind(this,window,null),()=>(dict.busySelecting=true),()=>{if(window.document.hidden){dict.repaintSchedulerState=kRepaintSchedulerPaused;}else if(dict.repaintSchedulerState==kRepaintSchedulerPaused){dict.repaintSchedulerState=kRepaintSchedulerRunning;this._scheduleRepaintOfMask(window);}},];let target=this.iterator._getDocShell(window).chromeEventHandler;target.addEventListener("MozAfterPaint",dict.highlightListeners[0]);target.addEventListener("resize",dict.highlightListeners[1]);target.addEventListener("scroll",dict.highlightListeners[2],{capture:true,passive:true,});target.addEventListener("click",dict.highlightListeners[3]);target.addEventListener("selectstart",dict.highlightListeners[4]);window.document.addEventListener("visibilitychange",dict.highlightListeners[5]);},_removeModalHighlightListeners(window){window=this.getTopWindow(window);let dict=this.getForWindow(window);if(!dict.highlightListeners){return;}
let target=this.iterator._getDocShell(window).chromeEventHandler;target.removeEventListener("MozAfterPaint",dict.highlightListeners[0]);target.removeEventListener("resize",dict.highlightListeners[1]);target.removeEventListener("scroll",dict.highlightListeners[2],{capture:true,passive:true,});target.removeEventListener("click",dict.highlightListeners[3]);target.removeEventListener("selectstart",dict.highlightListeners[4]);window.document.removeEventListener("visibilitychange",dict.highlightListeners[5]);dict.highlightListeners=null;},_getEditableNode(node){if(node.nodeType===node.TEXT_NODE&&node.parentNode&&node.parentNode.parentNode&&(ChromeUtils.getClassName(node.parentNode.parentNode)==="HTMLInputElement"||ChromeUtils.getClassName(node.parentNode.parentNode)==="HTMLTextAreaElement")){return node.parentNode.parentNode;}
return null;},_addEditorListeners(editor){if(!this._editors){this._editors=[];this._stateListeners=[];}
let existingIndex=this._editors.indexOf(editor);if(existingIndex==-1){let x=this._editors.length;this._editors[x]=editor;this._stateListeners[x]=this._createStateListener();this._editors[x].addEditActionListener(this);this._editors[x].addDocumentStateListener(this._stateListeners[x]);}},_unhookListenersAtIndex(idx){this._editors[idx].removeEditActionListener(this);this._editors[idx].removeDocumentStateListener(this._stateListeners[idx]);this._editors.splice(idx,1);this._stateListeners.splice(idx,1);if(!this._editors.length){delete this._editors;delete this._stateListeners;}},_removeEditorListeners(editor){
 let idx=this._editors.indexOf(editor);if(idx==-1){return;} 
this._unhookListenersAtIndex(idx);},_checkOverlap(selectionRange,findRange){if(!selectionRange||!findRange){return false;}


 
if(findRange.isPointInRange(selectionRange.startContainer,selectionRange.startOffset)){return true;}
if(findRange.isPointInRange(selectionRange.endContainer,selectionRange.endOffset)){return true;}
if(selectionRange.isPointInRange(findRange.startContainer,findRange.startOffset)){return true;}
if(selectionRange.isPointInRange(findRange.endContainer,findRange.endOffset)){return true;}
return false;},_findRange(selection,node,offset){let rangeCount=selection.rangeCount;let rangeidx=0;let foundContainingRange=false;let range=null; while(!foundContainingRange&&rangeidx<rangeCount){range=selection.getRangeAt(rangeidx);if(range.isPointInRange(node,offset)){foundContainingRange=true;break;}
rangeidx++;}
if(foundContainingRange){return range;}
return null;}, WillDeleteText(textNode,offset,length){let editor=this._getEditableNode(textNode).editor;let controller=editor.selectionController;let fSelection=controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);let range=this._findRange(fSelection,textNode,offset);if(range){
 if(textNode!=range.endContainer||offset!=range.endOffset){
 fSelection.removeRange(range);if(fSelection.rangeCount==0){this._removeEditorListeners(editor);}}}},DidInsertText(textNode,offset,aString){let editor=this._getEditableNode(textNode).editor;let controller=editor.selectionController;let fSelection=controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);let range=this._findRange(fSelection,textNode,offset);if(range){
 if(textNode==range.startContainer&&offset==range.startOffset){range.setStart(range.startContainer,range.startOffset+aString.length);}else if(textNode!=range.endContainer||offset!=range.endOffset){
 fSelection.removeRange(range);if(fSelection.rangeCount==0){this._removeEditorListeners(editor);}}}},WillDeleteRanges(rangesToDelete){let{editor}=this._getEditableNode(rangesToDelete[0].startContainer);let controller=editor.selectionController;let fSelection=controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);let shouldDelete={};let numberOfDeletedSelections=0;let numberOfMatches=fSelection.rangeCount;


for(let fIndex=0;fIndex<numberOfMatches;fIndex++){shouldDelete[fIndex]=false;let fRange=fSelection.getRangeAt(fIndex);for(let selRange of rangesToDelete){if(shouldDelete[fIndex]){continue;}
let doesOverlap=this._checkOverlap(selRange,fRange);if(doesOverlap){shouldDelete[fIndex]=true;numberOfDeletedSelections++;}}}

if(!numberOfDeletedSelections){return;}
for(let i=numberOfMatches-1;i>=0;i--){if(shouldDelete[i]){fSelection.removeRange(fSelection.getRangeAt(i));}} 
if(!fSelection.rangeCount){this._removeEditorListeners(editor);}},_onEditorDestruction(aListener){
let idx=0;while(this._stateListeners[idx]!=aListener){idx++;} 
this._unhookListenersAtIndex(idx);},_createStateListener(){return{findbar:this,QueryInterface:ChromeUtils.generateQI(["nsIDocumentStateListener"]),NotifyDocumentWillBeDestroyed(){this.findbar._onEditorDestruction(this);}, notifyDocumentStateChanged(aDirty){},};},};