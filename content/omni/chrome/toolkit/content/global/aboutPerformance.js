"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AddonManager}=ChromeUtils.import("resource://gre/modules/AddonManager.jsm");const{ExtensionParent}=ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");const{WebExtensionPolicy}=Cu.getGlobalForObject(Services);
const TIME_BEFORE_SORTING_AGAIN=5000;const BUFFER_SAMPLING_RATE_MS=1000;const BUFFER_DURATION_MS=10000;const UPDATE_INTERVAL_MS=2000;const BRAND_BUNDLE=Services.strings.createBundle("chrome://branding/locale/brand.properties");const BRAND_NAME=BRAND_BUNDLE.GetStringFromName("brandShortName");function extensionCountersEnabled(){return Services.prefs.getBoolPref("extensions.webextensions.enablePerformanceCounters",false);}


var gSystemAddonIds=new Set();let tabFinder={update(){this._map=new Map();for(let win of Services.wm.getEnumerator("navigator:browser")){let tabbrowser=win.gBrowser;for(let browser of tabbrowser.browsers){let id=browser.outerWindowID; if(id!=null){this._map.set(id,browser);}}
if(tabbrowser.preloadedBrowser){let browser=tabbrowser.preloadedBrowser;if(browser.outerWindowID){this._map.set(browser.outerWindowID,browser);}}}},get(id){let browser=this._map.get(id);if(!browser){return null;}
let tabbrowser=browser.getTabBrowser();if(!tabbrowser){return{tabbrowser:null,tab:{getAttribute(){return"";},linkedBrowser:browser,},};}
return{tabbrowser,tab:tabbrowser.getTabForBrowser(browser)};},getAny(ids){for(let id of ids){let result=this.get(id);if(result){return result;}}
return null;},};function wait(ms=0){try{let resolve;let p=new Promise(resolve_=>{resolve=resolve_;});setTimeout(resolve,ms);return p;}catch(e){dump("WARNING: wait aborted because of an invalid Window state in aboutPerformance.js.\n");return undefined;}}
var State={_buffer:[],_latest:null,async _promiseSnapshot(){let addons=WebExtensionPolicy.getActiveExtensions();let addonHosts=new Map();for(let addon of addons){addonHosts.set(addon.mozExtensionHostname,addon.id);}
let counters=await ChromeUtils.requestPerformanceMetrics();let tabs={};for(let counter of counters){let{items,host,pid,counterId,windowId,duration,isWorker,memoryInfo,isTopLevel,}=counter;
if(isWorker&&(windowId==18446744073709552000||!windowId)){windowId=1;}
let dispatchCount=0;for(let{count}of items){dispatchCount+=count;}
let memory=0;for(let field in memoryInfo){if(field=="media"){for(let mediaField of["audioSize","videoSize","resourcesSize"]){memory+=memoryInfo.media[mediaField];}
continue;}
memory+=memoryInfo[field];}
let tab;let id=windowId;if(addonHosts.has(host)){id=addonHosts.get(host);}
if(id in tabs){tab=tabs[id];}else{tab={windowId,host,dispatchCount:0,duration:0,memory:0,children:[],};tabs[id]=tab;}
tab.dispatchCount+=dispatchCount;tab.duration+=duration;tab.memory+=memory;if(!isTopLevel||isWorker){tab.children.push({host,isWorker,dispatchCount,duration,memory,counterId:pid+":"+counterId,});}}
if(extensionCountersEnabled()){let extCounters=await ExtensionParent.ParentAPIManager.retrievePerformanceCounters();for(let[id,apiMap]of extCounters){let dispatchCount=0,duration=0;for(let[,counter]of apiMap){dispatchCount+=counter.calls;duration+=counter.duration;}
let tab;if(id in tabs){tab=tabs[id];}else{tab={windowId:0,host:id,dispatchCount:0,duration:0,memory:0,children:[],};tabs[id]=tab;}
tab.dispatchCount+=dispatchCount;tab.duration+=duration;}}
return{tabs,date:Cu.now()};},async update(){if(!this._buffer.length){this._latest=await this._promiseSnapshot();this._buffer.push(this._latest);await wait(BUFFER_SAMPLING_RATE_MS*1.1);}
let now=Cu.now();let latestInBuffer=this._buffer[this._buffer.length-1];let deltaT=now-latestInBuffer.date;if(deltaT>BUFFER_SAMPLING_RATE_MS){this._latest=await this._promiseSnapshot();this._buffer.push(this._latest);}
let oldestInBuffer=this._buffer[0];if(oldestInBuffer.date+BUFFER_DURATION_MS<this._latest.date){this._buffer.shift();}},
_trackingState:new Map(),isTracker(host){if(!this._trackingState.has(host)){
this._trackingState.set(host,false);if(host.startsWith("about:")||host.startsWith("moz-nullprincipal")){return false;}
let uri=Services.io.newURI("http://"+host);let classifier=Cc["@mozilla.org/url-classifier/dbservice;1"].getService(Ci.nsIURIClassifier);let feature=classifier.getFeatureByName("tracking-protection");if(!feature){return false;}
classifier.asyncClassifyLocalWithFeatures(uri,[feature],Ci.nsIUrlClassifierFeature.blocklist,list=>{if(list.length){this._trackingState.set(host,true);}});}
return this._trackingState.get(host);},getCounters(){tabFinder.update();

let previous=this._buffer[Math.max(this._buffer.length-2,0)].tabs;let current=this._latest.tabs;let counters=[];for(let id of Object.keys(current)){let tab=current[id];let oldest;for(let index=0;index<=this._buffer.length-2;++index){if(id in this._buffer[index].tabs){oldest=this._buffer[index].tabs[id];break;}}
let prev=previous[id];let host=tab.host;let type="other";let name=`${host} (${id})`;let image="chrome://mozapps/skin/places/defaultFavicon.svg";let found=tabFinder.get(parseInt(id));if(found){if(found.tabbrowser){name=found.tab.getAttribute("label");image=found.tab.getAttribute("image");type="tab";}else{name={id:"preloaded-tab",title:found.tab.linkedBrowser.contentTitle,};}}else if(id==1){name=BRAND_NAME;image="chrome://branding/content/icon32.png";type="browser";}else if(/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(host)){let addon=WebExtensionPolicy.getByHostname(host);if(!addon){continue;}
name=`${addon.name} (${addon.id})`;image="chrome://mozapps/skin/extensions/extension.svg";type=gSystemAddonIds.has(addon.id)?"system-addon":"addon";}else if(id==0&&!tab.isWorker){name={id:"ghost-windows"};}
if(type!="tab"&&type!="addon"&&!Services.prefs.getBoolPref("toolkit.aboutPerformance.showInternals",false)){continue;}


let prevChildren=new Map();if(prev){for(let child of prev.children){prevChildren.set(child.counterId,child);}}
let children=tab.children.map(child=>{let{host,dispatchCount,duration,memory,isWorker,counterId,}=child;let dispatchesSincePrevious=dispatchCount;let durationSincePrevious=duration;if(prevChildren.has(counterId)){let prevCounter=prevChildren.get(counterId);dispatchesSincePrevious-=prevCounter.dispatchCount;durationSincePrevious-=prevCounter.duration;prevChildren.delete(counterId);}
return{host,dispatchCount,duration,isWorker,memory,dispatchesSincePrevious,durationSincePrevious,};});

tab.dispatchesFromFormerChildren=(prev&&prev.dispatchesFromFormerChildren)||0;tab.durationFromFormerChildren=(prev&&prev.durationFromFormerChildren)||0;for(let[,counter]of prevChildren){tab.dispatchesFromFormerChildren+=counter.dispatchCount;tab.durationFromFormerChildren+=counter.duration;}

let dispatches=tab.dispatchCount+tab.dispatchesFromFormerChildren;let duration=tab.duration+tab.durationFromFormerChildren;let durationSincePrevious=NaN;let dispatchesSincePrevious=NaN;let dispatchesSinceStartOfBuffer=NaN;let durationSinceStartOfBuffer=NaN;if(prev){durationSincePrevious=duration-prev.duration-(prev.durationFromFormerChildren||0);dispatchesSincePrevious=dispatches-
prev.dispatchCount-
(prev.dispatchesFromFormerChildren||0);}
if(oldest){dispatchesSinceStartOfBuffer=dispatches-
oldest.dispatchCount-
(oldest.dispatchesFromFormerChildren||0);durationSinceStartOfBuffer=duration-oldest.duration-(oldest.durationFromFormerChildren||0);}
counters.push({id,name,image,type,memory:tab.memory,totalDispatches:dispatches,totalDuration:duration,durationSincePrevious,dispatchesSincePrevious,durationSinceStartOfBuffer,dispatchesSinceStartOfBuffer,children,});}
return counters;},getMaxEnergyImpact(counters){return Math.max(...counters.map(c=>{return Control._computeEnergyImpact(c.dispatchesSincePrevious,c.durationSincePrevious);}));},};var View={_fragment:document.createDocumentFragment(),async commit(){let tbody=document.getElementById("dispatch-tbody");
await document.l10n.translateFragment(this._fragment);while(tbody.firstChild){tbody.firstChild.remove();}
tbody.appendChild(this._fragment);this._fragment=document.createDocumentFragment();},insertAfterRow(row){row.parentNode.insertBefore(this._fragment,row.nextSibling);this._fragment=document.createDocumentFragment();},displayEnergyImpact(elt,energyImpact,maxEnergyImpact){if(!energyImpact){elt.textContent="–";elt.style.setProperty("--bar-width",0);}else{let impact;let barWidth;const mediumEnergyImpact=25;if(energyImpact<1){impact="low";barWidth=10*energyImpact;}else if(energyImpact<mediumEnergyImpact){impact="medium";barWidth=(10+2*energyImpact)*(5/6);}else{impact="high";let energyImpactFromZero=energyImpact-mediumEnergyImpact;if(maxEnergyImpact>100){barWidth=50+
(energyImpactFromZero/(maxEnergyImpact-mediumEnergyImpact))*50;}else{barWidth=50+energyImpactFromZero*(2/3);}}
document.l10n.setAttributes(elt,"energy-impact-"+impact,{value:energyImpact,});if(maxEnergyImpact!=-1){elt.style.setProperty("--bar-width",barWidth);}}},appendRow(name,energyImpact,memory,tooltip,type,maxEnergyImpact=-1,image=""){let row=document.createElement("tr");let elt=document.createElement("td");if(typeof name=="string"){elt.textContent=name;}else if(name.title){document.l10n.setAttributes(elt,name.id,{title:name.title});}else{document.l10n.setAttributes(elt,name.id);}
if(image){elt.style.backgroundImage=`url('${image}')`;}
if(["subframe","tracker","worker"].includes(type)){elt.classList.add("indent");}else{elt.classList.add("root");}
if(["tracker","worker"].includes(type)){elt.classList.add(type);}
row.appendChild(elt);elt=document.createElement("td");let typeLabelType=type=="system-addon"?"addon":type;document.l10n.setAttributes(elt,"type-"+typeLabelType);row.appendChild(elt);elt=document.createElement("td");elt.classList.add("energy-impact");this.displayEnergyImpact(elt,energyImpact,maxEnergyImpact);row.appendChild(elt);elt=document.createElement("td");if(!memory){elt.textContent="–";}else{let unit="KB";memory=Math.ceil(memory/1024);if(memory>1024){memory=Math.ceil((memory/1024)*10)/10;unit="MB";if(memory>1024){memory=Math.ceil((memory/1024)*100)/100;unit="GB";}}
document.l10n.setAttributes(elt,"size-"+unit,{value:memory});}
row.appendChild(elt);if(tooltip){for(let key of["dispatchesSincePrevious","durationSincePrevious"]){if(Number.isNaN(tooltip[key])||tooltip[key]<0){tooltip[key]="–";}}
document.l10n.setAttributes(row,"item",tooltip);}
elt=document.createElement("td");if(type=="tab"){let img=document.createElement("span");img.className="action-icon close-icon";document.l10n.setAttributes(img,"close-tab");elt.appendChild(img);}else if(type=="addon"){let img=document.createElement("span");img.className="action-icon addon-icon";document.l10n.setAttributes(img,"show-addon");elt.appendChild(img);}
row.appendChild(elt);this._fragment.appendChild(row);return row;},};var Control={_openItems:new Set(),_sortOrder:"",_removeSubtree(row){while(row.nextSibling&&row.nextSibling.firstChild.classList.contains("indent")){row.nextSibling.remove();}},init(){let tbody=document.getElementById("dispatch-tbody");tbody.addEventListener("click",event=>{this._updateLastMouseEvent();let target=event.target;if(target.classList.contains("twisty")){let row=target.parentNode.parentNode;let id=row.windowId;if(target.classList.toggle("open")){this._openItems.add(id);this._showChildren(row);View.insertAfterRow(row);}else{this._openItems.delete(id);this._removeSubtree(row);}
return;}
if(target.classList.contains("close-icon")){let row=target.parentNode.parentNode;let id=parseInt(row.windowId);let found=tabFinder.get(id);if(!found||!found.tabbrowser){return;}
let{tabbrowser,tab}=found;tabbrowser.removeTab(tab);this._removeSubtree(row);row.remove();return;}
if(target.classList.contains("addon-icon")){let row=target.parentNode.parentNode;let id=row.windowId;let parentWin=window.docShell.browsingContext.embedderElement.ownerGlobal;parentWin.BrowserOpenAddonsMgr("addons://detail/"+encodeURIComponent(id));return;} 
let row=target.parentNode;if(this.selectedRow){this.selectedRow.removeAttribute("selected");}
if(row.windowId){row.setAttribute("selected","true");this.selectedRow=row;}else if(this.selectedRow){this.selectedRow=null;}});tbody.addEventListener("dblclick",event=>{let id=parseInt(event.target.parentNode.windowId);if(isNaN(id)){return;}
let found=tabFinder.get(id);if(!found||!found.tabbrowser){return;}
let{tabbrowser,tab}=found;tabbrowser.selectedTab=tab;tabbrowser.ownerGlobal.focus();});tbody.addEventListener("mousemove",()=>{this._updateLastMouseEvent();});window.addEventListener("visibilitychange",event=>{if(!document.hidden){this._updateDisplay(true);}});document.getElementById("dispatch-thead").addEventListener("click",async event=>{if(!event.target.classList.contains("clickable")){return;}
if(this._sortOrder){let[column,direction]=this._sortOrder.split("_");const td=document.getElementById(`column-${column}`);td.classList.remove(direction);}
const columnId=event.target.id;if(columnId=="column-type"){this._sortOrder=this._sortOrder=="type_asc"?"type_desc":"type_asc";}else if(columnId=="column-energy-impact"){this._sortOrder=this._sortOrder=="energy-impact_desc"?"energy-impact_asc":"energy-impact_desc";}else if(columnId=="column-memory"){this._sortOrder=this._sortOrder=="memory_desc"?"memory_asc":"memory_desc";}else if(columnId=="column-name"){this._sortOrder=this._sortOrder=="name_asc"?"name_desc":"name_asc";}
let direction=this._sortOrder.split("_")[1];event.target.classList.add(direction);await this._updateDisplay(true);});},_lastMouseEvent:0,_updateLastMouseEvent(){this._lastMouseEvent=Date.now();},async update(){await State.update();if(document.hidden){return;}
await wait(0);await this._updateDisplay();},
async _updateDisplay(force=false){let counters=State.getCounters();let maxEnergyImpact=State.getMaxEnergyImpact(counters);


if(!force&&Date.now()-this._lastMouseEvent<TIME_BEFORE_SORTING_AGAIN){let energyImpactPerId=new Map();for(let{id,dispatchesSincePrevious,durationSincePrevious,}of counters){let energyImpact=this._computeEnergyImpact(dispatchesSincePrevious,durationSincePrevious);energyImpactPerId.set(id,energyImpact);}
let row=document.getElementById("dispatch-tbody").firstChild;while(row){if(row.windowId&&energyImpactPerId.has(row.windowId)){

const kEnergyImpactColumn=2;let elt=row.childNodes[kEnergyImpactColumn];View.displayEnergyImpact(elt,energyImpactPerId.get(row.windowId),maxEnergyImpact);}
row=row.nextSibling;}
return;}
let selectedId=-1;
if(this.selectedRow){selectedId=this.selectedRow.windowId;this.selectedRow=null;}
let openItems=this._openItems;this._openItems=new Set();counters=this._sortCounters(counters);for(let{id,name,image,type,totalDispatches,dispatchesSincePrevious,memory,totalDuration,durationSincePrevious,children,}of counters){let row=View.appendRow(name,this._computeEnergyImpact(dispatchesSincePrevious,durationSincePrevious),memory,{totalDispatches,totalDuration:Math.ceil(totalDuration/1000),dispatchesSincePrevious,durationSincePrevious:Math.ceil(durationSincePrevious/1000),},type,maxEnergyImpact,image);row.windowId=id;if(id==selectedId){row.setAttribute("selected","true");this.selectedRow=row;}
if(!children.length){continue;}
let elt=row.firstChild;let img=document.createElement("span");img.className="twisty";let open=openItems.has(id);if(open){img.classList.add("open");this._openItems.add(id);}

let l10nAttrs=document.l10n.getAttributes(elt);if(l10nAttrs.id){let span=document.createElement("span");document.l10n.setAttributes(span,l10nAttrs.id,l10nAttrs.args);elt.removeAttribute("data-l10n-id");elt.removeAttribute("data-l10n-args");elt.insertBefore(span,elt.firstChild);}
elt.insertBefore(img,elt.firstChild);row._children=children;if(open){this._showChildren(row);}}
await View.commit();},_showChildren(row){let children=row._children;children.sort((a,b)=>b.dispatchesSincePrevious-a.dispatchesSincePrevious);for(let row of children){let host=row.host.replace(/^blob:https?:\/\//,"");let type="subframe";if(State.isTracker(host)){type="tracker";}
if(row.isWorker){type="worker";}
View.appendRow(row.host,this._computeEnergyImpact(row.dispatchesSincePrevious,row.durationSincePrevious),row.memory,{totalDispatches:row.dispatchCount,totalDuration:Math.ceil(row.duration/1000),dispatchesSincePrevious:row.dispatchesSincePrevious,durationSincePrevious:Math.ceil(row.durationSincePrevious/1000),},type);}},_computeEnergyImpact(dispatches,duration){




let energyImpact=Math.max(duration||0,dispatches*1000)/UPDATE_INTERVAL_MS/10;return Math.ceil(energyImpact*100)/100;},_getTypeWeight(type){let weights={tab:3,addon:2,"system-addon":1,};return weights[type]||0;},_sortCounters(counters){return counters.sort((a,b)=>{
if(a.name.id&&a.name.id=="ghost-windows"){return 1;}
if(this._sortOrder){let res;let[column,order]=this._sortOrder.split("_");switch(column){case"memory":res=a.memory-b.memory;break;case"type":if(a.type!=b.type){res=this._getTypeWeight(b.type)-this._getTypeWeight(a.type);}else{res=String.prototype.localeCompare.call(a.name,b.name);}
break;case"name":res=String.prototype.localeCompare.call(a.name,b.name);break;case"energy-impact":res=this._computeEnergyImpact(a.dispatchesSincePrevious,a.durationSincePrevious)-
this._computeEnergyImpact(b.dispatchesSincePrevious,b.durationSincePrevious);break;default:res=String.prototype.localeCompare.call(a.name,b.name);}
if(order=="desc"){res=-1*res;}
return res;}


let aEI=this._computeEnergyImpact(a.dispatchesSinceStartOfBuffer,a.durationSinceStartOfBuffer);let bEI=this._computeEnergyImpact(b.dispatchesSinceStartOfBuffer,b.durationSinceStartOfBuffer);if(aEI!=bEI){return bEI-aEI;}
return String.prototype.localeCompare.call(a.name,b.name);});},};window.onload=async function(){Control.init();let addons=await AddonManager.getAddonsByTypes(["extension"]);for(let addon of addons){if(addon.isSystem){gSystemAddonIds.add(addon.id);}}
await Control.update();window.setInterval(()=>Control.update(),UPDATE_INTERVAL_MS);};