"use strict";class NamedDeckButton extends HTMLButtonElement{connectedCallback(){this.id=`${this.deckId}-button-${this.name}`;if(!this.hasAttribute("role")){this.setAttribute("role","tab");}
this.setSelectedFromDeck();this.addEventListener("click",this);document.addEventListener("view-changed",this,{capture:true});}
disconnectedCallback(){this.removeEventListener("click",this);document.removeEventListener("view-changed",this,{capture:true});}
attributeChangedCallback(name,oldVal,newVal){if(name=="selected"){this.selected=newVal;}}
get deckId(){return this.getAttribute("deck");}
set deckId(val){this.setAttribute("deck",val);}
get deck(){return document.getElementById(this.deckId);}
handleEvent(e){if(e.type=="view-changed"&&e.target.id==this.deckId){this.setSelectedFromDeck();}else if(e.type=="click"){let{deck}=this;if(deck){deck.selectedViewName=this.name;}}}
get name(){return this.getAttribute("name");}
get selected(){return this.hasAttribute("selected");}
set selected(val){if(this.selected!=val){this.toggleAttribute("selected",val);}
this.setAttribute("aria-selected",!!val);}
setSelectedFromDeck(){let{deck}=this;this.selected=deck&&deck.selectedViewName==this.name;if(this.selected){this.dispatchEvent(new CustomEvent("button-group:selected",{bubbles:true}));}}}
customElements.define("named-deck-button",NamedDeckButton,{extends:"button",});class ButtonGroup extends HTMLElement{static get observedAttributes(){return["orientation"];}
connectedCallback(){this.setAttribute("role","tablist");if(!this.observer){this.observer=new MutationObserver(changes=>{for(let change of changes){this.setChildAttributes(change.addedNodes);for(let node of change.removedNodes){if(this.activeChild==node){this.activeChild=this.firstElementChild;}}}});}
this.observer.observe(this,{childList:true});this.setChildAttributes(this.children);
this.activeChild=this._activeChild;this.addEventListener("button-group:selected",this);this.addEventListener("keydown",this);this.addEventListener("mousedown",this);document.addEventListener("keypress",this);}
disconnectedCallback(){this.observer.disconnect();this.removeEventListener("button-group:selected",this);this.removeEventListener("keydown",this);this.removeEventListener("mousedown",this);document.removeEventListener("keypress",this);}
attributeChangedCallback(name,oldVal,newVal){if(name=="orientation"){if(this.isVertical){this.setAttribute("aria-orientation",this.orientation);}else{this.removeAttribute("aria-orientation");}}}
setChildAttributes(nodes){for(let node of nodes){if(node.nodeType==Node.ELEMENT_NODE&&node!=this.activeChild){node.setAttribute("tabindex","-1");}}}
get activeChild(){return this._activeChild;}
set activeChild(node){let prevActiveChild=this._activeChild;let newActiveChild;if(node&&this.contains(node)){newActiveChild=node;}else{newActiveChild=this.firstElementChild;}
this._activeChild=newActiveChild;if(newActiveChild){newActiveChild.setAttribute("tabindex","0");}
if(prevActiveChild&&prevActiveChild!=newActiveChild){prevActiveChild.setAttribute("tabindex","-1");}}
get isVertical(){return this.orientation=="vertical";}
get orientation(){return this.getAttribute("orientation")=="vertical"?"vertical":"horizontal";}
set orientation(val){if(val=="vertical"){this.setAttribute("orientation",val);}else{this.removeAttribute("orientation");}}
_navigationKeys(){if(this.isVertical){return{previousKey:"ArrowUp",nextKey:"ArrowDown",};}
if(document.dir=="rtl"){return{previousKey:"ArrowRight",nextKey:"ArrowLeft",};}
return{previousKey:"ArrowLeft",nextKey:"ArrowRight",};}
handleEvent(e){let{previousKey,nextKey}=this._navigationKeys();if(e.type=="keydown"&&(e.key==previousKey||e.key==nextKey)){this.setAttribute("last-input-type","keyboard");e.preventDefault();let oldFocus=this.activeChild;this.walker.currentNode=oldFocus;let newFocus;if(e.key==previousKey){newFocus=this.walker.previousNode();}else{newFocus=this.walker.nextNode();}
if(newFocus){this.activeChild=newFocus;this.dispatchEvent(new CustomEvent("button-group:key-selected"));}}else if(e.type=="button-group:selected"){this.activeChild=e.target;}else if(e.type=="mousedown"){this.setAttribute("last-input-type","mouse");}else if(e.type=="keypress"&&e.key=="Tab"){this.setAttribute("last-input-type","keyboard");}}
get walker(){if(!this._walker){this._walker=document.createTreeWalker(this,NodeFilter.SHOW_ELEMENT,{acceptNode:node=>{if(node.hidden||node.disabled){return NodeFilter.FILTER_REJECT;}
node.focus();return document.activeElement==node?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;},});}
return this._walker;}}
customElements.define("button-group",ButtonGroup);class NamedDeck extends HTMLElement{static get observedAttributes(){return["selected-view"];}
constructor(){super();this.attachShadow({mode:"open"});let selectedSlot=document.createElement("slot");selectedSlot.setAttribute("name","selected");this.shadowRoot.appendChild(selectedSlot);this.observer=new MutationObserver(()=>{this._setSelectedViewAttributes();});}
connectedCallback(){if(this.selectedViewName){this._setSelectedViewAttributes();}else{let firstView=this.firstElementChild;if(firstView){this.selectedViewName=firstView.getAttribute("name");}}
this.observer.observe(this,{childList:true});}
disconnectedCallback(){this.observer.disconnect();}
attributeChangedCallback(attr,oldVal,newVal){if(attr=="selected-view"&&oldVal!=newVal){this._setSelectedViewAttributes();this.dispatchEvent(new CustomEvent("view-changed"));}}
get selectedViewName(){return this.getAttribute("selected-view");}
set selectedViewName(name){this.setAttribute("selected-view",name);}
_setSelectedViewAttributes(){let{selectedViewName}=this;for(let view of this.children){let name=view.getAttribute("name");view.setAttribute("aria-labelledby",`${this.id}-button-${name}`);view.setAttribute("role","tabpanel");if(name===selectedViewName){view.slot="selected";}else{view.slot="";}}}}
customElements.define("named-deck",NamedDeck);