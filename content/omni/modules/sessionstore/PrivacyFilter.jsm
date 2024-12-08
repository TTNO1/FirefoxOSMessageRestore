"use strict";var EXPORTED_SYMBOLS=["PrivacyFilter"];ChromeUtils.defineModuleGetter(this,"PrivacyLevel","resource://gre/modules/sessionstore/PrivacyLevel.jsm");var PrivacyFilter=Object.freeze({filterSessionStorageData(data){let retval={};for(let host of Object.keys(data)){if(PrivacyLevel.check(host)){retval[host]=data[host];}}
return Object.keys(retval).length?retval:null;},filterFormData(data){

if(!data||(data.url&&!PrivacyLevel.check(data.url))){return null;}
let retval={};for(let key of Object.keys(data)){if(key==="children"){let recurse=child=>this.filterFormData(child);let children=data.children.map(recurse).filter(child=>child);if(children.length){retval.children=children;}

}else if(data.url){retval[key]=data[key];}}
return Object.keys(retval).length?retval:null;},filterPrivateWindowsAndTabs(browserState){for(let i=browserState.windows.length-1;i>=0;i--){let win=browserState.windows[i];if(win.isPrivate){browserState.windows.splice(i,1);if(browserState.selectedWindow>=i){browserState.selectedWindow--;}}else{this.filterPrivateTabs(win);}}
browserState._closedWindows=browserState._closedWindows.filter(win=>!win.isPrivate);browserState._closedWindows.forEach(win=>this.filterPrivateTabs(win));},filterPrivateTabs(winState){for(let i=winState.tabs.length-1;i>=0;i--){let tab=winState.tabs[i];if(tab.isPrivate){winState.tabs.splice(i,1);if(winState.selected>=i){winState.selected--;}}}


},});