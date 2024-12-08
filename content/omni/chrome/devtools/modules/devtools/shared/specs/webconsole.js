"use strict";const{types,generateActorSpec,RetVal,Option,Arg,}=require("devtools/shared/protocol");types.addDictType("console.traits",{evaluateJSAsync:"boolean",});types.addDictType("console.startlisteners",{startedListeners:"array:string",nativeConsoleAPI:"nullable:boolean",traits:"console.traits",});types.addDictType("console.autocomplete",{matches:"array:string",matchProp:"string",});types.addDictType("console.evaluatejsasync",{resultID:"string",});types.addDictType("console.cachedmessages",{error:"nullable:string",message:"longstring",_type:"nullable:string",timeStamp:"nullable:string",});const webconsoleSpecPrototype={typeName:"console",events:{evaluationResult:{resultID:Option(0,"string"),awaitResult:Option(0,"nullable:boolean"),errorMessageName:Option(0,"nullable:string"),exception:Option(0,"nullable:json"),exceptionMessage:Option(0,"nullable:string"),exceptionDocURL:Option(0,"nullable:string"),exceptionStack:Option(0,"nullable:json"),hasException:Option(0,"nullable:boolean"),frame:Option(0,"nullable:json"),helperResult:Option(0,"nullable:json"),input:Option(0,"nullable:string"),notes:Option(0,"nullable:string"),result:Option(0,"nullable:json"),startTime:Option(0,"number"),timestamp:Option(0,"string"),topLevelAwaitRejected:Option(0,"nullable:boolean"),},fileActivity:{uri:Option(0,"string"),},pageError:{pageError:Option(0,"json"),},logMessage:{message:Option(0,"json"),timeStamp:Option(0,"string"),},consoleAPICall:{message:Option(0,"json"),},reflowActivity:{interruptible:Option(0,"boolean"),start:Option(0,"number"),end:Option(0,"number"),sourceURL:Option(0,"nullable:string"),sourceLine:Option(0,"nullable:number"),functionName:Option(0,"nullable:string"),},serverNetworkEvent:{type:"networkEvent",eventActor:Option(0,"json"),},inspectObject:{objectActor:Option(0,"json"),},lastPrivateContextExited:{},documentEvent:{name:Option(0,"string"),time:Option(0,"string"),},},methods:{startListeners:{request:{listeners:Arg(0,"array:string"),},response:RetVal("console.startlisteners"),},stopListeners:{request:{listeners:Arg(0,"nullable:array:string"),},response:RetVal("array:string"),},getCachedMessages:{request:{messageTypes:Arg(0,"array:string"),},

 response:RetVal("console.cachedmessages"),},evaluateJSAsync:{request:{text:Option(0,"string"),frameActor:Option(0,"string"),url:Option(0,"string"),selectedNodeActor:Option(0,"string"),selectedObjectActor:Option(0,"string"),innerWindowID:Option(0,"number"),mapped:Option(0,"nullable:json"),eager:Option(0,"nullable:boolean"),},response:RetVal("console.evaluatejsasync"),},autocomplete:{request:{text:Arg(0,"string"),cursor:Arg(1,"nullable:number"),frameActor:Arg(2,"nullable:string"),selectedNodeActor:Arg(3,"nullable:string"),authorizedEvaluations:Arg(4,"nullable:json"),expressionVars:Arg(5,"nullable:json"),},response:RetVal("console.autocomplete"),},clearMessagesCache:{oneway:true,},getPreferences:{request:{preferences:Arg(0,"array:string"),},response:RetVal("json"),},setPreferences:{request:{preferences:Arg(0,"json"),},response:RetVal("json"),},sendHTTPRequest:{request:{request:Arg(0,"json"),},response:RetVal("json"),},blockRequest:{request:{filter:Arg(0,"json"),},},unblockRequest:{request:{filter:Arg(0,"json"),},},setBlockedUrls:{request:{url:Arg(0,"json"),},},getBlockedUrls:{request:{},response:RetVal("array:string"),},},};const webconsoleSpec=generateActorSpec(webconsoleSpecPrototype);exports.webconsoleSpecPrototype=webconsoleSpecPrototype;exports.webconsoleSpec=webconsoleSpec;