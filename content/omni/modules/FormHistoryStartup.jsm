//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"FormHistory","resource://gre/modules/FormHistory.jsm");function FormHistoryStartup(){}
FormHistoryStartup.prototype={classID:Components.ID("{3A0012EB-007F-4BB8-AA81-A07385F77A25}"),QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]),observe(subject,topic,data){switch(topic){case"nsPref:changed":FormHistory.updatePrefs();break;case"idle-daily":case"formhistory-expire-now":FormHistory.expireOldEntries();break;case"profile-after-change":this.init();break;}},inited:false,pendingQuery:null,init(){if(this.inited){return;}
this.inited=true;Services.prefs.addObserver("browser.formfill.",this,true); Services.obs.addObserver(this,"idle-daily",true);Services.obs.addObserver(this,"formhistory-expire-now",true);Services.ppmm.addMessageListener("FormHistory:AutoCompleteSearchAsync",this);Services.ppmm.addMessageListener("FormHistory:RemoveEntry",this);},receiveMessage(message){switch(message.name){case"FormHistory:AutoCompleteSearchAsync":{

let{id,searchString,params}=message.data;if(this.pendingQuery){this.pendingQuery.cancel();this.pendingQuery=null;}
let query=null;let results=[];let processResults={handleResult:aResult=>{results.push(aResult);},handleCompletion:aReason=>{

if(query===this.pendingQuery){this.pendingQuery=null;if(!aReason){message.target.sendAsyncMessage("FormHistory:AutoCompleteSearchResults",{id,results,});}}},};query=FormHistory.getAutoCompleteResults(searchString,params,processResults);this.pendingQuery=query;break;}
case"FormHistory:RemoveEntry":{let{inputName,value,guid}=message.data;FormHistory.update({op:"remove",fieldname:inputName,value,guid,});break;}}},};var EXPORTED_SYMBOLS=["FormHistoryStartup"];