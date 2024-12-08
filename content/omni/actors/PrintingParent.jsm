"use strict";var EXPORTED_SYMBOLS=["PrintingParent"];let gTestListener=null;class PrintingParent extends JSWindowActorParent{static setTestListener(listener){gTestListener=listener;}
getPrintPreviewToolbar(browser){return browser.ownerDocument.getElementById("print-preview-toolbar");}
receiveMessage(message){let browser=this.browsingContext.top.embedderElement;let PrintUtils=browser.ownerGlobal.PrintUtils;if(message.name=="Printing:Error"){PrintUtils._displayPrintingError(message.data.nsresult,message.data.isPrinting);return undefined;}
if(this.ignoreListeners){return undefined;}
let listener=PrintUtils._webProgressPP.value;let data=message.data;switch(message.name){case"Printing:Preview:Entered":{

if(gTestListener){gTestListener(browser);}
PrintUtils.printPreviewEntered(browser,message.data);break;}
case"Printing:Preview:ReaderModeReady":{PrintUtils.readerModeReady(browser);break;}
case"Printing:Preview:UpdatePageCount":{let toolbar=this.getPrintPreviewToolbar(browser);toolbar.updatePageCount(message.data.totalPages);break;}
case"Printing:Preview:ProgressChange":{if(!PrintUtils._webProgressPP.value){return undefined;}
return listener.onProgressChange(null,null,data.curSelfProgress,data.maxSelfProgress,data.curTotalProgress,data.maxTotalProgress);}
case"Printing:Preview:StateChange":{if(!PrintUtils._webProgressPP.value){return undefined;}
if(data.stateFlags&Ci.nsIWebProgressListener.STATE_STOP){


let printPreviewTB=this.getPrintPreviewToolbar(browser);printPreviewTB.disableUpdateTriggers(false);}
return listener.onStateChange(null,null,data.stateFlags,data.status);}}
return undefined;}}