//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ManifestMessagesChild"];ChromeUtils.defineModuleGetter(this,"ManifestObtainer","resource://gre/modules/ManifestObtainer.jsm");ChromeUtils.defineModuleGetter(this,"ManifestFinder","resource://gre/modules/ManifestFinder.jsm");ChromeUtils.defineModuleGetter(this,"ManifestIcons","resource://gre/modules/ManifestIcons.jsm");class ManifestMessagesChild extends JSWindowActorChild{receiveMessage(message){switch(message.name){case"DOM:WebManifest:hasManifestLink":return this.hasManifestLink();case"DOM:ManifestObtainer:Obtain":return this.obtainManifest(message.data);case"DOM:WebManifest:fetchIcon":return this.fetchIcon(message);}
return undefined;}
hasManifestLink(){const response=makeMsgResponse();response.result=ManifestFinder.contentHasManifestLink(this.contentWindow);response.success=true;return response;}
async obtainManifest(options){const{checkConformance}=options;const response=makeMsgResponse();try{response.result=await ManifestObtainer.contentObtainManifest(this.contentWindow,{checkConformance});response.success=true;}catch(err){response.result=serializeError(err);}
return response;}
async fetchIcon({data:{manifest,iconSize}}){const response=makeMsgResponse();try{response.result=await ManifestIcons.contentFetchIcon(this.contentWindow,manifest,iconSize);response.success=true;}catch(err){response.result=serializeError(err);}
return response;}}
function serializeError(aError){const clone={fileName:aError.fileName,lineNumber:aError.lineNumber,columnNumber:aError.columnNumber,stack:aError.stack,message:aError.message,name:aError.name,};return clone;}
function makeMsgResponse(){return{success:false,result:undefined,};}