"use strict";ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");var{ExtensionError}=ExtensionUtils;const SAME_SITE_STATUSES=["no_restriction","lax","strict",];const isIPv4=host=>{let match=/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);if(match){return match[1]<256&&match[2]<256&&match[3]<256&&match[4]<256;}
return false;};const isIPv6=host=>host.includes(":");const addBracketIfIPv6=host=>isIPv6(host)&&!host.startsWith("[")?`[${host}]`:host;const dropBracketIfIPv6=host=>isIPv6(host)&&host.startsWith("[")&&host.endsWith("]")?host.slice(1,-1):host;const convertCookie=({cookie,isPrivate})=>{let result={name:cookie.name,value:cookie.value,domain:addBracketIfIPv6(cookie.host),hostOnly:!cookie.isDomain,path:cookie.path,secure:cookie.isSecure,httpOnly:cookie.isHttpOnly,sameSite:SAME_SITE_STATUSES[cookie.sameSite],session:cookie.isSession,firstPartyDomain:cookie.originAttributes.firstPartyDomain||"",};if(!cookie.isSession){result.expirationDate=cookie.expiry;}
if(cookie.originAttributes.userContextId){result.storeId=getCookieStoreIdForContainer(cookie.originAttributes.userContextId);}else if(cookie.originAttributes.privateBrowsingId||isPrivate){result.storeId=PRIVATE_STORE;}else{result.storeId=DEFAULT_STORE;}
return result;};const isSubdomain=(otherDomain,baseDomain)=>{return otherDomain==baseDomain||otherDomain.endsWith("."+baseDomain);};
const checkSetCookiePermissions=(extension,uri,cookie)=>{










if(uri.scheme!="http"&&uri.scheme!="https"){return false;}
if(!extension.allowedOrigins.matches(uri)){return false;}
if(!cookie.host){cookie.host=uri.host;return true;}


if(cookie.host.length>1){cookie.host=cookie.host.replace(/^\./,"");}
cookie.host=cookie.host.toLowerCase();cookie.host=dropBracketIfIPv6(cookie.host);if(cookie.host!=uri.host){let baseDomain;try{baseDomain=Services.eTLD.getBaseDomain(uri);}catch(e){if(e.result==Cr.NS_ERROR_HOST_IS_IP_ADDRESS||e.result==Cr.NS_ERROR_INSUFFICIENT_DOMAIN_LEVELS){

return false;}
throw e;}



if(!isSubdomain(cookie.host,baseDomain)||!isSubdomain(uri.host,cookie.host)){return false;}

}
if(isIPv6(cookie.host)||isIPv4(cookie.host)){return true;}

cookie.host="."+cookie.host;

return true;};const query=function*(detailsIn,props,context){let details={};props.forEach(property=>{if(detailsIn[property]!==null){details[property]=detailsIn[property];}});if("domain"in details){details.domain=details.domain.toLowerCase().replace(/^\./,"");details.domain=dropBracketIfIPv6(details.domain);}
let userContextId=0;let isPrivate=context.incognito;if(details.storeId){if(!isValidCookieStoreId(details.storeId)){return;}
if(isDefaultCookieStoreId(details.storeId)){isPrivate=false;}else if(isPrivateCookieStoreId(details.storeId)){isPrivate=true;}else if(isContainerCookieStoreId(details.storeId)){isPrivate=false;userContextId=getContainerForCookieStoreId(details.storeId);if(!userContextId){return;}}}
let storeId=DEFAULT_STORE;if(isPrivate){storeId=PRIVATE_STORE;}else if("storeId"in details){storeId=details.storeId;}
if(storeId==PRIVATE_STORE&&!context.privateBrowsingAllowed){throw new ExtensionError("Extension disallowed access to the private cookies storeId.");}
let cookies;let host;let url;let originAttributes={userContextId,privateBrowsingId:isPrivate?1:0,};if("firstPartyDomain"in details){originAttributes.firstPartyDomain=details.firstPartyDomain;}
if("url"in details){try{url=new URL(details.url);host=dropBracketIfIPv6(url.hostname);}catch(ex){ return;}}else if("domain"in details){host=details.domain;}
if(host&&"firstPartyDomain"in originAttributes){
cookies=Services.cookies.getCookiesFromHost(host,originAttributes);}else{cookies=Services.cookies.getCookiesWithOriginAttributes(JSON.stringify(originAttributes),host);} 
function matches(cookie){function domainMatches(host){return(cookie.rawHost==host||(cookie.isDomain&&host.endsWith(cookie.host)));}
function pathMatches(path){let cookiePath=cookie.path.replace(/\/$/,"");if(!path.startsWith(cookiePath)){return false;}
if(path.length==cookiePath.length){return true;}

return path[cookiePath.length]==="/";}
if(url){if(!domainMatches(host)){return false;}
if(cookie.isSecure&&url.protocol!="https:"){return false;}
if(!pathMatches(url.pathname)){return false;}}
if("name"in details&&details.name!=cookie.name){return false;}
if("domain"in details&&!isSubdomain(cookie.rawHost,details.domain)){return false;}
if("path"in details&&details.path!=cookie.path){return false;}
if("secure"in details&&details.secure!=cookie.isSecure){return false;}
if("session"in details&&details.session!=cookie.isSession){return false;}
if(!context.extension.allowedOrigins.matchesCookie(cookie)){return false;}
return true;}
for(const cookie of cookies){if(matches(cookie)){yield{cookie,isPrivate,storeId};}}};const normalizeFirstPartyDomain=details=>{if(details.firstPartyDomain!=null){return;}
if(Services.prefs.getBoolPref("privacy.firstparty.isolate")){throw new ExtensionError("First-Party Isolation is enabled, but the required 'firstPartyDomain' attribute was not set.");}

details.firstPartyDomain="";};this.cookies=class extends ExtensionAPI{getAPI(context){let{extension}=context;let self={cookies:{get:function(details){normalizeFirstPartyDomain(details);let allowed=["url","name","storeId","firstPartyDomain"];for(let cookie of query(details,allowed,context)){return Promise.resolve(convertCookie(cookie));}
return Promise.resolve(null);},getAll:function(details){if(!("firstPartyDomain"in details)){normalizeFirstPartyDomain(details);}
let allowed=["url","name","domain","path","secure","session","storeId",];if(details.firstPartyDomain!=null){allowed.push("firstPartyDomain");}
let result=Array.from(query(details,allowed,context),convertCookie);return Promise.resolve(result);},set:function(details){normalizeFirstPartyDomain(details);let uri=Services.io.newURI(details.url);let path;if(details.path!==null){path=details.path;}else{


path=uri.QueryInterface(Ci.nsIURL).directory;}
let name=details.name!==null?details.name:"";let value=details.value!==null?details.value:"";let secure=details.secure!==null?details.secure:false;let httpOnly=details.httpOnly!==null?details.httpOnly:false;let isSession=details.expirationDate===null;let expiry=isSession?Number.MAX_SAFE_INTEGER:details.expirationDate;let isPrivate=context.incognito;let userContextId=0;if(isDefaultCookieStoreId(details.storeId)){isPrivate=false;}else if(isPrivateCookieStoreId(details.storeId)){if(!context.privateBrowsingAllowed){return Promise.reject({message:"Extension disallowed access to the private cookies storeId.",});}
isPrivate=true;}else if(isContainerCookieStoreId(details.storeId)){let containerId=getContainerForCookieStoreId(details.storeId);if(containerId===null){return Promise.reject({message:`Illegal storeId: ${details.storeId}`,});}
isPrivate=false;userContextId=containerId;}else if(details.storeId!==null){return Promise.reject({message:"Unknown storeId"});}
let cookieAttrs={host:details.domain,path:path,isSecure:secure,};if(!checkSetCookiePermissions(extension,uri,cookieAttrs)){return Promise.reject({message:`Permission denied to set cookie ${JSON.stringify(
                details
              )}`,});}
let originAttributes={userContextId,privateBrowsingId:isPrivate?1:0,firstPartyDomain:details.firstPartyDomain,};let sameSite=SAME_SITE_STATUSES.indexOf(details.sameSite);let schemeType=Ci.nsICookie.SCHEME_UNSET;if(uri.scheme==="https"){schemeType=Ci.nsICookie.SCHEME_HTTPS;}else if(uri.scheme==="http"){schemeType=Ci.nsICookie.SCHEME_HTTP;}else if(uri.scheme==="file"){schemeType=Ci.nsICookie.SCHEME_FILE;}

Services.cookies.add(cookieAttrs.host,path,name,value,secure,httpOnly,isSession,expiry,originAttributes,sameSite,schemeType);return self.cookies.get(details);},remove:function(details){normalizeFirstPartyDomain(details);let allowed=["url","name","storeId","firstPartyDomain"];for(let{cookie,storeId}of query(details,allowed,context)){if(isPrivateCookieStoreId(details.storeId)&&!context.privateBrowsingAllowed){return Promise.reject({message:"Unknown storeId"});}
Services.cookies.remove(cookie.host,cookie.name,cookie.path,cookie.originAttributes);return Promise.resolve({url:details.url,name:details.name,storeId,firstPartyDomain:details.firstPartyDomain,});}
return Promise.resolve(null);},getAllCookieStores:function(){let data={};for(let tab of extension.tabManager.query()){if(!(tab.cookieStoreId in data)){data[tab.cookieStoreId]=[];}
data[tab.cookieStoreId].push(tab.id);}
let result=[];for(let key in data){result.push({id:key,tabIds:data[key],incognito:key==PRIVATE_STORE,});}
return Promise.resolve(result);},onChanged:new EventManager({context,name:"cookies.onChanged",register:fire=>{let observer=(subject,topic,data)=>{let notify=(removed,cookie,cause)=>{cookie.QueryInterface(Ci.nsICookie);if(extension.allowedOrigins.matchesCookie(cookie)){fire.async({removed,cookie:convertCookie({cookie,isPrivate:topic=="private-cookie-changed",}),cause,});}};switch(data){case"deleted":notify(true,subject,"explicit");break;case"added":notify(false,subject,"explicit");break;case"changed":notify(true,subject,"overwrite");notify(false,subject,"explicit");break;case"batch-deleted":subject.QueryInterface(Ci.nsIArray);for(let i=0;i<subject.length;i++){let cookie=subject.queryElementAt(i,Ci.nsICookie);if(!cookie.isSession&&cookie.expiry*1000<=Date.now()){notify(true,cookie,"expired");}else{notify(true,cookie,"evicted");}}
break;}};Services.obs.addObserver(observer,"cookie-changed");if(context.privateBrowsingAllowed){Services.obs.addObserver(observer,"private-cookie-changed");}
return()=>{Services.obs.removeObserver(observer,"cookie-changed");if(context.privateBrowsingAllowed){Services.obs.removeObserver(observer,"private-cookie-changed");}};},}).api(),},};return self;}};