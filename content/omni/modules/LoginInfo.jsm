//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"LoginHelper","resource://gre/modules/LoginHelper.jsm");function nsLoginInfo(){}
nsLoginInfo.prototype={classID:Components.ID("{0f2f347c-1e4f-40cc-8efd-792dea70a85e}"),QueryInterface:ChromeUtils.generateQI(["nsILoginInfo","nsILoginMetaInfo"]),origin:null,formActionOrigin:null,httpRealm:null,username:null,password:null,usernameField:null,passwordField:null,get displayOrigin(){let displayOrigin=this.origin;try{let uri=Services.io.newURI(this.origin); displayOrigin=uri.displayHostPort||this.origin;}catch(ex){}
if(this.httpRealm===null){return displayOrigin;}
return`${displayOrigin} (${this.httpRealm})`;},get hostname(){return this.origin;},get formSubmitURL(){return this.formActionOrigin;},init(aOrigin,aFormActionOrigin,aHttpRealm,aUsername,aPassword,aUsernameField="",aPasswordField=""){this.origin=aOrigin;this.formActionOrigin=aFormActionOrigin;this.httpRealm=aHttpRealm;this.username=aUsername;this.password=aPassword;this.usernameField=aUsernameField||"";this.passwordField=aPasswordField||"";},matches(aLogin,ignorePassword){return LoginHelper.doLoginsMatch(this,aLogin,{ignorePassword,});},equals(aLogin){if(this.origin!=aLogin.origin||this.formActionOrigin!=aLogin.formActionOrigin||this.httpRealm!=aLogin.httpRealm||this.username!=aLogin.username||this.password!=aLogin.password||this.usernameField!=aLogin.usernameField||this.passwordField!=aLogin.passwordField){return false;}
return true;},clone(){let clone=Cc["@mozilla.org/login-manager/loginInfo;1"].createInstance(Ci.nsILoginInfo);clone.init(this.origin,this.formActionOrigin,this.httpRealm,this.username,this.password,this.usernameField,this.passwordField); clone.QueryInterface(Ci.nsILoginMetaInfo);clone.guid=this.guid;clone.timeCreated=this.timeCreated;clone.timeLastUsed=this.timeLastUsed;clone.timePasswordChanged=this.timePasswordChanged;clone.timesUsed=this.timesUsed;return clone;},guid:null,timeCreated:null,timeLastUsed:null,timePasswordChanged:null,timesUsed:null,};const EXPORTED_SYMBOLS=["nsLoginInfo"];