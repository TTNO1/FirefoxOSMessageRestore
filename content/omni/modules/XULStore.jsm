//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";


const EXPORTED_SYMBOLS=["XULStore","getXULStore"];


const xulStore=Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);const debugMode=false;function log(message){if(!debugMode){return;}
console.log("XULStore: "+message);}
const XULStore={setValue:xulStore.setValue,hasValue:xulStore.hasValue,getValue:xulStore.getValue,removeValue:xulStore.removeValue,removeDocument:xulStore.removeDocument,persist(node,attr){if(!node.id){throw new Error("Node without ID passed into persist()");}
const uri=node.ownerDocument.documentURI;const value=node.getAttribute(attr);if(node.localName=="window"){log("Persisting attributes to windows is handled by AppWindow.");return;}


if(!value&&xulStore.hasValue(uri,node.id,attr)){xulStore.removeValue(uri,node.id,attr);}else{xulStore.setValue(uri,node.id,attr,value);}},getIDsEnumerator(docURI){return new XULStoreEnumerator(xulStore.getIDsEnumerator(docURI));},getAttributeEnumerator(docURI,id){return new XULStoreEnumerator(xulStore.getAttributeEnumerator(docURI,id));},};class XULStoreEnumerator{constructor(enumerator){this.enumerator=enumerator;}
hasMore(){return this.enumerator.hasMore();}
getNext(){return this.enumerator.getNext();}*[Symbol.iterator](){while(this.enumerator.hasMore()){yield this.enumerator.getNext();}}}

function getXULStore(){return XULStore;}