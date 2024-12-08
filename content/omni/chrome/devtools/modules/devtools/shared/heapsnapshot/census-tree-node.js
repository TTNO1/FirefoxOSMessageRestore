"use strict";





const{Visitor,walk,basisTotalBytes,basisTotalCount,}=require("resource://devtools/shared/heapsnapshot/CensusUtils.js");let censusTreeNodeIdCounter=0;function isSavedFrame(obj){return Object.prototype.toString.call(obj)==="[object SavedFrame]";}
function CensusTreeNodeCache(){}
CensusTreeNodeCache.prototype=null;function CensusTreeNodeCacheValue(){this.node=undefined;this.children=undefined;}
CensusTreeNodeCacheValue.prototype=null;CensusTreeNodeCache.hashFrame=function(frame){ return`FRAME,${frame.functionDisplayName},${frame.source},${frame.line},${frame.column},${frame.asyncCause}`;};CensusTreeNodeCache.hashNode=function(node){return isSavedFrame(node.name)?CensusTreeNodeCache.hashFrame(node.name):`NODE,${node.name}`;};CensusTreeNodeCache.insertFrame=function(cache,value){cache[CensusTreeNodeCache.hashFrame(value.node.name)]=value;};CensusTreeNodeCache.insertNode=function(cache,value){if(isSavedFrame(value.node.name)){CensusTreeNodeCache.insertFrame(cache,value);}else{cache[CensusTreeNodeCache.hashNode(value.node)]=value;}};CensusTreeNodeCache.lookupFrame=function(cache,frame){return cache[CensusTreeNodeCache.hashFrame(frame)];};CensusTreeNodeCache.lookupNode=function(cache,node){return isSavedFrame(node.name)?CensusTreeNodeCache.lookupFrame(cache,node.name):cache[CensusTreeNodeCache.hashNode(node)];};function addChild(parent,child){if(!parent.children){parent.children=[];}
child.parent=parent.id;parent.children.push(child);}
function getArrayOfFrames(stack){const frames=[];let frame=stack;while(frame){frames.push(frame);frame=frame.parent;}
frames.reverse();return frames;}
function makeCensusTreeNodeSubTree(breakdown,report,edge,cache,outParams){if(!isSavedFrame(edge)){const node=new CensusTreeNode(edge);outParams.top=outParams.bottom=node;return;}
const frames=getArrayOfFrames(edge);let currentCache=cache;let prevNode;for(let i=0,length=frames.length;i<length;i++){const frame=frames[i];




let isNewNode=false;let val=CensusTreeNodeCache.lookupFrame(currentCache,frame);if(!val){isNewNode=true;val=new CensusTreeNodeCacheValue();val.node=new CensusTreeNode(frame);CensusTreeNodeCache.insertFrame(currentCache,val);if(prevNode){addChild(prevNode,val.node);}}
if(i===0){outParams.bottom=isNewNode?val.node:null;}
if(i===length-1){outParams.top=val.node;}
prevNode=val.node;if(i!==length-1&&!val.children){
val.children=new CensusTreeNodeCache();}
currentCache=val.children;}}
function CensusTreeNodeVisitor(){this._root=null;
this._nodeStack=[];
this._outParams={top:null,bottom:null,};
this._cacheStack=[new CensusTreeNodeCache()];this._index=-1;}
CensusTreeNodeVisitor.prototype=Object.create(Visitor);CensusTreeNodeVisitor.prototype.enter=function(breakdown,report,edge){this._index++;const cache=this._cacheStack[this._cacheStack.length-1];makeCensusTreeNodeSubTree(breakdown,report,edge,cache,this._outParams);const{top,bottom}=this._outParams;if(!this._root){this._root=bottom;}else if(bottom){addChild(this._nodeStack[this._nodeStack.length-1],bottom);}
this._cacheStack.push(new CensusTreeNodeCache());this._nodeStack.push(top);};function values(cache){return Object.keys(cache).map(k=>cache[k]);}
function isNonEmpty(node){return((node.children!==undefined&&node.children.length)||node.bytes!==0||node.count!==0);}
CensusTreeNodeVisitor.prototype.exit=function(breakdown,report,edge){


function dfs(node,childrenCache){if(childrenCache){const childValues=values(childrenCache);for(let i=0,length=childValues.length;i<length;i++){dfs(childValues[i].node,childValues[i].children);}}
node.totalCount=node.count;node.totalBytes=node.bytes;if(node.children){node.children=node.children.filter(isNonEmpty);node.children.sort(compareByTotal);for(let i=0,length=node.children.length;i<length;i++){node.totalCount+=node.children[i].totalCount;node.totalBytes+=node.children[i].totalBytes;}}}
const top=this._nodeStack.pop();const cache=this._cacheStack.pop();dfs(top,cache);};CensusTreeNodeVisitor.prototype.count=function(breakdown,report,edge){const node=this._nodeStack[this._nodeStack.length-1];node.reportLeafIndex=this._index;if(breakdown.count){node.count=report.count;}
if(breakdown.bytes){node.bytes=report.bytes;}};CensusTreeNodeVisitor.prototype.root=function(){if(!this._root){throw new Error("Attempt to get the root before walking the census report!");}
if(this._nodeStack.length){throw new Error("Attempt to get the root while walking the census report!");}
return this._root;};function CensusTreeNode(name){
this.name=name;this.bytes=0;
this.totalBytes=0;
this.count=0;
this.totalCount=0;this.children=undefined;this.id=++censusTreeNodeIdCounter;
this.parent=undefined;









this.reportLeafIndex=undefined;}
CensusTreeNode.prototype=null;function compareByTotal(node1,node2){return(Math.abs(node2.totalBytes)-Math.abs(node1.totalBytes)||Math.abs(node2.totalCount)-Math.abs(node1.totalCount)||Math.abs(node2.bytes)-Math.abs(node1.bytes)||Math.abs(node2.count)-Math.abs(node1.count));}
function compareBySelf(node1,node2){return(Math.abs(node2.bytes)-Math.abs(node1.bytes)||Math.abs(node2.count)-Math.abs(node1.count)||Math.abs(node2.totalBytes)-Math.abs(node1.totalBytes)||Math.abs(node2.totalCount)-Math.abs(node1.totalCount));}
function insertOrMergeNode(parentCacheValue,node){if(!parentCacheValue.children){parentCacheValue.children=new CensusTreeNodeCache();}
let val=CensusTreeNodeCache.lookupNode(parentCacheValue.children,node);if(val){

if(val.node.reportLeafIndex!==undefined&&val.node.reportLeafIndex!==node.reportLeafIndex){if(typeof val.node.reportLeafIndex==="number"){const oldIndex=val.node.reportLeafIndex;val.node.reportLeafIndex=new Set();val.node.reportLeafIndex.add(oldIndex);val.node.reportLeafIndex.add(node.reportLeafIndex);}else{val.node.reportLeafIndex.add(node.reportLeafIndex);}}
val.node.count+=node.count;val.node.bytes+=node.bytes;}else{val=new CensusTreeNodeCacheValue();val.node=new CensusTreeNode(node.name);val.node.reportLeafIndex=node.reportLeafIndex;val.node.count=node.count;val.node.totalCount=node.totalCount;val.node.bytes=node.bytes;val.node.totalBytes=node.totalBytes;addChild(parentCacheValue.node,val.node);CensusTreeNodeCache.insertNode(parentCacheValue.children,val);}
return val;}
function invert(tree){const inverted=new CensusTreeNodeCacheValue();inverted.node=new CensusTreeNode(null);
const path=[];(function addInvertedPaths(node){path.push(node);if(node.children){for(let i=0,length=node.children.length;i<length;i++){addInvertedPaths(node.children[i]);}}else{let currentCacheValue=inverted;for(let i=path.length-1;i>=0;i--){currentCacheValue=insertOrMergeNode(currentCacheValue,path[i]);}}
path.pop();})(tree);inverted.node.totalBytes=tree.totalBytes;inverted.node.totalCount=tree.totalCount;return inverted.node;}
function filter(tree,predicate){const filtered=new CensusTreeNodeCacheValue();filtered.node=new CensusTreeNode(null);const path=[];let match=false;function addMatchingNodes(node){path.push(node);const oldMatch=match;if(!match&&predicate(node)){match=true;}
if(node.children){for(let i=0,length=node.children.length;i<length;i++){addMatchingNodes(node.children[i]);}}else if(match){let currentCacheValue=filtered;for(let i=0,length=path.length;i<length;i++){currentCacheValue=insertOrMergeNode(currentCacheValue,path[i]);}}
match=oldMatch;path.pop();}
if(tree.children){for(let i=0,length=tree.children.length;i<length;i++){addMatchingNodes(tree.children[i]);}}
filtered.node.count=tree.count;filtered.node.totalCount=tree.totalCount;filtered.node.bytes=tree.bytes;filtered.node.totalBytes=tree.totalBytes;return filtered.node;}
function makeFilterPredicate(filterString){return function(node){if(!node.name){return false;}
if(isSavedFrame(node.name)){return(node.name.source.includes(filterString)||(node.name.functionDisplayName||"").includes(filterString)||(node.name.asyncCause||"").includes(filterString));}
return String(node.name).includes(filterString);};}
exports.censusReportToCensusTreeNode=function(breakdown,report,options={invert:false,filter:null,}){
censusTreeNodeIdCounter=0;const visitor=new CensusTreeNodeVisitor();walk(breakdown,report,visitor);let result=visitor.root();if(options.invert){result=invert(result);}
if(typeof options.filter==="string"){result=filter(result,makeFilterPredicate(options.filter));}


if(typeof report[basisTotalBytes]==="number"){result.totalBytes=report[basisTotalBytes];result.totalCount=report[basisTotalCount];}

const comparator=options.invert?compareBySelf:compareByTotal;(function ensureSorted(node){if(node.children){node.children.sort(comparator);for(let i=0,length=node.children.length;i<length;i++){ensureSorted(node.children[i]);}}})(result);return result;};