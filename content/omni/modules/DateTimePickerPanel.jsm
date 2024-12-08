//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DateTimePickerPanel"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");var DateTimePickerPanel=class{constructor(element){this.element=element;this.TIME_PICKER_WIDTH="12em";this.TIME_PICKER_HEIGHT="21em";this.DATE_PICKER_WIDTH="23.1em";this.DATE_PICKER_HEIGHT="20.7em";}
get dateTimePopupFrame(){let frame=this.element.querySelector("#dateTimePopupFrame");if(!frame){frame=this.element.ownerDocument.createXULElement("iframe");frame.id="dateTimePopupFrame";this.element.appendChild(frame);}
return frame;}
openPicker(type,rect,detail){this.type=type;this.pickerState={}; this.element.style.fontSize="10px";switch(type){case"time":{this.detail=detail;this.dateTimePopupFrame.addEventListener("load",this,true);this.dateTimePopupFrame.setAttribute("src","chrome://global/content/timepicker.xhtml");this.dateTimePopupFrame.style.width=this.TIME_PICKER_WIDTH;this.dateTimePopupFrame.style.height=this.TIME_PICKER_HEIGHT;break;}
case"date":{this.detail=detail;this.dateTimePopupFrame.addEventListener("load",this,true);this.dateTimePopupFrame.setAttribute("src","chrome://global/content/datepicker.xhtml");this.dateTimePopupFrame.style.width=this.DATE_PICKER_WIDTH;this.dateTimePopupFrame.style.height=this.DATE_PICKER_HEIGHT;break;}}
this.element.hidden=false;this.element.openPopupAtScreenRect("after_start",rect.left,rect.top,rect.width,rect.height,false,false);}
closePicker(){this.setInputBoxValue(true);this.pickerState={};this.type=undefined;this.dateTimePopupFrame.removeEventListener("load",this,true);this.dateTimePopupFrame.contentDocument.removeEventListener("message",this);this.dateTimePopupFrame.setAttribute("src","");this.element.hidden=true;}
setPopupValue(data){switch(this.type){case"time":{this.postMessageToPicker({name:"PickerSetValue",detail:data.value,});break;}
case"date":{const{year,month,day}=data.value;this.postMessageToPicker({name:"PickerSetValue",detail:{year, month:month==undefined?undefined:month-1,day,},});break;}}}
initPicker(detail){
 let locale=this.setGregorian(Services.locale.webExposedLocales[0]);
locale=locale.replace(/^pt-PT/i,"pt");const dir=Services.locale.isAppLocaleRTL?"rtl":"ltr";switch(this.type){case"time":{const{hour,minute}=detail.value;const format=detail.format||"12";this.postMessageToPicker({name:"PickerInit",detail:{hour,minute,format,locale,min:detail.min,max:detail.max,step:detail.step,},});break;}
case"date":{const{year,month,day}=detail.value;const{firstDayOfWeek,weekends}=this.getCalendarInfo(locale);const monthStrings=this.getDisplayNames(locale,["dates/gregorian/months/january","dates/gregorian/months/february","dates/gregorian/months/march","dates/gregorian/months/april","dates/gregorian/months/may","dates/gregorian/months/june","dates/gregorian/months/july","dates/gregorian/months/august","dates/gregorian/months/september","dates/gregorian/months/october","dates/gregorian/months/november","dates/gregorian/months/december",],"short");const weekdayStrings=this.getDisplayNames(locale,["dates/gregorian/weekdays/sunday","dates/gregorian/weekdays/monday","dates/gregorian/weekdays/tuesday","dates/gregorian/weekdays/wednesday","dates/gregorian/weekdays/thursday","dates/gregorian/weekdays/friday","dates/gregorian/weekdays/saturday",],"short");this.postMessageToPicker({name:"PickerInit",detail:{year, month:month==undefined?undefined:month-1,day,firstDayOfWeek,weekends,monthStrings,weekdayStrings,locale,dir,min:detail.min,max:detail.max,step:detail.step,stepBase:detail.stepBase,},});break;}}}
setInputBoxValue(passAllValues){switch(this.type){case"time":{const{hour,minute,isHourSet,isMinuteSet,isDayPeriodSet,}=this.pickerState;const isAnyValueSet=isHourSet||isMinuteSet||isDayPeriodSet;if(passAllValues&&isAnyValueSet){this.sendPickerValueChanged({hour,minute});}else{this.sendPickerValueChanged({hour:isHourSet||isDayPeriodSet?hour:undefined,minute:isMinuteSet?minute:undefined,});}
break;}
case"date":{this.sendPickerValueChanged(this.pickerState);break;}}}
sendPickerValueChanged(value){switch(this.type){case"time":{this.element.dispatchEvent(new CustomEvent("DateTimePickerValueChanged",{detail:{hour:value.hour,minute:value.minute,},}));break;}
case"date":{this.element.dispatchEvent(new CustomEvent("DateTimePickerValueChanged",{detail:{year:value.year, month:value.month==undefined?undefined:value.month+1,day:value.day,},}));break;}}}
getCalendarInfo(locale){const calendarInfo=Services.intl.getCalendarInfo(locale);
 let firstDayOfWeek=calendarInfo.firstDayOfWeek-1,weekendStart=calendarInfo.weekendStart-1,weekendEnd=calendarInfo.weekendEnd-1;let weekends=[]; if(weekendEnd<weekendStart){weekendEnd+=7;}
for(let day=weekendStart;day<=weekendEnd;day++){weekends.push(day%7);}
return{firstDayOfWeek,weekends,};}
getDisplayNames(locale,keys,style){const displayNames=Services.intl.getDisplayNames(locale,{keys,style});return keys.map(key=>displayNames.values[key]);}
setGregorian(locale){if(locale.match(/u-ca-/)){return locale.replace(/u-ca-[^-]+/,"u-ca-gregory");}
return locale+"-u-ca-gregory";}
handleEvent(aEvent){switch(aEvent.type){case"load":{this.initPicker(this.detail);this.dateTimePopupFrame.contentWindow.addEventListener("message",this);break;}
case"message":{this.handleMessage(aEvent);break;}}}
handleMessage(aEvent){if(!this.dateTimePopupFrame.contentDocument.nodePrincipal.isSystemPrincipal){return;}
switch(aEvent.data.name){case"PickerPopupChanged":{this.pickerState=aEvent.data.detail;this.setInputBoxValue();break;}
case"ClosePopup":{this.element.hidePopup();this.closePicker();break;}}}
postMessageToPicker(data){if(this.dateTimePopupFrame.contentDocument.nodePrincipal.isSystemPrincipal){this.dateTimePopupFrame.contentWindow.postMessage(data,"*");}}};