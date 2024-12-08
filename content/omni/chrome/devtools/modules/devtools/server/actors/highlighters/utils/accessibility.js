"use strict";const DevToolsUtils=require("devtools/shared/DevToolsUtils");const{getCurrentZoom}=require("devtools/shared/layout/utils");const{moveInfobar,}=require("devtools/server/actors/highlighters/utils/markup");const{truncateString}=require("devtools/shared/inspector/utils");const STRINGS_URI="devtools/shared/locales/accessibility.properties";loader.lazyRequireGetter(this,"LocalizationHelper","devtools/shared/l10n",true);DevToolsUtils.defineLazyGetter(this,"L10N",()=>new LocalizationHelper(STRINGS_URI));const{accessibility:{AUDIT_TYPE,ISSUE_TYPE:{[AUDIT_TYPE.KEYBOARD]:{FOCUSABLE_NO_SEMANTICS,FOCUSABLE_POSITIVE_TABINDEX,INTERACTIVE_NO_ACTION,INTERACTIVE_NOT_FOCUSABLE,MOUSE_INTERACTIVE_ONLY,NO_FOCUS_VISIBLE,},[AUDIT_TYPE.TEXT_LABEL]:{AREA_NO_NAME_FROM_ALT,DIALOG_NO_NAME,DOCUMENT_NO_TITLE,EMBED_NO_NAME,FIGURE_NO_NAME,FORM_FIELDSET_NO_NAME,FORM_FIELDSET_NO_NAME_FROM_LEGEND,FORM_NO_NAME,FORM_NO_VISIBLE_NAME,FORM_OPTGROUP_NO_NAME_FROM_LABEL,FRAME_NO_NAME,HEADING_NO_CONTENT,HEADING_NO_NAME,IFRAME_NO_NAME_FROM_TITLE,IMAGE_NO_NAME,INTERACTIVE_NO_NAME,MATHML_GLYPH_NO_NAME,TOOLBAR_NO_NAME,},},SCORES,},}=require("devtools/shared/constants");const MAX_STRING_LENGTH=50;class Infobar{constructor(highlighter){this.highlighter=highlighter;this.audit=new Audit(this);}
get markup(){return this.highlighter.markup;}
get document(){return this.highlighter.win.document;}
get bounds(){return this.highlighter._bounds;}
get options(){return this.highlighter.options;}
get prefix(){return this.highlighter.ID_CLASS_PREFIX;}
get win(){return this.highlighter.win;}
_moveInfobar(container){ const{left:x,top:y,bottom,width}=this.bounds;const infobarBounds={x,y,bottom,width};moveInfobar(container,infobarBounds,this.win);}
buildMarkup(root){const container=this.markup.createNode({parent:root,attributes:{class:"infobar-container",id:"infobar-container","aria-hidden":"true",hidden:"true",},prefix:this.prefix,});const infobar=this.markup.createNode({parent:container,attributes:{class:"infobar",id:"infobar",},prefix:this.prefix,});const infobarText=this.markup.createNode({parent:infobar,attributes:{class:"infobar-text",id:"infobar-text",},prefix:this.prefix,});this.markup.createNode({nodeType:"span",parent:infobarText,attributes:{class:"infobar-role",id:"infobar-role",},prefix:this.prefix,});this.markup.createNode({nodeType:"span",parent:infobarText,attributes:{class:"infobar-name",id:"infobar-name",},prefix:this.prefix,});this.audit.buildMarkup(infobarText);}
destroy(){this.highlighter=null;this.audit.destroy();this.audit=null;}
getElement(id){return this.highlighter.getElement(id);}
getTextContent(id){const anonymousContent=this.markup.content;return anonymousContent.getTextContentForElement(`${this.prefix}${id}`);}
hide(){const container=this.getElement("infobar-container");container.setAttribute("hidden","true");}
show(){const container=this.getElement("infobar-container");
container.removeAttribute("hidden");this.update(container);}
update(container){const{audit,name,role}=this.options;this.updateRole(role,this.getElement("infobar-role"));this.updateName(name,this.getElement("infobar-name"));this.audit.update(audit);this._moveInfobar(container);}
setTextContent(el,text){el.setTextContent(text);}
updateName(name,el){const nameText=name?`"${truncateString(name, MAX_STRING_LENGTH)}"`:"";this.setTextContent(el,nameText);}
updateRole(role,el){this.setTextContent(el,role);}}
class Audit{constructor(infobar){this.infobar=infobar;
this.reports={[AUDIT_TYPE.CONTRAST]:new ContrastRatio(this),[AUDIT_TYPE.KEYBOARD]:new Keyboard(this),[AUDIT_TYPE.TEXT_LABEL]:new TextLabel(this),};}
get prefix(){return this.infobar.prefix;}
get markup(){return this.infobar.markup;}
buildMarkup(root){const audit=this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"infobar-audit",id:"infobar-audit",},prefix:this.prefix,});Object.values(this.reports).forEach(report=>report.buildMarkup(audit));}
update(audit={}){const el=this.getElement("infobar-audit");el.setAttribute("hidden",true);let updated=false;Object.values(this.reports).forEach(report=>{if(report.update(audit)){updated=true;}});if(updated){el.removeAttribute("hidden");}}
getElement(id){return this.infobar.getElement(id);}
setTextContent(el,text){return this.infobar.setTextContent(el,text);}
destroy(){this.infobar=null;Object.values(this.reports).forEach(report=>report.destroy());this.reports=null;}}
class AuditReport{constructor(audit){this.audit=audit;}
get prefix(){return this.audit.prefix;}
get markup(){return this.audit.markup;}
getElement(id){return this.audit.getElement(id);}
setTextContent(el,text){return this.audit.setTextContent(el,text);}
destroy(){this.audit=null;}}
class ContrastRatio extends AuditReport{buildMarkup(root){this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"contrast-ratio-label",id:"contrast-ratio-label",},prefix:this.prefix,});this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"contrast-ratio-error",id:"contrast-ratio-error",},prefix:this.prefix,text:L10N.getStr("accessibility.contrast.ratio.error"),});this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"contrast-ratio",id:"contrast-ratio-min",},prefix:this.prefix,});this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"contrast-ratio-separator",id:"contrast-ratio-separator",},prefix:this.prefix,});this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"contrast-ratio",id:"contrast-ratio-max",},prefix:this.prefix,});}
_fillAndStyleContrastValue(el,{value,className,color,backgroundColor}){value=value.toFixed(2);this.setTextContent(el,value);el.classList.add(className);el.setAttribute("style",`--accessibility-highlighter-contrast-ratio-color: rgba(${color});`+`--accessibility-highlighter-contrast-ratio-bg: rgba(${backgroundColor});`);el.removeAttribute("hidden");}
update(audit){const els={};for(const key of["label","min","max","error","separator"]){const el=(els[key]=this.getElement(`contrast-ratio-${key}`));if(["min","max"].includes(key)){Object.values(SCORES).forEach(className=>el.classList.remove(className));this.setTextContent(el,"");}
el.setAttribute("hidden",true);el.removeAttribute("style");}
if(!audit){return false;}
const contrastRatio=audit[AUDIT_TYPE.CONTRAST];if(!contrastRatio){return false;}
const{isLargeText,error}=contrastRatio;this.setTextContent(els.label,L10N.getStr(`accessibility.contrast.ratio.label${isLargeText ? ".large" : ""}`));els.label.removeAttribute("hidden");if(error){els.error.removeAttribute("hidden");return true;}
if(contrastRatio.value){const{value,color,score,backgroundColor}=contrastRatio;this._fillAndStyleContrastValue(els.min,{value,className:score,color,backgroundColor,});return true;}
const{min,max,color,backgroundColorMin,backgroundColorMax,scoreMin,scoreMax,}=contrastRatio;this._fillAndStyleContrastValue(els.min,{value:min,className:scoreMin,color,backgroundColor:backgroundColorMin,});els.separator.removeAttribute("hidden");this._fillAndStyleContrastValue(els.max,{value:max,className:scoreMax,color,backgroundColor:backgroundColorMax,});return true;}}
class Keyboard extends AuditReport{static get ISSUE_TO_INFOBAR_LABEL_MAP(){return{[FOCUSABLE_NO_SEMANTICS]:"accessibility.keyboard.issue.semantics",[FOCUSABLE_POSITIVE_TABINDEX]:"accessibility.keyboard.issue.tabindex",[INTERACTIVE_NO_ACTION]:"accessibility.keyboard.issue.action",[INTERACTIVE_NOT_FOCUSABLE]:"accessibility.keyboard.issue.focusable",[MOUSE_INTERACTIVE_ONLY]:"accessibility.keyboard.issue.mouse.only",[NO_FOCUS_VISIBLE]:"accessibility.keyboard.issue.focus.visible",};}
buildMarkup(root){this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"audit",id:"keyboard",},prefix:this.prefix,});}
update(audit){const el=this.getElement("keyboard");el.setAttribute("hidden",true);Object.values(SCORES).forEach(className=>el.classList.remove(className));if(!audit){return false;}
const keyboardAudit=audit[AUDIT_TYPE.KEYBOARD];if(!keyboardAudit){return false;}
const{issue,score}=keyboardAudit;this.setTextContent(el,L10N.getStr(Keyboard.ISSUE_TO_INFOBAR_LABEL_MAP[issue]));el.classList.add(score);el.removeAttribute("hidden");return true;}}
class TextLabel extends AuditReport{static get ISSUE_TO_INFOBAR_LABEL_MAP(){return{[AREA_NO_NAME_FROM_ALT]:"accessibility.text.label.issue.area",[DIALOG_NO_NAME]:"accessibility.text.label.issue.dialog",[DOCUMENT_NO_TITLE]:"accessibility.text.label.issue.document.title",[EMBED_NO_NAME]:"accessibility.text.label.issue.embed",[FIGURE_NO_NAME]:"accessibility.text.label.issue.figure",[FORM_FIELDSET_NO_NAME]:"accessibility.text.label.issue.fieldset",[FORM_FIELDSET_NO_NAME_FROM_LEGEND]:"accessibility.text.label.issue.fieldset.legend2",[FORM_NO_NAME]:"accessibility.text.label.issue.form",[FORM_NO_VISIBLE_NAME]:"accessibility.text.label.issue.form.visible",[FORM_OPTGROUP_NO_NAME_FROM_LABEL]:"accessibility.text.label.issue.optgroup.label2",[FRAME_NO_NAME]:"accessibility.text.label.issue.frame",[HEADING_NO_CONTENT]:"accessibility.text.label.issue.heading.content",[HEADING_NO_NAME]:"accessibility.text.label.issue.heading",[IFRAME_NO_NAME_FROM_TITLE]:"accessibility.text.label.issue.iframe",[IMAGE_NO_NAME]:"accessibility.text.label.issue.image",[INTERACTIVE_NO_NAME]:"accessibility.text.label.issue.interactive",[MATHML_GLYPH_NO_NAME]:"accessibility.text.label.issue.glyph",[TOOLBAR_NO_NAME]:"accessibility.text.label.issue.toolbar",};}
buildMarkup(root){this.markup.createNode({nodeType:"span",parent:root,attributes:{class:"audit",id:"text-label",},prefix:this.prefix,});}
update(audit){const el=this.getElement("text-label");el.setAttribute("hidden",true);Object.values(SCORES).forEach(className=>el.classList.remove(className));if(!audit){return false;}
const textLabelAudit=audit[AUDIT_TYPE.TEXT_LABEL];if(!textLabelAudit){return false;}
const{issue,score}=textLabelAudit;this.setTextContent(el,L10N.getStr(TextLabel.ISSUE_TO_INFOBAR_LABEL_MAP[issue]));el.classList.add(score);el.removeAttribute("hidden");return true;}}
function getBounds(win,{x,y,w,h}){const{mozInnerScreenX,mozInnerScreenY,scrollX,scrollY}=win;const zoom=getCurrentZoom(win);let left=x;let right=x+w;let top=y;let bottom=y+h;left-=mozInnerScreenX-scrollX;right-=mozInnerScreenX-scrollX;top-=mozInnerScreenY-scrollY;bottom-=mozInnerScreenY-scrollY;left*=zoom;right*=zoom;top*=zoom;bottom*=zoom;const width=right-left;const height=bottom-top;return{left,right,top,bottom,width,height};}
function getBoundsXUL(win,{x,y,w,h,zoom}){const{mozInnerScreenX,mozInnerScreenY}=win;let left=x;let right=x+w;let top=y;let bottom=y+h;left*=zoom;right*=zoom;top*=zoom;bottom*=zoom;left-=mozInnerScreenX;right-=mozInnerScreenX;top-=mozInnerScreenY;bottom-=mozInnerScreenY;const width=right-left;const height=bottom-top;return{left,right,top,bottom,width,height};}
exports.MAX_STRING_LENGTH=MAX_STRING_LENGTH;exports.getBounds=getBounds;exports.getBoundsXUL=getBoundsXUL;exports.Infobar=Infobar;