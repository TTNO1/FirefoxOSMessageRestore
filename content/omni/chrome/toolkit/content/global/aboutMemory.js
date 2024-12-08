



"use strict";let CC=Components.Constructor;const KIND_NONHEAP=Ci.nsIMemoryReporter.KIND_NONHEAP;const KIND_HEAP=Ci.nsIMemoryReporter.KIND_HEAP;const KIND_OTHER=Ci.nsIMemoryReporter.KIND_OTHER;const UNITS_BYTES=Ci.nsIMemoryReporter.UNITS_BYTES;const UNITS_COUNT=Ci.nsIMemoryReporter.UNITS_COUNT;const UNITS_COUNT_CUMULATIVE=Ci.nsIMemoryReporter.UNITS_COUNT_CUMULATIVE;const UNITS_PERCENTAGE=Ci.nsIMemoryReporter.UNITS_PERCENTAGE;const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{NetUtil}=ChromeUtils.import("resource://gre/modules/NetUtil.jsm");ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");ChromeUtils.defineModuleGetter(this,"FileUtils","resource://gre/modules/FileUtils.jsm");XPCOMUtils.defineLazyGetter(this,"nsBinaryStream",()=>CC("@mozilla.org/binaryinputstream;1","nsIBinaryInputStream","setInputStream"));XPCOMUtils.defineLazyGetter(this,"nsFile",()=>CC("@mozilla.org/file/local;1","nsIFile","initWithPath"));XPCOMUtils.defineLazyGetter(this,"nsGzipConverter",()=>CC("@mozilla.org/streamconv;1?from=gzip&to=uncompressed","nsIStreamConverter"));let gMgr=Cc["@mozilla.org/memory-reporter-manager;1"].getService(Ci.nsIMemoryReporterManager);const gPageName="about:memory";document.title=gPageName;const gMainProcessPrefix="Main Process";const gFilterUpdateDelayMS=300;let gIsDiff=false;let gCurrentReports=[];let gCurrentHasMozMallocUsableSize=false;let gCurrentIsDiff=false;let gFilter="";

function flipBackslashes(aUnsafeStr){return!aUnsafeStr.includes("\\")?aUnsafeStr:aUnsafeStr.replace(/\\/g,"/");}
const gAssertionFailureMsgPrefix="aboutMemory.js assertion failed: ";
function assert(aCond,aMsg){if(!aCond){reportAssertionFailure(aMsg);throw new Error(gAssertionFailureMsgPrefix+aMsg);}}
function assertInput(aCond,aMsg){if(!aCond){throw new Error(`Invalid memory report(s): ${aMsg}`);}}
function handleException(aEx){let str=""+aEx;if(str.startsWith(gAssertionFailureMsgPrefix)){throw aEx;}else{updateMainAndFooter(str,NO_TIMESTAMP,HIDE_FOOTER,"badInputWarning");}}
function reportAssertionFailure(aMsg){let debug=Cc["@mozilla.org/xpcom/debug;1"].getService(Ci.nsIDebug2);if(debug.isDebugBuild){debug.assertion(aMsg,"false","aboutMemory.js",0);}}
function debug(aVal){let section=appendElement(document.body,"div","section");appendElementWithText(section,"div","debug",JSON.stringify(aVal));}
function stringMatchesFilter(aString,aFilter){assert(typeof aFilter=="string"||aFilter instanceof RegExp,"unexpected aFilter type");return typeof aFilter=="string"?aString.includes(aFilter):aFilter.test(aString);}
window.onunload=function(){};let gMain;let gFooter;let gVerbose;let gAnonymize;const HIDE_FOOTER=0;const SHOW_FOOTER=1;const NO_TIMESTAMP=0;const SHOW_TIMESTAMP=1;function updateTitleMainAndFooter(aTitleNote,aMsg,aShowTimestamp,aFooterAction,aClassName){document.title=gPageName;if(aTitleNote){document.title+=` (${aTitleNote})`;}
let tmp=gMain.cloneNode(false);gMain.parentNode.replaceChild(tmp,gMain);gMain=tmp;gMain.classList.remove("hidden");gMain.classList.remove("verbose");gMain.classList.remove("non-verbose");if(gVerbose){gMain.classList.add(gVerbose.checked?"verbose":"non-verbose");}
let msgElement;if(aMsg){let className="section";if(aClassName){className=className+" "+aClassName;}
if(aShowTimestamp==SHOW_TIMESTAMP){

aMsg+=` (${new Date().toISOString()})`;}
msgElement=appendElementWithText(gMain,"div",className,aMsg);}
switch(aFooterAction){case HIDE_FOOTER:gFooter.classList.add("hidden");break;case SHOW_FOOTER:gFooter.classList.remove("hidden");break;default:assert(false,"bad footer action in updateTitleMainAndFooter");}
return msgElement;}
function updateMainAndFooter(aMsg,aShowTimestamp,aFooterAction,aClassName){return updateTitleMainAndFooter("",aMsg,aShowTimestamp,aFooterAction,aClassName);}
function appendTextNode(aP,aText){let e=document.createTextNode(aText);aP.appendChild(e);return e;}
function appendElement(aP,aTagName,aClassName){let e=newElement(aTagName,aClassName);aP.appendChild(e);return e;}
function appendElementWithText(aP,aTagName,aClassName,aText){let e=appendElement(aP,aTagName,aClassName);

e.textContent=aText;return e;}
function newElement(aTagName,aClassName){let e=document.createElement(aTagName);if(aClassName){e.className=aClassName;}
return e;}
const explicitTreeDescription="This tree covers explicit memory allocations by the application.  It includes \
\n\n\
* all allocations made at the heap allocation level (via functions such as malloc, \
calloc, realloc, memalign, operator new, and operator new[]) that have not been \
explicitly decommitted (i.e. evicted from memory and swap), and \
\n\n\
* some allocations (those covered by memory reporters) made at the operating \
system level (via calls to functions such as VirtualAlloc, vm_allocate, and \
mmap), \
\n\n\
* where possible, the overhead of the heap allocator itself.\
\n\n\
It excludes memory that is mapped implicitly such as code and data segments, \
and thread stacks. \
\n\n\
'explicit' is not guaranteed to cover every explicit allocation, but it does cover \
most (including the entire heap), and therefore it is the single best number to \
focus on when trying to reduce memory usage.";function appendButton(aP,aTitle,aOnClick,aText,aId){let b=appendElementWithText(aP,"button","",aText);b.title=aTitle;b.onclick=aOnClick;if(aId){b.id=aId;}
return b;}
function appendHiddenFileInput(aP,aId,aChangeListener){let input=appendElementWithText(aP,"input","hidden","");input.type="file";input.id=aId; input.addEventListener("change",aChangeListener);return input;}
window.onload=function(){let header=appendElement(document.body,"div","ancillary");let fileInput1=appendHiddenFileInput(header,"fileInput1",function(){let file=this.files[0];let filename=file.mozFullPath;updateAboutMemoryFromFile(filename);});let fileInput2=appendHiddenFileInput(header,"fileInput2",function(aElem){let file=this.files[0];
if(!this.filename1){this.filename1=file.mozFullPath;

if(!aElem.skipClick){this.click();}}else{let filename1=this.filename1;delete this.filename1;updateAboutMemoryFromTwoFiles(filename1,file.mozFullPath);}});const CuDesc="Measure current memory reports and show.";const LdDesc="Load memory reports from file and show.";const DfDesc="Load memory report data from two files and show the difference.";const SvDesc="Save memory reports to file.";const GCDesc="Do a global garbage collection.";const CCDesc="Do a cycle collection.";const MMDesc='Send three "heap-minimize" notifications in a '+"row.  Each notification triggers a global garbage "+"collection followed by a cycle collection, and causes the "+"process to reduce memory usage in other ways, e.g. by "+"flushing various caches.";const GCAndCCLogDesc="Save garbage collection log and concise cycle "+"collection log.\n"+"WARNING: These logs may be large (>1GB).";const GCAndCCAllLogDesc="Save garbage collection log and verbose cycle "+"collection log.\n"+"WARNING: These logs may be large (>1GB).";const DMDEnabledDesc="Analyze memory reports coverage and save the "+"output to the temp directory.\n";const DMDDisabledDesc="DMD is not running. Please re-start with $DMD and "+"the other relevant environment variables set "+"appropriately.";let ops=appendElement(header,"div","");let row1=appendElement(ops,"div","opsRow");let labelDiv1=appendElementWithText(row1,"div","opsRowLabel","Show memory reports");let label1=appendElementWithText(labelDiv1,"label","");gVerbose=appendElement(label1,"input","");gVerbose.type="checkbox";gVerbose.id="verbose"; appendTextNode(label1,"verbose");appendButton(row1,CuDesc,doMeasure,"Measure","measureButton");appendButton(row1,LdDesc,()=>fileInput1.click(),"Load…");appendButton(row1,DfDesc,()=>fileInput2.click(),"Load and diff…");let row2=appendElement(ops,"div","opsRow");let labelDiv2=appendElementWithText(row2,"div","opsRowLabel","Save memory reports");appendButton(row2,SvDesc,saveReportsToFile,"Measure and save…");
let label2=appendElementWithText(labelDiv2,"label","");gAnonymize=appendElement(label2,"input","");gAnonymize.type="checkbox";appendTextNode(label2,"anonymize");let row3=appendElement(ops,"div","opsRow");appendElementWithText(row3,"div","opsRowLabel","Free memory");appendButton(row3,GCDesc,doGC,"GC");appendButton(row3,CCDesc,doCC,"CC");appendButton(row3,MMDesc,doMMU,"Minimize memory usage");let row4=appendElement(ops,"div","opsRow");appendElementWithText(row4,"div","opsRowLabel","Save GC & CC logs");appendButton(row4,GCAndCCLogDesc,saveGCLogAndConciseCCLog,"Save concise","saveLogsConcise");appendButton(row4,GCAndCCAllLogDesc,saveGCLogAndVerboseCCLog,"Save verbose","saveLogsVerbose");if(gMgr.isDMDEnabled){let row5=appendElement(ops,"div","opsRow");appendElementWithText(row5,"div","opsRowLabel","Save DMD output");let enableButtons=gMgr.isDMDRunning;let dmdButton=appendButton(row5,enableButtons?DMDEnabledDesc:DMDDisabledDesc,doDMD,"Save");dmdButton.disabled=!enableButtons;}

gMain=appendElement(document.body,"div","");gMain.id="mainDiv";gFooter=appendElement(document.body,"div","ancillary hidden");let a=appendElementWithText(gFooter,"a","option","Troubleshooting information");a.href="about:support";let legendText1="Click on a non-leaf node in a tree to expand ('++') "+"or collapse ('--') its children.";let legendText2="Hover the pointer over the name of a memory report "+"to see a description of what it measures.";appendElementWithText(gFooter,"div","legend",legendText1);appendElementWithText(gFooter,"div","legend hiddenOnMobile",legendText2);

let search=location.href.split("?")[1];if(search){let searchSplit=search.split("&");for(let s of searchSplit){if(s.toLowerCase().startsWith("file=")){let filename=s.substring("file=".length);updateAboutMemoryFromFile(decodeURIComponent(filename));return;}}}};function doGC(){Services.obs.notifyObservers(null,"child-gc-request");Cu.forceGC();updateMainAndFooter("Garbage collection completed",SHOW_TIMESTAMP,HIDE_FOOTER);}
function doCC(){Services.obs.notifyObservers(null,"child-cc-request");window.windowUtils.cycleCollect();updateMainAndFooter("Cycle collection completed",SHOW_TIMESTAMP,HIDE_FOOTER);}
function doMMU(){Services.obs.notifyObservers(null,"child-mmu-request");gMgr.minimizeMemoryUsage(()=>updateMainAndFooter("Memory minimization completed",SHOW_TIMESTAMP,HIDE_FOOTER));}
function doMeasure(){updateAboutMemoryFromReporters();}
function saveGCLogAndConciseCCLog(){dumpGCLogAndCCLog(false);}
function saveGCLogAndVerboseCCLog(){dumpGCLogAndCCLog(true);}
function doDMD(){updateMainAndFooter("Saving memory reports and DMD output...",NO_TIMESTAMP,HIDE_FOOTER);try{let dumper=Cc["@mozilla.org/memory-info-dumper;1"].getService(Ci.nsIMemoryInfoDumper);dumper.dumpMemoryInfoToTempDir("",gAnonymize.checked,false);updateMainAndFooter("Saved memory reports and DMD reports analysis "+"to the temp directory",SHOW_TIMESTAMP,HIDE_FOOTER);}catch(ex){updateMainAndFooter(ex.toString(),NO_TIMESTAMP,HIDE_FOOTER);}}
function dumpGCLogAndCCLog(aVerbose){let dumper=Cc["@mozilla.org/memory-info-dumper;1"].getService(Ci.nsIMemoryInfoDumper);let inProgress=updateMainAndFooter("Saving logs...",NO_TIMESTAMP,HIDE_FOOTER);let section=appendElement(gMain,"div","section");function displayInfo(aGCLog,aCCLog,aIsParent){appendElementWithText(section,"div","","Saved GC log to "+aGCLog.path);let ccLogType=aVerbose?"verbose":"concise";appendElementWithText(section,"div","","Saved "+ccLogType+" CC log to "+aCCLog.path);}
dumper.dumpGCAndCCLogsToFile("",aVerbose,true,{onDump:displayInfo,onFinish(){inProgress.remove();},});}
function updateAboutMemoryFromReporters(){updateMainAndFooter("Measuring...",NO_TIMESTAMP,HIDE_FOOTER);try{gCurrentReports=[];gCurrentHasMozMallocUsableSize=gMgr.hasMozMallocUsableSize;gCurrentIsDiff=false;gFilter="";let handleReport=function(aProcess,aUnsafePath,aKind,aUnits,aAmount,aDescription){gCurrentReports.push({process:aProcess,path:aUnsafePath,kind:aKind,units:aUnits,amount:aAmount,description:aDescription,});};let displayReports=function(){updateTitleMainAndFooter("live measurement","",NO_TIMESTAMP,SHOW_FOOTER);updateAboutMemoryFromCurrentData();};gMgr.getReports(handleReport,null,displayReports,null,gAnonymize.checked);}catch(ex){handleException(ex);}}
let gCurrentFileFormatVersion=1;function parseAndUnwrapIfCrashDump(aStr){let obj=JSON.parse(aStr);if(obj.memory_report!==undefined){
obj=obj.memory_report;}
return obj;}
function updateAboutMemoryFromCurrentData(){function processCurrentMemoryReports(aHandleReport,aDisplayReports){for(let r of gCurrentReports){aHandleReport(r.process,r.path,r.kind,r.units,r.amount,r.description,r._presence);}
aDisplayReports();}
gIsDiff=gCurrentIsDiff;appendAboutMemoryMain(processCurrentMemoryReports,gFilter,gCurrentHasMozMallocUsableSize);gIsDiff=false;}
function updateAboutMemoryFromJSONObject(aObj){try{assertInput(aObj.version===gCurrentFileFormatVersion,"data version number missing or doesn't match");assertInput(aObj.hasMozMallocUsableSize!==undefined,"missing 'hasMozMallocUsableSize' property");assertInput(aObj.reports&&aObj.reports instanceof Array,"missing or non-array 'reports' property");gCurrentReports=aObj.reports.concat();gCurrentHasMozMallocUsableSize=aObj.hasMozMallocUsableSize;gCurrentIsDiff=gIsDiff;gFilter="";updateAboutMemoryFromCurrentData();}catch(ex){handleException(ex);}}
function updateAboutMemoryFromJSONString(aStr){try{let obj=parseAndUnwrapIfCrashDump(aStr);updateAboutMemoryFromJSONObject(obj);}catch(ex){handleException(ex);}}
function loadMemoryReportsFromFile(aFilename,aTitleNote,aFn){updateMainAndFooter("Loading...",NO_TIMESTAMP,HIDE_FOOTER);try{let reader=new FileReader();reader.onerror=()=>{throw new Error("FileReader.onerror");};reader.onabort=()=>{throw new Error("FileReader.onabort");};reader.onload=aEvent=>{updateTitleMainAndFooter(aTitleNote,"",NO_TIMESTAMP,SHOW_FOOTER);aFn(aEvent.target.result);};if(!aFilename.endsWith(".gz")){File.createFromFileName(aFilename).then(file=>{reader.readAsText(file);});return;}
let converter=new nsGzipConverter();converter.asyncConvertData("gzip","uncompressed",{data:[],onStartRequest(aR,aC){},onDataAvailable(aR,aStream,aO,aCount){let bi=new nsBinaryStream(aStream);this.data.push(bi.readBytes(aCount));},onStopRequest(aR,aC,aStatusCode){try{if(!Components.isSuccessCode(aStatusCode)){throw new Components.Exception("Error while reading gzip file",aStatusCode);}
reader.readAsText(new Blob(this.data));}catch(ex){handleException(ex);}},},null);let file=new nsFile(aFilename);let fileChan=NetUtil.newChannel({uri:Services.io.newFileURI(file),loadUsingSystemPrincipal:true,});fileChan.asyncOpen(converter);}catch(ex){handleException(ex);}}
function updateAboutMemoryFromFile(aFilename){loadMemoryReportsFromFile(aFilename,aFilename,updateAboutMemoryFromJSONString);}
function updateAboutMemoryFromTwoFiles(aFilename1,aFilename2){let titleNote=`diff of ${aFilename1} and ${aFilename2}`;loadMemoryReportsFromFile(aFilename1,titleNote,function(aStr1){loadMemoryReportsFromFile(aFilename2,titleNote,function(aStr2){try{let obj1=parseAndUnwrapIfCrashDump(aStr1);let obj2=parseAndUnwrapIfCrashDump(aStr2);gIsDiff=true;updateAboutMemoryFromJSONObject(diffJSONObjects(obj1,obj2));gIsDiff=false;}catch(ex){handleException(ex);}});});}
let kProcessPathSep="^:^:^";function DReport(aKind,aUnits,aAmount,aDescription,aNMerged,aPresence){this._kind=aKind;this._units=aUnits;this._amount=aAmount;this._description=aDescription;this._nMerged=aNMerged;if(aPresence!==undefined){this._presence=aPresence;}}
DReport.prototype={assertCompatible(aKind,aUnits){assert(this._kind==aKind,"Mismatched kinds");assert(this._units==aUnits,"Mismatched units");



},merge(aJr){this.assertCompatible(aJr.kind,aJr.units);this._amount+=aJr.amount;this._nMerged++;},toJSON(aProcess,aPath,aAmount){return{process:aProcess,path:aPath,kind:this._kind,units:this._units,amount:aAmount,description:this._description,_presence:this._presence,};},};
DReport.PRESENT_IN_FIRST_ONLY=1;DReport.PRESENT_IN_SECOND_ONLY=2;DReport.ADDED_FOR_BALANCE=3;function hasWebIsolatedProcess(aJSONReports){for(let jr of aJSONReports){assert(jr.process!==undefined,"Missing process");if(jr.process.startsWith("webIsolated")){return true;}}
return false;}
function makeDReportMap(aJSONReports,aForgetIsolation){let dreportMap={};for(let jr of aJSONReports){assert(jr.process!==undefined,"Missing process");assert(jr.path!==undefined,"Missing path");assert(jr.kind!==undefined,"Missing kind");assert(jr.units!==undefined,"Missing units");assert(jr.amount!==undefined,"Missing amount");assert(jr.description!==undefined,"Missing description");




 
let pidRegex=/pid([ =])\d+/g;let pidSubst="pid$1NNN";let process=jr.process.replace(pidRegex,pidSubst);let path=jr.path.replace(pidRegex,pidSubst);if(aForgetIsolation&&process.startsWith("webIsolated")){process="web (pid NNN)";}
path=path.replace(/\(tid=(\d+)\)/,"(tid=NNN)");path=path.replace(/#\d+ \(tid=NNN\)/,"#N (tid=NNN)");path=path.replace(/zone\(0x[0-9A-Fa-f]+\)\//,"zone(0xNNN)/");path=path.replace(/\/worker\((.+), 0x[0-9A-Fa-f]+\)\//,"/worker($1, 0xNNN)/");path=path.replace(/^((?:explicit|event-counts)\/window-objects\/top\(.*, id=)\d+\)/,"$1NNN)");
path=path.replace(/moz-nullprincipal:{........-....-....-....-............}/g,"moz-nullprincipal:{NNNNNNNN-NNNN-NNNN-NNNN-NNNNNNNNNNNN}");if(path.startsWith("address-space")){path=path.replace(/\(segments=\d+\)/g,"(segments=NNNN)");}
path=path.replace(/jar:file:\\\\\\(.+)\\omni.ja!/,"jar:file:\\\\\\...\\omni.ja!");path=path.replace(/source\(scripts=(\d+), /,"source(scripts=NNN, ");let processPath=process+kProcessPathSep+path;let rOld=dreportMap[processPath];if(rOld===undefined){dreportMap[processPath]=new DReport(jr.kind,jr.units,jr.amount,jr.description,1,undefined);}else{rOld.merge(jr);}}
return dreportMap;}

function diffDReportMaps(aDReportMap1,aDReportMap2){let result={};for(let processPath in aDReportMap1){let r1=aDReportMap1[processPath];let r2=aDReportMap2[processPath];let r2_amount,r2_nMerged;let presence;if(r2!==undefined){r1.assertCompatible(r2._kind,r2._units);r2_amount=r2._amount;r2_nMerged=r2._nMerged;delete aDReportMap2[processPath];presence=undefined;}else{r2_amount=0;r2_nMerged=0;presence=DReport.PRESENT_IN_FIRST_ONLY;}
result[processPath]=new DReport(r1._kind,r1._units,r2_amount-r1._amount,r1._description,Math.max(r1._nMerged,r2_nMerged),presence);}
for(let processPath in aDReportMap2){let r2=aDReportMap2[processPath];result[processPath]=new DReport(r2._kind,r2._units,r2._amount,r2._description,r2._nMerged,DReport.PRESENT_IN_SECOND_ONLY);}
return result;}
function makeJSONReports(aDReportMap){let reports=[];for(let processPath in aDReportMap){let r=aDReportMap[processPath];if(r._amount!==0){


let split=processPath.split(kProcessPathSep);assert(split.length>=2);let process=split.shift();let path=split.join();reports.push(r.toJSON(process,path,r._amount));for(let i=1;i<r._nMerged;i++){reports.push(r.toJSON(process,path,0));}}}
return reports;}
function diffJSONObjects(aJson1,aJson2){function simpleProp(aProp){assert(aJson1[aProp]!==undefined&&aJson1[aProp]===aJson2[aProp],aProp+" properties don't match");return aJson1[aProp];}




let hasIsolated1=hasWebIsolatedProcess(aJson1.reports);let hasIsolated2=hasWebIsolatedProcess(aJson2.reports);let eitherIsolated=hasIsolated1||hasIsolated2;let forgetIsolation=hasIsolated1!=hasIsolated2&&eitherIsolated;return{version:simpleProp("version"),hasMozMallocUsableSize:simpleProp("hasMozMallocUsableSize"),reports:makeJSONReports(diffDReportMaps(makeDReportMap(aJson1.reports,forgetIsolation),makeDReportMap(aJson2.reports,forgetIsolation))),};}
function PColl(){this._trees={};this._degenerates={};this._heapTotal=0;}
function appendAboutMemoryMain(aProcessReports,aFilter,aHasMozMallocUsableSize){let pcollsByProcess={};let infoByProcess={};function handleReport(aProcess,aUnsafePath,aKind,aUnits,aAmount,aDescription,aPresence){if(aUnsafePath.startsWith("explicit/")){assertInput(aKind===KIND_HEAP||aKind===KIND_NONHEAP,"bad explicit kind");assertInput(aUnits===UNITS_BYTES,"bad explicit units");}
assert(aPresence===undefined||aPresence==DReport.PRESENT_IN_FIRST_ONLY||aPresence==DReport.PRESENT_IN_SECOND_ONLY,"bad presence");


let process=aProcess?aProcess:gMainProcessPrefix+" (pid "+Services.appinfo.processID+")";

let info=infoByProcess[process];if(!info){info=infoByProcess[process]={};}
if(aUnsafePath=="resident"){infoByProcess[process].resident=aAmount;}
if(!stringMatchesFilter(aUnsafePath,aFilter)){return;}
let unsafeNames=aUnsafePath.split("/");let unsafeName0=unsafeNames[0];let isDegenerate=unsafeNames.length===1;let pcoll=pcollsByProcess[process];if(!pcollsByProcess[process]){pcoll=pcollsByProcess[process]=new PColl();}
let psubcoll=isDegenerate?pcoll._degenerates:pcoll._trees;let t=psubcoll[unsafeName0];if(!t){t=psubcoll[unsafeName0]=new TreeNode(unsafeName0,aUnits,isDegenerate);}
if(!isDegenerate){
for(let i=1;i<unsafeNames.length;i++){let unsafeName=unsafeNames[i];let u=t.findKid(unsafeName);if(!u){u=new TreeNode(unsafeName,aUnits,isDegenerate);if(!t._kids){t._kids=[];}
t._kids.push(u);}
t=u;}
if(unsafeName0==="explicit"&&aKind==KIND_HEAP){pcollsByProcess[process]._heapTotal+=aAmount;}}
if(t._amount){t._amount+=aAmount;t._nMerged=t._nMerged?t._nMerged+1:2;assert(t._presence===aPresence,"presence mismatch");}else{t._amount=aAmount;t._description=aDescription;if(aPresence!==undefined){t._presence=aPresence;}}}
function displayReports(){let processes=Object.keys(infoByProcess);processes.sort(function(aProcessA,aProcessB){assert(aProcessA!=aProcessB,`Elements of Object.keys() should be unique, but `+`saw duplicate '${aProcessA}' elem.`);if(aProcessA.startsWith(gMainProcessPrefix)){return-1;}
if(aProcessB.startsWith(gMainProcessPrefix)){return 1;}
let residentA=infoByProcess[aProcessA].resident||-1;let residentB=infoByProcess[aProcessB].resident||-1;if(residentA>residentB){return-1;}
if(residentA<residentB){return 1;}
if(aProcessA<aProcessB){return-1;}
if(aProcessA>aProcessB){return 1;}
return 0;});


let sections=newElement("div","sections");for(let[i,process]of processes.entries()){let pcolls=pcollsByProcess[process];if(!pcolls){continue;}
let section=appendElement(sections,"div","section");appendProcessAboutMemoryElements(section,i,process,pcolls._trees,pcolls._degenerates,pcolls._heapTotal,aHasMozMallocUsableSize,aFilter!="");}
if(!sections.firstChild){appendElementWithText(sections,"div","section","No results found.");}
let indexItem=newElement("div","sidebarItem");indexItem.classList.add("indexItem");appendElementWithText(indexItem,"div","sidebarLabel","Process index");let indexList=appendElement(indexItem,"ul","index");for(let[i,process]of processes.entries()){let indexListItem=appendElement(indexList,"li");let pcolls=pcollsByProcess[process];if(pcolls){let indexLink=appendElementWithText(indexListItem,"a","",process);indexLink.href="#start"+i;}else{

indexListItem.textContent=process;}}
let outputContainer=gMain.querySelector(".outputContainer");if(outputContainer){outputContainer.querySelector(".sections").replaceWith(sections);outputContainer.querySelector(".indexItem").replaceWith(indexItem);return;}
outputContainer=appendElement(gMain,"div","outputContainer");outputContainer.appendChild(sections);let sidebar=appendElement(outputContainer,"div","sidebar");let sidebarContents=appendElement(sidebar,"div","sidebarContents");let filterItem=appendElement(sidebarContents,"div","sidebarItem");filterItem.classList.add("filterItem");appendElementWithText(filterItem,"div","sidebarLabel","Filter");let filterInput=appendElement(filterItem,"input","filterInput");filterInput.placeholder="Memory report path filter";let filterOptions=appendElement(filterItem,"div");let filterRegExLabel=appendElement(filterOptions,"label");let filterRegExCheckbox=appendElement(filterRegExLabel,"input");filterRegExCheckbox.type="checkbox";filterRegExLabel.append(" Regular expression");
let filterUpdateTimeout;let filterUpdate=function(){if(filterUpdateTimeout){window.clearTimeout(filterUpdateTimeout);}
filterUpdateTimeout=window.setTimeout(function(){try{gFilter=filterRegExCheckbox.checked&&filterInput.value!=""?new RegExp(filterInput.value):filterInput.value;}catch(ex){gFilter=new RegExp("^$");}
updateAboutMemoryFromCurrentData();},gFilterUpdateDelayMS);};filterInput.oninput=filterUpdate;filterRegExCheckbox.onchange=filterUpdate;sidebarContents.appendChild(indexItem);}
aProcessReports(handleReport,displayReports);}


function TreeNode(aUnsafeName,aUnits,aIsDegenerate){this._units=aUnits;this._unsafeName=aUnsafeName;if(aIsDegenerate){this._isDegenerate=true;}





}
TreeNode.prototype={findKid(aUnsafeName){if(this._kids){for(let kid of this._kids){if(kid._unsafeName===aUnsafeName){return kid;}}}
return undefined;},



maxAbsDescendant(){if(!this._kids){return Math.abs(this._amount);}
if("_maxAbsDescendant"in this){return this._maxAbsDescendant;}
let max=Math.abs(this._amount);for(let kid of this._kids){max=Math.max(max,kid.maxAbsDescendant());}
this._maxAbsDescendant=max;return max;},toString(){switch(this._units){case UNITS_BYTES:return formatBytes(this._amount);case UNITS_COUNT:case UNITS_COUNT_CUMULATIVE:return formatNum(this._amount);case UNITS_PERCENTAGE:return formatPercentage(this._amount);default:throw new Error("Invalid memory report(s): bad units in TreeNode.toString");}},};

TreeNode.compareAmounts=function(aA,aB){let a,b;if(gIsDiff){a=aA.maxAbsDescendant();b=aB.maxAbsDescendant();}else{a=aA._amount;b=aB._amount;}
if(a>b){return-1;}
if(a<b){return 1;}
return TreeNode.compareUnsafeNames(aA,aB);};TreeNode.compareUnsafeNames=function(aA,aB){return aA._unsafeName.localeCompare(aB._unsafeName);};function fillInTree(aRoot){function fillInNonLeafNodes(aT){if(!aT._kids){}else if(aT._kids.length===1&&aT!=aRoot){
let kid=aT._kids[0];let kidBytes=fillInNonLeafNodes(kid);aT._unsafeName+="/"+kid._unsafeName;if(kid._kids){aT._kids=kid._kids;}else{delete aT._kids;}
aT._amount=kidBytes;aT._description=kid._description;if(kid._nMerged!==undefined){aT._nMerged=kid._nMerged;}
assert(!aT._hideKids&&!kid._hideKids,"_hideKids set when merging");}else{
let kidsBytes=0;for(let kid of aT._kids){kidsBytes+=fillInNonLeafNodes(kid);}


if(aT._amount!==undefined&&(aT._presence===DReport.PRESENT_IN_FIRST_ONLY||aT._presence===DReport.PRESENT_IN_SECOND_ONLY)){aT._amount+=kidsBytes;let fake=new TreeNode("(fake child)",aT._units);fake._presence=DReport.ADDED_FOR_BALANCE;fake._amount=aT._amount-kidsBytes;aT._kids.push(fake);delete aT._presence;}else{assert(aT._amount===undefined,"_amount already set for non-leaf node");aT._amount=kidsBytes;}
aT._description="The sum of all entries below this one.";}
return aT._amount;}
fillInNonLeafNodes(aRoot);}
function addHeapUnclassifiedNode(aT,aHeapAllocatedNode,aHeapTotal){if(aHeapAllocatedNode===undefined){return false;}
if(aT.findKid("heap-unclassified")){return true;}
assert(aHeapAllocatedNode._isDegenerate,"heap-allocated is not degenerate");let heapAllocatedBytes=aHeapAllocatedNode._amount;let heapUnclassifiedT=new TreeNode("heap-unclassified",UNITS_BYTES);heapUnclassifiedT._amount=heapAllocatedBytes-aHeapTotal;heapUnclassifiedT._description="Memory not classified by a more specific report. This includes "+"slop bytes due to internal fragmentation in the heap allocator "+"(caused when the allocator rounds up request sizes).";aT._kids.push(heapUnclassifiedT);aT._amount+=heapUnclassifiedT._amount;return true;}
function sortTreeAndInsertAggregateNodes(aTotalBytes,aT){const kSignificanceThresholdPerc=1;function isInsignificant(aT){if(gVerbose.checked){return false;}
let perc=gIsDiff?(100*aT.maxAbsDescendant())/Math.abs(aTotalBytes):(100*aT._amount)/aTotalBytes;return perc<kSignificanceThresholdPerc;}
if(!aT._kids){return;}
aT._kids.sort(TreeNode.compareAmounts);

if(isInsignificant(aT._kids[0])){aT._hideKids=true;for(let kid of aT._kids){sortTreeAndInsertAggregateNodes(aTotalBytes,kid);}
return;}
let i;for(i=0;i<aT._kids.length-1;i++){if(isInsignificant(aT._kids[i])){
let i0=i;let nAgg=aT._kids.length-i0;
let aggT=new TreeNode(`(${nAgg} tiny)`,aT._units);aggT._kids=[];let aggBytes=0;for(;i<aT._kids.length;i++){aggBytes+=aT._kids[i]._amount;aggT._kids.push(aT._kids[i]);}
aggT._hideKids=true;aggT._amount=aggBytes;aggT._description=nAgg+" sub-trees that are below the "+
kSignificanceThresholdPerc+"% significance threshold.";aT._kids.splice(i0,nAgg,aggT);aT._kids.sort(TreeNode.compareAmounts);for(let kid of aggT._kids){sortTreeAndInsertAggregateNodes(aTotalBytes,kid);}
return;}
sortTreeAndInsertAggregateNodes(aTotalBytes,aT._kids[i]);}


sortTreeAndInsertAggregateNodes(aTotalBytes,aT._kids[i]);}


let gUnsafePathsWithInvalidValuesForThisProcess=[];function appendWarningElements(aP,aHasKnownHeapAllocated,aHasMozMallocUsableSize,aFiltered){
if(!aFiltered&&!aHasKnownHeapAllocated&&!aHasMozMallocUsableSize){appendElementWithText(aP,"p","","WARNING: the 'heap-allocated' memory reporter and the "+"moz_malloc_usable_size() function do not work for this platform "+"and/or configuration.  This means that 'heap-unclassified' is not "+"shown and the 'explicit' tree shows much less memory than it should.\n\n");}else if(!aFiltered&&!aHasKnownHeapAllocated){appendElementWithText(aP,"p","","WARNING: the 'heap-allocated' memory reporter does not work for this "+"platform and/or configuration. This means that 'heap-unclassified' "+"is not shown and the 'explicit' tree shows less memory than it should.\n\n");}else if(!aFiltered&&!aHasMozMallocUsableSize){appendElementWithText(aP,"p","","WARNING: the moz_malloc_usable_size() function does not work for "+"this platform and/or configuration.  This means that much of the "+"heap-allocated memory is not measured by individual memory reporters "+"and so will fall under 'heap-unclassified'.\n\n");}
if(gUnsafePathsWithInvalidValuesForThisProcess.length){let div=appendElement(aP,"div");appendElementWithText(div,"p","","WARNING: the following values are negative or unreasonably large.\n");let ul=appendElement(div,"ul");for(let i=0;i<gUnsafePathsWithInvalidValuesForThisProcess.length;i++){appendTextNode(ul," ");appendElementWithText(ul,"li","",flipBackslashes(gUnsafePathsWithInvalidValuesForThisProcess[i])+"\n");}
appendElementWithText(div,"p","","This indicates a defect in one or more memory reporters.  The "+"invalid values are highlighted.\n\n");gUnsafePathsWithInvalidValuesForThisProcess=[];}}
function appendProcessAboutMemoryElements(aP,aN,aProcess,aTrees,aDegenerates,aHeapTotal,aHasMozMallocUsableSize,aFiltered){let appendLink=function(aHere,aThere,aArrow){let link=appendElementWithText(aP,"a","upDownArrow",aArrow);link.href="#"+aThere+aN;link.id=aHere+aN;link.title=`Go to the ${aThere} of ${aProcess}`;link.style="text-decoration: none";appendElementWithText(aP,"span","","\n");};appendElementWithText(aP,"h1","",aProcess);appendLink("start","end","↓");let warningsDiv=appendElement(aP,"div","accuracyWarning");let hasExplicitTree;let hasKnownHeapAllocated;{let treeName="explicit";let t=aTrees[treeName];if(t){let pre=appendSectionHeader(aP,"Explicit Allocations");hasExplicitTree=true;fillInTree(t);


hasKnownHeapAllocated=aDegenerates&&addHeapUnclassifiedNode(t,aDegenerates["heap-allocated"],aHeapTotal);sortTreeAndInsertAggregateNodes(t._amount,t);t._description=explicitTreeDescription;appendTreeElements(pre,t,aProcess,"");delete aTrees[treeName];}
appendTextNode(aP,"\n");}
let otherTrees=[];for(let unsafeName in aTrees){let t=aTrees[unsafeName];assert(!t._isDegenerate,"tree is degenerate");fillInTree(t);sortTreeAndInsertAggregateNodes(t._amount,t);otherTrees.push(t);}
otherTrees.sort(TreeNode.compareUnsafeNames);let otherDegenerates=[];let maxStringLength=0;for(let unsafeName in aDegenerates){let t=aDegenerates[unsafeName];assert(t._isDegenerate,"tree is not degenerate");let length=t.toString().length;if(length>maxStringLength){maxStringLength=length;}
otherDegenerates.push(t);}
otherDegenerates.sort(TreeNode.compareUnsafeNames);if(otherTrees.length||otherDegenerates.length){let pre=appendSectionHeader(aP,"Other Measurements");for(let t of otherTrees){appendTreeElements(pre,t,aProcess,"");appendTextNode(pre,"\n");}
for(let t of otherDegenerates){let padText="".padStart(maxStringLength-t.toString().length," ");appendTreeElements(pre,t,aProcess,padText);}
appendTextNode(aP,"\n");}


if(hasExplicitTree){appendWarningElements(warningsDiv,hasKnownHeapAllocated,aHasMozMallocUsableSize,aFiltered);}
appendElementWithText(aP,"h3","","End of "+aProcess);appendLink("end","start","↑");}

const kStyleLocale="en-US";const kMBFormat=new Intl.NumberFormat(kStyleLocale,{minimumFractionDigits:2,maximumFractionDigits:2,});const kPercFormatter=new Intl.NumberFormat(kStyleLocale,{style:"percent",minimumFractionDigits:2,maximumFractionDigits:2,});const kFracFormatter=new Intl.NumberFormat(kStyleLocale,{style:"percent",minimumIntegerDigits:2,minimumFractionDigits:2,maximumFractionDigits:2,});const kFrac1Formatter=new Intl.NumberFormat(kStyleLocale,{style:"percent",minimumIntegerDigits:3,minimumFractionDigits:1,maximumFractionDigits:1,});const kDefaultNumFormatter=new Intl.NumberFormat(kStyleLocale);function formatNum(aN,aFormatter){return(aFormatter||kDefaultNumFormatter).format(aN);}
function formatBytes(aBytes){return gVerbose.checked?`${formatNum(aBytes)} B`:`${formatNum(aBytes / (1024 * 1024), kMBFormat)} MB`;}
function formatPercentage(aPerc100x){
return formatNum(aPerc100x/10000,kPercFormatter);}
function formatTreeFrac(aNum,aDenom){
let num=aDenom===0?1:aNum/aDenom;return 0.99995<=num&&num<=1?formatNum(1,kFrac1Formatter):formatNum(num,kFracFormatter);}
const kNoKidsSep=" ── ",kHideKidsSep=" ++ ",kShowKidsSep=" -- ";function appendMrNameSpan(aP,aDescription,aUnsafeName,aIsInvalid,aNMerged,aPresence){let safeName=flipBackslashes(aUnsafeName);if(!aIsInvalid&&!aNMerged&&!aPresence){safeName+="\n";}
let nameSpan=appendElementWithText(aP,"span","mrName",safeName);nameSpan.title=aDescription;if(aIsInvalid){let noteText=" [?!]";if(!aNMerged){noteText+="\n";}
let noteSpan=appendElementWithText(aP,"span","mrNote",noteText);noteSpan.title="Warning: this value is invalid and indicates a bug in one or more "+"memory reporters. ";}
if(aNMerged){let noteText=` [${aNMerged}]`;if(!aPresence){noteText+="\n";}
let noteSpan=appendElementWithText(aP,"span","mrNote",noteText);noteSpan.title="This value is the sum of "+
aNMerged+" memory reports that all have the same path.";}
if(aPresence){let c,title;switch(aPresence){case DReport.PRESENT_IN_FIRST_ONLY:c="-";title="This value was only present in the first set of memory reports.";break;case DReport.PRESENT_IN_SECOND_ONLY:c="+";title="This value was only present in the second set of memory reports.";break;case DReport.ADDED_FOR_BALANCE:c="!";title="One of the sets of memory reports lacked children for this "+"node's parent. This is a fake child node added to make the "+"two memory sets comparable.";break;default:assert(false,"bad presence");break;}
let noteSpan=appendElementWithText(aP,"span","mrNote",` [${c}]\n`);noteSpan.title=title;}}






let gShowSubtreesBySafeTreeId={};function assertClassListContains(aElem,aClassName){assert(aElem,"undefined "+aClassName);assert(aElem.classList.contains(aClassName),"classname isn't "+aClassName);}
function toggle(aEvent){


let outerSpan=aEvent.target.parentNode;assertClassListContains(outerSpan,"hasKids");let isExpansion;let sepSpan=outerSpan.childNodes[2];assertClassListContains(sepSpan,"mrSep");if(sepSpan.textContent===kHideKidsSep){isExpansion=true;sepSpan.textContent=kShowKidsSep;}else if(sepSpan.textContent===kShowKidsSep){isExpansion=false;sepSpan.textContent=kHideKidsSep;}else{assert(false,"bad sepSpan textContent");}
let subTreeSpan=outerSpan.nextSibling;assertClassListContains(subTreeSpan,"kids");subTreeSpan.classList.toggle("hidden");let safeTreeId=outerSpan.id;if(gShowSubtreesBySafeTreeId[safeTreeId]!==undefined){delete gShowSubtreesBySafeTreeId[safeTreeId];}else{gShowSubtreesBySafeTreeId[safeTreeId]=isExpansion;}}
function expandPathToThisElement(aElement){if(aElement.classList.contains("kids")){aElement.classList.remove("hidden");expandPathToThisElement(aElement.previousSibling);}else if(aElement.classList.contains("hasKids")){let sepSpan=aElement.childNodes[2];assertClassListContains(sepSpan,"mrSep");sepSpan.textContent=kShowKidsSep;expandPathToThisElement(aElement.parentNode);}else{assertClassListContains(aElement,"entries");}}
function appendTreeElements(aP,aRoot,aProcess,aPadText){function appendTreeElements2(aP,aProcess,aUnsafeNames,aRoot,aT,aTlThis,aTlKids,aParentStringLength){function appendN(aS,aC,aN){for(let i=0;i<aN;i++){aS+=aC;}
return aS;}
let valueText=aT.toString();let extraTlLength=Math.max(aParentStringLength-valueText.length,0);if(extraTlLength>0){aTlThis=appendN(aTlThis,"─",extraTlLength);aTlKids=appendN(aTlKids," ",extraTlLength);}
appendElementWithText(aP,"span","treeline",aTlThis);
assertInput(aRoot._units===aT._units,"units within a tree are inconsistent");let tIsInvalid=false;if(!gIsDiff&&!(0<=aT._amount&&aT._amount<=aRoot._amount)){tIsInvalid=true;let unsafePath=aUnsafeNames.join("/");gUnsafePathsWithInvalidValuesForThisProcess.push(unsafePath);reportAssertionFailure(`Invalid value (${aT._amount} / ${aRoot._amount}) for `+
flipBackslashes(unsafePath));}

let d;let sep;let showSubtrees;if(aT._kids){
let unsafePath=aUnsafeNames.join("/");let safeTreeId=`${aProcess}:${flipBackslashes(unsafePath)}`;showSubtrees=!aT._hideKids;if(gShowSubtreesBySafeTreeId[safeTreeId]!==undefined){showSubtrees=gShowSubtreesBySafeTreeId[safeTreeId];}
d=appendElement(aP,"span","hasKids");d.id=safeTreeId;d.onclick=toggle;sep=showSubtrees?kShowKidsSep:kHideKidsSep;}else{assert(!aT._hideKids,"leaf node with _hideKids set");sep=kNoKidsSep;d=aP;}
appendElementWithText(d,"span","mrValue"+(tIsInvalid?" invalid":""),valueText);if(!aT._isDegenerate){let percText=formatTreeFrac(aT._amount,aRoot._amount);appendElementWithText(d,"span","mrPerc",` (${percText})`);}
appendElementWithText(d,"span","mrSep",sep);appendMrNameSpan(d,aT._description,aT._unsafeName,tIsInvalid,aT._nMerged,aT._presence);if(!gVerbose.checked&&tIsInvalid){expandPathToThisElement(d);}
if(aT._kids){d=appendElement(aP,"span",showSubtrees?"kids":"kids hidden");let tlThisForMost,tlKidsForMost;if(aT._kids.length>1){tlThisForMost=aTlKids+"├──";tlKidsForMost=aTlKids+"│  ";}
let tlThisForLast=aTlKids+"└──";let tlKidsForLast=aTlKids+"   ";for(let[i,kid]of aT._kids.entries()){let isLast=i==aT._kids.length-1;aUnsafeNames.push(kid._unsafeName);appendTreeElements2(d,aProcess,aUnsafeNames,aRoot,kid,!isLast?tlThisForMost:tlThisForLast,!isLast?tlKidsForMost:tlKidsForLast,valueText.length);aUnsafeNames.pop();}}}
let rootStringLength=aRoot.toString().length;appendTreeElements2(aP,aProcess,[aRoot._unsafeName],aRoot,aRoot,aPadText,aPadText,rootStringLength);}
function appendSectionHeader(aP,aText){appendElementWithText(aP,"h2","",aText+"\n");return appendElement(aP,"pre","entries");}
function saveReportsToFile(){let fp=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);fp.appendFilter("Zipped JSON files","*.json.gz");fp.appendFilters(Ci.nsIFilePicker.filterAll);fp.filterIndex=0;fp.addToRecentDocs=true;fp.defaultString="memory-report.json.gz";let fpFinish=function(aFile){let dumper=Cc["@mozilla.org/memory-info-dumper;1"].getService(Ci.nsIMemoryInfoDumper);let finishDumping=()=>{updateMainAndFooter("Saved memory reports to "+aFile.path,SHOW_TIMESTAMP,HIDE_FOOTER);};dumper.dumpMemoryReportsToNamedFile(aFile.path,finishDumping,null,gAnonymize.checked,false);};let fpCallback=function(aResult){if(aResult==Ci.nsIFilePicker.returnOK||aResult==Ci.nsIFilePicker.returnReplace){fpFinish(fp.file);}};try{fp.init(window,"Save Memory Reports",Ci.nsIFilePicker.modeSave);}catch(ex){Downloads.getSystemDownloadsDirectory().then(function(aDirPath){let file=FileUtils.File(aDirPath);file.append(fp.defaultString);fpFinish(file);});return;}
fp.open(fpCallback);}