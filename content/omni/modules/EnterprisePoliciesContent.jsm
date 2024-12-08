//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["EnterprisePoliciesManagerContent"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");class EnterprisePoliciesManagerContent{get status(){return(Services.cpmm.sharedData.get("EnterprisePolicies:Status")||Ci.nsIEnterprisePolicies.INACTIVE);}
isAllowed(feature){let disallowedFeatures=Services.cpmm.sharedData.get("EnterprisePolicies:DisallowedFeatures");return!(disallowedFeatures&&disallowedFeatures.has(feature));}}
EnterprisePoliciesManagerContent.prototype.QueryInterface=ChromeUtils.generateQI(["nsIEnterprisePolicies"]);