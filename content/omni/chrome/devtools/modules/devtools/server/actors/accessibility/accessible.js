"use strict";const{Ci,Cu}=require("chrome");const{Actor,ActorClassWithSpec}=require("devtools/shared/protocol");const{accessibleSpec}=require("devtools/shared/specs/accessibility");const{accessibility:{AUDIT_TYPE},}=require("devtools/shared/constants");loader.lazyRequireGetter(this,"getContrastRatioFor","devtools/server/actors/accessibility/audit/contrast",true);loader.lazyRequireGetter(this,"auditKeyboard","devtools/server/actors/accessibility/audit/keyboard",true);loader.lazyRequireGetter(this,"auditTextLabel","devtools/server/actors/accessibility/audit/text-label",true);loader.lazyRequireGetter(this,"isDefunct","devtools/server/actors/utils/accessibility",true);loader.lazyRequireGetter(this,"findCssSelector","devtools/shared/inspector/css-logic",true);loader.lazyRequireGetter(this,"events","devtools/shared/event-emitter");loader.lazyRequireGetter(this,"getBounds","devtools/server/actors/highlighters/utils/accessibility",true);loader.lazyRequireGetter(this,"isRemoteFrame","devtools/shared/layout/utils",true);loader.lazyRequireGetter(this,"ContentDOMReference","resource://gre/modules/ContentDOMReference.jsm",true);const RELATIONS_TO_IGNORE=new Set([Ci.nsIAccessibleRelation.RELATION_CONTAINING_APPLICATION,Ci.nsIAccessibleRelation.RELATION_CONTAINING_TAB_PANE,Ci.nsIAccessibleRelation.RELATION_CONTAINING_WINDOW,Ci.nsIAccessibleRelation.RELATION_PARENT_WINDOW_OF,Ci.nsIAccessibleRelation.RELATION_SUBWINDOW_OF,]);const nsIAccessibleRole=Ci.nsIAccessibleRole;const TEXT_ROLES=new Set([nsIAccessibleRole.ROLE_TEXT_LEAF,nsIAccessibleRole.ROLE_STATICTEXT,]);const STATE_DEFUNCT=Ci.nsIAccessibleStates.EXT_STATE_DEFUNCT;const CSS_TEXT_SELECTOR="#text";function getNodeDescription(node){if(!node||Cu.isDeadWrapper(node)){return{nodeType:undefined,nodeCssSelector:""};}
const{nodeType}=node;return{nodeType,
nodeCssSelector:nodeType===Node.TEXT_NODE?`${findCssSelector(node.parentNode)}${CSS_TEXT_SELECTOR}`:findCssSelector(node),};}
function getSnapshot(acc,a11yService){if(isDefunct(acc)){return{states:[a11yService.getStringStates(0,STATE_DEFUNCT)],};}
const actions=[];for(let i=0;i<acc.actionCount;i++){actions.push(acc.getActionDescription(i));}
const attributes={};if(acc.attributes){for(const{key,value}of acc.attributes.enumerate()){attributes[key]=value;}}
const state={};const extState={};acc.getState(state,extState);const states=[...a11yService.getStringStates(state.value,extState.value)];const children=[];for(let child=acc.firstChild;child;child=child.nextSibling){children.push(getSnapshot(child,a11yService));}
const{nodeType,nodeCssSelector}=getNodeDescription(acc.DOMNode);const snapshot={name:acc.name,role:a11yService.getStringRole(acc.role),actions,value:acc.value,nodeCssSelector,nodeType,description:acc.description,keyboardShortcut:acc.accessKey||acc.keyboardShortcut,childCount:acc.childCount,indexInParent:acc.indexInParent,states,children,attributes,};const remoteFrame=acc.role===Ci.nsIAccessibleRole.ROLE_INTERNAL_FRAME&&isRemoteFrame(acc.DOMNode);if(remoteFrame){snapshot.remoteFrame=remoteFrame;snapshot.childCount=1;snapshot.contentDOMReference=ContentDOMReference.get(acc.DOMNode);}
return snapshot;}
const AccessibleActor=ActorClassWithSpec(accessibleSpec,{initialize(walker,rawAccessible){Actor.prototype.initialize.call(this,null);this.walker=walker;this.rawAccessible=rawAccessible;Object.defineProperty(this,"isDefunct",{get(){const defunct=isDefunct(this.rawAccessible);if(defunct){delete this.isDefunct;this.isDefunct=true;return this.isDefunct;}
return defunct;},configurable:true,});},get conn(){return this.walker.conn;},destroy(){Actor.prototype.destroy.call(this);this.walker=null;this.rawAccessible=null;},get role(){if(this.isDefunct){return null;}
return this.walker.a11yService.getStringRole(this.rawAccessible.role);},get name(){if(this.isDefunct){return null;}
return this.rawAccessible.name;},get value(){if(this.isDefunct){return null;}
return this.rawAccessible.value;},get description(){if(this.isDefunct){return null;}
return this.rawAccessible.description;},get keyboardShortcut(){if(this.isDefunct){return null;}




return this.rawAccessible.accessKey||this.rawAccessible.keyboardShortcut;},get childCount(){if(this.isDefunct){return 0;}

if(this.remoteFrame){return 1;}
return this.rawAccessible.childCount;},get domNodeType(){if(this.isDefunct){return 0;}
return this.rawAccessible.DOMNode?this.rawAccessible.DOMNode.nodeType:0;},get parentAcc(){if(this.isDefunct){return null;}
return this.walker.addRef(this.rawAccessible.parent);},children(){const children=[];if(this.isDefunct){return children;}
for(let child=this.rawAccessible.firstChild;child;child=child.nextSibling){children.push(this.walker.addRef(child));}
return children;},get indexInParent(){if(this.isDefunct){return-1;}
try{return this.rawAccessible.indexInParent;}catch(e){return-1;}},get actions(){const actions=[];if(this.isDefunct){return actions;}
for(let i=0;i<this.rawAccessible.actionCount;i++){actions.push(this.rawAccessible.getActionDescription(i));}
return actions;},get states(){if(this.isDefunct){return[];}
const state={};const extState={};this.rawAccessible.getState(state,extState);return[...this.walker.a11yService.getStringStates(state.value,extState.value),];},get attributes(){if(this.isDefunct||!this.rawAccessible.attributes){return{};}
const attributes={};for(const{key,value}of this.rawAccessible.attributes.enumerate()){attributes[key]=value;}
return attributes;},get bounds(){if(this.isDefunct){return null;}
let x={},y={},w={},h={};try{this.rawAccessible.getBoundsInCSSPixels(x,y,w,h);x=x.value;y=y.value;w=w.value;h=h.value;}catch(e){return null;}
const left=x,right=x+w,top=y,bottom=y+h;if(left===right||top===bottom){return null;}
return{x,y,w,h};},async getRelations(){const relationObjects=[];if(this.isDefunct){return relationObjects;}
const relations=[...this.rawAccessible.getRelations().enumerate(Ci.nsIAccessibleRelation),];if(relations.length===0){return relationObjects;}
const doc=await this.walker.getDocument();if(this.isDestroyed()){return relationObjects;}
relations.forEach(relation=>{if(RELATIONS_TO_IGNORE.has(relation.relationType)){return;}
const type=this.walker.a11yService.getStringRelationType(relation.relationType);const targets=[...relation.getTargets().enumerate(Ci.nsIAccessible)];let relationObject;for(const target of targets){let targetAcc;try{targetAcc=this.walker.attachAccessible(target,doc.rawAccessible);}catch(e){}
if(targetAcc){if(!relationObject){relationObject={type,targets:[]};}
relationObject.targets.push(targetAcc);}}
if(relationObject){relationObjects.push(relationObject);}});return relationObjects;},get remoteFrame(){if(this.isDefunct){return false;}
return(this.rawAccessible.role===Ci.nsIAccessibleRole.ROLE_INTERNAL_FRAME&&isRemoteFrame(this.rawAccessible.DOMNode));},form(){return{actor:this.actorID,role:this.role,name:this.name,remoteFrame:this.remoteFrame,childCount:this.childCount,checks:this._lastAudit,};},hydrate(){return{value:this.value,description:this.description,keyboardShortcut:this.keyboardShortcut,domNodeType:this.domNodeType,indexInParent:this.indexInParent,states:this.states,actions:this.actions,attributes:this.attributes,};},_isValidTextLeaf(rawAccessible){return(!isDefunct(rawAccessible)&&TEXT_ROLES.has(rawAccessible.role)&&rawAccessible.name&&rawAccessible.name.trim().length>0);},async _getContrastRatio(){if(!this._isValidTextLeaf(this.rawAccessible)){return null;}
const{bounds}=this;if(!bounds){return null;}
const{DOMNode:rawNode}=this.rawAccessible;const win=rawNode.ownerGlobal;
const{walker}=this;await walker.clearStyles(win);const contrastRatio=await getContrastRatioFor(rawNode.parentNode,{bounds:getBounds(win,bounds),win,appliedColorMatrix:this.walker.colorMatrix,});if(this.isDestroyed()){return null;}
await walker.restoreStyles(win);return contrastRatio;},_getAuditByType(type){switch(type){case AUDIT_TYPE.CONTRAST:return this._getContrastRatio();case AUDIT_TYPE.KEYBOARD:return auditKeyboard(this.rawAccessible);case AUDIT_TYPE.TEXT_LABEL:
return auditTextLabel(this.rawAccessible);default:return null;}},audit(options={}){if(this._auditing){return this._auditing;}
const{types}=options;let auditTypes=Object.values(AUDIT_TYPE);if(types&&types.length>0){auditTypes=auditTypes.filter(auditType=>types.includes(auditType));}






let keyboardAuditResult;const keyboardAuditIndex=auditTypes.indexOf(AUDIT_TYPE.KEYBOARD);if(keyboardAuditIndex>-1){
auditTypes.splice(keyboardAuditIndex,1);keyboardAuditResult=this._getAuditByType(AUDIT_TYPE.KEYBOARD);}
this._auditing=Promise.resolve(keyboardAuditResult).then(keyboardResult=>{const audits=auditTypes.map(auditType=>this._getAuditByType(auditType));
if(keyboardAuditIndex>-1){auditTypes.splice(keyboardAuditIndex,0,AUDIT_TYPE.KEYBOARD);audits.splice(keyboardAuditIndex,0,keyboardResult);}
return Promise.all(audits);}).then(results=>{if(this.isDefunct||this.isDestroyed()){return null;}
const audit=results.reduce((auditResults,result,index)=>{auditResults[auditTypes[index]]=result;return auditResults;},{});this._lastAudit=this._lastAudit||{};Object.assign(this._lastAudit,audit);events.emit(this,"audited",audit);return audit;}).catch(error=>{if(!this.isDefunct&&!this.isDestroyed()){throw error;}
return null;}).finally(()=>{this._auditing=null;});return this._auditing;},snapshot(){return getSnapshot(this.rawAccessible,this.walker.a11yService);},});exports.AccessibleActor=AccessibleActor;