
var{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");var gViewSourceUtils={mnsIWebBrowserPersist:Ci.nsIWebBrowserPersist,mnsIWebProgress:Ci.nsIWebProgress,mnsIWebPageDescriptor:Ci.nsIWebPageDescriptor,getViewSourceActor(aBrowsingContext){return aBrowsingContext.currentWindowGlobal.getActor("ViewSource");},async viewSource(aArgs){if(Services.prefs.getBoolPref("view_source.editor.external")){try{await this.openInExternalEditor(aArgs);return;}catch(data){}}
let browserWin=Services.wm.getMostRecentWindow("navigator:browser");if(browserWin&&browserWin.BrowserViewSourceOfDocument){browserWin.BrowserViewSourceOfDocument(aArgs);return;}
let utils=this;Services.ww.registerNotification(function onOpen(win,topic){if(win.document.documentURI!=="about:blank"||topic!=="domwindowopened"){return;}
Services.ww.unregisterNotification(onOpen);win.addEventListener("load",()=>{aArgs.viewSourceBrowser=win.gBrowser.selectedTab.linkedBrowser;utils.viewSourceInBrowser(aArgs);},{once:true});});window.top.openWebLinkIn("about:blank","current");},viewSourceInBrowser({URL,viewSourceBrowser,browser,outerWindowID,lineNumber,}){if(!URL){throw new Error("Must supply a URL when opening view source.");}
if(browser){
if(viewSourceBrowser.remoteType!=browser.remoteType){

throw new Error("View source browser's remoteness mismatch");}}else if(outerWindowID){throw new Error("Must supply the browser if passing the outerWindowID");}
let viewSourceActor=this.getViewSourceActor(viewSourceBrowser.browsingContext);viewSourceActor.sendAsyncMessage("ViewSource:LoadSource",{URL,outerWindowID,lineNumber,});},async viewPartialSourceInBrowser(aBrowsingContext,aGetBrowserFn){let sourceActor=this.getViewSourceActor(aBrowsingContext);if(sourceActor){let data=await sourceActor.sendQuery("ViewSource:GetSelection",{});let targetActor=this.getViewSourceActor(aGetBrowserFn().browsingContext);targetActor.sendAsyncMessage("ViewSource:LoadSourceWithSelection",data);}},buildEditorArgs(aPath,aLineNumber){
var editorArgs=[];var args=Services.prefs.getCharPref("view_source.editor.args");if(args){args=args.replace("%LINE%",aLineNumber||"0");const argumentRE=/"([^"]+)"|(\S+)/g;while(argumentRE.test(args)){editorArgs.push(RegExp.$1||RegExp.$2);}}
editorArgs.push(aPath);return editorArgs;},openInExternalEditor(aArgs){return new Promise((resolve,reject)=>{let data;let{URL,browser,lineNumber}=aArgs;data={url:URL,lineNumber,isPrivate:false,};if(browser){data.doc={characterSet:browser.characterSet,contentType:browser.documentContentType,title:browser.contentTitle,cookieJarSettings:browser.cookieJarSettings,};data.isPrivate=PrivateBrowsingUtils.isBrowserPrivate(browser);}
try{var editor=this.getExternalViewSourceEditor();if(!editor){reject(data);return;} 
var charset=data.doc?data.doc.characterSet:null;var uri=Services.io.newURI(data.url,charset);data.uri=uri;var path;var contentType=data.doc?data.doc.contentType:null;var cookieJarSettings=data.doc?data.doc.cookieJarSettings:null;if(uri.scheme=="file"){ path=uri.QueryInterface(Ci.nsIFileURL).file.path;var editorArgs=this.buildEditorArgs(path,data.lineNumber);editor.runw(false,editorArgs,editorArgs.length);resolve(data);}else{ this.viewSourceProgressListener.contentLoaded=false;this.viewSourceProgressListener.editor=editor;this.viewSourceProgressListener.resolve=resolve;this.viewSourceProgressListener.reject=reject;this.viewSourceProgressListener.data=data;var file=this.getTemporaryFile(uri,data.doc,contentType);this.viewSourceProgressListener.file=file;var webBrowserPersist=Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(this.mnsIWebBrowserPersist);webBrowserPersist.persistFlags=this.mnsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;webBrowserPersist.progressListener=this.viewSourceProgressListener;let ssm=Services.scriptSecurityManager;let principal=ssm.createContentPrincipal(data.uri,browser.contentPrincipal.originAttributes);webBrowserPersist.savePrivacyAwareURI(uri,principal,null,null,cookieJarSettings,null,null,file,Ci.nsIContentPolicy.TYPE_SAVEAS_DOWNLOAD,data.isPrivate);let helperService=Cc["@mozilla.org/uriloader/external-helper-app-service;1"].getService(Ci.nsPIExternalAppLauncher);if(data.isPrivate){ helperService.deleteTemporaryPrivateFileWhenPossible(file);}else{ helperService.deleteTemporaryFileOnExit(file);}}}catch(ex){Cu.reportError(ex);reject(data);}});}, getExternalViewSourceEditor(){try{let viewSourceAppPath=Services.prefs.getComplexValue("view_source.editor.path",Ci.nsIFile);let editor=Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);editor.init(viewSourceAppPath);return editor;}catch(ex){Cu.reportError(ex);}
return null;},viewSourceProgressListener:{mnsIWebProgressListener:Ci.nsIWebProgressListener,QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener","nsISupportsWeakReference",]),destroy(){if(this.webShell){this.webShell.QueryInterface(Ci.nsIBaseWindow).destroy();}
this.webShell=null;this.editor=null;this.resolve=null;this.reject=null;this.data=null;this.file=null;},

onStateChange(aProgress,aRequest,aFlag,aStatus){if(aFlag&this.mnsIWebProgressListener.STATE_STOP&&aStatus==0){if(!this.webShell){
this.onContentLoaded();return 0;}
var webNavigation=this.webShell.QueryInterface(Ci.nsIWebNavigation);if(webNavigation.document.readyState=="complete"){this.onContentLoaded();}else{webNavigation.document.addEventListener("DOMContentLoaded",this.onContentLoaded.bind(this));}}
return 0;},onContentLoaded(){
if(this.contentLoaded){return;}
try{if(!this.file){

 this.file=gViewSourceUtils.getTemporaryFile(this.data.uri,this.data.doc,this.data.doc.contentType);var webNavigation=this.webShell.QueryInterface(Ci.nsIWebNavigation);var foStream=Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);foStream.init(this.file,0x02|0x08|0x20,-1,0); var coStream=Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);coStream.init(foStream,this.data.doc.characterSet); coStream.writeString(webNavigation.document.body.textContent); coStream.close();foStream.close();let helperService=Cc["@mozilla.org/uriloader/external-helper-app-service;1"].getService(Ci.nsPIExternalAppLauncher);if(this.data.isPrivate){ helperService.deleteTemporaryPrivateFileWhenPossible(this.file);}else{ helperService.deleteTemporaryFileOnExit(this.file);}}
var editorArgs=gViewSourceUtils.buildEditorArgs(this.file.path,this.data.lineNumber);this.editor.runw(false,editorArgs,editorArgs.length);this.contentLoaded=true;this.resolve(this.data);}catch(ex){Cu.reportError(ex);this.reject(this.data);}finally{this.destroy();}},webShell:null,editor:null,resolve:null,reject:null,data:null,file:null,}, getTemporaryFile(aURI,aDocument,aContentType){ if(!this._caUtils){this._caUtils={};Services.scriptloader.loadSubScript("chrome://global/content/contentAreaUtils.js",this._caUtils);}
var tempFile=Services.dirsvc.get("TmpD",Ci.nsIFile);var fileName=this._caUtils.getDefaultFileName(null,aURI,aDocument,aContentType);var extension=this._caUtils.getDefaultExtension(fileName,aURI,aContentType);var leafName=this._caUtils.getNormalizedLeafName(fileName,extension);tempFile.append(leafName);return tempFile;},};