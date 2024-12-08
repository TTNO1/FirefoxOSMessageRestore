"use strict";const{Ci}=require("chrome");const ChromeUtils=require("ChromeUtils");function ConsoleFileActivityListener(window,owner){this.window=window;this.owner=owner;}
exports.ConsoleFileActivityListener=ConsoleFileActivityListener;ConsoleFileActivityListener.prototype={_initialized:false,_webProgress:null,QueryInterface:ChromeUtils.generateQI(["nsIWebProgressListener","nsISupportsWeakReference",]),_init:function(){if(this._initialized){return;}
this._webProgress=this.window.docShell.QueryInterface(Ci.nsIWebProgress);this._webProgress.addProgressListener(this,Ci.nsIWebProgress.NOTIFY_STATE_ALL);this._initialized=true;},startMonitor:function(){this._init();},stopMonitor:function(){this.destroy();},onStateChange:function(progress,request,state,status){if(!this.owner){return;}
this._checkFileActivity(progress,request,state,status);},_checkFileActivity:function(progress,request,state,status){if(!(state&Ci.nsIWebProgressListener.STATE_START)){return;}
let uri=null;if(request instanceof Ci.imgIRequest){const imgIRequest=request.QueryInterface(Ci.imgIRequest);uri=imgIRequest.URI;}else if(request instanceof Ci.nsIChannel){const nsIChannel=request.QueryInterface(Ci.nsIChannel);uri=nsIChannel.URI;}
if(!uri||(!uri.schemeIs("file")&&!uri.schemeIs("ftp"))){return;}
this.owner.onFileActivity(uri.spec);},destroy:function(){if(!this._initialized){return;}
this._initialized=false;try{this._webProgress.removeProgressListener(this);}catch(ex){}
this._webProgress=null;this.window=null;this.owner=null;},};