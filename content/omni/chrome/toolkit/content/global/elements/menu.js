"use strict";
{let imports={};ChromeUtils.defineModuleGetter(imports,"ShortcutUtils","resource://gre/modules/ShortcutUtils.jsm");const MozMenuItemBaseMixin=Base=>{class MozMenuItemBase extends MozElements.BaseTextMixin(Base){ set value(val){this.setAttribute("value",val);}
get value(){return this.getAttribute("value");} 
get selected(){return this.getAttribute("selected")=="true";} 
get control(){var parent=this.parentNode;if(parent&&parent.parentNode instanceof XULMenuElement){return parent.parentNode;}
return null;} 
get parentContainer(){for(var parent=this.parentNode;parent;parent=parent.parentNode){if(parent instanceof XULMenuElement){return parent;}}
return null;}}
MozXULElement.implementCustomInterface(MozMenuItemBase,[Ci.nsIDOMXULSelectControlItemElement,Ci.nsIDOMXULContainerItemElement,]);return MozMenuItemBase;};const MozMenuBaseMixin=Base=>{class MozMenuBase extends MozMenuItemBaseMixin(Base){set open(val){this.openMenu(val);return val;}
get open(){return this.hasAttribute("open");}
get itemCount(){var menupopup=this.menupopup;return menupopup?menupopup.children.length:0;}
get menupopup(){const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";for(var child=this.firstElementChild;child;child=child.nextElementSibling){if(child.namespaceURI==XUL_NS&&child.localName=="menupopup"){return child;}}
return null;}
appendItem(aLabel,aValue){var menupopup=this.menupopup;if(!menupopup){menupopup=this.ownerDocument.createXULElement("menupopup");this.appendChild(menupopup);}
var menuitem=this.ownerDocument.createXULElement("menuitem");menuitem.setAttribute("label",aLabel);menuitem.setAttribute("value",aValue);return menupopup.appendChild(menuitem);}
getIndexOfItem(aItem){var menupopup=this.menupopup;if(menupopup){var items=menupopup.children;var length=items.length;for(var index=0;index<length;++index){if(items[index]==aItem){return index;}}}
return-1;}
getItemAtIndex(aIndex){var menupopup=this.menupopup;if(!menupopup||aIndex<0||aIndex>=menupopup.children.length){return null;}
return menupopup.children[aIndex];}}
MozXULElement.implementCustomInterface(MozMenuBase,[Ci.nsIDOMXULContainerElement,]);return MozMenuBase;};class MozMenuCaption extends MozMenuBaseMixin(MozXULElement){static get inheritedAttributes(){return{".menu-iconic-left":"selected,disabled,checked",".menu-iconic-icon":"src=image,validate,src",".menu-iconic-text":"value=label,crop,highlightable",".menu-iconic-highlightable-text":"text=label,crop,highlightable",};}
connectedCallback(){this.textContent="";this.appendChild(MozXULElement.parseXULToFragment(`
      <hbox class="menu-iconic-left" align="center" pack="center" aria-hidden="true">
        <image class="menu-iconic-icon" aria-hidden="true"></image>
      </hbox>
      <label class="menu-iconic-text" flex="1" crop="right" aria-hidden="true"></label>
      <label class="menu-iconic-highlightable-text" crop="right" aria-hidden="true"></label>
    `));this.initializeAttributeInheritance();}}
customElements.define("menucaption",MozMenuCaption);
window.addEventListener("popupshowing",e=>{if(e.originalTarget.ownerDocument!=document){return;}
e.originalTarget.setAttribute("hasbeenopened","true");for(let el of e.originalTarget.querySelectorAll("menuitem, menu")){el.render();}},{capture:true});class MozMenuItem extends MozMenuItemBaseMixin(MozXULElement){static get observedAttributes(){return super.observedAttributes.concat("acceltext","key");}
attributeChangedCallback(name,oldValue,newValue){if(name=="acceltext"){if(this._ignoreAccelTextChange){this._ignoreAccelTextChange=false;}else{this._accelTextIsDerived=false;this._computeAccelTextFromKeyIfNeeded();}}
if(name=="key"){this._computeAccelTextFromKeyIfNeeded();}
super.attributeChangedCallback(name,oldValue,newValue);}
static get inheritedAttributes(){return{".menu-iconic-text":"value=label,crop,accesskey,highlightable",".menu-text":"value=label,crop,accesskey,highlightable",".menu-iconic-highlightable-text":"text=label,crop,accesskey,highlightable",".menu-iconic-left":"selected,_moz-menuactive,disabled,checked",".menu-iconic-icon":"src=image,validate,triggeringprincipal=iconloadingprincipal",".menu-iconic-accel":"value=acceltext",".menu-accel":"value=acceltext",};}
static get iconicNoAccelFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
      <hbox class="menu-iconic-left" align="center" pack="center" aria-hidden="true">
        <image class="menu-iconic-icon"/>
      </hbox>
      <label class="menu-iconic-text" flex="1" crop="right" aria-hidden="true"/>
      <label class="menu-iconic-highlightable-text" crop="right" aria-hidden="true"/>
    `),true);Object.defineProperty(this,"iconicNoAccelFragment",{value:frag});return frag;}
static get iconicFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
      <hbox class="menu-iconic-left" align="center" pack="center" aria-hidden="true">
        <image class="menu-iconic-icon"/>
      </hbox>
      <label class="menu-iconic-text" flex="1" crop="right" aria-hidden="true"/>
      <label class="menu-iconic-highlightable-text" crop="right" aria-hidden="true"/>
      <hbox class="menu-accel-container" aria-hidden="true">
        <label class="menu-iconic-accel"/>
      </hbox>
    `),true);Object.defineProperty(this,"iconicFragment",{value:frag});return frag;}
static get plainFragment(){let frag=document.importNode(MozXULElement.parseXULToFragment(`
      <label class="menu-text" crop="right" aria-hidden="true"/>
      <hbox class="menu-accel-container" aria-hidden="true">
        <label class="menu-accel"/>
      </hbox>
    `),true);Object.defineProperty(this,"plainFragment",{value:frag});return frag;}
get isIconic(){let type=this.getAttribute("type");return(type=="checkbox"||type=="radio"||this.classList.contains("menuitem-iconic"));}
get isMenulistChild(){return this.matches("menulist > menupopup > menuitem");}
get isInHiddenMenupopup(){return this.matches("menupopup:not([hasbeenopened]) menuitem");}
_computeAccelTextFromKeyIfNeeded(){if(!this._accelTextIsDerived&&this.getAttribute("acceltext")){return;}
let accelText=(()=>{if(!document.contains(this)){return null;}
let keyId=this.getAttribute("key");if(!keyId){return null;}
let key=document.getElementById(keyId);if(!key){Cu.reportError(`Key ${keyId} of menuitem ${this.getAttribute("label")} `+`could not be found`);return null;}
return imports.ShortcutUtils.prettifyShortcut(key);})();this._accelTextIsDerived=true;
this._ignoreAccelTextChange=true;if(accelText){this.setAttribute("acceltext",accelText);}else{this.removeAttribute("acceltext");}}
render(){if(this.renderedOnce){return;}
this.renderedOnce=true;this.textContent="";if(this.isMenulistChild){this.append(this.constructor.iconicNoAccelFragment.cloneNode(true));}else if(this.isIconic){this.append(this.constructor.iconicFragment.cloneNode(true));}else{this.append(this.constructor.plainFragment.cloneNode(true));}
this._computeAccelTextFromKeyIfNeeded();this.initializeAttributeInheritance();}
connectedCallback(){if(this.renderedOnce){this._computeAccelTextFromKeyIfNeeded();}


if(this.isMenulistChild||(this.isConnectedAndReady&&!this.isInHiddenMenupopup)){this.render();}}}
customElements.define("menuitem",MozMenuItem);const isHiddenWindow=document.documentURI=="chrome://browser/content/hiddenWindowMac.xhtml";class MozMenu extends MozMenuBaseMixin(MozElements.MozElementMixin(XULMenuElement)){static get inheritedAttributes(){return{".menubar-text":"value=label,accesskey,crop",".menu-iconic-text":"value=label,accesskey,crop,highlightable",".menu-text":"value=label,accesskey,crop",".menu-iconic-highlightable-text":"text=label,crop,accesskey,highlightable",".menubar-left":"src=image",".menu-iconic-icon":"src=image,triggeringprincipal=iconloadingprincipal,validate",".menu-iconic-accel":"value=acceltext",".menu-right":"_moz-menuactive,disabled",".menu-accel":"value=acceltext",};}
get needsEagerRender(){return(this.isMenubarChild||this.isMenulistChild||!this.isInHiddenMenupopup);}
get isMenubarChild(){return this.matches("menubar > menu");}
get isMenulistChild(){return this.matches("menulist > menupopup > menu");}
get isInHiddenMenupopup(){return this.matches("menupopup:not([hasbeenopened]) menu");}
get isIconic(){return this.classList.contains("menu-iconic");}
get fragment(){let{isMenubarChild,isIconic}=this;let fragment=null;if(isMenubarChild&&isIconic){if(!MozMenu.menubarIconicFrag){MozMenu.menubarIconicFrag=MozXULElement.parseXULToFragment(`
          <image class="menubar-left" aria-hidden="true"/>
          <label class="menubar-text" crop="right" aria-hidden="true"/>
        `);}
fragment=document.importNode(MozMenu.menubarIconicFrag,true);}
if(isMenubarChild&&!isIconic){if(!MozMenu.menubarFrag){MozMenu.menubarFrag=MozXULElement.parseXULToFragment(`
          <label class="menubar-text" crop="right" aria-hidden="true"/>
        `);}
fragment=document.importNode(MozMenu.menubarFrag,true);}
if(!isMenubarChild&&isIconic){if(!MozMenu.normalIconicFrag){MozMenu.normalIconicFrag=MozXULElement.parseXULToFragment(`
          <hbox class="menu-iconic-left" align="center" pack="center" aria-hidden="true">
            <image class="menu-iconic-icon"/>
          </hbox>
          <label class="menu-iconic-text" flex="1" crop="right" aria-hidden="true"/>
          <label class="menu-iconic-highlightable-text" crop="right" aria-hidden="true"/>
          <hbox class="menu-accel-container" anonid="accel" aria-hidden="true">
            <label class="menu-iconic-accel"/>
          </hbox>
          <hbox align="center" class="menu-right" aria-hidden="true">
            <image/>
          </hbox>
       `);}
fragment=document.importNode(MozMenu.normalIconicFrag,true);}
if(!isMenubarChild&&!isIconic){if(!MozMenu.normalFrag){MozMenu.normalFrag=MozXULElement.parseXULToFragment(`
          <label class="menu-text" crop="right" aria-hidden="true"/>
          <hbox class="menu-accel-container" anonid="accel" aria-hidden="true">
            <label class="menu-accel"/>
          </hbox>
          <hbox align="center" class="menu-right" aria-hidden="true">
            <image/>
          </hbox>
       `);}
fragment=document.importNode(MozMenu.normalFrag,true);}
return fragment;}
render(){




if(this.renderedOnce){return;}
this.renderedOnce=true;this.prepend(this.fragment);this.initializeAttributeInheritance();}
connectedCallback(){

if(isHiddenWindow){return;}
if(this.delayConnectedCallback()){return;}
if(!this.needsEagerRender){return;}
this.render();}}
customElements.define("menu",MozMenu);}