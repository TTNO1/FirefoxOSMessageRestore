"use strict";






const global=this;var EXPORTED_SYMBOLS=["Kinto"];(function(global,factory){typeof exports==='object'&&typeof module!=='undefined'?module.exports=factory():typeof define==='function'&&define.amd?define(factory):(global=global||self,global.Kinto=factory());}(this,(function(){'use strict';class BaseAdapter{clear(){throw new Error("Not Implemented.");}
execute(callback,options={preload:[]}){throw new Error("Not Implemented.");}
get(id){throw new Error("Not Implemented.");}
list(params={filters:{},order:""}){throw new Error("Not Implemented.");}
saveLastModified(lastModified){throw new Error("Not Implemented.");}
getLastModified(){throw new Error("Not Implemented.");}
importBulk(records){throw new Error("Not Implemented.");}
loadDump(records){throw new Error("Not Implemented.");}
saveMetadata(metadata){throw new Error("Not Implemented.");}
getMetadata(){throw new Error("Not Implemented.");}}
const RE_RECORD_ID=/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;function _isUndefined(value){return typeof value==="undefined";}
function sortObjects(order,list){const hasDash=order[0]==="-";const field=hasDash?order.slice(1):order;const direction=hasDash?-1:1;return list.slice().sort((a,b)=>{if(a[field]&&_isUndefined(b[field])){return direction;}
if(b[field]&&_isUndefined(a[field])){return-direction;}
if(_isUndefined(a[field])&&_isUndefined(b[field])){return 0;}
return a[field]>b[field]?direction:-direction;});}
function filterObject(filters,entry){return Object.keys(filters).every(filter=>{const value=filters[filter];if(Array.isArray(value)){return value.some(candidate=>candidate===entry[filter]);}
else if(typeof value==="object"){return filterObject(value,entry[filter]);}
else if(!Object.prototype.hasOwnProperty.call(entry,filter)){console.error(`The property ${filter} does not exist`);return false;}
return entry[filter]===value;});}
function waterfall(fns,init){if(!fns.length){return Promise.resolve(init);}
return fns.reduce((promise,nextFn)=>{return promise.then(nextFn);},Promise.resolve(init));}
function deepEqual(a,b){if(a===b){return true;}
if(typeof a!==typeof b){return false;}
if(!(a&&typeof a=="object")||!(b&&typeof b=="object")){return false;}
if(Object.keys(a).length!==Object.keys(b).length){return false;}
for(const k in a){if(!deepEqual(a[k],b[k])){return false;}}
return true;}
function omitKeys(obj,keys=[]){const result=Object.assign({},obj);for(const key of keys){delete result[key];}
return result;}
function arrayEqual(a,b){if(a.length!==b.length){return false;}
for(let i=a.length;i--;){if(a[i]!==b[i]){return false;}}
return true;}
function makeNestedObjectFromArr(arr,val,nestedFiltersObj){const last=arr.length-1;return arr.reduce((acc,cv,i)=>{if(i===last){return(acc[cv]=val);}
else if(Object.prototype.hasOwnProperty.call(acc,cv)){return acc[cv];}
else{return(acc[cv]={});}},nestedFiltersObj);}
function transformSubObjectFilters(filtersObj){const transformedFilters={};for(const key in filtersObj){const keysArr=key.split(".");const val=filtersObj[key];makeNestedObjectFromArr(keysArr,val,transformedFilters);}
return transformedFilters;}
const INDEXED_FIELDS=["id","_status","last_modified"];async function open(dbname,{version,onupgradeneeded}){return new Promise((resolve,reject)=>{const request=indexedDB.open(dbname,version);request.onupgradeneeded=event=>{const db=event.target.result;db.onerror=event=>reject(event.target.error);const transaction=event.target.transaction;transaction.onabort=event=>{const error=event.target.error||transaction.error||new DOMException("The operation has been aborted","AbortError");reject(error);};return onupgradeneeded(event);};request.onerror=event=>{reject(event.target.error);};request.onsuccess=event=>{const db=event.target.result;resolve(db);};});}
async function execute(db,name,callback,options={}){const{mode}=options;return new Promise((resolve,reject)=>{
const transaction=mode?db.transaction([name],mode):db.transaction([name]);const store=transaction.objectStore(name);const abort=e=>{transaction.abort();reject(e);};let result;try{result=callback(store,abort);}
catch(e){abort(e);}
transaction.onerror=event=>reject(event.target.error);transaction.oncomplete=event=>resolve(result);transaction.onabort=event=>{const error=event.target.error||transaction.error||new DOMException("The operation has been aborted","AbortError");reject(error);};});}
async function deleteDatabase(dbName){return new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(dbName);request.onsuccess=event=>resolve(event.target);request.onerror=event=>reject(event.target.error);});}
const cursorHandlers={all(filters,done){const results=[];return event=>{const cursor=event.target.result;if(cursor){const{value}=cursor;if(filterObject(filters,value)){results.push(value);}
cursor.continue();}
else{done(results);}};},in(values,filters,done){const results=[];let i=0;return function(event){const cursor=event.target.result;if(!cursor){done(results);return;}
const{key,value}=cursor;
while(key>values[i]){++i;if(i===values.length){done(results);return;}}
const isEqual=Array.isArray(key)?arrayEqual(key,values[i]):key===values[i];if(isEqual){if(filterObject(filters,value)){results.push(value);}
cursor.continue();}
else{cursor.continue(values[i]);}};},};function createListRequest(cid,store,filters,done){const filterFields=Object.keys(filters);if(filterFields.length==0){const request=store.index("cid").getAll(IDBKeyRange.only(cid));request.onsuccess=event=>done(event.target.result);return request;}
const indexField=filterFields.find(field=>{return INDEXED_FIELDS.includes(field);});if(!indexField){const isSubQuery=Object.keys(filters).some(key=>key.includes("."));if(isSubQuery){const newFilter=transformSubObjectFilters(filters);const request=store.index("cid").openCursor(IDBKeyRange.only(cid));request.onsuccess=cursorHandlers.all(newFilter,done);return request;}
const request=store.index("cid").openCursor(IDBKeyRange.only(cid));request.onsuccess=cursorHandlers.all(filters,done);return request;}
const remainingFilters=omitKeys(filters,[indexField]);const value=filters[indexField];const indexStore=indexField=="id"?store:store.index(indexField); if(Array.isArray(value)){if(value.length===0){return done([]);}
const values=value.map(i=>[cid,i]).sort();const range=IDBKeyRange.bound(values[0],values[values.length-1]);const request=indexStore.openCursor(range);request.onsuccess=cursorHandlers.in(values,remainingFilters,done);return request;}
if(remainingFilters.length==0){const request=indexStore.getAll(IDBKeyRange.only([cid,value]));request.onsuccess=event=>done(event.target.result);return request;} 
const request=indexStore.openCursor(IDBKeyRange.only([cid,value]));request.onsuccess=cursorHandlers.all(remainingFilters,done);return request;}
class IDBError extends Error{constructor(method,err){super(`IndexedDB ${method}() ${err.message}`);this.name=err.name;this.stack=err.stack;}}
class IDB extends BaseAdapter{static get IDBError(){return IDBError;}
constructor(cid,options={}){super();this.cid=cid;this.dbName=options.dbName||"KintoDB";this._options=options;this._db=null;}
_handleError(method,err){throw new IDBError(method,err);}
async open(){if(this._db){return this;}

const dataToMigrate=this._options.migrateOldData?await migrationRequired(this.cid):null;this._db=await open(this.dbName,{version:2,onupgradeneeded:event=>{const db=event.target.result;if(event.oldVersion<1){ const recordsStore=db.createObjectStore("records",{keyPath:["_cid","id"],});recordsStore.createIndex("cid","_cid");recordsStore.createIndex("_status",["_cid","_status"]); recordsStore.createIndex("last_modified",["_cid","last_modified"]); db.createObjectStore("timestamps",{keyPath:"cid",});}
if(event.oldVersion<2){ db.createObjectStore("collections",{keyPath:"cid",});}},});if(dataToMigrate){const{records,timestamp}=dataToMigrate;await this.importBulk(records);await this.saveLastModified(timestamp);console.log(`${this.cid}: data was migrated successfully.`);await deleteDatabase(this.cid);console.warn(`${this.cid}: old database was deleted.`);}
return this;}
close(){if(this._db){this._db.close(); this._db=null;}
return Promise.resolve();}
async prepare(name,callback,options){await this.open();await execute(this._db,name,callback,options);}
async clear(){try{await this.prepare("records",store=>{const range=IDBKeyRange.only(this.cid);const request=store.index("cid").openKeyCursor(range);request.onsuccess=event=>{const cursor=event.target.result;if(cursor){store.delete(cursor.primaryKey);cursor.continue();}};return request;},{mode:"readwrite"});}
catch(e){this._handleError("clear",e);}}
async execute(callback,options={preload:[]}){




let result;await this.prepare("records",(store,abort)=>{const runCallback=(preloaded=[])=>{const proxy=transactionProxy(this,store,preloaded);try{const returned=callback(proxy);if(returned instanceof Promise){throw new Error("execute() callback should not return a Promise.");}
result=returned;}
catch(e){abort(e);}};if(!options.preload.length){return runCallback();}
const filters={id:options.preload};createListRequest(this.cid,store,filters,records=>{const preloaded={};for(const record of records){delete record["_cid"];preloaded[record.id]=record;}
runCallback(preloaded);});},{mode:"readwrite"});return result;}
async get(id){try{let record;await this.prepare("records",store=>{store.get([this.cid,id]).onsuccess=e=>(record=e.target.result);});return record;}
catch(e){this._handleError("get",e);}}
async list(params={filters:{}}){const{filters}=params;try{let results=[];await this.prepare("records",store=>{createListRequest(this.cid,store,filters,_results=>{for(const result of _results){delete result["_cid"];}
results=_results;});});return params.order?sortObjects(params.order,results):results;}
catch(e){this._handleError("list",e);}}
async saveLastModified(lastModified){const value=parseInt(lastModified,10)||null;try{await this.prepare("timestamps",store=>{if(value===null){store.delete(this.cid);}
else{store.put({cid:this.cid,value});}},{mode:"readwrite"});return value;}
catch(e){this._handleError("saveLastModified",e);}}
async getLastModified(){try{let entry=null;await this.prepare("timestamps",store=>{store.get(this.cid).onsuccess=e=>(entry=e.target.result);});return entry?entry.value:null;}
catch(e){this._handleError("getLastModified",e);}}
async loadDump(records){return this.importBulk(records);}
async importBulk(records){try{await this.execute(transaction=>{

let i=0;putNext();function putNext(){if(i==records.length){return;}
transaction.update(records[i]).onsuccess=putNext;++i;}});const previousLastModified=await this.getLastModified();const lastModified=Math.max(...records.map(record=>record.last_modified));if(lastModified>previousLastModified){await this.saveLastModified(lastModified);}
return records;}
catch(e){this._handleError("importBulk",e);}}
async saveMetadata(metadata){try{await this.prepare("collections",store=>store.put({cid:this.cid,metadata}),{mode:"readwrite"});return metadata;}
catch(e){this._handleError("saveMetadata",e);}}
async getMetadata(){try{let entry=null;await this.prepare("collections",store=>{store.get(this.cid).onsuccess=e=>(entry=e.target.result);});return entry?entry.metadata:null;}
catch(e){this._handleError("getMetadata",e);}}}
function transactionProxy(adapter,store,preloaded=[]){const _cid=adapter.cid;return{create(record){store.add(Object.assign(Object.assign({},record),{_cid}));},update(record){return store.put(Object.assign(Object.assign({},record),{_cid}));},delete(id){store.delete([_cid,id]);},get(id){return preloaded[id];},};}
async function migrationRequired(dbName){let exists=true;const db=await open(dbName,{version:1,onupgradeneeded:event=>{exists=false;},});exists&=db.objectStoreNames.contains("__meta__")&&db.objectStoreNames.contains(dbName);if(!exists){db.close();await deleteDatabase(dbName);return null;}
console.warn(`${dbName}: old IndexedDB database found.`);try{let records;await execute(db,dbName,store=>{store.openCursor().onsuccess=cursorHandlers.all({},res=>(records=res));});console.log(`${dbName}: found ${records.length} records.`);let timestamp=null;await execute(db,"__meta__",store=>{store.get(`${dbName}-lastModified`).onsuccess=e=>{timestamp=e.target.result?e.target.result.value:null;};});if(!timestamp){await execute(db,"__meta__",store=>{store.get("lastModified").onsuccess=e=>{timestamp=e.target.result?e.target.result.value:null;};});}
console.log(`${dbName}: ${timestamp ? "found" : "no"} timestamp.`);return{records,timestamp};}
catch(e){console.error("Error occured during migration",e);return null;}
finally{db.close();}}
var uuid4={};const RECORD_FIELDS_TO_CLEAN=["_status"];const AVAILABLE_HOOKS=["incoming-changes"];const IMPORT_CHUNK_SIZE=200;function recordsEqual(a,b,localFields=[]){const fieldsToClean=RECORD_FIELDS_TO_CLEAN.concat(["last_modified"]).concat(localFields);const cleanLocal=r=>omitKeys(r,fieldsToClean);return deepEqual(cleanLocal(a),cleanLocal(b));}
class SyncResultObject{constructor(){this.lastModified=null;this._lists={};["errors","created","updated","deleted","published","conflicts","skipped","resolved","void",].forEach(l=>(this._lists[l]=[]));this._cached={};}
add(type,entries){if(!Array.isArray(this._lists[type])){console.warn(`Unknown type "${type}"`);return;}
if(!Array.isArray(entries)){entries=[entries];}
this._lists[type]=this._lists[type].concat(entries);delete this._cached[type];return this;}
get ok(){return this.errors.length+this.conflicts.length===0;}
get errors(){return this._lists["errors"];}
get conflicts(){return this._lists["conflicts"];}
get skipped(){return this._deduplicate("skipped");}
get resolved(){return this._deduplicate("resolved");}
get created(){return this._deduplicate("created");}
get updated(){return this._deduplicate("updated");}
get deleted(){return this._deduplicate("deleted");}
get published(){return this._deduplicate("published");}
_deduplicate(list){if(!(list in this._cached)){
const recordsWithoutId=new Set();const recordsById=new Map();this._lists[list].forEach(record=>{if(!record.id){recordsWithoutId.add(record);}
else{recordsById.set(record.id,record);}});this._cached[list]=Array.from(recordsById.values()).concat(Array.from(recordsWithoutId));}
return this._cached[list];}
reset(type){this._lists[type]=[];delete this._cached[type];return this;}
toObject(){return{ok:this.ok,lastModified:this.lastModified,errors:this.errors,created:this.created,updated:this.updated,deleted:this.deleted,skipped:this.skipped,published:this.published,conflicts:this.conflicts,resolved:this.resolved,};}}
class ServerWasFlushedError extends Error{constructor(clientTimestamp,serverTimestamp,message){super(message);if(Error.captureStackTrace){Error.captureStackTrace(this,ServerWasFlushedError);}
this.clientTimestamp=clientTimestamp;this.serverTimestamp=serverTimestamp;}}
function createUUIDSchema(){return{generate(){return uuid4();},validate(id){return typeof id=="string"&&RE_RECORD_ID.test(id);},};}
function markStatus(record,status){return Object.assign(Object.assign({},record),{_status:status});}
function markDeleted(record){return markStatus(record,"deleted");}
function markSynced(record){return markStatus(record,"synced");}
function importChange(transaction,remote,localFields,strategy){const local=transaction.get(remote.id);if(!local){
if(remote.deleted){return{type:"skipped",data:remote};}
const synced=markSynced(remote);transaction.create(synced);return{type:"created",data:synced};}
const synced=Object.assign(Object.assign({},local),markSynced(remote));if(strategy===Collection.strategy.PULL_ONLY){if(remote.deleted){transaction.delete(remote.id);return{type:"deleted",data:local};}
transaction.update(synced);return{type:"updated",data:{old:local,new:synced}};}
const isIdentical=recordsEqual(local,remote,localFields);if(local._status!=="synced"){if(local._status==="deleted"){return{type:"skipped",data:local};}
if(isIdentical){

transaction.update(synced);return{type:"updated",data:{old:local,new:synced}};}
if(local.last_modified!==undefined&&local.last_modified===remote.last_modified){




return{type:"void"};}
return{type:"conflicts",data:{type:"incoming",local:local,remote:remote},};}
if(remote.deleted){transaction.delete(remote.id);return{type:"deleted",data:local};}
transaction.update(synced); const type=isIdentical?"void":"updated";return{type,data:{old:local,new:synced}};}
class Collection{constructor(bucket,name,kinto,options={}){this._bucket=bucket;this._name=name;this._lastModified=null;const DBAdapter=options.adapter||IDB;if(!DBAdapter){throw new Error("No adapter provided");}
const db=new DBAdapter(`${bucket}/${name}`,options.adapterOptions);if(!(db instanceof BaseAdapter)){throw new Error("Unsupported adapter.");} 
this.db=db;this.kinto=kinto;this.events=options.events;this.idSchema=this._validateIdSchema(options.idSchema);this.remoteTransformers=this._validateRemoteTransformers(options.remoteTransformers);this.hooks=this._validateHooks(options.hooks);this.localFields=options.localFields||[];}
get api(){return this.kinto.api;}
get name(){return this._name;}
get bucket(){return this._bucket;}
get lastModified(){return this._lastModified;}
static get strategy(){return{CLIENT_WINS:"client_wins",SERVER_WINS:"server_wins",PULL_ONLY:"pull_only",MANUAL:"manual",};}
_validateIdSchema(idSchema){if(typeof idSchema==="undefined"){return createUUIDSchema();}
if(typeof idSchema!=="object"){throw new Error("idSchema must be an object.");}
else if(typeof idSchema.generate!=="function"){throw new Error("idSchema must provide a generate function.");}
else if(typeof idSchema.validate!=="function"){throw new Error("idSchema must provide a validate function.");}
return idSchema;}
_validateRemoteTransformers(remoteTransformers){if(typeof remoteTransformers==="undefined"){return[];}
if(!Array.isArray(remoteTransformers)){throw new Error("remoteTransformers should be an array.");}
return remoteTransformers.map(transformer=>{if(typeof transformer!=="object"){throw new Error("A transformer must be an object.");}
else if(typeof transformer.encode!=="function"){throw new Error("A transformer must provide an encode function.");}
else if(typeof transformer.decode!=="function"){throw new Error("A transformer must provide a decode function.");}
return transformer;});}
_validateHook(hook){if(!Array.isArray(hook)){throw new Error("A hook definition should be an array of functions.");}
return hook.map(fn=>{if(typeof fn!=="function"){throw new Error("A hook definition should be an array of functions.");}
return fn;});}
_validateHooks(hooks){if(typeof hooks==="undefined"){return{};}
if(Array.isArray(hooks)){throw new Error("hooks should be an object, not an array.");}
if(typeof hooks!=="object"){throw new Error("hooks should be an object.");}
const validatedHooks={};for(const hook in hooks){if(!AVAILABLE_HOOKS.includes(hook)){throw new Error("The hook should be one of "+AVAILABLE_HOOKS.join(", "));}
validatedHooks[hook]=this._validateHook(hooks[hook]);}
return validatedHooks;}
async clear(){await this.db.clear();await this.db.saveMetadata(null);await this.db.saveLastModified(null);return{data:[],permissions:{}};}
_encodeRecord(type,record){if(!this[`${type}Transformers`].length){return Promise.resolve(record);}
return waterfall(this[`${type}Transformers`].map(transformer=>{return record=>transformer.encode(record);}),record);}
_decodeRecord(type,record){if(!this[`${type}Transformers`].length){return Promise.resolve(record);}
return waterfall(this[`${type}Transformers`].reverse().map(transformer=>{return record=>transformer.decode(record);}),record);}
create(record,options={useRecordId:false,synced:false}){
const reject=msg=>Promise.reject(new Error(msg));if(typeof record!=="object"){return reject("Record is not an object.");}
if((options.synced||options.useRecordId)&&!Object.prototype.hasOwnProperty.call(record,"id")){return reject("Missing required Id; synced and useRecordId options require one");}
if(!options.synced&&!options.useRecordId&&Object.prototype.hasOwnProperty.call(record,"id")){return reject("Extraneous Id; can't create a record having one set.");}
const newRecord=Object.assign(Object.assign({},record),{id:options.synced||options.useRecordId?record.id:this.idSchema.generate(record),_status:options.synced?"synced":"created"});if(!this.idSchema.validate(newRecord.id)){return reject(`Invalid Id: ${newRecord.id}`);}
return this.execute(txn=>txn.create(newRecord),{preloadIds:[newRecord.id],}).catch(err=>{if(options.useRecordId){throw new Error("Couldn't create record. It may have been virtually deleted.");}
throw err;});}
update(record,options={synced:false,patch:false}){

if(typeof record!=="object"){return Promise.reject(new Error("Record is not an object."));}
if(!Object.prototype.hasOwnProperty.call(record,"id")){return Promise.reject(new Error("Cannot update a record missing id."));}
if(!this.idSchema.validate(record.id)){return Promise.reject(new Error(`Invalid Id: ${record.id}`));}
return this.execute(txn=>txn.update(record,options),{preloadIds:[record.id],});}
upsert(record){

if(typeof record!=="object"){return Promise.reject(new Error("Record is not an object."));}
if(!Object.prototype.hasOwnProperty.call(record,"id")){return Promise.reject(new Error("Cannot update a record missing id."));}
if(!this.idSchema.validate(record.id)){return Promise.reject(new Error(`Invalid Id: ${record.id}`));}
return this.execute(txn=>txn.upsert(record),{preloadIds:[record.id]});}
get(id,options={includeDeleted:false}){return this.execute(txn=>txn.get(id,options),{preloadIds:[id]});}
getAny(id){return this.execute(txn=>txn.getAny(id),{preloadIds:[id]});}
delete(id,options={virtual:true}){return this.execute(transaction=>{return transaction.delete(id,options);},{preloadIds:[id]});}
async deleteAll(){const{data}=await this.list({},{includeDeleted:false});const recordIds=data.map(record=>record.id);return this.execute(transaction=>{return transaction.deleteAll(recordIds);},{preloadIds:recordIds});}
deleteAny(id){return this.execute(txn=>txn.deleteAny(id),{preloadIds:[id]});}
async list(params={},options={includeDeleted:false}){params=Object.assign({order:"-last_modified",filters:{}},params);const results=await this.db.list(params);let data=results;if(!options.includeDeleted){data=results.filter(record=>record._status!=="deleted");}
return{data,permissions:{}};}
async importChanges(syncResultObject,decodedChanges,strategy=Collection.strategy.MANUAL){try{for(let i=0;i<decodedChanges.length;i+=IMPORT_CHUNK_SIZE){const slice=decodedChanges.slice(i,i+IMPORT_CHUNK_SIZE);const{imports,resolved}=await this.db.execute(transaction=>{const imports=slice.map(remote=>{return importChange(transaction,remote,this.localFields,strategy);});const conflicts=imports.filter(i=>i.type==="conflicts").map(i=>i.data);const resolved=this._handleConflicts(transaction,conflicts,strategy);return{imports,resolved};},{preload:slice.map(record=>record.id)}); imports.forEach(({type,data})=>syncResultObject.add(type,data));if(resolved.length>0){syncResultObject.reset("conflicts").add("resolved",resolved);}}}
catch(err){const data={type:"incoming",message:err.message,stack:err.stack,}; syncResultObject.add("errors",data);}
return syncResultObject;}
async _applyPushedResults(syncResultObject,toApplyLocally,conflicts,strategy=Collection.strategy.MANUAL){const toDeleteLocally=toApplyLocally.filter(r=>r.deleted);const toUpdateLocally=toApplyLocally.filter(r=>!r.deleted);const{published,resolved}=await this.db.execute(transaction=>{const updated=toUpdateLocally.map(record=>{const synced=markSynced(record);transaction.update(synced);return synced;});const deleted=toDeleteLocally.map(record=>{transaction.delete(record.id); return{id:record.id,deleted:true};});const published=updated.concat(deleted); const resolved=this._handleConflicts(transaction,conflicts,strategy);return{published,resolved};});syncResultObject.add("published",published);if(resolved.length>0){syncResultObject.reset("conflicts").reset("resolved").add("resolved",resolved);}
return syncResultObject;}
_handleConflicts(transaction,conflicts,strategy){if(strategy===Collection.strategy.MANUAL){return[];}
return conflicts.map(conflict=>{const resolution=strategy===Collection.strategy.CLIENT_WINS?conflict.local:conflict.remote;const rejected=strategy===Collection.strategy.CLIENT_WINS?conflict.remote:conflict.local;let accepted,status,id;if(resolution===null){


transaction.delete(conflict.local.id);accepted=null;
status="synced";id=conflict.local.id;}
else{const updated=this._resolveRaw(conflict,resolution);transaction.update(updated);accepted=updated;status=updated._status;id=updated.id;}
return{rejected,accepted,id,_status:status};});}
execute(doOperations,{preloadIds=[]}={}){for(const id of preloadIds){if(!this.idSchema.validate(id)){return Promise.reject(Error(`Invalid Id: ${id}`));}}
return this.db.execute(transaction=>{const txn=new CollectionTransaction(this,transaction);const result=doOperations(txn);txn.emitEvents();return result;},{preload:preloadIds});}
async resetSyncStatus(){const unsynced=await this.list({filters:{_status:["deleted","synced"]},order:""},{includeDeleted:true});await this.db.execute(transaction=>{unsynced.data.forEach(record=>{if(record._status==="deleted"){transaction.delete(record.id);}
else{transaction.update(Object.assign(Object.assign({},record),{last_modified:undefined,_status:"created"}));}});});this._lastModified=null;await this.db.saveLastModified(null);return unsynced.data.length;}
async gatherLocalChanges(){const unsynced=await this.list({filters:{_status:["created","updated"]},order:"",});const deleted=await this.list({filters:{_status:"deleted"},order:""},{includeDeleted:true});return await Promise.all(unsynced.data.concat(deleted.data).map(this._encodeRecord.bind(this,"remote")));}
async pullChanges(client,syncResultObject,options={}){if(!syncResultObject.ok){return syncResultObject;}
const since=this.lastModified?this.lastModified:await this.db.getLastModified();options=Object.assign({strategy:Collection.strategy.MANUAL,lastModified:since,headers:{}},options);let filters;if(options.exclude){
 const exclude_id=options.exclude.slice(0,50).map(r=>r.id).join(",");filters={exclude_id};}
if(options.expectedTimestamp){filters=Object.assign(Object.assign({},filters),{_expected:options.expectedTimestamp});} 
const{data,last_modified}=await client.listRecords({since:options.lastModified?`${options.lastModified}`:undefined,headers:options.headers,retry:options.retry,pages:Infinity,filters,});
const unquoted=last_modified?parseInt(last_modified,10):undefined;
const localSynced=options.lastModified;const serverChanged=unquoted>options.lastModified;const emptyCollection=data.length===0;if(!options.exclude&&localSynced&&serverChanged&&emptyCollection){const e=new ServerWasFlushedError(localSynced,unquoted,"Server has been flushed. Client Side Timestamp: "+
localSynced+" Server Side Timestamp: "+
unquoted);throw e;}
 
syncResultObject.lastModified=unquoted;const decodedChanges=await Promise.all(data.map(change=>{return this._decodeRecord("remote",change);}));const payload={lastModified:unquoted,changes:decodedChanges};const afterHooks=await this.applyHook("incoming-changes",payload);if(afterHooks.changes.length>0){ await this.importChanges(syncResultObject,afterHooks.changes,options.strategy);}
return syncResultObject;}
applyHook(hookName,payload){if(typeof this.hooks[hookName]=="undefined"){return Promise.resolve(payload);}
return waterfall(this.hooks[hookName].map(hook=>{return record=>{const result=hook(payload,this);const resultThenable=result&&typeof result.then==="function";const resultChanges=result&&Object.prototype.hasOwnProperty.call(result,"changes");if(!(resultThenable||resultChanges)){throw new Error(`Invalid return value for hook: ${JSON.stringify(result)} has no 'then()' or 'changes' properties`);}
return result;};}),payload);}
async pushChanges(client,changes,syncResultObject,options={}){if(!syncResultObject.ok){return syncResultObject;}
const safe=!options.strategy||options.strategy!==Collection.CLIENT_WINS;const toDelete=changes.filter(r=>r._status=="deleted");const toSync=changes.filter(r=>r._status!="deleted");const synced=await client.batch(batch=>{toDelete.forEach(r=>{ if(r.last_modified){batch.deleteRecord(r);}});toSync.forEach(r=>{const published=this.cleanLocalFields(r);if(r._status==="created"){batch.createRecord(published);}
else{batch.updateRecord(published);}});},{headers:options.headers,retry:options.retry,safe,aggregate:true,}); syncResultObject.add("errors",synced.errors.map(e=>(Object.assign(Object.assign({},e),{type:"outgoing"})))); const conflicts=[];for(const{type,local,remote}of synced.conflicts){
const safeLocal=(local&&local.data)||{id:remote.id};const realLocal=await this._decodeRecord("remote",safeLocal);

const realRemote=remote&&(await this._decodeRecord("remote",remote));const conflict={type,local:realLocal,remote:realRemote};conflicts.push(conflict);}
syncResultObject.add("conflicts",conflicts);
const missingRemotely=synced.skipped.map(r=>(Object.assign(Object.assign({},r),{deleted:true})));

const published=synced.published.map(c=>c.data);const toApplyLocally=published.concat(missingRemotely); const decoded=await Promise.all(toApplyLocally.map(record=>{return this._decodeRecord("remote",record);}));
if(decoded.length>0||conflicts.length>0){await this._applyPushedResults(syncResultObject,decoded,conflicts,options.strategy);}
return syncResultObject;}
cleanLocalFields(record){const localKeys=RECORD_FIELDS_TO_CLEAN.concat(this.localFields);return omitKeys(record,localKeys);}
resolve(conflict,resolution){return this.db.execute(transaction=>{const updated=this._resolveRaw(conflict,resolution);transaction.update(updated);return{data:updated,permissions:{}};});}
_resolveRaw(conflict,resolution){const resolved=Object.assign(Object.assign({},resolution),{ last_modified:conflict.remote&&conflict.remote.last_modified});
const synced=deepEqual(resolved,conflict.remote);return markStatus(resolved,synced?"synced":"updated");}
async sync(options={strategy:Collection.strategy.MANUAL,headers:{},retry:1,ignoreBackoff:false,bucket:null,collection:null,remote:null,expectedTimestamp:null,}){options=Object.assign(Object.assign({},options),{bucket:options.bucket||this.bucket,collection:options.collection||this.name});const previousRemote=this.api.remote;if(options.remote){this.api.remote=options.remote;}
if(!options.ignoreBackoff&&this.api.backoff>0){const seconds=Math.ceil(this.api.backoff/1000);return Promise.reject(new Error(`Server is asking clients to back off; retry in ${seconds}s or use the ignoreBackoff option.`));}
const client=this.api.bucket(options.bucket).collection(options.collection);const result=new SyncResultObject();try{await this.pullMetadata(client,options);await this.pullChanges(client,result,options);const{lastModified}=result;if(options.strategy!=Collection.strategy.PULL_ONLY){ const toSync=await this.gatherLocalChanges(); await this.pushChanges(client,toSync,result,options);const resolvedUnsynced=result.resolved.filter(r=>r._status!=="synced");if(resolvedUnsynced.length>0){const resolvedEncoded=await Promise.all(resolvedUnsynced.map(resolution=>{let record=resolution.accepted;if(record===null){record={id:resolution.id,_status:resolution._status};}
return this._encodeRecord("remote",record);}));await this.pushChanges(client,resolvedEncoded,result,options);}
if(result.published.length>0){const pullOpts=Object.assign(Object.assign({},options),{lastModified,exclude:result.published});await this.pullChanges(client,result,pullOpts);}} 
if(result.ok){ this._lastModified=await this.db.saveLastModified(result.lastModified);}}
catch(e){this.events.emit("sync:error",Object.assign(Object.assign({},options),{error:e}));throw e;}
finally{ this.api.remote=previousRemote;}
this.events.emit("sync:success",Object.assign(Object.assign({},options),{result}));return result;}
async loadDump(records){return this.importBulk(records);}
async importBulk(records){if(!Array.isArray(records)){throw new Error("Records is not an array.");}
for(const record of records){if(!Object.prototype.hasOwnProperty.call(record,"id")||!this.idSchema.validate(record.id)){throw new Error("Record has invalid ID: "+JSON.stringify(record));}
if(!record.last_modified){throw new Error("Record has no last_modified value: "+JSON.stringify(record));}} 
const{data}=await this.list({},{includeDeleted:true});const existingById=data.reduce((acc,record)=>{acc[record.id]=record;return acc;},{});const newRecords=records.filter(record=>{const localRecord=existingById[record.id];const shouldKeep=localRecord===undefined||(localRecord._status==="synced"&& localRecord.last_modified!==undefined&&record.last_modified>localRecord.last_modified);return shouldKeep;});return await this.db.importBulk(newRecords.map(markSynced));}
async pullMetadata(client,options={}){const{expectedTimestamp,headers}=options;const query=expectedTimestamp?{query:{_expected:expectedTimestamp}}:undefined;const metadata=await client.getData(Object.assign(Object.assign({},query),{headers}));return this.db.saveMetadata(metadata);}
async metadata(){return this.db.getMetadata();}}
class CollectionTransaction{constructor(collection,adapterTransaction){this.collection=collection;this.adapterTransaction=adapterTransaction;this._events=[];}
_queueEvent(action,payload){this._events.push({action,payload});}
emitEvents(){for(const{action,payload}of this._events){this.collection.events.emit(action,payload);}
if(this._events.length>0){const targets=this._events.map(({action,payload})=>(Object.assign({action},payload)));this.collection.events.emit("change",{targets});}
this._events=[];}
getAny(id){const record=this.adapterTransaction.get(id);return{data:record,permissions:{}};}
get(id,options={includeDeleted:false}){const res=this.getAny(id);if(!res.data||(!options.includeDeleted&&res.data._status==="deleted")){throw new Error(`Record with id=${id} not found.`);}
return res;}
delete(id,options={virtual:true}){const existing=this.adapterTransaction.get(id);const alreadyDeleted=existing&&existing._status=="deleted";if(!existing||(alreadyDeleted&&options.virtual)){throw new Error(`Record with id=${id} not found.`);}
if(options.virtual){this.adapterTransaction.update(markDeleted(existing));}
else{this.adapterTransaction.delete(id);}
this._queueEvent("delete",{data:existing});return{data:existing,permissions:{}};}
deleteAll(ids){const existingRecords=[];ids.forEach(id=>{existingRecords.push(this.adapterTransaction.get(id));this.delete(id);});this._queueEvent("deleteAll",{data:existingRecords});return{data:existingRecords,permissions:{}};}
deleteAny(id){const existing=this.adapterTransaction.get(id);if(existing){this.adapterTransaction.update(markDeleted(existing));this._queueEvent("delete",{data:existing});}
return{data:Object.assign({id},existing),deleted:!!existing,permissions:{}};}
create(record){if(typeof record!=="object"){throw new Error("Record is not an object.");}
if(!Object.prototype.hasOwnProperty.call(record,"id")){throw new Error("Cannot create a record missing id");}
if(!this.collection.idSchema.validate(record.id)){throw new Error(`Invalid Id: ${record.id}`);}
this.adapterTransaction.create(record);this._queueEvent("create",{data:record});return{data:record,permissions:{}};}
update(record,options={synced:false,patch:false}){if(typeof record!=="object"){throw new Error("Record is not an object.");}
if(!Object.prototype.hasOwnProperty.call(record,"id")){throw new Error("Cannot update a record missing id.");}
if(!this.collection.idSchema.validate(record.id)){throw new Error(`Invalid Id: ${record.id}`);}
const oldRecord=this.adapterTransaction.get(record.id);if(!oldRecord){throw new Error(`Record with id=${record.id} not found.`);}
const newRecord=options.patch?Object.assign(Object.assign({},oldRecord),record):record;const updated=this._updateRaw(oldRecord,newRecord,options);this.adapterTransaction.update(updated);this._queueEvent("update",{data:updated,oldRecord});return{data:updated,oldRecord,permissions:{}};}
_updateRaw(oldRecord,newRecord,{synced=false}={}){const updated=Object.assign({},newRecord);if(oldRecord&&oldRecord.last_modified&&!updated.last_modified){updated.last_modified=oldRecord.last_modified;}
const isIdentical=oldRecord&&recordsEqual(oldRecord,updated,this.collection.localFields);const keepSynced=isIdentical&&oldRecord._status=="synced";const neverSynced=!oldRecord||(oldRecord&&oldRecord._status=="created");const newStatus=keepSynced||synced?"synced":neverSynced?"created":"updated";return markStatus(updated,newStatus);}
upsert(record){if(typeof record!=="object"){throw new Error("Record is not an object.");}
if(!Object.prototype.hasOwnProperty.call(record,"id")){throw new Error("Cannot update a record missing id.");}
if(!this.collection.idSchema.validate(record.id)){throw new Error(`Invalid Id: ${record.id}`);}
let oldRecord=this.adapterTransaction.get(record.id);const updated=this._updateRaw(oldRecord,record);this.adapterTransaction.update(updated); if(oldRecord&&oldRecord._status=="deleted"){oldRecord=undefined;}
if(oldRecord){this._queueEvent("update",{data:updated,oldRecord});}
else{this._queueEvent("create",{data:updated});}
return{data:updated,oldRecord,permissions:{}};}}
const DEFAULT_BUCKET_NAME="default";const DEFAULT_REMOTE="http://localhost:8888/v1";const DEFAULT_RETRY=1;class KintoBase{static get adapters(){return{BaseAdapter:BaseAdapter,};}
static get syncStrategy(){return Collection.strategy;}
constructor(options={}){const defaults={bucket:DEFAULT_BUCKET_NAME,remote:DEFAULT_REMOTE,retry:DEFAULT_RETRY,};this._options=Object.assign(Object.assign({},defaults),options);if(!this._options.adapter){throw new Error("No adapter provided");}
this._api=null;this.events=this._options.events;}
get api(){const{events,headers,remote,requestMode,retry,timeout,}=this._options;if(!this._api){this._api=new this.ApiClass(remote,{events,headers,requestMode,retry,timeout,});}
return this._api;}
collection(collName,options={}){if(!collName){throw new Error("missing collection name");}
const{bucket,events,adapter,adapterOptions}=Object.assign(Object.assign({},this._options),options);const{idSchema,remoteTransformers,hooks,localFields}=options;return new Collection(bucket,collName,this,{events,adapter,adapterOptions,idSchema,remoteTransformers,hooks,localFields,});}}
ChromeUtils.import("resource://gre/modules/Timer.jsm",global);const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(global,["fetch","indexedDB"]);ChromeUtils.defineModuleGetter(global,"EventEmitter","resource://gre/modules/EventEmitter.jsm");ChromeUtils.defineModuleGetter(global,"KintoHttpClient","resource://services-common/kinto-http-client.js");XPCOMUtils.defineLazyGetter(global,"generateUUID",()=>{const{generateUUID}=Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);return generateUUID;});class Kinto extends KintoBase{static get adapters(){return{BaseAdapter,IDB,};}
get ApiClass(){return KintoHttpClient;}
constructor(options={}){const events={};EventEmitter.decorate(events);const defaults={adapter:IDB,events,};super(Object.assign(Object.assign({},defaults),options));}
collection(collName,options={}){const idSchema={validate(id){return typeof id=="string"&&RE_RECORD_ID.test(id);},generate(){return generateUUID().toString().replace(/[{}]/g,"");},};return super.collection(collName,Object.assign({idSchema},options));}}
return Kinto;})));