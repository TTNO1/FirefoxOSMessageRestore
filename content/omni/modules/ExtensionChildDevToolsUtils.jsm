//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ExtensionChildDevToolsUtils"];const{EventEmitter}=ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");
let themeChangeObserver;class ThemeChangeObserver extends EventEmitter{constructor(themeName,onDestroyed){super();this.themeName=themeName;this.onDestroyed=onDestroyed;this.contexts=new Set();Services.cpmm.addMessageListener("Extension:DevToolsThemeChanged",this);}
addContext(context){if(this.contexts.has(context)){throw new Error("addContext on the ThemeChangeObserver was called more than once"+" for the context.");}
context.callOnClose({close:()=>this.onContextClosed(context),});this.contexts.add(context);}
onContextClosed(context){this.contexts.delete(context);if(this.contexts.size===0){this.destroy();}}
onThemeChanged(themeName){this.themeName=themeName;this.emit("themeChanged",themeName);}
receiveMessage({name,data}){if(name==="Extension:DevToolsThemeChanged"){this.onThemeChanged(data.themeName);}}
destroy(){Services.cpmm.removeMessageListener("Extension:DevToolsThemeChanged",this);this.onDestroyed();this.onDestroyed=null;this.contexts.clear();this.contexts=null;}}
var ExtensionChildDevToolsUtils={initThemeChangeObserver(themeName,context){if(!themeChangeObserver){themeChangeObserver=new ThemeChangeObserver(themeName,function(){themeChangeObserver=null;});}
themeChangeObserver.addContext(context);},getThemeChangeObserver(){if(!themeChangeObserver){throw new Error("A ThemeChangeObserver must be created before being retrieved.");}
return themeChangeObserver;},};