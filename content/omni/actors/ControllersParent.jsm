"use strict";var EXPORTED_SYMBOLS=["ControllersParent"];class ControllersParent extends JSWindowActorParent{constructor(){super();
this.supportedCommands={};}
get browser(){return this.browsingContext.top.embedderElement;}
enableDisableCommands(aAction,aEnabledCommands,aDisabledCommands){ this.supportedCommands={};for(let command of aEnabledCommands){this.supportedCommands[command]=true;}
for(let command of aDisabledCommands){this.supportedCommands[command]=false;}
let browser=this.browser;if(browser){browser.ownerGlobal.updateCommands(aAction);}}
isCommandEnabled(aCommand){return this.supportedCommands[aCommand]||false;}
supportsCommand(aCommand){return aCommand in this.supportedCommands;}
doCommand(aCommand){this.sendAsyncMessage("ControllerCommands:Do",aCommand);}
getCommandStateWithParams(aCommand,aCommandParams){throw Components.Exception("Not implemented",Cr.NS_ERROR_NOT_IMPLEMENTED);}
doCommandWithParams(aCommand,aCommandParams){let cmd={cmd:aCommand,params:null,};if(aCommand=="cmd_lookUpDictionary"){
let browser=this.browser;let rect=browser.getBoundingClientRect();let scale=browser.ownerGlobal.devicePixelRatio;cmd.params={x:{type:"long",value:aCommandParams.getLongValue("x")-rect.left*scale,},y:{type:"long",value:aCommandParams.getLongValue("y")-rect.top*scale,},};}else{throw Components.Exception("Not implemented",Cr.NS_ERROR_NOT_IMPLEMENTED);}
this.sendAsyncMessage("ControllerCommands:DoWithParams",cmd);}
getSupportedCommands(){throw Components.Exception("Not implemented",Cr.NS_ERROR_NOT_IMPLEMENTED);}
onEvent(){}}
ControllersParent.prototype.QueryInterface=ChromeUtils.generateQI(["nsIBrowserController","nsIController","nsICommandController",]);