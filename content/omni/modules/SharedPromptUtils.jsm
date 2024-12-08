//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["PromptUtils","EnableDelayHelper"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var PromptUtils={




fireDialogEvent(domWin,eventName,maybeTarget,detail){let target=maybeTarget||domWin;let eventOptions={cancelable:true,bubbles:true};if(detail){eventOptions.detail=detail;}
let event=new domWin.CustomEvent(eventName,eventOptions);let winUtils=domWin.windowUtils;winUtils.dispatchEventToChromeOnly(target,event);},objectToPropBag(obj){let bag=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);bag.QueryInterface(Ci.nsIWritablePropertyBag);for(let propName in obj){bag.setProperty(propName,obj[propName]);}
return bag;},propBagToObject(propBag,obj){


for(let propName in obj){obj[propName]=propBag.getProperty(propName);}},};var EnableDelayHelper=function({enableDialog,disableDialog,focusTarget}){this.enableDialog=makeSafe(enableDialog);this.disableDialog=makeSafe(disableDialog);this.focusTarget=focusTarget;this.disableDialog();this.focusTarget.addEventListener("blur",this);this.focusTarget.addEventListener("focus",this);this.focusTarget.addEventListener("keyup",this,true);this.focusTarget.addEventListener("keydown",this,true);this.focusTarget.document.addEventListener("unload",this);this.startOnFocusDelay();};EnableDelayHelper.prototype={get delayTime(){return Services.prefs.getIntPref("security.dialog_enable_delay");},handleEvent(event){if(!event.type.startsWith("key")&&event.target!=this.focusTarget&&event.target!=this.focusTarget.document){return;}
switch(event.type){case"keyup":
this.focusTarget.removeEventListener("keyup",this,true);this.focusTarget.removeEventListener("keydown",this,true);break;case"keydown":if(this._focusTimer){this._focusTimer.cancel();this._focusTimer=null;this.startOnFocusDelay();event.preventDefault();}
break;case"blur":this.onBlur();break;case"focus":this.onFocus();break;case"unload":this.onUnload();break;}},onBlur(){this.disableDialog();
if(this._focusTimer){this._focusTimer.cancel();this._focusTimer=null;}},onFocus(){this.startOnFocusDelay();},onUnload(){this.focusTarget.removeEventListener("blur",this);this.focusTarget.removeEventListener("focus",this);this.focusTarget.removeEventListener("keyup",this,true);this.focusTarget.removeEventListener("keydown",this,true);this.focusTarget.document.removeEventListener("unload",this);if(this._focusTimer){this._focusTimer.cancel();this._focusTimer=null;}
this.focusTarget=this.enableDialog=this.disableDialog=null;},startOnFocusDelay(){if(this._focusTimer){return;}
this._focusTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this._focusTimer.initWithCallback(()=>{this.onFocusTimeout();},this.delayTime,Ci.nsITimer.TYPE_ONE_SHOT);},onFocusTimeout(){this._focusTimer=null;this.enableDialog();},};function makeSafe(fn){return function(){try{fn();}catch(e){}};}