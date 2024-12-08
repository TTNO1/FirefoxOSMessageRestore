"use strict";const{immutableUpdate,}=require("resource://devtools/shared/ThreadSafeDevToolsUtils.js");const{Visitor,walk,}=require("resource://devtools/shared/heapsnapshot/CensusUtils.js");const{deduplicatePaths,}=require("resource://devtools/shared/heapsnapshot/shortest-paths");const DEFAULT_MAX_DEPTH=4;const DEFAULT_MAX_SIBLINGS=15;const DEFAULT_MAX_NUM_PATHS=5;function DominatorTreeNode(nodeId,label,shallowSize,retainedSize){this.nodeId=nodeId;this.label=label;this.shallowSize=shallowSize;this.retainedSize=retainedSize;this.parentId=undefined;this.children=undefined;
this.shortestPaths=undefined;





this.moreChildrenAvailable=true;}
DominatorTreeNode.prototype=null;module.exports=DominatorTreeNode;DominatorTreeNode.addChild=function(parent,child){if(parent.children===undefined){parent.children=[];}
parent.children.push(child);child.parentId=parent.nodeId;};function LabelAndShallowSizeVisitor(){this._labelPieces=[];
this._label=undefined;
this._shallowSize=0;}
DominatorTreeNode.LabelAndShallowSizeVisitor=LabelAndShallowSizeVisitor;LabelAndShallowSizeVisitor.prototype=Object.create(Visitor);LabelAndShallowSizeVisitor.prototype.enter=function(breakdown,report,edge){if(this._labelPieces&&edge){this._labelPieces.push(edge);}};LabelAndShallowSizeVisitor.prototype.exit=function(breakdown,report,edge){if(this._labelPieces&&edge){this._labelPieces.pop();}};LabelAndShallowSizeVisitor.prototype.count=function(breakdown,report,edge){if(report.count===0){return;}
this._label=this._labelPieces;this._labelPieces=undefined;this._shallowSize=report.bytes;};LabelAndShallowSizeVisitor.prototype.label=function(){return this._label;};LabelAndShallowSizeVisitor.prototype.shallowSize=function(){return this._shallowSize;};DominatorTreeNode.getLabelAndShallowSize=function(nodeId,snapshot,breakdown){const description=snapshot.describeNode(breakdown,nodeId);const visitor=new LabelAndShallowSizeVisitor();walk(breakdown,description,visitor);return{label:visitor.label(),shallowSize:visitor.shallowSize(),};};DominatorTreeNode.partialTraversal=function(dominatorTree,snapshot,breakdown,maxDepth=DEFAULT_MAX_DEPTH,maxSiblings=DEFAULT_MAX_SIBLINGS){function dfs(nodeId,depth){const{label,shallowSize}=DominatorTreeNode.getLabelAndShallowSize(nodeId,snapshot,breakdown);const retainedSize=dominatorTree.getRetainedSize(nodeId);const node=new DominatorTreeNode(nodeId,label,shallowSize,retainedSize);const childNodeIds=dominatorTree.getImmediatelyDominated(nodeId);const newDepth=depth+1;if(newDepth<maxDepth){const endIdx=Math.min(childNodeIds.length,maxSiblings);for(let i=0;i<endIdx;i++){DominatorTreeNode.addChild(node,dfs(childNodeIds[i],newDepth));}
node.moreChildrenAvailable=endIdx<childNodeIds.length;}else{node.moreChildrenAvailable=childNodeIds.length>0;}
return node;}
return dfs(dominatorTree.root,0);};DominatorTreeNode.insert=function(nodeTree,path,newChildren,moreChildrenAvailable){function insert(tree,i){if(tree.nodeId!==path[i]){return tree;}
if(i==path.length-1){return immutableUpdate(tree,{children:(tree.children||[]).concat(newChildren),moreChildrenAvailable,});}
return tree.children?immutableUpdate(tree,{children:tree.children.map(c=>insert(c,i+1)),}):tree;}
return insert(nodeTree,0);};DominatorTreeNode.getNodeByIdAlongPath=function(id,tree,path){function find(node,i){if(!node||node.nodeId!==path[i]){return null;}
if(node.nodeId===id){return node;}
if(i===path.length-1||!node.children){return null;}
const nextId=path[i+1];return find(node.children.find(c=>c.nodeId===nextId),i+1);}
return find(tree,0);};DominatorTreeNode.attachShortestPaths=function(snapshot,breakdown,start,treeNodes,maxNumPaths=DEFAULT_MAX_NUM_PATHS){const idToTreeNode=new Map();const targets=[];for(const node of treeNodes){const id=node.nodeId;idToTreeNode.set(id,node);targets.push(id);}
const shortestPaths=snapshot.computeShortestPaths(start,targets,maxNumPaths);for(const[target,paths]of shortestPaths){const deduped=deduplicatePaths(target,paths);deduped.nodes=deduped.nodes.map(id=>{const{label}=DominatorTreeNode.getLabelAndShallowSize(id,snapshot,breakdown);return{id,label};});idToTreeNode.get(target).shortestPaths=deduped;}};