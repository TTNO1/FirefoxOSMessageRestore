"use strict";var DevToolsUtils=require("devtools/shared/DevToolsUtils");loader.lazyRequireGetter(this,"MainThreadWorkerDebuggerTransport","devtools/shared/transport/worker-transport",true);function connectToWorker(connection,dbg,forwardingPrefix,options){return new Promise((resolve,reject)=>{if(!DevToolsUtils.isWorkerDebuggerAlive(dbg)){reject("closed");return;}
if(!dbg.isInitialized){dbg.initialize("resource://devtools/server/startup/worker.js");

const listener={onClose:()=>{dbg.removeListener(listener);},onMessage:message=>{message=JSON.parse(message);if(message.type!=="rpc"){if(message.type=="worker-thread-attached"){
dbg.setDebuggerReady(true);}
return;}
Promise.resolve().then(()=>{const method={fetch:DevToolsUtils.fetch,}[message.method];if(!method){throw Error("Unknown method: "+message.method);}
return method.apply(undefined,message.params);}).then(value=>{dbg.postMessage(JSON.stringify({type:"rpc",result:value,error:null,id:message.id,}));},reason=>{dbg.postMessage(JSON.stringify({type:"rpc",result:null,error:reason,id:message.id,}));});},};dbg.addListener(listener);}
if(!DevToolsUtils.isWorkerDebuggerAlive(dbg)){reject("closed");return;}
dbg.postMessage(JSON.stringify({type:"connect",forwardingPrefix,options,workerDebuggerData:{id:dbg.id,type:dbg.type,url:dbg.url,},}));const listener={onClose:()=>{dbg.removeListener(listener);reject("closed");},onMessage:message=>{message=JSON.parse(message);if(message.type!=="connected"||message.forwardingPrefix!==forwardingPrefix){return;}
 
dbg.removeListener(listener);const transport=new MainThreadWorkerDebuggerTransport(dbg,forwardingPrefix);transport.ready();transport.hooks={onClosed:()=>{if(DevToolsUtils.isWorkerDebuggerAlive(dbg)){




try{dbg.postMessage(JSON.stringify({type:"disconnect",forwardingPrefix,}));}catch(e){



}}
connection.cancelForwarding(forwardingPrefix);},onPacket:packet=>{

connection.send(packet);},};

connection.setForwarding(forwardingPrefix,transport);resolve({workerTargetForm:message.workerTargetForm,transport:transport,});},};dbg.addListener(listener);});}
exports.connectToWorker=connectToWorker;