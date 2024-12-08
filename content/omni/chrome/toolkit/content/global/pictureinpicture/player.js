const{PictureInPicture}=ChromeUtils.import("resource://gre/modules/PictureInPicture.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{DeferredTask}=ChromeUtils.import("resource://gre/modules/DeferredTask.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const AUDIO_TOGGLE_ENABLED_PREF="media.videocontrols.picture-in-picture.audio-toggle.enabled";const KEYBOARD_CONTROLS_ENABLED_PREF="media.videocontrols.picture-in-picture.keyboard-controls.enabled";const CONTROLS_FADE_TIMEOUT_MS=3000;const RESIZE_DEBOUNCE_RATE_MS=500;function setupPlayer(id,wgp,videoRef){Player.init(id,wgp,videoRef);}
function setIsPlayingState(isPlaying){Player.isPlaying=isPlaying;}
function setIsMutedState(isMuted){Player.isMuted=isMuted;}
let Player={WINDOW_EVENTS:["click","contextmenu","dblclick","keydown","mouseout","MozDOMFullscreen:Entered","MozDOMFullscreen:Exited","resize","unload",],actor:null,resizeDebouncer:null,lastScreenX:-1,lastScreenY:-1,id:-1,showingTimeout:null,init(id,wgp,videoRef){this.id=id;let holder=document.querySelector(".player-holder");let browser=document.getElementById("browser");browser.remove();browser.setAttribute("nodefaultsrc","true");


browser.setAttribute("remoteType",wgp.domProcess.remoteType);browser.setAttribute("initialBrowsingContextGroupId",wgp.browsingContext.group.id);holder.appendChild(browser);this.actor=browser.browsingContext.currentWindowGlobal.getActor("PictureInPicture");this.actor.sendAsyncMessage("PictureInPicture:SetupPlayer",{videoRef,});PictureInPicture.weakPipToWin.set(this.actor,window);for(let eventType of this.WINDOW_EVENTS){addEventListener(eventType,this);}

browser.addEventListener("oop-browser-crashed",this);this.revealControls(false);if(Services.prefs.getBoolPref(AUDIO_TOGGLE_ENABLED_PREF,false)){const audioButton=document.getElementById("audio");audioButton.hidden=false;audioButton.previousElementSibling.hidden=false;}
Services.telemetry.setEventRecordingEnabled("pictureinpicture",true);this.resizeDebouncer=new DeferredTask(()=>{this.recordEvent("resize",{width:window.outerWidth.toString(),height:window.outerHeight.toString(),});},RESIZE_DEBOUNCE_RATE_MS);this.lastScreenX=window.screenX;this.lastScreenY=window.screenY;this.recordEvent("create",{width:window.outerWidth.toString(),height:window.outerHeight.toString(),screenX:window.screenX.toString(),screenY:window.screenY.toString(),});this.computeAndSetMinimumSize(window.outerWidth,window.outerHeight);

window.requestAnimationFrame(()=>{window.focus();});},uninit(){this.resizeDebouncer.disarm();PictureInPicture.unload(window,this.actor);},handleEvent(event){switch(event.type){case"click":{this.onClick(event);this.controls.removeAttribute("keying");break;}
case"contextmenu":{event.preventDefault();break;}
case"dblclick":{this.onDblClick(event);break;}
case"keydown":{if(event.keyCode==KeyEvent.DOM_VK_TAB){this.controls.setAttribute("keying",true);}else if(event.keyCode==KeyEvent.DOM_VK_ESCAPE&&this.controls.hasAttribute("keying")){this.controls.removeAttribute("keying");
event.preventDefault();}else if(Services.prefs.getBoolPref(KEYBOARD_CONTROLS_ENABLED_PREF,false)&&(event.keyCode!=KeyEvent.DOM_VK_SPACE||!event.target.id)){

this.onKeyDown(event);}
break;}
case"mouseout":{this.onMouseOut(event);break;}




case"MozDOMFullscreen:Entered": case"MozDOMFullscreen:Exited":{let{lastTransactionId}=window.windowUtils;window.addEventListener("MozAfterPaint",function onPainted(event){if(event.transactionId>lastTransactionId){window.removeEventListener("MozAfterPaint",onPainted);Services.obs.notifyObservers(window,"fullscreen-painted");}});break;}
case"oop-browser-crashed":{this.closePipWindow({reason:"browser-crash"});break;}
case"resize":{this.onResize(event);break;}
case"unload":{this.uninit();break;}}},closePipWindow(closeData){const{reason}=closeData;if(PictureInPicture.isMultiPipEnabled){PictureInPicture.closeSinglePipWindow({reason,actorRef:this.actor});}else{PictureInPicture.closeAllPipWindows({reason});}},onDblClick(event){if(event.target.id=="controls"){if(document.fullscreenElement==document.body){document.exitFullscreen();}else{document.body.requestFullscreen();}
event.preventDefault();}},onClick(event){switch(event.target.id){case"audio":{if(this.isMuted){this.actor.sendAsyncMessage("PictureInPicture:Unmute");}else{this.actor.sendAsyncMessage("PictureInPicture:Mute");}
break;}
case"close":{this.actor.sendAsyncMessage("PictureInPicture:Pause",{reason:"pip-closed",});this.closePipWindow({reason:"close-button"});break;}
case"playpause":{if(!this.isPlaying){this.actor.sendAsyncMessage("PictureInPicture:Play");this.revealControls(false);}else{this.actor.sendAsyncMessage("PictureInPicture:Pause");this.revealControls(true);}
break;}
case"unpip":{PictureInPicture.focusTabAndClosePip(window,this.actor);break;}}},onKeyDown(event){this.actor.sendAsyncMessage("PictureInPicture:KeyDown",{altKey:event.altKey,shiftKey:event.shiftKey,metaKey:event.metaKey,ctrlKey:event.ctrlKey,keyCode:event.keyCode,});},onMouseOut(event){if(window.screenX!=this.lastScreenX||window.screenY!=this.lastScreenY){this.recordEvent("move",{screenX:window.screenX.toString(),screenY:window.screenY.toString(),});}
this.lastScreenX=window.screenX;this.lastScreenY=window.screenY;},onResize(event){this.resizeDebouncer.disarm();this.resizeDebouncer.arm();},onCommand(event){this.closePipWindow({reason:"player-shortcut"});},get controls(){delete this.controls;return(this.controls=document.getElementById("controls"));},_isPlaying:false,get isPlaying(){return this._isPlaying;},set isPlaying(isPlaying){this._isPlaying=isPlaying;this.controls.classList.toggle("playing",isPlaying);const playButton=document.getElementById("playpause");let strId="pictureinpicture-"+(isPlaying?"pause":"play");document.l10n.setAttributes(playButton,strId);},_isMuted:false,get isMuted(){return this._isMuted;},set isMuted(isMuted){this._isMuted=isMuted;this.controls.classList.toggle("muted",isMuted);const audioButton=document.getElementById("audio");let strId="pictureinpicture-"+(isMuted?"unmute":"mute");document.l10n.setAttributes(audioButton,strId);},recordEvent(type,args){Services.telemetry.recordEvent("pictureinpicture",type,"player",this.id,args);},revealControls(revealIndefinitely){clearTimeout(this.showingTimeout);this.showingTimeout=null;this.controls.setAttribute("showing",true);if(!revealIndefinitely){this.showingTimeout=setTimeout(()=>{this.controls.removeAttribute("showing");},CONTROLS_FADE_TIMEOUT_MS);}},computeAndSetMinimumSize(width,height){if(!AppConstants.MOZ_WIDGET_GTK){return;}

const MIN_WIDTH=120;const MIN_HEIGHT=80;let resultWidth=width;let resultHeight=height;let aspectRatio=width/height;
if(width<height){resultWidth=MIN_WIDTH;resultHeight=Math.round(MIN_WIDTH/aspectRatio);}else{resultHeight=MIN_HEIGHT;resultWidth=Math.round(MIN_HEIGHT*aspectRatio);}
document.documentElement.style.minWidth=resultWidth+"px";document.documentElement.style.minHeight=resultHeight+"px";},};