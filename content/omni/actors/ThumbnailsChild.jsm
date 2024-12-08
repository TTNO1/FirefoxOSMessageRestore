"use strict";var EXPORTED_SYMBOLS=["ThumbnailsChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PageThumbUtils","resource://gre/modules/PageThumbUtils.jsm");class ThumbnailsChild extends JSWindowActorChild{receiveMessage(message){switch(message.name){case"Browser:Thumbnail:ContentInfo":{let[width,height]=PageThumbUtils.getContentSize(this.contentWindow);return{width,height};}
case"Browser:Thumbnail:CheckState":{return new Promise(resolve=>Services.tm.idleDispatchToMainThread(()=>{if(!this.manager){



return;}
let result=PageThumbUtils.shouldStoreContentThumbnail(this.contentWindow,this.browsingContext.docShell);resolve(result);}));}
case"Browser:Thumbnail:GetOriginalURL":{let channel=this.browsingContext.docShell.currentDocumentChannel;let channelError=PageThumbUtils.isChannelErrorResponse(channel);let originalURL;try{originalURL=channel.originalURI.spec;}catch(ex){}
return{channelError,originalURL};}}
return undefined;}}