//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{OS}=ChromeUtils.import("resource://gre/modules/osfile.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"JSONFile","resource://gre/modules/JSONFile.jsm");const EXPORTED_SYMBOLS=["pushBroadcastService"];const DUMMY_VERSION_STRING="____NOP____";XPCOMUtils.defineLazyGetter(this,"console",()=>{let{ConsoleAPI}=ChromeUtils.import("resource://gre/modules/Console.jsm");return new ConsoleAPI({maxLogLevelPref:"dom.push.loglevel",prefix:"BroadcastService",});});ChromeUtils.defineModuleGetter(this,"PushService","resource://gre/modules/PushService.jsm");class InvalidSourceInfo extends Error{constructor(message){super(message);this.name="InvalidSourceInfo";}}
const BROADCAST_SERVICE_VERSION=1;var BroadcastService=class{constructor(pushService,path){this.PHASES={HELLO:"hello",REGISTER:"register",BROADCAST:"broadcast",};this.pushService=pushService;this.jsonFile=new JSONFile({path,dataPostProcessor:this._initializeJSONFile,});this.initializePromise=this.jsonFile.load();}
async getListeners(){await this.initializePromise;return Object.entries(this.jsonFile.data.listeners).reduce((acc,[k,v])=>{acc[k]=v.version;return acc;},{});}
_initializeJSONFile(data){if(!data.version){data.version=BROADCAST_SERVICE_VERSION;}
if(!data.hasOwnProperty("listeners")){data.listeners={};}
return data;}
async _resetListeners(){await this.initializePromise;this.jsonFile.data=this._initializeJSONFile({});this.initializePromise=Promise.resolve();}
_validateSourceInfo(sourceInfo){const{moduleURI,symbolName}=sourceInfo;if(typeof moduleURI!=="string"){throw new InvalidSourceInfo(`moduleURI must be a string (got ${typeof moduleURI})`);}
if(typeof symbolName!=="string"){throw new InvalidSourceInfo(`symbolName must be a string (got ${typeof symbolName})`);}}
async addListener(broadcastId,version,sourceInfo){console.info("addListener: adding listener",broadcastId,version,sourceInfo);await this.initializePromise;this._validateSourceInfo(sourceInfo);if(typeof version!=="string"){throw new TypeError("version should be a string");}
if(!version){throw new TypeError("version should not be an empty string");}
const isNew=!this.jsonFile.data.listeners.hasOwnProperty(broadcastId);const oldVersion=!isNew&&this.jsonFile.data.listeners[broadcastId].version;if(!isNew&&oldVersion!=version){console.warn("Versions differ while adding listener for",broadcastId,". Got",version,"but JSON file says",oldVersion,".");}





this.jsonFile.data.listeners[broadcastId]={version:oldVersion||version,sourceInfo,};this.jsonFile.saveSoon();if(isNew){await this.pushService.subscribeBroadcast(broadcastId,version);}}
async receivedBroadcastMessage(broadcasts,context){console.info("receivedBroadcastMessage:",broadcasts,context);await this.initializePromise;for(const broadcastId in broadcasts){const version=broadcasts[broadcastId];if(version===DUMMY_VERSION_STRING){console.info("Ignoring",version,"because it's the dummy version");continue;}
if(!this.jsonFile.data.listeners.hasOwnProperty(broadcastId)){console.warn("receivedBroadcastMessage: unknown broadcastId",broadcastId);continue;}
const{sourceInfo}=this.jsonFile.data.listeners[broadcastId];try{this._validateSourceInfo(sourceInfo);}catch(e){console.error("receivedBroadcastMessage: malformed sourceInfo",sourceInfo,e);continue;}
const{moduleURI,symbolName}=sourceInfo;const module={};try{ChromeUtils.import(moduleURI,module);}catch(e){console.error("receivedBroadcastMessage: couldn't invoke",broadcastId,"because import of module",moduleURI,"failed",e);continue;}
if(!module[symbolName]){console.error("receivedBroadcastMessage: couldn't invoke",broadcastId,"because module",moduleURI,"missing attribute",symbolName);continue;}
const handler=module[symbolName];if(!handler.receivedBroadcastMessage){console.error("receivedBroadcastMessage: couldn't invoke",broadcastId,"because handler returned by",`${moduleURI}.${symbolName}`,"has no receivedBroadcastMessage method");continue;}
try{await handler.receivedBroadcastMessage(version,broadcastId,context);}catch(e){console.error("receivedBroadcastMessage: handler for",broadcastId,"threw error:",e);continue;}



if(this.jsonFile.data.listeners[broadcastId].version!=version){this.jsonFile.data.listeners[broadcastId].version=version;this.jsonFile.saveSoon();}}}
_saveImmediately(){return this.jsonFile._save();}};function initializeBroadcastService(){let path="broadcast-listeners.json";if(OS.Constants.Path.profileDir){path=OS.Path.join(OS.Constants.Path.profileDir,path);}
return new BroadcastService(PushService,path);}
var pushBroadcastService=initializeBroadcastService();