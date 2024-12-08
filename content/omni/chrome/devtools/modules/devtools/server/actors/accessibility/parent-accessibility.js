"use strict";const{Cc,Ci}=require("chrome");const Services=require("Services");const{Actor,ActorClassWithSpec}=require("devtools/shared/protocol");const{parentAccessibilitySpec,}=require("devtools/shared/specs/accessibility");const PREF_ACCESSIBILITY_FORCE_DISABLED="accessibility.force_disabled";const ParentAccessibilityActor=ActorClassWithSpec(parentAccessibilitySpec,{initialize(conn){Actor.prototype.initialize.call(this,conn);this.userPref=Services.prefs.getIntPref(PREF_ACCESSIBILITY_FORCE_DISABLED);if(this.enabled&&!this.accService){

this.accService=Cc["@mozilla.org/accessibilityService;1"].getService(Ci.nsIAccessibilityService);}
Services.obs.addObserver(this,"a11y-consumers-changed");Services.prefs.addObserver(PREF_ACCESSIBILITY_FORCE_DISABLED,this);},bootstrap(){return{canBeDisabled:this.canBeDisabled,canBeEnabled:this.canBeEnabled,};},observe(subject,topic,data){if(topic==="a11y-consumers-changed"){



const{PlatformAPI}=JSON.parse(data);this.emit("can-be-disabled-change",!PlatformAPI);}else if(!this.disabling&&topic==="nsPref:changed"&&data===PREF_ACCESSIBILITY_FORCE_DISABLED){



this.emit("can-be-enabled-change",this.canBeEnabled);}},get enabled(){return Services.appinfo.accessibilityEnabled;},get canBeDisabled(){if(this.enabled){const a11yService=Cc["@mozilla.org/accessibilityService;1"].getService(Ci.nsIAccessibilityService);const{PlatformAPI}=JSON.parse(a11yService.getConsumers());return!PlatformAPI;}
return true;},get canBeEnabled(){return Services.prefs.getIntPref(PREF_ACCESSIBILITY_FORCE_DISABLED)<1;},enable(){if(this.enabled||!this.canBeEnabled){return;}
this.accService=Cc["@mozilla.org/accessibilityService;1"].getService(Ci.nsIAccessibilityService);},disable(){if(!this.enabled||!this.canBeDisabled){return;}
this.disabling=true;this.accService=null;


Services.prefs.setIntPref(PREF_ACCESSIBILITY_FORCE_DISABLED,1);


Services.prefs.setIntPref(PREF_ACCESSIBILITY_FORCE_DISABLED,this.userPref);delete this.disabling;},destroy(){Actor.prototype.destroy.call(this);Services.obs.removeObserver(this,"a11y-consumers-changed");Services.prefs.removeObserver(PREF_ACCESSIBILITY_FORCE_DISABLED,this);this.accService=null;},});exports.ParentAccessibilityActor=ParentAccessibilityActor;