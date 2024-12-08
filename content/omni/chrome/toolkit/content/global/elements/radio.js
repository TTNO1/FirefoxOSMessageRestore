"use strict";
(()=>{class MozRadiogroup extends MozElements.BaseControl{constructor(){super();this.addEventListener("mousedown",event=>{if(this.disabled){event.preventDefault();}});this.addEventListener("keypress",event=>{if(event.key!=" "||event.originalTarget!=this){return;}
this.selectedItem=this.focusedItem;this.selectedItem.doCommand();event.preventDefault();});this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_UP||event.originalTarget!=this){return;}
this.checkAdjacentElement(false);event.stopPropagation();event.preventDefault();});this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_LEFT||event.originalTarget!=this){return;} 
this.checkAdjacentElement(document.defaultView.getComputedStyle(this).direction=="rtl");event.stopPropagation();event.preventDefault();});this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_DOWN||event.originalTarget!=this){return;}
this.checkAdjacentElement(true);event.stopPropagation();event.preventDefault();});this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_RIGHT||event.originalTarget!=this){return;} 
this.checkAdjacentElement(document.defaultView.getComputedStyle(this).direction=="ltr");event.stopPropagation();event.preventDefault();});this.addEventListener("focus",event=>{if(event.originalTarget!=this){return;}
this.setAttribute("focused","true");if(this.focusedItem){return;}
var val=this.selectedItem;if(!val||val.disabled||val.hidden||val.collapsed){var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(!children[i].hidden&&!children[i].collapsed&&!children[i].disabled){val=children[i];break;}}}
this.focusedItem=val;});this.addEventListener("blur",event=>{if(event.originalTarget!=this){return;}
this.removeAttribute("focused");this.focusedItem=null;});}
connectedCallback(){if(this.delayConnectedCallback()){return;}



this.ignoreRadioChildConstruction=true;this.init();this.ignoreRadioChildConstruction=false;if(!this.value){this.selectedIndex=0;}}
init(){this._radioChildren=null;if(this.getAttribute("disabled")=="true"){this.disabled=true;}
var children=this._getRadioChildren();var length=children.length;for(var i=0;i<length;i++){if(children[i].getAttribute("selected")=="true"){this.selectedIndex=i;return;}}
var value=this.value;if(value){this.value=value;}}
radioAttached(child){if(this.ignoreRadioChildConstruction){return;}
if(!this._radioChildren||!this._radioChildren.includes(child)){this.init();}}
radioUnattached(child){this._radioChildren=null;}
set value(val){this.setAttribute("value",val);var children=this._getRadioChildren();for(var i=0;i<children.length;i++){if(String(children[i].value)==String(val)){this.selectedItem=children[i];break;}}
return val;}
get value(){return this.getAttribute("value");}
set disabled(val){if(val){this.setAttribute("disabled","true");}else{this.removeAttribute("disabled");}
var children=this._getRadioChildren();for(var i=0;i<children.length;++i){children[i].disabled=val;}
return val;}
get disabled(){if(this.getAttribute("disabled")=="true"){return true;}
var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(!children[i].hidden&&!children[i].collapsed&&!children[i].disabled){return false;}}
return true;}
get itemCount(){return this._getRadioChildren().length;}
set selectedIndex(val){this.selectedItem=this._getRadioChildren()[val];return val;}
get selectedIndex(){var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(children[i].selected){return i;}}
return-1;}
set selectedItem(val){var focused=this.getAttribute("focused")=="true";var alreadySelected=false;if(val){alreadySelected=val.getAttribute("selected")=="true";val.setAttribute("focused",focused);val.setAttribute("selected","true");this.setAttribute("value",val.value);}else{this.removeAttribute("value");} 
var children=this._getRadioChildren();var previousItem=null;for(var i=0;i<children.length;++i){if(children[i]!=val){if(children[i].getAttribute("selected")=="true"){previousItem=children[i];}
children[i].removeAttribute("selected");children[i].removeAttribute("focused");}}
var event=document.createEvent("Events");event.initEvent("select",false,true);this.dispatchEvent(event);if(focused){if(alreadySelected){event=document.createEvent("Events");event.initEvent("DOMMenuItemActive",true,true);val.dispatchEvent(event);}else{ if(val){event=document.createEvent("Events");event.initEvent("RadioStateChange",true,true);val.dispatchEvent(event);}
if(previousItem){event=document.createEvent("Events");event.initEvent("RadioStateChange",true,true);previousItem.dispatchEvent(event);}}}
return val;}
get selectedItem(){var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(children[i].selected){return children[i];}}
return null;}
set focusedItem(val){if(val){val.setAttribute("focused","true");let event=document.createEvent("Events");event.initEvent("DOMMenuItemActive",true,true);val.dispatchEvent(event);} 
var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(children[i]!=val){children[i].removeAttribute("focused");}}
return val;}
get focusedItem(){var children=this._getRadioChildren();for(var i=0;i<children.length;++i){if(children[i].getAttribute("focused")=="true"){return children[i];}}
return null;}
checkAdjacentElement(aNextFlag){var currentElement=this.focusedItem||this.selectedItem;var i;var children=this._getRadioChildren();for(i=0;i<children.length;++i){if(children[i]==currentElement){break;}}
var index=i;if(aNextFlag){do{if(++i==children.length){i=0;}
if(i==index){break;}}while(children[i].hidden||children[i].collapsed||children[i].disabled); this.selectedItem=children[i];children[i].doCommand();}else{do{if(i==0){i=children.length;}
if(--i==index){break;}}while(children[i].hidden||children[i].collapsed||children[i].disabled); this.selectedItem=children[i];children[i].doCommand();}}
_getRadioChildren(){if(this._radioChildren){return this._radioChildren;}
let radioChildren=[];if(this.hasChildNodes()){for(let radio of this.querySelectorAll("radio")){customElements.upgrade(radio);if(radio.control==this){radioChildren.push(radio);}}}else{const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";for(let radio of this.ownerDocument.getElementsByAttribute("group",this.id)){if(radio.namespaceURI==XUL_NS&&radio.localName=="radio"){customElements.upgrade(radio);radioChildren.push(radio);}}}
return(this._radioChildren=radioChildren);}
getIndexOfItem(item){return this._getRadioChildren().indexOf(item);}
getItemAtIndex(index){var children=this._getRadioChildren();return index>=0&&index<children.length?children[index]:null;}
appendItem(label,value){var radio=document.createXULElement("radio");radio.setAttribute("label",label);radio.setAttribute("value",value);this.appendChild(radio);return radio;}}
MozXULElement.implementCustomInterface(MozRadiogroup,[Ci.nsIDOMXULSelectControlElement,Ci.nsIDOMXULRadioGroupElement,]);customElements.define("radiogroup",MozRadiogroup);class MozRadio extends MozElements.BaseText{static get markup(){return`
      <image class="radio-check"></image>
      <hbox class="radio-label-box" align="center" flex="1">
        <image class="radio-icon"></image>
        <label class="radio-label" flex="1"></label>
      </hbox>
      `;}
static get inheritedAttributes(){return{".radio-check":"disabled,selected",".radio-label":"text=label,accesskey,crop",".radio-icon":"src",};}
constructor(){super();this.addEventListener("click",event=>{if(!this.disabled){this.control.selectedItem=this;}});this.addEventListener("mousedown",event=>{if(!this.disabled){this.control.focusedItem=this;}});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
if(!this.connectedOnce){this.connectedOnce=true;if(!this.firstElementChild){this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();}}
var control=(this._control=this.control);if(control){control.radioAttached(this);}}
disconnectedCallback(){if(this.control){this.control.radioUnattached(this);}
this._control=null;}
set value(val){this.setAttribute("value",val);}
get value(){return this.getAttribute("value");}
get selected(){return this.hasAttribute("selected");}
get radioGroup(){return this.control;}
get control(){if(this._control){return this._control;}
var radiogroup=this.closest("radiogroup");if(radiogroup){return radiogroup;}
var group=this.getAttribute("group");if(!group){return null;}
var parent=this.ownerDocument.getElementById(group);if(!parent||parent.localName!="radiogroup"){parent=null;}
return parent;}}
MozXULElement.implementCustomInterface(MozRadio,[Ci.nsIDOMXULSelectControlItemElement,]);customElements.define("radio",MozRadio);})();