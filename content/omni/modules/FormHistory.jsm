//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["FormHistory"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");XPCOMUtils.defineLazyServiceGetter(this,"uuidService","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");ChromeUtils.defineModuleGetter(this,"OS","resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"Sqlite","resource://gre/modules/Sqlite.jsm");const DB_SCHEMA_VERSION=5;const DAY_IN_MS=86400000;const MAX_SEARCH_TOKENS=10;const NOOP=function noop(){};const DB_FILENAME="formhistory.sqlite";var supportsDeletedTable=AppConstants.platform=="android";var Prefs={initialized:false,get debug(){this.ensureInitialized();return this._debug;},get enabled(){this.ensureInitialized();return this._enabled;},get expireDays(){this.ensureInitialized();return this._expireDays;},ensureInitialized(){if(this.initialized){return;}
this.initialized=true;this._debug=Services.prefs.getBoolPref("browser.formfill.debug");this._enabled=Services.prefs.getBoolPref("browser.formfill.enable");this._expireDays=Services.prefs.getIntPref("browser.formfill.expire_days");},};function log(aMessage){if(Prefs.debug){Services.console.logStringMessage("FormHistory: "+aMessage);}}
function sendNotification(aType,aData){if(typeof aData=="string"){let strWrapper=Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);strWrapper.data=aData;aData=strWrapper;}else if(typeof aData=="number"){let intWrapper=Cc["@mozilla.org/supports-PRInt64;1"].createInstance(Ci.nsISupportsPRInt64);intWrapper.data=aData;aData=intWrapper;}else if(aData){throw Components.Exception("Invalid type "+typeof aType+" passed to sendNotification",Cr.NS_ERROR_ILLEGAL_VALUE);}
Services.obs.notifyObservers(aData,"satchel-storage-changed",aType);}
const dbSchema={tables:{moz_formhistory:{id:"INTEGER PRIMARY KEY",fieldname:"TEXT NOT NULL",value:"TEXT NOT NULL",timesUsed:"INTEGER",firstUsed:"INTEGER",lastUsed:"INTEGER",guid:"TEXT",},moz_deleted_formhistory:{id:"INTEGER PRIMARY KEY",timeDeleted:"INTEGER",guid:"TEXT",},moz_sources:{id:"INTEGER PRIMARY KEY",source:"TEXT NOT NULL",},moz_history_to_sources:{history_id:"INTEGER",source_id:"INTEGER",SQL:`
        PRIMARY KEY (history_id, source_id),
        FOREIGN KEY (history_id) REFERENCES moz_formhistory(id) ON DELETE CASCADE,
        FOREIGN KEY (source_id) REFERENCES moz_sources(id) ON DELETE CASCADE
      `,},},indices:{moz_formhistory_index:{table:"moz_formhistory",columns:["fieldname"],},moz_formhistory_lastused_index:{table:"moz_formhistory",columns:["lastUsed"],},moz_formhistory_guid_index:{table:"moz_formhistory",columns:["guid"],},},};const validFields=["fieldname","firstUsed","guid","lastUsed","source","timesUsed","value",];const searchFilters=["firstUsedStart","firstUsedEnd","lastUsedStart","lastUsedEnd","source",];function validateOpData(aData,aDataType){let thisValidFields=validFields;if(aDataType=="Update"&&"newGuid"in aData){thisValidFields=["guid","newGuid"];}
for(let field in aData){if(field!="op"&&!thisValidFields.includes(field)){throw Components.Exception(aDataType+" query contains an unrecognized field: "+field,Cr.NS_ERROR_ILLEGAL_VALUE);}}
return aData;}
function validateSearchData(aData,aDataType){for(let field in aData){if(field!="op"&&!validFields.includes(field)&&!searchFilters.includes(field)){throw Components.Exception(aDataType+" query contains an unrecognized field: "+field,Cr.NS_ERROR_ILLEGAL_VALUE);}}}
function makeQueryPredicates(aQueryData,delimiter=" AND "){let params={};let queryTerms=Object.keys(aQueryData).filter(field=>aQueryData[field]!==undefined).map(field=>{params[field]=aQueryData[field];switch(field){case"firstUsedStart":{return"firstUsed >= :"+field;}
case"firstUsedEnd":{return"firstUsed <= :"+field;}
case"lastUsedStart":{return"lastUsed >= :"+field;}
case"lastUsedEnd":{return"lastUsed <= :"+field;}
case"source":{return`EXISTS(
            SELECT 1 FROM moz_history_to_sources
            JOIN moz_sources s ON s.id = source_id
            WHERE source = :${field}
              AND history_id = moz_formhistory.id
          )`;}}
return field+" = :"+field;}).join(delimiter);return{queryTerms,params};}
function generateGUID(){let uuid=uuidService.generateUUID().toString();let raw=""; let bytes=0;for(let i=1;bytes<12;i+=2){ if(uuid[i]=="-"){i++;}
let hexVal=parseInt(uuid[i]+uuid[i+1],16);raw+=String.fromCharCode(hexVal);bytes++;}
return btoa(raw);}
var Migrators={async dbAsyncMigrateToVersion4(conn){const tableName="moz_deleted_formhistory";let tableExists=await conn.tableExists(tableName);if(!tableExists){await createTable(conn,tableName);}},async dbAsyncMigrateToVersion5(conn){if(!(await conn.tableExists("moz_sources"))){for(let tableName of["moz_history_to_sources","moz_sources"]){await createTable(conn,tableName);}}},};function prepareInsertQuery(change,now){let params={};for(let key of new Set([...Object.keys(change),"firstUsed","lastUsed","timesUsed",])){switch(key){case"fieldname":case"guid":case"value":params[key]=change[key];break;case"firstUsed":case"lastUsed":params[key]=change[key]||now;break;case"timesUsed":params[key]=change[key]||1;break;default:}}
return{query:`
      INSERT INTO moz_formhistory
        (fieldname, value, timesUsed, firstUsed, lastUsed, guid)
      VALUES (:fieldname, :value, :timesUsed, :firstUsed, :lastUsed, :guid)`,params,};}




var InProgressInserts={_inProgress:new Map(),add(fieldname,value){let fieldnameSet=this._inProgress.get(fieldname);if(!fieldnameSet){this._inProgress.set(fieldname,new Set([value]));return true;}
if(!fieldnameSet.has(value)){fieldnameSet.add(value);return true;}
return false;},clear(fieldnamesAndValues){for(let[fieldname,value]of fieldnamesAndValues){let fieldnameSet=this._inProgress.get(fieldname);if(fieldnameSet&&fieldnameSet.delete(value)&&fieldnameSet.size==0){this._inProgress.delete(fieldname);}}},};function getAddSourceToGuidQueries(source,guid){return[{query:`INSERT OR IGNORE INTO moz_sources (source) VALUES (:source)`,params:{source},},{query:`
        INSERT OR IGNORE INTO moz_history_to_sources (history_id, source_id)
        VALUES(
          (SELECT id FROM moz_formhistory WHERE guid = :guid),
          (SELECT id FROM moz_sources WHERE source = :source)
        )
      `,params:{guid,source},},];}
async function updateFormHistoryWrite(aChanges,aPreparedHandlers){log("updateFormHistoryWrite  "+aChanges.length); let now=Date.now()*1000;let queries=[];let notifications=[];let adds=[];let conn=await FormHistory.db;for(let change of aChanges){let operation=change.op;delete change.op;switch(operation){case"remove":{log("Remove from form history  "+change);let{queryTerms,params}=makeQueryPredicates(change);

if(change.source){await conn.executeCached(`DELETE FROM moz_history_to_sources
              WHERE source_id = (
                SELECT id FROM moz_sources WHERE source = :source
              )
              AND history_id = (
                SELECT id FROM moz_formhistory WHERE ${queryTerms}
              )
            `,params);break;}
try{let query="SELECT guid FROM moz_formhistory";if(queryTerms){query+=" WHERE "+queryTerms;}
await conn.executeCached(query,params,row=>{notifications.push(["formhistory-remove",row.getResultByName("guid"),]);});}catch(e){log("Error getting guids from moz_formhistory: "+e);}
if(supportsDeletedTable){log("Moving to deleted table "+change);let query="INSERT INTO moz_deleted_formhistory (guid, timeDeleted)";
 if(change.guid||queryTerms){query+=change.guid?" VALUES (:guid, :timeDeleted)":" SELECT guid, :timeDeleted FROM moz_formhistory WHERE "+
queryTerms;queries.push({query,params:Object.assign({timeDeleted:now},params),});}}
let query="DELETE FROM moz_formhistory";if(queryTerms){log("removeEntries");query+=" WHERE "+queryTerms;}else{log("removeAllEntries");
}
queries.push({query,params});queries.push({query:`
            DELETE FROM moz_sources WHERE id NOT IN (
              SELECT DISTINCT source_id FROM moz_history_to_sources
            )`,});break;}
case"update":{log("Update form history "+change);let guid=change.guid;delete change.guid;
if(change.newGuid){change.guid=change.newGuid;delete change.newGuid;}
let query="UPDATE moz_formhistory SET ";let{queryTerms,params}=makeQueryPredicates(change,", ");if(!queryTerms){throw Components.Exception("Update query must define fields to modify.",Cr.NS_ERROR_ILLEGAL_VALUE);}
query+=queryTerms+" WHERE guid = :existing_guid";queries.push({query,params:Object.assign({existing_guid:guid},params),});notifications.push(["formhistory-update",guid]);

break;}
case"bump":{log("Bump form history "+change);if(change.guid){let query="UPDATE moz_formhistory "+"SET timesUsed = timesUsed + 1, lastUsed = :lastUsed WHERE guid = :guid";let queryParams={lastUsed:now,guid:change.guid,};queries.push({query,params:queryParams});notifications.push(["formhistory-update",change.guid]);}else{if(!InProgressInserts.add(change.fieldname,change.value)){
continue;}
adds.push([change.fieldname,change.value]);change.guid=generateGUID();let{query,params}=prepareInsertQuery(change,now);queries.push({query,params});notifications.push(["formhistory-add",params.guid]);}
if(change.source){queries=queries.concat(getAddSourceToGuidQueries(change.source,change.guid));}
break;}
case"add":{if(!InProgressInserts.add(change.fieldname,change.value)){
continue;}
adds.push([change.fieldname,change.value]);log("Add to form history "+change);if(!change.guid){change.guid=generateGUID();}
let{query,params}=prepareInsertQuery(change,now);queries.push({query,params});notifications.push(["formhistory-add",params.guid]);if(change.source){queries=queries.concat(getAddSourceToGuidQueries(change.source,change.guid));}
break;}
default:{ throw Components.Exception("Invalid operation "+operation,Cr.NS_ERROR_ILLEGAL_VALUE);}}}
try{await runUpdateQueries(conn,queries);for(let[notification,param]of notifications){sendNotification(notification,param);}
aPreparedHandlers.handleCompletion(0);}catch(e){aPreparedHandlers.handleError(e);aPreparedHandlers.handleCompletion(1);}finally{InProgressInserts.clear(adds);}}
async function runUpdateQueries(conn,queries){await conn.executeTransaction(async()=>{for(let{query,params}of queries){await conn.executeCached(query,params);}});}
function expireOldEntriesDeletion(aExpireTime,aBeginningCount){log("expireOldEntriesDeletion("+aExpireTime+","+aBeginningCount+")");FormHistory.update([{op:"remove",lastUsedEnd:aExpireTime,},],{handleCompletion(){expireOldEntriesVacuum(aExpireTime,aBeginningCount);},handleError(aError){log("expireOldEntriesDeletionFailure");},});}
function expireOldEntriesVacuum(aExpireTime,aBeginningCount){FormHistory.count({},{handleResult(aEndingCount){if(aBeginningCount-aEndingCount>500){log("expireOldEntriesVacuum");FormHistory.db.then(async conn=>{try{await conn.executeCached("VACUUM");}catch(e){log("expireVacuumError");}});}
sendNotification("formhistory-expireoldentries",aExpireTime);},handleError(aError){log("expireEndCountFailure");},});}
async function createTable(conn,tableName){let table=dbSchema.tables[tableName];let columns=Object.keys(table).filter(col=>col!="SQL").map(col=>[col,table[col]].join(" ")).join(", ");let no_rowid=Object.keys(table).includes("id")?"":"WITHOUT ROWID";log("Creating table "+tableName+" with "+columns);await conn.execute(`CREATE TABLE ${tableName} (
      ${columns}
      ${table.SQL ? "," + table.SQL : ""}
    ) ${no_rowid}`);}
var DB={
_instance:null,
MAX_ATTEMPTS:2,get path(){return OS.Path.join(OS.Constants.Path.profileDir,DB_FILENAME);},get conn(){delete this.conn;let conn=(async()=>{try{this._instance=await this._establishConn();}catch(e){log("Failed to establish database connection: "+e);throw e;}
return this._instance;})();return(this.conn=conn);}, async _establishConn(attemptNum=0){log(`Establishing database connection - attempt # ${attemptNum}`);let conn;try{conn=await Sqlite.openConnection({path:this.path});Sqlite.shutdown.addBlocker("Closing FormHistory database.",()=>conn.close());}catch(e){
if(attemptNum<this.MAX_ATTEMPTS){log("Establishing connection failed.");await this._failover(conn);return this._establishConn(++attemptNum);}
if(conn){await conn.close();}
log("Establishing connection failed too many times. Giving up.");throw e;}
try{await conn.execute("PRAGMA foreign_keys = ON");let dbVersion=parseInt(await conn.getSchemaVersion(),10);if(dbVersion==DB_SCHEMA_VERSION){return conn;} 
if(dbVersion>DB_SCHEMA_VERSION){log("Downgrading to version "+DB_SCHEMA_VERSION);



if(!(await this._expectedColumnsPresent(conn))){throw Components.Exception("DB is missing expected columns",Cr.NS_ERROR_FILE_CORRUPTED);}


await conn.setSchemaVersion(DB_SCHEMA_VERSION);return conn;}



if(dbVersion>0&&dbVersion<3){throw Components.Exception("DB version is unsupported.",Cr.NS_ERROR_FILE_CORRUPTED);}
if(dbVersion==0){ await conn.executeTransaction(async()=>{log("Creating DB -- tables");for(let name in dbSchema.tables){await createTable(conn,name);}
log("Creating DB -- indices");for(let name in dbSchema.indices){let index=dbSchema.indices[name];let statement="CREATE INDEX IF NOT EXISTS "+
name+" ON "+
index.table+"("+
index.columns.join(", ")+")";await conn.execute(statement);}});}else{ await conn.executeTransaction(async()=>{for(let v=dbVersion+1;v<=DB_SCHEMA_VERSION;v++){log("Upgrading to version "+v+"...");await Migrators["dbAsyncMigrateToVersion"+v](conn);}});}
await conn.setSchemaVersion(DB_SCHEMA_VERSION);return conn;}catch(e){if(e.result!=Cr.NS_ERROR_FILE_CORRUPTED){throw e;}
if(attemptNum<this.MAX_ATTEMPTS){log("Setting up database failed.");await this._failover(conn);return this._establishConn(++attemptNum);}
if(conn){await conn.close();}
log("Setting up database failed too many times. Giving up.");throw e;}},async _failover(conn){log("Cleaning up DB file - close & remove & backup.");if(conn){await conn.close();}
let backupFile=this.path+".corrupt";let{file,path:uniquePath}=await OS.File.openUnique(backupFile,{humanReadable:true,});await file.close();await OS.File.copy(this.path,uniquePath);await OS.File.remove(this.path);log("Completed DB cleanup.");},async _expectedColumnsPresent(conn){for(let name in dbSchema.tables){let table=dbSchema.tables[name];let columns=Object.keys(table).filter(col=>col!="SQL");let query="SELECT "+columns.join(", ")+" FROM "+name;try{await conn.execute(query,null,(row,cancel)=>{cancel();});}catch(e){return false;}}
log("Verified that expected columns are present in DB.");return true;},};this.FormHistory={get db(){return DB.conn;},get enabled(){return Prefs.enabled;},_prepareHandlers(handlers){let defaultHandlers={handleResult:NOOP,handleError:NOOP,handleCompletion:NOOP,};if(!handlers){return defaultHandlers;}
if(handlers.handleResult){defaultHandlers.handleResult=handlers.handleResult;}
if(handlers.handleError){defaultHandlers.handleError=handlers.handleError;}
if(handlers.handleCompletion){defaultHandlers.handleCompletion=handlers.handleCompletion;}
return defaultHandlers;},search(aSelectTerms,aSearchData,aRowFuncOrHandlers){ if(!aSelectTerms){aSelectTerms=validFields.filter(f=>f!="source");}
validateSearchData(aSearchData,"Search");let query="SELECT "+aSelectTerms.join(", ")+" FROM moz_formhistory";let{queryTerms,params}=makeQueryPredicates(aSearchData);if(queryTerms){query+=" WHERE "+queryTerms;}
let handlers;if(typeof aRowFuncOrHandlers=="function"){handlers=this._prepareHandlers();handlers.handleResult=aRowFuncOrHandlers;}else if(typeof aRowFuncOrHandlers=="object"){handlers=this._prepareHandlers(aRowFuncOrHandlers);}
let allResults=[];return new Promise((resolve,reject)=>{this.db.then(async conn=>{try{await conn.executeCached(query,params,row=>{let result={};for(let field of aSelectTerms){result[field]=row.getResultByName(field);}
if(handlers){handlers.handleResult(result);}else{allResults.push(result);}});if(handlers){handlers.handleCompletion(0);}
resolve(allResults);}catch(e){if(handlers){handlers.handleError(e);handlers.handleCompletion(1);}
reject(e);}});});},count(aSearchData,aHandlers){validateSearchData(aSearchData,"Count");let query="SELECT COUNT(*) AS numEntries FROM moz_formhistory";let{queryTerms,params}=makeQueryPredicates(aSearchData);if(queryTerms){query+=" WHERE "+queryTerms;}
let handlers=this._prepareHandlers(aHandlers);return new Promise((resolve,reject)=>{this.db.then(async conn=>{try{let rows=await conn.executeCached(query,params);let count=rows[0].getResultByName("numEntries");handlers.handleResult(count);handlers.handleCompletion(0);resolve(count);}catch(e){handlers.handleError(e);handlers.handleCompletion(1);reject(e);}});});},update(aChanges,aHandlers){
let numSearches=0;let completedSearches=0;let searchFailed=false;function validIdentifier(change){
return Boolean(change.guid)!=Boolean(change.fieldname&&change.value);}
if(!("length"in aChanges)){aChanges=[aChanges];}
let handlers=this._prepareHandlers(aHandlers);let isRemoveOperation=aChanges.every(change=>change&&change.op&&change.op=="remove");if(!Prefs.enabled&&!isRemoveOperation){handlers.handleError({message:"Form history is disabled, only remove operations are allowed",result:Ci.mozIStorageError.MISUSE,});handlers.handleCompletion(1);return;}
for(let change of aChanges){switch(change.op){case"remove":validateSearchData(change,"Remove");continue;case"update":if(validIdentifier(change)){validateOpData(change,"Update");if(change.guid){continue;}}else{throw Components.Exception("update op='update' does not correctly reference a entry.",Cr.NS_ERROR_ILLEGAL_VALUE);}
break;case"bump":if(validIdentifier(change)){validateOpData(change,"Bump");if(change.guid){continue;}}else{throw Components.Exception("update op='bump' does not correctly reference a entry.",Cr.NS_ERROR_ILLEGAL_VALUE);}
break;case"add":if(change.fieldname&&change.value){validateOpData(change,"Add");}else{throw Components.Exception("update op='add' must have a fieldname and a value.",Cr.NS_ERROR_ILLEGAL_VALUE);}
break;default:throw Components.Exception("update does not recognize op='"+change.op+"'",Cr.NS_ERROR_ILLEGAL_VALUE);}
numSearches++;let changeToUpdate=change;FormHistory.search(["guid"],{fieldname:change.fieldname,value:change.value,},{foundResult:false,handleResult(aResult){if(this.foundResult){log("Database contains multiple entries with the same fieldname/value pair.");handlers.handleError({message:"Database contains multiple entries with the same fieldname/value pair.",result:19,});searchFailed=true;return;}
this.foundResult=true;changeToUpdate.guid=aResult.guid;},handleError(aError){handlers.handleError(aError);},handleCompletion(aReason){completedSearches++;if(completedSearches==numSearches){if(!aReason&&!searchFailed){updateFormHistoryWrite(aChanges,handlers);}else{handlers.handleCompletion(1);}}},});}
if(numSearches==0){updateFormHistoryWrite(aChanges,handlers);}},getAutoCompleteResults(searchString,params,aHandlers){ let searchTokens;let where="";let boundaryCalc="";if(searchString.length>=1){params.valuePrefix=searchString+"%";}
if(searchString.length>1){searchTokens=searchString.split(/\s+/); boundaryCalc="MAX(1, :prefixWeight * (value LIKE :valuePrefix ESCAPE '/') + (";
 let tokenCalc=[];let searchTokenCount=Math.min(searchTokens.length,MAX_SEARCH_TOKENS);for(let i=0;i<searchTokenCount;i++){let escapedToken=searchTokens[i];params["tokenBegin"+i]=escapedToken+"%";params["tokenBoundary"+i]="% "+escapedToken+"%";params["tokenContains"+i]="%"+escapedToken+"%";tokenCalc.push("(value LIKE :tokenBegin"+
i+" ESCAPE '/') + "+"(value LIKE :tokenBoundary"+
i+" ESCAPE '/')");where+="AND (value LIKE :tokenContains"+i+" ESCAPE '/') ";}
 
boundaryCalc+=tokenCalc.join(" + ")+") * :boundaryWeight)";}else if(searchString.length==1){where="AND (value LIKE :valuePrefix ESCAPE '/') ";boundaryCalc="1";delete params.prefixWeight;delete params.boundaryWeight;}else{where="";boundaryCalc="1";delete params.prefixWeight;delete params.boundaryWeight;}
params.now=Date.now()*1000; if(params.source){where+=`AND EXISTS(
        SELECT 1 FROM moz_history_to_sources
        JOIN moz_sources s ON s.id = source_id
        WHERE source = :source
          AND history_id = moz_formhistory.id
      )`;}
let handlers=this._prepareHandlers(aHandlers);let query="/* do not warn (bug 496471): can't use an index */ "+"SELECT value, guid, "+"ROUND( "+"timesUsed / MAX(1.0, (lastUsed - firstUsed) / :timeGroupingSize) * "+"MAX(1.0, :maxTimeGroupings - (:now - lastUsed) / :timeGroupingSize) * "+"MAX(1.0, :agedWeight * (firstUsed < :expiryDate)) / "+":bucketSize "+", 3) AS frecency, "+
boundaryCalc+" AS boundaryBonuses "+"FROM moz_formhistory "+"WHERE fieldname=:fieldname "+
where+"ORDER BY ROUND(frecency * boundaryBonuses) DESC, UPPER(value) ASC";let cancelled=false;let cancellableQuery={cancel(){cancelled=true;},};this.db.then(async conn=>{try{await conn.executeCached(query,params,(row,cancel)=>{if(cancelled){cancel();return;}
let value=row.getResultByName("value");let guid=row.getResultByName("guid");let frecency=row.getResultByName("frecency");let entry={text:value,guid,textLowerCase:value.toLowerCase(),frecency,totalScore:Math.round(frecency*row.getResultByName("boundaryBonuses")),};handlers.handleResult(entry);});handlers.handleCompletion(0);}catch(e){handlers.handleError(e);handlers.handleCompletion(1);}});return cancellableQuery;},get _supportsDeletedTable(){return supportsDeletedTable;},set _supportsDeletedTable(val){supportsDeletedTable=val;}, updatePrefs(){Prefs.initialized=false;},expireOldEntries(){log("expireOldEntries"); let expireTime=(Date.now()-Prefs.expireDays*DAY_IN_MS)*1000;sendNotification("formhistory-beforeexpireoldentries",expireTime);FormHistory.count({},{handleResult(aBeginningCount){expireOldEntriesDeletion(expireTime,aBeginningCount);},handleError(aError){log("expireStartCountFailure");},});},};Object.freeze(FormHistory);