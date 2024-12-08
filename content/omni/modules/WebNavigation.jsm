//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["WebNavigation"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");ChromeUtils.defineModuleGetter(this,"BrowserWindowTracker","resource:///modules/BrowserWindowTracker.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");ChromeUtils.defineModuleGetter(this,"UrlbarUtils","resource:///modules/UrlbarUtils.jsm");ChromeUtils.defineModuleGetter(this,"ClickHandlerParent","resource:///actors/ClickHandlerParent.jsm");
const RECENT_DATA_THRESHOLD=5*1000000;var Manager={listeners:new Map(),init(){ this.recentTabTransitionData=new WeakMap();

this.createdNavigationTargetByOuterWindowId=new Map();Services.obs.addObserver(this,"urlbar-user-start-navigation",true);Services.obs.addObserver(this,"webNavigation-createdNavigationTarget");if(AppConstants.MOZ_BUILD_APP=="browser"){ClickHandlerParent.addContentClickListener(this);}
Services.mm.addMessageListener("Extension:DOMContentLoaded",this);Services.mm.addMessageListener("Extension:StateChange",this);Services.mm.addMessageListener("Extension:DocumentChange",this);Services.mm.addMessageListener("Extension:HistoryChange",this);Services.mm.addMessageListener("Extension:CreatedNavigationTarget",this);Services.mm.loadFrameScript("resource://gre/modules/WebNavigationContent.js",true);},uninit(){Services.obs.removeObserver(this,"urlbar-user-start-navigation");Services.obs.removeObserver(this,"webNavigation-createdNavigationTarget");if(AppConstants.MOZ_BUILD_APP=="browser"){ClickHandlerParent.removeContentClickListener(this);}
Services.mm.removeMessageListener("Extension:StateChange",this);Services.mm.removeMessageListener("Extension:DocumentChange",this);Services.mm.removeMessageListener("Extension:HistoryChange",this);Services.mm.removeMessageListener("Extension:DOMContentLoaded",this);Services.mm.removeMessageListener("Extension:CreatedNavigationTarget",this);Services.mm.removeDelayedFrameScript("resource://gre/modules/WebNavigationContent.js");Services.mm.broadcastAsyncMessage("Extension:DisableWebNavigation");this.recentTabTransitionData=new WeakMap();this.createdNavigationTargetByOuterWindowId.clear();},addListener(type,listener,filters,context){if(this.listeners.size==0){this.init();}
if(!this.listeners.has(type)){this.listeners.set(type,new Map());}
let listeners=this.listeners.get(type);listeners.set(listener,{filters,context});},removeListener(type,listener){let listeners=this.listeners.get(type);if(!listeners){return;}
listeners.delete(listener);if(listeners.size==0){this.listeners.delete(type);}
if(this.listeners.size==0){this.uninit();}},QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]),observe:function(subject,topic,data){if(topic=="urlbar-user-start-navigation"){this.onURLBarUserStartNavigation(subject.wrappedJSObject);}else if(topic=="webNavigation-createdNavigationTarget"){

const{createdTabBrowser,url,sourceFrameID,sourceTabBrowser,}=subject.wrappedJSObject;this.fire("onCreatedNavigationTarget",createdTabBrowser,{},{sourceTabBrowser,sourceFrameId:sourceFrameID,url,});}},onURLBarUserStartNavigation(acData){let tabTransitionData={from_address_bar:true,};if(!acData.result){tabTransitionData.typed=true;}else{switch(acData.result.type){case UrlbarUtils.RESULT_TYPE.KEYWORD:tabTransitionData.keyword=true;break;case UrlbarUtils.RESULT_TYPE.SEARCH:tabTransitionData.generated=true;break;case UrlbarUtils.RESULT_TYPE.URL:if(acData.result.source==UrlbarUtils.RESULT_SOURCE.BOOKMARKS){tabTransitionData.auto_bookmark=true;}else{tabTransitionData.typed=true;}
break;case UrlbarUtils.RESULT_TYPE.REMOTE_TAB:
tabTransitionData.typed=true;break;case UrlbarUtils.RESULT_TYPE.TAB_SWITCH:
case UrlbarUtils.RESULT_TYPE.OMNIBOX:
case UrlbarUtils.RESULT_TYPE.TIP:
throw new Error(`Unexpectedly received notification for ${acData.result.type}`);default:Cu.reportError(`Received unexpected result type ${acData.result.type}, falling back to typed transition.`);tabTransitionData.typed=true;}}
this.setRecentTabTransitionData(tabTransitionData);},setRecentTabTransitionData(tabTransitionData){let window=BrowserWindowTracker.getTopWindow();if(window&&window.gBrowser&&window.gBrowser.selectedTab&&window.gBrowser.selectedTab.linkedBrowser){let browser=window.gBrowser.selectedTab.linkedBrowser;let prevData=this.getAndForgetRecentTabTransitionData(browser);let newData=Object.assign({time:Date.now()},prevData,tabTransitionData);this.recentTabTransitionData.set(browser,newData);}},getAndForgetRecentTabTransitionData(browser){let data=this.recentTabTransitionData.get(browser);this.recentTabTransitionData.delete(browser);
if(!data||data.time-Date.now()>RECENT_DATA_THRESHOLD){return{};}
return data;},receiveMessage({name,data,target}){switch(name){case"Extension:StateChange":this.onStateChange(target,data);break;case"Extension:DocumentChange":this.onDocumentChange(target,data);break;case"Extension:HistoryChange":this.onHistoryChange(target,data);break;case"Extension:DOMContentLoaded":this.onLoad(target,data);break;case"Extension:CreatedNavigationTarget":this.onCreatedNavigationTarget(target,data);break;}},onContentClick(target,data){ if(data.href&&!data.bookmark){let ownerWin=target.ownerGlobal;let where=ownerWin.whereToOpenLink(data);if(where=="current"){this.setRecentTabTransitionData({link:true});}}},onCreatedNavigationTarget(browser,data){const{createdOuterWindowId,isSourceTab,sourceFrameId,url}=data;


const pairedMessage=this.createdNavigationTargetByOuterWindowId.get(createdOuterWindowId);if(!isSourceTab){if(pairedMessage){Services.console.logStringMessage(`Discarding onCreatedNavigationTarget for ${createdOuterWindowId}: `+"unexpected pending data while receiving the created tab data");}

const browserWeakRef=Cu.getWeakReference(browser);this.createdNavigationTargetByOuterWindowId.set(createdOuterWindowId,{browserWeakRef,data,});return;}
if(!pairedMessage){




Services.console.logStringMessage(`Discarding onCreatedNavigationTarget for ${createdOuterWindowId}: `+"received source tab data without any created tab data available");return;}
this.createdNavigationTargetByOuterWindowId.delete(createdOuterWindowId);let sourceTabBrowser=browser;let createdTabBrowser=pairedMessage.browserWeakRef.get();if(!createdTabBrowser){Services.console.logStringMessage(`Discarding onCreatedNavigationTarget for ${createdOuterWindowId}: `+"the created tab has been already destroyed");return;}
this.fire("onCreatedNavigationTarget",createdTabBrowser,{},{sourceTabBrowser,sourceFrameId,url,});},onStateChange(browser,data){let stateFlags=data.stateFlags;if(stateFlags&Ci.nsIWebProgressListener.STATE_IS_WINDOW){let url=data.requestURL;if(stateFlags&Ci.nsIWebProgressListener.STATE_START){this.fire("onBeforeNavigate",browser,data,{url});}else if(stateFlags&Ci.nsIWebProgressListener.STATE_STOP){if(Components.isSuccessCode(data.status)){this.fire("onCompleted",browser,data,{url});}else{let error=`Error code ${data.status}`;this.fire("onErrorOccurred",browser,data,{error,url});}}}},onDocumentChange(browser,data){let extra={url:data.location,frameTransitionData:data.frameTransitionData,tabTransitionData:this.getAndForgetRecentTabTransitionData(browser),};this.fire("onCommitted",browser,data,extra);},onHistoryChange(browser,data){let extra={url:data.location,frameTransitionData:data.frameTransitionData,tabTransitionData:this.getAndForgetRecentTabTransitionData(browser),};if(data.isReferenceFragmentUpdated){this.fire("onReferenceFragmentUpdated",browser,data,extra);}else if(data.isHistoryStateUpdated){this.fire("onHistoryStateUpdated",browser,data,extra);}},onLoad(browser,data){this.fire("onDOMContentLoaded",browser,data,{url:data.url});},fire(type,browser,data,extra){let listeners=this.listeners.get(type);if(!listeners){return;}
let details={browser,frameId:data.frameId,};if(data.parentFrameId!==undefined){details.parentFrameId=data.parentFrameId;}
for(let prop in extra){details[prop]=extra[prop];}
for(let[listener,{filters,context}]of listeners){if(context&&!context.privateBrowsingAllowed&&PrivateBrowsingUtils.isBrowserPrivate(browser)){continue;}
if(!filters||filters.matches(extra.url)){listener(details);}}},};const EVENTS=["onBeforeNavigate","onCommitted","onDOMContentLoaded","onCompleted","onErrorOccurred","onReferenceFragmentUpdated","onHistoryStateUpdated","onCreatedNavigationTarget",];var WebNavigation={};for(let event of EVENTS){WebNavigation[event]={addListener:Manager.addListener.bind(Manager,event),removeListener:Manager.removeListener.bind(Manager,event),};}