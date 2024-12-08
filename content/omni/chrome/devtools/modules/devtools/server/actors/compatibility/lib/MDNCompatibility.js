"use strict";const _SUPPORT_STATE={BROWSER_NOT_FOUND:"BROWSER_NOT_FOUND",DATA_NOT_FOUND:"DATA_NOT_FOUND",SUPPORTED:"SUPPORTED",UNSUPPORTED:"UNSUPPORTED",UNSUPPORTED_PREFIX_NEEDED:"UNSUPPORTED_PREFIX_NEEDED",};const{COMPATIBILITY_ISSUE_TYPE}=require("devtools/shared/constants");class MDNCompatibility{constructor(cssPropertiesCompatData){this._cssPropertiesCompatData=cssPropertiesCompatData;this._flattenAliases(this._cssPropertiesCompatData);}
getCSSDeclarationBlockIssues(declarations,browsers){const summaries=[];for(const{name:property}of declarations){if(property.startsWith("--")){continue;}
summaries.push(this._getCSSPropertyCompatSummary(browsers,property));}
const{aliasSummaries,normalSummaries,}=this._classifyCSSCompatSummaries(summaries,browsers);return this._toCSSIssues(normalSummaries.concat(aliasSummaries));}
_asFloatVersion(version=false){if(version===true){return 0;}
if(version===false){return Number.MAX_VALUE;}
if(version.startsWith("\u2264")){version=version.substring(1);}
return parseFloat(version);}
_classifyCSSCompatSummaries(summaries,browsers){const aliasSummariesMap=new Map();const normalSummaries=summaries.filter(s=>{const{database,invalid,terms,unsupportedBrowsers,prefixNeededBrowsers,}=s;if(invalid){return true;}
const alias=this._getAlias(database,...terms);if(!alias){return true;}
if(!aliasSummariesMap.has(alias)){aliasSummariesMap.set(alias,Object.assign(s,{property:alias,aliases:[],unsupportedBrowsers:browsers,prefixNeededBrowsers:browsers,}));}
const terminal=terms.pop();const aliasSummary=aliasSummariesMap.get(alias);if(!aliasSummary.aliases.includes(terminal)){aliasSummary.aliases.push(terminal);}
aliasSummary.unsupportedBrowsers=aliasSummary.unsupportedBrowsers.filter(b=>unsupportedBrowsers.includes(b));aliasSummary.prefixNeededBrowsers=aliasSummary.prefixNeededBrowsers.filter(b=>prefixNeededBrowsers.includes(b));return false;});const aliasSummaries=[...aliasSummariesMap.values()].map(s=>{s.prefixNeeded=s.prefixNeededBrowsers.length!==0;return s;});return{aliasSummaries,normalSummaries};}
_findAliasesFrom(compatTable){const aliases=[];for(const browser in compatTable.support){let supportStates=compatTable.support[browser]||[];supportStates=Array.isArray(supportStates)?supportStates:[supportStates];for(const{alternative_name:name,prefix}of supportStates){if(!prefix&&!name){continue;}
aliases.push({alternative_name:name,prefix});}}
return aliases;}
_flattenAliases(compatNode){for(const term in compatNode){if(term.startsWith("_")){continue;}
const compatTable=this._getCompatTable(compatNode,[term]);if(compatTable){const aliases=this._findAliasesFrom(compatTable);for(const{alternative_name:name,prefix}of aliases){const alias=name||prefix+term;compatNode[alias]={_aliasOf:term};}
if(aliases.length){compatNode[term]._aliasOf=term;}}
this._flattenAliases(compatNode[term]);}}
_getAlias(compatNode,...terms){const targetNode=this._getCompatNode(compatNode,terms);return targetNode?targetNode._aliasOf:null;}
_getChildCompatNode(compatNode,term){term=term.toLowerCase();let child=null;for(const field in compatNode){if(field.toLowerCase()===term){child=compatNode[field];break;}}
if(!child){return null;}
if(child._aliasOf){child=compatNode[child._aliasOf];}
return child;}
_getCompatNode(compatNode,terms){for(const term of terms){compatNode=this._getChildCompatNode(compatNode,term);if(!compatNode){return null;}}
return compatNode;}
_getCompatTable(compatNode,terms){let targetNode=this._getCompatNode(compatNode,terms);if(!targetNode){return null;}
if(!targetNode.__compat){for(const field in targetNode){
 if(field.endsWith("_context")){targetNode=targetNode[field];break;}}}
return targetNode.__compat;}
_getCompatSummary(browsers,database,...terms){if(!this._hasTerm(database,...terms)){return{invalid:true,unsupportedBrowsers:[]};}
const{unsupportedBrowsers,prefixNeededBrowsers}=browsers.reduce((value,browser)=>{const state=this._getSupportState(browser,database,...terms);switch(state){case _SUPPORT_STATE.UNSUPPORTED_PREFIX_NEEDED:{value.prefixNeededBrowsers.push(browser);value.unsupportedBrowsers.push(browser);break;}
case _SUPPORT_STATE.UNSUPPORTED:{value.unsupportedBrowsers.push(browser);break;}}
return value;},{unsupportedBrowsers:[],prefixNeededBrowsers:[]});const{deprecated,experimental}=this._getStatus(database,...terms);const url=this._getMDNLink(database,...terms);return{database,terms,url,deprecated,experimental,unsupportedBrowsers,prefixNeededBrowsers,};}
_getCSSPropertyCompatSummary(browsers,property){const summary=this._getCompatSummary(browsers,this._cssPropertiesCompatData,property);return Object.assign(summary,{property});}
_getMDNLink(compatNode,...terms){for(;terms.length>0;terms.pop()){const compatTable=this._getCompatTable(compatNode,terms);const url=compatTable?compatTable.mdn_url:null;if(url){return url;}}
return null;}
_getSupportState(browser,compatNode,...terms){const compatTable=this._getCompatTable(compatNode,terms);if(!compatTable){return _SUPPORT_STATE.DATA_NOT_FOUND;}
let supportList=compatTable.support[browser.id];if(!supportList){return _SUPPORT_STATE.BROWSER_NOT_FOUND;}
supportList=Array.isArray(supportList)?supportList:[supportList];const version=parseFloat(browser.version);const terminal=terms[terms.length-1];const match=terminal.match(/^-\w+-/);const prefix=match?match[0]:undefined;const isPrefixedData=prefix&&!this._getAlias(compatNode,...terms);let prefixNeeded=false;for(const support of supportList){const{version_added:added,version_removed:removed}=support;const addedVersion=this._asFloatVersion(added===null?true:added);const removedVersion=this._asFloatVersion(removed===null?false:removed);if(addedVersion<=version&&version<removedVersion){if(support.alternative_name){if(support.alternative_name===terminal){return _SUPPORT_STATE.SUPPORTED;}}else if(isPrefixedData||support.prefix===prefix){return _SUPPORT_STATE.SUPPORTED;}
prefixNeeded=true;}}
return prefixNeeded?_SUPPORT_STATE.UNSUPPORTED_PREFIX_NEEDED:_SUPPORT_STATE.UNSUPPORTED;}
_getStatus(compatNode,...terms){const compatTable=this._getCompatTable(compatNode,terms);return compatTable?compatTable.status:{};}
_hasIssue({unsupportedBrowsers,deprecated,experimental,invalid}){return(!invalid&&(unsupportedBrowsers.length||deprecated||experimental));}
_hasTerm(compatNode,...terms){return!!this._getCompatTable(compatNode,terms);}
_toIssue(summary,type){const issue=Object.assign({},summary,{type});delete issue.database;delete issue.terms;delete issue.prefixNeededBrowsers;return issue;}
_toCSSIssues(summaries){const issues=[];for(const summary of summaries){if(!this._hasIssue(summary)){continue;}
const type=summary.aliases?COMPATIBILITY_ISSUE_TYPE.CSS_PROPERTY_ALIASES:COMPATIBILITY_ISSUE_TYPE.CSS_PROPERTY;issues.push(this._toIssue(summary,type));}
return issues;}}
module.exports=MDNCompatibility;