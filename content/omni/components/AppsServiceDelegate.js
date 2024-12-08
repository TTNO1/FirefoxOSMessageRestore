const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{PermissionsInstaller}=ChromeUtils.import("resource://gre/modules/PermissionsInstaller.jsm");const{ServiceWorkerAssistant}=ChromeUtils.import("resource://gre/modules/ServiceWorkerAssistant.jsm");const{AppsUtils}=ChromeUtils.import("resource://gre/modules/AppsUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const DEBUG=1;var log=DEBUG?function log_dump(msg){dump("AppsServiceDelegate: "+msg+"\n");}:function log_noop(msg){};function AppsServiceDelegate(){}
AppsServiceDelegate.prototype={classID:Components.ID("{a4a8d542-c877-11ea-81c6-87c0ade42646}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIAppsServiceDelegate]),_xpcom_factory:ComponentUtils.generateSingletonFactory(AppsServiceDelegate),_installPermissions(aFeatures,aManifestUrl,aReinstall,aState){try{PermissionsInstaller.installPermissions(aFeatures,aManifestUrl,aReinstall,null );}catch(e){log(`Error with PermissionsInstaller in ${aState}: ${e}`);}},_processServiceWorker(aManifestUrl,aFeatures,aState){try{switch(aState){case"onBoot":case"onInstall":ServiceWorkerAssistant.register(aManifestUrl,aFeatures);break;case"onUpdate":ServiceWorkerAssistant.update(aManifestUrl,aFeatures);break;case"onUninstall":ServiceWorkerAssistant.unregister(aManifestUrl);break;}}catch(e){log(`Error with ServiceWorkerAssistant in ${aState}: ${e}`);}},onBoot(aManifestUrl,aFeatures){log(`onBoot: ${aManifestUrl}`);log(aFeatures);try{let features=JSON.parse(aFeatures);this._installPermissions(features,aManifestUrl,false,"onBoot");this._processServiceWorker(aManifestUrl,features,"onBoot");}catch(e){log(`Error in onBoot: ${e}`);}},onBootDone(){log(`onBootDone`);Services.obs.notifyObservers(null,"on-boot-done");ServiceWorkerAssistant.waitForRegistrations();},onClear(aManifestUrl,aType,aFeatures){log(`onClear: ${aManifestUrl}: clear type: ${aType}`);log(aFeatures);switch(aType){case"Browser":AppsUtils.clearBrowserData(aManifestUrl);break;case"Storage":AppsUtils.clearStorage(aManifestUrl);break;default:}

if(aFeatures){try{let features=JSON.parse(aFeatures);ServiceWorkerAssistant.register(aManifestUrl,features,true );}catch(e){log(`Error when trying re-register sw in onClear: ${e}`);}}},onInstall(aManifestUrl,aFeatures){log(`onInstall: ${aManifestUrl}`);log(aFeatures);try{let features=JSON.parse(aFeatures);this._installPermissions(features,aManifestUrl,false,"onInstall");this._processServiceWorker(aManifestUrl,features,"onInstall");}catch(e){log(`Error in onInstall: ${e}`);}},onUpdate(aManifestUrl,aFeatures){log(`onUpdate: ${aManifestUrl}`);log(aFeatures);try{let features=JSON.parse(aFeatures);this._installPermissions(features,aManifestUrl,true,"onUpdate");this._processServiceWorker(aManifestUrl,features,"onUpdate");}catch(e){log(`Error in onUpdate: ${e}`);}},onUninstall(aManifestUrl){log(`onUninstall: ${aManifestUrl}`);PermissionsInstaller.uninstallPermissions(aManifestUrl);this._processServiceWorker(aManifestUrl,undefined,"onUninstall");AppsUtils.clearBrowserData(aManifestUrl);AppsUtils.clearStorage(aManifestUrl);},};this.NSGetFactory=ComponentUtils.generateNSGetFactory([AppsServiceDelegate]);