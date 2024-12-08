//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["ComponentUtils"];const nsIFactoryQI=ChromeUtils.generateQI(["nsIFactory"]);var ComponentUtils={generateNSGetFactory:function XPCU_generateNSGetFactory(componentsArray){let classes={};for(let i=0;i<componentsArray.length;i++){let component=componentsArray[i];if(!(component.prototype.classID instanceof Components.ID))
throw Error("In generateNSGetFactory, classID missing or incorrect for component "+component);classes[component.prototype.classID]=this._getFactory(component);}
return function NSGetFactory(cid){let cidstring=cid.toString();if(cidstring in classes)
return classes[cidstring];throw Cr.NS_ERROR_FACTORY_NOT_REGISTERED;}},_getFactory:function XPCOMUtils__getFactory(component){var factory=component.prototype._xpcom_factory;if(!factory){factory={createInstance:function(outer,iid){if(outer)
throw Cr.NS_ERROR_NO_AGGREGATION;return(new component()).QueryInterface(iid);},QueryInterface:nsIFactoryQI}}
return factory;},generateSingletonFactory:function XPCOMUtils_generateSingletonFactory(aServiceConstructor){return{_instance:null,createInstance:function XPCU_SF_createInstance(aOuter,aIID){if(aOuter!==null){throw Cr.NS_ERROR_NO_AGGREGATION;}
if(this._instance===null){this._instance=new aServiceConstructor();}
return this._instance.QueryInterface(aIID);},QueryInterface:nsIFactoryQI};},};