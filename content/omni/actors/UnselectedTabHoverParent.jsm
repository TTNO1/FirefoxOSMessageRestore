"use strict";var EXPORTED_SYMBOLS=["UnselectedTabHoverParent"];class UnselectedTabHoverParent extends JSWindowActorParent{receiveMessage(message){const topBrowsingContext=this.manager.browsingContext.top;const browser=topBrowsingContext.embedderElement;if(!browser){return;}
browser.shouldHandleUnselectedTabHover=message.data.enable;}}