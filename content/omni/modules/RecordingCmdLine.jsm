//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
function RecordingCmdLineHandler(){}
RecordingCmdLineHandler.prototype={QueryInterface:ChromeUtils.generateQI(["nsICommandLineHandler"]),handle:function handler_handle(cmdLine){var args={};args.wrappedJSObject=args;try{var uristr=cmdLine.handleFlagWithParam("recording",false);if(uristr==null){return;}
try{args.uri=cmdLine.resolveURI(uristr).spec;}catch(e){return;}}catch(e){cmdLine.handleFlag("recording",true);}
var prefs=Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);var branch=prefs.getDefaultBranch("");try{var outputstr=cmdLine.handleFlagWithParam("recording-output",false);if(outputstr!=null){branch.setCharPref("gfx.2d.recordingfile",outputstr);}}catch(e){}
branch.setBoolPref("gfx.2d.recording",true);var wwatch=Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);wwatch.openWindow(null,"chrome://recording/content/recording.xhtml","_blank","chrome,dialog=no,all",args);cmdLine.preventDefault=true;},helpInfo:"  --recording <file> Record drawing for a given URL.\n"+"  --recording-output <file> Specify destination file for a drawing recording.\n",};var EXPORTED_SYMBOLS=["RecordingCmdLineHandler"];