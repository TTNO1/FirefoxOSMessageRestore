//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FxAccountsStorageManagerCanStoreField","FxAccountsStorageManager",];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{DATA_FORMAT_VERSION,DEFAULT_STORAGE_FILENAME,FXA_PWDMGR_HOST,FXA_PWDMGR_MEMORY_FIELDS,FXA_PWDMGR_PLAINTEXT_FIELDS,FXA_PWDMGR_REALM,FXA_PWDMGR_SECURE_FIELDS,log,}=ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");const{CommonUtils}=ChromeUtils.import("resource://services-common/utils.js");
function FxAccountsStorageManagerCanStoreField(fieldName){return(FXA_PWDMGR_MEMORY_FIELDS.has(fieldName)||FXA_PWDMGR_PLAINTEXT_FIELDS.has(fieldName)||FXA_PWDMGR_SECURE_FIELDS.has(fieldName));}
var FxAccountsStorageManager=function(options={}){this.options={filename:options.filename||DEFAULT_STORAGE_FILENAME,baseDir:options.baseDir||Services.dirsvc.get("ProfD",Ci.nsIFile).path,};this.plainStorage=new JSONStorage(this.options);let useSecure="useSecure"in options?options.useSecure:true;if(useSecure){this.secureStorage=new LoginManagerStorage();}else{this.secureStorage=null;}
this._clearCachedData();this._promiseInitialized=Promise.reject("initialize not called"); this._promiseStorageComplete=Promise.resolve();};FxAccountsStorageManager.prototype={_initialized:false,_needToReadSecure:true,
initialize(accountData){if(this._initialized){throw new Error("already initialized");}
this._initialized=true;

this._promiseInitialized.catch(()=>{});this._promiseInitialized=this._initialize(accountData);},async _initialize(accountData){log.trace("initializing new storage manager");try{if(accountData){this._needToReadSecure=false;for(let[name,val]of Object.entries(accountData)){if(FXA_PWDMGR_PLAINTEXT_FIELDS.has(name)){this.cachedPlain[name]=val;}else if(FXA_PWDMGR_SECURE_FIELDS.has(name)){this.cachedSecure[name]=val;}else{

if(!FXA_PWDMGR_MEMORY_FIELDS.has(name)){log.warn("Unknown FxA field name in user data, treating as in-memory",name);}
this.cachedMemory[name]=val;}}
await this._write();return;}


this._needToReadSecure=await this._readPlainStorage();if(this._needToReadSecure&&this.secureStorage){await this._doReadAndUpdateSecure();}}finally{log.trace("initializing of new storage manager done");}},finalize(){
log.trace("StorageManager finalizing");return this._promiseInitialized.then(()=>{return this._promiseStorageComplete;}).then(()=>{this._promiseStorageComplete=null;this._promiseInitialized=null;this._clearCachedData();log.trace("StorageManager finalized");});},




_queueStorageOperation(func){
let result=this._promiseStorageComplete.then(func);


this._promiseStorageComplete=result.catch(err=>{log.error("${func} failed: ${err}",{func,err});});return result;},


async getAccountData(fieldNames=null){await this._promiseInitialized;
if(!("uid"in this.cachedPlain)){return null;}
let result={};if(fieldNames===null){for(let[name,value]of Object.entries(this.cachedPlain)){result[name]=value;}
await this._maybeReadAndUpdateSecure();

for(let[name,value]of Object.entries(this.cachedSecure)){result[name]=value;}

return result;}
if(!Array.isArray(fieldNames)){fieldNames=[fieldNames];}
let checkedSecure=false;for(let fieldName of fieldNames){if(FXA_PWDMGR_MEMORY_FIELDS.has(fieldName)){if(this.cachedMemory[fieldName]!==undefined){result[fieldName]=this.cachedMemory[fieldName];}}else if(FXA_PWDMGR_PLAINTEXT_FIELDS.has(fieldName)){if(this.cachedPlain[fieldName]!==undefined){result[fieldName]=this.cachedPlain[fieldName];}}else if(FXA_PWDMGR_SECURE_FIELDS.has(fieldName)){if(!checkedSecure){await this._maybeReadAndUpdateSecure();checkedSecure=true;}
if(this.cachedSecure[fieldName]!==undefined){result[fieldName]=this.cachedSecure[fieldName];}}else{throw new Error("unexpected field '"+fieldName+"'");}}
return result;},
async updateAccountData(newFields){await this._promiseInitialized;if(!("uid"in this.cachedPlain)){
throw new Error("No user is logged in");}
if(!newFields||"uid"in newFields){throw new Error("Can't change uid");}
log.debug("_updateAccountData with items",Object.keys(newFields));for(let[name,value]of Object.entries(newFields)){if(value==null){delete this.cachedMemory[name];delete this.cachedPlain[name];
this.cachedSecure[name]=null;}else if(FXA_PWDMGR_MEMORY_FIELDS.has(name)){this.cachedMemory[name]=value;}else if(FXA_PWDMGR_PLAINTEXT_FIELDS.has(name)){this.cachedPlain[name]=value;}else if(FXA_PWDMGR_SECURE_FIELDS.has(name)){this.cachedSecure[name]=value;}else{

throw new Error("unexpected field '"+name+"'");}}

await this._maybeReadAndUpdateSecure();

this._write();},_clearCachedData(){this.cachedMemory={};this.cachedPlain={};
this.cachedSecure=this.secureStorage==null?this.cachedPlain:{};},async _readPlainStorage(){let got;try{got=await this.plainStorage.get();}catch(err){
if(!err.name=="NotFoundError"){log.error("Failed to read plain storage",err);}
got=null;}
if(!got||!got.accountData||!got.accountData.uid||got.version!=DATA_FORMAT_VERSION){return false;}



if(Object.keys(this.cachedPlain).length!=0){throw new Error("should be impossible to have cached data already.");}
for(let[name,value]of Object.entries(got.accountData)){this.cachedPlain[name]=value;}
return true;},_maybeReadAndUpdateSecure(){if(this.secureStorage==null||!this._needToReadSecure){return null;}
return this._queueStorageOperation(()=>{if(this._needToReadSecure){return this._doReadAndUpdateSecure();}
return null;});},async _doReadAndUpdateSecure(){let{uid,email}=this.cachedPlain;try{log.debug("reading secure storage with existing",Object.keys(this.cachedSecure));

let needWrite=Object.keys(this.cachedSecure).length!=0;let readSecure=await this.secureStorage.get(uid,email);

if(readSecure&&readSecure.version!=DATA_FORMAT_VERSION){log.warn("got secure data but the data format version doesn't match");readSecure=null;}
if(readSecure&&readSecure.accountData){log.debug("secure read fetched items",Object.keys(readSecure.accountData));for(let[name,value]of Object.entries(readSecure.accountData)){if(!(name in this.cachedSecure)){this.cachedSecure[name]=value;}}
if(needWrite){log.debug("successfully read secure data; writing updated data back");await this._doWriteSecure();}}
this._needToReadSecure=false;}catch(ex){if(ex instanceof this.secureStorage.STORAGE_LOCKED){log.debug("setAccountData: secure storage is locked trying to read");}else{log.error("failed to read secure storage",ex);throw ex;}}},_write(){
return this._queueStorageOperation(()=>this.__write());},async __write(){log.debug("writing plain storage",Object.keys(this.cachedPlain));let toWritePlain={version:DATA_FORMAT_VERSION,accountData:this.cachedPlain,};await this.plainStorage.set(toWritePlain);if(this.secureStorage==null){return;}
if(!this._needToReadSecure){await this._doWriteSecure();}},async _doWriteSecure(){for(let[name,value]of Object.entries(this.cachedSecure)){if(value==null){delete this.cachedSecure[name];}}
log.debug("writing secure storage",Object.keys(this.cachedSecure));let toWriteSecure={version:DATA_FORMAT_VERSION,accountData:this.cachedSecure,};try{await this.secureStorage.set(this.cachedPlain.uid,toWriteSecure);}catch(ex){if(!(ex instanceof this.secureStorage.STORAGE_LOCKED)){throw ex;}


log.error("setAccountData: secure storage is locked trying to write");}},deleteAccountData(){return this._queueStorageOperation(()=>this._deleteAccountData());},async _deleteAccountData(){log.debug("removing account data");await this._promiseInitialized;await this.plainStorage.set(null);if(this.secureStorage){await this.secureStorage.set(null);}
this._clearCachedData();log.debug("account data reset");},};function JSONStorage(options){this.baseDir=options.baseDir;this.path=PathUtils.join(options.baseDir,options.filename);}
JSONStorage.prototype={set(contents){log.trace("starting write of json user data",contents?Object.keys(contents.accountData):"null");let start=Date.now();return IOUtils.makeDirectory(this.baseDir,{ignoreExisting:true}).then(CommonUtils.writeJSON.bind(null,contents,this.path)).then(result=>{log.trace("finished write of json user data - took",Date.now()-start);return result;});},get(){log.trace("starting fetch of json user data");let start=Date.now();return CommonUtils.readJSON(this.path).then(result=>{log.trace("finished fetch of json user data - took",Date.now()-start);return result;});},};function StorageLockedError(){}
function LoginManagerStorage(){}
LoginManagerStorage.prototype={STORAGE_LOCKED:StorageLockedError,
get _isLoggedIn(){return Services.logins.isLoggedIn;},

async _clearLoginMgrData(){try{await Services.logins.initializationPromise;if(!this._isLoggedIn){return false;}
let logins=Services.logins.findLogins(FXA_PWDMGR_HOST,null,FXA_PWDMGR_REALM);for(let login of logins){Services.logins.removeLogin(login);}
return true;}catch(ex){log.error("Failed to clear login data: ${}",ex);return false;}},async set(uid,contents){if(!contents){let cleared=await this._clearLoginMgrData();if(!cleared){
log.info("not removing credentials from login manager - not logged in");}
log.trace("storage set finished clearing account data");return;}
log.trace("starting write of user data to the login manager");try{await Services.logins.initializationPromise;
if(!this._isLoggedIn){log.info("not saving credentials to login manager - not logged in");throw new this.STORAGE_LOCKED();}
let loginInfo=new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",Ci.nsILoginInfo,"init");let login=new loginInfo(FXA_PWDMGR_HOST,null,FXA_PWDMGR_REALM,uid, JSON.stringify(contents),"",""); let existingLogins=Services.logins.findLogins(FXA_PWDMGR_HOST,null,FXA_PWDMGR_REALM);if(existingLogins.length){Services.logins.modifyLogin(existingLogins[0],login);}else{Services.logins.addLogin(login);}
log.trace("finished write of user data to the login manager");}catch(ex){if(ex instanceof this.STORAGE_LOCKED){throw ex;}

log.error("Failed to save data to the login manager",ex);}},async get(uid,email){log.trace("starting fetch of user data from the login manager");try{await Services.logins.initializationPromise;if(!this._isLoggedIn){log.info("returning partial account data as the login manager is locked.");throw new this.STORAGE_LOCKED();}
let logins=Services.logins.findLogins(FXA_PWDMGR_HOST,null,FXA_PWDMGR_REALM);if(logins.length==0){log.info("Can't find any credentials in the login manager");return null;}
let login=logins[0];
if(login.username==uid||login.username==email){return JSON.parse(login.password);}
log.info("username in the login manager doesn't match - ignoring it");await this._clearLoginMgrData();}catch(ex){if(ex instanceof this.STORAGE_LOCKED){throw ex;}

log.error("Failed to get data from the login manager",ex);}
return null;},};