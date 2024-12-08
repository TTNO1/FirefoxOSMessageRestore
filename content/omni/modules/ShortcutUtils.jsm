//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["ShortcutUtils"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{AppConstants:"resource://gre/modules/AppConstants.jsm",});XPCOMUtils.defineLazyGetter(this,"PlatformKeys",function(){return Services.strings.createBundle("chrome://global-platform/locale/platformKeys.properties");});XPCOMUtils.defineLazyGetter(this,"Keys",function(){return Services.strings.createBundle("chrome://global/locale/keys.properties");});var ShortcutUtils={IS_VALID:"valid",INVALID_KEY:"invalid_key",INVALID_MODIFIER:"invalid_modifier",INVALID_COMBINATION:"invalid_combination",DUPLICATE_MODIFIER:"duplicate_modifier",MODIFIER_REQUIRED:"modifier_required",CLOSE_TAB:"CLOSE_TAB",CYCLE_TABS:"CYCLE_TABS",TOGGLE_CARET_BROWSING:"TOGGLE_CARET_BROWSING",MOVE_TAB_BACKWARD:"MOVE_TAB_BACKWARD",MOVE_TAB_FORWARD:"MOVE_TAB_FORWARD",NEXT_TAB:"NEXT_TAB",PREVIOUS_TAB:"PREVIOUS_TAB",prettifyShortcut(aElemKey,aNoCloverLeaf){let elemString=this.getModifierString(aElemKey.getAttribute("modifiers"),aNoCloverLeaf);let key=this.getKeyString(aElemKey.getAttribute("keycode"),aElemKey.getAttribute("key"));return elemString+key;},getModifierString(elemMod,aNoCloverLeaf){let elemString="";let haveCloverLeaf=false;if(elemMod.match("accel")){if(Services.appinfo.OS=="Darwin"){
if(aNoCloverLeaf){elemString+="Cmd-";}else{haveCloverLeaf=true;}}else{elemString+=PlatformKeys.GetStringFromName("VK_CONTROL")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}}
if(elemMod.match("access")){if(Services.appinfo.OS=="Darwin"){elemString+=PlatformKeys.GetStringFromName("VK_CONTROL")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}else{elemString+=PlatformKeys.GetStringFromName("VK_ALT")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}}
if(elemMod.match("os")){elemString+=PlatformKeys.GetStringFromName("VK_WIN")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
if(elemMod.match("shift")){elemString+=PlatformKeys.GetStringFromName("VK_SHIFT")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
if(elemMod.match("alt")){elemString+=PlatformKeys.GetStringFromName("VK_ALT")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
if(elemMod.match("ctrl")||elemMod.match("control")){elemString+=PlatformKeys.GetStringFromName("VK_CONTROL")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
if(elemMod.match("meta")){elemString+=PlatformKeys.GetStringFromName("VK_META")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
if(haveCloverLeaf){elemString+=PlatformKeys.GetStringFromName("VK_META")+
PlatformKeys.GetStringFromName("MODIFIER_SEPARATOR");}
return elemString;},getKeyString(keyCode,keyAttribute){let key;if(keyCode){keyCode=keyCode.toUpperCase();try{let bundle=keyCode=="VK_RETURN"?PlatformKeys:Keys;key=bundle.GetStringFromName(keyCode);}catch(ex){Cu.reportError("Error finding "+keyCode+": "+ex);key=keyCode.replace(/^VK_/,"");}}else{key=keyAttribute.toUpperCase();}
return key;},getKeyAttribute(chromeKey){if(/^[A-Z]$/.test(chromeKey)){return["key",chromeKey];}
return["keycode",this.getKeycodeAttribute(chromeKey)];},getKeycodeAttribute(chromeKey){if(/^[0-9]/.test(chromeKey)){return`VK_${chromeKey}`;}
return`VK${chromeKey.replace(/([A-Z])/g, "_$&").toUpperCase()}`;},findShortcut(aElemCommand){let document=aElemCommand.ownerDocument;return document.querySelector('key[command="'+aElemCommand.getAttribute("id")+'"]');},chromeModifierKeyMap:{Alt:"alt",Command:"accel",Ctrl:"accel",MacCtrl:"control",Shift:"shift",},getModifiersAttribute(chromeModifiers){return Array.from(chromeModifiers,modifier=>{return ShortcutUtils.chromeModifierKeyMap[modifier];}).sort().join(",");},validate(string){ const MEDIA_KEYS=/^(MediaNextTrack|MediaPlayPause|MediaPrevTrack|MediaStop)$/;const BASIC_KEYS=/^([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right)$/;const FUNCTION_KEYS=/^(F[1-9]|F1[0-2])$/;if(MEDIA_KEYS.test(string.trim())){return this.IS_VALID;}
let modifiers=string.split("+").map(s=>s.trim());let key=modifiers.pop();let chromeModifiers=modifiers.map(m=>ShortcutUtils.chromeModifierKeyMap[m]);if(chromeModifiers.some(modifier=>!modifier)){return this.INVALID_MODIFIER;}
switch(modifiers.length){case 0:if(!FUNCTION_KEYS.test(key)){return this.MODIFIER_REQUIRED;}
break;case 1:if(chromeModifiers[0]=="shift"&&!FUNCTION_KEYS.test(key)){return this.MODIFIER_REQUIRED;}
break;case 2:if(chromeModifiers[0]==chromeModifiers[1]){return this.DUPLICATE_MODIFIER;}
break;default:return this.INVALID_COMBINATION;}
if(!BASIC_KEYS.test(key)&&!FUNCTION_KEYS.test(key)){return this.INVALID_KEY;}
return this.IS_VALID;},isSystem(win,value){let modifiers=value.split("+");let chromeKey=modifiers.pop();let modifiersString=this.getModifiersAttribute(modifiers);let keycode=this.getKeycodeAttribute(chromeKey);let baseSelector="key";if(modifiers.length){baseSelector+=`[modifiers="${modifiersString}"]`;}
let keyEl=win.document.querySelector([`${baseSelector}[key="${chromeKey}"]`,`${baseSelector}[key="${chromeKey.toLowerCase()}"]`,`${baseSelector}[keycode="${keycode}"]`,].join(","));return keyEl&&!keyEl.closest("keyset").id.startsWith("ext-keyset-id");}, getSystemActionForEvent(event,{rtl}={}){switch(event.keyCode){case event.DOM_VK_TAB:if(event.ctrlKey&&!event.altKey&&!event.metaKey){return ShortcutUtils.CYCLE_TABS;}
break;case event.DOM_VK_F7:if(!event.shiftKey){return ShortcutUtils.TOGGLE_CARET_BROWSING;}
break;case event.DOM_VK_PAGE_UP:if(event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.metaKey){return ShortcutUtils.PREVIOUS_TAB;}
if(event.ctrlKey&&event.shiftKey&&!event.altKey&&!event.metaKey){return ShortcutUtils.MOVE_TAB_BACKWARD;}
break;case event.DOM_VK_PAGE_DOWN:if(event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.metaKey){return ShortcutUtils.NEXT_TAB;}
if(event.ctrlKey&&event.shiftKey&&!event.altKey&&!event.metaKey){return ShortcutUtils.MOVE_TAB_FORWARD;}
break;case event.DOM_VK_LEFT:if(event.metaKey&&event.altKey&&!event.shiftKey&&!event.ctrlKey){return ShortcutUtils.PREVIOUS_TAB;}
break;case event.DOM_VK_RIGHT:if(event.metaKey&&event.altKey&&!event.shiftKey&&!event.ctrlKey){return ShortcutUtils.NEXT_TAB;}
break;}
if(AppConstants.platform=="macosx"){if(!event.altKey&&event.metaKey){switch(event.charCode){case"}".charCodeAt(0):if(rtl){return ShortcutUtils.PREVIOUS_TAB;}
return ShortcutUtils.NEXT_TAB;case"{".charCodeAt(0):if(rtl){return ShortcutUtils.NEXT_TAB;}
return ShortcutUtils.PREVIOUS_TAB;}}}
if(AppConstants.platform!="macosx"){if(event.ctrlKey&&!event.shiftKey&&!event.metaKey&&event.keyCode==KeyEvent.DOM_VK_F4){return ShortcutUtils.CLOSE_TAB;}}
return null;},};Object.freeze(ShortcutUtils);