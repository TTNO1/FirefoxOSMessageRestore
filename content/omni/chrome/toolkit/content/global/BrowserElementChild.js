"use strict";var{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function debug(msg){}

docShell.isActive=true;var BrowserElementIsReady;debug(`Might load BE scripts: BEIR: ${BrowserElementIsReady}`);if(!BrowserElementIsReady){debug("Loading BE scripts");if(!("BrowserElementIsPreloaded"in this)){Services.scriptloader.loadSubScript("chrome://global/content/BrowserElementChildPreload.js",this);}
function onDestroy(){removeMessageListener("browser-element-api:destroy",onDestroy);if(api){api.destroy();}
BrowserElementIsReady=false;}
addMessageListener("browser-element-api:destroy",onDestroy);BrowserElementIsReady=true;}else{debug("BE already loaded, abort");}
sendAsyncMessage("browser-element-api:call",{msg_name:"hello"});