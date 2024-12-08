


"use strict";const{getCSSLexer}=require("devtools/shared/css/lexer");loader.lazyRequireGetter(this,"CSS_ANGLEUNIT","devtools/shared/css/constants",true);const SELECTOR_ATTRIBUTE=(exports.SELECTOR_ATTRIBUTE=1);const SELECTOR_ELEMENT=(exports.SELECTOR_ELEMENT=2);const SELECTOR_PSEUDO_CLASS=(exports.SELECTOR_PSEUDO_CLASS=3);const CSS_BLOCKS={"(":")","[":"]","{":"}"};

const COMMENT_PARSING_HEURISTIC_BYPASS_CHAR=(exports.COMMENT_PARSING_HEURISTIC_BYPASS_CHAR="!");function*cssTokenizer(string){const lexer=getCSSLexer(string);while(true){const token=lexer.nextToken();if(!token){break;}
if(token.tokenType!=="comment"){yield token;}}}
function cssTokenizerWithLineColumn(string){const lexer=getCSSLexer(string);const result=[];let prevToken=undefined;while(true){const token=lexer.nextToken();const lineNumber=lexer.lineNumber;const columnNumber=lexer.columnNumber;if(prevToken){prevToken.loc.end={line:lineNumber,column:columnNumber,};}
if(!token){break;}
if(token.tokenType==="comment"){prevToken=undefined;}else{const startLoc={line:lineNumber,column:columnNumber,};token.loc={start:startLoc};result.push(token);prevToken=token;}}
return result;}
function escapeCSSComment(inputString){const result=inputString.replace(/\/(\\*)\*/g,"/\\$1*");return result.replace(/\*(\\*)\//g,"*\\$1/");}
function unescapeCSSComment(inputString){const result=inputString.replace(/\/\\(\\*)\*/g,"/$1*");return result.replace(/\*\\(\\*)\//g,"*$1/");}
function parseCommentDeclarations(isCssPropertyKnown,commentText,startOffset,endOffset){let commentOverride=false;if(commentText===""){return[];}else if(commentText[0]===COMMENT_PARSING_HEURISTIC_BYPASS_CHAR){

commentOverride=true;commentText=commentText.substring(1);}
const rewrittenText=unescapeCSSComment(commentText);







const rewrites=new Array(rewrittenText.length+1).fill(0);const commentRe=/\/\\*\*|\*\\*\//g;while(true){const matchData=commentRe.exec(rewrittenText);if(!matchData){break;}
rewrites[matchData.index]=1;}
let delta=0;for(let i=0;i<=rewrittenText.length;++i){delta+=rewrites[i];
rewrites[i]=startOffset+2+i+delta;if(commentOverride){++rewrites[i];}}



const newDecls=parseDeclarationsInternal(isCssPropertyKnown,rewrittenText,false,true,commentOverride);for(const decl of newDecls){decl.offsets[0]=rewrites[decl.offsets[0]];decl.offsets[1]=rewrites[decl.offsets[1]];decl.colonOffsets[0]=rewrites[decl.colonOffsets[0]];decl.colonOffsets[1]=rewrites[decl.colonOffsets[1]];decl.commentOffsets=[startOffset,endOffset];}
return newDecls;}
function getEmptyDeclaration(){return{name:"",value:"",priority:"",terminator:"",offsets:[undefined,undefined],colonOffsets:false,};}
function cssTrim(str){const match=/^[ \t\r\n\f]*(.*?)[ \t\r\n\f]*$/.exec(str);if(match){return match[1];}
return str;}
function parseDeclarationsInternal(isCssPropertyKnown,inputString,parseComments,inComment,commentOverride){if(inputString===null||inputString===undefined){throw new Error("empty input string");}
const lexer=getCSSLexer(inputString);let declarations=[getEmptyDeclaration()];let lastProp=declarations[0];

let currentBlocks=[];

let importantState=0;
let importantWS=false;let current="";while(true){const token=lexer.nextToken();if(!token){break;}

if(token.tokenType!=="whitespace"&&token.tokenType!=="comment"){if(lastProp.offsets[0]===undefined){lastProp.offsets[0]=token.startOffset;}
lastProp.offsets[1]=token.endOffset;}else if(lastProp.name&&!current&&!importantState&&!lastProp.priority&&lastProp.colonOffsets[1]){lastProp.colonOffsets[1]=token.endOffset;}else if(importantState===1){importantWS=true;}
if(token.tokenType==="symbol"&&currentBlocks[currentBlocks.length-1]===token.text){currentBlocks.pop();current+=token.text;}else if(token.tokenType==="symbol"&&CSS_BLOCKS[token.text]){currentBlocks.push(CSS_BLOCKS[token.text]);current+=token.text;}else if(token.tokenType==="function"){currentBlocks.push(CSS_BLOCKS["("]);current+=token.text+"(";}else if(token.tokenType==="symbol"&&token.text===":"){importantState=0;importantWS=false;if(!lastProp.name){ lastProp.name=cssTrim(current);lastProp.colonOffsets=[token.startOffset,token.endOffset];current="";currentBlocks=[];
if(inComment&&!commentOverride&&!isCssPropertyKnown(lastProp.name)){lastProp.name=null;break;}}else{
current+=":";}}else if(token.tokenType==="symbol"&&token.text===";"&&!currentBlocks.length){lastProp.terminator="";
if(inComment&&!lastProp.name){current="";currentBlocks=[];break;}
if(importantState===2){lastProp.priority="important";}else if(importantState===1){current+="!";if(importantWS){current+=" ";}}
lastProp.value=cssTrim(current);current="";currentBlocks=[];importantState=0;importantWS=false;declarations.push(getEmptyDeclaration());lastProp=declarations[declarations.length-1];}else if(token.tokenType==="ident"){if(token.text==="important"&&importantState===1){importantState=2;}else{if(importantState>0){current+="!";if(importantWS){current+=" ";}
if(importantState===2){current+="important ";}
importantState=0;importantWS=false;}
current+=CSS.escape(token.text);}}else if(token.tokenType==="symbol"&&token.text==="!"){importantState=1;}else if(token.tokenType==="whitespace"){if(current!==""){current=current.trimRight()+" ";}}else if(token.tokenType==="comment"){if(parseComments&&!lastProp.name&&!lastProp.value){const commentText=inputString.substring(token.startOffset+2,token.endOffset-2);const newDecls=parseCommentDeclarations(isCssPropertyKnown,commentText,token.startOffset,token.endOffset);const lastDecl=declarations.pop();declarations=[...declarations,...newDecls,lastDecl];}else{current=current.trimRight()+" ";}}else{if(importantState>0){current+="!";if(importantWS){current+=" ";}
if(importantState===2){current+="important ";}
importantState=0;importantWS=false;}
current+=inputString.substring(token.startOffset,token.endOffset);}} 
if(current){if(!lastProp.name){if(!inComment){ lastProp.name=cssTrim(current);}}else{if(importantState===2){lastProp.priority="important";}else if(importantState===1){current+="!";}
lastProp.value=cssTrim(current);const terminator=lexer.performEOFFixup("",true);lastProp.terminator=terminator+";";

if(terminator){lastProp.offsets[1]=inputString.length;}}} 
declarations=declarations.filter(prop=>prop.name||prop.value);return declarations;}
function parseDeclarations(isCssPropertyKnown,inputString,parseComments=false){return parseDeclarationsInternal(isCssPropertyKnown,inputString,parseComments,false,false);}
function parseNamedDeclarations(isCssPropertyKnown,inputString,parseComments=false){return parseDeclarations(isCssPropertyKnown,inputString,parseComments).filter(item=>!!item.name);}
function parsePseudoClassesAndAttributes(value){if(!value){throw new Error("empty input string");}
const tokens=cssTokenizer(value);const result=[];let current="";let functionCount=0;let hasAttribute=false;let hasColon=false;for(const token of tokens){if(token.tokenType==="ident"){current+=value.substring(token.startOffset,token.endOffset);if(hasColon&&!functionCount){if(current){result.push({value:current,type:SELECTOR_PSEUDO_CLASS});}
current="";hasColon=false;}}else if(token.tokenType==="symbol"&&token.text===":"){if(!hasColon){if(current){result.push({value:current,type:SELECTOR_ELEMENT});}
current="";hasColon=true;}
current+=token.text;}else if(token.tokenType==="function"){current+=value.substring(token.startOffset,token.endOffset);functionCount++;}else if(token.tokenType==="symbol"&&token.text===")"){current+=token.text;if(hasColon&&functionCount==1){if(current){result.push({value:current,type:SELECTOR_PSEUDO_CLASS});}
current="";functionCount--;hasColon=false;}else{functionCount--;}}else if(token.tokenType==="symbol"&&token.text==="["){if(!hasAttribute&&!functionCount){if(current){result.push({value:current,type:SELECTOR_ELEMENT});}
current="";hasAttribute=true;}
current+=token.text;}else if(token.tokenType==="symbol"&&token.text==="]"){current+=token.text;if(hasAttribute&&!functionCount){if(current){result.push({value:current,type:SELECTOR_ATTRIBUTE});}
current="";hasAttribute=false;}}else{current+=value.substring(token.startOffset,token.endOffset);}}
if(current){result.push({value:current,type:SELECTOR_ELEMENT});}
return result;}
function parseSingleValue(isCssPropertyKnown,value){const declaration=parseDeclarations(isCssPropertyKnown,"a: "+value+";")[0];return{value:declaration?declaration.value:"",priority:declaration?declaration.priority:"",};}
function getAngleValueInDegrees(angleValue,angleUnit){switch(angleUnit){case CSS_ANGLEUNIT.deg:return angleValue;case CSS_ANGLEUNIT.grad:return angleValue*0.9;case CSS_ANGLEUNIT.rad:return(angleValue*180)/Math.PI;case CSS_ANGLEUNIT.turn:return angleValue*360;default:throw new Error("No matched angle unit.");}}
exports.cssTokenizer=cssTokenizer;exports.cssTokenizerWithLineColumn=cssTokenizerWithLineColumn;exports.escapeCSSComment=escapeCSSComment;exports.unescapeCSSComment=unescapeCSSComment;exports.parseDeclarations=parseDeclarations;exports.parseNamedDeclarations=parseNamedDeclarations;exports._parseCommentDeclarations=parseCommentDeclarations;exports.parsePseudoClassesAndAttributes=parsePseudoClassesAndAttributes;exports.parseSingleValue=parseSingleValue;exports.getAngleValueInDegrees=getAngleValueInDegrees;