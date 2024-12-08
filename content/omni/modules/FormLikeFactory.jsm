//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FormLikeFactory"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");let FormLikeFactory={_propsFromForm:["action","autocomplete","ownerDocument"],createFromForm(aForm){if(ChromeUtils.getClassName(aForm)!=="HTMLFormElement"){throw new Error("createFromForm: aForm must be a HTMLFormElement");}
let formLike={elements:[...aForm.elements],rootElement:aForm,};for(let prop of this._propsFromForm){formLike[prop]=aForm[prop];}
this._addToJSONProperty(formLike);return formLike;},createFromField(aField){if((ChromeUtils.getClassName(aField)!=="HTMLInputElement"&&ChromeUtils.getClassName(aField)!=="HTMLSelectElement")||!aField.ownerDocument){throw new Error("createFromField requires a field in a document");}
let rootElement=this.findRootForField(aField);if(ChromeUtils.getClassName(rootElement)==="HTMLFormElement"){return this.createFromForm(rootElement);}
let doc=aField.ownerDocument;let formLike={action:doc.baseURI,autocomplete:"on",ownerDocument:doc,rootElement,};



XPCOMUtils.defineLazyGetter(formLike,"elements",function(){let elements=[];for(let el of this.rootElement.querySelectorAll("input, select")){
if(!el.form){elements.push(el);}}
return elements;});this._addToJSONProperty(formLike);return formLike;},closestFormIgnoringShadowRoots(aField){let form=aField.closest("form");let current=aField;while(!form){let shadowRoot=current.getRootNode();if(ChromeUtils.getClassName(shadowRoot)!=="ShadowRoot"){break;}
let host=shadowRoot.host;form=host.closest("form");current=host;}
return form;},findRootForField(aField){let form=aField.form||this.closestFormIgnoringShadowRoots(aField);if(form){return form;}
return aField.ownerDocument.documentElement;},_addToJSONProperty(aFormLike){function prettyElementOutput(aElement){let idText=aElement.id?"#"+aElement.id:"";let classText="";for(let className of aElement.classList){classText+="."+className;}
return`<${aElement.nodeName + idText + classText}>`;}
Object.defineProperty(aFormLike,"toJSON",{value:()=>{let cleansed={};for(let key of Object.keys(aFormLike)){let value=aFormLike[key];let cleansedValue=value;switch(key){case"elements":{cleansedValue=[];for(let element of value){cleansedValue.push(prettyElementOutput(element));}
break;}
case"ownerDocument":{cleansedValue={location:{href:value.location.href,},};break;}
case"rootElement":{cleansedValue=prettyElementOutput(value);break;}}
cleansed[key]=cleansedValue;}
return cleansed;},});},};