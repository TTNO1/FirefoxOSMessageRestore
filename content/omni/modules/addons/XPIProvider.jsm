"use strict";var EXPORTED_SYMBOLS=["XPIProvider","XPIInternal"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{AddonManager,AddonManagerPrivate}=ChromeUtils.import("resource://gre/modules/AddonManager.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AddonSettings:"resource://gre/modules/addons/AddonSettings.jsm",AppConstants:"resource://gre/modules/AppConstants.jsm",AsyncShutdown:"resource://gre/modules/AsyncShutdown.jsm",Dictionary:"resource://gre/modules/Extension.jsm",Extension:"resource://gre/modules/Extension.jsm",Langpack:"resource://gre/modules/Extension.jsm",FileUtils:"resource://gre/modules/FileUtils.jsm",OS:"resource://gre/modules/osfile.jsm",JSONFile:"resource://gre/modules/JSONFile.jsm",TelemetrySession:"resource://gre/modules/TelemetrySession.jsm",XPIDatabase:"resource://gre/modules/addons/XPIDatabase.jsm",XPIDatabaseReconcile:"resource://gre/modules/addons/XPIDatabase.jsm",XPIInstall:"resource://gre/modules/addons/XPIInstall.jsm",});XPCOMUtils.defineLazyServiceGetters(this,{aomStartup:["@mozilla.org/addons/addon-manager-startup;1","amIAddonManagerStartup",],resProto:["@mozilla.org/network/protocol;1?name=resource","nsISubstitutingProtocolHandler",],spellCheck:["@mozilla.org/spellchecker/engine;1","mozISpellCheckingEngine"],timerManager:["@mozilla.org/updates/timer-manager;1","nsIUpdateTimerManager",],});const nsIFile=Components.Constructor("@mozilla.org/file/local;1","nsIFile","initWithPath");const FileInputStream=Components.Constructor("@mozilla.org/network/file-input-stream;1","nsIFileInputStream","init");const PREF_DB_SCHEMA="extensions.databaseSchema";const PREF_PENDING_OPERATIONS="extensions.pendingOperations";const PREF_EM_ENABLED_SCOPES="extensions.enabledScopes";const PREF_EM_STARTUP_SCAN_SCOPES="extensions.startupScanScopes";const PREF_XPI_SIGNATURES_REQUIRED="xpinstall.signatures.required";const PREF_LANGPACK_SIGNATURES="extensions.langpacks.signatures.required";const PREF_INSTALL_DISTRO_ADDONS="extensions.installDistroAddons";const PREF_BRANCH_INSTALLED_ADDON="extensions.installedDistroAddon.";const PREF_SYSTEM_ADDON_SET="extensions.systemAddonSet";const PREF_EM_LAST_APP_BUILD_ID="extensions.lastAppBuildId";const BUILT_IN_ADDONS_URI="chrome://browser/content/built_in_addons.json";const URI_EXTENSION_STRINGS="chrome://mozapps/locale/extensions/extensions.properties";const DIR_EXTENSIONS="extensions";const DIR_SYSTEM_ADDONS="features";const DIR_APP_SYSTEM_PROFILE="system-extensions";const DIR_STAGE="staged";const DIR_TRASH="trash";const FILE_XPI_STATES="addonStartup.json.lz4";const KEY_PROFILEDIR="ProfD";const KEY_ADDON_APP_DIR="XREAddonAppDir";const KEY_APP_DISTRIBUTION="XREAppDist";const KEY_APP_FEATURES="XREAppFeat";const KEY_APP_PROFILE="app-profile";const KEY_APP_SYSTEM_PROFILE="app-system-profile";const KEY_APP_SYSTEM_ADDONS="app-system-addons";const KEY_APP_SYSTEM_DEFAULTS="app-system-defaults";const KEY_APP_BUILTINS="app-builtin";const KEY_APP_GLOBAL="app-global";const KEY_APP_SYSTEM_LOCAL="app-system-local";const KEY_APP_SYSTEM_SHARE="app-system-share";const KEY_APP_SYSTEM_USER="app-system-user";const KEY_APP_TEMPORARY="app-temporary";const TEMPORARY_ADDON_SUFFIX="@temporary-addon";const STARTUP_MTIME_SCOPES=[KEY_APP_GLOBAL,KEY_APP_SYSTEM_LOCAL,KEY_APP_SYSTEM_SHARE,KEY_APP_SYSTEM_USER,];const NOTIFICATION_FLUSH_PERMISSIONS="flush-pending-permissions";const XPI_PERMISSION="install";const XPI_SIGNATURE_CHECK_PERIOD=24*60*60;const DB_SCHEMA=33;XPCOMUtils.defineLazyPreferenceGetter(this,"enabledScopesPref",PREF_EM_ENABLED_SCOPES,AddonManager.SCOPE_ALL);Object.defineProperty(this,"enabledScopes",{get(){ return enabledScopesPref|AddonManager.SCOPE_PROFILE;},});function encoded(strings,...values){let result=[];for(let[i,string]of strings.entries()){result.push(string);if(i<values.length){result.push(encodeURIComponent(values[i]));}}
return result.join("");}
const BOOTSTRAP_REASONS={APP_STARTUP:1,APP_SHUTDOWN:2,ADDON_ENABLE:3,ADDON_DISABLE:4,ADDON_INSTALL:5,ADDON_UNINSTALL:6,ADDON_UPGRADE:7,ADDON_DOWNGRADE:8,};const ALL_EXTERNAL_TYPES=new Set(["dictionary","extension","locale","theme",]);var gGlobalScope=this;var gIDTest=/^(\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}|[a-z0-9-\._]*\@[a-z0-9-\._]+)$/i;const{Log}=ChromeUtils.import("resource://gre/modules/Log.jsm");const LOGGER_ID="addons.xpi";
var logger=Log.repository.getLogger(LOGGER_ID);XPCOMUtils.defineLazyGetter(this,"gStartupScanScopes",()=>{let appBuildID=Services.appinfo.appBuildID;let oldAppBuildID=Services.prefs.getCharPref(PREF_EM_LAST_APP_BUILD_ID,"");Services.prefs.setCharPref(PREF_EM_LAST_APP_BUILD_ID,appBuildID);if(appBuildID!==oldAppBuildID){ return AddonManager.SCOPE_ALL;}
return Services.prefs.getIntPref(PREF_EM_STARTUP_SCAN_SCOPES,0);});function awaitPromise(promise){let success=undefined;let result=null;promise.then(val=>{success=true;result=val;},val=>{success=false;result=val;});Services.tm.spinEventLoopUntil(()=>success!==undefined);if(!success){throw result;}
return result;}
function getFile(path,base=null){
try{return new nsIFile(path);}catch(e){

}
let file=base.clone();file.appendRelativePath(path);return file;}
function isXPI(filename,strict){if(strict){return filename.endsWith(".xpi");}
let ext=filename.slice(-4).toLowerCase();return ext===".xpi"||ext===".zip";}
function getExpectedID(file){let{leafName}=file;let id=isXPI(leafName,true)?leafName.slice(0,-4):leafName;if(gIDTest.test(id)){return id;}
return null;}
function canRunInSafeMode(aAddon){let location=aAddon.location||null;if(!location){return false;}



return location.isTemporary||location.isSystem||location.isBuiltin;}
function getURIForResourceInFile(aFile,aPath){if(!isXPI(aFile.leafName)){let resource=aFile.clone();if(aPath){aPath.split("/").forEach(part=>resource.append(part));}
return Services.io.newFileURI(resource);}
return buildJarURI(aFile,aPath);}
function buildJarURI(aJarfile,aPath){let uri=Services.io.newFileURI(aJarfile);uri="jar:"+uri.spec+"!/"+aPath;return Services.io.newURI(uri);}
function maybeResolveURI(uri){if(uri.schemeIs("resource")){return Services.io.newURI(resProto.resolveURI(uri));}
return uri;}
function*iterDirectory(aDir){let dirEnum;try{dirEnum=aDir.directoryEntries;let file;while((file=dirEnum.nextFile)){yield file;}}catch(e){if(aDir.exists()){logger.warn(`Can't iterate directory ${aDir.path}`,e);}}finally{if(dirEnum){dirEnum.close();}}}
function migrateAddonLoader(addon){if(addon.hasOwnProperty("loader")){return false;}
switch(addon.type){case"extension":case"dictionary":case"locale":case"theme":addon.loader="bootstrap";break;case"webextension":addon.type="extension";addon.loader=null;break;case"webextension-dictionary":addon.type="dictionary";addon.loader=null;break;case"webextension-langpack":addon.type="locale";addon.loader=null;break;case"webextension-theme":addon.type="theme";addon.loader=null;break;default:logger.warn(`Not converting unknown addon type ${addon.type}`);}
return true;}
const JSON_FIELDS=Object.freeze(["dependencies","enabled","file","loader","lastModifiedTime","path","rootURI","runInSafeMode","signedState","signedDate","startupData","telemetryKey","type","version",]);class XPIState{constructor(location,id,saved={}){this.location=location;this.id=id;this.type="extension";for(let prop of JSON_FIELDS){if(prop in saved){this[prop]=saved[prop];}}
if(!("rootURI"in this)&&this.file){this.rootURI=getURIForResourceInFile(this.file,"").spec;}
if(!this.telemetryKey){this.telemetryKey=this.getTelemetryKey();}
if(saved.currentModifiedTime&&saved.currentModifiedTime!=this.lastModifiedTime){this.lastModifiedTime=saved.currentModifiedTime;}else if(saved.currentModifiedTime===null){this.missing=true;}}
get mtime(){return this.lastModifiedTime;}
get active(){return this.enabled;}
get path(){return this.file&&this.file.path;}
set path(path){this.file=path?getFile(path,this.location.dir):null;}
get relativePath(){if(this.location.dir&&this.location.dir.contains(this.file)){let path=this.file.getRelativePath(this.location.dir);if(AppConstants.platform=="win"){path=path.replace(/\//g,"\\");}
return path;}
return this.path;}
toJSON(){let json={dependencies:this.dependencies,enabled:this.enabled,lastModifiedTime:this.lastModifiedTime,loader:this.loader,path:this.relativePath,rootURI:this.rootURI,runInSafeMode:this.runInSafeMode,signedState:this.signedState,signedDate:this.signedDate,telemetryKey:this.telemetryKey,version:this.version,};if(this.type!="extension"){json.type=this.type;}
if(this.startupData){json.startupData=this.startupData;}
return json;}
get isWebExtension(){return this.loader==null;}
getModTime(aFile){let mtime=0;try{
mtime=aFile.clone().lastModifiedTime;}catch(e){logger.warn("Can't get modified time of ${path}",aFile,e);}
let changed=mtime!=this.lastModifiedTime;this.lastModifiedTime=mtime;return changed;}
getTelemetryKey(){return encoded`${this.id}:${this.version}`;}
get resolvedRootURI(){return maybeResolveURI(Services.io.newURI(this.rootURI));}
syncWithDB(aDBAddon,aUpdated=false){logger.debug("Updating XPIState for "+JSON.stringify(aDBAddon));
let mustGetMod=aDBAddon.visible&&!aDBAddon.disabled&&!this.enabled;this.enabled=aDBAddon.visible&&!aDBAddon.disabled;this.version=aDBAddon.version;this.type=aDBAddon.type;this.loader=aDBAddon.loader;if(aDBAddon.startupData){this.startupData=aDBAddon.startupData;}
this.telemetryKey=this.getTelemetryKey();this.dependencies=aDBAddon.dependencies;this.runInSafeMode=canRunInSafeMode(aDBAddon);this.signedState=aDBAddon.signedState;this.signedDate=aDBAddon.signedDate;this.file=aDBAddon._sourceBundle;this.rootURI=aDBAddon.rootURI;if((aUpdated||mustGetMod)&&this.file){this.getModTime(this.file);if(this.lastModifiedTime!=aDBAddon.updateDate){aDBAddon.updateDate=this.lastModifiedTime;if(XPIDatabase.initialized){XPIDatabase.saveChanges();}}}}}
class XPIStateLocation extends Map{constructor(name,path,scope,saved){super();this.name=name;this.scope=scope;if(path instanceof Ci.nsIFile){this.dir=path;this.path=path.path;}else{this.path=path;this.dir=this.path&&new nsIFile(this.path);}
this.staged={};this.changed=false;



if(name===KEY_APP_PROFILE){OS.File.makeDir(this.path,{ignoreExisting:true});}
if(saved){this.restore(saved);}
this._installler=undefined;}
hasPrecedence(otherLocation){let locations=Array.from(XPIStates.locations());return locations.indexOf(this)<=locations.indexOf(otherLocation);}
get installer(){if(this._installer===undefined){this._installer=this.makeInstaller();}
return this._installer;}
makeInstaller(){return null;}
restore(saved){if(!this.path&&saved.path){this.path=saved.path;this.dir=new nsIFile(this.path);}
this.staged=saved.staged||{};this.changed=saved.changed||false;for(let[id,data]of Object.entries(saved.addons||{})){let xpiState=this._addState(id,data);
if(!this.path||this.path==saved.path){xpiState.wasRestored=true;}}}
toJSON(){let json={addons:{},staged:this.staged,};if(this.path){json.path=this.path;}
if(STARTUP_MTIME_SCOPES.includes(this.name)){json.checkStartupModifications=true;}
for(let[id,addon]of this.entries()){json.addons[id]=addon;}
return json;}
get hasStaged(){for(let key in this.staged){return true;}
return false;}
_addState(addonId,saved){let xpiState=new XPIState(this,addonId,saved);this.set(addonId,xpiState);return xpiState;}
addAddon(addon){logger.debug("XPIStates adding add-on ${id} in ${location}: ${path}",addon);let xpiState=this._addState(addon.id,{file:addon._sourceBundle});xpiState.syncWithDB(addon,true);XPIProvider.addTelemetry(addon.id,{location:this.name});}
removeAddon(aId){if(this.has(aId)){this.delete(aId);XPIStates.save();}}
addFile(addonId,file){let xpiState=this._addState(addonId,{enabled:false,file:file.clone(),});xpiState.getModTime(xpiState.file);return xpiState;}
stageAddon(addonId,metadata){this.staged[addonId]=metadata;XPIStates.save();}
unstageAddon(addonId){if(addonId in this.staged){delete this.staged[addonId];XPIStates.save();}}*getStagedAddons(){for(let[id,metadata]of Object.entries(this.staged)){yield[id,metadata];}}
isLinkedAddon(aId){if(!this.dir){return true;}
return this.has(aId)&&!this.dir.contains(this.get(aId).file);}
get isTemporary(){return false;}
get isSystem(){return false;}
get isBuiltin(){return false;}
get hidden(){return this.isBuiltin;}

get enumerable(){return true;}}
class TemporaryLocation extends XPIStateLocation{constructor(name){super(name,null,AddonManager.SCOPE_TEMPORARY);this.locked=false;}
makeInstaller(){
return{installAddon(){},uninstallAddon(){},};}
toJSON(){return{};}
get isTemporary(){return true;}
get enumerable(){return false;}}
var TemporaryInstallLocation=new TemporaryLocation(KEY_APP_TEMPORARY);var BuiltInLocation=new(class _BuiltInLocation extends XPIStateLocation{constructor(){super(KEY_APP_BUILTINS,null,AddonManager.SCOPE_APPLICATION);this.locked=false;}


makeInstaller(){return{installAddon(){},uninstallAddon(){},};}
get hidden(){return false;}
get isBuiltin(){return true;}
get enumerable(){return false;}

isLinkedAddon(){return false;}})();class DirectoryLocation extends XPIStateLocation{constructor(name,dir,scope,locked=true,system=false){super(name,dir,scope);this.locked=locked;this._isSystem=system;}
makeInstaller(){if(this.locked){return null;}
return new XPIInstall.DirectoryInstaller(this);}
_readLinkFile(aFile){let linkedDirectory;if(aFile.isSymlink()){linkedDirectory=aFile.clone();try{linkedDirectory.normalize();}catch(e){logger.warn(`Symbolic link ${aFile.path} points to a path `+`which does not exist`);return null;}}else{let fis=new FileInputStream(aFile,-1,-1,false);let line={};fis.QueryInterface(Ci.nsILineInputStream).readLine(line);fis.close();if(line.value){linkedDirectory=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);try{linkedDirectory.initWithPath(line.value);}catch(e){linkedDirectory.setRelativeDescriptor(aFile.parent,line.value);}}}
if(linkedDirectory){if(!linkedDirectory.exists()){logger.warn(`File pointer ${aFile.path} points to ${linkedDirectory.path} `+"which does not exist");return null;}
if(!linkedDirectory.isDirectory()){logger.warn(`File pointer ${aFile.path} points to ${linkedDirectory.path} `+"which is not a directory");return null;}
return linkedDirectory;}
logger.warn(`File pointer ${aFile.path} does not contain a path`);return null;}
readAddons(){let addons=new Map();if(!this.dir){return addons;}


for(let entry of Array.from(iterDirectory(this.dir))){let id=getExpectedID(entry);if(!id){if(![DIR_STAGE,DIR_TRASH].includes(entry.leafName)){logger.debug("Ignoring file: name is not a valid add-on ID: ${}",entry.path);}
continue;}
if(id==entry.leafName&&(entry.isFile()||entry.isSymlink())){let newEntry=this._readLinkFile(entry);if(!newEntry){logger.debug(`Deleting stale pointer file ${entry.path}`);try{entry.remove(true);}catch(e){logger.warn(`Failed to remove stale pointer file ${entry.path}`,e);}
continue;}
entry=newEntry;}
addons.set(id,entry);}
return addons;}
get isSystem(){return this._isSystem;}}
class SystemAddonDefaults extends DirectoryLocation{readAddons(){let addons=new Map();let manifest=XPIProvider.builtInAddons;if(!("system"in manifest)){logger.debug("No list of valid system add-ons found.");return addons;}
for(let id of manifest.system){let file=this.dir.clone();file.append(`${id}.xpi`);if(!AppConstants.MOZILLA_OFFICIAL&&!file.exists()){file=this.dir.clone();file.append(`${id}`);}
addons.set(id,file);}
return addons;}
get isSystem(){return true;}
get isBuiltin(){return true;}}
class SystemAddonLocation extends DirectoryLocation{constructor(name,dir,scope,resetSet){let addonSet=SystemAddonLocation._loadAddonSet();let directory=null;
if(addonSet.directory){directory=getFile(addonSet.directory,dir);logger.info(`SystemAddonLocation scanning directory ${directory.path}`);}else{logger.info("SystemAddonLocation directory is missing");}
super(name,directory,scope,false);this._addonSet=addonSet;this._baseDir=dir;if(resetSet){this.installer.resetAddonSet();}}
makeInstaller(){if(this.locked){return null;}
return new XPIInstall.SystemAddonInstaller(this);}
static _loadAddonSet(){try{let setStr=Services.prefs.getStringPref(PREF_SYSTEM_ADDON_SET,null);if(setStr){let addonSet=JSON.parse(setStr);if(typeof addonSet=="object"&&addonSet.schema==1){return addonSet;}}}catch(e){logger.error("Malformed system add-on set, resetting.");}
return{schema:1,addons:{}};}
readAddons(){ if(Services.appinfo.inSafeMode){return new Map();}
let addons=super.readAddons(); for(let id of addons.keys()){if(!(id in this._addonSet.addons)){addons.delete(id);}}
return addons;}
isActive(){return this.dir!=null;}
get isSystem(){return true;}
get isBuiltin(){return true;}}
class WinRegLocation extends XPIStateLocation{constructor(name,rootKey,scope){super(name,undefined,scope);this.locked=true;this._rootKey=rootKey;}
get _appKeyPath(){let appVendor=Services.appinfo.vendor;let appName=Services.appinfo.name; if(appVendor==""&&AppConstants.MOZ_APP_NAME=="thunderbird"){appVendor="Mozilla";}
return`SOFTWARE\\${appVendor}\\${appName}`;}
readAddons(){let addons=new Map();let path=`${this._appKeyPath}\\Extensions`;let key=Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey);
try{key.open(this._rootKey,path,Ci.nsIWindowsRegKey.ACCESS_READ);}catch(e){return addons;}
try{let count=key.valueCount;for(let i=0;i<count;++i){let id=key.getValueName(i);let file=new nsIFile(key.readStringValue(id));if(!file.exists()){logger.warn(`Ignoring missing add-on in ${file.path}`);continue;}
addons.set(id,file);}}finally{key.close();}
return addons;}}
var XPIStates={db:new Map(),_jsonFile:null,sideLoadedAddons:new Map(),get size(){let count=0;for(let location of this.locations()){count+=location.size;}
return count;},loadExtensionState(){let state;try{state=aomStartup.readStartupData();}catch(e){logger.warn("Error parsing extensions state: ${error}",{error:e});}

let done=false;for(let location of Object.values(state||{})){for(let data of Object.values(location.addons||{})){if(!migrateAddonLoader(data)){done=true;break;}}
if(done){break;}}
logger.debug("Loaded add-on state: ${}",state);return state||{};},scanForChanges(ignoreSideloads=true){let oldState=this.initialStateData||this.loadExtensionState();
let shouldRestoreLocationData=!this.initialStateData;this.initialStateData=oldState;let changed=false;let oldLocations=new Set(Object.keys(oldState));for(let loc of XPIStates.locations()){oldLocations.delete(loc.name);if(shouldRestoreLocationData&&oldState[loc.name]){loc.restore(oldState[loc.name]);}
changed=changed||loc.changed;if(ignoreSideloads&&!(loc.scope&gStartupScanScopes)){continue;}
if(!loc.enumerable){continue;}


if(!loc.size&&!(loc.scope&AddonSettings.SCOPES_SIDELOAD)){continue;}
let knownIds=new Set(loc.keys());for(let[id,file]of loc.readAddons()){knownIds.delete(id);let xpiState=loc.get(id);if(!xpiState){

if(!loc.isSystem&&!(loc.scope&AddonSettings.SCOPES_SIDELOAD)){continue;}
logger.debug("New add-on ${id} in ${loc}",{id,loc:loc.name});changed=true;xpiState=loc.addFile(id,file);if(!loc.isSystem){this.sideLoadedAddons.set(id,xpiState);}}else{let addonChanged=xpiState.getModTime(file)||file.path!=xpiState.path;xpiState.file=file.clone();if(addonChanged){changed=true;logger.debug("Changed add-on ${id} in ${loc}",{id,loc:loc.name,});}else{logger.debug("Existing add-on ${id} in ${loc}",{id,loc:loc.name,});}}
XPIProvider.addTelemetry(id,{location:loc.name});}
for(let id of knownIds){loc.delete(id);changed=true;}}

changed=changed||oldLocations.size>0;logger.debug("scanForChanges changed: ${rv}, state: ${state}",{rv:changed,state:this.db,});return changed;},locations(){return this.db.values();},addLocation(name,location){if(this.db.has(name)){throw new Error(`Trying to add duplicate location: ${name}`);}
this.db.set(name,location);},getLocation(name){return this.db.get(name);},getAddon(aLocation,aId){let location=this.db.get(aLocation);return location&&location.get(aId);},findAddon(aId,aFilter=location=>true){
for(let location of this.locations()){if(!aFilter(location)){continue;}
if(location.has(aId)){return location.get(aId);}}
return undefined;},*enabledAddons(){for(let location of this.locations()){for(let entry of location.values()){if(entry.enabled){yield entry;}}}},addAddon(aAddon){aAddon.location.addAddon(aAddon);},save(){if(!this._jsonFile){this._jsonFile=new JSONFile({path:OS.Path.join(OS.Constants.Path.profileDir,FILE_XPI_STATES),finalizeAt:AddonManagerPrivate.finalShutdown,compression:"lz4",});this._jsonFile.data=this;}
this._jsonFile.saveSoon();},toJSON(){let data={};for(let[key,loc]of this.db.entries()){if(!loc.isTemporary&&(loc.size||loc.hasStaged)){data[key]=loc;}}
return data;},removeAddon(aLocation,aId){logger.debug(`Removing XPIState for ${aLocation}: ${aId}`);let location=this.db.get(aLocation);if(location){location.removeAddon(aId);this.save();}},disableAddon(aId){logger.debug(`Disabling XPIState for ${aId}`);let state=this.findAddon(aId);if(state){state.enabled=false;}},};class BootstrapScope{constructor(addon){if(!addon.id||!addon.version||!addon.type){throw new Error("Addon must include an id, version, and type");}
this.addon=addon;this.instanceID=null;this.scope=null;this.started=false;}
static get(addon){let scope=XPIProvider.activeAddons.get(addon.id);if(!scope){scope=new this(addon);}
return scope;}
get file(){return this.addon.file||this.addon._sourceBundle;}
get runInSafeMode(){return"runInSafeMode"in this.addon?this.addon.runInSafeMode:canRunInSafeMode(this.addon);}
fetchState(){if(this.scope&&this.scope.fetchState){return this.scope.fetchState();}
return null;}
async callBootstrapMethod(aMethod,aReason,aExtraParams={}){let{addon,runInSafeMode}=this;if(Services.appinfo.inSafeMode&&!runInSafeMode&&aMethod!=="uninstall"){return null;}
try{if(!this.scope){this.loadBootstrapScope(aReason);}
if(aMethod=="startup"||aMethod=="shutdown"){aExtraParams.instanceID=this.instanceID;}
let method=undefined;let{scope}=this;try{method=scope[aMethod];}catch(e){}
if(aMethod=="startup"){this.started=true;}else if(aMethod=="shutdown"){this.started=false;if(aReason!=BOOTSTRAP_REASONS.APP_SHUTDOWN){this._pendingDisable=true;for(let addon of XPIProvider.getDependentAddons(this.addon)){if(addon.active){await XPIDatabase.updateAddonDisabledState(addon);}}}}
let params={id:addon.id,version:addon.version,resourceURI:addon.resolvedRootURI,signedState:addon.signedState,temporarilyInstalled:addon.location.isTemporary,builtIn:addon.location.isBuiltin,isSystem:addon.location.isSystem,};if(aMethod=="startup"&&addon.startupData){params.startupData=addon.startupData;}
Object.assign(params,aExtraParams);let result;if(!method){logger.warn(`Add-on ${addon.id} is missing bootstrap method ${aMethod}`);}else{logger.debug(`Calling bootstrap method ${aMethod} on ${addon.id} version ${addon.version}`);this._beforeCallBootstrapMethod(aMethod,params,aReason);try{result=await method.call(scope,params,aReason);}catch(e){logger.warn(`Exception running bootstrap method ${aMethod} on ${addon.id}`,e);}}
return result;}finally{if(aMethod=="startup"&&aReason!=BOOTSTRAP_REASONS.APP_STARTUP){for(let addon of XPIProvider.getDependentAddons(this.addon)){XPIDatabase.updateAddonDisabledState(addon);}}}}
_beforeCallBootstrapMethod(){}
loadBootstrapScope(aReason){this.instanceID=Symbol(this.addon.id);this._pendingDisable=false;XPIProvider.activeAddons.set(this.addon.id,this);
if(aReason!==BOOTSTRAP_REASONS.APP_STARTUP){XPIProvider.addAddonsToCrashReporter();}
logger.debug(`Loading bootstrap scope from ${this.addon.rootURI}`);if(this.addon.isWebExtension){switch(this.addon.type){case"extension":case"theme":this.scope=Extension.getBootstrapScope();break;case"locale":this.scope=Langpack.getBootstrapScope();break;case"dictionary":this.scope=Dictionary.getBootstrapScope();break;default:throw new Error(`Unknown webextension type ${this.addon.type}`);}}else{let loader=AddonManagerPrivate.externalExtensionLoaders.get(this.addon.loader);if(!loader){throw new Error(`Cannot find loader for ${this.addon.loader}`);}
this.scope=loader.loadScope(this.addon);}}
unloadBootstrapScope(){XPIProvider.activeAddons.delete(this.addon.id);XPIProvider.addAddonsToCrashReporter();this.scope=null;this.startupPromise=null;this.instanceID=null;}
async startup(reason,aExtraParams){if(this.shutdownPromise){await this.shutdownPromise;}
this.startupPromise=this.callBootstrapMethod("startup",reason,aExtraParams);return this.startupPromise;}
async shutdown(reason,aExtraParams){this.shutdownPromise=this._shutdown(reason,aExtraParams);await this.shutdownPromise;this.shutdownPromise=null;}
async _shutdown(reason,aExtraParams){await this.startupPromise;return this.callBootstrapMethod("shutdown",reason,aExtraParams);}
async disable(){if(this.started){await this.shutdown(BOOTSTRAP_REASONS.ADDON_DISABLE);


if(!this.started){this.unloadBootstrapScope();}}}
install(reason=BOOTSTRAP_REASONS.ADDON_INSTALL,startup,extraArgs){return this._install(reason,false,startup,extraArgs);}
async _install(reason,callUpdate,startup,extraArgs){if(callUpdate){await this.callBootstrapMethod("update",reason,extraArgs);}else{this.callBootstrapMethod("install",reason,extraArgs);}
if(startup&&this.addon.active){await this.startup(reason,extraArgs);}else if(this.addon.disabled){this.unloadBootstrapScope();}}
uninstall(reason=BOOTSTRAP_REASONS.ADDON_UNINSTALL,extraArgs){return this._uninstall(reason,false,extraArgs);}
async _uninstall(reason,callUpdate,extraArgs){if(this.started){await this.shutdown(reason,extraArgs);}
if(!callUpdate){this.callBootstrapMethod("uninstall",reason,extraArgs);}
this.unloadBootstrapScope();if(this.file){XPIInstall.flushJarCache(this.file);}}
async update(newAddon,startup=false,updateCallback){let reason=XPIInstall.newVersionReason(this.addon.version,newAddon.version);let callUpdate=this.addon.isWebExtension&&newAddon.isWebExtension;

let existingAddon=this.addon;let extraArgs={oldVersion:existingAddon.version,newVersion:newAddon.version,};
if(callUpdate&&existingAddon.type==="extension"){if(this.addon instanceof XPIState){existingAddon=await XPIDatabase.getAddonByID(this.addon.id);}
if(newAddon instanceof XPIState){newAddon=await XPIInstall.loadManifestFromFile(newAddon.file,newAddon.location);}
Object.assign(extraArgs,{userPermissions:newAddon.userPermissions,optionalPermissions:newAddon.optionalPermissions,oldPermissions:existingAddon.userPermissions,oldOptionalPermissions:existingAddon.optionalPermissions,});}
await this._uninstall(reason,callUpdate,extraArgs);if(updateCallback){await updateCallback();}
this.addon=newAddon;return this._install(reason,callUpdate,startup,extraArgs);}}
let resolveDBReady;let dbReadyPromise=new Promise(resolve=>{resolveDBReady=resolve;});let resolveProviderReady;let providerReadyPromise=new Promise(resolve=>{resolveProviderReady=resolve;});var XPIProvider={get name(){return"XPIProvider";},BOOTSTRAP_REASONS:Object.freeze(BOOTSTRAP_REASONS), activeAddons:new Map(), _telemetryDetails:{},_closing:false,startupPromises:[],databaseReady:Promise.all([dbReadyPromise,providerReadyPromise]),
get isDBLoaded(){
return((Object.getOwnPropertyDescriptor(gGlobalScope,"XPIDatabase").value&&XPIDatabase.initialized)||false);},addonIsActive(addonId){let state=XPIStates.findAddon(addonId);return state&&state.enabled;},sortBootstrappedAddons(){function compare(a,b){if(a===b){return 0;}
return a<b?-1:1;}
let list=Array.from(XPIStates.enabledAddons());list.sort((a,b)=>compare(a.id,b.id));let addons={};for(let entry of list){addons[entry.id]=entry;}
let res=new Set();let seen=new Set();let add=addon=>{seen.add(addon.id);for(let id of addon.dependencies||[]){if(id in addons&&!seen.has(id)){add(addons[id]);}}
res.add(addon.id);};Object.values(addons).forEach(add);return Array.from(res,id=>addons[id]);},addTelemetry(aId,aPayload){if(!this._telemetryDetails[aId]){this._telemetryDetails[aId]={};}
Object.assign(this._telemetryDetails[aId],aPayload);},setupInstallLocations(aAppChanged){function DirectoryLoc(aName,aScope,aKey,aPaths,aLocked,aIsSystem){try{var dir=FileUtils.getDir(aKey,aPaths);}catch(e){return null;}
return new DirectoryLocation(aName,dir,aScope,aLocked,aIsSystem);}
function SystemDefaultsLoc(name,scope,key,paths){try{var dir=FileUtils.getDir(key,paths);}catch(e){return null;}
return new SystemAddonDefaults(name,dir,scope);}
function SystemLoc(aName,aScope,aKey,aPaths){try{var dir=FileUtils.getDir(aKey,aPaths);}catch(e){return null;}
return new SystemAddonLocation(aName,dir,aScope,aAppChanged!==false);}
function RegistryLoc(aName,aScope,aKey){if("nsIWindowsRegKey"in Ci){return new WinRegLocation(aName,Ci.nsIWindowsRegKey[aKey],aScope);}} 
let locations=[[()=>TemporaryInstallLocation,TemporaryInstallLocation.name,null],[DirectoryLoc,KEY_APP_PROFILE,AddonManager.SCOPE_PROFILE,KEY_PROFILEDIR,[DIR_EXTENSIONS],false,],[DirectoryLoc,KEY_APP_SYSTEM_PROFILE,AddonManager.SCOPE_APPLICATION,KEY_PROFILEDIR,[DIR_APP_SYSTEM_PROFILE],false,true,],[SystemLoc,KEY_APP_SYSTEM_ADDONS,AddonManager.SCOPE_PROFILE,KEY_PROFILEDIR,[DIR_SYSTEM_ADDONS],],[SystemDefaultsLoc,KEY_APP_SYSTEM_DEFAULTS,AddonManager.SCOPE_PROFILE,KEY_APP_FEATURES,[],],[()=>BuiltInLocation,KEY_APP_BUILTINS,AddonManager.SCOPE_APPLICATION],[DirectoryLoc,KEY_APP_SYSTEM_USER,AddonManager.SCOPE_USER,"XREUSysExt",[Services.appinfo.ID],true,],[RegistryLoc,"winreg-app-user",AddonManager.SCOPE_USER,"ROOT_KEY_CURRENT_USER",],[DirectoryLoc,KEY_APP_GLOBAL,AddonManager.SCOPE_APPLICATION,KEY_ADDON_APP_DIR,[DIR_EXTENSIONS],true,],[DirectoryLoc,KEY_APP_SYSTEM_SHARE,AddonManager.SCOPE_SYSTEM,"XRESysSExtPD",[Services.appinfo.ID],true,],[DirectoryLoc,KEY_APP_SYSTEM_LOCAL,AddonManager.SCOPE_SYSTEM,"XRESysLExtPD",[Services.appinfo.ID],true,],[RegistryLoc,"winreg-app-global",AddonManager.SCOPE_SYSTEM,"ROOT_KEY_LOCAL_MACHINE",],];for(let[constructor,name,scope,...args]of locations){if(!scope||enabledScopes&scope){try{let loc=constructor(name,scope,...args);if(loc){XPIStates.addLocation(name,loc);}}catch(e){logger.warn(`Failed to add ${constructor.name} install location ${name}`,e);}}}},registerBuiltinDictionaries(){this.dictionaries={};for(let[lang,path]of Object.entries(this.builtInAddons.dictionaries||{})){path=path.slice(0,-4)+".aff";let uri=Services.io.newURI(`resource://gre/${path}`);this.dictionaries[lang]=uri;spellCheck.addDictionary(lang,uri);}},unregisterDictionaries(aDicts){let origDict=spellCheck.dictionary;for(let[lang,uri]of Object.entries(aDicts)){if(spellCheck.removeDictionary(lang,uri)&&this.dictionaries.hasOwnProperty(lang)){spellCheck.addDictionary(lang,this.dictionaries[lang]);if(lang==origDict){spellCheck.dictionary=origDict;}}}},startup(aAppChanged,aOldAppVersion,aOldPlatformVersion){try{AddonManagerPrivate.recordTimestamp("XPI_startup_begin");logger.debug("startup");this.builtInAddons={};try{let url=Services.io.newURI(BUILT_IN_ADDONS_URI);let data=Cu.readUTF8URI(url);this.builtInAddons=JSON.parse(data);}catch(e){if(AppConstants.DEBUG){logger.debug("List of built-in add-ons is missing or invalid.",e);}}
this.registerBuiltinDictionaries(); this._telemetryDetails={}; AddonManagerPrivate.setTelemetryDetails("XPI",this._telemetryDetails);this.setupInstallLocations(aAppChanged);if(!AppConstants.MOZ_REQUIRE_SIGNING||Cu.isInAutomation){Services.prefs.addObserver(PREF_XPI_SIGNATURES_REQUIRED,this);}
Services.prefs.addObserver(PREF_LANGPACK_SIGNATURES,this);Services.obs.addObserver(this,NOTIFICATION_FLUSH_PERMISSIONS);this.checkForChanges(aAppChanged,aOldAppVersion,aOldPlatformVersion);AddonManagerPrivate.markProviderSafe(this);this.maybeInstallBuiltinAddon("default-theme@mozilla.org","1.1","resource://default-theme/");resolveProviderReady(Promise.all(this.startupPromises));if(AppConstants.MOZ_CRASHREPORTER){try{Services.appinfo.annotateCrashReport("EMCheckCompatibility",AddonManager.checkCompatibility);}catch(e){}
this.addAddonsToCrashReporter();}

try{if(!Services.prefs.getBoolPref("extensions.allowPrivateBrowsingByDefault",true)&&!Services.prefs.getBoolPref("extensions.incognito.migrated",false)){XPIDatabase.syncLoadDB(false);let promises=[];for(let addon of XPIDatabase.getAddons()){if(addon.type=="extension"&&addon.active){promises.push(Extension.migratePrivateBrowsing(addon));}}
if(promises.length){awaitPromise(Promise.all(promises));}
Services.prefs.setBoolPref("extensions.incognito.migrated",true);}}catch(e){logger.error("private browsing migration failed",e);}
try{AddonManagerPrivate.recordTimestamp("XPI_bootstrap_addons_begin");for(let addon of this.sortBootstrappedAddons()){
let activeAddon=this.activeAddons.get(addon.id);if(activeAddon&&activeAddon.started){continue;}
try{let reason=BOOTSTRAP_REASONS.APP_STARTUP;
 if(AddonManager.getStartupChanges(AddonManager.STARTUP_CHANGE_INSTALLED).includes(addon.id)){reason=BOOTSTRAP_REASONS.ADDON_INSTALL;}else if(AddonManager.getStartupChanges(AddonManager.STARTUP_CHANGE_ENABLED).includes(addon.id)){reason=BOOTSTRAP_REASONS.ADDON_ENABLE;}
BootstrapScope.get(addon).startup(reason);}catch(e){logger.error("Failed to load bootstrap addon "+
addon.id+" from "+
addon.descriptor,e);}}
AddonManagerPrivate.recordTimestamp("XPI_bootstrap_addons_end");}catch(e){logger.error("bootstrap startup failed",e);AddonManagerPrivate.recordException("XPI-BOOTSTRAP","startup failed",e);}
 
AsyncShutdown.quitApplicationGranted.addBlocker("XPIProvider shutdown",async()=>{XPIProvider._closing=true;await XPIProvider.cleanupTemporaryAddons();for(let addon of XPIProvider.sortBootstrappedAddons().reverse()){

let activeAddon=XPIProvider.activeAddons.get(addon.id);if(!activeAddon||!activeAddon.started){continue;}

let reason=BOOTSTRAP_REASONS.APP_SHUTDOWN;if(addon._pendingDisable){reason=BOOTSTRAP_REASONS.ADDON_DISABLE;}else if(addon.location.name==KEY_APP_TEMPORARY){reason=BOOTSTRAP_REASONS.ADDON_UNINSTALL;let existing=XPIStates.findAddon(addon.id,loc=>!loc.isTemporary);if(existing){reason=XPIInstall.newVersionReason(addon.version,existing.version);}}
let scope=BootstrapScope.get(addon);let promise=scope.shutdown(reason);AsyncShutdown.profileChangeTeardown.addBlocker(`Extension shutdown: ${addon.id}`,promise,{fetchState:scope.fetchState.bind(scope),});}}); Services.obs.addObserver(function observer(){AddonManagerPrivate.recordTimestamp("XPI_finalUIStartup");Services.obs.removeObserver(observer,"final-ui-startup");},"final-ui-startup");











if(!this.isDBLoaded){const EVENTS=["sessionstore-windows-restored","xul-window-visible","profile-before-change","test-load-xpi-database",];let observer=(subject,topic,data)=>{if(topic=="xul-window-visible"&&!Services.wm.getMostRecentWindow("devtools:toolbox")){return;}
for(let event of EVENTS){Services.obs.removeObserver(observer,event);}
XPIDatabase.asyncLoadDB();};for(let event of EVENTS){Services.obs.addObserver(observer,event);}}
AddonManagerPrivate.recordTimestamp("XPI_startup_end");timerManager.registerTimer("xpi-signature-verification",()=>{XPIDatabase.verifySignatures();},XPI_SIGNATURE_CHECK_PERIOD);}catch(e){logger.error("startup failed",e);AddonManagerPrivate.recordException("XPI","startup failed",e);}},async shutdown(){logger.debug("shutdown");this.activeAddons.clear();this.allAppGlobal=true; XPIInstall.cancelAll();for(let install of XPIInstall.installs){if(install.onShutdown()){install.onShutdown();}}
 
if(Services.prefs.getBoolPref(PREF_PENDING_OPERATIONS,false)){XPIDatabase.updateActiveAddons();Services.prefs.setBoolPref(PREF_PENDING_OPERATIONS,false);}
await XPIDatabase.shutdown();},cleanupTemporaryAddons(){let promises=[];let tempLocation=TemporaryInstallLocation;for(let[id,addon]of tempLocation.entries()){tempLocation.delete(id);let bootstrap=BootstrapScope.get(addon);let existing=XPIStates.findAddon(id,loc=>!loc.isTemporary);let cleanup=()=>{tempLocation.installer.uninstallAddon(id);tempLocation.removeAddon(id);};let promise;if(existing){promise=bootstrap.update(existing,false,()=>{cleanup();XPIDatabase.makeAddonLocationVisible(id,existing.location);});}else{promise=bootstrap.uninstall().then(cleanup);}
AsyncShutdown.profileChangeTeardown.addBlocker(`Temporary extension shutdown: ${addon.id}`,promise);promises.push(promise);}
return Promise.all(promises);},addAddonsToCrashReporter(){void(Services.appinfo instanceof Ci.nsICrashReporter);if(!Services.appinfo.annotateCrashReport||Services.appinfo.inSafeMode){return;}
let data=Array.from(XPIStates.enabledAddons(),a=>a.telemetryKey).join(",");try{Services.appinfo.annotateCrashReport("Add-ons",data);}catch(e){}
TelemetrySession.setAddOns(data);},processPendingFileChanges(aManifests){let changed=false;for(let loc of XPIStates.locations()){aManifests[loc.name]={}; if(loc.locked){continue;}

let stagedFailureNames=[];let promises=[];for(let[id,metadata]of loc.getStagedAddons()){loc.unstageAddon(id);aManifests[loc.name][id]=null;promises.push(XPIInstall.installStagedAddon(id,metadata,loc).then(addon=>{aManifests[loc.name][id]=addon;},error=>{delete aManifests[loc.name][id];stagedFailureNames.push(`${id}.xpi`);logger.error(`Failed to install staged add-on ${id} in ${loc.name}`,error);}));}
if(promises.length){changed=true;awaitPromise(Promise.all(promises));}
try{if(changed||stagedFailureNames.length){loc.installer.cleanStagingDir(stagedFailureNames);}}catch(e){logger.debug("Error cleaning staging dir",e);}}
return changed;},installDistributionAddons(aManifests,aAppChanged,aOldAppVersion){let distroDir;try{distroDir=FileUtils.getDir(KEY_APP_DISTRIBUTION,[DIR_EXTENSIONS]);}catch(e){return false;}
let changed=false;for(let file of iterDirectory(distroDir)){if(!isXPI(file.leafName,true)){logger.warn(`Ignoring distribution: not an XPI: ${file.path}`);continue;}
let id=getExpectedID(file);if(!id){logger.warn(`Ignoring distribution: name is not a valid add-on ID: ${file.path}`);continue;}
if(!aAppChanged&&Services.prefs.prefHasUserValue(PREF_BRANCH_INSTALLED_ADDON+id)){continue;}
try{let loc=XPIStates.getLocation(KEY_APP_PROFILE);let addon=awaitPromise(XPIInstall.installDistributionAddon(id,file,loc,aOldAppVersion));if(addon){

 if(!(loc.name in aManifests)){aManifests[loc.name]={};}
aManifests[loc.name][id]=addon;changed=true;}}catch(e){logger.error(`Failed to install distribution add-on ${file.path}`,e);}}
return changed;},async maybeInstallBuiltinAddon(aID,aVersion,aBase){let installed;if(enabledScopes&BuiltInLocation.scope){let existing=BuiltInLocation.get(aID);if(!existing||existing.version!=aVersion){installed=this.installBuiltinAddon(aBase);this.startupPromises.push(installed);}}
return installed;},getDependentAddons(aAddon){return Array.from(XPIDatabase.getAddons()).filter(addon=>addon.dependencies.includes(aAddon.id));},checkForChanges(aAppChanged,aOldAppVersion,aOldPlatformVersion){logger.debug("checkForChanges");
let updateReasons=[];if(aAppChanged){updateReasons.push("appChanged");}
let installChanged=XPIStates.scanForChanges(aAppChanged===false);if(installChanged){updateReasons.push("directoryState");}

 
let manifests={};let updated=this.processPendingFileChanges(manifests);if(updated){updateReasons.push("pendingFileChanges");}


let hasPendingChanges=Services.prefs.getBoolPref(PREF_PENDING_OPERATIONS,false);if(hasPendingChanges){updateReasons.push("hasPendingChanges");} 
if(Services.prefs.getBoolPref(PREF_INSTALL_DISTRO_ADDONS,true)){updated=this.installDistributionAddons(manifests,aAppChanged,aOldAppVersion);if(updated){updateReasons.push("installDistributionAddons");}} 
if(DB_SCHEMA!=Services.prefs.getIntPref(PREF_DB_SCHEMA,0)){
 if(!XPIStates.size){logger.debug("Empty XPI database, setting schema version preference to "+
DB_SCHEMA);Services.prefs.setIntPref(PREF_DB_SCHEMA,DB_SCHEMA);}else{updateReasons.push("schemaChanged");}} 
try{let extensionListChanged=false;
 if(updateReasons.length){AddonManagerPrivate.recordSimpleMeasure("XPIDB_startup_load_reasons",updateReasons);XPIDatabase.syncLoadDB(false);try{extensionListChanged=XPIDatabaseReconcile.processFileChanges(manifests,aAppChanged,aOldAppVersion,aOldPlatformVersion,updateReasons.includes("schemaChanged"));}catch(e){logger.error("Failed to process extension changes at startup",e);}}

if(extensionListChanged||hasPendingChanges){XPIDatabase.updateActiveAddons();return;}
logger.debug("No changes found");}catch(e){logger.error("Error during startup file checks",e);}},async getNewSideloads(){if(XPIStates.scanForChanges(false)){await XPIDatabase.asyncLoadDB(false);XPIDatabaseReconcile.processFileChanges({},false);XPIDatabase.updateActiveAddons();}
let addons=await Promise.all(Array.from(XPIStates.sideLoadedAddons.keys(),id=>this.getAddonByID(id)));return addons.filter(addon=>addon&&addon.seen===false&&addon.permissions&AddonManager.PERM_CAN_ENABLE);},supportsMimetype(aMimetype){return aMimetype=="application/x-xpinstall";},isTemporaryInstallID(id){return id.endsWith(TEMPORARY_ADDON_SUFFIX);},setStartupData(aID,aData){let state=XPIStates.findAddon(aID);state.startupData=aData;XPIStates.save();},getAddonIDByInstanceID(aInstanceID){if(!aInstanceID||typeof aInstanceID!="symbol"){throw Components.Exception("aInstanceID must be a Symbol()",Cr.NS_ERROR_INVALID_ARG);}
for(let[id,val]of this.activeAddons){if(aInstanceID==val.instanceID){return id;}}
return null;},async getAddonsByTypes(aTypes){if(aTypes&&!aTypes.some(type=>ALL_EXTERNAL_TYPES.has(type))){return[];}
return XPIDatabase.getAddonsByTypes(aTypes);},async getActiveAddons(aTypes){if(this.isDBLoaded){let addons=await this.getAddonsByTypes(aTypes);return{addons:addons.filter(addon=>addon.isActive),fullData:true,};}
let result=[];for(let addon of XPIStates.enabledAddons()){if(aTypes&&!aTypes.includes(addon.type)){continue;}
let{scope,isSystem}=addon.location;result.push({id:addon.id,version:addon.version,type:addon.type,updateDate:addon.lastModifiedTime,scope,isSystem,isWebExtension:addon.isWebExtension,});}
return{addons:result,fullData:false};},observe(aSubject,aTopic,aData){switch(aTopic){case NOTIFICATION_FLUSH_PERMISSIONS:if(!aData||aData==XPI_PERMISSION){XPIDatabase.importPermissions();}
break;case"nsPref:changed":switch(aData){case PREF_XPI_SIGNATURES_REQUIRED:case PREF_LANGPACK_SIGNATURES:XPIDatabase.updateAddonAppDisabledStates();break;}}},uninstallSystemProfileAddon(aID){let location=XPIStates.getLocation(KEY_APP_SYSTEM_PROFILE);return XPIInstall.uninstallAddonFromLocation(aID,location);},};for(let meth of["getInstallForFile","getInstallForURL","getInstallsByTypes","installTemporaryAddon","installBuiltinAddon","isInstallAllowed","isInstallEnabled","updateSystemAddons","stageLangpacksForAppUpdate",]){XPIProvider[meth]=function(){return XPIInstall[meth](...arguments);};}
for(let meth of["addonChanged","getAddonByID","getAddonBySyncGUID","updateAddonRepositoryData","updateAddonAppDisabledStates",]){XPIProvider[meth]=function(){return XPIDatabase[meth](...arguments);};}
var XPIInternal={BOOTSTRAP_REASONS,BootstrapScope,BuiltInLocation,DB_SCHEMA,DIR_STAGE,DIR_TRASH,KEY_APP_PROFILE,KEY_APP_SYSTEM_PROFILE,KEY_APP_SYSTEM_ADDONS,KEY_APP_SYSTEM_DEFAULTS,KEY_PROFILEDIR,PREF_BRANCH_INSTALLED_ADDON,PREF_SYSTEM_ADDON_SET,SystemAddonLocation,TEMPORARY_ADDON_SUFFIX,TemporaryInstallLocation,XPIStates,XPI_PERMISSION,awaitPromise,canRunInSafeMode,getURIForResourceInFile,isXPI,iterDirectory,maybeResolveURI,migrateAddonLoader,resolveDBReady,};var addonTypes=[new AddonManagerPrivate.AddonType("extension",URI_EXTENSION_STRINGS,"type.extension.name",AddonManager.VIEW_TYPE_LIST,4000,AddonManager.TYPE_SUPPORTS_UNDO_RESTARTLESS_UNINSTALL),new AddonManagerPrivate.AddonType("theme",URI_EXTENSION_STRINGS,"type.themes.name",AddonManager.VIEW_TYPE_LIST,5000),new AddonManagerPrivate.AddonType("dictionary",URI_EXTENSION_STRINGS,"type.dictionary.name",AddonManager.VIEW_TYPE_LIST,7000,AddonManager.TYPE_UI_HIDE_EMPTY|AddonManager.TYPE_SUPPORTS_UNDO_RESTARTLESS_UNINSTALL),new AddonManagerPrivate.AddonType("locale",URI_EXTENSION_STRINGS,"type.locale.name",AddonManager.VIEW_TYPE_LIST,8000,AddonManager.TYPE_UI_HIDE_EMPTY|AddonManager.TYPE_SUPPORTS_UNDO_RESTARTLESS_UNINSTALL),];AddonManagerPrivate.registerProvider(XPIProvider,addonTypes);