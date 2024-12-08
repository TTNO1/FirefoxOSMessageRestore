"use strict";const DevToolsUtils=require("devtools/shared/DevToolsUtils");loader.lazyRequireGetter(this,"Reflect","resource://gre/modules/reflect.jsm",true);function getSyntaxTrees(source,logExceptions){
const regexp=/<script[^>]*?(?:>([^]*?)<\/script\s*>|\/>)/gim;const syntaxTrees=[];const scriptMatches=[];let scriptMatch;if(source.match(/^\s*</)){while((scriptMatch=regexp.exec(source))){
 scriptMatches.push(scriptMatch[1]||"");}}

if(!scriptMatches.length){try{syntaxTrees.push(Reflect.parse(source));}catch(e){if(logExceptions){DevToolsUtils.reportException("Parser:get",e);}}}else{for(const script of scriptMatches){try{syntaxTrees.push(Reflect.parse(script));}catch(e){if(logExceptions){DevToolsUtils.reportException("Parser:get",e);}}}}
return syntaxTrees;}
exports.getSyntaxTrees=getSyntaxTrees;