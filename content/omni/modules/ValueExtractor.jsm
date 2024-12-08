//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["InspectorUtils"]);class ValueExtractor{constructor(errors,aBundle){this.errors=errors;this.domBundle=aBundle;}
extractValue(options){const{expectedType,object,objectName,property,throwTypeError,trim,}=options;const value=object[property];const isArray=Array.isArray(value);const type=isArray?"array":typeof value;if(type!==expectedType){if(type!=="undefined"){const warn=this.domBundle.formatStringFromName("ManifestInvalidType",[objectName,property,expectedType]);this.errors.push({warn});if(throwTypeError){throw new TypeError(warn);}}
return undefined;}
const shouldTrim=expectedType==="string"&&value&&trim;if(shouldTrim){return value.trim()||undefined;}
return value;}
extractColorValue(spec){const value=this.extractValue(spec);let color;if(InspectorUtils.isValidCSSColor(value)){const rgba=InspectorUtils.colorToRGBA(value);color="#"+
rgba.r.toString(16).padStart(2,"0")+
rgba.g.toString(16).padStart(2,"0")+
rgba.b.toString(16).padStart(2,"0")+
Math.round(rgba.a*255).toString(16).padStart(2,"0");}else if(value){const warn=this.domBundle.formatStringFromName("ManifestInvalidCSSColor",[spec.property,value]);this.errors.push({warn});}
return color;}
extractLanguageValue(spec){let langTag;const value=this.extractValue(spec);if(value!==undefined){try{langTag=Intl.getCanonicalLocales(value)[0];}catch(err){const warn=this.domBundle.formatStringFromName("ManifestLangIsInvalid",[spec.property,value]);this.errors.push({warn});}}
return langTag;}}
const EXPORTED_SYMBOLS=["ValueExtractor"];