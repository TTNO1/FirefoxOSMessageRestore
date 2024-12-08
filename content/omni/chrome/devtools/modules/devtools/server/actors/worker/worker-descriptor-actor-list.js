"use strict";const{Ci}=require("chrome");const{XPCOMUtils}=require("resource://gre/modules/XPCOMUtils.jsm");loader.lazyRequireGetter(this,"WorkerDescriptorActor","devtools/server/actors/descriptors/worker",true);XPCOMUtils.defineLazyServiceGetter(this,"wdm","@mozilla.org/dom/workers/workerdebuggermanager;1","nsIWorkerDebuggerManager");function matchWorkerDebugger(dbg,options){if("type"in options&&dbg.type!==options.type){return false;}
if("window"in options){let window=dbg.window;while(window!==null&&window.parent!==window){window=window.parent;}
if(window!==options.window){return false;}}
return true;}
function matchServiceWorker(dbg,origin){return(dbg.type==Ci.nsIWorkerDebugger.TYPE_SERVICE&&new URL(dbg.url).origin==origin);}








function WorkerPauser(options){this._options=options;this._pauseMatching=null;this._pauseServiceWorkerOrigin=null;this.onRegister=this._onRegister.bind(this);this.onUnregister=()=>{};wdm.addListener(this);}
WorkerPauser.prototype={destroy(){wdm.removeListener(this);},_onRegister(dbg){if((this._pauseMatching&&matchWorkerDebugger(dbg,this._options))||(this._pauseServiceWorkerOrigin&&matchServiceWorker(dbg,this._pauseServiceWorkerOrigin))){
dbg.setDebuggerReady(false);}},setPauseMatching(shouldPause){this._pauseMatching=shouldPause;},setPauseServiceWorkers(origin){this._pauseServiceWorkerOrigin=origin;},};function WorkerDescriptorActorList(conn,options){this._conn=conn;this._options=options;this._actors=new Map();this._onListChanged=null;this._workerPauser=null;this._mustNotify=false;this.onRegister=this.onRegister.bind(this);this.onUnregister=this.onUnregister.bind(this);}
WorkerDescriptorActorList.prototype={destroy(){this.onListChanged=null;if(this._workerPauser){this._workerPauser.destroy();this._workerPauser=null;}},getList(){const dbgs=new Set();for(const dbg of wdm.getWorkerDebuggerEnumerator()){if(matchWorkerDebugger(dbg,this._options)){dbgs.add(dbg);}}
for(const[dbg]of this._actors){if(!dbgs.has(dbg)){this._actors.delete(dbg);}}
for(const dbg of dbgs){if(!this._actors.has(dbg)){this._actors.set(dbg,new WorkerDescriptorActor(this._conn,dbg));}}
const actors=[];for(const[,actor]of this._actors){actors.push(actor);}
if(!this._mustNotify){if(this._onListChanged!==null){wdm.addListener(this);}
this._mustNotify=true;}
return Promise.resolve(actors);},get onListChanged(){return this._onListChanged;},set onListChanged(onListChanged){if(typeof onListChanged!=="function"&&onListChanged!==null){throw new Error("onListChanged must be either a function or null.");}
if(onListChanged===this._onListChanged){return;}
if(this._mustNotify){if(this._onListChanged===null&&onListChanged!==null){wdm.addListener(this);}
if(this._onListChanged!==null&&onListChanged===null){wdm.removeListener(this);}}
this._onListChanged=onListChanged;},_notifyListChanged(){this._onListChanged();if(this._onListChanged!==null){wdm.removeListener(this);}
this._mustNotify=false;},onRegister(dbg){if(matchWorkerDebugger(dbg,this._options)){this._notifyListChanged();}},onUnregister(dbg){if(matchWorkerDebugger(dbg,this._options)){this._notifyListChanged();}},get workerPauser(){if(!this._workerPauser){this._workerPauser=new WorkerPauser(this._options);}
return this._workerPauser;},};exports.WorkerDescriptorActorList=WorkerDescriptorActorList;