"use strict";var EXPORTED_SYMBOLS=["FindBarChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"BrowserUtils","resource://gre/modules/BrowserUtils.jsm");class FindBarChild extends JSWindowActorChild{constructor(){super();this._findKey=null;XPCOMUtils.defineLazyProxy(this,"FindBarContent",()=>{let tmp={};ChromeUtils.import("resource://gre/modules/FindBarContent.jsm",tmp);return new tmp.FindBarContent(this);},{inQuickFind:false,inPassThrough:false});}
receiveMessage(msg){if(msg.name=="Findbar:UpdateState"){let{FindBarContent}=this;FindBarContent.updateState(msg.data);}}
eventMatchesFindShortcut(aEvent){if(!this._findKey){this._findKey=Services.cpmm.sharedData.get("Findbar:Shortcut");if(!this._findKey){return false;}}
for(let k in this._findKey){if(this._findKey[k]!=aEvent[k]){return false;}}
return true;}
handleEvent(event){if(event.type=="keypress"){this.onKeypress(event);}}
onKeypress(event){let{FindBarContent}=this;if(!FindBarContent.inPassThrough&&this.eventMatchesFindShortcut(event)){return FindBarContent.start(event);}
let location=this.document.location.href;if(location=="about:blank"){return null;}
if(event.ctrlKey||event.altKey||event.metaKey||event.defaultPrevented||!BrowserUtils.mimeTypeIsTextBased(this.document.contentType)||!BrowserUtils.canFindInPage(location)){return null;}
if(FindBarContent.inPassThrough||FindBarContent.inQuickFind){return FindBarContent.onKeypress(event);}
if(event.charCode&&this.shouldFastFind(event.target)){let key=String.fromCharCode(event.charCode);if((key=="/"||key=="'")&&FindBarChild.manualFAYT){return FindBarContent.startQuickFind(event);}
if(key!=" "&&FindBarChild.findAsYouType){return FindBarContent.startQuickFind(event,true);}}
return null;}
shouldFastFind(elt){if(elt){let win=elt.ownerGlobal;if(elt instanceof win.HTMLInputElement&&elt.mozIsTextField(false)){return false;}
if(elt.isContentEditable||win.document.designMode=="on"){return false;}
if(elt instanceof win.HTMLTextAreaElement||elt instanceof win.HTMLSelectElement||elt instanceof win.HTMLObjectElement||elt instanceof win.HTMLEmbedElement){return false;}
if(elt instanceof win.HTMLIFrameElement&&elt.mozbrowser){
return false;}}
return true;}}
XPCOMUtils.defineLazyPreferenceGetter(FindBarChild,"findAsYouType","accessibility.typeaheadfind");XPCOMUtils.defineLazyPreferenceGetter(FindBarChild,"manualFAYT","accessibility.typeaheadfind.manual");