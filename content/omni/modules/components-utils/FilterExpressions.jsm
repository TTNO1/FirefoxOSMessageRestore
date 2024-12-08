"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"PreferenceFilters","resource://gre/modules/components-utils/PreferenceFilters.jsm");ChromeUtils.defineModuleGetter(this,"Sampling","resource://gre/modules/components-utils/Sampling.jsm");ChromeUtils.defineModuleGetter(this,"mozjexl","resource://gre/modules/components-utils/mozjexl.js");var EXPORTED_SYMBOLS=["FilterExpressions"];XPCOMUtils.defineLazyGetter(this,"jexl",()=>{const jexl=new mozjexl.Jexl();jexl.addTransforms({date:dateString=>new Date(dateString),stableSample:Sampling.stableSample,bucketSample:Sampling.bucketSample,preferenceValue:PreferenceFilters.preferenceValue,preferenceIsUserSet:PreferenceFilters.preferenceIsUserSet,preferenceExists:PreferenceFilters.preferenceExists,keys,length,mapToProperty,regExpMatch,versionCompare,});jexl.addBinaryOp("intersect",40,operatorIntersect);return jexl;});var FilterExpressions={getAvailableTransforms(){return Object.keys(jexl._transforms);},eval(expr,context={}){const onelineExpr=expr.replace(/[\t\n\r]/g," ");return jexl.eval(onelineExpr,context);},};function keys(obj){if(typeof obj!=="object"||obj===null){return undefined;}
return Object.keys(obj);}
function length(arr){return Array.isArray(arr)?arr.length:undefined;}
function mapToProperty(arr,prop){return Array.isArray(arr)?arr.map(elem=>elem[prop]):undefined;}
function operatorIntersect(listA,listB){if(!Array.isArray(listA)||!Array.isArray(listB)){return undefined;}
return listA.filter(item=>listB.includes(item));}
function regExpMatch(str,pattern,flags){const re=new RegExp(pattern,flags);return str.match(re);}
function versionCompare(v1,v2){return Services.vc.compare(v1,v2);}