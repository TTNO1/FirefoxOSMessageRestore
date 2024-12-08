"use strict";const EXPORTED_SYMBOLS=["accessibility"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{error:"chrome://marionette/content/error.js",Log:"chrome://marionette/content/log.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());XPCOMUtils.defineLazyGetter(this,"service",()=>{try{return Cc["@mozilla.org/accessibilityService;1"].getService(Ci.nsIAccessibilityService);}catch(e){logger.warn("Accessibility module is not present");return undefined;}});this.accessibility={get service(){return service;},};accessibility.State={get Unavailable(){return Ci.nsIAccessibleStates.STATE_UNAVAILABLE;},get Focusable(){return Ci.nsIAccessibleStates.STATE_FOCUSABLE;},get Selectable(){return Ci.nsIAccessibleStates.STATE_SELECTABLE;},get Selected(){return Ci.nsIAccessibleStates.STATE_SELECTED;},};accessibility.ActionableRoles=new Set(["checkbutton","check menu item","check rich option","combobox","combobox option","entry","key","link","listbox option","listbox rich option","menuitem","option","outlineitem","pagetab","pushbutton","radiobutton","radio menu item","rowheader","slider","spinbutton","switch",]);accessibility.get=function(strict=false){return new accessibility.Checks(!!strict);};accessibility.Checks=class{constructor(strict){this.strict=strict;}
getAccessible(element,mustHaveAccessible=false){if(!this.strict){return Promise.resolve();}
return new Promise((resolve,reject)=>{if(!accessibility.service){reject();return;}
let docAcc=accessibility.service.getAccessibleFor(element.ownerDocument);let state={};docAcc.getState(state,{});if((state.value&Ci.nsIAccessibleStates.STATE_BUSY)==0){let acc=accessibility.service.getAccessibleFor(element);if(mustHaveAccessible&&!acc){reject();}else{resolve(acc);}
return;}
let eventObserver={observe(subject,topic){if(topic!=="accessible-event"){return;}
let event=subject.QueryInterface(Ci.nsIAccessibleEvent);if(event.eventType!==Ci.nsIAccessibleEvent.EVENT_STATE_CHANGE){return;}
if(event.accessible!==docAcc){return;}
Services.obs.removeObserver(this,"accessible-event");let acc=accessibility.service.getAccessibleFor(element);if(mustHaveAccessible&&!acc){reject();}else{resolve(acc);}},};Services.obs.addObserver(eventObserver,"accessible-event");}).catch(()=>this.error("Element does not have an accessible object",element));}
isActionableRole(accessible){return accessibility.ActionableRoles.has(accessibility.service.getStringRole(accessible.role));}
hasActionCount(accessible){return accessible.actionCount>0;}
hasValidName(accessible){return accessible.name&&accessible.name.trim();}
hasHiddenAttribute(accessible){let hidden=false;try{hidden=accessible.attributes.getStringProperty("hidden");}catch(e){} 
return hidden&&hidden==="true";}
matchState(accessible,stateToMatch){let state={};accessible.getState(state,{});return!!(state.value&stateToMatch);}
isHidden(accessible){if(!accessible){return true;}
while(accessible){if(this.hasHiddenAttribute(accessible)){return true;}
accessible=accessible.parent;}
return false;}
assertVisible(accessible,element,visible){let hiddenAccessibility=this.isHidden(accessible);let message;if(visible&&hiddenAccessibility){message="Element is not currently visible via the accessibility API "+"and may not be manipulated by it";}else if(!visible&&!hiddenAccessibility){message="Element is currently only visible via the accessibility API "+"and can be manipulated by it";}
this.error(message,element);}
assertEnabled(accessible,element,enabled){if(!accessible){return;}
let win=element.ownerGlobal;let disabledAccessibility=this.matchState(accessible,accessibility.State.Unavailable);let explorable=win.getComputedStyle(element).getPropertyValue("pointer-events")!=="none";let message;if(!explorable&&!disabledAccessibility){message="Element is enabled but is not explorable via the "+"accessibility API";}else if(enabled&&disabledAccessibility){message="Element is enabled but disabled via the accessibility API";}else if(!enabled&&!disabledAccessibility){message="Element is disabled but enabled via the accessibility API";}
this.error(message,element);}
assertActionable(accessible,element){if(!accessible){return;}
let message;if(!this.hasActionCount(accessible)){message="Element does not support any accessible actions";}else if(!this.isActionableRole(accessible)){message="Element does not have a correct accessibility role "+"and may not be manipulated via the accessibility API";}else if(!this.hasValidName(accessible)){message="Element is missing an accessible name";}else if(!this.matchState(accessible,accessibility.State.Focusable)){message="Element is not focusable via the accessibility API";}
this.error(message,element);}
assertSelected(accessible,element,selected){if(!accessible){return;} 
if(!this.matchState(accessible,accessibility.State.Selectable)){return;}
let selectedAccessibility=this.matchState(accessible,accessibility.State.Selected);let message;if(selected&&!selectedAccessibility){message="Element is selected but not selected via the accessibility API";}else if(!selected&&selectedAccessibility){message="Element is not selected but selected via the accessibility API";}
this.error(message,element);}
error(message,element){if(!message||!this.strict){return;}
if(element){let{id,tagName,className}=element;message+=`: id: ${id}, tagName: ${tagName}, className: ${className}`;}
throw new error.ElementNotAccessibleError(message);}};