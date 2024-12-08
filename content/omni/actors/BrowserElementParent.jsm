"use strict";var EXPORTED_SYMBOLS=["BrowserElementParent"];class BrowserElementParent extends JSWindowActorParent{receiveMessage(message){switch(message.name){case"DOMWindowClose":{



if(!this.manager.browsingContext.parent){let browser=this.manager.browsingContext.embedderElement;let win=browser.ownerGlobal;
if(browser.isRemoteBrowser){browser.dispatchEvent(new win.CustomEvent("DOMWindowClose",{bubbles:true,}));}}
break;}}}}