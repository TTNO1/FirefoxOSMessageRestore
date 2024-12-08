"use strict";ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"FeatureGate","resource://featuregates/FeatureGate.jsm");var EXPORTED_SYMBOLS=["FeatureGateImplementation"];class FeatureGateImplementation{


constructor(definition){this._definition=definition;this._observers=new Set();}
get id(){return this._definition.id;}
get title(){return this._definition.title;}
get description(){return this._definition.description;}
get descriptionLinks(){return this._definition.descriptionLinks;}
get restartRequired(){return this._definition.restartRequired;}
get type(){return this._definition.type;}
get preference(){return this._definition.preference;}
get defaultValue(){return this._definition.defaultValue;}
get defaultValueOriginalValue(){return(this._definition.defaultValueOriginalValue||{default:this._definition.defaultValue,});}
defaultValueWith(extraFacts){return FeatureGate.evaluateTargetedValue(this.defaultValueOriginalValue,extraFacts,{mergeFactsWithDefault:true});}
get isPublic(){return this._definition.isPublic;}
get isPublicOriginalValue(){return(this._definition.isPublicOriginalValue||{default:this._definition.isPublic,});}
isPublicWith(extraFacts){return FeatureGate.evaluateTargetedValue(this.isPublicOriginalValue,extraFacts,{mergeFactsWithDefault:true});}
get bugNumbers(){return this._definition.bugNumbers;}
async getValue(){return Services.prefs.getBoolPref(this.preference,this.defaultValue);}
async isEnabled(){if(this.type!=="boolean"){throw new Error(`Tried to call isEnabled when type is not boolean (it is ${this.type})`);}
return this.getValue();}
async addObserver(observer){if(this._observers.size===0){Services.prefs.addObserver(this.preference,this);}
this._observers.add(observer);if(this.type==="boolean"&&(await this.isEnabled())){this._callObserverMethod(observer,"onEnable");}

return this.getValue();}
removeObserver(observer){this._observers.delete(observer);if(this._observers.size===0){Services.prefs.removeObserver(this.preference,this);}}
removeAllObservers(){if(this._observers.size>0){this._observers.clear();Services.prefs.removeObserver(this.preference,this);}}
_callObserverMethod(observer,method,...args){if(method in observer){try{observer[method](...args);}catch(err){Cu.reportError(err);}}}
async observe(aSubject,aTopic,aData){if(aTopic==="nsPref:changed"&&aData===this.preference){const value=await this.getValue();for(const observer of this._observers){this._callObserverMethod(observer,"onChange",value);if(value){this._callObserverMethod(observer,"onEnable");}else{this._callObserverMethod(observer,"onDisable");}}}else{Cu.reportError(new Error(`Unexpected event observed: ${aSubject}, ${aTopic}, ${aData}`));}}}