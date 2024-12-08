"use strict";const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{EnvironmentPrefs,MarionettePrefs}=ChromeUtils.import("chrome://marionette/content/prefs.js",null);XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",Preferences:"resource://gre/modules/Preferences.jsm",TCPListener:"chrome://marionette/content/server.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());XPCOMUtils.defineLazyServiceGetter(this,"env","@mozilla.org/process/environment;1","nsIEnvironment");const XMLURI_PARSE_ERROR="http://www.mozilla.org/newlayout/xml/parsererror.xml";const NOTIFY_LISTENING="marionette-listening";
const ENV_ENABLED="MOZ_MARIONETTE";






const ENV_PRESERVE_PREFS="MOZ_MARIONETTE_PREF_STATE_ACROSS_RESTARTS";




const RECOMMENDED_PREFS=new Map([["app.normandy.api_url",""],


["app.update.disabledForTesting",true],


["apz.content_response_timeout",60000],
["browser.contentblocking.introCount",99],

["browser.download.panel.shown",true],["browser.newtabpage.enabled",false],
["browser.pagethumbnails.capturing_disabled",true],["browser.safebrowsing.blockedURIs.enabled",false],["browser.safebrowsing.downloads.enabled",false],["browser.safebrowsing.passwords.enabled",false],["browser.safebrowsing.malware.enabled",false],["browser.safebrowsing.phishing.enabled",false],["browser.search.update",false],["browser.sessionstore.resume_from_crash",false],["browser.shell.checkDefaultBrowser",false],["browser.startup.homepage_override.mstone","ignore"],["browser.tabs.closeWindowWithLastTab",false],

["browser.tabs.disableBackgroundZombification",false],["browser.tabs.remote.separatePrivilegedContentProcess",false],["browser.tabs.unloadOnLowMemory",false],["browser.tabs.warnOnClose",false],["browser.tabs.warnOnCloseOtherTabs",false],["browser.tabs.warnOnOpen",false],
["browser.toolbars.bookmarks.visibility","never"],["browser.usedOnWindows10.introURL",""],["browser.uitour.enabled",false],
["browser.urlbar.suggest.searches",false],["browser.warnOnQuit",false],
["datareporting.healthreport.documentServerURI","http://%(server)s/dummy/healthreport/",],["datareporting.healthreport.logging.consoleEnabled",false],["datareporting.healthreport.service.enabled",false],["datareporting.healthreport.service.firstRun",false],["datareporting.healthreport.uploadEnabled",false],["datareporting.policy.dataSubmissionEnabled",false],["datareporting.policy.dataSubmissionPolicyAccepted",false],["datareporting.policy.dataSubmissionPolicyBypassNotification",true],["dom.disable_beforeunload",true],["dom.disable_open_during_load",false],["dom.file.createInChild",true],["dom.ipc.reportProcessHangs",false],["dom.max_chrome_script_run_time",0],["dom.max_script_run_time",0],

["extensions.autoDisableScopes",0],["extensions.enabledScopes",5],["extensions.getAddons.cache.enabled",false],["extensions.installDistroAddons",false],["extensions.update.enabled",false],["extensions.update.notifyUser",false],["extensions.getAddons.discovery.api_url","data:, "],
["focusmanager.testmode",false],["general.useragent.updates.enabled",false],["geo.wifi.scan",false],["javascript.options.showInConsole",true],["network.http.phishy-userpass-length",255],["network.http.prompt-temp-redirect",false],["network.manage-offline-status",false],

["privacy.trackingprotection.enabled",false],["security.certerrors.mitm.priming.enabled",false],["security.fileuri.strict_origin_policy",false],["security.notification_enable_delay",0],


["signon.autofillForms",false],
["signon.rememberSignons",false],["startup.homepage_welcome_url","about:blank"],["startup.homepage_welcome_url.additional",""],["toolkit.startup.max_resumed_crashes",-1],]);const isRemote=Services.appinfo.processType==Services.appinfo.PROCESS_TYPE_CONTENT;class MarionetteParentProcess{constructor(){this.server=null;
 this.gfxWindow=null;
 this.finalUIStartup=false;this.alteredPrefs=new Set();if(env.exists(ENV_ENABLED)){this.enabled=true;}else{this.enabled=MarionettePrefs.enabled;}
if(this.enabled){logger.trace(`Marionette enabled`);}
Services.ppmm.addMessageListener("Marionette:IsRunning",this);}
get enabled(){return!!this._enabled;}
set enabled(value){if(value){ MarionettePrefs.enabled=value;}
this._enabled=value;}
get running(){return!!this.server&&this.server.alive;}
receiveMessage({name}){switch(name){case"Marionette:IsRunning":return this.running;default:logger.warn("Unknown IPC message to parent process: "+name);return null;}}
observe(subject,topic){if(this.enabled){logger.trace(`Received observer notification ${topic}`);}
switch(topic){case"profile-after-change":Services.obs.addObserver(this,"command-line-startup");break;


case"command-line-startup":Services.obs.removeObserver(this,topic);if(!this.enabled&&subject.handleFlag("marionette",false)){logger.trace(`Marionette enabled`);this.enabled=true;}
if(this.enabled){Services.obs.addObserver(this,"toplevel-window-ready");Services.obs.addObserver(this,"marionette-startup-requested");
for(let[pref,value]of EnvironmentPrefs.from(ENV_PRESERVE_PREFS)){Preferences.set(pref,value);}

if(Services.appinfo.inSafeMode){Services.obs.addObserver(this,"domwindowopened");}}
break;case"domwindowclosed":if(this.gfxWindow===null||subject===this.gfxWindow){Services.obs.removeObserver(this,topic);Services.obs.removeObserver(this,"toplevel-window-ready");Services.obs.addObserver(this,"xpcom-will-shutdown");this.finalUIStartup=true;this.init();}
break;case"domwindowopened":Services.obs.removeObserver(this,topic);this.suppressSafeModeDialog(subject);break;case"toplevel-window-ready":subject.addEventListener("load",ev=>{if(ev.target.documentElement.namespaceURI==XMLURI_PARSE_ERROR){Services.obs.removeObserver(this,topic);let parserError=ev.target.querySelector("parsererror");logger.fatal(parserError.textContent);this.uninit();Services.startup.quit(Ci.nsIAppStartup.eForceQuit);}},{once:true});break;case"marionette-startup-requested":Services.obs.removeObserver(this,topic);

for(let win of Services.wm.getEnumerator(null)){if(win.document.documentURI=="chrome://gfxsanity/content/sanityparent.html"){this.gfxWindow=win;break;}}
if(this.gfxWindow){logger.trace("GFX sanity window detected, waiting until it has been closed...");Services.obs.addObserver(this,"domwindowclosed");}else{Services.obs.removeObserver(this,"toplevel-window-ready");Services.obs.addObserver(this,"xpcom-will-shutdown");this.finalUIStartup=true;this.init();}
break;case"xpcom-will-shutdown":Services.obs.removeObserver(this,"xpcom-will-shutdown");this.uninit();break;}}
suppressSafeModeDialog(win){win.addEventListener("load",()=>{let dialog=win.document.getElementById("safeModeDialog");if(dialog){ logger.trace("Safe mode detected, supressing dialog");win.setTimeout(()=>{dialog.getButton("accept").click();});}},{once:true});}
init(quit=true){if(this.running||!this.enabled||!this.finalUIStartup){logger.debug(`Init aborted (running=${this.running}, `+`enabled=${this.enabled}, finalUIStartup=${this.finalUIStartup})`);return;}
logger.trace(`Waiting until startup recorder finished recording startup scripts...`);Services.tm.idleDispatchToMainThread(async()=>{let startupRecorder=Promise.resolve();if("@mozilla.org/test/startuprecorder;1"in Cc){startupRecorder=Cc["@mozilla.org/test/startuprecorder;1"].getService().wrappedJSObject.done;}
await startupRecorder;logger.trace(`All scripts recorded.`);if(MarionettePrefs.recommendedPrefs){for(let[k,v]of RECOMMENDED_PREFS){if(!Preferences.isSet(k)){logger.debug(`Setting recommended pref ${k} to ${v}`);Preferences.set(k,v);this.alteredPrefs.add(k);}}}
try{this.server=new TCPListener(MarionettePrefs.port);this.server.start();}catch(e){logger.fatal("Remote protocol server failed to start",e);this.uninit();if(quit){Services.startup.quit(Ci.nsIAppStartup.eForceQuit);}
return;}
env.set(ENV_ENABLED,"1");Services.obs.notifyObservers(this,NOTIFY_LISTENING,true);logger.debug("Marionette is listening");});}
uninit(){for(let k of this.alteredPrefs){logger.debug(`Resetting recommended pref ${k}`);Preferences.reset(k);}
this.alteredPrefs.clear();if(this.running){this.server.stop();Services.obs.notifyObservers(this,NOTIFY_LISTENING);logger.debug("Marionette stopped listening");}}
get QueryInterface(){return ChromeUtils.generateQI(["nsICommandLineHandler","nsIMarionette","nsIObserver",]);}}
class MarionetteContentProcess{get running(){let reply=Services.cpmm.sendSyncMessage("Marionette:IsRunning");if(reply.length==0){logger.warn("No reply from parent process");return false;}
return reply[0];}
get QueryInterface(){return ChromeUtils.generateQI(["nsIMarionette"]);}}
const MarionetteFactory={instance_:null,createInstance(outer,iid){if(outer){throw Components.Exception("",Cr.NS_ERROR_NO_AGGREGATION);}
if(!this.instance_){if(isRemote){this.instance_=new MarionetteContentProcess();}else{this.instance_=new MarionetteParentProcess();}}
return this.instance_.QueryInterface(iid);},};function Marionette(){}
Marionette.prototype={classDescription:"Marionette component",classID:Components.ID("{786a1369-dca5-4adc-8486-33d23c88010a}"),contractID:"@mozilla.org/remote/marionette;1",_xpcom_factory:MarionetteFactory,helpInfo:"  --marionette       Enable remote control server.\n",};this.NSGetFactory=ComponentUtils.generateNSGetFactory([Marionette]);