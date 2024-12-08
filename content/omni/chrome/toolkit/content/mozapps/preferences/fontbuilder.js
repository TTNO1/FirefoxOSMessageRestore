
var FontBuilder={_enumerator:null,get enumerator(){if(!this._enumerator){this._enumerator=Cc["@mozilla.org/gfx/fontenumerator;1"].createInstance(Ci.nsIFontEnumerator);}
return this._enumerator;},_allFonts:null,_langGroupSupported:false,async buildFontList(aLanguage,aFontType,aMenuList){if(aMenuList.menupopup){aMenuList.menupopup.remove();}
let defaultFont=null; let fonts=await this.enumerator.EnumerateFontsAsync(aLanguage,aFontType);if(fonts.length){defaultFont=this.enumerator.getDefaultFont(aLanguage,aFontType);}else{fonts=await this.enumerator.EnumerateFontsAsync(aLanguage,"");if(fonts.length){defaultFont=this.enumerator.getDefaultFont(aLanguage,"");}}
if(!this._allFonts){this._allFonts=await this.enumerator.EnumerateAllFontsAsync({});}
const popup=document.createXULElement("menupopup");let separator;if(fonts.length){let menuitem=document.createXULElement("menuitem");if(defaultFont){document.l10n.setAttributes(menuitem,"fonts-label-default",{name:defaultFont,});}else{document.l10n.setAttributes(menuitem,"fonts-label-default-unnamed");}
menuitem.setAttribute("value",""); popup.appendChild(menuitem);separator=document.createXULElement("menuseparator");popup.appendChild(separator);for(let font of fonts){menuitem=document.createXULElement("menuitem");menuitem.setAttribute("value",font);menuitem.setAttribute("label",font);popup.appendChild(menuitem);}}
if(this._allFonts.length>fonts.length){this._langGroupSupported=true;

let builtItem=separator?separator.nextSibling:popup.firstChild;let builtItemValue=builtItem?builtItem.getAttribute("value"):null;separator=document.createXULElement("menuseparator");popup.appendChild(separator);for(let font of this._allFonts){if(font!=builtItemValue){const menuitem=document.createXULElement("menuitem");menuitem.setAttribute("value",font);menuitem.setAttribute("label",font);popup.appendChild(menuitem);}else{builtItem=builtItem.nextSibling;builtItemValue=builtItem?builtItem.getAttribute("value"):null;}}}
aMenuList.appendChild(popup);},readFontSelection(aElement){

const preference=Preferences.get(aElement.getAttribute("preference"));if(preference.value){const fontItems=aElement.getElementsByAttribute("value",preference.value);if(fontItems.length){return undefined;}}


return"";},};