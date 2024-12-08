//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{L10nRegistry}=ChromeUtils.import("resource://gre/modules/L10nRegistry.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");class CachedIterable extends Array{static from(iterable){if(iterable instanceof this){return iterable;}
return new this(iterable);}}
class CachedAsyncIterable extends CachedIterable{constructor(iterable){super();if(Symbol.asyncIterator in Object(iterable)){this.iterator=iterable[Symbol.asyncIterator]();}else if(Symbol.iterator in Object(iterable)){this.iterator=iterable[Symbol.iterator]();}else{throw new TypeError("Argument must implement the iteration protocol.");}}
[Symbol.asyncIterator](){const cached=this;let cur=0;return{async next(){if(cached.length<=cur){cached.push(cached.iterator.next());}
return cached[cur++];},};}
async touchNext(count=1){let idx=0;while(idx++<count){const last=this[this.length-1];if(last&&(await last).done){break;}
this.push(this.iterator.next());}

return this[this.length-1];}}
class CachedSyncIterable extends CachedIterable{constructor(iterable){super();if(Symbol.iterator in Object(iterable)){this.iterator=iterable[Symbol.iterator]();}else{throw new TypeError("Argument must implement the iteration protocol.");}}
[Symbol.iterator](){const cached=this;let cur=0;return{next(){if(cached.length<=cur){cached.push(cached.iterator.next());}
return cached[cur++];},};}
touchNext(count=1){let idx=0;while(idx++<count){const last=this[this.length-1];if(last&&last.done){break;}
this.push(this.iterator.next());}

return this[this.length-1];}}
function defaultGenerateBundles(resourceIds){const appLocales=Services.locale.appLocalesAsBCP47;return L10nRegistry.generateBundles(appLocales,resourceIds);}
function defaultGenerateBundlesSync(resourceIds){const appLocales=Services.locale.appLocalesAsBCP47;return L10nRegistry.generateBundlesSync(appLocales,resourceIds);}
function maybeReportErrorToGecko(error){if(AppConstants.NIGHTLY_BUILD||Cu.isInAutomation){if(Cu.isInAutomation){

 throw error;}
console.warn(error);}}
const Localization={cached(iterable,isSync){if(isSync){return CachedSyncIterable.from(iterable);}else{return CachedAsyncIterable.from(iterable);}},async formatWithFallback(resourceIds,bundles,keys,method){if(!bundles){throw new Error("Attempt to format on an uninitialized instance.");}
const translations=new Array(keys.length).fill(null);let hasAtLeastOneBundle=false;for await(const bundle of bundles){hasAtLeastOneBundle=true;const missingIds=keysFromBundle(method,bundle,keys,translations);if(missingIds.size===0){break;}
const locale=bundle.locales[0];const ids=Array.from(missingIds).join(", ");maybeReportErrorToGecko(`[fluent] Missing translations in ${locale}: ${ids}.`);}
if(!hasAtLeastOneBundle){maybeReportErrorToGecko(`[fluent] Request for keys failed because no resource bundles got generated.\n keys: ${JSON.stringify(keys)}.\n resourceIds: ${JSON.stringify(resourceIds)}.`);}
return translations;},formatWithFallbackSync(resourceIds,bundles,keys,method){if(!bundles){throw new Error("Attempt to format on an uninitialized instance.");}
const translations=new Array(keys.length).fill(null);let hasAtLeastOneBundle=false;for(const bundle of bundles){hasAtLeastOneBundle=true;const missingIds=keysFromBundle(method,bundle,keys,translations);if(missingIds.size===0){break;}
const locale=bundle.locales[0];const ids=Array.from(missingIds).join(", ");maybeReportErrorToGecko(`[fluent] Missing translations in ${locale}: ${ids}.`);}
if(!hasAtLeastOneBundle){maybeReportErrorToGecko(`[fluent] Request for keys failed because no resource bundles got generated.\n keys: ${JSON.stringify(keys)}.\n resourceIds: ${JSON.stringify(resourceIds)}.`);}
return translations;},formatMessages(resourceIds,bundles,keys){return this.formatWithFallback(resourceIds,bundles,keys,messageFromBundle);},formatMessagesSync(resourceIds,bundles,keys){return this.formatWithFallbackSync(resourceIds,bundles,keys,messageFromBundle);},formatValues(resourceIds,bundles,keys){return this.formatWithFallback(resourceIds,bundles,keys,valueFromBundle);},formatValuesSync(resourceIds,bundles,keys){return this.formatWithFallbackSync(resourceIds,bundles,keys,valueFromBundle);},async formatValue(resourceIds,bundles,id,args){const[val]=await this.formatValues(resourceIds,bundles,[{id,args}]);return val;},formatValueSync(resourceIds,bundles,id,args){const[val]=this.formatValuesSync(resourceIds,bundles,[{id,args}]);return val;},generateBundles(resourceIds,isSync,eager=false,generateBundles=defaultGenerateBundles,generateBundlesSync=defaultGenerateBundlesSync){let generateMessages=isSync?generateBundlesSync:generateBundles;let bundles=this.cached(generateMessages(resourceIds),isSync);if(eager){


const appLocale=Services.locale.appLocaleAsBCP47;const lastFallback=Services.locale.lastFallbackLocale;const prefetchCount=appLocale===lastFallback?1:2;bundles.touchNext(prefetchCount);}
return bundles;},}
function valueFromBundle(bundle,errors,message,args){if(message.value){return bundle.formatPattern(message.value,args,errors);}
return null;}
function messageFromBundle(bundle,errors,message,args){const formatted={value:null,attributes:null,};if(message.value){formatted.value=bundle.formatPattern(message.value,args,errors);}
let attrNames=Object.keys(message.attributes);if(attrNames.length>0){formatted.attributes=new Array(attrNames.length);for(let[i,name]of attrNames.entries()){let value=bundle.formatPattern(message.attributes[name],args,errors);formatted.attributes[i]={name,value};}}
return formatted;}
function keysFromBundle(method,bundle,keys,translations){const messageErrors=[];const missingIds=new Set();keys.forEach((key,i)=>{let id;let args=undefined;if(typeof key=="object"&&"id"in key){id=String(key.id);args=key.args;}else{id=String(key);}
if(translations[i]!==null){return;}
let message=bundle.getMessage(id);if(message){messageErrors.length=0;translations[i]=method(bundle,messageErrors,message,args);if(messageErrors.length>0){const locale=bundle.locales[0];const errors=messageErrors.join(", ");maybeReportErrorToGecko(`[fluent][resolver] errors in ${locale}/${id}: ${errors}.`);}}else{missingIds.add(id);}});return missingIds;}
this.Localization=Localization;var EXPORTED_SYMBOLS=["Localization"];