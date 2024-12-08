"use strict";
{class MozButtonBase extends MozElements.BaseText{constructor(){super();this.addEventListener("click",event=>{if(event.button!=0){return;}
this._handleClick();});this.addEventListener("keypress",event=>{if(event.key!=" "){return;}
this._handleClick();event.preventDefault();});this.addEventListener("keypress",event=>{if(this.hasMenu()){if(this.open){return;}}else{if(event.keyCode==KeyEvent.DOM_VK_UP||(event.keyCode==KeyEvent.DOM_VK_LEFT&&document.defaultView.getComputedStyle(this.parentNode).direction=="ltr")||(event.keyCode==KeyEvent.DOM_VK_RIGHT&&document.defaultView.getComputedStyle(this.parentNode).direction=="rtl")){event.preventDefault();window.document.commandDispatcher.rewindFocus();return;}
if(event.keyCode==KeyEvent.DOM_VK_DOWN||(event.keyCode==KeyEvent.DOM_VK_RIGHT&&document.defaultView.getComputedStyle(this.parentNode).direction=="ltr")||(event.keyCode==KeyEvent.DOM_VK_LEFT&&document.defaultView.getComputedStyle(this.parentNode).direction=="rtl")){event.preventDefault();window.document.commandDispatcher.advanceFocus();return;}}
if(event.keyCode||event.charCode<=32||event.altKey||event.ctrlKey||event.metaKey){return;}
 
var charPressedLower=String.fromCharCode(event.charCode).toLowerCase(); if(this.accessKey.toLowerCase()==charPressedLower){this.click();return;}
 
for(var frameCount=-1;frameCount<window.top.frames.length;frameCount++){var doc=frameCount==-1?window.top.document:window.top.frames[frameCount].document;if(this.fireAccessKeyButton(doc.documentElement,charPressedLower)){return;}} 
let buttonBox=window.top.document.documentElement.buttonBox;if(buttonBox){this.fireAccessKeyButton(buttonBox,charPressedLower);}});}
set type(val){this.setAttribute("type",val);return val;}
get type(){return this.getAttribute("type");}
set disabled(val){if(val){this.setAttribute("disabled","true");}else{this.removeAttribute("disabled");}
return val;}
get disabled(){return this.getAttribute("disabled")=="true";}
set group(val){this.setAttribute("group",val);return val;}
get group(){return this.getAttribute("group");}
set open(val){if(this.hasMenu()){this.openMenu(val);}else if(val){ this.setAttribute("open","true");}else{this.removeAttribute("open");}
return val;}
get open(){return this.hasAttribute("open");}
set checked(val){if(this.type=="radio"&&val){var sibs=this.parentNode.getElementsByAttribute("group",this.group);for(var i=0;i<sibs.length;++i){sibs[i].removeAttribute("checked");}}
if(val){this.setAttribute("checked","true");}else{this.removeAttribute("checked");}
return val;}
get checked(){return this.hasAttribute("checked");}
filterButtons(node){var cs=node.ownerGlobal.getComputedStyle(node);if(cs.visibility!="visible"||cs.display=="none"){return NodeFilter.FILTER_REJECT;}
if(cs.display=="-moz-popup"&&node.state!="open"){return NodeFilter.FILTER_REJECT;}
if(node.localName=="button"&&node.accessKey&&!node.disabled){return NodeFilter.FILTER_ACCEPT;}
return NodeFilter.FILTER_SKIP;}
fireAccessKeyButton(aSubtree,aAccessKeyLower){var iterator=aSubtree.ownerDocument.createTreeWalker(aSubtree,NodeFilter.SHOW_ELEMENT,this.filterButtons);while(iterator.nextNode()){var test=iterator.currentNode;if(test.accessKey.toLowerCase()==aAccessKeyLower&&!test.disabled&&!test.collapsed&&!test.hidden){test.focus();test.click();return true;}}
return false;}
_handleClick(){if(!this.disabled){if(this.type=="checkbox"){this.checked=!this.checked;}else if(this.type=="radio"){this.checked=true;}}}}
MozXULElement.implementCustomInterface(MozButtonBase,[Ci.nsIDOMXULButtonElement,]);MozElements.ButtonBase=MozButtonBase;class MozButton extends MozButtonBase{static get inheritedAttributes(){return{".box-inherit":"align,dir,pack,orient",".button-icon":"src=image",".button-text":"value=label,accesskey,crop",".button-menu-dropmarker":"open,disabled,label",};}
get icon(){return this.querySelector(".button-icon");}
static get buttonFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
        <hbox class="box-inherit button-box" align="center" pack="center" flex="1" anonid="button-box">
          <image class="button-icon"/>
          <label class="button-text"/>
        </hbox>`),true);Object.defineProperty(this,"buttonFragment",{value:frag});return frag;}
static get menuFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
        <hbox class="box-inherit button-box" align="center" pack="center" flex="1">
          <hbox class="box-inherit" align="center" pack="center" flex="1">
            <image class="button-icon"/>
            <label class="button-text"/>
          </hbox>
          <dropmarker class="button-menu-dropmarker"/>
        </hbox>`),true);Object.defineProperty(this,"menuFragment",{value:frag});return frag;}
get _hasConnected(){return this.querySelector(":scope > .button-box")!=null;}
connectedCallback(){if(this.delayConnectedCallback()||this._hasConnected){return;}
let fragment;if(this.type==="menu"){fragment=MozButton.menuFragment;this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_RETURN&&event.key!=" "){return;}
this.open=true;if(event.key==" "){event.preventDefault();}});}else{fragment=this.constructor.buttonFragment;}
this.appendChild(fragment.cloneNode(true));this.initializeAttributeInheritance();}}
customElements.define("button",MozButton);}