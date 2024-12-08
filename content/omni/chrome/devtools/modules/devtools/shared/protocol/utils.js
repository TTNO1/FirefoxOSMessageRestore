"use strict";function findPlaceholders(template,constructor,path=[],placeholders=[]){if(!template||typeof template!="object"){return placeholders;}
if(template instanceof constructor){placeholders.push({placeholder:template,path:[...path]});return placeholders;}
for(const name in template){path.push(name);findPlaceholders(template[name],constructor,path,placeholders);path.pop();}
return placeholders;}
exports.findPlaceholders=findPlaceholders;function getPath(obj,path){for(const name of path){if(!(name in obj)){return undefined;}
obj=obj[name];}
return obj;}
exports.getPath=getPath;