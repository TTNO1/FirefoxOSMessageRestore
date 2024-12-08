//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

"use strict";var EXPORTED_SYMBOLS=["RFPHelper"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const kPrefResistFingerprinting="privacy.resistFingerprinting";const kPrefSpoofEnglish="privacy.spoof_english";const kTopicHttpOnModifyRequest="http-on-modify-request";const kPrefLetterboxing="privacy.resistFingerprinting.letterboxing";const kPrefLetterboxingDimensions="privacy.resistFingerprinting.letterboxing.dimensions";const kPrefLetterboxingTesting="privacy.resistFingerprinting.letterboxing.testing";const kTopicDOMWindowOpened="domwindowopened";var logConsole;function log(msg){if(!logConsole){logConsole=console.createInstance({prefix:"RFPHelper.jsm",maxLogLevelPref:"privacy.resistFingerprinting.jsmloglevel",});}
logConsole.log(msg);}
class _RFPHelper{
constructor(){this._initialized=false;}
init(){if(this._initialized){return;}
this._initialized=true; Services.prefs.addObserver(kPrefResistFingerprinting,this);Services.prefs.addObserver(kPrefLetterboxing,this);XPCOMUtils.defineLazyPreferenceGetter(this,"_letterboxingDimensions",kPrefLetterboxingDimensions,"",null,this._parseLetterboxingDimensions);XPCOMUtils.defineLazyPreferenceGetter(this,"_isLetterboxingTesting",kPrefLetterboxingTesting,false); this._handleResistFingerprintingChanged();this._handleLetterboxingPrefChanged();}
uninit(){if(!this._initialized){return;}
this._initialized=false; Services.prefs.removeObserver(kPrefResistFingerprinting,this);Services.prefs.removeObserver(kPrefLetterboxing,this); this._removeRFPObservers();}
observe(subject,topic,data){switch(topic){case"nsPref:changed":this._handlePrefChanged(data);break;case kTopicHttpOnModifyRequest:this._handleHttpOnModifyRequest(subject,data);break;case kTopicDOMWindowOpened:

this._handleDOMWindowOpened(subject);break;default:break;}}
handleEvent(aMessage){switch(aMessage.type){case"TabOpen":{let tab=aMessage.target;this._addOrClearContentMargin(tab.linkedBrowser);break;}
default:break;}}
_handlePrefChanged(data){switch(data){case kPrefResistFingerprinting:this._handleResistFingerprintingChanged();break;case kPrefSpoofEnglish:this._handleSpoofEnglishChanged();break;case kPrefLetterboxing:this._handleLetterboxingPrefChanged();break;default:break;}}
contentSizeUpdated(win){this._updateMarginsForTabsInWindow(win);}

_addRFPObservers(){Services.prefs.addObserver(kPrefSpoofEnglish,this);if(this._shouldPromptForLanguagePref()){Services.obs.addObserver(this,kTopicHttpOnModifyRequest);}}
_removeRFPObservers(){try{Services.pref.removeObserver(kPrefSpoofEnglish,this);}catch(e){}
try{Services.obs.removeObserver(this,kTopicHttpOnModifyRequest);}catch(e){}}
_handleResistFingerprintingChanged(){if(Services.prefs.getBoolPref(kPrefResistFingerprinting)){this._addRFPObservers();}else{this._removeRFPObservers();}}
_handleSpoofEnglishChanged(){switch(Services.prefs.getIntPref(kPrefSpoofEnglish)){case 0:
 case 1: if(Services.prefs.prefHasUserValue("javascript.use_us_english_locale")){Services.prefs.clearUserPref("javascript.use_us_english_locale");}


break;case 2: Services.prefs.setCharPref("intl.accept_languages","en-US, en");Services.prefs.setBoolPref("javascript.use_us_english_locale",true);break;default:break;}}
_shouldPromptForLanguagePref(){return(Services.locale.appLocaleAsBCP47.substr(0,2)!=="en"&&Services.prefs.getIntPref(kPrefSpoofEnglish)===0);}
_handleHttpOnModifyRequest(subject,data){
let httpChannel;try{httpChannel=subject.QueryInterface(Ci.nsIHttpChannel);}catch(e){return;}
if(!httpChannel){return;}
let notificationCallbacks=httpChannel.notificationCallbacks;if(!notificationCallbacks){return;}
let loadContext=notificationCallbacks.getInterface(Ci.nsILoadContext);if(!loadContext||!loadContext.isContent){return;}
if(!subject.URI.schemeIs("http")&&!subject.URI.schemeIs("https")){return;}


Services.obs.removeObserver(this,kTopicHttpOnModifyRequest);if(!this._shouldPromptForLanguagePref()){return;}
this._promptForLanguagePreference();

let val=this._getCurrentAcceptLanguageValue(subject.URI);if(val){httpChannel.setRequestHeader("Accept-Language",val,false);}}
_promptForLanguagePreference(){let flags=Services.prompt.STD_YES_NO_BUTTONS;let brandBundle=Services.strings.createBundle("chrome://branding/locale/brand.properties");let brandShortName=brandBundle.GetStringFromName("brandShortName");let navigatorBundle=Services.strings.createBundle("chrome://browser/locale/browser.properties");let message=navigatorBundle.formatStringFromName("privacy.spoof_english",[brandShortName]);let response=Services.prompt.confirmEx(null,"",message,flags,null,null,null,null,{value:false});
Services.prefs.setIntPref(kPrefSpoofEnglish,response==0?2:1);}
_getCurrentAcceptLanguageValue(uri){let channel=Services.io.newChannelFromURI(uri,null, Services.scriptSecurityManager.getSystemPrincipal(),null, Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,Ci.nsIContentPolicy.TYPE_OTHER);let httpChannel;try{httpChannel=channel.QueryInterface(Ci.nsIHttpChannel);}catch(e){return null;}
return httpChannel.getRequestHeader("Accept-Language");}

onLocationChange(aBrowser){this._addOrClearContentMargin(aBrowser);}
_handleLetterboxingPrefChanged(){if(Services.prefs.getBoolPref(kPrefLetterboxing,false)){Services.ww.registerNotification(this);this._registerActor();this._attachAllWindows();}else{this._unregisterActor();this._detachAllWindows();Services.ww.unregisterNotification(this);}}
_registerActor(){ChromeUtils.registerWindowActor("RFPHelper",{parent:{moduleURI:"resource:///actors/RFPHelperParent.jsm",},child:{moduleURI:"resource:///actors/RFPHelperChild.jsm",events:{resize:{},},},allFrames:true,});}
_unregisterActor(){ChromeUtils.unregisterWindowActor("RFPHelper");}


_parseLetterboxingDimensions(aPrefValue){if(!aPrefValue||!aPrefValue.match(/^(?:\d+x\d+,\s*)*(?:\d+x\d+)$/)){if(aPrefValue){Cu.reportError(`Invalid pref value for ${kPrefLetterboxingDimensions}: ${aPrefValue}`);}
return[];}
return aPrefValue.split(",").map(item=>{let sizes=item.split("x").map(size=>parseInt(size,10));return{width:sizes[0],height:sizes[1],};});}
_addOrClearContentMargin(aBrowser){let tab=aBrowser.getTabBrowser().getTabForBrowser(aBrowser);if(!aBrowser.isConnected){return;}

if(tab.isEmpty||aBrowser.contentPrincipal.isSystemPrincipal){this._clearContentViewMargin(aBrowser);}else{this._roundContentView(aBrowser);}}
steppedRange(aDimension){let stepping;if(aDimension<=50){return 0;}else if(aDimension<=500){stepping=50;}else if(aDimension<=1600){stepping=100;}else{stepping=200;}
return(aDimension%stepping)/2;}
async _roundContentView(aBrowser){let logId=Math.random();log("_roundContentView["+logId+"]");let win=aBrowser.ownerGlobal;let browserContainer=aBrowser.getTabBrowser().getBrowserContainer(aBrowser);let{contentWidth,contentHeight,containerWidth,containerHeight,}=await win.promiseDocumentFlushed(()=>{let contentWidth=aBrowser.clientWidth;let contentHeight=aBrowser.clientHeight;let containerWidth=browserContainer.clientWidth;let containerHeight=browserContainer.clientHeight;


let findBar=win.gFindBarInitialized?win.gFindBar:undefined;let findBarOffset=findBar&&!findBar.hidden?findBar.clientHeight+1:0;let devtools=browserContainer.getElementsByClassName("devtools-toolbox-bottom-iframe");let devtoolsOffset=devtools.length?devtools[0].clientHeight:0;return{contentWidth,contentHeight,containerWidth,containerHeight:containerHeight-findBarOffset-devtoolsOffset,};});log("_roundContentView["+
logId+"] contentWidth="+
contentWidth+" contentHeight="+
contentHeight+" containerWidth="+
containerWidth+" containerHeight="+
containerHeight+" ");let calcMargins=(aWidth,aHeight)=>{let result;log("_roundContentView["+
logId+"] calcMargins("+
aWidth+", "+
aHeight+")");
if(!this._letterboxingDimensions.length){result={width:this.steppedRange(aWidth),height:this.steppedRange(aHeight),};log("_roundContentView["+
logId+"] calcMargins("+
aWidth+", "+
aHeight+") = "+
result.width+" x "+
result.height);return result;}
let matchingArea=aWidth*aHeight;let minWaste=Number.MAX_SAFE_INTEGER;let targetDimensions=undefined;for(let dim of this._letterboxingDimensions){
if(dim.width>aWidth||dim.height>aHeight){continue;}
let waste=matchingArea-dim.width*dim.height;if(waste>=0&&waste<minWaste){targetDimensions=dim;minWaste=waste;}}


if(!targetDimensions){result={width:0,height:0,};}else{result={width:(aWidth-targetDimensions.width)/2,height:(aHeight-targetDimensions.height)/2,};}
log("_roundContentView["+
logId+"] calcMargins("+
aWidth+", "+
aHeight+") = "+
result.width+" x "+
result.height);return result;};

let margins=calcMargins(containerWidth,containerHeight);if(aBrowser.style.margin==`${margins.height}px ${margins.width}px`){log("_roundContentView["+logId+"] is_rounded == true");if(this._isLetterboxingTesting){log("_roundContentView["+
logId+"] is_rounded == true test:letterboxing:update-margin-finish");Services.obs.notifyObservers(null,"test:letterboxing:update-margin-finish");}
return;}
win.requestAnimationFrame(()=>{log("_roundContentView["+
logId+"] setting margins to "+
margins.width+" x "+
margins.height);
aBrowser.style.margin=`${margins.height}px ${margins.width}px`;});}
_clearContentViewMargin(aBrowser){aBrowser.ownerGlobal.requestAnimationFrame(()=>{aBrowser.style.margin="";});}
_updateMarginsForTabsInWindow(aWindow){let tabBrowser=aWindow.gBrowser;for(let tab of tabBrowser.tabs){let browser=tab.linkedBrowser;this._addOrClearContentMargin(browser);}}
_attachWindow(aWindow){aWindow.gBrowser.addTabsProgressListener(this);aWindow.addEventListener("TabOpen",this);this._updateMarginsForTabsInWindow(aWindow);}
_attachAllWindows(){let windowList=Services.wm.getEnumerator("navigator:browser");while(windowList.hasMoreElements()){let win=windowList.getNext();if(win.closed||!win.gBrowser){continue;}
this._attachWindow(win);}}
_detachWindow(aWindow){let tabBrowser=aWindow.gBrowser;tabBrowser.removeTabsProgressListener(this);aWindow.removeEventListener("TabOpen",this);for(let tab of tabBrowser.tabs){let browser=tab.linkedBrowser;this._clearContentViewMargin(browser);}}
_detachAllWindows(){let windowList=Services.wm.getEnumerator("navigator:browser");while(windowList.hasMoreElements()){let win=windowList.getNext();if(win.closed||!win.gBrowser){continue;}
this._detachWindow(win);}}
_handleDOMWindowOpened(win){let self=this;win.addEventListener("load",()=>{
if(win.document.documentElement.getAttribute("windowtype")!=="navigator:browser"){return;}
self._attachWindow(win);},{once:true});}}
let RFPHelper=new _RFPHelper();