"use strict";importScripts("resource://gre/modules/workers/require.js");const{createTask}=require("resource://devtools/shared/worker/helper.js");createTask(self,"getBgRGBA",({dataTextBuf,dataBackgroundBuf})=>getBgRGBA(dataTextBuf,dataBackgroundBuf));function calculateLuminance(rgba){for(let i=0;i<3;i++){rgba[i]/=255;rgba[i]=rgba[i]<0.03928?rgba[i]/12.92:Math.pow((rgba[i]+0.055)/1.055,2.4);}
return 0.2126*rgba[0]+0.7152*rgba[1]+0.0722*rgba[2];}
function getBgRGBA(dataTextBuf,dataBackgroundBuf){let min=[0,0,0,1];let max=[255,255,255,1];let minLuminance=1;let maxLuminance=0;const luminances={};const dataText=new Uint8ClampedArray(dataTextBuf);const dataBackground=new Uint8ClampedArray(dataBackgroundBuf);let foundDistinctColor=false;for(let i=0;i<dataText.length;i=i+4){const tR=dataText[i];const bgR=dataBackground[i];const tG=dataText[i+1];const bgG=dataBackground[i+1];const tB=dataText[i+2];const bgB=dataBackground[i+2];
if(tR===bgR&&tG===bgG&&tB===bgB){continue;}
foundDistinctColor=true;const bgColor=`rgb(${bgR}, ${bgG}, ${bgB})`;let luminance=luminances[bgColor];if(!luminance){luminance=calculateLuminance([bgR,bgG,bgB]);luminances[bgColor]=luminance;}
if(minLuminance>=luminance){minLuminance=luminance;min=[bgR,bgG,bgB,1];}
if(maxLuminance<=luminance){maxLuminance=luminance;max=[bgR,bgG,bgB,1];}}
if(!foundDistinctColor){return null;}
return minLuminance===maxLuminance?{value:max}:{min,max};}