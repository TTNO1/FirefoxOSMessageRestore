
"use strict";const{Cu,components}=require("chrome");function getNthPathExcluding(n,substr){let stack=components.stack.formattedStack.split("\n"); stack=stack.splice(1);stack=stack.map(line=>{if(line.includes(" -> ")){return line.split(" -> ")[1];}
return line;});if(substr){stack=stack.filter(line=>{return line&&!line.includes(substr);});}
if(!stack[n]){n=0;}
return stack[n]||"";}
function getStack(){return components.stack.caller;}
function callFunctionWithAsyncStack(callee,stack,id){if(isWorker){return callee();}
return Cu.callFunctionWithAsyncStack(callee,stack,id);}
exports.callFunctionWithAsyncStack=callFunctionWithAsyncStack;exports.getNthPathExcluding=getNthPathExcluding;exports.getStack=getStack;