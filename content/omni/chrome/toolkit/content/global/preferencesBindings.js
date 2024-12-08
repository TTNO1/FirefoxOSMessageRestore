"use strict";
const Preferences=(window.Preferences=(function(){const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const lazy={};ChromeUtils.defineModuleGetter(lazy,"DeferredTask","resource://gre/modules/DeferredTask.jsm");function getElementsByAttribute(name,value){
return value?document.querySelectorAll(`[${name}="${value}"]`):document.querySelectorAll(`[${name}]`);}
const domContentLoadedPromise=new Promise(resolve=>{window.addEventListener("DOMContentLoaded",resolve,{capture:true,once:true,});});const Preferences={_all:{},_add(prefInfo){if(this._all[prefInfo.id]){throw new Error(`preference with id '${prefInfo.id}' already added`);}
const pref=new Preference(prefInfo);this._all[pref.id]=pref;domContentLoadedPromise.then(()=>{pref.updateElements();});return pref;},add(prefInfo){const pref=this._add(prefInfo);return pref;},addAll(prefInfos){prefInfos.map(prefInfo=>this._add(prefInfo));},get(id){return this._all[id]||null;},getAll(){return Object.values(this._all);},defaultBranch:Services.prefs.getDefaultBranch(""),get type(){return document.documentElement.getAttribute("type")||"";},get instantApply(){if(this._instantApplyForceEnabled){return true;}
if(this.type==="child"){return false;}




return Services.prefs.getBoolPref("browser.preferences.instantApply");},_instantApplyForceEnabled:false,forceEnableInstantApply(){this._instantApplyForceEnabled=true;},observe(subject,topic,data){const pref=this._all[data];if(pref){pref.value=pref.valueFromPreferences;}},onDOMContentLoaded(){



const elements=getElementsByAttribute("preference");for(const element of elements){const id=element.getAttribute("preference");const pref=this.get(id);if(!pref){console.error(`Missing preference for ID ${id}`);}}},updateQueued:false,updateAllElements(){if(this.updateQueued){return;}
this.updateQueued=true;Promise.resolve().then(()=>{const preferences=Preferences.getAll();for(const preference of preferences){preference.updateElements();}
this.updateQueued=false;});},onUnload(){Services.prefs.removeObserver("",this);},QueryInterface:ChromeUtils.generateQI(["nsITimerCallback","nsIObserver"]),_deferredValueUpdateElements:new Set(),writePreferences(aFlushToDisk){if(this._deferredValueUpdateElements.size){this._finalizeDeferredElements();}
const preferences=Preferences.getAll();for(const preference of preferences){preference.batching=true;preference.valueFromPreferences=preference.value;preference.batching=false;}
if(aFlushToDisk){Services.prefs.savePrefFile(null);}},getPreferenceElement(aStartElement){let temp=aStartElement;while(temp&&temp.nodeType==Node.ELEMENT_NODE&&!temp.hasAttribute("preference")){temp=temp.parentNode;}
return temp&&temp.nodeType==Node.ELEMENT_NODE?temp:aStartElement;},_deferredValueUpdate(aElement){delete aElement._deferredValueUpdateTask;const prefID=aElement.getAttribute("preference");const preference=Preferences.get(prefID);const prefVal=preference.getElementValue(aElement);preference.value=prefVal;this._deferredValueUpdateElements.delete(aElement);},_finalizeDeferredElements(){for(const el of this._deferredValueUpdateElements){if(el._deferredValueUpdateTask){el._deferredValueUpdateTask.finalize();}}},userChangedValue(aElement){const element=this.getPreferenceElement(aElement);if(element.hasAttribute("preference")){if(element.getAttribute("delayprefsave")!="true"){const preference=Preferences.get(element.getAttribute("preference"));const prefVal=preference.getElementValue(element);preference.value=prefVal;}else{if(!element._deferredValueUpdateTask){element._deferredValueUpdateTask=new lazy.DeferredTask(this._deferredValueUpdate.bind(this,element),1000);this._deferredValueUpdateElements.add(element);}else{element._deferredValueUpdateTask.disarm();}
element._deferredValueUpdateTask.arm();}}},onCommand(event){
if(event.sourceEvent){event=event.sourceEvent;}
this.userChangedValue(event.target);},onChange(event){
this.userChangedValue(event.target);},onInput(event){
this.userChangedValue(event.target);},_fireEvent(aEventName,aTarget){try{const event=new CustomEvent(aEventName,{bubbles:true,cancelable:true,});return aTarget.dispatchEvent(event);}catch(e){Cu.reportError(e);}
return false;},onDialogAccept(event){let dialog=document.querySelector("dialog");if(!this._fireEvent("beforeaccept",dialog)){event.preventDefault();return false;}
this.writePreferences(true);return true;},close(event){if(Preferences.instantApply){window.close();}
event.stopPropagation();event.preventDefault();},handleEvent(event){switch(event.type){case"change":return this.onChange(event);case"command":return this.onCommand(event);case"dialogaccept":return this.onDialogAccept(event);case"input":return this.onInput(event);case"unload":return this.onUnload(event);default:return undefined;}},_syncFromPrefListeners:new WeakMap(),_syncToPrefListeners:new WeakMap(),addSyncFromPrefListener(aElement,callback){this._syncFromPrefListeners.set(aElement,callback);let elementPref=aElement.getAttribute("preference");if(elementPref){let pref=this.get(elementPref);if(pref){pref.updateElements();}}},addSyncToPrefListener(aElement,callback){this._syncToPrefListeners.set(aElement,callback);let elementPref=aElement.getAttribute("preference");if(elementPref){let pref=this.get(elementPref);if(pref){pref.updateElements();}}},removeSyncFromPrefListener(aElement){this._syncFromPrefListeners.delete(aElement);},removeSyncToPrefListener(aElement){this._syncToPrefListeners.delete(aElement);},};Services.prefs.addObserver("",Preferences);domContentLoadedPromise.then(result=>Preferences.onDOMContentLoaded(result));window.addEventListener("change",Preferences);window.addEventListener("command",Preferences);window.addEventListener("dialogaccept",Preferences);window.addEventListener("input",Preferences);window.addEventListener("select",Preferences);window.addEventListener("unload",Preferences,{once:true});class Preference extends EventEmitter{constructor({id,type,inverted}){super();this.on("change",this.onChange.bind(this));this._value=null;this.readonly=false;this._useDefault=false;this.batching=false;this.id=id;this.type=type;this.inverted=!!inverted;

if(Preferences.type=="child"&&window.opener&&window.opener.Preferences&&window.opener.document.nodePrincipal.isSystemPrincipal){const preference=window.opener.Preferences.get(this.id);
this._value=preference?preference.value:this.valueFromPreferences;}else{this._value=this.valueFromPreferences;}}
reset(){ this.value=undefined;}
_reportUnknownType(){const msg=`Preference with id=${this.id} has unknown type ${this.type}.`;Services.console.logStringMessage(msg);}
setElementValue(aElement){if(this.locked){aElement.disabled=true;}
if(!this.isElementEditable(aElement)){return;}
let rv=undefined;if(Preferences._syncFromPrefListeners.has(aElement)){rv=Preferences._syncFromPrefListeners.get(aElement)(aElement);}
let val=rv;if(val===undefined){val=Preferences.instantApply?this.valueFromPreferences:this.value;} 
if(val===undefined){val=this.defaultValue;}
function setValue(element,attribute,value){if(attribute in element){element[attribute]=value;}else if(attribute==="checked"){
if(value){
element.setAttribute(attribute,"true");}else{element.removeAttribute(attribute);}}else{element.setAttribute(attribute,value);}}
if(aElement.localName=="checkbox"){setValue(aElement,"checked",val);}else{setValue(aElement,"value",val);}}
getElementValue(aElement){if(Preferences._syncToPrefListeners.has(aElement)){try{const rv=Preferences._syncToPrefListeners.get(aElement)(aElement);if(rv!==undefined){return rv;}}catch(e){Cu.reportError(e);}}
function getValue(element,attribute){if(attribute in element){return element[attribute];}
return element.getAttribute(attribute);}
let value;if(aElement.localName=="checkbox"){value=getValue(aElement,"checked");}else{value=getValue(aElement,"value");}
switch(this.type){case"int":return parseInt(value,10)||0;case"bool":return typeof value=="boolean"?value:value=="true";}
return value;}
isElementEditable(aElement){switch(aElement.localName){case"checkbox":case"input":case"radiogroup":case"textarea":case"menulist":return true;}
return false;}
updateElements(){if(!this.id){return;}

const elements=getElementsByAttribute("preference",this.id);for(const element of elements){this.setElementValue(element);}}
onChange(){this.updateElements();}
get value(){return this._value;}
set value(val){if(this.value!==val){this._value=val;if(Preferences.instantApply){this.valueFromPreferences=val;}
this.emit("change");}
return val;}
get locked(){return Services.prefs.prefIsLocked(this.id);}
updateControlDisabledState(val){if(!this.id){return;}
val=val||this.locked;const elements=getElementsByAttribute("preference",this.id);for(const element of elements){element.disabled=val;const labels=getElementsByAttribute("control",element.id);for(const label of labels){label.disabled=val;}}}
get hasUserValue(){return(Services.prefs.prefHasUserValue(this.id)&&this.value!==undefined);}
get defaultValue(){this._useDefault=true;const val=this.valueFromPreferences;this._useDefault=false;return val;}
get _branch(){return this._useDefault?Preferences.defaultBranch:Services.prefs;}
get valueFromPreferences(){try{switch(this.type){case"int":return this._branch.getIntPref(this.id);case"bool":{const val=this._branch.getBoolPref(this.id);return this.inverted?!val:val;}
case"wstring":return this._branch.getComplexValue(this.id,Ci.nsIPrefLocalizedString).data;case"string":case"unichar":return this._branch.getStringPref(this.id);case"fontname":{const family=this._branch.getStringPref(this.id);const fontEnumerator=Cc["@mozilla.org/gfx/fontenumerator;1"].createInstance(Ci.nsIFontEnumerator);return fontEnumerator.getStandardFamilyName(family);}
case"file":{const f=this._branch.getComplexValue(this.id,Ci.nsIFile);return f;}
default:this._reportUnknownType();}}catch(e){}
return null;}
set valueFromPreferences(val){if(this.readonly||this.valueFromPreferences==val){return val;}
if(val===undefined){Services.prefs.clearUserPref(this.id);return val;}
switch(this.type){case"int":Services.prefs.setIntPref(this.id,val);break;case"bool":Services.prefs.setBoolPref(this.id,this.inverted?!val:val);break;case"wstring":{const pls=Cc["@mozilla.org/pref-localizedstring;1"].createInstance(Ci.nsIPrefLocalizedString);pls.data=val;Services.prefs.setComplexValue(this.id,Ci.nsIPrefLocalizedString,pls);break;}
case"string":case"unichar":case"fontname":Services.prefs.setStringPref(this.id,val);break;case"file":{let lf;if(typeof val=="string"){lf=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);lf.persistentDescriptor=val;if(!lf.exists()){lf.initWithPath(val);}}else{lf=val.QueryInterface(Ci.nsIFile);}
Services.prefs.setComplexValue(this.id,Ci.nsIFile,lf);break;}
default:this._reportUnknownType();}
if(!this.batching){Services.prefs.savePrefFile(null);}
return val;}}
return Preferences;})());