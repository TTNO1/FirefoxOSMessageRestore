"use strict";const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"LoginHelper","resource://gre/modules/LoginHelper.jsm");ChromeUtils.defineModuleGetter(this,"LoginStore","resource://gre/modules/LoginStore.jsm");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gUUIDGenerator","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");class LoginManagerStorage_json{constructor(){this.__crypto=null; this.__decryptedPotentiallyVulnerablePasswords=null;}
get classID(){return Components.ID("{c00c432d-a0c9-46d7-bef6-9c45b4d07341}");}
get QueryInterface(){return ChromeUtils.generateQI(["nsILoginManagerStorage"]);}
get _xpcom_factory(){return ComponentUtils.generateSingletonFactory(this.LoginManagerStorage_json);}
get _crypto(){if(!this.__crypto){this.__crypto=Cc["@mozilla.org/login-manager/crypto/SDR;1"].getService(Ci.nsILoginManagerCrypto);}
return this.__crypto;}
get _decryptedPotentiallyVulnerablePasswords(){if(!this.__decryptedPotentiallyVulnerablePasswords){this._store.ensureDataReady();this.__decryptedPotentiallyVulnerablePasswords=[];for(const potentiallyVulnerablePassword of this._store.data.potentiallyVulnerablePasswords){const decryptedPotentiallyVulnerablePassword=this._crypto.decrypt(potentiallyVulnerablePassword.encryptedPassword);this.__decryptedPotentiallyVulnerablePasswords.push(decryptedPotentiallyVulnerablePassword);}}
return this.__decryptedPotentiallyVulnerablePasswords;}
initialize(){try{this._crypto;let jsonPath=OS.Path.join(OS.Constants.Path.profileDir,"logins.json");let backupPath="";let loginsBackupEnabled=Services.prefs.getBoolPref("signon.backup.enabled");if(loginsBackupEnabled){backupPath=OS.Path.join(OS.Constants.Path.profileDir,"logins-backup.json");}
this._store=new LoginStore(jsonPath,backupPath);return(async()=>{this.log("Opening database at",this._store.path);await this._store.load();})().catch(Cu.reportError);}catch(e){this.log("Initialization failed:",e);throw new Error("Initialization failed");}}
terminate(){this._store._saver.disarm();return this._store._save();}
async getSyncID(){await this._store.load();if(!this._store.data.sync){return null;}
let raw=this._store.data.sync.syncID;try{return raw?this._crypto.decrypt(raw):null;}catch(e){if(e.result==Cr.NS_ERROR_FAILURE){this.log("Could not decrypt the syncID - returning null");return null;}
throw e;}}
async setSyncID(syncID){await this._store.load();if(!this._store.data.sync){this._store.data.sync={};}
this._store.data.sync.syncID=syncID?this._crypto.encrypt(syncID):null;this._store.saveSoon();}
async getLastSync(){await this._store.load();if(!this._store.data.sync){return 0;}
return this._store.data.sync.lastSync||0.0;}
async setLastSync(timestamp){await this._store.load();if(!this._store.data.sync){this._store.data.sync={};}
this._store.data.sync.lastSync=timestamp;this._store.saveSoon();}
addLogin(login,preEncrypted=false,plaintextUsername=null,plaintextPassword=null){if(preEncrypted&&(typeof plaintextUsername!="string"||typeof plaintextPassword!="string")){throw new Error("plaintextUsername and plaintextPassword are required when preEncrypted is true");}
this._store.ensureDataReady();LoginHelper.checkLoginValues(login);let[encUsername,encPassword,encType]=preEncrypted?[login.username,login.password,this._crypto.defaultEncType]:this._encryptLogin(login);let loginClone=login.clone();loginClone.username=preEncrypted?plaintextUsername:login.username;loginClone.password=preEncrypted?plaintextPassword:login.password; loginClone.QueryInterface(Ci.nsILoginMetaInfo);if(loginClone.guid){let guid=loginClone.guid;if(!this._isGuidUnique(guid)){

let existing=this._searchLogins({guid})[0];if(this._decryptLogins(existing).length){throw new Error("specified GUID already exists");}
let foundIndex=this._store.data.logins.findIndex(l=>l.guid==guid);if(foundIndex==-1){throw new Error("can't find a matching GUID to remove");}
this._store.data.logins.splice(foundIndex,1);}}else{loginClone.guid=gUUIDGenerator.generateUUID().toString();} 
let currentTime=Date.now();if(!loginClone.timeCreated){loginClone.timeCreated=currentTime;}
if(!loginClone.timeLastUsed){loginClone.timeLastUsed=currentTime;}
if(!loginClone.timePasswordChanged){loginClone.timePasswordChanged=currentTime;}
if(!loginClone.timesUsed){loginClone.timesUsed=1;}
this._store.data.logins.push({id:this._store.data.nextId++,hostname:loginClone.origin,httpRealm:loginClone.httpRealm,formSubmitURL:loginClone.formActionOrigin,usernameField:loginClone.usernameField,passwordField:loginClone.passwordField,encryptedUsername:encUsername,encryptedPassword:encPassword,guid:loginClone.guid,encType,timeCreated:loginClone.timeCreated,timeLastUsed:loginClone.timeLastUsed,timePasswordChanged:loginClone.timePasswordChanged,timesUsed:loginClone.timesUsed,});this._store.saveSoon();LoginHelper.notifyStorageChanged("addLogin",loginClone);return loginClone;}
removeLogin(login){this._store.ensureDataReady();let[idToDelete,storedLogin]=this._getIdForLogin(login);if(!idToDelete){throw new Error("No matching logins");}
let foundIndex=this._store.data.logins.findIndex(l=>l.id==idToDelete);if(foundIndex!=-1){this._store.data.logins.splice(foundIndex,1);this._store.saveSoon();}
LoginHelper.notifyStorageChanged("removeLogin",storedLogin);}
modifyLogin(oldLogin,newLoginData){this._store.ensureDataReady();let[idToModify,oldStoredLogin]=this._getIdForLogin(oldLogin);if(!idToModify){throw new Error("No matching logins");}
let newLogin=LoginHelper.buildModifiedLogin(oldStoredLogin,newLoginData);if(newLogin.guid!=oldStoredLogin.guid&&!this._isGuidUnique(newLogin.guid)){throw new Error("specified GUID already exists");}
if(!newLogin.matches(oldLogin,true)){let logins=this.findLogins(newLogin.origin,newLogin.formActionOrigin,newLogin.httpRealm);let matchingLogin=logins.find(login=>newLogin.matches(login,true));if(matchingLogin){throw LoginHelper.createLoginAlreadyExistsError(matchingLogin.guid);}}
let[encUsername,encPassword,encType]=this._encryptLogin(newLogin);for(let loginItem of this._store.data.logins){if(loginItem.id==idToModify){loginItem.hostname=newLogin.origin;loginItem.httpRealm=newLogin.httpRealm;loginItem.formSubmitURL=newLogin.formActionOrigin;loginItem.usernameField=newLogin.usernameField;loginItem.passwordField=newLogin.passwordField;loginItem.encryptedUsername=encUsername;loginItem.encryptedPassword=encPassword;loginItem.guid=newLogin.guid;loginItem.encType=encType;loginItem.timeCreated=newLogin.timeCreated;loginItem.timeLastUsed=newLogin.timeLastUsed;loginItem.timePasswordChanged=newLogin.timePasswordChanged;loginItem.timesUsed=newLogin.timesUsed;this._store.saveSoon();break;}}
LoginHelper.notifyStorageChanged("modifyLogin",[oldStoredLogin,newLogin]);}
recordPasswordUse(login){let propBag=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);propBag.setProperty("timeLastUsed",Date.now());propBag.setProperty("timesUsedIncrement",1);this.modifyLogin(login,propBag);}
async recordBreachAlertDismissal(loginGUID){this._store.ensureDataReady();const dismissedBreachAlertsByLoginGUID=this._store._data.dismissedBreachAlertsByLoginGUID;dismissedBreachAlertsByLoginGUID[loginGUID]={timeBreachAlertDismissed:new Date().getTime(),};return this._store.saveSoon();}
getBreachAlertDismissalsByLoginGUID(){this._store.ensureDataReady();return this._store._data.dismissedBreachAlertsByLoginGUID;}
getAllLogins(){this._store.ensureDataReady();let[logins,ids]=this._searchLogins({});logins=this._decryptLogins(logins);this.log("getAllLogins: returning",logins.length,"logins.");return logins;}
async getAllLoginsAsync(){this._store.ensureDataReady();let[logins,ids]=this._searchLogins({});if(!logins.length){return[];}
let ciphertexts=logins.map(l=>l.username).concat(logins.map(l=>l.password));let plaintexts=await this._crypto.decryptMany(ciphertexts);let usernames=plaintexts.slice(0,logins.length);let passwords=plaintexts.slice(logins.length);let result=[];for(let i=0;i<logins.length;i++){if(!usernames[i]||!passwords[i]){


let login=logins[i];try{this._crypto.decrypt(login.username);this._crypto.decrypt(login.password);}catch(e){if(e.result==Cr.NS_ERROR_FAILURE){this.log("Could not decrypt login:",login.QueryInterface(Ci.nsILoginMetaInfo).guid);continue;}
throw e;}}
logins[i].username=usernames[i];logins[i].password=passwords[i];result.push(logins[i]);}
return result;}
async searchLoginsAsync(matchData){this.log("searchLoginsAsync:",matchData);let result=this.searchLogins(LoginHelper.newPropertyBag(matchData));return Promise.resolve(result);}
searchLogins(matchData){this._store.ensureDataReady();let realMatchData={};let options={};matchData.QueryInterface(Ci.nsIPropertyBag2);if(matchData.hasKey("guid")){

realMatchData={guid:matchData.getProperty("guid")};}else{for(let prop of matchData.enumerator){switch(prop.name){
case"acceptDifferentSubdomains":case"schemeUpgrades":{options[prop.name]=prop.value;break;}
default:{realMatchData[prop.name]=prop.value;break;}}}}
let[logins,ids]=this._searchLogins(realMatchData,options);logins=this._decryptLogins(logins);return logins;}
_searchLogins(matchData,aOptions={schemeUpgrades:false,acceptDifferentSubdomains:false,},candidateLogins=this._store.data.logins){if("formActionOrigin"in matchData&&matchData.formActionOrigin===""&& Object.keys(matchData).length!=1){throw new Error("Searching with an empty `formActionOrigin` doesn't do a wildcard search");}
function match(aLoginItem){for(let field in matchData){let wantedValue=matchData[field];
let storageFieldName=field;switch(field){case"formActionOrigin":{storageFieldName="formSubmitURL";break;}
case"origin":{storageFieldName="hostname";break;}}
switch(field){case"formActionOrigin":if(wantedValue!=null){ if(aLoginItem.formSubmitURL==""){break;}
if(!LoginHelper.isOriginMatching(aLoginItem[storageFieldName],wantedValue,aOptions)){return false;}
break;} 
case"origin":if(wantedValue!=null){ if(!LoginHelper.isOriginMatching(aLoginItem[storageFieldName],wantedValue,aOptions)){return false;}
break;} 
case"httpRealm":case"id":case"usernameField":case"passwordField":case"encryptedUsername":case"encryptedPassword":case"guid":case"encType":case"timeCreated":case"timeLastUsed":case"timePasswordChanged":case"timesUsed":if(wantedValue==null&&aLoginItem[storageFieldName]){return false;}else if(aLoginItem[storageFieldName]!=wantedValue){return false;}
break;default:throw new Error("Unexpected field: "+field);}}
return true;}
let foundLogins=[],foundIds=[];for(let loginItem of candidateLogins){if(match(loginItem)){ let login=Cc["@mozilla.org/login-manager/loginInfo;1"].createInstance(Ci.nsILoginInfo);login.init(loginItem.hostname,loginItem.formSubmitURL,loginItem.httpRealm,loginItem.encryptedUsername,loginItem.encryptedPassword,loginItem.usernameField,loginItem.passwordField); login.QueryInterface(Ci.nsILoginMetaInfo);login.guid=loginItem.guid;login.timeCreated=loginItem.timeCreated;login.timeLastUsed=loginItem.timeLastUsed;login.timePasswordChanged=loginItem.timePasswordChanged;login.timesUsed=loginItem.timesUsed;foundLogins.push(login);foundIds.push(loginItem.id);}}
this.log("_searchLogins: returning",foundLogins.length,"logins for",matchData,"with options",aOptions);return[foundLogins,foundIds];}
removeAllLogins(){this._store.ensureDataReady();this.log("Removing all logins");this._store.data.logins=[];this._store.data.potentiallyVulnerablePasswords=[];this.__decryptedPotentiallyVulnerablePasswords=null;this._store.data.dismissedBreachAlertsByLoginGUID={};this._store.saveSoon();LoginHelper.notifyStorageChanged("removeAllLogins",null);}
findLogins(origin,formActionOrigin,httpRealm){this._store.ensureDataReady();let loginData={origin,formActionOrigin,httpRealm,};let matchData={};for(let field of["origin","formActionOrigin","httpRealm"]){if(loginData[field]!=""){matchData[field]=loginData[field];}}
let[logins,ids]=this._searchLogins(matchData);logins=this._decryptLogins(logins);this.log("_findLogins: returning",logins.length,"logins");return logins;}
countLogins(origin,formActionOrigin,httpRealm){this._store.ensureDataReady();let loginData={origin,formActionOrigin,httpRealm,};let matchData={};for(let field of["origin","formActionOrigin","httpRealm"]){if(loginData[field]!=""){matchData[field]=loginData[field];}}
let[logins,ids]=this._searchLogins(matchData);this.log("_countLogins: counted logins:",logins.length);return logins.length;}
addPotentiallyVulnerablePassword(login){this._store.ensureDataReady(); if(this.isPotentiallyVulnerablePassword(login)){return;}
this.__decryptedPotentiallyVulnerablePasswords.push(login.password);this._store.data.potentiallyVulnerablePasswords.push({encryptedPassword:this._crypto.encrypt(login.password),});this._store.saveSoon();}
isPotentiallyVulnerablePassword(login){return this._decryptedPotentiallyVulnerablePasswords.includes(login.password);}
clearAllPotentiallyVulnerablePasswords(){this._store.ensureDataReady();if(!this._store.data.potentiallyVulnerablePasswords.length){ return;}
this._store.data.potentiallyVulnerablePasswords=[];this._store.saveSoon();this.__decryptedPotentiallyVulnerablePasswords=null;}
get uiBusy(){return this._crypto.uiBusy;}
get isLoggedIn(){return this._crypto.isLoggedIn;}
_getIdForLogin(login){this._store.ensureDataReady();let matchData={};for(let field of["origin","formActionOrigin","httpRealm"]){if(login[field]!=""){matchData[field]=login[field];}}
let[logins,ids]=this._searchLogins(matchData);let id=null;let foundLogin=null;


for(let i=0;i<logins.length;i++){let[decryptedLogin]=this._decryptLogins([logins[i]]);if(!decryptedLogin||!decryptedLogin.equals(login)){continue;} 
foundLogin=decryptedLogin;id=ids[i];break;}
return[id,foundLogin];}
_isGuidUnique(guid){this._store.ensureDataReady();return this._store.data.logins.every(l=>l.guid!=guid);}
_encryptLogin(login){let encUsername=this._crypto.encrypt(login.username);let encPassword=this._crypto.encrypt(login.password);let encType=this._crypto.defaultEncType;return[encUsername,encPassword,encType];}
_decryptLogins(logins){let result=[];for(let login of logins){try{login.username=this._crypto.decrypt(login.username);login.password=this._crypto.decrypt(login.password);}catch(e){if(e.result==Cr.NS_ERROR_FAILURE){continue;}
throw e;}
result.push(login);}
return result;}}
XPCOMUtils.defineLazyGetter(LoginManagerStorage_json.prototype,"log",()=>{let logger=LoginHelper.createLogger("Login storage");return logger.log.bind(logger);});const EXPORTED_SYMBOLS=["LoginManagerStorage_json"];