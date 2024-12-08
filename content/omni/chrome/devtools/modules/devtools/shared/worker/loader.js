"use strict";






this.EXPORTED_SYMBOLS=["WorkerDebuggerLoader","worker"];



function resolveId(id,baseId){return baseId+"/../"+id;}
function normalizeId(id){

const[,root,path]=id.match(/^(\w+:\/\/\/?|\/)?(.*)/);const stack=[];path.split("/").forEach(function(component){switch(component){case"":case".":break;case"..":if(stack.length===0){if(root!==undefined){throw new Error("Can't normalize absolute id '"+id+"'!");}else{stack.push("..");}}else if(stack[stack.length-1]==".."){stack.push("..");}else{stack.pop();}
break;default:stack.push(component);break;}});return(root?root:"")+stack.join("/");}
function createModule(id){return Object.create(null,{
id:{configurable:false,enumerable:true,value:id,writable:false,},
exports:{configurable:false,enumerable:true,value:Object.create(null),writable:true,},});}
function WorkerDebuggerLoader(options){function resolveURL(url){let found=false;for(const[path,baseURL]of paths){if(url.startsWith(path)){found=true;url=url.replace(path,baseURL);break;}}
if(!found){throw new Error("Can't resolve relative URL '"+url+"'!");}
return url.endsWith(".js")?url:url+".js";}
function loadModule(module,url){


const prototype=Object.create(globals);prototype.Components={};prototype.require=createRequire(module);prototype.exports=module.exports;prototype.module=module;const sandbox=createSandbox(url,prototype);try{loadSubScript(url,sandbox);}catch(error){if(/^Error opening input stream/.test(String(error))){throw new Error("Can't load module '"+module.id+"' with url '"+url+"'!");}
throw error;}

if(typeof module.exports==="object"&&module.exports!==null){Object.freeze(module.exports);}}
function createRequire(requirer){return function require(id){if(id===undefined){throw new Error("Can't require module without id!");}

let module=modules[id];if(module===undefined){
if(id.startsWith(".")){if(requirer===undefined){throw new Error("Can't require top-level module with relative id "+"'"+
id+"'!");}
id=resolve(id,requirer.id);}
id=normalizeId(id);let url=id;if(url.match(/^\w+:\/\//)===null){url=resolveURL(id);}
module=modules[url];if(module===undefined){


module=modules[url]=createModule(id);try{loadModule(module,url);}catch(error){


delete modules[url];throw error;}
Object.freeze(module);}}
return module.exports;};}
const createSandbox=options.createSandbox;const globals=options.globals||Object.create(null);const loadSubScript=options.loadSubScript;

const modules=options.modules||{};for(const id in modules){const module=createModule(id);module.exports=Object.freeze(modules[id]);modules[id]=module;}

let paths=options.paths||Object.create(null);paths=Object.keys(paths).sort((a,b)=>b.length-a.length).map(path=>[path,paths[path]]);const resolve=options.resolve||resolveId;this.require=createRequire();}
this.WorkerDebuggerLoader=WorkerDebuggerLoader;

var chrome={CC:undefined,Cc:undefined,ChromeWorker:undefined,Cm:undefined,Ci:undefined,Cu:undefined,Cr:undefined,components:undefined,};var loader={lazyGetter:function(object,name,lambda){Object.defineProperty(object,name,{get:function(){delete object[name];object[name]=lambda.apply(object);return object[name];},configurable:true,enumerable:true,});},lazyImporter:function(){throw new Error("Can't import JSM from worker thread!");},lazyServiceGetter:function(){throw new Error("Can't import XPCOM service from worker thread!");},lazyRequireGetter:function(obj,properties,module,destructure){if(Array.isArray(properties)&&!destructure){throw new Error("Pass destructure=true to call lazyRequireGetter with an array of properties");}
if(!Array.isArray(properties)){properties=[properties];}
for(const property of properties){Object.defineProperty(obj,property,{get:()=>destructure?worker.require(module)[property]:worker.require(module||property),});}},};


var{Debugger,URL,createSandbox,dump,rpc,loadSubScript,reportError,setImmediate,xpcInspector,}=function(){ if(typeof Components==="object"){const{Constructor:CC}=Components;const principal=CC("@mozilla.org/systemprincipal;1","nsIPrincipal")();
const sandbox=Cu.Sandbox(principal,{});Cu.evalInSandbox("Components.utils.import('resource://gre/modules/jsdebugger.jsm');"+"addDebuggerToGlobal(this);",sandbox);const Debugger=sandbox.Debugger;const createSandbox=function(name,prototype){return Cu.Sandbox(principal,{invisibleToDebugger:true,sandboxName:name,sandboxPrototype:prototype,wantComponents:false,wantXrays:false,});};const rpc=undefined; const subScriptLoader=Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);const loadSubScript=function(url,sandbox){subScriptLoader.loadSubScript(url,sandbox);};const reportError=Cu.reportError;const Timer=ChromeUtils.import("resource://gre/modules/Timer.jsm");const setImmediate=function(callback){Timer.setTimeout(callback,0);};const xpcInspector=Cc["@mozilla.org/jsinspector;1"].getService(Ci.nsIJSInspector);const{URL}=Cu.Sandbox(principal,{wantGlobalProperties:["URL"],});return{Debugger,URL:URL,createSandbox,dump:this.dump,rpc,loadSubScript,reportError,setImmediate,xpcInspector,};} 
const requestors=[];const scope=this;const xpcInspector={get eventLoopNestLevel(){return requestors.length;},get lastNestRequestor(){return requestors.length===0?null:requestors[requestors.length-1];},enterNestedEventLoop:function(requestor){requestors.push(requestor);scope.enterEventLoop();return requestors.length;},exitNestedEventLoop:function(){requestors.pop();scope.leaveEventLoop();return requestors.length;},};return{Debugger:this.Debugger,URL:this.URL,createSandbox:this.createSandbox,dump:this.dump,rpc:this.rpc,loadSubScript:this.loadSubScript,reportError:this.reportError,setImmediate:this.setImmediate,xpcInspector:xpcInspector,};}.call(this);
this.worker=new WorkerDebuggerLoader({createSandbox:createSandbox,globals:{isWorker:true,dump:dump,loader:loader,reportError:reportError,rpc:rpc,URL:URL,setImmediate:setImmediate,retrieveConsoleEvents:this.retrieveConsoleEvents,setConsoleEventHandler:this.setConsoleEventHandler,console:console,btoa:this.btoa,atob:this.atob,},loadSubScript:loadSubScript,modules:{Debugger:Debugger,Services:Object.create(null),chrome:chrome,xpcInspector:xpcInspector,ChromeUtils:ChromeUtils,DebuggerNotificationObserver:DebuggerNotificationObserver,},paths:{ devtools:"resource://devtools", promise:"resource://gre/modules/Promise-backend.js","xpcshell-test":"resource://test",},});