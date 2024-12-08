"use strict";const EXPORTED_SYMBOLS=["MarionetteReftestChild"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());class MarionetteReftestChild extends JSWindowActorChild{constructor(){super();


this._loadedURLPromise=new Promise(r=>(this._resolveLoadedURLPromise=r));}
handleEvent(event){if(event.type=="load"){const url=event.target.location.href;logger.debug(`Handle load event with URL ${url}`);this._resolveLoadedURLPromise(url);}}
actorCreated(){logger.trace(`[${this.browsingContext.id}] Reftest actor created `+`for window id ${this.manager.innerWindowId}`);}
async receiveMessage(msg){const{name,data}=msg;let result;switch(name){case"MarionetteReftestParent:reftestWait":result=await this.reftestWait(data);break;}
return result;}
async reftestWait(options={}){const{url,useRemote}=options;const loadedURL=await this._loadedURLPromise;if(loadedURL!==url){logger.debug(`Window URL does not match the expected URL "${loadedURL}" !== "${url}"`);return false;}
const documentElement=this.document.documentElement;const hasReftestWait=documentElement.classList.contains("reftest-wait");logger.debug("Waiting for event loop to spin");await new Promise(resolve=>this.contentWindow.setTimeout(resolve,0));await this.paintComplete(useRemote);if(hasReftestWait){const event=new Event("TestRendered",{bubbles:true});documentElement.dispatchEvent(event);logger.info("Emitted TestRendered event");await this.reftestWaitRemoved();await this.paintComplete(useRemote);}
if(this.contentWindow.innerWidth<documentElement.scrollWidth||this.contentWindow.innerHeight<documentElement.scrollHeight){logger.warn(`${url} overflows viewport (width: ${documentElement.scrollWidth}, height: ${documentElement.scrollHeight})`);}
return true;}
paintComplete(useRemote){logger.debug("Waiting for rendering");let windowUtils=this.contentWindow.windowUtils;return new Promise(resolve=>{let maybeResolve=()=>{this.flushRendering();if(useRemote){logger.debug("Force update of layer tree");windowUtils.updateLayerTree();}
if(windowUtils.isMozAfterPaintPending){logger.debug("isMozAfterPaintPending: true");this.contentWindow.addEventListener("MozAfterPaint",maybeResolve,{once:true,});}else{ logger.debug("isMozAfterPaintPending: false");this.contentWindow.requestAnimationFrame(()=>{this.contentWindow.requestAnimationFrame(resolve);});}};maybeResolve();});}
reftestWaitRemoved(){logger.debug("Waiting for reftest-wait removal");return new Promise(resolve=>{const documentElement=this.document.documentElement;let observer=new this.contentWindow.MutationObserver(()=>{if(!documentElement.classList.contains("reftest-wait")){observer.disconnect();logger.debug("reftest-wait removed");this.contentWindow.setTimeout(resolve,0);}});if(documentElement.classList.contains("reftest-wait")){observer.observe(documentElement,{attributes:true});}else{this.contentWindow.setTimeout(resolve,0);}});}
flushRendering(){let anyPendingPaintsGeneratedInDescendants=false;let windowUtils=this.contentWindow.windowUtils;function flushWindow(win){let utils=win.windowUtils;let afterPaintWasPending=utils.isMozAfterPaintPending;let root=win.document.documentElement;if(root){try{root.getBoundingClientRect();}catch(e){logger.error("flushWindow failed",e);}}
if(!afterPaintWasPending&&utils.isMozAfterPaintPending){anyPendingPaintsGeneratedInDescendants=true;}
for(let i=0;i<win.frames.length;++i){flushWindow(win.frames[i]);}}
flushWindow(this.contentWindow);if(anyPendingPaintsGeneratedInDescendants&&!windowUtils.isMozAfterPaintPending){logger.error("Descendant frame generated a MozAfterPaint event, "+"but the root document doesn't have one!");}}}