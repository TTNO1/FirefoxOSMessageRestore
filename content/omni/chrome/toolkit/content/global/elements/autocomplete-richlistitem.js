"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");MozElements.MozAutocompleteRichlistitem=class MozAutocompleteRichlistitem extends MozElements.MozRichlistitem{constructor(){super();this.addEventListener("mousedown",event=>{let control=this.control;if(!control||control.disabled){return;}
if(!this.selected){control.selectItem(this);}
control.currentItem=this;});this.addEventListener("mouseover",event=>{


let mouseDown=event.buttons&0b111;if(!mouseDown){return;}
let control=this.control;if(!control||control.disabled){return;}
if(!this.selected){control.selectItem(this);}
control.currentItem=this;});this.addEventListener("overflow",()=>this._onOverflow());this.addEventListener("underflow",()=>this._onUnderflow());}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.textContent="";this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();this._boundaryCutoff=null;this._inOverflow=false;this._adjustAcItem();}
static get inheritedAttributes(){return{".ac-type-icon":"selected,current,type",".ac-site-icon":"src=image,selected,type",".ac-title":"selected",".ac-title-text":"selected",".ac-separator":"selected,type",".ac-url":"selected",".ac-url-text":"selected",};}
static get markup(){return`
      <image class="ac-type-icon"/>
      <image class="ac-site-icon"/>
      <hbox class="ac-title" align="center">
        <description class="ac-text-overflow-container">
          <description class="ac-title-text"/>
        </description>
      </hbox>
      <hbox class="ac-separator" align="center">
        <description class="ac-separator-text" value="—"/>
      </hbox>
      <hbox class="ac-url" align="center" aria-hidden="true">
        <description class="ac-text-overflow-container">
          <description class="ac-url-text"/>
        </description>
      </hbox>
    `;}
get _typeIcon(){return this.querySelector(".ac-type-icon");}
get _titleText(){return this.querySelector(".ac-title-text");}
get _separator(){return this.querySelector(".ac-separator");}
get _urlText(){return this.querySelector(".ac-url-text");}
get _stringBundle(){if(!this.__stringBundle){this.__stringBundle=Services.strings.createBundle("chrome://global/locale/autocomplete.properties");}
return this.__stringBundle;}
get boundaryCutoff(){if(!this._boundaryCutoff){this._boundaryCutoff=Services.prefs.getIntPref("toolkit.autocomplete.richBoundaryCutoff");}
return this._boundaryCutoff;}
_cleanup(){this.removeAttribute("url");this.removeAttribute("image");this.removeAttribute("title");this.removeAttribute("text");}
_onOverflow(){this._inOverflow=true;this._handleOverflow();}
_onUnderflow(){this._inOverflow=false;this._handleOverflow();}
_getBoundaryIndices(aText,aSearchTokens){if(aSearchTokens==""){return[0,aText.length];} 
let regions=[];for(let search of Array.prototype.slice.call(aSearchTokens)){let matchIndex=-1;let searchLen=search.length; let lowerText=aText.substr(0,this.boundaryCutoff).toLowerCase();while((matchIndex=lowerText.indexOf(search,matchIndex+1))>=0){regions.push([matchIndex,matchIndex+searchLen]);}} 
regions=regions.sort((a,b)=>{let start=a[0]-b[0];return start==0?a[1]-b[1]:start;}); let start=0;let end=0;let boundaries=[];let len=regions.length;for(let i=0;i<len;i++){ let region=regions[i];if(region[0]>end){ boundaries.push(start); boundaries.push(end); start=region[0];} 
end=Math.max(end,region[1]);} 
boundaries.push(start);boundaries.push(end); if(end<aText.length){boundaries.push(aText.length);} 
return boundaries.slice(1);}
_getSearchTokens(aSearch){let search=aSearch.toLowerCase();return search.split(/\s+/);}
_setUpDescription(aDescriptionElement,aText){ if(!aDescriptionElement){return;}
while(aDescriptionElement.hasChildNodes()){aDescriptionElement.firstChild.remove();} 
let search=this.getAttribute("text");let tokens=this._getSearchTokens(search);let indices=this._getBoundaryIndices(aText,tokens);this._appendDescriptionSpans(indices,aText,aDescriptionElement,aDescriptionElement);}
_appendDescriptionSpans(indices,text,spansParentElement,descriptionElement){let next;let start=0;let len=indices.length; for(let i=indices[0]==0?1:0;i<len;i++){next=indices[i];let spanText=text.substr(start,next-start);start=next;if(i%2==0){ let span=spansParentElement.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml","span"));this._setUpEmphasisSpan(span,descriptionElement);span.textContent=spanText;}else{ spansParentElement.appendChild(document.createTextNode(spanText));}}}
_setUpEmphasisSpan(aSpan,aDescriptionElement){aSpan.classList.add("ac-emphasize-text");switch(aDescriptionElement){case this._titleText:aSpan.classList.add("ac-emphasize-text-title");break;case this._urlText:aSpan.classList.add("ac-emphasize-text-url");break;}}
_generateEmphasisPairs(aSourceString,aReplacements){let pairs=[];
let parts=aSourceString.split(/(%(?:[0-9]+\$)?S)/);for(let part of parts){

if(part.length===0){continue;}


let match=part.match(/^%(?:([0-9]+)\$)?S$/);if(match){

let index=(match[1]||1)-1;if(index>=0&&index<aReplacements.length){pairs.push([...aReplacements[index]]);}}else{pairs.push([part]);}}
return pairs;}
_setUpEmphasisedSections(aDescriptionElement,aTextPairs){ while(aDescriptionElement.hasChildNodes()){aDescriptionElement.firstChild.remove();}
for(let[text,emphasise]of aTextPairs){if(emphasise){let span=aDescriptionElement.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml","span"));span.textContent=text;switch(emphasise){case"match":this._setUpEmphasisSpan(span,aDescriptionElement);break;}}else{aDescriptionElement.appendChild(document.createTextNode(text));}}}
_unescapeUrl(url){return Services.textToSubURI.unEscapeURIForUI(url);}
_reuseAcItem(){this.collapsed=false;
let dwu=window.windowUtils;let popupWidth=dwu.getBoundsWithoutFlushing(this.parentNode).width;if(!this._previousPopupWidth||this._previousPopupWidth!=popupWidth){this._previousPopupWidth=popupWidth;this.handleOverUnderflow();}}
_adjustAcItem(){let originalUrl=this.getAttribute("ac-value");let title=this.getAttribute("ac-comment");this.setAttribute("url",originalUrl);this.setAttribute("image",this.getAttribute("ac-image"));this.setAttribute("title",title);this.setAttribute("text",this.getAttribute("ac-text"));let type=this.getAttribute("originaltype");let types=new Set(type.split(/\s+/));types.delete("autofill");type=[...types][0]||"";this.setAttribute("type",type);let displayUrl=this._unescapeUrl(originalUrl);if(!title){try{let uri=Services.io.newURI(originalUrl);if(uri.host){title=uri.host;}}catch(e){}
if(!title){title=displayUrl;}}
if(Array.isArray(title)){this._setUpEmphasisedSections(this._titleText,title);}else{this._setUpDescription(this._titleText,title);}
this._setUpDescription(this._urlText,displayUrl);



let wasInOverflow=this._inOverflow;this._removeMaxWidths();if(wasInOverflow&&this._inOverflow){this._handleOverflow();}}
_removeMaxWidths(){if(this._hasMaxWidths){this._titleText.style.removeProperty("max-width");this._urlText.style.removeProperty("max-width");this._hasMaxWidths=false;}}
_handleOverflow(){let itemRect=this.parentNode.getBoundingClientRect();let titleRect=this._titleText.getBoundingClientRect();let separatorRect=this._separator.getBoundingClientRect();let urlRect=this._urlText.getBoundingClientRect();let separatorURLWidth=separatorRect.width+urlRect.width;

let dir=this.getAttribute("dir");let titleStart=dir=="rtl"?itemRect.right-titleRect.right:titleRect.left-itemRect.left;let popup=this.parentNode.parentNode;let itemWidth=itemRect.width-
titleStart-
popup.overflowPadding-
(popup.margins?popup.margins.end:0);let titleWidth=titleRect.width;if(titleWidth+separatorURLWidth>itemWidth){let titlePct=0.66;let titleAvailable=itemWidth-separatorURLWidth;let titleMaxWidth=Math.max(titleAvailable,itemWidth*titlePct);if(titleWidth>titleMaxWidth){this._titleText.style.maxWidth=titleMaxWidth+"px";}
let urlMaxWidth=Math.max(itemWidth-titleWidth,itemWidth*(1-titlePct));urlMaxWidth-=separatorRect.width;this._urlText.style.maxWidth=urlMaxWidth+"px";this._hasMaxWidths=true;}}
handleOverUnderflow(){this._removeMaxWidths();this._handleOverflow();}};MozXULElement.implementCustomInterface(MozElements.MozAutocompleteRichlistitem,[Ci.nsIDOMXULSelectControlItemElement]);class MozAutocompleteRichlistitemInsecureWarning extends MozElements.MozAutocompleteRichlistitem{constructor(){super();this.addEventListener("click",event=>{if(event.button!=0){return;}
let baseURL=Services.urlFormatter.formatURLPref("app.support.baseURL");window.openTrustedLinkIn(baseURL+"insecure-password","tab",{relatedToCurrent:true,});});}
connectedCallback(){if(this.delayConnectedCallback()){return;}
super.connectedCallback();

this.classList.add("forceHandleUnderflow");}
static get inheritedAttributes(){return{".ac-type-icon":"selected,current,type",".ac-site-icon":"src=image,selected,type",".ac-title-text":"selected",".ac-separator":"selected,type",".ac-url":"selected",".ac-url-text":"selected",};}
static get markup(){return`
      <image class="ac-type-icon"/>
      <image class="ac-site-icon"/>
      <vbox class="ac-title" align="left">
        <description class="ac-text-overflow-container">
          <description class="ac-title-text"/>
        </description>
      </vbox>
      <hbox class="ac-separator" align="center">
        <description class="ac-separator-text" value="—"/>
      </hbox>
      <hbox class="ac-url" align="center">
        <description class="ac-text-overflow-container">
          <description class="ac-url-text"/>
        </description>
      </hbox>
    `;}
get _learnMoreString(){if(!this.__learnMoreString){this.__learnMoreString=Services.strings.createBundle("chrome://passwordmgr/locale/passwordmgr.properties").GetStringFromName("insecureFieldWarningLearnMore");}
return this.__learnMoreString;}
_getSearchTokens(aSearch){return[this._learnMoreString.toLowerCase()];}}
class MozAutocompleteRichlistitemLoginsFooter extends MozElements.MozAutocompleteRichlistitem{constructor(){super();function handleEvent(event){if(event.button!=0){return;}
const{LoginHelper}=ChromeUtils.import("resource://gre/modules/LoginHelper.jsm");LoginHelper.openPasswordManager(this.ownerGlobal,{entryPoint:"autocomplete",});Services.telemetry.recordEvent("exp_import","event","click","loginsFooter");}
this.addEventListener("click",handleEvent);}}
class MozAutocompleteImportableLearnMoreRichlistitem extends MozElements.MozAutocompleteRichlistitem{constructor(){super();MozXULElement.insertFTLIfNeeded("toolkit/main-window/autocomplete.ftl");this.addEventListener("click",event=>{window.openTrustedLinkIn(Services.urlFormatter.formatURLPref("app.support.baseURL")+"password-import","tab",{relatedToCurrent:true});});}
static get markup(){return`
      <image class="ac-type-icon"/>
      <image class="ac-site-icon"/>
      <vbox class="ac-title" align="left">
        <description class="ac-text-overflow-container">
          <description class="ac-title-text"
                       data-l10n-id="autocomplete-import-learn-more"/>
        </description>
      </vbox>
      <hbox class="ac-separator" align="center">
        <description class="ac-separator-text" value="—"/>
      </hbox>
      <hbox class="ac-url" align="center">
        <description class="ac-text-overflow-container">
          <description class="ac-url-text"/>
        </description>
      </hbox>
    `;}
_setUpDescription(){}}
class MozAutocompleteTwoLineRichlistitem extends MozElements.MozRichlistitem{connectedCallback(){if(this.delayConnectedCallback()){return;}
this.textContent="";this.appendChild(this.constructor.fragment);this.initializeAttributeInheritance();this._adjustAcItem();}
static get inheritedAttributes(){return{".line1-label":"text=ac-value",".line2-label":"text=ac-label",};}
static get markup(){return`
      <div xmlns="http://www.w3.org/1999/xhtml"
           xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
           class="two-line-wrapper">
        <xul:image class="ac-site-icon"></xul:image>
        <div class="labels-wrapper">
          <div class="label-row line1-label"></div>
          <div class="label-row line2-label"></div>
        </div>
      </div>
    `;}
_adjustAcItem(){const popup=this.parentNode.parentNode;const minWidth=getComputedStyle(popup).minWidth.replace("px","");

 this.firstElementChild.style.width=Math.max(minWidth,popup.width)+"px";}
_onOverflow(){}
_onUnderflow(){}
handleOverUnderflow(){}}
class MozAutocompleteLoginRichlistitem extends MozAutocompleteTwoLineRichlistitem{static get inheritedAttributes(){return{".line1-label":"text=ac-value",};}
_adjustAcItem(){super._adjustAcItem();let details=JSON.parse(this.getAttribute("ac-label"));this.querySelector(".line2-label").textContent=details.comment;}}
class MozAutocompleteGeneratedPasswordRichlistitem extends MozAutocompleteTwoLineRichlistitem{constructor(){super();

this.generatedPasswordText=document.createElement("span");this.line3Text=document.createElement("span");this.line3=document.createElement("div");this.line3.className="label-row generated-password-autosave";this.line3.append(this.line3Text);}
get _autoSaveString(){if(!this.__autoSaveString){let brandShorterName=Services.strings.createBundle("chrome://branding/locale/brand.properties").GetStringFromName("brandShorterName");this.__autoSaveString=Services.strings.createBundle("chrome://passwordmgr/locale/passwordmgr.properties").formatStringFromName("generatedPasswordWillBeSaved",[brandShorterName,]);}
return this.__autoSaveString;}
_adjustAcItem(){let{generatedPassword,willAutoSaveGeneratedPassword}=JSON.parse(this.getAttribute("ac-label"));let line2Label=this.querySelector(".line2-label");line2Label.textContent="";this.generatedPasswordText.textContent=generatedPassword;line2Label.append(this.generatedPasswordText);if(willAutoSaveGeneratedPassword){this.line3Text.textContent=this._autoSaveString;this.querySelector(".labels-wrapper").append(this.line3);}else{this.line3.remove();}
super._adjustAcItem();}}
class MozAutocompleteImportableLoginsRichlistitem extends MozAutocompleteTwoLineRichlistitem{constructor(){super();MozXULElement.insertFTLIfNeeded("toolkit/main-window/autocomplete.ftl");this.addEventListener("click",event=>{if(event.button!=0){return;}
gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("LoginManager").receiveMessage({name:"PasswordManager:HandleImportable",data:{browserId:this.getAttribute("ac-value"),type:"click",},});});}
static get markup(){return`
      <div xmlns="http://www.w3.org/1999/xhtml"
           xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
           class="two-line-wrapper">
        <xul:image class="ac-site-icon" />
        <div class="labels-wrapper">
          <div class="label-row line1-label" data-l10n-name="line1" />
          <div class="label-row line2-label" data-l10n-name="line2" />
        </div>
      </div>
    `;}
_adjustAcItem(){document.l10n.setAttributes(this.querySelector(".labels-wrapper"),`autocomplete-import-logins-${this.getAttribute("ac-value")}`,{host:this.getAttribute("ac-label").replace(/^www\./,""),});super._adjustAcItem();}}
customElements.define("autocomplete-richlistitem",MozElements.MozAutocompleteRichlistitem,{extends:"richlistitem",});customElements.define("autocomplete-richlistitem-insecure-warning",MozAutocompleteRichlistitemInsecureWarning,{extends:"richlistitem",});customElements.define("autocomplete-richlistitem-logins-footer",MozAutocompleteRichlistitemLoginsFooter,{extends:"richlistitem",});customElements.define("autocomplete-two-line-richlistitem",MozAutocompleteTwoLineRichlistitem,{extends:"richlistitem",});customElements.define("autocomplete-login-richlistitem",MozAutocompleteLoginRichlistitem,{extends:"richlistitem",});customElements.define("autocomplete-generated-password-richlistitem",MozAutocompleteGeneratedPasswordRichlistitem,{extends:"richlistitem",});customElements.define("autocomplete-importable-learn-more-richlistitem",MozAutocompleteImportableLearnMoreRichlistitem,{extends:"richlistitem",});customElements.define("autocomplete-importable-logins-richlistitem",MozAutocompleteImportableLoginsRichlistitem,{extends:"richlistitem",});}