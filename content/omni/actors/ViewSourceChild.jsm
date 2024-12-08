var EXPORTED_SYMBOLS=["ViewSourceChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"ViewSourcePageChild","resource://gre/actors/ViewSourcePageChild.jsm");class ViewSourceChild extends JSWindowActorChild{receiveMessage(message){let data=message.data;switch(message.name){case"ViewSource:LoadSource":this.viewSource(data.URL,data.outerWindowID,data.lineNumber);break;case"ViewSource:LoadSourceWithSelection":this.viewSourceWithSelection(data.URL,data.drawSelection,data.baseURI);break;case"ViewSource:GetSelection":let selectionDetails;try{selectionDetails=this.getSelection(this.document.ownerGlobal);}catch(e){}
return selectionDetails;}
return undefined;}
viewSource(URL,outerWindowID,lineNumber){let otherDocShell,forcedCharSet;if(outerWindowID){let contentWindow=Services.wm.getOuterWindowWithId(outerWindowID);if(contentWindow){otherDocShell=contentWindow.docShell;let utils=contentWindow.windowUtils;let doc=contentWindow.document;forcedCharSet=utils.docCharsetIsForced?doc.characterSet:null;}}
this.loadSource(URL,otherDocShell,lineNumber,forcedCharSet);}
viewSourceWithSelection(uri,drawSelection,baseURI){


ViewSourcePageChild.setNeedsDrawSelection(drawSelection);let loadFlags=Ci.nsIWebNavigation.LOAD_FLAGS_NONE;let webNav=this.docShell.QueryInterface(Ci.nsIWebNavigation);let loadURIOptions={triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),loadFlags,baseURI:Services.io.newURI(baseURI),};webNav.loadURI(uri,loadURIOptions);}
loadSource(URL,otherDocShell,lineNumber,forcedCharSet){const viewSrcURL="view-source:"+URL;if(forcedCharSet){try{this.docShell.charset=forcedCharSet;}catch(e){}}
ViewSourcePageChild.setInitialLineNumber(lineNumber);if(!otherDocShell){this.loadSourceFromURL(viewSrcURL);return;}
try{let pageLoader=this.docShell.QueryInterface(Ci.nsIWebPageDescriptor);pageLoader.loadPageAsViewSource(otherDocShell,viewSrcURL);}catch(e){this.loadSourceFromURL(viewSrcURL);}}
loadSourceFromURL(URL){let loadFlags=Ci.nsIWebNavigation.LOAD_FLAGS_NONE;let webNav=this.docShell.QueryInterface(Ci.nsIWebNavigation);let loadURIOptions={triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal(),loadFlags,};webNav.loadURI(URL,loadURIOptions);}
getPath(ancestor,node){var n=node;var p=n.parentNode;if(n==ancestor||!p){return null;}
var path=[];if(!path){return null;}
do{for(var i=0;i<p.childNodes.length;i++){if(p.childNodes.item(i)==n){path.push(i);break;}}
n=p;p=n.parentNode;}while(n!=ancestor&&p);return path;}
getSelection(global){const{content}=global;

const MARK_SELECTION_START="\uFDD0";const MARK_SELECTION_END="\uFDEF";var focusedWindow=Services.focus.focusedWindow||content;var selection=focusedWindow.getSelection();var range=selection.getRangeAt(0);var ancestorContainer=range.commonAncestorContainer;var doc=ancestorContainer.ownerDocument;var startContainer=range.startContainer;var endContainer=range.endContainer;var startOffset=range.startOffset;var endOffset=range.endOffset; var Node=doc.defaultView.Node;if(ancestorContainer.nodeType==Node.TEXT_NODE||ancestorContainer.nodeType==Node.CDATA_SECTION_NODE){ancestorContainer=ancestorContainer.parentNode;} 
try{if(ancestorContainer==doc.body){ancestorContainer=doc.documentElement;}}catch(e){}
 
var startPath=this.getPath(ancestorContainer,startContainer);var endPath=this.getPath(ancestorContainer,endContainer);


 var isHTML=doc.createElement("div").tagName=="DIV";var dataDoc=isHTML?ancestorContainer.ownerDocument.implementation.createHTMLDocument(""):ancestorContainer.ownerDocument.implementation.createDocument("","",null);ancestorContainer=dataDoc.importNode(ancestorContainer,true);startContainer=ancestorContainer;endContainer=ancestorContainer;

var canDrawSelection=ancestorContainer.hasChildNodes();var tmpNode;if(canDrawSelection){var i;for(i=startPath?startPath.length-1:-1;i>=0;i--){startContainer=startContainer.childNodes.item(startPath[i]);}
for(i=endPath?endPath.length-1:-1;i>=0;i--){endContainer=endContainer.childNodes.item(endPath[i]);}


if(endContainer.nodeType==Node.TEXT_NODE||endContainer.nodeType==Node.CDATA_SECTION_NODE){
if((endOffset>0&&endOffset<endContainer.data.length)||!endContainer.parentNode||!endContainer.parentNode.parentNode){endContainer.insertData(endOffset,MARK_SELECTION_END);}else{tmpNode=dataDoc.createTextNode(MARK_SELECTION_END);endContainer=endContainer.parentNode;if(endOffset===0){endContainer.parentNode.insertBefore(tmpNode,endContainer);}else{endContainer.parentNode.insertBefore(tmpNode,endContainer.nextSibling);}}}else{tmpNode=dataDoc.createTextNode(MARK_SELECTION_END);endContainer.insertBefore(tmpNode,endContainer.childNodes.item(endOffset));}
if(startContainer.nodeType==Node.TEXT_NODE||startContainer.nodeType==Node.CDATA_SECTION_NODE){
if((startOffset>0&&startOffset<startContainer.data.length)||!startContainer.parentNode||!startContainer.parentNode.parentNode||startContainer!=startContainer.parentNode.lastChild){startContainer.insertData(startOffset,MARK_SELECTION_START);}else{tmpNode=dataDoc.createTextNode(MARK_SELECTION_START);startContainer=startContainer.parentNode;if(startOffset===0){startContainer.parentNode.insertBefore(tmpNode,startContainer);}else{startContainer.parentNode.insertBefore(tmpNode,startContainer.nextSibling);}}}else{tmpNode=dataDoc.createTextNode(MARK_SELECTION_START);startContainer.insertBefore(tmpNode,startContainer.childNodes.item(startOffset));}} 
tmpNode=dataDoc.createElementNS("http://www.w3.org/1999/xhtml","div");tmpNode.appendChild(ancestorContainer);return{URL:(isHTML?"view-source:data:text/html;charset=utf-8,":"view-source:data:application/xml;charset=utf-8,")+
encodeURIComponent(tmpNode.innerHTML),drawSelection:canDrawSelection,baseURI:doc.baseURI,};}
get wrapLongLines(){return Services.prefs.getBoolPref("view_source.wrap_long_lines");}}