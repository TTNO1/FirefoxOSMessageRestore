//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

function RandomSelector(){}
RandomSelector.prototype={classID:Components.ID("{c616fcfd-9737-41f1-aa74-cee72a38f91b}"),QueryInterface:ChromeUtils.generateQI(["nsIContentProcessProvider"]),provideProcess(aType,aProcesses,aMaxCount){if(aProcesses.length<aMaxCount){return Ci.nsIContentProcessProvider.NEW_PROCESS;}
return Math.floor(Math.random()*aMaxCount);},};
function MinTabSelector(){}
MinTabSelector.prototype={classID:Components.ID("{2dc08eaf-6eef-4394-b1df-a3a927c1290b}"),QueryInterface:ChromeUtils.generateQI(["nsIContentProcessProvider"]),provideProcess(aType,aProcesses,aMaxCount){let min=Number.MAX_VALUE;let candidate=Ci.nsIContentProcessProvider.NEW_PROCESS;


let numIters=Math.min(aProcesses.length,aMaxCount);for(let i=0;i<numIters;i++){let process=aProcesses[i];let tabCount=process.tabCount;if(tabCount<min){min=tabCount;candidate=i;}}

if(min>0&&aProcesses.length<aMaxCount){return Ci.nsIContentProcessProvider.NEW_PROCESS;}
return candidate;},};var EXPORTED_SYMBOLS=["RandomSelector","MinTabSelector"];