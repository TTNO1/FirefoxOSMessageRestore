"use strict";const{apply,getNodeTransformationMatrix,getWritingModeMatrix,identity,isIdentity,multiply,scale,translate,}=require("devtools/shared/layout/dom-matrix-2d");const{getCurrentZoom,getViewportDimensions,}=require("devtools/shared/layout/utils");const{getComputedStyle,}=require("devtools/server/actors/highlighters/utils/markup");




const CANVAS_SIZE=4096;const DEFAULT_COLOR="#9400FF";function clearRect(ctx,x1,y1,x2,y2,matrix=identity()){const p=getPointsFromDiagonal(x1,y1,x2,y2,matrix);
ctx.save();ctx.beginPath();ctx.moveTo(Math.round(p[0].x),Math.round(p[0].y));ctx.lineTo(Math.round(p[1].x),Math.round(p[1].y));ctx.lineTo(Math.round(p[2].x),Math.round(p[2].y));ctx.lineTo(Math.round(p[3].x),Math.round(p[3].y));ctx.closePath();ctx.clip();
ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
ctx.restore();}
function drawBubbleRect(ctx,x,y,width,height,radius,margin,arrowSize,alignment){let angle=0;if(alignment==="bottom"){angle=180;}else if(alignment==="right"){angle=90;[width,height]=[height,width];}else if(alignment==="left"){[width,height]=[height,width];angle=270;}
const originX=x;const originY=y;ctx.save();ctx.translate(originX,originY);ctx.rotate(angle*(Math.PI/180));ctx.translate(-originX,-originY);ctx.translate(-width/2,-height-arrowSize-margin);

ctx.beginPath();ctx.moveTo(x,y+radius);ctx.lineTo(x,y+height);ctx.lineTo(x+width/2,y+height+arrowSize);ctx.lineTo(x+width,y+height);ctx.lineTo(x+width,y+radius);ctx.arcTo(x+width,y,x+width-radius,y,radius);ctx.lineTo(x+radius,y);ctx.arcTo(x,y,x,y+radius,radius);ctx.stroke();ctx.fill();ctx.restore();}
function drawLine(ctx,x1,y1,x2,y2,options){const matrix=options.matrix||identity();const p1=apply(matrix,[x1,y1]);const p2=apply(matrix,[x2,y2]);x1=p1[0];y1=p1[1];x2=p2[0];y2=p2[1];if(options.extendToBoundaries){if(p1[1]===p2[1]){x1=options.extendToBoundaries[0];x2=options.extendToBoundaries[2];}else{y1=options.extendToBoundaries[1];x1=((p2[0]-p1[0])*(y1-p1[1]))/(p2[1]-p1[1])+p1[0];y2=options.extendToBoundaries[3];x2=((p2[0]-p1[0])*(y2-p1[1]))/(p2[1]-p1[1])+p1[0];}}
ctx.beginPath();ctx.moveTo(Math.round(x1),Math.round(y1));ctx.lineTo(Math.round(x2),Math.round(y2));}
function drawRect(ctx,x1,y1,x2,y2,matrix=identity()){const p=getPointsFromDiagonal(x1,y1,x2,y2,matrix);ctx.beginPath();ctx.moveTo(Math.round(p[0].x),Math.round(p[0].y));ctx.lineTo(Math.round(p[1].x),Math.round(p[1].y));ctx.lineTo(Math.round(p[2].x),Math.round(p[2].y));ctx.lineTo(Math.round(p[3].x),Math.round(p[3].y));ctx.closePath();}
function drawRoundedRect(ctx,x,y,width,height,radius){ctx.beginPath();ctx.moveTo(x,y+radius);ctx.lineTo(x,y+height-radius);ctx.arcTo(x,y+height,x+radius,y+height,radius);ctx.lineTo(x+width-radius,y+height);ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);ctx.lineTo(x+width,y+radius);ctx.arcTo(x+width,y,x+width-radius,y,radius);ctx.lineTo(x+radius,y);ctx.arcTo(x,y,x,y+radius,radius);ctx.stroke();ctx.fill();}
function getBoundsFromPoints(points){const bounds={};bounds.left=Math.min(points[0].x,points[1].x,points[2].x,points[3].x);bounds.right=Math.max(points[0].x,points[1].x,points[2].x,points[3].x);bounds.top=Math.min(points[0].y,points[1].y,points[2].y,points[3].y);bounds.bottom=Math.max(points[0].y,points[1].y,points[2].y,points[3].y);bounds.x=bounds.left;bounds.y=bounds.top;bounds.width=bounds.right-bounds.left;bounds.height=bounds.bottom-bounds.top;return bounds;}
function getCurrentMatrix(element,window,{ignoreWritingModeAndTextDirection}={}){const computedStyle=getComputedStyle(element);const paddingTop=parseFloat(computedStyle.paddingTop);const paddingRight=parseFloat(computedStyle.paddingRight);const paddingBottom=parseFloat(computedStyle.paddingBottom);const paddingLeft=parseFloat(computedStyle.paddingLeft);const borderTop=parseFloat(computedStyle.borderTopWidth);const borderRight=parseFloat(computedStyle.borderRightWidth);const borderBottom=parseFloat(computedStyle.borderBottomWidth);const borderLeft=parseFloat(computedStyle.borderLeftWidth);const nodeMatrix=getNodeTransformationMatrix(element,window.document.documentElement);let currentMatrix=identity();let hasNodeTransformations=false;currentMatrix=multiply(currentMatrix,scale(window.devicePixelRatio));
if(isIdentity(nodeMatrix)){hasNodeTransformations=false;}else{currentMatrix=multiply(currentMatrix,nodeMatrix);hasNodeTransformations=true;}
currentMatrix=multiply(currentMatrix,translate(paddingLeft+borderLeft,paddingTop+borderTop));const size={width:element.offsetWidth-
borderLeft-
borderRight-
paddingLeft-
paddingRight,height:element.offsetHeight-
borderTop-
borderBottom-
paddingTop-
paddingBottom,};if(!ignoreWritingModeAndTextDirection){const writingModeMatrix=getWritingModeMatrix(size,computedStyle);if(!isIdentity(writingModeMatrix)){currentMatrix=multiply(currentMatrix,writingModeMatrix);}}
return{currentMatrix,hasNodeTransformations};}
function getPathDescriptionFromPoints(points){return("M"+
points[0].x+","+
points[0].y+" "+"L"+
points[1].x+","+
points[1].y+" "+"L"+
points[2].x+","+
points[2].y+" "+"L"+
points[3].x+","+
points[3].y);}
function getPointsFromDiagonal(x1,y1,x2,y2,matrix=identity()){return[[x1,y1],[x2,y1],[x2,y2],[x1,y2],].map(point=>{const transformedPoint=apply(matrix,point);return{x:transformedPoint[0],y:transformedPoint[1]};});}
function updateCanvasElement(canvas,canvasPosition,devicePixelRatio,{zoomWindow}={}){let{x,y}=canvasPosition;const size=CANVAS_SIZE/devicePixelRatio;if(zoomWindow){const zoom=getCurrentZoom(zoomWindow);x*=zoom;y*=zoom;}

canvas.setAttribute("style",`width: ${size}px; height: ${size}px; transform: translate(${x}px, ${y}px);`);canvas.getCanvasContext("2d").clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);}
function updateCanvasPosition(canvasPosition,scrollPosition,window,windowDimensions){let{x:canvasX,y:canvasY}=canvasPosition;const{x:scrollX,y:scrollY}=scrollPosition;const cssCanvasSize=CANVAS_SIZE/window.devicePixelRatio;const viewportSize=getViewportDimensions(window);const{height,width}=windowDimensions;const canvasWidth=cssCanvasSize;const canvasHeight=cssCanvasSize;let hasUpdated=false;




const bufferSizeX=(canvasWidth-viewportSize.width)>>2;const bufferSizeY=(canvasHeight-viewportSize.height)>>2;const leftBoundary=0;const rightBoundary=width-canvasWidth;const topBoundary=0;const bottomBoundary=height-canvasHeight;const leftThreshold=scrollX-bufferSizeX;const rightThreshold=scrollX-canvasWidth+viewportSize.width+bufferSizeX;const topThreshold=scrollY-bufferSizeY;const bottomThreshold=scrollY-canvasHeight+viewportSize.height+bufferSizeY;if(canvasX<rightBoundary&&canvasX<rightThreshold){canvasX=Math.min(leftThreshold,rightBoundary);hasUpdated=true;}else if(canvasX>leftBoundary&&canvasX>leftThreshold){canvasX=Math.max(rightThreshold,leftBoundary);hasUpdated=true;}
if(canvasY<bottomBoundary&&canvasY<bottomThreshold){canvasY=Math.min(topThreshold,bottomBoundary);hasUpdated=true;}else if(canvasY>topBoundary&&canvasY>topThreshold){canvasY=Math.max(bottomThreshold,topBoundary);hasUpdated=true;}
canvasPosition.x=canvasX;canvasPosition.y=canvasY;return hasUpdated;}
exports.CANVAS_SIZE=CANVAS_SIZE;exports.DEFAULT_COLOR=DEFAULT_COLOR;exports.clearRect=clearRect;exports.drawBubbleRect=drawBubbleRect;exports.drawLine=drawLine;exports.drawRect=drawRect;exports.drawRoundedRect=drawRoundedRect;exports.getBoundsFromPoints=getBoundsFromPoints;exports.getCurrentMatrix=getCurrentMatrix;exports.getPathDescriptionFromPoints=getPathDescriptionFromPoints;exports.getPointsFromDiagonal=getPointsFromDiagonal;exports.updateCanvasElement=updateCanvasElement;exports.updateCanvasPosition=updateCanvasPosition;