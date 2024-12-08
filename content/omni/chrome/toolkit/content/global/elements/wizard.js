"use strict";
{const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
class MozWizard extends MozXULElement{constructor(){super();



this._accessMethod=null;this._currentPage=null;this._canAdvance=true;this._canRewind=false;this._hasLoaded=false;this._hasStarted=false; this._wizardButtonsReady=false;this.pageCount=0;this._pageStack=[];this._bundle=Services.strings.createBundle("chrome://global/locale/wizard.properties");this.addEventListener("keypress",event=>{if(event.keyCode==KeyEvent.DOM_VK_RETURN){this._hitEnter(event);}else if(event.keyCode==KeyEvent.DOM_VK_ESCAPE&&!event.defaultPrevented){this.cancel();}},{mozSystemGroup:true});this.attachShadow({mode:"open"}).appendChild(MozXULElement.parseXULToFragment(`
        <html:link rel="stylesheet" href="chrome://global/skin/button.css"/>
        <html:link rel="stylesheet" href="chrome://global/skin/wizard.css"/>
        <hbox class="wizard-header"></hbox>
        <deck class="wizard-page-box" flex="1">
          <html:slot name="wizardpage"/>
        </deck>
        <html:slot/>
        <wizard-buttons class="wizard-buttons"></wizard-buttons>
    `));this.initializeAttributeInheritance();this._deck=this.shadowRoot.querySelector(".wizard-page-box");this._wizardButtons=this.shadowRoot.querySelector(".wizard-buttons");this._wizardHeader=this.shadowRoot.querySelector(".wizard-header");this._wizardHeader.appendChild(MozXULElement.parseXULToFragment(AppConstants.platform=="macosx"?`<stack class="wizard-header-stack" flex="1">
           <vbox class="wizard-header-box-1">
             <vbox class="wizard-header-box-text">
               <label class="wizard-header-label"/>
             </vbox>
           </vbox>
           <hbox class="wizard-header-box-icon">
             <spacer flex="1"/>
             <image class="wizard-header-icon"/>
           </hbox>
         </stack>`:`<hbox class="wizard-header-box-1" flex="1">
           <vbox class="wizard-header-box-text" flex="1">
             <label class="wizard-header-label"/>
             <label class="wizard-header-description"/>
           </vbox>
           <image class="wizard-header-icon"/>
         </hbox>`));}
static get inheritedAttributes(){return{".wizard-buttons":"pagestep,firstpage,lastpage",};}
connectedCallback(){if(document.l10n){document.l10n.connectRoot(this.shadowRoot);}
document.documentElement.setAttribute("role","dialog");this._maybeStartWizard();window.addEventListener("close",event=>{if(this.cancel()){event.preventDefault();}});
window.addEventListener("load",()=>window.setTimeout(()=>{this._hasLoaded=true;if(!document.commandDispatcher.focusedElement){document.commandDispatcher.advanceFocusIntoSubtree(this);}
try{let button=this._wizardButtons.defaultButton;if(button){window.notifyDefaultButtonLoaded(button);}}catch(e){}},0));}
set title(val){return(document.title=val);}
get title(){return document.title;}
set canAdvance(val){this.getButton("next").disabled=!val;return(this._canAdvance=val);}
get canAdvance(){return this._canAdvance;}
set canRewind(val){this.getButton("back").disabled=!val;return(this._canRewind=val);}
get canRewind(){return this._canRewind;}
get pageStep(){return this._pageStack.length;}
get wizardPages(){return this.getElementsByTagNameNS(XUL_NS,"wizardpage");}
set currentPage(val){if(!val){return val;}
this._currentPage=val;
this.setAttribute("currentpageid",val.pageid);this._initCurrentPage();this._deck.setAttribute("selectedIndex",val.pageIndex);this._advanceFocusToPage(val);this._fireEvent(val,"pageshow");return val;}
get currentPage(){return this._currentPage;}
set pageIndex(val){if(val<0||val>=this.pageCount){return val;}
var page=this.wizardPages[val];this._pageStack[this._pageStack.length-1]=page;this.currentPage=page;return val;}
get pageIndex(){return this._currentPage?this._currentPage.pageIndex:-1;}
get onFirstPage(){return this._pageStack.length==1;}
get onLastPage(){var cp=this.currentPage;return(cp&&((this._accessMethod=="sequential"&&cp.pageIndex==this.pageCount-1)||(this._accessMethod=="random"&&cp.next=="")));}
getButton(aDlgType){return this._wizardButtons.getButton(aDlgType);}
getPageById(aPageId){var els=this.getElementsByAttribute("pageid",aPageId);return els.item(0);}
extra1(){if(this.currentPage){this._fireEvent(this.currentPage,"extra1");}}
extra2(){if(this.currentPage){this._fireEvent(this.currentPage,"extra2");}}
rewind(){if(!this.canRewind){return;}
if(this.currentPage&&!this._fireEvent(this.currentPage,"pagehide")){return;}
if(this.currentPage&&!this._fireEvent(this.currentPage,"pagerewound")){return;}
if(!this._fireEvent(this,"wizardback")){return;}
this._pageStack.pop();this.currentPage=this._pageStack[this._pageStack.length-1];this.setAttribute("pagestep",this._pageStack.length);}
advance(aPageId){if(!this.canAdvance){return;}
if(this.currentPage&&!this._fireEvent(this.currentPage,"pagehide")){return;}
if(this.currentPage&&!this._fireEvent(this.currentPage,"pageadvanced")){return;}
if(this.onLastPage&&!aPageId){if(this._fireEvent(this,"wizardfinish")){window.setTimeout(function(){window.close();},1);}}else{if(!this._fireEvent(this,"wizardnext")){return;}
let page;if(aPageId){page=this.getPageById(aPageId);}else if(this.currentPage){if(this._accessMethod=="random"){page=this.getPageById(this.currentPage.next);}else{page=this.wizardPages[this.currentPage.pageIndex+1];}}else{page=this.wizardPages[0];}
if(page){this._pageStack.push(page);this.setAttribute("pagestep",this._pageStack.length);this.currentPage=page;}}}
goTo(aPageId){var page=this.getPageById(aPageId);if(page){this._pageStack[this._pageStack.length-1]=page;this.currentPage=page;}}
cancel(){if(!this._fireEvent(this,"wizardcancel")){return true;}
window.close();window.setTimeout(function(){window.close();},1);return false;}
_initCurrentPage(){if(this.onFirstPage){this.canRewind=false;this.setAttribute("firstpage","true");if(AppConstants.platform=="linux"){this.getButton("back").setAttribute("hidden","true");}}else{this.canRewind=true;this.setAttribute("firstpage","false");if(AppConstants.platform=="linux"){this.getButton("back").setAttribute("hidden","false");}}
if(this.onLastPage){this.canAdvance=true;this.setAttribute("lastpage","true");}else{this.setAttribute("lastpage","false");}
this._adjustWizardHeader();this._wizardButtons.onPageChange();}
_advanceFocusToPage(aPage){if(!this._hasLoaded){return;}


document.commandDispatcher.advanceFocusIntoSubtree(this);
 var focused=document.commandDispatcher.focusedElement;if(focused&&focused.hasAttribute("dlgtype")){this.focus();}}
_registerPage(aPage){aPage.pageIndex=this.pageCount;this.pageCount+=1;if(!this._accessMethod){this._accessMethod=aPage.next==""?"sequential":"random";}
if(!this._maybeStartWizard()&&this._hasStarted){

this._initCurrentPage();}}
_onWizardButtonsReady(){this._wizardButtonsReady=true;this._maybeStartWizard();}
_maybeStartWizard(aIsConnected){if(!this._hasStarted&&this.isConnected&&this._wizardButtonsReady&&this.pageCount>0){this._hasStarted=true;this.advance();return true;}
return false;}
_adjustWizardHeader(){let labelElement=this._wizardHeader.querySelector(".wizard-header-label");

if(this.currentPage.hasAttribute("data-header-label-id")){let id=this.currentPage.getAttribute("data-header-label-id");document.l10n.setAttributes(labelElement,id);}else{if(labelElement.hasAttribute("data-l10n-id")){labelElement.removeAttribute("data-l10n-id");}
var label=this.currentPage.getAttribute("label")||"";if(!label&&this.onFirstPage&&this._bundle){if(AppConstants.platform=="macosx"){label=this._bundle.GetStringFromName("default-first-title-mac");}else{label=this._bundle.formatStringFromName("default-first-title",[this.title,]);}}else if(!label&&this.onLastPage&&this._bundle){if(AppConstants.platform=="macosx"){label=this._bundle.GetStringFromName("default-last-title-mac");}else{label=this._bundle.formatStringFromName("default-last-title",[this.title,]);}}
labelElement.textContent=label;}
let headerDescEl=this._wizardHeader.querySelector(".wizard-header-description");if(headerDescEl){headerDescEl.textContent=this.currentPage.getAttribute("description");}}
_hitEnter(evt){if(!evt.defaultPrevented){this.advance();}}
_fireEvent(aTarget,aType){var event=document.createEvent("Events");event.initEvent(aType,true,true); return aTarget.dispatchEvent(event);}}
customElements.define("wizard",MozWizard);class MozWizardPage extends MozXULElement{constructor(){super();this.pageIndex=-1;}
connectedCallback(){this.setAttribute("slot","wizardpage");let wizard=this.closest("wizard");if(wizard){wizard._registerPage(this);}}
get pageid(){return this.getAttribute("pageid");}
set pageid(val){this.setAttribute("pageid",val);}
get next(){return this.getAttribute("next");}
set next(val){this.setAttribute("next",val);this.parentNode._accessMethod="random";return val;}}
customElements.define("wizardpage",MozWizardPage);class MozWizardButtons extends MozXULElement{connectedCallback(){this._wizard=this.getRootNode().host;this.textContent="";this.appendChild(this.constructor.fragment);MozXULElement.insertFTLIfNeeded("toolkit/global/wizard.ftl");this._wizardButtonDeck=this.querySelector(".wizard-next-deck");this.initializeAttributeInheritance();const listeners=[["back",()=>this._wizard.rewind()],["next",()=>this._wizard.advance()],["finish",()=>this._wizard.advance()],["cancel",()=>this._wizard.cancel()],["extra1",()=>this._wizard.extra1()],["extra2",()=>this._wizard.extra2()],];for(let[name,listener]of listeners){let btn=this.getButton(name);if(btn){btn.addEventListener("command",listener);}}
this._wizard._onWizardButtonsReady();}
static get inheritedAttributes(){return AppConstants.platform=="macosx"?{"[dlgtype='next']":"hidden=lastpage",}:null;}
static get markup(){if(AppConstants.platform=="macosx"){return`
        <vbox flex="1">
          <hbox class="wizard-buttons-btm">
            <button class="wizard-button" dlgtype="extra1" hidden="true"/>
            <button class="wizard-button" dlgtype="extra2" hidden="true"/>
            <button data-l10n-id="wizard-macos-button-cancel"
                    class="wizard-button" dlgtype="cancel"/>
            <spacer flex="1"/>
            <button data-l10n-id="wizard-macos-button-back"
                    class="wizard-button wizard-nav-button" dlgtype="back"/>
            <button data-l10n-id="wizard-macos-button-next"
                    class="wizard-button wizard-nav-button" dlgtype="next"
                    default="true" />
            <button data-l10n-id="wizard-macos-button-finish" class="wizard-button"
                    dlgtype="finish" default="true" />
          </hbox>
        </vbox>`;}
let buttons=AppConstants.platform=="linux"?`
      <button data-l10n-id="wizard-linux-button-cancel"
              class="wizard-button"
              dlgtype="cancel"/>
      <spacer style="width: 24px;"/>
      <button data-l10n-id="wizard-linux-button-back"
              class="wizard-button" dlgtype="back"/>
      <deck class="wizard-next-deck">
        <hbox>
          <button data-l10n-id="wizard-linux-button-finish"
                  class="wizard-button"
                  dlgtype="finish" default="true" flex="1"/>
        </hbox>
        <hbox>
          <button data-l10n-id="wizard-linux-button-next"
                  class="wizard-button" dlgtype="next"
                  default="true" flex="1"/>
        </hbox>
      </deck>`:`
      <button data-l10n-id="wizard-win-button-back"
              class="wizard-button" dlgtype="back"/>
      <deck class="wizard-next-deck">
        <hbox>
          <button data-l10n-id="wizard-win-button-finish"
                  class="wizard-button"
                  dlgtype="finish" default="true" flex="1"/>
        </hbox>
        <hbox>
          <button data-l10n-id="wizard-win-button-next"
                  class="wizard-button" dlgtype="next"
                  default="true" flex="1"/>
        </hbox>
      </deck>
      <button data-l10n-id="wizard-win-button-cancel"
              class="wizard-button"
              dlgtype="cancel"/>`;return`
      <vbox class="wizard-buttons-box-1" flex="1">
        <separator class="wizard-buttons-separator groove"/>
        <hbox class="wizard-buttons-box-2">
          <button class="wizard-button" dlgtype="extra1" hidden="true"/>
          <button class="wizard-button" dlgtype="extra2" hidden="true"/>
          <spacer flex="1" anonid="spacer"/>
          ${buttons}
        </hbox>
      </vbox>`;}
onPageChange(){if(AppConstants.platform=="macosx"){this.getButton("finish").hidden=!(this.getAttribute("lastpage")=="true");}else if(this.getAttribute("lastpage")=="true"){this._wizardButtonDeck.setAttribute("selectedIndex",0);}else{this._wizardButtonDeck.setAttribute("selectedIndex",1);}}
getButton(type){return this.querySelector(`[dlgtype="${type}"]`);}
get defaultButton(){let buttons=this._wizardButtonDeck.selectedPanel.getElementsByTagNameNS(XUL_NS,"button");for(let i=0;i<buttons.length;i++){if(buttons[i].getAttribute("default")=="true"&&!buttons[i].hidden&&!buttons[i].disabled){return buttons[i];}}
return null;}}
customElements.define("wizard-buttons",MozWizardButtons);}