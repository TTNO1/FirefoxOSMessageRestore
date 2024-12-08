//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{RemoteSettings:"resource://services-settings/remote-settings.js",RemoteSettingsClient:"resource://services-settings/RemoteSettingsClient.jsm",});var EXPORTED_SYMBOLS=["IgnoreLists"];const SETTINGS_IGNORELIST_KEY="hijack-blocklists";class IgnoreListsManager{async init(){if(!this._ignoreListSettings){this._ignoreListSettings=RemoteSettings(SETTINGS_IGNORELIST_KEY);}}
async getAndSubscribe(listener){await this.init();const settings=await this._getIgnoreList();this._ignoreListSettings.on("sync",listener);return settings;}
unsubscribe(listener){if(!this._ignoreListSettings){return;}
this._ignoreListSettings.off("sync",listener);}
async _getIgnoreList(){if(this._getSettingsPromise){return this._getSettingsPromise;}
const settings=await(this._getSettingsPromise=this._getIgnoreListSettings());delete this._getSettingsPromise;return settings;}
async _getIgnoreListSettings(firstTime=true){let result=[];try{result=await this._ignoreListSettings.get({verifySignature:true,});}catch(ex){if(ex instanceof RemoteSettingsClient.InvalidSignatureError&&firstTime){await this._ignoreListSettings.db.clear();return this._getIgnoreListSettings(false);}

Cu.reportError(ex);}
return result;}}
const IgnoreLists=new IgnoreListsManager();