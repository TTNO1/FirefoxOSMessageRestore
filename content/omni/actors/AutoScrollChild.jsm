const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var EXPORTED_SYMBOLS=["AutoScrollChild"];class AutoScrollChild extends JSWindowActorChild{constructor(){super();this._scrollable=null;this._scrolldir="";this._startX=null;this._startY=null;this._screenX=null;this._screenY=null;this._lastFrame=null;this._autoscrollHandledByApz=false;this._scrollId=null;this.observer=new AutoScrollObserver(this);this.autoscrollLoop=this.autoscrollLoop.bind(this);}
isAutoscrollBlocker(node){let mmPaste=Services.prefs.getBoolPref("middlemouse.paste");let mmScrollbarPosition=Services.prefs.getBoolPref("middlemouse.scrollbarPosition");let content=node.ownerGlobal;while(node){if((node instanceof content.HTMLAnchorElement||node instanceof content.HTMLAreaElement)&&node.hasAttribute("href")){return true;}
if(mmPaste&&(node instanceof content.HTMLInputElement||node instanceof content.HTMLTextAreaElement)){return true;}
if(node instanceof content.XULElement&&((mmScrollbarPosition&&(node.localName=="scrollbar"||node.localName=="scrollcorner"))||node.localName=="treechildren")){return true;}
node=node.parentNode;}
return false;}
isScrollableElement(aNode){let content=aNode.ownerGlobal;if(aNode instanceof content.HTMLElement){return!(aNode instanceof content.HTMLSelectElement)||aNode.multiple;}
return aNode instanceof content.XULElement;}
computeWindowScrollDirection(global){if(!global.scrollbars.visible){return null;}
if(global.scrollMaxX!=global.scrollMinX){return global.scrollMaxY!=global.scrollMinY?"NSEW":"EW";}
if(global.scrollMaxY!=global.scrollMinY){return"NS";}
return null;}
computeNodeScrollDirection(node){if(!this.isScrollableElement(node)){return null;}
let global=node.ownerGlobal; const scrollingAllowed=["scroll","auto"];let cs=global.getComputedStyle(node);let overflowx=cs.getPropertyValue("overflow-x");let overflowy=cs.getPropertyValue("overflow-y");

 let scrollVert=node.scrollTopMax&&(node instanceof global.HTMLSelectElement||scrollingAllowed.includes(overflowy));
 if(!(node instanceof global.HTMLSelectElement)&&node.scrollLeftMin!=node.scrollLeftMax&&scrollingAllowed.includes(overflowx)){return scrollVert?"NSEW":"EW";}
if(scrollVert){return"NS";}
return null;}
findNearestScrollableElement(aNode){
 this._scrollable=null;for(let node=aNode;node;node=node.flattenedTreeParentNode){
 let direction=this.computeNodeScrollDirection(node);if(direction){this._scrolldir=direction;this._scrollable=node;break;}}
if(!this._scrollable){let direction=this.computeWindowScrollDirection(aNode.ownerGlobal);if(direction){this._scrolldir=direction;this._scrollable=aNode.ownerGlobal;}else if(aNode.ownerGlobal.frameElement){

this.findNearestScrollableElement(aNode.ownerGlobal.frameElement);}}}
async startScroll(event){this.findNearestScrollableElement(event.originalTarget);if(!this._scrollable){this.sendAsyncMessage("Autoscroll:MaybeStartInParent",{browsingContextId:this.browsingContext.id,screenX:event.screenX,screenY:event.screenY,});return;}
let content=event.originalTarget.ownerGlobal;

if(!content.performance){return;}
let domUtils=content.windowUtils;let scrollable=this._scrollable;if(scrollable instanceof Ci.nsIDOMWindow){scrollable=scrollable.document.documentElement;}
this._scrollId=null;try{this._scrollId=domUtils.getViewId(scrollable);}catch(e){}
let presShellId=domUtils.getPresShellId();let{autoscrollEnabled,usingApz}=await this.sendQuery("Autoscroll:Start",{scrolldir:this._scrolldir,screenX:event.screenX,screenY:event.screenY,scrollId:this._scrollId,presShellId,browsingContext:this.browsingContext,});if(!autoscrollEnabled){this._scrollable=null;return;}
Services.els.addSystemEventListener(this.document,"mousemove",this,true);this.document.addEventListener("pagehide",this,true);this._ignoreMouseEvents=true;this._startX=event.screenX;this._startY=event.screenY;this._screenX=event.screenX;this._screenY=event.screenY;this._scrollErrorX=0;this._scrollErrorY=0;this._autoscrollHandledByApz=usingApz;if(!usingApz){this.startMainThreadScroll();}else{
Services.obs.addObserver(this.observer,"autoscroll-rejected-by-apz");}
if(Cu.isInAutomation){Services.obs.notifyObservers(content,"autoscroll-start");}}
startMainThreadScroll(){let content=this.document.defaultView;this._lastFrame=content.performance.now();content.requestAnimationFrame(this.autoscrollLoop);const kAutoscroll=15; Services.telemetry.getHistogramById("SCROLL_INPUT_METHODS").add(kAutoscroll);}
stopScroll(){if(this._scrollable){this._scrollable.mozScrollSnap();this._scrollable=null;Services.els.removeSystemEventListener(this.document,"mousemove",this,true);this.document.removeEventListener("pagehide",this,true);if(this._autoscrollHandledByApz){Services.obs.removeObserver(this.observer,"autoscroll-rejected-by-apz");}}}
accelerate(curr,start){const speed=12;var val=(curr-start)/speed;if(val>1){return val*Math.sqrt(val)-1;}
if(val<-1){return val*Math.sqrt(-val)+1;}
return 0;}
roundToZero(num){if(num>0){return Math.floor(num);}
return Math.ceil(num);}
autoscrollLoop(timestamp){if(!this._scrollable){ return;}
 
const maxTimeDelta=100;var timeDelta=Math.min(maxTimeDelta,timestamp-this._lastFrame);var timeCompensation=timeDelta/20;this._lastFrame=timestamp;var actualScrollX=0;var actualScrollY=0;
 if(this._scrolldir!="EW"){var y=this.accelerate(this._screenY,this._startY)*timeCompensation;var desiredScrollY=this._scrollErrorY+y;actualScrollY=this.roundToZero(desiredScrollY);this._scrollErrorY=desiredScrollY-actualScrollY;}
if(this._scrolldir!="NS"){var x=this.accelerate(this._screenX,this._startX)*timeCompensation;var desiredScrollX=this._scrollErrorX+x;actualScrollX=this.roundToZero(desiredScrollX);this._scrollErrorX=desiredScrollX-actualScrollX;}
this._scrollable.scrollBy({left:actualScrollX,top:actualScrollY,behavior:"instant",});this._scrollable.ownerGlobal.requestAnimationFrame(this.autoscrollLoop);}
handleEvent(event){if(event.type=="mousemove"){this._screenX=event.screenX;this._screenY=event.screenY;}else if(event.type=="mousedown"){if(event.isTrusted&!event.defaultPrevented&&event.button==1&&!this._scrollable&&!this.isAutoscrollBlocker(event.originalTarget)){this.startScroll(event);}}else if(event.type=="pagehide"){if(this._scrollable){var doc=this._scrollable.ownerDocument||this._scrollable.document;if(doc==event.target){this.sendAsyncMessage("Autoscroll:Cancel");this.stopScroll();}}}}
receiveMessage(msg){let data=msg.data;switch(msg.name){case"Autoscroll:MaybeStart":for(let child of this.browsingContext.children){if(data.browsingContextId==child.id){this.startScroll({screenX:data.screenX,screenY:data.screenY,originalTarget:child.embedderElement,});break;}}
break;case"Autoscroll:Stop":{this.stopScroll();break;}}}
rejectedByApz(data){if(data==this._scrollId){this._autoscrollHandledByApz=false;this.startMainThreadScroll();Services.obs.removeObserver(this.observer,"autoscroll-rejected-by-apz");}}}
class AutoScrollObserver{constructor(actor){this.actor=actor;}
observe(subject,topic,data){if(topic==="autoscroll-rejected-by-apz"){this.actor.rejectedByApz(data);}}}