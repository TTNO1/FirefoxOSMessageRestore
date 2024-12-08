//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");XPCOMUtils.defineLazyModuleGetters(this,{ExtensionParent:"resource://gre/modules/ExtensionParent.jsm",JSONFile:"resource://gre/modules/JSONFile.jsm",OS:"resource://gre/modules/osfile.jsm",});XPCOMUtils.defineLazyGetter(this,"StartupCache",()=>ExtensionParent.StartupCache);ChromeUtils.defineModuleGetter(this,"KeyValueService","resource://gre/modules/kvstore.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");XPCOMUtils.defineLazyGetter(this,"Management",()=>ExtensionParent.apiManager);var EXPORTED_SYMBOLS=["ExtensionPermissions"];const FILE_NAME="extension-preferences.json";function emptyPermissions(){return{permissions:[],origins:[]};}
const DEFAULT_VALUE=JSON.stringify(emptyPermissions());const VERSION_KEY="_version";const VERSION_VALUE=1;const KEY_PREFIX="id-";let prefs;class LegacyPermissionStore{async lazyInit(){if(!this._initPromise){this._initPromise=this._init();}
return this._initPromise;}
async _init(){let path=OS.Path.join(OS.Constants.Path.profileDir,FILE_NAME);prefs=new JSONFile({path});prefs.data={};try{let{buffer}=await OS.File.read(path);prefs.data=JSON.parse(new TextDecoder().decode(buffer));}catch(e){if(!e.becauseNoSuchFile){Cu.reportError(e);}}}
async has(extensionId){await this.lazyInit();return!!prefs.data[extensionId];}
async get(extensionId){await this.lazyInit();let perms=prefs.data[extensionId];if(!perms){perms=emptyPermissions();}
return perms;}
async put(extensionId,permissions){await this.lazyInit();prefs.data[extensionId]=permissions;prefs.saveSoon();}
async delete(extensionId){await this.lazyInit();if(prefs.data[extensionId]){delete prefs.data[extensionId];prefs.saveSoon();}}
async uninitForTest(){if(!this._initPromise){return;}
await this._initPromise;await prefs.finalize();prefs=null;this._initPromise=null;}
async resetVersionForTest(){throw new Error("Not supported");}}
class PermissionStore{async _init(){const storePath=FileUtils.getDir("ProfD",["extension-store"]).path; await OS.File.makeDir(storePath,{ignoreExisting:true});this._store=await KeyValueService.getOrCreate(storePath,"permissions");if(!(await this._store.has(VERSION_KEY))){await this.maybeMigrateData();}}
lazyInit(){if(!this._initPromise){this._initPromise=this._init();}
return this._initPromise;}
validateMigratedData(json){let data={};for(let[extensionId,permissions]of Object.entries(json)){
 if("permissions"in permissions&&"origins"in permissions&&(permissions.permissions.length||permissions.origins.length)){data[extensionId]=permissions;}}
return data;}
async maybeMigrateData(){let migrationWasSuccessful=false;let oldStore=OS.Path.join(OS.Constants.Path.profileDir,FILE_NAME);try{await this.migrateFrom(oldStore);migrationWasSuccessful=true;}catch(e){if(!e.becauseNoSuchFile){Cu.reportError(e);}}
await this._store.put(VERSION_KEY,VERSION_VALUE);if(migrationWasSuccessful){OS.File.remove(oldStore);}}
async migrateFrom(oldStore){
 await this._store.clear();let{buffer}=await OS.File.read(oldStore);let json=JSON.parse(new TextDecoder().decode(buffer));let data=this.validateMigratedData(json);if(data){let entries=Object.entries(data).map(([extensionId,permissions])=>[this.makeKey(extensionId),JSON.stringify(permissions),]);if(entries.length){await this._store.writeMany(entries);}}}
makeKey(extensionId){
return KEY_PREFIX+extensionId;}
async has(extensionId){await this.lazyInit();return this._store.has(this.makeKey(extensionId));}
async get(extensionId){await this.lazyInit();return this._store.get(this.makeKey(extensionId),DEFAULT_VALUE).then(JSON.parse);}
async put(extensionId,permissions){await this.lazyInit();return this._store.put(this.makeKey(extensionId),JSON.stringify(permissions));}
async delete(extensionId){await this.lazyInit();return this._store.delete(this.makeKey(extensionId));}
async resetVersionForTest(){await this.lazyInit();return this._store.delete(VERSION_KEY);}
async uninitForTest(){
 return this._initPromise;}}
function createStore(useRkv=AppConstants.NIGHTLY_BUILD){if(useRkv){return new PermissionStore();}
return new LegacyPermissionStore();}
let store=createStore();var ExtensionPermissions={async _update(extensionId,perms){await store.put(extensionId,perms);return StartupCache.permissions.set(extensionId,perms);},async _get(extensionId){return store.get(extensionId);},async _getCached(extensionId){return StartupCache.permissions.get(extensionId,()=>this._get(extensionId));},get(extensionId){return this._getCached(extensionId);},_fixupAllUrlsPerms(perms){if(perms.origins.includes("<all_urls>")){perms.permissions.push("<all_urls>");}else if(perms.permissions.includes("<all_urls>")){perms.origins.push("<all_urls>");}},async add(extensionId,perms,emitter){let{permissions,origins}=await this._get(extensionId);let added=emptyPermissions();this._fixupAllUrlsPerms(perms);for(let perm of perms.permissions){if(!permissions.includes(perm)){added.permissions.push(perm);permissions.push(perm);}}
for(let origin of perms.origins){origin=new MatchPattern(origin,{ignorePath:true}).pattern;if(!origins.includes(origin)){added.origins.push(origin);origins.push(origin);}}
if(added.permissions.length||added.origins.length){await this._update(extensionId,{permissions,origins});Management.emit("change-permissions",{extensionId,added});if(emitter){emitter.emit("add-permissions",added);}}},async remove(extensionId,perms,emitter){let{permissions,origins}=await this._get(extensionId);let removed=emptyPermissions();this._fixupAllUrlsPerms(perms);for(let perm of perms.permissions){let i=permissions.indexOf(perm);if(i>=0){removed.permissions.push(perm);permissions.splice(i,1);}}
for(let origin of perms.origins){origin=new MatchPattern(origin,{ignorePath:true}).pattern;let i=origins.indexOf(origin);if(i>=0){removed.origins.push(origin);origins.splice(i,1);}}
if(removed.permissions.length||removed.origins.length){await this._update(extensionId,{permissions,origins});Management.emit("change-permissions",{extensionId,removed});if(emitter){emitter.emit("remove-permissions",removed);}}},async removeAll(extensionId){StartupCache.permissions.delete(extensionId);let removed=store.get(extensionId);await store.delete(extensionId);Management.emit("change-permissions",{extensionId,removed:await removed,});}, async _has(extensionId){return store.has(extensionId);}, async _resetVersion(){await store.resetVersionForTest();}, _useLegacyStorageBackend:false, async _uninit(){await store.uninitForTest();store=createStore(!this._useLegacyStorageBackend);},addListener(listener){Management.on("change-permissions",listener);},removeListener(listener){Management.off("change-permissions",listener);},};