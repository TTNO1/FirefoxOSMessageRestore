"use strict";var{ExtensionParent}=ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");var{HiddenExtensionPage,promiseExtensionViewLoaded}=ExtensionParent;ChromeUtils.defineModuleGetter(this,"ExtensionTelemetry","resource://gre/modules/ExtensionTelemetry.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");XPCOMUtils.defineLazyPreferenceGetter(this,"DELAYED_STARTUP","extensions.webextensions.background-delayed-startup");XPCOMUtils.defineLazyGetter(this,"serviceWorkerManager",()=>{return Cc["@mozilla.org/serviceworkers/manager;1"].getService(Ci.nsIServiceWorkerManager);});class BackgroundPage extends HiddenExtensionPage{constructor(extension,options){super(extension,"background");this.page=options.page||null;this.isGenerated=!!options.scripts;if(this.page){this.url=this.extension.baseURI.resolve(this.page);}else if(this.isGenerated){this.url=this.extension.baseURI.resolve("_generated_background_page.html");}}
async build(){const{extension}=this;ExtensionTelemetry.backgroundPageLoad.stopwatchStart(extension,this);let context;try{await this.createBrowserElement();if(!this.browser){throw new Error("Extension shut down before the background page was created");}
extension._backgroundPageFrameLoader=this.browser.frameLoader;extensions.emit("extension-browser-inserted",this.browser);let contextPromise=promiseExtensionViewLoaded(this.browser);this.browser.loadURI(this.url,{triggeringPrincipal:extension.principal,});context=await contextPromise;}catch(e){Cu.reportError(e);ExtensionTelemetry.backgroundPageLoad.stopwatchCancel(extension,this);if(extension.persistentListeners){EventManager.clearPrimedListeners(this.extension,false);}
extension.emit("background-page-aborted");return;}
ExtensionTelemetry.backgroundPageLoad.stopwatchFinish(extension,this);if(context){
await Promise.all(context.listenerPromises);context.listenerPromises=null;}
if(extension.persistentListeners){EventManager.clearPrimedListeners(extension,!!this.extension);}
extension.emit("background-page-started");}
shutdown(){this.extension._backgroundPageFrameLoader=null;super.shutdown();}}
class BackgroundWorker{constructor(extension,options){this.registrationInfo=null;this.extension=extension;this.workerScript=options.service_worker;if(!this.workerScript){throw new Error("Missing mandatory background.service_worker property");}}
async build(){const regInfo=await serviceWorkerManager.registerForAddonPrincipal(this.extension.principal);this.registrationInfo=regInfo.QueryInterface(Ci.nsIServiceWorkerRegistrationInfo);}
shutdown(){if(this.registrationInfo){this.registrationInfo.forceShutdown();this.registrationInfo=null;}}}
this.backgroundPage=class extends ExtensionAPI{async build(){if(this.bgInstance){return;}
let{extension}=this;let{manifest}=extension;let BackgroundClass=manifest.background.service_worker?BackgroundWorker:BackgroundPage;this.bgInstance=new BackgroundClass(extension,manifest.background);return this.bgInstance.build();}
onManifestEntry(entryName){let{extension}=this;this.bgInstance=null;

if(PrivateBrowsingUtils.permanentPrivateBrowsing&&!extension.privateBrowsingAllowed){return;}
let bgStartupPromise=new Promise(resolve=>{let done=()=>{extension.off("background-page-started",done);extension.off("background-page-aborted",done);extension.off("shutdown",done);resolve();};extension.on("background-page-started",done);extension.on("background-page-aborted",done);extension.on("shutdown",done);});extension.wakeupBackground=()=>{extension.emit("background-page-event");extension.wakeupBackground=()=>bgStartupPromise;return bgStartupPromise;};if(extension.startupReason!=="APP_STARTUP"||!DELAYED_STARTUP){return this.build();}
EventManager.primeListeners(extension);extension.once("start-background-page",async()=>{if(!this.extension){return;}
await this.build();});




extension.once("background-page-event",async()=>{await ExtensionParent.browserPaintedPromise;extension.emit("start-background-page");});ExtensionParent.browserStartupPromise.then(()=>{extension.emit("start-background-page");});}
onShutdown(){if(this.bgInstance){this.bgInstance.shutdown();this.bgInstance=null;}else{EventManager.clearPrimedListeners(this.extension,false);}}};