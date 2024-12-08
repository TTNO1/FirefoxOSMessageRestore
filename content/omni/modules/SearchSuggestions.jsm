//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{FormAutoCompleteResult}=ChromeUtils.import("resource://gre/modules/nsFormAutoCompleteResult.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"SearchSuggestionController","resource://gre/modules/SearchSuggestionController.jsm");function SuggestAutoComplete(){this._init();}
SuggestAutoComplete.prototype={_init(){this._suggestionController=new SearchSuggestionController(obj=>this.onResultsReturned(obj));this._suggestionController.maxLocalResults=this._historyLimit;},_listener:null,_historyLimit:7,onResultsReturned(results){let finalResults=[];let finalComments=[];for(let i=0;i<results.local.length;++i){finalResults.push(results.local[i].value);finalComments.push("");}
if(results.remote.length){ let comments=new Array(results.remote.length).fill("");
let nonTailEntries=results.remote.filter(e=>!e.matchPrefix&&!e.tail);finalResults=finalResults.concat(nonTailEntries.map(e=>e.value));finalComments=finalComments.concat(comments);} 
this.onResultsReady(results.term,finalResults,finalComments,results.formHistoryResult);},onResultsReady(searchString,results,comments,formHistoryResult){if(this._listener){

let labels=results.slice();let result=new FormAutoCompleteResult(searchString,Ci.nsIAutoCompleteResult.RESULT_SUCCESS,0,"",results,labels,comments,formHistoryResult);this._listener.onSearchResult(this,result); this._listener=null;}},startSearch(searchString,searchParam,previousResult,listener){if(!previousResult){this._formHistoryResult=null;}
var formHistorySearchParam=searchParam.split("|")[0];





var privacyMode=searchParam.split("|")[1]=="private";
 if(Services.search.isInitialized){this._triggerSearch(searchString,formHistorySearchParam,listener,privacyMode);return;}
Services.search.init().then(()=>{this._triggerSearch(searchString,formHistorySearchParam,listener,privacyMode);}).catch(result=>Cu.reportError("Could not initialize search service, bailing out: "+result));},_triggerSearch(searchString,searchParam,listener,privacyMode){this._listener=listener;this._suggestionController.fetch(searchString,privacyMode,Services.search.defaultEngine);},stopSearch(){this._suggestionController.stop();}, QueryInterface:ChromeUtils.generateQI(["nsIAutoCompleteSearch","nsIAutoCompleteObserver",]),};function SearchSuggestAutoComplete(){
this._init();}
SearchSuggestAutoComplete.prototype={classID:Components.ID("{aa892eb4-ffbf-477d-9f9a-06c995ae9f27}"),__proto__:SuggestAutoComplete.prototype,serviceURL:"",};var EXPORTED_SYMBOLS=["SearchSuggestAutoComplete"];