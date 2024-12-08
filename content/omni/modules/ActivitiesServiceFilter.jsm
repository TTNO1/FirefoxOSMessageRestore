//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["ActivitiesServiceFilter"];this.ActivitiesServiceFilter={match(aValues,aOrigin,aDescription){function matchValue(aValue,aFilter,aFilterObj){if(aFilter!==null){switch(typeof aFilter){case"boolean":return aValue===aFilter;case"number":return Number(aValue)===aFilter;case"string":return String(aValue)===aFilter;default: return false;}}
if("pattern"in aFilterObj){var pattern=String(aFilterObj.pattern);var patternFlags="";if("patternFlags"in aFilterObj){patternFlags=String(aFilterObj.patternFlags);}
var re=new RegExp("^(?:"+pattern+")$",patternFlags);return re.test(aValue);}
if("min"in aFilterObj||"max"in aFilterObj){if("min"in aFilterObj&&aFilterObj.min>aValue){return false;}
if("max"in aFilterObj&&aFilterObj.max<aValue){return false;}}
return true;} 
function matchObject(aValue,aFilterObj){let arrayValues=Array.isArray(aFilterObj.value)?aFilterObj.value:[aFilterObj.value];let filters="value"in aFilterObj?arrayValues:[null];let values=Array.isArray(aValue)?aValue:[aValue];for(var filterId=0;filterId<filters.length;++filterId){for(var valueId=0;valueId<values.length;++valueId){if(matchValue(values[valueId],filters[filterId],aFilterObj)){return true;}}}
return false;}
function filterResult(aValues,aFilters){
let filtersMap=new Map();for(let filter in aFilters){ let filterObj=aFilters[filter];if(Array.isArray(filterObj)||typeof filterObj!=="object"){filterObj={required:false,value:filterObj,};}
filtersMap.set(filter,{filter:filterObj,found:false});}
for(let prop in aValues){if(!filtersMap.has(prop)){continue;}
if(Array.isArray(aValues[prop])&&!aValues[prop].length){continue;}
if(!matchObject(aValues[prop],filtersMap.get(prop).filter)){return false;}
filtersMap.get(prop).found=true;}
for(const value of filtersMap.values()){if(value.filter.required&&!value.found){return false;}}
return true;}
function allowedOriginsResult(aCallerOrigin,aAllowedOrigins){if(!aAllowedOrigins){
return true;}
let allowedOrigins=Array.isArray(aAllowedOrigins)?aAllowedOrigins:[aAllowedOrigins];return(allowedOrigins.findIndex(origin=>origin===aCallerOrigin)!==-1);}
return(filterResult(aValues,aDescription.filters)&&allowedOriginsResult(aOrigin,aDescription.allowedOrigins));},};