"use strict";const{Arg,RetVal,types,generateActorSpec,}=require("devtools/shared/protocol");types.addDictType("AllocationsRecordingOptions",{

probability:"number",

maxLogLength:"number",});const memorySpec=generateActorSpec({typeName:"memory",events:{

"garbage-collection":{type:"garbage-collection",data:Arg(0,"json"),},
allocations:{type:"allocations",data:Arg(0,"json"),},},methods:{attach:{request:{},response:{type:RetVal("string"),},},detach:{request:{},response:{type:RetVal("string"),},},getState:{response:{state:RetVal(0,"string"),},},takeCensus:{request:{},response:RetVal("json"),},startRecordingAllocations:{request:{options:Arg(0,"nullable:AllocationsRecordingOptions"),},response:{ value:RetVal(0,"nullable:number"),},},stopRecordingAllocations:{request:{},response:{ value:RetVal(0,"nullable:number"),},},getAllocationsSettings:{request:{},response:{options:RetVal(0,"json"),},},getAllocations:{request:{},response:RetVal("json"),},forceGarbageCollection:{request:{},response:{},},forceCycleCollection:{request:{},response:{},},measure:{request:{},response:RetVal("json"),},residentUnique:{request:{},response:{value:RetVal("number")},},saveHeapSnapshot:{request:{boundaries:Arg(0,"nullable:json"),},response:{snapshotId:RetVal("string"),},},},});exports.memorySpec=memorySpec;