//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");var EXPORTED_SYMBOLS=["MatchURLFilters"];class MatchURLFilters{constructor(filters){if(!Array.isArray(filters)){throw new TypeError("filters should be an array");}
if(!filters.length){throw new Error("filters array should not be empty");}
this.filters=filters;}
matches(url){let uri=Services.io.newURI(url);let uriURL={};if(uri instanceof Ci.nsIURL){uriURL=uri;}
let host="";try{host=uri.host;}catch(e){}
let port;try{port=uri.port;}catch(e){}
let data={

path:uriURL.filePath,query:uriURL.query,host,port,url,};return this.filters.some(filter=>this.matchURLFilter({filter,data,uri,uriURL}));}
matchURLFilter({filter,data,uri,uriURL}){if(filter.schemes){if(!filter.schemes.some(scheme=>uri.schemeIs(scheme))){return false;}}
if(filter.ports){let port=data.port;if(port===-1){if(["resource","chrome"].includes(uri.scheme)){port=undefined;}else{port=Services.io.getProtocolHandler(uri.scheme).defaultPort;}} 
return filter.ports.some(filterPort=>{if(Array.isArray(filterPort)){let[lower,upper]=filterPort;return port>=lower&&port<=upper;}
return port===filterPort;});}
for(let urlComponent of["host","path","query","url"]){if(!this.testMatchOnURLComponent({urlComponent,data,filter})){return false;}}

if(filter.urlMatches){let urlWithoutRef=uri.specIgnoringRef;if(!urlWithoutRef.match(filter.urlMatches)){return false;}}

if(filter.originAndPathMatches){let urlWithoutQueryAndRef=uri.resolve(uriURL.filePath);


if(!urlWithoutQueryAndRef||!urlWithoutQueryAndRef.match(filter.originAndPathMatches)){return false;}}
return true;}
testMatchOnURLComponent({urlComponent:key,data,filter}){if(filter[`${key}Equals`]!=null){if(data[key]!==filter[`${key}Equals`]){return false;}}
if(filter[`${key}Contains`]){let value=(key=="host"?".":"")+data[key];if(!data[key]||!value.includes(filter[`${key}Contains`])){return false;}}
if(filter[`${key}Prefix`]){if(!data[key]||!data[key].startsWith(filter[`${key}Prefix`])){return false;}}
if(filter[`${key}Suffix`]){if(!data[key]||!data[key].endsWith(filter[`${key}Suffix`])){return false;}}
return true;}
serialize(){return this.filters;}}