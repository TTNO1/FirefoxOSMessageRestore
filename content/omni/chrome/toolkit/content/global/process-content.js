"use strict";

const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");Services.cpmm.addMessageListener("gmp-plugin-crash",({data})=>{Cc["@mozilla.org/gecko-media-plugin-service;1"].getService(Ci.mozIGeckoMediaPluginService).RunPluginCrashCallbacks(data.pluginID,data.pluginName);});