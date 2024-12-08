//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
this.URLDecorationAnnotationsService=function(){};ChromeUtils.defineModuleGetter(this,"RemoteSettings","resource://services-settings/remote-settings.js");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const COLLECTION_NAME="anti-tracking-url-decoration";const PREF_NAME="privacy.restrict3rdpartystorage.url_decorations";URLDecorationAnnotationsService.prototype={classID:Components.ID("{5874af6d-5719-4e1b-b155-ef4eae7fcb32}"),QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsIURLDecorationAnnotationsService",]),_initialized:false,_prefBranch:null,onDataAvailable(entries){

if(this._prefBranch===null){this._prefBranch=Services.prefs.getDefaultBranch("");}
const branch=this._prefBranch;branch.unlockPref(PREF_NAME);branch.setStringPref(PREF_NAME,entries.map(x=>x.token.replace(/ /,"%20")).join(" "));branch.lockPref(PREF_NAME);},observe(aSubject,aTopic,aData){if(aTopic=="profile-after-change"){this.ensureUpdated();}},ensureUpdated(){if(this._initialized){return Promise.resolve();}
this._initialized=true;const client=RemoteSettings(COLLECTION_NAME);client.on("sync",event=>{let{data:{current},}=event;this.onDataAvailable(current);});
 return client.get({}).then(entries=>{this.onDataAvailable(entries);return undefined;});},};var EXPORTED_SYMBOLS=["URLDecorationAnnotationsService"];