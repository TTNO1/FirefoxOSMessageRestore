//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
this.UrlClassifierExceptionListService=function(){};const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"RemoteSettings","resource://services-settings/remote-settings.js");const COLLECTION_NAME="url-classifier-skip-urls";class Feature{constructor(name,prefName){this.name=name;this.prefName=prefName;this.observers=new Set();this.prefValue=null;this.remoteEntries=null;if(prefName){this.prefValue=Services.prefs.getStringPref(this.prefName,null);Services.prefs.addObserver(prefName,this);}}
async addAndRunObserver(observer){this.observers.add(observer);this.notifyObservers(observer);}
removeObserver(observer){this.observers.delete(observer);}
observe(subject,topic,data){if(topic!="nsPref:changed"||data!=this.prefName){Cu.reportError(`Unexpected event ${topic} with ${data}`);return;}
this.prefValue=Services.prefs.getStringPref(this.prefName,null);this.notifyObservers();}
onRemoteSettingsUpdate(entries){this.remoteEntries=[];for(let entry of entries){if(entry.feature==this.name){this.remoteEntries.push(entry.pattern.toLowerCase());}}}
notifyObservers(observer=null){let entries=[];if(this.prefValue){entries=this.prefValue.split(",");}
if(this.remoteEntries){for(let entry of this.remoteEntries){entries.push(entry);}}
let entriesAsString=entries.join(",").toLowerCase();if(observer){observer.onExceptionListUpdate(entriesAsString);}else{for(let obs of this.observers){obs.onExceptionListUpdate(entriesAsString);}}}}
UrlClassifierExceptionListService.prototype={classID:Components.ID("{b9f4fd03-9d87-4bfd-9958-85a821750ddc}"),QueryInterface:ChromeUtils.generateQI(["nsIUrlClassifierExceptionListService",]),features:{},_initialized:false,async lazyInit(){if(this._initialized){return;}
let rs=RemoteSettings(COLLECTION_NAME);rs.on("sync",event=>{let{data:{current},}=event;this.entries=current||[];this.onUpdateEntries(current);});this._initialized=true;


try{
this.entries=await rs.get();}catch(e){}

if(!this.entries){this.entries=[];}
this.onUpdateEntries(this.entries);},onUpdateEntries(entries){for(let key of Object.keys(this.features)){let feature=this.features[key];feature.onRemoteSettingsUpdate(entries);feature.notifyObservers();}},registerAndRunExceptionListObserver(feature,prefName,observer){




this.lazyInit();if(!this.features[feature]){let featureObj=new Feature(feature,prefName);this.features[feature]=featureObj;
if(this.entries){featureObj.onRemoteSettingsUpdate(this.entries);}}
this.features[feature].addAndRunObserver(observer);},unregisterExceptionListObserver(feature,observer){if(!this.features[feature]){return;}
this.features[feature].removeObserver(observer);},clear(){this.features={};this._initialized=false;this.entries=null;},};var EXPORTED_SYMBOLS=["UrlClassifierExceptionListService"];