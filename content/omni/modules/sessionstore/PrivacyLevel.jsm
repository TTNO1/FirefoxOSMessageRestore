"use strict";var EXPORTED_SYMBOLS=["PrivacyLevel"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const PREF="browser.sessionstore.privacy_level";

const PRIVACY_ENCRYPTED=1;const PRIVACY_FULL=2;var PrivacyLevel=Object.freeze({check(url){return PrivacyLevel.canSave(url.startsWith("https:"));},canSave(isHttps){let level=Services.prefs.getIntPref(PREF);if(level==PRIVACY_FULL){return false;}
if(isHttps&&level==PRIVACY_ENCRYPTED){return false;}
return true;},});