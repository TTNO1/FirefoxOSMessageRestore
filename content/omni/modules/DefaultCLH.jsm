//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const nsICommandLineHandler=Ci.nsICommandLineHandler;const nsIPrefBranch=Ci.nsIPrefBranch;const nsIWindowWatcher=Ci.nsIWindowWatcher;const nsIProperties=Ci.nsIProperties;const nsIFile=Ci.nsIFile;const nsISimpleEnumerator=Ci.nsISimpleEnumerator;function getDirectoryService(){return Cc["@mozilla.org/file/directory_service;1"].getService(nsIProperties);}
function nsDefaultCLH(){}
nsDefaultCLH.prototype={classID:Components.ID("{6ebc941a-f2ff-4d56-b3b6-f7d0b9d73344}"),QueryInterface:ChromeUtils.generateQI([nsICommandLineHandler]),handle:function clh_handle(cmdLine){var printDir;while((printDir=cmdLine.handleFlagWithParam("print-xpcom-dir",false))){var out='print-xpcom-dir("'+printDir+'"): ';try{out+=getDirectoryService().get(printDir,nsIFile).path;}catch(e){out+="<Not Provided>";}
dump(out+"\n");Cu.reportError(out);}
var printDirList;while((printDirList=cmdLine.handleFlagWithParam("print-xpcom-dirlist",false))){out='print-xpcom-dirlist("'+printDirList+'"): ';try{for(let file of getDirectoryService().get(printDirList,nsISimpleEnumerator)){out+=file.path+";";}}catch(e){out+="<Not Provided>";}
dump(out+"\n");Cu.reportError(out);}
if(cmdLine.handleFlag("silent",false)){cmdLine.preventDefault=true;}
if(cmdLine.preventDefault){return;}
var prefs=Cc["@mozilla.org/preferences-service;1"].getService(nsIPrefBranch);try{var singletonWindowType=prefs.getCharPref("toolkit.singletonWindowType");var win=Services.wm.getMostRecentWindow(singletonWindowType);if(win){win.focus();cmdLine.preventDefault=true;return;}}catch(e){} 
try{var chromeURI=prefs.getCharPref("toolkit.defaultChromeURI");var flags=prefs.getCharPref("toolkit.defaultChromeFeatures","chrome,dialog=no,all");var wwatch=Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(nsIWindowWatcher);wwatch.openWindow(null,chromeURI,"_blank",flags,cmdLine);}catch(e){}},helpInfo:"",};var EXPORTED_SYMBOLS=["nsDefaultCLH"];