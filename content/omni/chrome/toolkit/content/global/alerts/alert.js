const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const NS_ALERT_HORIZONTAL=1;const NS_ALERT_LEFT=2;const NS_ALERT_TOP=4;const WINDOW_MARGIN=AppConstants.platform=="win"?0:10;const BODY_TEXT_LIMIT=200;const WINDOW_SHADOW_SPREAD=AppConstants.platform=="win"?10:0;var gOrigin=0;var gReplacedWindow=null;var gAlertListener=null;var gAlertTextClickable=false;var gAlertCookie="";var gIsActive=false;var gIsReplaced=false;var gRequireInteraction=false;function prefillAlertInfo(){








 
switch(window.arguments.length){default:case 13:{if(window.arguments[12]){let alertBox=document.getElementById("alertBox");alertBox.setAttribute("hasIcon",true);let icon=document.getElementById("alertIcon");icon.src=window.arguments[12];}} 
case 12:{if(window.arguments[11]){let alertBox=document.getElementById("alertBox");alertBox.setAttribute("hasOrigin",true);let hostPort=window.arguments[11];const ALERT_BUNDLE=Services.strings.createBundle("chrome://alerts/locale/alert.properties");const BRAND_BUNDLE=Services.strings.createBundle("chrome://branding/locale/brand.properties");const BRAND_NAME=BRAND_BUNDLE.GetStringFromName("brandShortName");let label=document.getElementById("alertSourceLabel");label.setAttribute("value",ALERT_BUNDLE.formatStringFromName("source.label",[hostPort]));let doNotDisturbMenuItem=document.getElementById("doNotDisturbMenuItem");doNotDisturbMenuItem.setAttribute("label",ALERT_BUNDLE.formatStringFromName("pauseNotifications.label",[BRAND_NAME,]));let disableForOrigin=document.getElementById("disableForOriginMenuItem");disableForOrigin.setAttribute("label",ALERT_BUNDLE.formatStringFromName("webActions.disableForOrigin.label",[hostPort]));let openSettings=document.getElementById("openSettingsMenuItem");openSettings.setAttribute("label",ALERT_BUNDLE.GetStringFromName("webActions.settings.label"));}} 
case 11:gAlertListener=window.arguments[10]; case 10:gReplacedWindow=window.arguments[9]; case 9:gRequireInteraction=window.arguments[8]; case 8:if(window.arguments[7]){document.getElementById("alertTitleLabel").setAttribute("lang",window.arguments[7]);document.getElementById("alertTextLabel").setAttribute("lang",window.arguments[7]);} 
case 7:if(window.arguments[6]){document.getElementById("alertNotification").style.direction=window.arguments[6];} 
case 6:gOrigin=window.arguments[5]; case 5:gAlertCookie=window.arguments[4]; case 4:gAlertTextClickable=window.arguments[3];if(gAlertTextClickable){document.getElementById("alertNotification").setAttribute("clickable",true);document.getElementById("alertTextLabel").setAttribute("clickable",true);} 
case 3:if(window.arguments[2]){document.getElementById("alertBox").setAttribute("hasBodyText",true);let bodyText=window.arguments[2];let bodyTextLabel=document.getElementById("alertTextLabel");if(bodyText.length>BODY_TEXT_LIMIT){bodyTextLabel.setAttribute("tooltiptext",bodyText);let ellipsis="\u2026";try{ellipsis=Services.prefs.getComplexValue("intl.ellipsis",Ci.nsIPrefLocalizedString).data;}catch(e){}
let truncLength=BODY_TEXT_LIMIT;let truncChar=bodyText[BODY_TEXT_LIMIT].charCodeAt(0);if(truncChar>=0xdc00&&truncChar<=0xdfff){truncLength++;}
bodyText=bodyText.substring(0,truncLength)+ellipsis;}
bodyTextLabel.textContent=bodyText;} 
case 2:document.getElementById("alertTitleLabel").setAttribute("value",window.arguments[1]); case 1:if(window.arguments[0]){document.getElementById("alertBox").setAttribute("hasImage",true);document.getElementById("alertImage").setAttribute("src",window.arguments[0]);} 
case 0:break;}}
function onAlertLoad(){const ALERT_DURATION_IMMEDIATE=20000;let alertTextBox=document.getElementById("alertTextBox");let alertImageBox=document.getElementById("alertImageBox");alertImageBox.style.minHeight=alertTextBox.scrollHeight+"px";sizeToContent();if(gReplacedWindow&&!gReplacedWindow.closed){moveWindowToReplace(gReplacedWindow);gReplacedWindow.gIsReplaced=true;gReplacedWindow.close();}else{moveWindowToEnd();}
window.addEventListener("XULAlertClose",function(){window.close();});if(!gRequireInteraction){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setTimeout(function(){window.close();},ALERT_DURATION_IMMEDIATE);}else{let alertBox=document.getElementById("alertBox");alertBox.addEventListener("animationend",function hideAlert(event){if(event.animationName=="alert-animation"||event.animationName=="alert-clicked-animation"||event.animationName=="alert-closing-animation"){alertBox.removeEventListener("animationend",hideAlert);window.close();}});alertBox.setAttribute("animate",true);}}
let alertSettings=document.getElementById("alertSettings");alertSettings.addEventListener("focus",onAlertSettingsFocus);alertSettings.addEventListener("click",onAlertSettingsClick);gIsActive=true;let ev=new CustomEvent("AlertActive",{bubbles:true,cancelable:true});document.documentElement.dispatchEvent(ev);if(gAlertListener){gAlertListener.observe(null,"alertshow",gAlertCookie);}}
function moveWindowToReplace(aReplacedAlert){let heightDelta=window.outerHeight-aReplacedAlert.outerHeight;if(heightDelta!=0){for(let alertWindow of Services.wm.getEnumerator("alert:alert")){if(!alertWindow.gIsActive){continue;}
let alertIsAfter=gOrigin&NS_ALERT_TOP?alertWindow.screenY>aReplacedAlert.screenY:aReplacedAlert.screenY>alertWindow.screenY;if(alertIsAfter){let adjustedY=gOrigin&NS_ALERT_TOP?alertWindow.screenY+heightDelta:alertWindow.screenY-heightDelta;alertWindow.moveTo(alertWindow.screenX,adjustedY);}}}
let adjustedY=gOrigin&NS_ALERT_TOP?aReplacedAlert.screenY:aReplacedAlert.screenY-heightDelta;window.moveTo(aReplacedAlert.screenX,adjustedY);}
function moveWindowToEnd(){ let x=gOrigin&NS_ALERT_LEFT?screen.availLeft:screen.availLeft+screen.availWidth-window.outerWidth;let y=gOrigin&NS_ALERT_TOP?screen.availTop:screen.availTop+screen.availHeight-window.outerHeight;for(let alertWindow of Services.wm.getEnumerator("alert:alert")){if(alertWindow!=window&&alertWindow.gIsActive){if(gOrigin&NS_ALERT_TOP){y=Math.max(y,alertWindow.screenY+alertWindow.outerHeight-WINDOW_SHADOW_SPREAD);}else{y=Math.min(y,alertWindow.screenY-window.outerHeight+WINDOW_SHADOW_SPREAD);}}} 
y+=gOrigin&NS_ALERT_TOP?WINDOW_MARGIN:-WINDOW_MARGIN;x+=gOrigin&NS_ALERT_LEFT?WINDOW_MARGIN:-WINDOW_MARGIN;window.moveTo(x,y);}
function onAlertBeforeUnload(){if(!gIsReplaced){let heightDelta=window.outerHeight+WINDOW_MARGIN-WINDOW_SHADOW_SPREAD;for(let alertWindow of Services.wm.getEnumerator("alert:alert")){if(alertWindow!=window&&alertWindow.gIsActive){if(gOrigin&NS_ALERT_TOP){if(alertWindow.screenY>window.screenY){alertWindow.moveTo(alertWindow.screenX,alertWindow.screenY-heightDelta);}}else if(window.screenY>alertWindow.screenY){alertWindow.moveTo(alertWindow.screenX,alertWindow.screenY+heightDelta);}}}}
if(gAlertListener){gAlertListener.observe(null,"alertfinished",gAlertCookie);}}
function onAlertClick(){if(gAlertListener&&gAlertTextClickable){gAlertListener.observe(null,"alertclickcallback",gAlertCookie);}
let alertBox=document.getElementById("alertBox");if(alertBox.getAttribute("animate")=="true"){alertBox.setAttribute("clicked","true");}else{window.close();}}
function doNotDisturb(){const alertService=Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService).QueryInterface(Ci.nsIAlertsDoNotDisturb);alertService.manualDoNotDisturb=true;onAlertClose();}
function disableForOrigin(){gAlertListener.observe(null,"alertdisablecallback",gAlertCookie);onAlertClose();}
function onAlertSettingsFocus(event){event.target.removeAttribute("focusedViaMouse");}
function onAlertSettingsClick(event){

event.target.setAttribute("focusedViaMouse",true);event.stopPropagation();}
function openSettings(){gAlertListener.observe(null,"alertsettingscallback",gAlertCookie);onAlertClose();}
function onAlertClose(){let alertBox=document.getElementById("alertBox");if(alertBox.getAttribute("animate")=="true"){alertBox.setAttribute("closing","true");}else{window.close();}}