"use strict";const{classes:Cc,interfaces:Ci,utils:Cu,results:Cr}=Components;const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");Cu.import("resource://gre/modules/ril_consts.js");var RIL_DEBUG=ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");var DEBUG=RIL_DEBUG.DEBUG_RIL;var GLOBAL=this;const EMERGENCY_CB_MODE_TIMEOUT_MS=300000;const GET_CURRENT_CALLS_RETRY_MAX=3;const MODEM_RESTART_TIMEOUT_MS=15000;const PDU_HEX_OCTET_SIZE=2;const EARTH_RADIUS_METER=6371*1000;const GEO_FENCING_MAXIMUM_WAIT_TIME_NOT_SET=30;const GEO_FENCING_MAXIMUM_WAIT_TIME=0x01;const GEO_FENCING_POLYGON=0x02;const GEO_FENCING_CIRCLE=0x03;var RILQUIRKS_CALLSTATE_EXTRA_UINT32;var RILQUIRKS_REQUEST_USE_DIAL_EMERGENCY_CALL;var RILQUIRKS_SIM_APP_STATE_EXTRA_FIELDS;var RILQUIRKS_SIGNAL_EXTRA_INT32;var RILQUIRKS_AVAILABLE_NETWORKS_EXTRA_STRING;var RILQUIRKS_EXTRA_UINT32_2ND_CALL;var RILQUIRKS_HAVE_QUERY_ICC_LOCK_RETRY_COUNT;var RILQUIRKS_SEND_STK_PROFILE_DOWNLOAD;var RILQUIRKS_DATA_REGISTRATION_ON_DEMAND;var RILQUIRKS_SUBSCRIPTION_CONTROL;var RILQUIRKS_SMSC_ADDRESS_FORMAT; const kPrefAppCBConfigurationEnabled="dom.app_cb_configuration";if(!this.debug){this.debug=function debug(message){dump("SimIOHelper: "+message+"\n");};}
function updateDebugFlag(){ try{DEBUG=RIL_DEBUG.DEBUG_RIL||Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);}catch(e){}}
updateDebugFlag();function LatLng(alat,alng,aAccuracyInMeters=0){this.lat=alat;this.lng=alng;this.accuracyInMeters=aAccuracyInMeters;}
LatLng.prototype={lat:0,lng:0,accuracyInMeters:0,toRadians(aDegree){return aDegree*(Math.PI/180);},distance(aLatLng){let dlat=Math.sin(0.5*this.toRadians(this.lat-aLatLng.lat));let dlng=Math.sin(0.5*this.toRadians(this.lng-aLatLng.lng));let x=dlat*dlat+
dlng*dlng*Math.cos(this.toRadians(this.lat))*Math.cos(this.toRadians(aLatLng.lat));return 2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))*EARTH_RADIUS_METER;},};function Geometry(){}
Geometry.prototype={type:GEOMETRY_TYPE_UNKNOW,contains(aLatLng,_aThresholdInMeters=0){if(DEBUG){debug("Non-implemented geometry method");}},};function Point(aX,aY){this.x=aX;this.y=aY;}
Point.prototype={subtract(aPoint){return new Point(this.x-aPoint.x,this.y-aPoint.y);},distance(aPoint){return Math.sqrt(Math.pow(this.x-aPoint.x,2)+Math.pow(this.y-aPoint.y,2));},equals(aPoint){if(this==aPoint){return true;}
return(this.x==aPoint.x&&this.y==aPoint.y);},};function LineSegment(aPointA,aPointB){this.pointA=aPointA;this.pointB=aPointB;}
LineSegment.prototype={length(){return this.pointA.distance(this.pointB);},distance(aPoint){if(this.pointA.equals(this.pointB)){return aPoint.distance(this.pointA);}
let sub1=aPoint.subtract(this.pointA);let sub2=this.pointB.subtract(this.pointA);let dot=sub1.x*sub2.x+sub1.y*sub2.y;let magnitude=dot/(Math.pow(this.length(),2));if(magnitude>1.0){magnitude=1.0;}else if(magnitude<0.0){magnitude=0.0;}
let projectX=this.pointA.x+((this.pointB.x-this.pointA.x)*magnitude);let projectY=this.pointA.y+((this.pointB.y-this.pointA.y)*magnitude);return aPoint.distance(new Point(projectX,projectY));},};function Polygon(aLatLngs){this._vertices=[];this._scaledVertices=[];aLatLngs.forEach(latlng=>{this._vertices.push(new LatLng(latlng.lat,latlng.lng));});this.type=GEOMETRY_TYPE_POLYGON;let idx=0;for(let i=1;i<aLatLngs.length;i++){if(aLatLngs[i].lng<aLatLngs[idx].lng){idx=i;}}
this._origin=aLatLngs[idx];for(let i=0;i<aLatLngs.length;i++){let latLng=aLatLngs[i];this._scaledVertices.push(this._convertAndScaleLatLng(latLng));}}
Polygon.prototype={__proto__:Geometry.prototype,type:GEOMETRY_TYPE_POLYGON,_vertices:[],_scaledVertices:[],_origin:null,_convertAndScaleLatLng(aLatLng){let pointX=aLatLng.lat-this._origin.lat;let pointY=aLatLng.lng-this._origin.lng;if(Math.sign(this._origin.lng)!=0&&Math.sign(this._origin.lng)!=Math.sign(aLatLng.lng)){let distCross0thMeridian=Math.abs(this._origin.lng)+Math.abs(aLatLng.lng);if(Math.sign(distCross0thMeridian*2-360)>0){pointY=Math.sign(this._origin.lng)*(360-distCross0thMeridian);}}
return new Point(pointX*1000.0,pointY*1000.0);},_crossProduct(aPointA,aPointB){return aPointA.x*aPointB.y-aPointA.y*aPointB.x;},distance(aLatLng){let minDistance=Number.MAX_VALUE;let verticeP=this._convertAndScaleLatLng(aLatLng);let verticesLength=this._scaledVertices.length;for(let i=0;i<verticesLength;i++){let verticeA=this._scaledVertices[i];let verticeB=this._scaledVertices[(i+1)%verticesLength];let line=new LineSegment(verticeA,verticeB);let distance=line.distance(verticeP);minDistance=Math.min(distance,minDistance);}
return minDistance;},contains(aLatLng,aThresholdInMeters=0){if(aThresholdInMeters>0){ return this.distance(aLatLng)<=aThresholdInMeters;}
let scaledPoint=this._convertAndScaleLatLng(aLatLng);let verticesLength=this._scaledVertices.length;let windingNumber=0;for(let i=0;i<verticesLength;i++){let pointA=this._scaledVertices[i];let pointB=this._scaledVertices[(i+1)%verticesLength];let counterClockwise=Math.sign(this._crossProduct(pointB.subtract(pointA),scaledPoint.subtract(pointA)));if(counterClockwise==0){if(Math.min(pointA.x,pointB.x)<=scaledPoint.x&&scaledPoint.x<=Math.max(pointA.x,pointB.x)&&Math.min(pointA.y,pointB.y)<=scaledPoint.y&&scaledPoint.y<=Math.max(pointA.y,pointB.y)){return true;}}else if(Math.sign(pointA.y-scaledPoint.y)<=0){ if(counterClockwise>0&&Math.sign(pointB.y-scaledPoint.y)>0){++windingNumber;}}else{ if(counterClockwise<0&&Math.sign(pointB.y-scaledPoint.y)<=0){--windingNumber;}}}
return windingNumber!=0;},};function Circle(aCenter,aRadiusInMeters){this._center=new LatLng(aCenter.lat,aCenter.lng);this._radius=aRadiusInMeters;this.type=GEOMETRY_TYPE_CIRCLE;}
Circle.prototype={__proto__:Geometry.prototype,type:GEOMETRY_TYPE_CIRCLE,_center:null,_radius:0,contains(aLatLng,aThresholdInMeters=0){ return this._center.distance(aLatLng)<=(this._radius+aThresholdInMeters);},};function Context(aRadioInterfcae){this.clientId=aRadioInterfcae.clientId;this.RIL=aRadioInterfcae;updateDebugFlag();}
Context.prototype={RIL:null,debug(aMessage){GLOBAL.debug("["+this.RIL.clientId+"] "+aMessage);},};(function(){let lazySymbols=["ICCContactHelper","ICCRecordHelper","ICCIOHelper","ICCFileHelper","ICCUtilsHelper","ICCPDUHelper","GsmPDUHelper","SimRecordHelper","ISimRecordHelper","BerTlvHelper","ComprehensionTlvHelper","StkProactiveCmdHelper","StkCommandParamsFactory",];for(let i=0;i<lazySymbols.length;i++){let symbol=lazySymbols[i];Object.defineProperty(Context.prototype,symbol,{get(){let real=new GLOBAL[symbol+"Object"](this);Object.defineProperty(this,symbol,{value:real,enumerable:true,});return real;},configurable:true,enumerable:true,});}})();function ICCIOHelperObject(aContext){this.context=aContext;}
ICCIOHelperObject.prototype={context:null,loadLinearFixedEF(options){let cb;let readRecord=function(options){options.command=ICC_COMMAND_READ_RECORD;options.p1=options.recordNumber||1; options.p2=READ_RECORD_ABSOLUTE_MODE;options.p3=options.recordSize;options.callback=cb||options.callback;this.context.RIL.sendWorkerMessage("iccIO",options,null);}.bind(this);options.structure=EF_STRUCTURE_LINEAR_FIXED;options.pathId=options.pathId||this.context.ICCFileHelper.getEFPath(options.fileId);if(options.recordSize){readRecord(options);return;}
cb=options.callback;options.callback=readRecord;this.getResponse(options);},loadNextRecord(options){options.p1++;this.context.RIL.sendWorkerMessage("iccIO",options,null);},updateLinearFixedEF(options){if(!options.fileId||!options.recordNumber){throw new Error("Unexpected fileId "+
options.fileId+" or recordNumber "+
options.recordNumber);}
options.structure=EF_STRUCTURE_LINEAR_FIXED;options.pathId=this.context.ICCFileHelper.getEFPath(options.fileId);let cb=options.callback;options.callback=function callback(options){options.callback=cb;options.command=ICC_COMMAND_UPDATE_RECORD;options.p1=options.recordNumber;options.p2=READ_RECORD_ABSOLUTE_MODE;options.p3=options.recordSize;if(options.command==ICC_COMMAND_UPDATE_RECORD&&options.dataWriter){options.dataWriter(options.recordSize);options.dataWriter=this.context.GsmPDUHelper.pdu;}
this.context.RIL.sendWorkerMessage("iccIO",options,null);}.bind(this);this.getResponse(options);},loadTransparentEF(options){options.structure=EF_STRUCTURE_TRANSPARENT;let cb=options.callback;options.callback=function callback(options){options.callback=cb;options.command=ICC_COMMAND_READ_BINARY;options.p2=0x00;options.p3=options.fileSize;this.context.RIL.sendWorkerMessage("iccIO",options,null);}.bind(this);this.getResponse(options);},updateTransparentEF(options){options.structure=EF_STRUCTURE_TRANSPARENT;let cb=options.callback;options.callback=function callback(options){options.callback=cb;options.command=ICC_COMMAND_UPDATE_BINARY;options.p2=0x00;options.p3=options.fileSize;this.context.RIL.sendWorkerMessage("iccIO",options,null);}.bind(this);this.getResponse(options);},getResponse(options){options.command=ICC_COMMAND_GET_RESPONSE;options.pathId=options.pathId||this.context.ICCFileHelper.getEFPath(options.fileId);if(!options.pathId){throw new Error("Unknown pathId for "+options.fileId.toString(16));}
options.p1=0; options.p2=0x00;options.p3=GET_RESPONSE_EF_SIZE_BYTES;this.context.RIL.sendWorkerMessage("iccIO",options,null);},processICCIO(options){let func=this[options.command];func.call(this,options);},processICCIOGetResponse(options){let strLen=options.simResponse.length;let peek=this.context.GsmPDUHelper.processHexToInt(options.simResponse.slice(0,4),16);if(peek===BER_FCP_TEMPLATE_TAG){}else{this.processSimGetResponse(options);}
if(options.callback){options.callback(options);}},processUSimGetResponse(options,octetLen){let BerTlvHelper=this.context.BerTlvHelper;let iter=Iterator(berTlv.value);let tlv=BerTlvHelper.searchForNextTag(BER_FCP_FILE_DESCRIPTOR_TAG,iter);if(!tlv||tlv.value.fileStructure!==UICC_EF_STRUCTURE[options.structure]){throw new Error("Expected EF structure "+
UICC_EF_STRUCTURE[options.structure]+" but read "+
tlv.value.fileStructure);}
if(tlv.value.fileStructure===UICC_EF_STRUCTURE[EF_STRUCTURE_LINEAR_FIXED]||tlv.value.fileStructure===UICC_EF_STRUCTURE[EF_STRUCTURE_CYCLIC]){options.recordSize=tlv.value.recordLength;options.totalRecords=tlv.value.numOfRecords;}
tlv=BerTlvHelper.searchForNextTag(BER_FCP_FILE_IDENTIFIER_TAG,iter);if(!tlv||tlv.value.fileId!==options.fileId){throw new Error("Expected file ID "+
options.fileId.toString(16)+" but read "+
fileId.toString(16));}
tlv=BerTlvHelper.searchForNextTag(BER_FCP_FILE_SIZE_DATA_TAG,iter);if(!tlv){throw new Error("Unexpected file size data");}
options.fileSize=tlv.value.fileSizeData;},processSimGetResponse(options){let GsmPDUHelper=this.context.GsmPDUHelper;
options.fileSize=GsmPDUHelper.processHexToInt(options.simResponse.slice(4,8),16);let fileId=GsmPDUHelper.processHexToInt(options.simResponse.slice(8,12),16);if(fileId!=options.fileId){if(DEBUG){this.context.debug("Expected file ID "+
options.fileId.toString(16)+" but read "+
fileId.toString(16));}}
let fileType=GsmPDUHelper.processHexToInt(options.simResponse.slice(12,14),16);if(fileType!=TYPE_EF){throw new Error("Unexpected file type "+fileType);}
let efStructure=GsmPDUHelper.processHexToInt(options.simResponse.slice(26,28),16);if(efStructure!=options.structure){throw new Error("Expected EF structure "+
options.structure+" but read "+
efStructure);}
if(efStructure==EF_STRUCTURE_LINEAR_FIXED||efStructure==EF_STRUCTURE_CYCLIC){options.recordSize=GsmPDUHelper.processHexToInt(options.simResponse.slice(28,30),16);options.totalRecords=options.fileSize/options.recordSize;}},processICCIOReadRecord(options){if(options.callback){options.callback(options);}},processICCIOReadBinary(options){if(options.callback){options.callback(options);}},processICCIOUpdateRecord(options){if(options.callback){options.callback(options);}},};ICCIOHelperObject.prototype[ICC_COMMAND_SEEK]=null;ICCIOHelperObject.prototype[ICC_COMMAND_READ_BINARY]=function ICC_COMMAND_READ_BINARY(options){this.processICCIOReadBinary(options);};ICCIOHelperObject.prototype[ICC_COMMAND_READ_RECORD]=function ICC_COMMAND_READ_RECORD(options){this.processICCIOReadRecord(options);};ICCIOHelperObject.prototype[ICC_COMMAND_GET_RESPONSE]=function ICC_COMMAND_GET_RESPONSE(options){this.processICCIOGetResponse(options);};ICCIOHelperObject.prototype[ICC_COMMAND_UPDATE_BINARY]=null;ICCIOHelperObject.prototype[ICC_COMMAND_UPDATE_RECORD]=function ICC_COMMAND_UPDATE_RECORD(options){this.processICCIOUpdateRecord(options);};function ICCFileHelperObject(aContext){this.context=aContext;}
ICCFileHelperObject.prototype={context:null,getCommonEFPath(fileId){switch(fileId){case ICC_EF_ICCID:return EF_PATH_MF_SIM;case ICC_EF_ADN:case ICC_EF_SDN:return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM;case ICC_EF_PBR:return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM+EF_PATH_DF_PHONEBOOK;case ICC_EF_IMG:return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM+EF_PATH_GRAPHICS;}
return null;},getSimEFPath(fileId){switch(fileId){case ICC_EF_FDN:case ICC_EF_MSISDN:case ICC_EF_SMS:case ICC_EF_EXT1:case ICC_EF_EXT2:case ICC_EF_EXT3:return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM;case ICC_EF_AD:case ICC_EF_MBDN:case ICC_EF_MWIS:case ICC_EF_CFIS:case ICC_EF_PLMNsel:case ICC_EF_SPN:case ICC_EF_SPDI:case ICC_EF_SST:case ICC_EF_PHASE:case ICC_EF_CBMI:case ICC_EF_CBMID:case ICC_EF_CBMIR:case ICC_EF_OPL:case ICC_EF_PNN:case ICC_EF_GID1:case ICC_EF_GID2:case ICC_EF_CPHS_CFF:case ICC_EF_CPHS_INFO:case ICC_EF_CPHS_MBN:case ICC_EF_CPHS_ONS:case ICC_EF_CPHS_ONSF:return EF_PATH_MF_SIM+EF_PATH_DF_GSM;default:return null;}},getUSimEFPath(fileId){switch(fileId){case ICC_EF_AD:case ICC_EF_FDN:case ICC_EF_MBDN:case ICC_EF_MWIS:case ICC_EF_CFIS:case ICC_EF_UST:case ICC_EF_MSISDN:case ICC_EF_SPN:case ICC_EF_SPDI:case ICC_EF_CBMI:case ICC_EF_CBMID:case ICC_EF_CBMIR:case ICC_EF_OPL:case ICC_EF_PNN:case ICC_EF_SMS:case ICC_EF_GID1:case ICC_EF_GID2:

case ICC_EF_CPHS_CFF:case ICC_EF_CPHS_INFO:case ICC_EF_CPHS_MBN:case ICC_EF_CPHS_ONS:case ICC_EF_CPHS_ONSF:return EF_PATH_MF_SIM+EF_PATH_ADF_USIM;default:

return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM+EF_PATH_DF_PHONEBOOK;}},getRuimEFPath(fileId){switch(fileId){case ICC_EF_CSIM_IMSI_M:case ICC_EF_CSIM_CDMAHOME:case ICC_EF_CSIM_CST:case ICC_EF_CSIM_SPN:return EF_PATH_MF_SIM+EF_PATH_DF_CDMA;case ICC_EF_FDN:case ICC_EF_EXT1:case ICC_EF_EXT2:case ICC_EF_EXT3:return EF_PATH_MF_SIM+EF_PATH_DF_TELECOM;default:return null;}},getIsimEFPath(fileId){switch(fileId){case ICC_EF_ISIM_IMPI:case ICC_EF_ISIM_DOMAIN:case ICC_EF_ISIM_IMPU:case ICC_EF_ISIM_IST:case ICC_EF_ISIM_PCSCF:return EF_PATH_MF_SIM+EF_PATH_ADF_ISIM;default:return null;}},getEFPath(fileId){let path=this.getCommonEFPath(fileId);if(path){return path;}
switch(this.context.RIL.appType){case CARD_APPTYPE_SIM:return this.getSimEFPath(fileId);case CARD_APPTYPE_USIM:return this.getUSimEFPath(fileId);case CARD_APPTYPE_RUIM:return this.getRuimEFPath(fileId);default:return null;}},};function ICCUtilsHelperObject(aContext){this.context=aContext;}
ICCUtilsHelperObject.prototype={context:null,getNetworkNameFromICC(mcc,mnc,lac){let RIL=this.context.RIL;let iccInfoPriv=RIL.iccInfoPrivate;let iccInfo=RIL.iccInfo;let pnnEntry;if(!mcc||!mnc||lac==null||lac<0){return null;}
if(!iccInfoPriv.PNN){return null;}
if(!this.isICCServiceAvailable("OPL")){

if(mcc==iccInfo.mcc&&mnc==iccInfo.mnc){pnnEntry=iccInfoPriv.PNN[0];}}else{let GsmPDUHelper=this.context.GsmPDUHelper;let wildChar=GsmPDUHelper.extendedBcdChars.charAt(0x0d);

let length=iccInfoPriv.OPL?iccInfoPriv.OPL.length:0;for(let i=0;i<length;i++){let unmatch=false;let opl=iccInfoPriv.OPL[i];

if(opl.mcc.indexOf(wildChar)!==-1){for(let j=0;j<opl.mcc.length;j++){if(opl.mcc[j]!==wildChar&&opl.mcc[j]!==mcc[j]){unmatch=true;break;}}
if(unmatch){continue;}}else if(mcc!==opl.mcc){continue;}
if(mnc.length!==opl.mnc.length){continue;}
if(opl.mnc.indexOf(wildChar)!==-1){for(let j=0;j<opl.mnc.length;j++){if(opl.mnc[j]!==wildChar&&opl.mnc[j]!==mnc[j]){unmatch=true;break;}}
if(unmatch){continue;}}else if(mnc!==opl.mnc){continue;}


if((opl.lacTacStart===0x0&&opl.lacTacEnd==0xfffe)||(opl.lacTacStart<=lac&&opl.lacTacEnd>=lac)){if(opl.pnnRecordId===0){
return null;}
pnnEntry=iccInfoPriv.PNN[opl.pnnRecordId-1];break;}}}
if(!pnnEntry){return null;}
return{fullName:pnnEntry.fullName||"",shortName:pnnEntry.shortName||"",};},updateDisplayCondition(){let RIL=this.context.RIL;

 let iccInfo=RIL.iccInfo;let iccInfoPriv=RIL.iccInfoPrivate;let displayCondition=iccInfoPriv.spnDisplayCondition;let origIsDisplayNetworkNameRequired=iccInfo.isDisplayNetworkNameRequired;let origIsDisplaySPNRequired=iccInfo.isDisplaySpnRequired;if(displayCondition===undefined){iccInfo.isDisplayNetworkNameRequired=true;iccInfo.isDisplaySpnRequired=false;}else if(RIL._isCdma){let cdmaHome=RIL.cdmaHome;let cell=RIL.voiceRegistrationState.cell;let sid=cell&&cell.cdmaSystemId;let nid=cell&&cell.cdmaNetworkId;iccInfo.isDisplayNetworkNameRequired=false;
if(displayCondition===0x0){iccInfo.isDisplaySpnRequired=false;}else{
if(!cdmaHome||!cdmaHome.systemId||cdmaHome.systemId.length===0||cdmaHome.systemId.length!=cdmaHome.networkId.length||!sid||!nid){

iccInfo.isDisplaySpnRequired=true;}else{let inHomeArea=false;for(let i=0;i<cdmaHome.systemId.length;i++){let homeSid=cdmaHome.systemId[i],homeNid=cdmaHome.networkId[i];if(homeSid===0||homeNid===0|| homeSid!=sid){continue;}

if(homeNid==65535||homeNid==nid){inHomeArea=true;break;}}
iccInfo.isDisplaySpnRequired=inHomeArea;}}}else{let operatorMnc=RIL.operator?RIL.operator.mnc:-1;let operatorMcc=RIL.operator?RIL.operator.mcc:-1;
let isOnMatchingPlmn=false;
if(iccInfo.mcc==operatorMcc&&iccInfo.mnc==operatorMnc){isOnMatchingPlmn=true;}
if(!isOnMatchingPlmn&&iccInfoPriv.SPDI){let iccSpdi=iccInfoPriv.SPDI; for(let plmn in iccSpdi){let plmnMcc=iccSpdi[plmn].mcc;let plmnMnc=iccSpdi[plmn].mnc;isOnMatchingPlmn=plmnMcc==operatorMcc&&plmnMnc==operatorMnc;if(isOnMatchingPlmn){break;}}}

if(isOnMatchingPlmn){
if(DEBUG){this.context.debug("PLMN is HPLMN or PLMN "+"is in PLMN list");}


iccInfo.isDisplaySpnRequired=true;iccInfo.isDisplayNetworkNameRequired=(displayCondition&0x01)!==0;}else{
if(DEBUG){this.context.debug("PLMN isn't HPLMN and PLMN isn't in PLMN list");}
iccInfo.isDisplayNetworkNameRequired=true;iccInfo.isDisplaySpnRequired=(displayCondition&0x02)===0;}}
if(DEBUG){this.context.debug("isDisplayNetworkNameRequired = "+iccInfo.isDisplayNetworkNameRequired);this.context.debug("isDisplaySpnRequired = "+iccInfo.isDisplaySpnRequired);}
return(origIsDisplayNetworkNameRequired!==iccInfo.isDisplayNetworkNameRequired||origIsDisplaySPNRequired!==iccInfo.isDisplaySpnRequired);},decodeSimTlvs(tlvsLen){let GsmPDUHelper=this.context.GsmPDUHelper;let index=0;let tlvs=[];while(index<tlvsLen){let simTlv={tag:GsmPDUHelper.readHexOctet(),length:GsmPDUHelper.readHexOctet(),};simTlv.value=GsmPDUHelper.readHexOctetArray(simTlv.length);tlvs.push(simTlv);index+=simTlv.length+2;}
return tlvs;},parsePbrTlvs(pbrTlvs){let pbr={};for(let i=0;i<pbrTlvs.length;i++){let pbrTlv=pbrTlvs[i];let anrIndex=0;for(let j=0;j<pbrTlv.value.length;j++){let tlv=pbrTlv.value[j];let tagName=USIM_TAG_NAME[tlv.tag];if(tlv.tag==ICC_USIM_EFANR_TAG){tagName+=anrIndex;anrIndex++;}
pbr[tagName]=tlv;pbr[tagName].fileType=pbrTlv.tag;pbr[tagName].fileId=(tlv.value[0]<<8)|tlv.value[1];pbr[tagName].sfi=tlv.value[2];if(pbrTlv.tag==ICC_USIM_TYPE2_TAG){pbr[tagName].indexInIAP=j;}}}
return pbr;},handleICCInfoChange(){let RIL=this.context.RIL;RIL.iccInfo.rilMessageType="iccinfochange";RIL.handleUnsolicitedMessage(RIL.iccInfo);},handleISIMInfoChange(options){options.rilMessageType="isiminfochange";let RIL=this.context.RIL;RIL.handleUnsolicitedMessage(options);},isICCServiceAvailable(geckoService){let RIL=this.context.RIL;let serviceTable=RIL._isCdma?RIL.iccInfoPrivate.cst:RIL.iccInfoPrivate.sst;let index,bitmask;if(RIL.appType==CARD_APPTYPE_SIM||RIL.appType==CARD_APPTYPE_RUIM){let simService;if(RIL.appType==CARD_APPTYPE_SIM){simService=GECKO_ICC_SERVICES.sim[geckoService];}else{simService=GECKO_ICC_SERVICES.ruim[geckoService];}
if(!simService){return false;}
simService-=1;index=Math.floor(simService/4);bitmask=2<<(simService%4<<1);}else if(RIL.appType==CARD_APPTYPE_USIM){let usimService=GECKO_ICC_SERVICES.usim[geckoService];if(!usimService){return false;}
usimService-=1;index=Math.floor(usimService/8);bitmask=1<<(usimService%8<<0);}
if(!serviceTable){return false;}
return index<serviceTable.length&&(serviceTable[index]&bitmask)!==0;},isCphsServiceAvailable(geckoService){let RIL=this.context.RIL;let serviceTable=RIL.iccInfoPrivate.cphsSt;if(!(serviceTable instanceof Uint8Array)){return false;}
let cphsService=GECKO_ICC_SERVICES.cphs[geckoService];if(!cphsService){return false;}
cphsService-=1;let index=Math.floor(cphsService/4);let bitmask=2<<(cphsService%4<<1);return index<serviceTable.length&&(serviceTable[index]&bitmask)!==0;},isGsm8BitAlphabet(str){if(!str){return false;}
const langTable=PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];for(let i=0;i<str.length;i++){let c=str.charAt(i);let octet=langTable.indexOf(c);if(octet==-1){octet=langShiftTable.indexOf(c);if(octet==-1){return false;}}}
return true;},parseMccMncFromImsi(imsi,mncLength){if(!imsi){return null;}
let mcc=imsi.substr(0,3);if(!mncLength){
if(PLMN_HAVING_3DIGITS_MNC[mcc]&&PLMN_HAVING_3DIGITS_MNC[mcc].indexOf(imsi.substr(3,3))!==-1){mncLength=3;}else{let index=MCC_TABLE_FOR_MNC_LENGTH_IS_3.indexOf(mcc);mncLength=index!==-1?3:2;}}
let mnc=imsi.substr(3,mncLength);if(DEBUG){this.context.debug("IMSI: "+imsi+" MCC: "+mcc+" MNC: "+mnc);}
return{mcc,mnc};},};function GsmPDUHelperObject(aContext){this.context=aContext;this.pdu="";this.pduWriteIndex=0;this.pduReadIndex=0;this.lengthIndex=0;}
GsmPDUHelperObject.prototype={context:null,pdu:null,pduWriteIndex:null,pduReadIndex:null,lengthIndex:null,initWith(data=""){this.pduReadIndex=0;this.pduWriteIndex=0;this.pdu="";if(typeof data==="string"){this.pdu=data;this.pduWriteIndex=data.length;}else{for(let i=0;i<data.length;i++){this.writeHexOctet(data[i]);}}},getReadAvailable(){return this.pduWriteIndex-this.pduReadIndex;},seekIncoming(len){if(this.getReadAvailable()>=len){this.pduReadIndex=this.pduReadIndex+len;}else{throw"Seek PDU out of bounds";}},startCalOutgoingSize(){this.lengthIndex=this.pduWriteIndex;},insert(baseString,insertString,pos){return baseString.slice(0,pos)+insertString+baseString.slice(pos);},stopCalOutgoingSize(){let length=(this.pduWriteIndex-this.lengthIndex)/2;let nibble=length>>4;this.pdu=this.insert(this.pdu,nibble.toString(16),this.lengthIndex);this.pduWriteIndex++;nibble=length&0x0f;this.pdu=this.insert(this.pdu,nibble.toString(16),this.lengthIndex+1);this.pduWriteIndex++;this.lengthIndex=0;},processHexToInt(x,base){const parsed=parseInt(x,base);if(isNaN(parsed)){return 0;}
return parsed;},readHexNibble(){if(this.getReadAvailable()<=0){throw"Read PDU out of bounds";}
let nibble=this.pdu.charCodeAt(this.pduReadIndex);if(nibble>=48&&nibble<=57){nibble-=48;}else if(nibble>=65&&nibble<=70){nibble-=55;}else if(nibble>=97&&nibble<=102){nibble-=87;}else{throw"Found invalid nibble during PDU parsing: "+
String.fromCharCode(nibble);}
this.pduReadIndex++;return nibble;},writeHexNibble(nibble){nibble&=0x0f;this.pdu+=nibble.toString(16);this.pduWriteIndex++;},readHexOctet(){return(this.readHexNibble()<<4)|this.readHexNibble();},writeHexOctet(octet){this.writeHexNibble(octet>>4);this.writeHexNibble(octet);},readHexOctetArray(length){let array=new Uint8Array(length);for(let i=0;i<length;i++){array[i]=this.readHexOctet();}
return array;},writeWithBuffer(writeFunction){let buf=[];let writeHexOctet=this.writeHexOctet;this.writeHexOctet=function(octet){buf.push(octet);};try{writeFunction();}catch(e){if(DEBUG){debug("Error when writeWithBuffer: "+e);}
buf=[];}finally{this.writeHexOctet=writeHexOctet;}
return buf;},octetToBCD(octet){return(((octet&0xf0)<=0x90)*((octet>>4)&0x0f)+
((octet&0x0f)<=0x09)*(octet&0x0f)*10);},BCDToOctet(bcd){bcd=Math.abs(bcd);return(bcd%10<<4)+(Math.floor(bcd/10)%10);},bcdChars:"0123456789",semiOctetToBcdChar(semiOctet,suppressException){if(semiOctet>=this.bcdChars.length){if(suppressException){return"";}
throw new RangeError();}
let result=this.bcdChars.charAt(semiOctet);return result;},extendedBcdChars:"0123456789*#,;",semiOctetToExtendedBcdChar(semiOctet,suppressException){if(semiOctet>=this.extendedBcdChars.length){if(suppressException){return"";}
throw new RangeError();}
return this.extendedBcdChars.charAt(semiOctet);},stringToExtendedBcd(string){return string.replace(/[^0-9*#,]/g,"").replace(/\*/g,"a").replace(/\#/g,"b").replace(/\,/g,"c");},readSwappedNibbleBcdNum(pairs){let number=0;for(let i=0;i<pairs;i++){let octet=this.readHexOctet();if(octet==0xff){continue;}

if((octet&0xf0)==0xf0){number*=10;number+=octet&0x0f;continue;}
number*=100;number+=this.octetToBCD(octet);}
return number;},readSwappedNibbleBcdString(pairs,suppressException){let str="";for(let i=0;i<pairs;i++){let nibbleH=this.readHexNibble();let nibbleL=this.readHexNibble();if(nibbleL==0x0f){break;}
str+=this.semiOctetToBcdChar(nibbleL,suppressException);if(nibbleH!=0x0f){str+=this.semiOctetToBcdChar(nibbleH,suppressException);}}
return str;},readSwappedNibbleExtendedBcdString(pairs,suppressException){let str="";for(let i=0;i<pairs;i++){let nibbleH=this.readHexNibble();let nibbleL=this.readHexNibble();if(nibbleL==0x0f){break;}
str+=this.semiOctetToExtendedBcdChar(nibbleL,suppressException);if(nibbleH!=0x0f){str+=this.semiOctetToExtendedBcdChar(nibbleH,suppressException);}}
return str;},writeSwappedNibbleBCD(data){data=data.toString();if(data.length%2){data+="F";}
for(let i=0;i<data.length;i+=2){this.pdu+=data.charAt(i+1);this.pduWriteIndex++;this.pdu+=data.charAt(i);this.pduWriteIndex++;}},writeSwappedNibbleBCDNum(data){data=data.toString();if(data.length%2){data="0"+data;}
for(let i=0;i<data.length;i+=2){this.pdu+=data.charAt(i+1);this.pduWriteIndex++;this.pdu+=data.charAt(i);this.pduWriteIndex++;}},readSeptetsToString(length,paddingBits,langIndex,langShiftIndex){let ret="";let byteLength=Math.ceil((length*7+paddingBits)/8);let data=0;let dataBits=0;if(paddingBits){data=this.readHexOctet()>>paddingBits;dataBits=8-paddingBits;--byteLength;}
let escapeFound=false;const langTable=PDU_NL_LOCKING_SHIFT_TABLES[langIndex];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[langShiftIndex];do{ let bytesToRead=Math.min(byteLength,dataBits?3:4);for(let i=0;i<bytesToRead;i++){data|=this.readHexOctet()<<dataBits;dataBits+=8;--byteLength;} 
for(;dataBits>=7;dataBits-=7){let septet=data&0x7f;data>>>=7;if(escapeFound){escapeFound=false;if(septet==PDU_NL_EXTENDED_ESCAPE){

ret+=" ";}else if(septet==PDU_NL_RESERVED_CONTROL){

ret+=" ";}else{ret+=langShiftTable[septet];}}else if(septet==PDU_NL_EXTENDED_ESCAPE){escapeFound=true;--length;}else{ret+=langTable[septet];}}}while(byteLength);if(ret.length!=length){ret=ret.slice(0,length);}
return ret;},writeStringAsSeptets(message,paddingBits,langIndex,langShiftIndex){const langTable=PDU_NL_LOCKING_SHIFT_TABLES[langIndex];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[langShiftIndex];let dataBits=paddingBits;let data=0;for(let i=0;i<message.length;i++){let c=message.charAt(i);let septet=langTable.indexOf(c);if(septet==PDU_NL_EXTENDED_ESCAPE){continue;}
if(septet>=0){data|=septet<<dataBits;dataBits+=7;}else{septet=langShiftTable.indexOf(c);if(septet==-1){throw new Error("'"+
c+"' is not in 7 bit alphabet "+
langIndex+":"+
langShiftIndex+"!");}
if(septet==PDU_NL_RESERVED_CONTROL){continue;}
data|=PDU_NL_EXTENDED_ESCAPE<<dataBits;dataBits+=7;data|=septet<<dataBits;dataBits+=7;}
for(;dataBits>=8;dataBits-=8){this.writeHexOctet(data&0xff);data>>>=8;}}
if(dataBits!==0){this.writeHexOctet(data&0xff);}},writeStringAs8BitUnpacked(text){const langTable=PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];let len=text?text.length:0;for(let i=0;i<len;i++){let c=text.charAt(i);let octet=langTable.indexOf(c);if(octet==-1){octet=langShiftTable.indexOf(c);if(octet==-1){octet=langTable.indexOf(" ");}else{this.writeHexOctet(PDU_NL_EXTENDED_ESCAPE);}}
this.writeHexOctet(octet);}},readUCS2String(numOctets){let str="";let length=numOctets/2;for(let i=0;i<length;++i){let code=(this.readHexOctet()<<8)|this.readHexOctet();str+=String.fromCharCode(code);}
if(DEBUG){this.context.debug("Read UCS2 string: "+str);}
return str;},writeUCS2String(message){for(let i=0;i<message.length;++i){let code=message.charCodeAt(i);this.writeHexOctet((code>>8)&0xff);this.writeHexOctet(code&0xff);}},readUserDataHeader(msg){let header={length:0,langIndex:PDU_NL_IDENTIFIER_DEFAULT,langShiftIndex:PDU_NL_IDENTIFIER_DEFAULT,};header.length=this.readHexOctet();if(DEBUG){this.context.debug("Read UDH length: "+header.length);}
let dataAvailable=header.length;while(dataAvailable>=2){let id=this.readHexOctet();let length=this.readHexOctet();if(DEBUG){this.context.debug("Read UDH id: "+id+", length: "+length);}
dataAvailable-=2;switch(id){case PDU_IEI_CONCATENATED_SHORT_MESSAGES_8BIT:{let ref=this.readHexOctet();let max=this.readHexOctet();let seq=this.readHexOctet();dataAvailable-=3;if(max&&seq&&seq<=max){header.segmentRef=ref;header.segmentMaxSeq=max;header.segmentSeq=seq;}
break;}
case PDU_IEI_APPLICATION_PORT_ADDRESSING_SCHEME_8BIT:{let dstp=this.readHexOctet();let orip=this.readHexOctet();dataAvailable-=2;if(dstp<PDU_APA_RESERVED_8BIT_PORTS||orip<PDU_APA_RESERVED_8BIT_PORTS){

break;}
header.destinationPort=dstp;header.originatorPort=orip;break;}
case PDU_IEI_APPLICATION_PORT_ADDRESSING_SCHEME_16BIT:{let dstp=(this.readHexOctet()<<8)|this.readHexOctet();let orip=(this.readHexOctet()<<8)|this.readHexOctet();dataAvailable-=4;if(dstp>=PDU_APA_VALID_16BIT_PORTS||orip>=PDU_APA_VALID_16BIT_PORTS){




this.context.debug("Warning: Invalid port numbers [dstp, orip]: "+
JSON.stringify([dstp,orip]));}
header.destinationPort=dstp;header.originatorPort=orip;break;}
case PDU_IEI_CONCATENATED_SHORT_MESSAGES_16BIT:{let ref=(this.readHexOctet()<<8)|this.readHexOctet();let max=this.readHexOctet();let seq=this.readHexOctet();dataAvailable-=4;if(max&&seq&&seq<=max){header.segmentRef=ref;header.segmentMaxSeq=max;header.segmentSeq=seq;}
break;}
case PDU_IEI_NATIONAL_LANGUAGE_SINGLE_SHIFT:let langShiftIndex=this.readHexOctet();--dataAvailable;if(langShiftIndex<PDU_NL_SINGLE_SHIFT_TABLES.length){header.langShiftIndex=langShiftIndex;}
break;case PDU_IEI_NATIONAL_LANGUAGE_LOCKING_SHIFT:let langIndex=this.readHexOctet();--dataAvailable;if(langIndex<PDU_NL_LOCKING_SHIFT_TABLES.length){header.langIndex=langIndex;}
break;case PDU_IEI_SPECIAL_SMS_MESSAGE_INDICATION:let msgInd=this.readHexOctet()&0xff;let msgCount=this.readHexOctet();dataAvailable-=2;let storeType=msgInd&PDU_MWI_STORE_TYPE_BIT;let mwi=msg.mwi;if(!mwi){mwi=msg.mwi={};}
if(storeType==PDU_MWI_STORE_TYPE_STORE){
 mwi.discard=false;}else if(mwi.discard===undefined){
 mwi.discard=true;}
mwi.msgCount=msgCount&0xff;mwi.active=mwi.msgCount>0;if(DEBUG){this.context.debug("MWI in TP_UDH received: "+JSON.stringify(mwi));}
break;default:if(DEBUG){this.context.debug("readUserDataHeader: unsupported IEI("+
id+"), "+
length+" bytes.");} 
if(length){let octets;if(DEBUG){octets=new Uint8Array(length);}
for(let i=0;i<length;i++){let octet=this.readHexOctet();if(DEBUG){octets[i]=octet;}}
dataAvailable-=length;if(DEBUG){this.context.debug("readUserDataHeader: "+Array.slice(octets));}}
break;}}
if(dataAvailable!==0){throw new Error("Illegal user data header found!");}
msg.header=header;},writeUserDataHeader(options){this.writeHexOctet(options.userDataHeaderLength);if(options.segmentMaxSeq>1){if(options.segmentRef16Bit){this.writeHexOctet(PDU_IEI_CONCATENATED_SHORT_MESSAGES_16BIT);this.writeHexOctet(4);this.writeHexOctet((options.segmentRef>>8)&0xff);}else{this.writeHexOctet(PDU_IEI_CONCATENATED_SHORT_MESSAGES_8BIT);this.writeHexOctet(3);}
this.writeHexOctet(options.segmentRef&0xff);this.writeHexOctet(options.segmentMaxSeq&0xff);this.writeHexOctet(options.segmentSeq&0xff);}
if(options.dcs==PDU_DCS_MSG_CODING_7BITS_ALPHABET){if(options.langIndex!=PDU_NL_IDENTIFIER_DEFAULT){this.writeHexOctet(PDU_IEI_NATIONAL_LANGUAGE_LOCKING_SHIFT);this.writeHexOctet(1);this.writeHexOctet(options.langIndex);}
if(options.langShiftIndex!=PDU_NL_IDENTIFIER_DEFAULT){this.writeHexOctet(PDU_IEI_NATIONAL_LANGUAGE_SINGLE_SHIFT);this.writeHexOctet(1);this.writeHexOctet(options.langShiftIndex);}}},readAddress(len){ if(!len||len<0){if(DEBUG){this.context.debug("PDU error: invalid sender address length: "+len);}
return null;}
if(len%2==1){len+=1;}
if(DEBUG){this.context.debug("PDU: Going to read address: "+len);} 
let toa=this.readHexOctet();let addr="";if((toa&0xf0)==PDU_TOA_ALPHANUMERIC){addr=this.readSeptetsToString(Math.floor((len*4)/7),0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);return addr;}
addr=this.readSwappedNibbleExtendedBcdString(len/2);if(addr.length<=0){if(DEBUG){this.context.debug("PDU error: no number provided");}
return null;}
if((toa&0xf0)==PDU_TOA_INTERNATIONAL){addr="+"+addr;}
return addr;},readProtocolIndicator(msg){
msg.pid=this.readHexOctet();msg.epid=msg.pid;switch(msg.epid&0xc0){case 0x40: switch(msg.epid){case PDU_PID_SHORT_MESSAGE_TYPE_0:case PDU_PID_ANSI_136_R_DATA:case PDU_PID_USIM_DATA_DOWNLOAD:return;}
break;}
msg.epid=PDU_PID_DEFAULT;},readDataCodingScheme(msg){let dcs=this.readHexOctet();if(DEBUG){this.context.debug("PDU: read SMS dcs: "+dcs);}
let messageClass=PDU_DCS_MSG_CLASS_NORMAL;let encoding=PDU_DCS_MSG_CODING_7BITS_ALPHABET;switch(dcs&PDU_DCS_CODING_GROUP_BITS){case 0x40: case 0x50:case 0x60:case 0x70: case 0x00: case 0x10:case 0x20:case 0x30:if(dcs&0x10){messageClass=dcs&PDU_DCS_MSG_CLASS_BITS;}
switch(dcs&0x0c){case 0x4:encoding=PDU_DCS_MSG_CODING_8BITS_ALPHABET;break;case 0x8:encoding=PDU_DCS_MSG_CODING_16BITS_ALPHABET;break;}
break;case 0xe0: encoding=PDU_DCS_MSG_CODING_16BITS_ALPHABET;
case 0xc0: case 0xd0:
 let active=(dcs&PDU_DCS_MWI_ACTIVE_BITS)==PDU_DCS_MWI_ACTIVE_VALUE; switch(dcs&PDU_DCS_MWI_TYPE_BITS){case PDU_DCS_MWI_TYPE_VOICEMAIL:let mwi=msg.mwi;if(!mwi){mwi=msg.mwi={};}
mwi.active=active;mwi.discard=(dcs&PDU_DCS_CODING_GROUP_BITS)==0xc0;mwi.msgCount=active?GECKO_VOICEMAIL_MESSAGE_COUNT_UNKNOWN:0;if(DEBUG){this.context.debug("MWI in DCS received for voicemail: "+JSON.stringify(mwi));}
break;case PDU_DCS_MWI_TYPE_FAX:if(DEBUG){this.context.debug("MWI in DCS received for fax");}
break;case PDU_DCS_MWI_TYPE_EMAIL:if(DEBUG){this.context.debug("MWI in DCS received for email");}
break;default:if(DEBUG){this.context.debug('MWI in DCS received for "other"');}
break;}
break;case 0xf0: if(dcs&0x04){encoding=PDU_DCS_MSG_CODING_8BITS_ALPHABET;}
messageClass=dcs&PDU_DCS_MSG_CLASS_BITS;break;default:break;}
msg.dcs=dcs;msg.encoding=encoding;msg.messageClass=GECKO_SMS_MESSAGE_CLASSES[messageClass];if(DEBUG){this.context.debug("PDU: message encoding is "+encoding+" bit.");}},readTimestamp(){let year=this.readSwappedNibbleBcdNum(1)+PDU_TIMESTAMP_YEAR_OFFSET;let month=this.readSwappedNibbleBcdNum(1)-1;let day=this.readSwappedNibbleBcdNum(1);let hour=this.readSwappedNibbleBcdNum(1);let minute=this.readSwappedNibbleBcdNum(1);let second=this.readSwappedNibbleBcdNum(1);let timestamp=Date.UTC(year,month,day,hour,minute,second);

 let tzOctet=this.readHexOctet();let tzOffset=this.octetToBCD(tzOctet&~0x08)*15*60*1000;tzOffset=tzOctet&0x08?-tzOffset:tzOffset;timestamp-=tzOffset;return timestamp;},writeTimestamp(date){this.writeSwappedNibbleBCDNum(date.getFullYear()-PDU_TIMESTAMP_YEAR_OFFSET);this.writeSwappedNibbleBCDNum(date.getMonth()+1);this.writeSwappedNibbleBCDNum(date.getDate());this.writeSwappedNibbleBCDNum(date.getHours());this.writeSwappedNibbleBCDNum(date.getMinutes());this.writeSwappedNibbleBCDNum(date.getSeconds());
let zone=date.getTimezoneOffset()/15;let octet=this.BCDToOctet(zone); if(zone>0){octet=octet|0x08;}
this.writeHexOctet(octet);},readUserData(msg,length){if(DEBUG){this.context.debug("Reading "+length+" bytes of user data.");}
let paddingBits=0;if(msg.udhi){this.readUserDataHeader(msg);if(msg.encoding==PDU_DCS_MSG_CODING_7BITS_ALPHABET){let headerBits=(msg.header.length+1)*8;let headerSeptets=Math.ceil(headerBits/7);length-=headerSeptets;paddingBits=headerSeptets*7-headerBits;}else{length-=msg.header.length+1;}}
if(DEBUG){this.context.debug("After header, "+length+" septets left of user data");}
msg.body=null;msg.data=null;if(length<=0){return;}
switch(msg.encoding){case PDU_DCS_MSG_CODING_7BITS_ALPHABET:
if(length>PDU_MAX_USER_DATA_7BIT){if(DEBUG){this.context.debug("PDU error: user data is too long: "+length);}
break;}
let langIndex=msg.udhi?msg.header.langIndex:PDU_NL_IDENTIFIER_DEFAULT;let langShiftIndex=msg.udhi?msg.header.langShiftIndex:PDU_NL_IDENTIFIER_DEFAULT;msg.body=this.readSeptetsToString(length,paddingBits,langIndex,langShiftIndex);break;case PDU_DCS_MSG_CODING_8BITS_ALPHABET:msg.data=this.readHexOctetArray(length);break;case PDU_DCS_MSG_CODING_16BITS_ALPHABET:msg.body=this.readUCS2String(length);break;}},readExtraParams(msg){

if(this.getReadAvailable()<=4){return;} 
let pi;do{


 pi=this.readHexOctet();}while(pi&PDU_PI_EXTENSION);

 msg.dcs=0;msg.encoding=PDU_DCS_MSG_CODING_7BITS_ALPHABET; if(pi&PDU_PI_PROTOCOL_IDENTIFIER){this.readProtocolIndicator(msg);} 
if(pi&PDU_PI_DATA_CODING_SCHEME){this.readDataCodingScheme(msg);} 
if(pi&PDU_PI_USER_DATA_LENGTH){let userDataLength=this.readHexOctet();this.readUserData(msg,userDataLength);}},readMessage(){let msg={

 SMSC:null, mti:null, udhi:null, sender:null, recipient:null, pid:null, epid:null, dcs:null, mwi:null, replace:false, header:null, body:null, data:null, sentTimestamp:null, status:null, scts:null, dt:null,}; let smscLength=this.readHexOctet();if(smscLength>0){let smscTypeOfAddress=this.readHexOctet();msg.SMSC=this.readSwappedNibbleExtendedBcdString(smscLength-1);if(smscTypeOfAddress>>4==PDU_TOA_INTERNATIONAL>>4){msg.SMSC="+"+msg.SMSC;}} 
let firstOctet=this.readHexOctet(); msg.mti=firstOctet&0x03; msg.udhi=firstOctet&PDU_UDHI;switch(msg.mti){case PDU_MTI_SMS_RESERVED:

 case PDU_MTI_SMS_DELIVER:return this.readDeliverMessage(msg);case PDU_MTI_SMS_STATUS_REPORT:return this.readStatusReportMessage(msg);default:return null;}},processReceivedSms(length){if(!length){if(DEBUG){this.context.debug("Received empty SMS!");}
return[null,PDU_FCS_UNSPECIFIED];}

let messageStringLength=length;if(DEBUG){this.context.debug("Got new SMS, length "+messageStringLength);}
let message=this.readMessage();if(DEBUG){this.context.debug("Got new SMS: "+JSON.stringify(message));} 
if(!message){return[null,PDU_FCS_UNSPECIFIED];}
if(message.epid==PDU_PID_SHORT_MESSAGE_TYPE_0){

 return[null,PDU_FCS_OK];}
if(message.messageClass==GECKO_SMS_MESSAGE_CLASSES[PDU_DCS_MSG_CLASS_2]){let RIL=this.context.RIL;switch(message.epid){case PDU_PID_ANSI_136_R_DATA:case PDU_PID_USIM_DATA_DOWNLOAD:let ICCUtilsHelper=this.context.ICCUtilsHelper;if(ICCUtilsHelper.isICCServiceAvailable("DATA_DOWNLOAD_SMS_PP")){


 RIL.dataDownloadViaSMSPP(message);
 return[null,PDU_FCS_RESERVED];}



default:RIL.writeSmsToSIM(message);break;}} 
if(message.messageClass!=GECKO_SMS_MESSAGE_CLASSES[PDU_DCS_MSG_CLASS_0]&&!true){


if(message.messageClass==GECKO_SMS_MESSAGE_CLASSES[PDU_DCS_MSG_CLASS_2]){
return[null,PDU_FCS_MEMORY_CAPACITY_EXCEEDED];}
return[null,PDU_FCS_UNSPECIFIED];}
return[message,PDU_FCS_OK];},readDeliverMessage(msg){let senderAddressLength=this.readHexOctet();msg.sender=this.readAddress(senderAddressLength);this.readProtocolIndicator(msg);this.readDataCodingScheme(msg);msg.sentTimestamp=this.readTimestamp();let userDataLength=this.readHexOctet();if(userDataLength>0){this.readUserData(msg,userDataLength);}
return msg;},readStatusReportMessage(msg){ msg.messageRef=this.readHexOctet(); let recipientAddressLength=this.readHexOctet();msg.recipient=this.readAddress(recipientAddressLength); msg.scts=this.readTimestamp(); msg.dt=this.readTimestamp(); msg.status=this.readHexOctet();this.readExtraParams(msg);return msg;},writeMessage(options){if(DEBUG){this.context.debug("writeMessage: "+JSON.stringify(options));}
let address=options.number;let body=options.body;let dcs=options.dcs;let userDataHeaderLength=options.userDataHeaderLength;let encodedBodyLength=options.encodedBodyLength;let langIndex=options.langIndex;let langShiftIndex=options.langShiftIndex;






 let addressFormat=PDU_TOA_ISDN; if(address[0]=="+"){addressFormat=PDU_TOA_INTERNATIONAL|PDU_TOA_ISDN; address=address.substring(1);} 
let validity=0;let headerOctets=userDataHeaderLength?userDataHeaderLength+1:0;let paddingBits;let userDataLengthInSeptets;let userDataLengthInOctets;if(dcs==PDU_DCS_MSG_CODING_7BITS_ALPHABET){let headerSeptets=Math.ceil((headerOctets*8)/7);userDataLengthInSeptets=headerSeptets+encodedBodyLength;userDataLengthInOctets=Math.ceil((userDataLengthInSeptets*7)/8);paddingBits=headerSeptets*7-headerOctets*8;}else{userDataLengthInOctets=headerOctets+encodedBodyLength;paddingBits=0;}
let pduOctetLength=4+ Math.ceil(address.length/2)+
3+ userDataLengthInOctets;if(validity){}














 
let firstOctet=PDU_MTI_SMS_SUBMIT; if(options.requestStatusReport){firstOctet|=PDU_SRI_SRR;} 
if(validity){} 
if(headerOctets){firstOctet|=PDU_UDHI;}
this.writeHexOctet(firstOctet); this.writeHexOctet(0x00);this.writeHexOctet(address.length);this.writeHexOctet(addressFormat);this.writeSwappedNibbleBCD(address);this.writeHexOctet(0x00); this.writeHexOctet(dcs);if(validity){this.writeHexOctet(validity);}
if(dcs==PDU_DCS_MSG_CODING_7BITS_ALPHABET){this.writeHexOctet(userDataLengthInSeptets);}else{this.writeHexOctet(userDataLengthInOctets);}
if(headerOctets){this.writeUserDataHeader(options);}
switch(dcs){case PDU_DCS_MSG_CODING_7BITS_ALPHABET:this.writeStringAsSeptets(body,paddingBits,langIndex,langShiftIndex);break;case PDU_DCS_MSG_CODING_8BITS_ALPHABET:break;case PDU_DCS_MSG_CODING_16BITS_ALPHABET:this.writeUCS2String(body);break;}},readCbSerialNumber(msg){msg.serial=(this.readHexOctet()<<8)|this.readHexOctet();msg.geographicalScope=(msg.serial>>>14)&0x03;msg.messageCode=(msg.serial>>>4)&0x03ff;msg.updateNumber=msg.serial&0x0f;},readCbMessageIdentifier(msg){msg.messageId=(this.readHexOctet()<<8)|this.readHexOctet();if(DEBUG){this.context.debug("readCbMessageIdentifier messageId: "+msg.messageId);}},readCbEtwsInfo(msg){if(msg.format!=CB_FORMAT_ETWS&&this.isEtwsMessage(msg)){

msg.etws={emergencyUserAlert:!!(msg.messageCode&0x0200),popup:!!(msg.messageCode&0x0100),};let warningType=msg.messageId-CB_GSM_MESSAGEID_ETWS_BEGIN;if(warningType<CB_ETWS_WARNING_TYPE_NAMES.length){msg.etws.warningType=warningType;}}},readCbDataCodingScheme(msg){let dcs=this.readHexOctet();if(DEBUG){this.context.debug("PDU: read CBS dcs: "+dcs);}
let language=null,hasLanguageIndicator=false;
let encoding=PDU_DCS_MSG_CODING_7BITS_ALPHABET;let messageClass=PDU_DCS_MSG_CLASS_NORMAL;switch(dcs&PDU_DCS_CODING_GROUP_BITS){case 0x00: language=CB_DCS_LANG_GROUP_1[dcs&0x0f];break;case 0x10: switch(dcs&0x0f){case 0x00:hasLanguageIndicator=true;break;case 0x01:encoding=PDU_DCS_MSG_CODING_16BITS_ALPHABET;hasLanguageIndicator=true;break;}
break;case 0x20: language=CB_DCS_LANG_GROUP_2[dcs&0x0f];break;case 0x40: case 0x50:
 case 0x90: encoding=dcs&0x0c;if(encoding==0x0c){encoding=PDU_DCS_MSG_CODING_7BITS_ALPHABET;}
messageClass=dcs&PDU_DCS_MSG_CLASS_BITS;break;case 0xf0:encoding=dcs&0x04?PDU_DCS_MSG_CODING_8BITS_ALPHABET:PDU_DCS_MSG_CODING_7BITS_ALPHABET;switch(dcs&PDU_DCS_MSG_CLASS_BITS){case 0x01:messageClass=PDU_DCS_MSG_CLASS_USER_1;break;case 0x02:messageClass=PDU_DCS_MSG_CLASS_USER_2;break;case 0x03:messageClass=PDU_DCS_MSG_CLASS_3;break;}
break;case 0x30:case 0x80:case 0xa0:case 0xb0:case 0xc0:break;default:throw new Error("Unsupported CBS data coding scheme: "+dcs);}
msg.dcs=dcs;msg.encoding=encoding;msg.language=language;msg.messageClass=GECKO_SMS_MESSAGE_CLASSES[messageClass];msg.hasLanguageIndicator=hasLanguageIndicator;},readCbPageParameter(msg){let octet=this.readHexOctet();msg.pageIndex=(octet>>>4)&0x0f;msg.numPages=octet&0x0f;if(!msg.pageIndex||!msg.numPages){

msg.pageIndex=msg.numPages=1;}},readCbWarningType(msg){let word=(this.readHexOctet()<<8)|this.readHexOctet();msg.etws={warningType:(word>>>9)&0x7f,popup:!!(word&0x80),emergencyUserAlert:!!(word&0x100),};},readGsmCbData(msg,length){let bufAdapter={context:this.context,readHexOctet(){return(this.context.GsmPDUHelper.readHexNibble()<<4)|this.context.GsmPDUHelper.readHexNibble();},};msg.body=null;msg.data=null;switch(msg.encoding){case PDU_DCS_MSG_CODING_7BITS_ALPHABET:msg.body=this.readSeptetsToString.call(bufAdapter,Math.floor((length*8)/7),0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);if(msg.hasLanguageIndicator){msg.language=msg.body.substring(0,2);msg.body=msg.body.substring(3);}
break;case PDU_DCS_MSG_CODING_8BITS_ALPHABET:msg.data=this.readHexOctetArray(length);break;case PDU_DCS_MSG_CODING_16BITS_ALPHABET:if(msg.hasLanguageIndicator){msg.language=this.readSeptetsToString.call(bufAdapter,2,0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);length-=2;}
msg.body=this.readUCS2String.call(bufAdapter,length);break;}
if(msg.data||!msg.body){return;}



for(let i=msg.body.length-1;i>=0;i--){if(msg.body.charAt(i)!=="\r"){msg.body=msg.body.substring(0,i+1);break;}}},readWacData(msg){let waePduLength=this.getReadAvailable(); let readWACLatLng=()=>{ let wacLat=(this.readHexOctet()<<14)|(this.readHexOctet()<<6);let thirdByte=this.readHexOctet();wacLat=wacLat|(thirdByte>>2);let wacLng=((thirdByte&0x03)<<20)|(this.readHexOctet()<<12)|(this.readHexOctet()<<4)|this.readHexNibble();if(DEBUG){this.context.debug("readWACLatLng wacLng: "+wacLng+" wacLat: "+wacLat);}
 
return new LatLng((wacLat*180.0)/(1<<22)-90,(wacLng*360.0)/(1<<22)-180);};let wacDataLength=this.readHexOctet()|(this.readHexOctet()<<8);if(DEBUG){this.context.debug("readWacData wacDataLength: "+wacDataLength);}
if(DEBUG){this.context.debug("readWacData pdu: "+this.pdu);}
if(wacDataLength>this.getReadAvailable()/PDU_HEX_OCTET_SIZE){ this.seekIncoming(-2*PDU_HEX_OCTET_SIZE);throw"Invalid wac data";}else{let maxWaitTimeSec=GEO_FENCING_MAXIMUM_WAIT_TIME_NOT_SET;let remain=wacDataLength;let geo=[];while(remain>0){
 let geoType=this.readHexNibble();if(DEBUG){this.context.debug("readWacData geoType: "+geoType);}
let geoLength=(this.readHexNibble()<<6)|(this.readHexOctet()>>2);if(DEBUG){this.context.debug("readWacData geoLength: "+geoLength);}
remain=remain-geoLength;switch(geoType){case GEO_FENCING_MAXIMUM_WAIT_TIME:maxWaitTimeSec=this.readHexOctet();if(maxWaitTimeSec==255){maxWaitTimeSec=GEO_FENCING_MAXIMUM_WAIT_TIME_NOT_SET;}
if(DEBUG){this.context.debug("maxWaitTimeSec: "+maxWaitTimeSec);}
break;case GEO_FENCING_POLYGON:let latLngs=[]; let n=Math.floor(((geoLength-2)*8)/44);if(DEBUG){this.context.debug("readWacData n: "+n);}
for(let i=0;i<n;i++){latLngs.push(readWACLatLng());}
if(n%2){this.readHexNibble();}
geo.push(new Polygon(latLngs));break;case GEO_FENCING_CIRCLE:let center=readWACLatLng();

 let wacRadius=(this.readHexOctet()<<12)|(this.readHexOctet()<<4)|this.readHexNibble();let radius=((wacRadius*1.0)/(1<<6))*1000.0;geo.push(new Circle(center,radius));break;default:throw"Unsupported geoType "+geoType;break;}}
msg.geometries=geo;msg.maximumWaitingTimeSec=maxWaitTimeSec;if(DEBUG){this.context.debug("readWacData done msg: "+JSON.stringify(msg));} 
let remainPduLength=this.getReadAvailable();this.seekIncoming(-1*(waePduLength-remainPduLength));}},readGeoFencingTriggerData(msg){ let type=this.readHexNibble();let length=this.readHexOctet()>>1; this.readHexNibble();let messageIdentifierCount=((length-2)*8)/32;var cbIdentifiers=[];for(let i=0;i<messageIdentifierCount;i++){ let cellBroadcastIdentity={};cellBroadcastIdentity.messageIdentifier=(this.readHexOctet()<<8)|this.readHexOctet();cellBroadcastIdentity.serialNumber=(this.readHexOctet()<<8)|this.readHexOctet();cbIdentifiers.push(cellBroadcastIdentity);}
msg.geoFencingTrigger={type,cbIdentifiers};},readUmtsCbData(msg){if(DEBUG){this.context.debug("readUmtsCbData msg: "+JSON.stringify(msg));}
let numOfPages=this.readHexOctet();if(DEBUG){this.context.debug("readUmtsCbData numOfPages: "+numOfPages);}
if(numOfPages<0||numOfPages>15){throw new Error("Invalid numOfPages: "+numOfPages);}
if(this.isCMASGeoFencingTriggerMessage(msg)){this.readGeoFencingTriggerData(msg);return;}
let bufAdapter={context:this.context,readHexOctet(){return(this.context.GsmPDUHelper.readHexNibble()<<4)|this.context.GsmPDUHelper.readHexNibble();},};let removePaddingCharactors=function(text){for(let i=text.length-1;i>=0;i--){if(text.charAt(i)!=="\r"){return text.substring(0,i+1);}}
return text;};let totalLength=0,length,pageLengths=[];for(let i=0;i<numOfPages;i++){this.seekIncoming(CB_MSG_PAGE_INFO_SIZE*PDU_HEX_OCTET_SIZE);length=this.readHexOctet();if(DEBUG){this.context.debug("readUmtsCbData page length: "+length);}
totalLength+=length;pageLengths.push(length);}
this.seekIncoming(-numOfPages*(CB_MSG_PAGE_INFO_SIZE+1)*PDU_HEX_OCTET_SIZE);switch(msg.encoding){case PDU_DCS_MSG_CODING_7BITS_ALPHABET:{let body;msg.body="";for(let i=0;i<numOfPages;i++){body=this.readSeptetsToString.call(bufAdapter,Math.floor((pageLengths[i]*8)/7),0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);if(msg.hasLanguageIndicator){if(!msg.language){msg.language=body.substring(0,2);}
body=body.substring(3);}
msg.body+=removePaddingCharactors(body); this.seekIncoming((CB_MSG_PAGE_INFO_SIZE-pageLengths[i])*PDU_HEX_OCTET_SIZE); this.readHexOctet();}
break;}
case PDU_DCS_MSG_CODING_8BITS_ALPHABET:{msg.data=new Uint8Array(totalLength);for(let i=0,j=0;i<numOfPages;i++){for(let pageLength=pageLengths[i];pageLength>0;pageLength--){msg.data[j++]=this.readHexOctet();} 
this.seekIncoming((CB_MSG_PAGE_INFO_SIZE-pageLengths[i])*PDU_HEX_OCTET_SIZE); this.readHexOctet();}
break;}
case PDU_DCS_MSG_CODING_16BITS_ALPHABET:{msg.body="";for(let i=0;i<numOfPages;i++){let pageLength=pageLengths[i];if(msg.hasLanguageIndicator){if(!msg.language){msg.language=this.readSeptetsToString.call(bufAdapter,2,0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);}else{this.readHexOctet();this.readHexOctet();}
pageLength-=2;}
msg.body+=removePaddingCharactors(this.readUCS2String.call(bufAdapter,pageLength)); this.seekIncoming((CB_MSG_PAGE_INFO_SIZE-pageLengths[i])*PDU_HEX_OCTET_SIZE); this.readHexOctet();}
break;}}
let waePduLength=this.getReadAvailable(); if(waePduLength>0){this.readWacData(msg);}},readCbMessage(pduLength){ let msg={serial:null, updateNumber:null, format:null, dcs:0x0f, encoding:PDU_DCS_MSG_CODING_7BITS_ALPHABET, hasLanguageIndicator:false, data:null, body:null, pageIndex:1, numPages:1,
geographicalScope:null, messageCode:null, messageId:null, language:null, fullBody:null, fullData:null, messageClass:GECKO_SMS_MESSAGE_CLASSES[PDU_DCS_MSG_CLASS_NORMAL], etws:null,geometries:null, maximumWaitingTimeSec:null, geoFencingTrigger:null, };if(pduLength<CB_MESSAGE_HEADER_SIZE){throw new Error("Invalid PDU Length: "+pduLength);}
if(pduLength<=CB_MESSAGE_SIZE_GSM){this.readCbSerialNumber(msg);this.readCbMessageIdentifier(msg);if(this.isEtwsMessage(msg)&&pduLength<=CB_MESSAGE_SIZE_ETWS){msg.format=CB_FORMAT_ETWS;return this.readEtwsCbMessage(msg);}
msg.format=CB_FORMAT_GSM;return this.readGsmCbMessage(msg,pduLength);}
if(pduLength>=CB_MESSAGE_SIZE_UMTS_MIN&&pduLength<=CB_MESSAGE_SIZE_UMTS_MAX){msg.format=CB_FORMAT_UMTS;return this.readUmtsCbMessage(msg);}
throw new Error("Invalid PDU Length: "+pduLength);},isEtwsMessage(msg){return(msg.messageId>=CB_GSM_MESSAGEID_ETWS_BEGIN&&msg.messageId<=CB_GSM_MESSAGEID_ETWS_END);},isCMASGeoFencingTriggerMessage(msg){return msg.messageId===CB_CMAS_MESSAGEID_GEO_FENCING_TRIGGER;},readUmtsCbMessage(msg){let type=this.readHexOctet();if(type!=CB_UMTS_MESSAGE_TYPE_CBS){throw new Error("Unsupported UMTS Cell Broadcast message type: "+type);}
this.readCbMessageIdentifier(msg);this.readCbSerialNumber(msg);this.readCbEtwsInfo(msg);this.readCbDataCodingScheme(msg);this.readUmtsCbData(msg);return msg;},readGsmCbMessage(msg,pduLength){this.readCbEtwsInfo(msg);this.readCbDataCodingScheme(msg);this.readCbPageParameter(msg);this.readGsmCbData(msg,pduLength-6);return msg;},readEtwsCbMessage(msg){this.readCbWarningType(msg);

return msg;},readNetworkName(value,len){
let GsmPDUHelper=this.context.GsmPDUHelper;let codingInfo=GsmPDUHelper.processHexToInt(value.slice(0,2),16);if(!(codingInfo&0x80)){return null;}
let textEncoding=(codingInfo&0x70)>>4;let shouldIncludeCountryInitials=!!(codingInfo&0x08);let spareBits=codingInfo&0x07;let resultString;let nameValue=value.slice(2);switch(textEncoding){case 0:this.initWith(nameValue);resultString=this.readSeptetsToString(Math.floor(((len-1)*8-spareBits)/7),0,PDU_NL_IDENTIFIER_DEFAULT,PDU_NL_IDENTIFIER_DEFAULT);break;case 1:resultString=this.context.ICCPDUHelper.readAlphaIdentifier(nameValue,len-1);break;default:return null;}

return resultString;},};function ICCRecordHelperObject(aContext){this.context=aContext;this._freeRecordIds={};}
ICCRecordHelperObject.prototype={context:null,fetchICCRecords(){switch(this.context.RIL.appType){case CARD_APPTYPE_SIM:case CARD_APPTYPE_USIM:this.context.SimRecordHelper.fetchSimRecords();break;case CARD_APPTYPE_RUIM:break;}
this.context.ISimRecordHelper.fetchISimRecords();},readICCID(){function callback(options){let RIL=this.context.RIL;let GsmPDUHelper=this.context.GsmPDUHelper;let octetLen=options.simResponse.length/PDU_HEX_OCTET_SIZE;GsmPDUHelper.initWith(options.simResponse);RIL.iccInfo.iccid=GsmPDUHelper.readSwappedNibbleBcdString(octetLen,true);if(DEBUG){this.context.debug("ICCID: "+RIL.iccInfo.iccid);}
if(RIL.iccInfo.iccid){this.context.ICCUtilsHelper.handleICCInfoChange();this.context.RIL.sendWorkerMessage("reportStkServiceIsRunning",null,null);}}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_ICCID,callback:callback.bind(this),});},readRecordCount(fileId,onsuccess,onerror){let ICCIOHelper=this.context.ICCIOHelper;function callback(options){if(onsuccess){onsuccess(options.totalRecords);}}
ICCIOHelper.loadLinearFixedEF({fileId,callback:callback.bind(this),onerror,});},readADNLike(fileId,extFileId,onsuccess,onerror){let ICCIOHelper=this.context.ICCIOHelper;function callback(options){let loadNextContactRecord=()=>{if(options.p1<options.totalRecords){ICCIOHelper.loadNextRecord(options);return;}
if(DEBUG){for(let i=0;i<contacts.length;i++){this.context.debug("contact ["+i+"] "+JSON.stringify(contacts[i]));}}
if(onsuccess){onsuccess(contacts);}};let contact=this.context.ICCPDUHelper.readAlphaIdDiallingNumber(options);if(contact){let record={recordId:options.p1,alphaId:contact.alphaId,number:contact.number,};contacts.push(record);if(extFileId&&contact.extRecordNumber!=0xff){this.readExtension(extFileId,contact.extRecordNumber,number=>{if(number){record.number+=number;}
loadNextContactRecord();},()=>loadNextContactRecord());return;}}
loadNextContactRecord();}
let contacts=[];ICCIOHelper.loadLinearFixedEF({fileId,callback:callback.bind(this),onerror,});},updateADNLike(fileId,extRecordNumber,contact,pin2,onsuccess,onerror){let updatedContact;function dataWriter(recordSize){updatedContact=this.context.ICCPDUHelper.writeAlphaIdDiallingNumber(recordSize,contact.alphaId,contact.number,extRecordNumber);}
function callback(options){if(onsuccess){onsuccess(updatedContact);}}
if(!contact||!contact.recordId){if(onerror){onerror(GECKO_ERROR_INVALID_ARGUMENTS);}
return;}
this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber:contact.recordId,dataWriter:dataWriter.bind(this),pin2,callback:callback.bind(this),onerror,});},readPBR(onsuccess,onerror){let GsmPDUHelper=this.context.GsmPDUHelper;let ICCIOHelper=this.context.ICCIOHelper;let ICCUtilsHelper=this.context.ICCUtilsHelper;let RIL=this.context.RIL;function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE,readLen=0;GsmPDUHelper.initWith(value);let pbrTlvs=[];while(readLen<octetLen){let tag=GsmPDUHelper.readHexOctet();if(tag==0xff){readLen++;GsmPDUHelper.seekIncoming((octetLen-readLen)*PDU_HEX_OCTET_SIZE);break;}
let tlvLen=GsmPDUHelper.readHexOctet();let tlvs=ICCUtilsHelper.decodeSimTlvs(tlvLen);pbrTlvs.push({tag,length:tlvLen,value:tlvs});readLen+=tlvLen+2;}
if(pbrTlvs.length>0){let pbr=ICCUtilsHelper.parsePbrTlvs(pbrTlvs);if(!pbr.adn){if(onerror){onerror("Cannot access ADN.");}
return;}
pbrs.push(pbr);}
if(options.p1<options.totalRecords){ICCIOHelper.loadNextRecord(options);}else if(onsuccess){RIL.iccInfoPrivate.pbrs=pbrs;onsuccess(pbrs);}}
if(RIL.iccInfoPrivate.pbrs){onsuccess(RIL.iccInfoPrivate.pbrs);return;}
let pbrs=[];ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_PBR,callback:callback.bind(this),onerror,});},_iapRecordSize:null,readIAP(fileId,recordNumber,onsuccess,onerror){function callback(options){let GsmPDUHelper=this.context.GsmPDUHelper;let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;GsmPDUHelper.initWith(value);this._iapRecordSize=options.recordSize;let iap=this.context.GsmPDUHelper.readHexOctetArray(octetLen);if(onsuccess){onsuccess(iap);}}
this.context.ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,recordSize:this._iapRecordSize,callback:callback.bind(this),onerror,});},updateIAP(fileId,recordNumber,iap,onsuccess,onerror){let dataWriter=function dataWriter(recordSize){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(iap);}.bind(this);this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber,dataWriter,callback:onsuccess,onerror,});},_emailRecordSize:null,readEmail(fileId,fileType,recordNumber,onsuccess,onerror){function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;let ICCPDUHelper=this.context.ICCPDUHelper;let email=null;this._emailRecordSize=options.recordSize;





if(fileType==ICC_USIM_TYPE1_TAG){email=ICCPDUHelper.read8BitUnpackedToString(value,octetLen);}else{email=ICCPDUHelper.read8BitUnpackedToString(value,octetLen-2);}
if(onsuccess){onsuccess(email);}}
this.context.ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,recordSize:this._emailRecordSize,callback:callback.bind(this),onerror,});},updateEmail(pbr,recordNumber,email,adnRecordId,onsuccess,onerror){let fileId=pbr[USIM_PBR_EMAIL].fileId;let fileType=pbr[USIM_PBR_EMAIL].fileType;let writtenEmail;let dataWriter=function dataWriter(recordSize){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith();let ICCPDUHelper=this.context.ICCPDUHelper;if(fileType==ICC_USIM_TYPE1_TAG){writtenEmail=ICCPDUHelper.writeStringTo8BitUnpacked(recordSize,email);}else{writtenEmail=ICCPDUHelper.writeStringTo8BitUnpacked(recordSize-2,email);GsmPDUHelper.writeHexOctet(pbr.adn.sfi||0xff);GsmPDUHelper.writeHexOctet(adnRecordId);}}.bind(this);let callback=options=>{if(onsuccess){onsuccess(writtenEmail);}};this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber,dataWriter,callback,onerror,});},_anrRecordSize:null,readANR(fileId,fileType,recordNumber,onsuccess,onerror){function callback(options){let value=options.simResponse;let GsmPDUHelper=this.context.GsmPDUHelper;this._anrRecordSize=options.recordSize;GsmPDUHelper.initWith(value);GsmPDUHelper.seekIncoming(1*PDU_HEX_OCTET_SIZE);let number=null;number=this.context.ICCPDUHelper.readNumberWithLength();if(onsuccess){onsuccess(number);}}
this.context.ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,recordSize:this._anrRecordSize,callback:callback.bind(this),onerror,});},updateANR(pbr,recordNumber,number,adnRecordId,onsuccess,onerror){let fileId=pbr[USIM_PBR_ANR0].fileId;let fileType=pbr[USIM_PBR_ANR0].fileType;let writtenNumber;let dataWriter=function dataWriter(recordSize){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith();GsmPDUHelper.writeHexOctet(0xff);writtenNumber=this.context.ICCPDUHelper.writeNumberWithLength(number);GsmPDUHelper.writeHexOctet(0xff);GsmPDUHelper.writeHexOctet(0xff);if(fileType==ICC_USIM_TYPE2_TAG){GsmPDUHelper.writeHexOctet(pbr.adn.sfi||0xff);GsmPDUHelper.writeHexOctet(adnRecordId);}}.bind(this);let callback=options=>{if(onsuccess){onsuccess(writtenNumber);}};this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber,dataWriter,callback,onerror,});},_freeRecordIds:null,findFreeRecordId(fileId,onsuccess,onerror){let ICCIOHelper=this.context.ICCIOHelper;function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let readLen=0;while(readLen<octetLen){let octet=GsmPDUHelper.readHexOctet();readLen++;if(octet!=0xff){break;}}
let nextRecord=(options.p1%options.totalRecords)+1;if(readLen==octetLen){if(DEBUG){this.context.debug("findFreeRecordId free record found: "+options.p1);}
this._freeRecordIds[fileId]=nextRecord;if(onsuccess){onsuccess(options.p1);}
return;}
GsmPDUHelper.seekIncoming((octetLen-readLen)*PDU_HEX_OCTET_SIZE);if(nextRecord!==recordNumber){options.p1=nextRecord;this.context.RIL.sendWorkerMessage("iccIO",options,null);}else{delete this._freeRecordIds[fileId];if(DEBUG){this.context.debug(CONTACT_ERR_NO_FREE_RECORD_FOUND);}
onerror(CONTACT_ERR_NO_FREE_RECORD_FOUND);}}
let recordNumber=this._freeRecordIds[fileId]||1;ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,callback:callback.bind(this),onerror,});},readExtension(fileId,recordNumber,onsuccess,onerror){let callback=options=>{let value=options.simResponse;let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let recordType=this.context.GsmPDUHelper.readHexOctet();let number="";
 if(recordType&0x02){let numLen=this.context.GsmPDUHelper.readHexOctet();if(numLen!=0xff){if(numLen>EXT_MAX_BCD_NUMBER_BYTES){if(DEBUG){this.context.debug("Error: invalid length of BCD number/SSC contents - "+numLen);}
onerror();return;}
number=this.context.GsmPDUHelper.readSwappedNibbleExtendedBcdString(numLen);if(DEBUG){this.context.debug("Contact Extension Number: "+number);}
GsmPDUHelper.seekIncoming((EXT_MAX_BCD_NUMBER_BYTES-numLen)*PDU_HEX_OCTET_SIZE);}else{GsmPDUHelper.seekIncoming(EXT_MAX_BCD_NUMBER_BYTES*PDU_HEX_OCTET_SIZE);}}else{
}
onsuccess(number);};this.context.ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,callback,onerror,});},updateExtension(fileId,recordNumber,number,onsuccess,onerror){let dataWriter=recordSize=>{let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith();if(number.length>EXT_MAX_NUMBER_DIGITS){number=number.substring(0,EXT_MAX_NUMBER_DIGITS);}
let numLen=Math.ceil(number.length/2); GsmPDUHelper.writeHexOctet(0x02);GsmPDUHelper.writeHexOctet(numLen);GsmPDUHelper.writeSwappedNibbleBCD(number);for(let i=0;i<EXT_MAX_BCD_NUMBER_BYTES-numLen;i++){GsmPDUHelper.writeHexOctet(0xff);}
GsmPDUHelper.writeHexOctet(0xff);};this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber,dataWriter,callback:onsuccess,onerror,});},cleanEFRecord(fileId,recordNumber,onsuccess,onerror){let dataWriter=recordSize=>{let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(); for(let i=0;i<recordSize;i++){GsmPDUHelper.writeHexOctet(0xff);}};this.context.ICCIOHelper.updateLinearFixedEF({fileId,recordNumber,dataWriter,callback:onsuccess,onerror,});},getADNLikeExtensionRecordNumber(fileId,recordNumber,onsuccess,onerror){let callback=options=>{let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(options.simResponse);GsmPDUHelper.seekIncoming((options.recordSize-1)*PDU_HEX_OCTET_SIZE);let extRecordNumber=this.context.GsmPDUHelper.readHexOctet();onsuccess(extRecordNumber);};this.context.ICCIOHelper.loadLinearFixedEF({fileId,recordNumber,callback,onerror,});},};function SimRecordHelperObject(aContext){this.context=aContext;}
SimRecordHelperObject.prototype={context:null,aid:null,setAid(aid){if(DEBUG){this.context.debug("USIM aid : "+aid);}
this.aid=aid;},fetchSimRecords(){this.context.RIL.sendWorkerMessage("getIMSI",{aid:this.aid,},null);this.context.ICCRecordHelper.readICCID();this.readAD();

this.readCphsONS();



this.readCphsInfo(()=>this.readSST(),aErrorMsg=>{this.context.debug("Failed to read CPHS_INFO: "+aErrorMsg);this.readSST();});},handleFileUpdate(aEfId){ let ICCUtilsHelper=this.context.ICCUtilsHelper;switch(aEfId){case ICC_EF_MSISDN:if(DEBUG)this.context.debug("File refresh for EF_MSISDN.");if(ICCUtilsHelper.isICCServiceAvailable("MSISDN")){if(DEBUG){this.context.debug("MSISDN: MSISDN is available");}
this.readMSISDN();}else if(DEBUG){this.context.debug("MSISDN: MSISDN service is not available");}
break;case ICC_EF_AD:if(DEBUG)this.context.debug("File refresh for EF_AD.");this.readAD();break;case ICC_EF_MBDN:if(DEBUG)this.context.debug("File refresh for EF_MBDN.");if(ICCUtilsHelper.isICCServiceAvailable("MDN")){if(DEBUG){this.context.debug("MDN: MDN available.");}
this.readMBDN();}else{if(DEBUG){this.context.debug("MDN: MDN service is not available");}
if(ICCUtilsHelper.isCphsServiceAvailable("MBN")){this.readCphsMBN();}else if(DEBUG){this.context.debug("CPHS_MBN: CPHS_MBN service is not available");}}
break;case ICC_EF_SPDI:if(DEBUG)this.context.debug("File refresh for EF_SPDI.");if(ICCUtilsHelper.isICCServiceAvailable("SPDI")){if(DEBUG){this.context.debug("SPDI: SPDI available.");}
this.readSPDI();}else if(DEBUG){this.context.debug("SPDI: SPDI service is not available");}
break;default:
if(DEBUG)this.context.debug("SIM Refresh for all.");this.fetchSimRecords();break;}},readSimPhase(){function callback(options){let value=options.simResponse;let GsmPDUHelper=this.context.GsmPDUHelper;let phase=GsmPDUHelper.processHexToInt(value.slice(0,2),16);
if(libcutils.property_get("ro.moz.ril.send_stk_profile_dl","false")&&phase>=ICC_PHASE_2_PROFILE_DOWNLOAD_REQUIRED){this.context.RIL.sendStkTerminalProfile(STK_SUPPORTED_TERMINAL_PROFILE);}}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_PHASE,aid:this.aid,callback:callback.bind(this),});},readMSISDN(){function callback(options){let RIL=this.context.RIL;let contact=this.context.ICCPDUHelper.readAlphaIdDiallingNumber(options);if(!contact||(RIL.iccInfo.msisdn!==undefined&&RIL.iccInfo.msisdn===contact.number)){return;}
RIL.iccInfo.msisdn=contact.number;if(DEBUG){this.context.debug("MSISDN: "+RIL.iccInfo.msisdn);}
this.context.ICCUtilsHelper.handleICCInfoChange();}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_MSISDN,aid:this.aid,callback:callback.bind(this),});},readAD(){function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;this.context.GsmPDUHelper.initWith(value);let ad=this.context.GsmPDUHelper.readHexOctetArray(octetLen);if(DEBUG){let str="";for(let i=0;i<ad.length;i++){str+=ad[i]+", ";}
this.context.debug("AD: "+str);}
let ICCUtilsHelper=this.context.ICCUtilsHelper;let RIL=this.context.RIL; let mncLength=0;if(ad&&ad[3]){mncLength=ad[3]&0x0f;if(mncLength!=0x02&&mncLength!=0x03){mncLength=0;}}
let mccMnc=ICCUtilsHelper.parseMccMncFromImsi(RIL.iccInfoPrivate.imsi,mncLength);if(mccMnc){RIL.iccInfo.mcc=mccMnc.mcc;RIL.iccInfo.mnc=mccMnc.mnc;ICCUtilsHelper.handleICCInfoChange();}}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_AD,aid:this.aid,callback:callback.bind(this),});},readSPN(){function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;let spnDisplayCondition=this.context.GsmPDUHelper.processHexToInt(value.slice(0,2),16);let spn_value=value.slice(2);let spn=this.context.ICCPDUHelper.readAlphaIdentifier(spn_value,octetLen-1);if(DEBUG){this.context.debug("SPN: spn = "+spn+", spnDisplayCondition = "+spnDisplayCondition);}
let RIL=this.context.RIL;RIL.iccInfoPrivate.spnDisplayCondition=spnDisplayCondition;RIL.iccInfo.spn=spn;let ICCUtilsHelper=this.context.ICCUtilsHelper;ICCUtilsHelper.updateDisplayCondition();ICCUtilsHelper.handleICCInfoChange();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_SPN,aid:this.aid,callback:callback.bind(this),});},readIMG(recordNumber,onsuccess,onerror){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let octetLen=value.length/PDU_HEX_OCTET_SIZE;let numInstances=GsmPDUHelper.readHexOctet();

if(octetLen<9*numInstances+1){GsmPDUHelper.seekIncoming((octetLen-1)*PDU_HEX_OCTET_SIZE);if(onerror){onerror();}
return;}
let imgDescriptors=[];for(let i=0;i<numInstances;i++){imgDescriptors[i]={width:GsmPDUHelper.readHexOctet(),height:GsmPDUHelper.readHexOctet(),codingScheme:GsmPDUHelper.readHexOctet(),fileId:(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet(),offset:(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet(),dataLen:(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet(),};}
GsmPDUHelper.seekIncoming((octetLen-9*numInstances-1)*PDU_HEX_OCTET_SIZE);let instances=[];let currentInstance=0;let readNextInstance=function(img){instances[currentInstance]=img;currentInstance++;if(currentInstance<numInstances){let imgDescriptor=imgDescriptors[currentInstance];this.readIIDF(imgDescriptor.fileId,imgDescriptor.offset,imgDescriptor.dataLen,imgDescriptor.codingScheme,readNextInstance,onerror);}else if(onsuccess){onsuccess(instances);}}.bind(this);this.readIIDF(imgDescriptors[0].fileId,imgDescriptors[0].offset,imgDescriptors[0].dataLen,imgDescriptors[0].codingScheme,readNextInstance,onerror);}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_IMG,aid:this.aid,recordNumber,callback:callback.bind(this),onerror,});},readIIDF(fileId,offset,dataLen,codingScheme,onsuccess,onerror){if(fileId>>8!=0x4f){if(onerror){onerror();}
return;}
function callback(options){let value=options.simResponse;let RIL=this.context.RIL;let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let octetLen=value.length/PDU_HEX_OCTET_SIZE;if(octetLen<offset+dataLen){
GsmPDUHelperseekIncoming(octetLen*PDU_HEX_OCTET_SIZE);if(onerror){onerror();}
return;}
GsmPDUHelper.seekIncoming(offset*PDU_HEX_OCTET_SIZE);let rawData={width:GsmPDUHelper.readHexOctet(),height:GsmPDUHelper.readHexOctet(),codingScheme,};switch(codingScheme){case ICC_IMG_CODING_SCHEME_BASIC:rawData.body=GsmPDUHelper.readHexOctetArray(dataLen-ICC_IMG_HEADER_SIZE_BASIC);GsmPDUHelper.seekIncoming((octetLen-offset-dataLen)*PDU_HEX_OCTET_SIZE);break;case ICC_IMG_CODING_SCHEME_COLOR:case ICC_IMG_CODING_SCHEME_COLOR_TRANSPARENCY:rawData.bitsPerImgPoint=GsmPDUHelper.readHexOctet();let num=GsmPDUHelper.readHexOctet();rawData.numOfClutEntries=num===0?0x100:num;rawData.clutOffset=(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet();rawData.body=GsmPDUHelper.readHexOctetArray(dataLen-ICC_IMG_HEADER_SIZE_COLOR);GsmPDUHelper.seekIncoming((rawData.clutOffset-offset-dataLen)*PDU_HEX_OCTET_SIZE);let clut=GsmPDUHelper.readHexOctetArray(rawData.numOfClutEntries*ICC_CLUT_ENTRY_SIZE);rawData.clut=clut;}
if(onsuccess){onsuccess(rawData);}}
this.context.ICCIOHelper.loadTransparentEF({fileId,aid:this.aid,pathId:this.context.ICCFileHelper.getEFPath(ICC_EF_IMG),callback:callback.bind(this),onerror,});},readSST(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;this.context.GsmPDUHelper.initWith(options.simResponse);let sst=this.context.GsmPDUHelper.readHexOctetArray(octetLen);RIL.iccInfoPrivate.sst=sst;if(DEBUG){let str="";let id=0;for(let i=0;i<sst.length;i++){for(let j=0;j<8;j++){if(sst[i]&(1<<j)){id=i*8+j+1;str=str+"["+id+"], ";}}}
this.context.debug("SST: Service available for "+str);}
let ICCUtilsHelper=this.context.ICCUtilsHelper;if(ICCUtilsHelper.isICCServiceAvailable("MSISDN")){if(DEBUG){this.context.debug("MSISDN: MSISDN is available");}
this.readMSISDN();}else if(DEBUG){this.context.debug("MSISDN: MSISDN service is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("SPN")){if(DEBUG){this.context.debug("SPN: SPN is available");}
this.readSPN();}else if(DEBUG){this.context.debug("SPN: SPN service is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("MDN")){if(DEBUG){this.context.debug("MDN: MDN available.");}
this.readMBDN();}else{if(DEBUG){this.context.debug("MDN: MDN service is not available");}
if(ICCUtilsHelper.isCphsServiceAvailable("MBN")){this.readCphsMBN();}else if(DEBUG){this.context.debug("CPHS_MBN: CPHS_MBN service is not available");}}
if(ICCUtilsHelper.isICCServiceAvailable("MWIS")){if(DEBUG){this.context.debug("MWIS: MWIS is available");}
this.readMWIS();}else if(DEBUG){this.context.debug("MWIS: MWIS is not available");}
if(ICCUtilsHelper.isCphsServiceAvailable("ONSF")){if(DEBUG){this.context.debug("ONSF: ONSF is available");}
this.readCphsONSF();}else if(DEBUG){this.context.debug("ONSF: ONSF is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("SPDI")){if(DEBUG){this.context.debug("SPDI: SPDI available.");}
this.readSPDI();}else if(DEBUG){this.context.debug("SPDI: SPDI service is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("PNN")){if(DEBUG){this.context.debug("PNN: PNN is available");}
this.readPNN();}else if(DEBUG){this.context.debug("PNN: PNN is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("OPL")){if(DEBUG){this.context.debug("OPL: OPL is available");}
this.readOPL();}else if(DEBUG){this.context.debug("OPL: OPL is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("GID1")){if(DEBUG){this.context.debug("GID1: GID1 is available");}
this.readGID1();}else if(DEBUG){this.context.debug("GID1: GID1 is not available"); RIL.iccInfo.isSimRecordsLoaded=true;if(DEBUG){this.context.debug("GID1 is not available isSimRecordsLoaded: "+RIL.iccInfo.isSimRecordsLoaded);}
}
if(ICCUtilsHelper.isICCServiceAvailable("GID2")){if(DEBUG){this.context.debug("GID2: GID2 is available");}
this.readGID2();}else if(DEBUG){this.context.debug("GID2: GID2 is not available");}
if(ICCUtilsHelper.isICCServiceAvailable("CFIS")){if(DEBUG){this.context.debug("CFIS: CFIS is available");}
this.readCFIS();}else if(DEBUG){this.context.debug("CFIS: CFIS is not available");}
if(Services.prefs.getBoolPref(kPrefAppCBConfigurationEnabled)){if(ICCUtilsHelper.isICCServiceAvailable("CBMI")){this.readCBMI();}else{if(DEBUG){this.context.debug("CBMI: CBMI is not available");}
RIL.cellBroadcastConfigs.CBMI=null;}
if(ICCUtilsHelper.isICCServiceAvailable("DATA_DOWNLOAD_SMS_CB")){this.readCBMID();}else{if(DEBUG){this.context.debug("CBMID: CBMID is not available");}
RIL.cellBroadcastConfigs.CBMID=null;}
if(ICCUtilsHelper.isICCServiceAvailable("CBMIR")){this.readCBMIR();}else{if(DEBUG){this.context.debug("CBMIR: CBMIR is not available");}
RIL.cellBroadcastConfigs.CBMIR=null;}}
RIL._mergeAllCellBroadcastConfigs();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_SST,aid:this.aid,callback:callback.bind(this),});},readMBDN(){function callback(options){let RIL=this.context.RIL;let contact=this.context.ICCPDUHelper.readAlphaIdDiallingNumber(options);if((!contact||((!contact.alphaId||contact.alphaId=="")&&(!contact.number||contact.number=="")))&&this.context.ICCUtilsHelper.isCphsServiceAvailable("MBN")){this.readCphsMBN();return;}
if(!contact||(RIL.iccInfoPrivate.mbdn!==undefined&&RIL.iccInfoPrivate.mbdn===contact.number)){return;}
RIL.iccInfoPrivate.mbdn=contact.number;if(DEBUG){this.context.debug("MBDN, alphaId="+contact.alphaId+" number="+contact.number);}
contact.rilMessageType="iccmbdn";RIL.handleUnsolicitedMessage(contact);}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_MBDN,aid:this.aid,callback:callback.bind(this),});},readMWIS(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;this.context.GsmPDUHelper.initWith(options.simResponse);let mwis=this.context.GsmPDUHelper.readHexOctetArray(octetLen);if(!mwis){return;}
RIL.iccInfoPrivate.mwis=mwis;let mwi={};





 mwi.active=(mwis[0]&0x01)!=0;if(mwi.active){mwi.msgCount=mwis[1]===0?GECKO_VOICEMAIL_MESSAGE_COUNT_UNKNOWN:mwis[1];}else{mwi.msgCount=0;}
let response={};response.rilMessageType="iccmwis";response.mwi=mwi;RIL.handleUnsolicitedMessage(response);}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_MWIS,aid:this.aid,recordNumber:1,callback:callback.bind(this),});},updateMWIS(mwi){let RIL=this.context.RIL;if(!RIL.iccInfoPrivate.mwis){return;}
function dataWriter(recordSize){let mwis=RIL.iccInfoPrivate.mwis;let msgCount=mwi.msgCount===GECKO_VOICEMAIL_MESSAGE_COUNT_UNKNOWN?0:mwi.msgCount;[mwis[0],mwis[1]]=mwi.active?[mwis[0]|0x01,msgCount]:[mwis[0]&0xfe,0];let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith();for(let i=0;i<mwis.length;i++){GsmPDUHelper.writeHexOctet(mwis[i]);}}
this.context.ICCIOHelper.updateLinearFixedEF({fileId:ICC_EF_MWIS,aid:this.aid,recordNumber:1,dataWriter:dataWriter.bind(this),});},readSPDI(){function callback(options){let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;let readLen=0;let endLoop=false;let RIL=this.context.RIL;RIL.iccInfoPrivate.SPDI=null;let GsmPDUHelper=this.context.GsmPDUHelper;while(readLen<octetLen&&!endLoop){let tlvTag=GsmPDUHelper.processHexToInt(value.slice(readLen,readLen+2),16);let tlvLen=GsmPDUHelper.processHexToInt(value.slice(readLen+2,readLen+4),16);readLen+=4;switch(tlvTag){case SPDI_TAG_SPDI:continue;case SPDI_TAG_PLMN_LIST:let plmn_value=value.slice(readLen);RIL.iccInfoPrivate.SPDI=this.readPLMNEntries(plmn_value,tlvLen/3);readLen+=tlvLen*2;endLoop=true;break;default:
endLoop=true;break;}}
if(DEBUG){this.context.debug("SPDI: "+JSON.stringify(RIL.iccInfoPrivate.SPDI));}
let ICCUtilsHelper=this.context.ICCUtilsHelper;if(ICCUtilsHelper.updateDisplayCondition()){ICCUtilsHelper.handleICCInfoChange();}} 
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_SPDI,aid:this.aid,callback:callback.bind(this),});},_readCbmiHelper(which){let RIL=this.context.RIL;function callback(options){let value=options.simResponse;let strLength=value.length;
let numIds=strLength/4,list=null;if(numIds){list=[];let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);for(let i=0,id;i<numIds;i++){id=(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet();if(id!=0xffff){list.push(id);list.push(id+1);}}}
if(DEBUG){this.context.debug(which+": "+JSON.stringify(list));}
RIL.cellBroadcastConfigs[which]=list;RIL._mergeAllCellBroadcastConfigs();}
function onerror(){RIL.cellBroadcastConfigs[which]=null;RIL._mergeAllCellBroadcastConfigs();}
let fileId=GLOBAL["ICC_EF_"+which];this.context.ICCIOHelper.loadTransparentEF({fileId,aid:this.aid,callback:callback.bind(this),onerror:onerror.bind(this),});},readCBMI(){this._readCbmiHelper("CBMI");},readCBMID(){this._readCbmiHelper("CBMID");},readCBMIR(){let RIL=this.context.RIL;function callback(options){let value=options.simResponse;let strLength=value.length;
let numIds=strLength/8,list=null;if(numIds){list=[];let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);for(let i=0,from,to;i<numIds;i++){

from=(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet();to=(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet();if(from!=0xffff&&to!=0xffff){list.push(from);list.push(to+1);}}}
if(DEBUG){this.context.debug("CBMIR: "+JSON.stringify(list));}
RIL.cellBroadcastConfigs.CBMIR=list;RIL._mergeAllCellBroadcastConfigs();}
function onerror(){RIL.cellBroadcastConfigs.CBMIR=null;RIL._mergeAllCellBroadcastConfigs();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_CBMIR,aid:this.aid,callback:callback.bind(this),onerror:onerror.bind(this),});},readOPL(){let ICCIOHelper=this.context.ICCIOHelper;let opl=[];function callback(options){let GsmPDUHelper=this.context.GsmPDUHelper;let value=options.simResponse;

let mccMnc=[GsmPDUHelper.processHexToInt(value.slice(0,2),16),GsmPDUHelper.processHexToInt(value.slice(2,4),16),GsmPDUHelper.processHexToInt(value.slice(4,6),16),];if(mccMnc[0]!=0xff||mccMnc[1]!=0xff||mccMnc[2]!=0xff){let oplElement={};let semiOctets=[];for(let i=0;i<mccMnc.length;i++){semiOctets.push((mccMnc[i]&0xf0)>>4);semiOctets.push(mccMnc[i]&0x0f);}
let reformat=[semiOctets[1],semiOctets[0],semiOctets[3],semiOctets[5],semiOctets[4],semiOctets[2],];let buf="";for(let i=0;i<reformat.length;i++){if(reformat[i]!=0xf){buf+=GsmPDUHelper.semiOctetToExtendedBcdChar(reformat[i]);}
if(i===2){ oplElement.mcc=buf;buf="";}else if(i===5){ oplElement.mnc=buf;}} 
oplElement.lacTacStart=(GsmPDUHelper.processHexToInt(value.slice(6,8),16)<<8)|GsmPDUHelper.processHexToInt(value.slice(8,10),16);oplElement.lacTacEnd=(GsmPDUHelper.processHexToInt(value.slice(10,12),16)<<8)|GsmPDUHelper.processHexToInt(value.slice(12,14),16); oplElement.pnnRecordId=GsmPDUHelper.processHexToInt(value.slice(14,16),16);if(DEBUG){this.context.debug("OPL: ["+(opl.length+1)+"]: "+JSON.stringify(oplElement));}
opl.push(oplElement);}else{}
let RIL=this.context.RIL;if(options.p1<options.totalRecords){ICCIOHelper.loadNextRecord(options);}else{RIL.iccInfoPrivate.OPL=opl;RIL.overrideNetworkName();}}
ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_OPL,aid:this.aid,callback:callback.bind(this),});},readPNN(){let ICCIOHelper=this.context.ICCIOHelper;function callback(options){let pnnElement;let value=options.simResponse;let strLen=value.length;let octetLen=strLen/PDU_HEX_OCTET_SIZE;let readLen=0;let GsmPDUHelper=this.context.GsmPDUHelper;while(readLen<strLen){let tlvTag=GsmPDUHelper.processHexToInt(value.slice(readLen,readLen+2),16);if(tlvTag==0xff){ readLen+=2;break;}
pnnElement=pnnElement||{};let tlvLen=GsmPDUHelper.processHexToInt(value.slice(readLen+2,readLen+4),16);let nameValue=value.slice(readLen+4);switch(tlvTag){case PNN_IEI_FULL_NETWORK_NAME:pnnElement.fullName=GsmPDUHelper.readNetworkName(nameValue,tlvLen);break;case PNN_IEI_SHORT_NETWORK_NAME:pnnElement.shortName=GsmPDUHelper.readNetworkName(nameValue,tlvLen);break;default:break;}
readLen+=tlvLen*2+4;}
pnn.push(pnnElement);let RIL=this.context.RIL;if(options.p1<options.totalRecords){ICCIOHelper.loadNextRecord(options);}else{if(DEBUG){for(let i=0;i<pnn.length;i++){this.context.debug("PNN: ["+i+"]: "+JSON.stringify(pnn[i]));}}
RIL.iccInfoPrivate.PNN=pnn;RIL.overrideNetworkName();}}
let pnn=[];ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_PNN,aid:this.aid,callback:callback.bind(this),});},readPLMNEntries(value,length){let plmnList=[];if(DEBUG){this.context.debug("PLMN entries length = "+length+" , value="+value);}
let GsmPDUHelper=this.context.GsmPDUHelper;let index=0;while(index<length){
try{let plmn=[GsmPDUHelper.processHexToInt(value.slice(0,2),16),GsmPDUHelper.processHexToInt(value.slice(2,4),16),GsmPDUHelper.processHexToInt(value.slice(4,6),16),];if(DEBUG){this.context.debug("Reading PLMN entry: ["+index+"]: '"+plmn+"'");}
if(plmn[0]!=0xff&&plmn[1]!=0xff&&plmn[2]!=0xff){let semiOctets=[];for(let idx=0;idx<plmn.length;idx++){semiOctets.push((plmn[idx]&0xf0)>>4);semiOctets.push(plmn[idx]&0x0f);}

let reformat=[semiOctets[1],semiOctets[0],semiOctets[3],semiOctets[5],semiOctets[4],semiOctets[2],];let buf="";let plmnEntry={};for(let i=0;i<reformat.length;i++){if(reformat[i]!=0xf){buf+=GsmPDUHelper.semiOctetToExtendedBcdChar(reformat[i]);}
if(i===2){ plmnEntry.mcc=buf;buf="";}else if(i===5){ plmnEntry.mnc=buf;}}
if(DEBUG){this.context.debug("PLMN = "+plmnEntry.mcc+", "+plmnEntry.mnc);}
plmnList.push(plmnEntry);}}catch(e){if(DEBUG){this.context.debug("PLMN entry "+index+" is invalid.");}
break;}
value=value.slice(index+6);index++;}
return plmnList;},readSMS(recordNumber,onsuccess,onerror){function callback(options){let value=options.simResponse;




let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let status=GsmPDUHelper.readHexOctet();let message=GsmPDUHelper.readMessage();message.simStatus=status;if(message){onsuccess(message);}else{onerror("Failed to decode SMS on SIM #"+recordNumber);}}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_SMS,aid:this.aid,recordNumber,callback:callback.bind(this),onerror,});},readGID1(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;RIL.iccInfo.gid1=value;if(DEBUG){this.context.debug("GID1: "+RIL.iccInfo.gid1);} 
RIL.iccInfo.isSimRecordsLoaded=true;if(DEBUG){this.context.debug("isSimRecordsLoaded: "+RIL.iccInfo.isSimRecordsLoaded);} 
this.context.ICCUtilsHelper.handleICCInfoChange();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_GID1,aid:this.aid,callback:callback.bind(this),});},readGID2(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;RIL.iccInfo.gid2=value;if(DEBUG){this.context.debug("GID2: "+RIL.iccInfo.gid2);}
this.context.ICCUtilsHelper.handleICCInfoChange();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_GID2,aid:this.aid,callback:callback.bind(this),});},readCFIS(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;let PDUHelper=this.context.GsmPDUHelper;PDUHelper.initWith(value);let cfis={};cfis.msp=PDUHelper.readHexOctet();cfis.indicator=PDUHelper.readHexOctet();cfis.number=this.context.ICCPDUHelper.readNumberWithLength();cfis.ccpRecordNumber=PDUHelper.readHexOctet();cfis.extRecordNumber=PDUHelper.readHexOctet();if(cfis.msp<1||cfis.msp>4){if(DEBUG){this.context.debug("CFIS content error: invalid msp");}
return;}
if(!RIL.iccInfoPrivate.cfis||RIL.iccInfoPrivate.cfis.indicator!=cfis.indicator){RIL.iccInfoPrivate.cfis=cfis;if(DEBUG){this.context.debug("cfis changed, NotifyCFStatechanged");}
RIL.sendChromeMessage({rilMessageType:"cfstatechanged",action:cfis.indicator&0x01,reason:CALL_FORWARD_REASON_UNCONDITIONAL,number:cfis.number,timeSeconds:0,serviceClass:ICC_SERVICE_CLASS_VOICE,});}}
function onerror(errorMsg){if(DEBUG){this.context.debug("readCFIS onerror: "+errorMsg);}}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_CFIS,aid:this.aid,recordNumber:1,recordSize:CFIS_RECORD_SIZE_BYTES,callback:callback.bind(this),onerror:onerror.bind(this),});},updateCFIS(options){let dataWriter=function dataWriter(recordSize){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith();let cfis=this.context.RIL.iccInfoPrivate.cfis;GsmPDUHelper.writeHexOctet(cfis.msp); if(options.action){cfis.indicator=cfis.indicator|1;}else{cfis.indicator=cfis.indicator&0xfe;}
GsmPDUHelper.writeHexOctet(cfis.indicator);let writtenNumber=this.context.ICCPDUHelper.writeNumberWithLength(options.number);cfis.number=options.number;GsmPDUHelper.writeHexOctet(cfis.ccpRecordNumber);GsmPDUHelper.writeHexOctet(cfis.extRecordNumber);}.bind(this);let callback=function callback(options){if(DEBUG){this.context.debug("updateCFIS success");}}.bind(this);let onerror=function onerror(errorMsg){if(DEBUG){this.context.debug("updateCFIS errorMessage: "+errorMsg);}}.bind(this);this.context.ICCIOHelper.updateLinearFixedEF({fileId:ICC_EF_CFIS,aid:this.aid,recordNumber:1,dataWriter,callback,onerror,});},readCphsInfo(onsuccess,onerror){function callback(options){try{let RIL=this.context.RIL;this.context.GsmPDUHelper.initWith(options.simResponse);let octetLen=options.simResponse.length/PDU_HEX_OCTET_SIZE;let cphsInfo=this.context.GsmPDUHelper.readHexOctetArray(octetLen);if(DEBUG){let str="";for(let i=0;i<cphsInfo.length;i++){str+=cphsInfo[i]+", ";}
this.context.debug("CPHS INFO: "+str);}
let cphsPhase=cphsInfo[0];if(cphsPhase==1){cphsInfo[1]&=0x3f;if(cphsInfo.length>2){cphsInfo[2]=0x00;}}else if(cphsPhase==2){cphsInfo[1]&=0xf3;}else{throw new Error("Unknown CPHS phase: "+cphsPhase);}
RIL.iccInfoPrivate.cphsSt=cphsInfo.subarray(1);onsuccess();}catch(e){onerror(e.toString());}}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_CPHS_INFO,aid:this.aid,callback:callback.bind(this),onerror,});},readCphsMBN(){function callback(options){let RIL=this.context.RIL;let contact=this.context.ICCPDUHelper.readAlphaIdDiallingNumber(options);if(!contact||(RIL.iccInfoPrivate.mbdn!==undefined&&RIL.iccInfoPrivate.mbdn===contact.number)){return;}
RIL.iccInfoPrivate.mbdn=contact.number;if(DEBUG){this.context.debug("CPHS_MDN, alphaId="+contact.alphaId+" number="+contact.number);}
contact.rilMessageType="iccmbdn";RIL.sendChromeMessage(contact);}
this.context.ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_CPHS_MBN,aid:this.aid,callback:callback.bind(this),});},_processCphsOnsResponse(value){let octetLen=value.length/PDU_HEX_OCTET_SIZE;let ons=this.context.ICCPDUHelper.readAlphaIdentifier(value,octetLen);return ons;},readCphsONS(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;RIL.iccInfoPrivate.ons=this._processCphsOnsResponse(value);if(DEBUG){this.context.debug("CPHS Operator Name String = "+RIL.iccInfoPrivate.ons);}
RIL.overrideNetworkName();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_CPHS_ONS,aid:this.aid,callback:callback.bind(this),});},readCphsONSF(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;RIL.iccInfoPrivate.ons_short_form=this._processCphsOnsResponse(value);if(DEBUG){this.context.debug("CPHS Operator Name Shortform = "+RIL.iccInfoPrivate.ons_short_form);}
RIL.overrideNetworkName();}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_CPHS_ONSF,aid:this.aid,callback:callback.bind(this),});},readCphsCFF(){function callback(options){let RIL=this.context.RIL;let value=options.simResponse;let octetLen=value.length/PDU_HEX_OCTET_SIZE;this.context.GsmPDUHelper.initWith(value);if(octetLen!=0){ let cff=[];for(let i=0;octetLen>i;i++){cff[i]=this.context.GsmPDUHelper.readHexOctet();} 
if(!RIL.iccInfoPrivate.cff||RIL.iccInfoPrivate.cff[0]!=cff[0]){ RIL.iccInfoPrivate.cff=cff;RIL.sendChromeMessage({rilMessageType:"cfstatechanged",action:cff[0]&0xa0,reason:CALL_FORWARD_REASON_UNCONDITIONAL,number:"0000000000",timeSeconds:0,serviceClass:ICC_SERVICE_CLASS_VOICE,});}}}
this.context.ICCIOHelper.loadTransparentEF({fileId:ICC_EF_CPHS_CFF,aid:this.aid,callback:callback.bind(this),});},updateCphsCFF(flag){function dataWriter(fileSize){let cff=this.context.RIL.iccInfoPrivate.cff;if(flag){cff[0]=(cff[0]&0x0f)|0xa0;}else{cff[0]=(cff[0]&0x0f)|0x50;}
this.context.RIL.iccInfoPrivate.cff=cff;this.context.GsmPDUHelpe.initWith();for(let i=0;i<fileSize;i++){this.context.GsmPDUHelper.writeHexOctet(cff[i]);}}
function callback(){if(DEBUG){this.context.debug("updateCphsCFF success");}}
function onerror(){if(DEBUG){this.context.debug("updateCphsCFF fail");}} 
this.context.ICCIOHelper.updateTransparentEF({fileId:ICC_EF_CPHS_CFF,aid:this.aid,dataWriter:dataWriter.bind(this),callback:callback.bind(this),onerror:onerror.bind(this),});},};function ISimRecordHelperObject(aContext){this.context=aContext;}
ISimRecordHelperObject.prototype={context:null,aid:null,impi:null,impus:[],setAid(aid){if(DEBUG){this.context.debug("ISIM aid : "+aid);}
this.aid=aid;},fetchISimRecords(){if(!this.aid){return;}
this.readIMPI();this.readIMPU();},handleFileUpdate(aEfId){switch(aEfId){case ICC_EF_ISIM_IMPI:if(DEBUG)this.context.debug("File refresh for EF_ISIM_IMPI.");this.readIMPI();break;case ICC_EF_ISIM_IMPU:if(DEBUG)this.context.debug("File refresh for ISIM_IMPU.");this.readIMPU();break;default:
if(DEBUG)this.context.debug("ISIM Refresh for all.");this.fetchISimRecords();break;}},readIMPI(){let ICCFileHelper=this.context.ICCFileHelper;let ICCIOHelper=this.context.ICCIOHelper;function callback(options){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(options.simResponse);let tlvTag=GsmPDUHelper.readHexOctet();let tlvLen=GsmPDUHelper.readHexOctet();if(tlvTag===ICC_ISIM_NAI_TLV_DATA_OBJECT_TAG){let str="";for(let i=0;i<tlvLen;i++){str+=String.fromCharCode(GsmPDUHelper.readHexOctet());}
if(DEBUG){this.context.debug("impi : "+str);}
this.impi=str;}
this._handleIsimInfoChange();}
ICCIOHelper.loadTransparentEF({fileId:ICC_EF_ISIM_IMPI,pathId:ICCFileHelper.getIsimEFPath(ICC_EF_ISIM_IMPI),aid:this.aid,callback:callback.bind(this),});},readIMPU(){this.impus=[];let ICCFileHelper=this.context.ICCFileHelper;let ICCIOHelper=this.context.ICCIOHelper;function callback(options){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(options.simResponse);let ICCIOHelper=this.context.ICCIOHelper;let tlvTag=GsmPDUHelper.readHexOctet();let tlvLen=GsmPDUHelper.readHexOctet();if(tlvTag===ICC_ISIM_URI_TLV_DATA_OBJECTTAG){let str="";for(let i=0;i<tlvLen;i++){str+=String.fromCharCode(GsmPDUHelper.readHexOctet());}
if(str.length){if(DEBUG){this.context.debug("impu : "+str);}
this.impus.push(str);}}
if(options.p1<options.totalRecords){ICCIOHelper.loadNextRecord(options);}else{this._handleIsimInfoChange();}}
function onerror(errorMsg){this.context.debug("Error on reading readIMPU  : "+errorMsg);}
ICCIOHelper.loadLinearFixedEF({fileId:ICC_EF_ISIM_IMPU,pathId:ICCFileHelper.getIsimEFPath(ICC_EF_ISIM_IMPU),aid:this.aid,callback:callback.bind(this),onerror:onerror.bind(this),});},_handleIsimInfoChange(){if(this.impi&&this.impus&&this.impus.length){this.context.ICCUtilsHelper.handleISIMInfoChange({impi:this.impi,impus:this.impus,});}},};function ICCPDUHelperObject(aContext){this.context=aContext;}
ICCPDUHelperObject.prototype={context:null,read8BitUnpackedToString(value,numOctets){let GsmPDUHelper=this.context.GsmPDUHelper;let ret="";let escapeFound=false;const langTable=PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];for(let i=0;i<numOctets*2;i+=2){let octet=GsmPDUHelper.processHexToInt(value.slice(i,i+2),16);if(octet==0xff){break;}
if(escapeFound){escapeFound=false;if(octet==PDU_NL_EXTENDED_ESCAPE){

ret+=" ";}else if(octet==PDU_NL_RESERVED_CONTROL){

ret+=" ";}else{ret+=langShiftTable[octet];}}else if(octet==PDU_NL_EXTENDED_ESCAPE){escapeFound=true;}else{ret+=langTable[octet];}}
return ret;},writeStringTo8BitUnpacked(numOctets,str){const langTable=PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];const langShiftTable=PDU_NL_SINGLE_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT];let GsmPDUHelper=this.context.GsmPDUHelper;let i,j;let len=str?str.length:0;for(i=0,j=0;i<len&&j<numOctets;i++){let c=str.charAt(i);let octet=langTable.indexOf(c);if(octet==-1){if(j+2>numOctets){break;}
octet=langShiftTable.indexOf(c);if(octet==-1){octet=langTable.indexOf(" ");}else{GsmPDUHelper.writeHexOctet(PDU_NL_EXTENDED_ESCAPE);j++;}}
GsmPDUHelper.writeHexOctet(octet);j++;} 
while(j++<numOctets){GsmPDUHelper.writeHexOctet(0xff);}
return str?str.substring(0,i):"";},writeICCUCS2String(numOctets,str){let GsmPDUHelper=this.context.GsmPDUHelper;let scheme=0x80;let basePointer;if(str.length>2){let min=0xffff;let max=0;for(let i=0;i<str.length;i++){let code=str.charCodeAt(i); if(code&0xff80){if(min>code){min=code;}
if(max<code){max=code;}}}
if(max-min>=0&&max-min<128){if((min&0x7f80)==(max&0x7f80)&&(max&0x8000)==0){scheme=0x81;basePointer=min&0x7f80;}else{scheme=0x82;basePointer=min;}}}
switch(scheme){case 0x80:{ GsmPDUHelper.writeHexOctet(0x80);numOctets--;if(str.length*2>numOctets){str=str.substring(0,Math.floor(numOctets/2));}
GsmPDUHelper.writeUCS2String(str); for(let i=str.length*2;i<numOctets;i++){GsmPDUHelper.writeHexOctet(0xff);}
return str;}
case 0x81:{GsmPDUHelper.writeHexOctet(0x81);if(str.length>numOctets-3){str=str.substring(0,numOctets-3);}
GsmPDUHelper.writeHexOctet(str.length);GsmPDUHelper.writeHexOctet((basePointer>>7)&0xff);numOctets-=3;break;}
case 0x82:{GsmPDUHelper.writeHexOctet(0x82);if(str.length>numOctets-4){str=str.substring(0,numOctets-4);}
GsmPDUHelper.writeHexOctet(str.length);GsmPDUHelper.writeHexOctet((basePointer>>8)&0xff);GsmPDUHelper.writeHexOctet(basePointer&0xff);numOctets-=4;break;}}
if(scheme==0x81||scheme==0x82){for(let i=0;i<str.length;i++){let code=str.charCodeAt(i); if(code>>8==0){GsmPDUHelper.writeHexOctet(code&0x7f);}else{ GsmPDUHelper.writeHexOctet((code-basePointer)|0x80);}} 
for(let i=0;i<numOctets-str.length;i++){GsmPDUHelper.writeHexOctet(0xff);}}
return str;},readICCUCS2String(scheme,value,numOctets){let GsmPDUHelper=this.context.GsmPDUHelper;let str="";switch(scheme){case 0x80:let isOdd=numOctets%2;let i;for(i=0;i<numOctets-isOdd;i+=2){let code=GsmPDUHelper.processHexToInt(value.slice(i*2,i*2+4),16);if(code==0xffff){i+=2;break;}
str+=String.fromCharCode(code);}
break;case 0x81: case 0x82:GsmPDUHelper.initWith(value);let len=GsmPDUHelper.readHexOctet();let offset,headerLen;if(scheme==0x81){offset=GsmPDUHelper.readHexOctet()<<7;headerLen=2;}else{offset=(GsmPDUHelper.readHexOctet()<<8)|GsmPDUHelper.readHexOctet();headerLen=3;}
for(let i=0;i<len;i++){let ch=GsmPDUHelper.readHexOctet();if(ch&0x80){ str+=String.fromCharCode((ch&0x7f)+offset);}else{ let count=0,gotUCS2=0;while(i+count+1<len){count++;if(GsmPDUHelper.readHexOctet()&0x80){GsmPDUHelper.seekIncoming(-1*PDU_HEX_OCTET_SIZE);gotUCS2=1;break;}}
let gsm8bitValue=value.slice(GsmPDUHelper.pduReadIndex-(count*PDU_HEX_OCTET_SIZE));str+=this.read8BitUnpackedToString(gsm8bitValue,count+1-gotUCS2);i+=count-gotUCS2;}} 
GsmPDUHelper.seekIncoming((numOctets-len-headerLen)*PDU_HEX_OCTET_SIZE);break;}
return str;},readAlphaIdDiallingNumber(options){let recordSize=options.recordSize;let value=options.simResponse;let length=value.length;let alphaLen=recordSize-ADN_FOOTER_SIZE_BYTES;let alphaId=this.readAlphaIdentifier(value,alphaLen); let number_value=value.slice(alphaLen*2);this.context.GsmPDUHelper.initWith(number_value);let number=this.readNumberWithLength(); let extRecordNumber=this.context.GsmPDUHelper.processHexToInt(value.slice((recordSize-1)*2),16);let contact=null;if(alphaId||number){contact={alphaId,number,extRecordNumber,};}
return contact;},writeAlphaIdDiallingNumber(recordSize,alphaId,number,extRecordNumber){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.pduWriteIndex=0;GsmPDUHelper.pdu="";let alphaLen=recordSize-ADN_FOOTER_SIZE_BYTES;let writtenAlphaId=this.writeAlphaIdentifier(alphaLen,alphaId);let writtenNumber=this.writeNumberWithLength(number);GsmPDUHelper.writeHexOctet(0xff);GsmPDUHelper.writeHexOctet(extRecordNumber!=null?extRecordNumber:0xff);return{alphaId:writtenAlphaId,number:writtenNumber};},readAlphaIdentifier(value,numOctets){if(numOctets===0){return"";}
let GsmPDUHelper=this.context.GsmPDUHelper;let scheme=GsmPDUHelper.processHexToInt(value.slice(0,2),16);if(scheme==0x80||scheme==0x81||scheme==0x82){numOctets--;value=value.slice(2);let string=this.readICCUCS2String(scheme,value,numOctets);return string;}
let string=this.read8BitUnpackedToString(value,numOctets);return string;},writeAlphaIdentifier(numOctets,alphaId){if(numOctets===0){return"";}
if(!alphaId||this.context.ICCUtilsHelper.isGsm8BitAlphabet(alphaId)){return this.writeStringTo8BitUnpacked(numOctets,alphaId);}
return this.writeICCUCS2String(numOctets,alphaId);},readDiallingNumber(len){if(DEBUG){this.context.debug("PDU: Going to read Dialling number: "+len);}
if(len===0){return"";}
let GsmPDUHelper=this.context.GsmPDUHelper;let toa=GsmPDUHelper.readHexOctet();let number=GsmPDUHelper.readSwappedNibbleExtendedBcdString(len-1);if(number.length<=0){if(DEBUG){this.context.debug("No number provided");}
return"";}
if(toa>>4==PDU_TOA_INTERNATIONAL>>4){number="+"+number;}
return number;},writeDiallingNumber(number){let GsmPDUHelper=this.context.GsmPDUHelper;let toa=PDU_TOA_ISDN; if(number[0]=="+"){toa=PDU_TOA_INTERNATIONAL|PDU_TOA_ISDN; number=number.substring(1);}
GsmPDUHelper.writeHexOctet(toa);GsmPDUHelper.writeSwappedNibbleBCD(number);},readNumberWithLength(){let number="";let GsmPDUHelper=this.context.GsmPDUHelper;let numLen=GsmPDUHelper.readHexOctet();if(numLen!=0xff){if(numLen>ADN_MAX_BCD_NUMBER_BYTES){if(DEBUG){this.context.debug("Error: invalid length of BCD number/SSC contents - "+numLen);}
return number;}
number=this.readDiallingNumber(numLen);}
return number;},writeNumberWithLength(number){let GsmPDUHelper=this.context.GsmPDUHelper;if(number){let numStart=number[0]=="+"?1:0;let writtenNumber=number.substring(0,numStart)+
number.substring(numStart).replace(/[^0-9*#,]/g,"");let numDigits=writtenNumber.length-numStart;if(numDigits>ADN_MAX_NUMBER_DIGITS){writtenNumber=writtenNumber.substring(0,ADN_MAX_NUMBER_DIGITS+numStart);numDigits=writtenNumber.length-numStart;} 
let numLen=Math.ceil(numDigits/2)+1;GsmPDUHelper.writeHexOctet(numLen);this.writeDiallingNumber(writtenNumber.replace(/\*/g,"a").replace(/\#/g,"b").replace(/\,/g,"c"));for(let i=0;i<ADN_MAX_BCD_NUMBER_BYTES-numLen;i++){GsmPDUHelper.writeHexOctet(0xff);}
return writtenNumber;} 
for(let i=0;i<ADN_MAX_BCD_NUMBER_BYTES+1;i++){GsmPDUHelper.writeHexOctet(0xff);}
return"";},};function ICCContactHelperObject(aContext){this.context=aContext;}
ICCContactHelperObject.prototype={context:null,hasDfPhoneBook(appType){switch(appType){case CARD_APPTYPE_SIM:return false;case CARD_APPTYPE_USIM:return true;case CARD_APPTYPE_RUIM:let ICCUtilsHelper=this.context.ICCUtilsHelper;return ICCUtilsHelper.isICCServiceAvailable("ENHANCED_PHONEBOOK");default:return false;}},readICCContacts(appType,contactType,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let ICCUtilsHelper=this.context.ICCUtilsHelper;switch(contactType){case GECKO_CARDCONTACT_TYPE_ADN:if(!this.hasDfPhoneBook(appType)){ICCRecordHelper.readADNLike(ICC_EF_ADN,ICCUtilsHelper.isICCServiceAvailable("EXT1")?ICC_EF_EXT1:null,onsuccess,onerror);}else{this.readUSimContacts(onsuccess,onerror);}
break;case GECKO_CARDCONTACT_TYPE_FDN:if(!ICCUtilsHelper.isICCServiceAvailable("FDN")){onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}
ICCRecordHelper.readADNLike(ICC_EF_FDN,ICCUtilsHelper.isICCServiceAvailable("EXT2")?ICC_EF_EXT2:null,onsuccess,onerror);break;case GECKO_CARDCONTACT_TYPE_SDN:if(!ICCUtilsHelper.isICCServiceAvailable("SDN")){onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}
ICCRecordHelper.readADNLike(ICC_EF_SDN,ICCUtilsHelper.isICCServiceAvailable("EXT3")?ICC_EF_EXT3:null,onsuccess,onerror);break;default:if(DEBUG){this.context.debug("Unsupported contactType :"+contactType);}
onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}},getMaxContactCount(appType,contactType,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let ICCUtilsHelper=this.context.ICCUtilsHelper;switch(contactType){case GECKO_CARDCONTACT_TYPE_ADN:if(!this.hasDfPhoneBook(appType)){ICCRecordHelper.readRecordCount(ICC_EF_ADN,onsuccess,onerror);}else{let gotPbrCb=function gotPbrCb(pbrs){this.readAllPbrRecordCount(pbrs,onsuccess,onerror);}.bind(this);let gotPbrErrCb=function gotPbrErrCb(){ICCRecordHelper.readRecordCount(ICC_EF_ADN,onsuccess,onerror);};this.context.ICCRecordHelper.readPBR(gotPbrCb,gotPbrErrCb);}
break;default:if(DEBUG){this.context.debug("Unsupported contactType :"+contactType);}
onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);}},findFreeICCContact(appType,contactType,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;switch(contactType){case GECKO_CARDCONTACT_TYPE_ADN:if(!this.hasDfPhoneBook(appType)){ICCRecordHelper.findFreeRecordId(ICC_EF_ADN,onsuccess.bind(null,0),onerror);}else{let gotPbrCb=function gotPbrCb(pbrs){this.findUSimFreeADNRecordId(pbrs,onsuccess,onerror);}.bind(this);let gotPbrErrCb=function gotPbrErrCb(){if(DEBUG){this.context.debug("findFreeICCContact gotPbrErrCb");}
ICCRecordHelper.findFreeRecordId(ICC_EF_ADN,onsuccess.bind(null,0),onerror);}.bind(this);ICCRecordHelper.readPBR(gotPbrCb,gotPbrErrCb);}
break;case GECKO_CARDCONTACT_TYPE_FDN:ICCRecordHelper.findFreeRecordId(ICC_EF_FDN,onsuccess.bind(null,0),onerror);break;default:if(DEBUG){this.context.debug("Unsupported contactType :"+contactType);}
onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}},_freePbrIndex:0,findUSimFreeADNRecordId(pbrs,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;function callback(pbrIndex,recordId){this._freePbrIndex=pbrIndex;onsuccess(pbrIndex,recordId);}
let nextPbrIndex=-1;(function findFreeRecordId(pbrIndex){if(nextPbrIndex===this._freePbrIndex){this._freePbrIndex=0;if(DEBUG){this.context.debug(CONTACT_ERR_NO_FREE_RECORD_FOUND);}
onerror(CONTACT_ERR_NO_FREE_RECORD_FOUND);return;}
let pbr=pbrs[pbrIndex];nextPbrIndex=(pbrIndex+1)%pbrs.length;ICCRecordHelper.findFreeRecordId(pbr.adn.fileId,callback.bind(this,pbrIndex),findFreeRecordId.bind(this,nextPbrIndex));}.call(this,this._freePbrIndex));},addICCContact(appType,contactType,contact,pin2,onsuccess,onerror){let foundFreeCb=function foundFreeCb(pbrIndex,recordId){contact.pbrIndex=pbrIndex;contact.recordId=recordId;this.updateICCContact(appType,contactType,contact,pin2,onsuccess,onerror);}.bind(this);this.findFreeICCContact(appType,contactType,foundFreeCb,onerror);},updateICCContact(appType,contactType,contact,pin2,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let ICCUtilsHelper=this.context.ICCUtilsHelper;let updateContactCb=updatedContact=>{updatedContact.pbrIndex=contact.pbrIndex;updatedContact.recordId=contact.recordId;onsuccess(updatedContact);};switch(contactType){case GECKO_CARDCONTACT_TYPE_ADN:if(!this.hasDfPhoneBook(appType)){if(ICCUtilsHelper.isICCServiceAvailable("EXT1")){this.updateADNLikeWithExtension(ICC_EF_ADN,ICC_EF_EXT1,contact,null,updateContactCb,onerror);}else{ICCRecordHelper.updateADNLike(ICC_EF_ADN,0xff,contact,null,updateContactCb,onerror);}}else{this.updateUSimContact(contact,updateContactCb,onerror);}
break;case GECKO_CARDCONTACT_TYPE_FDN:if(!pin2){onerror(GECKO_ERROR_SIM_PIN2);return;}
if(!ICCUtilsHelper.isICCServiceAvailable("FDN")){onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}
if(ICCUtilsHelper.isICCServiceAvailable("EXT2")){this.updateADNLikeWithExtension(ICC_EF_FDN,ICC_EF_EXT2,contact,pin2,updateContactCb,onerror);}else{ICCRecordHelper.updateADNLike(ICC_EF_FDN,0xff,contact,pin2,updateContactCb,onerror);}
break;default:if(DEBUG){this.context.debug("Unsupported contactType :"+contactType);}
onerror(CONTACT_ERR_CONTACT_TYPE_NOT_SUPPORTED);break;}},readUSimContacts(onsuccess,onerror){let gotPbrCb=function gotPbrCb(pbrs){this.readAllPhonebookSets(pbrs,onsuccess,onerror);}.bind(this);let gotPbrErrCb=function gotPbrErrCb(){if(DEBUG){this.context.debug("readUSimContacts gotPbrErrCb");}
this.context.ICCRecordHelper.readADNLike(ICC_EF_ADN,this.context.ICCUtilsHelper.isICCServiceAvailable("EXT1")?ICC_EF_EXT1:null,onsuccess,onerror);}.bind(this);this.context.ICCRecordHelper.readPBR(gotPbrCb,gotPbrErrCb);},readAllPhonebookSets(pbrs,onsuccess,onerror){let allContacts=[],pbrIndex=0;let readPhonebook=function(contacts){if(contacts){allContacts=allContacts.concat(contacts);}
let cLen=contacts?contacts.length:0;for(let i=0;i<cLen;i++){contacts[i].pbrIndex=pbrIndex;}
pbrIndex++;if(pbrIndex>=pbrs.length){if(onsuccess){onsuccess(allContacts);}
return;}
this.readPhonebookSet(pbrs[pbrIndex],readPhonebook,onerror);}.bind(this);this.readPhonebookSet(pbrs[pbrIndex],readPhonebook,onerror);},readAllPbrRecordCount(pbrs,onsuccess,onerror){let totalRecords=0,pbrIndex=0;let readPhoneBook=function(aTotalRecord){totalRecords+=aTotalRecord;pbrIndex++;if(pbrIndex>=pbrs.length){if(onsuccess){onsuccess(totalRecords);}
return;}
this.readPerPbrRecordCount(pbrs[pbrIndex],readPhoneBook,onerror);}.bind(this);this.readPerPbrRecordCount(pbrs[pbrIndex],readPhoneBook,onerror);},readPerPbrRecordCount(pbr,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;ICCRecordHelper.readRecordCount(pbr.adn.fileId,onsuccess,onerror);},readPhonebookSet(pbr,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let gotAdnCb=function gotAdnCb(contacts){this.readSupportedPBRFields(pbr,contacts,onsuccess,onerror);}.bind(this);ICCRecordHelper.readADNLike(pbr.adn.fileId,pbr.ext1?pbr.ext1.fileId:null,gotAdnCb,onerror);},readSupportedPBRFields(pbr,contacts,onsuccess,onerror){let fieldIndex=0;(function readField(){let field=USIM_PBR_FIELDS[fieldIndex];fieldIndex+=1;if(!field){if(onsuccess){onsuccess(contacts);}
return;}
this.readPhonebookField(pbr,contacts,field,readField.bind(this),onerror);}.call(this));},readPhonebookField(pbr,contacts,field,onsuccess,onerror){if(!pbr[field]){if(onsuccess){onsuccess(contacts);}
return;}
(function doReadContactField(n){if(n>=contacts.length){if(onsuccess){onsuccess(contacts);}
return;}
this.readContactField(pbr,contacts[n],field,doReadContactField.bind(this,n+1),onerror);}.call(this,0));},readContactField(pbr,contact,field,onsuccess,onerror){let gotRecordIdCb=function gotRecordIdCb(recordId){if(recordId==0xff){if(onsuccess){onsuccess();}
return;}
let fileId=pbr[field].fileId;let fileType=pbr[field].fileType;let gotFieldCb=function gotFieldCb(value){if(value){if(field.startsWith(USIM_PBR_ANR)){if(!contact[USIM_PBR_ANR]){contact[USIM_PBR_ANR]=[];}
contact[USIM_PBR_ANR].push(value);}else{contact[field]=value;}}
if(onsuccess){onsuccess();}};let ICCRecordHelper=this.context.ICCRecordHelper;let ef=field.startsWith(USIM_PBR_ANR)?USIM_PBR_ANR:field;switch(ef){case USIM_PBR_EMAIL:ICCRecordHelper.readEmail(fileId,fileType,recordId,gotFieldCb,onerror);break;case USIM_PBR_ANR:ICCRecordHelper.readANR(fileId,fileType,recordId,gotFieldCb,onerror);break;default:if(DEBUG){this.context.debug("Unsupported field :"+field);}
onerror(CONTACT_ERR_FIELD_NOT_SUPPORTED);break;}}.bind(this);this.getContactFieldRecordId(pbr,contact,field,gotRecordIdCb,onerror);},getContactFieldRecordId(pbr,contact,field,onsuccess,onerror){if(pbr[field].fileType==ICC_USIM_TYPE1_TAG){if(onsuccess){onsuccess(contact.recordId);}}else if(pbr[field].fileType==ICC_USIM_TYPE2_TAG){let gotIapCb=function gotIapCb(iap){let indexInIAP=pbr[field].indexInIAP;let recordId=iap[indexInIAP];if(onsuccess){onsuccess(recordId);}};this.context.ICCRecordHelper.readIAP(pbr.iap.fileId,contact.recordId,gotIapCb,onerror);}else{if(DEBUG){this.context.debug("USIM PBR files in Type 3 format are not supported.");}
onerror(CONTACT_ERR_REQUEST_NOT_SUPPORTED);}},updateUSimContact(contact,onsuccess,onerror){let updateContactCb=updatedContact=>{updatedContact.pbrIndex=contact.pbrIndex;updatedContact.recordId=contact.recordId;onsuccess(updatedContact);};let gotPbrCb=function gotPbrCb(pbrs){let pbr=pbrs[contact.pbrIndex];if(!pbr){if(DEBUG){this.context.debug(CONTACT_ERR_CANNOT_ACCESS_PHONEBOOK);}
onerror(CONTACT_ERR_CANNOT_ACCESS_PHONEBOOK);return;}
this.updatePhonebookSet(pbr,contact,onsuccess,onerror);}.bind(this);let gotPbrErrCb=function gotPbrErrCb(){if(DEBUG){this.context.debug("updateUSimContact gotPbrErrCb");}
if(this.context.ICCUtilsHelper.isICCServiceAvailable("EXT1")){this.updateADNLikeWithExtension(ICC_EF_ADN,ICC_EF_EXT1,contact,null,updateContactCb,onerror);}else{this.context.ICCRecordHelper.updateADNLike(ICC_EF_ADN,0xff,contact,null,updateContactCb,onerror);}}.bind(this);this.context.ICCRecordHelper.readPBR(gotPbrCb,gotPbrErrCb);},updatePhonebookSet(pbr,contact,onsuccess,onerror){let updateAdnCb=function(updatedContact){this.updateSupportedPBRFields(pbr,contact,updatedContactField=>{onsuccess(Object.assign(updatedContact,updatedContactField));},onerror);}.bind(this);if(pbr.ext1){this.updateADNLikeWithExtension(pbr.adn.fileId,pbr.ext1.fileId,contact,null,updateAdnCb,onerror);}else{this.context.ICCRecordHelper.updateADNLike(pbr.adn.fileId,0xff,contact,null,updateAdnCb,onerror);}},updateSupportedPBRFields(pbr,contact,onsuccess,onerror){let fieldIndex=0;let contactField={};(function updateField(){let field=USIM_PBR_FIELDS[fieldIndex];fieldIndex+=1;if(!field){if(onsuccess){onsuccess(contactField);}
return;}
if(!pbr[field]){updateField.call(this);return;}
this.updateContactField(pbr,contact,field,fieldEntry=>{contactField=Object.assign(contactField,fieldEntry);updateField.call(this);},errorMsg=>{

if(errorMsg===CONTACT_ERR_NO_FREE_RECORD_FOUND){updateField.call(this);return;}
onerror(errorMsg);});}.call(this));},updateContactField(pbr,contact,field,onsuccess,onerror){if(pbr[field].fileType===ICC_USIM_TYPE1_TAG){this.updateContactFieldType1(pbr,contact,field,onsuccess,onerror);}else if(pbr[field].fileType===ICC_USIM_TYPE2_TAG){this.updateContactFieldType2(pbr,contact,field,onsuccess,onerror);}else{if(DEBUG){this.context.debug("USIM PBR files in Type 3 format are not supported.");}
onerror(CONTACT_ERR_REQUEST_NOT_SUPPORTED);}},updateContactFieldType1(pbr,contact,field,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;if(field===USIM_PBR_EMAIL){ICCRecordHelper.updateEmail(pbr,contact.recordId,contact.email,null,updatedEmail=>{onsuccess({email:updatedEmail});},onerror);}else if(field===USIM_PBR_ANR0){let anr=Array.isArray(contact.anr)?contact.anr[0]:null;ICCRecordHelper.updateANR(pbr,contact.recordId,anr,null,updatedANR=>{onsuccess(updatedANR?{anr:[updatedANR]}:null);},onerror);}else{if(DEBUG){this.context.debug("Unsupported field :"+field);}
onerror(CONTACT_ERR_FIELD_NOT_SUPPORTED);}},updateContactFieldType2(pbr,contact,field,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;


let gotIapCb=function gotIapCb(iap){let recordId=iap[pbr[field].indexInIAP];if(recordId===0xff){
if((field===USIM_PBR_EMAIL&&contact.email)||(field===USIM_PBR_ANR0&&Array.isArray(contact.anr)&&contact.anr[0])){this.addContactFieldType2(pbr,contact,field,onsuccess,onerror);}else if(onsuccess){onsuccess();}
return;}
if(field===USIM_PBR_EMAIL){ICCRecordHelper.updateEmail(pbr,recordId,contact.email,contact.recordId,updatedEmail=>{onsuccess({email:updatedEmail});},onerror);}else if(field===USIM_PBR_ANR0){let anr=Array.isArray(contact.anr)?contact.anr[0]:null;ICCRecordHelper.updateANR(pbr,recordId,anr,contact.recordId,updatedANR=>{onsuccess(updatedANR?{anr:[updatedANR]}:null);},onerror);}else{if(DEBUG){this.context.debug("Unsupported field :"+field);}
onerror(CONTACT_ERR_FIELD_NOT_SUPPORTED);}}.bind(this);ICCRecordHelper.readIAP(pbr.iap.fileId,contact.recordId,gotIapCb,onerror);},addContactFieldType2(pbr,contact,field,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let successCb=function successCb(recordId){let updateCb=function updateCb(contactField){this.updateContactFieldIndexInIAP(pbr,contact.recordId,field,recordId,()=>{onsuccess(contactField);},onerror);}.bind(this);if(field===USIM_PBR_EMAIL){ICCRecordHelper.updateEmail(pbr,recordId,contact.email,contact.recordId,updatedEmail=>{updateCb({email:updatedEmail});},onerror);}else if(field===USIM_PBR_ANR0){ICCRecordHelper.updateANR(pbr,recordId,contact.anr[0],contact.recordId,updatedANR=>{updateCb(updatedANR?{anr:[updatedANR]}:null);},onerror);}}.bind(this);let errorCb=function errorCb(errorMsg){if(DEBUG){this.context.debug(errorMsg+" USIM field "+field);}
onerror(errorMsg);}.bind(this);ICCRecordHelper.findFreeRecordId(pbr[field].fileId,successCb,errorCb);},updateContactFieldIndexInIAP(pbr,recordNumber,field,value,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let gotIAPCb=function gotIAPCb(iap){iap[pbr[field].indexInIAP]=value;ICCRecordHelper.updateIAP(pbr.iap.fileId,recordNumber,iap,onsuccess,onerror);};ICCRecordHelper.readIAP(pbr.iap.fileId,recordNumber,gotIAPCb,onerror);},updateADNLikeWithExtension(fileId,extFileId,contact,pin2,onsuccess,onerror){let ICCRecordHelper=this.context.ICCRecordHelper;let extNumber;if(contact.number){let numStart=contact.number[0]=="+"?1:0;let number=contact.number.substring(0,numStart)+
this.context.GsmPDUHelper.stringToExtendedBcd(contact.number.substring(numStart));extNumber=number.substr(numStart+ADN_MAX_NUMBER_DIGITS,EXT_MAX_NUMBER_DIGITS);}
ICCRecordHelper.getADNLikeExtensionRecordNumber(fileId,contact.recordId,extRecordNumber=>{let updateADNLike=extRecordNumber=>{ICCRecordHelper.updateADNLike(fileId,extRecordNumber,contact,pin2,updatedContact=>{if(extNumber&&extRecordNumber!=0xff){updatedContact.number=updatedContact.number.concat(extNumber);}
onsuccess(updatedContact);},onerror);};let updateExtension=extRecordNumber=>{ICCRecordHelper.updateExtension(extFileId,extRecordNumber,extNumber,()=>updateADNLike(extRecordNumber),()=>updateADNLike(0xff));};if(extNumber){if(extRecordNumber!=0xff){updateExtension(extRecordNumber);return;}
ICCRecordHelper.findFreeRecordId(extFileId,extRecordNumber=>updateExtension(extRecordNumber),errorMsg=>{if(DEBUG){this.context.debug("Couldn't find free extension record Id for "+
extFileId+": "+
errorMsg);}
updateADNLike(0xff);});return;}
if(extRecordNumber!=0xff){ICCRecordHelper.cleanEFRecord(extFileId,extRecordNumber,()=>updateADNLike(0xff),onerror);return;}
updateADNLike(0xff);},onerror);},};function BerTlvHelperObject(aContext){this.context=aContext;}
BerTlvHelperObject.prototype={context:null,decode(value){let dataLen=value.length/2;let GsmPDUHelper=this.context.GsmPDUHelper;let hlen=0; let tag=GsmPDUHelper.processHexToInt(value.slice(0,2),16);hlen++;

let length; let temp=GsmPDUHelper.processHexToInt(value.slice(2,4),16);hlen++;if(temp<0x80){length=temp;}else if(temp===0x81){length=GsmPDUHelper.processHexToInt(value.slice(4,6),16);hlen++;if(length<0x80){throw new Error("Invalid length "+length);}}else{throw new Error("Invalid length octet "+temp);}
if(dataLen-hlen!==length){throw new Error("Unexpected BerTlvHelper value length!!");}
let method=this[tag];if(typeof method!="function"){throw new Error("Unknown Ber tag 0x"+tag.toString(16));}
value=value.slice(hlen*PDU_HEX_OCTET_SIZE);let decodeValue=method.call(this,value,length);return{tag,length,value:decodeValue,};},processFcpTemplate(value,length){let tlvs=this.decodeChunks(value,length);return tlvs;},processProactiveCommand(value,length){let ctlvs=this.context.ComprehensionTlvHelper.decodeChunks(value,length);return ctlvs;},decodeInnerTlv(value){let GsmPDUHelper=this.context.GsmPDUHelper;let tag=GsmPDUHelper.processHexToInt(value.slice(0,2),16);let length=GsmPDUHelper.processHexToInt(value.slice(2,4),16);value=value.slice(2*PDU_HEX_OCTET_SIZE);let decodeValue=this.retrieve(tag,value,length);return{tag,length,value:decodeValue,};},decodeChunks(value,length){let chunks=[];let index=0;while(index<length){let tlv=this.decodeInnerTlv(value);if(tlv.value){chunks.push(tlv);}
index+=tlv.length;index+=2;}
return chunks;}, retrieve(tag,value,length){let method=this[tag];if(typeof method!="function"){if(DEBUG){this.context.debug("Unknown Ber tag : 0x"+tag.toString(16));}
value=value.slice(length*PDU_HEX_OCTET_SIZE);return null;}
return method.call(this,value,length);},retrieveFileSizeData(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let fileSizeData=0;for(let i=0;i<length;i++){fileSizeData=fileSizeData<<8;fileSizeData+=GsmPDUHelper.readHexOctet();}
return{fileSizeData};},retrieveFileDescriptor(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let fileDescriptorByte=GsmPDUHelper.readHexOctet();let dataCodingByte=GsmPDUHelper.readHexOctet();
let fileStructure=fileDescriptorByte&0x07;let fileDescriptor={fileStructure,};
if(fileStructure===UICC_EF_STRUCTURE[EF_STRUCTURE_LINEAR_FIXED]||fileStructure===UICC_EF_STRUCTURE[EF_STRUCTURE_CYCLIC]){fileDescriptor.recordLength=(GsmPDUHelper.readHexOctet()<<8)+GsmPDUHelper.readHexOctet();fileDescriptor.numOfRecords=GsmPDUHelper.readHexOctet();}
return fileDescriptor;},retrieveFileIdentifier(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);return{fileId:(GsmPDUHelper.readHexOctet()<<8)+GsmPDUHelper.readHexOctet(),};},searchForNextTag(tag,iter){for(let[index,tlv]in iter){if(tlv.tag===tag){return tlv;}}
return null;},};BerTlvHelperObject.prototype[BER_FCP_TEMPLATE_TAG]=function BER_FCP_TEMPLATE_TAG(value,length){return this.processFcpTemplate(value,length);};BerTlvHelperObject.prototype[BER_PROACTIVE_COMMAND_TAG]=function BER_PROACTIVE_COMMAND_TAG(value,length){return this.processProactiveCommand(value,length);};BerTlvHelperObject.prototype[BER_FCP_FILE_SIZE_DATA_TAG]=function BER_FCP_FILE_SIZE_DATA_TAG(value,length){return this.retrieveFileSizeData(value,length);};BerTlvHelperObject.prototype[BER_FCP_FILE_DESCRIPTOR_TAG]=function BER_FCP_FILE_DESCRIPTOR_TAG(value,length){return this.retrieveFileDescriptor(value,length);};BerTlvHelperObject.prototype[BER_FCP_FILE_IDENTIFIER_TAG]=function BER_FCP_FILE_IDENTIFIER_TAG(value,length){return this.retrieveFileIdentifier(value,length);};function ComprehensionTlvHelperObject(aContext){this.context=aContext;}
ComprehensionTlvHelperObject.prototype={context:null,decode(value){let GsmPDUHelper=this.context.GsmPDUHelper;let hlen=0;let temp=GsmPDUHelper.processHexToInt(value.slice(0,2),16);hlen++; let tag,cr;switch(temp){ case 0x0:case 0xff:case 0x80:throw new Error("Invalid octet when parsing Comprehension TLV :"+temp);case 0x7f:tag=GsmPDUHelper.processHexToInt(value.slice(2,6),16);hlen+=2;cr=(tag&0x8000)!==0;tag&=~0x8000;break;default:tag=temp;cr=(tag&0x80)!==0;tag&=~0x80;}
 
let length;temp=GsmPDUHelper.processHexToInt(value.slice(hlen*2,hlen*2+2),16);hlen++;if(temp<0x80){length=temp;}else if(temp==0x81){length=GsmPDUHelper.processHexToInt(value.slice(hlen*2,hlen*2+2),16);hlen++;if(length<0x80){throw new Error("Invalid length in Comprehension TLV :"+length);}}else if(temp==0x82){length=GsmPDUHelper.processHexToInt(value.slice(hlen*2,hlen*2+4),16);hlen+=2;if(length<0x0100){throw new Error("Invalid length in 3-byte Comprehension TLV :"+length);}}else if(temp==0x83){length=GsmPDUHelper.processHexToInt(value.slice(hlen*2,hlen*2+6),16);hlen+=3;if(length<0x010000){throw new Error("Invalid length in 4-byte Comprehension TLV :"+length);}}else{throw new Error("Invalid octet in Comprehension TLV :"+temp);}
let decodeValue=value.slice(hlen*2);let ctlv={tag,length,value:this.context.StkProactiveCmdHelper.retrieve(tag,decodeValue,length),cr,hlen,};return ctlv;},decodeChunks(value,length){let chunks=[];let index=0;while(index<length){let tlv=this.decode(value);chunks.push(tlv);index+=tlv.length;index+=tlv.hlen;value=value.slice((tlv.length+tlv.hlen)*2);}
return chunks;},writeLocationInfoTlv(loc){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_LOCATION_INFO|COMPREHENSIONTLV_FLAG_CR);GsmPDUHelper.writeHexOctet(loc.gsmCellId>0xffff?9:7);










 let mcc=loc.mcc,mnc;if(loc.mnc.length==2){mnc="F"+loc.mnc;}else{mnc=loc.mnc[2]+loc.mnc[0]+loc.mnc[1];}
GsmPDUHelper.writeSwappedNibbleBCD(mcc+mnc); GsmPDUHelper.writeHexOctet((loc.gsmLocationAreaCode>>8)&0xff);GsmPDUHelper.writeHexOctet(loc.gsmLocationAreaCode&0xff); if(loc.gsmCellId>0xffff){GsmPDUHelper.writeHexOctet((loc.gsmCellId>>24)&0xff);GsmPDUHelper.writeHexOctet((loc.gsmCellId>>16)&0xff);GsmPDUHelper.writeHexOctet((loc.gsmCellId>>8)&0xff);GsmPDUHelper.writeHexOctet(loc.gsmCellId&0xff);}else{GsmPDUHelper.writeHexOctet((loc.gsmCellId>>8)&0xff);GsmPDUHelper.writeHexOctet(loc.gsmCellId&0xff);}},writeCauseTlv(geckoError){let GsmPDUHelper=this.context.GsmPDUHelper;let cause=-1;for(let errorNo in RIL_CALL_FAILCAUSE_TO_GECKO_CALL_ERROR){if(geckoError==RIL_CALL_FAILCAUSE_TO_GECKO_CALL_ERROR[errorNo]){cause=errorNo;break;}}

if(cause>127){return;}
cause=cause==-1?Ci.nsIRilResponseResult.RADIO_ERROR_NONE:cause;GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_CAUSE|COMPREHENSIONTLV_FLAG_CR);GsmPDUHelper.writeHexOctet(2);
 GsmPDUHelper.writeHexOctet(0x60);GsmPDUHelper.writeHexOctet(0x80|cause);},writeDateTimeZoneTlv(date){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_DATE_TIME_ZONE);GsmPDUHelper.writeHexOctet(7);GsmPDUHelper.writeTimestamp(date);},writeLanguageTlv(language){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_LANGUAGE);GsmPDUHelper.writeHexOctet(2);
 GsmPDUHelper.writeHexOctet(PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT].indexOf(language[0]));GsmPDUHelper.writeHexOctet(PDU_NL_LOCKING_SHIFT_TABLES[PDU_NL_IDENTIFIER_DEFAULT].indexOf(language[1]));},writeTimerValueTlv(seconds,cr){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_TIMER_VALUE|(cr?COMPREHENSIONTLV_FLAG_CR:0));GsmPDUHelper.writeHexOctet(3);
GsmPDUHelper.writeSwappedNibbleBCDNum(Math.floor(seconds/60/60));GsmPDUHelper.writeSwappedNibbleBCDNum(Math.floor(seconds/60)%60);GsmPDUHelper.writeSwappedNibbleBCDNum(Math.floor(seconds)%60);},writeTextStringTlv(text,coding){let GsmPDUHelper=this.context.GsmPDUHelper;let buf=GsmPDUHelper.writeWithBuffer(()=>{GsmPDUHelper.writeHexOctet(coding);switch(coding){case STK_TEXT_CODING_UCS2:GsmPDUHelper.writeUCS2String(text);break;case STK_TEXT_CODING_GSM_7BIT_PACKED:GsmPDUHelper.writeStringAsSeptets(text,0,0,0);break;case STK_TEXT_CODING_GSM_8BIT:GsmPDUHelper.writeStringAs8BitUnpacked(text);break;}});let length=buf.length;if(length){GsmPDUHelper.writeHexOctet(COMPREHENSIONTLV_TAG_TEXT_STRING|COMPREHENSIONTLV_FLAG_CR);this.writeLength(length);for(let i=0;i<length;i++){GsmPDUHelper.writeHexOctet(buf[i]);}}},getSizeOfLengthOctets(length){if(length>=0x10000){return 4;}else if(length>=0x100){return 3;}else if(length>=0x80){return 2;}
return 1;},writeLength(length){let GsmPDUHelper=this.context.GsmPDUHelper; if(length<0x80){GsmPDUHelper.writeHexOctet(length);}else if(0x80<=length&&length<0x100){GsmPDUHelper.writeHexOctet(0x81);GsmPDUHelper.writeHexOctet(length);}else if(0x100<=length&&length<0x10000){GsmPDUHelper.writeHexOctet(0x82);GsmPDUHelper.writeHexOctet((length>>8)&0xff);GsmPDUHelper.writeHexOctet(length&0xff);}else if(0x10000<=length&&length<0x1000000){GsmPDUHelper.writeHexOctet(0x83);GsmPDUHelper.writeHexOctet((length>>16)&0xff);GsmPDUHelper.writeHexOctet((length>>8)&0xff);GsmPDUHelper.writeHexOctet(length&0xff);}else{throw new Error("Invalid length value :"+length);}},};function StkProactiveCmdHelperObject(aContext){this.context=aContext;}
StkProactiveCmdHelperObject.prototype={context:null,retrieve(tag,value,length){let method=this[tag];if(typeof method!="function"){if(DEBUG){this.context.debug("Unknown comprehension tag "+tag.toString(16));}
return null;}
return method.call(this,value,length);},retrieveCommandDetails(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;let cmdDetails={commandNumber:GsmPDUHelper.processHexToInt(value.slice(0,2),16),typeOfCommand:GsmPDUHelper.processHexToInt(value.slice(2,4),16),commandQualifier:GsmPDUHelper.processHexToInt(value.slice(4,6),16),};return cmdDetails;},retrieveDeviceId(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;let deviceId={sourceId:GsmPDUHelper.processHexToInt(value.slice(0,2),16),destinationId:GsmPDUHelper.processHexToInt(value.slice(2,4),16),};return deviceId;},retrieveAlphaId(value,length){let alphaId={identifier:this.context.ICCPDUHelper.readAlphaIdentifier(value,length),};return alphaId;},retrieveDuration(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let duration={timeUnit:GsmPDUHelper.readHexOctet(),timeInterval:GsmPDUHelper.readHexOctet(),};return duration;},retrieveAddress(value,length){this.context.GsmPDUHelper.initWith(value);let address={number:this.context.ICCPDUHelper.readDiallingNumber(length),};return address;},retrieveTextString(value,length){if(!length){return{textString:null};}
let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let text={codingScheme:GsmPDUHelper.readHexOctet(),};length--;switch(text.codingScheme&0x0c){case STK_TEXT_CODING_GSM_7BIT_PACKED:text.textString=GsmPDUHelper.readSeptetsToString(Math.floor((length*8)/7),0,0,0);break;case STK_TEXT_CODING_GSM_8BIT:
 value=value.slice(2); text.textString=this.context.ICCPDUHelper.read8BitUnpackedToString(value,length);break;case STK_TEXT_CODING_UCS2:text.textString=GsmPDUHelper.readUCS2String(length);break;}
return text;},retrieveTone(value,length){this.context.GsmPDUHelper.initWith(value);let tone={tone:this.context.GsmPDUHelper.readHexOctet(),};return tone;},retrieveItem(value,length){


if(!length){return null;}
let identifier=this.context.GsmPDUHelper.processHexToInt(value.slice(0,2),16);value=value.slice(2);let item={identifier,text:this.context.ICCPDUHelper.readAlphaIdentifier(value,length-1),};return item;},retrieveItemId(value,length){this.context.GsmPDUHelper.initWith(value);let itemId={identifier:this.context.GsmPDUHelper.readHexOctet(),};return itemId;},retrieveResponseLength(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let rspLength={minLength:GsmPDUHelper.readHexOctet(),maxLength:GsmPDUHelper.readHexOctet(),};return rspLength;},retrieveFileList(value,length){this.context.GsmPDUHelper.initWith(value);let num=this.context.GsmPDUHelper.readHexOctet();let fileList="";length--;for(let i=0;i<2*length;i++){fileList+=this.context.GsmPDUHelper.readHexNibble();}
return{fileList,};},retrieveDefaultText(value,length){let text=this.retrieveTextString(value,length);return text;},retrieveEventList(value,length){if(!length){
return null;}
let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let eventList=[];for(let i=0;i<length;i++){eventList.push(GsmPDUHelper.readHexOctet());}
return{eventList,};},retrieveIconId(value,length){if(!length){return null;}
this.context.GsmPDUHelper.initWith(value);let iconId={qualifier:this.context.GsmPDUHelper.readHexOctet(),identifier:this.context.GsmPDUHelper.readHexOctet(),};return iconId;},retrieveIconIdList(value,length){if(!length){return null;}
this.context.GsmPDUHelper.initWith(value);let iconIdList={qualifier:this.context.GsmPDUHelper.readHexOctet(),identifiers:[],};for(let i=0;i<length-1;i++){iconIdList.identifiers.push(this.context.GsmPDUHelper.readHexOctet());}
return iconIdList;},retrieveTimerId(value,length){this.context.GsmPDUHelper.initWith(value);let id={timerId:this.context.GsmPDUHelper.readHexOctet(),};return id;},retrieveTimerValue(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let timer={timerValue:GsmPDUHelper.readSwappedNibbleBcdNum(1)*60*60+
GsmPDUHelper.readSwappedNibbleBcdNum(1)*60+
GsmPDUHelper.readSwappedNibbleBcdNum(1),};this.context.debug("StkProactiveCmdHelperObject retrieveTimerValue timer: "+
JSON.stringify(timer));return timer;},retrieveImmediaResponse(value,length){return{};},retrieveUrl(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let s="";for(let i=0;i<length;i++){s+=String.fromCharCode(GsmPDUHelper.readHexOctet());}
return{url:s};},retrieveNextActionList(value,length){let GsmPDUHelper=this.context.GsmPDUHelper;GsmPDUHelper.initWith(value);let nextActionList=[];for(let i=0;i<length;i++){nextActionList.push(GsmPDUHelper.readHexOctet());}
return nextActionList;},searchForTag(tag,ctlvs){let ctlv=null;ctlvs.forEach(aCtlv=>{if((aCtlv.tag&~COMPREHENSIONTLV_FLAG_CR)==tag){ctlv=aCtlv;}});return ctlv;},searchForSelectedTags(ctlvs,tags){let ret={retrieve(aTag){return this[aTag]?this[aTag].shift():null;},};ctlvs.forEach(aCtlv=>{tags.forEach(aTag=>{if((aCtlv.tag&~COMPREHENSIONTLV_FLAG_CR)==aTag){if(!ret[aTag]){ret[aTag]=[];}
ret[aTag].push(aCtlv);}});});return ret;},};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_COMMAND_DETAILS]=function COMPREHENSIONTLV_TAG_COMMAND_DETAILS(value,length){return this.retrieveCommandDetails(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_DEVICE_ID]=function COMPREHENSIONTLV_TAG_DEVICE_ID(value,length){return this.retrieveDeviceId(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ALPHA_ID]=function COMPREHENSIONTLV_TAG_ALPHA_ID(value,length){return this.retrieveAlphaId(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_DURATION]=function COMPREHENSIONTLV_TAG_DURATION(value,length){return this.retrieveDuration(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ADDRESS]=function COMPREHENSIONTLV_TAG_ADDRESS(value,length){return this.retrieveAddress(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_TEXT_STRING]=function COMPREHENSIONTLV_TAG_TEXT_STRING(value,length){return this.retrieveTextString(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_TONE]=function COMPREHENSIONTLV_TAG_TONE(value,length){return this.retrieveTone(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ITEM]=function COMPREHENSIONTLV_TAG_ITEM(value,length){return this.retrieveItem(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ITEM_ID]=function COMPREHENSIONTLV_TAG_ITEM_ID(value,length){return this.retrieveItemId(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_RESPONSE_LENGTH]=function COMPREHENSIONTLV_TAG_RESPONSE_LENGTH(value,length){return this.retrieveResponseLength(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_FILE_LIST]=function COMPREHENSIONTLV_TAG_FILE_LIST(value,length){return this.retrieveFileList(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_DEFAULT_TEXT]=function COMPREHENSIONTLV_TAG_DEFAULT_TEXT(value,length){return this.retrieveDefaultText(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_EVENT_LIST]=function COMPREHENSIONTLV_TAG_EVENT_LIST(value,length){return this.retrieveEventList(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ICON_ID]=function COMPREHENSIONTLV_TAG_ICON_ID(value,length){return this.retrieveIconId(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_ICON_ID_LIST]=function COMPREHENSIONTLV_TAG_ICON_ID_LIST(value,length){return this.retrieveIconIdList(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_TIMER_IDENTIFIER]=function COMPREHENSIONTLV_TAG_TIMER_IDENTIFIER(value,length){return this.retrieveTimerId(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_TIMER_VALUE]=function COMPREHENSIONTLV_TAG_TIMER_VALUE(value,length){return this.retrieveTimerValue(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_IMMEDIATE_RESPONSE]=function COMPREHENSIONTLV_TAG_IMMEDIATE_RESPONSE(value,length){return this.retrieveImmediaResponse(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_URL]=function COMPREHENSIONTLV_TAG_URL(value,length){return this.retrieveUrl(value,length);};StkProactiveCmdHelperObject.prototype[COMPREHENSIONTLV_TAG_NEXT_ACTION_IND]=function COMPREHENSIONTLV_TAG_NEXT_ACTION_IND(value,length){return this.retrieveNextActionList(value,length);};function StkCommandParamsFactoryObject(aContext){this.context=aContext;}
StkCommandParamsFactoryObject.prototype={context:null,createParam(cmdDetails,ctlvs,onComplete){let method=this[cmdDetails.typeOfCommand];if(typeof method!="function"){if(DEBUG){this.context.debug("Unknown proactive command "+cmdDetails.typeOfCommand.toString(16));}
return;}
method.call(this,cmdDetails,ctlvs,onComplete);},loadIcons(iconIdCtlvs,callback){if(!iconIdCtlvs||!this.context.ICCUtilsHelper.isICCServiceAvailable("IMG")){callback(null);return;}
let onerror=function(){callback(null);};let onsuccess=function(aIcons){callback(aIcons);};this.context.IconLoader.loadIcons(iconIdCtlvs.map(aCtlv=>aCtlv.value.identifier),onsuccess,onerror);},appendIconIfNecessary(iconIdCtlvs,result,onComplete){this.loadIcons(iconIdCtlvs,aIcons=>{if(aIcons){result.icons=aIcons[0];result.iconSelfExplanatory=iconIdCtlvs[0].value.qualifier==0;}
onComplete(result);});},processRefresh(cmdDetails,ctlvs,onComplete){let refreshType=cmdDetails.commandQualifier;switch(refreshType){case STK_REFRESH_FILE_CHANGE:case STK_REFRESH_NAA_INIT_AND_FILE_CHANGE:let ctlv=this.context.StkProactiveCmdHelper.searchForTag(COMPREHENSIONTLV_TAG_FILE_LIST,ctlvs);if(ctlv){let list=ctlv.value.fileList;if(DEBUG){this.context.debug("Refresh, list = "+list);}
this.context.ICCRecordHelper.fetchICCRecords();}
break;}
onComplete(null);},processPollInterval(cmdDetails,ctlvs,onComplete){let ctlv=this.context.StkProactiveCmdHelper.searchForTag(COMPREHENSIONTLV_TAG_DURATION,ctlvs);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Poll Interval: Required value missing : Duration");}
onComplete(ctlv.value);},processPollOff(cmdDetails,ctlvs,onComplete){onComplete(null);},processSetUpEventList(cmdDetails,ctlvs,onComplete){let ctlv=this.context.StkProactiveCmdHelper.searchForTag(COMPREHENSIONTLV_TAG_EVENT_LIST,ctlvs);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Event List: Required value missing : Event List");}
onComplete(ctlv.value||{eventList:null});},processSetupMenu(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let menu={isHelpAvailable:!!(cmdDetails.commandQualifier&0x80),};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_ITEM,COMPREHENSIONTLV_TAG_ITEM_ID,COMPREHENSIONTLV_TAG_NEXT_ACTION_IND,COMPREHENSIONTLV_TAG_ICON_ID,COMPREHENSIONTLV_TAG_ICON_ID_LIST,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){menu.title=ctlv.value.identifier;}
let menuCtlvs=selectedCtlvs[COMPREHENSIONTLV_TAG_ITEM];if(!menuCtlvs){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Menu: Required value missing : items");}
menu.items=menuCtlvs.map(aCtlv=>aCtlv.value);ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ITEM_ID);if(ctlv){menu.defaultItem=ctlv.value.identifier-1;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_NEXT_ACTION_IND);if(ctlv){menu.nextActionList=ctlv.value;}
let iconIdCtlvs=null;let menuIconCtlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ICON_ID);if(menuIconCtlv){iconIdCtlvs=[menuIconCtlv];}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ICON_ID_LIST);if(ctlv){if(!iconIdCtlvs){iconIdCtlvs=[];}
let iconIdList=ctlv.value;iconIdCtlvs=iconIdCtlvs.concat(iconIdList.identifiers.map(aId=>{return{value:{qualifier:iconIdList.qualifier,identifier:aId},};}));}
this.loadIcons(iconIdCtlvs,aIcons=>{if(aIcons){if(menuIconCtlv){menu.iconSelfExplanatory=iconIdCtlvs.shift().value.qualifier==0;menu.icons=aIcons.shift();}
for(let i=0;i<aIcons.length;i++){menu.items[i].icons=aIcons[i];menu.items[i].iconSelfExplanatory=iconIdCtlvs[i].value.qualifier==0;}}
onComplete(menu);});},processSelectItem(cmdDetails,ctlvs,onComplete){this.processSetupMenu(cmdDetails,ctlvs,menu=>{menu.presentationType=cmdDetails.commandQualifier&0x03;onComplete(menu);});},processDisplayText(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let textMsg={isHighPriority:!!(cmdDetails.commandQualifier&0x01),userClear:!!(cmdDetails.commandQualifier&0x80),};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_TEXT_STRING,COMPREHENSIONTLV_TAG_IMMEDIATE_RESPONSE,COMPREHENSIONTLV_TAG_DURATION,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TEXT_STRING);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Display Text: Required value missing : Text String");}
textMsg.text=ctlv.value.textString;if(DEBUG){this.context.debug("processDisplayText, text = "+textMsg.text);} 
if(!textMsg.text){if(DEBUG){this.context.debug("processDisplayText, text empty, through error CMD_DATA_NOT_UNDERSTOOD");}
this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_CMD_DATA_NOT_UNDERSTOOD,});throw new Error("Stk Display Text: Required value empty : Text String");}
textMsg.responseNeeded=!!selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_IMMEDIATE_RESPONSE);ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DURATION);if(ctlv){textMsg.duration=ctlv.value;}
this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,textMsg,onComplete);},processSetUpIdleModeText(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let textMsg={};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_TEXT_STRING,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TEXT_STRING);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Set Up Idle Text: Required value missing : Text String");}
textMsg.text=ctlv.value.textString;this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,textMsg,onComplete);},processGetInkey(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let input={minLength:1,maxLength:1,isAlphabet:!!(cmdDetails.commandQualifier&0x01),isUCS2:!!(cmdDetails.commandQualifier&0x02),
isYesNoRequested:!!(cmdDetails.commandQualifier&0x04),isHelpAvailable:!!(cmdDetails.commandQualifier&0x80),};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_TEXT_STRING,COMPREHENSIONTLV_TAG_DURATION,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TEXT_STRING);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Get InKey: Required value missing : Text String");}
input.text=ctlv.value.textString;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DURATION);if(ctlv){input.duration=ctlv.value;}
this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,input,onComplete);},processGetInput(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let input={isAlphabet:!!(cmdDetails.commandQualifier&0x01),isUCS2:!!(cmdDetails.commandQualifier&0x02), hideInput:!!(cmdDetails.commandQualifier&0x04), isPacked:!!(cmdDetails.commandQualifier&0x08),isHelpAvailable:!!(cmdDetails.commandQualifier&0x80),};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_TEXT_STRING,COMPREHENSIONTLV_TAG_RESPONSE_LENGTH,COMPREHENSIONTLV_TAG_DEFAULT_TEXT,COMPREHENSIONTLV_TAG_DURATION,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TEXT_STRING);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Get Input: Required value missing : Text String");}
input.text=ctlv.value.textString;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_RESPONSE_LENGTH);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Get Input: Required value missing : Response Length");}
input.minLength=ctlv.value.minLength;input.maxLength=ctlv.value.maxLength;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DEFAULT_TEXT);if(ctlv){input.defaultText=ctlv.value.textString;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DURATION);if(ctlv){input.duration=ctlv.value;}
this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,input,onComplete);},processEventNotify(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let textMsg={};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){textMsg.text=ctlv.value.identifier;}




if(textMsg.text!==""){this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,textMsg,onComplete);}},processSetupCall(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let call={};let confirmMessage={};let callMessage={};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_ADDRESS,COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_ICON_ID,COMPREHENSIONTLV_TAG_DURATION,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ADDRESS);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Set Up Call: Required value missing : Address");}
call.address=ctlv.value.number;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){confirmMessage.text=ctlv.value.identifier;call.confirmMessage=confirmMessage;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){callMessage.text=ctlv.value.identifier;call.callMessage=callMessage;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DURATION);if(ctlv){call.duration=ctlv.value;}
let iconIdCtlvs=selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null;this.loadIcons(iconIdCtlvs,aIcons=>{if(aIcons){confirmMessage.icons=aIcons[0];confirmMessage.iconSelfExplanatory=iconIdCtlvs[0].value.qualifier==0;call.confirmMessage=confirmMessage;if(aIcons.length>1){callMessage.icons=aIcons[1];callMessage.iconSelfExplanatory=iconIdCtlvs[1].value.qualifier==0;call.callMessage=callMessage;}}
onComplete(call);});},processLaunchBrowser(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let browser={mode:cmdDetails.commandQualifier&0x03,};let confirmMessage={};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_URL,COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_URL);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Launch Browser: Required value missing : URL");}
browser.url=ctlv.value.url;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){confirmMessage.text=ctlv.value.identifier;browser.confirmMessage=confirmMessage;}
let iconIdCtlvs=selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null;this.loadIcons(iconIdCtlvs,aIcons=>{if(aIcons){confirmMessage.icons=aIcons[0];confirmMessage.iconSelfExplanatory=iconIdCtlvs[0].value.qualifier==0;browser.confirmMessage=confirmMessage;}
onComplete(browser);});},processPlayTone(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let playTone={isVibrate:!!(cmdDetails.commandQualifier&0x01),};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_TONE,COMPREHENSIONTLV_TAG_DURATION,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){playTone.text=ctlv.value.identifier;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TONE);if(ctlv){playTone.tone=ctlv.value.tone;}
ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_DURATION);if(ctlv){playTone.duration=ctlv.value;}
this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,playTone,onComplete);},processProvideLocalInfo(cmdDetails,ctlvs,onComplete){let provideLocalInfo={localInfoType:cmdDetails.commandQualifier,};onComplete(provideLocalInfo);},processTimerManagement(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let timer={timerAction:cmdDetails.commandQualifier,};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_TIMER_IDENTIFIER,COMPREHENSIONTLV_TAG_TIMER_VALUE,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TIMER_IDENTIFIER);if(!ctlv){this.context.RIL.processSendStkTerminalResponse({command:cmdDetails,resultCode:STK_RESULT_REQUIRED_VALUES_MISSING,});throw new Error("Stk Timer Management: Required value missing : Timer Identifier");}
timer.timerId=ctlv.value.timerId;ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_TIMER_VALUE);if(ctlv){timer.timerValue=ctlv.value.timerValue;}
onComplete(timer);},processBipMessage(cmdDetails,ctlvs,onComplete){let StkProactiveCmdHelper=this.context.StkProactiveCmdHelper;let bipMsg={};let selectedCtlvs=StkProactiveCmdHelper.searchForSelectedTags(ctlvs,[COMPREHENSIONTLV_TAG_ALPHA_ID,COMPREHENSIONTLV_TAG_ICON_ID,]);let ctlv=selectedCtlvs.retrieve(COMPREHENSIONTLV_TAG_ALPHA_ID);if(ctlv){bipMsg.text=ctlv.value.identifier;}
this.appendIconIfNecessary(selectedCtlvs[COMPREHENSIONTLV_TAG_ICON_ID]||null,bipMsg,onComplete);},};StkCommandParamsFactoryObject.prototype[STK_CMD_REFRESH]=function STK_CMD_REFRESH(cmdDetails,ctlvs,onComplete){return this.processRefresh(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_POLL_INTERVAL]=function STK_CMD_POLL_INTERVAL(cmdDetails,ctlvs,onComplete){return this.processPollInterval(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_POLL_OFF]=function STK_CMD_POLL_OFF(cmdDetails,ctlvs,onComplete){return this.processPollOff(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_PROVIDE_LOCAL_INFO]=function STK_CMD_PROVIDE_LOCAL_INFO(cmdDetails,ctlvs,onComplete){return this.processProvideLocalInfo(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SET_UP_EVENT_LIST]=function STK_CMD_SET_UP_EVENT_LIST(cmdDetails,ctlvs,onComplete){return this.processSetUpEventList(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SET_UP_MENU]=function STK_CMD_SET_UP_MENU(cmdDetails,ctlvs,onComplete){return this.processSetupMenu(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SELECT_ITEM]=function STK_CMD_SELECT_ITEM(cmdDetails,ctlvs,onComplete){return this.processSelectItem(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_DISPLAY_TEXT]=function STK_CMD_DISPLAY_TEXT(cmdDetails,ctlvs,onComplete){return this.processDisplayText(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SET_UP_IDLE_MODE_TEXT]=function STK_CMD_SET_UP_IDLE_MODE_TEXT(cmdDetails,ctlvs,onComplete){return this.processSetUpIdleModeText(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_GET_INKEY]=function STK_CMD_GET_INKEY(cmdDetails,ctlvs,onComplete){return this.processGetInkey(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_GET_INPUT]=function STK_CMD_GET_INPUT(cmdDetails,ctlvs,onComplete){return this.processGetInput(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SEND_SS]=function STK_CMD_SEND_SS(cmdDetails,ctlvs,onComplete){return this.processEventNotify(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SEND_USSD]=function STK_CMD_SEND_USSD(cmdDetails,ctlvs,onComplete){return this.processEventNotify(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SEND_SMS]=function STK_CMD_SEND_SMS(cmdDetails,ctlvs,onComplete){return this.processEventNotify(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SEND_DTMF]=function STK_CMD_SEND_DTMF(cmdDetails,ctlvs,onComplete){return this.processEventNotify(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SET_UP_CALL]=function STK_CMD_SET_UP_CALL(cmdDetails,ctlvs,onComplete){return this.processSetupCall(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_LAUNCH_BROWSER]=function STK_CMD_LAUNCH_BROWSER(cmdDetails,ctlvs,onComplete){return this.processLaunchBrowser(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_PLAY_TONE]=function STK_CMD_PLAY_TONE(cmdDetails,ctlvs,onComplete){return this.processPlayTone(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_TIMER_MANAGEMENT]=function STK_CMD_TIMER_MANAGEMENT(cmdDetails,ctlvs,onComplete){return this.processTimerManagement(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_OPEN_CHANNEL]=function STK_CMD_OPEN_CHANNEL(cmdDetails,ctlvs,onComplete){return this.processBipMessage(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_CLOSE_CHANNEL]=function STK_CMD_CLOSE_CHANNEL(cmdDetails,ctlvs,onComplete){return this.processBipMessage(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_RECEIVE_DATA]=function STK_CMD_RECEIVE_DATA(cmdDetails,ctlvs,onComplete){return this.processBipMessage(cmdDetails,ctlvs,onComplete);};StkCommandParamsFactoryObject.prototype[STK_CMD_SEND_DATA]=function STK_CMD_SEND_DATA(cmdDetails,ctlvs,onComplete){return this.processBipMessage(cmdDetails,ctlvs,onComplete);};this.EXPORTED_SYMBOLS=Object.keys(this);