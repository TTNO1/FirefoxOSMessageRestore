"use strict";loader.lazyRequireGetter(this,"isWhitespaceTextNode","devtools/server/actors/inspector/utils",true);function WalkerIndex(walker){this.walker=walker;this.clearIndex=this.clearIndex.bind(this);this.walker.on("any-mutation",this.clearIndex);}
WalkerIndex.prototype={destroy:function(){this.walker.off("any-mutation",this.clearIndex);},clearIndex:function(){if(!this.currentlyIndexing){this._data=null;}},get doc(){return this.walker.rootDoc;},get data(){if(!this._data){this._data=new Map();this.index();}
return this._data;},_addToIndex:function(type,node,value){ const entry=this._data.get(value);if(!entry){this._data.set(value,[]);} 
this._data.get(value).push({type:type,node:node,});},index:function(){
this.currentlyIndexing=true;const documentWalker=this.walker.getDocumentWalker(this.doc);while(documentWalker.nextNode()){const node=documentWalker.currentNode;if(node.nodeType===1){
 const localName=node.localName;if(localName==="_moz_generated_content_marker"){this._addToIndex("tag",node,"::marker");this._addToIndex("text",node,node.textContent.trim());}else if(localName==="_moz_generated_content_before"){this._addToIndex("tag",node,"::before");this._addToIndex("text",node,node.textContent.trim());}else if(localName==="_moz_generated_content_after"){this._addToIndex("tag",node,"::after");this._addToIndex("text",node,node.textContent.trim());}else{this._addToIndex("tag",node,node.localName);}
for(const{name,value}of node.attributes){this._addToIndex("attributeName",node,name);this._addToIndex("attributeValue",node,value);}}else if(node.textContent&&node.textContent.trim().length){ this._addToIndex("text",node,node.textContent.trim());}}
this.currentlyIndexing=false;},};exports.WalkerIndex=WalkerIndex;function WalkerSearch(walker){this.walker=walker;this.index=new WalkerIndex(this.walker);}
WalkerSearch.prototype={destroy:function(){this.index.destroy();this.walker=null;},_addResult:function(node,type,results){if(!results.has(node)){results.set(node,[]);}
const matches=results.get(node); let isKnown=false;for(const match of matches){if(match.type===type){isKnown=true;break;}}
if(!isKnown){matches.push({type});}},_searchIndex:function(query,options,results){for(const[matched,res]of this.index.data){if(!options.searchMethod(query,matched)){continue;}
res.filter(entry=>{return options.types.includes(entry.type);}).forEach(({node,type})=>{this._addResult(node,type,results);});}},_searchSelectors:function(query,options,results){
 const isSelector=query&&query.match(/[ >~.#\[\]]/);if(!options.types.includes("selector")||!isSelector){return;}
const nodes=this.walker._multiFrameQuerySelectorAll(query);for(const node of nodes){this._addResult(node,"selector",results);}},_searchXPath:function(query,options,results){if(!options.types.includes("xpath")){return;}
const nodes=this.walker._multiFrameXPath(query);for(const node of nodes){
if(!isWhitespaceTextNode(node)){this._addResult(node,"xpath",results);}}},search:function(query,options={}){options.searchMethod=options.searchMethod||WalkerSearch.SEARCH_METHOD_CONTAINS;options.types=options.types||WalkerSearch.ALL_RESULTS_TYPES; if(typeof query!=="string"){query="";} 
const results=new Map(); this._searchIndex(query,options,results); this._searchSelectors(query,options,results); this._searchXPath(query,options,results); const resultList=[];for(const[node,matches]of results){for(const{type}of matches){resultList.push({node:node,type:type,});

break;}}
const documents=this.walker.targetActor.windows.map(win=>win.document); resultList.sort((a,b)=>{
if(a.node.ownerDocument!=b.node.ownerDocument){const indA=documents.indexOf(a.node.ownerDocument);const indB=documents.indexOf(b.node.ownerDocument);return indA-indB;}
return a.node.compareDocumentPosition(b.node)&4?-1:1;});return resultList;},};WalkerSearch.SEARCH_METHOD_CONTAINS=(query,candidate)=>{return query&&candidate.toLowerCase().includes(query.toLowerCase());};WalkerSearch.ALL_RESULTS_TYPES=["tag","text","attributeName","attributeValue","selector","xpath",];exports.WalkerSearch=WalkerSearch;