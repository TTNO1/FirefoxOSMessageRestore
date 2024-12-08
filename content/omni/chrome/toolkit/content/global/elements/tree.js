"use strict";
{const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");class MozTreeChildren extends MozElements.BaseControl{constructor(){super();this.addEventListener("mousedown",event=>{if(this.parentNode.disabled){return;}
if(((!event.getModifierState("Accel")||!this.parentNode.pageUpOrDownMovesSelection)&&!event.shiftKey&&!event.metaKey)||this.parentNode.view.selection.single){var b=this.parentNode;var cell=b.getCellAt(event.clientX,event.clientY);var view=this.parentNode.view; this._lastSelectedRow=cell.row;if(cell.row==-1){return;}
if(cell.childElt=="twisty"){return;}
if(cell.col&&event.button==0){if(cell.col.cycler){view.cycleCell(cell.row,cell.col);return;}else if(cell.col.type==window.TreeColumn.TYPE_CHECKBOX){if(this.parentNode.editable&&cell.col.editable&&view.isEditable(cell.row,cell.col)){var value=view.getCellValue(cell.row,cell.col);value=value=="true"?"false":"true";view.setCellValue(cell.row,cell.col,value);return;}}}
if(!view.selection.isSelected(cell.row)){view.selection.select(cell.row);b.ensureRowIsVisible(cell.row);}}});this.addEventListener("click",event=>{if(event.button!=0){return;}
if(this.parentNode.disabled){return;}
var b=this.parentNode;var cell=b.getCellAt(event.clientX,event.clientY);var view=this.parentNode.view;if(cell.row==-1){return;}
if(cell.childElt=="twisty"){if(view.selection.currentIndex>=0&&view.isContainerOpen(cell.row)){var parentIndex=view.getParentIndex(view.selection.currentIndex);while(parentIndex>=0&&parentIndex!=cell.row){parentIndex=view.getParentIndex(parentIndex);}
if(parentIndex==cell.row){var parentSelectable=true;if(parentSelectable){view.selection.select(parentIndex);}}}
this.parentNode.changeOpenState(cell.row);return;}
if(!view.selection.single){var augment=event.getModifierState("Accel");if(event.shiftKey){view.selection.rangedSelect(-1,cell.row,augment);b.ensureRowIsVisible(cell.row);return;}
if(augment){view.selection.toggleSelect(cell.row);b.ensureRowIsVisible(cell.row);view.selection.currentIndex=cell.row;return;}}
if(!cell.col){return;}
 
if(!cell.col.cycler&&this._lastSelectedRow==cell.row&&cell.col.type!=window.TreeColumn.TYPE_CHECKBOX){view.selection.select(cell.row);b.ensureRowIsVisible(cell.row);}});this.addEventListener("dblclick",event=>{if(this.parentNode.disabled){return;}
var tree=this.parentNode;var view=this.parentNode.view;var row=view.selection.currentIndex;if(row==-1){return;}
var cell=tree.getCellAt(event.clientX,event.clientY);if(cell.childElt!="twisty"){this.parentNode.startEditing(row,cell.col);}
if(this.parentNode._editingColumn||!view.isContainer(row)){return;} 
if(cell.col&&!cell.col.cycler&&cell.childElt!="twisty"){this.parentNode.changeOpenState(row);}});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.setAttribute("slot","treechildren");this._lastSelectedRow=-1;if("_ensureColumnOrder"in this.parentNode){this.parentNode._ensureColumnOrder();}}}
customElements.define("treechildren",MozTreeChildren);class MozTreecolPicker extends MozElements.BaseControl{static get entities(){return["chrome://global/locale/tree.dtd"];}
static get markup(){return`
      <image class="tree-columnpicker-icon"></image>
      <menupopup anonid="popup">
        <menuseparator anonid="menuseparator"></menuseparator>
        <menuitem anonid="menuitem" label="&restoreColumnOrder.label;"></menuitem>
      </menupopup>
      `;}
constructor(){super();this.addEventListener("command",event=>{if(event.originalTarget==this){var popup=this.querySelector('[anonid="popup"]');this.buildPopup(popup);popup.openPopup(this,"after_end");}else{var tree=this.parentNode.parentNode;tree.stopEditing(true);var menuitem=this.querySelector('[anonid="menuitem"]');if(event.originalTarget==menuitem){this.style.MozBoxOrdinalGroup="";tree._ensureColumnOrder(tree.NATURAL_ORDER);}else{var colindex=event.originalTarget.getAttribute("colindex");var column=tree.columns[colindex];if(column){var element=column.element;if(element.getAttribute("hidden")=="true"){element.setAttribute("hidden","false");}else{element.setAttribute("hidden","true");}}}}});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.textContent="";this.appendChild(this.constructor.fragment);}
buildPopup(aPopup){
aPopup.querySelectorAll("[colindex]").forEach(e=>{e.remove();});var refChild=aPopup.firstChild;var tree=this.parentNode.parentNode;for(var currCol=tree.columns.getFirstColumn();currCol;currCol=currCol.getNext()){
var currElement=currCol.element;if(!currElement.hasAttribute("ignoreincolumnpicker")){var popupChild=document.createXULElement("menuitem");popupChild.setAttribute("type","checkbox");var columnName=currElement.getAttribute("display")||currElement.getAttribute("label");popupChild.setAttribute("label",columnName);popupChild.setAttribute("colindex",currCol.index);if(currElement.getAttribute("hidden")!="true"){popupChild.setAttribute("checked","true");}
if(currCol.primary){popupChild.setAttribute("disabled","true");}
if(currElement.hasAttribute("closemenu")){popupChild.setAttribute("closemenu",currElement.getAttribute("closemenu"));}
aPopup.insertBefore(popupChild,refChild);}}
var hidden=!tree.enableColumnDrag;aPopup.querySelectorAll(":scope > :not([colindex])").forEach(e=>{e.hidden=hidden;});}}
customElements.define("treecolpicker",MozTreecolPicker);class MozTreecol extends MozElements.BaseControl{static get inheritedAttributes(){return{".treecol-sortdirection":"sortdirection,hidden=hideheader",".treecol-text":"value=label,crop",};}
static get markup(){return`
        <label class="treecol-text" flex="1" crop="right"></label>
        <image class="treecol-sortdirection"></image>
      `;}
constructor(){super();this.addEventListener("mousedown",event=>{if(event.button!=0){return;}
if(this.parentNode.parentNode.enableColumnDrag){var XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";var cols=this.parentNode.getElementsByTagNameNS(XUL_NS,"treecol"); var visible=0;for(var i=0;i<cols.length;++i){if(cols[i].getBoundingClientRect().width>0){++visible;}}
if(visible>1){window.addEventListener("mousemove",this._onDragMouseMove,true);window.addEventListener("mouseup",this._onDragMouseUp,true);document.treecolDragging=this;this.mDragGesturing=true;this.mStartDragX=event.clientX;this.mStartDragY=event.clientY;}}});this.addEventListener("click",event=>{if(event.button!=0){return;}
if(event.target!=event.originalTarget){return;}

if(AppConstants.platform=="win"&&event.detail%2==0){return;}
var tree=this.parentNode.parentNode;if(tree.columns){tree.view.cycleHeader(tree.columns.getColumnFor(this));}});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.textContent="";this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();if(this.hasAttribute("ordinal")){this.style.MozBoxOrdinalGroup=this.getAttribute("ordinal");}}
set ordinal(val){this.style.MozBoxOrdinalGroup=val;this.setAttribute("ordinal",val);return val;}
get ordinal(){var val=this.style.MozBoxOrdinalGroup;if(val==""){return"1";}
return""+(val=="0"?0:parseInt(val));}
get _previousVisibleColumn(){var tree=this.parentNode.parentNode;let sib=tree.columns.getColumnFor(this).previousColumn;while(sib){if(sib.element&&sib.element.getBoundingClientRect().width>0){return sib.element;}
sib=sib.previousColumn;}
return null;}
_onDragMouseMove(aEvent){var col=document.treecolDragging;if(!col){return;}
 
if(col.mDragGesturing){if(Math.abs(aEvent.clientX-col.mStartDragX)<5&&Math.abs(aEvent.clientY-col.mStartDragY)<5){return;}
col.mDragGesturing=false;col.setAttribute("dragging","true");window.addEventListener("click",col._onDragMouseClick,true);}
var pos={};var targetCol=col.parentNode.parentNode._getColumnAtX(aEvent.clientX,0.5,pos); if(col.mTargetCol==targetCol&&col.mTargetDir==pos.value){return;}
var tree=col.parentNode.parentNode;var sib;var column;if(col.mTargetCol){ col.mTargetCol.removeAttribute("insertbefore");col.mTargetCol.removeAttribute("insertafter");column=tree.columns.getColumnFor(col.mTargetCol);tree.invalidateColumn(column);sib=col.mTargetCol._previousVisibleColumn;if(sib){sib.removeAttribute("insertafter");column=tree.columns.getColumnFor(sib);tree.invalidateColumn(column);}
col.mTargetCol=null;col.mTargetDir=null;}
if(targetCol){ if(pos.value=="after"){targetCol.setAttribute("insertafter","true");}else{targetCol.setAttribute("insertbefore","true");sib=targetCol._previousVisibleColumn;if(sib){sib.setAttribute("insertafter","true");column=tree.columns.getColumnFor(sib);tree.invalidateColumn(column);}}
column=tree.columns.getColumnFor(targetCol);tree.invalidateColumn(column);col.mTargetCol=targetCol;col.mTargetDir=pos.value;}}
_onDragMouseUp(aEvent){var col=document.treecolDragging;if(!col){return;}
if(!col.mDragGesturing){if(col.mTargetCol){ var before=col.mTargetCol.hasAttribute("insertbefore");col.mTargetCol.removeAttribute(before?"insertbefore":"insertafter");var sib=col.mTargetCol._previousVisibleColumn;if(before&&sib){sib.removeAttribute("insertafter");}
 
var move=true;
 if(before&&col==sib){move=false;}else if(!before&&col==col.mTargetCol){
move=false;}
if(move){col.parentNode.parentNode._reorderColumn(col,col.mTargetCol,before);} 
col.parentNode.parentNode.invalidate();col.mTargetCol=null;}}else{col.mDragGesturing=false;}
document.treecolDragging=null;col.removeAttribute("dragging");window.removeEventListener("mousemove",col._onDragMouseMove,true);window.removeEventListener("mouseup",col._onDragMouseUp,true);
 var clickHandler=function(handler){window.removeEventListener("click",handler,true);};window.setTimeout(clickHandler,0,col._onDragMouseClick);}
_onDragMouseClick(aEvent){ aEvent.stopPropagation();aEvent.preventDefault();}}
customElements.define("treecol",MozTreecol);class MozTreecols extends MozElements.BaseControl{static get inheritedAttributes(){return{treecolpicker:"tooltiptext=pickertooltiptext",};}
static get markup(){return`
      <treecolpicker class="treecol-image" fixed="true"></treecolpicker>
      `;}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.setAttribute("slot","treecols");if(!this.querySelector("treecolpicker")){this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();}

for(let splitter of this.getElementsByTagName("splitter")){if(!splitter.hasAttribute("resizeafter")){splitter.setAttribute("resizeafter","farthest");}}}}
customElements.define("treecols",MozTreecols);class MozTree extends MozElements.BaseControlMixin(MozElements.MozElementMixin(XULTreeElement)){static get markup(){return`
      <html:link rel="stylesheet" href="chrome://global/content/widgets.css" />
      <html:slot name="treecols"></html:slot>
      <stack class="tree-stack" flex="1">
        <hbox class="tree-rows" flex="1">
          <hbox flex="1" class="tree-bodybox">
            <html:slot name="treechildren"></html:slot>
          </hbox>
          <scrollbar height="0" minwidth="0" minheight="0" orient="vertical"
                     class="hidevscroll-scrollbar scrollbar-topmost"
                     ></scrollbar>
        </hbox>
        <html:input class="tree-input" type="text" hidden="true"/>
      </stack>
      <hbox class="hidehscroll-box">
        <scrollbar orient="horizontal" flex="1" increment="16" class="scrollbar-topmost" ></scrollbar>
        <scrollcorner class="hidevscroll-scrollcorner"></scrollcorner>
      </hbox>
      `;}
constructor(){super();
this.CURRENT_ORDER=0;this.NATURAL_ORDER=1; this.attachShadow({mode:"open"});let handledElements=this.constructor.fragment.querySelectorAll("scrollbar,scrollcorner");let stopAndPrevent=e=>{e.stopPropagation();e.preventDefault();};let stopProp=e=>e.stopPropagation();for(let el of handledElements){el.addEventListener("click",stopAndPrevent);el.addEventListener("contextmenu",stopAndPrevent);el.addEventListener("dblclick",stopProp);el.addEventListener("command",stopProp);}
this.shadowRoot.appendChild(this.constructor.fragment);}
static get inheritedAttributes(){return{".hidehscroll-box":"collapsed=hidehscroll",".hidevscroll-scrollbar":"collapsed=hidevscroll",".hidevscroll-scrollcorner":"collapsed=hidevscroll",};}
connectedCallback(){if(this.delayConnectedCallback()){return;}
if(!this._eventListenersSetup){this._eventListenersSetup=true;this.setupEventListeners();}
this.setAttribute("hidevscroll","true");this.setAttribute("hidehscroll","true");this.setAttribute("clickthrough","never");this.initializeAttributeInheritance();this.pageUpOrDownMovesSelection=AppConstants.platform!="macosx";this._inputField=null;this._editingRow=-1;this._editingColumn=null;this._columnsDirty=true;this._lastKeyTime=0;this._incrementalString="";this._touchY=-1;}
setupEventListeners(){this.addEventListener("underflow",event=>{


if(event.target.tagName!="treechildren"){return;}
if(event.detail==1){this.setAttribute("hidehscroll","true");}else if(event.detail==0){this.setAttribute("hidevscroll","true");}
event.stopPropagation();});this.addEventListener("overflow",event=>{if(event.target.tagName!="treechildren"){return;}
if(event.detail==1){this.removeAttribute("hidehscroll");}else if(event.detail==0){this.removeAttribute("hidevscroll");}
event.stopPropagation();});this.addEventListener("touchstart",event=>{function isScrollbarElement(target){return((target.localName=="thumb"||target.localName=="slider")&&target.namespaceURI=="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");}
if(event.touches.length>1||isScrollbarElement(event.touches[0].target)){





this._touchY=-1;}else{this._touchY=event.touches[0].screenY;}});this.addEventListener("touchmove",event=>{if(event.touches.length==1&&this._touchY>=0){var deltaY=this._touchY-event.touches[0].screenY;var lines=Math.trunc(deltaY/this.rowHeight);if(Math.abs(lines)>0){this.scrollByLines(lines);deltaY-=lines*this.rowHeight;this._touchY=event.touches[0].screenY+deltaY;}
event.preventDefault();}});this.addEventListener("touchend",event=>{this._touchY=-1;}); this.shadowRoot.addEventListener("MozMousePixelScroll",event=>{if(!(this.getAttribute("allowunderflowscroll")=="true"&&this.getAttribute("hidevscroll")=="true")){event.preventDefault();}}); this.shadowRoot.addEventListener("DOMMouseScroll",event=>{if(!(this.getAttribute("allowunderflowscroll")=="true"&&this.getAttribute("hidevscroll")=="true")){event.preventDefault();}
if(this._editingColumn){return;}
if(event.axis==event.HORIZONTAL_AXIS){return;}
var rows=event.detail;if(rows==UIEvent.SCROLL_PAGE_UP){this.scrollByPages(-1);}else if(rows==UIEvent.SCROLL_PAGE_DOWN){this.scrollByPages(1);}else{this.scrollByLines(rows);}});this.addEventListener("MozSwipeGesture",event=>{ let targetRow=0; switch(event.direction){case event.DIRECTION_DOWN:targetRow=this.view.rowCount-1; case event.DIRECTION_UP:this.ensureRowIsVisible(targetRow);break;}});this.addEventListener("select",event=>{if(event.originalTarget==this){this.stopEditing(true);}});this.addEventListener("focus",event=>{this.focused=true;if(this.currentIndex==-1&&this.view.rowCount>0){this.currentIndex=this.getFirstVisibleRow();}});this.addEventListener("blur",event=>{this.focused=false;if(event.target==this.inputField){this.stopEditing(true);}},true);this.addEventListener("keydown",event=>{if(event.altKey){return;}
let toggleClose=()=>{if(this._editingColumn){return;}
let row=this.currentIndex;if(row<0){return;}
if(this.changeOpenState(this.currentIndex,false)){event.preventDefault();return;}
let parentIndex=this.view.getParentIndex(this.currentIndex);if(parentIndex>=0){this.view.selection.select(parentIndex);this.ensureRowIsVisible(parentIndex);event.preventDefault();}};let toggleOpen=()=>{if(this._editingColumn){return;}
let row=this.currentIndex;if(row<0){return;}
if(this.changeOpenState(row,true)){event.preventDefault();return;}
let c=row+1;let view=this.view;if(c<view.rowCount&&view.getParentIndex(c)==row){
this.view.selection.timedSelect(c,this._selectDelay);this.ensureRowIsVisible(c);event.preventDefault();}};switch(event.keyCode){case KeyEvent.DOM_VK_RETURN:{if(this._handleEnter(event)){event.stopPropagation();event.preventDefault();}
break;}
case KeyEvent.DOM_VK_ESCAPE:{if(this._editingColumn){this.stopEditing(false);this.focus();event.stopPropagation();event.preventDefault();}
break;}
case KeyEvent.DOM_VK_LEFT:{if(!this.isRTL){toggleClose();}else{toggleOpen();}
break;}
case KeyEvent.DOM_VK_RIGHT:{if(!this.isRTL){toggleOpen();}else{toggleClose();}
break;}
case KeyEvent.DOM_VK_UP:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveByOffsetShift(-1,0,event);}else{this._moveByOffset(-1,0,event);}
break;}
case KeyEvent.DOM_VK_DOWN:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveByOffsetShift(1,this.view.rowCount-1,event);}else{this._moveByOffset(1,this.view.rowCount-1,event);}
break;}
case KeyEvent.DOM_VK_PAGE_UP:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveByPageShift(-1,0,event);}else{this._moveByPage(-1,0,event);}
break;}
case KeyEvent.DOM_VK_PAGE_DOWN:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveByPageShift(1,this.view.rowCount-1,event);}else{this._moveByPage(1,this.view.rowCount-1,event);}
break;}
case KeyEvent.DOM_VK_HOME:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveToEdgeShift(0,event);}else{this._moveToEdge(0,event);}
break;}
case KeyEvent.DOM_VK_END:{if(this._editingColumn){return;}
if(event.getModifierState("Shift")){this._moveToEdgeShift(this.view.rowCount-1,event);}else{this._moveToEdge(this.view.rowCount-1,event);}
break;}}});this.addEventListener("keypress",event=>{if(this._editingColumn){return;}
if(event.charCode==" ".charCodeAt(0)){var c=this.currentIndex;if(!this.view.selection.isSelected(c)||(!this.view.selection.single&&event.getModifierState("Accel"))){this.view.selection.toggleSelect(c);event.preventDefault();}}else if(!this.disableKeyNavigation&&event.charCode>0&&!event.altKey&&!event.getModifierState("Accel")&&!event.metaKey&&!event.ctrlKey){var l=this._keyNavigate(event);if(l>=0){this.view.selection.timedSelect(l,this._selectDelay);this.ensureRowIsVisible(l);}
event.preventDefault();}});}
get body(){return this.treeBody;}
get isRTL(){return document.defaultView.getComputedStyle(this).direction=="rtl";}
set editable(val){if(val){this.setAttribute("editable","true");}else{this.removeAttribute("editable");}
return val;}
get editable(){return this.getAttribute("editable")=="true";}
set selType(val){this.setAttribute("seltype",val);return val;}
get selType(){return this.getAttribute("seltype");}
set currentIndex(val){if(this.view){return(this.view.selection.currentIndex=val);}
return val;}
get currentIndex(){if(this.view&&this.view.selection){return this.view.selection.currentIndex;}
return-1;}
set keepCurrentInView(val){if(val){this.setAttribute("keepcurrentinview","true");}else{this.removeAttribute("keepcurrentinview");}
return val;}
get keepCurrentInView(){return this.getAttribute("keepcurrentinview")=="true";}
set enableColumnDrag(val){if(val){this.setAttribute("enableColumnDrag","true");}else{this.removeAttribute("enableColumnDrag");}
return val;}
get enableColumnDrag(){return this.hasAttribute("enableColumnDrag");}
get inputField(){if(!this._inputField){this._inputField=this.shadowRoot.querySelector(".tree-input");this._inputField.addEventListener("blur",()=>this.stopEditing(true));}
return this._inputField;}
set disableKeyNavigation(val){if(val){this.setAttribute("disableKeyNavigation","true");}else{this.removeAttribute("disableKeyNavigation");}
return val;}
get disableKeyNavigation(){return this.hasAttribute("disableKeyNavigation");}
get editingRow(){return this._editingRow;}
get editingColumn(){return this._editingColumn;}
set _selectDelay(val){this.setAttribute("_selectDelay",val);}
get _selectDelay(){return this.getAttribute("_selectDelay")||50;}
 
_ensureColumnOrder(order=this.CURRENT_ORDER){if(this.columns){
 var cols=[];if(order==this.CURRENT_ORDER){for(let col=this.columns.getFirstColumn();col;col=col.getNext()){cols.push(col.element);}}else{ cols=this.getElementsByTagName("treecol");}
for(let i=0;i<cols.length;++i){cols[i].ordinal=i*2+1;}
 
var splitters=this.getElementsByTagName("splitter");for(let i=0;i<splitters.length;++i){splitters[i].style.MozBoxOrdinalGroup=(i+1)*2;}}}
_reorderColumn(aColMove,aColBefore,aBefore){this._ensureColumnOrder();var i;var cols=[];var col=this.columns.getColumnFor(aColBefore);if(parseInt(aColBefore.ordinal)<parseInt(aColMove.ordinal)){if(aBefore){cols.push(aColBefore);}
for(col=col.getNext();col.element!=aColMove;col=col.getNext()){cols.push(col.element);}
aColMove.ordinal=cols[0].ordinal;for(i=0;i<cols.length;++i){cols[i].ordinal=parseInt(cols[i].ordinal)+2;}}else if(aColBefore.ordinal!=aColMove.ordinal){if(!aBefore){cols.push(aColBefore);}
for(col=col.getPrevious();col.element!=aColMove;col=col.getPrevious()){cols.push(col.element);}
aColMove.ordinal=cols[0].ordinal;for(i=0;i<cols.length;++i){cols[i].ordinal=parseInt(cols[i].ordinal)-2;}}}
_getColumnAtX(aX,aThresh,aPos){let isRTL=this.isRTL;if(aPos){aPos.value=isRTL?"after":"before";}
var columns=[];var col=this.columns.getFirstColumn();while(col){columns.push(col);col=col.getNext();}
if(isRTL){columns.reverse();}
var currentX=this.getBoundingClientRect().x;var adjustedX=aX+this.horizontalPosition;for(var i=0;i<columns.length;++i){col=columns[i];var cw=col.element.getBoundingClientRect().width;if(cw>0){currentX+=cw;if(currentX-cw*aThresh>adjustedX){return col.element;}}}
if(aPos){aPos.value=isRTL?"before":"after";}
return columns.pop().element;}
changeOpenState(row,openState){if(row<0||!this.view.isContainer(row)){return false;}
if(this.view.isContainerOpen(row)!=openState){this.view.toggleOpenState(row);if(row==this.currentIndex){
var event=document.createEvent("Events");event.initEvent("OpenStateChange",true,true);this.dispatchEvent(event);}
return true;}
return false;}
_keyNavigate(event){var key=String.fromCharCode(event.charCode).toLowerCase();if(event.timeStamp-this._lastKeyTime>1000){this._incrementalString=key;}else{this._incrementalString+=key;}
this._lastKeyTime=event.timeStamp;var length=this._incrementalString.length;var incrementalString=this._incrementalString;var charIndex=1;while(charIndex<length&&incrementalString[charIndex]==incrementalString[charIndex-1]){charIndex++;} 
if(charIndex==length){length=1;incrementalString=incrementalString.substring(0,length);}
var keyCol=this.columns.getKeyColumn();var rowCount=this.view.rowCount;var start=1;var c=this.currentIndex;if(length>1){start=0;if(c<0){c=0;}}
for(var i=0;i<rowCount;i++){var l=(i+start+c)%rowCount;var cellText=this.view.getCellText(l,keyCol);cellText=cellText.substring(0,length).toLowerCase();if(cellText==incrementalString){return l;}}
return-1;}
startEditing(row,column){if(!this.editable){return false;}
if(row<0||row>=this.view.rowCount||!column){return false;}
if(column.type!==window.TreeColumn.TYPE_TEXT){return false;}
if(column.cycler||!this.view.isEditable(row,column)){return false;}
if(this._editingColumn){this.stopEditing();}
var input=this.inputField;this.ensureCellIsVisible(row,column);var textRect=this.getCoordsForCellItem(row,column,"text");var cellRect=this.getCoordsForCellItem(row,column,"cell");var style=window.getComputedStyle(input);var topadj=parseInt(style.borderTopWidth)+parseInt(style.paddingTop);input.style.top=`${textRect.y - topadj}px`;
var left,widthdiff;if(style.direction=="rtl"){left=cellRect.x;widthdiff=cellRect.x-textRect.x;}else{left=textRect.x;widthdiff=textRect.x-cellRect.x;}
input.style.left=`${left}px`;input.style.height=`${textRect.height +
        topadj +
        parseInt(style.borderBottomWidth) +
        parseInt(style.paddingBottom)}px`;input.style.width=`${cellRect.width - widthdiff}px`;input.hidden=false;input.value=this.view.getCellText(row,column);input.select();input.focus();this._editingRow=row;this._editingColumn=column;this.setAttribute("editing","true");this.invalidateCell(row,column);return true;}
stopEditing(accept){if(!this._editingColumn){return;}
var input=this.inputField;var editingRow=this._editingRow;var editingColumn=this._editingColumn;this._editingRow=-1;this._editingColumn=null;if(accept&&this.view){var value=input.value;this.view.setCellText(editingRow,editingColumn,value);}
input.hidden=true;input.value="";this.removeAttribute("editing");}
_moveByOffset(offset,edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(event.getModifierState("Accel")&&this.view.selection.single){this.scrollByLines(offset);return;}
var c=this.currentIndex+offset;if(offset>0?c>edge:c<edge){if(this.view.selection.isSelected(edge)&&this.view.selection.count<=1){return;}
c=edge;}
if(!event.getModifierState("Accel")){this.view.selection.timedSelect(c,this._selectDelay);} 
else{this.currentIndex=c;}
this.ensureRowIsVisible(c);}
_moveByOffsetShift(offset,edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(this.view.selection.single){this.scrollByLines(offset);return;}
if(this.view.rowCount==1&&!this.view.selection.isSelected(0)){this.view.selection.timedSelect(0,this._selectDelay);return;}
var c=this.currentIndex;if(c==-1){c=0;}
if(c==edge){if(this.view.selection.isSelected(c)){return;}} 
this.view.selection.rangedSelect(-1,c+offset,event.getModifierState("Accel"));this.ensureRowIsVisible(c+offset);}
_moveByPage(offset,edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(this.pageUpOrDownMovesSelection==event.getModifierState("Accel")){this.scrollByPages(offset);return;}
if(this.view.rowCount==1&&!this.view.selection.isSelected(0)){this.view.selection.timedSelect(0,this._selectDelay);return;}
var c=this.currentIndex;if(c==-1){return;}
if(c==edge&&this.view.selection.isSelected(c)){this.ensureRowIsVisible(c);return;}
var i=this.getFirstVisibleRow();var p=this.getPageLength();if(offset>0){i+=p-1;if(c>=i){i=c+p;this.ensureRowIsVisible(i>edge?edge:i);}
i=i>edge?edge:i;}else if(c<=i){i=c<=p?0:c-p;this.ensureRowIsVisible(i);}
this.view.selection.timedSelect(i,this._selectDelay);}
_moveByPageShift(offset,edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(this.view.rowCount==1&&!this.view.selection.isSelected(0)&&!(this.pageUpOrDownMovesSelection==event.getModifierState("Accel"))){this.view.selection.timedSelect(0,this._selectDelay);return;}
if(this.view.selection.single){return;}
var c=this.currentIndex;if(c==-1){return;}
if(c==edge&&this.view.selection.isSelected(c)){this.ensureRowIsVisible(edge);return;}
var i=this.getFirstVisibleRow();var p=this.getPageLength();if(offset>0){i+=p-1;if(c>=i){i=c+p;this.ensureRowIsVisible(i>edge?edge:i);} 
this.view.selection.rangedSelect(-1,i>edge?edge:i,event.getModifierState("Accel"));}else{if(c<=i){i=c<=p?0:c-p;this.ensureRowIsVisible(i);} 
this.view.selection.rangedSelect(-1,i,event.getModifierState("Accel"));}}
_moveToEdge(edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(this.view.selection.isSelected(edge)&&this.view.selection.count==1){this.currentIndex=edge;return;} 
if(!event.getModifierState("Accel")){this.view.selection.timedSelect(edge,this._selectDelay);} 
else if(!this.view.selection.single){this.currentIndex=edge;}
this.ensureRowIsVisible(edge);}
_moveToEdgeShift(edge,event){event.preventDefault();if(this.view.rowCount==0){return;}
if(this.view.rowCount==1&&!this.view.selection.isSelected(0)){this.view.selection.timedSelect(0,this._selectDelay);return;}
if(this.view.selection.single||(this.view.selection.isSelected(edge)&&this.view.selection.isSelected(this.currentIndex))){return;} 
this.view.selection.rangedSelect(this.currentIndex,edge,event.getModifierState("Accel"));this.ensureRowIsVisible(edge);}
_handleEnter(event){if(this._editingColumn){this.stopEditing(true);this.focus();return true;}
return this.changeOpenState(this.currentIndex);}}
MozXULElement.implementCustomInterface(MozTree,[Ci.nsIDOMXULMultiSelectControlElement,]);customElements.define("tree",MozTree);}