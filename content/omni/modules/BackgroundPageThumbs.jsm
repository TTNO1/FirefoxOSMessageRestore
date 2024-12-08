//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const EXPORTED_SYMBOLS=["BackgroundPageThumbs"];const DEFAULT_CAPTURE_TIMEOUT=30000;
const TESTING_CAPTURE_TIMEOUT=5000;const DESTROY_BROWSER_TIMEOUT=60000;

const SETTLE_WAIT_TIME=2500;const TESTING_SETTLE_WAIT_TIME=0;const TELEMETRY_HISTOGRAM_ID_PREFIX="FX_THUMBNAILS_BG_";const ABOUT_NEWTAB_SEGREGATION_PREF="privacy.usercontext.about_newtab_segregation.enabled";const{PageThumbs,PageThumbsStorage}=ChromeUtils.import("resource://gre/modules/PageThumbs.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const TEL_CAPTURE_DONE_OK=0;const TEL_CAPTURE_DONE_TIMEOUT=1;const TEL_CAPTURE_DONE_CRASHED=4;const TEL_CAPTURE_DONE_BAD_URI=5;const TEL_CAPTURE_DONE_LOAD_FAILED=6;const TEL_CAPTURE_DONE_IMAGE_ZERO_DIMENSION=7;ChromeUtils.defineModuleGetter(this,"ContextualIdentityService","resource://gre/modules/ContextualIdentityService.jsm");const BackgroundPageThumbs={capture(url,options={}){if(!PageThumbs._prefEnabled()){if(options.onDone){schedule(()=>options.onDone(url));}
return;}
this._captureQueue=this._captureQueue||[];this._capturesByURL=this._capturesByURL||new Map();tel("QUEUE_SIZE_ON_CAPTURE",this._captureQueue.length);
let existing=this._capturesByURL.get(url);if(existing){if(options.onDone){existing.doneCallbacks.push(options.onDone);}
return;}
let cap=new Capture(url,this._onCaptureOrTimeout.bind(this),options);this._captureQueue.push(cap);this._capturesByURL.set(url,cap);this._processCaptureQueue();},async captureIfMissing(url,options={}){ if(!PageThumbs._prefEnabled()){if(options.onDone){options.onDone(url);}
return url;}


let exists=await PageThumbsStorage.fileExistsForURL(url);if(exists){if(options.onDone){options.onDone(url);}
return url;}
let thumbPromise=new Promise((resolve,reject)=>{let observe=(subject,topic,data)=>{if(data===url){switch(topic){case"page-thumbnail:create":resolve();break;case"page-thumbnail:error":reject(new Error("page-thumbnail:error"));break;}
cleanup();}};Services.obs.addObserver(observe,"page-thumbnail:create");Services.obs.addObserver(observe,"page-thumbnail:error");
 function cleanup(){if(observe){Services.obs.removeObserver(observe,"page-thumbnail:create");Services.obs.removeObserver(observe,"page-thumbnail:error");observe=null;}}
if(options.unloadingPromise){options.unloadingPromise.then(cleanup);}});try{this.capture(url,options);await thumbPromise;}catch(err){if(options.onDone){options.onDone(url);}
throw err;}
return url;},renewThumbnailBrowser(){this._renewThumbBrowser=true;},get useFissionBrowser(){return Services.appinfo.fissionAutostart;},_ensureParentWindowReady(){if(this._parentWin){return true;}
if(this._startedParentWinInit){return false;}
this._startedParentWinInit=true;
const flags=this.useFissionBrowser?Ci.nsIWebBrowserChrome.CHROME_REMOTE_WINDOW|Ci.nsIWebBrowserChrome.CHROME_FISSION_WINDOW:0;let wlBrowser=Services.appShell.createWindowlessBrowser(true,flags);wlBrowser.QueryInterface(Ci.nsIInterfaceRequestor);let webProgress=wlBrowser.getInterface(Ci.nsIWebProgress);this._listener={QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener","nsIWebProgressListener2","nsISupportsWeakReference",]),};this._listener.onStateChange=(wbp,request,stateFlags,status)=>{if(!request){return;}
if(stateFlags&Ci.nsIWebProgressListener.STATE_STOP&&stateFlags&Ci.nsIWebProgressListener.STATE_IS_NETWORK){webProgress.removeProgressListener(this._listener);delete this._listener;this._parentWin=wlBrowser.document.defaultView;this._processCaptureQueue();}};webProgress.addProgressListener(this._listener,Ci.nsIWebProgress.NOTIFY_STATE_ALL);let loadURIOptions={triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),};wlBrowser.loadURI("chrome://global/content/backgroundPageThumbs.xhtml",loadURIOptions);this._windowlessContainer=wlBrowser;return false;},_init(){Services.prefs.addObserver(ABOUT_NEWTAB_SEGREGATION_PREF,this);Services.obs.addObserver(this,"profile-before-change");},observe(subject,topic,data){if(topic=="profile-before-change"){this._destroy();}else if(topic=="nsPref:changed"&&data==ABOUT_NEWTAB_SEGREGATION_PREF){BackgroundPageThumbs.renewThumbnailBrowser();}},_destroy(){if(this._captureQueue){this._captureQueue.forEach(cap=>cap.destroy());}
this._destroyBrowser();if(this._windowlessContainer){this._windowlessContainer.close();}
delete this._captureQueue;delete this._windowlessContainer;delete this._startedParentWinInit;delete this._parentWin;delete this._listener;},QueryInterface:ChromeUtils.generateQI([Ci.nsIWebProgressListener,Ci.nsIWebProgressListener2,Ci.nsISupportsWeakReference,]),onStateChange(wbp,request,stateFlags,status){if(!request||!wbp.isTopLevel){return;}
if(stateFlags&Ci.nsIWebProgressListener.STATE_STOP&&stateFlags&Ci.nsIWebProgressListener.STATE_IS_NETWORK){
if(request instanceof Ci.nsIChannel&&request.URI.spec=="about:blank"){if(this._expectingAboutBlank){this._expectingAboutBlank=false;if(this._captureQueue.length){this._processCaptureQueue();}}
return;}
if(!this._captureQueue.length){return;}
let currentCapture=this._captureQueue[0];if(Components.isSuccessCode(status)||status===Cr.NS_BINDING_ABORTED){this._thumbBrowser.ownerGlobal.requestIdleCallback(()=>{currentCapture.pageLoaded(this._thumbBrowser);});}else{currentCapture._done(this._thumbBrowser,null,currentCapture.timedOut?TEL_CAPTURE_DONE_TIMEOUT:TEL_CAPTURE_DONE_LOAD_FAILED);}}},_ensureBrowser(){if(this._thumbBrowser&&!this._renewThumbBrowser){return;}
this._destroyBrowser();this._renewThumbBrowser=false;let browser=this._parentWin.document.createXULElement("browser");browser.setAttribute("type","content");browser.setAttribute("remote","true");if(this.useFissionBrowser){browser.setAttribute("maychangeremoteness","true");}
browser.setAttribute("disableglobalhistory","true");browser.setAttribute("messagemanagergroup","thumbnails");if(Services.prefs.getBoolPref(ABOUT_NEWTAB_SEGREGATION_PREF)){let privateIdentity=ContextualIdentityService.getPrivateIdentity("userContextIdInternal.thumbnail");browser.setAttribute("usercontextid",privateIdentity.userContextId);}


let[swidth,sheight]=[{},{}];Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager).primaryScreen.GetRectDisplayPix({},{},swidth,sheight);let bwidth=Math.min(1024,swidth.value);
browser.style.width=bwidth+"px";browser.style.height=(bwidth*sheight.value)/swidth.value+"px";this._parentWin.document.documentElement.appendChild(browser);browser.addProgressListener(this,Ci.nsIWebProgress.NOTIFY_STATE_WINDOW);
browser.addEventListener("oop-browser-crashed",event=>{if(!event.isTopFrame){return;}
Cu.reportError("BackgroundThumbnails remote process crashed - recovering");this._destroyBrowser();let curCapture=this._captureQueue.length?this._captureQueue[0]:null;


if(curCapture){





Services.tm.dispatchToMainThread(()=>{curCapture._done(browser,null,TEL_CAPTURE_DONE_CRASHED);});}

});this._thumbBrowser=browser;browser.docShellIsActive=false;},_destroyBrowser(){if(!this._thumbBrowser){return;}
this._expectingAboutBlank=false;this._thumbBrowser.remove();delete this._thumbBrowser;},async _loadAboutBlank(){if(this._expectingAboutBlank){return;}
this._expectingAboutBlank=true;let loadURIOptions={triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),loadFlags:Ci.nsIWebNavigation.LOAD_FLAGS_STOP_CONTENT,};this._thumbBrowser.loadURI("about:blank",loadURIOptions);},_processCaptureQueue(){if(!this._captureQueue.length){if(this._thumbBrowser){BackgroundPageThumbs._loadAboutBlank();}
return;}
if(this._captureQueue[0].pending||!this._ensureParentWindowReady()||this._expectingAboutBlank){return;}
this._ensureBrowser();this._captureQueue[0].start(this._thumbBrowser);if(this._destroyBrowserTimer){this._destroyBrowserTimer.cancel();delete this._destroyBrowserTimer;}},_onCaptureOrTimeout(capture,reason){
if(capture!==this._captureQueue[0]){throw new Error("The capture should be at the head of the queue.");}
this._captureQueue.shift();this._capturesByURL.delete(capture.url);if(reason!=TEL_CAPTURE_DONE_OK){Services.obs.notifyObservers(null,"page-thumbnail:error",capture.url);}
let timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);timer.initWithCallback(this._destroyBrowser.bind(this),this._destroyBrowserTimeout,Ci.nsITimer.TYPE_ONE_SHOT);this._destroyBrowserTimer=timer;this._processCaptureQueue();},_destroyBrowserTimeout:DESTROY_BROWSER_TIMEOUT,};BackgroundPageThumbs._init();Object.defineProperty(this,"BackgroundPageThumbs",{value:BackgroundPageThumbs,enumerable:true,writable:false,});function Capture(url,captureCallback,options){this.url=url;this.captureCallback=captureCallback;this.redirectTimer=null;this.timedOut=false;this.options=options;this.id=Capture.nextID++;this.creationDate=new Date();this.doneCallbacks=[];if(options.onDone){this.doneCallbacks.push(options.onDone);}}
Capture.prototype={get pending(){return!!this._timeoutTimer;},start(browser){this.startDate=new Date();tel("CAPTURE_QUEUE_TIME_MS",this.startDate-this.creationDate);let fallbackTimeout=Cu.isInAutomation?TESTING_CAPTURE_TIMEOUT:DEFAULT_CAPTURE_TIMEOUT; let timeout=typeof this.options.timeout=="number"?this.options.timeout:fallbackTimeout;this._timeoutTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this._timeoutTimer.initWithCallback(this,timeout,Ci.nsITimer.TYPE_ONE_SHOT);this._browser=browser;if(!browser.browsingContext){return;}
this._pageLoadStartTime=new Date();BackgroundPageThumbs._expectingAboutBlank=false;let thumbnailsActor=browser.browsingContext.currentWindowGlobal.getActor("BackgroundThumbnails");thumbnailsActor.sendQuery("Browser:Thumbnail:LoadURL",{url:this.url,}).then(success=>{
if(!success){this._done(browser,null,TEL_CAPTURE_DONE_BAD_URI);}},failure=>{
});},readBlob:function readBlob(blob){return new Promise((resolve,reject)=>{let reader=new FileReader();reader.onloadend=function onloadend(){if(reader.readyState!=FileReader.DONE){reject(reader.error);}else{resolve(reader.result);}};reader.readAsArrayBuffer(blob);});},async pageLoaded(aBrowser){if(this.timedOut){this._done(aBrowser,null,TEL_CAPTURE_DONE_TIMEOUT);return;}
let waitTime=Cu.isInAutomation?TESTING_SETTLE_WAIT_TIME:SETTLE_WAIT_TIME; if(this.redirectTimer){this.redirectTimer.delay=waitTime;return;}
 
await new Promise(resolve=>{this.redirectTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);this.redirectTimer.init(resolve,waitTime,Ci.nsITimer.TYPE_ONE_SHOT);});this.redirectTimer=null;let pageLoadTime=new Date()-this._pageLoadStartTime;let canvasDrawStartTime=new Date();let canvas=PageThumbs.createCanvas(aBrowser.ownerGlobal,1,1);try{await PageThumbs.captureToCanvas(aBrowser,canvas,{isBackgroundThumb:true,isImage:this.options.isImage,backgroundColor:this.options.backgroundColor,},true);}catch(ex){this._done(aBrowser,null,ex=="IMAGE_ZERO_DIMENSION"?TEL_CAPTURE_DONE_IMAGE_ZERO_DIMENSION:TEL_CAPTURE_DONE_LOAD_FAILED);return;}
let canvasDrawTime=new Date()-canvasDrawStartTime;let imageData=await new Promise(resolve=>{canvas.toBlob(blob=>{resolve(blob,this.contentType);});});this._done(aBrowser,imageData,TEL_CAPTURE_DONE_OK,{CAPTURE_PAGE_LOAD_TIME_MS:pageLoadTime,CAPTURE_CANVAS_DRAW_TIME_MS:canvasDrawTime,});},destroy(){
if(this._timeoutTimer){this._timeoutTimer.cancel();delete this._timeoutTimer;}
delete this.captureCallback;delete this.doneCallbacks;delete this.options;},notify(){this.timedOut=true;this._browser.stop();},_done(browser,imageData,reason,telemetry){

let{captureCallback,doneCallbacks,options}=this;this.destroy();if(typeof reason!="number"){throw new Error("A done reason must be given.");}
tel("CAPTURE_DONE_REASON_2",reason);if(telemetry){for(let id in telemetry){tel(id,telemetry[id]);}}
let done=()=>{captureCallback(this,reason);for(let callback of doneCallbacks){try{callback.call(options,this.url,reason);}catch(err){Cu.reportError(err);}}
if(Services.prefs.getBoolPref(ABOUT_NEWTAB_SEGREGATION_PREF)){let privateIdentity=ContextualIdentityService.getPrivateIdentity("userContextIdInternal.thumbnail");if(privateIdentity){Services.clearData.deleteDataFromOriginAttributesPattern({userContextId:privateIdentity.userContextId,});}}};if(!imageData){done();return;}
this.readBlob(imageData).then(buffer=>{PageThumbs._store(this.url,browser.currentURI.spec,buffer,true).then(done,done);});},};Capture.nextID=0;function tel(histogramID,value){let id=TELEMETRY_HISTOGRAM_ID_PREFIX+histogramID;Services.telemetry.getHistogramById(id).add(value);}
function schedule(callback){Services.tm.dispatchToMainThread(callback);}