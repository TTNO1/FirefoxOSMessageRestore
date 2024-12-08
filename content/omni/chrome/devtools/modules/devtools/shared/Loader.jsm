"use strict";var{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var{Loader,Require,resolveURI,unload}=ChromeUtils.import("resource://devtools/shared/base-loader.js");var{requireRawId}=ChromeUtils.import("resource://devtools/shared/loader-plugin-raw.jsm");const EXPORTED_SYMBOLS=["DevToolsLoader","require","loader","StructuredCloneHolder",];var gNextLoaderID=0;function DevToolsLoader({invisibleToDebugger=false,freshCompartment=false,}={}){const paths={ devtools:"resource://devtools", acorn:"resource://devtools/shared/acorn","acorn/util/walk":"resource://devtools/shared/acorn/walk.js","xpcshell-test":"resource://test",
"devtools/client/locales":"chrome://devtools/locale","devtools/shared/locales":"chrome://devtools-shared/locale","devtools/startup/locales":"chrome://devtools-startup/locale","toolkit/locales":"chrome://global/locale",};


if(invisibleToDebugger){paths.promise="resource://gre/modules/Promise-backend.js";}
this.loader=new Loader({paths,invisibleToDebugger,freshCompartment,sandboxName:"DevTools (Module loader)",




supportAMDModules:true,requireHook:(id,require)=>{if(id.startsWith("raw!")||id.startsWith("theme-loader!")){return requireRawId(id,require);}
return require(id);},});this.require=Require(this.loader,{id:"devtools"}); const{modules,globals}=this.require("devtools/shared/builtin-modules");

if(invisibleToDebugger){delete modules.promise;} 
for(const id in modules){const uri=resolveURI(id,this.loader.mapping);this.loader.modules[uri]={get exports(){return modules[id];},};} 
Object.defineProperties(this.loader.globals,Object.getOwnPropertyDescriptors(globals)); 
this.id=gNextLoaderID++;
 globals.loader.id=this.id;this.lazyGetter=globals.loader.lazyGetter;this.lazyImporter=globals.loader.lazyImporter;this.lazyServiceGetter=globals.loader.lazyServiceGetter;this.lazyRequireGetter=globals.loader.lazyRequireGetter;}
DevToolsLoader.prototype={destroy:function(reason="shutdown"){unload(this.loader,reason);delete this.loader;},isLoaderPluginId:function(id){return id.startsWith("raw!");},};var loader=new DevToolsLoader({invisibleToDebugger:Services.appinfo.name!=="Firefox",});var require=loader.require;