"use strict";var EXPORTED_SYMBOLS=["PrintingChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"setTimeout","resource://gre/modules/Timer.jsm");ChromeUtils.defineModuleGetter(this,"ReaderMode","resource://gre/modules/ReaderMode.jsm");let gPrintPreviewInitializingInfo=null;let gPendingPreviewsMap=new Map();class PrintingChild extends JSWindowActorChild{actorCreated(){
let listener=gPendingPreviewsMap.get(this.browsingContext.id);if(listener){listener.actor=this;}}





get shouldSavePrintSettings(){return Services.prefs.getBoolPref("print.save_print_settings");}
handleEvent(event){switch(event.type){case"PrintingError":{let win=event.target.defaultView;let wbp=win.getInterface(Ci.nsIWebBrowserPrint);let nsresult=event.detail;this.sendAsyncMessage("Printing:Error",{isPrinting:wbp.doingPrint,nsresult,});break;}
case"printPreviewUpdate":{let info=gPrintPreviewInitializingInfo;if(!info){
return;}

if(!info.entered){gPendingPreviewsMap.delete(this.browsingContext.id);info.entered=true;this.sendAsyncMessage("Printing:Preview:Entered",{failed:false,changingBrowsers:info.changingBrowsers,});if(info.nextRequest){Services.tm.dispatchToMainThread(info.nextRequest);}}
this.updatePageCount();break;}}}
receiveMessage(message){let data=message.data;switch(message.name){case"Printing:Preview:Enter":{this.enterPrintPreview(BrowsingContext.get(data.browsingContextId),data.simplifiedMode,data.changingBrowsers,data.lastUsedPrinterName);break;}
case"Printing:Preview:Exit":{this.exitPrintPreview();break;}
case"Printing:Preview:Navigate":{this.navigate(data.navType,data.pageNum);break;}
case"Printing:Preview:ParseDocument":{return this.parseDocument(data.URL,Services.wm.getOuterWindowWithId(data.windowID));}}
return undefined;}
getPrintSettings(lastUsedPrinterName){try{let PSSVC=Cc["@mozilla.org/gfx/printsettings-service;1"].getService(Ci.nsIPrintSettingsService);let printSettings=PSSVC.newPrintSettings;if(!printSettings.printerName){printSettings.printerName=lastUsedPrinterName;} 
PSSVC.initPrintSettingsFromPrinter(printSettings.printerName,printSettings); PSSVC.initPrintSettingsFromPrefs(printSettings,true,printSettings.kInitSaveAll);return printSettings;}catch(e){Cu.reportError(e);}
return null;}
async parseDocument(URL,contentWindow){
let thisWindow=this.contentWindow;
let article;try{article=await ReaderMode.parseDocument(contentWindow.document);}catch(ex){Cu.reportError(ex);}


let actor=thisWindow.windowGlobalChild.getActor("Printing");let webProgressListener={onStateChange(webProgress,req,flags,status){if(flags&Ci.nsIWebProgressListener.STATE_STOP){webProgress.removeProgressListener(webProgressListener);let domUtils=contentWindow.windowUtils;
if(domUtils.isMozAfterPaintPending){let onPaint=function(){contentWindow.removeEventListener("MozAfterPaint",onPaint);actor.sendAsyncMessage("Printing:Preview:ReaderModeReady");};contentWindow.addEventListener("MozAfterPaint",onPaint);setTimeout(()=>{contentWindow.removeEventListener("MozAfterPaint",onPaint);actor.sendAsyncMessage("Printing:Preview:ReaderModeReady");},100);}else{actor.sendAsyncMessage("Printing:Preview:ReaderModeReady");}}},QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener","nsISupportsWeakReference","nsIObserver",]),};let webProgress=thisWindow.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);webProgress.addProgressListener(webProgressListener,Ci.nsIWebProgress.NOTIFY_STATE_REQUEST);let document=thisWindow.document;document.head.innerHTML="";

let headBaseElement=document.createElement("base");headBaseElement.setAttribute("href",URL);document.head.appendChild(headBaseElement); let headStyleElement=document.createElement("link");headStyleElement.setAttribute("rel","stylesheet");headStyleElement.setAttribute("href","chrome://global/skin/aboutReader.css");headStyleElement.setAttribute("type","text/css");document.head.appendChild(headStyleElement); headStyleElement=document.createElement("link");headStyleElement.setAttribute("rel","stylesheet");headStyleElement.setAttribute("href","chrome://global/content/simplifyMode.css");headStyleElement.setAttribute("type","text/css");document.head.appendChild(headStyleElement);document.body.innerHTML=""; let containerElement=document.createElement("div");containerElement.setAttribute("id","container");document.body.appendChild(containerElement);if(article){ document.title=article.title; let headerElement=document.createElement("div");headerElement.setAttribute("id","reader-header");headerElement.setAttribute("class","header");containerElement.appendChild(headerElement); let titleElement=document.createElement("h1");titleElement.setAttribute("id","reader-title");titleElement.textContent=article.title;headerElement.appendChild(titleElement);let bylineElement=document.createElement("div");bylineElement.setAttribute("id","reader-credits");bylineElement.setAttribute("class","credits");bylineElement.textContent=article.byline;headerElement.appendChild(bylineElement); headerElement.style.display="block"; let contentElement=document.createElement("div");contentElement.setAttribute("class","content");containerElement.appendChild(contentElement); let readerContent=document.createElement("div");readerContent.setAttribute("id","moz-reader-content");contentElement.appendChild(readerContent);let articleUri=Services.io.newURI(article.url);let parserUtils=Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);let contentFragment=parserUtils.parseFragment(article.content,Ci.nsIParserUtils.SanitizerDropForms|Ci.nsIParserUtils.SanitizerAllowStyle,false,articleUri,readerContent);readerContent.appendChild(contentFragment); readerContent.style.display="block";}else{let aboutReaderStrings=Services.strings.createBundle("chrome://global/locale/aboutReader.properties");let errorMessage=aboutReaderStrings.GetStringFromName("aboutReader.loadError");document.title=errorMessage; let readerMessageElement=document.createElement("div");readerMessageElement.setAttribute("class","reader-message");readerMessageElement.textContent=errorMessage;containerElement.appendChild(readerMessageElement); readerMessageElement.style.display="block";}}
enterPrintPreview(browsingContext,simplifiedMode,changingBrowsers,lastUsedPrinterName){const{docShell}=this;try{let contentWindow=browsingContext.window;let printSettings=this.getPrintSettings(lastUsedPrinterName);printSettings.showPrintProgress=!Services.prefs.getBoolPref("print.tab_modal.enabled",false);

if(printSettings&&simplifiedMode){printSettings.docURL=contentWindow.document.baseURI;}
let browserContextId=this.browsingContext.id;

let printPreviewInitialize=()=>{

if(docShell.isBeingDestroyed()){this.sendAsyncMessage("Printing:Preview:Entered",{failed:true,});return;}
try{let listener=new PrintingListener(this);gPendingPreviewsMap.set(browserContextId,listener);gPrintPreviewInitializingInfo={changingBrowsers};contentWindow.printPreview(printSettings,listener,docShell);}catch(error){Cu.reportError(error);gPrintPreviewInitializingInfo=null;this.sendAsyncMessage("Printing:Preview:Entered",{failed:true,});}};


if(gPrintPreviewInitializingInfo&&!gPrintPreviewInitializingInfo.entered){gPrintPreviewInitializingInfo.nextRequest=printPreviewInitialize;}else{Services.tm.dispatchToMainThread(printPreviewInitialize);}}catch(error){Cu.reportError(error);this.sendAsyncMessage("Printing:Preview:Entered",{failed:true,});}}
exitPrintPreview(){gPrintPreviewInitializingInfo=null;this.docShell.exitPrintPreview();}
updatePageCount(){let cv=this.docShell.contentViewer;cv.QueryInterface(Ci.nsIWebBrowserPrint);this.sendAsyncMessage("Printing:Preview:UpdatePageCount",{numPages:cv.printPreviewNumPages,totalPages:cv.rawNumPages,});}
navigate(navType,pageNum){let cv=this.docShell.contentViewer;cv.QueryInterface(Ci.nsIWebBrowserPrint);cv.printPreviewScrollToPage(navType,pageNum);}}
PrintingChild.prototype.QueryInterface=ChromeUtils.generateQI(["nsIPrintingPromptService",]);function PrintingListener(actor){this.actor=actor;}
PrintingListener.prototype={QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener"]),onStateChange(aWebProgress,aRequest,aStateFlags,aStatus){this.actor.sendAsyncMessage("Printing:Preview:StateChange",{stateFlags:aStateFlags,status:aStatus,});},onProgressChange(aWebProgress,aRequest,aCurSelfProgress,aMaxSelfProgress,aCurTotalProgress,aMaxTotalProgress){this.actor.sendAsyncMessage("Printing:Preview:ProgressChange",{curSelfProgress:aCurSelfProgress,maxSelfProgress:aMaxSelfProgress,curTotalProgress:aCurTotalProgress,maxTotalProgress:aMaxTotalProgress,});},onLocationChange(aWebProgress,aRequest,aLocation,aFlags){},onStatusChange(aWebProgress,aRequest,aStatus,aMessage){},onSecurityChange(aWebProgress,aRequest,aState){},onContentBlockingEvent(aWebProgress,aRequest,aEvent){},};