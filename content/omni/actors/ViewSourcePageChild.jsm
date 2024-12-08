const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");var EXPORTED_SYMBOLS=["ViewSourcePageChild"];XPCOMUtils.defineLazyGlobalGetters(this,["NodeFilter"]);const NS_XHTML="http://www.w3.org/1999/xhtml";const BUNDLE_URL="chrome://global/locale/viewSource.properties";

const MARK_SELECTION_START="\uFDD0";const MARK_SELECTION_END="\uFDEF";let gNeedsDrawSelection=false;let gInitialLineNumber=-1;let gContextMenuItems=[{id:"goToLine",accesskey:true,handler(actor){actor.sendAsyncMessage("ViewSource:PromptAndGoToLine");},},{id:"wrapLongLines",get checked(){return Services.prefs.getBoolPref("view_source.wrap_long_lines");},handler(actor){actor.toggleWrapping();},},{id:"highlightSyntax",get checked(){return Services.prefs.getBoolPref("view_source.syntax_highlight");},handler(actor){actor.toggleSyntaxHighlighting();},},];class ViewSourcePageChild extends JSWindowActorChild{constructor(){super();XPCOMUtils.defineLazyGetter(this,"bundle",function(){return Services.strings.createBundle(BUNDLE_URL);});}
static setNeedsDrawSelection(value){gNeedsDrawSelection=value;}
static setInitialLineNumber(value){gInitialLineNumber=value;}
receiveMessage(msg){if(msg.name=="ViewSource:GoToLine"){this.goToLine(msg.data.lineNumber);}}
handleEvent(event){switch(event.type){case"pageshow":this.onPageShow(event);break;case"click":this.onClick(event);break;}}
get selectionController(){return this.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsISelectionDisplay).QueryInterface(Ci.nsISelectionController);}
get webBrowserFind(){return this.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebBrowserFind);}
onClick(event){let target=event.originalTarget; if(target.id){gContextMenuItems.forEach(itemSpec=>{if(itemSpec.id!==target.id){return;}
itemSpec.handler(this);event.stopPropagation();});} 
if(!event.isTrusted||event.target.localName!="button"){return;}
let errorDoc=target.ownerDocument;if(/^about:blocked/.test(errorDoc.documentURI)){ if(target==errorDoc.getElementById("goBackButton")){ this.sendAsyncMessage("ViewSource:Close");}}}
onPageShow(event){
if(gNeedsDrawSelection&&this.document.documentURI.startsWith("view-source:")){gNeedsDrawSelection=false;this.drawSelection();}
if(gInitialLineNumber>=0){this.goToLine(gInitialLineNumber);gInitialLineNumber=-1;}
if(this.document.body){this.injectContextMenu();}}
goToLine(lineNumber){let body=this.document.body;


let pre;for(let lbound=0,ubound=body.childNodes.length;;){let middle=(lbound+ubound)>>1;pre=body.childNodes[middle];let firstLine=pre.id?parseInt(pre.id.substring(4)):1;if(lbound==ubound-1){break;}
if(lineNumber>=firstLine){lbound=middle;}else{ubound=middle;}}
let result={};let found=this.findLocation(pre,lineNumber,null,-1,false,result);if(!found){this.sendAsyncMessage("ViewSource:GoToLine:Failed");return;}
let selection=this.document.defaultView.getSelection();selection.removeAllRanges();
selection.interlinePosition=true;selection.addRange(result.range);if(!selection.isCollapsed){selection.collapseToEnd();let offset=result.range.startOffset;let node=result.range.startContainer;if(offset<node.data.length){selection.extend(node,offset);}else{

node=node.nextSibling?node.nextSibling:node.parentNode.nextSibling;selection.extend(node,0);}}
let selCon=this.selectionController;selCon.setDisplaySelection(Ci.nsISelectionController.SELECTION_ON);selCon.setCaretVisibilityDuringSelection(true);selCon.scrollSelectionIntoView(Ci.nsISelectionController.SELECTION_NORMAL,Ci.nsISelectionController.SELECTION_FOCUS_REGION,true);this.sendAsyncMessage("ViewSource:GoToLine:Success",{lineNumber});}
findLocation(pre,lineNumber,node,offset,interlinePosition,result){if(node&&!pre){ for(pre=node;pre.nodeName!="PRE";pre=pre.parentNode){}}


let curLine=pre.id?parseInt(pre.id.substring(4)):1;let treewalker=this.document.createTreeWalker(pre,NodeFilter.SHOW_TEXT,null);let firstCol=1;let found=false;for(let textNode=treewalker.firstChild();textNode&&!found;textNode=treewalker.nextNode()){let lineArray=textNode.data.split(/\n/);let lastLineInNode=curLine+lineArray.length-1;if(node?textNode!=node:lastLineInNode<lineNumber){if(lineArray.length>1){firstCol=1;}
firstCol+=lineArray[lineArray.length-1].length;curLine=lastLineInNode;continue;}

for(var i=0,curPos=0;i<lineArray.length;curPos+=lineArray[i++].length+1){if(i>0){curLine++;}
if(node){if(offset>=curPos&&offset<=curPos+lineArray[i].length){

if(i>0&&offset==curPos&&!interlinePosition){result.line=curLine-1;var prevPos=curPos-lineArray[i-1].length;result.col=(i==1?firstCol:1)+offset-prevPos;}else{result.line=curLine;result.col=(i==0?firstCol:1)+offset-curPos;}
found=true;break;}}else if(curLine==lineNumber&&!("range"in result)){result.range=this.document.createRange();result.range.setStart(textNode,curPos);

result.range.setEndAfter(pre.lastChild);}else if(curLine==lineNumber+1){result.range.setEnd(textNode,curPos-1);found=true;break;}}}
return found||"range"in result;}
toggleWrapping(){let body=this.document.body;let state=body.classList.toggle("wrap");this.sendAsyncMessage("ViewSource:StoreWrapping",{state});}
toggleSyntaxHighlighting(){let body=this.document.body;let state=body.classList.toggle("highlight");this.sendAsyncMessage("ViewSource:StoreSyntaxHighlighting",{state});}
drawSelection(){this.document.title=this.bundle.GetStringFromName("viewSelectionSourceTitle");
var findService=null;try{ findService=Cc["@mozilla.org/find/find_service;1"].getService(Ci.nsIFindService);}catch(e){}
if(!findService){return;} 
var matchCase=findService.matchCase;var entireWord=findService.entireWord;var wrapFind=findService.wrapFind;var findBackwards=findService.findBackwards;var searchString=findService.searchString;var replaceString=findService.replaceString; var findInst=this.webBrowserFind;findInst.matchCase=true;findInst.entireWord=false;findInst.wrapFind=true;findInst.findBackwards=false; findInst.searchString=MARK_SELECTION_START;var startLength=MARK_SELECTION_START.length;findInst.findNext();var selection=this.document.defaultView.getSelection();if(!selection.rangeCount){return;}
var range=selection.getRangeAt(0);var startContainer=range.startContainer;var startOffset=range.startOffset; findInst.searchString=MARK_SELECTION_END;var endLength=MARK_SELECTION_END.length;findInst.findNext();var endContainer=selection.anchorNode;var endOffset=selection.anchorOffset; selection.removeAllRanges();endContainer.deleteData(endOffset,endLength);startContainer.deleteData(startOffset,startLength);if(startContainer==endContainer){endOffset-=startLength;}
range.setEnd(endContainer,endOffset); selection.addRange(range);

 try{this.selectionController.scrollSelectionIntoView(Ci.nsISelectionController.SELECTION_NORMAL,Ci.nsISelectionController.SELECTION_ANCHOR_REGION,true);}catch(e){} 
findService.matchCase=matchCase;findService.entireWord=entireWord;findService.wrapFind=wrapFind;findService.findBackwards=findBackwards;findService.searchString=searchString;findService.replaceString=replaceString;findInst.matchCase=matchCase;findInst.entireWord=entireWord;findInst.wrapFind=wrapFind;findInst.findBackwards=findBackwards;findInst.searchString=searchString;}
injectContextMenu(){let doc=this.document;let menu=doc.createElementNS(NS_XHTML,"menu");menu.setAttribute("type","context");menu.setAttribute("id","actions");doc.body.appendChild(menu);doc.body.setAttribute("contextmenu","actions");gContextMenuItems.forEach(itemSpec=>{let item=doc.createElementNS(NS_XHTML,"menuitem");item.setAttribute("id",itemSpec.id);let labelName=`context_${itemSpec.id}_label`;let label=this.bundle.GetStringFromName(labelName);item.setAttribute("label",label);if("checked"in itemSpec){item.setAttribute("type","checkbox");}
if(itemSpec.accesskey){let accesskeyName=`context_${itemSpec.id}_accesskey`;item.setAttribute("accesskey",this.bundle.GetStringFromName(accesskeyName));}
menu.appendChild(item);});this.updateContextMenu();}
updateContextMenu(){let doc=this.document;gContextMenuItems.forEach(itemSpec=>{if(!("checked"in itemSpec)){return;}
let item=doc.getElementById(itemSpec.id);if(itemSpec.checked){item.setAttribute("checked",true);}else{item.removeAttribute("checked");}});}}