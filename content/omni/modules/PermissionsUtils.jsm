//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------



var EXPORTED_SYMBOLS=["PermissionsUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var gImportedPrefBranches=new Set();function importPrefBranch(aPrefBranch,aPermission,aAction){let list=Services.prefs.getChildList(aPrefBranch);for(let pref of list){let origins=Services.prefs.getCharPref(pref,"");if(!origins){continue;}
origins=origins.split(",");for(let origin of origins){let principals=[];try{principals=[Services.scriptSecurityManager.createContentPrincipalFromOrigin(origin),];}catch(e){

try{let httpURI=Services.io.newURI("http://"+origin);let httpsURI=Services.io.newURI("https://"+origin);principals=[Services.scriptSecurityManager.createContentPrincipal(httpURI,{}),Services.scriptSecurityManager.createContentPrincipal(httpsURI,{}),];}catch(e2){}}
for(let principal of principals){try{Services.perms.addFromPrincipal(principal,aPermission,aAction);}catch(e){}}}
Services.prefs.setCharPref(pref,"");}}
var PermissionsUtils={importFromPrefs(aPrefBranch,aPermission){if(!aPrefBranch.endsWith(".")){aPrefBranch+=".";}
if(gImportedPrefBranches.has(aPrefBranch)){return;}
importPrefBranch(aPrefBranch+"whitelist.add",aPermission,Services.perms.ALLOW_ACTION);importPrefBranch(aPrefBranch+"blacklist.add",aPermission,Services.perms.DENY_ACTION);gImportedPrefBranches.add(aPrefBranch);},};