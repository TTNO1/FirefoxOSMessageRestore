"use strict";const{TYPES:{LOCAL_STORAGE},}=require("devtools/shared/resources/resource-watcher");const{Front,types}=require("devtools/shared/protocol.js");module.exports=function({resource,watcher,targetFront}){if(!(resource instanceof Front)&&watcher){ resource=types.getType("localStorage").read(resource,targetFront);resource.resourceType=LOCAL_STORAGE;resource.resourceId=LOCAL_STORAGE;resource.resourceKey="localStorage";}
return resource;};