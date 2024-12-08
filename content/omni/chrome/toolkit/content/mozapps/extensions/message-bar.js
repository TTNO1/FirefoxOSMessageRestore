"use strict";class MessageBarStackElement extends HTMLElement{constructor(){super();this._observer=null;const shadowRoot=this.attachShadow({mode:"open"});shadowRoot.append(this.constructor.template.content.cloneNode(true));}
connectedCallback(){
this.closeMessageBars();
this._observer=new MutationObserver(()=>{this._observer.disconnect();this.closeMessageBars();this._observer.observe(this,{childList:true});});this._observer.observe(this,{childList:true});}
disconnectedCallback(){this._observer.disconnect();this._observer=null;}
closeMessageBars(){const{maxMessageBarCount}=this;if(maxMessageBarCount>1){
while(this.childElementCount>maxMessageBarCount){this.firstElementChild.remove();}}}
get maxMessageBarCount(){return parseInt(this.getAttribute("max-message-bar-count"),10);}
static get template(){const template=document.createElement("template");const style=document.createElement("style");
style.textContent=`
      :host {
        display: block;
      }
      :host([reverse]) > slot {
        display: flex;
        flex-direction: column-reverse;
      }
    `;template.content.append(style);template.content.append(document.createElement("slot"));Object.defineProperty(this,"template",{value:template,});return template;}}
class MessageBarElement extends HTMLElement{constructor(){super();const shadowRoot=this.attachShadow({mode:"open"});const content=this.constructor.template.content.cloneNode(true);shadowRoot.append(content);this.closeButton.addEventListener("click",()=>{this.dispatchEvent(new CustomEvent("message-bar:user-dismissed"));this.remove();},{once:true,});}
disconnectedCallback(){this.dispatchEvent(new CustomEvent("message-bar:close"));}
get closeButton(){return this.shadowRoot.querySelector("button.close");}
static get template(){const template=document.createElement("template");const style=document.createElement("style");style.textContent=`
      @import "chrome://global/skin/in-content/common.css";
      @import "chrome://mozapps/content/extensions/message-bar.css";
    `;template.content.append(style);

const container=document.createElement("div");container.setAttribute("class","container");template.content.append(container);const icon=document.createElement("span");icon.setAttribute("class","icon");container.append(icon);const barcontent=document.createElement("span");barcontent.setAttribute("class","content");barcontent.append(document.createElement("slot"));container.append(barcontent);const spacer=document.createElement("span");spacer.classList.add("spacer");container.append(spacer);const closeIcon=document.createElement("button");closeIcon.setAttribute("class","close");container.append(closeIcon);Object.defineProperty(this,"template",{value:template,});return template;}}
customElements.define("message-bar",MessageBarElement);customElements.define("message-bar-stack",MessageBarStackElement);