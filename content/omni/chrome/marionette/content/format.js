"use strict";const EXPORTED_SYMBOLS=["pprint","truncate"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"chrome://marionette/content/log.js",MarionettePrefs:"chrome://marionette/content/prefs.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());const ELEMENT_NODE=1;const MAX_STRING_LENGTH=250;function pprint(ss,...values){function pretty(val){let proto=Object.prototype.toString.call(val);if(typeof val=="object"&&val!==null&&"nodeType"in val&&val.nodeType===ELEMENT_NODE){return prettyElement(val);}else if(["[object Window]","[object ChromeWindow]"].includes(proto)){return prettyWindowGlobal(val);}else if(proto=="[object Attr]"){return prettyAttr(val);}
return prettyObject(val);}
function prettyElement(el){let attrs=["id","class","href","name","src","type"];let idents="";for(let attr of attrs){if(el.hasAttribute(attr)){idents+=` ${attr}="${el.getAttribute(attr)}"`;}}
return`<${el.localName}${idents}>`;}
function prettyWindowGlobal(win){let proto=Object.prototype.toString.call(win);return`[${proto.substring(1, proto.length - 1)} ${win.location}]`;}
function prettyAttr(obj){return`[object Attr ${obj.name}="${obj.value}"]`;}
function prettyObject(obj){let proto=Object.prototype.toString.call(obj);let s="";try{s=JSON.stringify(obj);}catch(e){if(e instanceof TypeError){s=`<${e.message}>`;}else{throw e;}}
return`${proto} ${s}`;}
let res=[];for(let i=0;i<ss.length;i++){res.push(ss[i]);if(i<values.length){let s;try{s=pretty(values[i]);}catch(e){logger.warn("Problem pretty printing:",e);s=typeof values[i];}
res.push(s);}}
return res.join("");}
this.pprint=pprint;function truncate(strings,...values){function walk(obj){const typ=Object.prototype.toString.call(obj);switch(typ){case"[object Undefined]":case"[object Null]":case"[object Boolean]":case"[object Number]":return obj;case"[object String]":if(MarionettePrefs.truncateLog){if(obj.length>MAX_STRING_LENGTH){let s1=obj.substring(0,MAX_STRING_LENGTH/2);let s2=obj.substring(obj.length-MAX_STRING_LENGTH/2);return`${s1} ... ${s2}`;}}
return obj;case"[object Array]":return obj.map(walk); default:if(Object.getOwnPropertyNames(obj).includes("toString")&&typeof obj.toString=="function"){return walk(obj.toString());}
let rv={};for(let prop in obj){rv[prop]=walk(obj[prop]);}
return rv;}}
let res=[];for(let i=0;i<strings.length;++i){res.push(strings[i]);if(i<values.length){let obj=walk(values[i]);let t=Object.prototype.toString.call(obj);if(t=="[object Array]"||t=="[object Object]"){res.push(JSON.stringify(obj));}else{res.push(obj);}}}
return res.join("");}
this.truncate=truncate;