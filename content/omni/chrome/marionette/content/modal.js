"use strict";const EXPORTED_SYMBOLS=["modal"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());const COMMON_DIALOG="chrome://global/content/commonDialog.xhtml";const isFirefox=()=>Services.appinfo.ID=="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";this.modal={ACTION_CLOSED:"closed",ACTION_OPENED:"opened",};modal.findModalDialogs=function(context){
for(let win of Services.wm.getEnumerator(null)){
if(win.document.documentURI===COMMON_DIALOG&&win.opener&&win.opener===context.window){return new modal.Dialog(()=>context,Cu.getWeakReference(win));}}

if(context.tab&&context.tabBrowser.getTabModalPromptBox){let contentBrowser=context.contentBrowser;let promptManager=context.tabBrowser.getTabModalPromptBox(contentBrowser);let prompts=promptManager.listPrompts();if(prompts.length){return new modal.Dialog(()=>context,null);}}
if(context.tab&&context.tabBrowser.getTabDialogBox){let contentBrowser=context.contentBrowser;let dialogManager=context.tabBrowser.getTabDialogBox(contentBrowser)._dialogManager;let dialogs=dialogManager._dialogs.filter(dialog=>dialog._openedURL===COMMON_DIALOG);if(dialogs.length){return new modal.Dialog(()=>context,Cu.getWeakReference(dialogs[0]._frame.contentWindow));}}
return null;};modal.DialogObserver=class{constructor(){this.callbacks=new Set();this.register();}
register(){Services.obs.addObserver(this,"common-dialog-loaded");Services.obs.addObserver(this,"tabmodal-dialog-loaded");Services.obs.addObserver(this,"toplevel-window-ready"); for(let win of Services.wm.getEnumerator(null)){win.addEventListener("DOMModalDialogClosed",this);}}
unregister(){Services.obs.removeObserver(this,"common-dialog-loaded");Services.obs.removeObserver(this,"tabmodal-dialog-loaded");Services.obs.removeObserver(this,"toplevel-window-ready"); for(let win of Services.wm.getEnumerator(null)){win.removeEventListener("DOMModalDialogClosed",this);}}
cleanup(){this.callbacks.clear();this.unregister();}
handleEvent(event){logger.trace(`Received event ${event.type}`);let chromeWin=event.target.opener?event.target.opener.ownerGlobal:event.target.ownerGlobal;let targetRef=Cu.getWeakReference(event.target);this.callbacks.forEach(callback=>{callback(modal.ACTION_CLOSED,targetRef,chromeWin);});}
observe(subject,topic){logger.trace(`Received observer notification ${topic}`);switch(topic){case"common-dialog-loaded":case"tabmodal-dialog-loaded":let chromeWin=subject.opener?subject.opener.ownerGlobal:subject.ownerGlobal; let targetRef=Cu.getWeakReference(subject);this.callbacks.forEach(callback=>{callback(modal.ACTION_OPENED,targetRef,chromeWin);});break;case"toplevel-window-ready":subject.addEventListener("DOMModalDialogClosed",this);break;}}
add(callback){if(this.callbacks.has(callback)){return;}
this.callbacks.add(callback);}
remove(callback){if(!this.callbacks.has(callback)){return;}
this.callbacks.delete(callback);}};modal.Dialog=class{constructor(curBrowserFn,winRef=undefined){this.curBrowserFn_=curBrowserFn;this.win_=winRef;}
get curBrowser_(){return this.curBrowserFn_();}
get window(){if(this.win_){let win=this.win_.get();if(win&&win.parent){return win;}}
return null;}
get tabModal(){let win=this.window;if(win){return win.Dialog;}
return this.curBrowser_.getTabModal();}
get args(){let tm=this.tabModal;return tm?tm.args:null;}
get ui(){let tm=this.tabModal;return tm?tm.ui:null;}};