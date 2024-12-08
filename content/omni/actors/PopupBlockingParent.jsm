"use strict";var EXPORTED_SYMBOLS=["PopupBlocker","PopupBlockingParent"];class PopupBlocker{constructor(browser){this._browser=browser;this._allBlockedPopupCounts=new WeakMap();this._shouldShowNotification=false;}
get shouldShowNotification(){return this._shouldShowNotification;}
didShowNotification(){this._shouldShowNotification=false;}
getBlockedPopupCount(){let totalBlockedPopups=0;let contextsToVisit=[this._browser.browsingContext];while(contextsToVisit.length){let currentBC=contextsToVisit.pop();let windowGlobal=currentBC.currentWindowGlobal;if(!windowGlobal){continue;}
let popupCountForGlobal=this._allBlockedPopupCounts.get(windowGlobal)||0;totalBlockedPopups+=popupCountForGlobal;contextsToVisit.push(...currentBC.children);}
return totalBlockedPopups;}
async getBlockedPopups(){let contextsToVisit=[this._browser.browsingContext];let result=[];while(contextsToVisit.length){let currentBC=contextsToVisit.pop();let windowGlobal=currentBC.currentWindowGlobal;if(!windowGlobal){continue;}
let popupCountForGlobal=this._allBlockedPopupCounts.get(windowGlobal)||0;if(popupCountForGlobal){let actor=windowGlobal.getActor("PopupBlocking");let popups=await actor.sendQuery("GetBlockedPopupList");for(let popup of popups){if(!popup.popupWindowURISpec){continue;}
result.push({browsingContext:currentBC,innerWindowId:windowGlobal.innerWindowId,popupWindowURISpec:popup.popupWindowURISpec,});}}
contextsToVisit.push(...currentBC.children);}
return result;}
unblockPopup(browsingContext,innerWindowId,popupIndex){let popupFrame=browsingContext.top.embedderElement;let popupBrowser=popupFrame.outerBrowser?popupFrame.outerBrowser:popupFrame;if(this._browser!=popupBrowser){throw new Error("Attempting to unblock popup in a BrowsingContext no longer hosted in this browser.");}
let windowGlobal=browsingContext.currentWindowGlobal;if(!windowGlobal||windowGlobal.innerWindowId!=innerWindowId){
return;}
let actor=browsingContext.currentWindowGlobal.getActor("PopupBlocking");actor.sendAsyncMessage("UnblockPopup",{index:popupIndex});}
async unblockAllPopups(){let popups=await this.getBlockedPopups();for(let i=0;i<popups.length;++i){let popup=popups[i];this.unblockPopup(popup.browsingContext,popup.innerWindowId,i);}}
updateBlockedPopupsUI(){let event=this._browser.ownerDocument.createEvent("Events");event.initEvent("DOMUpdateBlockedPopups",true,true);this._browser.dispatchEvent(event);}
_updateBlockedPopupEntries(browsingContext,blockedPopupData){let windowGlobal=browsingContext.currentWindowGlobal;let{count,shouldNotify}=blockedPopupData;if(!this.shouldShowNotification&&shouldNotify){this._shouldShowNotification=true;}
if(windowGlobal){this._allBlockedPopupCounts.set(windowGlobal,count);}
this.updateBlockedPopupsUI();}}
class PopupBlockingParent extends JSWindowActorParent{didDestroy(){this.updatePopupCountForBrowser({count:0,shouldNotify:false});}
receiveMessage(message){if(message.name=="UpdateBlockedPopups"){this.updatePopupCountForBrowser({count:message.data.count,shouldNotify:message.data.shouldNotify,});}}
updatePopupCountForBrowser(data){let browser=this.browsingContext.top.embedderElement;if(!browser){return;}
browser.popupBlocker._updateBlockedPopupEntries(this.browsingContext,data);}}