"use strict";var EXPORTED_SYMBOLS=["BrowserElementChild"];class BrowserElementChild extends JSWindowActorChild{handleEvent(event){if(event.type=="DOMWindowClose"&&!this.manager.browsingContext.parent){this.sendAsyncMessage("DOMWindowClose",{});}}
receiveMessage(message){switch(message.name){case"EnterModalState":{this.contentWindow.windowUtils.enterModalState();break;}
case"LeaveModalState":{if(!message.data.forceLeave&&!this.contentWindow.windowUtils.isInModalState()){break;}
this.contentWindow.windowUtils.leaveModalState();break;}}}}