//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["InlineSpellChecker","SpellCheckHelper"];const MAX_UNDO_STACK_DEPTH=1;const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function InlineSpellChecker(aEditor){this.init(aEditor);this.mAddedWordStack=[];}
InlineSpellChecker.prototype={ init(aEditor){this.uninit();this.mEditor=aEditor;try{this.mInlineSpellChecker=this.mEditor.getInlineSpellChecker(true);}catch(e){this.mInlineSpellChecker=null;}},initFromRemote(aSpellInfo,aWindowGlobalParent){if(this.mRemote){
Cu.reportError(new Error("Unexpected remote spellchecker present!"));try{this.mRemote.uninit();}catch(ex){Cu.reportError(ex);}
this.mRemote=null;}
this.uninit();if(!aSpellInfo){return;}
this.mInlineSpellChecker=this.mRemote=new RemoteSpellChecker(aSpellInfo,aWindowGlobalParent);this.mOverMisspelling=aSpellInfo.overMisspelling;this.mMisspelling=aSpellInfo.misspelling;}, uninit(){if(this.mRemote){this.mRemote.uninit();this.mRemote=null;}
this.mEditor=null;this.mInlineSpellChecker=null;this.mOverMisspelling=false;this.mMisspelling="";this.mMenu=null;this.mSpellSuggestions=[];this.mSuggestionItems=[];this.mDictionaryMenu=null;this.mDictionaryItems=[];this.mWordNode=null;},
 initFromEvent(rangeParent,rangeOffset){this.mOverMisspelling=false;if(!rangeParent||!this.mInlineSpellChecker){return;}
var selcon=this.mEditor.selectionController;var spellsel=selcon.getSelection(selcon.SELECTION_SPELLCHECK);if(spellsel.rangeCount==0){return;} 
var range=this.mInlineSpellChecker.getMisspelledWord(rangeParent,rangeOffset);if(!range){return;} 
this.mMisspelling=range.toString();this.mOverMisspelling=true;this.mWordNode=rangeParent;this.mWordOffset=rangeOffset;},
get canSpellCheck(){
 if(this.mRemote){return this.mRemote.canSpellCheck;}
return this.mInlineSpellChecker!=null;},get initialSpellCheckPending(){if(this.mRemote){return this.mRemote.spellCheckPending;}
return!!(this.mInlineSpellChecker&&!this.mInlineSpellChecker.spellChecker&&this.mInlineSpellChecker.spellCheckPending);}, get enabled(){if(this.mRemote){return this.mRemote.enableRealTimeSpell;}
return(this.mInlineSpellChecker&&this.mInlineSpellChecker.enableRealTimeSpell);},set enabled(isEnabled){if(this.mRemote){this.mRemote.setSpellcheckUserOverride(isEnabled);}else if(this.mInlineSpellChecker){this.mEditor.setSpellcheckUserOverride(isEnabled);}}, get overMisspelling(){return this.mOverMisspelling;},
addSuggestionsToMenu(menu,insertBefore,maxNumber){if(!this.mRemote&&(!this.mInlineSpellChecker||!this.mOverMisspelling)){return 0;} 
var spellchecker=this.mRemote||this.mInlineSpellChecker.spellChecker;try{if(!this.mRemote&&!spellchecker.CheckCurrentWord(this.mMisspelling)){return 0;}
}catch(e){return 0;}
this.mMenu=menu;this.mSpellSuggestions=[];this.mSuggestionItems=[];for(var i=0;i<maxNumber;i++){var suggestion=spellchecker.GetSuggestedWord();if(!suggestion.length){break;}
this.mSpellSuggestions.push(suggestion);var item=menu.ownerDocument.createXULElement("menuitem");this.mSuggestionItems.push(item);item.setAttribute("label",suggestion);item.setAttribute("value",suggestion);
var callback=function(me,val){return function(evt){me.replaceMisspelling(val);};};item.addEventListener("command",callback(this,i),true);item.setAttribute("class","spell-suggestion");menu.insertBefore(item,insertBefore);}
return this.mSpellSuggestions.length;},
clearSuggestionsFromMenu(){for(var i=0;i<this.mSuggestionItems.length;i++){this.mMenu.removeChild(this.mSuggestionItems[i]);}
this.mSuggestionItems=[];},sortDictionaryList(list){var sortedList=[];var names=Services.intl.getLocaleDisplayNames(undefined,list);for(var i=0;i<list.length;i++){sortedList.push({localeCode:list[i],displayName:names[i]});}
let comparer=new Services.intl.Collator().compare;sortedList.sort((a,b)=>comparer(a.displayName,b.displayName));return sortedList;},
 addDictionaryListToMenu(menu,insertBefore){this.mDictionaryMenu=menu;this.mDictionaryItems=[];if(!this.enabled){return 0;}
var list;var curlang="";if(this.mRemote){list=this.mRemote.dictionaryList;curlang=this.mRemote.currentDictionary;}else if(this.mInlineSpellChecker){var spellchecker=this.mInlineSpellChecker.spellChecker;list=spellchecker.GetDictionaryList();try{curlang=spellchecker.GetCurrentDictionary();}catch(e){}}
var sortedList=this.sortDictionaryList(list);for(var i=0;i<sortedList.length;i++){var item=menu.ownerDocument.createXULElement("menuitem");item.setAttribute("id","spell-check-dictionary-"+sortedList[i].localeCode);

item.setAttribute("label",sortedList[i].displayName);item.setAttribute("type","radio");this.mDictionaryItems.push(item);if(curlang==sortedList[i].localeCode){item.setAttribute("checked","true");}else{var callback=function(me,localeCode){return function(evt){me.selectDictionary(localeCode);var view=menu.ownerGlobal;var spellcheckChangeEvent=new view.CustomEvent("spellcheck-changed",{detail:{dictionary:localeCode}});menu.ownerDocument.dispatchEvent(spellcheckChangeEvent);};};item.addEventListener("command",callback(this,sortedList[i].localeCode),true);}
if(insertBefore){menu.insertBefore(item,insertBefore);}else{menu.appendChild(item);}}
return list.length;},
clearDictionaryListFromMenu(){for(var i=0;i<this.mDictionaryItems.length;i++){this.mDictionaryMenu.removeChild(this.mDictionaryItems[i]);}
this.mDictionaryItems=[];}, selectDictionary(localeCode){if(this.mRemote){this.mRemote.selectDictionary(localeCode);return;}
if(!this.mInlineSpellChecker){return;}
var spellchecker=this.mInlineSpellChecker.spellChecker;spellchecker.SetCurrentDictionary(localeCode);this.mInlineSpellChecker.spellCheckRange(null);}, replaceMisspelling(index){if(this.mRemote){this.mRemote.replaceMisspelling(index);return;}
if(!this.mInlineSpellChecker||!this.mOverMisspelling){return;}
if(index<0||index>=this.mSpellSuggestions.length){return;}
this.mInlineSpellChecker.replaceWord(this.mWordNode,this.mWordOffset,this.mSpellSuggestions[index]);}, toggleEnabled(){if(this.mRemote){this.mRemote.toggleEnabled();}else{this.mEditor.setSpellcheckUserOverride(!this.mInlineSpellChecker.enableRealTimeSpell);}}, addToDictionary(){ if(this.mAddedWordStack.length==MAX_UNDO_STACK_DEPTH){this.mAddedWordStack.shift();}
this.mAddedWordStack.push(this.mMisspelling);if(this.mRemote){this.mRemote.addToDictionary();}else{this.mInlineSpellChecker.addWordToDictionary(this.mMisspelling);}}, undoAddToDictionary(){if(this.mAddedWordStack.length){var word=this.mAddedWordStack.pop();if(this.mRemote){this.mRemote.undoAddToDictionary(word);}else{this.mInlineSpellChecker.removeWordFromDictionary(word);}}},canUndo(){ return!!this.mAddedWordStack.length;},ignoreWord(){if(this.mRemote){this.mRemote.ignoreWord();}else{this.mInlineSpellChecker.ignoreWord(this.mMisspelling);}},};var SpellCheckHelper={EDITABLE:0x1,INPUT:0x2,TEXTAREA:0x4,TEXTINPUT:0x8,KEYWORD:0x10,
CONTENTEDITABLE:0x20,NUMERIC:0x40,PASSWORD:0x80,
SPELLCHECKABLE:0x100,isTargetAKeywordField(aNode,window){if(!(aNode instanceof window.HTMLInputElement)){return false;}
var form=aNode.form;if(!form||aNode.type=="password"){return false;}
var method=form.method.toUpperCase();





 
return(method=="GET"||method==""||(form.enctype!="text/plain"&&form.enctype!="multipart/form-data"));},getComputedStyle(aElem,aProp){return aElem.ownerGlobal.getComputedStyle(aElem).getPropertyValue(aProp);},isEditable(element,window){var flags=0;if(element instanceof window.HTMLInputElement){flags|=this.INPUT;if(element.mozIsTextField(false)||element.type=="number"){flags|=this.TEXTINPUT;if(!element.readOnly){flags|=this.EDITABLE;}
if(element.type=="number"){flags|=this.NUMERIC;}
if(!element.readOnly&&(element.type=="text"||element.type=="search")){flags|=this.SPELLCHECKABLE;}
if(this.isTargetAKeywordField(element,window)){flags|=this.KEYWORD;}
if(element.type=="password"){flags|=this.PASSWORD;}}}else if(element instanceof window.HTMLTextAreaElement){flags|=this.TEXTINPUT|this.TEXTAREA;if(!element.readOnly){flags|=this.SPELLCHECKABLE|this.EDITABLE;}}
if(!(flags&this.SPELLCHECKABLE)){var win=element.ownerGlobal;if(win){var isSpellcheckable=false;try{var editingSession=win.docShell.editingSession;if(editingSession.windowIsEditable(win)&&this.getComputedStyle(element,"-moz-user-modify")=="read-write"){isSpellcheckable=true;}}catch(ex){}
if(isSpellcheckable){flags|=this.CONTENTEDITABLE|this.SPELLCHECKABLE;}}}
return flags;},};function RemoteSpellChecker(aSpellInfo,aWindowGlobalParent){this._spellInfo=aSpellInfo;this._suggestionGenerator=null;this._actor=aWindowGlobalParent.getActor("InlineSpellChecker");this._actor.registerDestructionObserver(this);}
RemoteSpellChecker.prototype={get canSpellCheck(){return this._spellInfo.canSpellCheck;},get spellCheckPending(){return this._spellInfo.initialSpellCheckPending;},get overMisspelling(){return this._spellInfo.overMisspelling;},get enableRealTimeSpell(){return this._spellInfo.enableRealTimeSpell;},GetSuggestedWord(){if(!this._suggestionGenerator){this._suggestionGenerator=(function*(spellInfo){for(let i of spellInfo.spellSuggestions){yield i;}})(this._spellInfo);}
let next=this._suggestionGenerator.next();if(next.done){this._suggestionGenerator=null;return"";}
return next.value;},get currentDictionary(){return this._spellInfo.currentDictionary;},get dictionaryList(){return this._spellInfo.dictionaryList.slice();},selectDictionary(localeCode){this._actor.selectDictionary({localeCode});},replaceMisspelling(index){this._actor.replaceMisspelling({index});},toggleEnabled(){this._actor.toggleEnabled();},addToDictionary(){




let dictionary=Cc["@mozilla.org/spellchecker/personaldictionary;1"].getService(Ci.mozIPersonalDictionary);dictionary.addWord(this._spellInfo.misspelling);this._actor.recheckSpelling();},undoAddToDictionary(word){let dictionary=Cc["@mozilla.org/spellchecker/personaldictionary;1"].getService(Ci.mozIPersonalDictionary);dictionary.removeWord(word);this._actor.recheckSpelling();},ignoreWord(){let dictionary=Cc["@mozilla.org/spellchecker/personaldictionary;1"].getService(Ci.mozIPersonalDictionary);dictionary.ignoreWord(this._spellInfo.misspelling);this._actor.recheckSpelling();},uninit(){if(this._actor){this._actor.uninit();this._actor.unregisterDestructionObserver(this);}},actorDestroyed(){
this._actor=null;},};