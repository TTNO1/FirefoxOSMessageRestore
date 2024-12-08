"use strict";function Spinner(props,context){this.context=context;this._init(props);}
{const ITEM_HEIGHT=2.5,VIEWPORT_SIZE=7,VIEWPORT_COUNT=5;Spinner.prototype={_init(props){const{id,setValue,getDisplayString,hideButtons,rootFontSize=10,}=props;const spinnerTemplate=document.getElementById("spinner-template");const spinnerElement=document.importNode(spinnerTemplate.content,true);
const viewportSize=props.viewportSize%2?props.viewportSize:VIEWPORT_SIZE;this.state={items:[],isScrolling:false,};this.props={setValue,getDisplayString,viewportSize,rootFontSize,

viewportTopOffset:(viewportSize-1)/2,};this.elements={container:spinnerElement.querySelector(".spinner-container"),spinner:spinnerElement.querySelector(".spinner"),up:spinnerElement.querySelector(".up"),down:spinnerElement.querySelector(".down"),itemsViewElements:[],};this.elements.spinner.style.height=ITEM_HEIGHT*viewportSize+"rem";if(id){this.elements.container.id=id;}
if(hideButtons){this.elements.container.classList.add("hide-buttons");}
this.context.appendChild(spinnerElement);this._attachEventListeners();},setState(newState){const{value,items}=this.state;const{value:newValue,items:newItems,isValueSet,isInvalid,smoothScroll=true,}=newState;if(this._isArrayDiff(newItems,items)){this.state=Object.assign(this.state,newState);this._updateItems();this._scrollTo(newValue,true);}else if(newValue!=value){this.state=Object.assign(this.state,newState);if(smoothScroll){this._smoothScrollTo(newValue,true);}else{this._scrollTo(newValue,true);}}
if(isValueSet&&!isInvalid){this._updateSelection();}else{this._removeSelection();}},_onScroll(){const{items,itemsView,isInfiniteScroll}=this.state;const{viewportSize,viewportTopOffset}=this.props;const{spinner}=this.elements;this.state.index=this._getIndexByOffset(spinner.scrollTop);const value=itemsView[this.state.index+viewportTopOffset].value; if(this.state.value!=value){this.state.value=value;this.props.setValue(value);}

if(items.length>=viewportSize&&isInfiniteScroll){
if(this.state.index<viewportSize||this.state.index>itemsView.length-viewportSize){this._scrollTo(this.state.value,true);}}
this.elements.spinner.classList.add("scrolling");},_onScrollend(){this.elements.spinner.classList.remove("scrolling");},_updateItems(){const{viewportSize,viewportTopOffset}=this.props;const{items,isInfiniteScroll}=this.state; let itemsView=new Array(viewportTopOffset).fill({}).concat(items);if(items.length>=viewportSize&&isInfiniteScroll){



let count=Math.ceil((viewportSize*VIEWPORT_COUNT)/items.length)*2;for(let i=0;i<count;i+=1){itemsView.push(...items);}}

this._prepareNodes(itemsView.length,this.elements.spinner); this._setDisplayStringAndClass(itemsView,this.elements.itemsViewElements);this.state.itemsView=itemsView;},_prepareNodes(length,parent){const diff=length-parent.childElementCount;if(!diff){return;}
if(diff>0){ let frag=document.createDocumentFragment(); if(parent.lastChild){parent.lastChild.style.marginBottom="";}
for(let i=0;i<diff;i++){let el=document.createElement("div");frag.appendChild(el);this.elements.itemsViewElements.push(el);}
parent.appendChild(frag);}else if(diff<0){ for(let i=0;i<Math.abs(diff);i++){parent.removeChild(parent.lastChild);}
this.elements.itemsViewElements.splice(diff);}
parent.lastChild.style.marginBottom=ITEM_HEIGHT*this.props.viewportTopOffset+"rem";},_setDisplayStringAndClass(items,elements){const{getDisplayString}=this.props;items.forEach((item,index)=>{elements[index].textContent=item.value!=undefined?getDisplayString(item.value):"";elements[index].className=item.enabled?"":"disabled";});},_attachEventListeners(){const{spinner,container}=this.elements;spinner.addEventListener("scroll",this,{passive:true});spinner.addEventListener("scrollend",this,{passive:true});container.addEventListener("mouseup",this,{passive:true});container.addEventListener("mousedown",this,{passive:true});},handleEvent(event){const{mouseState={},index,itemsView}=this.state;const{viewportTopOffset,setValue}=this.props;const{spinner,up,down}=this.elements;switch(event.type){case"scroll":{this._onScroll();break;}
case"scrollend":{this._onScrollend();break;}
case"mousedown":{this.state.mouseState={down:true,layerX:event.layerX,layerY:event.layerY,};if(event.target==up){
event.target.classList.add("active");this._smoothScrollToIndex(index-1);}
if(event.target==down){event.target.classList.add("active");this._smoothScrollToIndex(index+1);}
if(event.target.parentNode==spinner){ spinner.addEventListener("mousemove",this,{passive:true});spinner.addEventListener("mouseleave",this,{passive:true});}
break;}
case"mouseup":{this.state.mouseState.down=false;if(event.target==up||event.target==down){event.target.classList.remove("active");}
if(event.target.parentNode==spinner){if(event.layerX==mouseState.layerX&&event.layerY==mouseState.layerY){const newIndex=this._getIndexByOffset(event.target.offsetTop)-
viewportTopOffset;if(index==newIndex){
setValue(itemsView[index+viewportTopOffset].value);}else{this._smoothScrollToIndex(newIndex);}}else{this._smoothScrollToIndex(this._getIndexByOffset(spinner.scrollTop));} 
spinner.removeEventListener("mousemove",this,{passive:true});spinner.removeEventListener("mouseleave",this,{passive:true});}
break;}
case"mouseleave":{if(event.target==spinner){ this._smoothScrollToIndex(this._getIndexByOffset(spinner.scrollTop));spinner.removeEventListener("mousemove",this,{passive:true});spinner.removeEventListener("mouseleave",this,{passive:true});}
break;}
case"mousemove":{ spinner.scrollTop-=event.movementY;break;}}},_getIndexByOffset(offset){return Math.round(offset/(ITEM_HEIGHT*this.props.rootFontSize));},_getScrollIndex(value,centering){const{itemsView}=this.state;const{viewportTopOffset}=this.props; let currentIndex=centering||this.state.index==undefined?Math.round((itemsView.length-viewportTopOffset)/2):this.state.index;let closestIndex=itemsView.length;let indexes=[];let diff=closestIndex;let isValueFound=false; itemsView.forEach((item,index)=>{if(item.value==value){indexes.push(index);}}); indexes.forEach(index=>{let d=Math.abs(index-currentIndex);if(d<diff){diff=d;closestIndex=index;isValueFound=true;}});return isValueFound?closestIndex-viewportTopOffset:-1;},_scrollTo(value,centering){const index=this._getScrollIndex(value,centering); if(index>-1){this.state.index=index;this.elements.spinner.scrollTop=this.state.index*ITEM_HEIGHT*this.props.rootFontSize;}},_smoothScrollTo(value){const index=this._getScrollIndex(value); if(index>-1){this.state.index=index;this._smoothScrollToIndex(this.state.index);}},_smoothScrollToIndex(index){const element=this.elements.spinner.children[index];if(element){element.scrollIntoView({behavior:"smooth",block:"start",});}},_updateSelection(){const{itemsViewElements,selected}=this.elements;const{itemsView,index}=this.state;const{viewportTopOffset}=this.props;const currentItemIndex=index+viewportTopOffset;if(selected&&selected!=itemsViewElements[currentItemIndex]){this._removeSelection();}
this.elements.selected=itemsViewElements[currentItemIndex];if(itemsView[currentItemIndex]&&itemsView[currentItemIndex].enabled){this.elements.selected.classList.add("selection");}},_removeSelection(){const{selected}=this.elements;if(selected){selected.classList.remove("selection");}},_isArrayDiff(a,b){if(a==b){return false;}
if(a.length!=b.length){return true;}
for(let i=0;i<a.length;i++){for(let prop in a[i]){if(a[i][prop]!=b[i][prop]){return true;}}}
return false;},};}