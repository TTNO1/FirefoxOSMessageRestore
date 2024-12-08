"use strict";var EXPORTED_SYMBOLS=["RemotePages","RemotePageManager"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{MessageListener,MessagePort}=ChromeUtils.import("resource://gre/modules/remotepagemanager/MessagePort.jsm");class RemotePages{constructor(urls){this.urls=Array.isArray(urls)?urls:[urls];this.messagePorts=new Set();this.listener=new MessageListener();this.destroyed=false;this.portCreated=this.portCreated.bind(this);this.portMessageReceived=this.portMessageReceived.bind(this);for(const url of this.urls){RemotePageManager.addRemotePageListener(url,this.portCreated);}}
destroy(){for(const url of this.urls){RemotePageManager.removeRemotePageListener(url);}
for(let port of this.messagePorts.values()){this.removeMessagePort(port);}
this.messagePorts=null;this.listener=null;this.destroyed=true;}
portCreated(port){this.messagePorts.add(port);port.loaded=false;port.addMessageListener("RemotePage:Load",this.portMessageReceived);port.addMessageListener("RemotePage:Unload",this.portMessageReceived);for(let name of this.listener.keys()){this.registerPortListener(port,name);}
this.listener.callListeners({target:port,name:"RemotePage:Init"});} 
portMessageReceived(message){switch(message.name){case"RemotePage:Load":message.target.loaded=true;break;case"RemotePage:Unload":message.target.loaded=false;this.removeMessagePort(message.target);break;}
this.listener.callListeners(message);} 
removeMessagePort(port){for(let name of this.listener.keys()){port.removeMessageListener(name,this.portMessageReceived);}
port.removeMessageListener("RemotePage:Load",this.portMessageReceived);port.removeMessageListener("RemotePage:Unload",this.portMessageReceived);this.messagePorts.delete(port);}
registerPortListener(port,name){port.addMessageListener(name,this.portMessageReceived);} 
sendAsyncMessage(name,data=null){for(let port of this.messagePorts.values()){try{port.sendAsyncMessage(name,data);}catch(e){
 if(e.result!==Cr.NS_ERROR_NOT_INITIALIZED){Cu.reportError(e);}}}}
addMessageListener(name,callback){if(this.destroyed){throw new Error("RemotePages has been destroyed");}
if(!this.listener.has(name)){for(let port of this.messagePorts.values()){this.registerPortListener(port,name);}}
this.listener.addMessageListener(name,callback);}
removeMessageListener(name,callback){if(this.destroyed){throw new Error("RemotePages has been destroyed");}
this.listener.removeMessageListener(name,callback);}
portsForBrowser(browser){return[...this.messagePorts].filter(port=>port.browser==browser);}}
function publicMessagePort(port){let properties=["addMessageListener","removeMessageListener","sendAsyncMessage","destroy",];let clean={};for(let property of properties){clean[property]=port[property].bind(port);}
Object.defineProperty(clean,"portID",{enumerable:true,get(){return port.portID;},});if(port instanceof ChromeMessagePort){Object.defineProperty(clean,"browser",{enumerable:true,get(){return port.browser;},});Object.defineProperty(clean,"url",{enumerable:true,get(){return port.url;},});}
return clean;}
class ChromeMessagePort extends MessagePort{constructor(browser,portID,url){super(browser.messageManager,portID);this._browser=browser;this._permanentKey=browser.permanentKey;this._url=url;Services.obs.addObserver(this,"message-manager-disconnect");this.publicPort=publicMessagePort(this);this.swapBrowsers=this.swapBrowsers.bind(this);this._browser.addEventListener("SwapDocShells",this.swapBrowsers);}
get browser(){return this._browser;}
get url(){return this._url;}
 
swapBrowsers({detail:newBrowser}){
if(this._browser.permanentKey!=this._permanentKey){return;}
this._browser.removeEventListener("SwapDocShells",this.swapBrowsers);this._browser=newBrowser;this.swapMessageManager(newBrowser.messageManager);this._browser.addEventListener("SwapDocShells",this.swapBrowsers);}
 
observe(messageManager){if(messageManager!=this.messageManager){return;}
this.listener.callListeners({target:this.publicPort,name:"RemotePage:Unload",data:null,});this.destroy();}
async handleRequest(name,data){throw new Error(`Unknown request ${name}.`);}
handleMessage(messagedata){let message={target:this.publicPort,name:messagedata.name,data:messagedata.data,browsingContextID:messagedata.browsingContextID,};this.listener.callListeners(message);if(messagedata.name=="RemotePage:Unload"){this.destroy();}}
destroy(){try{this._browser.removeEventListener("SwapDocShells",this.swapBrowsers);}catch(e){
}
this._browser=null;Services.obs.removeObserver(this,"message-manager-disconnect");super.destroy.call(this);}}

var RemotePageManagerInternal={ pages:new Map(), init(){Services.mm.addMessageListener("RemotePage:InitPort",this.initPort.bind(this));this.updateProcessUrls();},updateProcessUrls(){Services.ppmm.sharedData.set("RemotePageManager:urls",new Set(this.pages.keys()));Services.ppmm.sharedData.flush();},
addRemotePageListener(url,callback){if(this.pages.has(url)){throw new Error("Remote page already registered: "+url);}
this.pages.set(url,callback);this.updateProcessUrls();},removeRemotePageListener(url){if(!this.pages.has(url)){throw new Error("Remote page is not registered: "+url);}
this.pages.delete(url);this.updateProcessUrls();}, initPort({target:browser,data:{url,portID}}){let callback=this.pages.get(url);if(!callback){Cu.reportError("Unexpected remote page load: "+url);return;}
let port=new ChromeMessagePort(browser,portID,url);callback(port.publicPort);},};if(Services.appinfo.processType!=Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT){throw new Error("RemotePageManager can only be used in the main process.");}
RemotePageManagerInternal.init();var RemotePageManager={addRemotePageListener:RemotePageManagerInternal.addRemotePageListener.bind(RemotePageManagerInternal),removeRemotePageListener:RemotePageManagerInternal.removeRemotePageListener.bind(RemotePageManagerInternal),};