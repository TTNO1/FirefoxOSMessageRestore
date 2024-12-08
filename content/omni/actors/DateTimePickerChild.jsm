const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"BrowserUtils","resource://gre/modules/BrowserUtils.jsm");var EXPORTED_SYMBOLS=["DateTimePickerChild"];class DateTimePickerChild extends JSWindowActorChild{constructor(){super();this._inputElement=null;}
close(){this.removeListeners(this._inputElement);let dateTimeBoxElement=this._inputElement.dateTimeBoxElement;if(!dateTimeBoxElement){this._inputElement=null;return;}
if(this._inputElement.openOrClosedShadowRoot){let win=this._inputElement.ownerGlobal;dateTimeBoxElement.dispatchEvent(new win.CustomEvent("MozSetDateTimePickerState",{detail:false}));}
this._inputElement=null;}
addListeners(aElement){aElement.ownerGlobal.addEventListener("pagehide",this);}
removeListeners(aElement){aElement.ownerGlobal.removeEventListener("pagehide",this);}
getComputedDirection(aElement){return aElement.ownerGlobal.getComputedStyle(aElement).getPropertyValue("direction");}
getBoundingContentRect(aElement){return BrowserUtils.getElementBoundingScreenRect(aElement);}
getTimePickerPref(){return Services.prefs.getBoolPref("dom.forms.datetime.timepicker");}
receiveMessage(aMessage){switch(aMessage.name){case"FormDateTime:PickerClosed":{this.close();break;}
case"FormDateTime:PickerValueChanged":{if(!this._inputElement){return;}
let dateTimeBoxElement=this._inputElement.dateTimeBoxElement;if(!dateTimeBoxElement){return;}
let win=this._inputElement.ownerGlobal;if(this._inputElement.openOrClosedShadowRoot){dateTimeBoxElement.dispatchEvent(new win.CustomEvent("MozPickerValueChanged",{detail:Cu.cloneInto(aMessage.data,win),}));}
break;}
default:break;}}
handleEvent(aEvent){switch(aEvent.type){case"MozOpenDateTimePicker":{ if(!(aEvent.originalTarget instanceof
aEvent.originalTarget.ownerGlobal.HTMLInputElement)||(aEvent.originalTarget.type=="time"&&!this.getTimePickerPref())){return;}
if(this._inputElement){

return;}
this._inputElement=aEvent.originalTarget;let dateTimeBoxElement=this._inputElement.dateTimeBoxElement;if(!dateTimeBoxElement){throw new Error("How do we get this event without a UA Widget or XBL binding?");}
if(this._inputElement.openOrClosedShadowRoot){
let win=this._inputElement.ownerGlobal;dateTimeBoxElement.dispatchEvent(new win.CustomEvent("MozSetDateTimePickerState",{detail:true}));}
this.addListeners(this._inputElement);let value=this._inputElement.getDateTimeInputBoxValue();this.sendAsyncMessage("FormDateTime:OpenPicker",{rect:this.getBoundingContentRect(this._inputElement),dir:this.getComputedDirection(this._inputElement),type:this._inputElement.type,detail:{
value:Object.keys(value).length?value:this._inputElement.value,min:this._inputElement.getMinimum(),max:this._inputElement.getMaximum(),step:this._inputElement.getStep(),stepBase:this._inputElement.getStepBase(),},});break;}
case"MozUpdateDateTimePicker":{let value=this._inputElement.getDateTimeInputBoxValue();value.type=this._inputElement.type;this.sendAsyncMessage("FormDateTime:UpdatePicker",{value});break;}
case"MozCloseDateTimePicker":{this.sendAsyncMessage("FormDateTime:ClosePicker",{});this.close();break;}
case"pagehide":{if(this._inputElement&&this._inputElement.ownerDocument==aEvent.target){this.sendAsyncMessage("FormDateTime:ClosePicker",{});this.close();}
break;}
default:break;}}}