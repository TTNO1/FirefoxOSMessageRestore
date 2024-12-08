"use strict";const{Cu}=require("chrome");const EventEmitter=require("devtools/shared/event-emitter");const{isNodeValid,}=require("devtools/server/actors/highlighters/utils/markup");const{getAdjustedQuads,getWindowDimensions,}=require("devtools/shared/layout/utils");
const BOX_MODEL_REGIONS=["margin","border","padding","content"];const QUADS_PROPS=["p1","p2","p3","p4"];function arePointsDifferent(pointA,pointB){return(Math.abs(pointA.x-pointB.x)>=0.5||Math.abs(pointA.y-pointB.y)>=0.5||Math.abs(pointA.w-pointB.w)>=0.5);}
function areQuadsDifferent(oldQuads,newQuads){for(const region of BOX_MODEL_REGIONS){const{length}=oldQuads[region];if(length!==newQuads[region].length){return true;}
for(let i=0;i<length;i++){for(const prop of QUADS_PROPS){const oldPoint=oldQuads[region][i][prop];const newPoint=newQuads[region][i][prop];if(arePointsDifferent(oldPoint,newPoint)){return true;}}}}
return false;}
function AutoRefreshHighlighter(highlighterEnv){EventEmitter.decorate(this);this.highlighterEnv=highlighterEnv;this.currentNode=null;this.currentQuads={};this._winDimensions=getWindowDimensions(this.win);this._scroll={x:this.win.pageXOffset,y:this.win.pageYOffset};this.update=this.update.bind(this);}
AutoRefreshHighlighter.prototype={_ignoreZoom:false,_ignoreScroll:false,get win(){if(!this.highlighterEnv){return null;}
return this.highlighterEnv.window;},get contentWindow(){return this.win;},show:function(node,options={}){const isSameNode=node===this.currentNode;const isSameOptions=this._isSameOptions(options);if(!this._isNodeValid(node)||(isSameNode&&isSameOptions)){return false;}
this.options=options;this._stopRefreshLoop();this.currentNode=node;this._updateAdjustedQuads();this._startRefreshLoop();const shown=this._show();if(shown){this.emit("shown");}
return shown;},hide:function(){if(!this.currentNode||!this.highlighterEnv.window){return;}
this._hide();this._stopRefreshLoop();this.currentNode=null;this.currentQuads={};this.options=null;this.emit("hidden");},_isNodeValid:function(node){return isNodeValid(node);},_isSameOptions:function(options){if(!this.options){return false;}
const keys=Object.keys(options);if(keys.length!==Object.keys(this.options).length){return false;}
for(const key of keys){if(this.options[key]!==options[key]){return false;}}
return true;},_updateAdjustedQuads:function(){this.currentQuads={};for(const region of BOX_MODEL_REGIONS){this.currentQuads[region]=getAdjustedQuads(this.contentWindow,this.currentNode,region,{ignoreScroll:this._ignoreScroll,ignoreZoom:this._ignoreZoom});}},_hasMoved:function(){const oldQuads=this.currentQuads;this._updateAdjustedQuads();return areQuadsDifferent(oldQuads,this.currentQuads);},_hasWindowScrolled:function(){if(!this.win){return false;}
const{pageXOffset,pageYOffset}=this.win;const hasChanged=this._scroll.x!==pageXOffset||this._scroll.y!==pageYOffset;this._scroll={x:pageXOffset,y:pageYOffset};return hasChanged;},_haveWindowDimensionsChanged:function(){const{width,height}=getWindowDimensions(this.win);const haveChanged=this._winDimensions.width!==width||this._winDimensions.height!==height;this._winDimensions={width,height};return haveChanged;},update:function(){if(!this._isNodeValid(this.currentNode)||(!this._hasMoved()&&!this._haveWindowDimensionsChanged())){
if(this._hasWindowScrolled()){this._scrollUpdate();}
return;}
this._update();this.emit("updated");},_show:function(){

 throw new Error("Custom highlighter class had to implement _show method");},_update:function(){


 throw new Error("Custom highlighter class had to implement _update method");},_scrollUpdate:function(){


},_hide:function(){
 throw new Error("Custom highlighter class had to implement _hide method");},_startRefreshLoop:function(){const win=this.currentNode.ownerGlobal;this.rafID=win.requestAnimationFrame(this._startRefreshLoop.bind(this));this.rafWin=win;this.update();},_stopRefreshLoop:function(){if(this.rafID&&!Cu.isDeadWrapper(this.rafWin)){this.rafWin.cancelAnimationFrame(this.rafID);}
this.rafID=this.rafWin=null;},destroy:function(){this.hide();this.highlighterEnv=null;this.currentNode=null;},};exports.AutoRefreshHighlighter=AutoRefreshHighlighter;