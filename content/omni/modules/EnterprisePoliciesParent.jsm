//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["EnterprisePoliciesManager"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");XPCOMUtils.defineLazyModuleGetters(this,{WindowsGPOParser:"resource://gre/modules/policies/WindowsGPOParser.jsm",macOSPoliciesParser:"resource://gre/modules/policies/macOSPoliciesParser.jsm",Policies:"resource:///modules/policies/Policies.jsm",JsonSchemaValidator:"resource://gre/modules/components-utils/JsonSchemaValidator.jsm",});
const POLICIES_FILENAME="policies.json";
const PREF_PER_USER_DIR="toolkit.policies.perUserDir";const PREF_ALTERNATE_PATH="browser.policies.alternatePath";


const MAGIC_TEST_ROOT_PREFIX="<test-root>";const PREF_TEST_ROOT="mochitest.testRoot";const PREF_LOGLEVEL="browser.policies.loglevel";const PREF_DISALLOW_ENTERPRISE="browser.policies.testing.disallowEnterprise";const PREF_POLICIES_APPLIED="browser.policies.applied";XPCOMUtils.defineLazyGetter(this,"log",()=>{let{ConsoleAPI}=ChromeUtils.import("resource://gre/modules/Console.jsm");return new ConsoleAPI({prefix:"Enterprise Policies",
maxLogLevel:"error",maxLogLevelPref:PREF_LOGLEVEL,});});let env=Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);const isXpcshell=env.exists("XPCSHELL_TEST_PROFILE_DIR");
function isEmptyObject(obj){if(typeof obj!="object"||Array.isArray(obj)){return false;}
for(let key of Object.keys(obj)){if(!isEmptyObject(obj[key])){return false;}}
return true;}
function EnterprisePoliciesManager(){Services.obs.addObserver(this,"profile-after-change",true);Services.obs.addObserver(this,"final-ui-startup",true);Services.obs.addObserver(this,"sessionstore-windows-restored",true);Services.obs.addObserver(this,"EnterprisePolicies:Restart",true);}
EnterprisePoliciesManager.prototype={QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference","nsIEnterprisePolicies",]),_initialize(){if(Services.prefs.getBoolPref(PREF_POLICIES_APPLIED,false)){if("_cleanup"in Policies){let policyImpl=Policies._cleanup;for(let timing of Object.keys(this._callbacks)){let policyCallback=policyImpl[timing];if(policyCallback){this._schedulePolicyCallback(timing,policyCallback.bind(policyImpl,this ));}}}
Services.prefs.clearUserPref(PREF_POLICIES_APPLIED);}
let provider=this._chooseProvider();if(!provider){this.status=Ci.nsIEnterprisePolicies.INACTIVE;return;}
if(provider.failed){this.status=Ci.nsIEnterprisePolicies.FAILED;return;}
this.status=Ci.nsIEnterprisePolicies.ACTIVE;this._parsedPolicies={};Services.telemetry.scalarSet("policies.count",Object.keys(provider.policies).length);this._activatePolicies(provider.policies);Services.prefs.setBoolPref(PREF_POLICIES_APPLIED,true);},_chooseProvider(){let provider=null;if(AppConstants.platform=="win"){provider=new WindowsGPOPoliciesProvider();}else if(AppConstants.platform=="macosx"){provider=new macOSPoliciesProvider();}
if(provider&&provider.hasPolicies){return provider;}
provider=new JSONPoliciesProvider();if(provider.hasPolicies){return provider;}
return null;},_activatePolicies(unparsedPolicies){let{schema}=ChromeUtils.import("resource:///modules/policies/schema.jsm");for(let policyName of Object.keys(unparsedPolicies)){let policySchema=schema.properties[policyName];let policyParameters=unparsedPolicies[policyName];if(!policySchema){log.error(`Unknown policy: ${policyName}`);continue;}
if(policySchema.enterprise_only&&!areEnterpriseOnlyPoliciesAllowed()){log.error(`Policy ${policyName} is only allowed on ESR`);continue;}
let{valid:parametersAreValid,parsedValue:parsedParameters,}=JsonSchemaValidator.validate(policyParameters,policySchema,{allowExtraProperties:true,});if(!parametersAreValid){log.error(`Invalid parameters specified for ${policyName}.`);continue;}
this._parsedPolicies[policyName]=parsedParameters;let policyImpl=Policies[policyName];for(let timing of Object.keys(this._callbacks)){let policyCallback=policyImpl[timing];if(policyCallback){this._schedulePolicyCallback(timing,policyCallback.bind(policyImpl,this ,parsedParameters));}}}},_callbacks:{
onBeforeAddons:[],
onProfileAfterChange:[],onBeforeUIStartup:[],


onAllWindowsRestored:[],},_schedulePolicyCallback(timing,callback){this._callbacks[timing].push(callback);},_runPoliciesCallbacks(timing){let callbacks=this._callbacks[timing];while(callbacks.length){let callback=callbacks.shift();try{callback();}catch(ex){log.error("Error running ",callback,`for ${timing}:`,ex);}}},async _restart(){DisallowedFeatures={};Services.ppmm.sharedData.delete("EnterprisePolicies:Status");Services.ppmm.sharedData.delete("EnterprisePolicies:DisallowedFeatures");this._status=Ci.nsIEnterprisePolicies.UNINITIALIZED;for(let timing of Object.keys(this._callbacks)){this._callbacks[timing]=[];}
let{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");
await PromiseUtils.idleDispatch(()=>{this.observe(null,"policies-startup",null);});await PromiseUtils.idleDispatch(()=>{this.observe(null,"profile-after-change",null);});await PromiseUtils.idleDispatch(()=>{this.observe(null,"final-ui-startup",null);});await PromiseUtils.idleDispatch(()=>{this.observe(null,"sessionstore-windows-restored",null);});}, observe:function BG_observe(subject,topic,data){switch(topic){case"policies-startup":
this._initialize();this._runPoliciesCallbacks("onBeforeAddons");break;case"profile-after-change":this._runPoliciesCallbacks("onProfileAfterChange");break;case"final-ui-startup":this._runPoliciesCallbacks("onBeforeUIStartup");break;case"sessionstore-windows-restored":this._runPoliciesCallbacks("onAllWindowsRestored");Services.obs.notifyObservers(null,"EnterprisePolicies:AllPoliciesApplied");break;case"EnterprisePolicies:Restart":this._restart().then(null,Cu.reportError);break;}},disallowFeature(feature,neededOnContentProcess=false){DisallowedFeatures[feature]=neededOnContentProcess;
if(neededOnContentProcess){Services.ppmm.sharedData.set("EnterprisePolicies:DisallowedFeatures",new Set(Object.keys(DisallowedFeatures).filter(key=>DisallowedFeatures[key])));}},
_status:Ci.nsIEnterprisePolicies.UNINITIALIZED,set status(val){this._status=val;if(val!=Ci.nsIEnterprisePolicies.INACTIVE){Services.ppmm.sharedData.set("EnterprisePolicies:Status",val);}
return val;},get status(){return this._status;},isAllowed:function BG_sanitize(feature){return!(feature in DisallowedFeatures);},getActivePolicies(){return this._parsedPolicies;},setSupportMenu(supportMenu){SupportMenu=supportMenu;},getSupportMenu(){return SupportMenu;},setExtensionPolicies(extensionPolicies){ExtensionPolicies=extensionPolicies;},getExtensionPolicy(extensionID){if(ExtensionPolicies&&extensionID in ExtensionPolicies){return ExtensionPolicies[extensionID];}
return null;},setExtensionSettings(extensionSettings){ExtensionSettings=extensionSettings;if("*"in extensionSettings&&"install_sources"in extensionSettings["*"]){InstallSources=new MatchPatternSet(extensionSettings["*"].install_sources);}},getExtensionSettings(extensionID){let settings=null;if(ExtensionSettings){if(extensionID in ExtensionSettings){settings=ExtensionSettings[extensionID];}else if("*"in ExtensionSettings){settings=ExtensionSettings["*"];}}
return settings;},mayInstallAddon(addon){ if(!ExtensionSettings){return true;}
if(addon.id in ExtensionSettings){if("installation_mode"in ExtensionSettings[addon.id]){switch(ExtensionSettings[addon.id].installation_mode){case"blocked":return false;default:return true;}}}
if("*"in ExtensionSettings){if(ExtensionSettings["*"].installation_mode&&ExtensionSettings["*"].installation_mode=="blocked"){return false;}
if("allowed_types"in ExtensionSettings["*"]){return ExtensionSettings["*"].allowed_types.includes(addon.type);}}
return true;},allowedInstallSource(uri){return InstallSources?InstallSources.matches(uri):true;},};let DisallowedFeatures={};let SupportMenu=null;let ExtensionPolicies=null;let ExtensionSettings=null;let InstallSources=null;function areEnterpriseOnlyPoliciesAllowed(){if(Cu.isInAutomation||isXpcshell){if(Services.prefs.getBoolPref(PREF_DISALLOW_ENTERPRISE,false)){return false;}
return true;}
if(AppConstants.MOZ_UPDATE_CHANNEL!="release"){return true;}
return false;}
class JSONPoliciesProvider{constructor(){this._policies=null;this._failed=false;this._readData();}
get hasPolicies(){return(this._failed||(this._policies!==null&&!isEmptyObject(this._policies)));}
get policies(){return this._policies;}
get failed(){return this._failed;}
_getConfigurationFile(){let configFile=null;if(AppConstants.platform=="linux"){let systemConfigFile=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);systemConfigFile.initWithPath("/etc/"+Services.appinfo.name.toLowerCase()+"/policies");systemConfigFile.append(POLICIES_FILENAME);if(systemConfigFile.exists()){return systemConfigFile;}}
try{let perUserPath=Services.prefs.getBoolPref(PREF_PER_USER_DIR,false);if(perUserPath){configFile=Services.dirsvc.get("XREUserRunTimeDir",Ci.nsIFile);}else{configFile=Services.dirsvc.get("XREAppDist",Ci.nsIFile);}
configFile.append(POLICIES_FILENAME);}catch(ex){
}
let alternatePath=Services.prefs.getStringPref(PREF_ALTERNATE_PATH,"");




if(alternatePath&&(Cu.isInAutomation||AppConstants.NIGHTLY_BUILD||isXpcshell)&&(!configFile||!configFile.exists())){if(alternatePath.startsWith(MAGIC_TEST_ROOT_PREFIX)){

let testRoot=Services.prefs.getStringPref(PREF_TEST_ROOT);let relativePath=alternatePath.substring(MAGIC_TEST_ROOT_PREFIX.length);if(AppConstants.platform=="win"){relativePath=relativePath.replace(/\//g,"\\");}
alternatePath=testRoot+relativePath;}
configFile=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);configFile.initWithPath(alternatePath);}
return configFile;}
_readData(){let configFile=this._getConfigurationFile();if(!configFile){ return;}
try{let data=Cu.readUTF8File(configFile);if(data){this._policies=JSON.parse(data).policies;if(!this._policies){log.error("Policies file doesn't contain a 'policies' object");this._failed=true;}}}catch(ex){if(ex instanceof Components.Exception&&ex.result==Cr.NS_ERROR_FILE_NOT_FOUND){}else if(ex instanceof SyntaxError){log.error("Error parsing JSON file");this._failed=true;}else{log.error("Error reading file");this._failed=true;}}}}
class WindowsGPOPoliciesProvider{constructor(){this._policies=null;let wrk=Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey);
log.debug("root = HKEY_CURRENT_USER");this._readData(wrk,wrk.ROOT_KEY_CURRENT_USER);log.debug("root = HKEY_LOCAL_MACHINE");this._readData(wrk,wrk.ROOT_KEY_LOCAL_MACHINE);}
get hasPolicies(){return this._policies!==null&&!isEmptyObject(this._policies);}
get policies(){return this._policies;}
get failed(){return this._failed;}
_readData(wrk,root){try{wrk.open(root,"SOFTWARE\\Policies",wrk.ACCESS_READ);if(wrk.hasChild("Mozilla\\"+Services.appinfo.name)){this._policies=WindowsGPOParser.readPolicies(wrk,this._policies);}
wrk.close();}catch(e){log.error("Unable to access registry - ",e);}}}
class macOSPoliciesProvider{constructor(){this._policies=null;let prefReader=Cc["@mozilla.org/mac-preferences-reader;1"].createInstance(Ci.nsIMacPreferencesReader);if(!prefReader.policiesEnabled()){return;}
this._policies=macOSPoliciesParser.readPolicies(prefReader);}
get hasPolicies(){return this._policies!==null&&Object.keys(this._policies).length;}
get policies(){return this._policies;}
get failed(){return this._failed;}}