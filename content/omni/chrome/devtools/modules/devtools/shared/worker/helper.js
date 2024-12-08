"use strict";(function(root,factory){if(typeof define==="function"&&define.amd){define(factory);}else if(typeof exports==="object"){module.exports=factory();}else{root.workerHelper=factory();}})(this,function(){function createTask(self,name,fn){ if(!self._tasks){self._tasks={};}
if(!self.onmessage){self.onmessage=createHandler(self);}
self._tasks[name]=fn;}
function createHandler(self){return function(e){const{id,task,data}=e.data;const taskFn=self._tasks[task];if(!taskFn){self.postMessage({id,error:`Task "${task}" not found in worker.`});return;}
try{handleResponse(taskFn(data));}catch(ex){handleError(ex);}
function handleResponse(response){ if(response&&typeof response.then==="function"){response.then(val=>self.postMessage({id,response:val}),handleError);}else if(response instanceof Error){ handleError(response);}else{ self.postMessage({id,response});}}
function handleError(error="Error"){try{self.postMessage({id,error});}catch(x){
let errorString=`Error while performing task "${task}": `;try{errorString+=error.toString();}catch(ex){errorString+="<could not stringify error>";}
if("stack"in error){try{errorString+="\n"+error.stack;}catch(err){}}
self.postMessage({id,error:errorString});}}};}
return{createTask:createTask};});