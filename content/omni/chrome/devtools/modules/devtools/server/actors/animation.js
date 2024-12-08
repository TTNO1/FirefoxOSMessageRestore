"use strict";const{Cu}=require("chrome");const protocol=require("devtools/shared/protocol");const{Actor}=protocol;const{animationPlayerSpec,animationsSpec,}=require("devtools/shared/specs/animation");const{ANIMATION_TYPE_FOR_LONGHANDS,}=require("devtools/server/actors/animation-type-longhand");const ANIMATION_TYPES={CSS_ANIMATION:"cssanimation",CSS_TRANSITION:"csstransition",SCRIPT_ANIMATION:"scriptanimation",UNKNOWN:"unknown",};exports.ANIMATION_TYPES=ANIMATION_TYPES;function getAnimationTypeForLonghand(property){for(const[type,props]of ANIMATION_TYPE_FOR_LONGHANDS){if(props.has(property)){return type;}}
throw new Error("Unknown longhand property name");}
exports.getAnimationTypeForLonghand=getAnimationTypeForLonghand;var AnimationPlayerActor=protocol.ActorClassWithSpec(animationPlayerSpec,{initialize:function(animationsActor,player,createdTime){Actor.prototype.initialize.call(this,animationsActor.conn);this.onAnimationMutation=this.onAnimationMutation.bind(this);this.walker=animationsActor.walker;this.player=player;



this.observer=new this.window.MutationObserver(this.onAnimationMutation);if(this.isPseudoElement){this.observer.observe(this.node.parentElement,{animations:true,subtree:true,});}else{this.observer.observe(this.node,{animations:true});}
this.createdTime=createdTime;this.currentTimeAtCreated=player.currentTime;},destroy:function(){
if(this.observer&&!Cu.isDeadWrapper(this.observer)){this.observer.disconnect();}
this.player=this.observer=this.walker=null;Actor.prototype.destroy.call(this);},get isPseudoElement(){return!!this.player.effect.pseudoElement;},get pseudoElemenName(){if(!this.isPseudoElement){return null;}
return`_moz_generated_content_${this.player.effect.pseudoElement.replace(
      /^::/,
      ""
    )}`;},get node(){if(!this.isPseudoElement){return this.player.effect.target;}
const pseudoElementName=this.pseudoElemenName;const originatingElem=this.player.effect.target;const treeWalker=this.walker.getDocumentWalker(originatingElem);
for(let next=treeWalker.firstChild();next;next=treeWalker.nextSibling()){if(next.nodeName===pseudoElementName){return next;}}
console.warn(`Pseudo element ${this.player.effect.pseudoElement} is not found`);return originatingElem;},get document(){return this.node.ownerDocument;},get window(){return this.document.defaultView;},release:function(){},form:function(detail){const data=this.getCurrentState();data.actor=this.actorID;
if(this.walker&&this.walker.hasNode(this.node)){data.animationTargetNodeActorID=this.walker.getNode(this.node).actorID;}
return data;},isCssAnimation:function(player=this.player){return player instanceof this.window.CSSAnimation;},isCssTransition:function(player=this.player){return player instanceof this.window.CSSTransition;},isScriptAnimation:function(player=this.player){return(player instanceof this.window.Animation&&!(player instanceof this.window.CSSAnimation||player instanceof this.window.CSSTransition));},getType:function(){if(this.isCssAnimation()){return ANIMATION_TYPES.CSS_ANIMATION;}else if(this.isCssTransition()){return ANIMATION_TYPES.CSS_TRANSITION;}else if(this.isScriptAnimation()){return ANIMATION_TYPES.SCRIPT_ANIMATION;}
return ANIMATION_TYPES.UNKNOWN;},getName:function(){if(this.player.id){return this.player.id;}else if(this.isCssAnimation()){return this.player.animationName;}else if(this.isCssTransition()){return this.player.transitionProperty;}
return"";},getDuration:function(){return this.player.effect.getComputedTiming().duration;},getDelay:function(){return this.player.effect.getComputedTiming().delay;},getEndDelay:function(){return this.player.effect.getComputedTiming().endDelay;},getIterationCount:function(){const iterations=this.player.effect.getComputedTiming().iterations;return iterations===Infinity?null:iterations;},getIterationStart:function(){return this.player.effect.getComputedTiming().iterationStart;},getEasing:function(){return this.player.effect.getComputedTiming().easing;},getFill:function(){return this.player.effect.getComputedTiming().fill;},getDirection:function(){return this.player.effect.getComputedTiming().direction;},getAnimationTimingFunction:function(){if(!this.isCssAnimation()){return null;}
let pseudo=null;let target=this.player.effect.target;if(target.type){pseudo=target.type;target=target.element;}
return this.window.getComputedStyle(target,pseudo).animationTimingFunction;},getPropertiesCompositorStatus:function(){const properties=this.player.effect.getProperties();return properties.map(prop=>{return{property:prop.property,runningOnCompositor:prop.runningOnCompositor,warning:prop.warning,};});},getState:function(){

return{type:this.getType(),startTime:this.player.startTime,currentTime:this.player.currentTime,playState:this.player.playState,playbackRate:this.player.playbackRate,name:this.getName(),duration:this.getDuration(),delay:this.getDelay(),endDelay:this.getEndDelay(),iterationCount:this.getIterationCount(),iterationStart:this.getIterationStart(),fill:this.getFill(),easing:this.getEasing(),direction:this.getDirection(),animationTimingFunction:this.getAnimationTimingFunction(),
isRunningOnCompositor:this.getPropertiesCompositorStatus().some(propState=>propState.runningOnCompositor),propertyState:this.getPropertiesCompositorStatus(),

documentCurrentTime:this.node.ownerDocument.timeline.currentTime,createdTime:this.createdTime,currentTimeAtCreated:this.currentTimeAtCreated,};},getCurrentState:function(){const newState=this.getState();
let sentState={};if(this.currentState){for(const key in newState){if(typeof this.currentState[key]==="undefined"||this.currentState[key]!==newState[key]){sentState[key]=newState[key];}}}else{sentState=newState;}
this.currentState=newState;return sentState;},onAnimationMutation:function(mutations){const isCurrentAnimation=animation=>animation===this.player;const hasCurrentAnimation=animations=>animations.some(isCurrentAnimation);let hasChanged=false;for(const{removedAnimations,changedAnimations}of mutations){if(hasCurrentAnimation(removedAnimations)){

this.currentState=null;}
if(hasCurrentAnimation(changedAnimations)){const newState=this.getState();const oldState=this.currentState;hasChanged=newState.delay!==oldState.delay||newState.iterationCount!==oldState.iterationCount||newState.iterationStart!==oldState.iterationStart||newState.duration!==oldState.duration||newState.endDelay!==oldState.endDelay||newState.direction!==oldState.direction||newState.easing!==oldState.easing||newState.fill!==oldState.fill||newState.animationTimingFunction!==oldState.animationTimingFunction||newState.playbackRate!==oldState.playbackRate;break;}}
if(hasChanged){this.emit("changed",this.getCurrentState());}},getProperties:function(){const properties=this.player.effect.getProperties().map(property=>{return{name:property.property,values:property.values};});const DOMWindowUtils=this.window.windowUtils;for(const property of properties){let underlyingValue=null;[0,property.values.length-1].forEach(index=>{const values=property.values[index];if(values.value!==undefined){return;}
if(!underlyingValue){let pseudo=null;let target=this.player.effect.target;if(target.type){pseudo=target.type;target=target.element;}
const value=DOMWindowUtils.getUnanimatedComputedStyle(target,pseudo,property.name,DOMWindowUtils.FLUSH_NONE);const animationType=getAnimationTypeForLonghand(property.name);underlyingValue=animationType==="float"?parseFloat(value,10):value;}
values.value=underlyingValue;});}
for(const property of properties){const propertyName=property.name;const maxObject={distance:-1};for(let i=0;i<property.values.length-1;i++){const value1=property.values[i].value;for(let j=i+1;j<property.values.length;j++){const value2=property.values[j].value;const distance=this.getDistance(this.node,propertyName,value1,value2,DOMWindowUtils);if(maxObject.distance>=distance){continue;}
maxObject.distance=distance;maxObject.value1=value1;maxObject.value2=value2;}}
if(maxObject.distance===0){property.values.reduce((previous,current)=>{current.distance=current.value===previous.value?previous.distance:current.offset;return current;},property.values[0]);continue;}
const baseValue=maxObject.value1<maxObject.value2?maxObject.value1:maxObject.value2;for(const values of property.values){const value=values.value;const distance=this.getDistance(this.node,propertyName,baseValue,value,DOMWindowUtils);values.distance=distance/maxObject.distance;}}
return properties;},getAnimationTypes:function(propertyNames){const animationTypes={};for(const propertyName of propertyNames){animationTypes[propertyName]=getAnimationTypeForLonghand(propertyName);}
return animationTypes;},getDistance:function(target,propertyName,value1,value2,DOMWindowUtils){if(value1===value2){return 0;}
try{const distance=DOMWindowUtils.computeAnimationDistance(target,propertyName,value1,value2);return distance;}catch(e){return 0;}},});exports.AnimationPlayerActor=AnimationPlayerActor;exports.AnimationsActor=protocol.ActorClassWithSpec(animationsSpec,{initialize:function(conn,targetActor){Actor.prototype.initialize.call(this,conn);this.targetActor=targetActor;this.onWillNavigate=this.onWillNavigate.bind(this);this.onNavigate=this.onNavigate.bind(this);this.onAnimationMutation=this.onAnimationMutation.bind(this);this.allAnimationsPaused=false;this.targetActor.on("will-navigate",this.onWillNavigate);this.targetActor.on("navigate",this.onNavigate);},destroy:function(){Actor.prototype.destroy.call(this);this.targetActor.off("will-navigate",this.onWillNavigate);this.targetActor.off("navigate",this.onNavigate);this.stopAnimationPlayerUpdates();this.targetActor=this.observer=this.actors=this.walker=null;},setWalkerActor:function(walker){this.walker=walker;},getAnimationPlayersForNode:function(nodeActor){const animations=nodeActor.rawNode.getAnimations({subtree:true}); if(this.actors){for(const actor of this.actors){actor.destroy();}}
this.actors=[];for(const animation of animations){const createdTime=this.getCreatedTime(animation);const actor=AnimationPlayerActor(this,animation,createdTime);this.actors.push(actor);}



this.stopAnimationPlayerUpdates(); const win=nodeActor.rawNode.ownerDocument.defaultView;this.observer=new win.MutationObserver(this.onAnimationMutation);this.observer.observe(nodeActor.rawNode,{animations:true,subtree:true,});return this.actors;},onAnimationMutation:function(mutations){const eventData=[];const readyPromises=[];for(const{addedAnimations,removedAnimations}of mutations){for(const player of removedAnimations){



if(player.playState!=="idle"){continue;}
const index=this.actors.findIndex(a=>a.player===player);if(index!==-1){eventData.push({type:"removed",player:this.actors[index],});this.actors.splice(index,1);}}
for(const player of addedAnimations){
if(this.actors.find(a=>a.player===player)){continue;}


const index=this.actors.findIndex(a=>{const isSameType=a.player.constructor===player.constructor;const isSameName=(a.isCssAnimation()&&a.player.animationName===player.animationName)||(a.isCssTransition()&&a.player.transitionProperty===player.transitionProperty);const isSameNode=a.player.effect.target===player.effect.target;return isSameType&&isSameNode&&isSameName;});if(index!==-1){eventData.push({type:"removed",player:this.actors[index],});this.actors.splice(index,1);}
const createdTime=this.getCreatedTime(player);const actor=AnimationPlayerActor(this,player,createdTime);this.actors.push(actor);eventData.push({type:"added",player:actor,});readyPromises.push(player.ready);}}
if(eventData.length){
Promise.all(readyPromises).then(()=>{this.emit("mutations",eventData);});}},stopAnimationPlayerUpdates:function(){if(this.observer&&!Cu.isDeadWrapper(this.observer)){this.observer.disconnect();}},onWillNavigate:function({isTopLevel}){if(isTopLevel){this.stopAnimationPlayerUpdates();}},onNavigate:function({isTopLevel}){if(isTopLevel){this.allAnimationsPaused=false;}},pauseSome:function(actors){for(const{player}of actors){this.pauseSync(player);}
return this.waitForNextFrame(actors);},playSome:function(actors){for(const{player}of actors){this.playSync(player);}
return this.waitForNextFrame(actors);},setCurrentTimes:function(players,time,shouldPause){for(const actor of players){const player=actor.player;if(shouldPause){player.startTime=null;}
const currentTime=player.playbackRate>0?time-actor.createdTime:actor.createdTime-time;player.currentTime=currentTime*Math.abs(player.playbackRate);}
return this.waitForNextFrame(players);},setPlaybackRates:function(players,rate){return Promise.all(players.map(({player})=>{player.updatePlaybackRate(rate);return player.ready;}));},pauseSync(player){player.startTime=null;},playSync(player){if(!player.playbackRate){return;}
const currentTime=player.currentTime||0;player.startTime=player.timeline.currentTime-currentTime/player.playbackRate;},getCreatedTime(animation){return(animation.startTime||animation.timeline.currentTime-
animation.currentTime/animation.playbackRate);},waitForNextFrame(actors){const promises=actors.map(actor=>{const doc=actor.document;const win=actor.window;const timeAtCurrent=doc.timeline.currentTime;return new Promise(resolve=>{win.requestAnimationFrame(()=>{if(timeAtCurrent===doc.timeline.currentTime){win.requestAnimationFrame(resolve);}else{resolve();}});});});return Promise.all(promises);},});