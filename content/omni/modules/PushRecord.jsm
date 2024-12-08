//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"EventDispatcher","resource://gre/modules/Messaging.jsm");ChromeUtils.defineModuleGetter(this,"PlacesUtils","resource://gre/modules/PlacesUtils.jsm");ChromeUtils.defineModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm");const EXPORTED_SYMBOLS=["PushRecord"];const prefs=Services.prefs.getBranch("dom.push.");const kMaxUnregisterTries=3;function PushRecord(props){this.pushEndpoint=props.pushEndpoint;this.scope=props.scope;this.originAttributes=props.originAttributes;this.pushCount=props.pushCount||0;this.lastPush=props.lastPush||0;this.lastVisit=props.lastVisit||0;this.p256dhPublicKey=props.p256dhPublicKey;this.p256dhPrivateKey=props.p256dhPrivateKey;this.authenticationSecret=props.authenticationSecret;this.systemRecord=!!props.systemRecord;this.appServerKey=props.appServerKey;this.recentMessageIDs=props.recentMessageIDs;this.setQuota(props.quota);this.ctime=typeof props.ctime==="number"?props.ctime:0;this.unregisterTries=props.unregisterTries||0;}
PushRecord.prototype={setQuota(suggestedQuota){if(this.quotaApplies()){let quota=+suggestedQuota;this.quota=quota>=0?quota:prefs.getIntPref("maxQuotaPerSubscription");}else{this.quota=Infinity;}},resetQuota(){this.quota=this.quotaApplies()?prefs.getIntPref("maxQuotaPerSubscription"):Infinity;},updateQuota(lastVisit){if(this.isExpired()||!this.quotaApplies()||this.isInstalledAppNotPWA()){return;}
if(lastVisit<0){this.quota=0;return;}
if(lastVisit>this.lastPush){

let daysElapsed=Math.max(0,(Date.now()-lastVisit)/24/60/60/1000);this.quota=Math.min(Math.round(8*Math.pow(daysElapsed,-0.8)),prefs.getIntPref("maxQuotaPerSubscription"));}},receivedPush(lastVisit){this.updateQuota(lastVisit);this.pushCount++;this.lastPush=Date.now();},noteRecentMessageID(id){if(this.recentMessageIDs){this.recentMessageIDs.unshift(id);}else{this.recentMessageIDs=[id];}
let maxRecentMessageIDs=Math.min(this.recentMessageIDs.length,Math.max(prefs.getIntPref("maxRecentMessageIDsPerSubscription"),0));this.recentMessageIDs.length=maxRecentMessageIDs||0;},hasRecentMessageID(id){return this.recentMessageIDs&&this.recentMessageIDs.includes(id);},reduceQuota(){if(!this.quotaApplies()||this.isInstalledAppNotPWA()){return;}
this.quota=Math.max(this.quota-1,0);},async getLastVisit(){if(!this.quotaApplies()||this.isInstalledAppNotPWA()||this.isTabOpen()){
return Date.now();}
if(AppConstants.MOZ_B2G){return this.lastVisit==0?this.ctime:this.lastVisit;}
if(AppConstants.MOZ_ANDROID_HISTORY){let result=await EventDispatcher.instance.sendRequestForResult({type:"History:GetPrePathLastVisitedTimeMilliseconds",prePath:this.uri.prePath,});return result==0?-Infinity:result;}



const QUOTA_REFRESH_TRANSITIONS_SQL=[Ci.nsINavHistoryService.TRANSITION_LINK,Ci.nsINavHistoryService.TRANSITION_TYPED,Ci.nsINavHistoryService.TRANSITION_BOOKMARK,Ci.nsINavHistoryService.TRANSITION_REDIRECT_PERMANENT,Ci.nsINavHistoryService.TRANSITION_REDIRECT_TEMPORARY,].join(",");let db=await PlacesUtils.promiseDBConnection();
let rows=await db.executeCached(`SELECT MAX(visit_date) AS lastVisit
       FROM moz_places p
       JOIN moz_historyvisits ON p.id = place_id
       WHERE rev_host = get_unreversed_host(:host || '.') || '.'
         AND url BETWEEN :prePath AND :prePath || X'FFFF'
         AND visit_type IN (${QUOTA_REFRESH_TRANSITIONS_SQL})
      `,{host:this.uri.host,prePath:this.uri.prePath,});if(!rows.length){return-Infinity;}
let lastVisit=rows[0].getResultByName("lastVisit");return lastVisit/1000;},isInstalledAppNotPWA(){if(AppConstants.MOZ_B2G){if(this.scope&&this.uri.host.endsWith(".localhost")){return true;}} 
return false;},isTabOpen(){for(let window of Services.wm.getEnumerator("navigator:browser")){if(window.closed||PrivateBrowsingUtils.isWindowPrivate(window)){continue;}
let tabs;if(window.gBrowser){tabs=window.gBrowser.tabs;}else if(window.shell){ tabs=Array.from(window.shell.contentBrowser.contentWindow.document.querySelectorAll("web-view"));}else{continue;}
for(let tab of tabs){let tabURI=tab.linkedBrowser.currentURI;if(tabURI.prePath==this.uri.prePath){return true;}}}
return false;},hasPermission(){if(this.systemRecord||prefs.getBoolPref("testing.ignorePermission",false)){return true;}
let permission=Services.perms.testExactPermissionFromPrincipal(this.principal,"desktop-notification");return permission==Ci.nsIPermissionManager.ALLOW_ACTION;},quotaChanged(){if(!this.hasPermission()){return Promise.resolve(false);}
return this.getLastVisit().then(lastVisit=>lastVisit>this.lastPush);},quotaApplies(){return!this.systemRecord;},isExpired(){return this.quota===0;},matchesOriginAttributes(pattern){if(this.systemRecord){return false;}
return ChromeUtils.originAttributesMatchPattern(this.principal.originAttributes,pattern);},hasAuthenticationSecret(){return(!!this.authenticationSecret&&this.authenticationSecret.byteLength==16);},matchesAppServerKey(key){if(!this.appServerKey){return!key;}
if(!key){return false;}
return(this.appServerKey.length===key.length&&this.appServerKey.every((value,index)=>value===key[index]));},toSubscription(){return{endpoint:this.pushEndpoint,lastPush:this.lastPush,pushCount:this.pushCount,p256dhKey:this.p256dhPublicKey,p256dhPrivateKey:this.p256dhPrivateKey,authenticationSecret:this.authenticationSecret,appServerKey:this.appServerKey,quota:this.quotaApplies()?this.quota:-1,systemRecord:this.systemRecord,};},reachMaxUnregisterTries(){if(this.unregisterTries>=kMaxUnregisterTries){return true;}
return false;},};
var principals=new WeakMap();Object.defineProperties(PushRecord.prototype,{principal:{get(){if(this.systemRecord){return Services.scriptSecurityManager.getSystemPrincipal();}
let principal=principals.get(this);if(!principal){let uri=Services.io.newURI(this.scope);let originSuffix=this.originAttributes||"";principal=Services.scriptSecurityManager.createContentPrincipal(uri,ChromeUtils.createOriginAttributesFromOrigin(originSuffix));principals.set(this,principal);}
return principal;},configurable:true,},uri:{get(){return this.principal.URI;},configurable:true,},});