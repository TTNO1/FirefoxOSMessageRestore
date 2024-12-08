var EXPORTED_SYMBOLS=["AutoCompleteChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"BrowserUtils","resource://gre/modules/BrowserUtils.jsm");ChromeUtils.defineModuleGetter(this,"ContentDOMReference","resource://gre/modules/ContentDOMReference.jsm");ChromeUtils.defineModuleGetter(this,"LoginHelper","resource://gre/modules/LoginHelper.jsm");let autoCompleteListeners=new Set();class AutoCompleteChild extends JSWindowActorChild{constructor(){super();this._input=null;this._popupOpen=false;}
static addPopupStateListener(listener){autoCompleteListeners.add(listener);}
static removePopupStateListener(listener){autoCompleteListeners.delete(listener);}
receiveMessage(message){switch(message.name){case"FormAutoComplete:HandleEnter":{this.selectedIndex=message.data.selectedIndex;let controller=Cc["@mozilla.org/autocomplete/controller;1"].getService(Ci.nsIAutoCompleteController);controller.handleEnter(message.data.isPopupSelection);break;}
case"FormAutoComplete:PopupClosed":{this._popupOpen=false;this.notifyListeners(message.name,message.data);break;}
case"FormAutoComplete:PopupOpened":{this._popupOpen=true;this.notifyListeners(message.name,message.data);break;}
case"FormAutoComplete:Focus":{




break;}}}
notifyListeners(messageName,data){for(let listener of autoCompleteListeners){try{listener.popupStateChanged(messageName,data,this.contentWindow);}catch(ex){Cu.reportError(ex);}}}
get input(){return this._input;}
set selectedIndex(index){this.sendAsyncMessage("FormAutoComplete:SetSelectedIndex",{index});}
get selectedIndex(){



let selectedIndexResult=Services.cpmm.sendSyncMessage("FormAutoComplete:GetSelectedIndex",{browsingContext:this.browsingContext,});if(selectedIndexResult.length!=1||!Number.isInteger(selectedIndexResult[0])){throw new Error("Invalid autocomplete selectedIndex");}
return selectedIndexResult[0];}
get popupOpen(){return this._popupOpen;}
openAutocompletePopup(input,element){if(this._popupOpen||!input){return;}
let rect=BrowserUtils.getElementBoundingScreenRect(element);let window=element.ownerGlobal;let dir=window.getComputedStyle(element).direction;let results=this.getResultsFromController(input);let formOrigin=LoginHelper.getLoginOrigin(element.ownerDocument.documentURI);let inputElementIdentifier=ContentDOMReference.get(element);this.sendAsyncMessage("FormAutoComplete:MaybeOpenPopup",{results,rect,dir,inputElementIdentifier,formOrigin,});this._input=input;}
closePopup(){


this._popupOpen=false;this.sendAsyncMessage("FormAutoComplete:ClosePopup",{});}
invalidate(){if(this._popupOpen){let results=this.getResultsFromController(this._input);this.sendAsyncMessage("FormAutoComplete:Invalidate",{results});}}
selectBy(reverse,page){Services.cpmm.sendSyncMessage("FormAutoComplete:SelectBy",{browsingContext:this.browsingContext,reverse,page,});}
getResultsFromController(inputField){let results=[];if(!inputField){return results;}
let controller=inputField.controller;if(!(controller instanceof Ci.nsIAutoCompleteController)){return results;}
for(let i=0;i<controller.matchCount;++i){let result={};result.value=controller.getValueAt(i);result.label=controller.getLabelAt(i);result.comment=controller.getCommentAt(i);result.style=controller.getStyleAt(i);result.image=controller.getImageAt(i);results.push(result);}
return results;}}
AutoCompleteChild.prototype.QueryInterface=ChromeUtils.generateQI(["nsIAutoCompletePopup",]);