"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");class MozStringbundle extends MozXULElement{get stringBundle(){if(!this._bundle){try{this._bundle=Services.strings.createBundle(this.src);}catch(e){dump("Failed to get stringbundle:\n");dump(e+"\n");}}
return this._bundle;}
set src(val){this._bundle=null;this.setAttribute("src",val);return val;}
get src(){return this.getAttribute("src");}
get strings(){return this.stringBundle.getSimpleEnumeration();}
getString(aStringKey){try{return this.stringBundle.GetStringFromName(aStringKey);}catch(e){dump("*** Failed to get string "+
aStringKey+" in bundle: "+
this.src+"\n");throw e;}}
getFormattedString(aStringKey,aStringsArray){try{return this.stringBundle.formatStringFromName(aStringKey,aStringsArray);}catch(e){dump("*** Failed to format string "+
aStringKey+" in bundle: "+
this.src+"\n");throw e;}}}
customElements.define("stringbundle",MozStringbundle);}