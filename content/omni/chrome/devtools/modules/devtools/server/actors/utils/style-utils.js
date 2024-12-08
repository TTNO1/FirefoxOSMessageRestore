"use strict";const{getCSSLexer}=require("devtools/shared/css/lexer");const XHTML_NS="http://www.w3.org/1999/xhtml";const FONT_PREVIEW_TEXT="Abc";const FONT_PREVIEW_FONT_SIZE=40;const FONT_PREVIEW_FILLSTYLE="black";const FONT_PREVIEW_OFFSET=4;function getFontPreviewData(font,doc,options){options=options||{};const previewText=options.previewText||FONT_PREVIEW_TEXT;const previewFontSize=options.previewFontSize||FONT_PREVIEW_FONT_SIZE;const fillStyle=options.fillStyle||FONT_PREVIEW_FILLSTYLE;const fontStyle=options.fontStyle||"";const canvas=doc.createElementNS(XHTML_NS,"canvas");const ctx=canvas.getContext("2d");const fontValue=fontStyle+" "+previewFontSize+"px "+font+", serif"; ctx.font=fontValue;ctx.fillStyle=fillStyle;const textWidth=Math.round(ctx.measureText(previewText).width);canvas.width=textWidth*2+FONT_PREVIEW_OFFSET*4;canvas.height=previewFontSize*3; ctx.font=fontValue;ctx.fillStyle=fillStyle; ctx.textBaseline="top";ctx.scale(2,2);ctx.fillText(previewText,FONT_PREVIEW_OFFSET,Math.round(previewFontSize/3));const dataURL=canvas.toDataURL("image/png");return{dataURL:dataURL,size:textWidth+FONT_PREVIEW_OFFSET*2,};}
exports.getFontPreviewData=getFontPreviewData;function getRuleText(initialText,line,column){if(typeof line==="undefined"||typeof column==="undefined"){throw new Error("Location information is missing");}
const{offset:textOffset,text}=getTextAtLineColumn(initialText,line,column);const lexer=getCSSLexer(text);while(true){const token=lexer.nextToken();if(!token){throw new Error("couldn't find start of the rule");}
if(token.tokenType==="symbol"&&token.text==="{"){break;}}
let braceDepth=1;let startOffset,endOffset;while(true){const token=lexer.nextToken();if(!token){break;}
if(startOffset===undefined){startOffset=token.startOffset;}
if(token.tokenType==="symbol"){if(token.text==="{"){++braceDepth;}else if(token.text==="}"){--braceDepth;if(braceDepth==0){break;}}}
endOffset=token.endOffset;}

if(startOffset===undefined){return{offset:0,text:""};}

if(endOffset===undefined){endOffset=startOffset;}

return{offset:textOffset+startOffset,text:text.substring(startOffset,endOffset),};}
exports.getRuleText=getRuleText;function getTextAtLineColumn(text,line,column){let offset;if(line>1){const rx=new RegExp("(?:[^\\r\\n\\f]*(?:\\r\\n|\\n|\\r|\\f)){"+(line-1)+"}");offset=rx.exec(text)[0].length;}else{offset=0;}
offset+=column-1;return{offset:offset,text:text.substr(offset)};}
exports.getTextAtLineColumn=getTextAtLineColumn;