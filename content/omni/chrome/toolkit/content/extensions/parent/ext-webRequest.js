"use strict";ChromeUtils.defineModuleGetter(this,"WebRequest","resource://gre/modules/WebRequest.jsm");var{parseMatchPatterns}=ExtensionUtils;
function registerEvent(extension,eventName,fire,filter,info,remoteTab=null){let listener=async data=>{let event=data.serialize(eventName);if(data.registerTraceableChannel){

if(fire.wakeup){await fire.wakeup();}
data.registerTraceableChannel(extension.policy,remoteTab);}
return fire.sync(event);};let filter2={};if(filter.urls){let perms=new MatchPatternSet([...extension.allowedOrigins.patterns,...extension.optionalOrigins.patterns,]);filter2.urls=parseMatchPatterns(filter.urls);if(!perms.overlapsAll(filter2.urls)){Cu.reportError("The webRequest.addListener filter doesn't overlap with host permissions.");}}
if(filter.types){filter2.types=filter.types;}
if(filter.tabId!==undefined){filter2.tabId=filter.tabId;}
if(filter.windowId!==undefined){filter2.windowId=filter.windowId;}
if(filter.incognito!==undefined){filter2.incognito=filter.incognito;}
let blockingAllowed=extension.hasPermission("webRequestBlocking");let info2=[];if(info){for(let desc of info){if(desc=="blocking"&&!blockingAllowed){

Cu.reportError("Using webRequest.addListener with the blocking option "+"requires the 'webRequestBlocking' permission.");}else{info2.push(desc);}}}
let listenerDetails={addonId:extension.id,policy:extension.policy,blockingAllowed,};WebRequest[eventName].addListener(listener,filter2,info2,listenerDetails);return{unregister:()=>{WebRequest[eventName].removeListener(listener);},convert(_fire,context){fire=_fire;remoteTab=context.xulBrowser.frameLoader.remoteTab;},};}
function makeWebRequestEvent(context,name){return new EventManager({context,name:`webRequest.${name}`,persistent:{module:"webRequest",event:name,},register:(fire,filter,info)=>{return registerEvent(context.extension,name,fire,filter,info,context.xulBrowser.frameLoader.remoteTab).unregister;},}).api();}
this.webRequest=class extends ExtensionAPI{primeListener(extension,event,fire,params){return registerEvent(extension,event,fire,...params);}
getAPI(context){return{webRequest:{onBeforeRequest:makeWebRequestEvent(context,"onBeforeRequest"),onBeforeSendHeaders:makeWebRequestEvent(context,"onBeforeSendHeaders"),onSendHeaders:makeWebRequestEvent(context,"onSendHeaders"),onHeadersReceived:makeWebRequestEvent(context,"onHeadersReceived"),onAuthRequired:makeWebRequestEvent(context,"onAuthRequired"),onBeforeRedirect:makeWebRequestEvent(context,"onBeforeRedirect"),onResponseStarted:makeWebRequestEvent(context,"onResponseStarted"),onErrorOccurred:makeWebRequestEvent(context,"onErrorOccurred"),onCompleted:makeWebRequestEvent(context,"onCompleted"),getSecurityInfo:function(requestId,options={}){return WebRequest.getSecurityInfo({id:requestId,policy:context.extension.policy,remoteTab:context.xulBrowser.frameLoader.remoteTab,options,});},handlerBehaviorChanged:function(){},},};}};