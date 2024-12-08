//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["PhoneNumberUtils"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.import("resource://gre/modules/systemlibs.js");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{libcutils}=ChromeUtils.import("resource://gre/modules/systemlibs.js");var RIL_DEBUG=ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");ChromeUtils.defineModuleGetter(this,"MCC_ISO3166_TABLE","resource://gre/modules/mcc_iso3166_table.jsm");XPCOMUtils.defineLazyServiceGetter(this,"gIccService","@mozilla.org/icc/iccservice;1","nsIIccService");XPCOMUtils.defineLazyServiceGetter(this,"gMobileConnectionService","@mozilla.org/mobileconnection/mobileconnectionservice;1","nsIMobileConnectionService");var DEBUG=RIL_DEBUG.DEBUG_RIL;function debug(s){if(DEBUG){dump("-*- PhoneNumberutils: "+s+"\n");}}

const MIN_MATCH=10;const MAX_PHONE_NUMBER_LENGTH=50;const NON_DIALABLE_CHARS=/[^,#+\*\d]/g;const NON_DIALABLE_CHARS_ONCE=new RegExp(NON_DIALABLE_CHARS.source);const UNICODE_DIGITS=/[\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9]/g;const VALID_ALPHA_PATTERN=/[a-zA-Z]/g;const LEADING_PLUS_CHARS_PATTERN=/^[+\uFF0B]+/g;const kPropPersistDeviceCountryCode="persist.device.countrycode";const kPropDefaultCountryCode="ro.default.countrycode";var E161={a:2,b:2,c:2,d:3,e:3,f:3,g:4,h:4,i:4,j:5,k:5,l:5,m:6,n:6,o:6,p:7,q:7,r:7,s:7,t:8,u:8,v:8,w:9,x:9,y:9,z:9,};function updateDebugFlag(){ try{DEBUG=RIL_DEBUG.DEBUG_RIL||Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);}catch(e){}}
updateDebugFlag();this.PhoneNumberUtils={normalize(aNumber,numbersOnly){if(typeof aNumber!=="string"){return"";}
aNumber=aNumber.replace(UNICODE_DIGITS,function(ch){return String.fromCharCode(48+(ch.charCodeAt(0)&0xf));});if(!numbersOnly){aNumber=aNumber.replace(VALID_ALPHA_PATTERN,function(ch){return String(E161[ch.toLowerCase()]||0);});}
aNumber=aNumber.replace(LEADING_PLUS_CHARS_PATTERN,"+");aNumber=aNumber.replace(NON_DIALABLE_CHARS,"");return aNumber;},isPlainPhoneNumber(aNumber){if(typeof aNumber!=="string"){return false;}
var length=aNumber.length;var isTooLong=length>MAX_PHONE_NUMBER_LENGTH;var isEmpty=length===0;return!(isTooLong||isEmpty||NON_DIALABLE_CHARS_ONCE.test(aNumber));},match(aNumber1,aNumber2){if(typeof aNumber1!=="string"||typeof aNumber2!=="string"){return false;}
let normalizedNumber1=this.normalize(aNumber1);let normalizedNumber2=this.normalize(aNumber2);if(normalizedNumber1==normalizedNumber2){return true;}
let index1=normalizedNumber1.length-1;let index2=normalizedNumber2.length-1;let matched=0;while(index1>=0&&index2>=0){if(normalizedNumber1[index1]!=normalizedNumber2[index2]){break;}
index1--;index2--;matched++;}
if(matched>=MIN_MATCH){return true;}
return false;},



 _defaultCountryCode:libcutils.property_get(kPropDefaultCountryCode,""),defaultCountryCode(aClientId){let countryCodeStrings=this._defaultCountryCode;let countryCodes=countryCodeStrings.split(",");return countryCodes[aClientId];},_persistCountryCode:libcutils.property_get(kPropPersistDeviceCountryCode,""),persistCountryCode(aClientId){let countryCodeStrings=this._persistCountryCode;let countryCodes=countryCodeStrings.split(",");if(DEBUG){debug("persistCountryCode["+aClientId+"]: "+countryCodes[aClientId]);}
return countryCodes[aClientId]||null;},_storePersistCountryCode(aCountryName){libcutils.property_set(kPropPersistDeviceCountryCode,aCountryName);},storePersistCountryCode(aClientId,aCountryName){let countryCodeStrings=this._persistCountryCode;let countryCodes=countryCodeStrings.split(",");countryCodes[aClientId]=aCountryName;if(DEBUG){debug("storePersistCountryCode: "+countryCodes.join());}
this._storePersistCountryCode(countryCodes.join());},getCountryName(aClientId){let mcc;let countryName; let connection=gMobileConnectionService.getItemByServiceId(aClientId);let voice=connection&&connection.voice;if(voice&&voice.network&&voice.network.mcc){mcc=voice.network.mcc;if(DEBUG){debug("Network MCC: "+mcc);}} 
let icc=gIccService.getIccByServiceId(aClientId);let iccInfo=icc&&icc.iccInfo;if(!mcc&&iccInfo&&iccInfo.mcc){mcc=iccInfo.mcc;if(DEBUG){debug("SIM MCC: "+mcc);}} 
if(!mcc){try{mcc=Services.prefs.getCharPref("ril.lastKnownSimMcc");if(DEBUG){debug("Last known MCC: "+mcc);}}catch(e){}}
countryName=MCC_ISO3166_TABLE[mcc]||this.defaultCountryCode();if(DEBUG){debug("MCC: "+mcc+" countryName: "+countryName);}
return countryName;},updateCountryNameProperty(aClient){let countryName=this.getCountryName(aClient);if(countryName!==this.persistCountryCode(aClient)){this.storePersistCountryCode(aClient,countryName);}},};