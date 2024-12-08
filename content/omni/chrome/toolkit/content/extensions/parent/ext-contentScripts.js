"use strict";var{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");var{ExtensionError,getUniqueId}=ExtensionUtils;class ContentScriptParent{constructor({context,details}){this.context=context;this.scriptId=getUniqueId();this.blobURLs=new Set();this.options=this._convertOptions(details);context.callOnClose(this);}
close(){this.destroy();}
destroy(){if(this.destroyed){throw new Error("Unable to destroy ContentScriptParent twice");}
this.destroyed=true;this.context.forgetOnClose(this);for(const blobURL of this.blobURLs){this.context.cloneScope.URL.revokeObjectURL(blobURL);}
this.blobURLs.clear();this.context=null;this.options=null;}
_convertOptions(details){const{context}=this;const options={matches:details.matches,excludeMatches:details.excludeMatches,includeGlobs:details.includeGlobs,excludeGlobs:details.excludeGlobs,allFrames:details.allFrames,matchAboutBlank:details.matchAboutBlank,runAt:details.runAt||"document_idle",jsPaths:[],cssPaths:[],};const convertCodeToURL=(data,mime)=>{const blob=new context.cloneScope.Blob(data,{type:mime});const blobURL=context.cloneScope.URL.createObjectURL(blob);this.blobURLs.add(blobURL);return blobURL;};if(details.js&&details.js.length){options.jsPaths=details.js.map(data=>{if(data.file){return data.file;}
return convertCodeToURL([data.code],"text/javascript");});}
if(details.css&&details.css.length){options.cssPaths=details.css.map(data=>{if(data.file){return data.file;}
return convertCodeToURL([data.code],"text/css");});}
return options;}
serialize(){return this.options;}}
this.contentScripts=class extends ExtensionAPI{getAPI(context){const{extension}=context;const parentScriptsMap=new Map();context.callOnClose({close(){if(parentScriptsMap.size===0){return;}
const scriptIds=Array.from(parentScriptsMap.keys());for(let scriptId of scriptIds){extension.registeredContentScripts.delete(scriptId);}
extension.updateContentScripts();extension.broadcast("Extension:UnregisterContentScripts",{id:extension.id,scriptIds,});},});return{contentScripts:{async register(details){for(let origin of details.matches){if(!extension.allowedOrigins.subsumes(new MatchPattern(origin))){throw new ExtensionError(`Permission denied to register a content script for ${origin}`);}}
const contentScript=new ContentScriptParent({context,details});const{scriptId}=contentScript;parentScriptsMap.set(scriptId,contentScript);const scriptOptions=contentScript.serialize();await extension.broadcast("Extension:RegisterContentScript",{id:extension.id,options:scriptOptions,scriptId,});extension.registeredContentScripts.set(scriptId,scriptOptions);extension.updateContentScripts();return scriptId;},


async unregister(scriptId){const contentScript=parentScriptsMap.get(scriptId);if(!contentScript){Cu.reportError(new Error(`No such content script ID: ${scriptId}`));return;}
parentScriptsMap.delete(scriptId);extension.registeredContentScripts.delete(scriptId);extension.updateContentScripts();contentScript.destroy();await extension.broadcast("Extension:UnregisterContentScripts",{id:extension.id,scriptIds:[scriptId],});},},};}};