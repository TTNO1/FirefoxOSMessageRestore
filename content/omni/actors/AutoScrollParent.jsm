"use strict";var EXPORTED_SYMBOLS=["AutoScrollParent"];class AutoScrollParent extends JSWindowActorParent{receiveMessage(msg){let browser=this.manager.browsingContext.top.embedderElement;if(!browser){return null;}
let data=msg.data;switch(msg.name){case"Autoscroll:Start":return Promise.resolve(browser.startScroll(data));case"Autoscroll:MaybeStartInParent":let parent=this.browsingContext.parent;if(parent){let actor=parent.currentWindowGlobal.getActor("AutoScroll");actor.sendAsyncMessage("Autoscroll:MaybeStart",data);}
break;case"Autoscroll:Cancel":browser.cancelScroll();break;}
return null;}}