"use strict";var{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");var{ExtensionError}=ExtensionUtils;class UserScriptParent{constructor(details){this.scriptId=details.scriptId;this.options=this._convertOptions(details);}
destroy(){if(this.destroyed){throw new Error("Unable to destroy UserScriptParent twice");}
this.destroyed=true;this.options=null;}
_convertOptions(details){const options={matches:details.matches,excludeMatches:details.excludeMatches,includeGlobs:details.includeGlobs,excludeGlobs:details.excludeGlobs,allFrames:details.allFrames,matchAboutBlank:details.matchAboutBlank,runAt:details.runAt||"document_idle",jsPaths:details.js,userScriptOptions:{scriptMetadata:details.scriptMetadata,},};return options;}
serialize(){return this.options;}}
this.userScripts=class extends ExtensionAPI{constructor(...args){super(...args);this.userScriptsMap=new Map();}
getAPI(context){const{extension}=context;const registeredScriptIds=new Set();const unregisterContentScripts=scriptIds=>{if(scriptIds.length===0){return Promise.resolve();}
for(let scriptId of scriptIds){registeredScriptIds.delete(scriptId);extension.registeredContentScripts.delete(scriptId);this.userScriptsMap.delete(scriptId);}
extension.updateContentScripts();return context.extension.broadcast("Extension:UnregisterContentScripts",{id:context.extension.id,scriptIds,});};context.callOnClose({close(){unregisterContentScripts(Array.from(registeredScriptIds));},});return{userScripts:{register:async details=>{for(let origin of details.matches){if(!extension.allowedOrigins.subsumes(new MatchPattern(origin))){throw new ExtensionError(`Permission denied to register a user script for ${origin}`);}}
const userScript=new UserScriptParent(details);const{scriptId}=userScript;this.userScriptsMap.set(scriptId,userScript);const scriptOptions=userScript.serialize();await extension.broadcast("Extension:RegisterContentScript",{id:extension.id,options:scriptOptions,scriptId,});extension.registeredContentScripts.set(scriptId,scriptOptions);extension.updateContentScripts();return scriptId;},


unregister:async scriptId=>{const userScript=this.userScriptsMap.get(scriptId);if(!userScript){throw new Error(`No such user script ID: ${scriptId}`);}
userScript.destroy();await unregisterContentScripts([scriptId]);},},};}};