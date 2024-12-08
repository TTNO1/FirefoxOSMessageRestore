//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["ContentDOMReference"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyServiceGetter(this,"finalizationService","@mozilla.org/toolkit/finalizationwitness;1","nsIFinalizationWitnessService");const FINALIZATION_TOPIC="content-dom-reference-finalized";


const finalizerRoots=new WeakMap();var gRegistry=new WeakMap();var ContentDOMReference={_init(){const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");Services.obs.addObserver(this,FINALIZATION_TOPIC);},observe(subject,topic,data){if(topic!==FINALIZATION_TOPIC){throw new Error("Unexpected observer topic");}
let identifier=JSON.parse(data);this._revoke(identifier);},get(element){if(!element){throw new Error("Can't create a ContentDOMReference identifier for "+"non-existant nodes.");}
let browsingContext=BrowsingContext.getFromWindow(element.ownerGlobal);let mappings=gRegistry.get(browsingContext);if(!mappings){mappings={IDToElement:new Map(),elementToID:new WeakMap(),};gRegistry.set(browsingContext,mappings);}
let id=mappings.elementToID.get(element);if(id){return{browsingContextId:browsingContext.id,id};}
id=Math.random();mappings.elementToID.set(element,id);mappings.IDToElement.set(id,Cu.getWeakReference(element));let identifier={browsingContextId:browsingContext.id,id};finalizerRoots.set(element,finalizationService.make(FINALIZATION_TOPIC,JSON.stringify(identifier)));return identifier;},resolve(identifier){let browsingContext=BrowsingContext.get(identifier.browsingContextId);let{id}=identifier;return this._resolveIDToElement(browsingContext,id);},_revoke(identifier){let browsingContext=BrowsingContext.get(identifier.browsingContextId);let{id}=identifier;let mappings=gRegistry.get(browsingContext);if(!mappings){return;}
mappings.IDToElement.delete(id);},_resolveIDToElement(browsingContext,id){let mappings=gRegistry.get(browsingContext);if(!mappings){return null;}
let weakReference=mappings.IDToElement.get(id);if(!weakReference){return null;}
return weakReference.get();},};ContentDOMReference._init();