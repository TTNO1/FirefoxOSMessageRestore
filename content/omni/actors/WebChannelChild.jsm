var EXPORTED_SYMBOLS=["WebChannelChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ContentDOMReference}=ChromeUtils.import("resource://gre/modules/ContentDOMReference.jsm");

const URL_WHITELIST_PREF="webchannel.allowObject.urlWhitelist";let _cachedWhitelist=null;const CACHED_PREFS={};XPCOMUtils.defineLazyPreferenceGetter(CACHED_PREFS,"URL_WHITELIST",URL_WHITELIST_PREF,"",()=>(_cachedWhitelist=null));class WebChannelChild extends JSWindowActorChild{handleEvent(event){if(event.type==="WebChannelMessageToChrome"){return this._onMessageToChrome(event);}
return undefined;}
receiveMessage(msg){if(msg.name==="WebChannelMessageToContent"){return this._onMessageToContent(msg);}
return undefined;}
_getWhitelistedPrincipals(){if(!_cachedWhitelist){let urls=CACHED_PREFS.URL_WHITELIST.split(/\s+/);_cachedWhitelist=urls.map(origin=>Services.scriptSecurityManager.createContentPrincipalFromOrigin(origin));}
return _cachedWhitelist;}
_onMessageToChrome(e){let principal=e.target.nodePrincipal?e.target.nodePrincipal:e.target.document.nodePrincipal;if(e.detail){if(typeof e.detail!="string"){

let objectsAllowed=this._getWhitelistedPrincipals().some(whitelisted=>principal.originNoSuffix==whitelisted.originNoSuffix);if(!objectsAllowed){Cu.reportError("WebChannelMessageToChrome sent with an object from a non-whitelisted principal");return;}}
let eventTarget=e.target instanceof Ci.nsIDOMWindow?null:ContentDOMReference.get(e.target);this.sendAsyncMessage("WebChannelMessageToChrome",{contentData:e.detail,eventTarget,principal,});}else{Cu.reportError("WebChannel message failed. No message detail.");}}
_onMessageToContent(msg){if(msg.data&&this.contentWindow){


let{eventTarget,principal}=msg.data;if(!eventTarget){eventTarget=this.contentWindow;}else{eventTarget=ContentDOMReference.resolve(eventTarget);}
if(!eventTarget){Cu.reportError("WebChannel message failed. No target.");return;}
let targetPrincipal=eventTarget instanceof Ci.nsIDOMWindow?eventTarget.document.nodePrincipal:eventTarget.nodePrincipal;if(principal.subsumes(targetPrincipal)){let targetWindow=this.contentWindow;eventTarget.dispatchEvent(new targetWindow.CustomEvent("WebChannelMessageToContent",{detail:Cu.cloneInto({id:msg.data.id,message:msg.data.message,},targetWindow),}));}else{Cu.reportError("WebChannel message failed. Principal mismatch.");}}else{Cu.reportError("WebChannel message failed. No message data.");}}}