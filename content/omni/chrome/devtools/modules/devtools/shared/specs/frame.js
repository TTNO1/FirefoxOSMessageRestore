"use strict";const{generateActorSpec,RetVal}=require("devtools/shared/protocol");const frameSpec=generateActorSpec({typeName:"frame",methods:{getEnvironment:{response:RetVal("json"),},},});exports.frameSpec=frameSpec;