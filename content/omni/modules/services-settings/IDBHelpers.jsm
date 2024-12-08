var EXPORTED_SYMBOLS=["IDBHelpers"];const DB_NAME="remote-settings";const DB_VERSION=3;if(typeof indexedDB=="undefined"){Cu.importGlobalProperties(["indexedDB"]);}
class IndexedDBError extends Error{constructor(error,method="",identifier=""){if(typeof error=="string"){error=new Error(error);}
super(`IndexedDB: ${identifier} ${method} ${error && error.message}`);this.name=error.name;this.stack=error.stack;}}
class ShutdownError extends IndexedDBError{constructor(error,method="",identifier=""){super(error,method,identifier);}}






function bulkOperationHelper(store,{reject,completion},operation,list,listIndex=0){try{const CHUNK_LENGTH=250;const max=Math.min(listIndex+CHUNK_LENGTH,list.length);let request;for(;listIndex<max;listIndex++){request=store[operation](list[listIndex]);}
if(listIndex<list.length){request.onsuccess=bulkOperationHelper.bind(null,store,{reject,completion},operation,list,listIndex);}else if(completion){completion();}
}catch(e){





reject(e);}}
function executeIDB(db,storeNames,mode,callback,desc){if(!Array.isArray(storeNames)){storeNames=[storeNames];}
const transaction=db.transaction(storeNames,mode);let promise=new Promise((resolve,reject)=>{let stores=storeNames.map(name=>transaction.objectStore(name));let result;let rejectWrapper=e=>{reject(new IndexedDBError(e,desc||"execute()",storeNames.join(", ")));try{transaction.abort();}catch(ex){Cu.reportError(ex);}};transaction.onerror=event=>reject(new IndexedDBError(event.target.error,desc||"execute()"));transaction.onabort=event=>reject(new IndexedDBError(event.target.error||transaction.error||"IDBTransaction aborted",desc||"execute()"));transaction.oncomplete=event=>resolve(result);if(stores.length==1){stores=stores[0];}
try{





result=callback(stores,rejectWrapper);}catch(e){rejectWrapper(e);}});return{promise,transaction};}
async function openIDB(allowUpgrades=true){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=event=>{if(!allowUpgrades){reject(new Error(`IndexedDB: Error accessing ${DB_NAME} IDB at version ${DB_VERSION}`));return;}
const transaction=event.target.transaction;transaction.onabort=event=>{const error=event.target.error||transaction.error||new DOMException("The operation has been aborted","AbortError");reject(new IndexedDBError(error,"open()"));};const db=event.target.result;db.onerror=event=>reject(new IndexedDBError(event.target.error));if(event.oldVersion<1){ const recordsStore=db.createObjectStore("records",{keyPath:["_cid","id"],});recordsStore.createIndex("cid","_cid"); recordsStore.createIndex("last_modified",["_cid","last_modified"]); db.createObjectStore("timestamps",{keyPath:"cid",});}
if(event.oldVersion<2){ db.createObjectStore("collections",{keyPath:"cid",});}
if(event.oldVersion<3){ db.createObjectStore("attachments",{keyPath:["cid","attachmentId"],});}};request.onerror=event=>reject(new IndexedDBError(event.target.error));request.onsuccess=event=>{const db=event.target.result;resolve(db);};});}
var IDBHelpers={bulkOperationHelper,executeIDB,openIDB,IndexedDBError,ShutdownError,};