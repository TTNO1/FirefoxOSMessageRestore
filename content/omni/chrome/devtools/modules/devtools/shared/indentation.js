"use strict";const Services=require("Services");const EXPAND_TAB="devtools.editor.expandtab";const TAB_SIZE="devtools.editor.tabsize";const DETECT_INDENT="devtools.editor.detectindentation";const DETECT_INDENT_MAX_LINES=500;function getTabPrefs(){const indentWithTabs=!Services.prefs.getBoolPref(EXPAND_TAB);const indentUnit=Services.prefs.getIntPref(TAB_SIZE);return{indentUnit,indentWithTabs};}
function getIndentationFromPrefs(){const shouldDetect=Services.prefs.getBoolPref(DETECT_INDENT);if(shouldDetect){return false;}
return getTabPrefs();}
function getIndentationFromIteration(iterFunc){let indentWithTabs=!Services.prefs.getBoolPref(EXPAND_TAB);let indentUnit=Services.prefs.getIntPref(TAB_SIZE);const shouldDetect=Services.prefs.getBoolPref(DETECT_INDENT);if(shouldDetect){const indent=detectIndentation(iterFunc);if(indent!=null){indentWithTabs=indent.tabs;indentUnit=indent.spaces?indent.spaces:indentUnit;}}
return{indentUnit,indentWithTabs};}
function getIndentationFromString(string){const iteratorFn=function(start,end,callback){const split=string.split(/\r\n|\r|\n|\f/);split.slice(start,end).forEach(callback);};return getIndentationFromIteration(iteratorFn);}
function detectIndentation(textIteratorFn){ const spaces={}; let last=0; let tabs=0;let total=0;textIteratorFn(0,DETECT_INDENT_MAX_LINES,text=>{if(text.startsWith("\t")){tabs++;total++;return;}
let width=0;while(text[width]===" "){width++;} 
if(width==text.length){last=0;return;}
if(width>1){total++;} 
const indent=Math.abs(width-last);if(indent>1&&indent<=8){spaces[indent]=(spaces[indent]||0)+1;}
last=width;}); if(total==0){return null;} 
if(tabs>=total/2){return{tabs:true};} 
let freqIndent=null,max=1;for(let width in spaces){width=parseInt(width,10);const tally=spaces[width];if(tally>max){max=tally;freqIndent=width;}}
if(!freqIndent){return null;}
return{tabs:false,spaces:freqIndent};}
exports.EXPAND_TAB=EXPAND_TAB;exports.TAB_SIZE=TAB_SIZE;exports.DETECT_INDENT=DETECT_INDENT;exports.getTabPrefs=getTabPrefs;exports.getIndentationFromPrefs=getIndentationFromPrefs;exports.getIndentationFromIteration=getIndentationFromIteration;exports.getIndentationFromString=getIndentationFromString;