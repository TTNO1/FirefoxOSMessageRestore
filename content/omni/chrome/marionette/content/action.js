"use strict";const EXPORTED_SYMBOLS=["action"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{assert:"chrome://marionette/content/assert.js",element:"chrome://marionette/content/element.js",error:"chrome://marionette/content/error.js",event:"chrome://marionette/content/event.js",pprint:"chrome://marionette/content/format.js",Sleep:"chrome://marionette/content/sync.js",});
 this.action={Pause:"pause",KeyDown:"keyDown",KeyUp:"keyUp",PointerDown:"pointerDown",PointerUp:"pointerUp",PointerMove:"pointerMove",PointerCancel:"pointerCancel",};const ACTIONS={none:new Set([action.Pause]),key:new Set([action.Pause,action.KeyDown,action.KeyUp]),pointer:new Set([action.Pause,action.PointerDown,action.PointerUp,action.PointerMove,action.PointerCancel,]),};const MODIFIER_NAME_LOOKUP={Alt:"alt",Shift:"shift",Control:"ctrl",Meta:"meta",};const NORMALIZED_KEY_LOOKUP={"\uE000":"Unidentified","\uE001":"Cancel","\uE002":"Help","\uE003":"Backspace","\uE004":"Tab","\uE005":"Clear","\uE006":"Enter","\uE007":"Enter","\uE008":"Shift","\uE009":"Control","\uE00A":"Alt","\uE00B":"Pause","\uE00C":"Escape","\uE00D":" ","\uE00E":"PageUp","\uE00F":"PageDown","\uE010":"End","\uE011":"Home","\uE012":"ArrowLeft","\uE013":"ArrowUp","\uE014":"ArrowRight","\uE015":"ArrowDown","\uE016":"Insert","\uE017":"Delete","\uE018":";","\uE019":"=","\uE01A":"0","\uE01B":"1","\uE01C":"2","\uE01D":"3","\uE01E":"4","\uE01F":"5","\uE020":"6","\uE021":"7","\uE022":"8","\uE023":"9","\uE024":"*","\uE025":"+","\uE026":",","\uE027":"-","\uE028":".","\uE029":"/","\uE031":"F1","\uE032":"F2","\uE033":"F3","\uE034":"F4","\uE035":"F5","\uE036":"F6","\uE037":"F7","\uE038":"F8","\uE039":"F9","\uE03A":"F10","\uE03B":"F11","\uE03C":"F12","\uE03D":"Meta","\uE040":"ZenkakuHankaku","\uE050":"Shift","\uE051":"Control","\uE052":"Alt","\uE053":"Meta","\uE054":"PageUp","\uE055":"PageDown","\uE056":"End","\uE057":"Home","\uE058":"ArrowLeft","\uE059":"ArrowUp","\uE05A":"ArrowRight","\uE05B":"ArrowDown","\uE05C":"Insert","\uE05D":"Delete",};const KEY_LOCATION_LOOKUP={"\uE007":1,"\uE008":1,"\uE009":1,"\uE00A":1,"\uE01A":3,"\uE01B":3,"\uE01C":3,"\uE01D":3,"\uE01E":3,"\uE01F":3,"\uE020":3,"\uE021":3,"\uE022":3,"\uE023":3,"\uE024":3,"\uE025":3,"\uE026":3,"\uE027":3,"\uE028":3,"\uE029":3,"\uE03D":1,"\uE050":2,"\uE051":2,"\uE052":2,"\uE053":2,"\uE054":3,"\uE055":3,"\uE056":3,"\uE057":3,"\uE058":3,"\uE059":3,"\uE05A":3,"\uE05B":3,"\uE05C":3,"\uE05D":3,};const KEY_CODE_LOOKUP={"\uE00A":"AltLeft","\uE052":"AltRight","\uE015":"ArrowDown","\uE012":"ArrowLeft","\uE014":"ArrowRight","\uE013":"ArrowUp","`":"Backquote","~":"Backquote","\\":"Backslash","|":"Backslash","\uE003":"Backspace","[":"BracketLeft","{":"BracketLeft","]":"BracketRight","}":"BracketRight",",":"Comma","<":"Comma","\uE009":"ControlLeft","\uE051":"ControlRight","\uE017":"Delete",")":"Digit0","0":"Digit0","!":"Digit1","1":"Digit1","2":"Digit2","@":"Digit2","#":"Digit3","3":"Digit3",$:"Digit4","4":"Digit4","%":"Digit5","5":"Digit5","6":"Digit6","^":"Digit6","&":"Digit7","7":"Digit7","*":"Digit8","8":"Digit8","(":"Digit9","9":"Digit9","\uE010":"End","\uE006":"Enter","+":"Equal","=":"Equal","\uE00C":"Escape","\uE031":"F1","\uE03A":"F10","\uE03B":"F11","\uE03C":"F12","\uE032":"F2","\uE033":"F3","\uE034":"F4","\uE035":"F5","\uE036":"F6","\uE037":"F7","\uE038":"F8","\uE039":"F9","\uE002":"Help","\uE011":"Home","\uE016":"Insert","<":"IntlBackslash",">":"IntlBackslash",A:"KeyA",a:"KeyA",B:"KeyB",b:"KeyB",C:"KeyC",c:"KeyC",D:"KeyD",d:"KeyD",E:"KeyE",e:"KeyE",F:"KeyF",f:"KeyF",G:"KeyG",g:"KeyG",H:"KeyH",h:"KeyH",I:"KeyI",i:"KeyI",J:"KeyJ",j:"KeyJ",K:"KeyK",k:"KeyK",L:"KeyL",l:"KeyL",M:"KeyM",m:"KeyM",N:"KeyN",n:"KeyN",O:"KeyO",o:"KeyO",P:"KeyP",p:"KeyP",Q:"KeyQ",q:"KeyQ",R:"KeyR",r:"KeyR",S:"KeyS",s:"KeyS",T:"KeyT",t:"KeyT",U:"KeyU",u:"KeyU",V:"KeyV",v:"KeyV",W:"KeyW",w:"KeyW",X:"KeyX",x:"KeyX",Y:"KeyY",y:"KeyY",Z:"KeyZ",z:"KeyZ","-":"Minus",_:"Minus","\uE01A":"Numpad0","\uE05C":"Numpad0","\uE01B":"Numpad1","\uE056":"Numpad1","\uE01C":"Numpad2","\uE05B":"Numpad2","\uE01D":"Numpad3","\uE055":"Numpad3","\uE01E":"Numpad4","\uE058":"Numpad4","\uE01F":"Numpad5","\uE020":"Numpad6","\uE05A":"Numpad6","\uE021":"Numpad7","\uE057":"Numpad7","\uE022":"Numpad8","\uE059":"Numpad8","\uE023":"Numpad9","\uE054":"Numpad9","\uE024":"NumpadAdd","\uE026":"NumpadComma","\uE028":"NumpadDecimal","\uE05D":"NumpadDecimal","\uE029":"NumpadDivide","\uE007":"NumpadEnter","\uE024":"NumpadMultiply","\uE026":"NumpadSubtract","\uE03D":"OSLeft","\uE053":"OSRight","\uE01E":"PageDown","\uE01F":"PageUp",".":"Period",">":"Period",'"':"Quote","'":"Quote",":":"Semicolon",";":"Semicolon","\uE008":"ShiftLeft","\uE050":"ShiftRight","/":"Slash","?":"Slash","\uE00D":"Space"," ":"Space","\uE004":"Tab",};action.PointerOrigin={Viewport:"viewport",Pointer:"pointer",};action.specCompatPointerOrigin=true;action.PointerOrigin.get=function(obj){let origin=obj;if(typeof obj=="undefined"){origin=this.Viewport;}else if(typeof obj=="string"){let name=capitalize(obj);assert.in(name,this,pprint`Unknown pointer-move origin: ${obj}`);origin=this[name];}else if(!element.isElement(obj)){throw new error.InvalidArgumentError("Expected 'origin' to be undefined, "+'"viewport", "pointer", '+
pprint`or an element, got: ${obj}`);}
return origin;};action.PointerType={Mouse:"mouse",
};action.PointerType.get=function(str){let name=capitalize(str);assert.in(name,this,pprint`Unknown pointerType: ${str}`);return this[name];};action.inputStateMap=new Map();action.inputsToCancel=[];class InputState{constructor(){this.type=this.constructor.name.toLowerCase();}
is(other){if(typeof other=="undefined"){return false;}
return this.type===other.type;}
toString(){return`[object ${this.constructor.name}InputState]`;}
static fromJSON(obj){let type=obj.type;assert.in(type,ACTIONS,pprint`Unknown action type: ${type}`);let name=type=="none"?"Null":capitalize(type);if(name=="Pointer"){if(!obj.pointerType&&(!obj.parameters||!obj.parameters.pointerType)){throw new error.InvalidArgumentError(pprint`Expected obj to have pointerType, got ${obj}`);}
let pointerType=obj.pointerType||obj.parameters.pointerType;return new action.InputState[name](pointerType);}
return new action.InputState[name]();}}
action.InputState={};action.InputState.Key=class Key extends InputState{constructor(){super();this.pressed=new Set();this.alt=false;this.shift=false;this.ctrl=false;this.meta=false;}
setModState(key,value){if(key in MODIFIER_NAME_LOOKUP){this[MODIFIER_NAME_LOOKUP[key]]=value;}else{throw new error.InvalidArgumentError("Expected 'key' to be one of "+
Object.keys(MODIFIER_NAME_LOOKUP)+
pprint`, got ${key}`);}}
isPressed(key){return this.pressed.has(key);}
press(key){return this.pressed.add(key);}
release(key){return this.pressed.delete(key);}};action.InputState.Null=class Null extends InputState{constructor(){super();this.type="none";}};action.InputState.Pointer=class Pointer extends InputState{constructor(subtype){super();this.pressed=new Set();assert.defined(subtype,pprint`Expected subtype to be defined, got ${subtype}`);this.subtype=action.PointerType.get(subtype);this.x=0;this.y=0;}
isPressed(button){assert.positiveInteger(button);return this.pressed.has(button);}
press(button){assert.positiveInteger(button);return this.pressed.add(button);}
release(button){assert.positiveInteger(button);return this.pressed.delete(button);}};action.Action=class{constructor(id,type,subtype){if([id,type,subtype].includes(undefined)){throw new error.InvalidArgumentError("Missing id, type or subtype");}
for(let attr of[id,type,subtype]){assert.string(attr,pprint`Expected string, got ${attr}`);}
this.id=id;this.type=type;this.subtype=subtype;}
toString(){return`[action ${this.type}]`;}
static fromJSON(actionSequence,actionItem){let type=actionSequence.type;let id=actionSequence.id;let subtypes=ACTIONS[type];if(!subtypes){throw new error.InvalidArgumentError("Unknown type: "+type);}
let subtype=actionItem.type;if(!subtypes.has(subtype)){throw new error.InvalidArgumentError(`Unknown subtype for ${type} action: ${subtype}`);}
let item=new action.Action(id,type,subtype);if(type==="pointer"){action.processPointerAction(id,action.PointerParameters.fromJSON(actionSequence.parameters),item);}
switch(item.subtype){case action.KeyUp:case action.KeyDown:let key=actionItem.value;
assert.string(key,"Expected 'value' to be a string that represents single code point "+
pprint`or grapheme cluster, got ${key}`);item.value=key;break;case action.PointerDown:case action.PointerUp:assert.positiveInteger(actionItem.button,pprint`Expected 'button' (${actionItem.button}) to be >= 0`);item.button=actionItem.button;break;case action.PointerMove:item.duration=actionItem.duration;if(typeof item.duration!="undefined"){assert.positiveInteger(item.duration,pprint`Expected 'duration' (${item.duration}) to be >= 0`);}
item.origin=action.PointerOrigin.get(actionItem.origin);item.x=actionItem.x;if(typeof item.x!="undefined"){assert.integer(item.x,pprint`Expected 'x' (${item.x}) to be an Integer`);}
item.y=actionItem.y;if(typeof item.y!="undefined"){assert.integer(item.y,pprint`Expected 'y' (${item.y}) to be an Integer`);}
break;case action.PointerCancel:throw new error.UnsupportedOperationError();case action.Pause:item.duration=actionItem.duration;if(typeof item.duration!="undefined"){ assert.positiveInteger(item.duration,pprint`Expected 'duration' (${item.duration}) to be >= 0`);}
break;}
return item;}};action.Chain=class extends Array{toString(){return`[chain ${super.toString()}]`;}
static fromJSON(actions){assert.array(actions,pprint`Expected 'actions' to be an array, got ${actions}`);let actionsByTick=new action.Chain();for(let actionSequence of actions){
let inputSourceActions=action.Sequence.fromJSON(actionSequence);for(let i=0;i<inputSourceActions.length;i++){ if(actionsByTick.length<i+1){actionsByTick.push([]);}
actionsByTick[i].push(inputSourceActions[i]);}}
return actionsByTick;}};action.Sequence=class extends Array{toString(){return`[sequence ${super.toString()}]`;}
static fromJSON(actionSequence){ let inputSourceState=InputState.fromJSON(actionSequence);let id=actionSequence.id;assert.defined(id,"Expected 'id' to be defined");assert.string(id,pprint`Expected 'id' to be a string, got ${id}`);let actionItems=actionSequence.actions;assert.array(actionItems,"Expected 'actionSequence.actions' to be an array, "+
pprint`got ${actionSequence.actions}`);if(!action.inputStateMap.has(id)){action.inputStateMap.set(id,inputSourceState);}else if(!action.inputStateMap.get(id).is(inputSourceState)){throw new error.InvalidArgumentError(`Expected ${id} to be mapped to ${inputSourceState}, `+`got ${action.inputStateMap.get(id)}`);}
let actions=new action.Sequence();for(let actionItem of actionItems){actions.push(action.Action.fromJSON(actionSequence,actionItem));}
return actions;}};action.PointerParameters=class{constructor(pointerType="mouse"){this.pointerType=action.PointerType.get(pointerType);}
toString(){return`[pointerParameters ${this.pointerType}]`;}
static fromJSON(parametersData){if(typeof parametersData=="undefined"){return new action.PointerParameters();}
return new action.PointerParameters(parametersData.pointerType);}};action.processPointerAction=function(id,pointerParams,act){if(action.inputStateMap.has(id)&&action.inputStateMap.get(id).type!==act.type){throw new error.InvalidArgumentError(`Expected 'id' ${id} to be mapped to InputState whose type is `+
action.inputStateMap.get(id).type+
pprint` , got ${act.type}`);}
let pointerType=pointerParams.pointerType;if(action.inputStateMap.has(id)&&action.inputStateMap.get(id).subtype!==pointerType){throw new error.InvalidArgumentError(`Expected 'id' ${id} to be mapped to InputState whose subtype is `+
action.inputStateMap.get(id).subtype+
pprint` , got ${pointerType}`);}
act.pointerType=pointerParams.pointerType;};action.Key=class{constructor(rawKey){this.key=NORMALIZED_KEY_LOOKUP[rawKey]||rawKey;this.code=KEY_CODE_LOOKUP[rawKey];this.location=KEY_LOCATION_LOOKUP[rawKey]||0;this.altKey=false;this.shiftKey=false;this.ctrlKey=false;this.metaKey=false;this.repeat=false;this.isComposing=false;}
update(inputState){this.altKey=inputState.alt;this.shiftKey=inputState.shift;this.ctrlKey=inputState.ctrl;this.metaKey=inputState.meta;}};action.Mouse=class{constructor(type,button=0){this.type=type;assert.positiveInteger(button);this.button=button;this.buttons=0;this.altKey=false;this.shiftKey=false;this.metaKey=false;this.ctrlKey=false;
 for(let inputState of action.inputStateMap.values()){if(inputState.type=="key"){this.altKey=inputState.alt||this.altKey;this.ctrlKey=inputState.ctrl||this.ctrlKey;this.metaKey=inputState.meta||this.metaKey;this.shiftKey=inputState.shift||this.shiftKey;}}}
update(inputState){let allButtons=Array.from(inputState.pressed);this.buttons=allButtons.reduce((a,i)=>a+Math.pow(2,i),0);}};action.dispatch=function(chain,win,specCompatPointerOrigin=true){action.specCompatPointerOrigin=specCompatPointerOrigin;let chainEvents=(async()=>{for(let tickActions of chain){await action.dispatchTickActions(tickActions,action.computeTickDuration(tickActions),win);}})();return chainEvents;};action.dispatchTickActions=function(tickActions,tickDuration,win){let pendingEvents=tickActions.map(toEvents(tickDuration,win));return Promise.all(pendingEvents);};action.computeTickDuration=function(tickActions){let max=0;for(let a of tickActions){let affectsWallClockTime=a.subtype==action.Pause||(a.type=="pointer"&&a.subtype==action.PointerMove);if(affectsWallClockTime&&a.duration){max=Math.max(a.duration,max);}}
return max;};action.computePointerDestination=function(a,inputState,center=undefined){let{x,y}=a;switch(a.origin){case action.PointerOrigin.Viewport:break;case action.PointerOrigin.Pointer:x+=inputState.x;y+=inputState.y;break;default: assert.defined(center);assert.in("x",center);assert.in("y",center);x+=center.x;y+=center.y;}
return{x,y};};function toEvents(tickDuration,win){return a=>{let inputState=action.inputStateMap.get(a.id);switch(a.subtype){case action.KeyUp:return dispatchKeyUp(a,inputState,win);case action.KeyDown:return dispatchKeyDown(a,inputState,win);case action.PointerDown:return dispatchPointerDown(a,inputState,win);case action.PointerUp:return dispatchPointerUp(a,inputState,win);case action.PointerMove:return dispatchPointerMove(a,inputState,tickDuration,win);case action.PointerCancel:throw new error.UnsupportedOperationError();case action.Pause:return dispatchPause(a,tickDuration);}
return undefined;};}
function dispatchKeyDown(a,inputState,win){return new Promise(resolve=>{let keyEvent=new action.Key(a.value);keyEvent.repeat=inputState.isPressed(keyEvent.key);inputState.press(keyEvent.key);if(keyEvent.key in MODIFIER_NAME_LOOKUP){inputState.setModState(keyEvent.key,true);} 
action.inputsToCancel.push(Object.assign({},a,{subtype:action.KeyUp}));keyEvent.update(inputState);event.sendKeyDown(a.value,keyEvent,win);resolve();});}
function dispatchKeyUp(a,inputState,win){return new Promise(resolve=>{let keyEvent=new action.Key(a.value);if(!inputState.isPressed(keyEvent.key)){resolve();return;}
if(keyEvent.key in MODIFIER_NAME_LOOKUP){inputState.setModState(keyEvent.key,false);}
inputState.release(keyEvent.key);keyEvent.update(inputState);event.sendKeyUp(a.value,keyEvent,win);resolve();});}
function dispatchPointerDown(a,inputState,win){return new Promise(resolve=>{if(inputState.isPressed(a.button)){resolve();return;}
inputState.press(a.button); let copy=Object.assign({},a,{subtype:action.PointerUp});action.inputsToCancel.push(copy);switch(inputState.subtype){case action.PointerType.Mouse:let mouseEvent=new action.Mouse("mousedown",a.button);mouseEvent.update(inputState);if(mouseEvent.ctrlKey){if(Services.appinfo.OS==="Darwin"){mouseEvent.button=2;event.DoubleClickTracker.resetClick();}}else if(event.DoubleClickTracker.isClicked()){mouseEvent=Object.assign({},mouseEvent,{clickCount:2});}
event.synthesizeMouseAtPoint(inputState.x,inputState.y,mouseEvent,win);if(event.MouseButton.isSecondary(a.button)||(mouseEvent.ctrlKey&&Services.appinfo.OS==="Darwin")){let contextMenuEvent=Object.assign({},mouseEvent,{type:"contextmenu",});event.synthesizeMouseAtPoint(inputState.x,inputState.y,contextMenuEvent,win);}
break;case action.PointerType.Pen:case action.PointerType.Touch:throw new error.UnsupportedOperationError("Only 'mouse' pointer type is supported");default:throw new TypeError(`Unknown pointer type: ${inputState.subtype}`);}
resolve();});}
function dispatchPointerUp(a,inputState,win){return new Promise(resolve=>{if(!inputState.isPressed(a.button)){resolve();return;}
inputState.release(a.button);switch(inputState.subtype){case action.PointerType.Mouse:let mouseEvent=new action.Mouse("mouseup",a.button);mouseEvent.update(inputState);if(event.DoubleClickTracker.isClicked()){mouseEvent=Object.assign({},mouseEvent,{clickCount:2});}
event.synthesizeMouseAtPoint(inputState.x,inputState.y,mouseEvent,win);break;case action.PointerType.Pen:case action.PointerType.Touch:throw new error.UnsupportedOperationError("Only 'mouse' pointer type is supported");default:throw new TypeError(`Unknown pointer type: ${inputState.subtype}`);}
resolve();});}
function dispatchPointerMove(a,inputState,tickDuration,win){const timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer); const fps60=17;return new Promise((resolve,reject)=>{const start=Date.now();const[startX,startY]=[inputState.x,inputState.y];let coords=getElementCenter(a.origin,win);let target=action.computePointerDestination(a,inputState,coords);const[targetX,targetY]=[target.x,target.y];if(!inViewPort(targetX,targetY,win)){throw new error.MoveTargetOutOfBoundsError(`(${targetX}, ${targetY}) is out of bounds of viewport `+`width (${win.innerWidth}) `+`and height (${win.innerHeight})`);}
const duration=typeof a.duration=="undefined"?tickDuration:a.duration;if(duration===0){ performOnePointerMove(inputState,targetX,targetY,win);resolve();return;}
const distanceX=targetX-startX;const distanceY=targetY-startY;const ONE_SHOT=Ci.nsITimer.TYPE_ONE_SHOT;let intermediatePointerEvents=(async()=>{ await new Promise(resolveTimer=>timer.initWithCallback(resolveTimer,fps60,ONE_SHOT));let durationRatio=Math.floor(Date.now()-start)/duration;const epsilon=fps60/duration/10;while(1-durationRatio>epsilon){let x=Math.floor(durationRatio*distanceX+startX);let y=Math.floor(durationRatio*distanceY+startY);performOnePointerMove(inputState,x,y,win); await new Promise(resolveTimer=>timer.initWithCallback(resolveTimer,fps60,ONE_SHOT));durationRatio=Math.floor(Date.now()-start)/duration;}})();
 intermediatePointerEvents.then(()=>{performOnePointerMove(inputState,targetX,targetY,win);resolve();}).catch(err=>{reject(err);});});}
function performOnePointerMove(inputState,targetX,targetY,win){if(targetX==inputState.x&&targetY==inputState.y){return;}
switch(inputState.subtype){case action.PointerType.Mouse:let mouseEvent=new action.Mouse("mousemove");mouseEvent.update(inputState); event.synthesizeMouseAtPoint(targetX,targetY,mouseEvent,win);break;case action.PointerType.Pen:case action.PointerType.Touch:throw new error.UnsupportedOperationError("Only 'mouse' pointer type is supported");default:throw new TypeError(`Unknown pointer type: ${inputState.subtype}`);}
inputState.x=targetX;inputState.y=targetY;}
function dispatchPause(a,tickDuration){let ms=typeof a.duration=="undefined"?tickDuration:a.duration;return Sleep(ms);}
function capitalize(str){assert.string(str);return str.charAt(0).toUpperCase()+str.slice(1);}
function inViewPort(x,y,win){assert.number(x,`Expected x to be finite number`);assert.number(y,`Expected y to be finite number`);return!(x<0||y<0||x>win.innerWidth||y>win.innerHeight);}
function getElementCenter(el,win){if(element.isElement(el)){if(action.specCompatPointerOrigin){return element.getInViewCentrePoint(el.getClientRects()[0],win);}
return element.coordinates(el);}
return{};}