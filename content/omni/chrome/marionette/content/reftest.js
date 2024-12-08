"use strict";const EXPORTED_SYMBOLS=["reftest"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{E10SUtils:"resource://gre/modules/E10SUtils.jsm",OS:"resource://gre/modules/osfile.jsm",Preferences:"resource://gre/modules/Preferences.jsm",assert:"chrome://marionette/content/assert.js",capture:"chrome://marionette/content/capture.js",error:"chrome://marionette/content/error.js",Log:"chrome://marionette/content/log.js",navigate:"chrome://marionette/content/navigate.js",print:"chrome://marionette/content/print.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());const XHTML_NS="http://www.w3.org/1999/xhtml";const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";const SCREENSHOT_MODE={unexpected:0,fail:1,always:2,};const STATUS={PASS:"PASS",FAIL:"FAIL",ERROR:"ERROR",TIMEOUT:"TIMEOUT",};const DEFAULT_REFTEST_WIDTH=600;const DEFAULT_REFTEST_HEIGHT=600;const CM_PER_INCH=2.54;const DEFAULT_PAGE_WIDTH=5*CM_PER_INCH;const DEFAULT_PAGE_HEIGHT=3*CM_PER_INCH;const DEFAULT_PAGE_MARGIN=0.5*CM_PER_INCH;const DEFAULT_PDF_RESOLUTION=96/72;this.reftest={};reftest.Runner=class{constructor(driver){this.driver=driver;this.canvasCache=new DefaultMap(undefined,()=>new Map([[null,[]]]));this.isPrint=null;this.windowUtils=null;this.lastURL=null;this.useRemoteTabs=Services.appinfo.browserTabsRemoteAutostart;this.useRemoteSubframes=Services.appinfo.fissionAutostart;}
setup(urlCount,screenshotMode,isPrint=false){this.isPrint=isPrint;assert.open(this.driver.getBrowsingContext({top:true}));this.parentWindow=this.driver.getCurrentWindow();this.screenshotMode=SCREENSHOT_MODE[screenshotMode]||SCREENSHOT_MODE.unexpected;this.urlCount=Object.keys(urlCount||{}).reduce((map,key)=>map.set(key,urlCount[key]),new Map());if(isPrint){this.loadPdfJs();}
ChromeUtils.registerWindowActor("MarionetteReftest",{kind:"JSWindowActor",parent:{moduleURI:"chrome://marionette/content/actors/MarionetteReftestParent.jsm",},child:{moduleURI:"chrome://marionette/content/actors/MarionetteReftestChild.jsm",events:{load:{mozSystemGroup:true,capture:true},},},allFrames:true,});}
teardown(){this.abort();ChromeUtils.unregisterWindowActor("MarionetteReftest");}
async ensureWindow(timeout,width,height){logger.debug(`ensuring we have a window ${width}x${height}`);if(this.reftestWin&&!this.reftestWin.closed){let browserRect=this.reftestWin.gBrowser.getBoundingClientRect();if(browserRect.width===width&&browserRect.height===height){return this.reftestWin;}
logger.debug(`current: ${browserRect.width}x${browserRect.height}`);}
let reftestWin;if(Services.appinfo.OS=="Android"){logger.debug("Using current window");reftestWin=this.parentWindow;await navigate.waitForNavigationCompleted(this.driver,()=>{const browsingContext=this.driver.getBrowsingContext();navigate.navigateTo(browsingContext,"about:blank");});}else{logger.debug("Using separate window");if(this.reftestWin&&!this.reftestWin.closed){this.reftestWin.close();}
reftestWin=await this.openWindow(width,height);}
this.setupWindow(reftestWin,width,height);this.windowUtils=reftestWin.windowUtils;this.reftestWin=reftestWin;let found=this.driver.findWindow([reftestWin],()=>true);await this.driver.setWindowHandle(found,true);const url=await this.driver._getCurrentURL();this.lastURL=url.href;logger.debug(`loaded initial URL: ${this.lastURL}`);let browserRect=reftestWin.gBrowser.getBoundingClientRect();logger.debug(`new: ${browserRect.width}x${browserRect.height}`);return reftestWin;}
async openWindow(width,height){assert.positiveInteger(width);assert.positiveInteger(height);let reftestWin=this.parentWindow.open("chrome://marionette/content/reftest.xhtml","reftest",`chrome,height=${height},width=${width}`);await new Promise(resolve=>{reftestWin.addEventListener("load",resolve,{once:true});});return reftestWin;}
setupWindow(reftestWin,width,height){let browser;if(Services.appinfo.OS==="Android"){browser=reftestWin.document.getElementsByTagName("browser")[0];browser.setAttribute("remote","false");}else{browser=reftestWin.document.createElementNS(XUL_NS,"xul:browser");browser.permanentKey={};browser.setAttribute("id","browser");browser.setAttribute("type","content");browser.setAttribute("primary","true");browser.setAttribute("remote",this.useRemoteTabs?"true":"false");}
 
const windowStyle=`padding: 0px; margin: 0px; border:none;
min-width: ${width}px; min-height: ${height}px;
max-width: ${width}px; max-height: ${height}px`;browser.setAttribute("style",windowStyle);if(Services.appinfo.OS!=="Android"){let doc=reftestWin.document.documentElement;while(doc.firstChild){doc.firstChild.remove();}
doc.appendChild(browser);}
if(reftestWin.BrowserApp){reftestWin.BrowserApp=browser;}
reftestWin.gBrowser=browser;return reftestWin;}
async abort(){if(this.reftestWin&&this.reftestWin!=this.parentWindow){this.driver.closeChromeWindow();let parentHandle=this.driver.findWindow([this.parentWindow],()=>true);await this.driver.setWindowHandle(parentHandle);}
this.reftestWin=null;}
async run(testUrl,references,expected,timeout,pageRanges={},width=DEFAULT_REFTEST_WIDTH,height=DEFAULT_REFTEST_HEIGHT){let timeoutHandle;let timeoutPromise=new Promise(resolve=>{timeoutHandle=this.parentWindow.setTimeout(()=>{resolve({status:STATUS.TIMEOUT,message:null,extra:{}});},timeout);});let testRunner=(async()=>{let result;try{result=await this.runTest(testUrl,references,expected,timeout,pageRanges,width,height);}catch(e){result={status:STATUS.ERROR,message:String(e),stack:e.stack,extra:{},};}
return result;})();let result=await Promise.race([testRunner,timeoutPromise]);this.parentWindow.clearTimeout(timeoutHandle);if(result.status===STATUS.TIMEOUT){await this.abort();}
return result;}
async runTest(testUrl,references,expected,timeout,pageRanges,width,height){let win=await this.ensureWindow(timeout,width,height);function toBase64(screenshot){let dataURL=screenshot.canvas.toDataURL();return dataURL.split(",")[1];}
let result={status:STATUS.FAIL,message:"",stack:null,extra:{},};let screenshotData=[];let stack=[];for(let i=references.length-1;i>=0;i--){let item=references[i];stack.push([testUrl,...item]);}
let done=false;while(stack.length&&!done){let[lhsUrl,rhsUrl,references,relation,extras={}]=stack.pop();result.message+=`Testing ${lhsUrl} ${relation} ${rhsUrl}\n`;let comparison;try{comparison=await this.compareUrls(win,lhsUrl,rhsUrl,relation,timeout,pageRanges,extras);}catch(e){comparison={lhs:null,rhs:null,passed:false,error:e,msg:null,};}
if(comparison.msg){result.message+=`${comparison.msg}\n`;}
if(comparison.error!==null){result.status=STATUS.ERROR;result.message+=String(comparison.error);result.stack=comparison.error.stack;}
function recordScreenshot(){let encodedLHS=comparison.lhs?toBase64(comparison.lhs):"";let encodedRHS=comparison.rhs?toBase64(comparison.rhs):"";screenshotData.push([{url:lhsUrl,screenshot:encodedLHS},relation,{url:rhsUrl,screenshot:encodedRHS},]);}
if(this.screenshotMode===SCREENSHOT_MODE.always){recordScreenshot();}
if(comparison.passed){if(references.length){for(let i=references.length-1;i>=0;i--){let item=references[i];stack.push([rhsUrl,...item]);}}else{ result.status=STATUS.PASS;if(this.screenshotMode<=SCREENSHOT_MODE.fail&&expected!=result.status){recordScreenshot();}
done=true;}}else if(!stack.length||result.status==STATUS.ERROR){
let isFail=this.screenshotMode===SCREENSHOT_MODE.fail;let isUnexpected=this.screenshotMode===SCREENSHOT_MODE.unexpected;if(isFail||(isUnexpected&&expected!=result.status)){recordScreenshot();}} 
let cacheKey=width+"x"+height;let canvasPool=this.canvasCache.get(cacheKey).get(null);[comparison.lhs,comparison.rhs].map(screenshot=>{if(screenshot!==null&&screenshot.reuseCanvas){canvasPool.push(screenshot.canvas);}});logger.debug(`Canvas pool (${cacheKey}) is of length ${canvasPool.length}`);}
if(screenshotData.length){
let lastScreenshot=screenshotData[screenshotData.length-1]; result.extra.reftest_screenshots=lastScreenshot;}
return result;}
async compareUrls(win,lhsUrl,rhsUrl,relation,timeout,pageRanges,extras){logger.info(`Testing ${lhsUrl} ${relation} ${rhsUrl}`);if(relation!=="=="&&relation!="!="){throw new error.InvalidArgumentError("Reftest operator should be '==' or '!='");}
let lhsIter,lhsCount,rhsIter,rhsCount;if(!this.isPrint){
 rhsIter=[await this.screenshot(win,rhsUrl,timeout)].values();lhsIter=[await this.screenshot(win,lhsUrl,timeout)].values();lhsCount=rhsCount=1;}else{[rhsIter,rhsCount]=await this.screenshotPaginated(win,rhsUrl,timeout,pageRanges);[lhsIter,lhsCount]=await this.screenshotPaginated(win,lhsUrl,timeout,pageRanges);}
let passed=null;let error=null;let pixelsDifferent=null;let maxDifferences={};let msg=null;if(lhsCount!=rhsCount){passed=false;msg=`Got different numbers of pages; test has ${lhsCount}, ref has ${rhsCount}`;}
let lhs=null;let rhs=null;logger.debug(`Comparing ${lhsCount} pages`);if(passed===null){for(let i=0;i<lhsCount;i++){lhs=(await lhsIter.next()).value;rhs=(await rhsIter.next()).value;logger.debug(`lhs canvas size ${lhs.canvas.width}x${lhs.canvas.height}`);logger.debug(`rhs canvas size ${rhs.canvas.width}x${rhs.canvas.height}`);try{pixelsDifferent=this.windowUtils.compareCanvases(lhs.canvas,rhs.canvas,maxDifferences);}catch(e){error=e;passed=false;break;}
let areEqual=this.isAcceptableDifference(maxDifferences.value,pixelsDifferent,extras.fuzzy);logger.debug(`Page ${i + 1} maxDifferences: ${maxDifferences.value} `+`pixelsDifferent: ${pixelsDifferent}`);logger.debug(`Page ${i + 1} ${areEqual ? "compare equal" : "compare unequal"}`);if(!areEqual){if(relation=="=="){passed=false;msg=`Found ${pixelsDifferent} pixels different, `+`maximum difference per channel ${maxDifferences.value}`;if(this.isPrint){msg+=` on page ${i + 1}`;}}else{passed=true;}
break;}}} 
if(passed===null){if(relation=="=="){passed=true;}else{msg=`mismatch reftest has no differences`;passed=false;}}
return{lhs,rhs,passed,error,msg};}
isAcceptableDifference(maxDifference,pixelsDifferent,allowed){if(!allowed){logger.info(`No differences allowed`);return pixelsDifferent===0;}
let[allowedDiff,allowedPixels]=allowed;logger.info(`Allowed ${allowedPixels.join("-")} pixels different, `+`maximum difference per channel ${allowedDiff.join("-")}`);return((pixelsDifferent===0&&allowedPixels[0]==0)||(maxDifference===0&&allowedDiff[0]==0)||(maxDifference>=allowedDiff[0]&&maxDifference<=allowedDiff[1]&&(pixelsDifferent>=allowedPixels[0]||pixelsDifferent<=allowedPixels[1])));}
ensureFocus(win){const focusManager=Services.focus;if(focusManager.activeWindow!=win){win.focus();}
this.driver.curBrowser.contentBrowser.focus();}
updateBrowserRemotenessByURL(browser,url){if(Services.appinfo.OS==="Android"){return;}
let remoteType=E10SUtils.getRemoteTypeForURI(url,this.useRemoteTabs,this.useRemoteSubframes);if(browser.remoteType!==remoteType){if(remoteType===E10SUtils.NOT_REMOTE){browser.removeAttribute("remote");browser.removeAttribute("remoteType");}else{browser.setAttribute("remote","true");browser.setAttribute("remoteType",remoteType);}
browser.changeRemoteness({remoteType});browser.construct();


}}
async loadTestUrl(win,url,timeout){const browsingContext=this.driver.getBrowsingContext({top:true});logger.debug(`Starting load of ${url}`);if(this.lastURL===url){logger.debug(`Refreshing page`);await navigate.waitForNavigationCompleted(this.driver,()=>{navigate.refresh(browsingContext);});}else{


this.updateBrowserRemotenessByURL(win.gBrowser,url);navigate.navigateTo(browsingContext,url);this.lastURL=url;}
this.ensureFocus(win);let isReftestReady=false;while(!isReftestReady){
const actor=browsingContext.currentWindowGlobal.getActor("MarionetteReftest");isReftestReady=await actor.reftestWait(url,this.useRemoteTabs);}}
async screenshot(win,url,timeout){
 let browserRect=win.gBrowser.getBoundingClientRect();let canvas=null;let remainingCount=this.urlCount.get(url)||1;let cache=remainingCount>1;let cacheKey=browserRect.width+"x"+browserRect.height;logger.debug(`screenshot ${url} remainingCount: `+`${remainingCount} cache: ${cache} cacheKey: ${cacheKey}`);let reuseCanvas=false;let sizedCache=this.canvasCache.get(cacheKey);if(sizedCache.has(url)){logger.debug(`screenshot ${url} taken from cache`);canvas=sizedCache.get(url);if(!cache){sizedCache.delete(url);}}else{let canvasPool=sizedCache.get(null);if(canvasPool.length){logger.debug("reusing canvas from canvas pool");canvas=canvasPool.pop();}else{logger.debug("using new canvas");canvas=null;}
reuseCanvas=!cache;let ctxInterface=win.CanvasRenderingContext2D;let flags=ctxInterface.DRAWWINDOW_DRAW_CARET|ctxInterface.DRAWWINDOW_DRAW_VIEW|ctxInterface.DRAWWINDOW_USE_WIDGET_LAYERS;if(!(0<=browserRect.left&&0<=browserRect.top&&win.innerWidth>=browserRect.width&&win.innerHeight>=browserRect.height)){logger.error(`Invalid window dimensions:
browserRect.left: ${browserRect.left}
browserRect.top: ${browserRect.top}
win.innerWidth: ${win.innerWidth}
browserRect.width: ${browserRect.width}
win.innerHeight: ${win.innerHeight}
browserRect.height: ${browserRect.height}`);throw new Error("Window has incorrect dimensions");}
url=new URL(url).href; await this.loadTestUrl(win,url,timeout);canvas=await capture.canvas(win,win.docShell.browsingContext,0, 0, browserRect.width,browserRect.height,{canvas,flags,readback:true});}
if(canvas.width!==browserRect.width||canvas.height!==browserRect.height){logger.warn(`Canvas dimensions changed to ${canvas.width}x${canvas.height}`);reuseCanvas=false;cache=false;}
if(cache){sizedCache.set(url,canvas);}
this.urlCount.set(url,remainingCount-1);return{canvas,reuseCanvas};}
async screenshotPaginated(win,url,timeout,pageRanges){url=new URL(url).href; await this.loadTestUrl(win,url,timeout);const[width,height]=[DEFAULT_PAGE_WIDTH,DEFAULT_PAGE_HEIGHT];const margin=DEFAULT_PAGE_MARGIN;const settings=print.addDefaultSettings({page:{width,height,},margin:{left:margin,right:margin,top:margin,bottom:margin,},shrinkToFit:false,printBackground:true,});const filePath=await print.printToFile(win.gBrowser.frameLoader,win.gBrowser.outerWindowID,settings);const fp=await OS.File.open(filePath,{read:true});try{const pdf=await this.loadPdf(url,fp);let pages=this.getPages(pageRanges,url,pdf.numPages);return[this.renderPages(pdf,pages),pages.size];}finally{fp.close();await OS.File.remove(filePath);}}
async loadPdfJs(){ await new Promise((resolve,reject)=>{const doc=this.parentWindow.document;const script=doc.createElement("script");script.src="resource://pdf.js/build/pdf.js";script.onload=resolve;script.onerror=()=>reject(new Error("pdfjs load failed"));doc.documentElement.appendChild(script);});this.parentWindow.pdfjsLib.GlobalWorkerOptions.workerSrc="resource://pdf.js/build/pdf.worker.js";}
async loadPdf(url,fp){const data=await fp.read();return this.parentWindow.pdfjsLib.getDocument({data}).promise;}
async*renderPages(pdf,pages){let canvas=null;for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){if(!pages.has(pageNumber)){logger.info(`Skipping page ${pageNumber}/${pdf.numPages}`);continue;}
logger.info(`Rendering page ${pageNumber}/${pdf.numPages}`);let page=await pdf.getPage(pageNumber);let viewport=page.getViewport({scale:DEFAULT_PDF_RESOLUTION}); if(canvas===null){canvas=this.parentWindow.document.createElementNS(XHTML_NS,"canvas");canvas.height=viewport.height;canvas.width=viewport.width;} 
let context=canvas.getContext("2d");let renderContext={canvasContext:context,viewport,};await page.render(renderContext).promise;yield{canvas,reuseCanvas:false};}}
getPages(pageRanges,url,totalPages){ let afterHost=url.slice(url.indexOf(":")+3);afterHost=afterHost.slice(afterHost.indexOf("/"));const ranges=pageRanges[afterHost];let rv=new Set();if(!ranges){for(let i=1;i<=totalPages;i++){rv.add(i);}
return rv;}
for(let rangePart of ranges){if(rangePart.length===1){rv.add(rangePart[0]);}else{if(rangePart.length!==2){throw new Error(`Page ranges must be <int> or <int> '-' <int>, got ${rangePart}`);}
let[lower,upper]=rangePart;if(lower===null){lower=1;}
if(upper===null){upper=totalPages;}
for(let i=lower;i<=upper;i++){rv.add(i);}}}
return rv;}};class DefaultMap extends Map{constructor(iterable,defaultFactory){super(iterable);this.defaultFactory=defaultFactory;}
get(key){if(this.has(key)){return super.get(key);}
let v=this.defaultFactory();this.set(key,v);return v;}}