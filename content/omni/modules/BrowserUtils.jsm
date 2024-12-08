//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["BrowserUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"PlacesUtils","resource://gre/modules/PlacesUtils.jsm");var BrowserUtils={dumpLn(...args){for(let a of args){dump(a+" ");}
dump("\n");},restartApplication(){let cancelQuit=Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);Services.obs.notifyObservers(cancelQuit,"quit-application-requested","restart");if(cancelQuit.data){return false;} 
if(Services.appinfo.inSafeMode){Services.startup.restartInSafeMode(Ci.nsIAppStartup.eAttemptQuit|Ci.nsIAppStartup.eRestart);return undefined;}
Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit|Ci.nsIAppStartup.eRestart);return undefined;},checkEmptyPageOrigin(browser,uri=browser.currentURI){
if(browser.hasContentOpener){return false;}
let contentPrincipal=browser.contentPrincipal;









let uriToCheck=browser.documentURI||uri;if((uriToCheck.spec=="about:blank"&&contentPrincipal.isNullPrincipal)||contentPrincipal.spec=="about:blank"){return true;}
if(contentPrincipal.isContentPrincipal){return contentPrincipal.equalsURI(uri);}

return contentPrincipal.isSystemPrincipal;},urlSecurityCheck(aURL,aPrincipal,aFlags){var secMan=Services.scriptSecurityManager;if(aFlags===undefined){aFlags=secMan.STANDARD;}
try{if(aURL instanceof Ci.nsIURI){secMan.checkLoadURIWithPrincipal(aPrincipal,aURL,aFlags);}else{secMan.checkLoadURIStrWithPrincipal(aPrincipal,aURL,aFlags);}}catch(e){let principalStr="";try{principalStr=" from "+aPrincipal.spec;}catch(e2){}
throw new Error(`Load of ${aURL + principalStr} denied.`);}},principalWithMatchingOA(principal,existingPrincipal){if(principal.isSystemPrincipal){return principal;}
if(existingPrincipal.originSuffix==principal.originSuffix){return principal;}
let secMan=Services.scriptSecurityManager;if(principal.isContentPrincipal){return secMan.principalWithOA(principal,existingPrincipal.originAttributes);}
if(principal.isNullPrincipal){return secMan.createNullPrincipal(existingPrincipal.originAttributes);}
throw new Error("Can't change the originAttributes of an expanded principal!");},makeURI(aURL,aOriginCharset,aBaseURI){return Services.io.newURI(aURL,aOriginCharset,aBaseURI);},makeFileURI(aFile){return Services.io.newFileURI(aFile);},getElementBoundingScreenRect(aElement){return this.getElementBoundingRect(aElement,true);},getElementBoundingRect(aElement,aInScreenCoords){let rect=aElement.getBoundingClientRect();let win=aElement.ownerGlobal;let x=rect.left;let y=rect.top;
let parentFrame=win.frameElement;while(parentFrame){win=parentFrame.ownerGlobal;let cstyle=win.getComputedStyle(parentFrame);let framerect=parentFrame.getBoundingClientRect();x+=framerect.left+
parseFloat(cstyle.borderLeftWidth)+
parseFloat(cstyle.paddingLeft);y+=framerect.top+
parseFloat(cstyle.borderTopWidth)+
parseFloat(cstyle.paddingTop);parentFrame=win.frameElement;}
rect={left:x,top:y,width:rect.width,height:rect.height,};rect=win.windowUtils.transformRectLayoutToVisual(rect.left,rect.top,rect.width,rect.height);if(aInScreenCoords){rect={left:rect.left+win.mozInnerScreenX,top:rect.top+win.mozInnerScreenY,width:rect.width,height:rect.height,};}
let fullZoom=win.windowUtils.fullZoom;rect={left:rect.left*fullZoom,top:rect.top*fullZoom,width:rect.width*fullZoom,height:rect.height*fullZoom,};return rect;},onBeforeLinkTraversal(originalTarget,linkURI,linkNode,isAppTab){
if(originalTarget!=""||!isAppTab){return originalTarget;}

let linkHost;let docHost;try{linkHost=linkURI.host;docHost=linkNode.ownerDocument.documentURIObject.host;}catch(e){return originalTarget;}
if(docHost==linkHost){return originalTarget;} 
let[longHost,shortHost]=linkHost.length>docHost.length?[linkHost,docHost]:[docHost,linkHost];if(longHost=="www."+shortHost){return originalTarget;}
return"_blank";},makeNicePluginName(aName){if(aName=="Shockwave Flash"){return"Adobe Flash";} 
if(/^Java\W/.exec(aName)){return"Java";}

let newName=aName.replace(/\(.*?\)/g,"").replace(/[\s\d\.\-\_\(\)]+$/,"").replace(/\bplug-?in\b/i,"").trim();return newName;},mimeTypeIsTextBased(mimeType){return(mimeType.startsWith("text/")||mimeType.endsWith("+xml")||mimeType=="application/x-javascript"||mimeType=="application/javascript"||mimeType=="application/json"||mimeType=="application/xml");},canFindInPage(location){return(!location.startsWith("about:addons")&&!location.startsWith("chrome://mozapps/content/extensions/aboutaddons.html")&&!location.startsWith("about:preferences"));},_visibleToolbarsMap:new WeakMap(),isToolbarVisible(docShell,which){let window=this.getRootWindow(docShell);if(!this._visibleToolbarsMap.has(window)){return false;}
let toolbars=this._visibleToolbarsMap.get(window);return!!toolbars&&toolbars.has(which);},async setToolbarButtonHeightProperty(element){let window=element.ownerGlobal;let dwu=window.windowUtils;let toolbarItem=element;let urlBarContainer=element.closest("#urlbar-container");if(urlBarContainer){toolbarItem=urlBarContainer;}
if(!toolbarItem){return;}
let bounds=dwu.getBoundsWithoutFlushing(toolbarItem);if(!bounds.height){await window.promiseDocumentFlushed(()=>{bounds=dwu.getBoundsWithoutFlushing(toolbarItem);});}
if(bounds.height){toolbarItem.style.setProperty("--toolbarbutton-height",bounds.height+"px");}},trackToolbarVisibility(docShell,which,visible=true){
let window=this.getRootWindow(docShell);let toolbars=this._visibleToolbarsMap.get(window);if(!toolbars){toolbars=new Set();this._visibleToolbarsMap.set(window,toolbars);}
if(!visible){toolbars.delete(which);}else{toolbars.add(which);}},getRootWindow(docShell){return docShell.browsingContext.top.window;},trimSelection(aSelection,aMaxLen){const maxLen=Math.min(aMaxLen||150,aSelection.length);if(aSelection.length>maxLen){ let pattern=new RegExp("^(?:\\s*.){0,"+maxLen+"}");pattern.test(aSelection);aSelection=RegExp.lastMatch;}
aSelection=aSelection.trim().replace(/\s+/g," ");if(aSelection.length>maxLen){aSelection=aSelection.substr(0,maxLen);}
return aSelection;},getSelectionDetails(aTopWindow,aCharLen){let focusedWindow={};let focusedElement=Services.focus.getFocusedElementForWindow(aTopWindow,true,focusedWindow);focusedWindow=focusedWindow.value;let selection=focusedWindow.getSelection();let selectionStr=selection.toString();let fullText;let url;let linkText;let isDocumentLevelSelection=true;if(!selectionStr&&focusedElement){if(ChromeUtils.getClassName(focusedElement)==="HTMLTextAreaElement"||(ChromeUtils.getClassName(focusedElement)==="HTMLInputElement"&&focusedElement.mozIsTextField(true))){selection=focusedElement.editor.selection;selectionStr=selection.toString();isDocumentLevelSelection=false;}}
let collapsed=selection.isCollapsed;if(selectionStr){
linkText=selectionStr.trim();if(/^(?:https?|ftp):/i.test(linkText)){try{url=this.makeURI(linkText);}catch(ex){}}else if(/^(?:[a-z\d-]+\.)+[a-z]+$/i.test(linkText)){


let beginRange=selection.getRangeAt(0);let delimitedAtStart=/^\s/.test(beginRange);if(!delimitedAtStart){let container=beginRange.startContainer;let offset=beginRange.startOffset;if(container.nodeType==container.TEXT_NODE&&offset>0){delimitedAtStart=/\W/.test(container.textContent[offset-1]);}else{delimitedAtStart=true;}}
let delimitedAtEnd=false;if(delimitedAtStart){let endRange=selection.getRangeAt(selection.rangeCount-1);delimitedAtEnd=/\s$/.test(endRange);if(!delimitedAtEnd){let container=endRange.endContainer;let offset=endRange.endOffset;if(container.nodeType==container.TEXT_NODE&&offset<container.textContent.length){delimitedAtEnd=/\W/.test(container.textContent[offset]);}else{delimitedAtEnd=true;}}}
if(delimitedAtStart&&delimitedAtEnd){try{url=Services.uriFixup.getFixupURIInfo(linkText).preferredURI;}catch(ex){}}}}
if(selectionStr){
fullText=selectionStr.substr(0,16384);selectionStr=this.trimSelection(selectionStr,aCharLen);}
if(url&&!url.host){url=null;}
return{text:selectionStr,docSelectionIsCollapsed:collapsed,isDocumentLevelSelection,fullText,linkURL:url?url.spec:null,linkText:url?linkText:"",};},async parseUrlAndPostData(url,postData,param){let hasGETParam=/%s/i.test(url);let decodedPostData=postData?unescape(postData):"";let hasPOSTParam=/%s/i.test(decodedPostData);if(!hasGETParam&&!hasPOSTParam){if(param){
throw new Error("A param was provided but there's nothing to bind it to");}
return[url,postData];}
let charset="";const re=/^(.*)\&mozcharset=([a-zA-Z][_\-a-zA-Z0-9]+)\s*$/;let matches=url.match(re);if(matches){[,url,charset]=matches;}else{try{let pageInfo=await PlacesUtils.history.fetch(url,{includeAnnotations:true,});if(pageInfo&&pageInfo.annotations.has(PlacesUtils.CHARSET_ANNO)){charset=pageInfo.annotations.get(PlacesUtils.CHARSET_ANNO);}}catch(ex){Cu.reportError(ex);}}


let encodedParam="";if(charset&&charset!="UTF-8"){try{let converter=Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);converter.charset=charset;encodedParam=converter.ConvertFromUnicode(param)+converter.Finish();}catch(ex){encodedParam=param;}
encodedParam=escape(encodedParam).replace(/[+@\/]+/g,encodeURIComponent);}else{ encodedParam=encodeURIComponent(param);}
url=url.replace(/%s/g,encodedParam).replace(/%S/g,param);if(hasPOSTParam){postData=decodedPostData.replace(/%s/g,encodedParam).replace(/%S/g,param);}
return[url,postData];},getLocalizedFragment(doc,msg,...nodesOrStrings){for(let i=1;i<=nodesOrStrings.length;i++){if(!msg.includes("%"+i+"$S")){msg=msg.replace(/%S/,"%"+i+"$S");}}
let numberOfInsertionPoints=msg.match(/%\d+\$S/g).length;if(numberOfInsertionPoints!=nodesOrStrings.length){Cu.reportError(`Message has ${numberOfInsertionPoints} insertion points, `+`but got ${nodesOrStrings.length} replacement parameters!`);}
let fragment=doc.createDocumentFragment();let parts=[msg];let insertionPoint=1;for(let replacement of nodesOrStrings){let insertionString="%"+insertionPoint++ +"$S";let partIndex=parts.findIndex(part=>typeof part=="string"&&part.includes(insertionString));if(partIndex==-1){fragment.appendChild(doc.createTextNode(msg));return fragment;}
if(typeof replacement=="string"){parts[partIndex]=parts[partIndex].replace(insertionString,replacement);}else{let[firstBit,lastBit]=parts[partIndex].split(insertionString);parts.splice(partIndex,1,firstBit,replacement,lastBit);}}
for(let part of parts){if(typeof part=="string"){if(part){fragment.appendChild(doc.createTextNode(part));}}else{fragment.appendChild(part);}}
return fragment;},promiseObserved(topic,test=()=>true){return new Promise(resolve=>{let observer=(subject,topic,data)=>{if(test(subject,data)){Services.obs.removeObserver(observer,topic);resolve({subject,data});}};Services.obs.addObserver(observer,topic);});},removeSingleTrailingSlashFromURL(aURL){ return aURL.replace(/^((?:http|https|ftp):\/\/[^/]+)\/$/,"$1");},get trimURLProtocol(){return"http://";},trimURL(aURL){let url=this.removeSingleTrailingSlashFromURL(aURL);return url.startsWith(this.trimURLProtocol)?url.substring(this.trimURLProtocol.length):url;},recordSiteOriginTelemetry(aWindows,aIsGeckoView){Services.tm.idleDispatchToMainThread(()=>{this._recordSiteOriginTelemetry(aWindows,aIsGeckoView);});},computeSiteOriginCount(aWindows,aIsGeckoView){

let tabs=[];if(aIsGeckoView){ tabs=aWindows;}else{for(const win of aWindows){tabs=tabs.concat(win.gBrowser.tabs);}}
let topLevelBCs=[];for(const tab of tabs){let browser;if(aIsGeckoView){browser=tab.browser;}else{browser=tab.linkedBrowser;}
if(browser.browsingContext){ topLevelBCs.push(browser.browsingContext);}}
return CanonicalBrowsingContext.countSiteOrigins(topLevelBCs);},_recordSiteOriginTelemetry(aWindows,aIsGeckoView){let currentTime=Date.now(); if(!this.min_interval){this.min_interval=Services.prefs.getIntPref("telemetry.number_of_site_origin.min_interval",300000);}

if(!this._lastRecordSiteOrigin||currentTime<this._lastRecordSiteOrigin+this.min_interval){if(!this._lastRecordSiteOrigin){this._lastRecordSiteOrigin=currentTime;}
return;}
this._lastRecordSiteOrigin=currentTime;Services.telemetry.getHistogramById("FX_NUMBER_OF_UNIQUE_SITE_ORIGINS_ALL_TABS").add(this.computeSiteOriginCount(aWindows,aIsGeckoView));},propBagToObject(bag){function toValue(property){if(typeof property!="object"){return property;}
if(Array.isArray(property)){return property.map(this.toValue,this);}
if(property&&property instanceof Ci.nsIPropertyBag){return this.propBagToObject(property);}
return property;}
if(!(bag instanceof Ci.nsIPropertyBag)){throw new TypeError("Not a property bag");}
let result={};for(let{name,value:property}of bag.enumerator){let value=toValue(property);result[name]=value;}
return result;},objectToPropBag(obj){function fromValue(value){if(typeof value=="function"){return null;}
if(Array.isArray(value)){return value.map(this.fromValue,this);}
if(value==null||typeof value!="object"){ return value;}
return this.objectToPropBag(value);}
if(obj==null||typeof obj!="object"){throw new TypeError("Invalid object: "+obj);}
let bag=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);for(let k of Object.keys(obj)){let value=fromValue(obj[k]);bag.setProperty(k,value);}
return bag;},};XPCOMUtils.defineLazyPreferenceGetter(BrowserUtils,"navigationRequireUserInteraction","browser.navigation.requireUserInteraction",false);