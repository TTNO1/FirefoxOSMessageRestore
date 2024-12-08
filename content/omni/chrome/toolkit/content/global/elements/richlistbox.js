"use strict";
{const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");MozElements.RichListBox=class RichListBox extends MozElements.BaseControl{constructor(){super();this.selectedItems=new ChromeNodeList();this._currentIndex=null;this._lastKeyTime=0;this._incrementalString="";this._suppressOnSelect=false;this._userSelecting=false;this._selectTimeout=null;this._currentItem=null;this._selectionStart=null;this.addEventListener("keypress",event=>{if(event.altKey||event.metaKey){return;}
switch(event.keyCode){case KeyEvent.DOM_VK_UP:this._moveByOffsetFromUserEvent(-1,event);break;case KeyEvent.DOM_VK_DOWN:this._moveByOffsetFromUserEvent(1,event);break;case KeyEvent.DOM_VK_HOME:this._moveByOffsetFromUserEvent(-this.currentIndex,event);break;case KeyEvent.DOM_VK_END:this._moveByOffsetFromUserEvent(this.getRowCount()-this.currentIndex-1,event);break;case KeyEvent.DOM_VK_PAGE_UP:this._moveByOffsetFromUserEvent(this.scrollOnePage(-1),event);break;case KeyEvent.DOM_VK_PAGE_DOWN:this._moveByOffsetFromUserEvent(this.scrollOnePage(1),event);break;}},{mozSystemGroup:true});this.addEventListener("keypress",event=>{if(event.target!=this){return;}
if(event.key==" "&&event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.metaKey&&this.currentItem&&this.selType=="multiple"){this.toggleItemSelection(this.currentItem);}
if(!event.charCode||event.altKey||event.ctrlKey||event.metaKey){return;}
if(event.timeStamp-this._lastKeyTime>1000){this._incrementalString="";}
var key=String.fromCharCode(event.charCode).toLowerCase();this._incrementalString+=key;this._lastKeyTime=event.timeStamp;
 var incrementalString=/^(.)\1+$/.test(this._incrementalString)?RegExp.$1:this._incrementalString;var length=incrementalString.length;var rowCount=this.getRowCount();var l=this.selectedItems.length;var start=l>0?this.getIndexOfItem(this.selectedItems[l-1]):-1;
 if(start==-1||length==1){start++;}
for(var i=0;i<rowCount;i++){var k=(start+i)%rowCount;var listitem=this.getItemAtIndex(k);if(!this._canUserSelect(listitem)){continue;} 
var searchText="searchLabel"in listitem?listitem.searchLabel:listitem.getAttribute("label");searchText=searchText.substring(0,length).toLowerCase();if(searchText==incrementalString){this.ensureIndexIsVisible(k);this.timedSelect(listitem,this._selectDelay);break;}}});this.addEventListener("focus",event=>{if(this.getRowCount()>0){if(this.currentIndex==-1){this.currentIndex=this.getIndexOfFirstVisibleRow();let currentItem=this.getItemAtIndex(this.currentIndex);if(currentItem){this.selectItem(currentItem);}}else{this._fireEvent(this.currentItem,"DOMMenuItemActive");}}
this._lastKeyTime=0;});this.addEventListener("click",event=>{ if(event.originalTarget==this&&this.selType=="multiple"){this.clearSelection();this.currentItem=null;}});this.addEventListener("MozSwipeGesture",event=>{ switch(event.direction){case event.DIRECTION_DOWN:this.scrollTop=this.scrollHeight;break;case event.DIRECTION_UP:this.scrollTop=0;break;}});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.setAttribute("allowevents","true");this._refreshSelection();} 
set selectedItem(val){this.selectItem(val);}
get selectedItem(){return this.selectedItems.length?this.selectedItems[0]:null;} 
set selectedIndex(val){if(val>=0){

this._selecting={item:this.getItemAtIndex(val),index:val,};this.selectItem(this._selecting.item);delete this._selecting;}else{this.clearSelection();this.currentItem=null;}}
get selectedIndex(){if(this.selectedItems.length){return this.getIndexOfItem(this.selectedItems[0]);}
return-1;} 
set value(val){var kids=this.getElementsByAttribute("value",val);if(kids&&kids.item(0)){this.selectItem(kids[0]);}
return val;}
get value(){if(this.selectedItems.length){return this.selectedItem.value;}
return null;} 
get itemCount(){return this.itemChildren.length;} 
set selType(val){this.setAttribute("seltype",val);return val;}
get selType(){return this.getAttribute("seltype");} 
set currentItem(val){if(this._currentItem==val){return val;}
if(this._currentItem){this._currentItem.current=false;if(!val&&!this.suppressMenuItemEvent){this._fireEvent(this._currentItem,"DOMMenuItemInactive");}}
this._currentItem=val;if(val){val.current=true;if(!this.suppressMenuItemEvent){this._fireEvent(val,"DOMMenuItemActive");}}
return val;}
get currentItem(){return this._currentItem;} 
set currentIndex(val){if(val>=0){this.currentItem=this.getItemAtIndex(val);}else{this.currentItem=null;}}
get currentIndex(){return this.currentItem?this.getIndexOfItem(this.currentItem):-1;} 
get selectedCount(){return this.selectedItems.length;}
get itemChildren(){let children=Array.from(this.children).filter(node=>node.localName=="richlistitem");return children;}
set suppressOnSelect(val){this.setAttribute("suppressonselect",val);}
get suppressOnSelect(){return this.getAttribute("suppressonselect")=="true";}
set _selectDelay(val){this.setAttribute("_selectDelay",val);}
get _selectDelay(){return this.getAttribute("_selectDelay")||50;}
_fireOnSelect(){
if(this._suppressOnSelect||this.suppressOnSelect){return;} 
var state=this.currentItem?this.currentItem.id:"";if(this.selType=="multiple"&&this.selectedCount){let getId=function getId(aItem){return aItem.id;};state+=" "+
[...this.selectedItems].filter(getId).map(getId).join(" ");}
if(state){this.setAttribute("last-selected",state);}else{this.removeAttribute("last-selected");} 
if(this.currentIndex>-1){this._currentIndex=this.currentIndex+1;}
var event=document.createEvent("Events");event.initEvent("select",true,true);this.dispatchEvent(event);document.commandDispatcher.updateCommands("richlistbox-select");}
getNextItem(aStartItem,aDelta){while(aStartItem){aStartItem=aStartItem.nextSibling;if(aStartItem&&aStartItem.localName=="richlistitem"&&(!this._userSelecting||this._canUserSelect(aStartItem))){--aDelta;if(aDelta==0){return aStartItem;}}}
return null;}
getPreviousItem(aStartItem,aDelta){while(aStartItem){aStartItem=aStartItem.previousSibling;if(aStartItem&&aStartItem.localName=="richlistitem"&&(!this._userSelecting||this._canUserSelect(aStartItem))){--aDelta;if(aDelta==0){return aStartItem;}}}
return null;}
appendItem(aLabel,aValue){var item=this.ownerDocument.createXULElement("richlistitem");item.setAttribute("value",aValue);var label=this.ownerDocument.createXULElement("label");label.setAttribute("value",aLabel);label.setAttribute("flex","1");label.setAttribute("crop","end");item.appendChild(label);this.appendChild(item);return item;} 
getIndexOfItem(aItem){ if(aItem==null){return-1;}
if(this._selecting&&this._selecting.item==aItem){return this._selecting.index;}
return this.itemChildren.indexOf(aItem);} 
getItemAtIndex(aIndex){if(this._selecting&&this._selecting.index==aIndex){return this._selecting.item;}
return this.itemChildren[aIndex]||null;} 
addItemToSelection(aItem){if(this.selType!="multiple"&&this.selectedCount){return;}
if(aItem.selected){return;}
this.selectedItems.append(aItem);aItem.selected=true;this._fireOnSelect();} 
removeItemFromSelection(aItem){if(!aItem.selected){return;}
this.selectedItems.remove(aItem);aItem.selected=false;this._fireOnSelect();} 
toggleItemSelection(aItem){if(aItem.selected){this.removeItemFromSelection(aItem);}else{this.addItemToSelection(aItem);}} 
selectItem(aItem){if(!aItem||aItem.disabled){return;}
if(this.selectedItems.length==1&&this.selectedItems[0]==aItem){return;}
this._selectionStart=null;var suppress=this._suppressOnSelect;this._suppressOnSelect=true;this.clearSelection();this.addItemToSelection(aItem);this.currentItem=aItem;this._suppressOnSelect=suppress;this._fireOnSelect();} 
selectItemRange(aStartItem,aEndItem){if(this.selType!="multiple"){return;}
if(!aStartItem){aStartItem=this._selectionStart?this._selectionStart:this.currentItem;}
if(!aStartItem){aStartItem=aEndItem;}
var suppressSelect=this._suppressOnSelect;this._suppressOnSelect=true;this._selectionStart=aStartItem;var currentItem;var startIndex=this.getIndexOfItem(aStartItem);var endIndex=this.getIndexOfItem(aEndItem);if(endIndex<startIndex){currentItem=aEndItem;aEndItem=aStartItem;aStartItem=currentItem;}else{currentItem=aStartItem;}
while(currentItem){this.addItemToSelection(currentItem);if(currentItem==aEndItem){currentItem=this.getNextItem(currentItem,1);break;}
currentItem=this.getNextItem(currentItem,1);}



var userSelecting=this._userSelecting;this._userSelecting=false; for(;currentItem;currentItem=this.getNextItem(currentItem,1)){this.removeItemFromSelection(currentItem);}
for(currentItem=this.getItemAtIndex(0);currentItem!=aStartItem;currentItem=this.getNextItem(currentItem,1)){this.removeItemFromSelection(currentItem);}
this._userSelecting=userSelecting;this._suppressOnSelect=suppressSelect;this._fireOnSelect();} 
selectAll(){this._selectionStart=null;var suppress=this._suppressOnSelect;this._suppressOnSelect=true;var item=this.getItemAtIndex(0);while(item){this.addItemToSelection(item);item=this.getNextItem(item,1);}
this._suppressOnSelect=suppress;this._fireOnSelect();} 
clearSelection(){if(this.selectedItems){while(this.selectedItems.length){let item=this.selectedItems[0];item.selected=false;this.selectedItems.remove(item);}}
this._selectionStart=null;this._fireOnSelect();} 
getSelectedItem(aIndex){return aIndex<this.selectedItems.length?this.selectedItems[aIndex]:null;}
ensureIndexIsVisible(aIndex){return this.ensureElementIsVisible(this.getItemAtIndex(aIndex));}
ensureElementIsVisible(aElement,aAlignToTop){if(!aElement){return;}

var targetRect=aElement.getBoundingClientRect();var scrollRect=this.getBoundingClientRect();var offset=targetRect.top-scrollRect.top;if(!aAlignToTop&&offset>=0){ let scrollRectBottom=scrollRect.top+this.clientHeight;offset=targetRect.bottom-scrollRectBottom;if(offset<=0){return;}}
this.scrollTop+=offset;}
getIndexOfFirstVisibleRow(){var children=this.itemChildren;for(var ix=0;ix<children.length;ix++){if(this._isItemVisible(children[ix])){return ix;}}
return-1;}
getRowCount(){return this.itemChildren.length;}
scrollOnePage(aDirection){var children=this.itemChildren;if(!children.length){return 0;}
 
if(!this.currentItem){return aDirection==-1?children.length:0;}


let height=this.getBoundingClientRect().height;if(this._isItemVisible(this.currentItem)){this.scrollBy(0,height*aDirection);}

 
let currentItemRect=this.currentItem.getBoundingClientRect();var startBorder=currentItemRect.y;if(aDirection==-1){startBorder+=currentItemRect.height;}
var index=this.currentIndex;for(var ix=index;0<=ix&&ix<children.length;ix+=aDirection){let childRect=children[ix].getBoundingClientRect();if(childRect.height==0){continue;}
var endBorder=childRect.y+(aDirection==-1?childRect.height:0);if((endBorder-startBorder)*aDirection>height){break;}
index=ix;}
return index!=this.currentIndex?index-this.currentIndex:aDirection;}
_refreshSelection(){

 var state=this.getAttribute("last-selected");if(state){var ids=state.split(" ");var suppressSelect=this._suppressOnSelect;this._suppressOnSelect=true;this.clearSelection();for(let i=1;i<ids.length;i++){var selectedItem=document.getElementById(ids[i]);if(selectedItem){this.addItemToSelection(selectedItem);}}
var currentItem=document.getElementById(ids[0]);if(!currentItem&&this._currentIndex){currentItem=this.getItemAtIndex(Math.min(this._currentIndex-1,this.getRowCount()));}
if(currentItem){this.currentItem=currentItem;if(this.selType!="multiple"&&this.selectedCount==0){this.selectedItem=currentItem;}
if(this.getBoundingClientRect().height){this.ensureElementIsVisible(currentItem);}else{
this.ensureElementIsVisible(currentItem.previousElementSibling);}}
this._suppressOnSelect=suppressSelect;
this._fireOnSelect();return;}

if(this.selectedItems){let itemIds=[];for(let i=this.selectedCount-1;i>=0;i--){let selectedItem=this.selectedItems[i];itemIds.push(selectedItem.id);this.selectedItems.remove(selectedItem);}
for(let i=0;i<itemIds.length;i++){let selectedItem=document.getElementById(itemIds[i]);if(selectedItem){this.selectedItems.append(selectedItem);}}}
if(this.currentItem&&this.currentItem.id){this.currentItem=document.getElementById(this.currentItem.id);}else{this.currentItem=null;}

if(!this.currentItem&&this.selectedCount==0){this.currentIndex=this._currentIndex?this._currentIndex-1:0; var children=this.itemChildren;for(let i=0;i<children.length;++i){if(children[i].getAttribute("selected")=="true"){this.selectedItems.append(children[i]);}}}
if(this.selType!="multiple"&&this.selectedCount==0){this.selectedItem=this.currentItem;}}
_isItemVisible(aItem){if(!aItem){return false;}
var y=this.getBoundingClientRect().y; let itemRect=aItem.getBoundingClientRect();return(itemRect.y+itemRect.height>y&&itemRect.y<y+this.clientHeight);}
moveByOffset(aOffset,aIsSelecting,aIsSelectingRange){if((aIsSelectingRange||!aIsSelecting)&&this.selType!="multiple"){return;}
var newIndex=this.currentIndex+aOffset;if(newIndex<0){newIndex=0;}
var numItems=this.getRowCount();if(newIndex>numItems-1){newIndex=numItems-1;}
var newItem=this.getItemAtIndex(newIndex); if(this._userSelecting&&newItem&&!this._canUserSelect(newItem)){newItem=aOffset>0?this.getNextItem(newItem,1)||this.getPreviousItem(newItem,1):this.getPreviousItem(newItem,1)||this.getNextItem(newItem,1);}
if(newItem){this.ensureIndexIsVisible(this.getIndexOfItem(newItem));if(aIsSelectingRange){this.selectItemRange(null,newItem);}else if(aIsSelecting){this.selectItem(newItem);}
this.currentItem=newItem;}}
_moveByOffsetFromUserEvent(aOffset,aEvent){if(!aEvent.defaultPrevented){this._userSelecting=true;this.moveByOffset(aOffset,!aEvent.ctrlKey,aEvent.shiftKey);this._userSelecting=false;aEvent.preventDefault();}}
_canUserSelect(aItem){var style=document.defaultView.getComputedStyle(aItem);return(style.display!="none"&&style.visibility=="visible"&&style.MozUserInput!="none");}
_selectTimeoutHandler(aMe){aMe._fireOnSelect();aMe._selectTimeout=null;}
timedSelect(aItem,aTimeout){var suppress=this._suppressOnSelect;if(aTimeout!=-1){this._suppressOnSelect=true;}
this.selectItem(aItem);this._suppressOnSelect=suppress;if(aTimeout!=-1){if(this._selectTimeout){window.clearTimeout(this._selectTimeout);}
this._selectTimeout=window.setTimeout(this._selectTimeoutHandler,aTimeout,this);}}
ensureSelectedElementIsVisible(){return this.ensureElementIsVisible(this.selectedItem);}
_fireEvent(aTarget,aName){let event=document.createEvent("Events");event.initEvent(aName,true,true);aTarget.dispatchEvent(event);}};MozXULElement.implementCustomInterface(MozElements.RichListBox,[Ci.nsIDOMXULSelectControlElement,Ci.nsIDOMXULMultiSelectControlElement,]);customElements.define("richlistbox",MozElements.RichListBox);MozElements.MozRichlistitem=class MozRichlistitem extends MozElements.BaseText{constructor(){super();this.selectedByMouseOver=false;this.addEventListener("mousedown",event=>{var control=this.control;if(!control||control.disabled){return;}
if((!event.ctrlKey||(AppConstants.platform=="macosx"&&event.button==2))&&!event.shiftKey&&!event.metaKey){if(!this.selected){control.selectItem(this);}
control.currentItem=this;}});this.addEventListener("click",event=>{if(event.button!=0){return;}
var control=this.control;if(!control||control.disabled){return;}
control._userSelecting=true;if(control.selType!="multiple"){control.selectItem(this);}else if(event.ctrlKey||event.metaKey){control.toggleItemSelection(this);control.currentItem=this;}else if(event.shiftKey){control.selectItemRange(null,this);control.currentItem=this;}else{
 control.selectItemRange(this,this);}
control._userSelecting=false;});}
get label(){const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";return Array.from(this.getElementsByTagNameNS(XUL_NS,"label"),label=>label.value).join(" ");}
set searchLabel(val){if(val!==null){this.setAttribute("searchlabel",val);}
else{this.removeAttribute("searchlabel");}
return val;}
get searchLabel(){return this.hasAttribute("searchlabel")?this.getAttribute("searchlabel"):this.label;}
set value(val){this.setAttribute("value",val);return val;}
get value(){return this.getAttribute("value");}
set selected(val){if(val){this.setAttribute("selected","true");}else{this.removeAttribute("selected");}
return val;}
get selected(){return this.getAttribute("selected")=="true";}
get control(){var parent=this.parentNode;while(parent){if(parent.localName=="richlistbox"){return parent;}
parent=parent.parentNode;}
return null;}
set current(val){if(val){this.setAttribute("current","true");}else{this.removeAttribute("current");}
return val;}
get current(){return this.getAttribute("current")=="true";}};MozXULElement.implementCustomInterface(MozElements.MozRichlistitem,[Ci.nsIDOMXULSelectControlItemElement,]);customElements.define("richlistitem",MozElements.MozRichlistitem);}