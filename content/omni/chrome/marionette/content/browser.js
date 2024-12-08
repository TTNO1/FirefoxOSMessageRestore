"use strict";const EXPORTED_SYMBOLS=["browser","Context","WindowState"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{element:"chrome://marionette/content/element.js",error:"chrome://marionette/content/error.js",Log:"chrome://marionette/content/log.js",MessageManagerDestroyedPromise:"chrome://marionette/content/sync.js",waitForEvent:"chrome://marionette/content/sync.js",waitForObserverTopic:"chrome://marionette/content/sync.js",WebElementEventTarget:"chrome://marionette/content/dom.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());this.browser={};class Context{static fromString(s){switch(s){case"chrome":return Context.Chrome;case"content":return Context.Content;default:throw new TypeError(`Unknown context: ${s}`);}}}
Context.Chrome="chrome";Context.Content="content";this.Context=Context;class MobileTabBrowser{constructor(window){this.window=window;}
get tabs(){return[this.window.tab];}
get selectedTab(){return this.window.tab;}
set selectedTab(tab){if(tab!=this.selectedTab){throw new Error("GeckoView only supports a single tab");}

const event=this.window.CustomEvent("TabSelect",{bubbles:true,cancelable:false,detail:{previousTab:this.selectedTab,},});this.window.document.dispatchEvent(event);}}
browser.getBrowserForTab=function(tab){if(tab&&"linkedBrowser"in tab){return tab.linkedBrowser;}
return null;};browser.getTabBrowser=function(window){ if(Services.androidBridge){return new MobileTabBrowser(window);}else if("gBrowser"in window){return window.gBrowser;}else if(window.document.getElementById("tabmail")){return window.document.getElementById("tabmail");}else if(window.document.getElementById("systemapp")){return window.MarionetteHelper;}
return null;};browser.Context=class{constructor(window,driver){this.window=window;this.driver=driver;
this.tabBrowser=browser.getTabBrowser(this.window);this.knownFrames=[]; this.newSession=true;this.seenEls=new element.Store();




this.tab=null;this.frameRegsPending=0;this.getIdForBrowser=driver.getIdForBrowser.bind(driver);this.updateIdForBrowser=driver.updateIdForBrowser.bind(driver);}
get contentBrowser(){if(this.tab){return browser.getBrowserForTab(this.tab);}else if(this.tabBrowser&&this.driver.isReftestBrowser(this.tabBrowser)){return this.tabBrowser;}
return null;}
get messageManager(){if(this.contentBrowser){return this.contentBrowser.messageManager;}
return null;}
get closed(){return this.contentBrowser===null;}
get curFrameId(){let rv=null;if(this.tab||this.driver.isReftestBrowser(this.contentBrowser)){rv=this.getIdForBrowser(this.contentBrowser);}
return rv;}
get rect(){return{x:this.window.screenX,y:this.window.screenY,width:this.window.outerWidth,height:this.window.outerHeight,};}
getTabModal(){let br=this.contentBrowser;if(!br.hasAttribute("tabmodalPromptShowing")){return null;}
let modalElements=br.parentNode.getElementsByTagName("tabmodalprompt");return br.tabModalPromptBox.getPrompt(modalElements[0]);}
async closeWindow(){const destroyed=waitForObserverTopic("xul-window-destroyed",{checkFn:()=>this.window&&this.window.closed,});this.window.close();return destroyed;}
async focusWindow(){if(Services.focus.activeWindow!=this.window){let activated=waitForEvent(this.window,"activate");let focused=waitForEvent(this.window,"focus",{capture:true});this.window.focus();await Promise.all([activated,focused]);}}
async openBrowserWindow(focus=false,isPrivate=false){switch(this.driver.appName){case"firefox":
const win=this.window.OpenBrowserWindow({private:isPrivate});const activated=waitForEvent(win,"activate");const focused=waitForEvent(win,"focus",{capture:true});const startup=waitForObserverTopic("browser-delayed-startup-finished",{checkFn:subject=>subject==win,});win.focus();await Promise.all([activated,focused,startup]);
if(!focus){await this.focusWindow();}
return win;default:throw new error.UnsupportedOperationError(`openWindow() not supported in ${this.driver.appName}`);}}
closeTab(){
if(!this.tabBrowser||!this.tabBrowser.tabs||this.tabBrowser.tabs.length===1||!this.tab){return this.closeWindow();}
let destroyed=new MessageManagerDestroyedPromise(this.messageManager);let tabClosed;switch(this.driver.appName){case"firefox":tabClosed=waitForEvent(this.tab,"TabClose");this.tabBrowser.removeTab(this.tab);break;default:throw new error.UnsupportedOperationError(`closeTab() not supported in ${this.driver.appName}`);}
return Promise.all([destroyed,tabClosed]);}
async openTab(focus=false){let tab=null;switch(this.driver.appName){case"firefox":const opened=waitForEvent(this.window,"TabOpen");this.window.BrowserOpenTab();await opened;tab=this.tabBrowser.selectedTab;if(!focus){this.tabBrowser.selectedTab=this.tab;}
break;default:throw new error.UnsupportedOperationError(`openTab() not supported in ${this.driver.appName}`);}
return tab;}
async switchToTab(index,window=undefined,focus=true){let currentTab=this.tabBrowser.selectedTab;if(window){this.window=window;this.tabBrowser=browser.getTabBrowser(this.window);}
if(!this.tabBrowser){return null;}
if(typeof index=="undefined"){this.tab=this.tabBrowser.selectedTab;}else{this.tab=this.tabBrowser.tabs[index];}
if(focus&&this.tab!=currentTab){const tabSelected=waitForEvent(this.window,"TabSelect");this.tabBrowser.selectedTab=this.tab;if(this.this.driver.appName!=="b2g"){await tabSelected;}}
return this.tab;}
register(uid,target){if(this.tabBrowser){
if(!this.tab){this.switchToTab();}
if(target===this.contentBrowser){this.updateIdForBrowser(this.contentBrowser,uid);}} 
this.knownFrames.push(uid);}};browser.Windows=class extends Map{set(id,win){let wref=Cu.getWeakReference(win);super.set(id,wref);return this;}
get(id){let wref=super.get(id);if(!wref){throw new RangeError();}
return wref.get();}};const WindowState={Maximized:"maximized",Minimized:"minimized",Normal:"normal",Fullscreen:"fullscreen",from(windowState){switch(windowState){case 1:return WindowState.Maximized;case 2:return WindowState.Minimized;case 3:return WindowState.Normal;case 4:return WindowState.Fullscreen;default:throw new TypeError(`Unknown window state: ${windowState}`);}},};this.WindowState=WindowState;