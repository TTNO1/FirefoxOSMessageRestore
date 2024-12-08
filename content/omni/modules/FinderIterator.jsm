//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FinderIterator"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{clearTimeout,setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");ChromeUtils.defineModuleGetter(this,"NLP","resource://gre/modules/NLP.jsm");ChromeUtils.defineModuleGetter(this,"Rect","resource://gre/modules/Geometry.jsm");const kDebug=false;const kIterationSizeMax=100;const kTimeoutPref="findbar.iteratorTimeout";function FinderIterator(){this._listeners=new Map();this._currentParams=null;this._catchingUp=new Set();this._previousParams=null;this._previousRanges=[];this._spawnId=0;this._timer=null;this.ranges=[];this.running=false;this.useSubFrames=false;}
FinderIterator.prototype={_timeout:Services.prefs.getIntPref(kTimeoutPref),get kIterationSizeMax(){return kIterationSizeMax;},get params(){if(!this._currentParams&&!this._previousParams){return null;}
return Object.assign({},this._currentParams||this._previousParams);},start({allowDistance,caseSensitive,entireWord,finder,limit,linksOnly,listener,matchDiacritics,useCache,word,useSubFrames,}){if(typeof allowDistance!="number"){allowDistance=0;}
if(typeof limit!="number"){limit=-1;}
if(typeof linksOnly!="boolean"){linksOnly=false;}
if(typeof useCache!="boolean"){useCache=false;}
if(typeof useSubFrames!="boolean"){useSubFrames=false;}
if(typeof caseSensitive!="boolean"){throw new Error("Missing required option 'caseSensitive'");}
if(typeof entireWord!="boolean"){throw new Error("Missing required option 'entireWord'");}
if(typeof matchDiacritics!="boolean"){throw new Error("Missing required option 'matchDiacritics'");}
if(!finder){throw new Error("Missing required option 'finder'");}
if(!word){throw new Error("Missing required option 'word'");}
if(typeof listener!="object"||!listener.onIteratorRangeFound){throw new TypeError("Missing valid, required option 'listener'");}

if(this._listeners.has(listener)){let{onEnd}=this._listeners.get(listener);if(onEnd){onEnd();}}
let window=finder._getWindow();let resolver;let promise=new Promise(resolve=>(resolver=resolve));let iterParams={caseSensitive,entireWord,linksOnly,matchDiacritics,useCache,window,word,useSubFrames,};this._listeners.set(listener,{limit,onEnd:resolver});if(!this.running&&this._previousResultAvailable(iterParams)){this._yieldPreviousResult(listener,window);return promise;}
if(this.running){
if(!this._areParamsEqual(this._currentParams,iterParams,allowDistance)){if(kDebug){Cu.reportError(`We're currently iterating over '${this._currentParams.word}', not '${word}'\n`+
new Error().stack);}
this._listeners.delete(listener);resolver();return promise;}
this._yieldIntermediateResult(listener,window);return promise;}
this.running=true;this._currentParams=iterParams;this._findAllRanges(finder,++this._spawnId);return promise;},stop(cachePrevious=false){if(!this.running){return;}
if(this._timer){clearTimeout(this._timer);this._timer=null;}
if(this._runningFindResolver){this._runningFindResolver();this._runningFindResolver=null;}
if(cachePrevious){this._previousRanges=[].concat(this.ranges);this._previousParams=Object.assign({},this._currentParams);}else{this._previousRanges=[];this._previousParams=null;}
this._catchingUp.clear();this._currentParams=null;this.ranges=[];this.running=false;for(let[,{onEnd}]of this._listeners){onEnd();}},restart(finder){let iterParams=this.params;if(!iterParams){return;}
this.stop();this.running=true;this._currentParams=iterParams;this._findAllRanges(finder,++this._spawnId);this._notifyListeners("restart",iterParams);},reset(){if(this._timer){clearTimeout(this._timer);this._timer=null;}
if(this._runningFindResolver){this._runningFindResolver();this._runningFindResolver=null;}
this._catchingUp.clear();this._currentParams=this._previousParams=null;this._previousRanges=[];this.ranges=[];this.running=false;this._notifyListeners("reset");for(let[,{onEnd}]of this._listeners){onEnd();}
this._listeners.clear();},continueRunning({caseSensitive,entireWord,linksOnly,matchDiacritics,word,useSubFrames,}){return(this.running&&this._currentParams.caseSensitive===caseSensitive&&this._currentParams.entireWord===entireWord&&this._currentParams.linksOnly===linksOnly&&this._currentParams.matchDiacritics===matchDiacritics&&this._currentParams.word==word&&this._currentParams.useSubFrames==useSubFrames);},isAlreadyRunning(paramSet){return(this.running&&this._areParamsEqual(this._currentParams,paramSet)&&this._listeners.has(paramSet.listener));},_notifyListeners(callback,params,listeners=this._listeners.keys()){callback="onIterator"+callback.charAt(0).toUpperCase()+callback.substr(1);for(let listener of listeners){try{listener[callback](params);}catch(ex){Cu.reportError("FinderIterator Error: "+ex);}}},_previousResultAvailable({caseSensitive,entireWord,linksOnly,matchDiacritics,useCache,word,}){return!!(useCache&&this._areParamsEqual(this._previousParams,{caseSensitive,entireWord,linksOnly,matchDiacritics,word,})&&this._previousRanges.length);},_areParamsEqual(paramSet1,paramSet2,allowDistance=0){return(!!paramSet1&&!!paramSet2&&paramSet1.caseSensitive===paramSet2.caseSensitive&&paramSet1.entireWord===paramSet2.entireWord&&paramSet1.linksOnly===paramSet2.linksOnly&&paramSet1.matchDiacritics===paramSet2.matchDiacritics&&paramSet1.window===paramSet2.window&&paramSet1.useSubFrames===paramSet2.useSubFrames&&NLP.levenshtein(paramSet1.word,paramSet2.word)<=allowDistance);},async _yieldResult(listener,rangeSource,window,withPause=true){
let iterCount=0;let{limit,onEnd}=this._listeners.get(listener);let ranges=rangeSource.slice(0,limit>-1?limit:undefined);for(let range of ranges){try{range.startContainer;}catch(ex){if(ex.message.includes("dead object")){return;}}

listener.onIteratorRangeFound(range,!this.running);await range;if(withPause&&++iterCount>=kIterationSizeMax){iterCount=0;this._listeners.set(listener,{limit,onEnd});await new Promise(resolve=>window.setTimeout(resolve,0));ranges=rangeSource.slice(0,limit>-1?limit:undefined);}
if(limit!==-1&&--limit===0){this._listeners.delete(listener);onEnd();return;}}
this._listeners.set(listener,{limit,onEnd});},async _yieldPreviousResult(listener,window){this._notifyListeners("start",this.params,[listener]);this._catchingUp.add(listener);await this._yieldResult(listener,this._previousRanges,window);this._catchingUp.delete(listener);let{onEnd}=this._listeners.get(listener);if(onEnd){onEnd();}},async _yieldIntermediateResult(listener,window){this._notifyListeners("start",this.params,[listener]);this._catchingUp.add(listener);await this._yieldResult(listener,this.ranges,window,false);this._catchingUp.delete(listener);},async _findAllRanges(finder,spawnId){if(this._timeout){if(this._timer){clearTimeout(this._timer);}
if(this._runningFindResolver){this._runningFindResolver();}
let timeout=this._timeout;let searchTerm=this._currentParams.word;
if(searchTerm.length==1){timeout*=4;}else if(searchTerm.length==2){timeout*=2;}
await new Promise(resolve=>{this._runningFindResolver=resolve;this._timer=setTimeout(resolve,timeout);});this._timer=this._runningFindResolver=null;if(!this.running||spawnId!==this._spawnId){return;}}
this._notifyListeners("start",this.params);let{linksOnly,useSubFrames,window}=this._currentParams;
let frames=[window];if(useSubFrames){frames.push(...this._collectFrames(window,finder));}
let iterCount=0;for(let frame of frames){for(let range of this._iterateDocument(this._currentParams,frame)){
if(!this.running||spawnId!==this._spawnId){return;}
if(linksOnly&&!this._rangeStartsInLink(range)){continue;}
this.ranges.push(range);for(let[listener,{limit,onEnd}]of this._listeners){if(this._catchingUp.has(listener)){continue;}
listener.onIteratorRangeFound(range);if(limit!==-1&&--limit===0){this._listeners.delete(listener);onEnd();continue;}
this._listeners.set(listener,{limit,onEnd});}
await range;if(++iterCount>=kIterationSizeMax){iterCount=0;await new Promise(resolve=>window.setTimeout(resolve,0));}}}

this.stop(true);},*_iterateDocument({caseSensitive,entireWord,matchDiacritics,word},window){let doc=window.document;let body=doc.body||doc.documentElement;if(!body){return;}
let searchRange=doc.createRange();searchRange.selectNodeContents(body);let startPt=searchRange.cloneRange();startPt.collapse(true);let endPt=searchRange.cloneRange();endPt.collapse(false);let retRange=null;let nsIFind=Cc["@mozilla.org/embedcomp/rangefind;1"].createInstance().QueryInterface(Ci.nsIFind);nsIFind.caseSensitive=caseSensitive;nsIFind.entireWord=entireWord;nsIFind.matchDiacritics=matchDiacritics;while((retRange=nsIFind.Find(word,searchRange,startPt,endPt))){yield retRange;startPt=retRange.cloneRange();startPt.collapse(false);}},_collectFrames(window,finder){let frames=[];if(!("frames"in window)||!window.frames.length){return frames;}

let dwu=window.windowUtils;for(let i=0,l=window.frames.length;i<l;++i){let frame=window.frames[i];
let frameEl=frame&&frame.frameElement;if(!frameEl||Rect.fromRect(dwu.getBoundsWithoutFlushing(frameEl)).isEmpty()){continue;}

frames.push(frame,...this._collectFrames(frame,finder));}
return frames;},_getDocShell(windowOrRange){let window=windowOrRange;if(ChromeUtils.getClassName(windowOrRange)==="Range"){window=windowOrRange.startContainer.ownerGlobal;}
return window.docShell;},_rangeStartsInLink(range){let isInsideLink=false;let node=range.startContainer;if(node.nodeType==node.ELEMENT_NODE){if(node.hasChildNodes){let childNode=node.item(range.startOffset);if(childNode){node=childNode;}}}
const XLink_NS="http://www.w3.org/1999/xlink";const HTMLAnchorElement=(node.ownerDocument||node).defaultView.HTMLAnchorElement;do{if(node instanceof HTMLAnchorElement){isInsideLink=node.hasAttribute("href");break;}else if(typeof node.hasAttributeNS=="function"&&node.hasAttributeNS(XLink_NS,"href")){isInsideLink=node.getAttributeNS(XLink_NS,"type")=="simple";break;}
node=node.parentNode;}while(node);return isInsideLink;},};