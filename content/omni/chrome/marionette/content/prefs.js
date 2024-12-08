"use strict";const EXPORTED_SYMBOLS=["Branch","MarionettePrefs"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{Log:"resource://gre/modules/Log.jsm",});XPCOMUtils.defineLazyServiceGetter(this,"env","@mozilla.org/process/environment;1","nsIEnvironment");const{PREF_BOOL,PREF_INT,PREF_INVALID,PREF_STRING}=Ci.nsIPrefBranch;class Branch{constructor(branch){this._branch=Services.prefs.getBranch(branch);}
get(pref,fallback=null){switch(this._branch.getPrefType(pref)){case PREF_STRING:return this._branch.getStringPref(pref);case PREF_BOOL:return this._branch.getBoolPref(pref);case PREF_INT:return this._branch.getIntPref(pref);case PREF_INVALID:default:if(fallback!=null){return fallback;}
throw new TypeError(`Unrecognised preference: ${pref}`);}}
set(pref,value){let typ;if(typeof value!="undefined"&&value!=null){typ=value.constructor.name;}
switch(typ){case"String": return this._branch.setStringPref(pref,value);case"Boolean":return this._branch.setBoolPref(pref,value);case"Number":return this._branch.setIntPref(pref,value);default:throw new TypeError(`Illegal preference type value: ${typ}`);}}}
class MarionetteBranch extends Branch{constructor(branch="marionette."){super(branch);}
get enabled(){return this.get("enabled",false);}
set enabled(isEnabled){this.set("enabled",isEnabled);}
get clickToStart(){return this.get("debugging.clicktostart",false);}
get contentListener(){return this.get("contentListener",false);}
set contentListener(value){this.set("contentListener",value);}
get port(){return this.get("port",2828);}
set port(newPort){this.set("port",newPort);}
get logLevel(){switch(this.get("log.level","info").toLowerCase()){case"fatal":return Log.Level.Fatal;case"error":return Log.Level.Error;case"warn":return Log.Level.Warn;case"config":return Log.Level.Config;case"debug":return Log.Level.Debug;case"trace":return Log.Level.Trace;case"info":default:dump(`*** log: ${Log}\n\n`);return Log.Level.Info;}}
get truncateLog(){return this.get("log.truncate");}
get recommendedPrefs(){return this.get("prefs.recommended",true);}
get useActors(){return this.get("actors.enabled",false);}}
class EnvironmentPrefs{static*from(key){if(!env.exists(key)){return;}
let prefs;try{prefs=JSON.parse(env.get(key));}catch(e){throw new TypeError(`Unable to parse prefs from ${key}`,e);}
for(let prefName of Object.keys(prefs)){yield[prefName,prefs[prefName]];}}}
this.Branch=Branch;this.EnvironmentPrefs=EnvironmentPrefs;
this.MarionettePrefs=new MarionetteBranch();