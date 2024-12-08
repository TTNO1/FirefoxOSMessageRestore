//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.import("resource://gre/modules/Promise.jsm");const{libcutils}=ChromeUtils.import("resource://gre/modules/systemlibs.js");XPCOMUtils.defineLazyServiceGetter(this,"gSettingsManager","@mozilla.org/sidl-native/settings;1","nsISettingsManager");XPCOMUtils.defineLazyServiceGetter(this,"gCustomizationInfo","@kaiostech.com/customizationinfo;1","nsICustomizationInfo");XPCOMUtils.defineLazyServiceGetter(this,"gDataCallInterfaceService","@mozilla.org/datacall/interfaceservice;1","nsIDataCallInterfaceService");XPCOMUtils.defineLazyServiceGetter(this,"gMobileConnectionService","@mozilla.org/mobileconnection/mobileconnectionservice;1","nsIMobileConnectionService");XPCOMUtils.defineLazyServiceGetter(this,"gIccService","@mozilla.org/icc/iccservice;1","nsIIccService");XPCOMUtils.defineLazyServiceGetter(this,"gNetworkManager","@mozilla.org/network/manager;1","nsINetworkManager");XPCOMUtils.defineLazyServiceGetter(this,"gPCOService","@kaiostech.com/pcoservice;1","nsIPCOService");XPCOMUtils.defineLazyGetter(this,"gRadioInterfaceLayer",function(){let ril={numRadioInterfaces:0};try{ril=Cc["@mozilla.org/ril;1"].getService(Ci.nsIRadioInterfaceLayer);}catch(e){}
return ril;});XPCOMUtils.defineLazyGetter(this,"RIL",function(){return ChromeUtils.import("resource://gre/modules/ril_consts.js");});XPCOMUtils.defineLazyServiceGetter(this,"gRil","@mozilla.org/ril;1","nsIRadioInterfaceLayer");const{BinderServices}=ChromeUtils.import("resource://gre/modules/BinderServices.jsm");var RIL_DEBUG=ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");var RILQUIRKS_DATA_REGISTRATION_ON_DEMAND=libcutils.property_get("ro.moz.ril.data_reg_on_demand","false")=="true";var RILQUIRKS_SUBSCRIPTION_CONTROL=libcutils.property_get("ro.moz.ril.subscription_control","false")=="true";var RILQUIRKS_ECC_DEFAULT_APN=true;const DATACALLMANAGER_CID=Components.ID("{35b9efa2-e42c-45ce-8210-0a13e6f4aadc}");const DATACALLHANDLER_CID=Components.ID("{132b650f-c4d8-4731-96c5-83785cb31dee}");const RILNETWORKINTERFACE_CID=Components.ID("{9574ee84-5d0d-4814-b9e6-8b279e03dcf4}");const RILNETWORKINFO_CID=Components.ID("{dd6cf2f0-f0e3-449f-a69e-7c34fdcb8d4b}");const TOPIC_XPCOM_SHUTDOWN="xpcom-shutdown";const TOPIC_PREF_CHANGED="nsPref:changed";const TOPIC_DATA_CALL_ERROR="data-call-error";const NETWORK_TYPE_UNKNOWN=Ci.nsINetworkInfo.NETWORK_TYPE_UNKNOWN;const NETWORK_TYPE_WIFI=Ci.nsINetworkInfo.NETWORK_TYPE_WIFI;const NETWORK_TYPE_MOBILE=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE;const NETWORK_TYPE_MOBILE_MMS=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_MMS;const NETWORK_TYPE_MOBILE_SUPL=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_SUPL;const NETWORK_TYPE_MOBILE_IMS=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_IMS;const NETWORK_TYPE_MOBILE_DUN=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_DUN;const NETWORK_TYPE_MOBILE_FOTA=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_FOTA;const NETWORK_TYPE_MOBILE_HIPRI=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_HIPRI;const NETWORK_TYPE_MOBILE_CBS=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_CBS;const NETWORK_TYPE_MOBILE_IA=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_IA;const NETWORK_TYPE_MOBILE_ECC=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_ECC;const NETWORK_TYPE_MOBILE_XCAP=Ci.nsINetworkInfo.NETWORK_TYPE_MOBILE_XCAP;const NETWORK_STATE_UNKNOWN=Ci.nsINetworkInfo.NETWORK_STATE_UNKNOWN;const NETWORK_STATE_CONNECTING=Ci.nsINetworkInfo.NETWORK_STATE_CONNECTING;const NETWORK_STATE_CONNECTED=Ci.nsINetworkInfo.NETWORK_STATE_CONNECTED;const NETWORK_STATE_DISCONNECTING=Ci.nsINetworkInfo.NETWORK_STATE_DISCONNECTING;const NETWORK_STATE_DISCONNECTED=Ci.nsINetworkInfo.NETWORK_STATE_DISCONNECTED;const INT32_MAX=2147483647;const kApnSettingKey="ril.data.apnSettings.sim";const TCP_BUFFER_SIZES=[null,"4092,8760,48000,4096,8760,48000","4093,26280,70800,4096,16384,70800","58254,349525,1048576,58254,349525,1048576","16384,32768,131072,4096,16384,102400","16384,32768,131072,4096,16384,102400","16384,32768,131072,4096,16384,102400","4094,87380,262144,4096,16384,262144","4094,87380,262144,4096,16384,262144","61167,367002,1101005,8738,52429,262114","40778,244668,734003,16777,100663,301990","40778,244668,734003,16777,100663,301990","4094,87380,262144,4096,16384,262144","131072,262144,1048576,4096,16384,524288","524288,1048576,2097152,262144,524288,1048576","122334,734003,2202010,32040,192239,576717","4096,87380,110208,4096,16384,110208","4096,87380,110208,4096,16384,110208","122334,734003,2202010,32040,192239,576717","122334,734003,2202010,32040,192239,576717",];const RIL_RADIO_CDMA_TECHNOLOGY_BITMASK=(1<<(RIL.GECKO_RADIO_TECH.indexOf("is95a")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("is95b")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("1xrtt")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("evdo0")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("evdoa")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("evdob")-1))|(1<<(RIL.GECKO_RADIO_TECH.indexOf("ehrpd")-1));var DEBUG=RIL_DEBUG.DEBUG_RIL;function updateDebugFlag(){ let debugPref;try{debugPref=debugPref||Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);}catch(e){debugPref=false;}
DEBUG=debugPref||RIL_DEBUG.DEBUG_RIL;}
updateDebugFlag();function DataCallManager(){this._connectionHandlers=[];let numRadioInterfaces=gMobileConnectionService.numItems;for(let clientId=0;clientId<numRadioInterfaces;clientId++){this._connectionHandlers.push(new DataCallHandler(clientId));let apnSetting=kApnSettingKey+(clientId+1);this.addSettingObserver(apnSetting);}
this.getSettingValue("ril.data.enabled");this.getSettingValue("ril.data.roaming_enabled");this.getSettingValue("ril.data.defaultServiceId");this.addSettingObserver("ril.data.enabled");this.addSettingObserver("ril.data.roaming_enabled");this.addSettingObserver("ril.data.defaultServiceId");Services.obs.addObserver(this,TOPIC_XPCOM_SHUTDOWN);Services.prefs.addObserver(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED,this);}
DataCallManager.prototype={classID:DATACALLMANAGER_CID,QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallManager,Ci.nsIObserver,Ci.nsISettingsObserver,]),_connectionHandlers:null,
_dataEnabled:false,
_dataDefaultClientId:-1,
_currentDataClientId:-1,
_pendingDataCallRequest:null,debug(aMsg){dump("-*- DataCallManager: "+aMsg+"\n");},get dataDefaultServiceId(){return this._dataDefaultClientId;},getDataCallHandler(aClientId){let handler=this._connectionHandlers[aClientId];if(!handler){throw Components.Exception("",Cr.NS_ERROR_UNEXPECTED);}
return handler;},_setDataRegistration(aDataCallInterface,aAttach){return new Promise(function(aResolve,aReject){let callback={QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallCallback]),notifySuccess(){aResolve();},notifyError(aErrorMsg){aReject(aErrorMsg);},};aDataCallInterface.setDataRegistration(aAttach,callback);});},_handleDataClientIdChange(aNewClientId){if(this._dataDefaultClientId===aNewClientId){return;}
this._dataDefaultClientId=aNewClientId;BinderServices.datacall.onDefaultSlotIdChanged(this._dataDefaultClientId);if(this._currentDataClientId==-1){this._currentDataClientId=this._dataDefaultClientId;let connHandler=this._connectionHandlers[this._currentDataClientId];let dcInterface=connHandler.dataCallInterface;connHandler.dataCallSettings.defaultDataSlot=true;if(RILQUIRKS_DATA_REGISTRATION_ON_DEMAND||RILQUIRKS_SUBSCRIPTION_CONTROL){this._setDataRegistration(dcInterface,true);}
if(this._dataEnabled){let settings=connHandler.dataCallSettings;settings.oldEnabled=settings.enabled;settings.enabled=true;connHandler.updateAllRILNetworkInterface();}
return;}
let oldConnHandler=this._connectionHandlers[this._currentDataClientId];let oldIface=oldConnHandler.dataCallInterface;let oldSettings=oldConnHandler.dataCallSettings;let newConnHandler=this._connectionHandlers[this._dataDefaultClientId];let newIface=newConnHandler.dataCallInterface;let newSettings=newConnHandler.dataCallSettings;let applyPendingDataSettings=()=>{if(DEBUG){this.debug("Apply pending data registration and settings.");}
if(RILQUIRKS_DATA_REGISTRATION_ON_DEMAND||RILQUIRKS_SUBSCRIPTION_CONTROL){if(this._dataEnabled){newSettings.oldEnabled=newSettings.enabled;newSettings.enabled=true;}
this._currentDataClientId=this._dataDefaultClientId;oldSettings.defaultDataSlot=false;newSettings.defaultDataSlot=true;this._setDataRegistration(oldIface,false);this._setDataRegistration(newIface,true).then(()=>{newConnHandler.updateAllRILNetworkInterface();});return;}
if(this._dataEnabled){newSettings.oldEnabled=newSettings.enabled;newSettings.enabled=true;}
this._currentDataClientId=this._dataDefaultClientId;newConnHandler.updateAllRILNetworkInterface();};if(this._dataEnabled){oldSettings.oldEnabled=oldSettings.enabled;oldSettings.enabled=false;}
oldConnHandler.deactivateAllDataCallsAndWait(RIL.DATACALL_DEACTIVATE_SERVICEID_CHANGED).then(()=>{applyPendingDataSettings();});},_shutdown(){for(let handler of this._connectionHandlers){handler.shutdown();}
this._connectionHandlers=null;let numRadioInterfaces=gMobileConnectionService.numItems;for(let clientId=0;clientId<numRadioInterfaces;clientId++){let apnSetting=kApnSettingKey+(clientId+1);this.removeSettingObserver(apnSetting);}
this.removeSettingObserver("ril.data.enabled");this.removeSettingObserver("ril.data.roaming_enabled");this.removeSettingObserver("ril.data.defaultServiceId");Services.prefs.removeObserver(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED,this);Services.obs.removeObserver(this,TOPIC_XPCOM_SHUTDOWN);},handleApnSettingChanged(aClientId,aApnList){let handler=this._connectionHandlers[aClientId];if(handler&&aApnList){handler.updateApnSettings(aApnList);}
if(aApnList&&aApnList.length>0){let meterInterfaceList=[];if(gCustomizationInfo){meterInterfaceList=gCustomizationInfo.getCustomizedValue(aClientId,"meterInterfaceList",[]);}
if(meterInterfaceList.length==0){this.debug("Config default type as meter.");meterInterfaceList.push("default");}
this.debug("meterInterfaceList:"+JSON.stringify(meterInterfaceList));handler.configMeter(meterInterfaceList);}
if(aApnList&&aApnList.length>0){let allowed=null;if(gCustomizationInfo){ allowed=gCustomizationInfo.getFihCustomizedValue(aClientId,"mobileSettingWhiteList",[]);}
if(allowed.length>0){handler.mobileWhiteList=allowed;if(DEBUG){this.debug("mobileWhiteList["+
aClientId+"]:"+
JSON.stringify(handler.mobileWhiteList));}}
this.setSettingValue("ril.data.mobileWhiteList",handler.mobileWhiteList);}},handleSettingChanged(aName,aResult){if(aName&&aName.includes(kApnSettingKey)){if(DEBUG){this.debug(aName+"is now "+aResult);}
let clientId=aName.split(kApnSettingKey)[1]-1;let resultApnObj=JSON.parse(aResult);this.handleApnSettingChanged(clientId,resultApnObj);return;}
switch(aName){case"ril.data.enabled":if(DEBUG){this.debug("'ril.data.enabled' is now "+aResult);}
if(this._dataEnabled===aResult){break;}
this._dataEnabled=aResult==="true";if(DEBUG){this.debug("Default id for data call: "+this._dataDefaultClientId);}
if(this._dataDefaultClientId===-1){break;}
let ril=gRil.getRadioInterface(this._dataDefaultClientId);if(ril){try{ril.sendWorkerMessage("setDataEnabled",{"enable":this._dataEnabled},function(response){if(response.errorMsg){}else{}
let connHandler=this._connectionHandlers[this._dataDefaultClientId];let settings=connHandler.dataCallSettings;settings.oldEnabled=settings.enabled;settings.enabled=this._dataEnabled;connHandler.updateAllRILNetworkInterface();}.bind(this));return;}catch(e){}}
let connHandler=this._connectionHandlers[this._dataDefaultClientId];let settings=connHandler.dataCallSettings;settings.oldEnabled=settings.enabled;settings.enabled=this._dataEnabled;connHandler.updateAllRILNetworkInterface();break;case"ril.data.roaming_enabled":if(DEBUG){this.debug("'ril.data.roaming_enabled' is now "+aResult);this.debug("Default id for data call: "+this._dataDefaultClientId);}
for(let clientId=0;clientId<this._connectionHandlers.length;clientId++){let connHandler=this._connectionHandlers[clientId];let settings=connHandler.dataCallSettings;let resultRoamObj=JSON.parse(aResult);settings.roamingEnabled=Array.isArray(resultRoamObj)?resultRoamObj[clientId]:resultRoamObj;}
if(this._dataDefaultClientId===-1){break;}
this._connectionHandlers[this._dataDefaultClientId].updateAllRILNetworkInterface();break;case"ril.data.defaultServiceId":aResult=aResult||0;if(DEBUG){this.debug("'ril.data.defaultServiceId' is now "+aResult);}
this._handleDataClientIdChange(aResult);break;}},observeSetting(aSettingInfo){if(aSettingInfo){let name=aSettingInfo.name;let result=aSettingInfo.value;this.handleSettingChanged(name,result);}},observe(aSubject,aTopic,aData){switch(aTopic){case TOPIC_PREF_CHANGED:if(aData===RIL_DEBUG.PREF_RIL_DEBUG_ENABLED){updateDebugFlag();}
break;case TOPIC_XPCOM_SHUTDOWN:this._shutdown();break;}},getSettingValue(aKey){if(!aKey){return;}
if(gSettingsManager){if(DEBUG){this.debug("get "+aKey+" setting.");}
let self=this;gSettingsManager.get(aKey,{resolve:info=>{self.observeSetting(info);},reject:()=>{if(DEBUG){self.debug("get "+aKey+" failed.");}},});}},setSettingValue(aKey,aValue){if(!aKey||!aValue){return;}
if(gSettingsManager){if(DEBUG){this.debug("set "+aKey+" setting with value = "+JSON.stringify(aValue));}
let self=this;gSettingsManager.set([{name:aKey,value:JSON.stringify(aValue)}],{resolve:()=>{if(DEBUG){self.debug(" Set "+aKey+" succedded. ");}},reject:()=>{if(DEBUG){self.debug("Set "+aKey+" failed.");}},});}},addSettingObserver(aKey){if(!aKey){return;}
if(gSettingsManager){if(DEBUG){this.debug("add "+aKey+" setting observer.");}
let self=this;gSettingsManager.addObserver(aKey,this,{resolve:()=>{if(DEBUG){self.debug("observed "+aKey+" successed.");}},reject:()=>{if(DEBUG){self.debug("observed "+aKey+" failed.");}},});}},removeSettingObserver(aKey){if(!aKey){return;}
if(gSettingsManager){if(DEBUG){this.debug("remove "+aKey+" setting observer.");}
let self=this;gSettingsManager.removeObserver(aKey,this,{resolve:()=>{if(DEBUG){self.debug("remove observer "+aKey+" successed.");}},reject:()=>{if(DEBUG){self.debug("remove observer "+aKey+" failed.");}},});}},};function bitmaskHasTech(aBearerBitmask,aRadioTech){if(aBearerBitmask==0){return true;}else if(aRadioTech>0){return(aBearerBitmask&(1<<(aRadioTech+1)))!=0;}
return false;}
function bitmaskToString(aBearerBitmask){if(aBearerBitmask==0||aBearerBitmask===undefined){return 0;}
let val="";for(let i=1;i<RIL.GECKO_RADIO_TECH.length;i++){if((aBearerBitmask&(1<<(i-1)))!=0){val=val.concat(i+"|");}}
return val;}
function bearerBitmapHasCdma(aBearerBitmask){return(RIL_RADIO_CDMA_TECHNOLOGY_BITMASK&aBearerBitmask)!=0;}
function convertToDataCallType(aNetworkType){switch(aNetworkType){case NETWORK_TYPE_MOBILE:return"default";case NETWORK_TYPE_MOBILE_MMS:return"mms";case NETWORK_TYPE_MOBILE_SUPL:return"supl";case NETWORK_TYPE_MOBILE_IMS:return"ims";case NETWORK_TYPE_MOBILE_DUN:return"dun";case NETWORK_TYPE_MOBILE_FOTA:return"fota";case NETWORK_TYPE_MOBILE_IA:return"ia";case NETWORK_TYPE_MOBILE_XCAP:return"xcap";case NETWORK_TYPE_MOBILE_CBS:return"cbs";case NETWORK_TYPE_MOBILE_HIPRI:return"hipri";case NETWORK_TYPE_MOBILE_ECC:return"Emergency";default:return"unknown";}}
function convertApnType(aApnType){switch(aApnType){case"default":return NETWORK_TYPE_MOBILE;case"mms":return NETWORK_TYPE_MOBILE_MMS;case"supl":return NETWORK_TYPE_MOBILE_SUPL;case"ims":return NETWORK_TYPE_MOBILE_IMS;case"dun":return NETWORK_TYPE_MOBILE_DUN;case"fota":return NETWORK_TYPE_MOBILE_FOTA;case"ia":return NETWORK_TYPE_MOBILE_IA;case"xcap":return NETWORK_TYPE_MOBILE_XCAP;case"cbs":return NETWORK_TYPE_MOBILE_CBS;case"hipri":return NETWORK_TYPE_MOBILE_HIPRI;case"Emergency":return NETWORK_TYPE_MOBILE_ECC;default:return NETWORK_TYPE_UNKNOWN;}}
function convertToDataCallState(aState){switch(aState){case NETWORK_STATE_CONNECTING:return"connecting";case NETWORK_STATE_CONNECTED:return"connected";case NETWORK_STATE_DISCONNECTING:return"disconnecting";case NETWORK_STATE_DISCONNECTED:return"disconnected";default:return"unknown";}}
function DataCallHandler(aClientId){this.clientId=aClientId;this.dataCallSettings={oldEnabled:false,enabled:false,roamingEnabled:false,defaultDataSlot:false,};this._dataCalls=[];this._listeners=[];
this.dataNetworkInterfaces=new Map();this.dataCallInterface=gDataCallInterfaceService.getDataCallInterface(aClientId);this.dataCallInterface.registerListener(this);let mobileConnection=gMobileConnectionService.getItemByServiceId(aClientId);mobileConnection.registerListener(this);this._dataInfo={state:mobileConnection.data.state,type:mobileConnection.data.type,roaming:mobileConnection.data.roaming,};this.needRecoverAfterReset=false;this.mobileWhiteList=[];this._activeApnSettings=[];this._activeApnSettings=this._initailEmergencyApn();if(this._activeApnSettings){this.debug("===START INIT===");for(let inputApnSetting of this._activeApnSettings){this.debug(JSON.stringify(inputApnSetting));}
this.debug("===END===");}
this._setupApnSettings(this._activeApnSettings);}
DataCallHandler.prototype={classID:DATACALLHANDLER_CID,QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallHandler,Ci.nsIDataCallInterfaceListener,Ci.nsIMobileConnectionListener,]),clientId:0,dataCallInterface:null,dataCallSettings:null,dataNetworkInterfaces:null,_dataCalls:null,_dataInfo:null,_activeApnSettings:null, fotaApnChanged:false,oldFotaDataNetworkInterface:null,_pendingApnSettings:null,needRecoverAfterReset:false,mobileWhiteList:null,debug(aMsg){dump("-*- DataCallHandler["+this.clientId+"]: "+aMsg+"\n");},shutdown(){ this.dataNetworkInterfaces.forEach(function(networkInterface){gNetworkManager.unregisterNetworkInterface(networkInterface);networkInterface.shutdown();networkInterface=null;});this.dataNetworkInterfaces.clear();this._dataCalls=[];this.clientId=null;this._activeApnSettings=null;this.needRecoverAfterReset=false;this.dataCallInterface.unregisterListener(this);this.dataCallInterface=null;this.mobileWhiteList=null;let mobileConnection=gMobileConnectionService.getItemByServiceId(this.clientId);mobileConnection.unregisterListener(this);},_validateApnSetting(aApnSetting){return(aApnSetting&&aApnSetting.apn&&aApnSetting.types&&aApnSetting.types.length);},containsApntype(){},_initailEmergencyApn(aNewApnSettings){this.debug("RILQUIRKS_ECC_DEFAULT_APN ="+RILQUIRKS_ECC_DEFAULT_APN);if(!RILQUIRKS_ECC_DEFAULT_APN){return aNewApnSettings;}
let hasEccApn=false;if(aNewApnSettings){for(let inputApnSetting of aNewApnSettings){for(let i=0;i<inputApnSetting.types.length;i++){let networkType=convertApnType(inputApnSetting.types[i]);if(networkType==NETWORK_TYPE_MOBILE_ECC){hasEccApn=true;break;}}
if(hasEccApn){break;}}}else{aNewApnSettings=[];}
let emergency_apn="VZWEMERGENCY"; if(!hasEccApn){let apn_emergency_defaults={carrier:"Emergency",apn:emergency_apn,user:"",password:"",proxy:"",port:"",mmsc:"",mmsproxy:"",mmsport:"",authtype:"notDefined",types:["Emergency"],protocol:"IPV4V6",roaming_protocol:"IPV4V6",carrier_enabled:true,supportedApnTypesBitmap:1<<9,};this.debug("_handleEmergencyApn merge the ECC apn.");aNewApnSettings.push(apn_emergency_defaults);let eccSettingKey="ril.emergency.apn.sim"+(this.clientId+1);this.debug("eccSettingKey ="+eccSettingKey);let self=this;gSettingsManager.set([{name:eccSettingKey,value:JSON.stringify(emergency_apn)}],{resolve:()=>{if(DEBUG){self.debug("Set ril.emergency.apn.sim succedded.");}},reject:()=>{if(DEBUG){self.debug("Set ril.emergency.apn.sim failed.");}},});}
return aNewApnSettings;},_setupApnSettings(aNewApnSettings){if(!aNewApnSettings){return;}
if(DEBUG){this.debug("_setupApnSettings: "+JSON.stringify(aNewApnSettings));}
this.dataNetworkInterfaces.forEach(function(networkInterface){gNetworkManager.unregisterNetworkInterface(networkInterface);networkInterface.shutdown();networkInterface=null;});this.dataNetworkInterfaces.clear();this._dataCalls=[];let apnContextsList=new Map();this._activeApnSettings=aNewApnSettings; let radioInterface;if(gRadioInterfaceLayer){radioInterface=gRadioInterfaceLayer.getRadioInterface(this.clientId);}

for(let inputApnSetting of aNewApnSettings){if(!this._validateApnSetting(inputApnSetting)){continue;}
let dataCall;for(let i=0;i<this._dataCalls.length;i++){if(this._dataCalls[i].canHandleApn(inputApnSetting)){if(DEBUG){this.debug("Found shareable DataCall, reusing it.");}
dataCall=this._dataCalls[i];break;}}
if(!dataCall){if(DEBUG){this.debug("No shareable DataCall found, creating one. inputApnSetting="+
JSON.stringify(inputApnSetting));}
dataCall=new DataCall(this.clientId,inputApnSetting,this);this._dataCalls.push(dataCall);}
for(let i=0;i<inputApnSetting.types.length;i++){let networkType=convertApnType(inputApnSetting.types[i]);if(networkType===NETWORK_TYPE_UNKNOWN){if(DEBUG){this.debug("Invalid apn type: "+networkType);}
continue;}
let dataCallsList=[];if(apnContextsList.get(networkType)!==undefined){dataCallsList=apnContextsList.get(networkType);}
if(DEBUG){this.debug("type: "+
convertToDataCallType(networkType)+", dataCall:"+
dataCall.apnSetting.apn);}
dataCallsList.push(dataCall);apnContextsList.set(networkType,dataCallsList); if(networkType===NETWORK_TYPE_MOBILE_XCAP&&radioInterface){let ims_xcap_config_item=73851;this.debug("set XCAP APN to NV73851. APN: "+dataCall.apnSetting.apn);radioInterface.sendWorkerMessage("nvWriteItem",{itemId:ims_xcap_config_item,itemValue:dataCall.apnSetting.apn},aResponse=>{if(aResponse.errorMsg){this.debug("set XCAP APN to NV73851. error: "+aResponse.errorMsg);}else{this.debug("set XCAP APN to NV73851. success.");}});}
}}
let readyApnTypes=[]; for(let[networkType,dataCallsList]of apnContextsList){try{if(DEBUG){this.debug("Preparing RILNetworkInterface for type: "+
convertToDataCallType(networkType));}
let networkInterface=new RILNetworkInterface(this,networkType,null,dataCallsList);gNetworkManager.registerNetworkInterface(networkInterface);this.dataNetworkInterfaces.set(networkType,networkInterface);readyApnTypes.push(networkType);if(networkInterface.info.type==NETWORK_TYPE_MOBILE){this.debug("Enable the default RILNetworkInterface.");networkInterface.enable();}}catch(e){if(DEBUG){this.debug("Error setting up RILNetworkInterface for type "+
convertToDataCallType(networkType)+": "+
e);}}}
BinderServices.datacall.onApnReady(this.clientId,readyApnTypes);this.debug("_setupApnSettings done. ");},configMeter(aMeterNetworkType){aMeterNetworkType.forEach(function(apnType){let networkType=convertApnType(apnType);let networkInterface=this.dataNetworkInterfaces.get(networkType);if(networkInterface){networkInterface.info.meter=true;this.debug("Config meter apn type:"+apnType);}else{this.debug("No such meter apn type:"+apnType);}}.bind(this));},allDataDisconnected(){for(let i=0;i<this._dataCalls.length;i++){let dataCall=this._dataCalls[i];if(dataCall.state!=NETWORK_STATE_UNKNOWN&&dataCall.state!=NETWORK_STATE_DISCONNECTED){return false;}}
return true;},deactivateAllDataCallsAndWait(aReason){return new Promise((aResolve,aReject)=>{this.deactivateAllDataCalls(aReason,{notifyDataCallsDisconnected(){aResolve();},});});},updateApnSettings(aNewApnSettings){if(!aNewApnSettings){return;}
if(RILQUIRKS_ECC_DEFAULT_APN){aNewApnSettings=this._initailEmergencyApn(aNewApnSettings);}
this.debug("===START===");for(let inputApnSetting of aNewApnSettings){this.debug(JSON.stringify(inputApnSetting));}
this.debug("===END===");if(JSON.stringify(this._activeApnSettings)==JSON.stringify(aNewApnSettings)){this.debug("apn setting not change, skip the update. this._activeApnSettings = "+
JSON.stringify(this._activeApnSettings));return;}
if(this._pendingApnSettings){this._pengingApnSettings=aNewApnSettings;return;} 
let activeFotaApn=null;let newFotaApn=null;if(this._activeApnSettings&&aNewApnSettings){for(let item of this._activeApnSettings){if(item.types[0]=="fota"){this.debug('updateApnSettings active fota apn found');activeFotaApn=item;}}
for(let item of aNewApnSettings){if(item.types[0]=="fota"){this.debug('updateApnSettings new fota apn found');newFotaApn=item;}}}
if(activeFotaApn&&newFotaApn&&JSON.stringify(activeFotaApn)!=JSON.stringify(newFotaApn)){this.debug('updateApnSettings active and new FOTA apn are different');this.fotaApnChanged=true;}
this._pendingApnSettings=aNewApnSettings;this.setInitialAttachApn(this._pendingApnSettings);if(!this.fotaApnChanged){this.oldFotaDataNetworkInterface=this.dataNetworkInterfaces.get(NETWORK_TYPE_MOBILE_FOTA);this.dataNetworkInterfaces.delete(NETWORK_TYPE_MOBILE_FOTA);}
this.deactivateAllDataCallsAndWait(RIL.DATACALL_DEACTIVATE_APN_CHANGED).then(()=>{this._setupApnSettings(this._pendingApnSettings);this._pendingApnSettings=null;this.updateAllRILNetworkInterface();if(this.oldFotaDataNetworkInterface&&!this.fotaApnChanged){this.debug('updateApnSettings no FOTA apn change, so restore the current FOTA network interface');this.dataNetworkInterfaces.set(NETWORK_TYPE_MOBILE_FOTA,this.oldFotaDataNetworkInterface);this.oldFotaDataNetworkInterface=null;}
this.fotaApnChanged=false;});},createDataProfile(aApnSetting){if(!aApnSetting){return null;}
let pdpType=RIL.RIL_DATACALL_PDP_TYPES.includes(aApnSetting.protocol)?aApnSetting.protocol:RIL.GECKO_DATACALL_PDP_TYPE_IP;let roamPdpType=RIL.RIL_DATACALL_PDP_TYPES.includes(aApnSetting.roaming_protocol)?aApnSetting.roaming_protocol:RIL.GECKO_DATACALL_PDP_TYPE_IP;let authtype=RIL.RIL_DATACALL_AUTH_TO_GECKO.indexOf(aApnSetting.authtype);if(authtype==-1){authtype=RIL.RIL_DATACALL_AUTH_TO_GECKO.indexOf(RIL.GECKO_DATACALL_AUTH_DEFAULT);}
let profileType;if(aApnSetting.bearer==0||aApnSetting.bearer==undefined){profileType=RIL.GECKO_PROFILE_INFO_TYPE_COMMON;}else if(bearerBitmapHasCdma(aApnSetting.bearer)){profileType=RIL.GECKO_PROFILE_INFO_TYPE_3GPP2;}else{profileType=RIL.GECKO_PROFILE_INFO_TYPE_3GPP;}
let dataProfile={ profileId:aApnSetting.profile_id||-1, apn:aApnSetting.apn||"",protocol:pdpType,authType:authtype,user:aApnSetting.user||"",password:aApnSetting.password||"",type:profileType,maxConnsTime:aApnSetting.maxConnsTime||0,maxConns:aApnSetting.maxConns||0,waitTime:aApnSetting.waitTime||0, enabled:aApnSetting.carrier_enabled, supportedApnTypesBitmap:aApnSetting.supportedApnTypesBitmap||0,roamingProtocol:roamPdpType,bearerBitmap:aApnSetting.bearer||0,mtu:aApnSetting.mtu||0,mvnoType:aApnSetting.mvnoType||"", mvnoMatchData:aApnSetting.mvnoMatchData||"", modemCognitive:aApnSetting.modemCognitive||true,};return dataProfile;},setInitialAttachApn(aNewApnSettings){if(!aNewApnSettings){return;}
let iaApnSetting;let defaultApnSetting;let firstApnSetting;for(let inputApnSetting of aNewApnSettings){if(!this._validateApnSetting(inputApnSetting)){continue;}
if(!firstApnSetting){firstApnSetting=inputApnSetting;}
for(let i=0;i<inputApnSetting.types.length;i++){let apnType=inputApnSetting.types[i];let networkType=convertApnType(apnType);if(networkType==NETWORK_TYPE_MOBILE_IA){iaApnSetting=inputApnSetting;}else if(networkType==NETWORK_TYPE_MOBILE){defaultApnSetting=inputApnSetting;}}}
let initalAttachApn;if(iaApnSetting){initalAttachApn=iaApnSetting;}else if(defaultApnSetting){initalAttachApn=defaultApnSetting;}else if(firstApnSetting){initalAttachApn=firstApnSetting;}else{if(DEBUG){this.debug("Can not find any initial attach APN!");}
return;}
let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let dataInfo=connection&&connection.data;if(dataInfo==null){return;}
let dataProfile=this.createDataProfile(initalAttachApn);this.debug("setInitialAttachApn. dataProfile= "+JSON.stringify(dataProfile));this.dataCallInterface.setInitialAttachApn(dataProfile,dataInfo.roaming);},updatePcoData(aCid,aBearerProtom,aPcoId,aContents){if(!gPCOService){this.debug("Error. No PCO Service. return.");return;}
if(DEBUG){this.debug("updatePcoData aCid="+
aCid+" ,aBearerProtom="+
aBearerProtom+" ,aPcoId="+
aPcoId+" ,aContents="+
JSON.stringify(aContents));}
let pcoDataCalls=[];let dataCalls=this._dataCalls.slice();for(let i=0;i<dataCalls.length;i++){let dataCall=dataCalls[i];if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED&&dataCall.linkInfo.cid==aCid){if(DEBUG){this.debug("Found pco data cid: "+dataCall.linkInfo.cid);}
pcoDataCalls.push(dataCall);}}
if(pcoDataCalls.length===0){for(let i=0;i<dataCalls.length;i++){let dataCall=dataCalls[i];if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTING&&dataCall.requestedNetworkIfaces.lengh>0){if(DEBUG){this.debug("Found pco protential data. apn="+dataCall.apnSetting.apn);}
pcoDataCalls.push(dataCall);}}}
if(pcoDataCalls.length===0){this.debug("PCO_DATA - couldn't infer cid.");return;}
let pcoValueList=[];for(let i=0;i<pcoDataCalls.length;i++){let pcoDataCall=pcoDataCalls[i];for(let j=0;j<pcoDataCall.requestedNetworkIfaces.length;j++){let pcoValue={clientId:this.clientId,iccId:pcoDataCall.requestedNetworkIfaces[j].info.iccId,apnType:pcoDataCall.requestedNetworkIfaces[j].info.type,bearerProto:aBearerProtom,pcoId:aPcoId,contents:aContents,};pcoValueList.push(pcoValue);}}
if(DEBUG){this.debug("updatePcoData pcoValueList="+JSON.stringify(pcoValueList));}
gPCOService.updatePcoData(pcoValueList);},updateRILNetworkInterface(){if(DEBUG){this.debug("updateRILNetworkInterface");}
let networkInterface=this.dataNetworkInterfaces.get(NETWORK_TYPE_MOBILE);if(!networkInterface){if(DEBUG){this.debug("updateRILNetworkInterface No network interface for default data.");}
return;}
this.onUpdateRILNetworkInterface(networkInterface);},onUpdateRILNetworkInterface(aNetworkInterface){if(!aNetworkInterface){if(DEBUG){this.debug("onUpdateRILNetworkInterface No network interface.");}
return;}
if(DEBUG){this.debug("onUpdateRILNetworkInterface type:"+
convertToDataCallType(aNetworkInterface.info.type));}
let isEmergency=aNetworkInterface.info.type==NETWORK_TYPE_MOBILE_ECC;let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let dataInfo=connection&&connection.data;let radioTechType=dataInfo&&dataInfo.type;let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(radioTechType);
let radioState=connection&&connection.radioState;if(!isEmergency){if(radioState!=Ci.nsIMobileConnection.MOBILE_RADIO_STATE_ENABLED){if(radioTechnology!=RIL.NETWORK_CREG_TECH_IWLAN){if(DEBUG){this.debug("RIL is not ready for data connection: radio's not ready");}
return;}
if(DEBUG){this.debug("IWLAN network consider as radio power on.");}}}else{this.debug("Emergency type skip the radio state check.");}
let wifi_active=false;if(gNetworkManager.activeNetworkInfo&&gNetworkManager.activeNetworkInfo.type==NETWORK_TYPE_WIFI){wifi_active=true;}
let isDefault=aNetworkInterface.info.type==NETWORK_TYPE_MOBILE;let dataCallConnected=aNetworkInterface.connected;if(!isEmergency){if(!this.isDataAllow(aNetworkInterface)||(dataInfo.roaming&&!this.dataCallSettings.roamingEnabled)){if(DEBUG){this.debug("Data call settings: disconnect data call."+" ,MobileEnable: "+
this.dataCallSettings.enabled+" ,Roaming: "+
dataInfo.roaming+" ,RoamingEnabled: "+
this.dataCallSettings.roamingEnabled);}
aNetworkInterface.disconnect(Ci.nsINetworkInfo.REASON_SETTING_DISABLED);return;}}
if(isDefault&&dataCallConnected&&wifi_active){if(DEBUG){this.debug("Disconnect default data call when Wifi is connected.");}
aNetworkInterface.disconnect(Ci.nsINetworkInfo.REASON_WIFI_CONNECTED);return;}
let isRegistered=dataInfo&&dataInfo.state==RIL.GECKO_MOBILE_CONNECTION_STATE_REGISTERED;let haveDataConnection=dataInfo&&dataInfo.type!=RIL.GECKO_MOBILE_CONNECTION_STATE_UNKNOWN;if(!isEmergency){if(!isRegistered||!haveDataConnection){if(DEBUG){this.debug("RIL is not ready for data connection: Phone's not "+"registered or doesn't have data connection.");}
return;}}else{this.debug("Emergency type skip the registration state check. ");}
if(isDefault&&wifi_active){if(DEBUG){this.debug("Don't connect default data call when Wifi is connected.");}
return;}
if(dataCallConnected){if(DEBUG){this.debug("Already connected. dataCallConnected: "+dataCallConnected);}
return;}
if(this._pendingApnSettings){if(DEBUG){this.debug("We're changing apn settings, ignore any changes.");}
return;}
if(this._deactivatingAllDataCalls){if(DEBUG){this.debug("We're deactivating all data calls, ignore any changes.");}
return;}
if(DEBUG){this.debug("Data call settings: connect data call.");}
aNetworkInterface.connect();},isDataAllow(aNetworkInterface){let allow=this.dataCallSettings.enabled;let isDefault=aNetworkInterface.info.type==NETWORK_TYPE_MOBILE;if(!allow&&!isDefault){allow=this.mobileWhiteList.includes(convertToDataCallType(aNetworkInterface.info.type));if(DEBUG&&allow){this.debug("Allow data call for mobile whitelist type:"+
convertToDataCallType(aNetworkInterface.info.type));}}
return allow;},_isMobileNetworkType(aNetworkType){if(aNetworkType===NETWORK_TYPE_MOBILE||aNetworkType===NETWORK_TYPE_MOBILE_MMS||aNetworkType===NETWORK_TYPE_MOBILE_SUPL||aNetworkType===NETWORK_TYPE_MOBILE_IMS||aNetworkType===NETWORK_TYPE_MOBILE_DUN||aNetworkType===NETWORK_TYPE_MOBILE_FOTA||aNetworkType===NETWORK_TYPE_MOBILE_HIPRI||aNetworkType===NETWORK_TYPE_MOBILE_CBS||aNetworkType===NETWORK_TYPE_MOBILE_IA||aNetworkType===NETWORK_TYPE_MOBILE_ECC||aNetworkType===NETWORK_TYPE_MOBILE_XCAP){return true;}
return false;},getDataCallStateByType(aNetworkType){if(!this._isMobileNetworkType(aNetworkType)){if(DEBUG){this.debug(aNetworkType+" is not a mobile network type!");}
throw Components.Exception("Not a mobile network type.",Cr.NS_ERROR_NOT_AVAILABLE);}
let networkInterface=this.dataNetworkInterfaces.get(aNetworkType);if(!networkInterface){throw Components.Exception("No network interface.",Cr.NS_ERROR_NOT_AVAILABLE);}
return networkInterface.info.state;},setupDataCallByType(aNetworkType){if(DEBUG){this.debug("setupDataCallByType: "+convertToDataCallType(aNetworkType));}
if(!this._isMobileNetworkType(aNetworkType)){if(DEBUG){this.debug(aNetworkType+" is not a mobile network type!");}
throw Components.Exception("Not a mobile network type.",Cr.NS_ERROR_NOT_AVAILABLE);}
let networkInterface=this.dataNetworkInterfaces.get(aNetworkType);if(!networkInterface){if(DEBUG){this.debug("No network interface for type: "+
convertToDataCallType(aNetworkType));}
throw Components.Exception("No network interface.",Cr.NS_ERROR_NOT_AVAILABLE);}
networkInterface.enable();this.onUpdateRILNetworkInterface(networkInterface);},deactivateDataCallByType(aNetworkType){if(DEBUG){this.debug("deactivateDataCallByType: "+convertToDataCallType(aNetworkType));}
if(!this._isMobileNetworkType(aNetworkType)){if(DEBUG){this.debug(aNetworkType+" is not a mobile network type!");}
throw Components.Exception("Not a mobile network type.",Cr.NS_ERROR_NOT_AVAILABLE);}
let networkInterface=this.dataNetworkInterfaces.get(aNetworkType);if(!networkInterface){if(DEBUG){this.debug("No network interface for type: "+
convertToDataCallType(aNetworkType));}
throw Components.Exception("No network interface.",Cr.NS_ERROR_NOT_AVAILABLE);} 
if(networkInterface.info.type==NETWORK_TYPE_MOBILE){if(DEBUG){this.debug("Not allow upper layer control the default RILNetworkInterface.");}
throw Components.Exception("Not allow upper layer control the default.",Cr.NS_ERROR_NOT_AVAILABLE);}
networkInterface.disable();},_deactivatingAllDataCalls:false,deactivateAllDataCalls(aReason,aCallback){if(DEBUG){this.debug("deactivateAllDataCalls: aReason="+aReason);}
let dataDisconnecting=false;this.dataNetworkInterfaces.forEach(function(networkInterface){if(networkInterface.enabled){if(networkInterface.info.state!=NETWORK_STATE_UNKNOWN&&networkInterface.info.state!=NETWORK_STATE_DISCONNECTED){dataDisconnecting=true;}
networkInterface.disconnect(aReason);}});this._deactivatingAllDataCalls=dataDisconnecting;if(!dataDisconnecting){aCallback.notifyDataCallsDisconnected();return;}
let callback={notifyAllDataDisconnected:()=>{this._unregisterListener(callback);aCallback.notifyDataCallsDisconnected();},};this._registerListener(callback);},_listeners:null,_notifyListeners(aMethodName,aArgs){let listeners=this._listeners.slice();for(let listener of listeners){if(!this._listeners.includes(listener)){continue;}
let handler=listener[aMethodName];try{handler.apply(listener,aArgs);}catch(e){this.debug("listener for "+aMethodName+" threw an exception: "+e);}}},_registerListener(aListener){if(this._listeners.includes(aListener)){return;}
this._listeners.push(aListener);},_unregisterListener(aListener){let index=this._listeners.indexOf(aListener);if(index>=0){this._listeners.splice(index,1);}},_findDataCallByCid(aCid){if(aCid===undefined||aCid<0){return-1;}
for(let i=0;i<this._dataCalls.length;i++){let datacall=this._dataCalls[i];if(datacall.linkInfo.cid!=null&&datacall.linkInfo.cid==aCid){return i;}}
return-1;},notifyDataCallError(aDataCall,aErrorMsg){let networkInterface=this.dataNetworkInterfaces.get(NETWORK_TYPE_MOBILE);if(networkInterface&&networkInterface.enable){for(let i=0;i<aDataCall.requestedNetworkIfaces.length;i++){if(aDataCall.requestedNetworkIfaces[i].info.type==NETWORK_TYPE_MOBILE){Services.obs.notifyObservers(networkInterface.info,TOPIC_DATA_CALL_ERROR,aErrorMsg);break;}}}},notifyDataCallChanged(aUpdatedDataCall){
if(aUpdatedDataCall.state==NETWORK_STATE_DISCONNECTED||(aUpdatedDataCall.state==NETWORK_STATE_UNKNOWN&&this.allDataDisconnected()&&this._deactivatingAllDataCalls)){this._deactivatingAllDataCalls=false;this._notifyListeners("notifyAllDataDisconnected",{clientId:this.clientId,});}}, notifyDataCallListChanged(aCount,aDataCallList){let currentDataCalls=this._dataCalls.slice();for(let i=0;i<aDataCallList.length;i++){let dataCall=aDataCallList[i];let index=this._findDataCallByCid(dataCall.cid);if(index==-1){if(DEBUG){this.debug("Unexpected new data call: "+JSON.stringify(dataCall));}
continue;}
currentDataCalls[index].onDataCallChanged(dataCall);currentDataCalls[index]=null;}


for(let i=0;i<currentDataCalls.length;i++){let currentDataCall=currentDataCalls[i];if(currentDataCall&&currentDataCall.linkInfo.cid!=null&&currentDataCall.state==NETWORK_STATE_CONNECTED){if(DEBUG){this.debug("Expected data call missing: "+
JSON.stringify(currentDataCall.apnSetting)+", must have been DISCONNECTED.");}
currentDataCall.onDataCallChanged({state:NETWORK_STATE_DISCONNECTED,});}}},
handleDataRegistrationChange(){if(!this._dataInfo||this._dataInfo.state!=RIL.GECKO_MOBILE_CONNECTION_STATE_REGISTERED||this._dataInfo.type==RIL.GECKO_MOBILE_CONNECTION_STATE_UNKNOWN){this.debug("handleDataRegistrationChange: Network state not ready. Abort.");return;}
let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(this._dataInfo.type);if(DEBUG){this.debug("handleDataRegistrationChange radioTechnology: "+radioTechnology);}
for(let i=0;i<this._dataCalls.length;i++){let datacall=this._dataCalls[i];datacall.dataRegistrationChanged(radioTechnology);}
if(DEBUG){this.debug("Retry data call");}
Services.tm.currentThread.dispatch(()=>this.updateAllRILNetworkInterface(),Ci.nsIThread.DISPATCH_NORMAL);},updateAllRILNetworkInterface(){if(DEBUG){this.debug("updateAllRILNetworkInterface");}
this.dataNetworkInterfaces.forEach(function(networkInterface){if(networkInterface.enabled){this.onUpdateRILNetworkInterface(networkInterface);}}.bind(this));}, notifyVoiceChanged(){},notifyDataChanged(){if(DEBUG){this.debug("notifyDataChanged");}
let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let newDataInfo=connection.data;if(this._dataInfo.state==newDataInfo.state&&this._dataInfo.type==newDataInfo.type&&this._dataInfo.roaming==newDataInfo.roaming){return;}
this._dataInfo.state=newDataInfo.state;this._dataInfo.type=newDataInfo.type;this._dataInfo.roaming=newDataInfo.roaming;this.handleDataRegistrationChange();},notifyDataError(aMessage){},notifyCFStateChanged(aAction,aReason,aNumber,aTimeSeconds,aServiceClass){},notifyEmergencyCbModeChanged(aActive,aTimeoutMs){},notifyOtaStatusChanged(aStatus){},notifyRadioStateChanged(){if(!RILQUIRKS_DATA_REGISTRATION_ON_DEMAND&&!RILQUIRKS_SUBSCRIPTION_CONTROL){return;}
let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let radioOn=connection.radioState===Ci.nsIMobileConnection.MOBILE_RADIO_STATE_ENABLED;if(radioOn){if(this.needRecoverAfterReset){return new Promise(function(aResolve,aReject){let callback={QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallCallback]),notifySuccess(){aResolve();},notifyError(aErrorMsg){aReject(aErrorMsg);},};this.debug("modem reset, recover the PS service.");if(this.dataCallSettings.defaultDataSlot){this.dataCallInterface.setDataRegistration(true,callback);}else{this.dataCallInterface.setDataRegistration(false,callback);}}.bind(this));}
this.needRecoverAfterReset=false;}},notifyClirModeChanged(aMode){},notifyLastKnownNetworkChanged(){},notifyLastKnownHomeNetworkChanged(){},notifyNetworkSelectionModeChanged(){},notifyDeviceIdentitiesChanged(){},notifySignalStrengthChanged(){},notifyModemRestart(reason){if(DEBUG){this.debug("modem reset, prepare to recover the PS service.");}
this.needRecoverAfterReset=true;},};function DataCall(aClientId,aApnSetting,aDataCallHandler){this.clientId=aClientId;this.dataCallHandler=aDataCallHandler;this.dataProfile=this.dataCallHandler.createDataProfile(aApnSetting);this.linkInfo={cid:null,ifname:null,addresses:[],dnses:[],gateways:[],pcscf:[],mtu:null,tcpbuffersizes:null,};this.apnSetting=aApnSetting;this.state=NETWORK_STATE_UNKNOWN;this.requestedNetworkIfaces=[];}
DataCall.prototype={NETWORK_APNRETRY_FACTOR:8,NETWORK_APNRETRY_ORIGIN:3,NETWORK_APNRETRY_MAXRETRIES:10,dataCallHandler:null, timer:null, apnRetryCounter:0,requestedNetworkIfaces:null,_compareDataCallLink(aUpdatedDataCall,aCurrentDataCall){if(aUpdatedDataCall.ifname!=aCurrentDataCall.ifname){return"deactivate";}
for(let i=0;i<aCurrentDataCall.addresses.length;i++){let address=aCurrentDataCall.addresses[i];if(!aUpdatedDataCall.addresses.includes(address)){return"deactivate";}}
if(aCurrentDataCall.addresses.length!=aUpdatedDataCall.addresses.length){

return"changed";}
let fields=["gateways","dnses"];for(let i=0;i<fields.length;i++){let field=fields[i];let lhs=aUpdatedDataCall[field],rhs=aCurrentDataCall[field];if(lhs.length!=rhs.length){return"changed";}
for(let i=0;i<lhs.length;i++){if(lhs[i]!=rhs[i]){return"changed";}}}
if(aCurrentDataCall.mtu!=aUpdatedDataCall.mtu){return"changed";}
return"identical";},_getGeckoDataCallState(aDataCall){if(aDataCall.active==Ci.nsIDataCallInterface.DATACALL_STATE_ACTIVE_UP||aDataCall.active==Ci.nsIDataCallInterface.DATACALL_STATE_ACTIVE_DOWN){return NETWORK_STATE_CONNECTED;}
return NETWORK_STATE_DISCONNECTED;},updateTcpBufferSizes(aRadioTech){if(!aRadioTech){let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let dataInfo=connection&&connection.data;if(dataInfo==null||dataInfo.state!=RIL.GECKO_MOBILE_CONNECTION_STATE_REGISTERED||dataInfo.type==RIL.GECKO_MOBILE_CONNECTION_STATE_UNKNOWN){return null;}
let radioTechType=dataInfo.type;aRadioTech=RIL.GECKO_RADIO_TECH.indexOf(radioTechType);}
let ratName=RIL.GECKO_RADIO_TECH[aRadioTech];this.debug("updateTcpBufferSizes ratName="+ratName+" ,aRadioTech="+aRadioTech);if(ratName=="evdo0"||ratName=="evdoa"||ratName=="evdob"){ratName="evdo";}
if(ratName=="is95a"||ratName=="is95b"){ratName="1xrtt";}
let prefName="net.tcp.buffersize.mobile."+ratName;let sizes=null;try{sizes=Services.prefs.getStringPref(prefName,null);}catch(e){sizes=null;}
if(sizes==null){try{sizes=TCP_BUFFER_SIZES[aRadioTech];}catch(e){sizes=null;}}
this.debug("updateTcpBufferSizes ratName="+ratName+" , sizes="+sizes);return sizes;},onSetupDataCallResult(aDataCall){this.debug("onSetupDataCallResult: "+JSON.stringify(aDataCall));let errorMsg=aDataCall.errorMsg;if(aDataCall.failCause&&aDataCall.failCause!=Ci.nsIDataCallInterface.DATACALL_FAIL_NONE){errorMsg=RIL.RIL_DATACALL_FAILCAUSE_TO_GECKO_DATACALL_ERROR[aDataCall.failCause];}
if(errorMsg){if(DEBUG){this.debug("SetupDataCall error for apn "+
this.apnSetting.apn+": "+
errorMsg+" ("+
aDataCall.failCause+"), retry time: "+
aDataCall.suggestedRetryTime);}
this.state=NETWORK_STATE_DISCONNECTED;if(this.requestedNetworkIfaces.length===0){if(DEBUG){this.debug("This DataCall is not requested anymore.");}
Services.tm.currentThread.dispatch(()=>this.deactivate(),Ci.nsIThread.DISPATCH_NORMAL);return;} 
this.dataCallHandler.notifyDataCallError(this,errorMsg);if(aDataCall.suggestedRetryTime===INT32_MAX||this.isPermanentFail(aDataCall.failCause,errorMsg)){if(DEBUG){this.debug("Data call error: no retry needed.");}
this.notifyInterfacesWithReason(RIL.DATACALL_PERMANENT_FAILURE);return;}
this.retry(aDataCall.suggestedRetryTime);return;}
this.apnRetryCounter=0;this.linkInfo.cid=aDataCall.cid;if(this.requestedNetworkIfaces.length===0){if(DEBUG){this.debug("State is connected, but no network interface requested"+" this DataCall");}
this.deactivate();return;}
this.linkInfo.ifname=aDataCall.ifname;this.linkInfo.addresses=aDataCall.addresses?aDataCall.addresses.split(" "):[];this.linkInfo.gateways=aDataCall.gateways?aDataCall.gateways.split(" "):[];this.linkInfo.dnses=aDataCall.dnses?aDataCall.dnses.split(" "):[];this.linkInfo.pcscf=aDataCall.pcscf?aDataCall.pcscf.split(" "):[];this.linkInfo.mtu=aDataCall.mtu>0?aDataCall.mtu:0;this.state=this._getGeckoDataCallState(aDataCall);this.linkInfo.tcpbuffersizes=this.updateTcpBufferSizes();this.dataCallHandler.notifyDataCallChanged(this);for(let i=0;i<this.requestedNetworkIfaces.length;i++){this.requestedNetworkIfaces[i].notifyRILNetworkInterface();}},onDeactivateDataCallResult(){if(DEBUG){this.debug("onDeactivateDataCallResult");}
this.reset();if(this.requestedNetworkIfaces.length>0){if(DEBUG){this.debug("State is disconnected/unknown, but this DataCall is requested.");}
this.setup();return;}
this.dataCallHandler.notifyDataCallChanged(this);},onDataCallChanged(aUpdatedDataCall){if(DEBUG){this.debug("onDataCallChanged: "+JSON.stringify(aUpdatedDataCall));}
if(this.state==NETWORK_STATE_CONNECTING||this.state==NETWORK_STATE_DISCONNECTING){if(DEBUG){this.debug("We are in "+
convertToDataCallState(this.state)+", ignore any "+"unsolicited event for now.");}
return;}
let dataCallState=this._getGeckoDataCallState(aUpdatedDataCall);if(this.state==dataCallState&&dataCallState!=NETWORK_STATE_CONNECTED){return;}
let newLinkInfo={ifname:aUpdatedDataCall.ifname,addresses:aUpdatedDataCall.addresses?aUpdatedDataCall.addresses.split(" "):[],dnses:aUpdatedDataCall.dnses?aUpdatedDataCall.dnses.split(" "):[],gateways:aUpdatedDataCall.gateways?aUpdatedDataCall.gateways.split(" "):[],pcscf:aUpdatedDataCall.pcscf?aUpdatedDataCall.pcscf.split(" "):[],mtu:aUpdatedDataCall.mtu>0?aUpdatedDataCall.mtu:0,};switch(dataCallState){case NETWORK_STATE_CONNECTED:if(this.state==NETWORK_STATE_CONNECTED){let result=this._compareDataCallLink(newLinkInfo,this.linkInfo);if(result=="identical"){if(DEBUG){this.debug("No changes in data call.");}
return;}
if(result=="deactivate"){if(DEBUG){this.debug("Data link changed, cleanup.");}
this.deactivate();return;}
if(DEBUG){this.debug("Data link minor change, just update and notify.");}
this.linkInfo.addresses=newLinkInfo.addresses.slice();this.linkInfo.gateways=newLinkInfo.gateways.slice();this.linkInfo.dnses=newLinkInfo.dnses.slice();this.linkInfo.pcscf=newLinkInfo.pcscf.slice();this.linkInfo.mtu=newLinkInfo.mtu;}
break;case NETWORK_STATE_DISCONNECTED:case NETWORK_STATE_UNKNOWN:if(this.state==NETWORK_STATE_CONNECTED){this.state=dataCallState;for(let i=0;i<this.requestedNetworkIfaces.length;i++){this.requestedNetworkIfaces[i].notifyRILNetworkInterface();}}
this.reset();if(this.requestedNetworkIfaces.length>0){if(DEBUG){this.debug("State is disconnected/unknown, but this DataCall is"+" requested.");}
let dataInfo=this.dataCallHandler._dataInfo;if(!dataInfo||dataInfo.state!=RIL.GECKO_MOBILE_CONNECTION_STATE_REGISTERED||dataInfo.type==RIL.GECKO_MOBILE_CONNECTION_STATE_UNKNOWN){if(DEBUG){this.debug("dataCallStateChanged: Network state not ready. Abort.");}
return;}
let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(dataInfo.type);let targetBearer;if(this.apnSetting.bearer===undefined){targetBearer=0;}else{targetBearer=this.apnSetting.bearer;}
if(DEBUG){this.debug("dataCallStateChanged: radioTechnology:"+
radioTechnology+" ,targetBearer: "+
bitmaskToString(targetBearer));}
if(bitmaskHasTech(targetBearer,radioTechnology)){
Services.tm.currentThread.dispatch(()=>this.retry(),Ci.nsIThread.DISPATCH_NORMAL);}else{if(DEBUG){this.debug("dataCallStateChanged: current APN do not support this rat reset DC. APN:"+
JSON.stringify(this.apnSetting));}
let targetRequestedNetworkIfaces=this.requestedNetworkIfaces.slice();for(let networkInterface of targetRequestedNetworkIfaces){this.disconnect(networkInterface);}
if(DEBUG){this.debug("Retry data call");}
Services.tm.currentThread.dispatch(()=>this.dataCallHandler.updateAllRILNetworkInterface(),Ci.nsIThread.DISPATCH_NORMAL);}
return;}
break;}
this.state=dataCallState;this.dataCallHandler.notifyDataCallChanged(this);for(let i=0;i<this.requestedNetworkIfaces.length;i++){this.requestedNetworkIfaces[i].notifyRILNetworkInterface();}},dataRegistrationChanged(aRadioTech){if(this.requestedNetworkIfaces.length>0&&this.state==RIL.GECKO_NETWORK_STATE_CONNECTED){this.linkInfo.tcpbuffersizes=this.updateTcpBufferSizes(aRadioTech);for(let i=0;i<this.requestedNetworkIfaces.length;i++){this.requestedNetworkIfaces[i].notifyRILNetworkInterface();}}
if(this.requestedNetworkIfaces.length===0||(this.state!=RIL.GECKO_NETWORK_STATE_DISCONNECTED&&this.state!=RIL.GECKO_NETWORK_STATE_UNKNOWN)){return;}
let targetBearer;if(this.apnSetting.bearer===undefined){targetBearer=0;}else{targetBearer=this.apnSetting.bearer;}
if(DEBUG){this.debug("dataRegistrationChanged: targetBearer: "+
bitmaskToString(targetBearer));}
if(bitmaskHasTech(targetBearer,aRadioTech)){}else{if(DEBUG){this.debug("dataRegistrationChanged: current APN do not support this rat reset DC. APN:"+
JSON.stringify(this.apnSetting));}
let targetRequestedNetworkIfaces=this.requestedNetworkIfaces.slice();for(let networkInterface of targetRequestedNetworkIfaces){this.disconnect(networkInterface);}}}, debug(aMsg){dump("-*- DataCall["+
this.clientId+":"+
this.apnSetting.apn+"]: "+
aMsg+"\n");},get connected(){return this.state==NETWORK_STATE_CONNECTED;},isPermanentFail(aDataFailCause,aErrorMsg){if(aErrorMsg===RIL.GECKO_ERROR_RADIO_NOT_AVAILABLE||aErrorMsg===RIL.GECKO_ERROR_INVALID_ARGUMENTS||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_OPERATOR_BARRED||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_MISSING_UKNOWN_APN||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_UNKNOWN_PDP_ADDRESS_TYPE||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_USER_AUTHENTICATION||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_ACTIVATION_REJECT_GGSN||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_SERVICE_OPTION_NOT_SUPPORTED||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_SERVICE_OPTION_NOT_SUBSCRIBED||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_NSAPI_IN_USE||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_ONLY_IPV4_ALLOWED||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_ONLY_IPV6_ALLOWED||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_PROTOCOL_ERRORS||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_RADIO_POWER_OFF||aDataFailCause===Ci.nsIDataCallInterface.DATACALL_FAIL_TETHERED_CALL_ACTIVE){return true;}
return false;},inRequestedTypes(aType){for(let i=0;i<this.requestedNetworkIfaces.length;i++){if(this.requestedNetworkIfaces[i].info.type==aType){return true;}}
return false;},canHandleApn(aApnSetting){let isIdentical=this.apnSetting.apn==aApnSetting.apn&&(this.apnSetting.user||"")==(aApnSetting.user||"")&&(this.apnSetting.password||"")==(aApnSetting.password||"")&&(this.apnSetting.authtype||"")==(aApnSetting.authtype||"");isIdentical=isIdentical&&(this.apnSetting.protocol||"")==(aApnSetting.protocol||"")&&(this.apnSetting.roaming_protocol||"")==(aApnSetting.roaming_protocol||"");return isIdentical;},resetLinkInfo(){this.linkInfo.cid=null;this.linkInfo.ifname=null;this.linkInfo.addresses=[];this.linkInfo.dnses=[];this.linkInfo.gateways=[];this.linkInfo.pcscf=[];this.linkInfo.mtu=null;this.linkInfo.tcpbuffersizes=null;},reset(){this.debug("reset");this.resetLinkInfo();this.apnRetryCounter=0;this.state=NETWORK_STATE_DISCONNECTED;},isTmobileTracFone(){let icc=gIccService.getIccByServiceId(this.serviceId);let iccInfo=icc&&icc.iccInfo;if(iccInfo)
this.debug("isTmobileTracFone  iccInfo.mcc = "+iccInfo.mcc+"iccInfo.mn = "+iccInfo.mnc);if(iccInfo&&(iccInfo.mcc==='310')&&(iccInfo.mnc==='260'||iccInfo.mnc==='240')){this.debug("isTmobileTracFone  mvnoType = "+this.apnSetting.mvno_type+" this.apnSetting.mvno_match_data = "+this.apnSetting.mvno_match_data);if(((this.apnSetting.mvno_type==='gid')&&(this.apnSetting.mvno_match_data==='deff'))||((this.apnSetting.mvno_type==='gid')&&(this.apnSetting.mvno_match_data==='4D4B'))||((this.apnSetting.mvno_type==='gid')&&(this.apnSetting.mvno_match_data==='534D'))){return true;}}
return false;},getRadioTechnology(){let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let dataInfo=connection&&connection.data;let radioTechType=dataInfo&&dataInfo.type;let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(radioTechType);return radioTechnology;},updateDataProfile(apn,protocol,mtu,bitmask){let pdpType=RIL.RIL_DATACALL_PDP_TYPES.includes(protocol)?protocol:RIL.GECKO_DATACALL_PDP_TYPE_IP;this.dataProfile.apn=apn;this.dataProfile.protocol=pdpType;this.dataProfile.mtu=mtu;this.dataProfile.bearerBitmap=bitmask;},connect(aNetworkInterface){if(DEBUG){this.debug("connect: "+convertToDataCallType(aNetworkInterface.info.type));}
if(!this.requestedNetworkIfaces.includes(aNetworkInterface)){this.requestedNetworkIfaces.push(aNetworkInterface);}
if(this.state==NETWORK_STATE_CONNECTING||this.state==NETWORK_STATE_DISCONNECTING){return;}
if(this.state==NETWORK_STATE_CONNECTED){
Services.tm.currentThread.dispatch(()=>{if(aNetworkInterface.info.state==RIL.GECKO_NETWORK_STATE_CONNECTED){aNetworkInterface.notifyRILNetworkInterface();}},Ci.nsIEventTarget.DISPATCH_NORMAL);return;}

if(this.timer){this.timer.cancel();}
if(this.isTmobileTracFone()){if(NETWORK_TYPE_MOBILE_MMS==aNetworkInterface.info.type){let radioTechnology=this.getRadioTechnology();if(radioTechnology==RIL.NETWORK_CREG_TECH_IWLAN){this.updateDataProfile("service",RIL.GECKO_DATACALL_PDP_TYPE_IPV4V6,"1440",262144);}else if(this.dataProfile.apn==="service"){this.updateDataProfile(this.apnSetting.apn,this.apnSetting.protocol,"",0);}}}
this.setup();},setup(){if(DEBUG){this.debug("Going to set up data connection with APN "+this.apnSetting.apn);}
let connection=gMobileConnectionService.getItemByServiceId(this.clientId);let dataInfo=connection&&connection.data; this.debug("setup this.apnSetting.carrier_enabled: "+this.apnSetting.carrier_enabled);if(this.apnSetting.carrier_enabled===false){this.debug("setup reject disabled APN: "+this.apnSetting.apn);return;} 
let radioTechType=dataInfo.type;let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(radioTechType);let dcInterface=this.dataCallHandler.dataCallInterface;this.debug("radioTechnology ="+radioTechnology);dcInterface.setupDataCall(radioTechnology,this.dataProfile,dataInfo.roaming,this.dataCallHandler.dataCallSettings.roamingEnabled,{QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallCallback]),notifySetupDataCallSuccess:aDataCall=>{this.onSetupDataCallResult(aDataCall);},notifyError:aErrorMsg=>{this.onSetupDataCallResult({errorMsg:aErrorMsg});},});this.state=NETWORK_STATE_CONNECTING;},retry(aSuggestedRetryTime){let apnRetryTimer;
 if(this.apnRetryCounter>=this.NETWORK_APNRETRY_MAXRETRIES){this.apnRetryCounter=0;this.timer=null;if(DEBUG){this.debug("Too many APN Connection retries - STOP retrying");}
this.notifyInterfacesWithReason(RIL.DATACALL_RETRY_FAILED);return;}
if(aSuggestedRetryTime!==undefined&&aSuggestedRetryTime>=0){apnRetryTimer=aSuggestedRetryTime/1000;}else{apnRetryTimer=this.NETWORK_APNRETRY_FACTOR*(this.apnRetryCounter*this.apnRetryCounter)+
this.NETWORK_APNRETRY_ORIGIN;}
this.apnRetryCounter++;if(DEBUG){this.debug("Data call - APN Connection Retry Timer (secs-counter): "+
apnRetryTimer+"-"+
this.apnRetryCounter);}
if(this.timer==null){ this.timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);}
this.timer.initWithCallback(this,apnRetryTimer*1000,Ci.nsITimer.TYPE_ONE_SHOT);},disconnect(aNetworkInterface){if(DEBUG){this.debug("disconnect: "+convertToDataCallType(aNetworkInterface.info.type));}
let index=this.requestedNetworkIfaces.indexOf(aNetworkInterface);if(index!=-1){this.requestedNetworkIfaces.splice(index,1);if(this.state==NETWORK_STATE_DISCONNECTED||this.state==NETWORK_STATE_UNKNOWN){if(this.timer){this.timer.cancel();}
this.reset();return;}


Services.tm.currentThread.dispatch(()=>{if(aNetworkInterface.info.state==RIL.GECKO_NETWORK_STATE_DISCONNECTED){aNetworkInterface.notifyRILNetworkInterface();if(this.requestedNetworkIfaces.length===0){this.resetLinkInfo();}}},Ci.nsIEventTarget.DISPATCH_NORMAL);}


if(this.requestedNetworkIfaces.length>0||this.state!=NETWORK_STATE_CONNECTED){return;}
this.deactivate();},deactivate(){let reason=Ci.nsIDataCallInterface.DATACALL_DEACTIVATE_NO_REASON;if(DEBUG){this.debug("Going to disconnect data connection cid "+this.linkInfo.cid);}
let dcInterface=this.dataCallHandler.dataCallInterface;dcInterface.deactivateDataCall(this.linkInfo.cid,reason,{QueryInterface:ChromeUtils.generateQI([Ci.nsIDataCallCallback]),notifySuccess:()=>{this.onDeactivateDataCallResult();},notifyError:aErrorMsg=>{this.onDeactivateDataCallResult();},});this.state=NETWORK_STATE_DISCONNECTING;}, notify(aTimer){this.debug("Received the retry notify.");this.setup();},shutdown(){if(this.timer){this.timer.cancel();this.timer=null;}},notifyInterfacesWithReason(aReason){for(let i=0;i<this.requestedNetworkIfaces.length;i++){let networkInterface=this.requestedNetworkIfaces[i];networkInterface.info.setReason(aReason);networkInterface.notifyRILNetworkInterface();}},};function RILNetworkInfo(aClientId,aType,aNetworkInterface){this.serviceId=aClientId;this.type=aType;this.reason=Ci.nsINetworkInfo.REASON_NONE;this.meter=false;this.networkInterface=aNetworkInterface;}
RILNetworkInfo.prototype={classID:RILNETWORKINFO_CID,QueryInterface:ChromeUtils.generateQI([Ci.nsINetworkInfo,Ci.nsIRilNetworkInfo,]),networkInterface:null,meter:false,getDataCall(){let dataCallsList=this.networkInterface.dataCallsList;for(let i=0;i<dataCallsList.length;i++){if(dataCallsList[i].inRequestedTypes(this.type)){return dataCallsList[i];}}
return null;},getApnSetting(){let dataCall=this.getDataCall();if(dataCall){return dataCall.apnSetting;}
return null;},debug(aMsg){dump("-*- RILNetworkInfo["+
this.serviceId+":"+
this.type+"]: "+
aMsg+"\n");},get state(){let dataCall=this.getDataCall();if(dataCall){return dataCall.state;}
return NETWORK_STATE_DISCONNECTED;},type:null,get name(){let dataCall=this.getDataCall();if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){return dataCall.linkInfo.ifname;}
return"";},get tcpbuffersizes(){let dataCall=this.getDataCall();if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){return dataCall.linkInfo.tcpbuffersizes;}
return"";},getAddresses(aIps,aPrefixLengths){let dataCall=this.getDataCall();let addresses="";if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){addresses=dataCall.linkInfo.addresses;}
let ips=[];let prefixLengths=[];for(let i=0;i<addresses.length;i++){let[ip,prefixLength]=addresses[i].split("/");ips.push(ip);prefixLengths.push(prefixLength);}
aIps.value=ips.slice();aPrefixLengths.value=prefixLengths.slice();return ips.length;},getGateways(aCount){let dataCall=this.getDataCall();let linkInfo=[]; if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){linkInfo=dataCall.linkInfo;}
if(aCount&&linkInfo&&linkInfo.gateways){aCount.value=linkInfo.gateways.length;}
if(linkInfo&&linkInfo.gateways){return linkInfo.gateways.slice();}
return linkInfo;},getDnses(aCount){let dataCall=this.getDataCall();let linkInfo=[]; if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){linkInfo=dataCall.linkInfo;}
if(aCount&&linkInfo&&linkInfo.dnses){aCount.value=linkInfo.dnses.length;}
if(linkInfo&&linkInfo.dnses){return linkInfo.dnses.slice();}
return linkInfo;},serviceId:0,get iccId(){let icc=gIccService.getIccByServiceId(this.serviceId);let iccInfo=icc&&icc.iccInfo;return iccInfo&&iccInfo.iccid;},get mmsc(){if(this.type!=NETWORK_TYPE_MOBILE_MMS){if(DEBUG){this.debug("Error! Only MMS network can get MMSC.");}
return"";}
let apnSetting=this.getApnSetting();if(apnSetting){return apnSetting.mmsc||"";}
return"";},get mmsProxy(){if(this.type!=NETWORK_TYPE_MOBILE_MMS){if(DEBUG){this.debug("Error! Only MMS network can get MMS proxy.");}
return"";}
let apnSetting=this.getApnSetting();if(apnSetting){return apnSetting.mmsproxy||"";}
return"";},get mmsPort(){if(this.type!=NETWORK_TYPE_MOBILE_MMS){if(DEBUG){this.debug("Error! Only MMS network can get MMS port.");}
return-1;} 
let apnSetting=this.getApnSetting();if(apnSetting){return apnSetting.mmsport||"-1";}
return"-1";},reason:null,getPcscf(aCount){if(this.type!=NETWORK_TYPE_MOBILE_IMS){if(DEBUG){this.debug("Error! Only IMS network can get pcscf.");}
return[];}
let dataCall=this.getDataCall();let linkInfo=[]; if(dataCall&&dataCall.state==NETWORK_STATE_CONNECTED){linkInfo=dataCall.linkInfo;}
if(aCount&&linkInfo&&linkInfo.pcscf){aCount.value=linkInfo.pcscf.length;}
if(linkInfo&&linkInfo.pcscf){return linkInfo.pcscf.slice();}
return linkInfo;},setReason(aReason){this.reason=aReason;},};function RILNetworkInterface(aDataCallHandler,aType,aApnSetting,aDataCall){if(!aDataCall){throw new Error("No dataCall for RILNetworkInterface: "+aType);}
this.dataCallHandler=aDataCallHandler;this.enabled=false;if(aDataCall instanceof Array){this.dataCallsList=aDataCall.slice();}else if(!this.dataCallsList.includes(aDataCall)){this.dataCallsList.push(aDataCall);}
this.info=new RILNetworkInfo(aDataCallHandler.clientId,aType,this);}
RILNetworkInterface.prototype={classID:RILNETWORKINTERFACE_CID,QueryInterface:ChromeUtils.generateQI([Ci.nsINetworkInterface]),enabled:null,dataCallsList:[],info:null,activeUsers:0,get httpProxyHost(){if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){if(this.dataCallsList[i].inRequestedTypes(this.type)){return this.dataCallsList[i].apnSetting.proxy||"";}}}
return"";},get httpProxyPort(){if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){if(this.dataCallsList[i].inRequestedTypes(this.type)){return this.dataCallsList[i].apnSetting.port||"";}}}
return"";},get mtu(){let apnSettingMtu=-1;let linkInfoMtu=-1;if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){if(this.dataCallsList[i].inRequestedTypes(this.type)){linkInfoMtu=this.dataCallsList[i].linkInfo.mtu;apnSettingMtu=this.dataCallsList[i].apnSetting.mtu;}}}
return linkInfoMtu||apnSettingMtu||-1;}, debug(aMsg){dump("-*- RILNetworkInterface["+
this.dataCallHandler.clientId+":"+
convertToDataCallType(this.info.type)+"]: "+
aMsg+"\n");},get connected(){return this.info.state==NETWORK_STATE_CONNECTED;},notifyRILNetworkInterface(){if(DEBUG){this.debug("notifyRILNetworkInterface type: "+
convertToDataCallType(this.info.type)+", state: "+
convertToDataCallState(this.info.state)+", reason: "+
this.info.reason);}
gNetworkManager.updateNetworkInterface(this);},enable(){if(this.info.type!=NETWORK_TYPE_MOBILE){this.activeUsers++;}
this.enabled=true;this.info.reason=Ci.nsINetworkInfo.REASON_NONE;},connect(){let dataInfo=this.dataCallHandler._dataInfo;this.debug("this.info.type ="+this.info.type);if(this.info.type!=NETWORK_TYPE_MOBILE_ECC){if(dataInfo==null||dataInfo.state!=RIL.GECKO_MOBILE_CONNECTION_STATE_REGISTERED||dataInfo.type==RIL.GECKO_MOBILE_CONNECTION_STATE_UNKNOWN){if(DEBUG){this.debug("connect: Network state not ready. Abort.");}
return;}}else{this.debug("Emergency type skip the service state check.");}
let radioTechnology=RIL.GECKO_RADIO_TECH.indexOf(dataInfo.type);if(DEBUG){this.debug("connect: radioTechnology: "+radioTechnology);}
let targetDataCall=null;let targetBearer=0;if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){if(this.dataCallsList[i].apnSetting.bearer===undefined){targetBearer=0;}else{targetBearer=this.dataCallsList[i].apnSetting.bearer;}
if(DEBUG){this.debug("connect: apn:"+
this.dataCallsList[i].apnSetting.apn+" ,targetBearer: "+
bitmaskToString(targetBearer));}
if(bitmaskHasTech(targetBearer,radioTechnology)){targetDataCall=this.dataCallsList[i];break;}}}
if(targetDataCall!=null){targetDataCall.connect(this);}else{this.debug("connect: There is no DC support this rat. Abort.");}},disable(aReason=Ci.nsINetworkInfo.REASON_NONE){if(DEBUG){this.debug("disable aReason: "+aReason);}
if(!this.enabled){return;}
if(this.info.type==NETWORK_TYPE_MOBILE){this.enabled=false;}else{this.activeUsers--;this.enabled=this.activeUsers>0;}
if(!this.enabled){this.activeUsers=0;this.enabled=false;this.disconnect(Ci.nsINetworkInfo.REASON_APN_DISABLED);}},disconnect(aReason=Ci.nsINetworkInfo.REASON_NONE){if(DEBUG){this.debug("disconnect aReason: "+aReason);}
this.info.setReason(aReason);if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){if(this.dataCallsList[i].inRequestedTypes(this.info.type)){this.dataCallsList[i].disconnect(this);}}}},shutdown(){if(this.dataCallsList){for(let i=0;i<this.dataCallsList.length;i++){this.dataCallsList[i].shutdown;}}
this.dataCallsList=null;},};var EXPORTED_SYMBOLS=["DataCallManager"];