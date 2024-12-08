//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{PrivateBrowsingUtils}=ChromeUtils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");const{PromptUtils}=ChromeUtils.import("resource://gre/modules/SharedPromptUtils.jsm");ChromeUtils.defineModuleGetter(this,"LoginHelper","resource://gre/modules/LoginHelper.jsm");ChromeUtils.defineModuleGetter(this,"LoginManagerPrompter","resource://gre/modules/LoginManagerPrompter.jsm");const LoginInfo=Components.Constructor("@mozilla.org/login-manager/loginInfo;1","nsILoginInfo","init");const PromptAbuseHelper={getBaseDomainOrFallback(hostname){try{return Services.eTLD.getBaseDomainFromHost(hostname);}catch(e){return hostname;}},incrementPromptAbuseCounter(baseDomain,browser){if(!browser){return;}
if(!browser.authPromptAbuseCounter){browser.authPromptAbuseCounter={};}
if(!browser.authPromptAbuseCounter[baseDomain]){browser.authPromptAbuseCounter[baseDomain]=0;}
browser.authPromptAbuseCounter[baseDomain]+=1;},resetPromptAbuseCounter(baseDomain,browser){if(!browser||!browser.authPromptAbuseCounter){return;}
browser.authPromptAbuseCounter[baseDomain]=0;},hasReachedAbuseLimit(baseDomain,browser){if(!browser||!browser.authPromptAbuseCounter){return false;}
let abuseCounter=browser.authPromptAbuseCounter[baseDomain];if(this.abuseLimit<0){return false;}
return!!abuseCounter&&abuseCounter>=this.abuseLimit;},};XPCOMUtils.defineLazyPreferenceGetter(PromptAbuseHelper,"abuseLimit","prompts.authentication_dialog_abuse_limit");function LoginManagerAuthPromptFactory(){Services.obs.addObserver(this,"quit-application-granted",true);Services.obs.addObserver(this,"passwordmgr-crypto-login",true);Services.obs.addObserver(this,"passwordmgr-crypto-loginCanceled",true);}
LoginManagerAuthPromptFactory.prototype={classID:Components.ID("{749e62f4-60ae-4569-a8a2-de78b649660e}"),QueryInterface:ChromeUtils.generateQI(["nsIPromptFactory","nsIObserver","nsISupportsWeakReference",]),_asyncPrompts:{},_asyncPromptInProgress:false,observe(subject,topic,data){this.log("Observed: "+topic);if(topic=="quit-application-granted"){this._cancelPendingPrompts();}else if(topic=="passwordmgr-crypto-login"){this._doAsyncPrompt();}else if(topic=="passwordmgr-crypto-loginCanceled"){
this._cancelPendingPrompts();}},getPrompt(aWindow,aIID){var prompt=new LoginManagerAuthPrompter().QueryInterface(aIID);prompt.init(aWindow,this);return prompt;},_doAsyncPrompt(){if(this._asyncPromptInProgress){this.log("_doAsyncPrompt bypassed, already in progress");return;} 
var hashKey=null;for(hashKey in this._asyncPrompts){break;}
if(!hashKey){this.log("_doAsyncPrompt:run bypassed, no prompts in the queue");return;}

var prompt=this._asyncPrompts[hashKey];var prompter=prompt.prompter;var[origin,httpRealm]=prompter._getAuthTarget(prompt.channel,prompt.authInfo);if(Services.logins.uiBusy){let hasLogins=Services.logins.countLogins(origin,null,httpRealm)>0;if(!hasLogins&&LoginHelper.schemeUpgrades&&origin.startsWith("https://")){let httpOrigin=origin.replace(/^https:\/\//,"http://");hasLogins=Services.logins.countLogins(httpOrigin,null,httpRealm)>0;}
if(hasLogins){this.log("_doAsyncPrompt:run bypassed, master password UI busy");return;}}
var self=this;var runnable={cancel:false,run(){var ok=false;if(!this.cancel){try{self.log("_doAsyncPrompt:run - performing the prompt for '"+hashKey+"'");ok=prompter.promptAuth(prompt.channel,prompt.level,prompt.authInfo);}catch(e){if(e instanceof Components.Exception&&e.result==Cr.NS_ERROR_NOT_AVAILABLE){self.log("_doAsyncPrompt:run bypassed, UI is not available in this context");}else{Cu.reportError("LoginManagerAuthPrompter: _doAsyncPrompt:run: "+e+"\n");}}
delete self._asyncPrompts[hashKey];prompt.inProgress=false;self._asyncPromptInProgress=false;}
for(var consumer of prompt.consumers){if(!consumer.callback){
 continue;}
self.log("Calling back to "+consumer.callback+" ok="+ok);try{if(ok){consumer.callback.onAuthAvailable(consumer.context,prompt.authInfo);}else{consumer.callback.onAuthCancelled(consumer.context,!this.cancel);}}catch(e){}}
self._doAsyncPrompt();},};this._asyncPromptInProgress=true;prompt.inProgress=true;Services.tm.dispatchToMainThread(runnable);this.log("_doAsyncPrompt:run dispatched");},_cancelPendingPrompts(){this.log("Canceling all pending prompts...");var asyncPrompts=this._asyncPrompts;this.__proto__._asyncPrompts={};for(var hashKey in asyncPrompts){let prompt=asyncPrompts[hashKey];

if(prompt.inProgress){this.log("skipping a prompt in progress");continue;}
for(var consumer of prompt.consumers){if(!consumer.callback){continue;}
this.log("Canceling async auth prompt callback "+consumer.callback);try{consumer.callback.onAuthCancelled(consumer.context,true);}catch(e){}}}},};XPCOMUtils.defineLazyGetter(LoginManagerAuthPromptFactory.prototype,"log",()=>{let logger=LoginHelper.createLogger("LoginManagerAuthPromptFactory");return logger.log.bind(logger);});function LoginManagerAuthPrompter(){}
LoginManagerAuthPrompter.prototype={classID:Components.ID("{8aa66d77-1bbb-45a6-991e-b8f47751c291}"),QueryInterface:ChromeUtils.generateQI(["nsIAuthPrompt","nsIAuthPrompt2","nsILoginManagerAuthPrompter",]),_factory:null,_chromeWindow:null,_browser:null,_openerBrowser:null,__strBundle:null, get _strBundle(){if(!this.__strBundle){this.__strBundle=Services.strings.createBundle("chrome://passwordmgr/locale/passwordmgr.properties");if(!this.__strBundle){throw new Error("String bundle for Login Manager not present!");}}
return this.__strBundle;},__ellipsis:null,get _ellipsis(){if(!this.__ellipsis){this.__ellipsis="\u2026";try{this.__ellipsis=Services.prefs.getComplexValue("intl.ellipsis",Ci.nsIPrefLocalizedString).data;}catch(e){}}
return this.__ellipsis;}, get _inPrivateBrowsing(){if(this._chromeWindow){return PrivateBrowsingUtils.isWindowPrivate(this._chromeWindow);}



this.log("We have no chromeWindow so assume we're in a private context");return true;},get _allowRememberLogin(){if(!this._inPrivateBrowsing){return true;}
return LoginHelper.privateBrowsingCaptureEnabled;},prompt(aDialogTitle,aText,aPasswordRealm,aSavePassword,aDefaultText,aResult){if(aSavePassword!=Ci.nsIAuthPrompt.SAVE_PASSWORD_NEVER){throw new Components.Exception("prompt only supports SAVE_PASSWORD_NEVER",Cr.NS_ERROR_NOT_IMPLEMENTED);}
this.log("===== prompt() called =====");if(aDefaultText){aResult.value=aDefaultText;}
return Services.prompt.prompt(this._chromeWindow,aDialogTitle,aText,aResult,null,{});},promptUsernameAndPassword(aDialogTitle,aText,aPasswordRealm,aSavePassword,aUsername,aPassword){this.log("===== promptUsernameAndPassword() called =====");if(aSavePassword==Ci.nsIAuthPrompt.SAVE_PASSWORD_FOR_SESSION){throw new Components.Exception("promptUsernameAndPassword doesn't support SAVE_PASSWORD_FOR_SESSION",Cr.NS_ERROR_NOT_IMPLEMENTED);}
let foundLogins=null;var selectedLogin=null;var checkBox={value:false};var checkBoxLabel=null;var[origin,realm,unused]=this._getRealmInfo(aPasswordRealm);if(origin){var canRememberLogin=false;if(this._allowRememberLogin){canRememberLogin=aSavePassword==Ci.nsIAuthPrompt.SAVE_PASSWORD_PERMANENTLY&&Services.logins.getLoginSavingEnabled(origin);}
if(canRememberLogin){checkBoxLabel=this._getLocalizedString("rememberPassword");}
foundLogins=Services.logins.findLogins(origin,null,realm);
if(foundLogins.length){selectedLogin=foundLogins[0];

if(aUsername.value){selectedLogin=this._repickSelectedLogin(foundLogins,aUsername.value);}
if(selectedLogin){checkBox.value=true;aUsername.value=selectedLogin.username;if(!aPassword.value){aPassword.value=selectedLogin.password;}}}}
let autofilled=!!aPassword.value;var ok=Services.prompt.promptUsernameAndPassword(this._chromeWindow,aDialogTitle,aText,aUsername,aPassword,checkBoxLabel,checkBox);if(!ok||!checkBox.value||!origin){return ok;}
if(!aPassword.value){this.log("No password entered, so won't offer to save.");return ok;}


selectedLogin=this._repickSelectedLogin(foundLogins,aUsername.value);
let newLogin=new LoginInfo(origin,null,realm,aUsername.value,aPassword.value);if(!selectedLogin){ this.log("New login seen for "+realm);Services.logins.addLogin(newLogin);}else if(aPassword.value!=selectedLogin.password){ this.log("Updating password for  "+realm);this._updateLogin(selectedLogin,newLogin);}else{this.log("Login unchanged, no further action needed.");Services.logins.recordPasswordUse(selectedLogin,this._inPrivateBrowsing,"prompt_login",autofilled);}
return ok;},promptPassword(aDialogTitle,aText,aPasswordRealm,aSavePassword,aPassword){this.log("===== promptPassword called() =====");if(aSavePassword==Ci.nsIAuthPrompt.SAVE_PASSWORD_FOR_SESSION){throw new Components.Exception("promptPassword doesn't support SAVE_PASSWORD_FOR_SESSION",Cr.NS_ERROR_NOT_IMPLEMENTED);}
var checkBox={value:false};var checkBoxLabel=null;var[origin,realm,username]=this._getRealmInfo(aPasswordRealm);username=decodeURIComponent(username);if(origin&&!this._inPrivateBrowsing){var canRememberLogin=aSavePassword==Ci.nsIAuthPrompt.SAVE_PASSWORD_PERMANENTLY&&Services.logins.getLoginSavingEnabled(origin);if(canRememberLogin){checkBoxLabel=this._getLocalizedString("rememberPassword");}
if(!aPassword.value){var foundLogins=Services.logins.findLogins(origin,null,realm);


for(var i=0;i<foundLogins.length;++i){if(foundLogins[i].username==username){aPassword.value=foundLogins[i].password; return true;}}}}
var ok=Services.prompt.promptPassword(this._chromeWindow,aDialogTitle,aText,aPassword,checkBoxLabel,checkBox);if(ok&&checkBox.value&&origin&&aPassword.value){let newLogin=new LoginInfo(origin,null,realm,username,aPassword.value);this.log("New login seen for "+realm);Services.logins.addLogin(newLogin);}
return ok;},_getRealmInfo(aRealmString){var httpRealm=/^.+ \(.+\)$/;if(httpRealm.test(aRealmString)){return[null,null,null];}
var uri=Services.io.newURI(aRealmString);var pathname="";if(uri.pathQueryRef!="/"){pathname=uri.pathQueryRef;}
var formattedOrigin=this._getFormattedOrigin(uri);return[formattedOrigin,formattedOrigin+pathname,uri.username];},promptAuth(aChannel,aLevel,aAuthInfo){var selectedLogin=null;var checkbox={value:false};var checkboxLabel=null;var epicfail=false;var canAutologin=false;var notifyObj;var foundLogins;let autofilled=false;try{this.log("===== promptAuth called =====");

this._removeLoginNotifications();var[origin,httpRealm]=this._getAuthTarget(aChannel,aAuthInfo);foundLogins=LoginHelper.searchLoginsWithObject({origin,httpRealm,schemeUpgrades:LoginHelper.schemeUpgrades,});this.log("found",foundLogins.length,"matching logins.");let resolveBy=["scheme","timePasswordChanged"];foundLogins=LoginHelper.dedupeLogins(foundLogins,["username"],resolveBy,origin);this.log(foundLogins.length,"matching logins remain after deduping");if(foundLogins.length){selectedLogin=foundLogins[0];this._SetAuthInfo(aAuthInfo,selectedLogin.username,selectedLogin.password);autofilled=true; if(aAuthInfo.flags&Ci.nsIAuthInformation.AUTH_PROXY&&!(aAuthInfo.flags&Ci.nsIAuthInformation.PREVIOUS_FAILED)&&Services.prefs.getBoolPref("signon.autologin.proxy")&&!PrivateBrowsingUtils.permanentPrivateBrowsing){this.log("Autologin enabled, skipping auth prompt.");canAutologin=true;}
checkbox.value=true;}
var canRememberLogin=Services.logins.getLoginSavingEnabled(origin);if(!this._allowRememberLogin){canRememberLogin=false;}
notifyObj=this._getPopupNote();if(canRememberLogin&&!notifyObj){checkboxLabel=this._getLocalizedString("rememberPassword");}}catch(e){epicfail=true;Cu.reportError("LoginManagerAuthPrompter: Epic fail in promptAuth: "+e+"\n");}
var ok=canAutologin;let browser=this._browser;let baseDomain;
try{let topLevelHost=browser.currentURI.host;baseDomain=PromptAbuseHelper.getBaseDomainOrFallback(topLevelHost);}catch(e){baseDomain=PromptAbuseHelper.getBaseDomainOrFallback(origin);}
if(!ok){if(PromptAbuseHelper.hasReachedAbuseLimit(baseDomain,browser)){this.log("Blocking auth dialog, due to exceeding dialog bloat limit");return false;}



PromptAbuseHelper.incrementPromptAbuseCounter(baseDomain,browser);if(this._chromeWindow){PromptUtils.fireDialogEvent(this._chromeWindow,"DOMWillOpenModalDialog",this._browser);}
if(this._browser){ok=Services.prompt.promptAuthBC(this._browser.browsingContext,LoginManagerAuthPrompter.promptAuthModalType,aChannel,aLevel,aAuthInfo,checkboxLabel,checkbox);}else{
ok=Services.prompt.promptAuth(this._chromeWindow,aChannel,aLevel,aAuthInfo,checkboxLabel,checkbox);}}
let[username,password]=this._GetAuthInfo(aAuthInfo);
if(ok&&(username||password)){PromptAbuseHelper.resetPromptAbuseCounter(baseDomain,browser);}



var rememberLogin=notifyObj?canRememberLogin:checkbox.value;if(!ok||!rememberLogin||epicfail){return ok;}
try{if(!password){this.log("No password entered, so won't offer to save.");return ok;}


selectedLogin=this._repickSelectedLogin(foundLogins,username);
let newLogin=new LoginInfo(origin,null,httpRealm,username,password);if(!selectedLogin){this.log("New login seen for "+
username+" @ "+
origin+" ("+
httpRealm+")");if(notifyObj){let promptBrowser=LoginHelper.getBrowserForPrompt(browser);LoginManagerPrompter._showLoginCaptureDoorhanger(promptBrowser,newLogin,"password-save",{dismissed:this._inPrivateBrowsing,});Services.obs.notifyObservers(newLogin,"passwordmgr-prompt-save");}else{Services.logins.addLogin(newLogin);}}else if(password!=selectedLogin.password){this.log("Updating password for "+
username+" @ "+
origin+" ("+
httpRealm+")");if(notifyObj){this._showChangeLoginNotification(browser,selectedLogin,newLogin);}else{this._updateLogin(selectedLogin,newLogin);}}else{this.log("Login unchanged, no further action needed.");Services.logins.recordPasswordUse(selectedLogin,this._inPrivateBrowsing,"auth_login",autofilled);}}catch(e){Cu.reportError("LoginManagerAuthPrompter: Fail2 in promptAuth: "+e);}
return ok;},asyncPromptAuth(aChannel,aCallback,aContext,aLevel,aAuthInfo){var cancelable=null;try{this.log("===== asyncPromptAuth called =====");

this._removeLoginNotifications();cancelable=this._newAsyncPromptConsumer(aCallback,aContext);var[origin,httpRealm]=this._getAuthTarget(aChannel,aAuthInfo);var hashKey=aLevel+"|"+origin+"|"+httpRealm;this.log("Async prompt key = "+hashKey);var asyncPrompt=this._factory._asyncPrompts[hashKey];if(asyncPrompt){this.log("Prompt bound to an existing one in the queue, callback = "+
aCallback);asyncPrompt.consumers.push(cancelable);return cancelable;}
this.log("Adding new prompt to the queue, callback = "+aCallback);asyncPrompt={consumers:[cancelable],channel:aChannel,authInfo:aAuthInfo,level:aLevel,inProgress:false,prompter:this,};this._factory._asyncPrompts[hashKey]=asyncPrompt;this._factory._doAsyncPrompt();}catch(e){Cu.reportError("LoginManagerAuthPrompter: "+"asyncPromptAuth: "+
e+"\nFalling back to promptAuth\n");
 throw e;}
return cancelable;},init(aWindow=null,aFactory=null){if(!aWindow){this._chromeWindow=null;this._browser=null;}else if(aWindow.isChromeWindow){this._chromeWindow=aWindow; this._browser=null;}else{let{win,browser}=this._getChromeWindow(aWindow);this._chromeWindow=win;this._browser=browser;}
this._openerBrowser=null;this._factory=aFactory||null;this.log("===== initialized =====");},set browser(aBrowser){this._browser=aBrowser;},set openerBrowser(aOpenerBrowser){this._openerBrowser=aOpenerBrowser;},_removeLoginNotifications(){var popupNote=this._getPopupNote();if(popupNote){popupNote=popupNote.getNotification("password");}
if(popupNote){popupNote.remove();}},_showChangeLoginNotification(aBrowser,aOldLogin,aNewLogin,dismissed=false,notifySaved=false,autoSavedLoginGuid=""){let login=aOldLogin.clone();login.origin=aNewLogin.origin;login.formActionOrigin=aNewLogin.formActionOrigin;login.password=aNewLogin.password;login.username=aNewLogin.username;let messageStringID;if(aOldLogin.username===""&&login.username!==""&&login.password==aOldLogin.password){

messageStringID="updateLoginMsgAddUsername";}
let promptBrowser=LoginHelper.getBrowserForPrompt(aBrowser);LoginManagerPrompter._showLoginCaptureDoorhanger(promptBrowser,login,"password-change",{dismissed,extraAttr:notifySaved?"attention":"",},{notifySaved,messageStringID,autoSavedLoginGuid,});let oldGUID=aOldLogin.QueryInterface(Ci.nsILoginMetaInfo).guid;Services.obs.notifyObservers(aNewLogin,"passwordmgr-prompt-change",oldGUID);},_updateLogin(login,aNewLogin){var now=Date.now();var propBag=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);propBag.setProperty("formActionOrigin",aNewLogin.formActionOrigin);propBag.setProperty("origin",aNewLogin.origin);propBag.setProperty("password",aNewLogin.password);propBag.setProperty("username",aNewLogin.username);

propBag.setProperty("timePasswordChanged",now);propBag.setProperty("timeLastUsed",now);propBag.setProperty("timesUsedIncrement",1);
Services.logins.modifyLogin(login,propBag);},_getChromeWindow(aWindow){let browser=aWindow.docShell.chromeEventHandler;if(!browser){return null;}
let chromeWin=browser.ownerGlobal;if(!chromeWin){return null;}
return{win:chromeWin,browser};},_getNotifyWindow(){if(this._openerBrowser){let chromeDoc=this._chromeWindow.document.documentElement;

if(chromeDoc.getAttribute("chromehidden")&&!this._browser.canGoBack){this.log("Using opener window for notification prompt.");return{win:this._openerBrowser.ownerGlobal,browser:this._openerBrowser,};}}
return{win:this._chromeWindow,browser:this._browser,};},_getPopupNote(){let popupNote=null;try{let{win:notifyWin}=this._getNotifyWindow();popupNote=notifyWin.wrappedJSObject.PopupNotifications;}catch(e){this.log("Popup notifications not available on window");}
return popupNote;},_repickSelectedLogin(foundLogins,username){for(var i=0;i<foundLogins.length;i++){if(foundLogins[i].username==username){return foundLogins[i];}}
return null;},_getLocalizedString(key,formatArgs){if(formatArgs){return this._strBundle.formatStringFromName(key,formatArgs);}
return this._strBundle.GetStringFromName(key);},_sanitizeUsername(username){if(username.length>30){username=username.substring(0,30);username+=this._ellipsis;}
return username.replace(/['"]/g,"");},_getFormattedOrigin(aURI){let uri;if(aURI instanceof Ci.nsIURI){uri=aURI;}else{uri=Services.io.newURI(aURI);}
return uri.scheme+"://"+uri.displayHostPort;},_getShortDisplayHost(aURIString){var displayHost;var idnService=Cc["@mozilla.org/network/idn-service;1"].getService(Ci.nsIIDNService);try{var uri=Services.io.newURI(aURIString);var baseDomain=Services.eTLD.getBaseDomain(uri);displayHost=idnService.convertToDisplayIDN(baseDomain,{});}catch(e){this.log("_getShortDisplayHost couldn't process "+aURIString);}
if(!displayHost){displayHost=aURIString;}
return displayHost;},_getAuthTarget(aChannel,aAuthInfo){var origin,realm;
if(aAuthInfo.flags&Ci.nsIAuthInformation.AUTH_PROXY){this.log("getAuthTarget is for proxy auth");if(!(aChannel instanceof Ci.nsIProxiedChannel)){throw new Error("proxy auth needs nsIProxiedChannel");}
var info=aChannel.proxyInfo;if(!info){throw new Error("proxy auth needs nsIProxyInfo");}
var idnService=Cc["@mozilla.org/network/idn-service;1"].getService(Ci.nsIIDNService);origin="moz-proxy://"+
idnService.convertUTF8toACE(info.host)+":"+
info.port;realm=aAuthInfo.realm;if(!realm){realm=origin;}
return[origin,realm];}
origin=this._getFormattedOrigin(aChannel.URI);

realm=aAuthInfo.realm;if(!realm){realm=origin;}
return[origin,realm];},_GetAuthInfo(aAuthInfo){var username,password;var flags=aAuthInfo.flags;if(flags&Ci.nsIAuthInformation.NEED_DOMAIN&&aAuthInfo.domain){username=aAuthInfo.domain+"\\"+aAuthInfo.username;}else{username=aAuthInfo.username;}
password=aAuthInfo.password;return[username,password];},_SetAuthInfo(aAuthInfo,username,password){var flags=aAuthInfo.flags;if(flags&Ci.nsIAuthInformation.NEED_DOMAIN){ var idx=username.indexOf("\\");if(idx==-1){aAuthInfo.username=username;}else{aAuthInfo.domain=username.substring(0,idx);aAuthInfo.username=username.substring(idx+1);}}else{aAuthInfo.username=username;}
aAuthInfo.password=password;},_newAsyncPromptConsumer(aCallback,aContext){return{QueryInterface:ChromeUtils.generateQI(["nsICancelable"]),callback:aCallback,context:aContext,cancel(){this.callback.onAuthCancelled(this.context,false);this.callback=null;this.context=null;},};},};XPCOMUtils.defineLazyGetter(LoginManagerAuthPrompter.prototype,"log",()=>{let logger=LoginHelper.createLogger("LoginManagerAuthPrompter");return logger.log.bind(logger);});XPCOMUtils.defineLazyPreferenceGetter(LoginManagerAuthPrompter,"promptAuthModalType","prompts.modalType.httpAuth",Services.prompt.MODAL_TYPE_WINDOW);const EXPORTED_SYMBOLS=["LoginManagerAuthPromptFactory","LoginManagerAuthPrompter",];