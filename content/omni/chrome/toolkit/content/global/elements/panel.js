"use strict";
{class MozPanel extends MozElements.MozElementMixin(XULPopupElement){static get markup(){return`
      <html:link rel="stylesheet" href="chrome://global/skin/global.css"/>
      <vbox class="panel-arrowcontainer" flex="1">
        <box class="panel-arrowbox" part="arrowbox">
          <image class="panel-arrow" part="arrow"/>
        </box>
        <box class="panel-arrowcontent" flex="1" part="arrowcontent"><html:slot/></box>
      </vbox>
      `;}
constructor(){super();this.attachShadow({mode:"open"});this._prevFocus=0;this._fadeTimer=null;this.addEventListener("popupshowing",this);this.addEventListener("popupshown",this);this.addEventListener("popuphiding",this);this.addEventListener("popuphidden",this);this.addEventListener("popuppositioned",this);}
connectedCallback(){
if(!this.hidden){this.initialize();}
if(this.isArrowPanel){if(!this.hasAttribute("flip")){this.setAttribute("flip","both");}
if(!this.hasAttribute("side")){this.setAttribute("side","top");}
if(!this.hasAttribute("position")){this.setAttribute("position","bottomcenter topleft");}
if(!this.hasAttribute("consumeoutsideclicks")){this.setAttribute("consumeoutsideclicks","false");}}}
initialize(){


if(this.shadowRoot.firstChild){return;}
if(!this.isArrowPanel){this.shadowRoot.appendChild(document.createElement("slot"));}else{this.shadowRoot.appendChild(this.constructor.fragment);}}
get hidden(){return super.hidden;}
set hidden(v){if(!v){this.initialize();}
return(super.hidden=v);}
removeAttribute(name){if(name=="hidden"){this.initialize();}
super.removeAttribute(name);}
get isArrowPanel(){return this.getAttribute("type")=="arrow";}
adjustArrowPosition(event){if(!this.isArrowPanel||!this.isAnchored){return;}
var container=this.shadowRoot.querySelector(".panel-arrowcontainer");var arrowbox=this.shadowRoot.querySelector(".panel-arrowbox");var position=event.alignmentPosition;var offset=event.alignmentOffset;this.setAttribute("arrowposition",position);if(position.indexOf("start_")==0||position.indexOf("end_")==0){container.setAttribute("orient","horizontal");arrowbox.setAttribute("orient","vertical");if(position.indexOf("_after")>0){arrowbox.setAttribute("pack","end");}else{arrowbox.setAttribute("pack","start");}
arrowbox.style.transform="translate(0, "+-offset+"px)";var isRTL=window.getComputedStyle(this).direction=="rtl";if(position.indexOf("start_")==0){container.style.MozBoxDirection="reverse";this.setAttribute("side",isRTL?"left":"right");}else{container.style.removeProperty("-moz-box-direction");this.setAttribute("side",isRTL?"right":"left");}}else if(position.indexOf("before_")==0||position.indexOf("after_")==0){container.removeAttribute("orient");arrowbox.removeAttribute("orient");if(position.indexOf("_end")>0){arrowbox.setAttribute("pack","end");}else{arrowbox.setAttribute("pack","start");}
arrowbox.style.transform="translate("+-offset+"px, 0)";if(position.indexOf("before_")==0){container.style.MozBoxDirection="reverse";this.setAttribute("side","bottom");}else{container.style.removeProperty("-moz-box-direction");this.setAttribute("side","top");}}}
on_popupshowing(event){if(this.isArrowPanel&&event.target==this){var arrow=this.shadowRoot.querySelector(".panel-arrow");arrow.hidden=!this.isAnchored;this.shadowRoot.querySelector(".panel-arrowbox").style.removeProperty("transform");if(this.getAttribute("animate")!="false"){this.setAttribute("animate","open");
 this.setAttribute("animating","true");} 
var fade=this.getAttribute("fade");var fadeDelay=0;if(fade=="fast"){fadeDelay=1;}else if(fade=="slow"){fadeDelay=4000;}
if(fadeDelay!=0){this._fadeTimer=setTimeout(()=>this.hidePopup(true),fadeDelay,this);}} 
try{this._prevFocus=Cu.getWeakReference(document.commandDispatcher.focusedElement);if(!this._prevFocus.get()){this._prevFocus=Cu.getWeakReference(document.activeElement);return;}}catch(ex){this._prevFocus=Cu.getWeakReference(document.activeElement);}}
on_popupshown(event){if(this.isArrowPanel&&event.target==this){this.removeAttribute("animating");this.setAttribute("panelopen","true");} 
let alertEvent=document.createEvent("Events");alertEvent.initEvent("AlertActive",true,true);this.dispatchEvent(alertEvent);}
on_popuphiding(event){if(this.isArrowPanel&&event.target==this){let animate=this.getAttribute("animate")!="false";if(this._fadeTimer){clearTimeout(this._fadeTimer);if(animate){this.setAttribute("animate","fade");}}else if(animate){this.setAttribute("animate","cancel");}}
try{this._currentFocus=document.commandDispatcher.focusedElement;}catch(e){this._currentFocus=document.activeElement;}}
on_popuphidden(event){if(this.isArrowPanel&&event.target==this){this.removeAttribute("panelopen");if(this.getAttribute("animate")!="false"){this.removeAttribute("animate");}}
function doFocus(){
prevFocus.setAttribute("refocused-by-panel",true);try{let fm=Services.focus;fm.setFocus(prevFocus,fm.FLAG_NOSCROLL);}catch(e){prevFocus.focus();}
prevFocus.removeAttribute("refocused-by-panel");}
var currentFocus=this._currentFocus;var prevFocus=this._prevFocus?this._prevFocus.get():null;this._currentFocus=null;this._prevFocus=null;

let nowFocus;try{nowFocus=document.commandDispatcher.focusedElement;}catch(e){nowFocus=document.activeElement;}
if(nowFocus&&nowFocus!=currentFocus){return;}
if(prevFocus&&this.getAttribute("norestorefocus")!="true"){ try{if(document.commandDispatcher.focusedWindow!=window){ return;}}catch(ex){}
if(!currentFocus){doFocus();return;}
while(currentFocus){if(currentFocus==this){doFocus();return;}
currentFocus=currentFocus.parentNode;}}}
on_popuppositioned(event){if(event.target==this){this.adjustArrowPosition(event);}}}
customElements.define("panel",MozPanel);}