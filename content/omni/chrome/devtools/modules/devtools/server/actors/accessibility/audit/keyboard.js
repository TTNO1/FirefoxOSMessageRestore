"use strict";const{Ci,Cu}=require("chrome");loader.lazyRequireGetter(this,"CssLogic","devtools/server/actors/inspector/css-logic",true);loader.lazyRequireGetter(this,"getCSSStyleRules","devtools/shared/inspector/css-logic",true);loader.lazyRequireGetter(this,"InspectorUtils","InspectorUtils");loader.lazyRequireGetter(this,"nodeConstants","devtools/shared/dom-node-constants");loader.lazyRequireGetter(this,["isDefunct","getAriaRoles"],"devtools/server/actors/utils/accessibility",true);const{accessibility:{AUDIT_TYPE:{KEYBOARD},ISSUE_TYPE:{[KEYBOARD]:{FOCUSABLE_NO_SEMANTICS,FOCUSABLE_POSITIVE_TABINDEX,INTERACTIVE_NO_ACTION,INTERACTIVE_NOT_FOCUSABLE,MOUSE_INTERACTIVE_ONLY,NO_FOCUS_VISIBLE,},},SCORES:{FAIL,WARNING},},}=require("devtools/shared/constants");const STYLE_RULE=1;const CLICK_ACTION="click";const FOCUS_PSEUDO_CLASS=":focus";const MOZ_FOCUSRING_PSEUDO_CLASS=":-moz-focusring";const KEYBOARD_FOCUSABLE_ROLES=new Set([Ci.nsIAccessibleRole.ROLE_BUTTONMENU,Ci.nsIAccessibleRole.ROLE_CHECKBUTTON,Ci.nsIAccessibleRole.ROLE_COMBOBOX,Ci.nsIAccessibleRole.ROLE_EDITCOMBOBOX,Ci.nsIAccessibleRole.ROLE_ENTRY,Ci.nsIAccessibleRole.ROLE_LINK,Ci.nsIAccessibleRole.ROLE_LISTBOX,Ci.nsIAccessibleRole.ROLE_PASSWORD_TEXT,Ci.nsIAccessibleRole.ROLE_PUSHBUTTON,Ci.nsIAccessibleRole.ROLE_RADIOBUTTON,Ci.nsIAccessibleRole.ROLE_SLIDER,Ci.nsIAccessibleRole.ROLE_SPINBUTTON,Ci.nsIAccessibleRole.ROLE_SUMMARY,Ci.nsIAccessibleRole.ROLE_SWITCH,Ci.nsIAccessibleRole.ROLE_TOGGLE_BUTTON,]);const INTERACTIVE_ROLES=new Set([...KEYBOARD_FOCUSABLE_ROLES,Ci.nsIAccessibleRole.ROLE_CHECK_MENU_ITEM,Ci.nsIAccessibleRole.ROLE_CHECK_RICH_OPTION,Ci.nsIAccessibleRole.ROLE_COMBOBOX_OPTION,Ci.nsIAccessibleRole.ROLE_MENUITEM,Ci.nsIAccessibleRole.ROLE_OPTION,Ci.nsIAccessibleRole.ROLE_OUTLINE,Ci.nsIAccessibleRole.ROLE_OUTLINEITEM,Ci.nsIAccessibleRole.ROLE_PAGETAB,Ci.nsIAccessibleRole.ROLE_PARENT_MENUITEM,Ci.nsIAccessibleRole.ROLE_RADIO_MENU_ITEM,Ci.nsIAccessibleRole.ROLE_RICH_OPTION,]);const INTERACTIVE_IF_FOCUSABLE_ROLES=new Set([Ci.nsIAccessibleRole.ROLE_ARTICLE,Ci.nsIAccessibleRole.ROLE_COLUMNHEADER,Ci.nsIAccessibleRole.ROLE_GRID_CELL,Ci.nsIAccessibleRole.ROLE_MENUBAR,Ci.nsIAccessibleRole.ROLE_MENUPOPUP,Ci.nsIAccessibleRole.ROLE_PAGETABLIST,Ci.nsIAccessibleRole.ROLE_ROWHEADER,Ci.nsIAccessibleRole.ROLE_SCROLLBAR,Ci.nsIAccessibleRole.ROLE_SEPARATOR,Ci.nsIAccessibleRole.ROLE_TOOLBAR,]);function isInvalidNode(node){return(!node||Cu.isDeadWrapper(node)||node.nodeType!==nodeConstants.ELEMENT_NODE||!node.ownerGlobal);}
function isKeyboardFocusable(accessible){const state={};accessible.getState(state,{});return(state.value&Ci.nsIAccessibleStates.STATE_FOCUSABLE&&

accessible.DOMNode.tabIndex>-1);}
function hasStylesForFocusRelatedPseudoClass(focusableNode,currentNode,pseudoClass){const defaultRules=getCSSStyleRules(currentNode);InspectorUtils.addPseudoClassLock(focusableNode,pseudoClass);
const tempRules=getCSSStyleRules(currentNode);const properties=new Set();for(const rule of tempRules){if(rule.type!==STYLE_RULE){continue;}
if(!defaultRules.includes(rule)){for(let index=0;index<rule.style.length;index++){properties.add(rule.style.item(index));}}}

if(properties.size===0){InspectorUtils.removePseudoClassLock(focusableNode,pseudoClass);return false;}
const tempStyle=CssLogic.getComputedStyle(currentNode);const focusStyle={};for(const name of properties.values()){focusStyle[name]=tempStyle.getPropertyValue(name);}
InspectorUtils.removePseudoClassLock(focusableNode,pseudoClass);
const defaultStyle=CssLogic.getComputedStyle(currentNode);for(const name of properties.values()){if(defaultStyle.getPropertyValue(name)!==focusStyle[name]){return true;}}
return false;}
function hasFocusStyling(focusableNode,currentNode){if(isInvalidNode(currentNode)){return false;}
const hasStylesForMozFocusring=hasStylesForFocusRelatedPseudoClass(focusableNode,currentNode,MOZ_FOCUSRING_PSEUDO_CLASS);if(hasStylesForMozFocusring){return true;}
const hasStylesForFocus=hasStylesForFocusRelatedPseudoClass(focusableNode,currentNode,FOCUS_PSEUDO_CLASS);if(hasStylesForFocus){return true;}

for(let child=currentNode.firstElementChild;child;child=currentNode.nextnextElementSibling){if(hasFocusStyling(focusableNode,child)){return true;}}
return false;}
function focusStyleRule(accessible){const{DOMNode}=accessible;if(isInvalidNode(DOMNode)){return null;}
if(!isKeyboardFocusable(accessible)){return null;}
if(hasFocusStyling(DOMNode,DOMNode)){return null;}

if(InspectorUtils.isElementThemed(DOMNode)){return null;}
return{score:WARNING,issue:NO_FOCUS_VISIBLE};}
function interactiveRule(accessible){if(!INTERACTIVE_ROLES.has(accessible.role)){return null;}
if(accessible.actionCount>0){return null;}
return{score:FAIL,issue:INTERACTIVE_NO_ACTION};}
function focusableRule(accessible){if(!KEYBOARD_FOCUSABLE_ROLES.has(accessible.role)){return null;}
const state={};accessible.getState(state,{});
if(state.value&Ci.nsIAccessibleStates.STATE_UNAVAILABLE){return null;}
if(isKeyboardFocusable(accessible)){return null;}
const ariaRoles=getAriaRoles(accessible);if(ariaRoles&&(ariaRoles.includes("combobox")||ariaRoles.includes("listbox"))){return null;}
return{score:FAIL,issue:INTERACTIVE_NOT_FOCUSABLE};}
function semanticsRule(accessible){if(INTERACTIVE_ROLES.has(accessible.role)||accessible.role===Ci.nsIAccessibleRole.ROLE_COMBOBOX_LIST){return null;}
if(isKeyboardFocusable(accessible)){if(INTERACTIVE_IF_FOCUSABLE_ROLES.has(accessible.role)){return null;}
if(accessible.role===Ci.nsIAccessibleRole.ROLE_TABLE){const ariaRoles=getAriaRoles(accessible);if(ariaRoles&&ariaRoles.includes("grid")){return null;}}
return{score:WARNING,issue:FOCUSABLE_NO_SEMANTICS};}
const state={};accessible.getState(state,{});if(accessible.role===Ci.nsIAccessibleRole.ROLE_TEXT_LEAF||accessible.actionCount===0||
(accessible.role===Ci.nsIAccessibleRole.ROLE_LABEL&&accessible.getRelationByType(Ci.nsIAccessibleRelation.RELATION_LABEL_FOR).targetsCount>0)||(accessible.role===Ci.nsIAccessibleRole.ROLE_GRAPHIC&&state.value&Ci.nsIAccessibleStates.STATE_LINKED)){return null;}
for(let i=0;i<accessible.actionCount;i++){if(accessible.getActionName(i)===CLICK_ACTION){return{score:FAIL,issue:MOUSE_INTERACTIVE_ONLY};}}
return null;}
function tabIndexRule(accessible){const{DOMNode}=accessible;if(isInvalidNode(DOMNode)){return null;}
if(!isKeyboardFocusable(accessible)){return null;}
if(DOMNode.tabIndex>0){return{score:WARNING,issue:FOCUSABLE_POSITIVE_TABINDEX};}
return null;}
function auditKeyboard(accessible){if(isDefunct(accessible)){return null;}
if(accessible.role===Ci.nsIAccessibleRole.ROLE_DOCUMENT||accessible.role===Ci.nsIAccessibleRole.ROLE_INTERNAL_FRAME){return null;}

let issue=interactiveRule(accessible);if(issue){return issue;}
issue=focusableRule(accessible);if(issue){return issue;}
issue=tabIndexRule(accessible);if(issue){return issue;}
issue=semanticsRule(accessible);if(issue){return issue;}
issue=focusStyleRule(accessible);if(issue){return issue;}
return issue;}
module.exports.auditKeyboard=auditKeyboard;