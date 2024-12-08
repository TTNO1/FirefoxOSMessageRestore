"use strict";
{const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");class MozMenuPopup extends MozElements.MozElementMixin(XULPopupElement){constructor(){super();this.AUTOSCROLL_INTERVAL=25;this.NOT_DRAGGING=0;this.DRAG_OVER_BUTTON=-1;this.DRAG_OVER_POPUP=1;this._draggingState=this.NOT_DRAGGING;this._scrollTimer=0;this.addEventListener("popupshowing",event=>{if(event.target!=this){return;}
this.shadowRoot;});this.attachShadow({mode:"open"});}
connectedCallback(){if(this.delayConnectedCallback()||this.hasConnected){return;}
this.hasConnected=true;if(this.parentNode&&this.parentNode.localName=="menulist"){this._setUpMenulistPopup();}}
initShadowDOM(){this.scrollBox.addEventListener("scroll",ev=>this.dispatchEvent(new Event("scroll")));this.scrollBox.addEventListener("overflow",ev=>this.dispatchEvent(new Event("overflow")));this.scrollBox.addEventListener("underflow",ev=>this.dispatchEvent(new Event("underflow")));}
get shadowRoot(){
if(!super.shadowRoot.firstElementChild){super.shadowRoot.appendChild(this.fragment);this.initShadowDOM();}
return super.shadowRoot;}
get fragment(){if(!this.constructor.hasOwnProperty("_fragment")){this.constructor._fragment=MozXULElement.parseXULToFragment(this.markup);}
return document.importNode(this.constructor._fragment,true);}
get markup(){return`
        <html:link rel="stylesheet" href="chrome://global/skin/global.css"/>
        <html:style>${this.styles}</html:style>
        <arrowscrollbox class="menupopup-arrowscrollbox"
                        exportparts="scrollbox: arrowscrollbox-scrollbox"
                        flex="1"
                        orient="vertical"
                        smoothscroll="false">
          <html:slot></html:slot>
        </arrowscrollbox>
      `;}
get styles(){let s=`
        :host(.in-menulist) arrowscrollbox::part(scrollbutton-up),
        :host(.in-menulist) arrowscrollbox::part(scrollbutton-down) {
          display: none;
        }
        :host(.in-menulist) arrowscrollbox::part(scrollbox) {
          overflow: auto;
          margin: 0;
        }
        :host(.in-menulist) arrowscrollbox::part(scrollbox-clip) {
          overflow: visible;
        }
      `;switch(AppConstants.platform){case"macosx":s+=`
            :host(.in-menulist) arrowscrollbox {
              padding: 0;
            }
          `;break;default:break;}
return s;}
get scrollBox(){if(!this._scrollBox){this._scrollBox=this.shadowRoot.querySelector("arrowscrollbox");}
return this._scrollBox;}
_setUpMenulistPopup(){
this.shadowRoot;this.classList.add("in-menulist");this.addEventListener("popupshown",()=>{
this._enableDragScrolling(false);});this.addEventListener("popuphidden",()=>{this._draggingState=this.NOT_DRAGGING;this._clearScrollTimer();this.releaseCapture();this.scrollBox.scrollbox.scrollTop=0;});this.addEventListener("mousedown",event=>{if(event.button!=0){return;}
if(this.state=="open"&&(event.target.localName=="menuitem"||event.target.localName=="menu"||event.target.localName=="menucaption")){this._enableDragScrolling(true);}});this.addEventListener("mouseup",event=>{if(event.button!=0){return;}
this._draggingState=this.NOT_DRAGGING;this._clearScrollTimer();});this.addEventListener("mousemove",event=>{if(!this._draggingState){return;}
this._clearScrollTimer();


if(!(event.buttons&1)){this._draggingState=this.NOT_DRAGGING;this.releaseCapture();return;}



let popupRect=this.getOuterScreenRect();if(event.screenX>=popupRect.left&&event.screenX<=popupRect.right){if(this._draggingState==this.DRAG_OVER_BUTTON){if(event.screenY>popupRect.top&&event.screenY<popupRect.bottom){this._draggingState=this.DRAG_OVER_POPUP;}}
if(this._draggingState==this.DRAG_OVER_POPUP&&(event.screenY<=popupRect.top||event.screenY>=popupRect.bottom)){let scrollAmount=event.screenY<=popupRect.top?-1:1;this.scrollBox.scrollByIndex(scrollAmount,true);let win=this.ownerGlobal;this._scrollTimer=win.setInterval(()=>{this.scrollBox.scrollByIndex(scrollAmount,true);},this.AUTOSCROLL_INTERVAL);}}});this._menulistPopupIsSetUp=true;}
_enableDragScrolling(overItem){if(!this._draggingState){this.setCaptureAlways();this._draggingState=overItem?this.DRAG_OVER_POPUP:this.DRAG_OVER_BUTTON;}}
_clearScrollTimer(){if(this._scrollTimer){this.ownerGlobal.clearInterval(this._scrollTimer);this._scrollTimer=0;}}}
customElements.define("menupopup",MozMenuPopup);MozElements.MozMenuPopup=MozMenuPopup;}