//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["PictureInPicture","PictureInPictureParent","PictureInPictureToggleParent","PictureInPictureLauncherParent",];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const PLAYER_URI="chrome://global/content/pictureinpicture/player.xhtml";var PLAYER_FEATURES="chrome,titlebar=yes,alwaysontop,lockaspectratio,resizable";if(!AppConstants.MOZ_WIDGET_GTK){PLAYER_FEATURES+=",dialog";}
const WINDOW_TYPE="Toolkit:PictureInPicture";const PIP_ENABLED_PREF="media.videocontrols.picture-in-picture.enabled";const MULTI_PIP_ENABLED_PREF="media.videocontrols.picture-in-picture.allow-multiple";const TOGGLE_ENABLED_PREF="media.videocontrols.picture-in-picture.video-toggle.enabled";let gCloseReasons=new WeakMap();let gNextWindowID=0;class PictureInPictureLauncherParent extends JSWindowActorParent{receiveMessage(aMessage){switch(aMessage.name){case"PictureInPicture:Request":{let videoData=aMessage.data;PictureInPicture.handlePictureInPictureRequest(this.manager,videoData);break;}}}}
class PictureInPictureToggleParent extends JSWindowActorParent{receiveMessage(aMessage){let browsingContext=aMessage.target.browsingContext;let browser=browsingContext.top.embedderElement;switch(aMessage.name){case"PictureInPicture:OpenToggleContextMenu":{let win=browser.ownerGlobal;PictureInPicture.openToggleContextMenu(win,aMessage.data);break;}}}}
class PictureInPictureParent extends JSWindowActorParent{receiveMessage(aMessage){switch(aMessage.name){case"PictureInPicture:Resize":{let videoData=aMessage.data;PictureInPicture.resizePictureInPictureWindow(videoData,this);break;}
case"PictureInPicture:Close":{let reason=aMessage.data.reason;if(PictureInPicture.isMultiPipEnabled){PictureInPicture.closeSinglePipWindow({reason,actorRef:this});}else{PictureInPicture.closeAllPipWindows({reason});}
break;}
case"PictureInPicture:Playing":{let player=PictureInPicture.getWeakPipPlayer(this);if(player){player.setIsPlayingState(true);}
break;}
case"PictureInPicture:Paused":{let player=PictureInPicture.getWeakPipPlayer(this);if(player){player.setIsPlayingState(false);}
break;}
case"PictureInPicture:Muting":{let player=PictureInPicture.getWeakPipPlayer(this);if(player){player.setIsMutedState(true);}
break;}
case"PictureInPicture:Unmuting":{let player=PictureInPicture.getWeakPipPlayer(this);if(player){player.setIsMutedState(false);}
break;}}}}
var PictureInPicture={ weakPipToWin:new WeakMap(), weakWinToBrowser:new WeakMap(),getWeakPipPlayer(pipActorRef){let playerWin=this.weakPipToWin.get(pipActorRef);if(!playerWin||playerWin.closed){return null;}
return playerWin;},onCommand(event){if(!Services.prefs.getBoolPref(PIP_ENABLED_PREF,false)){return;}
let win=event.target.ownerGlobal;let browser=win.gBrowser.selectedBrowser;let actor=browser.browsingContext.currentWindowGlobal.getActor("PictureInPictureLauncher");actor.sendAsyncMessage("PictureInPicture:KeyToggle");},async focusTabAndClosePip(window,pipActor){let browser=this.weakWinToBrowser.get(window);if(!browser){return;}
let gBrowser=browser.ownerGlobal.gBrowser;let tab=gBrowser.getTabForBrowser(browser);gBrowser.selectedTab=tab;await this.closeSinglePipWindow({reason:"unpip",actorRef:pipActor});},clearPipTabIcon(window){const browser=this.weakWinToBrowser.get(window);if(!browser){return;} 
for(let win of Services.wm.getEnumerator(WINDOW_TYPE)){if(win!==window&&this.weakWinToBrowser.has(win)&&this.weakWinToBrowser.get(win)===browser){return;}}
let gBrowser=browser.ownerGlobal.gBrowser;let tab=gBrowser.getTabForBrowser(browser);if(tab){tab.removeAttribute("pictureinpicture");}},async closePipWindow(pipWin){if(pipWin.closed){return;}
let closedPromise=new Promise(resolve=>{pipWin.addEventListener("unload",resolve,{once:true});});pipWin.close();await closedPromise;},async closeSinglePipWindow(closeData){const{reason,actorRef}=closeData;const win=this.getWeakPipPlayer(actorRef);if(!win){return;}
await this.closePipWindow(win);gCloseReasons.set(win,reason);},async closeAllPipWindows(closeData){const{reason}=closeData;
for(let win of Services.wm.getEnumerator(WINDOW_TYPE)){if(win.closed){continue;}
let closedPromise=new Promise(resolve=>{win.addEventListener("unload",resolve,{once:true});});gCloseReasons.set(win,reason);win.close();await closedPromise;}},async handlePictureInPictureRequest(wgp,videoData){if(!this.isMultiPipEnabled){
 await this.closeAllPipWindows({reason:"new-pip"});}
let browser=wgp.browsingContext.top.embedderElement;let parentWin=browser.ownerGlobal;let actorRef=browser.browsingContext.currentWindowGlobal.getActor("PictureInPicture");let win=await this.openPipWindow(parentWin,videoData,actorRef);win.setIsPlayingState(videoData.playing);win.setIsMutedState(videoData.isMuted); let tab=parentWin.gBrowser.getTabForBrowser(browser);tab.setAttribute("pictureinpicture",true);win.setupPlayer(gNextWindowID.toString(),wgp,videoData.videoRef);gNextWindowID++;this.weakWinToBrowser.set(win,browser);Services.prefs.setBoolPref("media.videocontrols.picture-in-picture.video-toggle.has-used",true);},unload(window){TelemetryStopwatch.finish("FX_PICTURE_IN_PICTURE_WINDOW_OPEN_DURATION",window);let reason=gCloseReasons.get(window)||"other";Services.telemetry.keyedScalarAdd("pictureinpicture.closed_method",reason,1); this.savePosition(window);this.clearPipTabIcon(window);},async openPipWindow(parentWin,videoData,actorReference){let{top,left,width,height}=this.fitToScreen(parentWin,videoData,actorReference);let features=`${PLAYER_FEATURES},top=${top},left=${left},`+`outerWidth=${width},outerHeight=${height}`;let pipWindow=Services.ww.openWindow(parentWin,PLAYER_URI,null,features,null);TelemetryStopwatch.start("FX_PICTURE_IN_PICTURE_WINDOW_OPEN_DURATION",pipWindow,{inSeconds:true,});return new Promise(resolve=>{pipWindow.addEventListener("load",()=>{resolve(pipWindow);},{once:true});});},fitToScreen(windowOrPlayer,videoData,actorReference){let{videoHeight,videoWidth}=videoData; let isPlayerWindow=windowOrPlayer==this.getWeakPipPlayer(actorReference);if(isPlayerWindow){this.savePosition(windowOrPlayer);} 
let{top,left,width,height}=this.loadPosition(); if(!isNaN(top)&&!isNaN(left)&&!isNaN(width)&&!isNaN(height)){ let centerX=left+width/2;let centerY=top+height/2;

let PiPScreen=this.getWorkingScreen(centerX,centerY); let[PiPScreenLeft,PiPScreenTop,PiPScreenWidth,PiPScreenHeight,]=this.getAvailScreenSize(PiPScreen);
 if(PiPScreenLeft<=centerX&&centerX<=PiPScreenLeft+PiPScreenWidth&&PiPScreenTop<=centerY&&centerY<=PiPScreenTop+PiPScreenHeight){let oldWidth=width;
 width=Math.round((height*videoWidth)/videoHeight); if(AppConstants.platform=="win"){width=136>width?136:width;}
 
const WIGGLE_ROOM=5;

 let rightScreen=PiPScreenLeft+PiPScreenWidth;let distFromRight=rightScreen-(left+width);if(0<distFromRight&&distFromRight<=WIGGLE_ROOM+(oldWidth-width)){left+=distFromRight;}
 
if(left<PiPScreenLeft){
 left+=PiPScreenLeft-left;}
if(top<PiPScreenTop){
 top+=PiPScreenTop-top;}
if(left+width>PiPScreenLeft+PiPScreenWidth){
 left+=PiPScreenLeft+PiPScreenWidth-left-width;}
if(top+height>PiPScreenTop+PiPScreenHeight){
 top+=PiPScreenTop+PiPScreenHeight-top-height;}
return{top,left,width,height};}}

let screen=this.getWorkingScreen(windowOrPlayer.screenX,windowOrPlayer.screenY,windowOrPlayer.innerWidth,windowOrPlayer.innerHeight);let[screenLeft,screenTop,screenWidth,screenHeight,]=this.getAvailScreenSize(screen);
const MAX_HEIGHT=screenHeight/4;const MAX_WIDTH=screenWidth/3;width=videoWidth;height=videoHeight;let aspectRatio=videoWidth/videoHeight;if(videoHeight>MAX_HEIGHT||videoWidth>MAX_WIDTH){if(videoWidth>=videoHeight){

width=MAX_WIDTH;height=Math.round(MAX_WIDTH/aspectRatio);}else{

height=MAX_HEIGHT;width=Math.round(MAX_HEIGHT*aspectRatio);}}









let isRTL=Services.locale.isAppLocaleRTL;left=isRTL?screenLeft:screenLeft+screenWidth-width;top=screenTop+screenHeight-height;return{top,left,width,height};},resizePictureInPictureWindow(videoData,actorRef){let win=this.getWeakPipPlayer(actorRef);if(!win){return;}
let{top,left,width,height}=this.fitToScreen(win,videoData,actorRef);win.resizeTo(width,height);win.moveTo(left,top);},openToggleContextMenu(window,data){let document=window.document;let popup=document.getElementById("pictureInPictureToggleContextMenu");
let newEvent=document.createEvent("MouseEvent");newEvent.initNSMouseEvent("contextmenu",true,true,null,0,data.screenX,data.screenY,0,0,false,false,false,false,0,null,0,data.mozInputSource);popup.openPopupAtScreen(newEvent.screenX,newEvent.screenY,true,newEvent);},hideToggle(){Services.prefs.setBoolPref(TOGGLE_ENABLED_PREF,false);},getAvailScreenSize(screen){let screenLeft={},screenTop={},screenWidth={},screenHeight={};screen.GetAvailRectDisplayPix(screenLeft,screenTop,screenWidth,screenHeight);let fullLeft={},fullTop={},fullWidth={},fullHeight={};screen.GetRectDisplayPix(fullLeft,fullTop,fullWidth,fullHeight);

let scaleFactor=screen.contentsScaleFactor/screen.defaultCSSScaleFactor;screenWidth.value*=scaleFactor;screenHeight.value*=scaleFactor;screenLeft.value=(screenLeft.value-fullLeft.value)*scaleFactor+fullLeft.value;screenTop.value=(screenTop.value-fullTop.value)*scaleFactor+fullTop.value;return[screenLeft.value,screenTop.value,screenWidth.value,screenHeight.value,];},getWorkingScreen(left,top,width=1,height=1){ let screenManager=Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);

 let screen=screenManager.screenForRect(left,top,width,height);return screen;},savePosition(win){let xulStore=Services.xulStore;let left=win.screenX;let top=win.screenY;let width=win.innerWidth;let height=win.innerHeight;xulStore.setValue(PLAYER_URI,"picture-in-picture","left",left);xulStore.setValue(PLAYER_URI,"picture-in-picture","top",top);xulStore.setValue(PLAYER_URI,"picture-in-picture","width",width);xulStore.setValue(PLAYER_URI,"picture-in-picture","height",height);},loadPosition(){let xulStore=Services.xulStore;let left=parseInt(xulStore.getValue(PLAYER_URI,"picture-in-picture","left"));let top=parseInt(xulStore.getValue(PLAYER_URI,"picture-in-picture","top"));let width=parseInt(xulStore.getValue(PLAYER_URI,"picture-in-picture","width"));let height=parseInt(xulStore.getValue(PLAYER_URI,"picture-in-picture","height"));return{top,left,width,height};},};XPCOMUtils.defineLazyPreferenceGetter(PictureInPicture,"isMultiPipEnabled",MULTI_PIP_ENABLED_PREF,false);