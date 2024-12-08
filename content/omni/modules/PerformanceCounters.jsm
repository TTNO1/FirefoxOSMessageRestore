//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["PerformanceCounters"];const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{DeferredTask}=ChromeUtils.import("resource://gre/modules/DeferredTask.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{DefaultMap}=ExtensionUtils;XPCOMUtils.defineLazyPreferenceGetter(this,"gTimingEnabled","extensions.webextensions.enablePerformanceCounters",false);XPCOMUtils.defineLazyPreferenceGetter(this,"gTimingMaxAge","extensions.webextensions.performanceCountersMaxAge",1000);class CounterMap extends DefaultMap{defaultConstructor(){return new DefaultMap(()=>({duration:0,calls:0}));}
flush(){let result=new CounterMap(undefined,this);this.clear();return result;}
merge(other){for(let[webextId,counters]of other){for(let[api,counter]of counters){let current=this.get(webextId).get(api);current.calls+=counter.calls;current.duration+=counter.duration;}}}}
var _performanceCountersSender=null;var PerformanceCounters=null;function _sendPerformanceCounters(childApiManagerId){let counters=PerformanceCounters.flush();if(counters.size==0){_performanceCountersSender.arm();return;}
let options={childId:childApiManagerId,counters:counters};Services.cpmm.sendAsyncMessage("Extension:SendPerformanceCounter",options);_performanceCountersSender.arm();}
class Counters{constructor(){this.data=new CounterMap();}
get enabled(){return gTimingEnabled;}
get maxAge(){return gTimingMaxAge;}
storeExecutionTime(webExtensionId,apiPath,duration,childApiManagerId){let apiCounter=this.data.get(webExtensionId).get(apiPath);apiCounter.duration+=duration;apiCounter.calls+=1;
if(childApiManagerId){if(!_performanceCountersSender){_performanceCountersSender=new DeferredTask(()=>{_sendPerformanceCounters(childApiManagerId);},this.maxAge);_performanceCountersSender.arm();}}}
merge(data){this.data.merge(data);}
flush(){return this.data.flush();}
getData(){return this.data;}}
PerformanceCounters=new Counters();