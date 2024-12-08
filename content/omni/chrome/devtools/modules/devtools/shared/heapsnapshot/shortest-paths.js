"use strict";exports.deduplicatePaths=function(target,paths){
const deduped=new Map();function insert(from,to,name){let toMap=deduped.get(from);if(!toMap){toMap=new Map();deduped.set(from,toMap);}
let nameSet=toMap.get(to);if(!nameSet){nameSet=new Set();toMap.set(to,nameSet);}
nameSet.add(name);} 
outer:for(const path of paths){const pathLength=path.length;
const predecessorsSeen=new Set();predecessorsSeen.add(target);for(let i=0;i<pathLength;i++){if(predecessorsSeen.has(path[i].predecessor)){ continue outer;}
predecessorsSeen.add(path[i].predecessor);}
for(let i=0;i<pathLength-1;i++){insert(path[i].predecessor,path[i+1].predecessor,path[i].edge);}
insert(path[pathLength-1].predecessor,target,path[pathLength-1].edge);}
const nodes=[target];const edges=[];for(const[from,toMap]of deduped){

if(from!==target){nodes.push(from);}
for(const[to,edgeNameSet]of toMap){for(const name of edgeNameSet){edges.push({from,to,name});}}}
return{nodes,edges};};