"use strict";this.EXPORTED_SYMBOLS=["Loader","resolveURI","Module","Require","unload"];const{Constructor:CC,manager:Cm}=Components;const systemPrincipal=CC("@mozilla.org/systemprincipal;1","nsIPrincipal")();const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{normalize,dirname}=ChromeUtils.import("resource://gre/modules/osfile/ospath_unix.jsm");XPCOMUtils.defineLazyServiceGetter(this,"resProto","@mozilla.org/network/protocol;1?name=resource","nsIResProtocolHandler");ChromeUtils.defineModuleGetter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");const bind=Function.call.bind(Function.bind);function*getOwnIdentifiers(x){yield*Object.getOwnPropertyNames(x);yield*Object.getOwnPropertySymbols(x);}
function isJSONURI(uri){return uri.endsWith(".json");}
function isJSMURI(uri){return uri.endsWith(".jsm");}
function isJSURI(uri){return uri.endsWith(".js");}
const AbsoluteRegExp=/^(resource|chrome|file|jar):/;function isAbsoluteURI(uri){return AbsoluteRegExp.test(uri);}
function isRelative(id){return id.startsWith(".");}
function readURI(uri){const nsURI=NetUtil.newURI(uri);if(nsURI.scheme=="resource"){
 uri=resProto.resolveURI(nsURI);}
const stream=NetUtil.newChannel({uri:NetUtil.newURI(uri,"UTF-8"),loadUsingSystemPrincipal:true,}).open();const count=stream.available();const data=NetUtil.readInputStreamToString(stream,count,{charset:"UTF-8",});stream.close();return data;}
function join(base,...paths){const match=/^((?:resource|file|chrome)\:\/\/[^\/]*|jar:[^!]+!)(.*)/.exec(base);if(match){return match[1]+normalize([match[2],...paths].join("/"));}
return normalize([base,...paths].join("/"));}




function Sandbox(options){options={
wantComponents:false,sandboxName:options.name,sandboxPrototype:"prototype"in options?options.prototype:{},invisibleToDebugger:"invisibleToDebugger"in options?options.invisibleToDebugger:false,freshCompartment:options.freshCompartment||false,};const sandbox=Cu.Sandbox(systemPrincipal,options);delete sandbox.Components;return sandbox;}


function define(factory){factory(this.require,this.exports,this.module);}

function load(loader,module){const require=Require(loader,module);

const properties={require,module,exports:module.exports,};if(loader.supportAMDModules){properties.define=define;}
 
const sandbox=new loader.sharedGlobalSandbox.Object();Object.assign(sandbox,properties);const originalExports=module.exports;try{Services.scriptloader.loadSubScript(module.uri,sandbox);}catch(error){if(typeof error=="string"){if(error.startsWith("Error creating URI")||error.startsWith("Error opening input stream (invalid filename?)")){throw new Error(`Module \`${module.id}\` is not found at ${module.uri}`);}
throw new Error(`Error while loading module \`${module.id}\` at ${module.uri}:`+"\n"+
error);} 
throw error;}


if(module.exports===originalExports){Object.freeze(module.exports);}
return module;}
function normalizeExt(uri){if(isJSURI(uri)||isJSONURI(uri)||isJSMURI(uri)){return uri;}
return uri+".js";}


function resolve(id,base){if(!isRelative(id)){return id;}
const baseDir=dirname(base);let resolved;if(baseDir.includes(":")){resolved=join(baseDir,id);}else{resolved=normalize(`${baseDir}/${id}`);} 
if(base.startsWith("./")){resolved="./"+resolved;}
return resolved;}
function compileMapping(paths){const mapping=Object.keys(paths).sort((a,b)=>b.length-a.length).map(path=>[path,paths[path]]);const PATTERN=/([.\\?+*(){}[\]^$])/g;const escapeMeta=str=>str.replace(PATTERN,"\\$1");const patterns=[];paths={};for(let[path,uri]of mapping){ if(path.endsWith("/")){path=path.slice(0,-1);uri=uri.replace(/\/+$/,"");}
paths[path]=uri;
if(path==""){patterns.push("");}else{patterns.push(`${escapeMeta(path)}(?=$|/)`);}}
const pattern=new RegExp(`^(${patterns.join("|")})`);
return id=>{return id.replace(pattern,(m0,m1)=>paths[m1]);};}
function resolveURI(id,mapping){ if(isAbsoluteURI(id)){return normalizeExt(id);}
return normalizeExt(mapping(id));}


function Require(loader,requirer){const{modules,mapping,mappingCache,requireHook}=loader;function require(id){if(!id){throw Error("You must provide a module name when calling require() from "+
requirer.id,requirer.uri);}
if(requireHook){return requireHook(id,_require);}
return _require(id);}
function _require(id){let{uri,requirement}=getRequirements(id);let module=null;if(uri in modules){module=modules[uri];}else if(isJSMURI(uri)){module=modules[uri]=Module(requirement,uri);module.exports=ChromeUtils.import(uri);}else if(isJSONURI(uri)){let data;
 try{data=JSON.parse(readURI(uri));module=modules[uri]=Module(requirement,uri);module.exports=data;}catch(err){
 if(err&&/JSON\.parse/.test(err.message)){throw err;}
uri=uri+".js";}}

if(!(uri in modules)){

module=modules[uri]=Module(requirement,uri);try{Object.freeze(load(loader,module));}catch(e){ delete modules[uri];throw e;}}
return module.exports;}

function getRequirements(id){if(!id){throw Error("you must provide a module name when calling require() from "+
requirer.id,requirer.uri);}
let requirement,uri;if(modules[id]){uri=requirement=id;}else if(requirer){requirement=resolve(id,requirer.id);}else{requirement=id;}
if(!uri){if(mappingCache.has(requirement)){uri=mappingCache.get(requirement);}else{uri=resolveURI(requirement,mapping);mappingCache.set(requirement,uri);}}
if(!uri){throw Error("Module: Can not resolve '"+
id+"' module required by "+
requirer.id+" located at "+
requirer.uri,requirer.uri);}
return{uri:uri,requirement:requirement};} 
require.resolve=_require.resolve=function(id){const{uri}=getRequirements(id);return uri;};
require.context=prefix=>{return id=>{return require(prefix+id);};};return require;}

function Module(id,uri){return Object.create(null,{id:{enumerable:true,value:id},exports:{enumerable:true,writable:true,value:Object.create(null),configurable:true,},uri:{value:uri},});}

function unload(loader,reason){




const subject={wrappedJSObject:loader.destructor};Services.obs.notifyObservers(subject,"devtools:loader:destroy",reason);}






function Loader(options){let{paths,globals}=options;if(!globals){globals={};}




const destructor=Object.create(null);const mapping=compileMapping(paths);const builtinModuleExports={"@loader/unload":destructor,"@loader/options":options,chrome:{Cc,Ci,Cu,Cr,Cm,CC:bind(CC,Components),components:Components,ChromeWorker,},};const modules={};for(const id of Object.keys(builtinModuleExports)){const uri=resolveURI(id,mapping);const module=Module(id,uri);
Object.defineProperty(module,"exports",{enumerable:true,get:function(){return builtinModuleExports[id];},});modules[uri]=module;}

const sharedGlobalSandbox=Sandbox({name:options.sandboxName||"DevTools",invisibleToDebugger:options.invisibleToDebugger||false,prototype:options.sandboxPrototype||globals,freshCompartment:options.freshCompartment,});if(options.sandboxPrototype){

for(const name of getOwnIdentifiers(globals)){Object.defineProperty(sharedGlobalSandbox,name,Object.getOwnPropertyDescriptor(globals,name));}}


const returnObj={destructor:{enumerable:false,value:destructor},globals:{enumerable:false,value:globals},mapping:{enumerable:false,value:mapping},mappingCache:{enumerable:false,value:new Map()},modules:{enumerable:false,value:modules},sharedGlobalSandbox:{enumerable:false,value:sharedGlobalSandbox},supportAMDModules:{enumerable:false,value:options.supportAMDModules||false,}, invisibleToDebugger:{enumerable:false,value:options.invisibleToDebugger||false,},requireHook:{enumerable:false,writable:true,value:options.requireHook,},};return Object.create(null,returnObj);}