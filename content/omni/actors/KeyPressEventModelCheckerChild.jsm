"use strict";var EXPORTED_SYMBOLS=["KeyPressEventModelCheckerChild"];const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");class KeyPressEventModelCheckerChild extends JSWindowActorChild{


handleEvent(aEvent){if(!AppConstants.DEBUG){aEvent.stopImmediatePropagation();}


let model=Document.KEYPRESS_EVENT_MODEL_DEFAULT;if(this._isOldOfficeOnlineServer(aEvent.target)||this._isOldConfluence(aEvent.target.ownerGlobal)){model=Document.KEYPRESS_EVENT_MODEL_SPLIT;}
aEvent.target.setKeyPressEventModel(model);}
_isOldOfficeOnlineServer(aDocument){let editingElement=aDocument.getElementById("WACViewPanel_EditingElement");

if(!editingElement){return false;}
let isOldVersion=!editingElement.classList.contains("WACViewPanel_DisableLegacyKeyCodeAndCharCode");Services.telemetry.keyedScalarAdd("dom.event.office_online_load_count",isOldVersion?"old":"new",1);return isOldVersion;}
_isOldConfluence(aWindow){if(!aWindow){return false;}


let tinyMCEObject;try{tinyMCEObject=ChromeUtils.waiveXrays(aWindow.parent).tinyMCE;}catch(e){}

if(!tinyMCEObject){try{tinyMCEObject=ChromeUtils.waiveXrays(aWindow).tinyMCE;}catch(e){}

if(!tinyMCEObject){return false;}}


try{let{author,version,}=new tinyMCEObject.plugins.CursorTargetPlugin().getInfo();

if(author!=="Atlassian"){return false;}
let isOldVersion=version==="1.0";Services.telemetry.keyedScalarAdd("dom.event.confluence_load_count",isOldVersion?"old":"new",1);return isOldVersion;}catch(e){return false;}}}