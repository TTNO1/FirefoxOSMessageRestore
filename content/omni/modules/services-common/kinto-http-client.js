"use strict";const global=this;var EXPORTED_SYMBOLS=["KintoHttpClient"];const{setTimeout,clearTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(global,["fetch"]);(function(global,factory){typeof exports==='object'&&typeof module!=='undefined'?module.exports=factory():typeof define==='function'&&define.amd?define(factory):(global=global||self,global.KintoHttpClient=factory());}(this,(function(){'use strict';function __decorate(decorators,target,key,desc){var c=arguments.length,r=c<3?target:desc===null?desc=Object.getOwnPropertyDescriptor(target,key):desc,d;if(typeof Reflect==="object"&&typeof Reflect.decorate==="function")
r=Reflect.decorate(decorators,target,key,desc);else
for(var i=decorators.length-1;i>=0;i--)
if(d=decorators[i])
r=(c<3?d(r):c>3?d(target,key,r):d(target,key))||r;return c>3&&r&&Object.defineProperty(target,key,r),r;}
function partition(array,n){if(n<=0){return[array];}
return array.reduce((acc,x,i)=>{if(i===0||i%n===0){acc.push([x]);}
else{acc[acc.length-1].push(x);}
return acc;},[]);}
function delay(ms){return new Promise((resolve)=>setTimeout(resolve,ms));}
function toDataBody(resource){if(isObject(resource)){return resource;}
if(typeof resource==="string"){return{id:resource};}
throw new Error("Invalid argument.");}
function qsify(obj){const encode=(v)=>encodeURIComponent(typeof v==="boolean"?String(v):v);const stripped=cleanUndefinedProperties(obj);return Object.keys(stripped).map((k)=>{const ks=encode(k)+"=";if(Array.isArray(stripped[k])){return ks+stripped[k].map((v)=>encode(v)).join(",");}
else{return ks+encode(stripped[k]);}}).join("&");}
function checkVersion(version,minVersion,maxVersion){const extract=(str)=>str.split(".").map((x)=>parseInt(x,10));const[verMajor,verMinor]=extract(version);const[minMajor,minMinor]=extract(minVersion);const[maxMajor,maxMinor]=extract(maxVersion);const checks=[verMajor<minMajor,verMajor===minMajor&&verMinor<minMinor,verMajor>maxMajor,verMajor===maxMajor&&verMinor>=maxMinor,];if(checks.some((x)=>x)){throw new Error(`Version ${version} doesn't satisfy ${minVersion} <= x < ${maxVersion}`);}}
function support(min,max){return function( target,key,descriptor){const fn=descriptor.value;return{configurable:true,get(){const wrappedMethod=(...args)=>{const client=this.client?this.client:this;return client.fetchHTTPApiVersion().then((version)=>checkVersion(version,min,max)).then(()=>fn.apply(this,args));};Object.defineProperty(this,key,{value:wrappedMethod,configurable:true,writable:true,});return wrappedMethod;},};};}
function capable(capabilities){return function( target,key,descriptor){const fn=descriptor.value;return{configurable:true,get(){const wrappedMethod=(...args)=>{const client=this.client?this.client:this;return client.fetchServerCapabilities().then((available)=>{const missing=capabilities.filter((c)=>!(c in available));if(missing.length>0){const missingStr=missing.join(", ");throw new Error(`Required capabilities ${missingStr} not present on server`);}}).then(()=>fn.apply(this,args));};Object.defineProperty(this,key,{value:wrappedMethod,configurable:true,writable:true,});return wrappedMethod;},};};}
function nobatch(message){return function( target,key,descriptor){const fn=descriptor.value;return{configurable:true,get(){const wrappedMethod=(...args)=>{if(this._isBatch){throw new Error(message);}
return fn.apply(this,args);};Object.defineProperty(this,key,{value:wrappedMethod,configurable:true,writable:true,});return wrappedMethod;},};};}
function isObject(thing){return typeof thing==="object"&&thing!==null&&!Array.isArray(thing);}
function parseDataURL(dataURL){const regex=/^data:(.*);base64,(.*)/;const match=dataURL.match(regex);if(!match){throw new Error(`Invalid data-url: ${String(dataURL).substr(0, 32)}...`);}
const props=match[1];const base64=match[2];const[type,...rawParams]=props.split(";");const params=rawParams.reduce((acc,param)=>{const[key,value]=param.split("=");return Object.assign(Object.assign({},acc),{[key]:value});},{});return Object.assign(Object.assign({},params),{type,base64});}
function extractFileInfo(dataURL){const{name,type,base64}=parseDataURL(dataURL);const binary=atob(base64);const array=[];for(let i=0;i<binary.length;i++){array.push(binary.charCodeAt(i));}
const blob=new Blob([new Uint8Array(array)],{type});return{blob,name};}
function createFormData(dataURL,body,options={}){const{filename="untitled"}=options;const{blob,name}=extractFileInfo(dataURL);const formData=new FormData();formData.append("attachment",blob,name||filename);for(const property in body){if(typeof body[property]!=="undefined"){formData.append(property,JSON.stringify(body[property]));}}
return formData;}
function cleanUndefinedProperties(obj){const result={};for(const key in obj){if(typeof obj[key]!=="undefined"){result[key]=obj[key];}}
return result;}
function addEndpointOptions(path,options={}){const query=Object.assign({},options.query);if(options.fields){query._fields=options.fields;}
const queryString=qsify(query);if(queryString){return path+"?"+queryString;}
return path;}
function obscureAuthorizationHeader(headers){const h=new Headers(headers);if(h.has("authorization")){h.set("authorization","**** (suppressed)");}
const obscuredHeaders={};for(const[header,value]of h.entries()){obscuredHeaders[header]=value;}
return obscuredHeaders;}
const ERROR_CODES={104:"Missing Authorization Token",105:"Invalid Authorization Token",106:"Request body was not valid JSON",107:"Invalid request parameter",108:"Missing request parameter",109:"Invalid posted data",110:"Invalid Token / id",111:"Missing Token / id",112:"Content-Length header was not provided",113:"Request body too large",114:"Resource was created, updated or deleted meanwhile",115:"Method not allowed on this end point (hint: server may be readonly)",116:"Requested version not available on this server",117:"Client has sent too many requests",121:"Resource access is forbidden for this user",122:"Another resource violates constraint",201:"Service Temporary unavailable due to high load",202:"Service deprecated",999:"Internal Server Error",};class NetworkTimeoutError extends Error{constructor(url,options){super(`Timeout while trying to access ${url} with ${JSON.stringify(options)}`);if(Error.captureStackTrace){Error.captureStackTrace(this,NetworkTimeoutError);}
this.url=url;this.options=options;}}
class UnparseableResponseError extends Error{constructor(response,body,error){const{status}=response;super(`Response from server unparseable (HTTP ${status || 0}; ${error}): ${body}`);if(Error.captureStackTrace){Error.captureStackTrace(this,UnparseableResponseError);}
this.status=status;this.response=response;this.stack=error.stack;this.error=error;}}
class ServerResponse extends Error{constructor(response,json){const{status}=response;let{statusText}=response;let errnoMsg;if(json){statusText=json.error||statusText;if(json.errno&&json.errno in ERROR_CODES){errnoMsg=ERROR_CODES[json.errno];}
else if(json.message){errnoMsg=json.message;}
if(errnoMsg&&json.message&&json.message!==errnoMsg){errnoMsg+=` (${json.message})`;}}
let message=`HTTP ${status} ${statusText}`;if(errnoMsg){message+=`: ${errnoMsg}`;}
super(message.trim());if(Error.captureStackTrace){Error.captureStackTrace(this,ServerResponse);}
this.response=response;this.data=json;}}
var errors=Object.freeze({__proto__:null,'default':ERROR_CODES,NetworkTimeoutError:NetworkTimeoutError,ServerResponse:ServerResponse,UnparseableResponseError:UnparseableResponseError});class HTTP{constructor(events,options={}){ this.events=events;this.requestMode=options.requestMode||HTTP.defaultOptions.requestMode;this.timeout=options.timeout||HTTP.defaultOptions.timeout;}
static get DEFAULT_REQUEST_HEADERS(){return{Accept:"application/json","Content-Type":"application/json",};}
static get defaultOptions(){return{timeout:null,requestMode:"cors"};}
timedFetch(url,options){let hasTimedout=false;return new Promise((resolve,reject)=>{let _timeoutId;if(this.timeout){_timeoutId=setTimeout(()=>{hasTimedout=true;if(options&&options.headers){options=Object.assign(Object.assign({},options),{headers:obscureAuthorizationHeader(options.headers)});}
reject(new NetworkTimeoutError(url,options));},this.timeout);}
function proceedWithHandler(fn){return(arg)=>{if(!hasTimedout){if(_timeoutId){clearTimeout(_timeoutId);}
fn(arg);}};}
fetch(url,options).then(proceedWithHandler(resolve)).catch(proceedWithHandler(reject));});}
async processResponse(response){const{status,headers}=response;const text=await response.text();let json;if(text.length!==0){try{json=JSON.parse(text);}
catch(err){throw new UnparseableResponseError(response,text,err);}}
if(status>=400){throw new ServerResponse(response,json);}
return{status,json:json,headers};}
async retry(url,retryAfter,request,options){await delay(retryAfter);return this.request(url,request,Object.assign(Object.assign({},options),{retry:options.retry-1}));}
async request(url,request={headers:{}},options={retry:0}){ request.headers=Object.assign(Object.assign({},HTTP.DEFAULT_REQUEST_HEADERS),request.headers);
if(request.body&&request.body instanceof FormData){if(request.headers instanceof Headers){request.headers.delete("Content-Type");}
else if(!Array.isArray(request.headers)){delete request.headers["Content-Type"];}}
request.mode=this.requestMode;const response=await this.timedFetch(url,request);const{headers}=response;this._checkForDeprecationHeader(headers);this._checkForBackoffHeader(headers);const retryAfter=this._checkForRetryAfterHeader(headers);if(retryAfter&&options.retry>0){return this.retry(url,retryAfter,request,options);}
else{return this.processResponse(response);}}
_checkForDeprecationHeader(headers){const alertHeader=headers.get("Alert");if(!alertHeader){return;}
let alert;try{alert=JSON.parse(alertHeader);}
catch(err){console.warn("Unable to parse Alert header message",alertHeader);return;}
console.warn(alert.message,alert.url);if(this.events){this.events.emit("deprecated",alert);}}
_checkForBackoffHeader(headers){let backoffMs;const backoffHeader=headers.get("Backoff");const backoffSeconds=backoffHeader?parseInt(backoffHeader,10):0;if(backoffSeconds>0){backoffMs=new Date().getTime()+backoffSeconds*1000;}
else{backoffMs=0;}
if(this.events){this.events.emit("backoff",backoffMs);}}
_checkForRetryAfterHeader(headers){const retryAfter=headers.get("Retry-After");if(!retryAfter){return;}
const delay=parseInt(retryAfter,10)*1000;const tryAgainAfter=new Date().getTime()+delay;if(this.events){this.events.emit("retry-after",tryAgainAfter);}
return delay;}}
const ENDPOINTS={root:()=>"/",batch:()=>"/batch",permissions:()=>"/permissions",bucket:(bucket)=>"/buckets"+(bucket?`/${bucket}`:""),history:(bucket)=>`${ENDPOINTS.bucket(bucket)}/history`,collection:(bucket,coll)=>`${ENDPOINTS.bucket(bucket)}/collections`+(coll?`/${coll}`:""),group:(bucket,group)=>`${ENDPOINTS.bucket(bucket)}/groups`+(group?`/${group}`:""),record:(bucket,coll,id)=>`${ENDPOINTS.collection(bucket, coll)}/records`+(id?`/${id}`:""),attachment:(bucket,coll,id)=>`${ENDPOINTS.record(bucket, coll, id)}/attachment`,};const requestDefaults={safe:false, headers:{},patch:false,};function safeHeader(safe,last_modified){if(!safe){return{};}
if(last_modified){return{"If-Match":`"${last_modified}"`};}
return{"If-None-Match":"*"};}
function createRequest(path,{data,permissions},options={}){const{headers,safe}=Object.assign(Object.assign({},requestDefaults),options);const method=options.method||(data&&data.id)?"PUT":"POST";return{method,path,headers:Object.assign(Object.assign({},headers),safeHeader(safe)),body:{data,permissions},};}
function updateRequest(path,{data,permissions},options={}){const{headers,safe,patch}=Object.assign(Object.assign({},requestDefaults),options);const{last_modified}=Object.assign(Object.assign({},data),options);const hasNoData=data&&Object.keys(data).filter((k)=>k!=="id"&&k!=="last_modified").length===0;if(hasNoData){data=undefined;}
return{method:patch?"PATCH":"PUT",path,headers:Object.assign(Object.assign({},headers),safeHeader(safe,last_modified)),body:{data,permissions},};}
function jsonPatchPermissionsRequest(path,permissions,opType,options={}){const{headers,safe,last_modified}=Object.assign(Object.assign({},requestDefaults),options);const ops=[];for(const[type,principals]of Object.entries(permissions)){if(principals){for(const principal of principals){ops.push({op:opType,path:`/permissions/${type}/${principal}`,});}}}
return{method:"PATCH",path,headers:Object.assign(Object.assign(Object.assign({},headers),safeHeader(safe,last_modified)),{"Content-Type":"application/json-patch+json"}),body:ops,};}
function deleteRequest(path,options={}){const{headers,safe,last_modified}=Object.assign(Object.assign({},requestDefaults),options);if(safe&&!last_modified){throw new Error("Safe concurrency check requires a last_modified value.");}
return{method:"DELETE",path,headers:Object.assign(Object.assign({},headers),safeHeader(safe,last_modified)),};}
function addAttachmentRequest(path,dataURI,{data,permissions}={},options={}){const{headers,safe,gzipped}=Object.assign(Object.assign({},requestDefaults),options);const{last_modified}=Object.assign(Object.assign({},data),options);const body={data,permissions};const formData=createFormData(dataURI,body,options);const customPath=`${path}${gzipped !== null ? "?gzipped=" + (gzipped ? "true" : "false") : ""}`;return{method:"POST",path:customPath,headers:Object.assign(Object.assign({},headers),safeHeader(safe,last_modified)),body:formData,};}
function aggregate(responses=[],requests=[]){if(responses.length!==requests.length){throw new Error("Responses length should match requests one.");}
const results={errors:[],published:[],conflicts:[],skipped:[],};return responses.reduce((acc,response,index)=>{const{status}=response;const request=requests[index];if(status>=200&&status<400){acc.published.push(response.body);}
else if(status===404){ const regex=/(buckets|groups|collections|records)\/([^/]+)$/;const extracts=request.path.match(regex);const id=extracts&&extracts.length===3?extracts[2]:undefined;acc.skipped.push({id,path:request.path,error:response.body,});}
else if(status===412){acc.conflicts.push({ type:"outgoing",local:request.body,remote:(response.body.details&&response.body.details.existing)||null,});}
else{acc.errors.push({path:request.path,sent:request,error:response.body,});}
return acc;},results);}


var getRandomValues=typeof crypto!='undefined'&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||typeof msCrypto!='undefined'&&typeof msCrypto.getRandomValues=='function'&&msCrypto.getRandomValues.bind(msCrypto);var rnds8=new Uint8Array(16); function rng(){if(!getRandomValues){throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');}
return getRandomValues(rnds8);}
var byteToHex=[];for(var i=0;i<256;++i){byteToHex[i]=(i+0x100).toString(16).substr(1);}
function bytesToUuid(buf,offset){var i=offset||0;var bth=byteToHex; return[bth[buf[i++]],bth[buf[i++]],bth[buf[i++]],bth[buf[i++]],'-',bth[buf[i++]],bth[buf[i++]],'-',bth[buf[i++]],bth[buf[i++]],'-',bth[buf[i++]],bth[buf[i++]],'-',bth[buf[i++]],bth[buf[i++]],bth[buf[i++]],bth[buf[i++]],bth[buf[i++]],bth[buf[i++]]].join('');}
function v4(options,buf,offset){var i=buf&&offset||0;if(typeof options=='string'){buf=options==='binary'?new Array(16):null;options=null;}
options=options||{};var rnds=options.random||(options.rng||rng)();rnds[6]=rnds[6]&0x0f|0x40;rnds[8]=rnds[8]&0x3f|0x80; if(buf){for(var ii=0;ii<16;++ii){buf[i+ii]=rnds[ii];}}
return buf||bytesToUuid(rnds);}
class Collection{constructor(client,bucket,name,options={}){this.client=client;this.bucket=bucket;this.name=name;this._endpoints=client.endpoints;this._retry=options.retry||0;this._safe=!!options.safe;
this._headers=Object.assign(Object.assign({},this.bucket.headers),options.headers);}
get execute(){return this.client.execute.bind(this.client);}
_getHeaders(options){return Object.assign(Object.assign({},this._headers),options.headers);}
_getSafe(options){return Object.assign({safe:this._safe},options).safe;}
_getRetry(options){return Object.assign({retry:this._retry},options).retry;}
async getTotalRecords(options={}){const path=this._endpoints.record(this.bucket.name,this.name);const request={headers:this._getHeaders(options),path,method:"HEAD",};const{headers}=await this.client.execute(request,{raw:true,retry:this._getRetry(options),});return parseInt(headers.get("Total-Records"),10);}
async getRecordsTimestamp(options={}){const path=this._endpoints.record(this.bucket.name,this.name);const request={headers:this._getHeaders(options),path,method:"HEAD",};const{headers}=(await this.client.execute(request,{raw:true,retry:this._getRetry(options),}));return headers.get("ETag");}
async getData(options={}){const path=this._endpoints.collection(this.bucket.name,this.name);const request={headers:this._getHeaders(options),path};const{data}=(await this.client.execute(request,{retry:this._getRetry(options),query:options.query,fields:options.fields,}));return data;}
async setData(data,options={}){if(!isObject(data)){throw new Error("A collection object is required.");}
const{patch,permissions}=options;const{last_modified}=Object.assign(Object.assign({},data),options);const path=this._endpoints.collection(this.bucket.name,this.name);const request=updateRequest(path,{data,permissions},{last_modified,patch,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async getPermissions(options={}){const path=this._endpoints.collection(this.bucket.name,this.name);const request={headers:this._getHeaders(options),path};const{permissions}=(await this.client.execute(request,{retry:this._getRetry(options),}));return permissions;}
async setPermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.collection(this.bucket.name,this.name);const data={last_modified:options.last_modified};const request=updateRequest(path,{data,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async addPermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.collection(this.bucket.name,this.name);const{last_modified}=options;const request=jsonPatchPermissionsRequest(path,permissions,"add",{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async removePermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.collection(this.bucket.name,this.name);const{last_modified}=options;const request=jsonPatchPermissionsRequest(path,permissions,"remove",{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async createRecord(record,options={}){const{permissions}=options;const path=this._endpoints.record(this.bucket.name,this.name,record.id);const request=createRequest(path,{data:record,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async addAttachment(dataURI,record={},options={}){const{permissions}=options;const id=record.id||v4();const path=this._endpoints.attachment(this.bucket.name,this.name,id);const{last_modified}=Object.assign(Object.assign({},record),options);const addAttachmentRequest$1=addAttachmentRequest(path,dataURI,{data:record,permissions},{last_modified,filename:options.filename,gzipped:options.gzipped,headers:this._getHeaders(options),safe:this._getSafe(options),});await this.client.execute(addAttachmentRequest$1,{stringify:false,retry:this._getRetry(options),});return this.getRecord(id);}
async removeAttachment(recordId,options={}){const{last_modified}=options;const path=this._endpoints.attachment(this.bucket.name,this.name,recordId);const request=deleteRequest(path,{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async updateRecord(record,options={}){if(!isObject(record)){throw new Error("A record object is required.");}
if(!record.id){throw new Error("A record id is required.");}
const{permissions}=options;const{last_modified}=Object.assign(Object.assign({},record),options);const path=this._endpoints.record(this.bucket.name,this.name,record.id);const request=updateRequest(path,{data:record,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),last_modified,patch:!!options.patch,});return this.client.execute(request,{retry:this._getRetry(options),});}
async deleteRecord(record,options={}){const recordObj=toDataBody(record);if(!recordObj.id){throw new Error("A record id is required.");}
const{id}=recordObj;const{last_modified}=Object.assign(Object.assign({},recordObj),options);const path=this._endpoints.record(this.bucket.name,this.name,id);const request=deleteRequest(path,{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async getRecord(id,options={}){const path=this._endpoints.record(this.bucket.name,this.name,id);const request={headers:this._getHeaders(options),path};return this.client.execute(request,{retry:this._getRetry(options),query:options.query,fields:options.fields,});}
async listRecords(options={}){const path=this._endpoints.record(this.bucket.name,this.name);if(options.at){return this.getSnapshot(options.at);}
else{return this.client.paginatedList(path,options,{headers:this._getHeaders(options),retry:this._getRetry(options),});}}
async isHistoryComplete(){
const{data:[oldestHistoryEntry],}=await this.bucket.listHistory({limit:1,filters:{action:"create",resource_name:"collection",collection_id:this.name,},});return!!oldestHistoryEntry;}
async listChangesBackTo(at){
if(!(await this.isHistoryComplete())){throw new Error("Computing a snapshot is only possible when the full history for a "+"collection is available. Here, the history plugin seems to have "+"been enabled after the creation of the collection.");}
const{data:changes}=await this.bucket.listHistory({pages:Infinity,sort:"-target.data.last_modified",filters:{resource_name:"record",collection_id:this.name,"max_target.data.last_modified":String(at),},});return changes;}
async getSnapshot(at){if(!at||!Number.isInteger(at)||at<=0){throw new Error("Invalid argument, expected a positive integer.");}
const changes=await this.listChangesBackTo(at);const seenIds=new Set();let snapshot=[];for(const{action,target:{data:record},}of changes){if(action=="delete"){seenIds.add(record.id); snapshot=snapshot.filter((r)=>r.id!==record.id);}
else if(!seenIds.has(record.id)){seenIds.add(record.id);snapshot.push(record);}}
return{last_modified:String(at),data:snapshot.sort((a,b)=>b.last_modified-a.last_modified),next:()=>{throw new Error("Snapshots don't support pagination");},hasNextPage:false,totalRecords:snapshot.length,};}
async batch(fn,options={}){return this.client.batch(fn,{bucket:this.bucket.name,collection:this.name,headers:this._getHeaders(options),retry:this._getRetry(options),safe:this._getSafe(options),aggregate:!!options.aggregate,});}}
__decorate([capable(["attachments"])],Collection.prototype,"addAttachment",null);__decorate([capable(["attachments"])],Collection.prototype,"removeAttachment",null);__decorate([capable(["history"])],Collection.prototype,"getSnapshot",null);class Bucket{constructor(client,name,options={}){this.client=client;this.name=name;this._endpoints=client.endpoints;this._headers=options.headers||{};this._retry=options.retry||0;this._safe=!!options.safe;}
get execute(){return this.client.execute.bind(this.client);}
get headers(){return this._headers;}
_getHeaders(options){return Object.assign(Object.assign({},this._headers),options.headers);}
_getSafe(options){return Object.assign({safe:this._safe},options).safe;}
_getRetry(options){return Object.assign({retry:this._retry},options).retry;}
collection(name,options={}){return new Collection(this.client,this,name,{headers:this._getHeaders(options),retry:this._getRetry(options),safe:this._getSafe(options),});}
async getCollectionsTimestamp(options={}){const path=this._endpoints.collection(this.name);const request={headers:this._getHeaders(options),path,method:"HEAD",};const{headers}=(await this.client.execute(request,{raw:true,retry:this._getRetry(options),}));return headers.get("ETag");}
async getGroupsTimestamp(options={}){const path=this._endpoints.group(this.name);const request={headers:this._getHeaders(options),path,method:"HEAD",};const{headers}=(await this.client.execute(request,{raw:true,retry:this._getRetry(options),}));return headers.get("ETag");}
async getData(options={}){const path=this._endpoints.bucket(this.name);const request={headers:this._getHeaders(options),path,};const{data}=(await this.client.execute(request,{retry:this._getRetry(options),query:options.query,fields:options.fields,}));return data;}
async setData(data,options={}){if(!isObject(data)){throw new Error("A bucket object is required.");}
const bucket=Object.assign(Object.assign({},data),{id:this.name}); const bucketId=bucket.id;if(bucket.id==="default"){delete bucket.id;}
const path=this._endpoints.bucket(bucketId);const{patch,permissions}=options;const{last_modified}=Object.assign(Object.assign({},data),options);const request=updateRequest(path,{data:bucket,permissions},{last_modified,patch,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async listHistory(options={}){const path=this._endpoints.history(this.name);return this.client.paginatedList(path,options,{headers:this._getHeaders(options),retry:this._getRetry(options),});}
async listCollections(options={}){const path=this._endpoints.collection(this.name);return this.client.paginatedList(path,options,{headers:this._getHeaders(options),retry:this._getRetry(options),});}
async createCollection(id,options={}){const{permissions,data={}}=options;data.id=id;const path=this._endpoints.collection(this.name,id);const request=createRequest(path,{data,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async deleteCollection(collection,options={}){const collectionObj=toDataBody(collection);if(!collectionObj.id){throw new Error("A collection id is required.");}
const{id}=collectionObj;const{last_modified}=Object.assign(Object.assign({},collectionObj),options);const path=this._endpoints.collection(this.name,id);const request=deleteRequest(path,{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async listGroups(options={}){const path=this._endpoints.group(this.name);return this.client.paginatedList(path,options,{headers:this._getHeaders(options),retry:this._getRetry(options),});}
async getGroup(id,options={}){const path=this._endpoints.group(this.name,id);const request={headers:this._getHeaders(options),path,};return this.client.execute(request,{retry:this._getRetry(options),query:options.query,fields:options.fields,});}
async createGroup(id,members=[],options={}){const data=Object.assign(Object.assign({},options.data),{id,members});const path=this._endpoints.group(this.name,id);const{permissions}=options;const request=createRequest(path,{data,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async updateGroup(group,options={}){if(!isObject(group)){throw new Error("A group object is required.");}
if(!group.id){throw new Error("A group id is required.");}
const data=Object.assign(Object.assign({},options.data),group);const path=this._endpoints.group(this.name,group.id);const{patch,permissions}=options;const{last_modified}=Object.assign(Object.assign({},data),options);const request=updateRequest(path,{data,permissions},{last_modified,patch,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async deleteGroup(group,options={}){const groupObj=toDataBody(group);const{id}=groupObj;const{last_modified}=Object.assign(Object.assign({},groupObj),options);const path=this._endpoints.group(this.name,id);const request=deleteRequest(path,{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async getPermissions(options={}){const request={headers:this._getHeaders(options),path:this._endpoints.bucket(this.name),};const{permissions}=(await this.client.execute(request,{retry:this._getRetry(options),}));return permissions;}
async setPermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.bucket(this.name);const{last_modified}=options;const data={last_modified};const request=updateRequest(path,{data,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async addPermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.bucket(this.name);const{last_modified}=options;const request=jsonPatchPermissionsRequest(path,permissions,"add",{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async removePermissions(permissions,options={}){if(!isObject(permissions)){throw new Error("A permissions object is required.");}
const path=this._endpoints.bucket(this.name);const{last_modified}=options;const request=jsonPatchPermissionsRequest(path,permissions,"remove",{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),});return this.client.execute(request,{retry:this._getRetry(options),});}
async batch(fn,options={}){return this.client.batch(fn,{bucket:this.name,headers:this._getHeaders(options),retry:this._getRetry(options),safe:this._getSafe(options),aggregate:!!options.aggregate,});}}
__decorate([capable(["history"])],Bucket.prototype,"listHistory",null);const SUPPORTED_PROTOCOL_VERSION="v1";class KintoClientBase{constructor(remote,options){if(typeof remote!=="string"||!remote.length){throw new Error("Invalid remote URL: "+remote);}
if(remote[remote.length-1]==="/"){remote=remote.slice(0,-1);}
this._backoffReleaseTime=null;this._requests=[];this._isBatch=!!options.batch;this._retry=options.retry||0;this._safe=!!options.safe;this._headers=options.headers||{}; this.remote=remote;this.serverInfo=null;this.events=options.events;this.endpoints=ENDPOINTS;const{requestMode,timeout}=options;this.http=new HTTP(this.events,{requestMode,timeout});this._registerHTTPEvents();}
get remote(){return this._remote;}
set remote(url){let version;try{version=url.match(/\/(v\d+)\/?$/)[1];}
catch(err){throw new Error("The remote URL must contain the version: "+url);}
if(version!==SUPPORTED_PROTOCOL_VERSION){throw new Error(`Unsupported protocol version: ${version}`);}
this._remote=url;this._version=version;}
get version(){return this._version;}
get backoff(){const currentTime=new Date().getTime();if(this._backoffReleaseTime&&currentTime<this._backoffReleaseTime){return this._backoffReleaseTime-currentTime;}
return 0;}
_registerHTTPEvents(){ if(!this._isBatch&&this.events){this.events.on("backoff",(backoffMs)=>{this._backoffReleaseTime=backoffMs;});}}
bucket(name,options={}){return new Bucket(this,name,{headers:this._getHeaders(options),safe:this._getSafe(options),retry:this._getRetry(options),});}
setHeaders(headers){this._headers=Object.assign(Object.assign({},this._headers),headers);this.serverInfo=null;}
_getHeaders(options){return Object.assign(Object.assign({},this._headers),options.headers);}
_getSafe(options){return Object.assign({safe:this._safe},options).safe;}
_getRetry(options){return Object.assign({retry:this._retry},options).retry;}
async _getHello(options={}){const path=this.remote+ENDPOINTS.root();const{json}=await this.http.request(path,{headers:this._getHeaders(options)},{retry:this._getRetry(options)});return json;}
async fetchServerInfo(options={}){if(this.serverInfo){return this.serverInfo;}
this.serverInfo=await this._getHello({retry:this._getRetry(options)});return this.serverInfo;}
async fetchServerSettings(options={}){const{settings}=await this.fetchServerInfo(options);return settings;}
async fetchServerCapabilities(options={}){const{capabilities}=await this.fetchServerInfo(options);return capabilities;}
async fetchUser(options={}){const{user}=await this._getHello(options);return user;}
async fetchHTTPApiVersion(options={}){const{http_api_version}=await this.fetchServerInfo(options);return http_api_version;}
async _batchRequests(requests,options={}){const headers=this._getHeaders(options);if(!requests.length){return[];}
const serverSettings=await this.fetchServerSettings({retry:this._getRetry(options),});const maxRequests=serverSettings["batch_max_requests"];if(maxRequests&&requests.length>maxRequests){const chunks=partition(requests,maxRequests);const results=[];for(const chunk of chunks){const result=await this._batchRequests(chunk,options);results.push(...result);}
return results;}
const{responses}=(await this.execute({
headers,path:ENDPOINTS.batch(),method:"POST",body:{defaults:{headers},requests,},},{retry:this._getRetry(options)}));return responses;}
async batch(fn,options={}){const rootBatch=new KintoClientBase(this.remote,{events:this.events,batch:true,safe:this._getSafe(options),retry:this._getRetry(options),});if(options.bucket&&options.collection){fn(rootBatch.bucket(options.bucket).collection(options.collection));}
else if(options.bucket){fn(rootBatch.bucket(options.bucket));}
else{fn(rootBatch);}
const responses=await this._batchRequests(rootBatch._requests,options);if(options.aggregate){return aggregate(responses,rootBatch._requests);}
else{return responses;}}
async execute(request,options={}){const{raw=false,stringify=true}=options;if(this._isBatch){this._requests.push(request);
const msg=("This result is generated from within a batch "+"operation and should not be consumed.");return raw?{status:0,json:msg,headers:new Headers()}:msg;}
const uri=this.remote+addEndpointOptions(request.path,options);const result=await this.http.request(uri,cleanUndefinedProperties({



method:request.method,headers:request.headers,body:stringify?JSON.stringify(request.body):request.body,}),{retry:this._getRetry(options)});return raw?result:result.json;}
async paginatedList(path,params={},options={}){
const{sort,filters,limit,pages,since,fields}=Object.assign({sort:"-last_modified"},params);if(since&&typeof since!=="string"){throw new Error(`Invalid value for since (${since}), should be ETag value.`);}
const query=Object.assign(Object.assign({},filters),{_sort:sort,_limit:limit,_since:since});if(fields){query._fields=fields;}
const querystring=qsify(query);let results=[],current=0;const next=async function(nextPage){if(!nextPage){throw new Error("Pagination exhausted.");}
return processNextPage(nextPage);};const processNextPage=async(nextPage)=>{const{headers}=options;return handleResponse(await this.http.request(nextPage,{headers}));};const pageResults=(results,nextPage,etag)=>{return{last_modified:etag?etag.replace(/"/g,""):etag,data:results,next:next.bind(null,nextPage),hasNextPage:!!nextPage,totalRecords:-1,};};const handleResponse=async function({headers,json,}){const nextPage=headers.get("Next-Page");const etag=headers.get("ETag");if(!pages){return pageResults(json.data,nextPage,etag);} 
results=results.concat(json.data);current+=1;if(current>=pages||!nextPage){ return pageResults(results,nextPage,etag);} 
return processNextPage(nextPage);};return handleResponse((await this.execute(

{headers:options.headers?options.headers:{},path:path+"?"+querystring,},

{raw:true,retry:options.retry||0})));}
async listPermissions(options={}){const path=ENDPOINTS.permissions();
const paginationOptions=Object.assign({sort:"id"},options);return this.paginatedList(path,paginationOptions,{headers:this._getHeaders(options),retry:this._getRetry(options),});}
async listBuckets(options={}){const path=ENDPOINTS.bucket();return this.paginatedList(path,options,{headers:this._getHeaders(options),retry:this._getRetry(options),});}
async createBucket(id,options={}){const{data,permissions}=options;const _data=Object.assign(Object.assign({},data),{id:id?id:undefined});const path=_data.id?ENDPOINTS.bucket(_data.id):ENDPOINTS.bucket();return this.execute(createRequest(path,{data:_data,permissions},{headers:this._getHeaders(options),safe:this._getSafe(options),}),{retry:this._getRetry(options)});}
async deleteBucket(bucket,options={}){const bucketObj=toDataBody(bucket);if(!bucketObj.id){throw new Error("A bucket id is required.");}
const path=ENDPOINTS.bucket(bucketObj.id);const{last_modified}=Object.assign(Object.assign({},bucketObj),options);return this.execute(deleteRequest(path,{last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),}),{retry:this._getRetry(options)});}
async deleteBuckets(options={}){const path=ENDPOINTS.bucket();return this.execute(deleteRequest(path,{last_modified:options.last_modified,headers:this._getHeaders(options),safe:this._getSafe(options),}),{retry:this._getRetry(options)});}
async createAccount(username,password){return this.execute(createRequest(`/accounts/${username}`,{data:{password}},{method:"PUT"}));}}
__decorate([nobatch("This operation is not supported within a batch operation.")],KintoClientBase.prototype,"fetchServerSettings",null);__decorate([nobatch("This operation is not supported within a batch operation.")],KintoClientBase.prototype,"fetchServerCapabilities",null);__decorate([nobatch("This operation is not supported within a batch operation.")],KintoClientBase.prototype,"fetchUser",null);__decorate([nobatch("This operation is not supported within a batch operation.")],KintoClientBase.prototype,"fetchHTTPApiVersion",null);__decorate([nobatch("Can't use batch within a batch!")],KintoClientBase.prototype,"batch",null);__decorate([capable(["permissions_endpoint"])],KintoClientBase.prototype,"listPermissions",null);__decorate([support("1.4","2.0")],KintoClientBase.prototype,"deleteBuckets",null);__decorate([capable(["accounts"])],KintoClientBase.prototype,"createAccount",null);const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");class KintoHttpClient extends KintoClientBase{constructor(remote,options={}){const events={};EventEmitter.decorate(events);super(remote,Object.assign({events:events},options));}}
KintoHttpClient.errors=errors;return KintoHttpClient;})));