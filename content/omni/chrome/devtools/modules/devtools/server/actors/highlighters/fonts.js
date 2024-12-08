"use strict";const InspectorUtils=require("InspectorUtils");loader.lazyRequireGetter(this,"loadSheet","devtools/shared/layout/utils",true);loader.lazyRequireGetter(this,"removeSheet","devtools/shared/layout/utils",true);
const MAX_TEXT_RANGES=100;


const STYLESHEET_URI="data:text/css,"+
encodeURIComponent("::selection{background-color:hsl(197,71%,73%,.6)!important;}");class FontsHighlighter{constructor(highlighterEnv){this.env=highlighterEnv;}
destroy(){this.hide();this.env=this.currentNode=null;}
get currentNodeDocument(){if(!this.currentNode){return this.env.document;}
if(this.currentNode.nodeType===this.currentNode.DOCUMENT_NODE){return this.currentNode;}
return this.currentNode.ownerDocument;}
show(node,options){this.currentNode=node;const doc=this.currentNodeDocument;const searchRange=doc.createRange();searchRange.selectNodeContents(node);const fonts=InspectorUtils.getUsedFontFaces(searchRange,MAX_TEXT_RANGES);const matchingFonts=fonts.filter(f=>f.CSSFamilyName===options.CSSFamilyName&&f.name===options.name);if(!matchingFonts.length){return;}

loadSheet(this.env.window,STYLESHEET_URI);const selection=doc.defaultView.getSelection();selection.removeAllRanges();for(const matchingFont of matchingFonts){for(const range of matchingFont.ranges){selection.addRange(range);}}}
hide(){if(!this.currentNode){return;}
try{removeSheet(this.env.window,STYLESHEET_URI);}catch(e){}
const doc=this.currentNodeDocument;const selection=doc.defaultView.getSelection();selection.removeAllRanges();}}
exports.FontsHighlighter=FontsHighlighter;