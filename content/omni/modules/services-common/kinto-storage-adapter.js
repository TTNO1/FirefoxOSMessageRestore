const{Sqlite}=ChromeUtils.import("resource://gre/modules/Sqlite.jsm");const{Kinto}=ChromeUtils.import("resource://services-common/kinto-offline-client.js");function reduceRecords(filters,order,list){const filtered=filters?filterObjects(filters,list):list;return order?sortObjects(order,filtered):filtered;}
function _isUndefined(value){return typeof value==="undefined";}
function sortObjects(order,list){const hasDash=order[0]==="-";const field=hasDash?order.slice(1):order;const direction=hasDash?-1:1;return list.slice().sort((a,b)=>{if(a[field]&&_isUndefined(b[field])){return direction;}
if(b[field]&&_isUndefined(a[field])){return-direction;}
if(_isUndefined(a[field])&&_isUndefined(b[field])){return 0;}
return a[field]>b[field]?direction:-direction;});}
function filterObject(filters,entry){return Object.keys(filters).every(filter=>{const value=filters[filter];if(Array.isArray(value)){return value.some(candidate=>candidate===entry[filter]);}
return entry[filter]===value;});}
function filterObjects(filters,list){return list.filter(entry=>{return filterObject(filters,entry);});}
const statements={createCollectionData:`
    CREATE TABLE collection_data (
      collection_name TEXT,
      record_id TEXT,
      record TEXT
    );`,createCollectionMetadata:`
    CREATE TABLE collection_metadata (
      collection_name TEXT PRIMARY KEY,
      last_modified INTEGER,
      metadata TEXT
    ) WITHOUT ROWID;`,createCollectionDataRecordIdIndex:`
    CREATE UNIQUE INDEX unique_collection_record
      ON collection_data(collection_name, record_id);`,clearData:`
    DELETE FROM collection_data
      WHERE collection_name = :collection_name;`,createData:`
    INSERT INTO collection_data (collection_name, record_id, record)
      VALUES (:collection_name, :record_id, :record);`,updateData:`
    INSERT OR REPLACE INTO collection_data (collection_name, record_id, record)
      VALUES (:collection_name, :record_id, :record);`,deleteData:`
    DELETE FROM collection_data
      WHERE collection_name = :collection_name
      AND record_id = :record_id;`,saveLastModified:`
    INSERT INTO collection_metadata(collection_name, last_modified)
      VALUES(:collection_name, :last_modified)
        ON CONFLICT(collection_name) DO UPDATE SET last_modified = :last_modified`,getLastModified:`
    SELECT last_modified
      FROM collection_metadata
        WHERE collection_name = :collection_name;`,saveMetadata:`
    INSERT INTO collection_metadata(collection_name, metadata)
      VALUES(:collection_name, :metadata)
        ON CONFLICT(collection_name) DO UPDATE SET metadata = :metadata`,getMetadata:`
    SELECT metadata
      FROM collection_metadata
        WHERE collection_name = :collection_name;`,getRecord:`
    SELECT record
      FROM collection_data
        WHERE collection_name = :collection_name
        AND record_id = :record_id;`,listRecords:`
    SELECT record
      FROM collection_data
        WHERE collection_name = :collection_name;`,
 listRecordsById:`
    SELECT record_id, record
      FROM collection_data
        WHERE collection_name = ?
          AND record_id IN `,importData:`
    REPLACE INTO collection_data (collection_name, record_id, record)
      VALUES (:collection_name, :record_id, :record);`,scanAllRecords:`SELECT * FROM collection_data;`,clearCollectionMetadata:`DELETE FROM collection_metadata;`,calculateStorage:`
    SELECT collection_name, SUM(LENGTH(record)) as size, COUNT(record) as num_records
      FROM collection_data
        GROUP BY collection_name;`,addMetadataColumn:`
    ALTER TABLE collection_metadata
      ADD COLUMN metadata TEXT;`,};const createStatements=["createCollectionData","createCollectionMetadata","createCollectionDataRecordIdIndex",];const currentSchemaVersion=2;class FirefoxAdapter extends Kinto.adapters.BaseAdapter{constructor(collection,options={}){super();const{sqliteHandle=null}=options;this.collection=collection;this._connection=sqliteHandle;this._options=options;}
static async _init(connection){await connection.executeTransaction(async function doSetup(){const schema=await connection.getSchemaVersion();if(schema==0){for(let statementName of createStatements){await connection.execute(statements[statementName]);}
await connection.setSchemaVersion(currentSchemaVersion);}else if(schema==1){await connection.execute(statements.addMetadataColumn);await connection.setSchemaVersion(currentSchemaVersion);}else if(schema!=2){throw new Error("Unknown database schema: "+schema);}});return connection;}
_executeStatement(statement,params){return this._connection.executeCached(statement,params);}
static async openConnection(options){const opts=Object.assign({},{sharedMemoryCache:false},options);const conn=await Sqlite.openConnection(opts).then(this._init);try{Sqlite.shutdown.addBlocker("Kinto storage adapter connection closing",()=>conn.close());}catch(e){await conn.close();throw e;}
return conn;}
clear(){const params={collection_name:this.collection};return this._executeStatement(statements.clearData,params);}
execute(callback,options={preload:[]}){let result;const conn=this._connection;const collection=this.collection;return conn.executeTransaction(async function doExecuteTransaction(){
const limit=100;let preloaded={};let preload;let more=options.preload;while(more.length>0){preload=more.slice(0,limit);more=more.slice(limit,more.length);const parameters=[collection,...preload];const placeholders=preload.map(_=>"?");const stmt=statements.listRecordsById+"("+placeholders.join(",")+");";const rows=await conn.execute(stmt,parameters);rows.reduce((acc,row)=>{const record=JSON.parse(row.getResultByName("record"));acc[row.getResultByName("record_id")]=record;return acc;},preloaded);}
const proxy=transactionProxy(collection,preloaded);result=callback(proxy);for(let{statement,params}of proxy.operations){await conn.executeCached(statement,params);}},conn.TRANSACTION_EXCLUSIVE).then(_=>result);}
get(id){const params={collection_name:this.collection,record_id:id,};return this._executeStatement(statements.getRecord,params).then(result=>{if(result.length==0){return null;}
return JSON.parse(result[0].getResultByName("record"));});}
list(params={filters:{},order:""}){const parameters={collection_name:this.collection,};return this._executeStatement(statements.listRecords,parameters).then(result=>{const records=[];for(let k=0;k<result.length;k++){const row=result[k];records.push(JSON.parse(row.getResultByName("record")));}
return records;}).then(results=>{return reduceRecords(params.filters,params.order,results);});}
async loadDump(records){return this.importBulk(records);}
async importBulk(records){const connection=this._connection;const collection_name=this.collection;await connection.executeTransaction(async function doImport(){for(let record of records){const params={collection_name,record_id:record.id,record:JSON.stringify(record),};await connection.execute(statements.importData,params);}
const lastModified=Math.max(...records.map(record=>record.last_modified));const params={collection_name,};const previousLastModified=await connection.execute(statements.getLastModified,params).then(result=>{return result.length>0?result[0].getResultByName("last_modified"):-1;});if(lastModified>previousLastModified){const params={collection_name,last_modified:lastModified,};await connection.execute(statements.saveLastModified,params);}});return records;}
saveLastModified(lastModified){const parsedLastModified=parseInt(lastModified,10)||null;const params={collection_name:this.collection,last_modified:parsedLastModified,};return this._executeStatement(statements.saveLastModified,params).then(()=>parsedLastModified);}
getLastModified(){const params={collection_name:this.collection,};return this._executeStatement(statements.getLastModified,params).then(result=>{if(result.length==0){return 0;}
return result[0].getResultByName("last_modified");});}
async saveMetadata(metadata){const params={collection_name:this.collection,metadata:JSON.stringify(metadata),};await this._executeStatement(statements.saveMetadata,params);return metadata;}
async getMetadata(){const params={collection_name:this.collection,};const result=await this._executeStatement(statements.getMetadata,params);if(result.length==0){return null;}
return JSON.parse(result[0].getResultByName("metadata"));}
calculateStorage(){return this._executeStatement(statements.calculateStorage,{}).then(result=>{return Array.from(result,row=>({collectionName:row.getResultByName("collection_name"),size:row.getResultByName("size"),numRecords:row.getResultByName("num_records"),}));});}
resetSyncStatus(){
 if(!this._connection){throw new Error("The storage adapter is not open");}
return this._connection.executeTransaction(async function(conn){const promises=[];await conn.execute(statements.scanAllRecords,null,function(row){const record=JSON.parse(row.getResultByName("record"));const record_id=row.getResultByName("record_id");const collection_name=row.getResultByName("collection_name");if(record._status==="deleted"){promises.push(conn.execute(statements.deleteData,{collection_name,record_id}));}else{const newRecord=Object.assign({},record,{_status:"created",last_modified:undefined,});promises.push(conn.execute(statements.updateData,{record:JSON.stringify(newRecord),record_id,collection_name,}));}});await Promise.all(promises);await conn.execute(statements.clearCollectionMetadata);});}}
function transactionProxy(collection,preloaded){const _operations=[];return{get operations(){return _operations;},create(record){_operations.push({statement:statements.createData,params:{collection_name:collection,record_id:record.id,record:JSON.stringify(record),},});},update(record){_operations.push({statement:statements.updateData,params:{collection_name:collection,record_id:record.id,record:JSON.stringify(record),},});},delete(id){_operations.push({statement:statements.deleteData,params:{collection_name:collection,record_id:id,},});},get(id){return id in preloaded?preloaded[id]:undefined;},};}
this.FirefoxAdapter=FirefoxAdapter;var EXPORTED_SYMBOLS=["FirefoxAdapter"];