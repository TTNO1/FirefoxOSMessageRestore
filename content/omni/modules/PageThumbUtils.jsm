//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["PageThumbUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"BrowserUtils","resource://gre/modules/BrowserUtils.jsm");var PageThumbUtils={ THUMBNAIL_DEFAULT_SIZE:448,THUMBNAIL_BG_COLOR:"#fff",HTML_NAMESPACE:"http://www.w3.org/1999/xhtml",createCanvas(aWindow,aWidth=0,aHeight=0){let doc=aWindow.document;let canvas=doc.createElementNS(this.HTML_NAMESPACE,"canvas");canvas.mozOpaque=true;canvas.imageSmoothingEnabled=true;let[thumbnailWidth,thumbnailHeight]=this.getThumbnailSize(aWindow);canvas.width=aWidth?aWidth:thumbnailWidth;canvas.height=aHeight?aHeight:thumbnailHeight;return canvas;},getThumbnailSize(aWindow=null){if(!this._thumbnailWidth||!this._thumbnailHeight){let screenManager=Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);let left={},top={},screenWidth={},screenHeight={};screenManager.primaryScreen.GetRectDisplayPix(left,top,screenWidth,screenHeight);let primaryScale=screenManager.primaryScreen.defaultCSSScaleFactor;let windowScale=aWindow?aWindow.devicePixelRatio:primaryScale;let scale=Math.max(primaryScale,windowScale);let prefWidth=Services.prefs.getIntPref("toolkit.pageThumbs.minWidth");let prefHeight=Services.prefs.getIntPref("toolkit.pageThumbs.minHeight");let divisor=Services.prefs.getIntPref("toolkit.pageThumbs.screenSizeDivisor");prefWidth*=scale;prefHeight*=scale;this._thumbnailWidth=Math.max(Math.round(screenWidth.value/divisor),prefWidth);this._thumbnailHeight=Math.max(Math.round(screenHeight.value/divisor),prefHeight);}
return[this._thumbnailWidth,this._thumbnailHeight];},getContentSize(aWindow){let utils=aWindow.windowUtils;let sbWidth={};let sbHeight={};try{utils.getScrollbarSize(false,sbWidth,sbHeight);}catch(e){Cu.reportError("Unable to get scrollbar size in determineCropSize.");sbWidth.value=sbHeight.value=0;}
let width=aWindow.innerWidth-sbWidth.value;let height=aWindow.innerHeight-sbHeight.value;return[width,height];},async createImageThumbnailCanvas(window,url,targetWidth=448,backgroundColor=this.THUMBNAIL_BG_COLOR){ const doc=(window||Services.appShell.hiddenDOMWindow).document;let image=doc.querySelector("img");if(!image){image=doc.createElementNS(this.HTML_NAMESPACE,"img");await new Promise((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("LOAD_FAILED"));image.src=url;});} 
const imageWidth=image.naturalWidth||image.width;const imageHeight=image.naturalHeight||image.height;if(imageWidth===0||imageHeight===0){throw new Error("IMAGE_ZERO_DIMENSION");}
const width=Math.min(targetWidth,imageWidth);const height=(imageHeight*width)/imageWidth;




const canvasHeight=Math.min(height,width);const canvas=this.createCanvas(window,width,canvasHeight);const context=canvas.getContext("2d");context.fillStyle=backgroundColor;context.fillRect(0,0,width,canvasHeight);context.drawImage(image,0,0,width,height);return{width,height:canvasHeight,imageData:canvas.toDataURL(),};},createSnapshotThumbnail(aWindow,aDestCanvas,aArgs){let backgroundColor=aArgs?aArgs.backgroundColor:PageThumbUtils.THUMBNAIL_BG_COLOR;let fullScale=aArgs?aArgs.fullScale:false;let[contentWidth,contentHeight]=this.getContentSize(aWindow);let[thumbnailWidth,thumbnailHeight]=aDestCanvas?[aDestCanvas.width,aDestCanvas.height]:this.getThumbnailSize(aWindow);

if(fullScale){thumbnailWidth=contentWidth;thumbnailHeight=contentHeight;if(aDestCanvas){aDestCanvas.width=contentWidth;aDestCanvas.height=contentHeight;}}
let intermediateWidth=thumbnailWidth*2;let intermediateHeight=thumbnailHeight*2;let skipDownscale=false;

if(intermediateWidth>=contentWidth||intermediateHeight>=contentHeight||fullScale){intermediateWidth=thumbnailWidth;intermediateHeight=thumbnailHeight;skipDownscale=true;} 
let snapshotCanvas=this.createCanvas(aWindow,intermediateWidth,intermediateHeight);


let scale=Math.min(Math.max(intermediateWidth/contentWidth,intermediateHeight/contentHeight),1);let snapshotCtx=snapshotCanvas.getContext("2d");snapshotCtx.save();snapshotCtx.scale(scale,scale);snapshotCtx.drawWindow(aWindow,0,0,contentWidth,contentHeight,backgroundColor,snapshotCtx.DRAWWINDOW_DO_NOT_FLUSH);snapshotCtx.restore();

let finalCanvas=aDestCanvas||this.createCanvas(aWindow,thumbnailWidth,thumbnailHeight);let finalCtx=finalCanvas.getContext("2d");finalCtx.save();if(!skipDownscale){finalCtx.scale(0.5,0.5);}
finalCtx.drawImage(snapshotCanvas,0,0);finalCtx.restore();return finalCanvas;},determineCropSize(aWindow,aCanvas){let utils=aWindow.windowUtils;let sbWidth={};let sbHeight={};try{utils.getScrollbarSize(false,sbWidth,sbHeight);}catch(e){Cu.reportError("Unable to get scrollbar size in determineCropSize.");sbWidth.value=sbHeight.value=0;}
let width=aWindow.innerWidth-sbWidth.value;let height=aWindow.innerHeight-sbHeight.value;let{width:thumbnailWidth,height:thumbnailHeight}=aCanvas;let scale=Math.min(Math.max(thumbnailWidth/width,thumbnailHeight/height),1);let scaledWidth=width*scale;let scaledHeight=height*scale;if(scaledHeight>thumbnailHeight){height-=Math.floor(Math.abs(scaledHeight-thumbnailHeight)*scale);}
if(scaledWidth>thumbnailWidth){width-=Math.floor(Math.abs(scaledWidth-thumbnailWidth)*scale);}
return[width,height,scale];},shouldStoreContentThumbnail(aDocument,aDocShell){if(BrowserUtils.isToolbarVisible(aDocShell,"findbar")){return false;}

if(ChromeUtils.getClassName(aDocument)==="XMLDocument"){return false;}
let webNav=aDocShell.QueryInterface(Ci.nsIWebNavigation);if(webNav.currentURI.schemeIs("about")){return false;}
if(aDocShell.busyFlags!=Ci.nsIDocShell.BUSY_FLAGS_NONE){return false;}
let channel=aDocShell.currentDocumentChannel;if(!channel){return false;}
let uri=channel.originalURI;if(uri.schemeIs("about")){return false;}
let httpChannel;try{httpChannel=channel.QueryInterface(Ci.nsIHttpChannel);}catch(e){}
if(httpChannel){try{if(Math.floor(httpChannel.responseStatus/100)!=2){return false;}}catch(e){
return false;}
if(httpChannel.isNoStoreResponse()){return false;}
if(uri.schemeIs("https")&&!Services.prefs.getBoolPref("browser.cache.disk_cache_ssl")){return false;}} 
return true;},isChannelErrorResponse(channel){if(!channel){return true;}
if(!(channel instanceof Ci.nsIHttpChannel)){return false;}
try{return!channel.requestSucceeded;}catch(_){return true;}},};