"use strict";const{Actor,ActorClassWithSpec}=require("devtools/shared/protocol");const{manifestSpec}=require("devtools/shared/specs/manifest");loader.lazyImporter(this,"ManifestObtainer","resource://gre/modules/ManifestObtainer.jsm");const ManifestActor=ActorClassWithSpec(manifestSpec,{initialize:function(conn,targetActor){Actor.prototype.initialize.call(this,conn);this.targetActor=targetActor;},fetchCanonicalManifest:async function(){try{const manifest=await ManifestObtainer.contentObtainManifest(this.targetActor.window,{checkConformance:true});return{manifest};}catch(error){return{manifest:null,errorMessage:error.message};}},});exports.ManifestActor=ManifestActor;