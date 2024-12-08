//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["console","ConsoleAPI"];ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");var gTimerRegistry=new Map();function fmt(aStr,aMaxLen,aMinLen,aOptions){if(aMinLen==null){aMinLen=aMaxLen;}
if(aStr==null){aStr="";}
if(aStr.length>aMaxLen){if(aOptions&&aOptions.truncate=="start"){return"_"+aStr.substring(aStr.length-aMaxLen+1);}else if(aOptions&&aOptions.truncate=="center"){let start=aStr.substring(0,aMaxLen/2);let end=aStr.substring(aStr.length-aMaxLen/2+1);return start+"_"+end;}
return aStr.substring(0,aMaxLen-1)+"_";}
if(aStr.length<aMinLen){let padding=Array(aMinLen-aStr.length+1).join(" ");aStr=aOptions.align==="end"?padding+aStr:aStr+padding;}
return aStr;}
function getCtorName(aObj){if(aObj===null){return"null";}
if(aObj===undefined){return"undefined";}
if(aObj.constructor&&aObj.constructor.name){return aObj.constructor.name;}
 
return Object.prototype.toString.call(aObj).slice(8,-1);}
function isError(aThing){return(aThing&&((typeof aThing.name=="string"&&aThing.name.startsWith("NS_ERROR_"))||getCtorName(aThing).endsWith("Error")));}
function stringify(aThing,aAllowNewLines){if(aThing===undefined){return"undefined";}
if(aThing===null){return"null";}
if(isError(aThing)){return"Message: "+aThing;}
if(typeof aThing=="object"){let type=getCtorName(aThing);if(Element.isInstance(aThing)){return debugElement(aThing);}
type=type=="Object"?"":type+" ";let json;try{json=JSON.stringify(aThing);}catch(ex){ json="{"+Object.keys(aThing).join(":..,")+":.., }";}
return type+json;}
if(typeof aThing=="function"){return aThing.toString().replace(/\s+/g," ");}
let str=aThing.toString();if(!aAllowNewLines){str=str.replace(/\n/g,"|");}
return str;}
function debugElement(aElement){return("<"+
aElement.tagName+
(aElement.id?"#"+aElement.id:"")+
(aElement.className&&aElement.className.split?"."+aElement.className.split(" ").join(" ."):"")+">");}
function log(aThing){if(aThing===null){return"null\n";}
if(aThing===undefined){return"undefined\n";}
if(typeof aThing=="object"){let reply="";let type=getCtorName(aThing);if(type=="Map"){reply+="Map\n";for(let[key,value]of aThing){reply+=logProperty(key,value);}}else if(type=="Set"){let i=0;reply+="Set\n";for(let value of aThing){reply+=logProperty(""+i,value);i++;}}else if(isError(aThing)){reply+="  Message: "+aThing+"\n";if(aThing.stack){reply+="  Stack:\n";var frame=aThing.stack;while(frame){reply+="    "+frame+"\n";frame=frame.caller;}}}else if(Element.isInstance(aThing)){reply+="  "+debugElement(aThing)+"\n";}else{let keys=Object.getOwnPropertyNames(aThing);if(keys.length){reply+=type+"\n";keys.forEach(function(aProp){reply+=logProperty(aProp,aThing[aProp]);});}else{reply+=type+"\n";let root=aThing;let logged=[];while(root!=null){let properties=Object.keys(root);properties.sort();properties.forEach(function(property){if(!(property in logged)){logged[property]=property;reply+=logProperty(property,aThing[property]);}});root=Object.getPrototypeOf(root);if(root!=null){reply+="  - prototype "+getCtorName(root)+"\n";}}}}
return reply;}
return"  "+aThing.toString()+"\n";}
function logProperty(aProp,aValue){let reply="";if(aProp=="stack"&&typeof value=="string"){let trace=parseStack(aValue);reply+=formatTrace(trace);}else{reply+="    - "+aProp+" = "+stringify(aValue)+"\n";}
return reply;}
const LOG_LEVELS={all:Number.MIN_VALUE,debug:2,log:3,info:3,clear:3,trace:3,timeEnd:3,time:3,assert:3,group:3,groupEnd:3,profile:3,profileEnd:3,dir:3,dirxml:3,warn:4,error:5,off:Number.MAX_VALUE,};function shouldLog(aLevel,aMaxLevel){return LOG_LEVELS[aMaxLevel]<=LOG_LEVELS[aLevel];}
function parseStack(aStack){let trace=[];aStack.split("\n").forEach(function(line){if(!line){return;}
let at=line.lastIndexOf("@");let posn=line.substring(at+1);trace.push({filename:posn.split(":")[0],lineNumber:posn.split(":")[1],functionName:line.substring(0,at),});});return trace;}
function getStack(aFrame,aMaxDepth=0){if(!aFrame){aFrame=Components.stack.caller;}
let trace=[];while(aFrame){trace.push({filename:aFrame.filename,lineNumber:aFrame.lineNumber,functionName:aFrame.name,language:aFrame.language,});if(aMaxDepth==trace.length){break;}
aFrame=aFrame.caller;}
return trace;}
function formatTrace(aTrace){let reply="";aTrace.forEach(function(frame){reply+=fmt(frame.filename,20,20,{truncate:"start"})+" "+
fmt(frame.lineNumber,5,5)+" "+
fmt(frame.functionName,75,0,{truncate:"center"})+"\n";});return reply;}
function startTimer(aName,aTimestamp){let key=aName.toString();if(!gTimerRegistry.has(key)){gTimerRegistry.set(key,aTimestamp||Date.now());}
return{name:aName,started:gTimerRegistry.get(key)};}
function stopTimer(aName,aTimestamp){let key=aName.toString();let duration=(aTimestamp||Date.now())-gTimerRegistry.get(key);gTimerRegistry.delete(key);return{name:aName,duration};}
function dumpMessage(aConsole,aLevel,aMessage){aConsole.dump("console."+
aLevel+": "+
(aConsole.prefix?aConsole.prefix+": ":"")+
aMessage+"\n");}
function createDumper(aLevel){return function(){if(!shouldLog(aLevel,this.maxLogLevel)){return;}
let args=Array.prototype.slice.call(arguments,0);let frame=getStack(Components.stack.caller,1)[0];sendConsoleAPIMessage(this,aLevel,frame,args);let data=args.map(function(arg){return stringify(arg,true);});dumpMessage(this,aLevel,data.join(" "));};}
function createMultiLineDumper(aLevel){return function(){if(!shouldLog(aLevel,this.maxLogLevel)){return;}
dumpMessage(this,aLevel,"");let args=Array.prototype.slice.call(arguments,0);let frame=getStack(Components.stack.caller,1)[0];sendConsoleAPIMessage(this,aLevel,frame,args);args.forEach(function(arg){this.dump(log(arg));},this);};}
function sendConsoleAPIMessage(aConsole,aLevel,aFrame,aArgs,aOptions={}){let consoleEvent={ID:"jsm",innerID:aConsole.innerID||aFrame.filename,consoleID:aConsole.consoleID,level:aLevel,filename:aFrame.filename,lineNumber:aFrame.lineNumber,functionName:aFrame.functionName,timeStamp:Date.now(),arguments:aArgs,prefix:aConsole.prefix,chromeContext:true,};consoleEvent.wrappedJSObject=consoleEvent;switch(aLevel){case"trace":consoleEvent.stacktrace=aOptions.stacktrace;break;case"time":case"timeEnd":consoleEvent.timer=aOptions.timer;break;case"group":case"groupCollapsed":case"groupEnd":try{consoleEvent.groupName=Array.prototype.join.call(aArgs," ");}catch(ex){Cu.reportError(ex);Cu.reportError(ex.stack);return;}
break;}
let ConsoleAPIStorage=Cc["@mozilla.org/consoleAPI-storage;1"].getService(Ci.nsIConsoleAPIStorage);if(ConsoleAPIStorage){ConsoleAPIStorage.recordEvent("jsm",null,consoleEvent);}}
function ConsoleAPI(aConsoleOptions={}){
this.dump=aConsoleOptions.dump||dump;this.prefix=aConsoleOptions.prefix||"";this.maxLogLevel=aConsoleOptions.maxLogLevel;this.innerID=aConsoleOptions.innerID||null;this.consoleID=aConsoleOptions.consoleID||""; let updateMaxLogLevel=()=>{if(Services.prefs.getPrefType(aConsoleOptions.maxLogLevelPref)==Services.prefs.PREF_STRING){this._maxLogLevel=Services.prefs.getCharPref(aConsoleOptions.maxLogLevelPref).toLowerCase();}else{this._maxLogLevel=this._maxExplicitLogLevel;}};if(aConsoleOptions.maxLogLevelPref){updateMaxLogLevel();Services.prefs.addObserver(aConsoleOptions.maxLogLevelPref,updateMaxLogLevel);}
for(let prop in this){if(typeof this[prop]==="function"){this[prop]=this[prop].bind(this);}}}
ConsoleAPI.prototype={_maxExplicitLogLevel:null,_maxLogLevel:null,debug:createMultiLineDumper("debug"),assert:createDumper("assert"),log:createDumper("log"),info:createDumper("info"),warn:createDumper("warn"),error:createMultiLineDumper("error"),exception:createMultiLineDumper("error"),trace:function Console_trace(){if(!shouldLog("trace",this.maxLogLevel)){return;}
let args=Array.prototype.slice.call(arguments,0);let trace=getStack(Components.stack.caller);sendConsoleAPIMessage(this,"trace",trace[0],args,{stacktrace:trace});dumpMessage(this,"trace","\n"+formatTrace(trace));},clear:function Console_clear(){},dir:createMultiLineDumper("dir"),dirxml:createMultiLineDumper("dirxml"),group:createDumper("group"),groupEnd:createDumper("groupEnd"),time:function Console_time(){if(!shouldLog("time",this.maxLogLevel)){return;}
let args=Array.prototype.slice.call(arguments,0);let frame=getStack(Components.stack.caller,1)[0];let timer=startTimer(args[0]);sendConsoleAPIMessage(this,"time",frame,args,{timer});dumpMessage(this,"time","'"+timer.name+"' @ "+new Date());},timeEnd:function Console_timeEnd(){if(!shouldLog("timeEnd",this.maxLogLevel)){return;}
let args=Array.prototype.slice.call(arguments,0);let frame=getStack(Components.stack.caller,1)[0];let timer=stopTimer(args[0]);sendConsoleAPIMessage(this,"timeEnd",frame,args,{timer});dumpMessage(this,"timeEnd","'"+timer.name+"' "+timer.duration+"ms");},profile(profileName){if(!shouldLog("profile",this.maxLogLevel)){return;}
Services.obs.notifyObservers({wrappedJSObject:{action:"profile",arguments:[profileName],chromeContext:true,},},"console-api-profiler");dumpMessage(this,"profile",`'${profileName}'`);},profileEnd(profileName){if(!shouldLog("profileEnd",this.maxLogLevel)){return;}
Services.obs.notifyObservers({wrappedJSObject:{action:"profileEnd",arguments:[profileName],chromeContext:true,},},"console-api-profiler");dumpMessage(this,"profileEnd",`'${profileName}'`);},get maxLogLevel(){return this._maxLogLevel||"all";},set maxLogLevel(aValue){this._maxLogLevel=this._maxExplicitLogLevel=aValue;},};var console=new ConsoleAPI();