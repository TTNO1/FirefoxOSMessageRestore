//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{ManifestObtainer}=ChromeUtils.import("resource://gre/modules/ManifestObtainer.jsm");const{ManifestIcons}=ChromeUtils.import("resource://gre/modules/ManifestIcons.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"JSONFile","resource://gre/modules/JSONFile.jsm");function generateHash(aString){const cryptoHash=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);cryptoHash.init(Ci.nsICryptoHash.MD5);const stringStream=Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);stringStream.data=aString;cryptoHash.updateFromStream(stringStream,-1);return cryptoHash.finish(true).replace(/\//g,"-");}
function stripQuery(url){return url.split("?")[0];}
const MANIFESTS_DIR=OS.Path.join(OS.Constants.Path.profileDir,"manifests");
const MANIFESTS_FILE="manifest-scopes.json";class Manifest{constructor(browser,manifestUrl){this._manifestUrl=manifestUrl;const fileName=generateHash(manifestUrl)+".json";this._path=OS.Path.join(MANIFESTS_DIR,fileName);this.browser=browser;}
get browser(){return this._browser;}
set browser(aBrowser){this._browser=aBrowser;}
async initialize(){this._store=new JSONFile({path:this._path,saveDelayMs:100});await this._store.load();}
async prefetch(browser){const manifestData=await ManifestObtainer.browserObtainManifest(browser);const icon=await ManifestIcons.browserFetchIcon(browser,manifestData,192);const data={installed:false,manifest:manifestData,cached_icon:icon,};return data;}
async install(){const manifestData=await ManifestObtainer.browserObtainManifest(this._browser);this._store.data={installed:true,manifest:manifestData,};Manifests.manifestInstalled(this);this._store.saveSoon();}
async icon(expectedSize){if("cached_icon"in this._store.data){return this._store.data.cached_icon;}
const icon=await ManifestIcons.browserFetchIcon(this._browser,this._store.data.manifest,expectedSize); this._store.data.cached_icon=icon;this._store.saveSoon();return icon;}
get scope(){const scope=this._store.data.manifest.scope||this._store.data.manifest.start_url;return stripQuery(scope);}
get name(){return(this._store.data.manifest.short_name||this._store.data.manifest.name||this._store.data.manifest.short_url);}
get url(){return this._manifestUrl;}
get installed(){return(this._store.data&&this._store.data.installed)||false;}
get start_url(){return this._store.data.manifest.start_url;}
get path(){return this._path;}}
var Manifests={async _initialize(){if(this._readyPromise){return this._readyPromise;} 
this._readyPromise=(async()=>{ await OS.File.makeDir(MANIFESTS_DIR,{ignoreExisting:true}); this._path=OS.Path.join(OS.Constants.Path.profileDir,MANIFESTS_FILE);this._store=new JSONFile({path:this._path});await this._store.load(); if(!this._store.data.hasOwnProperty("scopes")){this._store.data.scopes=new Map();}})();
 this.manifestObjs=new Map();return this._readyPromise;},
 manifestInstalled(manifest){this._store.data.scopes[manifest.scope]=manifest.url;this._store.saveSoon();},
 findManifestUrl(url){for(let scope in this._store.data.scopes){if(url.startsWith(scope)){return this._store.data.scopes[scope];}}
return null;},
 async getManifest(browser,manifestUrl){ if(!this._readyPromise){await this._initialize();}

 
if(!manifestUrl){const url=stripQuery(browser.currentURI.spec);manifestUrl=this.findManifestUrl(url);} 
if(manifestUrl===null){return null;} 
if(this.manifestObjs.has(manifestUrl)){const manifest=this.manifestObjs.get(manifestUrl);if(manifest.browser!==browser){manifest.browser=browser;}
return manifest;} 
const manifest=new Manifest(browser,manifestUrl);this.manifestObjs.set(manifestUrl,manifest);await manifest.initialize();return manifest;},};var EXPORTED_SYMBOLS=["Manifests"];