{const classData=window.getWebViewClassData();delete window.getWebViewClassData;Object.keys(classData.properties).forEach(key=>{const property=classData.properties[key];if(property.get){property.get=function(){return this._getter(key);};}
if(property.set){property.set=function(val){return this._setter(key,val);};}});const LocalClass=class extends HTMLElement{constructor(){super();this._constructorInternal(true);}};Object.defineProperties(LocalClass.prototype,classData.properties);Object.defineProperties(LocalClass,classData.staticProperties);window.customElements.define("web-view",LocalClass);}