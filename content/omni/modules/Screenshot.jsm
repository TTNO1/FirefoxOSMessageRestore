//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["Screenshot"];this.Screenshot={get(window){let document=window.document;let canvas=document.createElementNS("http://www.w3.org/1999/xhtml","canvas");let docRect=document.body.getBoundingClientRect();let width=docRect.width;let height=docRect.height;
let scale=window.devicePixelRatio;canvas.setAttribute("width",Math.round(width*scale));canvas.setAttribute("height",Math.round(height*scale));let context=canvas.getContext("2d");let flags=context.DRAWWINDOW_DRAW_CARET|context.DRAWWINDOW_DRAW_VIEW|context.DRAWWINDOW_USE_WIDGET_LAYERS;context.scale(scale,scale);context.drawWindow(window,0,0,width,height,"rgb(255,255,255)",flags);return canvas.mozGetAsFile("screenshot","image/png");},};