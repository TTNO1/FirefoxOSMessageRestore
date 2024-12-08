"use strict";ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const IS_DIALOG_WINDOW=window.arguments&&window.arguments.length;let openWebLink=IS_DIALOG_WINDOW?window.arguments[0].wrappedJSObject.openWebLink:url=>{window.windowRoot.ownerGlobal.openWebLinkIn(url,"tab",{relatedToCurrent:true,});};const showOnAnyType=()=>false;const hideOnAnyType=()=>true;const hideOnThemeType=addonType=>addonType==="theme";

const ABUSE_REASONS=(window.ABUSE_REPORT_REASONS={damage:{isExampleHidden:showOnAnyType,isReasonHidden:hideOnThemeType,},spam:{isExampleHidden:showOnAnyType,isReasonHidden:showOnAnyType,},settings:{hasSuggestions:true,isExampleHidden:hideOnAnyType,isReasonHidden:hideOnThemeType,},deceptive:{isExampleHidden:showOnAnyType,isReasonHidden:showOnAnyType,},broken:{hasAddonTypeL10nId:true,hasAddonTypeSuggestionTemplate:true,hasSuggestions:true,isExampleHidden:hideOnThemeType,isReasonHidden:showOnAnyType,requiresSupportURL:true,},policy:{hasSuggestions:true,isExampleHidden:hideOnAnyType,isReasonHidden:showOnAnyType,},unwanted:{isExampleHidden:showOnAnyType,isReasonHidden:hideOnThemeType,},other:{isExampleHidden:hideOnAnyType,isReasonHidden:showOnAnyType,},});
const REASON_L10N_STRING_MAPPING={"abuse-report-damage-reason":"abuse-report-damage-reason-v2","abuse-report-spam-reason":"abuse-report-spam-reason-v2","abuse-report-settings-reason":"abuse-report-settings-reason-v2","abuse-report-deceptive-reason":"abuse-report-deceptive-reason-v2","abuse-report-broken-reason-extension":"abuse-report-broken-reason-extension-v2","abuse-report-broken-reason-theme":"abuse-report-broken-reason-theme-v2","abuse-report-policy-reason":"abuse-report-policy-reason-v2","abuse-report-unwanted-reason":"abuse-report-unwanted-reason-v2",};function getReasonL10nId(reason,addonType){let reasonId=`abuse-report-${reason}-reason`;
if(ABUSE_REASONS[reason].hasAddonTypeL10nId){reasonId+=`-${addonType}`;}

return REASON_L10N_STRING_MAPPING[reasonId]||reasonId;}
function getSuggestionsTemplate({addonType,reason,supportURL}){const reasonInfo=ABUSE_REASONS[reason];if(!addonType||!reasonInfo.hasSuggestions||(reasonInfo.requiresSupportURL&&!supportURL)){return null;}
let templateId=`tmpl-suggestions-${reason}`;
if(reasonInfo.hasAddonTypeSuggestionTemplate){templateId+=`-${addonType}`;}
return document.getElementById(templateId);}
const LEARNMORE_LINKS={".abuse-report-learnmore":{path:"reporting-extensions-and-themes-abuse",},".abuse-settings-search-learnmore":{path:"prefs-search",},".abuse-settings-homepage-learnmore":{path:"prefs-homepage",},".abuse-policy-learnmore":{baseURL:"https://www.mozilla.org/%LOCALE%/",path:"about/legal/report-infringement/",},};
function formatLearnMoreURLs(containerEl){for(const[linkClass,linkInfo]of Object.entries(LEARNMORE_LINKS)){for(const element of containerEl.querySelectorAll(linkClass)){const baseURL=linkInfo.baseURL?Services.urlFormatter.formatURL(linkInfo.baseURL):Services.urlFormatter.formatURLPref("app.support.baseURL");element.href=baseURL+linkInfo.path;}}}
function defineElementSelectorsGetters(object,propsMap){const props=Object.entries(propsMap).reduce((acc,entry)=>{const[name,selector]=entry;acc[name]={get:()=>object.querySelector(selector)};return acc;},{});Object.defineProperties(object,props);}

function defineElementAttributesProperties(object,propsMap){const props=Object.entries(propsMap).reduce((acc,entry)=>{const[name,attr]=entry;acc[name]={get:()=>object.getAttribute(attr),set:value=>{object.setAttribute(attr,value);},};return acc;},{});Object.defineProperties(object,props);}

function getElements(containerEl,propsMap){return Object.entries(propsMap).reduce((acc,entry)=>{const[name,selector]=entry;let elements=containerEl.querySelectorAll(selector);acc[name]=elements.length>1?elements:elements[0];return acc;},{});}
function dispatchCustomEvent(el,eventName,detail){el.dispatchEvent(new CustomEvent(eventName,{detail}));}





class AbuseReasonListItem extends HTMLLIElement{constructor(){super();defineElementAttributesProperties(this,{addonType:"addon-type",reason:"report-reason",checked:"checked",});}
connectedCallback(){this.update();}
async update(){if(this.reason!=="other"&&!this.addonType){return;}
const{reason,checked,addonType}=this;this.textContent="";const content=document.importNode(this.template.content,true);if(reason){const reasonId=`abuse-reason-${reason}`;const reasonInfo=ABUSE_REASONS[reason]||{};const{labelEl,descriptionEl,radioEl}=getElements(content,{labelEl:"label",descriptionEl:".reason-description",radioEl:"input[type=radio]",});labelEl.setAttribute("for",reasonId);radioEl.id=reasonId;radioEl.value=reason;radioEl.checked=!!checked;
document.l10n.setAttributes(descriptionEl,getReasonL10nId(reason,addonType));if(!reasonInfo.isExampleHidden(addonType)){const exampleEl=content.querySelector(".reason-example");document.l10n.setAttributes(exampleEl,`abuse-report-${reason}-example`);exampleEl.hidden=false;}}
formatLearnMoreURLs(content);this.appendChild(content);}
get template(){return document.getElementById("tmpl-reason-listitem");}}

class AbuseReasonsPanel extends HTMLElement{constructor(){super();defineElementAttributesProperties(this,{addonType:"addon-type",});}
connectedCallback(){this.update();}
update(){if(!this.isConnected||!this.addonType){return;}
const{addonType}=this;this.textContent="";const content=document.importNode(this.template.content,true);const{titleEl,listEl}=getElements(content,{titleEl:".abuse-report-title",listEl:"ul.abuse-report-reasons",});document.l10n.setAttributes(titleEl,`abuse-report-title-${addonType}`);const reasons=Object.keys(ABUSE_REASONS).filter(reason=>reason!=="other").sort(()=>Math.random()-0.5);for(const reason of reasons){const reasonInfo=ABUSE_REASONS[reason];if(!reasonInfo||reasonInfo.isReasonHidden(addonType)){continue;}
const item=document.createElement("li",{is:"abuse-report-reason-listitem",});item.reason=reason;item.addonType=addonType;listEl.prepend(item);}
listEl.firstElementChild.checked=true;formatLearnMoreURLs(content);this.appendChild(content);}
get template(){return document.getElementById("tmpl-reasons-panel");}}



class AbuseReasonSuggestions extends HTMLElement{constructor(){super();defineElementAttributesProperties(this,{extensionSupportURL:"extension-support-url",reason:"report-reason",});}
update(){const{addonType,extensionSupportURL,reason}=this;this.textContent="";let template=getSuggestionsTemplate({addonType,reason,supportURL:extensionSupportURL,});if(template){let content=document.importNode(template.content,true);formatLearnMoreURLs(content);let extSupportLink=content.querySelector("a.extension-support-link");if(extSupportLink){extSupportLink.href=extensionSupportURL;}
this.appendChild(content);this.hidden=false;}else{this.hidden=true;}}
get LEARNMORE_LINKS(){return Object.keys(LEARNMORE_LINKS);}}
class AbuseSubmitPanel extends HTMLElement{constructor(){super();defineElementAttributesProperties(this,{addonType:"addon-type",reason:"report-reason",extensionSupportURL:"extensionSupportURL",});defineElementSelectorsGetters(this,{_textarea:"textarea",_title:".abuse-reason-title",_suggestions:"abuse-report-reason-suggestions",});}
connectedCallback(){this.render();}
render(){this.textContent="";this.appendChild(document.importNode(this.template.content,true));}
update(){if(!this.isConnected||!this.addonType){return;}
const{addonType,reason,_suggestions,_title}=this;document.l10n.setAttributes(_title,getReasonL10nId(reason,addonType));_suggestions.reason=reason;_suggestions.addonType=addonType;_suggestions.extensionSupportURL=this.extensionSupportURL;_suggestions.update();}
clear(){this._textarea.value="";}
get template(){return document.getElementById("tmpl-submit-panel");}}
class AbuseReport extends HTMLElement{constructor(){super();this._report=null;defineElementSelectorsGetters(this,{_form:"form",_textarea:"textarea",_radioCheckedReason:"[type=radio]:checked",_reasonsPanel:"abuse-report-reasons-panel",_submitPanel:"abuse-report-submit-panel",_reasonsPanelButtons:".abuse-report-reasons-buttons",_submitPanelButtons:".abuse-report-submit-buttons",_iconClose:".abuse-report-close-icon",_btnNext:"button.abuse-report-next",_btnCancel:"button.abuse-report-cancel",_btnGoBack:"button.abuse-report-goback",_btnSubmit:"button.abuse-report-submit",_addonAuthorContainer:".abuse-report-header .addon-author-box",_addonIconElement:".abuse-report-header img.addon-icon",_addonNameElement:".abuse-report-header .addon-name",_linkAddonAuthor:".abuse-report-header .addon-author-box a.author",});}
connectedCallback(){this.render();this.addEventListener("click",this);

document.addEventListener("keydown",this);}
disconnectedCallback(){this.textContent="";this.removeEventListener("click",this);document.removeEventListener("keydown",this);}
handleEvent(evt){if(!this.isConnected||!this.addon){return;}
switch(evt.type){case"keydown":if(evt.key==="Escape"){
if(this.message&&!this._submitPanel.hidden){return;}
this.cancel();}
if(!IS_DIALOG_WINDOW){
this.handleKeyboardNavigation(evt);}
break;case"click":if(evt.target===this._iconClose||evt.target===this._btnCancel){

evt.target.blur();this.cancel();}
if(evt.target===this._btnNext){this.switchToSubmitMode();}
if(evt.target===this._btnGoBack){this.switchToListMode();}
if(evt.target===this._btnSubmit){this.submit();}
if(evt.target.localName==="a"){evt.preventDefault();evt.stopPropagation();const url=evt.target.getAttribute("href");if(url){openWebLink(url);}}
break;}}
handleKeyboardNavigation(evt){if(evt.keyCode!==evt.DOM_VK_TAB||evt.altKey||evt.controlKey||evt.metaKey){return;}
const fm=Services.focus;const backward=evt.shiftKey;const isFirstFocusableElement=el=>{if(el===document.body){return true;}


const rv=el==fm.moveFocus(window,null,fm.MOVEFOCUS_FIRST,0);fm.setFocus(el,0);return rv;};

if(backward&&isFirstFocusableElement(evt.target)){evt.preventDefault();evt.stopImmediatePropagation();const chromeWin=window.windowRoot.ownerGlobal;Services.focus.moveFocus(chromeWin,null,Services.MOVEFOCUS_BACKWARD,Services.focus.FLAG_BYKEY);}}
render(){this.textContent="";const formTemplate=document.importNode(this.template.content,true);if(IS_DIALOG_WINDOW){this.appendChild(formTemplate);}else{
const modalTemplate=document.importNode(this.modalTemplate.content,true);this.appendChild(modalTemplate);this.querySelector(".modal-panel-container").appendChild(formTemplate);this.querySelector("form").classList.add("card");}}
async update(){if(!this.addon){return;}
const{addonId,_addonAuthorContainer,_addonIconElement,_addonNameElement,_linkAddonAuthor,_reasonsPanel,_submitPanel,}=this;
this.switchToListMode();if(!["extension","theme"].includes(this.addonType)){this.cancel();return;}
_addonNameElement.textContent=this.addonName;if(this.authorName){_linkAddonAuthor.href=this.authorURL||this.homepageURL;_linkAddonAuthor.textContent=this.authorName;document.l10n.setAttributes(_linkAddonAuthor.parentNode,"abuse-report-addon-authored-by",{"author-name":this.authorName});_addonAuthorContainer.hidden=false;}else{_addonAuthorContainer.hidden=true;}
_addonIconElement.setAttribute("src",this.iconURL);_reasonsPanel.addonType=this.addonType;_reasonsPanel.update();_submitPanel.addonType=this.addonType;_submitPanel.reason=this.reason;_submitPanel.extensionSupportURL=this.supportURL;_submitPanel.update();this.focus();dispatchCustomEvent(this,"abuse-report:updated",{addonId,panel:"reasons",});}
setAbuseReport(abuseReport){this._report=abuseReport;this._submitPanel.clear();if(abuseReport){this.update();this.hidden=false;}else{this.hidden=true;}}
focus(){if(!this.isConnected||!this.addon){return;}
if(this._reasonsPanel.hidden){const{_textarea}=this;_textarea.focus();_textarea.select();}else{const{_radioCheckedReason}=this;if(_radioCheckedReason){_radioCheckedReason.focus();}}}
cancel(){if(!this.isConnected||!this.addon){return;}
this._report=null;dispatchCustomEvent(this,"abuse-report:cancel");}
submit(){if(!this.isConnected||!this.addon){return;}
this._report.setMessage(this.message);this._report.setReason(this.reason);dispatchCustomEvent(this,"abuse-report:submit",{addonId:this.addonId,report:this._report,});}
switchToSubmitMode(){if(!this.isConnected||!this.addon){return;}
this._submitPanel.reason=this.reason;this._submitPanel.update();this._reasonsPanel.hidden=true;this._reasonsPanelButtons.hidden=true;this._submitPanel.hidden=false;this._submitPanelButtons.hidden=false;this.focus();dispatchCustomEvent(this,"abuse-report:updated",{addonId:this.addonId,panel:"submit",});}
switchToListMode(){if(!this.isConnected||!this.addon){return;}
this._submitPanel.hidden=true;this._submitPanelButtons.hidden=true;this._reasonsPanel.hidden=false;this._reasonsPanelButtons.hidden=false;this.focus();dispatchCustomEvent(this,"abuse-report:updated",{addonId:this.addonId,panel:"reasons",});}
get addon(){return this._report&&this._report.addon;}
get addonId(){return this.addon&&this.addon.id;}
get addonName(){return this.addon&&this.addon.name;}
get addonType(){return this.addon&&this.addon.type;}
get addonCreator(){return this.addon&&this.addon.creator;}
get homepageURL(){const{addon}=this;return(addon&&addon.homepageURL)||this.authorURL||"";}
get authorName(){
return(this.addonCreator&&this.addonCreator.name)||"";}
get authorURL(){return(this.addonCreator&&this.addonCreator.url)||"";}
get iconURL(){return this.addon&&this.addon.iconURL;}
get supportURL(){return(this.addon&&this.addon.supportURL)||this.homepageURL||"";}
get message(){return this._form.elements.message.value;}
get reason(){return this._form.elements.reason.value;}
get modalTemplate(){return document.getElementById("tmpl-modal");}
get template(){return document.getElementById("tmpl-abuse-report");}}
customElements.define("abuse-report-reason-listitem",AbuseReasonListItem,{extends:"li",});customElements.define("abuse-report-reason-suggestions",AbuseReasonSuggestions);customElements.define("abuse-report-reasons-panel",AbuseReasonsPanel);customElements.define("abuse-report-submit-panel",AbuseSubmitPanel);customElements.define("addon-abuse-report",AbuseReport);if(IS_DIALOG_WINDOW){
document.documentElement.className="dialog-window";const{report,deferredReport,deferredReportPanel,}=window.arguments[0].wrappedJSObject;window.addEventListener("unload",()=>{

deferredReport.resolve({userCancelled:true});deferredReportPanel.reject(new Error("report dialog closed"));},{once:true});document.l10n.setAttributes(document.querySelector("head > title"),"abuse-report-dialog-title",{"addon-name":report.addon.name,});const el=document.querySelector("addon-abuse-report");el.addEventListener("abuse-report:submit",()=>{deferredReport.resolve({userCancelled:false,report,});});el.addEventListener("abuse-report:cancel",()=>{

deferredReportPanel.resolve(el);deferredReport.resolve({userCancelled:true});},{once:true});
el.addEventListener("abuse-report:updated",async()=>{const form=document.querySelector("form");await document.l10n.translateFragment(form);const{clientWidth,clientHeight}=await window.promiseDocumentFlushed(()=>form);
deferredReportPanel.resolve(el);if(window.innerWidth!==clientWidth||window.innerheight!==clientHeight){window.resizeTo(clientWidth,clientHeight);}},{once:true});el.setAbuseReport(report);}