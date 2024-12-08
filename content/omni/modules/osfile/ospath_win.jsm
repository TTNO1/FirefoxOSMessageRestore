"use strict";
if(typeof Components!="undefined"){
this.exports={};}else if(typeof module=="undefined"||typeof exports=="undefined"){throw new Error("Please load this module using require()");}
var EXPORTED_SYMBOLS=["basename","dirname","join","normalize","split","winGetDrive","winIsAbsolute","toFileURI","fromFileURI",];var basename=function(path){if(path.startsWith("\\\\")){ let index=path.lastIndexOf("\\");if(index!=1){return path.slice(index+1);}
return"";}
return path.slice(Math.max(path.lastIndexOf("\\"),path.lastIndexOf(":"))+1);};exports.basename=basename;var dirname=function(path,options){let noDrive=options&&options.winNoDrive;let index=path.lastIndexOf("\\");if(index==-1){if(!noDrive){return this.winGetDrive(path)||".";}
return".";}
if(index==1&&path.charAt(0)=="\\"){ if(noDrive){return".";}
return path;} 
while(index>=0&&path[index]=="\\"){--index;} 
let start;if(noDrive){start=(this.winGetDrive(path)||"").length;}else{start=0;}
return path.slice(start,index+1);};exports.dirname=dirname;var join=function(...path){let paths=[];let root;let absolute=false;for(let subpath of path){if(subpath==null){throw new TypeError("invalid path component");}
if(subpath==""){continue;}
let drive=this.winGetDrive(subpath);if(drive){root=drive;let component=trimBackslashes(subpath.slice(drive.length));if(component){paths=[component];}else{paths=[];}
absolute=true;}else if(this.winIsAbsolute(subpath)){paths=[trimBackslashes(subpath)];absolute=true;}else{paths.push(trimBackslashes(subpath));}}
let result="";if(root){result+=root;}
if(absolute){result+="\\";}
result+=paths.join("\\");return result;};exports.join=join;var winGetDrive=function(path){if(path==null){throw new TypeError("path is invalid");}
if(path.startsWith("\\\\")){ if(path.length==2){return null;}
let index=path.indexOf("\\",2);if(index==-1){return path;}
return path.slice(0,index);} 
let index=path.indexOf(":");if(index<=0){return null;}
return path.slice(0,index+1);};exports.winGetDrive=winGetDrive;var winIsAbsolute=function(path){let index=path.indexOf(":");return path.length>index+1&&path[index+1]=="\\";};exports.winIsAbsolute=winIsAbsolute;var normalize=function(path){let stack=[];if(!path.startsWith("\\\\")){path=path.replace(/\//g,"\\");}
let root=this.winGetDrive(path);if(root){path=path.slice(root.length);}
let absolute=this.winIsAbsolute(path);path.split("\\").forEach(function loop(v){switch(v){case"":case".": break;case"..":if(!stack.length){if(absolute){throw new Error("Path is ill-formed: attempting to go past root");}else{stack.push("..");}}else if(stack[stack.length-1]==".."){stack.push("..");}else{stack.pop();}
break;default:stack.push(v);}}); let result=stack.join("\\");if(absolute||root){result="\\"+result;}
if(root){result=root+result;}
return result;};exports.normalize=normalize;var split=function(path){return{absolute:this.winIsAbsolute(path),winDrive:this.winGetDrive(path),components:path.split("\\"),};};exports.split=split;var toFileURIExtraEncodings={";":"%3b","?":"%3F","#":"%23"};var toFileURI=function toFileURI(path){ path=this.normalize(path).replace(/[\\\/]/g,m=>m=="\\"?"/":"%2F"); let dontNeedEscaping={"%5B":"[","%5D":"]"};let uri=encodeURI(path).replace(/%(5B|5D)/gi,match=>dontNeedEscaping[match]);
 let prefix="file:///";uri=prefix+uri.replace(/[;?#]/g,match=>toFileURIExtraEncodings[match]);if(uri.charAt(uri.length-1)===":"){uri+="/";}
return uri;};exports.toFileURI=toFileURI;var fromFileURI=function fromFileURI(uri){let url=new URL(uri);if(url.protocol!="file:"){throw new Error("fromFileURI expects a file URI");} 
uri=url.pathname.substr(1);let path=decodeURI(uri); path=path.replace(/%(3b|3f|23)/gi,match=>decodeURIComponent(match));path=this.normalize(path);
if(path.endsWith(":\\")){path=path.substr(0,path.length-1);}
return this.normalize(path);};exports.fromFileURI=fromFileURI;var trimBackslashes=function trimBackslashes(string){return string.replace(/^\\+|\\+$/g,"");};if(typeof Components!="undefined"){this.EXPORTED_SYMBOLS=EXPORTED_SYMBOLS;for(let symbol of EXPORTED_SYMBOLS){this[symbol]=exports[symbol];}}