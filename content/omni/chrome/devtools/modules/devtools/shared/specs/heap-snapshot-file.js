"use strict";const{Arg,generateActorSpec}=require("devtools/shared/protocol");const heapSnapshotFileSpec=generateActorSpec({typeName:"heapSnapshotFile",methods:{transferHeapSnapshot:{request:{snapshotId:Arg(0,"string"),},},},});exports.heapSnapshotFileSpec=heapSnapshotFileSpec;