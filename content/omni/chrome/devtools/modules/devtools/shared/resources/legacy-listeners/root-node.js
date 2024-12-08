"use strict";const{ResourceWatcher,}=require("devtools/shared/resources/resource-watcher");module.exports=async function({targetFront,onAvailable,onDestroyed}){

















if(!targetFront.getTrait("isBrowsingContext")){return;}
const inspectorFront=await targetFront.getFront("inspector");inspectorFront.walker.on("root-available",node=>{node.resourceType=ResourceWatcher.TYPES.ROOT_NODE;return onAvailable([node]);});inspectorFront.walker.on("root-destroyed",node=>{node.resourceType=ResourceWatcher.TYPES.ROOT_NODE;return onDestroyed([node]);});await inspectorFront.walker.watchRootNode();};