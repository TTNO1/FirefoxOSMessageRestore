//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ResetProfile"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const MOZ_APP_NAME=AppConstants.MOZ_APP_NAME;const MOZ_BUILD_APP=AppConstants.MOZ_BUILD_APP;var ResetProfile={resetSupported(){if(Services.policies&&!Services.policies.isAllowed("profileRefresh")){return false;}
let migrator="@mozilla.org/profile/migrator;1?app="+
MOZ_BUILD_APP+"&type="+
MOZ_APP_NAME;if(!(migrator in Cc)){return false;}
let profileService=Cc["@mozilla.org/toolkit/profile-service;1"].getService(Ci.nsIToolkitProfileService);let currentProfileDir=Services.dirsvc.get("ProfD",Ci.nsIFile);for(let profile of profileService.profiles){if(profile.rootDir&&profile.rootDir.equals(currentProfileDir)){return true;}}
return false;},openConfirmationDialog(window){let params={reset:false,};window.browsingContext.topChromeWindow.openDialog("chrome://global/content/resetProfile.xhtml",null,"modal,centerscreen,titlebar",params);if(!params.reset){return;}
let env=Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);env.set("MOZ_RESET_PROFILE_RESTART","1");Services.startup.quit(Ci.nsIAppStartup.eForceQuit|Ci.nsIAppStartup.eRestart);},};