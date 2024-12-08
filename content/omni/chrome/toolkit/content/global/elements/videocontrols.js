"use strict";
const CONTROL_PANEL_HEIGHT=138;this.VideoControlsWidget=class{constructor(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.prefs=prefs;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;this.isMobile=this.window.navigator.appVersion.includes("Android");}
onsetup(){this.switchImpl();}
onchange(){this.switchImpl();}
switchImpl(){let newImpl;let pageURI=this.document.documentURI;if(this.element.controls){newImpl=VideoControlsImplWidget;}else if(this.isMobile){newImpl=NoControlsMobileImplWidget;}else if(VideoControlsWidget.isPictureInPictureVideo(this.element)){newImpl=NoControlsPictureInPictureImplWidget;}else if(pageURI.startsWith("http://")||pageURI.startsWith("https://")){newImpl=NoControlsDesktopImplWidget;}



if(this.impl&&this.impl.constructor==newImpl&&this.impl.elementStateMatches(this.element)){return;}
if(this.impl){this.impl.destructor();this.shadowRoot.firstChild.remove();}
if(newImpl){this.impl=new newImpl(this.shadowRoot,this.prefs);this.impl.onsetup();}else{this.impl=undefined;}}
destructor(){if(!this.impl){return;}
this.impl.destructor();this.shadowRoot.firstChild.remove();delete this.impl;}
onPrefChange(prefName,prefValue){this.prefs[prefName]=prefValue;if(!this.impl){return;}
this.impl.onPrefChange(prefName,prefValue);}
static isPictureInPictureVideo(someVideo){return someVideo.isCloningElementVisually;}
static shouldShowPictureInPictureToggle(prefs,someVideo,reflowedDimensions){if(prefs["media.videocontrols.picture-in-picture.video-toggle.always-show"]){return true;}
const MIN_VIDEO_LENGTH=prefs["media.videocontrols.picture-in-picture.video-toggle.min-video-secs"];if(someVideo.duration<MIN_VIDEO_LENGTH){return false;}
const MIN_VIDEO_DIMENSION=140; if(reflowedDimensions.videoWidth<MIN_VIDEO_DIMENSION||reflowedDimensions.videoHeight<MIN_VIDEO_DIMENSION){return false;}
if(!someVideo.mozHasAudio){return false;}
return true;}
static setupToggle(prefs,toggle,reflowedDimensions){ const SMALL_VIDEO_WIDTH_MAX=320;const MEDIUM_VIDEO_WIDTH_MAX=720;let isSmall=reflowedDimensions.videoWidth<=SMALL_VIDEO_WIDTH_MAX;toggle.toggleAttribute("small-video",isSmall);toggle.toggleAttribute("medium-video",!isSmall&&reflowedDimensions.videoWidth<=MEDIUM_VIDEO_WIDTH_MAX);toggle.setAttribute("position",prefs["media.videocontrols.picture-in-picture.video-toggle.position"]);toggle.toggleAttribute("has-used",prefs["media.videocontrols.picture-in-picture.video-toggle.has-used"]);}};this.VideoControlsImplWidget=class{constructor(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.prefs=prefs;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;}
onsetup(){this.generateContent();this.Utils={debug:false,video:null,videocontrols:null,controlBar:null,playButton:null,muteButton:null,volumeControl:null,durationLabel:null,positionLabel:null,scrubber:null,progressBar:null,bufferBar:null,statusOverlay:null,controlsSpacer:null,clickToPlay:null,controlsOverlay:null,fullscreenButton:null,layoutControls:null,isShowingPictureInPictureMessage:false,textTracksCount:0,videoEvents:["play","pause","ended","volumechange","loadeddata","loadstart","timeupdate","progress","playing","waiting","canplay","canplaythrough","seeking","seeked","emptied","loadedmetadata","error","suspend","stalled","mozvideoonlyseekbegin","mozvideoonlyseekcompleted","durationchange",],showHours:false,firstFrameShown:false,timeUpdateCount:0,maxCurrentTimeSeen:0,isPausedByDragging:false,_isAudioOnly:false,get isAudioOnly(){return this._isAudioOnly;},set isAudioOnly(val){this._isAudioOnly=val;this.setFullscreenButtonState();this.updatePictureInPictureToggleDisplay();if(!this.isTopLevelSyntheticDocument){return;}
if(this._isAudioOnly){this.video.style.height=`${CONTROL_PANEL_HEIGHT}px`;this.video.style.width="100%";}else{this.video.style.removeProperty("height");this.video.style.removeProperty("width");}},suppressError:false,setupStatusFader(immediate){

if(!this.clickToPlay.hidden){this.startFadeOut(this.statusOverlay,true);return;}
var show=false;if(this.video.seeking||(this.video.error&&!this.suppressError)||this.video.networkState==this.video.NETWORK_NO_SOURCE||(this.video.networkState==this.video.NETWORK_LOADING&&(this.video.paused||this.video.ended?this.video.readyState<this.video.HAVE_CURRENT_DATA:this.video.readyState<this.video.HAVE_FUTURE_DATA))||(this.timeUpdateCount<=1&&!this.video.ended&&this.video.readyState<this.video.HAVE_FUTURE_DATA&&this.video.networkState==this.video.NETWORK_LOADING)){show=true;}

if(this.isAudioOnly){show=false;}
if(this._showThrobberTimer){show=true;}
this.log("Status overlay: seeking="+
this.video.seeking+" error="+
this.video.error+" readyState="+
this.video.readyState+" paused="+
this.video.paused+" ended="+
this.video.ended+" networkState="+
this.video.networkState+" timeUpdateCount="+
this.timeUpdateCount+" _showThrobberTimer="+
this._showThrobberTimer+" --> "+
(show?"SHOW":"HIDE"));this.startFade(this.statusOverlay,show,immediate);},setupInitialState(){this.setPlayButtonState(this.video.paused);this.setFullscreenButtonState();var duration=Math.round(this.video.duration*1000); var currentTime=Math.round(this.video.currentTime*1000); this.log("Initial playback position is at "+currentTime+" of "+duration);
this.initPositionDurationBox();this.maxCurrentTimeSeen=currentTime;this.showPosition(currentTime,duration);
if(this.video.readyState>=this.video.HAVE_METADATA){if(this.video.localName=="video"&&(this.video.videoWidth==0||this.video.videoHeight==0)){this.isAudioOnly=true;}
if(!this.isAudioOnly&&!this.video.mozHasAudio){this.muteButton.setAttribute("noAudio","true");this.muteButton.disabled=true;}}

this.updateOrientationState(this.isVideoInFullScreen);

if(this.document.fullscreenElement){this.videocontrols.setAttribute("inDOMFullscreen",true);}
if(this.isAudioOnly){this.startFadeOut(this.clickToPlay,true);}
if(this.video.readyState>=this.video.HAVE_CURRENT_DATA){this.firstFrameShown=true;}


this.bufferBar.max=100;if(this.video.readyState>=this.video.HAVE_METADATA){this.showBuffered();}else{this.bufferBar.value=0;}
if(this.hasError()){this.startFadeOut(this.clickToPlay,true);this.statusIcon.setAttribute("type","error");this.updateErrorText();this.setupStatusFader(true);}else if(VideoControlsWidget.isPictureInPictureVideo(this.video)){this.setShowPictureInPictureMessage(true);}
if(this.video.readyState>=this.video.HAVE_METADATA){

 this.updatePictureInPictureToggleDisplay();}
let adjustableControls=[...this.prioritizedControls,this.controlBar,this.clickToPlay,];let throwOnGet={get(){throw new Error("Please don't trigger reflow. See bug 1493525.");},};for(let control of adjustableControls){if(!control){break;}
Object.defineProperties(control,{
minWidth:{get:()=>{let controlId=control.id;let propertyName=`--${controlId}-width`;if(control.modifier){propertyName+="-"+control.modifier;}
let preDefinedSize=this.controlBarComputedStyles.getPropertyValue(propertyName);

if(!preDefinedSize){return 0;}
return parseInt(preDefinedSize,10);},},offsetLeft:throwOnGet,offsetTop:throwOnGet,offsetWidth:throwOnGet,offsetHeight:throwOnGet,offsetParent:throwOnGet,clientLeft:throwOnGet,clientTop:throwOnGet,clientWidth:throwOnGet,clientHeight:throwOnGet,getClientRects:throwOnGet,getBoundingClientRect:throwOnGet,isAdjustableControl:{value:true,},modifier:{value:"",writable:true,},isWanted:{value:true,writable:true,},hidden:{set:v=>{control._isHiddenExplicitly=v;control._updateHiddenAttribute();},get:()=>{return(control.hasAttribute("hidden")||control.classList.contains("fadeout"));},},hiddenByAdjustment:{set:v=>{control._isHiddenByAdjustment=v;control._updateHiddenAttribute();},get:()=>control._isHiddenByAdjustment,},_isHiddenByAdjustment:{value:false,writable:true,},_isHiddenExplicitly:{value:false,writable:true,},_updateHiddenAttribute:{value:()=>{if(control._isHiddenExplicitly||control._isHiddenByAdjustment){control.setAttribute("hidden","");}else{control.removeAttribute("hidden");}},},});}
this.adjustControlSize();

this.updateVolumeControls();},updatePictureInPictureToggleDisplay(){if(this.isAudioOnly){this.pictureInPictureToggle.setAttribute("hidden",true);return;}
if(this.pipToggleEnabled&&!this.isShowingPictureInPictureMessage&&VideoControlsWidget.shouldShowPictureInPictureToggle(this.prefs,this.video,this.reflowedDimensions)){this.pictureInPictureToggle.removeAttribute("hidden");VideoControlsWidget.setupToggle(this.prefs,this.pictureInPictureToggle,this.reflowedDimensions);}else{this.pictureInPictureToggle.setAttribute("hidden",true);}},setupNewLoadState(){
var shouldShow=!this.dynamicControls||(this.video.paused&&!this.video.autoplay);let shouldClickToPlayShow=shouldShow&&!this.isAudioOnly&&this.video.currentTime==0&&!this.hasError()&&!this.isShowingPictureInPictureMessage;this.startFade(this.clickToPlay,shouldClickToPlayShow,true);this.startFade(this.controlBar,shouldShow,true);},get dynamicControls(){var enabled=!this.isAudioOnly;if(this.video.hasAttribute("mozNoDynamicControls")){enabled=false;}

if(!this.firstFrameShown&&this.hasError()){enabled=false;}
return enabled;},updateVolume(){const volume=this.volumeControl.value;this.setVolume(volume/100);},updateVolumeControls(){var volume=this.video.muted?0:this.video.volume;var volumePercentage=Math.round(volume*100);this.updateMuteButtonState();this.volumeControl.value=volumePercentage;},SHOW_THROBBER_TIMEOUT_MS:250,_showThrobberTimer:null,_delayShowThrobberWhileResumingVideoDecoder(){this._showThrobberTimer=this.window.setTimeout(()=>{this.statusIcon.setAttribute("type","throbber");
this.setupStatusFader(true);},this.SHOW_THROBBER_TIMEOUT_MS);},_cancelShowThrobberWhileResumingVideoDecoder(){if(this._showThrobberTimer){this.window.clearTimeout(this._showThrobberTimer);this._showThrobberTimer=null;}},handleEvent(aEvent){if(!aEvent.isTrusted){this.log("Drop untrusted event ----> "+aEvent.type);return;}
this.log("Got event ----> "+aEvent.type);if(this.videoEvents.includes(aEvent.type)){this.handleVideoEvent(aEvent);}else{this.handleControlEvent(aEvent);}},autoDisappearPanel(){this.startFadeIn(this.controlBar);this.window.clearTimeout(this._hideControlsTimeout);this._hideControlsTimeout=this.window.setTimeout(()=>this._hideControlsFn(),this.HIDE_CONTROLS_TIMEOUT_MS);},handleVideoEvent(aEvent){switch(aEvent.type){case"play":this.setPlayButtonState(false);this.setupStatusFader();if(!this.isAudioOnly){this.autoDisappearPanel();}
if(!this._triggeredByControls&&this.dynamicControls&&this.isTouchControls){this.startFadeOut(this.controlBar);}
if(!this._triggeredByControls){this.startFadeOut(this.clickToPlay,true);}
this._triggeredByControls=false;break;case"pause":this.setupStatusFader();if(!this.isAudioOnly){this.autoDisappearPanel();}

if(!this.scrubber.isDragging){this.setPlayButtonState(true);}
break;case"ended":this.setPlayButtonState(true);
this.showPosition(Math.round(this.video.currentTime*1000),Math.round(this.video.duration*1000));this.startFadeIn(this.controlBar);this.setupStatusFader();break;case"volumechange":this.updateVolumeControls();
if(this.clickToPlay.hidden&&!this.isAudioOnly){this.autoDisappearPanel();}
break;case"loadedmetadata":if(this.video.localName=="video"&&(this.video.videoWidth==0||this.video.videoHeight==0)){this.isAudioOnly=true;this.startFadeOut(this.clickToPlay,true);this.startFadeIn(this.controlBar);this.setFullscreenButtonState();}
this.showPosition(Math.round(this.video.currentTime*1000),Math.round(this.video.duration*1000));if(!this.isAudioOnly&&!this.video.mozHasAudio){this.muteButton.setAttribute("noAudio","true");this.muteButton.disabled=true;}
this.adjustControlSize();this.updatePictureInPictureToggleDisplay();break;case"durationchange":this.updatePictureInPictureToggleDisplay();break;case"loadeddata":this.firstFrameShown=true;this.setupStatusFader();break;case"loadstart":this.maxCurrentTimeSeen=0;this.controlsSpacer.removeAttribute("aria-label");this.statusOverlay.removeAttribute("status");this.statusIcon.setAttribute("type","throbber");this.isAudioOnly=this.video.localName=="audio";this.setPlayButtonState(true);this.setupNewLoadState();this.setupStatusFader();break;case"progress":this.statusIcon.removeAttribute("stalled");this.showBuffered();this.setupStatusFader();break;case"stalled":this.statusIcon.setAttribute("stalled","true");this.statusIcon.setAttribute("type","throbber");this.setupStatusFader();break;case"suspend":this.setupStatusFader();break;case"timeupdate":var currentTime=Math.round(this.video.currentTime*1000); var duration=Math.round(this.video.duration*1000);
if(!this.video.paused){this.setPlayButtonState(false);}
this.timeUpdateCount++;



if(this.timeUpdateCount<=2){this.setupStatusFader();}

if(this.scrubber.isDragging){return;}
this.showPosition(currentTime,duration);this.showBuffered();break;case"emptied":this.bufferBar.value=0;this.showPosition(0,0);break;case"seeking":this.showBuffered();this.statusIcon.setAttribute("type","throbber");this.setupStatusFader();break;case"waiting":this.statusIcon.setAttribute("type","throbber");this.setupStatusFader();break;case"seeked":case"playing":case"canplay":case"canplaythrough":this.setupStatusFader();break;case"error":





if(this.hasError()){this.suppressError=false;this.startFadeOut(this.clickToPlay,true);this.statusIcon.setAttribute("type","error");this.updateErrorText();this.setupStatusFader(true);if(!this.firstFrameShown&&!this.isAudioOnly){this.startFadeOut(this.controlBar);}
this.controlsSpacer.removeAttribute("hideCursor");}
break;case"mozvideoonlyseekbegin":this._delayShowThrobberWhileResumingVideoDecoder();break;case"mozvideoonlyseekcompleted":this._cancelShowThrobberWhileResumingVideoDecoder();this.setupStatusFader();break;default:this.log("!!! media event "+aEvent.type+" not handled!");}},handleControlEvent(aEvent){switch(aEvent.type){case"click":switch(aEvent.currentTarget){case this.muteButton:this.toggleMute();break;case this.castingButton:this.toggleCasting();break;case this.closedCaptionButton:this.toggleClosedCaption();break;case this.fullscreenButton:this.toggleFullscreen();break;case this.playButton:case this.clickToPlay:case this.controlsSpacer:this.clickToPlayClickHandler(aEvent);break;case this.textTrackList:const index=+aEvent.originalTarget.getAttribute("index");this.changeTextTrack(index);break;case this.videocontrols:aEvent.stopPropagation();break;}
break;case"dblclick":this.toggleFullscreen();break;case"resizevideocontrols":

this.reflowTriggeringCallValidator.isReflowTriggeringPropsAllowed=true;this.updateReflowedDimensions();this.reflowTriggeringCallValidator.isReflowTriggeringPropsAllowed=false;this.adjustControlSize();this.updatePictureInPictureToggleDisplay();break;case"fullscreenchange":this.onFullscreenChange();break;case"keypress":this.keyHandler(aEvent);break;case"dragstart":aEvent.preventDefault();break;case"input":switch(aEvent.currentTarget){case this.scrubber:this.onScrubberInput(aEvent);break;case this.volumeControl:this.updateVolume();break;}
break;case"change":switch(aEvent.currentTarget){case this.scrubber:this.onScrubberChange(aEvent);break;case this.video.textTracks:this.setClosedCaptionButtonState();break;}
break;case"mouseup":
this.onScrubberChange(aEvent);break;case"addtrack":this.onTextTrackAdd(aEvent);break;case"removetrack":this.onTextTrackRemove(aEvent);break;case"media-videoCasting":this.updateCasting(aEvent.detail);break;default:this.log("!!! control event "+aEvent.type+" not handled!");}},terminate(){if(this.videoEvents){for(let event of this.videoEvents){try{this.video.removeEventListener(event,this,{capture:true,mozSystemGroup:true,});}catch(ex){}}}
try{for(let{el,type,capture=false}of this.controlsEvents){el.removeEventListener(type,this,{mozSystemGroup:true,capture,});}}catch(ex){}
this.window.clearTimeout(this._showControlsTimeout);this.window.clearTimeout(this._hideControlsTimeout);this._cancelShowThrobberWhileResumingVideoDecoder();this.log("--- videocontrols terminated ---");},hasError(){




return(this.video.error!=null||(this.video.networkState==this.video.NETWORK_NO_SOURCE&&this.hasSources()));},setShowPictureInPictureMessage(showMessage){if(showMessage){this.pictureInPictureOverlay.removeAttribute("hidden");}else{this.pictureInPictureOverlay.setAttribute("hidden",true);}
this.isShowingPictureInPictureMessage=showMessage;},hasSources(){if(this.video.hasAttribute("src")&&this.video.getAttribute("src")!==""){return true;}
for(var child=this.video.firstChild;child!==null;child=child.nextElementSibling){if(child instanceof this.window.HTMLSourceElement){return true;}}
return false;},updateErrorText(){let error;let v=this.video;

if(v.error){switch(v.error.code){case v.error.MEDIA_ERR_ABORTED:error="errorAborted";break;case v.error.MEDIA_ERR_NETWORK:error="errorNetwork";break;case v.error.MEDIA_ERR_DECODE:error="errorDecode";break;case v.error.MEDIA_ERR_SRC_NOT_SUPPORTED:error=v.networkState==v.NETWORK_NO_SOURCE?"errorNoSource":"errorSrcNotSupported";break;default:error="errorGeneric";break;}}else if(v.networkState==v.NETWORK_NO_SOURCE){error="errorNoSource";}else{return;}
let label=this.shadowRoot.getElementById(error);this.controlsSpacer.setAttribute("aria-label",label.textContent);this.statusOverlay.setAttribute("status",error);},formatTime(aTime,showHours=false){aTime=Math.round(aTime/1000);let hours=Math.floor(aTime/3600);let mins=Math.floor((aTime%3600)/60);let secs=Math.floor(aTime%60);let timeString;if(secs<10){secs="0"+secs;}
if(hours||showHours){if(mins<10){mins="0"+mins;}
timeString=hours+":"+mins+":"+secs;}else{timeString=mins+":"+secs;}
return timeString;},initPositionDurationBox(){const positionTextNode=Array.prototype.find.call(this.positionDurationBox.childNodes,n=>!!~n.textContent.search("#1"));const durationSpan=this.durationSpan;const durationFormat=durationSpan.textContent;const positionFormat=positionTextNode.textContent;durationSpan.classList.add("duration");durationSpan.setAttribute("role","none");durationSpan.id="durationSpan";Object.defineProperties(this.positionDurationBox,{durationSpan:{value:durationSpan,},position:{set:v=>{positionTextNode.textContent=positionFormat.replace("#1",v);},},duration:{set:v=>{durationSpan.textContent=v?durationFormat.replace("#2",v):"";},},});},showDuration(duration){let isInfinite=duration==Infinity;this.log("Duration is "+duration+"ms.\n");if(isNaN(duration)||isInfinite){duration=this.maxCurrentTimeSeen;} 
this.showHours=duration>=3600000;let timeString=isInfinite?"":this.formatTime(duration);this.positionDurationBox.duration=timeString;if(this.showHours){this.positionDurationBox.modifier="long";this.durationSpan.modifier="long";}
this.scrubber.max=duration;},pauseVideoDuringDragging(){if(!this.video.paused&&!this.isPausedByDragging&&this.scrubber.isDragging){this.isPausedByDragging=true;this.video.pause();}},onScrubberInput(e){const duration=Math.round(this.video.duration*1000); let time=this.scrubber.value;this.seekToPosition(time);this.showPosition(time,duration);this.scrubber.isDragging=true;this.pauseVideoDuringDragging();},onScrubberChange(e){this.scrubber.isDragging=false;if(this.isPausedByDragging){this.video.play();this.isPausedByDragging=false;}},updateScrubberProgress(){const positionPercent=(this.scrubber.value/this.scrubber.max)*100;if(!isNaN(positionPercent)&&positionPercent!=Infinity){this.progressBar.value=positionPercent;}else{this.progressBar.value=0;}},seekToPosition(newPosition){newPosition/=1000; this.log("+++ seeking to "+newPosition);this.video.currentTime=newPosition;},setVolume(newVolume){this.log("*** setting volume to "+newVolume);this.video.volume=newVolume;this.video.muted=false;},showPosition(currentTime,duration){

if(currentTime>this.maxCurrentTimeSeen){this.maxCurrentTimeSeen=currentTime;}
this.showDuration(duration);this.log("time update @ "+currentTime+"ms of "+duration+"ms");let positionTime=this.formatTime(currentTime,this.showHours);this.scrubber.value=currentTime;this.positionDurationBox.position=positionTime;this.scrubber.setAttribute("aria-valuetext",this.positionDurationBox.textContent.trim());this.updateScrubberProgress();},showBuffered(){function bsearch(haystack,needle,cmp){var length=haystack.length;var low=0;var high=length;while(low<high){var probe=low+((high-low)>>1);var r=cmp(haystack,probe,needle);if(r==0){return probe;}else if(r>0){low=probe+1;}else{high=probe;}}
return-1;}
function bufferedCompare(buffered,i,time){if(time>buffered.end(i)){return 1;}else if(time>=buffered.start(i)){return 0;}
return-1;}
var duration=Math.round(this.video.duration*1000);if(isNaN(duration)||duration==Infinity){duration=this.maxCurrentTimeSeen;}


var currentTime=this.video.currentTime;var buffered=this.video.buffered;var index=bsearch(buffered,currentTime,bufferedCompare);var endTime=0;if(index>=0){endTime=Math.round(buffered.end(index)*1000);}
this.bufferBar.max=duration;this.bufferBar.value=endTime;


this.bufferA11yVal.textContent=(this.bufferBar.position*100).toFixed()+"%";},_controlsHiddenByTimeout:false,_showControlsTimeout:0,SHOW_CONTROLS_TIMEOUT_MS:500,_showControlsFn(){if(this.video.matches("video:hover")){this.startFadeIn(this.controlBar,false);this._showControlsTimeout=0;this._controlsHiddenByTimeout=false;}},_hideControlsTimeout:0,_hideControlsFn(){if(!this.scrubber.isDragging){this.startFade(this.controlBar,false);this._hideControlsTimeout=0;this._controlsHiddenByTimeout=true;}},HIDE_CONTROLS_TIMEOUT_MS:5000,
isMouseOverVideo(event){
let el=this.shadowRoot.elementFromPoint(event.clientX,event.clientY);
return!!el;},isMouseOverControlBar(event){
let el=this.shadowRoot.elementFromPoint(event.clientX,event.clientY);while(el&&el!==this.shadowRoot){if(el==this.controlBar){return true;}
el=el.parentNode;}
return false;},onMouseMove(event){ if(!this.isAudioOnly&&!this.video.mozHasAudio){return;}
if(!this.dynamicControls){return;}
this.window.clearTimeout(this._hideControlsTimeout);

if(!this.firstFrameShown&&!this.video.autoplay){return;}
if(this._controlsHiddenByTimeout){this._showControlsTimeout=this.window.setTimeout(()=>this._showControlsFn(),this.SHOW_CONTROLS_TIMEOUT_MS);}else{this.startFade(this.controlBar,true);}

if((this._controlsHiddenByTimeout||!this.isMouseOverControlBar(event))&&this.clickToPlay.hidden){this._hideControlsTimeout=this.window.setTimeout(()=>this._hideControlsFn(),this.HIDE_CONTROLS_TIMEOUT_MS);}},onMouseInOut(event){if(!this.dynamicControls){return;}
this.window.clearTimeout(this._hideControlsTimeout);let isMouseOverVideo=this.isMouseOverVideo(event);

if(!this.firstFrameShown&&!isMouseOverVideo&&!this.video.autoplay){return;}
if(!isMouseOverVideo&&!this.isMouseOverControlBar(event)){this.adjustControlSize();if(!this.clickToPlay.hidden){return;}
this.startFadeOut(this.controlBar,false);this.textTrackListContainer.hidden=true;this.window.clearTimeout(this._showControlsTimeout);this._controlsHiddenByTimeout=false;}},startFadeIn(element,immediate){this.startFade(element,true,immediate);},startFadeOut(element,immediate){this.startFade(element,false,immediate);},animationMap:new WeakMap(),animationProps:{clickToPlay:{keyframes:[{transform:"scale(3)",opacity:0},{transform:"scale(1)",opacity:0.55},],options:{easing:"ease",duration:400,
fill:"both",},},controlBar:{keyframes:[{opacity:0},{opacity:1}],options:{easing:"ease",duration:200,fill:"both",},},statusOverlay:{keyframes:[{opacity:0},{opacity:0,offset:0.72},{opacity:1},],options:{duration:1050,fill:"both",},},},startFade(element,fadeIn,immediate=false){let animationProp=this.animationProps[element.id];if(!animationProp){throw new Error("Element "+
element.id+" has no transition. Toggle the hidden property directly.");}
let animation=this.animationMap.get(element);if(!animation){animation=new this.window.Animation(new this.window.KeyframeEffect(element,animationProp.keyframes,animationProp.options));this.animationMap.set(element,animation);}
if(fadeIn){if(element==this.controlBar){this.controlsSpacer.removeAttribute("hideCursor");this.fullscreenButton.removeAttribute("tabindex");} 
if(element.isAdjustableControl&&element.hiddenByAdjustment){return;}

if(!element.hidden){return;} 
element.hidden=false;}else{if(element==this.controlBar){if(!this.hasError()&&this.isVideoInFullScreen){this.controlsSpacer.setAttribute("hideCursor",true);}


this.fullscreenButton.setAttribute("tabindex","-1");}

if(element.hidden){return;}}
element.classList.toggle("fadeout",!fadeIn);element.classList.toggle("fadein",fadeIn);let finishedPromise;if(!immediate){if(animation.pending){animation.cancel();finishedPromise=Promise.resolve();}else{switch(animation.playState){case"idle":case"finished":animation.playbackRate=fadeIn?1:-1;animation.play();break;case"running":
animation.reverse();break;case"pause":throw new Error("Animation should never reach pause state.");default:throw new Error("Unknown Animation playState: "+animation.playState);}
finishedPromise=animation.finished;}}else{ animation.cancel();finishedPromise=Promise.resolve();}
finishedPromise.then(animation=>{if(element==this.controlBar){this.onControlBarAnimationFinished();}
element.classList.remove(fadeIn?"fadein":"fadeout");if(!fadeIn){element.hidden=true;}
if(animation){

animation.cancel();}},()=>{});},_triggeredByControls:false,startPlay(){this._triggeredByControls=true;this.hideClickToPlay();this.video.play();},togglePause(){if(this.video.paused||this.video.ended){this.startPlay();}else{this.video.pause();}


},get isVideoWithoutAudioTrack(){return(this.video.readyState>=this.video.HAVE_METADATA&&!this.isAudioOnly&&!this.video.mozHasAudio);},toggleMute(){if(this.isVideoWithoutAudioTrack){return;}
this.video.muted=!this.isEffectivelyMuted;if(this.video.volume===0){this.video.volume=0.5;}


},get isVideoInFullScreen(){return this.video.isSameNode(this.video.getRootNode().fullscreenElement);},toggleFullscreen(){this.isVideoInFullScreen?this.document.exitFullscreen():this.video.requestFullscreen();},setFullscreenButtonState(){if(this.isAudioOnly){this.fullscreenButton.setAttribute("masking",true);this.controlBar.removeAttribute("fullscreen-unavailable");this.adjustControlSize();return;}
if(!this.document.fullscreenEnabled){this.controlBar.setAttribute("fullscreen-unavailable",true);this.fullscreenButton.removeAttribute("masking");this.adjustControlSize();return;}
this.controlBar.removeAttribute("fullscreen-unavailable");this.fullscreenButton.removeAttribute("masking");this.adjustControlSize();var attrName=this.isVideoInFullScreen?"exitfullscreenlabel":"enterfullscreenlabel";var value=this.fullscreenButton.getAttribute(attrName);this.fullscreenButton.setAttribute("aria-label",value);if(this.isVideoInFullScreen){this.fullscreenButton.setAttribute("fullscreened","true");}else{this.fullscreenButton.removeAttribute("fullscreened");}},onFullscreenChange(){if(this.document.fullscreenElement){this.videocontrols.setAttribute("inDOMFullscreen",true);}else{this.videocontrols.removeAttribute("inDOMFullscreen");}
this.updateOrientationState(this.isVideoInFullScreen);if(this.isVideoInFullScreen){this.startFadeOut(this.controlBar,true);}
this.setFullscreenButtonState();},updateOrientationState(lock){if(!this.video.mozOrientationLockEnabled){return;}
if(lock){if(this.video.mozIsOrientationLocked){return;}
let dimenDiff=this.video.videoWidth-this.video.videoHeight;if(dimenDiff>0){this.video.mozIsOrientationLocked=this.window.screen.mozLockOrientation("landscape");}else if(dimenDiff<0){this.video.mozIsOrientationLocked=this.window.screen.mozLockOrientation("portrait");}else{this.video.mozIsOrientationLocked=this.window.screen.mozLockOrientation(this.window.screen.orientation);}}else{if(!this.video.mozIsOrientationLocked){return;}
this.window.screen.mozUnlockOrientation();this.video.mozIsOrientationLocked=false;}},clickToPlayClickHandler(e){if(e.button!=0){return;}
if(this.hasError()&&!this.suppressError){if(this.video.error.code!=this.video.error.MEDIA_ERR_ABORTED){return;}
this.startFadeOut(this.statusOverlay,true);this.suppressError=true;return;}
if(e.defaultPrevented){return;}
if(this.playButton.hasAttribute("paused")){this.startPlay();}else{this.video.pause();}},hideClickToPlay(){let videoHeight=this.reflowedDimensions.videoHeight;let videoWidth=this.reflowedDimensions.videoWidth;

let animationScale=2;let animationMinSize=this.clickToPlay.minWidth*animationScale;let immediate=animationMinSize>videoWidth||animationMinSize>videoHeight-this.controlBarMinHeight;this.startFadeOut(this.clickToPlay,immediate);},setPlayButtonState(aPaused){if(aPaused){this.playButton.setAttribute("paused","true");}else{this.playButton.removeAttribute("paused");}
var attrName=aPaused?"playlabel":"pauselabel";var value=this.playButton.getAttribute(attrName);this.playButton.setAttribute("aria-label",value);},get isEffectivelyMuted(){return this.video.muted||!this.video.volume;},updateMuteButtonState(){var muted=this.isEffectivelyMuted;if(muted){this.muteButton.setAttribute("muted","true");}else{this.muteButton.removeAttribute("muted");}
var attrName=muted?"unmutelabel":"mutelabel";var value=this.muteButton.getAttribute(attrName);this.muteButton.setAttribute("aria-label",value);},keyHandler(event){if(!this.video.hasAttribute("controls")){return;}
var keystroke="";if(event.altKey){keystroke+="alt-";}
if(event.shiftKey){keystroke+="shift-";}
if(this.window.navigator.platform.startsWith("Mac")){if(event.metaKey){keystroke+="accel-";}
if(event.ctrlKey){keystroke+="control-";}}else{if(event.metaKey){keystroke+="meta-";}
if(event.ctrlKey){keystroke+="accel-";}}
switch(event.keyCode){case this.window.KeyEvent.DOM_VK_UP:keystroke+="upArrow";break;case this.window.KeyEvent.DOM_VK_DOWN:keystroke+="downArrow";break;case this.window.KeyEvent.DOM_VK_LEFT:keystroke+="leftArrow";break;case this.window.KeyEvent.DOM_VK_RIGHT:keystroke+="rightArrow";break;case this.window.KeyEvent.DOM_VK_HOME:keystroke+="home";break;case this.window.KeyEvent.DOM_VK_END:keystroke+="end";break;case this.window.KeyEvent.DOM_VK_RETURN:keystroke+="enter";break;}
if(String.fromCharCode(event.charCode)==" "){keystroke+="space";}
this.log("Got keystroke: "+keystroke);var oldval,newval;try{const enterToTogglePause=this.prefs["media.videocontrols.keyboard-enter-to-toggle-pause"];const controlOverride=this.prefs["media.videocontrols.volume-control-override"];switch(keystroke){case"enter":if(!enterToTogglePause){break;} 
case"space":let target=event.originalTarget;if(target.localName==="button"&&!target.disabled){break;}
this.togglePause();break;case"downArrow":if(controlOverride){this.window.dispatchEvent(new this.window.CustomEvent("audiovolumecontroloverride",{detail:"AudioVolumeDown",}));break;}
oldval=this.video.volume;this.video.volume=oldval<0.1?0:oldval-0.1;this.video.muted=false;break;case"upArrow":if(controlOverride){this.window.dispatchEvent(new this.window.CustomEvent("audiovolumecontroloverride",{detail:"AudioVolumeUp",}));break;}
oldval=this.video.volume;this.video.volume=oldval>0.9?1:oldval+0.1;this.video.muted=false;break;case"accel-downArrow":this.video.muted=true;break;case"accel-upArrow":this.video.muted=false;break;case"leftArrow":case"accel-leftArrow":oldval=this.video.currentTime;if(keystroke=="leftArrow"){newval=oldval-15;}else{newval=oldval-
(this.video.duration||this.maxCurrentTimeSeen/1000)/10;}
this.video.currentTime=newval>=0?newval:0;break;case"rightArrow":case"accel-rightArrow":oldval=this.video.currentTime;var maxtime=this.video.duration||this.maxCurrentTimeSeen/1000;if(keystroke=="rightArrow"){newval=oldval+15;}else{newval=oldval+maxtime/10;}
this.video.currentTime=newval<=maxtime?newval:maxtime;break;case"home":this.video.currentTime=0;break;case"end":if(this.video.currentTime!=this.video.duration){this.video.currentTime=this.video.duration||this.maxCurrentTimeSeen/1000;}
break;default:return;}}catch(e){}
event.preventDefault();},checkTextTrackSupport(textTrack){return textTrack.kind=="subtitles"||textTrack.kind=="captions";},get isCastingAvailable(){return!this.isAudioOnly&&this.video.mozAllowCasting;},get isClosedCaptionAvailable(){if(this.isAudioOnly){return false;}
return this.overlayableTextTracks.length;},get overlayableTextTracks(){return Array.prototype.filter.call(this.video.textTracks,this.checkTextTrackSupport);},get currentTextTrackIndex(){const showingTT=this.overlayableTextTracks.find(tt=>tt.mode=="showing");return showingTT?showingTT.index:0;},get isCastingOn(){return this.isCastingAvailable&&this.video.mozIsCasting;},setCastingButtonState(){if(this.isCastingOn){this.castingButton.setAttribute("enabled","true");}else{this.castingButton.removeAttribute("enabled");}
this.adjustControlSize();},updateCasting(eventDetail){let castingData=JSON.parse(eventDetail);if("allow"in castingData){this.video.mozAllowCasting=!!castingData.allow;}
if("active"in castingData){this.video.mozIsCasting=!!castingData.active;}
this.setCastingButtonState();},get isClosedCaptionOn(){for(let tt of this.overlayableTextTracks){if(tt.mode==="showing"){return true;}}
return false;},setClosedCaptionButtonState(){if(this.isClosedCaptionOn){this.closedCaptionButton.setAttribute("enabled","true");}else{this.closedCaptionButton.removeAttribute("enabled");}
let ttItems=this.textTrackList.childNodes;for(let tti of ttItems){const idx=+tti.getAttribute("index");if(idx==this.currentTextTrackIndex){tti.setAttribute("on","true");}else{tti.removeAttribute("on");}}
this.adjustControlSize();},addNewTextTrack(tt){if(!this.checkTextTrackSupport(tt)){return;}
if(tt.index&&tt.index<this.textTracksCount){

if(tt.mode==="showing"){this.changeTextTrack(tt.index);}
return;}
tt.index=this.textTracksCount++;const ttBtn=this.shadowRoot.createElementAndAppendChildAt(this.textTrackList,"button");ttBtn.textContent=tt.label||"";ttBtn.classList.add("textTrackItem");ttBtn.setAttribute("index",tt.index);if(tt.mode==="showing"&&tt.index){this.changeTextTrack(tt.index);}},changeTextTrack(index){for(let tt of this.overlayableTextTracks){if(tt.index===index){tt.mode="showing";}else{tt.mode="disabled";}}
this.textTrackListContainer.hidden=true;},onControlBarAnimationFinished(){this.textTrackListContainer.hidden=true;this.video.dispatchEvent(new this.window.CustomEvent("controlbarchange"));this.adjustControlSize();},toggleCasting(){this.videocontrols.dispatchEvent(new this.window.CustomEvent("VideoBindingCast"));},toggleClosedCaption(){if(this.textTrackListContainer.hidden){this.textTrackListContainer.hidden=false;}else{this.textTrackListContainer.hidden=true;}},onTextTrackAdd(trackEvent){this.addNewTextTrack(trackEvent.track);this.setClosedCaptionButtonState();},onTextTrackRemove(trackEvent){const toRemoveIndex=trackEvent.track.index;const ttItems=this.textTrackList.childNodes;if(!ttItems){return;}
for(let tti of ttItems){const idx=+tti.getAttribute("index");if(idx===toRemoveIndex){tti.remove();this.textTracksCount--;}
this.video.dispatchEvent(new this.window.CustomEvent("texttrackchange"));}
this.setClosedCaptionButtonState();},initTextTracks(){
const offLabel=this.textTrackList.getAttribute("offlabel");this.addNewTextTrack({label:offLabel,kind:"subtitles",});for(let tt of this.overlayableTextTracks){this.addNewTextTrack(tt);}
this.setClosedCaptionButtonState();},log(msg){if(this.debug){this.window.console.log("videoctl: "+msg+"\n");}},get isTopLevelSyntheticDocument(){return(this.document.mozSyntheticDocument&&this.window===this.window.top);},controlBarMinHeight:40,controlBarMinVisibleHeight:28,reflowTriggeringCallValidator:{isReflowTriggeringPropsAllowed:false,reflowTriggeringProps:Object.freeze(["offsetLeft","offsetTop","offsetWidth","offsetHeight","offsetParent","clientLeft","clientTop","clientWidth","clientHeight","getClientRects","getBoundingClientRect",]),get(obj,prop){if(!this.isReflowTriggeringPropsAllowed&&this.reflowTriggeringProps.includes(prop)){throw new Error("Please don't trigger reflow. See bug 1493525.");}
let val=obj[prop];if(typeof val=="function"){return function(){return val.apply(obj,arguments);};}
return val;},set(obj,prop,value){return Reflect.set(obj,prop,value);},},installReflowCallValidator(element){return new Proxy(element,this.reflowTriggeringCallValidator);},reflowedDimensions:{

videoHeight:150,videoWidth:300,

videocontrolsWidth:0,},updateReflowedDimensions(){this.reflowedDimensions.videoHeight=this.video.clientHeight;this.reflowedDimensions.videoWidth=this.video.clientWidth;this.reflowedDimensions.videocontrolsWidth=this.videocontrols.clientWidth;},adjustControlSize(){const minControlBarPaddingWidth=18;this.fullscreenButton.isWanted=!this.controlBar.hasAttribute("fullscreen-unavailable");this.castingButton.isWanted=this.isCastingAvailable;this.closedCaptionButton.isWanted=this.isClosedCaptionAvailable;this.volumeStack.isWanted=!this.muteButton.hasAttribute("noAudio");let minRequiredWidth=this.prioritizedControls.filter(control=>control&&control.isWanted).reduce((accWidth,cc)=>accWidth+cc.minWidth,minControlBarPaddingWidth);if(!minRequiredWidth){return;}
let givenHeight=this.reflowedDimensions.videoHeight;let videoWidth=(this.isAudioOnly?this.reflowedDimensions.videocontrolsWidth:this.reflowedDimensions.videoWidth)||minRequiredWidth;let videocontrolsWidth=this.reflowedDimensions.videocontrolsWidth;let videoHeight=this.isAudioOnly?CONTROL_PANEL_HEIGHT:givenHeight;let widthUsed=minControlBarPaddingWidth;let preventAppendControl=false;for(let control of this.prioritizedControls){if(!control.isWanted){control.hiddenByAdjustment=true;continue;}
control.hiddenByAdjustment=preventAppendControl||widthUsed+control.minWidth>videoWidth;if(control.hiddenByAdjustment){preventAppendControl=true;}else{widthUsed+=control.minWidth;}}
this.controlBarSpacer.hidden=!this.scrubberStack.hidden||this.muteButton.hidden;
if(this.video.localName=="audio"){if(givenHeight){this.controlBar.style.height=`${videoHeight}px`;return;}

if(videocontrolsWidth<=minControlBarPaddingWidth){this.controlBar.style.width=`${minRequiredWidth}px`;}else{this.controlBar.style.width=`${videoWidth}px`;}}
if(videoHeight<this.controlBarMinHeight||widthUsed===minControlBarPaddingWidth){this.controlBar.setAttribute("size","hidden");this.controlBar.hiddenByAdjustment=true;}else{this.controlBar.removeAttribute("size");this.controlBar.hiddenByAdjustment=false;}
const minVideoSideLength=Math.min(videoWidth,videoHeight);const clickToPlayViewRatio=0.15;const clickToPlayScaledSize=Math.max(this.clickToPlay.minWidth,minVideoSideLength*clickToPlayViewRatio);if(clickToPlayScaledSize>=videoWidth||clickToPlayScaledSize+this.controlBarMinHeight/2>=videoHeight/2){this.clickToPlay.hiddenByAdjustment=true;}else{if(this.clickToPlay.hidden&&!this.video.played.length&&this.video.paused){this.clickToPlay.hiddenByAdjustment=false;}
this.clickToPlay.style.width=`${clickToPlayScaledSize}px`;this.clickToPlay.style.height=`${clickToPlayScaledSize}px`;}},get pipToggleEnabled(){return this.prefs["media.videocontrols.picture-in-picture.video-toggle.enabled"];},init(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.video=this.installReflowCallValidator(shadowRoot.host);this.videocontrols=this.installReflowCallValidator(shadowRoot.firstChild);this.document=this.videocontrols.ownerDocument;this.window=this.document.defaultView;this.shadowRoot=shadowRoot;this.prefs=prefs;this.controlsContainer=this.shadowRoot.getElementById("controlsContainer");this.statusIcon=this.shadowRoot.getElementById("statusIcon");this.controlBar=this.shadowRoot.getElementById("controlBar");this.playButton=this.shadowRoot.getElementById("playButton");this.controlBarSpacer=this.shadowRoot.getElementById("controlBarSpacer");this.muteButton=this.shadowRoot.getElementById("muteButton");this.volumeStack=this.shadowRoot.getElementById("volumeStack");this.volumeControl=this.shadowRoot.getElementById("volumeControl");this.progressBar=this.shadowRoot.getElementById("progressBar");this.bufferBar=this.shadowRoot.getElementById("bufferBar");this.bufferA11yVal=this.shadowRoot.getElementById("bufferA11yVal");this.scrubberStack=this.shadowRoot.getElementById("scrubberStack");this.scrubber=this.shadowRoot.getElementById("scrubber");this.durationLabel=this.shadowRoot.getElementById("durationLabel");this.positionLabel=this.shadowRoot.getElementById("positionLabel");this.positionDurationBox=this.shadowRoot.getElementById("positionDurationBox");this.statusOverlay=this.shadowRoot.getElementById("statusOverlay");this.controlsOverlay=this.shadowRoot.getElementById("controlsOverlay");this.pictureInPictureOverlay=this.shadowRoot.getElementById("pictureInPictureOverlay");this.controlsSpacer=this.shadowRoot.getElementById("controlsSpacer");this.clickToPlay=this.shadowRoot.getElementById("clickToPlay");this.fullscreenButton=this.shadowRoot.getElementById("fullscreenButton");this.castingButton=this.shadowRoot.getElementById("castingButton");this.closedCaptionButton=this.shadowRoot.getElementById("closedCaptionButton");this.textTrackList=this.shadowRoot.getElementById("textTrackList");this.textTrackListContainer=this.shadowRoot.getElementById("textTrackListContainer");this.pictureInPictureToggle=this.shadowRoot.getElementById("pictureInPictureToggle");if(this.positionDurationBox){this.durationSpan=this.positionDurationBox.getElementsByTagName("span")[0];}
let isMobile=this.window.navigator.appVersion.includes("Android");if(isMobile){this.controlsContainer.classList.add("mobile");}
this.isTouchControls=isMobile;if(this.isTouchControls){this.controlsContainer.classList.add("touch");}

this.controlBarComputedStyles=this.window.getComputedStyle(this.controlBar);this.prioritizedControls=[this.playButton,this.muteButton,this.fullscreenButton,this.castingButton,this.closedCaptionButton,this.positionDurationBox,this.scrubberStack,this.durationSpan,this.volumeStack,];this.isAudioOnly=this.video.localName=="audio";this.setupInitialState();this.setupNewLoadState();this.initTextTracks();

for(let event of this.videoEvents){this.video.addEventListener(event,this,{capture:true,mozSystemGroup:true,});}
this.controlsEvents=[{el:this.muteButton,type:"click"},{el:this.castingButton,type:"click"},{el:this.closedCaptionButton,type:"click"},{el:this.fullscreenButton,type:"click"},{el:this.playButton,type:"click"},{el:this.clickToPlay,type:"click"},
{el:this.controlsSpacer,type:"click",nonTouchOnly:true},{el:this.controlsSpacer,type:"dblclick",nonTouchOnly:true},{el:this.textTrackList,type:"click"},{el:this.videocontrols,type:"resizevideocontrols"},{el:this.document,type:"fullscreenchange"},{el:this.video,type:"keypress",capture:true},{el:this.videocontrols,type:"click",mozSystemGroup:false},{el:this.videocontrols,type:"dragstart"},{el:this.scrubber,type:"input"},{el:this.scrubber,type:"change"},
{el:this.scrubber,type:"mouseup"},{el:this.volumeControl,type:"input"},{el:this.video.textTracks,type:"addtrack"},{el:this.video.textTracks,type:"removetrack"},{el:this.video.textTracks,type:"change"},{el:this.video,type:"media-videoCasting",touchOnly:true},];for(let{el,type,nonTouchOnly=false,touchOnly=false,mozSystemGroup=true,capture=false,}of this.controlsEvents){if((this.isTouchControls&&nonTouchOnly)||(!this.isTouchControls&&touchOnly)){continue;}
el.addEventListener(type,this,{mozSystemGroup,capture});}
this.log("--- videocontrols initialized ---");},};this.TouchUtils={videocontrols:null,video:null,controlsTimer:null,controlsTimeout:5000,get visible(){return(!this.Utils.controlBar.hasAttribute("fadeout")&&!this.Utils.controlBar.hidden);},firstShow:false,toggleControls(){if(!this.Utils.dynamicControls||!this.visible){this.showControls();}else{this.delayHideControls(0);}},showControls(){if(this.Utils.dynamicControls){this.Utils.startFadeIn(this.Utils.controlBar);this.delayHideControls(this.controlsTimeout);}},clearTimer(){if(this.controlsTimer){this.window.clearTimeout(this.controlsTimer);this.controlsTimer=null;}},delayHideControls(aTimeout){this.clearTimer();this.controlsTimer=this.window.setTimeout(()=>this.hideControls(),aTimeout);},hideControls(){if(!this.Utils.dynamicControls){return;}
this.Utils.startFadeOut(this.Utils.controlBar);},handleEvent(aEvent){switch(aEvent.type){case"click":switch(aEvent.currentTarget){case this.Utils.playButton:if(!this.video.paused){this.delayHideControls(0);}else{this.showControls();}
break;case this.Utils.muteButton:this.delayHideControls(this.controlsTimeout);break;}
break;case"touchstart":this.clearTimer();break;case"touchend":this.delayHideControls(this.controlsTimeout);break;case"mouseup":if(aEvent.originalTarget==this.Utils.controlsSpacer){if(this.firstShow){this.Utils.video.play();this.firstShow=false;}
this.toggleControls();}
break;}},terminate(){try{for(let{el,type,mozSystemGroup=true}of this.controlsEvents){el.removeEventListener(type,this,{mozSystemGroup});}}catch(ex){}
this.clearTimer();},init(shadowRoot,utils){this.Utils=utils;this.videocontrols=this.Utils.videocontrols;this.video=this.Utils.video;this.document=this.videocontrols.ownerDocument;this.window=this.document.defaultView;this.shadowRoot=shadowRoot;this.controlsEvents=[{el:this.Utils.playButton,type:"click"},{el:this.Utils.scrubber,type:"touchstart"},{el:this.Utils.scrubber,type:"touchend"},{el:this.Utils.muteButton,type:"click"},{el:this.Utils.controlsSpacer,type:"mouseup"},];for(let{el,type,mozSystemGroup=true}of this.controlsEvents){el.addEventListener(type,this,{mozSystemGroup});}




 
if(!this.video.autoplay&&this.Utils.dynamicControls&&this.video.paused&&this.video.currentTime===0){this.firstShow=true;}



if(this.video.currentTime!==0){this.delayHideControls(this.Utils.HIDE_CONTROLS_TIMEOUT_MS);}},};this.Utils.init(this.shadowRoot,this.prefs);if(this.Utils.isTouchControls){this.TouchUtils.init(this.shadowRoot,this.Utils);}
this.shadowRoot.firstChild.dispatchEvent(new this.window.CustomEvent("VideoBindingAttached"));this._setupEventListeners();}
generateContent(){const parser=new this.window.DOMParser();parser.forceEnableDTD();let parserDoc=parser.parseFromString(`<!DOCTYPE bindings [
      <!ENTITY % videocontrolsDTD SYSTEM "chrome://global/locale/videocontrols.dtd">
      %videocontrolsDTD;
      ]>
      <div class="videocontrols" xmlns="http://www.w3.org/1999/xhtml" role="none">
        <link rel="stylesheet" href="chrome://global/skin/media/videocontrols.css" />

        <div id="controlsContainer" class="controlsContainer" role="none">
          <div id="statusOverlay" class="statusOverlay stackItem" hidden="true">
            <div id="statusIcon" class="statusIcon"></div>
            <bdi class="statusLabel" id="errorAborted">&error.aborted;</bdi>
            <bdi class="statusLabel" id="errorNetwork">&error.network;</bdi>
            <bdi class="statusLabel" id="errorDecode">&error.decode;</bdi>
            <bdi class="statusLabel" id="errorSrcNotSupported">&error.srcNotSupported;</bdi>
            <bdi class="statusLabel" id="errorNoSource">&error.noSource2;</bdi>
            <bdi class="statusLabel" id="errorGeneric">&error.generic;</bdi>
          </div>

          <div id="pictureInPictureOverlay" class="pictureInPictureOverlay stackItem" status="pictureInPicture" hidden="true">
            <div class="statusIcon" type="pictureInPicture"></div>
            <bdi class="statusLabel" id="pictureInPicture">&status.pictureInPicture;</bdi>
          </div>

          <div id="controlsOverlay" class="controlsOverlay stackItem" role="none">
            <div class="controlsSpacerStack">
              <div id="controlsSpacer" class="controlsSpacer stackItem" role="none"></div>
              <div id="clickToPlay" class="clickToPlay" hidden="true"></div>
            </div>

            <button id="pictureInPictureToggle" class="pip-wrapper" position="left" hidden="true">
              <div class="pip-small clickable"></div>
              <div class="pip-expanded clickable">
                <span class="pip-icon-label clickable">
                  <span class="pip-icon"></span>
                  <span class="pip-label">&pictureInPictureToggle.label;</span>
                </span>
                <div class="pip-explainer clickable">
                  &pictureInPictureExplainer;
                </div>
              </div>
              <div class="pip-icon clickable"></div>
            </button>

            <div id="controlBar" class="controlBar" role="none" hidden="true">
              <button id="playButton"
                      class="button playButton"
                      playlabel="&playButton.playLabel;"
                      pauselabel="&playButton.pauseLabel;"
                      tabindex="-1"/>
              <div id="scrubberStack" class="scrubberStack progressContainer" role="none">
                <div class="progressBackgroundBar stackItem" role="none">
                  <div class="progressStack" role="none">
                    <progress id="bufferBar" class="bufferBar" value="0" max="100" aria-hidden="true"></progress>
                    <span class="a11y-only" role="status" aria-live="off">
                      <span data-l10n-id="videocontrols-buffer-bar-label"></span>
                      <span id="bufferA11yVal"></span>
                    </span>
                    <progress id="progressBar" class="progressBar" value="0" max="100" aria-hidden="true"></progress>
                  </div>
                </div>
                <input type="range" id="scrubber" class="scrubber" tabindex="-1" data-l10n-id="videocontrols-scrubber"/>
              </div>
              <bdi id="positionLabel" class="positionLabel" role="presentation"></bdi>
              <bdi id="durationLabel" class="durationLabel" role="presentation"></bdi>
              <bdi id="positionDurationBox" class="positionDurationBox" aria-hidden="true">
                &positionAndDuration.nameFormat;
              </bdi>
              <div id="controlBarSpacer" class="controlBarSpacer" hidden="true" role="none"></div>
              <button id="muteButton"
                      class="button muteButton"
                      mutelabel="&muteButton.muteLabel;"
                      unmutelabel="&muteButton.unmuteLabel;"
                      tabindex="-1"/>
              <div id="volumeStack" class="volumeStack progressContainer" role="none">
                <input type="range" id="volumeControl" class="volumeControl" min="0" max="100" step="1" tabindex="-1"
                       data-l10n-id="videocontrols-volume-control"/>
              </div>
              <button id="castingButton" class="button castingButton"
                      aria-label="&castingButton.castingLabel;"/>
              <button id="closedCaptionButton" class="button closedCaptionButton"
                      data-l10n-id="videocontrols-closed-caption-button"/>
              <button id="fullscreenButton"
                      class="button fullscreenButton"
                      enterfullscreenlabel="&fullscreenButton.enterfullscreenlabel;"
                      exitfullscreenlabel="&fullscreenButton.exitfullscreenlabel;"/>
            </div>
            <div id="textTrackListContainer" class="textTrackListContainer" hidden="true">
              <div id="textTrackList" class="textTrackList" offlabel="&closedCaption.off;"></div>
            </div>
          </div>
        </div>
      </div>`,"application/xml");this.l10n=new this.window.DOMLocalization(["toolkit/global/videocontrols.ftl",]);this.l10n.connectRoot(this.shadowRoot);this.shadowRoot.importNodeAndAppendChildAt(this.shadowRoot,parserDoc.documentElement,true);}
elementStateMatches(element){let elementInPiP=VideoControlsWidget.isPictureInPictureVideo(element);return this.isShowingPictureInPictureMessage==elementInPiP;}
destructor(){this.Utils.terminate();this.TouchUtils.terminate();this.Utils.updateOrientationState(false);this.l10n.disconnectRoot(this.shadowRoot);this.l10n=null;}
onPrefChange(prefName,prefValue){this.prefs[prefName]=prefValue;this.Utils.updatePictureInPictureToggleDisplay();}
_setupEventListeners(){this.shadowRoot.firstChild.addEventListener("mouseover",event=>{if(!this.Utils.isTouchControls){this.Utils.onMouseInOut(event);}});this.shadowRoot.firstChild.addEventListener("mouseout",event=>{if(!this.Utils.isTouchControls){this.Utils.onMouseInOut(event);}});this.shadowRoot.firstChild.addEventListener("mousemove",event=>{if(!this.Utils.isTouchControls){this.Utils.onMouseMove(event);}});}};this.NoControlsMobileImplWidget=class{constructor(shadowRoot){this.shadowRoot=shadowRoot;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;}
onsetup(){this.generateContent();this.Utils={videoEvents:["play","playing","MozNoControlsBlockedVideo"],terminate(){for(let event of this.videoEvents){try{this.video.removeEventListener(event,this,{capture:true,mozSystemGroup:true,});}catch(ex){}}
try{this.clickToPlay.removeEventListener("click",this,{mozSystemGroup:true,});}catch(ex){}},hasError(){return(this.video.error!=null||this.video.networkState==this.video.NETWORK_NO_SOURCE);},handleEvent(aEvent){switch(aEvent.type){case"play":this.noControlsOverlay.hidden=true;break;case"playing":this.noControlsOverlay.hidden=true;break;case"MozNoControlsBlockedVideo":this.blockedVideoHandler();break;case"click":this.clickToPlayClickHandler(aEvent);break;}},blockedVideoHandler(){if(this.hasError()){this.noControlsOverlay.hidden=true;return;}
this.noControlsOverlay.hidden=false;},clickToPlayClickHandler(e){if(e.button!=0){return;}
this.noControlsOverlay.hidden=true;this.video.play();},init(shadowRoot){this.shadowRoot=shadowRoot;this.video=shadowRoot.host;this.videocontrols=shadowRoot.firstChild;this.document=this.videocontrols.ownerDocument;this.window=this.document.defaultView;this.shadowRoot=shadowRoot;this.controlsContainer=this.shadowRoot.getElementById("controlsContainer");this.clickToPlay=this.shadowRoot.getElementById("clickToPlay");this.noControlsOverlay=this.shadowRoot.getElementById("controlsContainer");let isMobile=this.window.navigator.appVersion.includes("Android");if(isMobile){this.controlsContainer.classList.add("mobile");}
this.isTouchControls=isMobile;if(this.isTouchControls){this.controlsContainer.classList.add("touch");}
this.clickToPlay.addEventListener("click",this,{mozSystemGroup:true,});for(let event of this.videoEvents){this.video.addEventListener(event,this,{capture:true,mozSystemGroup:true,});}},};this.Utils.init(this.shadowRoot);this.Utils.video.dispatchEvent(new this.window.CustomEvent("MozNoControlsVideoBindingAttached"));}
elementStateMatches(element){return true;}
destructor(){this.Utils.terminate();}
onPrefChange(prefName,prefValue){this.prefs[prefName]=prefValue;}
generateContent(){const parser=new this.window.DOMParser();parser.forceEnableDTD();let parserDoc=parser.parseFromString(`<!DOCTYPE bindings [
      <!ENTITY % videocontrolsDTD SYSTEM "chrome://global/locale/videocontrols.dtd">
      %videocontrolsDTD;
      ]>
      <div class="videocontrols" xmlns="http://www.w3.org/1999/xhtml" role="none">
        <link rel="stylesheet" href="chrome://global/skin/media/videocontrols.css" />
        <div id="controlsContainer" class="controlsContainer" role="none" hidden="true">
          <div class="controlsOverlay stackItem">
            <div class="controlsSpacerStack">
              <div id="clickToPlay" class="clickToPlay"></div>
            </div>
          </div>
        </div>
      </div>`,"application/xml");this.shadowRoot.importNodeAndAppendChildAt(this.shadowRoot,parserDoc.documentElement,true);}};this.NoControlsPictureInPictureImplWidget=class{constructor(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.prefs=prefs;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;}
onsetup(){this.generateContent();}
elementStateMatches(element){return true;}
destructor(){}
onPrefChange(prefName,prefValue){this.prefs[prefName]=prefValue;}
generateContent(){const parser=new this.window.DOMParser();parser.forceEnableDTD();let parserDoc=parser.parseFromString(`<!DOCTYPE bindings [
      <!ENTITY % videocontrolsDTD SYSTEM "chrome://global/locale/videocontrols.dtd">
      %videocontrolsDTD;
      ]>
      <div class="videocontrols" xmlns="http://www.w3.org/1999/xhtml" role="none">
        <link rel="stylesheet" href="chrome://global/skin/media/videocontrols.css" />
        <div id="controlsContainer" class="controlsContainer" role="none">
          <div class="pictureInPictureOverlay stackItem" status="pictureInPicture">
            <div id="statusIcon" class="statusIcon" type="pictureInPicture"></div>
            <bdi class="statusLabel" id="pictureInPicture">&status.pictureInPicture;</bdi>
          </div>
          <div class="controlsOverlay stackItem"></div>
        </div>
      </div>`,"application/xml");this.shadowRoot.importNodeAndAppendChildAt(this.shadowRoot,parserDoc.documentElement,true);}};this.NoControlsDesktopImplWidget=class{constructor(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;this.prefs=prefs;}
onsetup(){this.generateContent();this.Utils={handleEvent(event){switch(event.type){case"fullscreenchange":{if(this.document.fullscreenElement){this.videocontrols.setAttribute("inDOMFullscreen",true);}else{this.videocontrols.removeAttribute("inDOMFullscreen");}
break;}
case"resizevideocontrols":{this.updateReflowedDimensions();this.updatePictureInPictureToggleDisplay();break;}
case"durationchange": case"emptied": case"loadedmetadata":{this.updatePictureInPictureToggleDisplay();break;}}},updatePictureInPictureToggleDisplay(){if(this.pipToggleEnabled&&VideoControlsWidget.shouldShowPictureInPictureToggle(this.prefs,this.video,this.reflowedDimensions)){this.pictureInPictureToggle.removeAttribute("hidden");VideoControlsWidget.setupToggle(this.prefs,this.pictureInPictureToggle,this.reflowedDimensions);}else{this.pictureInPictureToggle.setAttribute("hidden",true);}},init(shadowRoot,prefs){this.shadowRoot=shadowRoot;this.prefs=prefs;this.video=shadowRoot.host;this.videocontrols=shadowRoot.firstChild;this.document=this.videocontrols.ownerDocument;this.window=this.document.defaultView;this.shadowRoot=shadowRoot;this.pictureInPictureToggle=this.shadowRoot.getElementById("pictureInPictureToggle");if(this.document.fullscreenElement){this.videocontrols.setAttribute("inDOMFullscreen",true);}

this.pictureInPictureToggle.setAttribute("hidden",true);if(this.video.readyState>=this.video.HAVE_METADATA){

 this.updatePictureInPictureToggleDisplay();}
this.document.addEventListener("fullscreenchange",this,{capture:true,});this.video.addEventListener("emptied",this);this.video.addEventListener("loadedmetadata",this);this.video.addEventListener("durationchange",this);this.videocontrols.addEventListener("resizevideocontrols",this);},terminate(){this.document.removeEventListener("fullscreenchange",this,{capture:true,});this.video.removeEventListener("emptied",this);this.video.removeEventListener("loadedmetadata",this);this.video.removeEventListener("durationchange",this);this.videocontrols.removeEventListener("resizevideocontrols",this);},updateReflowedDimensions(){this.reflowedDimensions.videoHeight=this.video.clientHeight;this.reflowedDimensions.videoWidth=this.video.clientWidth;this.reflowedDimensions.videocontrolsWidth=this.videocontrols.clientWidth;},reflowedDimensions:{
videoHeight:150,videoWidth:300,videocontrolsWidth:0,},get pipToggleEnabled(){return this.prefs["media.videocontrols.picture-in-picture.video-toggle.enabled"];},};this.Utils.init(this.shadowRoot,this.prefs);}
elementStateMatches(element){return true;}
destructor(){this.Utils.terminate();}
onPrefChange(prefName,prefValue){this.prefs[prefName]=prefValue;this.Utils.updatePictureInPictureToggleDisplay();}
generateContent(){const parser=new this.window.DOMParser();parser.forceEnableDTD();let parserDoc=parser.parseFromString(`<!DOCTYPE bindings [
      <!ENTITY % videocontrolsDTD SYSTEM "chrome://global/locale/videocontrols.dtd">
      %videocontrolsDTD;
      ]>
      <div class="videocontrols" xmlns="http://www.w3.org/1999/xhtml" role="none">
        <link rel="stylesheet" href="chrome://global/skin/media/videocontrols.css" />

        <div id="controlsContainer" class="controlsContainer" role="none">
          <div class="controlsOverlay stackItem">
            <button id="pictureInPictureToggle" class="pip-wrapper" position="left" hidden="true">
              <div class="pip-small clickable"></div>
              <div class="pip-expanded clickable">
                <span class="pip-icon-label clickable">
                  <span class="pip-icon"></span>
                  <span class="pip-label">&pictureInPictureToggle.label;</span>
                </span>
                <div class="pip-explainer clickable">
                  &pictureInPictureExplainer;
                </div>
              </div>
              <div class="pip-icon"></div>
            </button>
          </div>
        </div>
      </div>`,"application/xml");this.shadowRoot.importNodeAndAppendChildAt(this.shadowRoot,parserDoc.documentElement,true);}};