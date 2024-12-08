//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["Color"];const CONTRAST_RATIO_LEVELS={A:3,AA:4.5,AAA:7,};const CONTRAST_BRIGHTTEXT_THRESHOLD=Math.sqrt(1.05*0.05)-0.05;class Color{constructor(r,g,b){this.r=r;this.g=g;this.b=b;}
get relativeLuminance(){let colorArr=[this.r,this.g,this.b].map(color=>{color=parseInt(color,10);if(color<=10){return color/255/12.92;}
return Math.pow((color/255+0.055)/1.055,2.4);});return colorArr[0]*0.2126+colorArr[1]*0.7152+colorArr[2]*0.0722;}
get useBrightText(){return this.relativeLuminance<=CONTRAST_BRIGHTTEXT_THRESHOLD;}
contrastRatio(otherColor){if(!(otherColor instanceof Color)){throw new TypeError("The first argument should be an instance of Color");}
let luminance=this.relativeLuminance;let otherLuminance=otherColor.relativeLuminance;return((Math.max(luminance,otherLuminance)+0.05)/(Math.min(luminance,otherLuminance)+0.05));}
isContrastRatioAcceptable(otherColor,level="AA"){return this.contrastRatio(otherColor)>CONTRAST_RATIO_LEVELS[level];}}