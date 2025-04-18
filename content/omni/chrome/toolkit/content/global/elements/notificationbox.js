"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");MozElements.NotificationBox=class NotificationBox{constructor(insertElementFn){this._insertElementFn=insertElementFn;this._animating=false;this.currentNotification=null;}
get stack(){if(!this._stack){let stack=document.createXULElement("legacy-stack");stack._notificationBox=this;stack.className="notificationbox-stack";stack.appendChild(document.createXULElement("spacer"));stack.addEventListener("transitionend",event=>{if(event.target.localName=="notification"&&event.propertyName=="margin-top"){this._finishAnimation();}});this._insertElementFn(stack);this._stack=stack;}
return this._stack;}
get _allowAnimation(){return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;}
get allNotifications(){if(!this._stack){return[];}
var closedNotification=this._closedNotification;var notifications=this.stack.getElementsByTagName("notification");return Array.prototype.filter.call(notifications,n=>n!=closedNotification);}
getNotificationWithValue(aValue){var notifications=this.allNotifications;for(var n=notifications.length-1;n>=0;n--){if(aValue==notifications[n].getAttribute("value")){return notifications[n];}}
return null;}
appendNotification(aLabel,aValue,aImage,aPriority,aButtons,aEventCallback,aNotificationIs){if(aPriority<this.PRIORITY_INFO_LOW||aPriority>this.PRIORITY_CRITICAL_HIGH){throw new Error("Invalid notification priority "+aPriority);}

var notifications=this.allNotifications;var insertPos=null;for(var n=notifications.length-1;n>=0;n--){if(notifications[n].priority<aPriority){break;}
insertPos=notifications[n];}
var newitem=document.createXULElement("notification",aNotificationIs?{is:aNotificationIs}:{});this.stack.insertBefore(newitem,insertPos);if(newitem.messageText){if(aLabel&&typeof aLabel=="object"&&aLabel.nodeType&&aLabel.nodeType==aLabel.DOCUMENT_FRAGMENT_NODE){newitem.messageText.appendChild(aLabel);}else{newitem.messageText.textContent=aLabel;}}
newitem.setAttribute("value",aValue);if(aImage){newitem.messageImage.setAttribute("src",aImage);}
newitem.eventCallback=aEventCallback;if(aButtons){for(var b=0;b<aButtons.length;b++){var button=aButtons[b];var buttonElem=document.createXULElement("button",button.is?{is:button.is}:{});if(button["l10n-id"]){buttonElem.setAttribute("data-l10n-id",button["l10n-id"]);}else{buttonElem.setAttribute("label",button.label);if(typeof button.accessKey=="string"){buttonElem.setAttribute("accesskey",button.accessKey);}}
buttonElem.classList.add("notification-button");if(button.primary){buttonElem.classList.add("primary");}
newitem.messageDetails.appendChild(buttonElem);buttonElem.buttonInfo=button;}}
newitem.priority=aPriority;if(aPriority>=this.PRIORITY_CRITICAL_LOW){newitem.setAttribute("type","critical");}else if(aPriority<=this.PRIORITY_INFO_HIGH){newitem.setAttribute("type","info");}else{newitem.setAttribute("type","warning");}
if(!insertPos){newitem.style.display="block";newitem.style.position="fixed";newitem.style.top="100%";newitem.style.marginTop="-15px";newitem.style.opacity="0";this._showNotification(newitem,true);} 
var event=document.createEvent("Events");event.initEvent("AlertActive",true,true);newitem.dispatchEvent(event);return newitem;}
removeNotification(aItem,aSkipAnimation){if(!aItem.parentNode){return;}
if(aItem==this.currentNotification){this.removeCurrentNotification(aSkipAnimation);}else if(aItem!=this._closedNotification){this._removeNotificationElement(aItem);}}
_removeNotificationElement(aChild){if(aChild.eventCallback){aChild.eventCallback("removed");}
this.stack.removeChild(aChild);if(!Services.focus.getFocusedElementForWindow(window,false,{})){Services.focus.moveFocus(window,this.stack,Services.focus.MOVEFOCUS_FORWARD,0);}}
removeCurrentNotification(aSkipAnimation){this._showNotification(this.currentNotification,false,aSkipAnimation);}
removeAllNotifications(aImmediate){var notifications=this.allNotifications;for(var n=notifications.length-1;n>=0;n--){if(aImmediate){this._removeNotificationElement(notifications[n]);}else{this.removeNotification(notifications[n]);}}
this.currentNotification=null;




if(aImmediate||!this._allowAnimation){this._finishAnimation();}}
removeTransientNotifications(){var notifications=this.allNotifications;for(var n=notifications.length-1;n>=0;n--){var notification=notifications[n];if(notification.persistence){notification.persistence--;}else if(Date.now()>notification.timeout){this.removeNotification(notification,true);}}}
_showNotification(aNotification,aSlideIn,aSkipAnimation){this._finishAnimation();var height=aNotification.getBoundingClientRect().height;var skipAnimation=aSkipAnimation||height==0||!this._allowAnimation;aNotification.classList.toggle("animated",!skipAnimation);if(aSlideIn){this.currentNotification=aNotification;aNotification.style.removeProperty("display");aNotification.style.removeProperty("position");aNotification.style.removeProperty("top");aNotification.style.removeProperty("margin-top");aNotification.style.removeProperty("opacity");if(skipAnimation){return;}}else{this._closedNotification=aNotification;var notifications=this.allNotifications;var idx=notifications.length-1;this.currentNotification=idx>=0?notifications[idx]:null;if(skipAnimation){this._removeNotificationElement(this._closedNotification);delete this._closedNotification;return;}
aNotification.style.marginTop=-height+"px";aNotification.style.opacity=0;}
this._animating=true;}
_finishAnimation(){if(this._animating){this._animating=false;if(this._closedNotification){this._removeNotificationElement(this._closedNotification);delete this._closedNotification;}}}};Object.assign(MozElements.NotificationBox.prototype,{PRIORITY_INFO_LOW:1,PRIORITY_INFO_MEDIUM:2,PRIORITY_INFO_HIGH:3,PRIORITY_WARNING_LOW:4,PRIORITY_WARNING_MEDIUM:5,PRIORITY_WARNING_HIGH:6,PRIORITY_CRITICAL_LOW:7,PRIORITY_CRITICAL_MEDIUM:8,PRIORITY_CRITICAL_HIGH:9,});MozElements.Notification=class Notification extends MozXULElement{static get markup(){return`
      <hbox class="messageDetails" align="center" flex="1"
            oncommand="this.parentNode._doButtonCommand(event);">
        <image class="messageImage"/>
        <description class="messageText" flex="1"/>
        <spacer flex="1"/>
      </hbox>
      <toolbarbutton ondblclick="event.stopPropagation();"
                     class="messageCloseButton close-icon tabbable"
                     tooltiptext="&closeNotification.tooltip;"
                     oncommand="this.parentNode.dismiss();"/>
      `;}
static get entities(){return["chrome://global/locale/notification.dtd"];}
constructor(){super();this.persistence=0;this.priority=0;this.timeout=0;}
connectedCallback(){this.appendChild(this.constructor.fragment);for(let[propertyName,selector]of[["messageDetails",".messageDetails"],["messageImage",".messageImage"],["messageText",".messageText"],["spacer","spacer"],]){this[propertyName]=this.querySelector(selector);}}
get control(){return this.closest(".notificationbox-stack")._notificationBox;}
set label(value){this.messageText.textContent=value;}
dismiss(){if(this.eventCallback){this.eventCallback("dismissed");}
this.close();}
close(){if(!this.parentNode){return;}
this.control.removeNotification(this);}
_doButtonCommand(event){if(!("buttonInfo"in event.target)){return;}
var button=event.target.buttonInfo;if(button.popup){document.getElementById(button.popup).openPopup(event.originalTarget,"after_start",0,0,false,false,event);event.stopPropagation();}else{var callback=button.callback;if(callback){var result=callback(this,button,event.target,event);if(!result){this.close();}
event.stopPropagation();}}}};customElements.define("notification",MozElements.Notification);}