"use strict";const Services=require("Services");const InspectorUtils=require("InspectorUtils");loader.lazyRequireGetter(this,"CssLogic","devtools/server/actors/inspector/css-logic",true);const INACTIVE_CSS_ENABLED=Services.prefs.getBoolPref("devtools.inspector.inactive.css.enabled",false);const VISITED_MDN_LINK="https://developer.mozilla.org/docs/Web/CSS/:visited";const VISITED_INVALID_PROPERTIES=allCssPropertiesExcept(["all","color","background","background-color","border","border-color","border-bottom-color","border-left-color","border-right-color","border-top-color","border-block","border-block-color","border-block-start-color","border-block-end-color","border-inline","border-inline-color","border-inline-start-color","border-inline-end-color","column-rule","column-rule-color","outline","outline-color",]);class InactivePropertyHelper{get VALIDATORS(){return[{invalidProperties:["flex-direction","flex-flow","flex-wrap"],when:()=>!this.flexContainer,fixId:"inactive-css-not-flex-container-fix",msgId:"inactive-css-not-flex-container",numFixProps:2,},{invalidProperties:["flex","flex-basis","flex-grow","flex-shrink","order",],when:()=>!this.flexItem,fixId:"inactive-css-not-flex-item-fix-2",msgId:"inactive-css-not-flex-item",numFixProps:2,},{invalidProperties:["grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-template","justify-items",],when:()=>!this.gridContainer,fixId:"inactive-css-not-grid-container-fix",msgId:"inactive-css-not-grid-container",numFixProps:2,},{invalidProperties:["grid-area","grid-column","grid-column-end","grid-column-start","grid-row","grid-row-end","grid-row-start","justify-self",],when:()=>!this.gridItem&&!this.isAbsPosGridElement(),fixId:"inactive-css-not-grid-item-fix-2",msgId:"inactive-css-not-grid-item",numFixProps:2,},{invalidProperties:["align-self","place-self"],when:()=>!this.gridItem&&!this.flexItem&&!this.isAbsPosGridElement(),fixId:"inactive-css-not-grid-or-flex-item-fix-2",msgId:"inactive-css-not-grid-or-flex-item",numFixProps:4,},{invalidProperties:["align-items","justify-content","place-content","place-items","row-gap","grid-gap","grid-row-gap",],when:()=>!this.gridContainer&&!this.flexContainer,fixId:"inactive-css-not-grid-or-flex-container-fix",msgId:"inactive-css-not-grid-or-flex-container",numFixProps:2,},
{invalidProperties:["align-content"],when:()=>!this.style["align-content"].includes("baseline")&&!this.gridContainer&&!this.flexContainer,fixId:"inactive-css-not-grid-or-flex-container-fix",msgId:"inactive-css-not-grid-or-flex-container",numFixProps:2,},{invalidProperties:["column-gap","gap","grid-column-gap",],when:()=>!this.gridContainer&&!this.flexContainer&&!this.multiColContainer,fixId:"inactive-css-not-grid-or-flex-container-or-multicol-container-fix",msgId:"inactive-css-not-grid-or-flex-container-or-multicol-container",numFixProps:3,},{invalidProperties:["vertical-align"],when:()=>{const{selectorText}=this.cssRule;const isFirstLetter=selectorText&&selectorText.includes("::first-letter");const isFirstLine=selectorText&&selectorText.includes("::first-line");return!this.isInlineLevel()&&!isFirstLetter&&!isFirstLine;},fixId:"inactive-css-not-inline-or-tablecell-fix",msgId:"inactive-css-not-inline-or-tablecell",numFixProps:2,},{invalidProperties:["max-width","min-width","width"],when:()=>this.nonReplacedInlineBox||this.horizontalTableTrack||this.horizontalTableTrackGroup,fixId:"inactive-css-non-replaced-inline-or-table-row-or-row-group-fix",msgId:"inactive-css-property-because-of-display",numFixProps:2,},{invalidProperties:["max-height","min-height","height"],when:()=>this.nonReplacedInlineBox||this.verticalTableTrack||this.verticalTableTrackGroup,fixId:"inactive-css-non-replaced-inline-or-table-column-or-column-group-fix",msgId:"inactive-css-property-because-of-display",numFixProps:1,},{invalidProperties:["display"],when:()=>this.isFloated&&this.checkResolvedStyle("display",["inline","inline-block","inline-table","inline-flex","inline-grid","table-cell","table-row","table-row-group","table-header-group","table-footer-group","table-column","table-column-group","table-caption",]),fixId:"inactive-css-not-display-block-on-floated-fix",msgId:"inactive-css-not-display-block-on-floated",numFixProps:2,},{invalidProperties:VISITED_INVALID_PROPERTIES,when:()=>this.isVisitedRule(),fixId:"learn-more",msgId:"inactive-css-property-is-impossible-to-override-in-visited",numFixProps:1,learnMoreURL:VISITED_MDN_LINK,},{invalidProperties:["top","right","bottom","left"],when:()=>!this.isPositioned,fixId:"inactive-css-position-property-on-unpositioned-box-fix",msgId:"inactive-css-position-property-on-unpositioned-box",numFixProps:1,},{invalidProperties:["z-index"],when:()=>!this.isPositioned&&!this.gridItem&&!this.flexItem,fixId:"inactive-css-position-property-on-unpositioned-box-fix",msgId:"inactive-css-position-property-on-unpositioned-box",numFixProps:1,},





{invalidProperties:["text-overflow"],when:()=>!this.checkComputedStyle("overflow",["hidden"]),fixId:"inactive-text-overflow-when-no-overflow-fix",msgId:"inactive-text-overflow-when-no-overflow",numFixProps:1,},];}
get invalidProperties(){if(!this._invalidProperties){const allProps=this.VALIDATORS.map(v=>v.invalidProperties).flat();this._invalidProperties=new Set(allProps);}
return this._invalidProperties;}
isPropertyUsed(el,elStyle,cssRule,property){
 if(!INACTIVE_CSS_ENABLED||!this.invalidProperties.has(property)){return{used:true};}
let fixId="";let msgId="";let numFixProps=0;let learnMoreURL=null;let used=true;this.VALIDATORS.some(validator=>{let isRuleConcerned=false;if(validator.invalidProperties){isRuleConcerned=validator.invalidProperties.includes(property);}
if(!isRuleConcerned){return false;}
this.select(el,elStyle,cssRule,property);
if(validator.when()){fixId=validator.fixId;msgId=validator.msgId;numFixProps=validator.numFixProps;learnMoreURL=validator.learnMoreURL;used=false;return true;}
return false;});this.unselect();
let display;try{display=elStyle?elStyle.display:null;}catch(e){}
return{display,fixId,msgId,numFixProps,property,learnMoreURL,used,};}
select(node,style,cssRule,property){this._node=node;this._cssRule=cssRule;this._property=property;this._style=style;}
unselect(){this._node=null;this._cssRule=null;this._property=null;this._style=null;}
get node(){return this._node;}
get style(){return this._style;}
get cssRule(){return this._cssRule;}
checkComputedStyle(propName,values){if(!this.style){return false;}
return values.some(value=>this.style[propName]===value);}
checkResolvedStyle(propName,values){if(!(this.cssRule&&this.cssRule.style)){return false;}
const{style}=this.cssRule;return values.some(value=>style[propName]===value);}
isInlineLevel(){return this.checkComputedStyle("display",["inline","inline-block","inline-table","inline-flex","inline-grid","table-cell","table-row","table-row-group","table-header-group","table-footer-group",]);}
get flexContainer(){return this.checkComputedStyle("display",["flex","inline-flex"]);}
get flexItem(){return this.isFlexItem(this.node);}
get gridContainer(){return this.checkComputedStyle("display",["grid","inline-grid"]);}
get gridItem(){return this.isGridItem(this.node);}
get multiColContainer(){const autoColumnWidth=this.checkComputedStyle("column-width",["auto"]);const autoColumnCount=this.checkComputedStyle("column-count",["auto"]);return!autoColumnWidth||!autoColumnCount;}
get tableRow(){return this.style&&this.style.display==="table-row";}
get tableColumn(){return this.style&&this.style.display==="table-column";}
get horizontalTableTrack(){if(!this.tableRow&&!this.tableColumn){return false;}
const wm=this.getTableTrackParentWritingMode();const isVertical=wm.includes("vertical")||wm.includes("sideways");return isVertical?this.tableColumn:this.tableRow;}
get verticalTableTrack(){if(!this.tableRow&&!this.tableColumn){return false;}
const wm=this.getTableTrackParentWritingMode();const isVertical=wm.includes("vertical")||wm.includes("sideways");return isVertical?this.tableRow:this.tableColumn;}
get rowGroup(){return this.isRowGroup(this.node);}
get columnGroup(){return this.isColumnGroup(this.node);}
get horizontalTableTrackGroup(){if(!this.rowGroup&&!this.columnGroup){return false;}
const wm=this.getTableTrackParentWritingMode(true);const isVertical=wm.includes("vertical")||wm.includes("sideways");const isHorizontalRowGroup=this.rowGroup&&!isVertical;const isHorizontalColumnGroup=this.columnGroup&&isVertical;return isHorizontalRowGroup||isHorizontalColumnGroup;}
get verticalTableTrackGroup(){if(!this.rowGroup&&!this.columnGroup){return false;}
const wm=this.getTableTrackParentWritingMode(true);const isVertical=wm.includes("vertical")||wm.includes("sideways");const isVerticalRowGroup=this.rowGroup&&isVertical;const isVerticalColumnGroup=this.columnGroup&&!isVertical;return isVerticalRowGroup||isVerticalColumnGroup;}
get hasCssLayout(){return!this.isSvg&&!this.isMathMl;}
get nonReplacedInlineBox(){return(this.hasCssLayout&&this.nonReplaced&&this.style&&this.style.display==="inline");}
get nonReplaced(){return!this.replaced;}
get isAbsolutelyPositioned(){return this.checkComputedStyle("position",["absolute","fixed"]);}
get isPositioned(){return this.checkComputedStyle("position",["relative","absolute","fixed","sticky",]);}
get isFloated(){return this.style&&this.style.cssFloat!=="none";}
get replaced(){if(this.nodeNameOneOf(["audio","br","button","canvas","embed","hr","iframe",


"input","math","object","picture",

"select","svg","textarea","video",])){return true;}
if(this.nodeName==="img"&&this.node.complete){return true;}
return false;}
get nodeName(){return this.node.nodeName?this.node.nodeName.toLowerCase():null;}
get isMathMl(){return this.node.namespaceURI==="http://www.w3.org/1998/Math/MathML";}
get isSvg(){return this.node.namespaceURI==="http://www.w3.org/2000/svg";}
nodeNameOneOf(values){return values.includes(this.nodeName);}
isAbsPosGridElement(){if(!this.isAbsolutelyPositioned){return false;}
const containingBlock=this.getContainingBlock();return containingBlock!==null&&this.isGridContainer(containingBlock);}
isFlexItem(node){return!!node.parentFlexElement;}
isFlexContainer(node){return!!node.getAsFlexContainer();}
isGridContainer(node){return node.hasGridFragments();}
isGridItem(node){return!!this.getParentGridElement(this.node);}
isVisitedRule(){if(!CssLogic.hasVisitedState(this.node)){return false;}
const selectors=CssLogic.getSelectors(this.cssRule);if(!selectors.some(s=>s.endsWith(":visited"))){return false;}
const{bindingElement,pseudo}=CssLogic.getBindingElementAndPseudo(this.node);for(let i=0;i<selectors.length;i++){if(!selectors[i].endsWith(":visited")&&InspectorUtils.selectorMatchesElement(bindingElement,this.cssRule,i,pseudo,true)){return false;}}
return true;}
getContainingBlock(){return this.node?InspectorUtils.containingBlockOf(this.node):null;}
getParentGridElement(node){if(node.flattenedTreeParentNode===node.ownerDocument){return null;}
if(node.nodeType===node.ELEMENT_NODE){const display=this.style?this.style.display:null;if(!display||display==="none"||display==="contents"){return null;}
if(this.isAbsolutelyPositioned){return null;}}else if(node.nodeType!==node.TEXT_NODE){return null;}
for(let p=node.flattenedTreeParentNode;p;p=p.flattenedTreeParentNode){if(this.isGridContainer(p)){return p;}
const style=computedStyle(p,node.ownerGlobal);const display=style.display;if(display!=="contents"){return null;}
}
return null;}
isRowGroup(node){const style=node===this.node?this.style:computedStyle(node);return(style&&(style.display==="table-row-group"||style.display==="table-header-group"||style.display==="table-footer-group"));}
isColumnGroup(node){const style=node===this.node?this.style:computedStyle(node);return style&&style.display==="table-column-group";}
getTableTrackParentWritingMode(isGroup){let current=this.node.parentNode;while(computedStyle(current).display==="contents"){current=current.parentNode;}
if(!isGroup&&(this.isRowGroup(current)||this.isColumnGroup(current))){current=current.parentNode;}
while(computedStyle(current).display==="contents"){current=current.parentNode;}
return computedStyle(current).writingMode;}}
exports.inactivePropertyHelper=new InactivePropertyHelper();function allCssPropertiesExcept(propertiesToIgnore){const properties=new Set(InspectorUtils.getCSSPropertyNames({includeAliases:true}));for(const name of propertiesToIgnore){properties.delete(name);}
return[...properties];}
function computedStyle(node,window=node.ownerGlobal){return window.getComputedStyle(node);}