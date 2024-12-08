//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["URL"]);function ImageObjectProcessor(aErrors,aExtractor,aBundle){this.errors=aErrors;this.extractor=aExtractor;this.domBundle=aBundle;}
const iconPurposes=Object.freeze(["any","maskable","monochrome"]);Object.defineProperties(ImageObjectProcessor,{decimals:{get(){return/^\d+$/;},},anyRegEx:{get(){return new RegExp("any","i");},},});ImageObjectProcessor.prototype.process=function(aManifest,aBaseURL,aMemberName){const spec={objectName:"manifest",object:aManifest,property:aMemberName,expectedType:"array",trim:false,};const{domBundle,extractor,errors}=this;const images=[];const value=extractor.extractValue(spec);if(Array.isArray(value)){value.map(toImageObject)
.filter(image=>image).forEach(image=>images.push(image));}
return images;function toImageObject(aImageSpec,index){let img;try{ const src=processSrcMember(aImageSpec,aBaseURL,index); const purpose=processPurposeMember(aImageSpec,index);const type=processTypeMember(aImageSpec);const sizes=processSizesMember(aImageSpec);img={src,purpose,type,sizes,};}catch(err){}
return img;}
function processPurposeMember(aImage,index){const spec={objectName:"image",object:aImage,property:"purpose",expectedType:"string",trim:true,throwTypeError:true,};let value;try{value=extractor.extractValue(spec);}catch(err){return["any"];}
if(!value){return["any"];}
const keywords=value.split(/\s+/);if(keywords.length===0){return["any"];}
const purposes=new Set();const unknownPurposes=new Set();const repeatedPurposes=new Set();for(const keyword of keywords){const canonicalKeyword=keyword.toLowerCase();if(purposes.has(canonicalKeyword)){repeatedPurposes.add(keyword);continue;}
iconPurposes.includes(canonicalKeyword)?purposes.add(canonicalKeyword):unknownPurposes.add(keyword);}
if(unknownPurposes.size){const warn=domBundle.formatStringFromName("ManifestImageUnsupportedPurposes",[aMemberName,index,[...unknownPurposes].join(" ")]);errors.push({warn});}
if(repeatedPurposes.size){const warn=domBundle.formatStringFromName("ManifestImageRepeatedPurposes",[aMemberName,index,[...repeatedPurposes].join(" ")]);errors.push({warn});}
if(purposes.size===0){const warn=domBundle.formatStringFromName("ManifestImageUnusable",[aMemberName,index,]);errors.push({warn});throw new TypeError(warn);}
return[...purposes];}
function processTypeMember(aImage){const charset={};const hadCharset={};const spec={objectName:"image",object:aImage,property:"type",expectedType:"string",trim:true,};let value=extractor.extractValue(spec);if(value){value=Services.io.parseRequestContentType(value,charset,hadCharset);}
return value||undefined;}
function processSrcMember(aImage,aBaseURL,index){const spec={objectName:aMemberName,object:aImage,property:"src",expectedType:"string",trim:false,throwTypeError:true,};const value=extractor.extractValue(spec);let url;if(typeof value==="undefined"||value===""){throw new TypeError();}
if(value&&value.length){try{url=new URL(value,aBaseURL).href;}catch(e){const warn=domBundle.formatStringFromName("ManifestImageURLIsInvalid",[aMemberName,index,"src",value]);errors.push({warn});throw e;}}
return url;}
function processSizesMember(aImage){const sizes=new Set();const spec={objectName:"image",object:aImage,property:"sizes",expectedType:"string",trim:true,};const value=extractor.extractValue(spec);if(value){value.split(/\s+/).filter(isValidSizeValue).reduce((collector,size)=>collector.add(size),sizes);}
return sizes.size?Array.from(sizes):undefined;function isValidSizeValue(aSize){const size=aSize.toLowerCase();if(ImageObjectProcessor.anyRegEx.test(aSize)){return true;}
if(!size.includes("x")||size.indexOf("x")!==size.lastIndexOf("x")){return false;}
const widthAndHeight=size.split("x");const w=widthAndHeight.shift();const h=widthAndHeight.join("x");const validStarts=!w.startsWith("0")&&!h.startsWith("0");const validDecimals=ImageObjectProcessor.decimals.test(w+h);return validStarts&&validDecimals;}}};var EXPORTED_SYMBOLS=["ImageObjectProcessor"];