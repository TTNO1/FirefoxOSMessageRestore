"use strict";
const{Cu}=require("chrome");const Services=require("Services");const{Pool}=require("devtools/shared/protocol");const{LazyPool,createExtraActors,}=require("devtools/shared/protocol/lazy-pool");const{DevToolsServer}=require("devtools/server/devtools-server");const protocol=require("devtools/shared/protocol");const{rootSpec}=require("devtools/shared/specs/root");loader.lazyRequireGetter(this,"ChromeWindowTargetActor","devtools/server/actors/targets/chrome-window",true);loader.lazyRequireGetter(this,"ProcessDescriptorActor","devtools/server/actors/descriptors/process",true);exports.RootActor=protocol.ActorClassWithSpec(rootSpec,{initialize:function(conn,parameters){protocol.Actor.prototype.initialize.call(this,conn);this._parameters=parameters;this._onTabListChanged=this.onTabListChanged.bind(this);this._onAddonListChanged=this.onAddonListChanged.bind(this);this._onWorkerListChanged=this.onWorkerListChanged.bind(this);this._onServiceWorkerRegistrationListChanged=this.onServiceWorkerRegistrationListChanged.bind(this);this._onProcessListChanged=this.onProcessListChanged.bind(this);this._extraActors={};this._globalActorPool=new LazyPool(this.conn);this.applicationType="browser";this.traits={sources:true,networkMonitor:true,storageInspector:true,bulk:true,




get allowChromeProcess(){return DevToolsServer.allowChromeProcess;},
heapSnapshots:true,


perfActorVersion:1,watchpoints:true,
workerConsoleApiMessagesDispatchedToMainThread:Services.prefs?Services.prefs.getBoolPref("dom.worker.console.dispatch_events_to_main_thread"):true,};},sayHello:function(){return{from:this.actorID,applicationType:this.applicationType,testConnectionPrefix:this.conn.prefix,traits:this.traits,};},forwardingCancelled:function(prefix){return{from:this.actorID,type:"forwardingCancelled",prefix,};},destroy:function(){protocol.Actor.prototype.destroy.call(this);if(this._parameters.tabList){this._parameters.tabList.destroy();}
if(this._parameters.addonList){this._parameters.addonList.onListChanged=null;}
if(this._parameters.workerList){this._parameters.workerList.destroy();}
if(this._parameters.serviceWorkerRegistrationList){this._parameters.serviceWorkerRegistrationList.onListChanged=null;}
if(this._parameters.processList){this._parameters.processList.onListChanged=null;}
if(typeof this._parameters.onShutdown==="function"){this._parameters.onShutdown();} 
if(this._tabDescriptorActorPool){this._tabDescriptorActorPool.destroy();}
if(this._processDescriptorActorPool){this._processDescriptorActorPool.destroy();}
if(this._globalActorPool){this._globalActorPool.destroy();}
if(this._chromeWindowActorPool){this._chromeWindowActorPool.destroy();}
if(this._addonTargetActorPool){this._addonTargetActorPool.destroy();}
if(this._workerDescriptorActorPool){this._workerDescriptorActorPool.destroy();}
if(this._frameDescriptorActorPool){this._frameDescriptorActorPool.destroy();}
if(this._serviceWorkerRegistrationActorPool){this._serviceWorkerRegistrationActorPool.destroy();}
this._extraActors=null;this.conn=null;this._tabDescriptorActorPool=null;this._globalActorPool=null;this._chromeWindowActorPool=null;this._parameters=null;},getRoot:function(){ if(!this._globalActorPool){this._globalActorPool=new LazyPool(this.conn);}
const actors=createExtraActors(this._parameters.globalActorFactories,this._globalActorPool,this);return actors;},listTabs:async function(){const tabList=this._parameters.tabList;if(!tabList){throw{error:"noTabs",message:"This root actor has no browser tabs.",};}

tabList.onListChanged=this._onTabListChanged;


const newActorPool=new Pool(this.conn,"listTabs-tab-descriptors");const tabDescriptorActors=await tabList.getList();for(const tabDescriptorActor of tabDescriptorActors){newActorPool.manage(tabDescriptorActor);}

if(this._tabDescriptorActorPool){this._tabDescriptorActorPool.destroy();}
this._tabDescriptorActorPool=newActorPool;return tabDescriptorActors;},getTab:async function({outerWindowID,tabId}){const tabList=this._parameters.tabList;if(!tabList){throw{error:"noTabs",message:"This root actor has no browser tabs.",};}
if(!this._tabDescriptorActorPool){this._tabDescriptorActorPool=new Pool(this.conn,"getTab-tab-descriptors");}
let descriptorActor;try{descriptorActor=await tabList.getTab({outerWindowID,tabId});}catch(error){if(error.error){ throw error;}
throw{error:"noTab",message:"Unexpected error while calling getTab(): "+error,};}
descriptorActor.parentID=this.actorID;this._tabDescriptorActorPool.manage(descriptorActor);return descriptorActor;},getWindow:function({outerWindowID}){if(!DevToolsServer.allowChromeProcess){throw{error:"forbidden",message:"You are not allowed to debug windows.",};}
const window=Services.wm.getOuterWindowWithId(outerWindowID);if(!window){throw{error:"notFound",message:`No window found with outerWindowID ${outerWindowID}`,};}
if(!this._chromeWindowActorPool){this._chromeWindowActorPool=new Pool(this.conn,"chrome-window");}
const actor=new ChromeWindowTargetActor(this.conn,window);actor.parentID=this.actorID;this._chromeWindowActorPool.manage(actor);return actor;},onTabListChanged:function(){this.conn.send({from:this.actorID,type:"tabListChanged"});this._parameters.tabList.onListChanged=null;},listAddons:async function(option){const addonList=this._parameters.addonList;if(!addonList){throw{error:"noAddons",message:"This root actor has no browser addons.",};}
addonList.onListChanged=this._onAddonListChanged;const addonTargetActors=await addonList.getList();const addonTargetActorPool=new Pool(this.conn,"addon-descriptors");for(const addonTargetActor of addonTargetActors){if(option.iconDataURL){await addonTargetActor.loadIconDataURL();}
addonTargetActorPool.manage(addonTargetActor);}
if(this._addonTargetActorPool){this._addonTargetActorPool.destroy();}
this._addonTargetActorPool=addonTargetActorPool;return addonTargetActors;},onAddonListChanged:function(){this.conn.send({from:this.actorID,type:"addonListChanged"});this._parameters.addonList.onListChanged=null;},listWorkers:function(){const workerList=this._parameters.workerList;if(!workerList){throw{error:"noWorkers",message:"This root actor has no workers.",};}
workerList.onListChanged=this._onWorkerListChanged;return workerList.getList().then(actors=>{const pool=new Pool(this.conn,"worker-targets");for(const actor of actors){pool.manage(actor);}

if(this._workerDescriptorActorPool){this._workerDescriptorActorPool.destroy();}
this._workerDescriptorActorPool=pool;return{workers:actors,};});},onWorkerListChanged:function(){this.conn.send({from:this.actorID,type:"workerListChanged"});this._parameters.workerList.onListChanged=null;},listServiceWorkerRegistrations:function(){const registrationList=this._parameters.serviceWorkerRegistrationList;if(!registrationList){throw{error:"noServiceWorkerRegistrations",message:"This root actor has no service worker registrations.",};}
registrationList.onListChanged=this._onServiceWorkerRegistrationListChanged;return registrationList.getList().then(actors=>{const pool=new Pool(this.conn,"service-workers-registrations");for(const actor of actors){pool.manage(actor);}
if(this._serviceWorkerRegistrationActorPool){this._serviceWorkerRegistrationActorPool.destroy();}
this._serviceWorkerRegistrationActorPool=pool;return{registrations:actors,};});},onServiceWorkerRegistrationListChanged:function(){this.conn.send({from:this.actorID,type:"serviceWorkerRegistrationListChanged",});this._parameters.serviceWorkerRegistrationList.onListChanged=null;},listProcesses:function(){const{processList}=this._parameters;if(!processList){throw{error:"noProcesses",message:"This root actor has no processes.",};}
processList.onListChanged=this._onProcessListChanged;const processes=processList.getList();const pool=new Pool(this.conn,"process-descriptors");for(const metadata of processes){let processDescriptor=this._getKnownDescriptor(metadata.id,this._processDescriptorActorPool);if(!processDescriptor){processDescriptor=new ProcessDescriptorActor(this.conn,metadata);}
pool.manage(processDescriptor);}

if(this._processDescriptorActorPool){this._processDescriptorActorPool.destroy();}
this._processDescriptorActorPool=pool;return[...this._processDescriptorActorPool.poolChildren()];},onProcessListChanged:function(){this.conn.send({from:this.actorID,type:"processListChanged"});this._parameters.processList.onListChanged=null;},async getProcess(id){if(!DevToolsServer.allowChromeProcess){throw{error:"forbidden",message:"You are not allowed to debug chrome.",};}
if(typeof id!="number"){throw{error:"wrongParameter",message:"getProcess requires a valid `id` attribute.",};}
this._processDescriptorActorPool=this._processDescriptorActorPool||new Pool(this.conn,"process-descriptors");let processDescriptor=this._getKnownDescriptor(id,this._processDescriptorActorPool);if(!processDescriptor){ const options={id,parent:id===0};processDescriptor=new ProcessDescriptorActor(this.conn,options);this._processDescriptorActorPool.manage(processDescriptor);}
return processDescriptor;},_getKnownDescriptor(id,pool){ if(!pool){return null;}
for(const descriptor of pool.poolChildren()){if(descriptor.id===id){return descriptor;}}
return null;},_getParentProcessDescriptor(){if(!this._processDescriptorActorPool){this._processDescriptorActorPool=new Pool(this.conn,"process-descriptors");const options={id:0,parent:true};const descriptor=new ProcessDescriptorActor(this.conn,options);this._processDescriptorActorPool.manage(descriptor);return descriptor;}
for(const descriptor of this._processDescriptorActorPool.poolChildren()){if(descriptor.isParent){return descriptor;}}
return null;},_isParentBrowsingContext(id){ const window=Services.wm.getMostRecentWindow(DevToolsServer.chromeWindowType);return id==window.docShell.browsingContext.id;},removeActorByName:function(name){if(name in this._extraActors){const actor=this._extraActors[name];if(this._globalActorPool.has(actor.actorID)){actor.destroy();}
if(this._tabDescriptorActorPool){
for(const tab in this._tabDescriptorActorPool.poolChildren()){tab.removeActorByName(name);}}
delete this._extraActors[name];}},});exports.RootActor.prototype.requestTypes.echo=function(request){return Cu.cloneInto(request,{});};