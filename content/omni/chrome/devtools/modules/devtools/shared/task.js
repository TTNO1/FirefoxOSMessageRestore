"use strict";const defer=require("devtools/shared/defer");
const ERRORS_TO_REPORT=["EvalError","RangeError","ReferenceError","TypeError",];var gCurrentTask=null;var gMaintainStack=false;function*linesOf(string){const reLine=/([^\r\n])+/g;let match;while((match=reLine.exec(string))){yield[match[0],match.index];}}
function isGenerator(value){return Object.prototype.toString.call(value)=="[object Generator]";} 
var Task={spawn:function(task){return createAsyncFunction(task)();},async:function(task){if(typeof task!="function"){throw new TypeError("task argument must be a function");}
return createAsyncFunction(task);},Result:function(value){this.value=value;},};function createAsyncFunction(task){const asyncFunction=function(){let result=task;if(task&&typeof task=="function"){if(task.isAsyncFunction){throw new TypeError("Cannot use an async function in place of a promise. "+"You should either invoke the async function first "+"or use 'Task.spawn' instead of 'Task.async' to start "+"the Task and return its promise.");}
try{result=task.apply(this,arguments);}catch(ex){if(ex instanceof Task.Result){return Promise.resolve(ex.value);}
return Promise.reject(ex);}}
if(isGenerator(result)){return new TaskImpl(result).deferred.promise;}
return Promise.resolve(result);};asyncFunction.isAsyncFunction=true;return asyncFunction;} 
function TaskImpl(iterator){if(gMaintainStack){this._stack=new Error().stack;}
this.deferred=defer();this._iterator=iterator;this._isStarGenerator=!("send"in iterator);this._run(true);}
TaskImpl.prototype={deferred:null,_iterator:null,_isStarGenerator:false,_run:function(sendResolved,sendValue){try{gCurrentTask=this;if(this._isStarGenerator){try{const result=sendResolved?this._iterator.next(sendValue):this._iterator.throw(sendValue);if(result.done){this.deferred.resolve(result.value);}else{this._handleResultValue(result.value);}}catch(ex){this._handleException(ex);}}else{try{const yielded=sendResolved?this._iterator.send(sendValue):this._iterator.throw(sendValue);this._handleResultValue(yielded);}catch(ex){if(ex instanceof Task.Result){
this.deferred.resolve(ex.value);}else if(ex instanceof StopIteration){this.deferred.resolve(undefined);}else{this._handleException(ex);}}}}finally{





if(gCurrentTask==this){gCurrentTask=null;}}},_handleResultValue:function(value){

if(isGenerator(value)){value=Task.spawn(value);}
if(value&&typeof value.then=="function"){

value.then(this._run.bind(this,true),this._run.bind(this,false));}else{
this._run(true,value);}},_handleException:function(exception){gCurrentTask=this;if(exception&&typeof exception=="object"&&"stack"in exception){let stack=exception.stack;if(gMaintainStack&&exception._capturedTaskStack!=this._stack&&typeof stack=="string"){const bottomStack=this._stack;stack=Task.Debugging.generateReadableStack(stack);exception.stack=stack;exception._capturedTaskStack=bottomStack;}else if(!stack){stack="Not available";}
if("name"in exception&&ERRORS_TO_REPORT.includes(exception.name)){


dump("*************************\n");dump("A coding exception was thrown and uncaught in a Task.\n\n");dump("Full message: "+exception+"\n");dump("Full stack: "+exception.stack+"\n");dump("*************************\n");}}
this.deferred.reject(exception);},get callerStack(){
for(const[line,index]of linesOf(this._stack||"")){if(!line.includes("/task.js:")){return this._stack.substring(index);}}
return"";},};Task.Debugging={get maintainStack(){return gMaintainStack;},set maintainStack(x){if(!x){gCurrentTask=null;}
gMaintainStack=x;return x;},generateReadableStack:function(topStack,prefix=""){if(!gCurrentTask){return topStack;}
const lines=[];for(const[line]of linesOf(topStack)){if(line.includes("/task.js:")){break;}
lines.push(prefix+line);}
if(!prefix){lines.push(gCurrentTask.callerStack);}else{for(const[line]of linesOf(gCurrentTask.callerStack)){lines.push(prefix+line);}}
return lines.join("\n");},};exports.Task=Task;