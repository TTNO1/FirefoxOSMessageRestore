"use strict";ChromeUtils.defineModuleGetter(this,"ExtensionStorage","resource://gre/modules/ExtensionStorage.jsm");ChromeUtils.defineModuleGetter(this,"ExtensionStorageIDB","resource://gre/modules/ExtensionStorageIDB.jsm");ChromeUtils.defineModuleGetter(this,"ExtensionTelemetry","resource://gre/modules/ExtensionTelemetry.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");async function measureOp(telemetryMetric,extension,fn){const stopwatchKey={};telemetryMetric.stopwatchStart(extension,stopwatchKey);try{let result=await fn();telemetryMetric.stopwatchFinish(extension,stopwatchKey);return result;}catch(err){telemetryMetric.stopwatchCancel(extension,stopwatchKey);throw err;}}
this.storage=class extends ExtensionAPI{getLocalFileBackend(context,{deserialize,serialize}){return{get(keys){return measureOp(ExtensionTelemetry.storageLocalGetJSON,context.extension,()=>{return context.childManager.callParentAsyncFunction("storage.local.JSONFileBackend.get",[serialize(keys),]).then(deserialize);});},set(items){return measureOp(ExtensionTelemetry.storageLocalSetJSON,context.extension,()=>{return context.childManager.callParentAsyncFunction("storage.local.JSONFileBackend.set",[serialize(items)]);});},remove(keys){return context.childManager.callParentAsyncFunction("storage.local.JSONFileBackend.remove",[serialize(keys)]);},clear(){return context.childManager.callParentAsyncFunction("storage.local.JSONFileBackend.clear",[]);},};}
getLocalIDBBackend(context,{fireOnChanged,serialize,storagePrincipal}){let dbPromise;async function getDB(){if(dbPromise){return dbPromise;}
const persisted=context.extension.hasPermission("unlimitedStorage");dbPromise=ExtensionStorageIDB.open(storagePrincipal,persisted).catch(err=>{
dbPromise=null;throw err;});return dbPromise;}
return{get(keys){return measureOp(ExtensionTelemetry.storageLocalGetIDB,context.extension,async()=>{const db=await getDB();return db.get(keys);});},set(items){return measureOp(ExtensionTelemetry.storageLocalSetIDB,context.extension,async()=>{const db=await getDB();const changes=await db.set(items,{serialize:ExtensionStorage.serialize,});if(changes){fireOnChanged(changes);}});},async remove(keys){const db=await getDB();const changes=await db.remove(keys);if(changes){fireOnChanged(changes);}},async clear(){const db=await getDB();const changes=await db.clear(context.extension);if(changes){fireOnChanged(changes);}},};}
getAPI(context){const{extension}=context;const serialize=ExtensionStorage.serializeForContext.bind(null,context);const deserialize=ExtensionStorage.deserializeForContext.bind(null,context);function sanitize(items){
if(typeof items!="object"||items===null||Array.isArray(items)){return items;}




let sanitized={};for(let[key,value]of Object.entries(items)){sanitized[key]=ExtensionStorage.sanitize(value,context);}
return sanitized;}
function fireOnChanged(changes){

Services.cpmm.sendAsyncMessage(`Extension:StorageLocalOnChanged:${extension.uuid}`,changes);}


const getStorageLocalBackend=async()=>{const{backendEnabled,storagePrincipal,}=await ExtensionStorageIDB.selectBackend(context);if(!backendEnabled){return this.getLocalFileBackend(context,{deserialize,serialize});}
return this.getLocalIDBBackend(context,{storagePrincipal,fireOnChanged,serialize,});};let selectedBackend;const useStorageIDBBackend=extension.getSharedData("storageIDBBackend");if(useStorageIDBBackend===false){selectedBackend=this.getLocalFileBackend(context,{deserialize,serialize,});}else if(useStorageIDBBackend===true){selectedBackend=this.getLocalIDBBackend(context,{storagePrincipal:extension.getSharedData("storageIDBPrincipal"),fireOnChanged,serialize,});}
let promiseStorageLocalBackend;const local={};for(let method of["get","set","remove","clear"]){local[method]=async function(...args){try{if(!selectedBackend){if(!promiseStorageLocalBackend){promiseStorageLocalBackend=getStorageLocalBackend().catch(err=>{promiseStorageLocalBackend=null;throw err;});}

if(method!=="get"){try{const result=await context.childManager.callParentAsyncFunction("storage.local.callMethodInParentProcess",[method,args]);return result;}catch(err){

return Promise.reject(err);}}
selectedBackend=await promiseStorageLocalBackend;}
const result=await selectedBackend[method](...args);return result;}catch(err){throw ExtensionStorageIDB.normalizeStorageError({error:err,extensionId:extension.id,storageMethod:method,});}};}
return{storage:{local,sync:{get(keys){keys=sanitize(keys);return context.childManager.callParentAsyncFunction("storage.sync.get",[keys]);},set(items){items=sanitize(items);return context.childManager.callParentAsyncFunction("storage.sync.set",[items]);},},managed:{get(keys){return context.childManager.callParentAsyncFunction("storage.managed.get",[serialize(keys)]).then(deserialize);},set(items){return Promise.reject({message:"storage.managed is read-only"});},remove(keys){return Promise.reject({message:"storage.managed is read-only"});},clear(){return Promise.reject({message:"storage.managed is read-only"});},},onChanged:new EventManager({context,name:"storage.onChanged",register:fire=>{let onChanged=(data,area)=>{let changes=new context.cloneScope.Object();for(let[key,value]of Object.entries(data)){changes[key]=deserialize(value);}
fire.raw(changes,area);};let parent=context.childManager.getParentEvent("storage.onChanged");parent.addListener(onChanged);return()=>{parent.removeListener(onChanged);};},}).api(),},};}};