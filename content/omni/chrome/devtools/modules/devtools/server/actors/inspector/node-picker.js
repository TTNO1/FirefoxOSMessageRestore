"use strict";const{Ci}=require("chrome");const Services=require("Services");loader.lazyRequireGetter(this,"isWindowIncluded","devtools/shared/layout/utils",true);loader.lazyRequireGetter(this,"isRemoteFrame","devtools/shared/layout/utils",true);const IS_OSX=Services.appinfo.OS==="Darwin";class NodePicker{constructor(walker,targetActor){this._walker=walker;this._targetActor=targetActor;this._isPicking=false;this._hoveredNode=null;this._currentNode=null;this._onHovered=this._onHovered.bind(this);this._onKey=this._onKey.bind(this);this._onPick=this._onPick.bind(this);this._onSuppressedEvent=this._onSuppressedEvent.bind(this);}
_findAndAttachElement(event){

 const node=event.originalTarget||event.target;return this._walker.attachElement(node);}
_isEventAllowed({view}){const{window}=this._targetActor;return(window instanceof Ci.nsIDOMChromeWindow||isWindowIncluded(window,view));}
_onPick(event){
if(isRemoteFrame(event.target)){return;}
this._preventContentEvent(event);if(!this._isEventAllowed(event)){return;}
if(event.shiftKey){this._walker.emit("picker-node-previewed",this._findAndAttachElement(event));return;}
this._stopPickerListeners();this._isPicking=false;if(!this._currentNode){this._currentNode=this._findAndAttachElement(event);}
this._walker.emit("picker-node-picked",this._currentNode);}
_onHovered(event){
if(isRemoteFrame(event.target)){return;}
this._preventContentEvent(event);if(!this._isEventAllowed(event)){return;}
this._currentNode=this._findAndAttachElement(event);if(this._hoveredNode!==this._currentNode.node){this._walker.emit("picker-node-hovered",this._currentNode);this._hoveredNode=this._currentNode.node;}}
_onKey(event){if(!this._currentNode||!this._isPicking){return;}
this._preventContentEvent(event);if(!this._isEventAllowed(event)){return;}
let currentNode=this._currentNode.node.rawNode;switch(event.keyCode){case event.DOM_VK_LEFT:if(!currentNode.parentElement){return;}
currentNode=currentNode.parentElement;break;case event.DOM_VK_RIGHT:if(!currentNode.children.length){return;} 
let child=currentNode.firstElementChild;
 const hoveredNode=this._hoveredNode.rawNode;for(const sibling of currentNode.children){if(sibling.contains(hoveredNode)||sibling===hoveredNode){child=sibling;}}
currentNode=child;break;case event.DOM_VK_RETURN:this._onPick(event);return;case event.DOM_VK_ESCAPE:this.cancelPick();this._walker.emit("picker-node-canceled");return;case event.DOM_VK_C:const{altKey,ctrlKey,metaKey,shiftKey}=event;if((IS_OSX&&metaKey&&altKey|shiftKey)||(!IS_OSX&&ctrlKey&&shiftKey)){this.cancelPick();this._walker.emit("picker-node-canceled");}
return;default:return;} 
this._currentNode=this._walker.attachElement(currentNode);this._walker.emit("picker-node-hovered",this._currentNode);}
_onSuppressedEvent(event){if(event.type=="mousemove"){this._onHovered(event);}else if(event.type=="mouseup"){
this._onPick(event);}}



_preventContentEvent(event){if(isRemoteFrame(event.target)){return;}
event.stopPropagation();event.preventDefault();}
_setSuppressedEventListener(callback){const{document}=this._targetActor.window;document.setSuppressedEventListener(callback?{handleEvent:callback}:null);}
_startPickerListeners(){const target=this._targetActor.chromeEventHandler;target.addEventListener("mousemove",this._onHovered,true);target.addEventListener("click",this._onPick,true);target.addEventListener("mousedown",this._preventContentEvent,true);target.addEventListener("mouseup",this._preventContentEvent,true);target.addEventListener("dblclick",this._preventContentEvent,true);target.addEventListener("keydown",this._onKey,true);target.addEventListener("keyup",this._preventContentEvent,true);this._setSuppressedEventListener(this._onSuppressedEvent);}
_stopPickerListeners(){const target=this._targetActor.chromeEventHandler;if(!target){return;}
target.removeEventListener("mousemove",this._onHovered,true);target.removeEventListener("click",this._onPick,true);target.removeEventListener("mousedown",this._preventContentEvent,true);target.removeEventListener("mouseup",this._preventContentEvent,true);target.removeEventListener("dblclick",this._preventContentEvent,true);target.removeEventListener("keydown",this._onKey,true);target.removeEventListener("keyup",this._preventContentEvent,true);this._setSuppressedEventListener(null);}
cancelPick(){if(this._targetActor.threadActor){this._targetActor.threadActor.showOverlay();}
if(this._isPicking){this._stopPickerListeners();this._isPicking=false;this._hoveredNode=null;}}
pick(doFocus=false){if(this._targetActor.threadActor){this._targetActor.threadActor.hideOverlay();}
if(this._isPicking){return;}
this._startPickerListeners();this._isPicking=true;if(doFocus){this._targetActor.window.focus();}}
destroy(){this.cancelPick();this._targetActor=null;this._walker=null;}}
exports.NodePicker=NodePicker;