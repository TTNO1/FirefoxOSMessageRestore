//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["OfflineAppCacheHelper"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var OfflineAppCacheHelper={clear(){var appCacheStorage=Services.cache2.appCacheStorage(Services.loadContextInfo.default,null);try{appCacheStorage.asyncEvictStorage(null);}catch(er){}},};