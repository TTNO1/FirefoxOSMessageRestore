//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function debug(str){dump("-*- ContentPermissionPrompt: "+str+"\n");}
const PERM_VALUES=["unknown","allow","deny","prompt"];const PROMPT_FOR_UNKNOWN=["audio-capture","desktop-notification","geolocation","video-capture",];const{defaultPermissions}=ChromeUtils.import("resource://gre/modules/PermissionsTable.jsm");
const PERMISSION_NO_SESSION=["audio-capture","video-capture"];function shouldPrompt(perm,action){return(action==Ci.nsIPermissionManager.PROMPT_ACTION||(action==Ci.nsIPermissionManager.UNKNOWN_ACTION&&PROMPT_FOR_UNKNOWN.includes(perm)));}
function buildDefaultChoices(typesInfo){let choices;for(let type of typesInfo){if(type.options.length){if(!choices){choices={};}
choices[type.permission]=type.options[0];}}
return choices;}
function hasDefaultPermissions(principal){return defaultPermissions.every(permission=>{let perm=Services.perms.testExactPermissionFromPrincipal(principal,permission);return perm==Ci.nsIPermissionManager.ALLOW_ACTION;});}
function rememberPermission(typesInfo,remember,granted,principal){debug(`rememberPermission ${JSON.stringify(
      typesInfo
    )} remember:${remember} granted:${granted} ${principal.origin}`);let action=granted?Ci.nsIPermissionManager.ALLOW_ACTION:Ci.nsIPermissionManager.DENY_ACTION;typesInfo.forEach(perm=>{if(hasDefaultPermissions(principal)){
 if(remember){Services.perms.addFromPrincipal(principal,perm.permission,action);}}else if(!PERMISSION_NO_SESSION.includes(perm.permission)){

Services.perms.addFromPrincipal(principal,perm.permission,action,Ci.nsIPermissionManager.EXPIRE_SESSION,0);}});}
function getRequestTarget(request){
if(request.element){return request.element;}else if(request.window&&request.window.docShell&&request.window.docShell.chromeEventHandler){return request.window.docShell.chromeEventHandler;}
debug(`Unexpected target: ${request.element} ${request.window}`);return null;}
function sendToBrowserWindow(requestAction,request,typesInfo,callback){let target=getRequestTarget(request);if(!target){debug("!target, cancel directly");request.cancel();return;}
let uuid=Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();let requestId=`permission-prompt-${uuid}`;let permissions={};for(let i in typesInfo){permissions[typesInfo[i].permission]={action:PERM_VALUES[typesInfo[i].action],options:typesInfo[i].options,};}
if(requestAction=="prompt"){debug("requestAction == prompt, addEventListener on "+requestId);target.addEventListener(requestId,callback,{once:true});}
if(target&&target.dispatchEvent){target.dispatchEvent(new CustomEvent("promptpermission",{bubbles:true,detail:{requestAction,permissions,requestId,origin:request.principal.origin,},}));}else{debug("Error: !target or !target.dispatchEvent");}}
function getIsVisible(request){if(request.element){return request.element.docShellIsActive;}else if(request.window&&request.window.document){return request.window.document.hidden===false;}
debug(`Unexpected target: ${request.element} ${request.window}`);return false;}
function ContentPermissionPrompt(){}
ContentPermissionPrompt.prototype={handleExistingPermission:function handleExistingPermission(request,typesInfo){typesInfo.forEach(function(type){type.action=Services.perms.testExactPermissionFromPrincipal(request.principal,type.permission);if(shouldPrompt(type.permission,type.action)){type.action=Ci.nsIPermissionManager.PROMPT_ACTION;}});if(typesInfo.every(type=>type.action==Ci.nsIPermissionManager.ALLOW_ACTION)){debug("all permissions in the request are allowed.");request.allow(buildDefaultChoices(typesInfo));return true;}
if(typesInfo.some(type=>[Ci.nsIPermissionManager.DENY_ACTION,Ci.nsIPermissionManager.UNKNOWN_ACTION,].includes(type.action))){debug("some of permissions in the request are denied, or !shouldPrompt().");request.cancel();return true;}
return false;},prompt(request){let typesInfo=[];let perms=request.types.QueryInterface(Ci.nsIArray);for(let idx=0;idx<perms.length;idx++){let perm=perms.queryElementAt(idx,Ci.nsIContentPermissionType);debug(`prompt request.types[${idx}]: ${perm.type} ${request.principal.origin}`);let tmp={permission:perm.type,options:[],action:Ci.nsIPermissionManager.UNKNOWN_ACTION,};try{let options=perm.options.QueryInterface(Ci.nsIArray);for(let i=0;i<options.length;i++){let option=options.queryElementAt(i,Ci.nsISupportsString).data;debug(`options[${i}]: ${option}`);tmp.options.push(option);}}catch(e){debug(`ignore options error and continue. ${e}`);}
typesInfo.push(tmp);}
if(request.principal.isSystemPrincipal){request.allow(buildDefaultChoices(typesInfo));return;}
if(!typesInfo.length){request.cancel();return;}

if(this.handleExistingPermission(request,typesInfo)){return;}
let target=getRequestTarget(request);if(!target){debug("!target, cancel directly");request.cancel();return;}
let visibilitychangeHandler=function(event){debug(`callback of ${event.type} ${JSON.stringify(event.detail)}`);if(!getIsVisible(request)){debug("visibilitychange !getIsVisible, cancel.");target.removeEventListener("webview-visibilitychange",visibilitychangeHandler);request.cancel();sendToBrowserWindow("cancel",request,typesInfo);}};if(getIsVisible(request)){target.addEventListener("webview-visibilitychange",visibilitychangeHandler);sendToBrowserWindow("prompt",request,typesInfo,event=>{debug(`callback of ${event.type} ${JSON.stringify(event.detail)}`);target.removeEventListener("webview-visibilitychange",visibilitychangeHandler);let result=event.detail;rememberPermission(typesInfo,result.remember,result.granted,request.principal);if(result.granted){request.allow(result.choices);}else{request.cancel();}});}else{debug("target is not visible, cancel request.");request.cancel();}},classID:Components.ID("{8c719f03-afe0-4aac-91ff-6c215895d467}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIContentPermissionPrompt]),};this.EXPORTED_SYMBOLS=["ContentPermissionPrompt"];