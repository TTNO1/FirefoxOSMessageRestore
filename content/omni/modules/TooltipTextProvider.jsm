//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function TooltipTextProvider(){}
TooltipTextProvider.prototype={getNodeText(tipElement,textOut,directionOut){if(!tipElement||!tipElement.ownerDocument||tipElement.localName=="browser"){return false;}
var defView=tipElement.ownerGlobal;if(!defView){return false;}
const XLinkNS="http://www.w3.org/1999/xlink";const XUL_NS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";var titleText=null;var XLinkTitleText=null;var SVGTitleText=null;var XULtooltiptextText=null;var lookingForSVGTitle=true;var direction=tipElement.ownerDocument.dir;if((tipElement instanceof defView.HTMLInputElement||tipElement instanceof defView.HTMLTextAreaElement||tipElement instanceof defView.HTMLSelectElement||tipElement instanceof defView.HTMLButtonElement)&&!tipElement.hasAttribute("title")&&(!tipElement.form||!tipElement.form.noValidate)){titleText=tipElement.validationMessage||null;}

if(!titleText&&tipElement instanceof defView.HTMLInputElement&&tipElement.type=="file"&&!tipElement.hasAttribute("title")){let files=tipElement.files;try{var bundle=Services.strings.createBundle("chrome://global/locale/layout/HtmlForm.properties");if(!files.length){if(tipElement.multiple){titleText=bundle.GetStringFromName("NoFilesSelected");}else{titleText=bundle.GetStringFromName("NoFileSelected");}}else{titleText=files[0].name;
const TRUNCATED_FILE_COUNT=20;let count=Math.min(files.length,TRUNCATED_FILE_COUNT);for(let i=1;i<count;++i){titleText+="\n"+files[i].name;}
if(files.length==TRUNCATED_FILE_COUNT+1){titleText+="\n"+files[TRUNCATED_FILE_COUNT].name;}else if(files.length>TRUNCATED_FILE_COUNT+1){let xmoreStr=bundle.GetStringFromName("AndNMoreFiles");let xmoreNum=files.length-TRUNCATED_FILE_COUNT;let tmp={};ChromeUtils.import("resource://gre/modules/PluralForm.jsm",tmp);let andXMoreStr=tmp.PluralForm.get(xmoreNum,xmoreStr).replace("#1",xmoreNum);titleText+="\n"+andXMoreStr;}}}catch(e){}}

let usedTipElement=null;while(tipElement&&titleText==null&&XLinkTitleText==null&&SVGTitleText==null&&XULtooltiptextText==null){if(tipElement.nodeType==defView.Node.ELEMENT_NODE){if(tipElement.namespaceURI==XUL_NS){XULtooltiptextText=tipElement.hasAttribute("tooltiptext")?tipElement.getAttribute("tooltiptext"):null;}else if(!(tipElement instanceof defView.SVGElement)){titleText=tipElement.getAttribute("title");}
if((tipElement instanceof defView.HTMLAnchorElement||tipElement instanceof defView.HTMLAreaElement||tipElement instanceof defView.HTMLLinkElement||tipElement instanceof defView.SVGAElement)&&tipElement.href){XLinkTitleText=tipElement.getAttributeNS(XLinkNS,"title");}
if(lookingForSVGTitle&&(!(tipElement instanceof defView.SVGElement)||tipElement.parentNode.nodeType==defView.Node.DOCUMENT_NODE)){lookingForSVGTitle=false;}
if(lookingForSVGTitle){for(let childNode of tipElement.childNodes){if(childNode instanceof defView.SVGTitleElement){SVGTitleText=childNode.textContent;break;}}}
usedTipElement=tipElement;}
tipElement=tipElement.flattenedTreeParentNode;}
return[titleText,XLinkTitleText,SVGTitleText,XULtooltiptextText].some(function(t){if(t&&/\S/.test(t)){textOut.value=t.replace(/\r\n?/g,"\n");if(usedTipElement){direction=defView.getComputedStyle(usedTipElement).getPropertyValue("direction");}
directionOut.value=direction;return true;}
return false;});},classID:Components.ID("{f376627f-0bbc-47b8-887e-fc92574cc91f}"),QueryInterface:ChromeUtils.generateQI(["nsITooltipTextProvider"]),};var EXPORTED_SYMBOLS=["TooltipTextProvider"];