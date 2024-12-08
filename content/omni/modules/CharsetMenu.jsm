//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["CharsetMenu"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGetter(this,"gBundle",function(){const kUrl="chrome://global/locale/charsetMenu.properties";return Services.strings.createBundle(kUrl);});ChromeUtils.defineModuleGetter(this,"Deprecated","resource://gre/modules/Deprecated.jsm");const kEncodings=new Set(["UTF-8","windows-1252","windows-1256","ISO-8859-6","windows-1257","ISO-8859-4",
"windows-1250","ISO-8859-2","GBK","Big5","windows-1251","ISO-8859-5","KOI8-R","KOI8-U","IBM866","windows-1253","ISO-8859-7","windows-1255","ISO-8859-8","Japanese","EUC-KR","windows-874","windows-1254","windows-1258",

]);const kPinned=["UTF-8","windows-1252"];kPinned.forEach(x=>kEncodings.delete(x));function CharsetComparator(a,b){
let titleA=a.label.replace(/\(.*/,"")+b.value;let titleB=b.label.replace(/\(.*/,"")+a.value;return titleA.localeCompare(titleB)||b.value.localeCompare(a.value);}
var gCharsetInfoCache,gPinnedInfoCache;var CharsetMenu={build(parent,deprecatedShowAccessKeys=true){if(!deprecatedShowAccessKeys){Deprecated.warning("CharsetMenu no longer supports building a menu with no access keys.","https://bugzilla.mozilla.org/show_bug.cgi?id=1088710");}
function createDOMNode(doc,nodeInfo){let node=doc.createXULElement("menuitem");node.setAttribute("type","radio");node.setAttribute("name",nodeInfo.name+"Group");node.setAttribute(nodeInfo.name,nodeInfo.value);node.setAttribute("label",nodeInfo.label);if(nodeInfo.accesskey){node.setAttribute("accesskey",nodeInfo.accesskey);}
return node;}
if(parent.hasChildNodes()){ return;}
this._ensureDataReady();let doc=parent.ownerDocument;gPinnedInfoCache.forEach(charsetInfo=>parent.appendChild(createDOMNode(doc,charsetInfo)));parent.appendChild(doc.createXULElement("menuseparator"));gCharsetInfoCache.forEach(charsetInfo=>parent.appendChild(createDOMNode(doc,charsetInfo)));},getData(){this._ensureDataReady();return{pinnedCharsets:gPinnedInfoCache,otherCharsets:gCharsetInfoCache,};},_ensureDataReady(){if(!gCharsetInfoCache){gPinnedInfoCache=this.getCharsetInfo(kPinned,false);gCharsetInfoCache=this.getCharsetInfo(kEncodings);}},getCharsetInfo(charsets,sort=true){let list=Array.from(charsets,charset=>({label:this._getCharsetLabel(charset),accesskey:this._getCharsetAccessKey(charset),name:"charset",value:charset,}));if(sort){list.sort(CharsetComparator);}
return list;},_getCharsetLabel(charset){if(charset=="GBK"){ charset="gbk.bis";}
try{return gBundle.GetStringFromName(charset);}catch(ex){}
return charset;},_getCharsetAccessKey(charset){if(charset=="GBK"){ charset="gbk.bis";}
try{return gBundle.GetStringFromName(charset+".key");}catch(ex){}
return"";},foldCharset(charset,isAutodetected){if(isAutodetected){switch(charset){case"Shift_JIS":case"EUC-JP":case"ISO-2022-JP":return"Japanese";default:}}
switch(charset){case"ISO-8859-8-I":return"windows-1255";case"gb18030":return"GBK";default:return charset;}},update(parent,charset){let menuitem=parent.getElementsByAttribute("charset",this.foldCharset(charset,false)).item(0);if(menuitem){menuitem.setAttribute("checked","true");}},};Object.freeze(CharsetMenu);