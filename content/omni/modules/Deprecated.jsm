//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["Deprecated"];const PREF_DEPRECATION_WARNINGS="devtools.errorconsole.deprecation_warnings";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var logWarnings=Services.prefs.getBoolPref(PREF_DEPRECATION_WARNINGS);Services.prefs.addObserver(PREF_DEPRECATION_WARNINGS,function(aSubject,aTopic,aData){logWarnings=Services.prefs.getBoolPref(PREF_DEPRECATION_WARNINGS);});function stringifyCallstack(aStack){if(!aStack||!(aStack instanceof Ci.nsIStackFrame)){aStack=Components.stack.caller;}
let frame=aStack.caller;let msg="";while(frame){msg+=frame.filename+" "+frame.lineNumber+" "+frame.name+"\n";frame=frame.caller;}
return msg;}
var Deprecated={warning(aText,aUrl,aStack){if(!logWarnings){return;}
if(!aUrl){Cu.reportError("Error in Deprecated.warning: warnings must "+"provide a URL documenting this deprecation.");return;}
let textMessage="DEPRECATION WARNING: "+
aText+"\nYou may find more details about this deprecation at: "+
aUrl+"\n"+
stringifyCallstack(aStack);Cu.reportError(textMessage);},};