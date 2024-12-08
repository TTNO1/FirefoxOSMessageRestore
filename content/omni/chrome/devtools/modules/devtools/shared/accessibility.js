"use strict";loader.lazyRequireGetter(this,"colorUtils","devtools/shared/css/color",true);const{accessibility:{SCORES:{FAIL,AA,AAA},},}=require("devtools/shared/constants");const LEVELS={LARGE_TEXT:{AA:3,AAA:4.5},REGULAR_TEXT:{AA:4.5,AAA:7},};const LARGE_TEXT={
BOLD_LARGE_TEXT_MIN_PIXELS:18.66,
LARGE_TEXT_MIN_PIXELS:24,};function getContrastRatioScore(ratio,isLargeText){const levels=isLargeText?LEVELS.LARGE_TEXT:LEVELS.REGULAR_TEXT;let score=FAIL;if(ratio>=levels.AAA){score=AAA;}else if(ratio>=levels.AA){score=AA;}
return score;}
function getTextProperties(computedStyle){const{color,fontSize,fontWeight}=computedStyle;let{r,g,b,a}=colorUtils.colorToRGBA(color,true);

const opacity=computedStyle.opacity?parseFloat(computedStyle.opacity):null;if(opacity){a=opacity*a;}
const textRgbaColor=new colorUtils.CssColor(`rgba(${r}, ${g}, ${b}, ${a})`,true);



if(textRgbaColor.isTransparent()){return null;}
const isBoldText=parseInt(fontWeight,10)>=600;const size=parseFloat(fontSize);const isLargeText=size>=(isBoldText?LARGE_TEXT.BOLD_LARGE_TEXT_MIN_PIXELS:LARGE_TEXT.LARGE_TEXT_MIN_PIXELS);return{color:[r,g,b,a],isLargeText,isBoldText,size,opacity,};}
function getContrastRatioAgainstBackground(backgroundColorData,{color,isLargeText}){if(backgroundColorData.value){const value=colorUtils.calculateContrastRatio(backgroundColorData.value,color);return{value,color,backgroundColor:backgroundColorData.value,isLargeText,score:getContrastRatioScore(value,isLargeText),};}
let{min:backgroundColorMin,max:backgroundColorMax,}=backgroundColorData;let min=colorUtils.calculateContrastRatio(backgroundColorMin,color);let max=colorUtils.calculateContrastRatio(backgroundColorMax,color);if(min>max){[min,max]=[max,min];[backgroundColorMin,backgroundColorMax]=[backgroundColorMax,backgroundColorMin,];}
const score=getContrastRatioScore(min,isLargeText);return{min,max,color,backgroundColorMin,backgroundColorMax,isLargeText,score,scoreMin:score,scoreMax:getContrastRatioScore(max,isLargeText),};}
exports.getContrastRatioScore=getContrastRatioScore;exports.getTextProperties=getTextProperties;exports.getContrastRatioAgainstBackground=getContrastRatioAgainstBackground;exports.LARGE_TEXT=LARGE_TEXT;