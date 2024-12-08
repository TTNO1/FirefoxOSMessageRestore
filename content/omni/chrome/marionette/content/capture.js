"use strict";const EXPORTED_SYMBOLS=["capture"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());XPCOMUtils.defineLazyGlobalGetters(this,["crypto"]);const CONTEXT_2D="2d";const BG_COLOUR="rgb(255,255,255)";const MAX_CANVAS_DIMENSION=32767;const MAX_CANVAS_AREA=472907776;const PNG_MIME="image/png";const XHTML_NS="http://www.w3.org/1999/xhtml";this.capture={};capture.Format={Base64:0,Hash:1,};capture.canvas=async function(win,browsingContext,left,top,width,height,{canvas=null,flags=null,dX=0,dY=0,readback=false}={}){const scale=win.devicePixelRatio;let canvasHeight=height*scale;let canvasWidth=width*scale;
if(canvasWidth>MAX_CANVAS_DIMENSION){logger.warn("Limiting screen capture width to maximum allowed "+
MAX_CANVAS_DIMENSION+" pixels");width=Math.floor(MAX_CANVAS_DIMENSION/scale);canvasWidth=width*scale;}
if(canvasHeight>MAX_CANVAS_DIMENSION){logger.warn("Limiting screen capture height to maximum allowed "+
MAX_CANVAS_DIMENSION+" pixels");height=Math.floor(MAX_CANVAS_DIMENSION/scale);canvasHeight=height*scale;}
if(canvasWidth*canvasHeight>MAX_CANVAS_AREA){logger.warn("Limiting screen capture area to maximum allowed "+
MAX_CANVAS_AREA+" pixels");height=Math.floor(MAX_CANVAS_AREA/(canvasWidth*scale));canvasHeight=height*scale;}
if(canvas===null){canvas=win.document.createElementNS(XHTML_NS,"canvas");canvas.width=canvasWidth;canvas.height=canvasHeight;}
const ctx=canvas.getContext(CONTEXT_2D);if(readback){if(flags===null){flags=ctx.DRAWWINDOW_DRAW_CARET|ctx.DRAWWINDOW_DRAW_VIEW|ctx.DRAWWINDOW_USE_WIDGET_LAYERS;}
ctx.scale(scale,scale);ctx.drawWindow(win,left+dX,top+dY,width,height,BG_COLOUR,flags);}else{let rect=new DOMRect(left,top,width,height);let snapshot=await browsingContext.currentWindowGlobal.drawSnapshot(rect,scale,BG_COLOUR);ctx.drawImage(snapshot,0,0);

snapshot.close();}
return canvas;};capture.toBase64=function(canvas){let u=canvas.toDataURL(PNG_MIME);return u.substring(u.indexOf(",")+1);};capture.toHash=function(canvas){let u=capture.toBase64(canvas);let buffer=new TextEncoder("utf-8").encode(u);return crypto.subtle.digest("SHA-256",buffer).then(hash=>hex(hash));};function hex(buffer){let hexCodes=[];let view=new DataView(buffer);for(let i=0;i<view.byteLength;i+=4){let value=view.getUint32(i);let stringValue=value.toString(16);let padding="00000000";let paddedValue=(padding+stringValue).slice(-padding.length);hexCodes.push(paddedValue);}
return hexCodes.join("");}