"use strict";var EXPORTED_SYMBOLS=["PurgeSessionHistoryChild"];class PurgeSessionHistoryChild extends JSWindowActorChild{receiveMessage(message){if(message.name!="Browser:PurgeSessionHistory"){return;}
let sessionHistory=this.docShell.QueryInterface(Ci.nsIWebNavigation).sessionHistory;if(!sessionHistory){return;} 
if(sessionHistory.index<sessionHistory.count-1){let legacy=sessionHistory.legacySHistory;let indexEntry=legacy.getEntryAtIndex(sessionHistory.index);indexEntry.QueryInterface(Ci.nsISHEntry);legacy.addEntry(indexEntry,true);}
let purge=sessionHistory.count;if(this.document.location.href!="about:blank"){--purge;}
if(purge>0){sessionHistory.legacySHistory.purgeHistory(purge);}}}