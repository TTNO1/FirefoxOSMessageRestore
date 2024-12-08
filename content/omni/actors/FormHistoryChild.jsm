"use strict";var EXPORTED_SYMBOLS=["FormHistoryChild"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"CreditCard","resource://gre/modules/CreditCard.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"gDebug","browser.formfill.debug");XPCOMUtils.defineLazyPreferenceGetter(this,"gEnabled","browser.formfill.enable");function log(message){if(!gDebug){return;}
dump("satchelFormListener: "+message+"\n");Services.console.logStringMessage("satchelFormListener: "+message);}
class FormHistoryChild extends JSWindowActorChild{handleEvent(event){switch(event.type){case"DOMFormBeforeSubmit":{this.onDOMFormBeforeSubmit(event);break;}
default:{throw new Error("Unexpected event");}}}
onDOMFormBeforeSubmit(event){let form=event.target;if(!gEnabled||PrivateBrowsingUtils.isContentWindowPrivate(form.ownerGlobal)){return;}
log("Form submit observer notified.");if(form.hasAttribute("autocomplete")&&form.getAttribute("autocomplete").toLowerCase()=="off"){return;}
let entries=[];for(let input of form.elements){if(ChromeUtils.getClassName(input)!=="HTMLInputElement"){continue;}
if(!input.mozIsTextField(true)){continue;}

if(input.hasBeenTypePassword){continue;}
let autocompleteInfo=input.getAutocompleteInfo();if(autocompleteInfo&&!autocompleteInfo.canAutomaticallyPersist){continue;}
let value=input.value.trim();if(!value||value==input.defaultValue.trim()){continue;}
if(CreditCard.isValidNumber(value)){log("skipping saving a credit card number");continue;}
let name=input.name||input.id;if(!name){continue;}
if(name=="searchbar-history"){log('addEntry for input name "'+name+'" is denied');continue;}
if(name.length>200||value.length>200){log("skipping input that has a name/value too large");continue;}
if(entries.length>=100){log("not saving any more entries for this form.");break;}
entries.push({name,value});}
if(entries.length){log("sending entries to parent process for form "+form.id);this.sendAsyncMessage("FormHistory:FormSubmitEntries",entries);}}}