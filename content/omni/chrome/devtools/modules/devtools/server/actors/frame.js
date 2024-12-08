"use strict";const{Cu}=require("chrome");const Debugger=require("Debugger");const{assert}=require("devtools/shared/DevToolsUtils");const{Pool}=require("devtools/shared/protocol/Pool");const{createValueGrip}=require("devtools/server/actors/object/utils");const{ActorClassWithSpec,Actor}=require("devtools/shared/protocol");const{frameSpec}=require("devtools/shared/specs/frame");function formatDisplayName(frame){if(frame.type==="call"){const callee=frame.callee;return callee.name||callee.userDisplayName||callee.displayName;}
return`(${frame.type})`;}
function isDeadSavedFrame(savedFrame){return Cu&&Cu.isDeadWrapper(savedFrame);}
function isValidSavedFrame(threadActor,savedFrame){return(!isDeadSavedFrame(savedFrame)&&



getSavedFrameSource(threadActor,savedFrame));}
function getSavedFrameSource(threadActor,savedFrame){return threadActor.sourcesManager.getSourceActorByInternalSourceId(savedFrame.sourceId);}
function getSavedFrameParent(threadActor,savedFrame){if(isDeadSavedFrame(savedFrame)){return null;}
while(true){savedFrame=savedFrame.parent||savedFrame.asyncParent;
if(!savedFrame||isDeadSavedFrame(savedFrame)){savedFrame=null;break;}
if(isValidSavedFrame(threadActor,savedFrame)){break;}}
return savedFrame;}
const FrameActor=ActorClassWithSpec(frameSpec,{initialize:function(frame,threadActor,depth){Actor.prototype.initialize.call(this,threadActor.conn);this.frame=frame;this.threadActor=threadActor;this.depth=depth;},_frameLifetimePool:null,get frameLifetimePool(){if(!this._frameLifetimePool){this._frameLifetimePool=new Pool(this.conn,"frame");}
return this._frameLifetimePool;},destroy:function(){if(this._frameLifetimePool){this._frameLifetimePool.destroy();this._frameLifetimePool=null;}
Actor.prototype.destroy.call(this);},getEnvironment:function(){try{if(!this.frame.environment){return{};}}catch(e){

return{};}
const envActor=this.threadActor.createEnvironmentActor(this.frame.environment,this.frameLifetimePool);return envActor.form();},form:function(){if(!(this.frame instanceof Debugger.Frame)){

assert(!isDeadSavedFrame(this.frame));const obj={actor:this.actorID,type:"dead",asyncCause:this.frame.asyncCause,state:"dead",displayName:this.frame.functionDisplayName,arguments:[],where:{
actor:getSavedFrameSource(this.threadActor,this.frame).actorID,line:this.frame.line,
column:this.frame.column-1,},oldest:!getSavedFrameParent(this.threadActor,this.frame),};return obj;}
const threadActor=this.threadActor;const form={actor:this.actorID,type:this.frame.type,asyncCause:this.frame.onStack?null:"await",state:this.frame.onStack?"on-stack":"suspended",};if(this.depth){form.depth=this.depth;}
if(this.frame.type!="wasmcall"){form.this=createValueGrip(this.frame.this,threadActor._pausePool,threadActor.objectGrip);}
form.displayName=formatDisplayName(this.frame);form.arguments=this._args();if(this.frame.script){const location=this.threadActor.sourcesManager.getFrameLocation(this.frame);form.where={actor:location.sourceActor.actorID,line:location.line,column:location.column,};}
if(!this.frame.older){form.oldest=true;}
return form;},_args:function(){if(!this.frame.onStack||!this.frame.arguments){return[];}
return this.frame.arguments.map(arg=>createValueGrip(arg,this.threadActor._pausePool,this.threadActor.objectGrip));},});exports.FrameActor=FrameActor;exports.formatDisplayName=formatDisplayName;exports.getSavedFrameParent=getSavedFrameParent;exports.isValidSavedFrame=isValidSavedFrame;