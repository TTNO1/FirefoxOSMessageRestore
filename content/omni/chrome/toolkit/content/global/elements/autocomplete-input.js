"use strict";
{const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");class AutocompleteInput extends HTMLInputElement{constructor(){super();ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"disablePopupAutohide","ui.popup.disable_autohide",false);this.addEventListener("input",event=>{this.onInput(event);});this.addEventListener("keydown",event=>this.handleKeyDown(event));this.addEventListener("compositionstart",event=>{if(this.mController.input.wrappedJSObject==this.nsIAutocompleteInput){this.mController.handleStartComposition();}},true);this.addEventListener("compositionend",event=>{if(this.mController.input.wrappedJSObject==this.nsIAutocompleteInput){this.mController.handleEndComposition();}},true);this.addEventListener("focus",event=>{this.attachController();if(window.gBrowser&&window.gBrowser.selectedBrowser.hasAttribute("usercontextid")){this.userContextId=parseInt(window.gBrowser.selectedBrowser.getAttribute("usercontextid"));}else{this.userContextId=0;}},true);this.addEventListener("blur",event=>{if(!this._dontBlur){if(this.forceComplete&&this.mController.matchCount>=1){

this.mController.handleEnter(true);}
if(!this.ignoreBlurWhileSearching){this._dontClosePopup=this.disablePopupAutohide;this.detachController();}}},true);}
connectedCallback(){this.setAttribute("is","autocomplete-input");this.setAttribute("autocomplete","off");this.mController=Cc["@mozilla.org/autocomplete/controller;1"].getService(Ci.nsIAutoCompleteController);this.mSearchNames=null;this.mIgnoreInput=false;this.noRollupOnEmptySearch=false;this._popup=null;this.nsIAutocompleteInput=this.getCustomInterfaceCallback(Ci.nsIAutoCompleteInput);this.valueIsTyped=false;this._selectionDetails=null;}
get popup(){if(this._popup){return this._popup;}
let popup=null;let popupId=this.getAttribute("autocompletepopup");if(popupId){popup=document.getElementById(popupId);}
if(!popup){popup=document.createXULElement("panel",{is:"autocomplete-richlistbox-popup",});popup.setAttribute("type","autocomplete-richlistbox");popup.setAttribute("noautofocus","true");if(!this._popupset){this._popupset=document.createXULElement("popupset");document.documentElement.appendChild(this._popupset);}
this._popupset.appendChild(popup);}
popup.mInput=this;return(this._popup=popup);}
get popupElement(){return this.popup;}
get controller(){return this.mController;}
set popupOpen(val){if(val){this.openPopup();}else{this.closePopup();}}
get popupOpen(){return this.popup.popupOpen;}
set disableAutoComplete(val){this.setAttribute("disableautocomplete",val);return val;}
get disableAutoComplete(){return this.getAttribute("disableautocomplete")=="true";}
set completeDefaultIndex(val){this.setAttribute("completedefaultindex",val);return val;}
get completeDefaultIndex(){return this.getAttribute("completedefaultindex")=="true";}
set completeSelectedIndex(val){this.setAttribute("completeselectedindex",val);return val;}
get completeSelectedIndex(){return this.getAttribute("completeselectedindex")=="true";}
set forceComplete(val){this.setAttribute("forcecomplete",val);return val;}
get forceComplete(){return this.getAttribute("forcecomplete")=="true";}
set minResultsForPopup(val){this.setAttribute("minresultsforpopup",val);return val;}
get minResultsForPopup(){var m=parseInt(this.getAttribute("minresultsforpopup"));return isNaN(m)?1:m;}
set timeout(val){this.setAttribute("timeout",val);return val;}
get timeout(){var t=parseInt(this.getAttribute("timeout"));return isNaN(t)?50:t;}
set searchParam(val){this.setAttribute("autocompletesearchparam",val);return val;}
get searchParam(){return this.getAttribute("autocompletesearchparam")||"";}
get searchCount(){this.initSearchNames();return this.mSearchNames.length;}
get inPrivateContext(){return this.PrivateBrowsingUtils.isWindowPrivate(window);}
get noRollupOnCaretMove(){return this.popup.getAttribute("norolluponanchor")=="true";}
set textValue(val){
this._setValueInternal(val,true);return this.value;}
get textValue(){return this.value;}
get editable(){return true;}
set crop(val){return false;}
get crop(){return false;}
set open(val){if(val){this.showHistoryPopup();}else{this.closePopup();}}
get open(){return this.getAttribute("open")=="true";}
set value(val){return this._setValueInternal(val,false);}
get value(){return super.value;}
get focused(){return this===document.activeElement;}
set maxRows(val){this.setAttribute("maxrows",val);return val;}
get maxRows(){return parseInt(this.getAttribute("maxrows"))||0;}
set maxdropmarkerrows(val){this.setAttribute("maxdropmarkerrows",val);return val;}
get maxdropmarkerrows(){return parseInt(this.getAttribute("maxdropmarkerrows"),10)||14;}
set tabScrolling(val){this.setAttribute("tabscrolling",val);return val;}
get tabScrolling(){return this.getAttribute("tabscrolling")=="true";}
set ignoreBlurWhileSearching(val){this.setAttribute("ignoreblurwhilesearching",val);return val;}
get ignoreBlurWhileSearching(){return this.getAttribute("ignoreblurwhilesearching")=="true";}
set highlightNonMatches(val){this.setAttribute("highlightnonmatches",val);return val;}
get highlightNonMatches(){return this.getAttribute("highlightnonmatches")=="true";}
getSearchAt(aIndex){this.initSearchNames();return this.mSearchNames[aIndex];}
setTextValueWithReason(aValue,aReason){this.textValue=aValue;}
selectTextRange(aStartIndex,aEndIndex){super.setSelectionRange(aStartIndex,aEndIndex);}
onSearchBegin(){if(this.popup&&typeof this.popup.onSearchBegin=="function"){this.popup.onSearchBegin();}}
onSearchComplete(){if(this.mController.matchCount==0){this.setAttribute("nomatch","true");}else{this.removeAttribute("nomatch");}
if(this.ignoreBlurWhileSearching&&!this.focused){this.handleEnter();this.detachController();}}
onTextEntered(event){if(this.getAttribute("notifylegacyevents")==="true"){let e=new CustomEvent("textEntered",{bubbles:false,cancelable:true,detail:{rootEvent:event},});return!this.dispatchEvent(e);}
return false;}
onTextReverted(event){if(this.getAttribute("notifylegacyevents")==="true"){let e=new CustomEvent("textReverted",{bubbles:false,cancelable:true,detail:{rootEvent:event},});return!this.dispatchEvent(e);}
return false;}
attachController(){this.mController.input=this.nsIAutocompleteInput;}
detachController(){if(this.mController.input&&this.mController.input.wrappedJSObject==this.nsIAutocompleteInput){this.mController.input=null;}}
openPopup(){if(this.focused){this.popup.openAutocompletePopup(this.nsIAutocompleteInput,this);}}
closePopup(){if(this._dontClosePopup){delete this._dontClosePopup;return;}
this.popup.closePopup();}
showHistoryPopup(){
this.popup._normalMaxRows=this.maxRows;

this.maxRows=this.maxdropmarkerrows;if(!this.focused){this.focus();}
this.attachController();this.mController.startSearch("");}
toggleHistoryPopup(){if(!this.popup.popupOpen){this.showHistoryPopup();}else{this.closePopup();}}
handleKeyDown(aEvent){if(aEvent.defaultPrevented&&!aEvent.urlbarDeferred){return false;}
if(typeof this.onBeforeHandleKeyDown=="function"&&this.onBeforeHandleKeyDown(aEvent)){return true;}
const isMac=AppConstants.platform=="macosx";var cancel=false;

let metaKey=isMac?aEvent.ctrlKey:aEvent.altKey;if(!metaKey){switch(aEvent.keyCode){case KeyEvent.DOM_VK_LEFT:case KeyEvent.DOM_VK_RIGHT:case KeyEvent.DOM_VK_HOME:cancel=this.mController.handleKeyNavigation(aEvent.keyCode);break;}}
if(!aEvent.ctrlKey&&!aEvent.altKey){switch(aEvent.keyCode){case KeyEvent.DOM_VK_TAB:if(this.tabScrolling&&this.popup.popupOpen){cancel=this.mController.handleKeyNavigation(aEvent.shiftKey?KeyEvent.DOM_VK_UP:KeyEvent.DOM_VK_DOWN);}else if(this.forceComplete&&this.mController.matchCount>=1){this.mController.handleTab();}
break;case KeyEvent.DOM_VK_UP:case KeyEvent.DOM_VK_DOWN:case KeyEvent.DOM_VK_PAGE_UP:case KeyEvent.DOM_VK_PAGE_DOWN:cancel=this.mController.handleKeyNavigation(aEvent.keyCode);break;}}
if(isMac&&this.popup.popupOpen&&aEvent.ctrlKey&&(aEvent.key==="n"||aEvent.key==="p")){const effectiveKey=aEvent.key==="p"?KeyEvent.DOM_VK_UP:KeyEvent.DOM_VK_DOWN;cancel=this.mController.handleKeyNavigation(effectiveKey);}

switch(aEvent.keyCode){case KeyEvent.DOM_VK_ESCAPE:cancel=this.mController.handleEscape();break;case KeyEvent.DOM_VK_RETURN:if(isMac){ if(aEvent.metaKey){aEvent.preventDefault();}}
if(this.popup.selectedIndex>=0){this._selectionDetails={index:this.popup.selectedIndex,kind:"key",};}
cancel=this.handleEnter(aEvent);break;case KeyEvent.DOM_VK_DELETE:if(isMac&&!aEvent.shiftKey){break;}
cancel=this.handleDelete();break;case KeyEvent.DOM_VK_BACK_SPACE:if(isMac&&aEvent.shiftKey){cancel=this.handleDelete();}
break;case KeyEvent.DOM_VK_DOWN:case KeyEvent.DOM_VK_UP:if(aEvent.altKey){this.toggleHistoryPopup();}
break;case KeyEvent.DOM_VK_F4:if(!isMac){this.toggleHistoryPopup();}
break;}
if(cancel){aEvent.stopPropagation();aEvent.preventDefault();}
return true;}
handleEnter(event){return this.mController.handleEnter(false,event||null);}
handleDelete(){return this.mController.handleDelete();}
initSearchNames(){if(!this.mSearchNames){var names=this.getAttribute("autocompletesearch");if(!names){this.mSearchNames=[];}else{this.mSearchNames=names.split(" ");}}}
_focus(){this._dontBlur=true;this.focus();this._dontBlur=false;}
resetActionType(){if(this.mIgnoreInput){return;}
this.removeAttribute("actiontype");}
_setValueInternal(value,isUserInput){this.mIgnoreInput=true;if(typeof this.onBeforeValueSet=="function"){value=this.onBeforeValueSet(value);}
this.valueIsTyped=false;if(isUserInput){super.setUserInput(value);}else{super.value=value;}
this.mIgnoreInput=false;var event=document.createEvent("Events");event.initEvent("ValueChange",true,true);super.dispatchEvent(event);return value;}
onInput(aEvent){if(!this.mIgnoreInput&&this.mController.input.wrappedJSObject==this.nsIAutocompleteInput){this.valueIsTyped=true;this.mController.handleText();}
this.resetActionType();}}
MozHTMLElement.implementCustomInterface(AutocompleteInput,[Ci.nsIAutoCompleteInput,Ci.nsIDOMXULMenuListElement,]);customElements.define("autocomplete-input",AutocompleteInput,{extends:"input",});}