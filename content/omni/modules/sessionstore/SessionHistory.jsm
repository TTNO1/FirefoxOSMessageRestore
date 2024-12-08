"use strict";var EXPORTED_SYMBOLS=["SessionHistory"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"E10SUtils","resource://gre/modules/E10SUtils.jsm");XPCOMUtils.defineLazyServiceGetter(this,"uuidGenerator","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");function debug(msg){Services.console.logStringMessage("SessionHistory: "+msg);}
var SessionHistory=Object.freeze({isEmpty(docShell){return SessionHistoryInternal.isEmpty(docShell);},collect(docShell,aFromIdx=-1){if(Services.appinfo.sessionHistoryInParent){throw new Error("Use SessionHistory.collectFromParent instead");}
return SessionHistoryInternal.collect(docShell,aFromIdx);},collectFromParent(uri,body,history,userContextId,aFromIdx=-1){return SessionHistoryInternal.collectCommon(uri,body,history,userContextId,aFromIdx);},restore(docShell,tabData){if(Services.appinfo.sessionHistoryInParent){throw new Error("Use SessionHistory.restoreFromParent instead");}
return SessionHistoryInternal.restore(docShell.QueryInterface(Ci.nsIWebNavigation).sessionHistory.legacySHistory,tabData);},restoreFromParent(history,tabData){return SessionHistoryInternal.restore(history,tabData);},});var SessionHistoryInternal={_docshellUUIDMap:new Map(),isEmpty(docShell){let webNavigation=docShell.QueryInterface(Ci.nsIWebNavigation);let history=webNavigation.sessionHistory;if(!webNavigation.currentURI){return true;}
let uri=webNavigation.currentURI.spec;return uri=="about:blank"&&history.count==0;},collect(docShell,aFromIdx=-1){let loadContext=docShell.QueryInterface(Ci.nsILoadContext);let webNavigation=docShell.QueryInterface(Ci.nsIWebNavigation);let uri=webNavigation.currentURI.displaySpec;let body=webNavigation.document.body;let history=webNavigation.sessionHistory;let userContextId=loadContext.originAttributes.userContextId;return this.collectCommon(uri,body,history.legacySHistory,userContextId,aFromIdx);},collectCommon(uri,body,shistory,userContextId,aFromIdx){let data={entries:[],userContextId,requestedIndex:shistory.requestedIndex+1,};

let skippedCount=0,entryCount=0;if(shistory&&shistory.count>0){let count=shistory.count;for(;entryCount<count;entryCount++){let shEntry=shistory.getEntryAtIndex(entryCount);if(entryCount<=aFromIdx){skippedCount++;continue;}
let entry=this.serializeEntry(shEntry);data.entries.push(entry);}
data.index=Math.min(shistory.index+1,entryCount);}

if(!data.entries.length&&(skippedCount!=entryCount||aFromIdx<0)){



if(uri!="about:blank"||(body&&body.hasChildNodes())){data.entries.push({url:uri,triggeringPrincipal_base64:E10SUtils.SERIALIZED_SYSTEMPRINCIPAL,});data.index=1;}}
data.fromIdx=aFromIdx;return data;},serializeEntry(shEntry){let entry={url:shEntry.URI.displaySpec,title:shEntry.title};if(shEntry.isSubFrame){entry.subframe=true;}
entry.cacheKey=shEntry.cacheKey;entry.ID=shEntry.ID;entry.docshellUUID=shEntry.docshellID.toString();
if(shEntry.referrerInfo){entry.referrerInfo=E10SUtils.serializeReferrerInfo(shEntry.referrerInfo);}
if(shEntry.originalURI){entry.originalURI=shEntry.originalURI.spec;}
if(shEntry.resultPrincipalURI){entry.resultPrincipalURI=shEntry.resultPrincipalURI.spec;




entry.loadReplace=entry.resultPrincipalURI!=entry.originalURI;}else{

entry.resultPrincipalURI=null;}
if(shEntry.loadReplace){
entry.loadReplace2=shEntry.loadReplace;}
if(shEntry.srcdocData){entry.srcdocData=shEntry.srcdocData;}
if(shEntry.isSrcdocEntry){entry.isSrcdocEntry=shEntry.isSrcdocEntry;}
if(shEntry.baseURI){entry.baseURI=shEntry.baseURI.spec;}
if(shEntry.contentType){entry.contentType=shEntry.contentType;}
if(shEntry.scrollRestorationIsManual){entry.scrollRestorationIsManual=true;}else{let x={},y={};shEntry.getScrollPosition(x,y);if(x.value!==0||y.value!==0){entry.scroll=x.value+","+y.value;}
let layoutHistoryState=shEntry.layoutHistoryState;if(layoutHistoryState&&layoutHistoryState.hasStates){let presStates=layoutHistoryState.getKeys().map(key=>this._getSerializablePresState(layoutHistoryState,key)).filter(presState=>Object.getOwnPropertyNames(presState).length>1);if(presStates.length){entry.presState=presStates;}}}
if(shEntry.principalToInherit){entry.principalToInherit_base64=E10SUtils.serializePrincipal(shEntry.principalToInherit);}
if(shEntry.partitionedPrincipalToInherit){entry.partitionedPrincipalToInherit_base64=E10SUtils.serializePrincipal(shEntry.partitionedPrincipalToInherit);}
entry.hasUserInteraction=shEntry.hasUserInteraction;if(shEntry.triggeringPrincipal){entry.triggeringPrincipal_base64=E10SUtils.serializePrincipal(shEntry.triggeringPrincipal);}
if(shEntry.csp){entry.csp=E10SUtils.serializeCSP(shEntry.csp);}
entry.docIdentifier=shEntry.bfcacheID;if(shEntry.stateData!=null){let stateData=shEntry.stateData;entry.structuredCloneState=stateData.getDataAsBase64();entry.structuredCloneVersion=stateData.formatVersion;}
if(shEntry.childCount>0&&!shEntry.hasDynamicallyAddedChild()){let children=[];for(let i=0;i<shEntry.childCount;i++){let child=shEntry.GetChildAt(i);if(child){
if(child.URI.schemeIs("wyciwyg")){children.length=0;break;}
children.push(this.serializeEntry(child));}}
if(children.length){entry.children=children;}}
entry.persist=shEntry.persist;return entry;},_getSerializablePresState(layoutHistoryState,stateKey){let presState={stateKey};let x={},y={},scrollOriginDowngrade={},res={};layoutHistoryState.getPresState(stateKey,x,y,scrollOriginDowngrade,res);if(x.value!==0||y.value!==0){presState.scroll=x.value+","+y.value;}
if(scrollOriginDowngrade.value===false){presState.scrollOriginDowngrade=scrollOriginDowngrade.value;}
if(res.value!=1.0){presState.res=res.value;}
return presState;},restore(history,tabData){if(history.count>0){history.purgeHistory(history.count);}
let idMap={used:{}};let docIdentMap={};for(let i=0;i<tabData.entries.length;i++){let entry=tabData.entries[i]; if(!entry.url){continue;}
let persist="persist"in entry?entry.persist:true;let shEntry=this.deserializeEntry(entry,idMap,docIdentMap,history);


if(entry.hasUserInteraction==undefined){shEntry.hasUserInteraction=true;}else{shEntry.hasUserInteraction=entry.hasUserInteraction;}
history.addEntry(shEntry,persist);}
let index=tabData.index-1;if(index<history.count&&history.index!=index){history.index=index;}
return history;},deserializeEntry(entry,idMap,docIdentMap,shistory){var shEntry=shistory.createEntry();shEntry.URI=Services.io.newURI(entry.url);shEntry.title=entry.title||entry.url;if(entry.subframe){shEntry.isSubFrame=entry.subframe||false;}
shEntry.setLoadTypeAsHistory();if(entry.contentType){shEntry.contentType=entry.contentType;}

if(entry.referrerInfo){shEntry.referrerInfo=E10SUtils.deserializeReferrerInfo(entry.referrerInfo);}else if(entry.referrer){let ReferrerInfo=Components.Constructor("@mozilla.org/referrer-info;1","nsIReferrerInfo","init");shEntry.referrerInfo=new ReferrerInfo(entry.referrerPolicy,true,Services.io.newURI(entry.referrer));}
if(entry.originalURI){shEntry.originalURI=Services.io.newURI(entry.originalURI);}
if(typeof entry.resultPrincipalURI==="undefined"&&entry.loadReplace){


shEntry.resultPrincipalURI=shEntry.URI;}else if(entry.resultPrincipalURI){shEntry.resultPrincipalURI=Services.io.newURI(entry.resultPrincipalURI);}
if(entry.loadReplace2){shEntry.loadReplace=entry.loadReplace2;}
if(entry.isSrcdocEntry){shEntry.srcdocData=entry.srcdocData;}
if(entry.baseURI){shEntry.baseURI=Services.io.newURI(entry.baseURI);}
if(entry.cacheKey){shEntry.cacheKey=entry.cacheKey;}
if(entry.ID){
var id=idMap[entry.ID]||0;if(!id){ for(id=Date.now();id in idMap.used;id++){}
idMap[entry.ID]=id;idMap.used[id]=true;}
shEntry.ID=id;}

if(entry.docshellID){if(!this._docshellUUIDMap.has(entry.docshellID)){
this._docshellUUIDMap.set(entry.docshellID,uuidGenerator.generateUUID().toString());}
entry.docshellUUID=this._docshellUUIDMap.get(entry.docshellID);delete entry.docshellID;}
if(entry.docshellUUID){shEntry.docshellID=Components.ID(entry.docshellUUID);}
if(entry.structuredCloneState&&entry.structuredCloneVersion){var stateData=Cc["@mozilla.org/docshell/structured-clone-container;1"].createInstance(Ci.nsIStructuredCloneContainer);stateData.initFromBase64(entry.structuredCloneState,entry.structuredCloneVersion);shEntry.stateData=stateData;}
if(entry.scrollRestorationIsManual){shEntry.scrollRestorationIsManual=true;}else{if(entry.scroll){shEntry.setScrollPosition(...this._deserializeScrollPosition(entry.scroll));}
if(entry.presState){let layoutHistoryState=shEntry.initLayoutHistoryState();for(let presState of entry.presState){this._deserializePresState(layoutHistoryState,presState);}}}
let childDocIdents={};if(entry.docIdentifier){


let matchingEntry=docIdentMap[entry.docIdentifier];if(!matchingEntry){matchingEntry={shEntry,childDocIdents};docIdentMap[entry.docIdentifier]=matchingEntry;}else{shEntry.adoptBFCacheEntry(matchingEntry.shEntry);childDocIdents=matchingEntry.childDocIdents;}}
shEntry.triggeringPrincipal=E10SUtils.deserializePrincipal(entry.triggeringPrincipal_base64,()=>{
debug("Couldn't deserialize the triggeringPrincipal, falling back to NullPrincipal");return Services.scriptSecurityManager.createNullPrincipal({});});
if(entry.partitionedPrincipalToInherit_base64){shEntry.partitionedPrincipalToInherit=E10SUtils.deserializePrincipal(entry.partitionedPrincipalToInherit_base64);}
if(entry.principalToInherit_base64){shEntry.principalToInherit=E10SUtils.deserializePrincipal(entry.principalToInherit_base64);}
if(entry.csp){shEntry.csp=E10SUtils.deserializeCSP(entry.csp);}
if(entry.children){for(var i=0;i<entry.children.length;i++){ if(!entry.children[i].url){continue;}








shEntry.AddChild(this.deserializeEntry(entry.children[i],idMap,childDocIdents,shistory),i);}}
return shEntry;},_deserializePresState(layoutHistoryState,presState){let stateKey=presState.stateKey;let scrollOriginDowngrade=typeof presState.scrollOriginDowngrade=="boolean"?presState.scrollOriginDowngrade:true;let res=presState.res||1.0;layoutHistoryState.addNewPresState(stateKey,...this._deserializeScrollPosition(presState.scroll),scrollOriginDowngrade,res);},_deserializeScrollPosition(scroll="0,0"){return scroll.split(",").map(pos=>parseInt(pos,10)||0);},};