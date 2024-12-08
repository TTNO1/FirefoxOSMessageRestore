"use strict";var{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{BrowserUtils:"resource://gre/modules/BrowserUtils.jsm",clearTimeout:"resource://gre/modules/Timer.jsm",E10SUtils:"resource://gre/modules/E10SUtils.jsm",ExtensionCommon:"resource://gre/modules/ExtensionCommon.jsm",setTimeout:"resource://gre/modules/Timer.jsm",});const RESIZE_TIMEOUT=100;const isOpaque=function(color){try{if(/(rgba|hsla)/i.test(color)){let numberRe=/(\.\d+|\d+\.?\d*)%?/g;let opacity=color.match(numberRe)[3];if(opacity.includes("%")){opacity=opacity.slice(0,-1);opacity=opacity/100;}
return opacity*1>=1;}else if(/^#[a-f0-9]{4}$/i.test(color)){ return color.toUpperCase().endsWith("F");}else if(/^#[a-f0-9]{8}$/i.test(color)){ return color.toUpperCase().endsWith("FF");}}catch(e){}
return true;};const BrowserListener={init({allowScriptsToClose,blockParser,fixedWidth,maxHeight,maxWidth,stylesheets,isInline,}){this.fixedWidth=fixedWidth;this.stylesheets=stylesheets||[];this.isInline=isInline;this.maxWidth=maxWidth;this.maxHeight=maxHeight;this.blockParser=blockParser;this.needsResize=fixedWidth||maxHeight||maxWidth;this.oldBackground=null;if(allowScriptsToClose){content.windowUtils.allowScriptsToClose();}
docShell.isAppTab=true;if(this.blockParser){this.blockingPromise=new Promise(resolve=>{this.unblockParser=resolve;});addEventListener("DOMDocElementInserted",this,true);}
addEventListener("load",this,true);addEventListener("DOMWindowCreated",this,true);addEventListener("DOMContentLoaded",this,true);addEventListener("MozScrolledAreaChanged",this,true);},destroy(){if(this.blockParser){removeEventListener("DOMDocElementInserted",this,true);}
removeEventListener("load",this,true);removeEventListener("DOMWindowCreated",this,true);removeEventListener("DOMContentLoaded",this,true);removeEventListener("MozScrolledAreaChanged",this,true);},receiveMessage({name,data}){if(name==="Extension:InitBrowser"){this.init(data);}else if(name==="Extension:UnblockParser"){if(this.unblockParser){this.unblockParser();this.blockingPromise=null;}}else if(name==="Extension:GrabFocus"){content.window.requestAnimationFrame(()=>{Services.focus.focusedWindow=content.window;});}},loadStylesheets(){let{windowUtils}=content;for(let url of this.stylesheets){windowUtils.addSheet(ExtensionCommon.stylesheetMap.get(url),windowUtils.AGENT_SHEET);}},handleEvent(event){switch(event.type){case"DOMDocElementInserted":if(this.blockingPromise){event.target.blockParsing(this.blockingPromise);}
break;case"DOMWindowCreated":if(event.target===content.document){this.loadStylesheets();}
break;case"DOMContentLoaded":if(event.target===content.document){sendAsyncMessage("Extension:BrowserContentLoaded",{url:content.location.href,});if(this.needsResize){this.handleDOMChange(true);}}
break;case"load":if(event.target.contentWindow===content){


if(this.isInline){this.loadStylesheets();}
sendAsyncMessage("Extension:BrowserContentLoaded",{url:content.location.href,});}else if(event.target!==content.document){break;}
if(!this.needsResize){break;}




Promise.resolve().then(()=>{this.handleDOMChange(true);});new content.MutationObserver(this.handleDOMChange.bind(this)).observe(content.document.documentElement,{attributes:true,characterData:true,childList:true,subtree:true,});break;case"MozScrolledAreaChanged":if(this.needsResize){this.handleDOMChange();}
break;}},handleDOMChange(ignoreThrottling=false){if(ignoreThrottling&&this.resizeTimeout){clearTimeout(this.resizeTimeout);this.resizeTimeout=null;}
if(this.resizeTimeout==null){this.resizeTimeout=setTimeout(()=>{try{if(content){this._handleDOMChange("delayed");}}finally{this.resizeTimeout=null;}},RESIZE_TIMEOUT);this._handleDOMChange();}},_handleDOMChange(detail){let doc=content.document;let body=doc.body;if(!body||doc.compatMode==="BackCompat"){

body=doc.documentElement;}
let result;const zoom=content.browsingContext.fullZoom;if(this.fixedWidth){






let getHeight=elem=>elem.getBoundingClientRect(elem).height;let bodyPadding=getHeight(doc.documentElement)-getHeight(body);if(body!==doc.documentElement){let bs=content.getComputedStyle(body);let ds=content.getComputedStyle(doc.documentElement);let p=parseFloat(bs.marginTop)+
parseFloat(bs.marginBottom)+
parseFloat(ds.marginTop)+
parseFloat(ds.marginBottom)+
parseFloat(ds.paddingTop)+
parseFloat(ds.paddingBottom);bodyPadding=Math.min(p,bodyPadding);}
let height=Math.ceil((body.scrollHeight+bodyPadding)*zoom);result={height,detail};}else{let background=doc.defaultView.getComputedStyle(body).backgroundColor;if(!isOpaque(background)){background=null;}
if(background===null||background!==this.oldBackground){sendAsyncMessage("Extension:BrowserBackgroundChanged",{background});}
this.oldBackground=background;let{contentViewer}=docShell;let ratio=content.devicePixelRatio;let w={},h={};contentViewer.getContentSizeConstrained(this.maxWidth*ratio,this.maxHeight*ratio,w,h);let width=Math.ceil((w.value*zoom)/ratio);let height=Math.ceil((h.value*zoom)/ratio);result={width,height,detail};}
sendAsyncMessage("Extension:BrowserResized",result);},};addMessageListener("Extension:InitBrowser",BrowserListener);addMessageListener("Extension:UnblockParser",BrowserListener);addMessageListener("Extension:GrabFocus",BrowserListener);var WebBrowserChrome={onBeforeLinkTraversal(originalTarget,linkURI,linkNode,isAppTab){


return BrowserUtils.onBeforeLinkTraversal(originalTarget,linkURI,linkNode,docShell.isAppTab);},shouldLoadURI(docShell,URI,referrerInfo,hasPostData,triggeringPrincipal){return true;},shouldLoadURIInThisProcess(URI){let remoteSubframes=docShell.QueryInterface(Ci.nsILoadContext).useRemoteSubframes;return E10SUtils.shouldLoadURIInThisProcess(URI,remoteSubframes);},};if(Services.appinfo.processType==Services.appinfo.PROCESS_TYPE_CONTENT){let tabchild=docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIBrowserChild);tabchild.webBrowserChrome=WebBrowserChrome;}
void content;