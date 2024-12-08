//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"RemoteSettings","resource://services-settings/remote-settings.js");const COLLECTION_NAME="partitioning-exempt-urls";const PREF_NAME="privacy.restrict3rdpartystorage.skip_list";class Feature{constructor(){this.prefName=PREF_NAME;this.observers=new Set();this.prefValue=[];this.remoteEntries=[];if(this.prefName){let prefValue=Services.prefs.getStringPref(this.prefName,null);this.prefValue=prefValue?prefValue.split(";"):[];Services.prefs.addObserver(this.prefName,this);}}
async addAndRunObserver(observer){this.observers.add(observer);this.notifyObservers(observer);}
removeObserver(observer){this.observers.delete(observer);}
observe(subject,topic,data){if(topic!="nsPref:changed"||data!=this.prefName){Cu.reportError(`Unexpected event ${topic} with ${data}`);return;}
let prefValue=Services.prefs.getStringPref(this.prefName,null);this.prefValue=prefValue?prefValue.split(";"):[];this.notifyObservers();}
onRemoteSettingsUpdate(entries){this.remoteEntries=[];for(let entry of entries){this.remoteEntries.push(`${entry.firstPartyOrigin},${entry.thirdPartyOrigin}`);}}
notifyObservers(observer=null){let entries=this.prefValue.concat(this.remoteEntries);let entriesAsString=entries.join(";").toLowerCase();if(observer){observer.onExceptionListUpdate(entriesAsString);}else{for(let obs of this.observers){obs.onExceptionListUpdate(entriesAsString);}}}}
this.PartitioningExceptionListService=function(){};PartitioningExceptionListService.prototype={classID:Components.ID("{ab94809d-33f0-4f28-af38-01efbd3baf22}"),QueryInterface:ChromeUtils.generateQI(["nsIPartitioningExceptionListService",]),_initialized:false,async lazyInit(){if(this._initialized){return;}
this.feature=new Feature();let rs=RemoteSettings(COLLECTION_NAME);rs.on("sync",event=>{let{data:{current},}=event;this.onUpdateEntries(current);});this._initialized=true;let entries;


try{
entries=await rs.get();}catch(e){}

this.onUpdateEntries(entries||[]);},onUpdateEntries(entries){if(!this.feature){return;}
this.feature.onRemoteSettingsUpdate(entries);this.feature.notifyObservers();},registerAndRunExceptionListObserver(observer){




this.lazyInit();this.feature.addAndRunObserver(observer);},unregisterExceptionListObserver(observer){if(!this.feature){return;}
this.feature.removeObserver(observer);},};var EXPORTED_SYMBOLS=["PartitioningExceptionListService"];