"use strict";const{Cu,Cc,Ci}=require("chrome");const Services=require("Services");const{LocalizationHelper}=require("devtools/shared/l10n");loader.lazyRequireGetter(this,"getRect","devtools/shared/layout/utils",true);const CONTAINER_FLASHING_DURATION=500;const STRINGS_URI="devtools/shared/locales/screenshot.properties";const L10N=new LocalizationHelper(STRINGS_URI);
const MAX_IMAGE_WIDTH=10000;const MAX_IMAGE_HEIGHT=10000;function simulateCameraFlash(document){const window=document.defaultView;const frames=Cu.cloneInto({opacity:[0,1]},window);document.documentElement.animate(frames,CONTAINER_FLASHING_DURATION);}
function captureScreenshot(args,document){if(args.help){return null;}
if(args.delay>0){return new Promise((resolve,reject)=>{document.defaultView.setTimeout(()=>{createScreenshotDataURL(document,args).then(resolve,reject);},args.delay*1000);});}
return createScreenshotDataURL(document,args);}
exports.captureScreenshot=captureScreenshot;function createScreenshotDataURL(document,args){let window=document.defaultView;let left=0;let top=0;let width;let height;const currentX=window.scrollX;const currentY=window.scrollY;let filename=getFilename(args.filename);if(args.fullpage){
 window.scrollTo(0,0);width=window.innerWidth+window.scrollMaxX-window.scrollMinX;height=window.innerHeight+window.scrollMaxY-window.scrollMinY;filename=filename.replace(".png","-fullpage.png");}else if(args.rawNode){window=args.rawNode.ownerDocument.defaultView;({top,left,width,height}=getRect(window,args.rawNode,window));}else if(args.selector){const node=window.document.querySelector(args.selector);({top,left,width,height}=getRect(window,node,window));}else{left=window.scrollX;top=window.scrollY;width=window.innerWidth;height=window.innerHeight;} 
if(args.fullpage){const winUtils=window.windowUtils;const scrollbarHeight={};const scrollbarWidth={};winUtils.getScrollbarSize(false,scrollbarWidth,scrollbarHeight);width-=scrollbarWidth.value;height-=scrollbarHeight.value;}
if(width>MAX_IMAGE_WIDTH||height>MAX_IMAGE_HEIGHT){width=Math.min(width,MAX_IMAGE_WIDTH);height=Math.min(height,MAX_IMAGE_HEIGHT);logWarningInPage(L10N.getFormatStr("screenshotTruncationWarning",width,height),window);}
const ratio=args.dpr?args.dpr:window.devicePixelRatio;const canvas=document.createElementNS("http://www.w3.org/1999/xhtml","canvas");const ctx=canvas.getContext("2d");const drawToCanvas=actualRatio=>{

try{canvas.width=width*actualRatio;canvas.height=height*actualRatio;ctx.scale(actualRatio,actualRatio);const flags=ctx.DRAWWINDOW_DRAW_CARET|ctx.DRAWWINDOW_DRAW_VIEW|ctx.DRAWWINDOW_USE_WIDGET_LAYERS;ctx.drawWindow(window,left,top,width,height,"#fff",flags);return canvas.toDataURL("image/png","");}catch(e){return null;}};let data=drawToCanvas(ratio);if(!data&&ratio>1.0){logWarningInPage(L10N.getStr("screenshotDPRDecreasedWarning"),window);data=drawToCanvas(1.0);}
if(!data){logErrorInPage(L10N.getStr("screenshotRenderingError"),window);} 
if(args.fullpage){window.scrollTo(currentX,currentY);}
if(data){simulateCameraFlash(document);}
return Promise.resolve({destinations:[],data,height,width,filename,});}
function getFilename(defaultName){ if(defaultName){return defaultName;}
const date=new Date();let dateString=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();dateString=dateString.split("-").map(function(part){if(part.length==1){part="0"+part;}
return part;}).join("-");const timeString=date.toTimeString().replace(/:/g,".").split(" ")[0];return(L10N.getFormatStr("screenshotGeneratedFilename",dateString,timeString)+".png");}
function logInPage(text,flags,window){const scriptError=Cc["@mozilla.org/scripterror;1"].createInstance(Ci.nsIScriptError);scriptError.initWithWindowID(text,null,null,0,0,flags,"screenshot",window.windowGlobalChild.innerWindowId);Services.console.logMessage(scriptError);}
const logErrorInPage=(text,window)=>logInPage(text,0,window);const logWarningInPage=(text,window)=>logInPage(text,1,window);