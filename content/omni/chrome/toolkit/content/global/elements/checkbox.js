"use strict";
{class MozCheckbox extends MozElements.BaseText{static get markup(){return`
      <image class="checkbox-check"/>
      <hbox class="checkbox-label-box" flex="1">
        <image class="checkbox-icon"/>
        <label class="checkbox-label" flex="1"/>
      </hbox>
      `;}
constructor(){super();

this.addEventListener("click",event=>{if(event.button===0&&!this.disabled){this.checked=!this.checked;}});this.addEventListener("keypress",event=>{if(event.key==" "){this.checked=!this.checked;event.preventDefault();}});}
static get inheritedAttributes(){return{".checkbox-check":"disabled,checked",".checkbox-label":"text=label,accesskey",".checkbox-icon":"src",};}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.textContent="";this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();}
set checked(val){let change=val!=(this.getAttribute("checked")=="true");if(val){this.setAttribute("checked","true");}else{this.removeAttribute("checked");}
if(change){let event=document.createEvent("Events");event.initEvent("CheckboxStateChange",true,true);this.dispatchEvent(event);}
return val;}
get checked(){return this.getAttribute("checked")=="true";}}
MozCheckbox.contentFragment=null;customElements.define("checkbox",MozCheckbox);}