//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------



"use strict";var EXPORTED_SYMBOLS=["FindBarContent"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const FIND_NORMAL=0;const FIND_TYPEAHEAD=1;const FIND_LINKS=2;class FindBarContent{constructor(actor){this.actor=actor;this.findMode=0;this.inQuickFind=false;this.addedEventListener=false;}
start(event){this.inPassThrough=true;}
startQuickFind(event,autostart=false){if(!this.addedEventListener){this.addedEventListener=true;Services.els.addSystemEventListener(this.actor.document.defaultView,"mouseup",this,false);}
let mode=FIND_TYPEAHEAD;if(event.charCode=="'".charAt(0)||(autostart&&FindBarContent.typeAheadLinksOnly)){mode=FIND_LINKS;}
this.findMode=mode;this.passKeyToParent(event);}
updateState(data){this.findMode=data.findMode;this.inQuickFind=data.hasQuickFindTimeout;if(data.isOpenAndFocused){this.inPassThrough=false;}}
handleEvent(event){switch(event.type){case"keypress":this.onKeypress(event);break;case"mouseup":this.onMouseup(event);break;}}
onKeypress(event){if(this.inPassThrough){this.passKeyToParent(event);}else if(this.findMode!=FIND_NORMAL&&this.inQuickFind&&event.charCode){this.passKeyToParent(event);}}
passKeyToParent(event){event.preventDefault();
const kRequiredProps=["type","bubbles","cancelable","ctrlKey","altKey","shiftKey","metaKey","keyCode","charCode",];let fakeEvent={};for(let prop of kRequiredProps){fakeEvent[prop]=event[prop];}
this.actor.sendAsyncMessage("Findbar:Keypress",fakeEvent);}
onMouseup(event){if(this.findMode!=FIND_NORMAL){this.actor.sendAsyncMessage("Findbar:Mouseup",{});}}}
XPCOMUtils.defineLazyPreferenceGetter(FindBarContent,"typeAheadLinksOnly","accessibility.typeaheadfind.linksonly");