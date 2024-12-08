"use strict";const{AutoRefreshHighlighter,}=require("devtools/server/actors/highlighters/auto-refresh");const{CANVAS_SIZE,DEFAULT_COLOR,drawBubbleRect,drawLine,drawRect,drawRoundedRect,getBoundsFromPoints,getCurrentMatrix,getPathDescriptionFromPoints,getPointsFromDiagonal,updateCanvasElement,updateCanvasPosition,}=require("devtools/server/actors/highlighters/utils/canvas");const{CanvasFrameAnonymousContentHelper,getComputedStyle,moveInfobar,}=require("devtools/server/actors/highlighters/utils/markup");const{apply}=require("devtools/shared/layout/dom-matrix-2d");const{getCurrentZoom,getDisplayPixelRatio,getWindowDimensions,setIgnoreLayoutChanges,}=require("devtools/shared/layout/utils");const{stringifyGridFragments,}=require("devtools/server/actors/utils/css-grid-utils");const{LocalizationHelper}=require("devtools/shared/l10n");const STRINGS_URI="devtools/shared/locales/highlighters.properties";const L10N=new LocalizationHelper(STRINGS_URI);const COLUMNS="cols";const ROWS="rows";const GRID_FONT_SIZE=10;const GRID_FONT_FAMILY="sans-serif";const GRID_AREA_NAME_FONT_SIZE="20";const GRID_LINES_PROPERTIES={edge:{lineDash:[0,0],alpha:1,},explicit:{lineDash:[5,3],alpha:0.75,},implicit:{lineDash:[2,2],alpha:0.5,},areaEdge:{lineDash:[0,0],alpha:1,lineWidth:3,},};const GRID_GAP_PATTERN_WIDTH=14;const GRID_GAP_PATTERN_HEIGHT=14;const GRID_GAP_PATTERN_LINE_DASH=[5,3];const GRID_GAP_ALPHA=0.5;

const OFFSET_FROM_EDGE=32;
const FLIP_ARROW_INSIDE_FACTOR=2.5;function rotateEdgeRight(edge){switch(edge){case"top":return"right";case"right":return"bottom";case"bottom":return"left";case"left":return"top";default:return edge;}}
function rotateEdgeLeft(edge){switch(edge){case"top":return"left";case"right":return"top";case"bottom":return"right";case"left":return"bottom";default:return edge;}}
function reflectEdge(edge){switch(edge){case"top":return"bottom";case"right":return"left";case"bottom":return"top";case"left":return"right";default:return edge;}}
const gCachedGridPattern=new Map();class CssGridHighlighter extends AutoRefreshHighlighter{constructor(highlighterEnv){super(highlighterEnv);this.ID_CLASS_PREFIX="css-grid-";this.markup=new CanvasFrameAnonymousContentHelper(this.highlighterEnv,this._buildMarkup.bind(this));this.isReady=this.markup.initialize();this.onPageHide=this.onPageHide.bind(this);this.onWillNavigate=this.onWillNavigate.bind(this);this.highlighterEnv.on("will-navigate",this.onWillNavigate);const{pageListenerTarget}=highlighterEnv;pageListenerTarget.addEventListener("pagehide",this.onPageHide);this._canvasPosition={x:0,y:0,};
updateCanvasPosition(this._canvasPosition,this._scroll,this.win,this._winDimensions);}
_buildMarkup(){const container=this.markup.createNode({attributes:{class:"highlighter-container",},});const root=this.markup.createNode({parent:container,attributes:{id:"root",class:"root",},prefix:this.ID_CLASS_PREFIX,});

this.markup.createNode({parent:root,nodeType:"canvas",attributes:{id:"canvas",class:"canvas",hidden:"true",width:CANVAS_SIZE,height:CANVAS_SIZE,},prefix:this.ID_CLASS_PREFIX,});const svg=this.markup.createSVGNode({nodeType:"svg",parent:root,attributes:{id:"elements",width:"100%",height:"100%",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const regions=this.markup.createSVGNode({nodeType:"g",parent:svg,attributes:{class:"regions",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"path",parent:regions,attributes:{class:"areas",id:"areas",},prefix:this.ID_CLASS_PREFIX,});this.markup.createSVGNode({nodeType:"path",parent:regions,attributes:{class:"cells",id:"cells",},prefix:this.ID_CLASS_PREFIX,});const areaInfobarContainer=this.markup.createNode({parent:container,attributes:{class:"area-infobar-container",id:"area-infobar-container",position:"top",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const areaInfobar=this.markup.createNode({parent:areaInfobarContainer,attributes:{class:"infobar",},prefix:this.ID_CLASS_PREFIX,});const areaTextbox=this.markup.createNode({parent:areaInfobar,attributes:{class:"infobar-text",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:areaTextbox,attributes:{class:"area-infobar-name",id:"area-infobar-name",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:areaTextbox,attributes:{class:"area-infobar-dimensions",id:"area-infobar-dimensions",},prefix:this.ID_CLASS_PREFIX,});const cellInfobarContainer=this.markup.createNode({parent:container,attributes:{class:"cell-infobar-container",id:"cell-infobar-container",position:"top",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const cellInfobar=this.markup.createNode({parent:cellInfobarContainer,attributes:{class:"infobar",},prefix:this.ID_CLASS_PREFIX,});const cellTextbox=this.markup.createNode({parent:cellInfobar,attributes:{class:"infobar-text",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:cellTextbox,attributes:{class:"cell-infobar-position",id:"cell-infobar-position",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:cellTextbox,attributes:{class:"cell-infobar-dimensions",id:"cell-infobar-dimensions",},prefix:this.ID_CLASS_PREFIX,});const lineInfobarContainer=this.markup.createNode({parent:container,attributes:{class:"line-infobar-container",id:"line-infobar-container",position:"top",hidden:"true",},prefix:this.ID_CLASS_PREFIX,});const lineInfobar=this.markup.createNode({parent:lineInfobarContainer,attributes:{class:"infobar",},prefix:this.ID_CLASS_PREFIX,});const lineTextbox=this.markup.createNode({parent:lineInfobar,attributes:{class:"infobar-text",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:lineTextbox,attributes:{class:"line-infobar-number",id:"line-infobar-number",},prefix:this.ID_CLASS_PREFIX,});this.markup.createNode({nodeType:"span",parent:lineTextbox,attributes:{class:"line-infobar-names",id:"line-infobar-names",},prefix:this.ID_CLASS_PREFIX,});return container;}
clearCache(){gCachedGridPattern.clear();}
clearGridAreas(){const areas=this.getElement("areas");areas.setAttribute("d","");}
clearGridCell(){const cells=this.getElement("cells");cells.setAttribute("d","");}
destroy(){const{highlighterEnv}=this;highlighterEnv.off("will-navigate",this.onWillNavigate);const{pageListenerTarget}=highlighterEnv;if(pageListenerTarget){pageListenerTarget.removeEventListener("pagehide",this.onPageHide);}
this.markup.destroy();this.clearCache();AutoRefreshHighlighter.prototype.destroy.call(this);}
get canvas(){return this.getElement("canvas");}
get color(){return this.options.color||DEFAULT_COLOR;}
get ctx(){return this.canvas.getCanvasContext("2d");}
get globalAlpha(){return this.options.globalAlpha||1;}
getElement(id){return this.markup.getElement(this.ID_CLASS_PREFIX+id);}
getFirstColLinePos(fragment){return fragment.cols.lines[0].start;}
getFirstRowLinePos(fragment){return fragment.rows.lines[0].start;}
getGridGapPattern(devicePixelRatio,dimension){let gridPatternMap=null;if(gCachedGridPattern.has(devicePixelRatio)){gridPatternMap=gCachedGridPattern.get(devicePixelRatio);}else{gridPatternMap=new Map();}
if(gridPatternMap.has(dimension)){return gridPatternMap.get(dimension);}
const canvas=this.markup.createNode({nodeType:"canvas"});const width=(canvas.width=GRID_GAP_PATTERN_WIDTH*devicePixelRatio);const height=(canvas.height=GRID_GAP_PATTERN_HEIGHT*devicePixelRatio);const ctx=canvas.getContext("2d");ctx.save();ctx.setLineDash(GRID_GAP_PATTERN_LINE_DASH);ctx.beginPath();ctx.translate(0.5,0.5);if(dimension===COLUMNS){ctx.moveTo(0,0);ctx.lineTo(width,height);}else{ctx.moveTo(width,0);ctx.lineTo(0,height);}
ctx.strokeStyle=this.color;ctx.globalAlpha=GRID_GAP_ALPHA*this.globalAlpha;ctx.stroke();ctx.restore();const pattern=ctx.createPattern(canvas,"repeat");gridPatternMap.set(dimension,pattern);gCachedGridPattern.set(devicePixelRatio,gridPatternMap);return pattern;}
getLastColLinePos(fragment){return fragment.cols.lines[fragment.cols.lines.length-1].start;}
getLastEdgeLineIndex(tracks){let trackIndex=tracks.length-1;while(trackIndex>=0&&tracks[trackIndex].type!="explicit"){trackIndex--;}
return trackIndex+1;}
getLastRowLinePos(fragment){return fragment.rows.lines[fragment.rows.lines.length-1].start;}
_hasMoved(){const hasMoved=AutoRefreshHighlighter.prototype._hasMoved.call(this);const oldGridData=stringifyGridFragments(this.gridData);this.gridData=this.currentNode.getGridFragments();const newGridData=stringifyGridFragments(this.gridData);return hasMoved||oldGridData!==newGridData;}
_hide(){setIgnoreLayoutChanges(true);this._hideGrid();this._hideGridElements();this._hideGridAreaInfoBar();this._hideGridCellInfoBar();this._hideGridLineInfoBar();setIgnoreLayoutChanges(false,this.highlighterEnv.document.documentElement);}
_hideGrid(){this.getElement("canvas").setAttribute("hidden","true");}
_hideGridAreaInfoBar(){this.getElement("area-infobar-container").setAttribute("hidden","true");}
_hideGridCellInfoBar(){this.getElement("cell-infobar-container").setAttribute("hidden","true");}
_hideGridElements(){this.getElement("elements").setAttribute("hidden","true");}
_hideGridLineInfoBar(){this.getElement("line-infobar-container").setAttribute("hidden","true");}
isGrid(){return this.currentNode.hasGridFragments();}
isValidFragment(fragment){return fragment.cols.tracks.length&&fragment.rows.tracks.length;}
_scrollUpdate(){const hasUpdated=updateCanvasPosition(this._canvasPosition,this._scroll,this.win,this._winDimensions);if(hasUpdated){this._update();}}
_show(){if(!this.isGrid()){this.hide();return false;}
this.clearCache();this._hide();return this._update();}
_showGrid(){this.getElement("canvas").removeAttribute("hidden");}
_showGridAreaInfoBar(){this.getElement("area-infobar-container").removeAttribute("hidden");}
_showGridCellInfoBar(){this.getElement("cell-infobar-container").removeAttribute("hidden");}
_showGridElements(){this.getElement("elements").removeAttribute("hidden");}
_showGridLineInfoBar(){this.getElement("line-infobar-container").removeAttribute("hidden");}
showAllGridAreas(){this.renderGridArea();}
showGridArea(areaName){this.renderGridArea(areaName);}
showGridCell({gridFragmentIndex,rowNumber,columnNumber}){this.renderGridCell(gridFragmentIndex,rowNumber,columnNumber);}
showGridLineNames({gridFragmentIndex,lineNumber,type}){this.renderGridLineNames(gridFragmentIndex,lineNumber,type);}
onPageHide({target}){if(target.defaultView===this.win){this.hide();}}
onWillNavigate({isTopLevel}){this.clearCache();if(isTopLevel){this.hide();}}
renderFragment(fragment){if(!this.isValidFragment(fragment)){return;}
this.renderLines(fragment.cols,COLUMNS,this.getFirstRowLinePos(fragment),this.getLastRowLinePos(fragment));this.renderLines(fragment.rows,ROWS,this.getFirstColLinePos(fragment),this.getLastColLinePos(fragment));if(this.options.showGridAreasOverlay){this.renderGridAreaOverlay();}
if(this.options.showGridLineNumbers){this.renderLineNumbers(fragment.cols,COLUMNS,this.getFirstRowLinePos(fragment));this.renderLineNumbers(fragment.rows,ROWS,this.getFirstColLinePos(fragment));this.renderNegativeLineNumbers(fragment.cols,COLUMNS,this.getLastRowLinePos(fragment));this.renderNegativeLineNumbers(fragment.rows,ROWS,this.getLastColLinePos(fragment));}}
renderGridArea(areaName){const{devicePixelRatio}=this.win;const displayPixelRatio=getDisplayPixelRatio(this.win);const paths=[];for(let i=0;i<this.gridData.length;i++){const fragment=this.gridData[i];for(const area of fragment.areas){if(areaName&&areaName!=area.name){continue;}
const rowStart=fragment.rows.lines[area.rowStart-1];const rowEnd=fragment.rows.lines[area.rowEnd-1];const columnStart=fragment.cols.lines[area.columnStart-1];const columnEnd=fragment.cols.lines[area.columnEnd-1];const x1=columnStart.start+columnStart.breadth;const y1=rowStart.start+rowStart.breadth;const x2=columnEnd.start;const y2=rowEnd.start;const points=getPointsFromDiagonal(x1,y1,x2,y2,this.currentMatrix);
const svgPoints=points.map(point=>({x:Math.round(point.x/devicePixelRatio),y:Math.round(point.y/devicePixelRatio),}));
const bounds=getBoundsFromPoints(points.map(point=>({x:Math.round(point.x/displayPixelRatio),y:Math.round(point.y/displayPixelRatio),})));paths.push(getPathDescriptionFromPoints(svgPoints));if(areaName){this._showGridAreaInfoBar();this._updateGridAreaInfobar(area,bounds);}}}
const areas=this.getElement("areas");areas.setAttribute("d",paths.join(" "));}
renderGridAreaName(fragment,area){const{rowStart,rowEnd,columnStart,columnEnd}=area;const{devicePixelRatio}=this.win;const displayPixelRatio=getDisplayPixelRatio(this.win);const offset=(displayPixelRatio/2)%1;let fontSize=GRID_AREA_NAME_FONT_SIZE*displayPixelRatio;const canvasX=Math.round(this._canvasPosition.x*devicePixelRatio);const canvasY=Math.round(this._canvasPosition.y*devicePixelRatio);this.ctx.save();this.ctx.translate(offset-canvasX,offset-canvasY);this.ctx.font=fontSize+"px "+GRID_FONT_FAMILY;this.ctx.globalAlpha=this.globalAlpha;this.ctx.strokeStyle=this.color;this.ctx.textAlign="center";this.ctx.textBaseline="middle";for(let rowNumber=rowStart;rowNumber<rowEnd;rowNumber++){for(let columnNumber=columnStart;columnNumber<columnEnd;columnNumber++){const row=fragment.rows.tracks[rowNumber-1];const column=fragment.cols.tracks[columnNumber-1];
if(fontSize>column.breadth*displayPixelRatio||fontSize>row.breadth*displayPixelRatio){fontSize=Math.min([column.breadth,row.breadth]);this.ctx.font=fontSize+"px "+GRID_FONT_FAMILY;}
const textWidth=this.ctx.measureText(area.name).width;const textHeight=this.ctx.measureText("m").width;const padding=3*displayPixelRatio;const boxWidth=textWidth+2*padding;const boxHeight=textHeight+2*padding;let x=column.start+column.breadth/2;let y=row.start+row.breadth/2;[x,y]=apply(this.currentMatrix,[x,y]);const rectXPos=x-boxWidth/2;const rectYPos=y-boxHeight/2;this.ctx.lineWidth=1*displayPixelRatio;this.ctx.strokeStyle=this.color;this.ctx.fillStyle="white";const radius=2*displayPixelRatio;drawRoundedRect(this.ctx,rectXPos,rectYPos,boxWidth,boxHeight,radius);this.ctx.fillStyle=this.color;this.ctx.fillText(area.name,x,y+padding);}}
this.ctx.restore();}
renderGridAreaOverlay(){const padding=1;for(let i=0;i<this.gridData.length;i++){const fragment=this.gridData[i];for(const area of fragment.areas){const{rowStart,rowEnd,columnStart,columnEnd,type}=area;if(type==="implicit"){continue;}
const areaColStart=fragment.cols.lines[columnStart-1];const areaColEnd=fragment.cols.lines[columnEnd-1];const areaRowStart=fragment.rows.lines[rowStart-1];const areaRowEnd=fragment.rows.lines[rowEnd-1];const areaColStartLinePos=areaColStart.start+areaColStart.breadth;const areaRowStartLinePos=areaRowStart.start+areaRowStart.breadth;this.renderLine(areaColStartLinePos+padding,areaRowStartLinePos,areaRowEnd.start,COLUMNS,"areaEdge");this.renderLine(areaColEnd.start-padding,areaRowStartLinePos,areaRowEnd.start,COLUMNS,"areaEdge");this.renderLine(areaRowStartLinePos+padding,areaColStartLinePos,areaColEnd.start,ROWS,"areaEdge");this.renderLine(areaRowEnd.start-padding,areaColStartLinePos,areaColEnd.start,ROWS,"areaEdge");this.renderGridAreaName(fragment,area);}}}
renderGridCell(gridFragmentIndex,rowNumber,columnNumber){const fragment=this.gridData[gridFragmentIndex];if(!fragment){return;}
const row=fragment.rows.tracks[rowNumber-1];const column=fragment.cols.tracks[columnNumber-1];if(!row||!column){return;}
const x1=column.start;const y1=row.start;const x2=column.start+column.breadth;const y2=row.start+row.breadth;const{devicePixelRatio}=this.win;const displayPixelRatio=getDisplayPixelRatio(this.win);const points=getPointsFromDiagonal(x1,y1,x2,y2,this.currentMatrix);const svgPoints=points.map(point=>({x:Math.round(point.x/devicePixelRatio),y:Math.round(point.y/devicePixelRatio),}));
const bounds=getBoundsFromPoints(points.map(point=>({x:Math.round(point.x/displayPixelRatio),y:Math.round(point.y/displayPixelRatio),})));const cells=this.getElement("cells");cells.setAttribute("d",getPathDescriptionFromPoints(svgPoints));this._showGridCellInfoBar();this._updateGridCellInfobar(rowNumber,columnNumber,bounds);}
renderGridGap(linePos,startPos,endPos,breadth,dimensionType){const{devicePixelRatio}=this.win;const displayPixelRatio=getDisplayPixelRatio(this.win);const offset=(displayPixelRatio/2)%1;const canvasX=Math.round(this._canvasPosition.x*devicePixelRatio);const canvasY=Math.round(this._canvasPosition.y*devicePixelRatio);linePos=Math.round(linePos);startPos=Math.round(startPos);breadth=Math.round(breadth);this.ctx.save();this.ctx.fillStyle=this.getGridGapPattern(devicePixelRatio,dimensionType);this.ctx.translate(offset-canvasX,offset-canvasY);if(dimensionType===COLUMNS){if(isFinite(endPos)){endPos=Math.round(endPos);}else{endPos=this._winDimensions.height;startPos=-endPos;}
drawRect(this.ctx,linePos,startPos,linePos+breadth,endPos,this.currentMatrix);}else{if(isFinite(endPos)){endPos=Math.round(endPos);}else{endPos=this._winDimensions.width;startPos=-endPos;}
drawRect(this.ctx,startPos,linePos,endPos,linePos+breadth,this.currentMatrix);}
const p1=apply(this.currentMatrix,[0,0]);const p2=apply(this.currentMatrix,[1,0]);const angleRad=Math.atan2(p2[1]-p1[1],p2[0]-p1[0]);this.ctx.rotate(angleRad);this.ctx.fill();this.ctx.restore();}
renderGridLineNames(gridFragmentIndex,lineNumber,dimensionType){const fragment=this.gridData[gridFragmentIndex];if(!fragment||!lineNumber||!dimensionType){return;}
const{names}=fragment[dimensionType].lines[lineNumber-1];let linePos;if(dimensionType===ROWS){linePos=fragment.rows.lines[lineNumber-1];}else if(dimensionType===COLUMNS){linePos=fragment.cols.lines[lineNumber-1];}
if(!linePos){return;}
const currentZoom=getCurrentZoom(this.win);const{bounds}=this.currentQuads.content[gridFragmentIndex];const rowYPosition=fragment.rows.lines[0];const colXPosition=fragment.rows.lines[0];const x=dimensionType===COLUMNS?linePos.start+bounds.left/currentZoom:colXPosition.start+bounds.left/currentZoom;const y=dimensionType===ROWS?linePos.start+bounds.top/currentZoom:rowYPosition.start+bounds.top/currentZoom;this._showGridLineInfoBar();this._updateGridLineInfobar(names.join(", "),lineNumber,x,y);} 
renderGridLineNumber(lineNumber,linePos,startPos,breadth,dimensionType,isStackedLine){const displayPixelRatio=getDisplayPixelRatio(this.win);const{devicePixelRatio}=this.win;const offset=(displayPixelRatio/2)%1;const fontSize=GRID_FONT_SIZE*devicePixelRatio;const canvasX=Math.round(this._canvasPosition.x*devicePixelRatio);const canvasY=Math.round(this._canvasPosition.y*devicePixelRatio);linePos=Math.round(linePos);startPos=Math.round(startPos);breadth=Math.round(breadth);if(linePos+breadth<0){return;}
this.ctx.save();this.ctx.translate(offset-canvasX,offset-canvasY);this.ctx.font=fontSize+"px "+GRID_FONT_FAMILY;

const textHeight=this.ctx.measureText("m").width;const textWidth=Math.max(textHeight,this.ctx.measureText(lineNumber).width);const padding=3*devicePixelRatio;const offsetFromEdge=2*devicePixelRatio;let boxWidth=textWidth+2*padding;let boxHeight=textHeight+2*padding;

let x,y;if(dimensionType===COLUMNS){x=linePos+breadth/2;y=lineNumber>0?startPos-offsetFromEdge:startPos+offsetFromEdge;}else if(dimensionType===ROWS){y=linePos+breadth/2;x=lineNumber>0?startPos-offsetFromEdge:startPos+offsetFromEdge;}
[x,y]=apply(this.currentMatrix,[x,y]);

this.ctx.lineWidth=2*displayPixelRatio;this.ctx.strokeStyle=this.color;this.ctx.fillStyle="white";this.ctx.globalAlpha=this.globalAlpha;const radius=2*displayPixelRatio;const margin=2*displayPixelRatio;const arrowSize=8*displayPixelRatio;const minBoxSize=arrowSize*2+padding;boxWidth=Math.max(boxWidth,minBoxSize);boxHeight=Math.max(boxHeight,minBoxSize);const boxEdge=this.getBoxEdge(dimensionType,lineNumber);let{width,height}=this._winDimensions;width*=displayPixelRatio;height*=displayPixelRatio;if((dimensionType===ROWS&&(y<0||y>height))||(dimensionType===COLUMNS&&(x<0||x>width))){this.ctx.restore();return;}

const minOffsetFromEdge=OFFSET_FROM_EDGE*displayPixelRatio;switch(boxEdge){case"left":if(x<minOffsetFromEdge){x+=FLIP_ARROW_INSIDE_FACTOR*boxWidth;}
break;case"right":if(width-x<minOffsetFromEdge){x-=FLIP_ARROW_INSIDE_FACTOR*boxWidth;}
break;case"top":if(y<minOffsetFromEdge){y+=FLIP_ARROW_INSIDE_FACTOR*boxHeight;}
break;case"bottom":if(height-y<minOffsetFromEdge){y-=FLIP_ARROW_INSIDE_FACTOR*boxHeight;}
break;}

if(isStackedLine){const xOffset=boxWidth/4;const yOffset=boxHeight/4;if(lineNumber>0){x-=xOffset;y-=yOffset;}else{x+=xOffset;y+=yOffset;}}



let grewBox=false;const boxWidthBeforeGrowth=boxWidth;const boxHeightBeforeGrowth=boxHeight;if(dimensionType===ROWS&&y<=boxHeight/2){grewBox=true;boxHeight=2*(boxHeight-y);}else if(dimensionType===ROWS&&y>=height-boxHeight/2){grewBox=true;boxHeight=2*(y-height+boxHeight);}else if(dimensionType===COLUMNS&&x<=boxWidth/2){grewBox=true;boxWidth=2*(boxWidth-x);}else if(dimensionType===COLUMNS&&x>=width-boxWidth/2){grewBox=true;boxWidth=2*(x-width+boxWidth);} 
drawBubbleRect(this.ctx,x,y,boxWidth,boxHeight,radius,margin,arrowSize,boxEdge);switch(boxEdge){case"left":x-=boxWidth+arrowSize+radius-boxWidth/2;break;case"right":x+=boxWidth+arrowSize+radius-boxWidth/2;break;case"top":y-=boxHeight+arrowSize+radius-boxHeight/2;break;case"bottom":y+=boxHeight+arrowSize+radius-boxHeight/2;break;}

if(grewBox){if(dimensionType===ROWS&&y<=boxHeightBeforeGrowth/2){y=boxHeightBeforeGrowth/2;}else if(dimensionType===ROWS&&y>=height-boxHeightBeforeGrowth/2){y=height-boxHeightBeforeGrowth/2;}else if(dimensionType===COLUMNS&&x<=boxWidthBeforeGrowth/2){x=boxWidthBeforeGrowth/2;}else if(dimensionType===COLUMNS&&x>=width-boxWidthBeforeGrowth/2){x=width-boxWidthBeforeGrowth/2;}}
this.ctx.textAlign="center";this.ctx.textBaseline="middle";this.ctx.fillStyle="black";const numberText=isStackedLine?"":lineNumber;this.ctx.fillText(numberText,x,y);this.ctx.restore();}
getBoxEdge(dimensionType,lineNumber){let boxEdge;if(dimensionType===COLUMNS){boxEdge=lineNumber>0?"top":"bottom";}else if(dimensionType===ROWS){boxEdge=lineNumber>0?"left":"right";}
const{direction,writingMode}=getComputedStyle(this.currentNode);switch(writingMode){case"horizontal-tb":break;case"vertical-rl":boxEdge=rotateEdgeRight(boxEdge);break;case"vertical-lr":if(dimensionType===COLUMNS){boxEdge=rotateEdgeLeft(boxEdge);}else{boxEdge=rotateEdgeRight(boxEdge);}
break;case"sideways-rl":boxEdge=rotateEdgeRight(boxEdge);break;case"sideways-lr":boxEdge=rotateEdgeLeft(boxEdge);break;default:console.error(`Unexpected writing-mode: ${writingMode}`);}
switch(direction){case"ltr":break;case"rtl":if(dimensionType===ROWS){boxEdge=reflectEdge(boxEdge);}
break;default:console.error(`Unexpected direction: ${direction}`);}
return boxEdge;}
renderLine(linePos,startPos,endPos,dimensionType,lineType){const{devicePixelRatio}=this.win;const lineWidth=getDisplayPixelRatio(this.win);const offset=(lineWidth/2)%1;const canvasX=Math.round(this._canvasPosition.x*devicePixelRatio);const canvasY=Math.round(this._canvasPosition.y*devicePixelRatio);linePos=Math.round(linePos);startPos=Math.round(startPos);endPos=Math.round(endPos);this.ctx.save();this.ctx.setLineDash(GRID_LINES_PROPERTIES[lineType].lineDash);this.ctx.translate(offset-canvasX,offset-canvasY);const lineOptions={matrix:this.currentMatrix,};if(this.options.showInfiniteLines){lineOptions.extendToBoundaries=[canvasX,canvasY,canvasX+CANVAS_SIZE,canvasY+CANVAS_SIZE,];}
if(dimensionType===COLUMNS){drawLine(this.ctx,linePos,startPos,linePos,endPos,lineOptions);}else{drawLine(this.ctx,startPos,linePos,endPos,linePos,lineOptions);}
this.ctx.strokeStyle=this.color;this.ctx.globalAlpha=GRID_LINES_PROPERTIES[lineType].alpha*this.globalAlpha;if(GRID_LINES_PROPERTIES[lineType].lineWidth){this.ctx.lineWidth=GRID_LINES_PROPERTIES[lineType].lineWidth*devicePixelRatio;}else{this.ctx.lineWidth=lineWidth;}
this.ctx.stroke();this.ctx.restore();}
renderLines(gridDimension,dimensionType,startPos,endPos){const{lines,tracks}=gridDimension;const lastEdgeLineIndex=this.getLastEdgeLineIndex(tracks);for(let i=0;i<lines.length;i++){const line=lines[i];const linePos=line.start;if(i==0||i==lastEdgeLineIndex){this.renderLine(linePos,startPos,endPos,dimensionType,"edge");}else{this.renderLine(linePos,startPos,endPos,dimensionType,tracks[i-1].type);}
if(line.breadth>0){this.renderGridGap(linePos,startPos,endPos,line.breadth,dimensionType);this.renderLine(linePos+line.breadth,startPos,endPos,dimensionType,tracks[i].type);}}}
renderLineNumbers(gridDimension,dimensionType,startPos){const{lines,tracks}=gridDimension;for(let i=0,line;(line=lines[i++]);){





if(line.number===0){continue;}

const gridTrack=tracks[i-1];if(gridTrack){const{breadth}=gridTrack;if(breadth===0){this.renderGridLineNumber(line.number,line.start,startPos,line.breadth,dimensionType,true);continue;}}
this.renderGridLineNumber(line.number,line.start,startPos,line.breadth,dimensionType);}}
renderNegativeLineNumbers(gridDimension,dimensionType,startPos){const{lines,tracks}=gridDimension;for(let i=0,line;(line=lines[i++]);){const linePos=line.start;const negativeLineNumber=line.negativeNumber;if(negativeLineNumber==0){break;}

const gridTrack=tracks[i-1];if(gridTrack){const{breadth}=gridTrack;if(breadth===0&&negativeLineNumber!=-1){this.renderGridLineNumber(negativeLineNumber,linePos,startPos,line.breadth,dimensionType,true);continue;}}
this.renderGridLineNumber(negativeLineNumber,linePos,startPos,line.breadth,dimensionType);}}
_update(){setIgnoreLayoutChanges(true);this.markup.content.setStyle("z-index",this.options.zIndex);const root=this.getElement("root");const cells=this.getElement("cells");const areas=this.getElement("areas");cells.setAttribute("style",`fill: ${this.color}`);areas.setAttribute("style",`fill: ${this.color}`);
root.setAttribute("style","display: none");this.win.document.documentElement.offsetWidth;this._winDimensions=getWindowDimensions(this.win);const{width,height}=this._winDimensions;updateCanvasElement(this.canvas,this._canvasPosition,this.win.devicePixelRatio);this.clearGridAreas();this.clearGridCell();const{currentMatrix,hasNodeTransformations}=getCurrentMatrix(this.currentNode,this.win);this.currentMatrix=currentMatrix;this.hasNodeTransformations=hasNodeTransformations;for(let i=0;i<this.gridData.length;i++){this.renderFragment(this.gridData[i]);}
if(this.options.showAllGridAreas){this.showAllGridAreas();}else if(this.options.showGridArea){this.showGridArea(this.options.showGridArea);}
if(this.options.showGridCell){this.showGridCell(this.options.showGridCell);}
if(this.options.showGridLineNames){this.showGridLineNames(this.options.showGridLineNames);}
this._showGrid();this._showGridElements();root.setAttribute("style",`position: absolute; width: ${width}px; height: ${height}px; overflow: hidden`);setIgnoreLayoutChanges(false,this.highlighterEnv.document.documentElement);return true;}
_updateGridAreaInfobar(area,bounds){const{width,height}=bounds;const dim=parseFloat(width.toPrecision(6))+" \u00D7 "+
parseFloat(height.toPrecision(6));this.getElement("area-infobar-name").setTextContent(area.name);this.getElement("area-infobar-dimensions").setTextContent(dim);const container=this.getElement("area-infobar-container");moveInfobar(container,bounds,this.win,{position:"bottom",hideIfOffscreen:true,});}
_updateGridCellInfobar(rowNumber,columnNumber,bounds){const{width,height}=bounds;const dim=parseFloat(width.toPrecision(6))+" \u00D7 "+
parseFloat(height.toPrecision(6));const position=L10N.getFormatStr("grid.rowColumnPositions",rowNumber,columnNumber);this.getElement("cell-infobar-position").setTextContent(position);this.getElement("cell-infobar-dimensions").setTextContent(dim);const container=this.getElement("cell-infobar-container");moveInfobar(container,bounds,this.win,{position:"top",hideIfOffscreen:true,});}
_updateGridLineInfobar(gridLineNames,gridLineNumber,x,y){this.getElement("line-infobar-number").setTextContent(gridLineNumber);this.getElement("line-infobar-names").setTextContent(gridLineNames);const container=this.getElement("line-infobar-container");moveInfobar(container,getBoundsFromPoints([{x,y},{x,y},{x,y},{x,y},]),this.win);}}
exports.CssGridHighlighter=CssGridHighlighter;