"use strict";const Services=require("Services");const{DevToolsServer}=require("devtools/server/devtools-server");const{Cc,Ci}=require("chrome");const{ActorClassWithSpec,Actor}=require("devtools/shared/protocol");const{processDescriptorSpec,}=require("devtools/shared/specs/descriptors/process");loader.lazyRequireGetter(this,"ContentProcessTargetActor","devtools/server/actors/targets/content-process",true);loader.lazyRequireGetter(this,"ParentProcessTargetActor","devtools/server/actors/targets/parent-process",true);loader.lazyRequireGetter(this,"connectToContentProcess","devtools/server/connectors/content-process-connector",true);loader.lazyRequireGetter(this,"WatcherActor","devtools/server/actors/watcher",true);const ProcessDescriptorActor=ActorClassWithSpec(processDescriptorSpec,{initialize(connection,options={}){if("id"in options&&typeof options.id!="number"){throw Error("process connect requires a valid `id` attribute.");}
Actor.prototype.initialize.call(this,connection);this.id=options.id;this._browsingContextTargetActor=null;this.isParent=options.parent;this.destroy=this.destroy.bind(this);},get browsingContextID(){if(this._browsingContextTargetActor){return this._browsingContextTargetActor.docShell.browsingContext.id;}
return null;},_parentProcessConnect(){const env=Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);const isXpcshell=env.exists("XPCSHELL_TEST_PROFILE_DIR");let targetActor;if(isXpcshell){


targetActor=new ContentProcessTargetActor(this.conn);}else{

targetActor=new ParentProcessTargetActor(this.conn);

 this._browsingContextTargetActor=targetActor;}
this.manage(targetActor);
 return targetActor.form();},async _childProcessConnect(){const{id}=this;const mm=this._lookupMessageManager(id);if(!mm){return{error:"noProcess",message:"There is no process with id '"+id+"'.",};}
const childTargetForm=await connectToContentProcess(this.conn,mm,this.destroy);return childTargetForm;},_lookupMessageManager(id){for(let i=0;i<Services.ppmm.childCount;i++){const mm=Services.ppmm.getChildAt(i);if(id?mm.osPid==id:mm.isInProcess){return mm;}}
return null;},async getTarget(){if(!DevToolsServer.allowChromeProcess){return{error:"forbidden",message:"You are not allowed to debug processes.",};}
if(this.isParent){return this._parentProcessConnect();} 
return this._childProcessConnect();},getWatcher(){if(!this.watcher){this.watcher=new WatcherActor(this.conn);this.manage(this.watcher);}
return this.watcher;},form(){return{actor:this.actorID,id:this.id,isParent:this.isParent,traits:{ watcher:true,},};},destroy(){this._browsingContextTargetActor=null;Actor.prototype.destroy.call(this);},});exports.ProcessDescriptorActor=ProcessDescriptorActor;