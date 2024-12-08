"use strict";const{Cc,Ci}=require("chrome");const Services=require("Services");const clipboardHelper=Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);function copyString(string){clipboardHelper.copyString(string);}
function getText(){const flavor="text/unicode";const xferable=Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);if(!xferable){throw new Error("Couldn't get the clipboard data due to an internal error "+"(couldn't create a Transferable object).");}
xferable.init(null);xferable.addDataFlavor(flavor);Services.clipboard.getData(xferable,Services.clipboard.kGlobalClipboard);const data={};try{xferable.getTransferData(flavor,data);}catch(e){return null;}
if(!data.value){return null;}
return data.value.QueryInterface(Ci.nsISupportsString).data;}
exports.copyString=copyString;exports.getText=getText;