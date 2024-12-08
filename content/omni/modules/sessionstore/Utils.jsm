"use strict";var EXPORTED_SYMBOLS=["Utils"];var Utils=Object.freeze({restoreFrameTreeData(frame,data,cb){if(cb(frame,data)===false){return;}
if(!data.hasOwnProperty("children")){return;}
SessionStoreUtils.forEachNonDynamicChildFrame(frame,(subframe,index)=>{if(data.children[index]){this.restoreFrameTreeData(subframe,data.children[index],cb);}});},});