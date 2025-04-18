"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const MozXULTextElement=MozElements.MozElementMixin(XULTextElement);let gInsertSeparator=false;let gAlwaysAppendAccessKey=false;let gUnderlineAccesskey=Services.prefs.getIntPref("ui.key.menuAccessKey")!=0;if(gUnderlineAccesskey){try{const nsIPrefLocalizedString=Ci.nsIPrefLocalizedString;const prefNameInsertSeparator="intl.menuitems.insertseparatorbeforeaccesskeys";const prefNameAlwaysAppendAccessKey="intl.menuitems.alwaysappendaccesskeys";let val=Services.prefs.getComplexValue(prefNameInsertSeparator,nsIPrefLocalizedString).data;gInsertSeparator=val=="true";val=Services.prefs.getComplexValue(prefNameAlwaysAppendAccessKey,nsIPrefLocalizedString).data;gAlwaysAppendAccessKey=val=="true";}catch(e){gInsertSeparator=gAlwaysAppendAccessKey=true;}}
class MozTextLabel extends MozXULTextElement{constructor(){super();this._lastFormattedAccessKey=null;this.addEventListener("click",this._onClick);}
static get observedAttributes(){return["accesskey"];}
set textContent(val){super.textContent=val;this._lastFormattedAccessKey=null;this.formatAccessKey();}
get textContent(){return super.textContent;}
attributeChangedCallback(name,oldValue,newValue){if(!this.isConnectedAndReady||oldValue==newValue){return;}
this.formatAccessKey();}
_onClick(event){let controlElement=this.labeledControlElement;if(!controlElement||this.disabled){return;}
controlElement.focus();const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";if(controlElement.namespaceURI!=XUL_NS){return;}
if((controlElement.localName=="checkbox"||controlElement.localName=="radio")&&controlElement.getAttribute("disabled")=="true"){return;}
if(controlElement.localName=="checkbox"){controlElement.checked=!controlElement.checked;}else if(controlElement.localName=="radio"){controlElement.control.selectedItem=controlElement;}}
connectedCallback(){if(this.delayConnectedCallback()){return;}
this.formatAccessKey();}
set accessKey(val){this.setAttribute("accesskey",val);var control=this.labeledControlElement;if(control){control.setAttribute("accesskey",val);}}
get accessKey(){let accessKey=this.getAttribute("accesskey");return accessKey?accessKey[0]:null;}
get labeledControlElement(){let control=this.control;return control?document.getElementById(control):null;}
set control(val){this.setAttribute("control",val);}
get control(){return this.getAttribute("control");}

formatAccessKey(){let accessKey=this.accessKey;if(!gUnderlineAccesskey||!this.isConnectedAndReady||this._lastFormattedAccessKey==accessKey||!this.textContent){return;}
this._lastFormattedAccessKey=accessKey;if(this.accessKeySpan){ mergeElement(this.accessKeySpan);this.accessKeySpan=null;}
if(this.hiddenColon){mergeElement(this.hiddenColon);this.hiddenColon=null;}
if(this.accessKeyParens){this.accessKeyParens.remove();this.accessKeyParens=null;} 
if(!accessKey){return;}
let labelText=this.textContent;let accessKeyIndex=-1;if(!gAlwaysAppendAccessKey){accessKeyIndex=labelText.indexOf(accessKey);if(accessKeyIndex<0){ accessKeyIndex=labelText.toUpperCase().indexOf(accessKey.toUpperCase());}}else if(labelText.endsWith(`(${accessKey.toUpperCase()})`)){accessKeyIndex=labelText.length-(1+accessKey.length);}
const HTML_NS="http://www.w3.org/1999/xhtml";this.accessKeySpan=document.createElementNS(HTML_NS,"span");this.accessKeySpan.className="accesskey";
if(accessKeyIndex>=0){wrapChar(this,this.accessKeySpan,accessKeyIndex);return;}

let colonHidden=false;if(/:$/.test(labelText)){labelText=labelText.slice(0,-1);this.hiddenColon=document.createElementNS(HTML_NS,"span");this.hiddenColon.className="hiddenColon";this.hiddenColon.style.display="none";wrapChar(this,this.hiddenColon,labelText.length);colonHidden=true;}
let endIsSpace=false;if(/ $/.test(labelText)){endIsSpace=true;}
this.accessKeyParens=document.createElementNS("http://www.w3.org/1999/xhtml","span");this.appendChild(this.accessKeyParens);if(gInsertSeparator&&!endIsSpace){this.accessKeyParens.textContent=" (";}else{this.accessKeyParens.textContent="(";}
this.accessKeySpan.textContent=accessKey.toUpperCase();this.accessKeyParens.appendChild(this.accessKeySpan);if(!colonHidden){this.accessKeyParens.appendChild(document.createTextNode(")"));}else{this.accessKeyParens.appendChild(document.createTextNode("):"));}}}
customElements.define("label",MozTextLabel);function mergeElement(element){if(!element.isConnected){return;}
if(element.previousSibling instanceof Text){element.previousSibling.appendData(element.textContent);}else{element.parentNode.insertBefore(element.firstChild,element);}
element.remove();}
function wrapChar(parent,element,index){let treeWalker=document.createNodeIterator(parent,NodeFilter.SHOW_TEXT,null);let node=treeWalker.nextNode();while(index>=node.length){index-=node.length;node=treeWalker.nextNode();}
if(index){node=node.splitText(index);}
node.parentNode.insertBefore(element,node);if(node.length>1){node.splitText(1);}
element.appendChild(node);}
class MozTextLink extends MozXULTextElement{constructor(){super();this.addEventListener("click",event=>{if(event.button==0||event.button==1){this.open(event);}},true);this.addEventListener("keypress",event=>{if(event.keyCode!=KeyEvent.DOM_VK_RETURN){return;}
this.click();});}
connectedCallback(){this.classList.add("text-link");}
set href(val){this.setAttribute("href",val);return val;}
get href(){return this.getAttribute("href");}
open(aEvent){var href=this.href;if(!href||this.disabled||aEvent.defaultPrevented){return;}
var uri=null;try{const nsISSM=Ci.nsIScriptSecurityManager;const secMan=Cc["@mozilla.org/scriptsecuritymanager;1"].getService(nsISSM);uri=Services.io.newURI(href);let principal;if(this.getAttribute("useoriginprincipal")=="true"){principal=this.nodePrincipal;}else{principal=secMan.createNullPrincipal({});}
try{secMan.checkLoadURIWithPrincipal(principal,uri,nsISSM.DISALLOW_INHERIT_PRINCIPAL);}catch(ex){var msg="Error: Cannot open a "+
uri.scheme+": link using \
                         the text-link binding.";Cu.reportError(msg);return;}
const cID="@mozilla.org/uriloader/external-protocol-service;1";const nsIEPS=Ci.nsIExternalProtocolService;var protocolSvc=Cc[cID].getService(nsIEPS);
 if(!protocolSvc.isExposedProtocol(uri.scheme)){protocolSvc.loadURI(uri,principal);aEvent.preventDefault();return;}}catch(ex){Cu.reportError(ex);}
aEvent.preventDefault();href=uri?uri.spec:href;
var linkHandled=Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);linkHandled.data=false;let{shiftKey,ctrlKey,metaKey,altKey,button}=aEvent;let data={shiftKey,ctrlKey,metaKey,altKey,button,href};Services.obs.notifyObservers(linkHandled,"handle-xul-text-link",JSON.stringify(data));if(linkHandled.data){return;} 
var win=window;if(window.isChromeWindow){while(win.opener&&!win.opener.closed){win=win.opener;}}
win.open(href,"_blank","noopener");}}
customElements.define("text-link",MozTextLink,{extends:"label"});}