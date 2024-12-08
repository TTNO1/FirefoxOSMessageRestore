"use strict";
{class MozEditor extends XULFrameElement{connectedCallback(){this._editorContentListener={QueryInterface:ChromeUtils.generateQI(["nsIURIContentListener","nsISupportsWeakReference",]),doContent(contentType,isContentPreferred,request,contentHandler){return false;},isPreferred(contentType,desiredContentType){return false;},canHandleContent(contentType,isContentPreferred,desiredContentType){return false;},loadCookie:null,parentContentListener:null,};this._finder=null;this._fastFind=null;this._lastSearchString=null;

if(this.editortype){this.makeEditable(this.editortype,true);}}
get finder(){if(!this._finder){if(!this.docShell){return null;}
let Finder=ChromeUtils.import("resource://gre/modules/Finder.jsm",{}).Finder;this._finder=new Finder(this.docShell);}
return this._finder;}
get fastFind(){if(!this._fastFind){if(!("@mozilla.org/typeaheadfind;1"in Cc)){return null;}
if(!this.docShell){return null;}
this._fastFind=Cc["@mozilla.org/typeaheadfind;1"].createInstance(Ci.nsITypeAheadFind);this._fastFind.init(this.docShell);}
return this._fastFind;}
set editortype(val){this.setAttribute("editortype",val);}
get editortype(){return this.getAttribute("editortype");}
get currentURI(){return this.webNavigation.currentURI;}
get webBrowserFind(){return this.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebBrowserFind);}
get markupDocumentViewer(){return this.docShell.contentViewer;}
get editingSession(){return this.docShell.editingSession;}
get commandManager(){return this.webNavigation.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsICommandManager);}
set fullZoom(val){this.browsingContext.fullZoom=val;}
get fullZoom(){return this.browsingContext.fullZoom;}
set textZoom(val){this.browsingContext.textZoom=val;}
get textZoom(){return this.browsingContext.textZoom;}
get isSyntheticDocument(){return this.contentDocument.isSyntheticDocument;}
get messageManager(){if(this.frameLoader){return this.frameLoader.messageManager;}
return null;}


sendMessageToActor(messageName,args,actorName,scope){if(!this.frameLoader){return;}
function sendToChildren(browsingContext,childScope){let windowGlobal=browsingContext.currentWindowGlobal;if(windowGlobal&&(childScope!="roots"||windowGlobal.isProcessRoot)){windowGlobal.getActor(actorName).sendAsyncMessage(messageName,args);}

if(scope){for(let context of browsingContext.children){sendToChildren(context,scope);}}}
sendToChildren(this.browsingContext);}
get outerWindowID(){return this.docShell.outerWindowID;}
makeEditable(editortype,waitForUrlLoad){let win=this.contentWindow;this.editingSession.makeWindowEditable(win,editortype,waitForUrlLoad,true,false);this.setAttribute("editortype",editortype);this.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIURIContentListener).parentContentListener=this._editorContentListener;}
getEditor(containingWindow){return this.editingSession.getEditorForWindow(containingWindow);}
getHTMLEditor(containingWindow){var editor=this.editingSession.getEditorForWindow(containingWindow);return editor.QueryInterface(Ci.nsIHTMLEditor);}
print(aOuterWindowID,aPrintSettings){if(!this.frameLoader){throw Components.Exception("No frame loader.",Cr.NS_ERROR_FAILURE);}
return this.frameLoader.print(aOuterWindowID,aPrintSettings);}}
customElements.define("editor",MozEditor);}