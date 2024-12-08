//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.obs.addObserver({observe(doc){if(doc.nodePrincipal.isSystemPrincipal&&(doc.contentType=="application/xhtml+xml"||doc.contentType=="text/html")&&

doc.URL!="about:blank"){Services.scriptloader.loadSubScript("chrome://global/content/customElements.js",doc.ownerGlobal);}},},"document-element-inserted");