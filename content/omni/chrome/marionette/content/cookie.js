"use strict";const EXPORTED_SYMBOLS=["cookie"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{assert:"chrome://marionette/content/assert.js",error:"chrome://marionette/content/error.js",pprint:"chrome://marionette/content/format.js",});const IPV4_PORT_EXPR=/:\d+$/;const SAMESITE_MAP=new Map([["None",Ci.nsICookie.SAMESITE_NONE],["Lax",Ci.nsICookie.SAMESITE_LAX],["Strict",Ci.nsICookie.SAMESITE_STRICT],]);this.cookie={manager:Services.cookies,};cookie.fromJSON=function(json){let newCookie={};assert.object(json,pprint`Expected cookie object, got ${json}`);newCookie.name=assert.string(json.name,"Cookie name must be string");newCookie.value=assert.string(json.value,"Cookie value must be string");if(typeof json.path!="undefined"){newCookie.path=assert.string(json.path,"Cookie path must be string");}
if(typeof json.domain!="undefined"){newCookie.domain=assert.string(json.domain,"Cookie domain must be string");}
if(typeof json.secure!="undefined"){newCookie.secure=assert.boolean(json.secure,"Cookie secure flag must be boolean");}
if(typeof json.httpOnly!="undefined"){newCookie.httpOnly=assert.boolean(json.httpOnly,"Cookie httpOnly flag must be boolean");}
if(typeof json.expiry!="undefined"){newCookie.expiry=assert.positiveInteger(json.expiry,"Cookie expiry must be a positive integer");}
if(typeof json.sameSite!="undefined"){newCookie.sameSite=assert.in(json.sameSite,Array.from(SAMESITE_MAP.keys()),"Cookie SameSite flag must be one of None, Lax, or Strict");}
return newCookie;};cookie.add=function(newCookie,{restrictToHost=null,protocol=null}={}){assert.string(newCookie.name,"Cookie name must be string");assert.string(newCookie.value,"Cookie value must be string");if(typeof newCookie.path=="undefined"){newCookie.path="/";}
let hostOnly=false;if(typeof newCookie.domain=="undefined"){hostOnly=true;newCookie.domain=restrictToHost;}
assert.string(newCookie.domain,"Cookie domain must be string");if(newCookie.domain.substring(0,1)==="."){newCookie.domain=newCookie.domain.substring(1);}
if(typeof newCookie.secure=="undefined"){newCookie.secure=false;}
if(typeof newCookie.httpOnly=="undefined"){newCookie.httpOnly=false;}
if(typeof newCookie.expiry=="undefined"){newCookie.expiry=Number.MAX_SAFE_INTEGER;newCookie.session=true;}else{newCookie.session=false;}
newCookie.sameSite=SAMESITE_MAP.get(newCookie.sameSite||"None");let isIpAddress=false;try{Services.eTLD.getPublicSuffixFromHost(newCookie.domain);}catch(e){switch(e.result){case Cr.NS_ERROR_HOST_IS_IP_ADDRESS:isIpAddress=true;break;default:throw new error.InvalidCookieDomainError(newCookie.domain);}}
if(!hostOnly&&!isIpAddress){
newCookie.domain="."+newCookie.domain;}
if(restrictToHost){if(!restrictToHost.endsWith(newCookie.domain)&&"."+restrictToHost!==newCookie.domain&&restrictToHost!==newCookie.domain){throw new error.InvalidCookieDomainError(`Cookies may only be set `+`for the current domain (${restrictToHost})`);}}
let schemeType=Ci.nsICookie.SCHEME_UNSET;switch(protocol){case"http:":schemeType=Ci.nsICookie.SCHEME_HTTP;break;case"https:":schemeType=Ci.nsICookie.SCHEME_HTTPS;break;default:break;}
 
newCookie.domain=newCookie.domain.replace(IPV4_PORT_EXPR,"");try{cookie.manager.add(newCookie.domain,newCookie.path,newCookie.name,newCookie.value,newCookie.secure,newCookie.httpOnly,newCookie.session,newCookie.expiry,{},newCookie.sameSite,schemeType);}catch(e){throw new error.UnableToSetCookieError(e);}};cookie.remove=function(toDelete){cookie.manager.remove(toDelete.domain,toDelete.name,toDelete.path,{});};cookie.iter=function*(host,currentPath="/"){assert.string(host,"host must be string");assert.string(currentPath,"currentPath must be string");const isForCurrentPath=path=>currentPath.includes(path);let cookies=cookie.manager.getCookiesFromHost(host,{});for(let cookie of cookies){ let hostname=host;do{if((cookie.host=="."+hostname||cookie.host==hostname)&&isForCurrentPath(cookie.path)){let data={name:cookie.name,value:cookie.value,path:cookie.path,domain:cookie.host,secure:cookie.isSecure,httpOnly:cookie.isHttpOnly,};if(!cookie.isSession){data.expiry=cookie.expiry;}
data.sameSite=[...SAMESITE_MAP].find(([,value])=>cookie.sameSite===value)[0];yield data;}
hostname=hostname.replace(/^.*?\./,"");}while(hostname.includes("."));}};