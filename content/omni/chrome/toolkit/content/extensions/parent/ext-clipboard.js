"use strict";XPCOMUtils.defineLazyServiceGetter(this,"imgTools","@mozilla.org/image/tools;1","imgITools");const Transferable=Components.Constructor("@mozilla.org/widget/transferable;1","nsITransferable");this.clipboard=class extends ExtensionAPI{getAPI(context){return{clipboard:{async setImageData(imageData,imageType){if(AppConstants.platform=="android"){return Promise.reject({message:"Writing images to the clipboard is not supported on Android",});}
let img;try{img=imgTools.decodeImageFromArrayBuffer(imageData,`image/${imageType}`);}catch(e){return Promise.reject({message:`Data is not a valid ${imageType} image`,});}

let transferable=new Transferable();transferable.init(null);const kNativeImageMime="application/x-moz-nativeimage";transferable.addDataFlavor(kNativeImageMime);









transferable.setTransferData(kNativeImageMime,img,1);Services.clipboard.setData(transferable,null,Services.clipboard.kGlobalClipboard);},},};}};