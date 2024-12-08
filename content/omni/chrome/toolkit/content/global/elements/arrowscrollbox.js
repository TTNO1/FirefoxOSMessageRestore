"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");class MozArrowScrollbox extends MozElements.BaseControl{static get inheritedAttributes(){return{"#scrollbutton-up":"disabled=scrolledtostart",".scrollbox-clip":"orient",scrollbox:"orient,align,pack,dir,smoothscroll","#scrollbutton-down":"disabled=scrolledtoend",};}
get markup(){return`
      <html:link rel="stylesheet" href="chrome://global/skin/toolbarbutton.css"/>
      <html:link rel="stylesheet" href="chrome://global/skin/arrowscrollbox.css"/>
      <toolbarbutton id="scrollbutton-up" part="scrollbutton-up"/>
      <spacer part="overflow-start-indicator"/>
      <box class="scrollbox-clip" part="scrollbox-clip" flex="1">
        <scrollbox part="scrollbox" flex="1">
          <html:slot/>
        </scrollbox>
      </box>
      <spacer part="overflow-end-indicator"/>
      <toolbarbutton id="scrollbutton-down" part="scrollbutton-down"/>
    `;}
constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.appendChild(this.fragment);this.scrollbox=this.shadowRoot.querySelector("scrollbox");this._scrollButtonUp=this.shadowRoot.getElementById("scrollbutton-up");this._scrollButtonDown=this.shadowRoot.getElementById("scrollbutton-down");this._arrowScrollAnim={scrollbox:this,requestHandle:0,start:function arrowSmoothScroll_start(){this.lastFrameTime=window.performance.now();if(!this.requestHandle){this.requestHandle=window.requestAnimationFrame(this.sample.bind(this));}},stop:function arrowSmoothScroll_stop(){window.cancelAnimationFrame(this.requestHandle);this.requestHandle=0;},sample:function arrowSmoothScroll_handleEvent(timeStamp){const scrollIndex=this.scrollbox._scrollIndex;const timePassed=timeStamp-this.lastFrameTime;this.lastFrameTime=timeStamp;const scrollDelta=0.5*timePassed*scrollIndex;this.scrollbox.scrollByPixels(scrollDelta,true);this.requestHandle=window.requestAnimationFrame(this.sample.bind(this));},};this._scrollIndex=0;this._scrollIncrement=null;this._ensureElementIsVisibleAnimationFrame=0;this._prevMouseScrolls=[null,null];this._touchStart=-1;this._scrollButtonUpdatePending=false;this._isScrolling=false;this._destination=0;this._direction=0;this.addEventListener("wheel",this.on_wheel);this.addEventListener("touchstart",this.on_touchstart);this.addEventListener("touchmove",this.on_touchmove);this.addEventListener("touchend",this.on_touchend);this.shadowRoot.addEventListener("click",this.on_click.bind(this));this.shadowRoot.addEventListener("mousedown",this.on_mousedown.bind(this));this.shadowRoot.addEventListener("mouseover",this.on_mouseover.bind(this));this.shadowRoot.addEventListener("mouseup",this.on_mouseup.bind(this));this.shadowRoot.addEventListener("mouseout",this.on_mouseout.bind(this));

this.scrollbox.addEventListener("underflow",event=>{this.on_underflow(event);this.dispatchEvent(new Event("underflow"));},true);this.scrollbox.addEventListener("overflow",event=>{this.on_overflow(event);this.dispatchEvent(new Event("overflow"));},true);this.scrollbox.addEventListener("scroll",event=>{this.on_scroll(event);this.dispatchEvent(new Event("scroll"));});this.scrollbox.addEventListener("scrollend",event=>{this.on_scrollend(event);this.dispatchEvent(new Event("scrollend"));});}
connectedCallback(){if(this.hasConnected){return;}
this.hasConnected=true;if(!this.hasAttribute("smoothscroll")){this.smoothScroll=Services.prefs.getBoolPref("toolkit.scrollbox.smoothScroll",true);}
this.removeAttribute("overflowing");this.initializeAttributeInheritance();this._updateScrollButtonsDisabledState();}
get fragment(){if(!this.constructor.hasOwnProperty("_fragment")){this.constructor._fragment=MozXULElement.parseXULToFragment(this.markup);}
return document.importNode(this.constructor._fragment,true);}
get _clickToScroll(){return this.hasAttribute("clicktoscroll");}
get _scrollDelay(){if(this._clickToScroll){return Services.prefs.getIntPref("toolkit.scrollbox.clickToScroll.scrollDelay",150);}
return/Mac/.test(navigator.platform)?25:50;}
get scrollIncrement(){if(this._scrollIncrement===null){this._scrollIncrement=Services.prefs.getIntPref("toolkit.scrollbox.scrollIncrement",20);}
return this._scrollIncrement;}
set smoothScroll(val){this.setAttribute("smoothscroll",!!val);return val;}
get smoothScroll(){return this.getAttribute("smoothscroll")=="true";}
get scrollClientRect(){return this.scrollbox.getBoundingClientRect();}
get scrollClientSize(){return this.getAttribute("orient")=="vertical"?this.scrollbox.clientHeight:this.scrollbox.clientWidth;}
get scrollSize(){return this.getAttribute("orient")=="vertical"?this.scrollbox.scrollHeight:this.scrollbox.scrollWidth;}
get lineScrollAmount(){
var elements=this._getScrollableElements();return elements.length&&this.scrollSize/elements.length;}
get scrollPosition(){return this.getAttribute("orient")=="vertical"?this.scrollbox.scrollTop:this.scrollbox.scrollLeft;}
get startEndProps(){if(!this._startEndProps){this._startEndProps=this.getAttribute("orient")=="vertical"?["top","bottom"]:["left","right"];}
return this._startEndProps;}
get isRTLScrollbox(){if(!this._isRTLScrollbox){this._isRTLScrollbox=this.getAttribute("orient")!="vertical"&&document.defaultView.getComputedStyle(this.scrollbox).direction=="rtl";}
return this._isRTLScrollbox;}
_onButtonClick(event){if(this._clickToScroll){this._distanceScroll(event);}}
_onButtonMouseDown(event,index){if(this._clickToScroll&&event.button==0){this._startScroll(index);}}
_onButtonMouseUp(event){if(this._clickToScroll&&event.button==0){this._stopScroll();}}
_onButtonMouseOver(index){if(this._clickToScroll){this._continueScroll(index);}else{this._startScroll(index);}}
_onButtonMouseOut(){if(this._clickToScroll){this._pauseScroll();}else{this._stopScroll();}}
_boundsWithoutFlushing(element){if(!("_DOMWindowUtils"in this)){this._DOMWindowUtils=window.windowUtils;}
return this._DOMWindowUtils?this._DOMWindowUtils.getBoundsWithoutFlushing(element):element.getBoundingClientRect();}
_canScrollToElement(element){if(element.hidden){return false;}


let rect=this._boundsWithoutFlushing(element);return!!(rect.top||rect.left||rect.width||rect.height);}
ensureElementIsVisible(element,aInstant){if(!this._canScrollToElement(element)){return;}
if(this._ensureElementIsVisibleAnimationFrame){window.cancelAnimationFrame(this._ensureElementIsVisibleAnimationFrame);}
this._ensureElementIsVisibleAnimationFrame=window.requestAnimationFrame(()=>{element.scrollIntoView({block:"nearest",behavior:aInstant?"instant":"auto",});this._ensureElementIsVisibleAnimationFrame=0;});}
scrollByIndex(index,aInstant){if(index==0){return;}
var rect=this.scrollClientRect;var[start,end]=this.startEndProps;var x=index>0?rect[end]+1:rect[start]-1;var nextElement=this._elementFromPoint(x,index);if(!nextElement){return;}
var targetElement;if(this.isRTLScrollbox){index*=-1;}
while(index<0&&nextElement){if(this._canScrollToElement(nextElement)){targetElement=nextElement;}
nextElement=nextElement.previousElementSibling;index++;}
while(index>0&&nextElement){if(this._canScrollToElement(nextElement)){targetElement=nextElement;}
nextElement=nextElement.nextElementSibling;index--;}
if(!targetElement){return;}
this.ensureElementIsVisible(targetElement,aInstant);}
_getScrollableElements(){let nodes=this.children;if(nodes.length==1){let node=nodes[0];if(node.localName=="slot"&&node.namespaceURI=="http://www.w3.org/1999/xhtml"){nodes=node.getRootNode().host.children;}}
return Array.prototype.filter.call(nodes,this._canScrollToElement,this);}
_elementFromPoint(aX,aPhysicalScrollDir){var elements=this._getScrollableElements();if(!elements.length){return null;}
if(this.isRTLScrollbox){elements.reverse();}
var[start,end]=this.startEndProps;var low=0;var high=elements.length-1;if(aX<elements[low].getBoundingClientRect()[start]||aX>elements[high].getBoundingClientRect()[end]){return null;}
var mid,rect;while(low<=high){mid=Math.floor((low+high)/2);rect=elements[mid].getBoundingClientRect();if(rect[start]>aX){high=mid-1;}else if(rect[end]<aX){low=mid+1;}else{return elements[mid];}}

if(!aPhysicalScrollDir){return null;}
if(aPhysicalScrollDir<0&&rect[start]>aX){mid=Math.max(mid-1,0);}else if(aPhysicalScrollDir>0&&rect[end]<aX){mid=Math.min(mid+1,elements.length-1);}
return elements[mid];}
_startScroll(index){if(this.isRTLScrollbox){index*=-1;}
if(this._clickToScroll){this._scrollIndex=index;this._mousedown=true;if(this.smoothScroll){this._arrowScrollAnim.start();return;}}
if(!this._scrollTimer){this._scrollTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}else{this._scrollTimer.cancel();}
let callback;if(this._clickToScroll){callback=()=>{if(!document&&this._scrollTimer){this._scrollTimer.cancel();}
this.scrollByIndex(this._scrollIndex);};}else{callback=()=>this.scrollByPixels(this.scrollIncrement*index);}
this._scrollTimer.initWithCallback(callback,this._scrollDelay,Ci.nsITimer.TYPE_REPEATING_SLACK);callback();}
_stopScroll(){if(this._scrollTimer){this._scrollTimer.cancel();}
if(this._clickToScroll){this._mousedown=false;if(!this._scrollIndex||!this.smoothScroll){return;}
this.scrollByIndex(this._scrollIndex);this._scrollIndex=0;this._arrowScrollAnim.stop();}}
_pauseScroll(){if(this._mousedown){this._stopScroll();this._mousedown=true;document.addEventListener("mouseup",this);document.addEventListener("blur",this,true);}}
_continueScroll(index){if(this._mousedown){this._startScroll(index);}}
_distanceScroll(aEvent){if(aEvent.detail<2||aEvent.detail>3){return;}
var scrollBack=aEvent.originalTarget==this._scrollButtonUp;var scrollLeftOrUp=this.isRTLScrollbox?!scrollBack:scrollBack;var targetElement;if(aEvent.detail==2){ let[start,end]=this.startEndProps;let x;if(scrollLeftOrUp){x=this.scrollClientRect[start]-this.scrollClientSize;}else{x=this.scrollClientRect[end]+this.scrollClientSize;}
targetElement=this._elementFromPoint(x,scrollLeftOrUp?-1:1); if(targetElement){targetElement=scrollBack?targetElement.nextElementSibling:targetElement.previousElementSibling;}}
if(!targetElement){ let elements=this._getScrollableElements();targetElement=scrollBack?elements[0]:elements[elements.length-1];}
this.ensureElementIsVisible(targetElement);}
handleEvent(aEvent){if(aEvent.type=="mouseup"||(aEvent.type=="blur"&&aEvent.target==document)){this._mousedown=false;document.removeEventListener("mouseup",this);document.removeEventListener("blur",this,true);}}
scrollByPixels(aPixels,aInstant){let scrollOptions={behavior:aInstant?"instant":"auto"};scrollOptions[this.startEndProps[0]]=aPixels;this.scrollbox.scrollBy(scrollOptions);}
_updateScrollButtonsDisabledState(){if(!this.hasAttribute("overflowing")){this.setAttribute("scrolledtoend","true");this.setAttribute("scrolledtostart","true");return;}
if(this._scrollButtonUpdatePending){return;}
this._scrollButtonUpdatePending=true;
window.requestAnimationFrame(()=>{setTimeout(()=>{if(!this.isConnected){return;}
this._scrollButtonUpdatePending=false;let scrolledToStart=false;let scrolledToEnd=false;if(!this.hasAttribute("overflowing")){scrolledToStart=true;scrolledToEnd=true;}else{let[leftOrTop,rightOrBottom]=this.startEndProps;let leftOrTopEdge=ele=>Math.round(this._boundsWithoutFlushing(ele)[leftOrTop]);let rightOrBottomEdge=ele=>Math.round(this._boundsWithoutFlushing(ele)[rightOrBottom]);let elements=this._getScrollableElements();let[leftOrTopElement,rightOrBottomElement]=[elements[0],elements[elements.length-1],];if(this.isRTLScrollbox){[leftOrTopElement,rightOrBottomElement]=[rightOrBottomElement,leftOrTopElement,];}
if(leftOrTopElement&&leftOrTopEdge(leftOrTopElement)>=leftOrTopEdge(this.scrollbox)){scrolledToStart=!this.isRTLScrollbox;scrolledToEnd=this.isRTLScrollbox;}else if(rightOrBottomElement&&rightOrBottomEdge(rightOrBottomElement)<=rightOrBottomEdge(this.scrollbox)){scrolledToStart=this.isRTLScrollbox;scrolledToEnd=!this.isRTLScrollbox;}}
if(scrolledToEnd){this.setAttribute("scrolledtoend","true");}else{this.removeAttribute("scrolledtoend");}
if(scrolledToStart){this.setAttribute("scrolledtostart","true");}else{this.removeAttribute("scrolledtostart");}},0);});}
disconnectedCallback(){if(this._scrollTimer){this._scrollTimer.cancel();this._scrollTimer=null;}}
on_wheel(event){if(!this.hasAttribute("overflowing")){return;}
let doScroll=false;let instant;let scrollAmount=0;if(this.getAttribute("orient")=="vertical"){doScroll=true;if(event.deltaMode==event.DOM_DELTA_PIXEL){scrollAmount=event.deltaY;}else if(event.deltaMode==event.DOM_DELTA_PAGE){scrollAmount=event.deltaY*this.scrollClientSize;}else{scrollAmount=event.deltaY*this.lineScrollAmount;}}else{



let isVertical=Math.abs(event.deltaY)>Math.abs(event.deltaX);let delta=isVertical?event.deltaY:event.deltaX;let scrollByDelta=isVertical&&this.isRTLScrollbox?-delta:delta;if(this._prevMouseScrolls.every(prev=>prev==isVertical)){doScroll=true;if(event.deltaMode==event.DOM_DELTA_PIXEL){scrollAmount=scrollByDelta;instant=true;}else if(event.deltaMode==event.DOM_DELTA_PAGE){scrollAmount=scrollByDelta*this.scrollClientSize;}else{scrollAmount=scrollByDelta*this.lineScrollAmount;}}
if(this._prevMouseScrolls.length>1){this._prevMouseScrolls.shift();}
this._prevMouseScrolls.push(isVertical);}
if(doScroll){let direction=scrollAmount<0?-1:1;let startPos=this.scrollPosition;if(!this._isScrolling||this._direction!=direction){this._destination=startPos+scrollAmount;this._direction=direction;}else{ this._destination=this._destination+scrollAmount;scrollAmount=this._destination-startPos;}
this.scrollByPixels(scrollAmount,instant);}
event.stopPropagation();event.preventDefault();}
on_touchstart(event){if(event.touches.length>1){



this._touchStart=-1;}else{this._touchStart=this.getAttribute("orient")=="vertical"?event.touches[0].screenY:event.touches[0].screenX;}}
on_touchmove(event){if(event.touches.length==1&&this._touchStart>=0){var touchPoint=this.getAttribute("orient")=="vertical"?event.touches[0].screenY:event.touches[0].screenX;var delta=this._touchStart-touchPoint;if(Math.abs(delta)>0){this.scrollByPixels(delta,true);this._touchStart=touchPoint;}
event.preventDefault();}}
on_touchend(event){this._touchStart=-1;}
on_underflow(event){
 if(event.target!=this.scrollbox||!this.hasAttribute("overflowing")){return;}

 
if(this.getAttribute("orient")=="vertical"){if(event.detail==1){return;}}else if(event.detail==0){ return;}
this.removeAttribute("overflowing");this._updateScrollButtonsDisabledState();}
on_overflow(event){ if(event.target!=this.scrollbox){return;}

 
if(this.getAttribute("orient")=="vertical"){if(event.detail==1){return;}}else if(event.detail==0){ return;}
this.setAttribute("overflowing","true");this._updateScrollButtonsDisabledState();}
on_scroll(event){this._isScrolling=true;this._updateScrollButtonsDisabledState();}
on_scrollend(event){this._isScrolling=false;this._destination=0;this._direction=0;}
on_click(event){if(event.originalTarget!=this._scrollButtonUp&&event.originalTarget!=this._scrollButtonDown){return;}
this._onButtonClick(event);}
on_mousedown(event){if(event.originalTarget==this._scrollButtonUp){this._onButtonMouseDown(event,-1);}
if(event.originalTarget==this._scrollButtonDown){this._onButtonMouseDown(event,1);}}
on_mouseup(event){if(event.originalTarget!=this._scrollButtonUp&&event.originalTarget!=this._scrollButtonDown){return;}
this._onButtonMouseUp(event);}
on_mouseover(event){if(event.originalTarget==this._scrollButtonUp){this._onButtonMouseOver(-1);}
if(event.originalTarget==this._scrollButtonDown){this._onButtonMouseOver(1);}}
on_mouseout(event){if(event.originalTarget!=this._scrollButtonUp&&event.originalTarget!=this._scrollButtonDown){return;}
this._onButtonMouseOut();}}
customElements.define("arrowscrollbox",MozArrowScrollbox);}