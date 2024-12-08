"use strict";
{const KEEP_CHILDREN=new Set(["observes","template","menupopup","panel","tooltip",]);window.addEventListener("popupshowing",e=>{if(e.originalTarget.ownerDocument!=document){return;}
e.originalTarget.setAttribute("hasbeenopened","true");for(let el of e.originalTarget.querySelectorAll("toolbarbutton")){el.render();}},{capture:true});class MozToolbarbutton extends MozElements.ButtonBase{static get inheritedAttributes(){return{".toolbarbutton-icon":"validate,src=image,label,type,consumeanchor,triggeringprincipal=iconloadingprincipal",".toolbarbutton-text":"accesskey,crop,dragover-top,wrap",".toolbarbutton-menu-dropmarker":"disabled,label",".toolbarbutton-badge":"text=badge,style=badgeStyle",};}
static get fragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
        <image class="toolbarbutton-icon"></image>
        <label class="toolbarbutton-text" crop="right" flex="1"></label>
        `),true);Object.defineProperty(this,"fragment",{value:frag});return frag;}
static get badgedFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
        <stack class="toolbarbutton-badge-stack">
          <image class="toolbarbutton-icon"/>
          <html:label class="toolbarbutton-badge"/>
        </stack>
        <label class="toolbarbutton-text" crop="right" flex="1"/>
        `),true);Object.defineProperty(this,"badgedFragment",{value:frag});return frag;}
static get dropmarkerFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
          <dropmarker type="menu" class="toolbarbutton-menu-dropmarker"></dropmarker>
        `),true);Object.defineProperty(this,"dropmarkerFragment",{value:frag});return frag;}
get _hasRendered(){return this.querySelector(":scope > .toolbarbutton-text")!=null;}
get _textNode(){let node=this.getElementForAttrInheritance(".toolbarbutton-text");if(node){Object.defineProperty(this,"_textNode",{value:node});}
return node;}
_setLabel(){let label=this.getAttribute("label")||"";let hasLabel=this.hasAttribute("label");if(this.getAttribute("wrap")=="true"){this._textNode.removeAttribute("value");this._textNode.textContent=label;}else{this._textNode.textContent="";if(hasLabel){this._textNode.setAttribute("value",label);}else{this._textNode.removeAttribute("value");}}}
attributeChangedCallback(name,oldValue,newValue){if(oldValue===newValue||!this.initializedAttributeInheritance){return;}
if(name=="label"||name=="wrap"){this._setLabel();}
super.attributeChangedCallback(name,oldValue,newValue);}
connectedCallback(){if(this.delayConnectedCallback()){return;}
let panel=this.closest("panel");if(panel&&!panel.hasAttribute("hasbeenopened")){return;}
this.render();}
render(){if(this._hasRendered){return;}
let badged=this.getAttribute("badged")=="true";if(badged){let moveChildren=[];for(let child of this.children){if(!KEEP_CHILDREN.has(child.tagName)){moveChildren.push(child);}}
this.appendChild(this.constructor.badgedFragment.cloneNode(true));if(this.hasAttribute("wantdropmarker")){this.appendChild(this.constructor.dropmarkerFragment.cloneNode(true));}
if(moveChildren.length){let{badgeStack,icon}=this;for(let child of moveChildren){badgeStack.insertBefore(child,icon);}}}else{let moveChildren=[];for(let child of this.children){if(!KEEP_CHILDREN.has(child.tagName)&&child.tagName!="box"){
 return;}
if(child.tagName=="box"){moveChildren.push(child);}}
this.appendChild(this.constructor.fragment.cloneNode(true));if(this.hasAttribute("wantdropmarker")){this.appendChild(this.constructor.dropmarkerFragment.cloneNode(true));}

for(let child of moveChildren){this.insertBefore(child,this.lastChild);}}
this.initializeAttributeInheritance();this._setLabel();}
get icon(){return this.querySelector(".toolbarbutton-icon");}
get badgeLabel(){return this.querySelector(".toolbarbutton-badge");}
get badgeStack(){return this.querySelector(".toolbarbutton-badge-stack");}
get multilineLabel(){if(this.getAttribute("wrap")=="true"){return this._textNode;}
return null;}
get dropmarker(){return this.querySelector(".toolbarbutton-menu-dropmarker");}
get menupopup(){return this.querySelector("menupopup");}}
customElements.define("toolbarbutton",MozToolbarbutton);}