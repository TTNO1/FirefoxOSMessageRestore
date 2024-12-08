//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["FormAutoCompleteResult"];function FormAutoCompleteResult(searchString,searchResult,defaultIndex,errorDescription,values,labels,comments,prevResult){this.searchString=searchString;this._searchResult=searchResult;this._defaultIndex=defaultIndex;this._errorDescription=errorDescription;this._values=values;this._labels=labels;this._comments=comments;this._formHistResult=prevResult;this.entries=prevResult?prevResult.wrappedJSObject.entries:[];}
FormAutoCompleteResult.prototype={ searchString:"",_searchResult:0, _defaultIndex:0, _errorDescription:"",_formHistResult:null,entries:null,get wrappedJSObject(){return this;},get searchResult(){return this._searchResult;},get defaultIndex(){return this._defaultIndex;},get errorDescription(){return this._errorDescription;},get matchCount(){return this._values.length;},_checkIndexBounds(index){if(index<0||index>=this._values.length){throw Components.Exception("Index out of range.",Cr.NS_ERROR_ILLEGAL_VALUE);}},getValueAt(index){this._checkIndexBounds(index);return this._values[index];},getLabelAt(index){this._checkIndexBounds(index);return this._labels[index]||this._values[index];},getCommentAt(index){this._checkIndexBounds(index);return this._comments[index];},getStyleAt(index){this._checkIndexBounds(index);if(this._formHistResult&&index<this._formHistResult.matchCount){return"fromhistory";}
if(this._formHistResult&&this._formHistResult.matchCount>0&&index==this._formHistResult.matchCount){return"datalist-first";}
return null;},getImageAt(index){this._checkIndexBounds(index);return"";},getFinalCompleteValueAt(index){return this.getValueAt(index);},removeValueAt(index){this._checkIndexBounds(index);

if(this._formHistResult&&index<this._formHistResult.matchCount){ this._formHistResult.removeValueAt(index);}
this._values.splice(index,1);this._labels.splice(index,1);this._comments.splice(index,1);}, QueryInterface:ChromeUtils.generateQI(["nsIAutoCompleteResult"]),};