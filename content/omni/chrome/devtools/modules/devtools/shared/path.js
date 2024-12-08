"use strict";exports.joinURI=(initialPath,...paths)=>{let url;try{url=new URL(initialPath);}catch(e){return null;}
for(const path of paths){if(path){url=new URL(path,url);}}
return url.href;};