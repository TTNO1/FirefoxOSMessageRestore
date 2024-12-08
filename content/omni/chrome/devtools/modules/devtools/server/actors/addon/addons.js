"use strict";const{AddonManager}=require("resource://gre/modules/AddonManager.jsm");const protocol=require("devtools/shared/protocol");const{FileUtils}=require("resource://gre/modules/FileUtils.jsm");const{addonsSpec}=require("devtools/shared/specs/addon/addons");const{Services}=require("resource://gre/modules/Services.jsm");
const AddonsActor=protocol.ActorClassWithSpec(addonsSpec,{initialize:function(conn){protocol.Actor.prototype.initialize.call(this,conn);},async installTemporaryAddon(addonPath){let addonFile;let addon;try{addonFile=new FileUtils.File(addonPath);addon=await AddonManager.installTemporaryAddon(addonFile);}catch(error){throw new Error(`Could not install add-on at '${addonPath}': ${error}`);}
Services.obs.notifyObservers(null,"devtools-installed-addon",addon.id);


return{id:addon.id,actor:false};},});exports.AddonsActor=AddonsActor;