//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"console","resource://gre/modules/Console.jsm");var EXPORTED_SYMBOLS=["EventEmitter"];let EventEmitter=(this.EventEmitter=function(){});let loggingEnabled=Services.prefs.getBoolPref("toolkit.dump.emit");Services.prefs.addObserver("toolkit.dump.emit",{observe:()=>{loggingEnabled=Services.prefs.getBoolPref("toolkit.dump.emit");},});EventEmitter.decorate=function(objectToDecorate){let emitter=new EventEmitter();objectToDecorate.on=emitter.on.bind(emitter);objectToDecorate.off=emitter.off.bind(emitter);objectToDecorate.once=emitter.once.bind(emitter);objectToDecorate.emit=emitter.emit.bind(emitter);};function describeNthCaller(n){let caller=Components.stack;while(n>=0){--n;caller=caller.caller;}
let func=caller.name;let file=caller.filename;if(file.includes(" -> ")){file=caller.filename.split(/ -> /)[1];}
let path=file+":"+caller.lineNumber;return func+"() -> "+path;}
EventEmitter.prototype={on(event,listener){if(!this._eventEmitterListeners){this._eventEmitterListeners=new Map();}
if(!this._eventEmitterListeners.has(event)){this._eventEmitterListeners.set(event,[]);}
this._eventEmitterListeners.get(event).push(listener);},once(event,listener){return new Promise(resolve=>{let handler=(_,first,...rest)=>{this.off(event,handler);if(listener){listener(event,first,...rest);}
resolve(first);};handler._originalListener=listener;this.on(event,handler);});},off(event,listener){if(!this._eventEmitterListeners){return;}
let listeners=this._eventEmitterListeners.get(event);if(listeners){this._eventEmitterListeners.set(event,listeners.filter(l=>{return l!==listener&&l._originalListener!==listener;}));}},emit(event){this.logEvent(event,arguments);if(!this._eventEmitterListeners||!this._eventEmitterListeners.has(event)){return;}
let originalListeners=this._eventEmitterListeners.get(event);for(let listener of this._eventEmitterListeners.get(event)){
if(!this._eventEmitterListeners){break;}

if(originalListeners===this._eventEmitterListeners.get(event)||this._eventEmitterListeners.get(event).some(l=>l===listener)){try{listener.apply(null,arguments);}catch(ex){let msg=ex+": "+ex.stack;console.error(msg);if(loggingEnabled){dump(msg+"\n");}}}}},logEvent(event,args){if(!loggingEnabled){return;}
let description=describeNthCaller(2);let argOut="(";if(args.length===1){argOut+=event;}
let out="EMITTING: ";try{for(let i=1;i<args.length;i++){if(i===1){argOut="("+event+", ";}else{argOut+=", ";}
let arg=args[i];argOut+=arg;if(arg&&arg.nodeName){argOut+=" ("+arg.nodeName;if(arg.id){argOut+="#"+arg.id;}
if(arg.className){argOut+="."+arg.className;}
argOut+=")";}}}catch(e){}
argOut+=")";out+="emit"+argOut+" from "+description+"\n";dump(out);},};