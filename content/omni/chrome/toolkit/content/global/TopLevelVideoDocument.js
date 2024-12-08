"use strict";
{ let videoElement=document.getElementsByTagName("video")[0];let setFocusToVideoElement=function(e){


if(e&&e.target==videoElement){return;}
videoElement.focus();};
document.addEventListener("focus",setFocusToVideoElement,true);setFocusToVideoElement();let observer=new MutationObserver(()=>{observer.disconnect();document.removeEventListener("focus",setFocusToVideoElement,true);});observer.observe(document.documentElement,{childList:true,subtree:true,}); document.addEventListener("keypress",ev=>{ if(ev.key=="F11"&&videoElement.videoWidth!=0&&videoElement.videoHeight!=0){
if(window.fullScreen){return;}
ev.preventDefault();ev.stopPropagation();if(!document.fullscreenElement){videoElement.requestFullscreen();}else{document.exitFullscreen();}}});}