//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

"use strict";var EXPORTED_SYMBOLS=["Readerable"];var REGEXPS={
unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i,};function isNodeVisible(node){return(!node.style||node.style.display!="none")&&!node.hasAttribute("hidden")
&&(!node.hasAttribute("aria-hidden")||node.getAttribute("aria-hidden")!="true"||(node.className&&node.className.indexOf&&node.className.indexOf("fallback-image")!==-1));}
function isProbablyReaderable(doc,isVisible){if(!isVisible){isVisible=isNodeVisible;}
var nodes=doc.querySelectorAll("p, pre");
var brNodes=doc.querySelectorAll("div > br");if(brNodes.length){var set=new Set(nodes);[].forEach.call(brNodes,function(node){set.add(node.parentNode);});nodes=Array.from(set);}
var score=0;
return[].some.call(nodes,function(node){if(!isVisible(node))
return false;var matchString=node.className+" "+node.id;if(REGEXPS.unlikelyCandidates.test(matchString)&&!REGEXPS.okMaybeItsACandidate.test(matchString)){return false;}
if(node.matches("li p")){return false;}
var textContentLength=node.textContent.trim().length;if(textContentLength<140){return false;}
score+=Math.sqrt(textContentLength-140);if(score>20){return true;}
return false;});}
if(typeof module==="object"){module.exports=isProbablyReaderable;}
"use strict";
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");function isNodeVisible(node){return node.clientHeight>0&&node.clientWidth>0;}
var Readerable={get isEnabledForParseOnLoad(){return this.isEnabled||this.isForceEnabled;},isProbablyReaderable(doc){if(doc.mozSyntheticDocument||!(doc instanceof doc.defaultView.HTMLDocument)){return false;}
let uri=Services.io.newURI(doc.location.href);if(!this.shouldCheckUri(uri)){return false;}
return isProbablyReaderable(doc,isNodeVisible);},_blockedHosts:["amazon.com","github.com","mail.google.com","pinterest.com","reddit.com","twitter.com","youtube.com",],shouldCheckUri(uri,isBaseUri=false){if(!["http","https"].includes(uri.scheme)){return false;}
if(!isBaseUri){let{host}=uri;if(this._blockedHosts.some(blockedHost=>host.endsWith(blockedHost))){return false;}
if(uri.filePath=="/"){return false;}}
return true;},};XPCOMUtils.defineLazyPreferenceGetter(Readerable,"isEnabled","reader.parse-on-load.enabled",true);XPCOMUtils.defineLazyPreferenceGetter(Readerable,"isForceEnabled","reader.parse-on-load.force-enabled",false);