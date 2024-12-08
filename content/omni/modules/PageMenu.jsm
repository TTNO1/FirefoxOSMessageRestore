//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["PageMenuParent","PageMenuChild"];function PageMenu(){}
PageMenu.prototype={PAGEMENU_ATTR:"pagemenu",GENERATEDITEMID_ATTR:"generateditemid",_popup:null,_builder:null,_browser:null,getContextMenu(aTarget){let target=aTarget;while(target){let contextMenu=target.contextMenu;if(contextMenu){return contextMenu;}
target=target.parentNode;}
return null;},
maybeBuild(aTarget){let pageMenu=this.getContextMenu(aTarget);if(!pageMenu){return null;}
pageMenu.sendShowEvent(); this._builder=pageMenu.createBuilder();if(!this._builder){return null;}
pageMenu.build(this._builder);
let menuString=this._builder.toJSONString();if(!menuString){return null;}
return JSON.parse(menuString);},buildAndAttachMenuWithObject(aMenu,aBrowser,aPopup){if(!aMenu){return false;}
let insertionPoint=this.getInsertionPoint(aPopup);if(!insertionPoint){return false;}
let fragment=aPopup.ownerDocument.createDocumentFragment();this.buildXULMenu(aMenu,fragment);let pos=insertionPoint.getAttribute(this.PAGEMENU_ATTR);if(pos=="start"){insertionPoint.insertBefore(fragment,insertionPoint.firstElementChild);}else if(pos.startsWith("#")){insertionPoint.insertBefore(fragment,insertionPoint.querySelector(pos));}else{insertionPoint.appendChild(fragment);}
this._browser=aBrowser;this._popup=aPopup;this._popup.addEventListener("command",this);this._popup.addEventListener("popuphidden",this);return true;},buildXULMenu(aNode,aElementForAppending){let document=aElementForAppending.ownerDocument;let children=aNode.children;for(let child of children){let menuitem;switch(child.type){case"menuitem":if(!child.id){continue;}
menuitem=document.createXULElement("menuitem");if(child.checkbox){menuitem.setAttribute("type","checkbox");if(child.checked){menuitem.setAttribute("checked","true");}}
if(child.label){menuitem.setAttribute("label",child.label);}
if(child.icon){menuitem.setAttribute("image",child.icon);menuitem.className="menuitem-iconic";}
if(child.disabled){menuitem.setAttribute("disabled",true);}
break;case"separator":menuitem=document.createXULElement("menuseparator");break;case"menu":menuitem=document.createXULElement("menu");if(child.label){menuitem.setAttribute("label",child.label);}
let menupopup=document.createXULElement("menupopup");menuitem.appendChild(menupopup);this.buildXULMenu(child,menupopup);break;}
menuitem.setAttribute(this.GENERATEDITEMID_ATTR,child.id?child.id:0);aElementForAppending.appendChild(menuitem);}},handleEvent(event){let type=event.type;let target=event.target;if(type=="command"&&target.hasAttribute(this.GENERATEDITEMID_ATTR)){

if(this._builder){this._builder.click(target.getAttribute(this.GENERATEDITEMID_ATTR));}else if(this._browser){let win=target.ownerGlobal;let windowUtils=win.windowUtils;win.gContextMenu.doCustomCommand(target.getAttribute(this.GENERATEDITEMID_ATTR),windowUtils.isHandlingUserInput);}}else if(type=="popuphidden"&&this._popup==target){this.removeGeneratedContent(this._popup);this._popup.removeEventListener("popuphidden",this);this._popup.removeEventListener("command",this);this._popup=null;this._builder=null;this._browser=null;}},getImmediateChild(element,tag){let child=element.firstElementChild;while(child){if(child.localName==tag){return child;}
child=child.nextElementSibling;}
return null;},

getInsertionPoint(aPopup){if(aPopup.hasAttribute(this.PAGEMENU_ATTR)){return aPopup;}
let element=aPopup.firstElementChild;while(element){if(element.localName=="menu"){let popup=this.getImmediateChild(element,"menupopup");if(popup){let result=this.getInsertionPoint(popup);if(result){return result;}}}
element=element.nextElementSibling;}
return null;},removeGeneratedContent(aPopup){let ungenerated=[];ungenerated.push(aPopup);let count;while(0!=(count=ungenerated.length)){let last=count-1;let element=ungenerated[last];ungenerated.splice(last,1);let i=element.children.length;while(i-->0){let child=element.children[i];if(!child.hasAttribute(this.GENERATEDITEMID_ATTR)){ungenerated.push(child);continue;}
element.removeChild(child);}}},};function PageMenuParent(){}
PageMenuParent.prototype={__proto__:PageMenu.prototype,addToPopup(aMenu,aBrowser,aPopup){return this.buildAndAttachMenuWithObject(aMenu,aBrowser,aPopup);},};function PageMenuChild(){}
PageMenuChild.prototype={__proto__:PageMenu.prototype,build(aTarget){return this.maybeBuild(aTarget);},executeMenu(aId){if(this._builder){this._builder.click(aId);this._builder=null;}},};