//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function isAutocompleteDisabled(aField){if(aField.autocomplete!==""){return aField.autocomplete==="off";}
return aField.form&&aField.form.autocomplete==="off";}
function FormHistoryClient({formField,inputName}){if(formField&&inputName!=this.SEARCHBAR_ID){let window=formField.ownerGlobal;this.windowGlobal=window.windowGlobalChild;}else if(inputName==this.SEARCHBAR_ID&&formField){throw new Error("FormHistoryClient constructed with both a "+"formField and an inputName. This is not "+"supported, and only empty results will be "+"returned.");}
this.inputName=inputName;this.id=FormHistoryClient.nextRequestID++;}
FormHistoryClient.prototype={SEARCHBAR_ID:"searchbar-history",cancelled:false,inputName:"",getActor(){if(this.windowGlobal){return this.windowGlobal.getActor("FormHistory");}
return null;},requestAutoCompleteResults(searchString,params,callback){this.cancelled=false;
let actor=this.getActor();if(actor){actor.sendQuery("FormHistory:AutoCompleteSearchAsync",{searchString,params,}).then(results=>{this.handleAutoCompleteResults(results,callback);},()=>this.cancel());}else{this.callback=callback;Services.cpmm.addMessageListener("FormHistory:AutoCompleteSearchResults",this);Services.cpmm.sendAsyncMessage("FormHistory:AutoCompleteSearchAsync",{id:this.id,searchString,params,});}},handleAutoCompleteResults(results,callback){if(this.cancelled){return;}
if(!callback){Cu.reportError("FormHistoryClient received response with no callback");return;}
callback(results);this.cancel();},cancel(){if(this.callback){Services.cpmm.removeMessageListener("FormHistory:AutoCompleteSearchResults",this);this.callback=null;}
this.cancelled=true;},remove(value,guid){let actor=this.getActor()||Services.cpmm;actor.sendAsyncMessage("FormHistory:RemoveEntry",{inputName:this.inputName,value,guid,});},receiveMessage(msg){let{id,results}=msg.data;if(id==this.id){this.handleAutoCompleteResults(results,this.callback);}},};FormHistoryClient.nextRequestID=1;function FormAutoComplete(){this.init();}
FormAutoComplete.prototype={classID:Components.ID("{c11c21b2-71c9-4f87-a0f8-5e13f50495fd}"),QueryInterface:ChromeUtils.generateQI(["nsIFormAutoComplete","nsISupportsWeakReference",]),_prefBranch:null,_debug:true, _enabled:true, _agedWeight:2,_bucketSize:1,_maxTimeGroupings:25,_timeGroupingSize:7*24*60*60*1000*1000,_expireDays:null,_boundaryWeight:25,_prefixWeight:5,



_pendingClient:null,init(){this._prefBranch=Services.prefs.getBranch("browser.formfill.");this._prefBranch.addObserver("",this.observer,true);this.observer._self=this;this._debug=this._prefBranch.getBoolPref("debug");this._enabled=this._prefBranch.getBoolPref("enable");this._agedWeight=this._prefBranch.getIntPref("agedWeight");this._bucketSize=this._prefBranch.getIntPref("bucketSize");this._maxTimeGroupings=this._prefBranch.getIntPref("maxTimeGroupings");this._timeGroupingSize=this._prefBranch.getIntPref("timeGroupingSize")*1000*1000;this._expireDays=this._prefBranch.getIntPref("expire_days");},observer:{_self:null,QueryInterface:ChromeUtils.generateQI(["nsIObserver","nsISupportsWeakReference",]),observe(subject,topic,data){let self=this._self;if(topic=="nsPref:changed"){let prefName=data;self.log("got change to "+prefName+" preference");switch(prefName){case"agedWeight":self._agedWeight=self._prefBranch.getIntPref(prefName);break;case"debug":self._debug=self._prefBranch.getBoolPref(prefName);break;case"enable":self._enabled=self._prefBranch.getBoolPref(prefName);break;case"maxTimeGroupings":self._maxTimeGroupings=self._prefBranch.getIntPref(prefName);break;case"timeGroupingSize":self._timeGroupingSize=self._prefBranch.getIntPref(prefName)*1000*1000;break;case"bucketSize":self._bucketSize=self._prefBranch.getIntPref(prefName);break;case"boundaryWeight":self._boundaryWeight=self._prefBranch.getIntPref(prefName);break;case"prefixWeight":self._prefixWeight=self._prefBranch.getIntPref(prefName);break;default:self.log("Oops! Pref not handled, change ignored.");}}},},
get wrappedJSObject(){return this;},log(message){if(!this._debug){return;}
dump("FormAutoComplete: "+message+"\n");Services.console.logStringMessage("FormAutoComplete: "+message);},autoCompleteSearchAsync(aInputName,aUntrimmedSearchString,aField,aPreviousResult,aDatalistResult,aListener,aOptions){if(typeof aInputName==="object"){aInputName="";}
if(typeof aUntrimmedSearchString==="object"){aUntrimmedSearchString="";}
let params={};if(aOptions){try{aOptions.QueryInterface(Ci.nsIPropertyBag2);for(let{name,value}of aOptions.enumerator){params[name]=value;}}catch(ex){Cu.reportError("Invalid options object: "+ex);}}
let client=new FormHistoryClient({formField:aField,inputName:aInputName,});function maybeNotifyListener(result){if(aListener){aListener.onSearchCompletion(result);}}
let emptyResult=aDatalistResult||new FormAutoCompleteResult(client,[],aInputName,aUntrimmedSearchString);if(!this._enabled){maybeNotifyListener(emptyResult);return;}

if(aInputName=="searchbar-history"&&aField){this.log('autoCompleteSearch for input name "'+aInputName+'" is denied');maybeNotifyListener(emptyResult);return;}
if(aField&&isAutocompleteDisabled(aField)){this.log("autoCompleteSearch not allowed due to autcomplete=off");maybeNotifyListener(emptyResult);return;}
this.log("AutoCompleteSearch invoked. Search is: "+aUntrimmedSearchString);let searchString=aUntrimmedSearchString.trim().toLowerCase();
 if(aPreviousResult&&aPreviousResult.searchString.trim().length>1&&searchString.includes(aPreviousResult.searchString.trim().toLowerCase())){this.log("Using previous autocomplete result");let result=aPreviousResult;let wrappedResult=result.wrappedJSObject;wrappedResult.searchString=aUntrimmedSearchString;






let allResults=wrappedResult._labels;let datalistResults,datalistLabels;if(allResults){let oldLabels=allResults.slice(wrappedResult.entries.length);let oldValues=wrappedResult._values.slice(wrappedResult.entries.length);datalistLabels=[];datalistResults=[];for(let i=0;i<oldLabels.length;++i){if(oldLabels[i].toLowerCase().includes(searchString)){datalistLabels.push(oldLabels[i]);datalistResults.push(oldValues[i]);}}}
let searchTokens=searchString.split(/\s+/);
let entries=wrappedResult.entries;let filteredEntries=[];for(let i=0;i<entries.length;i++){let entry=entries[i];
 if(searchTokens.some(tok=>!entry.textLowerCase.includes(tok))){continue;}
this._calculateScore(entry,searchString,searchTokens);this.log("Reusing autocomplete entry '"+
entry.text+"' ("+
entry.frecency+" / "+
entry.totalScore+")");filteredEntries.push(entry);}
filteredEntries.sort((a,b)=>b.totalScore-a.totalScore);wrappedResult.entries=filteredEntries;
if(datalistResults){filteredEntries=filteredEntries.map(elt=>elt.text);let comments=new Array(filteredEntries.length+datalistResults.length).fill("");comments[filteredEntries.length]="separator";

datalistLabels=new Array(filteredEntries.length).fill("").concat(datalistLabels);wrappedResult._values=filteredEntries.concat(datalistResults);wrappedResult._labels=datalistLabels;wrappedResult._comments=comments;}
maybeNotifyListener(result);}else{this.log("Creating new autocomplete search result.");let result=aDatalistResult?new FormAutoCompleteResult(client,[],aInputName,aUntrimmedSearchString):emptyResult;let processEntry=aEntries=>{if(aField&&aField.maxLength>-1){result.entries=aEntries.filter(el=>el.text.length<=aField.maxLength);}else{result.entries=aEntries;}
if(aDatalistResult&&aDatalistResult.matchCount>0){result=this.mergeResults(result,aDatalistResult);}
maybeNotifyListener(result);};this.getAutoCompleteValues(client,aInputName,searchString,params,processEntry);}},mergeResults(historyResult,datalistResult){let values=datalistResult.wrappedJSObject._values;let labels=datalistResult.wrappedJSObject._labels;let comments=new Array(values.length).fill("");
let entries=historyResult.wrappedJSObject.entries;let historyResults=entries.map(entry=>entry.text);let historyComments=new Array(entries.length).fill(""); let finalValues=historyResults.concat(values);let finalLabels=historyResults.concat(labels);let finalComments=historyComments.concat(comments);




let{FormAutoCompleteResult}=ChromeUtils.import("resource://gre/modules/nsFormAutoCompleteResult.jsm");return new FormAutoCompleteResult(datalistResult.searchString,Ci.nsIAutoCompleteResult.RESULT_SUCCESS,0,"",finalValues,finalLabels,finalComments,historyResult);},stopAutoCompleteSearch(){if(this._pendingClient){this._pendingClient.cancel();this._pendingClient=null;}},getAutoCompleteValues(client,fieldName,searchString,params,callback){params=Object.assign({agedWeight:this._agedWeight,bucketSize:this._bucketSize,expiryDate:1000*(Date.now()-this._expireDays*24*60*60*1000),fieldname:fieldName,maxTimeGroupings:this._maxTimeGroupings,timeGroupingSize:this._timeGroupingSize,prefixWeight:this._prefixWeight,boundaryWeight:this._boundaryWeight,},params);this.stopAutoCompleteSearch();client.requestAutoCompleteResults(searchString,params,entries=>{this._pendingClient=null;callback(entries);});this._pendingClient=client;},_calculateScore(entry,aSearchString,searchTokens){let boundaryCalc=0; for(let token of searchTokens){if(entry.textLowerCase.startsWith(token)){boundaryCalc++;}
if(entry.textLowerCase.includes(" "+token)){boundaryCalc++;}}
boundaryCalc=boundaryCalc*this._boundaryWeight;
 if(entry.textLowerCase.startsWith(aSearchString)){boundaryCalc+=this._prefixWeight;}
entry.totalScore=Math.round(entry.frecency*Math.max(1,boundaryCalc));},};
function FormAutoCompleteResult(client,entries,fieldName,searchString){this.client=client;this.entries=entries;this.fieldName=fieldName;this.searchString=searchString;}
FormAutoCompleteResult.prototype={QueryInterface:ChromeUtils.generateQI(["nsIAutoCompleteResult","nsISupportsWeakReference",]), client:null,entries:null,fieldName:null,_checkIndexBounds(index){if(index<0||index>=this.entries.length){throw Components.Exception("Index out of range.",Cr.NS_ERROR_ILLEGAL_VALUE);}},
get wrappedJSObject(){return this;},searchString:"",errorDescription:"",get defaultIndex(){if(!this.entries.length){return-1;}
return 0;},get searchResult(){if(!this.entries.length){return Ci.nsIAutoCompleteResult.RESULT_NOMATCH;}
return Ci.nsIAutoCompleteResult.RESULT_SUCCESS;},get matchCount(){return this.entries.length;},getValueAt(index){this._checkIndexBounds(index);return this.entries[index].text;},getLabelAt(index){return this.getValueAt(index);},getCommentAt(index){this._checkIndexBounds(index);return"";},getStyleAt(index){this._checkIndexBounds(index);return"";},getImageAt(index){this._checkIndexBounds(index);return"";},getFinalCompleteValueAt(index){return this.getValueAt(index);},removeValueAt(index){this._checkIndexBounds(index);let[removedEntry]=this.entries.splice(index,1);this.client.remove(removedEntry.text,removedEntry.guid);},};var EXPORTED_SYMBOLS=["FormAutoComplete"];