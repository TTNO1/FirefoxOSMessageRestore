//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DownloadStore"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");XPCOMUtils.defineLazyGetter(this,"gTextDecoder",function(){return new TextDecoder();});XPCOMUtils.defineLazyGetter(this,"gTextEncoder",function(){return new TextEncoder();});var DownloadStore=function(aList,aPath){this.list=aList;this.path=aPath;};DownloadStore.prototype={list:null,path:"",onsaveitem:()=>true,load:function DS_load(){return(async()=>{let bytes;try{bytes=await IOUtils.read(this.path);}catch(ex){if(!(ex.name=="NotFoundError")){throw ex;}
return;}
let storeData=JSON.parse(gTextDecoder.decode(bytes));for(let downloadData of storeData.list){try{let download=await Downloads.createDownload(downloadData);try{if(!download.succeeded&&!download.canceled&&!download.error){
download.start().catch(()=>{});}else{

await download.refresh();}}finally{await this.list.add(download);}}catch(ex){Cu.reportError(ex);}}})();},save:function DS_save(){return(async()=>{let downloads=await this.list.getAll();let storeData={list:[]};let atLeastOneDownload=false;for(let download of downloads){try{if(!this.onsaveitem(download)){continue;}
let serializable=download.toSerializable();if(!serializable){continue;}
storeData.list.push(serializable);atLeastOneDownload=true;}catch(ex){
Cu.reportError(ex);}}
if(atLeastOneDownload){let bytes=gTextEncoder.encode(JSON.stringify(storeData));await IOUtils.writeAtomic(this.path,bytes,{tmpPath:this.path+".tmp",});}else{try{await IOUtils.remove(this.path);}catch(ex){if(!(ex.name=="NotFoundError"||ex.name=="NotAllowedError")){throw ex;}

}}})();},};