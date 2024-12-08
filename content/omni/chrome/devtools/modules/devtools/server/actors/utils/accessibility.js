"use strict";loader.lazyRequireGetter(this,"Ci","chrome",true);loader.lazyRequireGetter(this,"Services");loader.lazyRequireGetter(this,["loadSheet","removeSheet"],"devtools/shared/layout/utils",true);
const HIGHLIGHTER_STYLES_SHEET=`data:text/css;charset=utf-8,
* {
  transition: none !important;
}

:-moz-devtools-highlighted {
  color: transparent !important;
  text-shadow: none !important;
}`;function isDefunct(accessible){
if(!Services.appinfo.accessibilityEnabled){return true;}
let defunct=false;try{const extraState={};accessible.getState({},extraState);
defunct=!!(extraState.value&Ci.nsIAccessibleStates.EXT_STATE_DEFUNCT);}catch(e){defunct=true;}
return defunct;}
function loadSheetForBackgroundCalculation(win){loadSheet(win,HIGHLIGHTER_STYLES_SHEET);}
function removeSheetForBackgroundCalculation(win){removeSheet(win,HIGHLIGHTER_STYLES_SHEET);}
function isWebRenderEnabled(win){try{return win.windowUtils&&win.windowUtils.layerManagerType==="WebRender";}catch(e){
console.warn(e);}
return false;}
function getAriaRoles(accessible){try{return accessible.attributes.getStringProperty("xml-roles");}catch(e){
}
return null;}
exports.getAriaRoles=getAriaRoles;exports.isDefunct=isDefunct;exports.isWebRenderEnabled=isWebRenderEnabled;exports.loadSheetForBackgroundCalculation=loadSheetForBackgroundCalculation;exports.removeSheetForBackgroundCalculation=removeSheetForBackgroundCalculation;