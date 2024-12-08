"use strict";const Services=require("Services");const{getCSSLexer}=require("devtools/shared/css/lexer");const{cssColors}=require("devtools/shared/css/color-db");loader.lazyRequireGetter(this,"CSS_ANGLEUNIT","devtools/shared/css/constants",true);loader.lazyRequireGetter(this,"getAngleValueInDegrees","devtools/shared/css/parsing-utils",true);const COLOR_UNIT_PREF="devtools.defaultColorUnit";const SPECIALVALUES=new Set(["currentcolor","initial","inherit","transparent","unset",]);function CssColor(colorValue,supportsCssColor4ColorFunction=false){this.newColor(colorValue);this.cssColor4=supportsCssColor4ColorFunction;}
module.exports.colorUtils={CssColor:CssColor,rgbToHsl:rgbToHsl,rgbToLab:rgbToLab,setAlpha:setAlpha,classifyColor:classifyColor,rgbToColorName:rgbToColorName,colorToRGBA:colorToRGBA,isValidCSSColor:isValidCSSColor,calculateContrastRatio:calculateContrastRatio,calculateDeltaE:calculateDeltaE,calculateLuminance:calculateLuminance,blendColors:blendColors,};CssColor.COLORUNIT={authored:"authored",hex:"hex",name:"name",rgb:"rgb",hsl:"hsl",};CssColor.prototype={_colorUnit:null,_colorUnitUppercase:false,authored:null,lowerCased:null,cssColor4:false,_setColorUnitUppercase:function(color){

this._colorUnitUppercase=color===color.toUpperCase()&&color!==color.toLowerCase();},get colorUnit(){if(this._colorUnit===null){const defaultUnit=Services.prefs.getCharPref(COLOR_UNIT_PREF);this._colorUnit=CssColor.COLORUNIT[defaultUnit];this._setColorUnitUppercase(this.authored);}
return this._colorUnit;},set colorUnit(unit){this._colorUnit=unit;},setAuthoredUnitFromColor:function(color){if(Services.prefs.getCharPref(COLOR_UNIT_PREF)===CssColor.COLORUNIT.authored){this._colorUnit=classifyColor(color);this._setColorUnitUppercase(color);}},get hasAlpha(){if(!this.valid){return false;}
return this.getRGBATuple().a!==1;},get valid(){return isValidCSSColor(this.authored,this.cssColor4);},get highResTuple(){const type=classifyColor(this.authored);if(type===CssColor.COLORUNIT.hex){return hexToRGBA(this.authored.substring(1),true);}

const tuple=colorToRGBA(this.authored);tuple.a*=255;return tuple;},get transparent(){try{const tuple=this.getRGBATuple();return!(tuple.r||tuple.g||tuple.b||tuple.a);}catch(e){return false;}},get specialValue(){return SPECIALVALUES.has(this.lowerCased)?this.authored:null;},get name(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
const tuple=this.getRGBATuple();if(tuple.a!==1){return this.hex;}
const{r,g,b}=tuple;return rgbToColorName(r,g,b)||this.hex;},get hex(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(this.hasAlpha){return this.alphaHex;}
let hex=this.longHex;if(hex.charAt(1)==hex.charAt(2)&&hex.charAt(3)==hex.charAt(4)&&hex.charAt(5)==hex.charAt(6)){hex="#"+hex.charAt(1)+hex.charAt(3)+hex.charAt(5);}
return hex;},get alphaHex(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
let alphaHex=this.longAlphaHex;if(alphaHex.charAt(1)==alphaHex.charAt(2)&&alphaHex.charAt(3)==alphaHex.charAt(4)&&alphaHex.charAt(5)==alphaHex.charAt(6)&&alphaHex.charAt(7)==alphaHex.charAt(8)){alphaHex="#"+
alphaHex.charAt(1)+
alphaHex.charAt(3)+
alphaHex.charAt(5)+
alphaHex.charAt(7);}
return alphaHex;},get longHex(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(this.hasAlpha){return this.longAlphaHex;}
const tuple=this.getRGBATuple();return("#"+
((1<<24)+(tuple.r<<16)+(tuple.g<<8)+(tuple.b<<0)).toString(16).substr(-6));},get longAlphaHex(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
const tuple=this.highResTuple;return("#"+
((1<<24)+(tuple.r<<16)+(tuple.g<<8)+(tuple.b<<0)).toString(16).substr(-6)+
Math.round(tuple.a).toString(16).padStart(2,"0"));},get rgb(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(!this.hasAlpha){if(this.lowerCased.startsWith("rgb(")){return this.authored;}
const tuple=this.getRGBATuple();return"rgb("+tuple.r+", "+tuple.g+", "+tuple.b+")";}
return this.rgba;},get rgba(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(this.lowerCased.startsWith("rgba(")){return this.authored;}
const components=this.getRGBATuple();return("rgba("+
components.r+", "+
components.g+", "+
components.b+", "+
components.a+")");},get hsl(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(this.lowerCased.startsWith("hsl(")){return this.authored;}
if(this.hasAlpha){return this.hsla;}
return this._hsl();},get hsla(){const invalidOrSpecialValue=this._getInvalidOrSpecialValue();if(invalidOrSpecialValue!==false){return invalidOrSpecialValue;}
if(this.lowerCased.startsWith("hsla(")){return this.authored;}
if(this.hasAlpha){const a=this.getRGBATuple().a;return this._hsl(a);}
return this._hsl(1);},_getInvalidOrSpecialValue:function(){if(this.specialValue){return this.specialValue;}
if(!this.valid){return"";}
return false;},newColor:function(color){

this.lowerCased=color.toLowerCase();this.authored=color;this._setColorUnitUppercase(color);return this;},nextColorUnit:function(){
let formats=["hex","hsl","rgb","name"];const currentFormat=classifyColor(this.toString());const putOnEnd=formats.splice(0,formats.indexOf(currentFormat));formats=[...formats,...putOnEnd];const currentDisplayedColor=this[formats[0]];for(const format of formats){if(this[format].toLowerCase()!==currentDisplayedColor.toLowerCase()){this.colorUnit=CssColor.COLORUNIT[format];break;}}
return this.toString();},toString:function(){let color;switch(this.colorUnit){case CssColor.COLORUNIT.authored:color=this.authored;break;case CssColor.COLORUNIT.hex:color=this.hex;break;case CssColor.COLORUNIT.hsl:color=this.hsl;break;case CssColor.COLORUNIT.name:color=this.name;break;case CssColor.COLORUNIT.rgb:color=this.rgb;break;default:color=this.rgb;}
if(this._colorUnitUppercase&&this.colorUnit!=CssColor.COLORUNIT.authored){color=color.toUpperCase();}
return color;},getRGBATuple:function(){const tuple=colorToRGBA(this.authored,this.cssColor4);tuple.a=parseFloat(tuple.a.toFixed(2));return tuple;},_getHSLATuple:function(){const{r,g,b,a}=colorToRGBA(this.authored,this.cssColor4);const[h,s,l]=rgbToHsl([r,g,b]);return{h,s,l,a:parseFloat(a.toFixed(2)),};},_hsl:function(maybeAlpha){if(this.lowerCased.startsWith("hsl(")&&maybeAlpha===undefined){return this.authored;}
const{r,g,b}=this.getRGBATuple();const[h,s,l]=rgbToHsl([r,g,b]);if(maybeAlpha!==undefined){return"hsla("+h+", "+s+"%, "+l+"%, "+maybeAlpha+")";}
return"hsl("+h+", "+s+"%, "+l+"%)";},valueOf:function(){return this.rgba;},isTransparent:function(){return this.getRGBATuple().a===0;},};function rgbToHsl([r,g,b]){r=r/255;g=g/255;b=b/255;const max=Math.max(r,g,b);const min=Math.min(r,g,b);let h;let s;const l=(max+min)/2;if(max==min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}
h*=60;if(h<0){h+=360;}}
return[roundTo(h,1),roundTo(s*100,1),roundTo(l*100,1)];}
function rgbToLab([r,g,b]){r=r/255;g=g/255;b=b/255;r=r>0.04045?Math.pow((r+0.055)/1.055,2.4):r/12.92;g=g>0.04045?Math.pow((g+0.055)/1.055,2.4):g/12.92;b=b>0.04045?Math.pow((b+0.055)/1.055,2.4):b/12.92;r=r*100;g=g*100;b=b*100;let[x,y,z]=[r*0.4124+g*0.3576+b*0.1805,r*0.2126+g*0.7152+b*0.0722,r*0.0193+g*0.1192+b*0.9505,];
 x=x/94.811;y=y/100;z=z/107.304;x=x>0.008856?Math.pow(x,1/3):7.787*x+16/116;y=y>0.008856?Math.pow(y,1/3):7.787*y+16/116;z=z>0.008856?Math.pow(z,1/3):7.787*z+16/116;return[116*y-16,500*(x-y),200*(y-z)];}
function calculateDeltaE([l1,a1,b1],[l2,a2,b2]){return Math.sqrt(Math.pow(l1-l2,2)+Math.pow(a1-a2,2)+Math.pow(b1-b2,2));}
function roundTo(number,digits){const multiplier=Math.pow(10,digits);return Math.round(number*multiplier)/multiplier;}
function setAlpha(colorValue,alpha,useCssColor4ColorFunction=false){const color=new CssColor(colorValue,useCssColor4ColorFunction);if(!color.valid){throw new Error("Invalid color.");}
if(!(alpha>=0&&alpha<=1)){alpha=1;}
const{r,g,b}=color.getRGBATuple();return"rgba("+r+", "+g+", "+b+", "+alpha+")";}
function classifyColor(value){value=value.toLowerCase();if(value.startsWith("rgb(")||value.startsWith("rgba(")){return CssColor.COLORUNIT.rgb;}else if(value.startsWith("hsl(")||value.startsWith("hsla(")){return CssColor.COLORUNIT.hsl;}else if(/^#[0-9a-f]+$/.exec(value)){return CssColor.COLORUNIT.hex;}
return CssColor.COLORUNIT.name;}

var cssRGBMap;function rgbToColorName(r,g,b){if(!cssRGBMap){cssRGBMap={};for(const name in cssColors){const key=JSON.stringify(cssColors[name]);if(!(key in cssRGBMap)){cssRGBMap[key]=name;}}}
return cssRGBMap[JSON.stringify([r,g,b,1])]||"";}
function _hslValue(m1,m2,h){if(h<0.0){h+=1.0;}
if(h>1.0){h-=1.0;}
if(h<1.0/6.0){return m1+(m2-m1)*h*6.0;}
if(h<1.0/2.0){return m2;}
if(h<2.0/3.0){return m1+(m2-m1)*(2.0/3.0-h)*6.0;}
return m1;}

function hslToRGB([h,s,l]){let m2;if(l<=0.5){m2=l*(s+1);}else{m2=l+s-l*s;}
const m1=l*2-m2;const r=Math.round(255*_hslValue(m1,m2,h+1.0/3.0));const g=Math.round(255*_hslValue(m1,m2,h));const b=Math.round(255*_hslValue(m1,m2,h-1.0/3.0));return[r,g,b];}
function hexToRGBA(name,highResolution){let r,g,b,a=1;if(name.length===3){r=parseInt(name.charAt(0)+name.charAt(0),16);g=parseInt(name.charAt(1)+name.charAt(1),16);b=parseInt(name.charAt(2)+name.charAt(2),16);}else if(name.length===4){r=parseInt(name.charAt(0)+name.charAt(0),16);g=parseInt(name.charAt(1)+name.charAt(1),16);b=parseInt(name.charAt(2)+name.charAt(2),16);a=parseInt(name.charAt(3)+name.charAt(3),16);if(!highResolution){a/=255;}}else if(name.length===6){r=parseInt(name.charAt(0)+name.charAt(1),16);g=parseInt(name.charAt(2)+name.charAt(3),16);b=parseInt(name.charAt(4)+name.charAt(5),16);}else if(name.length===8){r=parseInt(name.charAt(0)+name.charAt(1),16);g=parseInt(name.charAt(2)+name.charAt(3),16);b=parseInt(name.charAt(4)+name.charAt(5),16);a=parseInt(name.charAt(6)+name.charAt(7),16);if(!highResolution){a/=255;}}else{return null;}
if(!highResolution){a=Math.round(a*10)/10;}
return{r,g,b,a};}
function clamp(value,min,max){if(value<min){value=min;}
if(value>max){value=max;}
return value;}
function getToken(lexer){if(lexer._hasPushBackToken){lexer._hasPushBackToken=false;return lexer._currentToken;}
while(true){const token=lexer.nextToken();if(!token||(token.tokenType!=="comment"&&token.tokenType!=="whitespace")){lexer._currentToken=token;return token;}}}
function unGetToken(lexer){if(lexer._hasPushBackToken){throw new Error("Double pushback.");}
lexer._hasPushBackToken=true;}
function expectSymbol(lexer,symbol){const token=getToken(lexer);if(!token){return false;}
if(token.tokenType!=="symbol"||token.text!==symbol){unGetToken(lexer);return false;}
return true;}
const COLOR_COMPONENT_TYPE={integer:"integer",number:"number",percentage:"percentage",};function parseColorComponent(lexer,type,separator,colorArray){const token=getToken(lexer);if(!token){return false;}
switch(type){case COLOR_COMPONENT_TYPE.integer:if(token.tokenType!=="number"||!token.isInteger){return false;}
break;case COLOR_COMPONENT_TYPE.number:if(token.tokenType!=="number"){return false;}
break;case COLOR_COMPONENT_TYPE.percentage:if(token.tokenType!=="percentage"){return false;}
break;default:throw new Error("Invalid color component type.");}
let colorComponent=0;if(type===COLOR_COMPONENT_TYPE.percentage){colorComponent=clamp(token.number,0,1);}else{colorComponent=clamp(token.number,0,255);}
if(separator!==""&&!expectSymbol(lexer,separator)){return false;}
colorArray.push(colorComponent);return true;}
function parseColorOpacityAndCloseParen(lexer,separator,colorArray){
if(expectSymbol(lexer,")")){colorArray.push(1);return true;}
if(!expectSymbol(lexer,separator)){return false;}
const token=getToken(lexer);if(!token){return false;}
if(token.tokenType!=="number"&&token.tokenType!=="percentage"){return false;}
if(!expectSymbol(lexer,")")){return false;}
colorArray.push(clamp(token.number,0,1));return true;}
function parseHue(lexer,colorArray){const token=getToken(lexer);if(!token){return false;}
let val=0;if(token.tokenType==="number"){val=token.number;}else if(token.tokenType==="dimension"&&token.text in CSS_ANGLEUNIT){val=getAngleValueInDegrees(token.number,token.text);}else{return false;}
val=val/360.0;colorArray.push(val-Math.floor(val));return true;}
function parseHsl(lexer){
const commaSeparator=",";const hsl=[];const a=[];if(!parseHue(lexer,hsl)){return null;}

const hasComma=expectSymbol(lexer,commaSeparator);
const separatorBeforeAlpha=hasComma?commaSeparator:"/";if(parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,hasComma?commaSeparator:"",hsl)&&parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,"",hsl)&&parseColorOpacityAndCloseParen(lexer,separatorBeforeAlpha,a)){return[...hslToRGB(hsl),...a];}
return null;}
function parseOldStyleHsl(lexer,hasAlpha){
const commaSeparator=",";const closeParen=")";const hsl=[];const a=[];const token=getToken(lexer);if(!token||token.tokenType!=="number"){return null;}
if(!expectSymbol(lexer,commaSeparator)){return null;}
const val=token.number/360.0;hsl.push(val-Math.floor(val));if(hasAlpha){if(parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,commaSeparator,hsl)&&parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,commaSeparator,hsl)&&parseColorComponent(lexer,COLOR_COMPONENT_TYPE.number,closeParen,a)){return[...hslToRGB(hsl),...a];}}else if(parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,commaSeparator,hsl)&&parseColorComponent(lexer,COLOR_COMPONENT_TYPE.percentage,closeParen,hsl)){return[...hslToRGB(hsl),1];}
return null;}
function parseRgb(lexer){
const commaSeparator=",";const rgba=[];const token=getToken(lexer);if(token.tokenType!=="percentage"&&token.tokenType!=="number"){return null;}
unGetToken(lexer);const type=token.tokenType==="percentage"?COLOR_COMPONENT_TYPE.percentage:COLOR_COMPONENT_TYPE.number;if(!parseColorComponent(lexer,type,"",rgba)){return null;}
const hasComma=expectSymbol(lexer,commaSeparator);
const separatorBeforeAlpha=hasComma?commaSeparator:"/";if(parseColorComponent(lexer,type,hasComma?commaSeparator:"",rgba)&&parseColorComponent(lexer,type,"",rgba)&&parseColorOpacityAndCloseParen(lexer,separatorBeforeAlpha,rgba)){if(type===COLOR_COMPONENT_TYPE.percentage){rgba[0]=Math.round(255*rgba[0]);rgba[1]=Math.round(255*rgba[1]);rgba[2]=Math.round(255*rgba[2]);}
return rgba;}
return null;}
function parseOldStyleRgb(lexer,hasAlpha){
const commaSeparator=",";const closeParen=")";const rgba=[];const token=getToken(lexer);if(token.tokenType!=="percentage"&&(token.tokenType!=="number"||!token.isInteger)){return null;}
unGetToken(lexer);const type=token.tokenType==="percentage"?COLOR_COMPONENT_TYPE.percentage:COLOR_COMPONENT_TYPE.integer;if(hasAlpha){if(!parseColorComponent(lexer,type,commaSeparator,rgba)||!parseColorComponent(lexer,type,commaSeparator,rgba)||!parseColorComponent(lexer,type,commaSeparator,rgba)||!parseColorComponent(lexer,COLOR_COMPONENT_TYPE.number,closeParen,rgba)){return null;}}else if(!parseColorComponent(lexer,type,commaSeparator,rgba)||!parseColorComponent(lexer,type,commaSeparator,rgba)||!parseColorComponent(lexer,type,closeParen,rgba)){return null;}
if(type===COLOR_COMPONENT_TYPE.percentage){rgba[0]=Math.round(255*rgba[0]);rgba[1]=Math.round(255*rgba[1]);rgba[2]=Math.round(255*rgba[2]);}
if(!hasAlpha){rgba.push(1);}
return rgba;}
function colorToRGBA(name,useCssColor4ColorFunction=false,toArray=false){name=name.trim().toLowerCase();if(name in cssColors){const result=cssColors[name];return{r:result[0],g:result[1],b:result[2],a:result[3]};}else if(name==="transparent"){return{r:0,g:0,b:0,a:0};}else if(name==="currentcolor"){return{r:0,g:0,b:0,a:1};}
const lexer=getCSSLexer(name);const func=getToken(lexer);if(!func){return null;}
if(func.tokenType==="id"||func.tokenType==="hash"){if(getToken(lexer)!==null){return null;}
return hexToRGBA(func.text);}
const expectedFunctions=["rgba","rgb","hsla","hsl"];if(!func||func.tokenType!=="function"||!expectedFunctions.includes(func.text)){return null;}
const hsl=func.text==="hsl"||func.text==="hsla";let vals;if(!useCssColor4ColorFunction){const hasAlpha=func.text==="rgba"||func.text==="hsla";vals=hsl?parseOldStyleHsl(lexer,hasAlpha):parseOldStyleRgb(lexer,hasAlpha);}else{vals=hsl?parseHsl(lexer):parseRgb(lexer);}
if(!vals){return null;}
if(getToken(lexer)!==null){return null;}
return toArray?vals:{r:vals[0],g:vals[1],b:vals[2],a:vals[3]};}
function isValidCSSColor(name,useCssColor4ColorFunction=false){return colorToRGBA(name,useCssColor4ColorFunction)!==null;}
function calculateLuminance(rgba){for(let i=0;i<3;i++){rgba[i]/=255;rgba[i]=rgba[i]<0.03928?rgba[i]/12.92:Math.pow((rgba[i]+0.055)/1.055,2.4);}
return 0.2126*rgba[0]+0.7152*rgba[1]+0.0722*rgba[2];}
function blendColors(foregroundColor,backgroundColor=[255,255,255,1]){const[fgR,fgG,fgB,fgA]=foregroundColor;const[bgR,bgG,bgB,bgA]=backgroundColor;if(fgA===1){return foregroundColor;}
return[(1-fgA)*bgR+fgA*fgR,(1-fgA)*bgG+fgA*fgG,(1-fgA)*bgB+fgA*fgB,fgA+bgA*(1-fgA),];}
function calculateContrastRatio(backgroundColor,textColor){backgroundColor=Array.from(backgroundColor);textColor=Array.from(textColor);backgroundColor=blendColors(backgroundColor);textColor=blendColors(textColor,backgroundColor);const backgroundLuminance=calculateLuminance(backgroundColor);const textLuminance=calculateLuminance(textColor);const ratio=(textLuminance+0.05)/(backgroundLuminance+0.05);return ratio>1.0?ratio:1/ratio;}