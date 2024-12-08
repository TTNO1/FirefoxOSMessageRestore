//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FindContent"];ChromeUtils.defineModuleGetter(this,"FinderIterator","resource://gre/modules/FinderIterator.jsm");ChromeUtils.defineModuleGetter(this,"FinderHighlighter","resource://gre/modules/FinderHighlighter.jsm");class FindContent{constructor(docShell){const{Finder}=ChromeUtils.import("resource://gre/modules/Finder.jsm");this.finder=new Finder(docShell);}
get iterator(){if(!this._iterator){this._iterator=new FinderIterator();}
return this._iterator;}
get highlighter(){if(!this._highlighter){this._highlighter=new FinderHighlighter(this.finder,true);}
return this._highlighter;}
findRanges(params){return new Promise(resolve=>{let{queryphrase,caseSensitive,entireWord,includeRangeData,includeRectData,matchDiacritics,}=params;this.iterator.reset();let iteratorPromise=this.iterator.start({word:queryphrase,caseSensitive:!!caseSensitive,entireWord:!!entireWord,finder:this.finder,listener:this.finder,matchDiacritics:!!matchDiacritics,useSubFrames:false,});iteratorPromise.then(()=>{let rangeData;let rectData;if(includeRangeData){rangeData=this._serializeRangeData();}
if(includeRectData){rectData=this._collectRectData();}
resolve({count:this.iterator._previousRanges.length,rangeData,rectData,});});});}
_serializeRangeData(){let ranges=this.iterator._previousRanges;let rangeData=[];let nodeCountWin=0;let lastDoc;let walker;let node;for(let range of ranges){let startContainer=range.startContainer;let doc=startContainer.ownerDocument;if(lastDoc!==doc){walker=doc.createTreeWalker(doc,doc.defaultView.NodeFilter.SHOW_TEXT,null,false);node=walker.nextNode();nodeCountWin=0;}
lastDoc=doc;let data={framePos:0,text:range.toString()};rangeData.push(data);if(node!=range.startContainer){node=walker.nextNode();while(node){nodeCountWin++;if(node==range.startContainer){break;}
node=walker.nextNode();}}
data.startTextNodePos=nodeCountWin;data.startOffset=range.startOffset;if(range.startContainer!=range.endContainer){node=walker.nextNode();while(node){nodeCountWin++;if(node==range.endContainer){break;}
node=walker.nextNode();}}
data.endTextNodePos=nodeCountWin;data.endOffset=range.endOffset;}
return rangeData;}
_collectRectData(){let rectData=[];let ranges=this.iterator._previousRanges;for(let range of ranges){let rectsAndTexts=this.highlighter._getRangeRectsAndTexts(range);rectData.push({text:range.toString(),rectsAndTexts});}
return rectData;}
highlightResults(params){let{rangeIndex,noScroll}=params;this.highlighter.highlight(false);let ranges=this.iterator._previousRanges;let status="Success";if(ranges.length){if(typeof rangeIndex=="number"){if(rangeIndex<ranges.length){let foundRange=ranges[rangeIndex];this.highlighter.highlightRange(foundRange);if(!noScroll){let node=foundRange.startContainer;let editableNode=this.highlighter._getEditableNode(node);let controller=editableNode?editableNode.editor.selectionController:this.finder._getSelectionController(node.ownerGlobal);controller.scrollSelectionIntoView(controller.SELECTION_FIND,controller.SELECTION_ON,controller.SCROLL_CENTER_VERTICALLY);}}else{status="OutOfRange";}}else{for(let range of ranges){this.highlighter.highlightRange(range);}}}else{status="NoResults";}
return status;}}