//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{WebVTT}=ChromeUtils.import("resource://gre/modules/vtt.jsm");function WebVTTParserWrapper(){}
WebVTTParserWrapper.prototype={loadParser(window){this.parser=new WebVTT.Parser(window,new TextDecoder("utf8"));},parse(data){
 var buffer=new Uint8Array(data.length);for(var i=0;i<data.length;i++){buffer[i]=data.charCodeAt(i);}
this.parser.parse(buffer);},flush(){this.parser.flush();},watch(callback){this.parser.oncue=callback.onCue;this.parser.onregion=callback.onRegion;this.parser.onparsingerror=function(e){callback.onParsingError("code"in e?e.code:-1);};},cancel(){this.parser.oncue=null;this.parser.onregion=null;this.parser.onparsingerror=null;},convertCueToDOMTree(window,cue){return WebVTT.convertCueToDOMTree(window,cue.text);},processCues(window,cues,overlay,controls){WebVTT.processCues(window,cues,overlay,controls);},classDescription:"Wrapper for the JS WebVTT implementation (vtt.js)",QueryInterface:ChromeUtils.generateQI(["nsIWebVTTParserWrapper"]),};var EXPORTED_SYMBOLS=["WebVTTParserWrapper"];