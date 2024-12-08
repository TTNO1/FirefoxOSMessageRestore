"use strict";const{Cu}=require("chrome");const Services=require("Services");const{Actor,ActorClassWithSpec}=require("devtools/shared/protocol");const{flexboxSpec,flexItemSpec,gridSpec,layoutSpec,}=require("devtools/shared/specs/layout");const{getStringifiableFragments,}=require("devtools/server/actors/utils/css-grid-utils");loader.lazyRequireGetter(this,"CssLogic","devtools/server/actors/inspector/css-logic",true);loader.lazyRequireGetter(this,"findGridParentContainerForNode","devtools/server/actors/inspector/utils",true);loader.lazyRequireGetter(this,"getCSSStyleRules","devtools/shared/inspector/css-logic",true);loader.lazyRequireGetter(this,"isCssPropertyKnown","devtools/server/actors/css-properties",true);loader.lazyRequireGetter(this,"parseDeclarations","devtools/shared/css/parsing-utils",true);loader.lazyRequireGetter(this,"nodeConstants","devtools/shared/dom-node-constants");const SUBGRID_ENABLED=Services.prefs.getBoolPref("layout.css.grid-template-subgrid-value.enabled");const FlexboxActor=ActorClassWithSpec(flexboxSpec,{initialize(layoutActor,containerEl){Actor.prototype.initialize.call(this,layoutActor.conn);this.containerEl=containerEl;this.walker=layoutActor.walker;},destroy(){Actor.prototype.destroy.call(this);this.containerEl=null;this.walker=null;},form(){const styles=CssLogic.getComputedStyle(this.containerEl);const form={actor:this.actorID,properties:{"align-content":styles.alignContent,"align-items":styles.alignItems,"flex-direction":styles.flexDirection,"flex-wrap":styles.flexWrap,"justify-content":styles.justifyContent,},};

if(this.walker.hasNode(this.containerEl)){form.containerNodeActorID=this.walker.getNode(this.containerEl).actorID;}
return form;},getFlexItems(){if(isNodeDead(this.containerEl)){return[];}
const flex=this.containerEl.getAsFlexContainer();if(!flex){return[];}
const flexItemActors=[];const{crossAxisDirection,mainAxisDirection}=flex;for(const line of flex.getLines()){for(const item of line.getItems()){flexItemActors.push(new FlexItemActor(this,item.node,{crossAxisDirection,mainAxisDirection,crossMaxSize:item.crossMaxSize,crossMinSize:item.crossMinSize,mainBaseSize:item.mainBaseSize,mainDeltaSize:item.mainDeltaSize,mainMaxSize:item.mainMaxSize,mainMinSize:item.mainMinSize,lineGrowthState:line.growthState,clampState:item.clampState,}));}}
return flexItemActors;},});const FlexItemActor=ActorClassWithSpec(flexItemSpec,{initialize(flexboxActor,element,flexItemSizing){Actor.prototype.initialize.call(this,flexboxActor.conn);this.containerEl=flexboxActor.containerEl;this.element=element;this.flexItemSizing=flexItemSizing;this.walker=flexboxActor.walker;},destroy(){Actor.prototype.destroy.call(this);this.containerEl=null;this.element=null;this.flexItemSizing=null;this.walker=null;},form(){const{mainAxisDirection}=this.flexItemSizing;const dimension=mainAxisDirection.startsWith("horizontal")?"width":"height";const properties={"flex-basis":"","flex-grow":"","flex-shrink":"",[`min-${dimension}`]:"",[`max-${dimension}`]:"",[dimension]:"",};const isElementNode=this.element.nodeType===this.element.ELEMENT_NODE;if(isElementNode){for(const name in properties){const values=[];const cssRules=getCSSStyleRules(this.element);for(const rule of cssRules){

const declarations=parseDeclarations(isCssPropertyKnown,rule.style.cssText);for(const declaration of declarations){if(declaration.name===name&&declaration.value!=="auto"){values.push({value:declaration.value,priority:declaration.priority,});}}}
 
if(this.element.style&&this.element.style[name]&&this.element.style[name]!=="auto"){values.push({value:this.element.style.getPropertyValue(name),priority:this.element.style.getPropertyPriority(name),});}


let rulePropertyValue="";if(values.length){const lastValueIndex=values.length-1;rulePropertyValue=values[lastValueIndex].value;for(const{priority,value}of values){if(priority==="important"){rulePropertyValue=`${value} !important`;}}}
properties[name]=rulePropertyValue;}}
const{flexGrow,flexShrink}=isElementNode?CssLogic.getComputedStyle(this.element):{flexGrow:null,flexShrink:null};const computedStyle={flexGrow,flexShrink};const form={actor:this.actorID,flexItemSizing:this.flexItemSizing,properties,computedStyle,};

if(this.walker.hasNode(this.element)){form.nodeActorID=this.walker.getNode(this.element).actorID;}
return form;},});const GridActor=ActorClassWithSpec(gridSpec,{initialize(layoutActor,containerEl){Actor.prototype.initialize.call(this,layoutActor.conn);this.containerEl=containerEl;this.walker=layoutActor.walker;},destroy(){Actor.prototype.destroy.call(this);this.containerEl=null;this.gridFragments=null;this.walker=null;},form(){
const gridFragments=this.containerEl.getGridFragments();this.gridFragments=getStringifiableFragments(gridFragments);const{direction,gridTemplateColumns,gridTemplateRows,writingMode,}=CssLogic.getComputedStyle(this.containerEl);const form={actor:this.actorID,direction,gridFragments:this.gridFragments,writingMode,};

if(this.walker.hasNode(this.containerEl)){form.containerNodeActorID=this.walker.getNode(this.containerEl).actorID;}
if(SUBGRID_ENABLED){form.isSubgrid=gridTemplateRows.startsWith("subgrid")||gridTemplateColumns.startsWith("subgrid");}
return form;},});const LayoutActor=ActorClassWithSpec(layoutSpec,{initialize(conn,targetActor,walker){Actor.prototype.initialize.call(this,conn);this.targetActor=targetActor;this.walker=walker;},destroy(){Actor.prototype.destroy.call(this);this.targetActor=null;this.walker=null;},getCurrentDisplay(node,type,onlyLookAtContainer){if(isNodeDead(node)){return null;}
if(node.rawNode){node=node.rawNode;}
const flexType=type==="flex";const gridType=type==="grid";const displayType=this.walker.getNode(node).displayType;if(node.nodeType===node.ELEMENT_NODE){if(!displayType){return null;}
if(flexType&&displayType.includes("flex")){if(!onlyLookAtContainer){return new FlexboxActor(this,node);}
const container=node.parentFlexElement;if(container){return new FlexboxActor(this,container);}
return null;}else if(gridType&&displayType.includes("grid")){return new GridActor(this,node);}}



const parentFlexElement=node.parentFlexElement;if(parentFlexElement&&flexType){return new FlexboxActor(this,parentFlexElement);}
const container=findGridParentContainerForNode(node);if(container&&gridType){return new GridActor(this,container);}
return null;},getCurrentGrid(node){return this.getCurrentDisplay(node,"grid");},getCurrentFlexbox(node,onlyLookAtParents){return this.getCurrentDisplay(node,"flex",onlyLookAtParents);},getGrids(node){if(isNodeDead(node)){return[];}
if(node.rawNode){node=node.rawNode;}
if(node.nodeType===nodeConstants.DOCUMENT_NODE){node=node.documentElement;}
const gridElements=node.getElementsWithGrid();let gridActors=gridElements.map(n=>new GridActor(this,n));const frames=node.querySelectorAll("iframe, frame");for(const frame of frames){gridActors=gridActors.concat(this.getGrids(frame.contentDocument));}
return gridActors;},});function isNodeDead(node){return!node||(node.rawNode&&Cu.isDeadWrapper(node.rawNode));}
exports.FlexboxActor=FlexboxActor;exports.FlexItemActor=FlexItemActor;exports.GridActor=GridActor;exports.LayoutActor=LayoutActor;