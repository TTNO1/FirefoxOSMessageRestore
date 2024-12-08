//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DownloadUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PluralForm","resource://gre/modules/PluralForm.jsm");const MS_PER_DAY=24*60*60*1000;var localeNumberFormatCache=new Map();function getLocaleNumberFormat(fractionDigits){if(!localeNumberFormatCache.has(fractionDigits)){localeNumberFormatCache.set(fractionDigits,new Services.intl.NumberFormat(undefined,{maximumFractionDigits:fractionDigits,minimumFractionDigits:fractionDigits,}));}
return localeNumberFormatCache.get(fractionDigits);}
const kDownloadProperties="chrome://mozapps/locale/downloads/downloads.properties";var gStr={statusFormat:"statusFormat3",statusFormatInfiniteRate:"statusFormatInfiniteRate",statusFormatNoRate:"statusFormatNoRate",transferSameUnits:"transferSameUnits2",transferDiffUnits:"transferDiffUnits2",transferNoTotal:"transferNoTotal2",timePair:"timePair3",timeLeftSingle:"timeLeftSingle3",timeLeftDouble:"timeLeftDouble3",timeFewSeconds:"timeFewSeconds2",timeUnknown:"timeUnknown2",yesterday:"yesterday",doneScheme:"doneScheme2",doneFileScheme:"doneFileScheme",units:["bytes","kilobyte","megabyte","gigabyte"], timeUnits:["shortSeconds","shortMinutes","shortHours","shortDays"],infiniteRate:"infiniteRate",};Object.defineProperty(this,"gBundle",{configurable:true,enumerable:true,get(){delete this.gBundle;return(this.gBundle=Services.strings.createBundle(kDownloadProperties));},});
const kCachedLastMaxSize=10;var gCachedLast=[];var DownloadUtils={getDownloadStatus:function DU_getDownloadStatus(aCurrBytes,aMaxBytes,aSpeed,aLastSec){let[transfer,timeLeft,newLast,normalizedSpeed,]=this._deriveTransferRate(aCurrBytes,aMaxBytes,aSpeed,aLastSec);let[rate,unit]=DownloadUtils.convertByteUnits(normalizedSpeed);let status;if(rate==="Infinity"){let params=[transfer,gBundle.GetStringFromName(gStr.infiniteRate),timeLeft,];status=gBundle.formatStringFromName(gStr.statusFormatInfiniteRate,params);}else{let params=[transfer,rate,unit,timeLeft];status=gBundle.formatStringFromName(gStr.statusFormat,params);}
return[status,newLast];},getDownloadStatusNoRate:function DU_getDownloadStatusNoRate(aCurrBytes,aMaxBytes,aSpeed,aLastSec){let[transfer,timeLeft,newLast]=this._deriveTransferRate(aCurrBytes,aMaxBytes,aSpeed,aLastSec);let params=[transfer,timeLeft];let status=gBundle.formatStringFromName(gStr.statusFormatNoRate,params);return[status,newLast];},_deriveTransferRate:function DU__deriveTransferRate(aCurrBytes,aMaxBytes,aSpeed,aLastSec){if(aMaxBytes==null){aMaxBytes=-1;}
if(aSpeed==null){aSpeed=-1;}
if(aLastSec==null){aLastSec=Infinity;} 
let seconds=aSpeed>0&&aMaxBytes>0?(aMaxBytes-aCurrBytes)/aSpeed:-1;let transfer=DownloadUtils.getTransferTotal(aCurrBytes,aMaxBytes);let[timeLeft,newLast]=DownloadUtils.getTimeLeft(seconds,aLastSec);return[transfer,timeLeft,newLast,aSpeed];},getTransferTotal:function DU_getTransferTotal(aCurrBytes,aMaxBytes){if(aMaxBytes==null){aMaxBytes=-1;}
let[progress,progressUnits]=DownloadUtils.convertByteUnits(aCurrBytes);let[total,totalUnits]=DownloadUtils.convertByteUnits(aMaxBytes); let name,values;if(aMaxBytes<0){name=gStr.transferNoTotal;values=[progress,progressUnits];}else if(progressUnits==totalUnits){name=gStr.transferSameUnits;values=[progress,total,totalUnits];}else{name=gStr.transferDiffUnits;values=[progress,progressUnits,total,totalUnits];}
return gBundle.formatStringFromName(name,values);},getTimeLeft:function DU_getTimeLeft(aSeconds,aLastSec){let nf=new Services.intl.NumberFormat();if(aLastSec==null){aLastSec=Infinity;}
if(aSeconds<0){return[gBundle.GetStringFromName(gStr.timeUnknown),aLastSec];} 
aLastSec=gCachedLast.reduce((aResult,aItem)=>(aItem[0]==aSeconds?aItem[1]:aResult),aLastSec); gCachedLast.push([aSeconds,aLastSec]);if(gCachedLast.length>kCachedLastMaxSize){gCachedLast.shift();}

 
if(aSeconds>aLastSec/2){
let diff=aSeconds-aLastSec;aSeconds=aLastSec+(diff<0?0.3:0.1)*diff; let diffPct=(diff/aLastSec)*100;if(Math.abs(diff)<5||Math.abs(diffPct)<5){aSeconds=aLastSec-(diff<0?0.4:0.2);}} 
let timeLeft;if(aSeconds<4){ timeLeft=gBundle.GetStringFromName(gStr.timeFewSeconds);}else{ let[time1,unit1,time2,unit2]=DownloadUtils.convertTimeUnits(aSeconds);let pair1=gBundle.formatStringFromName(gStr.timePair,[nf.format(time1),unit1,]);let pair2=gBundle.formatStringFromName(gStr.timePair,[nf.format(time2),unit2,]);if((aSeconds<3600&&time1>=4)||time2==0){timeLeft=gBundle.formatStringFromName(gStr.timeLeftSingle,[pair1]);}else{ timeLeft=gBundle.formatStringFromName(gStr.timeLeftDouble,[pair1,pair2,]);}}
return[timeLeft,aSeconds];},getReadableDates:function DU_getReadableDates(aDate,aNow){if(!aNow){aNow=new Date();} 
let today=new Date(aNow.getFullYear(),aNow.getMonth(),aNow.getDate());let dateTimeCompact;let dateTimeFull;if(aDate>=today){let dts=new Services.intl.DateTimeFormat(undefined,{timeStyle:"short",});dateTimeCompact=dts.format(aDate);}else if(today-aDate<MS_PER_DAY){ dateTimeCompact=gBundle.GetStringFromName(gStr.yesterday);}else if(today-aDate<6*MS_PER_DAY){ dateTimeCompact=aDate.toLocaleDateString(undefined,{weekday:"long",});}else{ dateTimeCompact=aDate.toLocaleString(undefined,{month:"long",day:"numeric",});}
const dtOptions={dateStyle:"long",timeStyle:"short"};dateTimeFull=new Services.intl.DateTimeFormat(undefined,dtOptions).format(aDate);return[dateTimeCompact,dateTimeFull];},getURIHost:function DU_getURIHost(aURIString){let idnService=Cc["@mozilla.org/network/idn-service;1"].getService(Ci.nsIIDNService); let uri;try{uri=Services.io.newURI(aURIString);}catch(ex){return["",""];}
if(uri instanceof Ci.nsINestedURI){uri=uri.innermostURI;}
let fullHost;try{fullHost=uri.host;}catch(e){fullHost="";}
let displayHost;try{ let baseDomain=Services.eTLD.getBaseDomain(uri); displayHost=idnService.convertToDisplayIDN(baseDomain,{});}catch(e){ displayHost=fullHost;} 
if(uri.scheme=="file"){ displayHost=gBundle.GetStringFromName(gStr.doneFileScheme);fullHost=displayHost;}else if(!displayHost.length){displayHost=gBundle.formatStringFromName(gStr.doneScheme,[uri.scheme]);fullHost=displayHost;}else if(uri.port!=-1){ let port=":"+uri.port;displayHost+=port;fullHost+=port;}
return[displayHost,fullHost];},convertByteUnits:function DU_convertByteUnits(aBytes){let unitIndex=0;
 while(aBytes>=999.5&&unitIndex<gStr.units.length-1){aBytes/=1024;unitIndex++;}

 
let fractionDigits=aBytes>0&&aBytes<100&&unitIndex!=0?1:0;if(aBytes===Infinity){aBytes="Infinity";}else{aBytes=getLocaleNumberFormat(fractionDigits).format(aBytes);}
return[aBytes,gBundle.GetStringFromName(gStr.units[unitIndex])];},convertTimeUnits:function DU_convertTimeUnits(aSecs){
 let timeSize=[60,60,24];let time=aSecs;let scale=1;let unitIndex=0;
 while(unitIndex<timeSize.length&&time>=timeSize[unitIndex]){time/=timeSize[unitIndex];scale*=timeSize[unitIndex];unitIndex++;}
let value=convertTimeUnitsValue(time);let units=convertTimeUnitsUnits(value,unitIndex);let extra=aSecs-value*scale;let nextIndex=unitIndex-1; for(let index=0;index<nextIndex;index++){extra/=timeSize[index];}
let value2=convertTimeUnitsValue(extra);let units2=convertTimeUnitsUnits(value2,nextIndex);return[value,units,value2,units2];},};function convertTimeUnitsValue(aTime){return Math.floor(aTime);}
function convertTimeUnitsUnits(aTime,aIndex){ if(aIndex<0){return"";}
return PluralForm.get(aTime,gBundle.GetStringFromName(gStr.timeUnits[aIndex]));}