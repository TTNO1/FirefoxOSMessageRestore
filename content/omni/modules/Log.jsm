//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["Log"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const INTERNAL_FIELDS=new Set(["_level","_message","_time","_namespace"]);function dumpError(text){dump(text+"\n");Cu.reportError(text);}
var Log={Level:{Fatal:70,Error:60,Warn:50,Info:40,Config:30,Debug:20,Trace:10,All:-1,Desc:{70:"FATAL",60:"ERROR",50:"WARN",40:"INFO",30:"CONFIG",20:"DEBUG",10:"TRACE","-1":"ALL",},Numbers:{FATAL:70,ERROR:60,WARN:50,INFO:40,CONFIG:30,DEBUG:20,TRACE:10,ALL:-1,},},get repository(){delete Log.repository;Log.repository=new LoggerRepository();return Log.repository;},set repository(value){delete Log.repository;Log.repository=value;},_formatError(e){let result=String(e);if(e.fileName){let loc=[e.fileName];if(e.lineNumber){loc.push(e.lineNumber);}
if(e.columnNumber){loc.push(e.columnNumber);}
result+=`(${loc.join(":")})`;}
return`${result} ${Log.stackTrace(e)}`;},
 exceptionStr(e){if(!e){return String(e);}
if(e instanceof Ci.nsIException){return`${e} ${Log.stackTrace(e)}`;}else if(isError(e)){return Log._formatError(e);} 
let message=e.message||e;return`${message} ${Log.stackTrace(e)}`;},stackTrace(e){ if(e.location){let frame=e.location;let output=[];while(frame){

 let str="<file:unknown>";let file=frame.filename||frame.fileName;if(file){str=file.replace(/^(?:chrome|file):.*?([^\/\.]+\.\w+)$/,"$1");}
if(frame.lineNumber){str+=":"+frame.lineNumber;}
if(frame.name){str=frame.name+"()@"+str;}
if(str){output.push(str);}
frame=frame.caller;}
return`Stack trace: ${output.join("\n")}`;} 
if(e.stack){let stack=e.stack;return("JS Stack trace: "+
stack.trim().replace(/@[^@]*?([^\/\.]+\.\w+:)/g,"@$1"));}
return"No traceback available";},};class LogMessage{constructor(loggerName,level,message,params){this.loggerName=loggerName;this.level=level;if(!params&&message&&typeof message=="object"&&typeof message.valueOf()!="string"){this.message=null;this.params=message;}else{ this.message=message;this.params=params;}

this._structured=this.params&&this.params.action;this.time=Date.now();}
get levelDesc(){if(this.level in Log.Level.Desc){return Log.Level.Desc[this.level];}
return"UNKNOWN";}
toString(){let msg=`${this.time} ${this.level} ${this.message}`;if(this.params){msg+=` ${JSON.stringify(this.params)}`;}
return`LogMessage [${msg}]`;}}
class Logger{constructor(name,repository){if(!repository){repository=Log.repository;}
this._name=name;this.children=[];this.ownAppenders=[];this.appenders=[];this._repository=repository;this._levelPrefName=null;this._levelPrefValue=null;this._level=null;this._parent=null;}
get name(){return this._name;}
get level(){if(this._levelPrefName){
const lpv=this._levelPrefValue;if(lpv){const levelValue=Log.Level[lpv];if(levelValue){
this._level=levelValue;return levelValue;}}else{
this._level=null;}}
if(this._level!=null){return this._level;}
if(this.parent){return this.parent.level;}
dumpError("Log warning: root logger configuration error: no level defined");return Log.Level.All;}
set level(level){if(this._levelPrefName){
dumpError(`Log warning: The log '${this.name}' is configured to use `+`the preference '${this._levelPrefName}' - you must adjust `+`the level by setting this preference, not by using the `+`level setter`);return;}
this._level=level;}
get parent(){return this._parent;}
set parent(parent){if(this._parent==parent){return;} 
if(this._parent){let index=this._parent.children.indexOf(this);if(index!=-1){this._parent.children.splice(index,1);}}
this._parent=parent;parent.children.push(this);this.updateAppenders();}
manageLevelFromPref(prefName){if(prefName==this._levelPrefName){return;}
if(this._levelPrefName){dumpError(`The log '${this.name}' is already configured with the `+`preference '${this._levelPrefName}' - ignoring request to `+`also use the preference '${prefName}'`);return;}
this._levelPrefName=prefName;XPCOMUtils.defineLazyPreferenceGetter(this,"_levelPrefValue",prefName);}
updateAppenders(){if(this._parent){let notOwnAppenders=this._parent.appenders.filter(function(appender){return!this.ownAppenders.includes(appender);},this);this.appenders=notOwnAppenders.concat(this.ownAppenders);}else{this.appenders=this.ownAppenders.slice();}
for(let i=0;i<this.children.length;i++){this.children[i].updateAppenders();}}
addAppender(appender){if(this.ownAppenders.includes(appender)){return;}
this.ownAppenders.push(appender);this.updateAppenders();}
removeAppender(appender){let index=this.ownAppenders.indexOf(appender);if(index==-1){return;}
this.ownAppenders.splice(index,1);this.updateAppenders();}
_unpackTemplateLiteral(string,params){if(!Array.isArray(params)){return[string,params];}
if(!Array.isArray(string)){
return[string,params[0]];}



if(!params.length){
return[string[0],undefined];}
let concat=string[0];for(let i=0;i<params.length;i++){concat+=`\${${i}}${string[i + 1]}`;}
return[concat,params];}
log(level,string,params){if(this.level>level){return;}

let message;let appenders=this.appenders;for(let appender of appenders){if(appender.level>level){continue;}
if(!message){[string,params]=this._unpackTemplateLiteral(string,params);message=new LogMessage(this._name,level,string,params);}
appender.append(message);}}
fatal(string,...params){this.log(Log.Level.Fatal,string,params);}
error(string,...params){this.log(Log.Level.Error,string,params);}
warn(string,...params){this.log(Log.Level.Warn,string,params);}
info(string,...params){this.log(Log.Level.Info,string,params);}
config(string,...params){this.log(Log.Level.Config,string,params);}
debug(string,...params){this.log(Log.Level.Debug,string,params);}
trace(string,...params){this.log(Log.Level.Trace,string,params);}}
class LoggerRepository{constructor(){this._loggers={};this._rootLogger=null;}
get rootLogger(){if(!this._rootLogger){this._rootLogger=new Logger("root",this);this._rootLogger.level=Log.Level.All;}
return this._rootLogger;}
set rootLogger(logger){throw new Error("Cannot change the root logger");}
_updateParents(name){let pieces=name.split(".");let cur,parent;

 for(let i=0;i<pieces.length-1;i++){if(cur){cur+="."+pieces[i];}else{cur=pieces[i];}
if(cur in this._loggers){parent=cur;}} 
if(!parent){this._loggers[name].parent=this.rootLogger;}else{this._loggers[name].parent=this._loggers[parent];} 
for(let logger in this._loggers){if(logger!=name&&logger.indexOf(name)==0){this._updateParents(logger);}}}
getLogger(name){if(name in this._loggers){return this._loggers[name];}
this._loggers[name]=new Logger(name,this);this._updateParents(name);return this._loggers[name];}
getLoggerWithMessagePrefix(name,prefix){let log=this.getLogger(name);let proxy=Object.create(log);proxy.log=(level,string,params)=>{if(Array.isArray(string)&&Array.isArray(params)){string=[prefix+string[0]].concat(string.slice(1));}else{string=prefix+string;}
return log.log(level,string,params);};return proxy;}}
class BasicFormatter{constructor(dateFormat){if(dateFormat){this.dateFormat=dateFormat;}
this.parameterFormatter=new ParameterFormatter();}
formatText(message){let params=message.params;if(typeof params=="undefined"){return message.message||"";}

let pIsObject=typeof params=="object"||typeof params=="function";if(this.parameterFormatter){ let subDone=false;let regex=/\$\{(\S*?)\}/g;let textParts=[];if(message.message){textParts.push(message.message.replace(regex,(_,sub)=>{if(sub){if(pIsObject&&sub in message.params){subDone=true;return this.parameterFormatter.format(message.params[sub]);}
return"${"+sub+"}";}
subDone=true;return this.parameterFormatter.format(message.params);}));}
if(!subDone){ let rest=this.parameterFormatter.format(message.params);if(rest!==null&&rest!="{}"){textParts.push(rest);}}
return textParts.join(": ");}
return undefined;}
format(message){return(message.time+"\t"+
message.loggerName+"\t"+
message.levelDesc+"\t"+
this.formatText(message));}}
function isError(aObj){return(aObj&&typeof aObj=="object"&&"name"in aObj&&"message"in aObj&&"fileName"in aObj&&"lineNumber"in aObj&&"stack"in aObj);}
class ParameterFormatter{constructor(){this._name="ParameterFormatter";}
format(ob){try{if(ob===undefined){return"undefined";}
if(ob===null){return"null";}
if((typeof ob!="object"||typeof ob.valueOf()!="object")&&typeof ob!="function"){return ob;}
if(ob instanceof Ci.nsIException){return`${ob} ${Log.stackTrace(ob)}`;}else if(isError(ob)){return Log._formatError(ob);}

return JSON.stringify(ob,(key,val)=>{if(INTERNAL_FIELDS.has(key)){return undefined;}
return val;});}catch(e){dumpError(`Exception trying to format object for log message: ${Log.exceptionStr(
          e
        )}`);}
try{return ob.toSource();}catch(_){}
try{return String(ob);}catch(_){return"[object]";}}}
class Appender{constructor(formatter){this.level=Log.Level.All;this._name="Appender";this._formatter=formatter||new BasicFormatter();}
append(message){if(message){this.doAppend(this._formatter.format(message));}}
toString(){return`${this._name} [level=${this.level}, formatter=${this._formatter}]`;}}
class DumpAppender extends Appender{constructor(formatter){super(formatter);this._name="DumpAppender";}
doAppend(formatted){dump(formatted+"\n");}}
class ConsoleAppender extends Appender{constructor(formatter){super(formatter);this._name="ConsoleAppender";} 
append(message){if(message){let m=this._formatter.format(message);if(message.level>Log.Level.Warn){Cu.reportError(m);return;}
this.doAppend(m);}}
doAppend(formatted){Services.console.logStringMessage(formatted);}}
Object.assign(Log,{LogMessage,Logger,LoggerRepository,BasicFormatter,Appender,DumpAppender,ConsoleAppender,ParameterFormatter,});