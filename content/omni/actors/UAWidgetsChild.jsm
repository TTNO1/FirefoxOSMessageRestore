"use strict";var EXPORTED_SYMBOLS=["UAWidgetsChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");class UAWidgetsChild extends JSWindowActorChild{constructor(){super();this.widgets=new WeakMap();this.prefsCache=new Map();this.observedPrefs=[];

this.observerFunction=(subject,topic,data)=>{this.observe(subject,topic,data);};}
didDestroy(){for(let pref in this.observedPrefs){Services.prefs.removeObserver(pref,this.observerFunction);}}
unwrap(obj){return Cu.isXrayWrapper(obj)?obj.wrappedJSObject:obj;}
handleEvent(aEvent){switch(aEvent.type){case"UAWidgetSetupOrChange":this.setupOrNotifyWidget(aEvent.target);break;case"UAWidgetTeardown":this.teardownWidget(aEvent.target);break;}}
setupOrNotifyWidget(aElement){if(!this.widgets.has(aElement)){this.setupWidget(aElement);return;}
let{widget}=this.widgets.get(aElement);if(typeof widget.onchange=="function"){if(this.unwrap(aElement.openOrClosedShadowRoot)!=this.unwrap(widget.shadowRoot)){Cu.reportError("Getting a UAWidgetSetupOrChange event without the ShadowRoot. "+"Torn down already?");return;}
try{widget.onchange();}catch(ex){Cu.reportError(ex);}}}
setupWidget(aElement){let uri;let widgetName;




let prefKeys=[];switch(aElement.localName){case"video":case"audio":uri="chrome://global/content/elements/videocontrols.js";widgetName="VideoControlsWidget";prefKeys=["media.videocontrols.picture-in-picture.video-toggle.enabled","media.videocontrols.picture-in-picture.video-toggle.always-show","media.videocontrols.picture-in-picture.video-toggle.min-video-secs","media.videocontrols.picture-in-picture.video-toggle.position","media.videocontrols.picture-in-picture.video-toggle.has-used","media.videocontrols.keyboard-enter-to-toggle-pause","media.videocontrols.volume-control-override",];break;case"input":uri="chrome://global/content/elements/datetimebox.js";widgetName="DateTimeBoxWidget";break;case"embed":case"object":uri="chrome://global/content/elements/pluginProblem.js";widgetName="PluginProblemWidget";break;case"marquee":uri="chrome://global/content/elements/marquee.js";widgetName="MarqueeWidget";break;}
if(!uri||!widgetName){Cu.reportError("Getting a UAWidgetSetupOrChange event on undefined element.");return;}
let shadowRoot=aElement.openOrClosedShadowRoot;if(!shadowRoot){Cu.reportError("Getting a UAWidgetSetupOrChange event without the Shadow Root. "+"Torn down already?");return;}
let isSystemPrincipal=aElement.nodePrincipal.isSystemPrincipal;let sandbox=isSystemPrincipal?Object.create(null):Cu.getUAWidgetScope(aElement.nodePrincipal);if(!sandbox[widgetName]){Services.scriptloader.loadSubScript(uri,sandbox);}
let prefs=Cu.cloneInto(this.getPrefsForUAWidget(widgetName,prefKeys),sandbox);let widget=new sandbox[widgetName](shadowRoot,prefs);if(!isSystemPrincipal){widget=widget.wrappedJSObject;}
if(this.unwrap(widget.shadowRoot)!=this.unwrap(shadowRoot)){Cu.reportError("Widgets should expose their shadow root.");}
this.widgets.set(aElement,{widget,widgetName});try{widget.onsetup();}catch(ex){Cu.reportError(ex);}}
teardownWidget(aElement){if(!this.widgets.has(aElement)){return;}
let{widget}=this.widgets.get(aElement);if(typeof widget.destructor=="function"){try{widget.destructor();}catch(ex){Cu.reportError(ex);}}
this.widgets.delete(aElement);}
getPrefsForUAWidget(aWidgetName,aPrefKeys){let result=this.prefsCache.get(aWidgetName);if(result){return result;}
result={};for(let key of aPrefKeys){result[key]=this.getPref(key);this.observePref(key);}
this.prefsCache.set(aWidgetName,result);return result;}
observePref(prefKey){Services.prefs.addObserver(prefKey,this.observerFunction);this.observedPrefs.push(prefKey);}
getPref(prefKey){switch(Services.prefs.getPrefType(prefKey)){case Ci.nsIPrefBranch.PREF_BOOL:{return Services.prefs.getBoolPref(prefKey);}
case Ci.nsIPrefBranch.PREF_INT:{return Services.prefs.getIntPref(prefKey);}
case Ci.nsIPrefBranch.PREF_STRING:{return Services.prefs.getStringPref(prefKey);}}
return undefined;}
observe(subject,topic,data){if(topic=="nsPref:changed"){for(let[widgetName,prefCache]of this.prefsCache){if(prefCache.hasOwnProperty(data)){let newValue=this.getPref(data);prefCache[data]=newValue;this.notifyWidgetsOnPrefChange(widgetName,data,newValue);}}}}
notifyWidgetsOnPrefChange(nameOfWidgetToNotify,prefKey,newValue){let elements=ChromeUtils.nondeterministicGetWeakMapKeys(this.widgets);for(let element of elements){if(!Cu.isDeadWrapper(element)&&element.isConnected){let{widgetName,widget}=this.widgets.get(element);if(widgetName==nameOfWidgetToNotify){if(typeof widget.onPrefChange=="function"){try{widget.onPrefChange(prefKey,newValue);}catch(ex){Cu.reportError(ex);}}}}}}}