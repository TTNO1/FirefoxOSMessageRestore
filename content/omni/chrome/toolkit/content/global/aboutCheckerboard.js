"use strict";var trace;var service;var reports;function onLoad(){trace=document.getElementById("trace");service=new CheckerboardReportService();updateEnabled();reports=service.getReports();for(let i=0;i<reports.length;i++){let text="Severity "+
reports[i].severity+" at "+
new Date(reports[i].timestamp).toString();let link=document.createElement("a");link.href="#";link.addEventListener("click",function(){showReport(i);return false;});link.textContent=text;let bullet=document.createElement("li");bullet.appendChild(link);document.getElementById(reports[i].reason).appendChild(bullet);}}
function updateEnabled(){let enabled=document.getElementById("enabled");let isEnabled=service.isRecordingEnabled();if(isEnabled){enabled.textContent="enabled";}else{enabled.textContent="disabled";}
enabled.classList.toggle("enabled",isEnabled);}
function toggleEnabled(){service.setRecordingEnabled(!service.isRecordingEnabled());updateEnabled();}
function flushReports(){service.flushActiveReports();}
function showReport(index){trace.value=reports[index].log;loadData();}
const CANVAS_USE_RATIO=0.75;const FRAME_INTERVAL_MS=50;const VECTOR_NORMALIZED_MAGNITUDE=30.0;var renderData=[];var currentFrame=0;var playing=false;var timerId=0;var minX=undefined;var minY=undefined;var maxX=undefined;var maxY=undefined;function log(x){if(console){console.log(x);}}
function getFlag(flag){return document.getElementById(flag).checked;}


function loadData(){stopPlay();renderData=[];currentFrame=0;minX=undefined;minY=undefined;maxX=undefined;maxY=undefined;var charPos=0;var lastLineLength=0;var lines=trace.value.split(/\r|\n/);for(var i=0;i<lines.length;i++){charPos+=lastLineLength;lastLineLength=lines[i].length+1; if(!/RENDERTRACE/.test(lines[i])){continue;}
var tokens=lines[i].split(/\s+/);var j=0;
 while(j<tokens.length&&tokens[j++]!="RENDERTRACE"){} 
if(j>=tokens.length-2){log("Error parsing line: "+lines[i]);continue;}
var timestamp=tokens[j++];var destIndex=renderData.length;if(destIndex==0){ renderData.push({timestamp,rects:{},});}else if(renderData[destIndex-1].timestamp==timestamp){ destIndex--;}else{ renderData.push(JSON.parse(JSON.stringify(renderData[destIndex-1])));renderData[destIndex].timestamp=timestamp;}
switch(tokens[j++]){case"rect":if(j>tokens.length-5){log("Error parsing line: "+lines[i]);continue;}
var rect={};var color=tokens[j++];renderData[destIndex].rects[color]=rect;rect.x=parseFloat(tokens[j++]);rect.y=parseFloat(tokens[j++]);rect.width=parseFloat(tokens[j++]);rect.height=parseFloat(tokens[j++]);rect.dataText=trace.value.substring(charPos,charPos+lines[i].length);if(!getFlag("excludePageFromZoom")||color!="brown"){if(typeof minX=="undefined"){minX=rect.x;minY=rect.y;maxX=rect.x+rect.width;maxY=rect.y+rect.height;}else{minX=Math.min(minX,rect.x);minY=Math.min(minY,rect.y);maxX=Math.max(maxX,rect.x+rect.width);maxY=Math.max(maxY,rect.y+rect.height);}}
break;default:log("Error parsing line "+lines[i]);break;}}
if(!renderFrame()){alert("No data found; nothing to render!");}}
function renderFrame(){var frame=currentFrame;if(frame<0||frame>=renderData.length){log("Invalid frame index");return false;}
var canvas=document.getElementById("canvas");if(!canvas.getContext){log("No canvas context");}
var context=canvas.getContext("2d"); var midX=(minX+maxX)/2.0;var midY=(minY+maxY)/2.0; var cmx=canvas.width/2.0;var cmy=canvas.height/2.0; var scale=CANVAS_USE_RATIO*Math.min(canvas.width/(maxX-minX),canvas.height/(maxY-minY));function projectX(value){return cmx+(value-midX)*scale;}
function projectY(value){return cmy+(value-midY)*scale;}
function drawRect(color,rect){context.strokeStyle=color;context.strokeRect(projectX(rect.x),projectY(rect.y),rect.width*scale,rect.height*scale);} 
context.fillStyle="white";context.fillRect(0,0,canvas.width,canvas.height);var activeData=""; for(var i in renderData[frame].rects){drawRect(i,renderData[frame].rects[i]);activeData+="\n"+renderData[frame].rects[i].dataText;} 
context.fillStyle="black";context.fillText(frame+1+"/"+renderData.length+": "+renderData[frame].timestamp,5,15);document.getElementById("active").textContent=activeData;return true;}
function reset(beginning){currentFrame=beginning?0:renderData.length-1;renderFrame();}
function step(backwards){if(playing){togglePlay();}
currentFrame+=backwards?-1:1;if(!renderFrame()){currentFrame-=backwards?-1:1;}}
function pause(){clearInterval(timerId);playing=false;}
function togglePlay(){if(playing){pause();}else{timerId=setInterval(function(){currentFrame++;if(!renderFrame()){currentFrame--;togglePlay();}},FRAME_INTERVAL_MS);playing=true;}}
function stopPlay(){if(playing){togglePlay();}
currentFrame=0;renderFrame();}
document.getElementById("pauseButton").addEventListener("click",togglePlay);document.getElementById("stopButton").addEventListener("click",stopPlay);document.getElementById("enableToggleButton").addEventListener("click",toggleEnabled);document.getElementById("flushReportsButton").addEventListener("click",flushReports);document.getElementById("excludePageFromZoom").addEventListener("click",loadData);document.getElementById("stepForwardButton").addEventListener("click",function(){step(false);});document.getElementById("forwardButton").addEventListener("click",function(){reset(false);});document.getElementById("rewindButton").addEventListener("click",function(){reset(true);});document.getElementById("stepBackButton").addEventListener("click",function(){step(true);});window.addEventListener("load",onLoad);