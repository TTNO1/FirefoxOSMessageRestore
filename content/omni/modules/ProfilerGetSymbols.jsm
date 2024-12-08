//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["ProfilerGetSymbols"];ChromeUtils.defineModuleGetter(this,"setTimeout","resource://gre/modules/Timer.jsm");ChromeUtils.defineModuleGetter(this,"clearTimeout","resource://gre/modules/Timer.jsm");Cu.importGlobalProperties(["fetch"]);const global=this;






const WASM_MODULE_URL="https://zealous-rosalind-a98ce8.netlify.com/wasm/8f7ca2f70e1cd21b5a2dbe96545672752887bfbd4e7b3b9437e9fc7c3da0a3bedae4584ff734f0c9f08c642e6b66ffab.wasm";const WASM_MODULE_INTEGRITY="sha384-j3yi9w4c0htaLb6WVFZydSiHv71OezuUN+n8fD2go77a5FhP9zTwyfCMZC5rZv+r";const EXPIRY_TIME_IN_MS=5*60*1000;let gCachedWASMModulePromise=null;let gCachedWASMModuleExpiryTimer=0;let gActiveWorkers=new Set();function clearCachedWASMModule(){gCachedWASMModulePromise=null;gCachedWASMModuleExpiryTimer=0;}
function getWASMProfilerGetSymbolsModule(){if(!gCachedWASMModulePromise){gCachedWASMModulePromise=(async function(){const request=new Request(WASM_MODULE_URL,{integrity:WASM_MODULE_INTEGRITY,credentials:"omit",});return WebAssembly.compileStreaming(fetch(request));})();}
clearTimeout(gCachedWASMModuleExpiryTimer);gCachedWASMModuleExpiryTimer=setTimeout(clearCachedWASMModule,EXPIRY_TIME_IN_MS);return gCachedWASMModulePromise;}
this.ProfilerGetSymbols={async getSymbolTable(binaryPath,debugPath,breakpadId){const module=await getWASMProfilerGetSymbolsModule();return new Promise((resolve,reject)=>{const worker=new ChromeWorker("resource://gre/modules/ProfilerGetSymbols-worker.js");gActiveWorkers.add(worker);worker.onmessage=msg=>{gActiveWorkers.delete(worker);if(msg.data.error){const error=msg.data.error;if(error.name){const{name,message,fileName,lineNumber}=error;const ErrorObjConstructor=name in global&&Error.isPrototypeOf(global[name])?global[name]:Error;const e=new ErrorObjConstructor(message,fileName,lineNumber);e.name=name;reject(e);}else{reject(error);}
return;}
resolve(msg.data.result);};



worker.onerror=errorEvent=>{gActiveWorkers.delete(worker);worker.terminate();const{message,filename,lineno}=errorEvent;const error=new Error(message,filename,lineno);error.name="WorkerError";reject(error);};

worker.onmessageerror=errorEvent=>{gActiveWorkers.delete(worker);worker.terminate();const{message,filename,lineno}=errorEvent;const error=new Error(message,filename,lineno);error.name="WorkerMessageError";reject(error);};worker.postMessage({binaryPath,debugPath,breakpadId,module});});},};