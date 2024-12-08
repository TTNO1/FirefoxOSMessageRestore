"use strict";const DEBUG=false;function debug(aStr){if(DEBUG){dump("-*- DateTimePickerParent: "+aStr+"\n");}}
var EXPORTED_SYMBOLS=["DateTimePickerParent"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"DateTimePickerPanel","resource://gre/modules/DateTimePickerPanel.jsm");class DateTimePickerParent extends JSWindowActorParent{receiveMessage(aMessage){debug("receiveMessage: "+aMessage.name);switch(aMessage.name){case"FormDateTime:OpenPicker":{let topBrowsingContext=this.manager.browsingContext.top;let browser=topBrowsingContext.embedderElement;this.showPicker(browser,aMessage.data);break;}
case"FormDateTime:ClosePicker":{if(!this._picker){return;}
this._picker.closePicker();this.close();break;}
case"FormDateTime:UpdatePicker":{if(!this._picker){return;}
this._picker.setPopupValue(aMessage.data);break;}
default:break;}}
handleEvent(aEvent){debug("handleEvent: "+aEvent.type);switch(aEvent.type){case"DateTimePickerValueChanged":{this.sendAsyncMessage("FormDateTime:PickerValueChanged",aEvent.detail);break;}
case"popuphidden":{this.sendAsyncMessage("FormDateTime:PickerClosed",{});this._picker.closePicker();this.close();break;}
default:break;}}
showPicker(aBrowser,aData){let rect=aData.rect;let type=aData.type;let detail=aData.detail;debug("Opening picker with details: "+JSON.stringify(detail));let window=aBrowser.ownerGlobal;let tabbrowser=window.gBrowser;if(Services.focus.activeWindow!=window||(tabbrowser&&tabbrowser.selectedBrowser!=aBrowser)){
return;}
let panel;if(tabbrowser){panel=tabbrowser._getAndMaybeCreateDateTimePickerPanel();}else{panel=aBrowser.dateTimePicker;}
if(!panel){debug("aBrowser.dateTimePicker not found, exiting now.");return;}
this._picker=new DateTimePickerPanel(panel);this._picker.openPicker(type,rect,detail);this.addPickerListeners();}
close(){this.removePickerListeners();this._picker=null;}
addPickerListeners(){if(!this._picker){return;}
this._picker.element.addEventListener("popuphidden",this);this._picker.element.addEventListener("DateTimePickerValueChanged",this);}
removePickerListeners(){if(!this._picker){return;}
this._picker.element.removeEventListener("popuphidden",this);this._picker.element.removeEventListener("DateTimePickerValueChanged",this);}}