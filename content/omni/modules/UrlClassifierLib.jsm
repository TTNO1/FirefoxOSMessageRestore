//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------


const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const PREF_DISABLE_TEST_BACKOFF="browser.safebrowsing.provider.test.disableBackoff";this.BindToObject=function BindToObject(fn,self,opt_args){var boundargs=fn.boundArgs_||[];boundargs=boundargs.concat(Array.prototype.slice.call(arguments,2,arguments.length));if(fn.boundSelf_){self=fn.boundSelf_;}
if(fn.boundFn_){fn=fn.boundFn_;}
var newfn=function(){ var args=boundargs.concat(Array.prototype.slice.call(arguments));return fn.apply(self,args);};newfn.boundArgs_=boundargs;newfn.boundSelf_=self;newfn.boundFn_=fn;return newfn;};




this.HTTP_FOUND=302;this.HTTP_SEE_OTHER=303;this.HTTP_TEMPORARY_REDIRECT=307;this.RequestBackoff=function RequestBackoff(maxErrors,retryIncrement,maxRequests,requestPeriod,timeoutIncrement,maxTimeout,tolerance,provider=null){this.MAX_ERRORS_=maxErrors;this.RETRY_INCREMENT_=retryIncrement;this.MAX_REQUESTS_=maxRequests;this.REQUEST_PERIOD_=requestPeriod;this.TIMEOUT_INCREMENT_=timeoutIncrement;this.MAX_TIMEOUT_=maxTimeout;this.TOLERANCE_=tolerance; this.requestTimes_=[];this.numErrors_=0;this.errorTimeout_=0;this.nextRequestTime_=0;if(provider==="test"){this.canMakeRequestDefault=this.canMakeRequest;this.canMakeRequest=function(){if(Services.prefs.getBoolPref(PREF_DISABLE_TEST_BACKOFF,true)){return true;}
return this.canMakeRequestDefault();};}};RequestBackoff.prototype.reset=function(){this.numErrors_=0;this.errorTimeout_=0;this.nextRequestTime_=0;};RequestBackoff.prototype.canMakeRequest=function(){var now=Date.now();
 if(now+this.TOLERANCE_<this.nextRequestTime_){return false;}
return(this.requestTimes_.length<this.MAX_REQUESTS_||now-this.requestTimes_[0]>this.REQUEST_PERIOD_);};RequestBackoff.prototype.noteRequest=function(){var now=Date.now();this.requestTimes_.push(now); if(this.requestTimes_.length>this.MAX_REQUESTS_){this.requestTimes_.shift();}};RequestBackoff.prototype.nextRequestDelay=function(){return Math.max(0,this.nextRequestTime_-Date.now());};RequestBackoff.prototype.noteServerResponse=function(status){if(this.isErrorStatus(status)){this.numErrors_++;if(this.numErrors_<this.MAX_ERRORS_){this.errorTimeout_=this.RETRY_INCREMENT_;}else if(this.numErrors_==this.MAX_ERRORS_){this.errorTimeout_=this.TIMEOUT_INCREMENT_;}else{this.errorTimeout_*=2;}
this.errorTimeout_=Math.min(this.errorTimeout_,this.MAX_TIMEOUT_);this.nextRequestTime_=Date.now()+this.errorTimeout_;}else{this.reset();}};RequestBackoff.prototype.isErrorStatus=function(status){return((400<=status&&status<=599)||HTTP_FOUND==status||HTTP_SEE_OTHER==status||HTTP_TEMPORARY_REDIRECT==status);};

function RequestBackoffV4(maxRequests,requestPeriod,provider=null){let rand=Math.random();let retryInterval=Math.floor(15*60*1000*(rand+1));let backoffInterval=Math.floor(30*60*1000*(rand+1));return new RequestBackoff(2 ,retryInterval ,maxRequests ,requestPeriod ,backoffInterval ,24*60*60*1000 ,1000 ,provider );}
var lib=this;function UrlClassifierLib(){this.wrappedJSObject=lib;}
UrlClassifierLib.prototype.QueryInterface=ChromeUtils.generateQI([]);var EXPORTED_SYMBOLS=["UrlClassifierLib"];