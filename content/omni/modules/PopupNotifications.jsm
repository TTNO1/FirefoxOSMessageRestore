//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["PopupNotifications"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{PrivateBrowsingUtils}=ChromeUtils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");const{PromiseUtils}=ChromeUtils.import("resource://gre/modules/PromiseUtils.jsm");const NOTIFICATION_EVENT_DISMISSED="dismissed";const NOTIFICATION_EVENT_REMOVED="removed";const NOTIFICATION_EVENT_SHOWING="showing";const NOTIFICATION_EVENT_SHOWN="shown";const NOTIFICATION_EVENT_SWAPPING="swapping";const ICON_SELECTOR=".notification-anchor-icon";const ICON_ATTRIBUTE_SHOWING="showing";const ICON_ANCHOR_ATTRIBUTE="popupnotificationanchor";const PREF_SECURITY_DELAY="security.notification_enable_delay";const TELEMETRY_STAT_OFFERED=0;const TELEMETRY_STAT_ACTION_1=1;const TELEMETRY_STAT_ACTION_2=2;const TELEMETRY_STAT_ACTION_LAST=4;const TELEMETRY_STAT_REMOVAL_LEAVE_PAGE=6;const TELEMETRY_STAT_OPEN_SUBMENU=10;const TELEMETRY_STAT_LEARN_MORE=11;const TELEMETRY_STAT_REOPENED_OFFSET=20;var popupNotificationsMap=new WeakMap();var gNotificationParents=new WeakMap();function getAnchorFromBrowser(aBrowser,aAnchorID){let attrPrefix=aAnchorID?aAnchorID.replace("notification-icon",""):"";let anchor=aBrowser.getAttribute(attrPrefix+ICON_ANCHOR_ATTRIBUTE)||aBrowser[attrPrefix+ICON_ANCHOR_ATTRIBUTE]||aBrowser.getAttribute(ICON_ANCHOR_ATTRIBUTE)||aBrowser[ICON_ANCHOR_ATTRIBUTE];if(anchor){if(ChromeUtils.getClassName(anchor)=="XULElement"){return anchor;}
return aBrowser.ownerDocument.getElementById(anchor);}
return null;}
function getNotificationFromElement(aElement){return aElement.closest("popupnotification");}
function Notification(id,message,anchorID,mainAction,secondaryActions,browser,owner,options){this.id=id;this.message=message;this.anchorID=anchorID;this.mainAction=mainAction;this.secondaryActions=secondaryActions||[];this.browser=browser;this.owner=owner;this.options=options||{};this._dismissed=false;this._checkboxChecked=null;this.wasDismissed=false;this.recordedTelemetryStats=new Set();this.isPrivate=PrivateBrowsingUtils.isWindowPrivate(this.browser.ownerGlobal);this.timeCreated=this.owner.window.performance.now();}
Notification.prototype={id:null,message:null,anchorID:null,mainAction:null,secondaryActions:null,browser:null,owner:null,options:null,timeShown:null,set dismissed(value){this._dismissed=value;if(value){this.wasDismissed=true;}},get dismissed(){return this._dismissed;},remove:function Notification_remove(){this.owner.remove(this);},get anchorElement(){let iconBox=this.owner.iconBox;let anchorElement=getAnchorFromBrowser(this.browser,this.anchorID);if(!iconBox){return anchorElement;}
if(!anchorElement&&this.anchorID){anchorElement=iconBox.querySelector("#"+this.anchorID);} 
if(!anchorElement){anchorElement=iconBox.querySelector("#default-notification-icon")||iconBox;}
return anchorElement;},reshow(){this.owner._reshowNotifications(this.anchorElement,this.browser);},_recordTelemetry(histogramId,value){if(this.isPrivate){





return;}
let histogram=Services.telemetry.getKeyedHistogramById(histogramId);histogram.add("(all)",value);histogram.add(this.id,value);},_recordTelemetryStat(value){if(this.wasDismissed){value+=TELEMETRY_STAT_REOPENED_OFFSET;}
if(!this.recordedTelemetryStats.has(value)){this.recordedTelemetryStats.add(value);this._recordTelemetry("POPUP_NOTIFICATION_STATS",value);}},};function PopupNotifications(tabbrowser,panel,iconBox,options={}){if(!tabbrowser){throw new Error("Invalid tabbrowser");}
if(iconBox&&ChromeUtils.getClassName(iconBox)!="XULElement"){throw new Error("Invalid iconBox");}
if(ChromeUtils.getClassName(panel)!="XULPopupElement"){throw new Error("Invalid panel");}
this._shouldSuppress=options.shouldSuppress||(()=>false);this._suppress=this._shouldSuppress();this.window=tabbrowser.ownerGlobal;this.panel=panel;this.tabbrowser=tabbrowser;this.iconBox=iconBox;this.buttonDelay=Services.prefs.getIntPref(PREF_SECURITY_DELAY);this.panel.addEventListener("popuphidden",this,true);this.panel.classList.add("popup-notification-panel","panel-no-padding");
this._handleWindowKeyPress=aEvent=>{if(aEvent.keyCode!=aEvent.DOM_VK_ESCAPE){return;}
let notification=this.panel.firstElementChild;if(!notification){return;}
let doc=this.window.document;let focusedElement=Services.focus.focusedElement;if(!focusedElement||focusedElement==doc.body||focusedElement==this.tabbrowser.selectedBrowser||notification.contains(focusedElement)){let escAction=notification.notification.options.escAction;this._onButtonEvent(aEvent,escAction,"esc-press",notification);}};let documentElement=this.window.document.documentElement;let locationBarHidden=documentElement.getAttribute("chromehidden").includes("location");let isFullscreen=!!this.window.document.fullscreenElement;this.panel.setAttribute("followanchor",!locationBarHidden&&!isFullscreen);


this.window.addEventListener("MozDOMFullscreen:Entered",()=>{this.panel.setAttribute("followanchor","false");},true);this.window.addEventListener("MozDOMFullscreen:Exited",()=>{this.panel.setAttribute("followanchor",!locationBarHidden);},true);this.window.addEventListener("activate",this,true);if(this.tabbrowser.tabContainer){this.tabbrowser.tabContainer.addEventListener("TabSelect",this,true);this.tabbrowser.tabContainer.addEventListener("TabClose",aEvent=>{
this.nextRemovalReason=TELEMETRY_STAT_REMOVAL_LEAVE_PAGE;let notifications=this._getNotificationsForBrowser(aEvent.target.linkedBrowser);for(let notification of notifications){this._fireCallback(notification,NOTIFICATION_EVENT_REMOVED,this.nextRemovalReason);notification._recordTelemetryStat(this.nextRemovalReason);}});}}
PopupNotifications.prototype={window:null,panel:null,tabbrowser:null,_iconBox:null,set iconBox(iconBox){ if(this._iconBox){this._iconBox.removeEventListener("click",this);this._iconBox.removeEventListener("keypress",this);}
this._iconBox=iconBox;if(iconBox){iconBox.addEventListener("click",this);iconBox.addEventListener("keypress",this);}},get iconBox(){return this._iconBox;},getNotification:function PopupNotifications_getNotification(id,browser){let notifications=this._getNotificationsForBrowser(browser||this.tabbrowser.selectedBrowser);if(Array.isArray(id)){return notifications.filter(x=>id.includes(x.id));}
return notifications.find(x=>x.id==id)||null;},show:function PopupNotifications_show(browser,id,message,anchorID,mainAction,secondaryActions,options){function isInvalidAction(a){return(!a||!(typeof a.callback=="function")||!a.label||!a.accessKey);}
if(!browser){throw new Error("PopupNotifications_show: invalid browser");}
if(!id){throw new Error("PopupNotifications_show: invalid ID");}
if(mainAction&&isInvalidAction(mainAction)){throw new Error("PopupNotifications_show: invalid mainAction");}
if(secondaryActions&&secondaryActions.some(isInvalidAction)){throw new Error("PopupNotifications_show: invalid secondaryActions");}
let notification=new Notification(id,message,anchorID,mainAction,secondaryActions,browser,this,options);if(options){let escAction=options.escAction;if(escAction!="buttoncommand"&&escAction!="secondarybuttoncommand"){escAction="secondarybuttoncommand";}
notification.options.escAction=escAction;}
if(options&&options.dismissed){notification.dismissed=true;}
let existingNotification=this.getNotification(id,browser);if(existingNotification){this._remove(existingNotification);}
let notifications=this._getNotificationsForBrowser(browser);notifications.push(notification);let isActiveBrowser=this._isActiveBrowser(browser);let isActiveWindow=Services.focus.activeWindow==this.window;if(isActiveBrowser){if(isActiveWindow){if(options&&!options.dismissed&&options.autofocus){this.panel.removeAttribute("noautofocus");}else{this.panel.setAttribute("noautofocus","true");} 
this._update(notifications,new Set([notification.anchorElement]),true);}else{ if(!notification.dismissed){this.window.getAttention();}
this._updateAnchorIcons(notifications,this._getAnchorsForNotifications(notifications,notification.anchorElement));this._notify("backgroundShow");}}else{this._notify("backgroundShow");}
return notification;},get isPanelOpen(){let panelState=this.panel.state;return panelState=="showing"||panelState=="open";},locationChange:function PopupNotifications_locationChange(aBrowser){if(!aBrowser){throw new Error("PopupNotifications_locationChange: invalid browser");}
let notifications=this._getNotificationsForBrowser(aBrowser);this.nextRemovalReason=TELEMETRY_STAT_REMOVAL_LEAVE_PAGE;notifications=notifications.filter(function(notification){
 if(notification.options.persistWhileVisible&&this.isPanelOpen){if("persistence"in notification.options&&notification.options.persistence){notification.options.persistence--;}
return true;}
 
if("persistence"in notification.options&&notification.options.persistence){notification.options.persistence--;return true;} 
if("timeout"in notification.options&&Date.now()<=notification.options.timeout){return true;}
notification._recordTelemetryStat(this.nextRemovalReason);this._fireCallback(notification,NOTIFICATION_EVENT_REMOVED,this.nextRemovalReason);return false;},this);this._setNotificationsForBrowser(aBrowser,notifications);if(this._isActiveBrowser(aBrowser)){this.anchorVisibilityChange();}},anchorVisibilityChange(){let suppress=this._shouldSuppress();if(!suppress){this._suppress=false;let notifications=this._getNotificationsForBrowser(this.tabbrowser.selectedBrowser);this._update(notifications,this._getAnchorsForNotifications(notifications,getAnchorFromBrowser(this.tabbrowser.selectedBrowser)));return;}
if(!this._suppress){this._suppress=true;this._hidePanel().catch(Cu.reportError);}},remove:function PopupNotifications_remove(notification,isCancel=false){let notificationArray=Array.isArray(notification)?notification:[notification];let activeBrowser;notificationArray.forEach(n=>{this._remove(n,isCancel);if(!activeBrowser&&this._isActiveBrowser(n.browser)){activeBrowser=n.browser;}});if(activeBrowser){let browserNotifications=this._getNotificationsForBrowser(activeBrowser);this._update(browserNotifications);}},handleEvent(aEvent){switch(aEvent.type){case"popuphidden":this._onPopupHidden(aEvent);break;case"activate":if(this.isPanelOpen){for(let elt of this.panel.children){elt.notification.timeShown=this.window.performance.now();}
break;} 
case"TabSelect":
this.window.setTimeout(()=>{this._suppress=this._shouldSuppress();this._update();},0);break;case"click":case"keypress":this._onIconBoxCommand(aEvent);break;}}, _ignoreDismissal:null,_currentAnchorElement:null,get _currentNotifications(){return this.tabbrowser.selectedBrowser?this._getNotificationsForBrowser(this.tabbrowser.selectedBrowser):[];},_remove:function PopupNotifications_removeHelper(notification,isCancel=false){
let notifications=this._getNotificationsForBrowser(notification.browser);if(!notifications){return;}
var index=notifications.indexOf(notification);if(index==-1){return;}
if(this._isActiveBrowser(notification.browser)){notification.anchorElement.removeAttribute(ICON_ATTRIBUTE_SHOWING);} 
notifications.splice(index,1);this._fireCallback(notification,NOTIFICATION_EVENT_REMOVED,this.nextRemovalReason,isCancel);},_dismiss:function PopupNotifications_dismiss(event,disablePersistent=false){if(disablePersistent){let notificationEl=getNotificationFromElement(event.target);if(notificationEl){notificationEl.notification.options.persistent=false;}}
let browser=this.panel.firstElementChild&&this.panel.firstElementChild.notification.browser;this.panel.hidePopup();if(browser){browser.focus();}},_hidePanel:function PopupNotifications_hide(){if(this.panel.state=="closed"){return Promise.resolve();}
if(this._ignoreDismissal){return this._ignoreDismissal.promise;}
let deferred=PromiseUtils.defer();this._ignoreDismissal=deferred;this.panel.hidePopup();return deferred.promise;},_clearPanel(){let popupnotification;while((popupnotification=this.panel.lastElementChild)){this.panel.removeChild(popupnotification);
let originalParent=gNotificationParents.get(popupnotification);if(originalParent){popupnotification.notification=null;
popupnotification.hidden=true;originalParent.appendChild(popupnotification);}}},_formatDescriptionMessage(n){let text={};let array=n.message.split(/<>|{}/);text.start=array[0]||"";text.name=n.options.name||"";text.end=array[1]||"";if(array.length==3){text.secondName=n.options.secondName||"";text.secondEnd=array[2]||"";
if(n.message.indexOf("{}")<n.message.indexOf("<>")){let tmp=text.name;text.name=text.secondName;text.secondName=tmp;}}else if(array.length>3){Cu.reportError("Unexpected array length encountered in "+"_formatDescriptionMessage: "+
array.length);}
return text;},_refreshPanel:function PopupNotifications_refreshPanel(notificationsToShow){this._clearPanel();notificationsToShow.forEach(function(n){let doc=this.window.document;
let popupnotificationID=n.id+"-notification";
let popupnotification=doc.getElementById(popupnotificationID);if(popupnotification){gNotificationParents.set(popupnotification,popupnotification.parentNode);}else{popupnotification=doc.createXULElement("popupnotification");}
let desc=this._formatDescriptionMessage(n);popupnotification.setAttribute("label",desc.start);popupnotification.setAttribute("name",desc.name);popupnotification.setAttribute("endlabel",desc.end);if("secondName"in desc&&"secondEnd"in desc){popupnotification.setAttribute("secondname",desc.secondName);popupnotification.setAttribute("secondendlabel",desc.secondEnd);}else{popupnotification.removeAttribute("secondname");popupnotification.removeAttribute("secondendlabel");}
if(n.options.hintText){popupnotification.setAttribute("hinttext",n.options.hintText);}else{popupnotification.removeAttribute("hinttext");}
popupnotification.setAttribute("id",popupnotificationID);popupnotification.setAttribute("popupid",n.id);popupnotification.setAttribute("oncommand","PopupNotifications._onCommand(event);");popupnotification.setAttribute("closebuttoncommand",`PopupNotifications._dismiss(event, true);`);if(n.mainAction){popupnotification.setAttribute("buttonlabel",n.mainAction.label);popupnotification.setAttribute("buttonaccesskey",n.mainAction.accessKey);popupnotification.toggleAttribute("buttonhighlight",!n.mainAction.disableHighlight);popupnotification.setAttribute("buttoncommand","PopupNotifications._onButtonEvent(event, 'buttoncommand');");popupnotification.setAttribute("dropmarkerpopupshown","PopupNotifications._onButtonEvent(event, 'dropmarkerpopupshown');");popupnotification.setAttribute("learnmoreclick","PopupNotifications._onButtonEvent(event, 'learnmoreclick');");popupnotification.setAttribute("menucommand","PopupNotifications._onMenuCommand(event);");}else{ popupnotification.setAttribute("buttoncommand","PopupNotifications._onButtonEvent(event, 'buttoncommand');");popupnotification.toggleAttribute("buttonhighlight",true);popupnotification.removeAttribute("buttonlabel");popupnotification.removeAttribute("buttonaccesskey");popupnotification.removeAttribute("dropmarkerpopupshown");popupnotification.removeAttribute("learnmoreclick");popupnotification.removeAttribute("menucommand");}
let classes="popup-notification-icon";if(n.options.popupIconClass){classes+=" "+n.options.popupIconClass;}
popupnotification.setAttribute("iconclass",classes);if(n.options.popupIconURL){popupnotification.setAttribute("icon",n.options.popupIconURL);}else{popupnotification.removeAttribute("icon");}
if(n.options.learnMoreURL){popupnotification.setAttribute("learnmoreurl",n.options.learnMoreURL);}else{popupnotification.removeAttribute("learnmoreurl");}
if(n.options.displayURI){let uri;try{if(n.options.displayURI instanceof Ci.nsIFileURL){uri=n.options.displayURI.pathQueryRef;}else{try{uri=n.options.displayURI.hostPort;}catch(e){uri=n.options.displayURI.spec;}}
popupnotification.setAttribute("origin",uri);}catch(e){Cu.reportError(e);popupnotification.removeAttribute("origin");}}else{popupnotification.removeAttribute("origin");}
if(n.options.hideClose){popupnotification.setAttribute("closebuttonhidden","true");}
popupnotification.notification=n;let menuitems=[];if(n.mainAction&&n.secondaryActions&&n.secondaryActions.length){let telemetryStatId=TELEMETRY_STAT_ACTION_2;let secondaryAction=n.secondaryActions[0];popupnotification.setAttribute("secondarybuttonlabel",secondaryAction.label);popupnotification.setAttribute("secondarybuttonaccesskey",secondaryAction.accessKey);popupnotification.setAttribute("secondarybuttoncommand","PopupNotifications._onButtonEvent(event, 'secondarybuttoncommand');");for(let i=1;i<n.secondaryActions.length;i++){let action=n.secondaryActions[i];let item=doc.createXULElement("menuitem");item.setAttribute("label",action.label);item.setAttribute("accesskey",action.accessKey);item.notification=n;item.action=action;menuitems.push(item);
item.action.telemetryStatId=telemetryStatId;if(telemetryStatId<TELEMETRY_STAT_ACTION_LAST){telemetryStatId++;}}
popupnotification.setAttribute("secondarybuttonhidden","false");}else{popupnotification.setAttribute("secondarybuttonhidden","true");}
popupnotification.setAttribute("dropmarkerhidden",n.secondaryActions.length<2?"true":"false");let checkbox=n.options.checkbox;if(checkbox&&checkbox.label){let checked=n._checkboxChecked!=null?n._checkboxChecked:!!checkbox.checked;popupnotification.checkboxState={checked,label:checkbox.label,};if(checked){this._setNotificationUIState(popupnotification,checkbox.checkedState);}else{this._setNotificationUIState(popupnotification,checkbox.uncheckedState);}}else{popupnotification.checkboxState=null;this._setNotificationUIState(popupnotification);}
this.panel.appendChild(popupnotification);
popupnotification.show();popupnotification.menupopup.textContent="";popupnotification.menupopup.append(...menuitems);},this);},_setNotificationUIState(notification,state={}){let mainAction=notification.notification.mainAction;if((mainAction&&mainAction.disabled)||state.disableMainAction||notification.hasAttribute("invalidselection")){notification.setAttribute("mainactiondisabled","true");}else{notification.removeAttribute("mainactiondisabled");}
if(state.warningLabel){notification.setAttribute("warninglabel",state.warningLabel);notification.removeAttribute("warninghidden");}else{notification.setAttribute("warninghidden","true");}},_showPanel:function PopupNotifications_showPanel(notificationsToShow,anchorElement){this.panel.hidden=false;notificationsToShow=notificationsToShow.filter(n=>{if(anchorElement!=n.anchorElement){return false;}
let dismiss=this._fireCallback(n,NOTIFICATION_EVENT_SHOWING);if(dismiss){n.dismissed=true;}
return!dismiss;});if(!notificationsToShow.length){return;}
let notificationIds=notificationsToShow.map(n=>n.id);this._refreshPanel(notificationsToShow);function isNullOrHidden(elem){if(!elem){return true;}
let anchorRect=elem.getBoundingClientRect();return anchorRect.width==0&&anchorRect.height==0;}
if(isNullOrHidden(anchorElement)){anchorElement=this.window.document.getElementById("identity-icon");if(isNullOrHidden(anchorElement)){anchorElement=this.window.document.getElementById("urlbar-search-button");}


if(isNullOrHidden(anchorElement)){anchorElement=this.tabbrowser.selectedTab;
if(isNullOrHidden(anchorElement)){anchorElement=null;}}}
if(this.isPanelOpen&&this._currentAnchorElement==anchorElement){notificationsToShow.forEach(function(n){this._fireCallback(n,NOTIFICATION_EVENT_SHOWN);},this);if(notificationsToShow.some(n=>n.options.persistent)){this.panel.setAttribute("noautohide","true");}else{this.panel.removeAttribute("noautohide");}


let event=new this.window.CustomEvent("PanelUpdated",{detail:notificationIds,});this.panel.dispatchEvent(event);return;}


this._hidePanel().then(()=>{this._currentAnchorElement=anchorElement;if(notificationsToShow.some(n=>n.options.persistent)){this.panel.setAttribute("noautohide","true");}else{this.panel.removeAttribute("noautohide");}
notificationsToShow.forEach(function(n){
n._recordTelemetryStat(TELEMETRY_STAT_OFFERED);n.timeShown=this.window.performance.now();},this);let target=this.panel;if(target.parentNode){



target=target.parentNode;}
if(this._popupshownListener){target.removeEventListener("popupshown",this._popupshownListener,true);}
this._popupshownListener=function(e){target.removeEventListener("popupshown",this._popupshownListener,true);this._popupshownListener=null;notificationsToShow.forEach(function(n){this._fireCallback(n,NOTIFICATION_EVENT_SHOWN);},this);
this.panel.dispatchEvent(new this.window.CustomEvent("Shown"));let event=new this.window.CustomEvent("PanelUpdated",{detail:notificationIds,});this.panel.dispatchEvent(event);};this._popupshownListener=this._popupshownListener.bind(this);target.addEventListener("popupshown",this._popupshownListener,true);this.panel.openPopup(anchorElement,"bottomcenter topleft",0,0);});},_update:function PopupNotifications_update(notifications,anchors=new Set(),dismissShowing=false){if(ChromeUtils.getClassName(anchors)=="XULElement"){anchors=new Set([anchors]);}
if(!notifications){notifications=this._currentNotifications;}
let haveNotifications=!!notifications.length;if(!anchors.size&&haveNotifications){anchors=this._getAnchorsForNotifications(notifications);}
let useIconBox=!!this.iconBox;if(useIconBox&&anchors.size){for(let anchor of anchors){if(anchor.parentNode==this.iconBox){continue;}
useIconBox=false;break;}}

let notificationsToShow=[];if(!this._suppress){notificationsToShow=notifications.filter(n=>(!n.dismissed||n.options.persistent)&&!n.options.neverShow);}
if(useIconBox){this._hideIcons();}
if(haveNotifications){notificationsToShow=notificationsToShow.filter(function(n){return anchors.has(n.anchorElement);});if(useIconBox){this._showIcons(notifications);this.iconBox.hidden=false;
anchors=this._getAnchorsForNotifications(notificationsToShow);}else if(anchors.size){this._updateAnchorIcons(notifications,anchors);}}
if(notificationsToShow.length){let anchorElement=anchors.values().next().value;if(anchorElement){this._showPanel(notificationsToShow,anchorElement);}

this.window.addEventListener("keypress",this._handleWindowKeyPress,true);}else{this._notify("updateNotShowing");

if(!dismissShowing){this._dismiss();}

if(!haveNotifications){if(useIconBox){this.iconBox.hidden=true;}else if(anchors.size){for(let anchorElement of anchors){anchorElement.removeAttribute(ICON_ATTRIBUTE_SHOWING);}}}
this.window.removeEventListener("keypress",this._handleWindowKeyPress,true);}},_updateAnchorIcons:function PopupNotifications_updateAnchorIcons(notifications,anchorElements){for(let anchorElement of anchorElements){anchorElement.setAttribute(ICON_ATTRIBUTE_SHOWING,"true");}},_showIcons:function PopupNotifications_showIcons(aCurrentNotifications){for(let notification of aCurrentNotifications){let anchorElm=notification.anchorElement;if(anchorElm){anchorElm.setAttribute(ICON_ATTRIBUTE_SHOWING,"true");if(notification.options.extraAttr){anchorElm.setAttribute("extraAttr",notification.options.extraAttr);}else{anchorElm.removeAttribute("extraAttr");}}}},_hideIcons:function PopupNotifications_hideIcons(){let icons=this.iconBox.querySelectorAll(ICON_SELECTOR);for(let icon of icons){icon.removeAttribute(ICON_ATTRIBUTE_SHOWING);}},_getNotificationsForBrowser:function PopupNotifications_getNotifications(browser){let notifications=popupNotificationsMap.get(browser);if(!notifications){notifications=[];popupNotificationsMap.set(browser,notifications);}
return notifications;},_setNotificationsForBrowser:function PopupNotifications_setNotifications(browser,notifications){popupNotificationsMap.set(browser,notifications);return notifications;},_getAnchorsForNotifications:function PopupNotifications_getAnchorsForNotifications(notifications,defaultAnchor){let anchors=new Set();for(let notification of notifications){if(notification.anchorElement){anchors.add(notification.anchorElement);}}
if(defaultAnchor&&!anchors.size){anchors.add(defaultAnchor);}
return anchors;},_isActiveBrowser(browser){











return this.tabbrowser.selectedBrowser.frameLoader==browser.frameLoader;},_onIconBoxCommand:function PopupNotifications_onIconBoxCommand(event){ let type=event.type;if(type=="click"&&event.button!=0){return;}
if(type=="keypress"&&!(event.charCode==event.DOM_VK_SPACE||event.keyCode==event.DOM_VK_RETURN)){return;}
if(!this._currentNotifications.length){return;}
event.stopPropagation(); let anchor=event.target;while(anchor&&anchor.parentNode!=this.iconBox){anchor=anchor.parentNode;}
if(!anchor){return;}
 
if(this.panel.state!="closed"&&anchor!=this._currentAnchorElement){this._dismissOrRemoveCurrentNotifications();}
if(this.panel.state=="closed"||anchor!=this._currentAnchorElement){this.panel.addEventListener("popupshown",()=>this.window.document.commandDispatcher.advanceFocusIntoSubtree(this.panel),{once:true});this._reshowNotifications(anchor);}else{this.window.document.commandDispatcher.advanceFocusIntoSubtree(this.panel);}},_reshowNotifications:function PopupNotifications_reshowNotifications(anchor,browser){ browser=browser||this.tabbrowser.selectedBrowser;let notifications=this._getNotificationsForBrowser(browser);notifications.forEach(function(n){if(n.anchorElement==anchor){n.dismissed=false;}});if(this._isActiveBrowser(browser)){this._update(notifications,anchor);}},_swapBrowserNotifications:function PopupNotifications_swapBrowserNoficications(ourBrowser,otherBrowser){
let ourNotifications=this._getNotificationsForBrowser(ourBrowser);let other=otherBrowser.ownerGlobal.PopupNotifications;if(!other){if(ourNotifications.length){Cu.reportError("unable to swap notifications: otherBrowser doesn't support notifications");}
return;}
let otherNotifications=other._getNotificationsForBrowser(otherBrowser);if(ourNotifications.length<1&&otherNotifications.length<1){return;}
otherNotifications=otherNotifications.filter(n=>{if(this._fireCallback(n,NOTIFICATION_EVENT_SWAPPING,ourBrowser)){n.browser=ourBrowser;n.owner=this;return true;}
other._fireCallback(n,NOTIFICATION_EVENT_REMOVED,this.nextRemovalReason);return false;});ourNotifications=ourNotifications.filter(n=>{if(this._fireCallback(n,NOTIFICATION_EVENT_SWAPPING,otherBrowser)){n.browser=otherBrowser;n.owner=other;return true;}
this._fireCallback(n,NOTIFICATION_EVENT_REMOVED,this.nextRemovalReason);return false;});this._setNotificationsForBrowser(otherBrowser,ourNotifications);other._setNotificationsForBrowser(ourBrowser,otherNotifications);if(otherNotifications.length){this._update(otherNotifications);}
if(ourNotifications.length){other._update(ourNotifications);}},_fireCallback:function PopupNotifications_fireCallback(n,event,...args){try{if(n.options.eventCallback){return n.options.eventCallback.call(n,event,...args);}}catch(error){Cu.reportError(error);}
return undefined;},_onPopupHidden:function PopupNotifications_onPopupHidden(event){if(event.target!=this.panel){return;}


this.panel.setAttribute("noautofocus","true");if(this._ignoreDismissal){this._ignoreDismissal.resolve();this._ignoreDismissal=null;return;}
this._dismissOrRemoveCurrentNotifications();this._clearPanel();this._update();},_dismissOrRemoveCurrentNotifications(){let browser=this.panel.firstElementChild&&this.panel.firstElementChild.notification.browser;if(!browser){return;}
let notifications=this._getNotificationsForBrowser(browser); for(let nEl of this.panel.children){let notificationObj=nEl.notification;if(!notifications.includes(notificationObj)){return;}

let timeSinceShown=this.window.performance.now()-notificationObj.timeShown;if(!notificationObj.wasDismissed&&!notificationObj.recordedTelemetryMainAction){notificationObj._recordTelemetry("POPUP_NOTIFICATION_DISMISSAL_MS",timeSinceShown);}

if(notificationObj.options.removeOnDismissal){notificationObj._recordTelemetryStat(this.nextRemovalReason);this._remove(notificationObj);}else{notificationObj.dismissed=true;this._fireCallback(notificationObj,NOTIFICATION_EVENT_DISMISSED);}}},_onCheckboxCommand(event){let notificationEl=getNotificationFromElement(event.originalTarget);let checked=notificationEl.checkbox.checked;let notification=notificationEl.notification;notification._checkboxChecked=checked;if(checked){this._setNotificationUIState(notificationEl,notification.options.checkbox.checkedState);}else{this._setNotificationUIState(notificationEl,notification.options.checkbox.uncheckedState);}
event.stopPropagation();},_onCommand(event){ if(event.originalTarget.localName=="button"){return;}
let notificationEl=getNotificationFromElement(event.target);let notification=notificationEl.notification;if(!notification.options.checkbox){this._setNotificationUIState(notificationEl);return;}
if(notificationEl.checkbox.checked){this._setNotificationUIState(notificationEl,notification.options.checkbox.checkedState);}else{this._setNotificationUIState(notificationEl,notification.options.checkbox.uncheckedState);}},_onButtonEvent(event,type,source="button",notificationEl=null){if(!notificationEl){notificationEl=getNotificationFromElement(event.originalTarget);}
if(!notificationEl){throw new Error("PopupNotifications._onButtonEvent: couldn't find notification element");}
if(!notificationEl.notification){throw new Error("PopupNotifications._onButtonEvent: couldn't find notification");}
let notification=notificationEl.notification;if(type=="dropmarkerpopupshown"){notification._recordTelemetryStat(TELEMETRY_STAT_OPEN_SUBMENU);return;}
if(type=="learnmoreclick"){notification._recordTelemetryStat(TELEMETRY_STAT_LEARN_MORE);return;}
if(type=="buttoncommand"){
let timeSinceCreated=this.window.performance.now()-notification.timeCreated;if(!notification.recordedTelemetryMainAction){notification.recordedTelemetryMainAction=true;notification._recordTelemetry("POPUP_NOTIFICATION_MAIN_ACTION_MS",timeSinceCreated);}}
if(type=="buttoncommand"||type=="secondarybuttoncommand"){if(Services.focus.activeWindow!=this.window){Services.console.logStringMessage("PopupNotifications._onButtonEvent: "+"Button click happened before the window was focused");this.window.focus();return;}
let timeSinceShown=this.window.performance.now()-notification.timeShown;if(timeSinceShown<this.buttonDelay){Services.console.logStringMessage("PopupNotifications._onButtonEvent: "+"Button click happened before the security delay: "+
timeSinceShown+"ms");return;}}
let action=notification.mainAction;let telemetryStatId=TELEMETRY_STAT_ACTION_1;if(type=="secondarybuttoncommand"){action=notification.secondaryActions[0];telemetryStatId=TELEMETRY_STAT_ACTION_2;}
notification._recordTelemetryStat(telemetryStatId);if(action){try{action.callback.call(undefined,{checkboxChecked:notificationEl.checkbox.checked,source,event,});}catch(error){Cu.reportError(error);}
if(action.dismiss){this._dismiss();return;}}
this._remove(notification);this._update();},_onMenuCommand:function PopupNotifications_onMenuCommand(event){let target=event.originalTarget;if(!target.action||!target.notification){throw new Error("menucommand target has no associated action/notification");}
let notificationEl=getNotificationFromElement(target);event.stopPropagation();target.notification._recordTelemetryStat(target.action.telemetryStatId);try{target.action.callback.call(undefined,{checkboxChecked:notificationEl.checkbox.checked,source:"menucommand",});}catch(error){Cu.reportError(error);}
if(target.action.dismiss){this._dismiss();return;}
this._remove(target.notification);this._update();},_notify:function PopupNotifications_notify(topic){Services.obs.notifyObservers(null,"PopupNotifications-"+topic);},};