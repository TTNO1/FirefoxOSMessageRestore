"use strict";const EXPORTED_SYMBOLS=["ChromeWebElement","ContentWebElement","ContentWebFrame","ContentWebWindow","element","WebElement",];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{ContentDOMReference:"resource://gre/modules/ContentDOMReference.jsm",assert:"chrome://marionette/content/assert.js",atom:"chrome://marionette/content/atom.js",error:"chrome://marionette/content/error.js",PollPromise:"chrome://marionette/content/sync.js",pprint:"chrome://marionette/content/format.js",});XPCOMUtils.defineLazyServiceGetter(this,"uuidGen","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");const ORDERED_NODE_ITERATOR_TYPE=5;const FIRST_ORDERED_NODE_TYPE=9;const ELEMENT_NODE=1;const DOCUMENT_NODE=9;const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";const XUL_CHECKED_ELS=new Set(["button","checkbox","toolbarbutton"]);const XUL_SELECTED_ELS=new Set(["menu","menuitem","menuseparator","radio","richlistitem","tab",]);this.element={};element.Strategy={ClassName:"class name",Selector:"css selector",ID:"id",Name:"name",LinkText:"link text",PartialLinkText:"partial link text",TagName:"tag name",XPath:"xpath",};element.Store=class{constructor(){this.els={};}
clear(){this.els={};}
addAll(els){let add=this.add.bind(this);return[...els].map(add);}
add(el){const isDOMElement=element.isDOMElement(el);const isDOMWindow=element.isDOMWindow(el);const isXULElement=element.isXULElement(el);const context=element.isInXULDocument(el)?"chrome":"content";if(!(isDOMElement||isDOMWindow||isXULElement)){throw new TypeError("Expected an element or WindowProxy, "+pprint`got: ${el}`);}
for(let i in this.els){let foundEl;try{foundEl=this.els[i].get();}catch(e){}
if(foundEl){if(new XPCNativeWrapper(foundEl)==new XPCNativeWrapper(el)){return WebElement.fromUUID(i,context);}
}else{delete this.els[i];}}
let webEl=WebElement.from(el);this.els[webEl.uuid]=Cu.getWeakReference(el);return webEl;}
has(webEl){if(!(webEl instanceof WebElement)){throw new TypeError(pprint`Expected web element, got: ${webEl}`);}
return Object.keys(this.els).includes(webEl.uuid);}
get(webEl,win){if(!(webEl instanceof WebElement)){throw new TypeError(pprint`Expected web element, got: ${webEl}`);}
if(!this.has(webEl)){throw new error.NoSuchElementError("Web element reference not seen before: "+webEl.uuid);}
let el;let ref=this.els[webEl.uuid];try{el=ref.get();}catch(e){delete this.els[webEl.uuid];}
if(el===null||element.isStale(el,win)){throw new error.StaleElementReferenceError(pprint`The element reference of ${el || webEl.uuid} is stale; `+"either the element is no longer attached to the DOM, "+"it is not in the current frame context, "+"or the document has been refreshed");}
return el;}};element.ReferenceStore=class{constructor(){this.refs=new Map(); this.domRefs=new Map();}
clear(browsingContext){if(!browsingContext){this.refs.clear();this.domRefs.clear();return;}
for(const context of browsingContext.getAllBrowsingContextsInSubtree()){for(const[uuid,elId]of this.refs){if(elId.browsingContextId==context.id){this.refs.delete(uuid);this.domRefs.delete(elId.id);}}}}
addAll(elIds){return[...elIds].map(elId=>this.add(elId));}
add(elId){if(!elId.id||!elId.browsingContextId){throw new TypeError(pprint`Expected ElementIdentifier, got: ${elId}`);}
if(this.domRefs.has(elId.id)){return WebElement.fromJSON(this.domRefs.get(elId.id));}
const webEl=WebElement.fromJSON(elId.webElRef);this.refs.set(webEl.uuid,elId);this.domRefs.set(elId.id,elId.webElRef);return webEl;}
has(webEl){if(!(webEl instanceof WebElement)){throw new TypeError(pprint`Expected web element, got: ${webEl}`);}
return this.refs.has(webEl.uuid);}
get(webEl){if(!(webEl instanceof WebElement)){throw new TypeError(pprint`Expected web element, got: ${webEl}`);}
const elId=this.refs.get(webEl.uuid);if(!elId){throw new error.NoSuchElementError("Web element reference not seen before: "+webEl.uuid);}
return elId;}};element.find=function(container,strategy,selector,opts={}){let all=!!opts.all;let timeout=opts.timeout||0;let startNode=opts.startNode;let searchFn;if(opts.all){searchFn=findElements.bind(this);}else{searchFn=findElement.bind(this);}
return new Promise((resolve,reject)=>{let findElements=new PollPromise((resolve,reject)=>{let res=find_(container,strategy,selector,searchFn,{all,startNode,});if(res.length>0){resolve(Array.from(res));}else{reject([]);}},{timeout});findElements.then(foundEls=>{
 if(!opts.all&&(!foundEls||foundEls.length==0)){let msg=`Unable to locate element: ${selector}`;reject(new error.NoSuchElementError(msg));}
if(opts.all){resolve(foundEls);}
resolve(foundEls[0]);},reject);});};function find_(container,strategy,selector,searchFn,{startNode=null,all=false}={}){let rootNode=container.frame.document;if(!startNode){startNode=rootNode;}
let res;try{res=searchFn(strategy,selector,rootNode,startNode);}catch(e){throw new error.InvalidSelectorError(`Given ${strategy} expression "${selector}" is invalid: ${e}`);}
if(res){if(all){return res;}
return[res];}
return[];}
element.findByXPath=function(document,startNode,expression){let iter=document.evaluate(expression,startNode,null,FIRST_ORDERED_NODE_TYPE,null);return iter.singleNodeValue;};element.findByXPathAll=function*(document,startNode,expression){let iter=document.evaluate(expression,startNode,null,ORDERED_NODE_ITERATOR_TYPE,null);let el=iter.iterateNext();while(el){yield el;el=iter.iterateNext();}};element.findByLinkText=function(startNode,linkText){return filterLinks(startNode,link=>atom.getElementText(link).trim()===linkText);};element.findByPartialLinkText=function(startNode,linkText){return filterLinks(startNode,link=>atom.getElementText(link).includes(linkText));};function*filterLinks(startNode,predicate){for(let link of startNode.getElementsByTagName("a")){if(predicate(link)){yield link;}}}
function findElement(strategy,selector,document,startNode=undefined){switch(strategy){case element.Strategy.ID:{if(startNode.getElementById){return startNode.getElementById(selector);}
let expr=`.//*[@id="${selector}"]`;return element.findByXPath(document,startNode,expr);}
case element.Strategy.Name:{if(startNode.getElementsByName){return startNode.getElementsByName(selector)[0];}
let expr=`.//*[@name="${selector}"]`;return element.findByXPath(document,startNode,expr);}
case element.Strategy.ClassName:return startNode.getElementsByClassName(selector)[0];case element.Strategy.TagName:return startNode.getElementsByTagName(selector)[0];case element.Strategy.XPath:return element.findByXPath(document,startNode,selector);case element.Strategy.LinkText:for(let link of startNode.getElementsByTagName("a")){if(atom.getElementText(link).trim()===selector){return link;}}
return undefined;case element.Strategy.PartialLinkText:for(let link of startNode.getElementsByTagName("a")){if(atom.getElementText(link).includes(selector)){return link;}}
return undefined;case element.Strategy.Selector:try{return startNode.querySelector(selector);}catch(e){throw new error.InvalidSelectorError(`${e.message}: "${selector}"`);}}
throw new error.InvalidSelectorError(`No such strategy: ${strategy}`);}
function findElements(strategy,selector,document,startNode=undefined){switch(strategy){case element.Strategy.ID:selector=`.//*[@id="${selector}"]`; case element.Strategy.XPath:return[...element.findByXPathAll(document,startNode,selector)];case element.Strategy.Name:if(startNode.getElementsByName){return startNode.getElementsByName(selector);}
return[...element.findByXPathAll(document,startNode,`.//*[@name="${selector}"]`),];case element.Strategy.ClassName:return startNode.getElementsByClassName(selector);case element.Strategy.TagName:return startNode.getElementsByTagName(selector);case element.Strategy.LinkText:return[...element.findByLinkText(startNode,selector)];case element.Strategy.PartialLinkText:return[...element.findByPartialLinkText(startNode,selector)];case element.Strategy.Selector:return startNode.querySelectorAll(selector);default:throw new error.InvalidSelectorError(`No such strategy: ${strategy}`);}}
element.findClosest=function(startNode,selector){let node=startNode;while(node.parentNode&&node.parentNode.nodeType==ELEMENT_NODE){node=node.parentNode;if(node.matches(selector)){return node;}}
return null;};element.getElementId=function(el){const id=ContentDOMReference.get(el);const webEl=WebElement.from(el);id.webElRef=webEl.toJSON();return id;};element.resolveElement=function(id,win=undefined){const el=ContentDOMReference.resolve(id);if(el===null){ throw new error.NoSuchElementError(`Web element reference not seen before: ${JSON.stringify(id.webElRef)}`);}
if(element.isStale(el,win)){throw new error.StaleElementReferenceError(pprint`The element reference of ${el || JSON.stringify(id.webElRef)} `+"is stale; either the element is no longer attached to the DOM, "+"it is not in the current frame context, "+"or the document has been refreshed");}
return el;};element.isCollection=function(seq){switch(Object.prototype.toString.call(seq)){case"[object Arguments]":case"[object Array]":case"[object FileList]":case"[object HTMLAllCollection]":case"[object HTMLCollection]":case"[object HTMLFormControlsCollection]":case"[object HTMLOptionsCollection]":case"[object NodeList]":return true;default:return false;}};element.isStale=function(el,win=undefined){if(!el){throw new TypeError(`Expected Element got ${el}`);}
if(typeof win=="undefined"){win=el.ownerGlobal;}
if(!el.ownerGlobal||el.ownerDocument!==win.document){return true;}
return!el.isConnected;};element.isSelected=function(el){if(!el){return false;}
if(element.isXULElement(el)){if(XUL_CHECKED_ELS.has(el.tagName)){return el.checked;}else if(XUL_SELECTED_ELS.has(el.tagName)){return el.selected;}}else if(element.isDOMElement(el)){if(el.localName=="input"&&["checkbox","radio"].includes(el.type)){return el.checked;}else if(el.localName=="option"){return el.selected;}}
return false;};element.isReadOnly=function(el){return(element.isDOMElement(el)&&["input","textarea"].includes(el.localName)&&el.readOnly);};element.isDisabled=function(el){if(!element.isDOMElement(el)){return false;}
switch(el.localName){case"option":case"optgroup":if(el.disabled){return true;}
let parent=element.findClosest(el,"optgroup,select");return element.isDisabled(parent);case"button":case"input":case"select":case"textarea":return el.disabled;default:return false;}};element.isMutableFormControl=function(el){if(!element.isDOMElement(el)){return false;}
if(element.isReadOnly(el)||element.isDisabled(el)){return false;}
if(el.localName=="textarea"){return true;}
if(el.localName!="input"){return false;}
switch(el.type){case"color":case"date":case"datetime-local":case"email":case"file":case"month":case"number":case"password":case"range":case"search":case"tel":case"text":case"time":case"url":case"week":return true;default:return false;}};element.isEditingHost=function(el){return(element.isDOMElement(el)&&(el.isContentEditable||el.ownerDocument.designMode=="on"));};element.isEditable=function(el){if(!element.isDOMElement(el)){return false;}
if(element.isReadOnly(el)||element.isDisabled(el)){return false;}
return element.isMutableFormControl(el)||element.isEditingHost(el);};element.coordinates=function(node,xOffset=undefined,yOffset=undefined){let box=node.getBoundingClientRect();if(typeof xOffset=="undefined"||xOffset===null){xOffset=box.width/2.0;}
if(typeof yOffset=="undefined"||yOffset===null){yOffset=box.height/2.0;}
if(typeof yOffset!="number"||typeof xOffset!="number"){throw new TypeError("Offset must be a number");}
return{x:box.left+xOffset,y:box.top+yOffset,};};element.inViewport=function(el,x=undefined,y=undefined){let win=el.ownerGlobal;let c=element.coordinates(el,x,y);let vp={top:win.pageYOffset,left:win.pageXOffset,bottom:win.pageYOffset+win.innerHeight,right:win.pageXOffset+win.innerWidth,};return(vp.left<=c.x+win.pageXOffset&&c.x+win.pageXOffset<=vp.right&&vp.top<=c.y+win.pageYOffset&&c.y+win.pageYOffset<=vp.bottom);};element.getContainer=function(el){if(["option","optgroup"].includes(el.localName)){return element.findClosest(el,"datalist,select")||el;}
return el;};element.isInView=function(el){let originalPointerEvents=el.style.pointerEvents;try{el.style.pointerEvents="auto";const tree=element.getPointerInteractablePaintTree(el);
if(el.localName==="tr"&&el.cells&&el.cells.length>0){return tree.includes(el.cells[0]);}
return tree.includes(el);}finally{el.style.pointerEvents=originalPointerEvents;}};element.isVisible=function(el,x=undefined,y=undefined){let win=el.ownerGlobal;if(!atom.isElementDisplayed(el,win)){return false;}
if(el.tagName.toLowerCase()=="body"){return true;}
if(!element.inViewport(el,x,y)){element.scrollIntoView(el);if(!element.inViewport(el)){return false;}}
return true;};element.isObscured=function(el){let tree=element.getPointerInteractablePaintTree(el);return!el.contains(tree[0]);};
 element.getInViewCentrePoint=function(rect,win){const{floor,max,min}=Math; let visible={left:max(0,min(rect.x,rect.x+rect.width)),right:min(win.innerWidth,max(rect.x,rect.x+rect.width)),top:max(0,min(rect.y,rect.y+rect.height)),bottom:min(win.innerHeight,max(rect.y,rect.y+rect.height)),}; let x=(visible.left+visible.right)/2.0;let y=(visible.top+visible.bottom)/2.0; x=floor(x);y=floor(y);return{x,y};};element.getPointerInteractablePaintTree=function(el){const doc=el.ownerDocument;const win=doc.defaultView;const rootNode=el.getRootNode(); if(!el.isConnected){return[];} 
let rects=el.getClientRects();if(rects.length==0){return[];} 
let centre=element.getInViewCentrePoint(rects[0],win); return rootNode.elementsFromPoint(centre.x,centre.y);};element.isKeyboardInteractable=()=>true;element.scrollIntoView=function(el){if(el.scrollIntoView){el.scrollIntoView({block:"end",inline:"nearest",behavior:"instant"});}};element.isElement=function(node){return element.isDOMElement(node)||element.isXULElement(node);};element.isDOMElement=function(node){return(typeof node=="object"&&node!==null&&"nodeType"in node&&[ELEMENT_NODE,DOCUMENT_NODE].includes(node.nodeType)&&!element.isXULElement(node));};element.isXULElement=function(node){return(typeof node=="object"&&node!==null&&"nodeType"in node&&node.nodeType===node.ELEMENT_NODE&&node.namespaceURI===XUL_NS);};element.isInXULDocument=function(node){return(typeof node=="object"&&node!==null&&"ownerDocument"in node&&node.ownerDocument.documentElement.namespaceURI===XUL_NS);};element.isDOMWindow=function(node){
return(typeof node=="object"&&node!==null&&typeof node.toString=="function"&&node.toString()=="[object Window]"&&node.self===node);};const boolEls={audio:["autoplay","controls","loop","muted"],button:["autofocus","disabled","formnovalidate"],details:["open"],dialog:["open"],fieldset:["disabled"],form:["novalidate"],iframe:["allowfullscreen"],img:["ismap"],input:["autofocus","checked","disabled","formnovalidate","multiple","readonly","required",],keygen:["autofocus","disabled"],menuitem:["checked","default","disabled"],ol:["reversed"],optgroup:["disabled"],option:["disabled","selected"],script:["async","defer"],select:["autofocus","disabled","multiple","required"],textarea:["autofocus","disabled","readonly","required"],track:["default"],video:["autoplay","controls","loop","muted"],};element.isBooleanAttribute=function(el,attr){if(!element.isDOMElement(el)){return false;} 
const customElement=!el.localName.includes("-");if((attr=="hidden"||attr=="itemscope")&&customElement){return true;}
if(!boolEls.hasOwnProperty(el.localName)){return false;}
return boolEls[el.localName].includes(attr);};class WebElement{constructor(uuid){this.uuid=assert.string(uuid);}
is(other){return other instanceof WebElement&&this.uuid===other.uuid;}
toString(){return`[object ${this.constructor.name} uuid=${this.uuid}]`;}
static from(node){const uuid=WebElement.generateUUID();if(element.isElement(node)){if(element.isInXULDocument(node)){return new ChromeWebElement(uuid);}
return new ContentWebElement(uuid);}else if(element.isDOMWindow(node)){if(node.parent===node){return new ContentWebWindow(uuid);}
return new ContentWebFrame(uuid);}
throw new error.InvalidArgumentError("Expected DOM window/element "+pprint`or XUL element, got: ${node}`);}
static fromJSON(json){assert.object(json);if(json instanceof WebElement){return json;}
let keys=Object.keys(json);for(let key of keys){switch(key){case ContentWebElement.Identifier:return ContentWebElement.fromJSON(json);case ContentWebWindow.Identifier:return ContentWebWindow.fromJSON(json);case ContentWebFrame.Identifier:return ContentWebFrame.fromJSON(json);case ChromeWebElement.Identifier:return ChromeWebElement.fromJSON(json);}}
throw new error.InvalidArgumentError(pprint`Expected web element reference, got: ${json}`);}
static fromUUID(uuid,context){assert.string(uuid);switch(context){case"chrome":return new ChromeWebElement(uuid);case"content":return new ContentWebElement(uuid);default:throw new error.InvalidArgumentError("Unknown context: "+context);}}
static isReference(obj){if(Object.prototype.toString.call(obj)!="[object Object]"){return false;}
if(ContentWebElement.Identifier in obj||ContentWebWindow.Identifier in obj||ContentWebFrame.Identifier in obj||ChromeWebElement.Identifier in obj){return true;}
return false;}
static generateUUID(){let uuid=uuidGen.generateUUID().toString();return uuid.substring(1,uuid.length-1);}}
this.WebElement=WebElement;class ContentWebElement extends WebElement{toJSON(){return{[ContentWebElement.Identifier]:this.uuid};}
static fromJSON(json){const{Identifier}=ContentWebElement;if(!(Identifier in json)){throw new error.InvalidArgumentError(pprint`Expected web element reference, got: ${json}`);}
let uuid=json[Identifier];return new ContentWebElement(uuid);}}
ContentWebElement.Identifier="element-6066-11e4-a52e-4f735466cecf";this.ContentWebElement=ContentWebElement;class ContentWebWindow extends WebElement{toJSON(){return{[ContentWebWindow.Identifier]:this.uuid};}
static fromJSON(json){if(!(ContentWebWindow.Identifier in json)){throw new error.InvalidArgumentError(pprint`Expected web window reference, got: ${json}`);}
let uuid=json[ContentWebWindow.Identifier];return new ContentWebWindow(uuid);}}
ContentWebWindow.Identifier="window-fcc6-11e5-b4f8-330a88ab9d7f";this.ContentWebWindow=ContentWebWindow;class ContentWebFrame extends WebElement{toJSON(){return{[ContentWebFrame.Identifier]:this.uuid};}
static fromJSON(json){if(!(ContentWebFrame.Identifier in json)){throw new error.InvalidArgumentError(pprint`Expected web frame reference, got: ${json}`);}
let uuid=json[ContentWebFrame.Identifier];return new ContentWebFrame(uuid);}}
ContentWebFrame.Identifier="frame-075b-4da1-b6ba-e579c2d3230a";this.ContentWebFrame=ContentWebFrame;class ChromeWebElement extends WebElement{toJSON(){return{[ChromeWebElement.Identifier]:this.uuid};}
static fromJSON(json){if(!(ChromeWebElement.Identifier in json)){throw new error.InvalidArgumentError("Expected chrome element reference "+
pprint`for XUL element, got: ${json}`);}
let uuid=json[ChromeWebElement.Identifier];return new ChromeWebElement(uuid);}}
ChromeWebElement.Identifier="chromeelement-9fc5-4b51-a3c8-01716eedeb04";this.ChromeWebElement=ChromeWebElement;