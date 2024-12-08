"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");let LazyConstants={};ChromeUtils.defineModuleGetter(LazyConstants,"PluralForm","resource://gre/modules/PluralForm.jsm");const PREFS_TO_OBSERVE_BOOL=new Map([["findAsYouType","accessibility.typeaheadfind"],["manualFAYT","accessibility.typeaheadfind.manual"],["typeAheadLinksOnly","accessibility.typeaheadfind.linksonly"],["entireWord","findbar.entireword"],["highlightAll","findbar.highlightAll"],["useModalHighlight","findbar.modalHighlight"],]);const PREFS_TO_OBSERVE_INT=new Map([["typeAheadCaseSensitive","accessibility.typeaheadfind.casesensitive"],["matchDiacritics","findbar.matchdiacritics"],]);const PREFS_TO_OBSERVE_ALL=new Map([...PREFS_TO_OBSERVE_BOOL,...PREFS_TO_OBSERVE_INT,]);const TOPIC_MAC_APP_ACTIVATE="mac_app_activate";class MozFindbar extends MozXULElement{static get markup(){return`
      <hbox anonid="findbar-container" class="findbar-container" flex="1" align="center">
        <hbox anonid="findbar-textbox-wrapper" align="stretch">
          <html:input anonid="findbar-textbox" class="findbar-textbox findbar-find-fast" />
          <toolbarbutton anonid="find-previous" class="findbar-find-previous tabbable"
            data-l10n-attrs="tooltiptext" data-l10n-id="findbar-previous"
            oncommand="onFindAgainCommand(true);" disabled="true" />
          <toolbarbutton anonid="find-next" class="findbar-find-next tabbable"
            data-l10n-id="findbar-next" oncommand="onFindAgainCommand(false);" disabled="true" />
        </hbox>
        <toolbarbutton anonid="highlight" class="findbar-highlight findbar-button tabbable"
          data-l10n-id="findbar-highlight-all2" oncommand="toggleHighlight(this.checked);" type="checkbox" />
        <toolbarbutton anonid="find-case-sensitive" class="findbar-case-sensitive findbar-button tabbable"
          data-l10n-id="findbar-case-sensitive" oncommand="_setCaseSensitivity(this.checked ? 1 : 0);" type="checkbox" />
        <toolbarbutton anonid="find-match-diacritics" class="findbar-match-diacritics findbar-button tabbable"
          data-l10n-id="findbar-match-diacritics" oncommand="_setDiacriticMatching(this.checked ? 1 : 0);" type="checkbox" />
        <toolbarbutton anonid="find-entire-word" class="findbar-entire-word findbar-button tabbable"
          data-l10n-id="findbar-entire-word" oncommand="toggleEntireWord(this.checked);" type="checkbox" />
        <label anonid="match-case-status" class="findbar-find-fast" />
        <label anonid="match-diacritics-status" class="findbar-find-fast" />
        <label anonid="entire-word-status" class="findbar-find-fast" />
        <label anonid="found-matches" class="findbar-find-fast found-matches" hidden="true" />
        <image anonid="find-status-icon" class="findbar-find-fast find-status-icon" />
        <description anonid="find-status" control="findbar-textbox" class="findbar-find-fast findbar-find-status" />
      </hbox>
      <toolbarbutton anonid="find-closebutton" class="findbar-closebutton close-icon"
        data-l10n-id="findbar-find-button-close" oncommand="close();" />
      `;}
constructor(){super();MozXULElement.insertFTLIfNeeded("toolkit/main-window/findbar.ftl");this.destroy=this.destroy.bind(this);
this.addEventListener("keypress",event=>{if(event.keyCode==event.DOM_VK_ESCAPE){if(this.close){this.close();}
event.preventDefault();}},true);}
connectedCallback(){

this.setAttribute("noanim","true");this.hidden=true;this.appendChild(this.constructor.fragment);this.FIND_NORMAL=0;this.FIND_TYPEAHEAD=1;this.FIND_LINKS=2;this._findMode=0;this._flashFindBar=0;this._initialFlashFindBarCount=6;this._startFindDeferred=null;this._browser=null;this._destroyed=false;this._strBundle=null;this._xulBrowserWindow=null;this._findField=this.getElement("findbar-textbox");this._foundMatches=this.getElement("found-matches");this._findStatusIcon=this.getElement("find-status-icon");this._findStatusDesc=this.getElement("find-status");this._foundURL=null;let prefsvc=Services.prefs;this.quickFindTimeoutLength=prefsvc.getIntPref("accessibility.typeaheadfind.timeout");this._flashFindBar=prefsvc.getIntPref("accessibility.typeaheadfind.flashBar");let observe=(this._observe=this.observe.bind(this));for(let[propName,prefName]of PREFS_TO_OBSERVE_ALL){prefsvc.addObserver(prefName,observe);let prefGetter=PREFS_TO_OBSERVE_BOOL.has(propName)?"Bool":"Int";this["_"+propName]=prefsvc[`get${prefGetter}Pref`](prefName);}
Services.obs.addObserver(observe,TOPIC_MAC_APP_ACTIVATE);this._findResetTimeout=-1;
if(this.getAttribute("browserid")){setTimeout(()=>{ this.browser=this.browser;},0);}
window.addEventListener("unload",this.destroy);this._findField.addEventListener("input",event=>{


if(this._isIMEComposing){return;}
const value=this._findField.value;if(this._hadValue&&!value){this._willfullyDeleted=true;this._hadValue=false;}else if(value.trim()){this._hadValue=true;this._willfullyDeleted=false;}
this._find(value);});this._findField.addEventListener("keypress",event=>{switch(event.keyCode){case KeyEvent.DOM_VK_RETURN:if(this.findMode==this.FIND_NORMAL){let findString=this._findField;if(!findString.value){return;}
if(event.getModifierState("Accel")){this.getElement("highlight").click();return;}
this.onFindAgainCommand(event.shiftKey);}else{this._finishFAYT(event);}
break;case KeyEvent.DOM_VK_TAB:let shouldHandle=!event.altKey&&!event.ctrlKey&&!event.metaKey;if(shouldHandle&&this.findMode!=this.FIND_NORMAL){this._finishFAYT(event);}
break;case KeyEvent.DOM_VK_PAGE_UP:case KeyEvent.DOM_VK_PAGE_DOWN:if(!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){this.browser.finder.keyPress(event);event.preventDefault();}
break;case KeyEvent.DOM_VK_UP:case KeyEvent.DOM_VK_DOWN:this.browser.finder.keyPress(event);event.preventDefault();break;}});this._findField.addEventListener("blur",event=>{
this.browser.finder.enableSelection();});this._findField.addEventListener("focus",event=>{this._updateBrowserWithState();});this._findField.addEventListener("compositionstart",event=>{let findbar=this;findbar._isIMEComposing=true;if(findbar._quickFindTimeout){clearTimeout(findbar._quickFindTimeout);findbar._quickFindTimeout=null;findbar._updateBrowserWithState();}});this._findField.addEventListener("compositionend",event=>{this._isIMEComposing=false;if(this.findMode!=this.FIND_NORMAL){this._setFindCloseTimeout();}});this._findField.addEventListener("dragover",event=>{if(event.dataTransfer.types.includes("text/plain")){event.preventDefault();}});this._findField.addEventListener("drop",event=>{let value=event.dataTransfer.getData("text/plain");this._findField.value=value;this._find(value);event.stopPropagation();event.preventDefault();});}
set findMode(val){this._findMode=val;this._updateBrowserWithState();return val;}
get findMode(){return this._findMode;}
set prefillWithSelection(val){this.setAttribute("prefillwithselection",val);return val;}
get prefillWithSelection(){return this.getAttribute("prefillwithselection")!="false";}
get hasTransactions(){if(this._findField.value){return true;} 
if(this._findField.editor){let tm=this._findField.editor.transactionManager;return!!(tm.numberOfUndoItems||tm.numberOfRedoItems);}
return false;}
set browser(val){function setFindbarInActor(browser,findbar){if(!browser.frameLoader){return;}
let windowGlobal=browser.browsingContext.currentWindowGlobal;if(windowGlobal){let findbarParent=windowGlobal.getActor("FindBar");if(findbarParent){findbarParent.setFindbar(browser,findbar);}}}
if(this._browser){setFindbarInActor(this._browser,null);let finder=this._browser.finder;if(finder){finder.removeResultListener(this);}}
this._browser=val;if(this._browser){this._updateBrowserWithState();setFindbarInActor(this._browser,this);this._browser.finder.addResultListener(this);}
return val;}
get browser(){if(!this._browser){this._browser=document.getElementById(this.getAttribute("browserid"));}
return this._browser;}
get strBundle(){if(!this._strBundle){this._strBundle=Services.strings.createBundle("chrome://global/locale/findbar.properties");}
return this._strBundle;}
observe(subject,topic,prefName){if(topic==TOPIC_MAC_APP_ACTIVATE){this._onAppActivateMac();return;}
if(topic!="nsPref:changed"){return;}
let prefsvc=Services.prefs;switch(prefName){case"accessibility.typeaheadfind":this._findAsYouType=prefsvc.getBoolPref(prefName);break;case"accessibility.typeaheadfind.manual":this._manualFAYT=prefsvc.getBoolPref(prefName);break;case"accessibility.typeaheadfind.timeout":this.quickFindTimeoutLength=prefsvc.getIntPref(prefName);break;case"accessibility.typeaheadfind.linksonly":this._typeAheadLinksOnly=prefsvc.getBoolPref(prefName);break;case"accessibility.typeaheadfind.casesensitive":this._setCaseSensitivity(prefsvc.getIntPref(prefName));break;case"findbar.entireword":this._entireWord=prefsvc.getBoolPref(prefName);this.toggleEntireWord(this._entireWord,true);break;case"findbar.highlightAll":this.toggleHighlight(prefsvc.getBoolPref(prefName),true);break;case"findbar.matchdiacritics":this._setDiacriticMatching(prefsvc.getIntPref(prefName));break;case"findbar.modalHighlight":this._useModalHighlight=prefsvc.getBoolPref(prefName);if(this.browser.finder){this.browser.finder.onModalHighlightChange(this._useModalHighlight);}
break;}}
getElement(aAnonymousID){return this.querySelector(`[anonid=${aAnonymousID}]`);}
destroy(){if(this._destroyed){return;}
window.removeEventListener("unload",this.destroy);this._destroyed=true;if(this.browser&&this.browser.finder){this.browser.finder.destroy();}
this.browser=null;let prefsvc=Services.prefs;let observe=this._observe;for(let[,prefName]of PREFS_TO_OBSERVE_ALL){prefsvc.removeObserver(prefName,observe);}
Services.obs.removeObserver(observe,TOPIC_MAC_APP_ACTIVATE);this._cancelTimers();}
_cancelTimers(){if(this._flashFindBarTimeout){clearInterval(this._flashFindBarTimeout);this._flashFindBarTimeout=null;}
if(this._quickFindTimeout){clearTimeout(this._quickFindTimeout);this._quickFindTimeout=null;}
if(this._findResetTimeout){clearTimeout(this._findResetTimeout);this._findResetTimeout=null;}}
_setFindCloseTimeout(){if(this._quickFindTimeout){clearTimeout(this._quickFindTimeout);}

if(this._isIMEComposing||this.hidden){this._quickFindTimeout=null;this._updateBrowserWithState();return;}
if(this.quickFindTimeoutLength<1){this._quickFindTimeout=null;}else{this._quickFindTimeout=setTimeout(()=>{if(this.findMode!=this.FIND_NORMAL){this.close();}
this._quickFindTimeout=null;},this.quickFindTimeoutLength);}
this._updateBrowserWithState();}
_updateMatchesCount(){if(!this._dispatchFindEvent("matchescount")){return;}
this.browser.finder.requestMatchesCount(this._findField.value,this.findMode==this.FIND_LINKS);}
toggleHighlight(highlight,fromPrefObserver){if(highlight===this._highlightAll){return;}
this.browser.finder.onHighlightAllChange(highlight);this._setHighlightAll(highlight,fromPrefObserver);if(!this._dispatchFindEvent("highlightallchange")){return;}
let word=this._findField.value;if(highlight&&!word){return;}
this.browser.finder.highlight(highlight,word,this.findMode==this.FIND_LINKS); this._updateMatchesCount(Ci.nsITypeAheadFind.FIND_FOUND);}
_setHighlightAll(highlight,fromPrefObserver){if(typeof highlight!="boolean"){highlight=this._highlightAll;}
if(highlight!==this._highlightAll){this._highlightAll=highlight;if(!fromPrefObserver){Services.telemetry.scalarAdd("findbar.highlight_all",1);Services.prefs.setBoolPref("findbar.highlightAll",highlight);}}
let checkbox=this.getElement("highlight");checkbox.checked=this._highlightAll;}
_updateCaseSensitivity(str){let val=str||this._findField.value;let caseSensitive=this._shouldBeCaseSensitive(val);let checkbox=this.getElement("find-case-sensitive");let statusLabel=this.getElement("match-case-status");checkbox.checked=caseSensitive;statusLabel.value=caseSensitive?this._caseSensitiveStr:"";let hideCheckbox=this.findMode!=this.FIND_NORMAL||(this._typeAheadCaseSensitive!=0&&this._typeAheadCaseSensitive!=1);checkbox.hidden=hideCheckbox;statusLabel.hidden=!hideCheckbox;this.browser.finder.caseSensitive=caseSensitive;}
_setCaseSensitivity(caseSensitivity){this._typeAheadCaseSensitive=caseSensitivity;this._updateCaseSensitivity();this._findFailedString=null;this._find();this._dispatchFindEvent("casesensitivitychange");Services.telemetry.scalarAdd("findbar.match_case",1);}
_updateDiacriticMatching(str){let val=str||this._findField.value;let matchDiacritics=this._shouldMatchDiacritics(val);let checkbox=this.getElement("find-match-diacritics");let statusLabel=this.getElement("match-diacritics-status");checkbox.checked=matchDiacritics;statusLabel.value=matchDiacritics?this._matchDiacriticsStr:"";let hideCheckbox=this.findMode!=this.FIND_NORMAL||(this._matchDiacritics!=0&&this._matchDiacritics!=1);checkbox.hidden=hideCheckbox;statusLabel.hidden=!hideCheckbox;this.browser.finder.matchDiacritics=matchDiacritics;}
_setDiacriticMatching(diacriticMatching){this._matchDiacritics=diacriticMatching;this._updateDiacriticMatching();this._findFailedString=null;this._find();this._dispatchFindEvent("diacriticmatchingchange");Services.telemetry.scalarAdd("findbar.match_diacritics",1);}
_setEntireWord(){let entireWord=this._entireWord;let checkbox=this.getElement("find-entire-word");let statusLabel=this.getElement("entire-word-status");checkbox.checked=entireWord;statusLabel.value=entireWord?this._entireWordStr:"";let hideCheckbox=this.findMode!=this.FIND_NORMAL;checkbox.hidden=hideCheckbox;statusLabel.hidden=!hideCheckbox;this.browser.finder.entireWord=entireWord;}
toggleEntireWord(entireWord,fromPrefObserver){if(!fromPrefObserver){Services.prefs.setBoolPref("findbar.entireword",entireWord);Services.telemetry.scalarAdd("findbar.whole_words",1);return;}
this._findFailedString=null;this._find();}
open(mode){if(mode!=undefined){this.findMode=mode;}
if(!this._notFoundStr){var bundle=this.strBundle;this._notFoundStr=bundle.GetStringFromName("NotFound");this._wrappedToTopStr=bundle.GetStringFromName("WrappedToTop");this._wrappedToBottomStr=bundle.GetStringFromName("WrappedToBottom");this._normalFindStr=bundle.GetStringFromName("NormalFind");this._fastFindStr=bundle.GetStringFromName("FastFind");this._fastFindLinksStr=bundle.GetStringFromName("FastFindLinks");this._caseSensitiveStr=bundle.GetStringFromName("CaseSensitive");this._matchDiacriticsStr=bundle.GetStringFromName("MatchDiacritics");this._entireWordStr=bundle.GetStringFromName("EntireWord");}
this._findFailedString=null;this._updateFindUI();if(this.hidden){Services.telemetry.scalarAdd("findbar.shown",1);this.removeAttribute("noanim");this.hidden=false;this._updateStatusUI(Ci.nsITypeAheadFind.FIND_FOUND);let event=document.createEvent("Events");event.initEvent("findbaropen",true,false);this.dispatchEvent(event);this.browser.finder.onFindbarOpen();return true;}
return false;}
close(noAnim){if(this.hidden){return;}
if(noAnim){this.setAttribute("noanim",true);}
this.hidden=true;let event=document.createEvent("Events");event.initEvent("findbarclose",true,false);this.dispatchEvent(event);
this.browser.finder.focusContent();this.browser.finder.onFindbarClose();this._cancelTimers();this._updateBrowserWithState();this._findFailedString=null;}
clear(){this.browser.finder.removeSelection(); this._findField.value="";if(this._findField.editor){this._findField.editor.transactionManager.clear();}
this.toggleHighlight(false);this._updateStatusUI();this._enableFindButtons(false);}
_dispatchKeypressEvent(target,fakeEvent){if(!target){return;}
let event=new target.ownerGlobal.KeyboardEvent(fakeEvent.type,fakeEvent);target.dispatchEvent(event);}
_updateStatusUIBar(foundURL){if(!this._xulBrowserWindow){try{this._xulBrowserWindow=window.docShell.treeOwner.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIAppWindow).XULBrowserWindow;}catch(ex){}
if(!this._xulBrowserWindow){return false;}}
this._xulBrowserWindow.setOverLink(foundURL||"");return true;}
_finishFAYT(keypressEvent){this.browser.finder.focusContent();if(keypressEvent){keypressEvent.preventDefault();}
this.browser.finder.keyPress(keypressEvent);this.close();return true;}
_shouldBeCaseSensitive(str){if(this._typeAheadCaseSensitive==0){return false;}
if(this._typeAheadCaseSensitive==1){return true;}
return str!=str.toLowerCase();}
_shouldMatchDiacritics(str){if(this._matchDiacritics==0){return false;}
if(this._matchDiacritics==1){return true;}
return str!=str.normalize("NFD");}
onMouseUp(){if(!this.hidden&&this.findMode!=this.FIND_NORMAL){this.close();}}
_onBrowserKeypress(fakeEvent){const FAYT_LINKS_KEY="'";const FAYT_TEXT_KEY="/";if(!this.hidden&&this._findField==document.activeElement){this._dispatchKeypressEvent(this._findField,fakeEvent);return;}
if(this.findMode!=this.FIND_NORMAL&&this._quickFindTimeout){this._findField.select();this._findField.focus();this._dispatchKeypressEvent(this._findField,fakeEvent);return;}
let key=fakeEvent.charCode?String.fromCharCode(fakeEvent.charCode):null;let manualstartFAYT=(key==FAYT_LINKS_KEY||key==FAYT_TEXT_KEY)&&this._manualFAYT;let autostartFAYT=!manualstartFAYT&&this._findAsYouType&&key&&key!=" ";if(manualstartFAYT||autostartFAYT){let mode=key==FAYT_LINKS_KEY||(autostartFAYT&&this._typeAheadLinksOnly)?this.FIND_LINKS:this.FIND_TYPEAHEAD; 
this._findField.value="";this.open(mode);this._setFindCloseTimeout();this._findField.select();this._findField.focus();if(autostartFAYT){this._dispatchKeypressEvent(this._findField,fakeEvent);}else{this._updateStatusUI(Ci.nsITypeAheadFind.FIND_FOUND);}}}
_updateBrowserWithState(){if(this._browser){this._browser.sendMessageToActor("Findbar:UpdateState",{findMode:this.findMode,isOpenAndFocused:!this.hidden&&document.activeElement==this._findField,hasQuickFindTimeout:!!this._quickFindTimeout,},"FindBar","all");}}
_enableFindButtons(aEnable){this.getElement("find-next").disabled=this.getElement("find-previous").disabled=!aEnable;}
_updateFindUI(){let showMinimalUI=this.findMode!=this.FIND_NORMAL;let nodes=this.getElement("findbar-container").children;let wrapper=this.getElement("findbar-textbox-wrapper");let foundMatches=this._foundMatches;for(let node of nodes){if(node==wrapper||node==foundMatches){continue;}
node.hidden=showMinimalUI;}
this.getElement("find-next").hidden=this.getElement("find-previous").hidden=showMinimalUI;foundMatches.hidden=showMinimalUI||!foundMatches.value;this._updateCaseSensitivity();this._updateDiacriticMatching();this._setEntireWord();this._setHighlightAll();if(showMinimalUI){this._findField.classList.add("minimal");}else{this._findField.classList.remove("minimal");}
if(this.findMode==this.FIND_TYPEAHEAD){this._findField.placeholder=this._fastFindStr;}else if(this.findMode==this.FIND_LINKS){this._findField.placeholder=this._fastFindLinksStr;}else{this._findField.placeholder=this._normalFindStr;}}
_find(value){if(!this._dispatchFindEvent("")){return;}
let val=value||this._findField.value;
this.browser._lastSearchString=val;

if(!this._findFailedString||!val.startsWith(this._findFailedString)||this._entireWord){
if(this._startFindDeferred){this._startFindDeferred.resolve();this._startFindDeferred=null;}
this._enableFindButtons(val);this._updateCaseSensitivity(val);this._updateDiacriticMatching(val);this._setEntireWord();this.browser.finder.fastFind(val,this.findMode==this.FIND_LINKS,this.findMode!=this.FIND_NORMAL);}
if(this.findMode!=this.FIND_NORMAL){this._setFindCloseTimeout();}
if(this._findResetTimeout!=-1){clearTimeout(this._findResetTimeout);}


this._findResetTimeout=setTimeout(()=>{this._findFailedString=null;this._findResetTimeout=-1;},1000);}
_flash(){if(this._flashFindBarCount===undefined){this._flashFindBarCount=this._initialFlashFindBarCount;}
if(this._flashFindBarCount--==0){clearInterval(this._flashFindBarTimeout);this._findField.removeAttribute("flash");this._flashFindBarCount=6;return;}
this._findField.setAttribute("flash",this._flashFindBarCount%2==0?"false":"true");}
_findAgain(findPrevious){this.browser.finder.findAgain(this._findField.value,findPrevious,this.findMode==this.FIND_LINKS,this.findMode!=this.FIND_NORMAL);}
_updateStatusUI(res,findPrevious){switch(res){case Ci.nsITypeAheadFind.FIND_WRAPPED:this._findStatusIcon.setAttribute("status","wrapped");this._findStatusDesc.textContent=findPrevious?this._wrappedToBottomStr:this._wrappedToTopStr;this._findField.removeAttribute("status");break;case Ci.nsITypeAheadFind.FIND_NOTFOUND:this._findStatusIcon.setAttribute("status","notfound");this._findStatusDesc.textContent=this._notFoundStr;this._findField.setAttribute("status","notfound");break;case Ci.nsITypeAheadFind.FIND_PENDING:this._findStatusIcon.setAttribute("status","pending");this._findStatusDesc.textContent="";this._findField.removeAttribute("status");break;case Ci.nsITypeAheadFind.FIND_FOUND:default:this._findStatusIcon.removeAttribute("status");this._findStatusDesc.textContent="";this._findField.removeAttribute("status");break;}}
updateControlState(result,findPrevious){this._updateStatusUI(result,findPrevious);this._enableFindButtons(result!==Ci.nsITypeAheadFind.FIND_NOTFOUND&&!!this._findField.value);}
_dispatchFindEvent(type,findPrevious){let event=document.createEvent("CustomEvent");event.initCustomEvent("find"+type,true,true,{query:this._findField.value,caseSensitive:!!this._typeAheadCaseSensitive,matchDiacritics:!!this._matchDiacritics,entireWord:this._entireWord,highlightAll:this._highlightAll,findPrevious,});return this.dispatchEvent(event);}
startFind(mode){let prefsvc=Services.prefs;let userWantsPrefill=true;this.open(mode);if(this._flashFindBar){this._flashFindBarTimeout=setInterval(()=>this._flash(),500);prefsvc.setIntPref("accessibility.typeaheadfind.flashBar",--this._flashFindBar);}
let{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");this._startFindDeferred=PromiseUtils.defer();let startFindPromise=this._startFindDeferred.promise;if(this.prefillWithSelection){userWantsPrefill=prefsvc.getBoolPref("accessibility.typeaheadfind.prefillwithselection");}
if(this.prefillWithSelection&&userWantsPrefill){
this._findField.focus();

this._findField.select();this.browser.finder.getInitialSelection();return startFindPromise;}

this.onCurrentSelection("",true);return startFindPromise;}
onFindCommand(){return this.startFind(this.FIND_NORMAL);}
onFindAgainCommand(findPrevious){if(findPrevious){Services.telemetry.scalarAdd("findbar.find_prev",1);}else{Services.telemetry.scalarAdd("findbar.find_next",1);}
let findString=this._browser.finder.searchString||this._findField.value;if(!findString){return this.startFind();}



if(!this._dispatchFindEvent("again",findPrevious)){return undefined;} 
this._findFailedString=null; if(this._findField.value!=this._browser.finder.searchString){this._find(this._findField.value);}else{this._findAgain(findPrevious);if(this._useModalHighlight){this.open();this._findField.focus();}}
return undefined;}
onFindSelectionCommand(){this.browser.finder.setSearchStringToSelection().then(searchInfo=>{if(searchInfo.selectedText){this._findField.value=searchInfo.selectedText;}});}
_onAppActivateMac(){const kPref="accessibility.typeaheadfind.prefillwithselection";if(this.prefillWithSelection&&Services.prefs.getBoolPref(kPref)){return;}
let clipboardSearchString=this._browser.finder.clipboardSearchString;if(clipboardSearchString&&this._findField.value!=clipboardSearchString&&!this._findField._willfullyDeleted){this._findField.value=clipboardSearchString;this._findField._hadValue=true;
this._updateStatusUI();}}
onFindResult(data){if(data.result==Ci.nsITypeAheadFind.FIND_NOTFOUND){if(data.storeResult&&this.open()){this._findField.select();this._findField.focus();}
this._findFailedString=data.searchString;}else{this._findFailedString=null;}
this._updateStatusUI(data.result,data.findBackwards);this._updateStatusUIBar(data.linkURL);if(this.findMode!=this.FIND_NORMAL){this._setFindCloseTimeout();}}
onMatchesCountResult(result){if(result.total!==0){if(result.total==-1){this._foundMatches.value=LazyConstants.PluralForm.get(result.limit,this.strBundle.GetStringFromName("FoundMatchesCountLimit")).replace("#1",result.limit);}else{this._foundMatches.value=LazyConstants.PluralForm.get(result.total,this.strBundle.GetStringFromName("FoundMatches")).replace("#1",result.current).replace("#2",result.total);}
this._foundMatches.hidden=false;}else{this._foundMatches.hidden=true;this._foundMatches.value="";}}
onHighlightFinished(result){}
onCurrentSelection(selectionString,isInitialSelection){if(isInitialSelection&&!this._startFindDeferred){return;}
if(AppConstants.platform=="macosx"&&isInitialSelection&&!selectionString){let clipboardSearchString=this.browser.finder.clipboardSearchString;if(clipboardSearchString){selectionString=clipboardSearchString;}}
if(selectionString){this._findField.value=selectionString;}
if(isInitialSelection){this._enableFindButtons(!!this._findField.value);this._findField.select();this._findField.focus();this._startFindDeferred.resolve();this._startFindDeferred=null;}}
shouldFocusContent(){const fm=Services.focus;if(fm.focusedWindow!=window){return false;}
let focusedElement=fm.focusedElement;if(!focusedElement){return false;}
let focusedParent=focusedElement.closest("findbar");if(focusedParent!=this&&focusedParent!=this._findField){return false;}
return true;}
disconnectedCallback(){while(this.lastChild){this.removeChild(this.lastChild);}
this.destroy();}}
customElements.define("findbar",MozFindbar);}