"use strict";this.DateTimeBoxWidget=class{constructor(shadowRoot){this.shadowRoot=shadowRoot;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;}
onsetup(){this.switchImpl();}
onchange(){this.switchImpl();}
switchImpl(){let newImpl;if(this.element.type=="date"){newImpl=DateInputImplWidget;}else if(this.element.type=="time"){newImpl=TimeInputImplWidget;}
if(this.impl&&this.impl.constructor==newImpl){return;}
if(this.impl){this.impl.destructor();this.shadowRoot.firstChild.remove();}
if(newImpl){this.impl=new newImpl(this.shadowRoot);this.impl.onsetup();}else{this.impl=undefined;}}
destructor(){if(!this.impl){return;}
this.impl.destructor();this.shadowRoot.firstChild.remove();delete this.impl;}};this.DateTimeInputBaseImplWidget=class{constructor(shadowRoot){this.shadowRoot=shadowRoot;this.element=shadowRoot.host;this.document=this.element.ownerDocument;this.window=this.document.defaultView;}
onsetup(){this.generateContent();this.DEBUG=false;this.mDateTimeBoxElement=this.shadowRoot.firstChild;this.mInputElement=this.element;this.mLocales=this.window.getWebExposedLocales();this.mIsRTL=false;let intlUtils=this.window.intlUtils;if(intlUtils){this.mIsRTL=intlUtils.isAppLocaleRTL();}
if(this.mIsRTL){let inputBoxWrapper=this.shadowRoot.getElementById("input-box-wrapper");inputBoxWrapper.dir="rtl";}
this.mMin=this.mInputElement.min;this.mMax=this.mInputElement.max;this.mStep=this.mInputElement.step;this.mIsPickerOpen=false;this.mResetButton=this.shadowRoot.getElementById("reset-button");this.mResetButton.style.visibility="hidden";this.mResetButton.addEventListener("mousedown",this,{mozSystemGroup:true,});this.mInputElement.addEventListener("keypress",this,{capture:true,mozSystemGroup:true,},false);
this.mInputElement.addEventListener("click",this,{mozSystemGroup:true},false);

this.CONTROL_EVENTS.forEach(eventName=>{this.mDateTimeBoxElement.addEventListener(eventName,this,{},false);});}
generateContent(){const parser=new this.window.DOMParser();parser.forceEnableDTD();let parserDoc=parser.parseFromString(`<!DOCTYPE bindings [
      <!ENTITY % datetimeboxDTD SYSTEM "chrome://global/locale/datetimebox.dtd">
      %datetimeboxDTD;
      ]>
      <div class="datetimebox" xmlns="http://www.w3.org/1999/xhtml" role="none">
        <link rel="stylesheet" type="text/css" href="chrome://global/content/bindings/datetimebox.css" />
        <div class="datetime-input-box-wrapper" id="input-box-wrapper" role="presentation">
          <span class="datetime-input-edit-wrapper"
                     id="edit-wrapper">
            <!-- Each of the date/time input types will append their input child
               - elements here -->
          </span>

          <button class="datetime-reset-button" id="reset-button" tabindex="-1" aria-label="&datetime.reset.label;">
            <svg xmlns="http://www.w3.org/2000/svg" class="datetime-reset-button-svg" width="12" height="12">
              <path d="M 3.9,3 3,3.9 5.1,6 3,8.1 3.9,9 6,6.9 8.1,9 9,8.1 6.9,6 9,3.9 8.1,3 6,5.1 Z M 12,6 A 6,6 0 0 1 6,12 6,6 0 0 1 0,6 6,6 0 0 1 6,0 6,6 0 0 1 12,6 Z"/>
            </svg>
          </button>
        </div>
        <div id="strings"
          data-m-year-place-holder="&date.year.placeholder;"
          data-m-year-label="&date.year.label;"
          data-m-month-place-holder="&date.month.placeholder;"
          data-m-month-label="&date.month.label;"
          data-m-day-place-holder="&date.day.placeholder;"
          data-m-day-label="&date.day.label;"

          data-m-hour-place-holder="&time.hour.placeholder;"
          data-m-hour-label="&time.hour.label;"
          data-m-minute-place-holder="&time.minute.placeholder;"
          data-m-minute-label="&time.minute.label;"
          data-m-second-place-holder="&time.second.placeholder;"
          data-m-second-label="&time.second.label;"
          data-m-millisecond-place-holder="&time.millisecond.placeholder;"
          data-m-millisecond-label="&time.millisecond.label;"
          data-m-day-period-place-holder="&time.dayperiod.placeholder;"
          data-m-day-period-label="&time.dayperiod.label;"
        ></div>
      </div>`,"application/xml");let stringsElement=parserDoc.getElementById("strings");stringsElement.remove();for(let key in stringsElement.dataset){this[key]=stringsElement.dataset[key];}
this.shadowRoot.importNodeAndAppendChildAt(this.shadowRoot,parserDoc.documentElement,true);}
destructor(){this.mResetButton.addEventListener("mousedown",this,{mozSystemGroup:true,});this.mInputElement.removeEventListener("keypress",this,{capture:true,mozSystemGroup:true,});this.mInputElement.removeEventListener("click",this,{mozSystemGroup:true,});this.CONTROL_EVENTS.forEach(eventName=>{this.mDateTimeBoxElement.removeEventListener(eventName,this);});this.mInputElement=null;}
get FIELD_EVENTS(){return["focus","blur","copy","cut","paste"];}
get CONTROL_EVENTS(){return["MozDateTimeValueChanged","MozNotifyMinMaxStepAttrChanged","MozFocusInnerTextBox","MozBlurInnerTextBox","MozDateTimeAttributeChanged","MozPickerValueChanged","MozSetDateTimePickerState",];}
addEventListenersToField(aElement){

this.FIELD_EVENTS.forEach(eventName=>{aElement.addEventListener(eventName,this,{mozSystemGroup:true},false);});}
removeEventListenersToField(aElement){if(!aElement){return;}
this.FIELD_EVENTS.forEach(eventName=>{aElement.removeEventListener(eventName,this,{mozSystemGroup:true});});}
log(aMsg){if(this.DEBUG){this.window.dump("[DateTimeBox] "+aMsg+"\n");}}
createEditFieldAndAppend(aPlaceHolder,aLabel,aIsNumeric,aMinDigits,aMaxLength,aMinValue,aMaxValue,aPageUpDownInterval){let root=this.shadowRoot.getElementById("edit-wrapper");let field=this.shadowRoot.createElementAndAppendChildAt(root,"span");field.classList.add("datetime-edit-field");field.textContent=aPlaceHolder;field.placeholder=aPlaceHolder;field.tabIndex=this.mInputElement.tabIndex;field.setAttribute("readonly",this.mInputElement.readOnly);field.setAttribute("disabled",this.mInputElement.disabled);field.disabled=this.mInputElement.disabled;field.readOnly=this.mInputElement.readOnly;field.setAttribute("aria-label",aLabel);

field.setAttribute("value","");if(aIsNumeric){field.classList.add("numeric");field.setAttribute("min",aMinValue);field.setAttribute("max",aMaxValue);field.setAttribute("pginterval",aPageUpDownInterval);field.setAttribute("typeBuffer","");field.setAttribute("mindigits",aMinDigits);
field.setAttribute("maxlength",aMaxLength); field.setAttribute("role","spinbutton");if(this.mIsRTL){


field.style.unicodeBidi="embed";field.style.direction="ltr";}}else{ field.setAttribute("role","textbox");}
return field;}
updateResetButtonVisibility(){if(this.isAnyFieldAvailable(false)&&!this.isRequired()){this.mResetButton.style.visibility="";}else{this.mResetButton.style.visibility="hidden";}}
focusInnerTextBox(){this.log("Focus inner editable field.");let editRoot=this.shadowRoot.getElementById("edit-wrapper");for(let child of editRoot.querySelectorAll(":scope > span.datetime-edit-field")){this.mLastFocusedField=child;child.focus();this.log("focused");break;}}
blurInnerTextBox(){this.log("Blur inner editable field.");if(this.mLastFocusedField){this.mLastFocusedField.blur();}else{
let editRoot=this.shadowRoot.getElementById("edit-wrapper");for(let child of editRoot.querySelectorAll(":scope > span.datetime-edit-field")){child.blur();}}}
notifyInputElementValueChanged(){this.log("inputElementValueChanged");this.setFieldsFromInputValue();}
notifyMinMaxStepAttrChanged(){}
setValueFromPicker(aValue){this.setFieldsFromPicker(aValue);}
advanceToNextField(aReverse){this.log("advanceToNextField");let focusedInput=this.mLastFocusedField;let next=aReverse?focusedInput.previousElementSibling:focusedInput.nextElementSibling;if(!next&&!aReverse){this.setInputValueFromFields();return;}
while(next){if(next.matches("span.datetime-edit-field")){next.focus();break;}
next=aReverse?next.previousElementSibling:next.nextElementSibling;}}
setPickerState(aIsOpen){this.log("picker is now "+(aIsOpen?"opened":"closed"));this.mIsPickerOpen=aIsOpen;}
updateEditAttributes(){this.log("updateEditAttributes");let editRoot=this.shadowRoot.getElementById("edit-wrapper");for(let child of editRoot.querySelectorAll(":scope > span.datetime-edit-field")){

child.setAttribute("disabled",this.mInputElement.disabled);child.setAttribute("readonly",this.mInputElement.readOnly);child.disabled=this.mInputElement.disabled;child.readOnly=this.mInputElement.readOnly; child.tabIndex=this.mInputElement.tabIndex;}
this.mResetButton.disabled=this.mInputElement.disabled||this.mInputElement.readOnly;this.updateResetButtonVisibility();}
isEmpty(aValue){return aValue==undefined||0===aValue.length;}
getFieldValue(aField){if(!aField||!aField.classList.contains("numeric")){return undefined;}
let value=aField.getAttribute("value");return this.isEmpty(value)?undefined:Number(value);}
clearFieldValue(aField){aField.textContent=aField.placeholder;aField.setAttribute("value","");if(aField.classList.contains("numeric")){aField.setAttribute("typeBuffer","");}
this.updateResetButtonVisibility();}
setFieldValue(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
clearInputFields(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
setFieldsFromInputValue(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
setInputValueFromFields(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
setFieldsFromPicker(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
handleKeypress(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
handleKeyboardNav(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
getCurrentValue(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
isAnyFieldAvailable(){throw Components.Exception("",Cr.NS_ERROR_NOT_IMPLEMENTED);}
notifyPicker(){if(this.mIsPickerOpen&&this.isAnyFieldAvailable(true)){this.mInputElement.updateDateTimePicker(this.getCurrentValue());}}
isDisabled(){return this.mInputElement.hasAttribute("disabled");}
isReadonly(){return this.mInputElement.hasAttribute("readonly");}
isEditable(){return!this.isDisabled()&&!this.isReadonly();}
isRequired(){return this.mInputElement.hasAttribute("required");}
containingTree(){return this.mInputElement.containingShadowRoot||this.document;}
handleEvent(aEvent){this.log("handleEvent: "+aEvent.type);if(!aEvent.isTrusted){return;}
switch(aEvent.type){case"MozDateTimeValueChanged":{this.notifyInputElementValueChanged();break;}
case"MozNotifyMinMaxStepAttrChanged":{this.notifyMinMaxStepAttrChanged();break;}
case"MozFocusInnerTextBox":{this.focusInnerTextBox();break;}
case"MozBlurInnerTextBox":{this.blurInnerTextBox();break;}
case"MozDateTimeAttributeChanged":{this.updateEditAttributes();break;}
case"MozPickerValueChanged":{this.setValueFromPicker(aEvent.detail);break;}
case"MozSetDateTimePickerState":{this.setPickerState(aEvent.detail);break;}
case"keypress":{this.onKeyPress(aEvent);break;}
case"click":{this.onClick(aEvent);break;}
case"focus":{this.onFocus(aEvent);break;}
case"blur":{this.onBlur(aEvent);break;}
case"mousedown":case"copy":case"cut":case"paste":{aEvent.preventDefault();break;}
default:break;}}
onFocus(aEvent){this.log("onFocus originalTarget: "+aEvent.originalTarget);if(this.containingTree().activeElement!=this.mInputElement){return;}
let target=aEvent.originalTarget;if(target.matches("span.datetime-edit-field")){if(target.disabled){return;}
this.mLastFocusedField=target;this.mInputElement.setFocusState(true);}}
onBlur(aEvent){this.log("onBlur originalTarget: "+
aEvent.originalTarget+" target: "+
aEvent.target+" rt: "+
aEvent.relatedTarget);let target=aEvent.originalTarget;target.setAttribute("typeBuffer","");this.setInputValueFromFields();
if(aEvent.relatedTarget!=this.mInputElement){this.mInputElement.setFocusState(false);if(this.mIsPickerOpen){this.mInputElement.closeDateTimePicker();}}}
onKeyPress(aEvent){this.log("onKeyPress key: "+aEvent.key);switch(aEvent.key){case"Enter":case"Escape":case" ":{if(this.mIsPickerOpen){this.mInputElement.closeDateTimePicker();}else if(aEvent.key!="Escape"){this.mInputElement.openDateTimePicker(this.getCurrentValue());}else{break;}
aEvent.preventDefault();break;}
case"Backspace":{
if(this.isEditable()){let targetField=aEvent.originalTarget;this.clearFieldValue(targetField);this.setInputValueFromFields();aEvent.preventDefault();}
break;}
case"ArrowRight":case"ArrowLeft":{this.advanceToNextField(!(aEvent.key=="ArrowRight"));aEvent.preventDefault();break;}
case"ArrowUp":case"ArrowDown":case"PageUp":case"PageDown":case"Home":case"End":{this.handleKeyboardNav(aEvent);aEvent.preventDefault();break;}
default:{ if(aEvent.keyCode==0&&!(aEvent.ctrlKey||aEvent.altKey||aEvent.metaKey)){this.handleKeypress(aEvent);aEvent.preventDefault();}
break;}}}
onClick(aEvent){this.log("onClick originalTarget: "+
aEvent.originalTarget+" target: "+
aEvent.target);if(aEvent.defaultPrevented||!this.isEditable()){return;}
if(aEvent.originalTarget==this.mResetButton){this.clearInputFields(false);}else if(!this.mIsPickerOpen){this.mInputElement.openDateTimePicker(this.getCurrentValue());}}};this.DateInputImplWidget=class extends DateTimeInputBaseImplWidget{constructor(shadowRoot){super(shadowRoot);}
onsetup(){super.onsetup();this.mMinMonth=1;this.mMaxMonth=12;this.mMinDay=1;this.mMaxDay=31;this.mMinYear=1;this.mMaxYear=275760;this.mMonthDayLength=2;this.mYearLength=4;this.mMonthPageUpDownInterval=3;this.mDayPageUpDownInterval=7;this.mYearPageUpDownInterval=10;this.buildEditFields();this.updateEditAttributes();if(this.mInputElement.value){this.setFieldsFromInputValue();}}
destructor(){this.removeEventListenersToField(this.mYearField);this.removeEventListenersToField(this.mMonthField);this.removeEventListenersToField(this.mDayField);super.destructor();}
buildEditFields(){let root=this.shadowRoot.getElementById("edit-wrapper");let yearMaxLength=this.mMaxYear.toString().length;let formatter=Intl.DateTimeFormat(this.mLocales,{year:"numeric",month:"numeric",day:"numeric",});formatter.formatToParts(Date.now()).map(part=>{switch(part.type){case"year":this.mYearField=this.createEditFieldAndAppend(this.mYearPlaceHolder,this.mYearLabel,true,this.mYearLength,yearMaxLength,this.mMinYear,this.mMaxYear,this.mYearPageUpDownInterval);this.addEventListenersToField(this.mYearField);break;case"month":this.mMonthField=this.createEditFieldAndAppend(this.mMonthPlaceHolder,this.mMonthLabel,true,this.mMonthDayLength,this.mMonthDayLength,this.mMinMonth,this.mMaxMonth,this.mMonthPageUpDownInterval);this.addEventListenersToField(this.mMonthField);break;case"day":this.mDayField=this.createEditFieldAndAppend(this.mDayPlaceHolder,this.mDayLabel,true,this.mMonthDayLength,this.mMonthDayLength,this.mMinDay,this.mMaxDay,this.mDayPageUpDownInterval);this.addEventListenersToField(this.mDayField);break;default:let span=this.shadowRoot.createElementAndAppendChildAt(root,"span");span.textContent=part.value;break;}});}
clearInputFields(aFromInputElement){this.log("clearInputFields");if(this.mMonthField){this.clearFieldValue(this.mMonthField);}
if(this.mDayField){this.clearFieldValue(this.mDayField);}
if(this.mYearField){this.clearFieldValue(this.mYearField);}
if(!aFromInputElement){if(this.mInputElement.value){this.mInputElement.setUserInput("");}else{this.mInputElement.updateValidityState();}}}
setFieldsFromInputValue(){let value=this.mInputElement.value;if(!value){this.clearInputFields(true);return;}
this.log("setFieldsFromInputValue: "+value);let[year,month,day]=value.split("-");this.setFieldValue(this.mYearField,year);this.setFieldValue(this.mMonthField,month);this.setFieldValue(this.mDayField,day);this.notifyPicker();}
setInputValueFromFields(){if(this.isAnyFieldEmpty()){if(this.mInputElement.value){this.mInputElement.setUserInput("");}else{this.mInputElement.updateValidityState();}

this.notifyPicker();return;}
let{year,month,day}=this.getCurrentValue(); year=year.toString().padStart(this.mYearLength,"0");month=month<10?"0"+month:month;day=day<10?"0"+day:day;let date=[year,month,day].join("-");if(date==this.mInputElement.value){return;}
this.log("setInputValueFromFields: "+date);this.notifyPicker();this.mInputElement.setUserInput(date);}
setFieldsFromPicker(aValue){let year=aValue.year;let month=aValue.month;let day=aValue.day;if(!this.isEmpty(year)){this.setFieldValue(this.mYearField,year);}
if(!this.isEmpty(month)){this.setFieldValue(this.mMonthField,month);}
if(!this.isEmpty(day)){this.setFieldValue(this.mDayField,day);}
this.setInputValueFromFields();}
handleKeypress(aEvent){if(!this.isEditable()){return;}
let targetField=aEvent.originalTarget;let key=aEvent.key;if(targetField.classList.contains("numeric")&&key.match(/[0-9]/)){let buffer=targetField.getAttribute("typeBuffer")||"";buffer=buffer.concat(key);this.setFieldValue(targetField,buffer);let n=Number(buffer);let max=targetField.getAttribute("max");let maxLength=targetField.getAttribute("maxlength");if(buffer.length>=maxLength||n*10>max){buffer="";this.advanceToNextField();}
targetField.setAttribute("typeBuffer",buffer);if(!this.isAnyFieldEmpty()){this.setInputValueFromFields();}}}
incrementFieldValue(aTargetField,aTimes){let value=this.getFieldValue(aTargetField);if(this.isEmpty(value)){let now=new Date();if(aTargetField==this.mYearField){value=now.getFullYear();}else if(aTargetField==this.mMonthField){value=now.getMonth()+1;}else if(aTargetField==this.mDayField){value=now.getDate();}else{this.log("Field not supported in incrementFieldValue.");return;}}
let min=Number(aTargetField.getAttribute("min"));let max=Number(aTargetField.getAttribute("max"));value+=Number(aTimes);if(value>max){value-=max-min+1;}else if(value<min){value+=max-min+1;}
this.setFieldValue(aTargetField,value);}
handleKeyboardNav(aEvent){if(!this.isEditable()){return;}
let targetField=aEvent.originalTarget;let key=aEvent.key;if(targetField==this.mYearField&&(key=="Home"||key=="End")){return;}
switch(key){case"ArrowUp":this.incrementFieldValue(targetField,1);break;case"ArrowDown":this.incrementFieldValue(targetField,-1);break;case"PageUp":{let interval=targetField.getAttribute("pginterval");this.incrementFieldValue(targetField,interval);break;}
case"PageDown":{let interval=targetField.getAttribute("pginterval");this.incrementFieldValue(targetField,0-interval);break;}
case"Home":let min=targetField.getAttribute("min");this.setFieldValue(targetField,min);break;case"End":let max=targetField.getAttribute("max");this.setFieldValue(targetField,max);break;}
this.setInputValueFromFields();}
getCurrentValue(){let year=this.getFieldValue(this.mYearField);let month=this.getFieldValue(this.mMonthField);let day=this.getFieldValue(this.mDayField);let date={year,month,day};this.log("getCurrentValue: "+JSON.stringify(date));return date;}
setFieldValue(aField,aValue){if(!aField||!aField.classList.contains("numeric")){return;}
let value=Number(aValue);if(isNaN(value)){this.log("NaN on setFieldValue!");return;}
let maxLength=aField.getAttribute("maxlength");if(aValue.length==maxLength){let min=Number(aField.getAttribute("min"));let max=Number(aField.getAttribute("max"));if(value<min){value=min;}else if(value>max){value=max;}}
aField.setAttribute("value",value);let minDigits=aField.getAttribute("mindigits");let formatted=value.toLocaleString(this.mLocales,{minimumIntegerDigits:minDigits,useGrouping:false,});aField.textContent=formatted;aField.setAttribute("aria-valuetext",formatted);this.updateResetButtonVisibility();}
isAnyFieldAvailable(aForPicker){let{year,month,day}=this.getCurrentValue();return!this.isEmpty(year)||!this.isEmpty(month)||!this.isEmpty(day);}
isAnyFieldEmpty(){let{year,month,day}=this.getCurrentValue();return this.isEmpty(year)||this.isEmpty(month)||this.isEmpty(day);}};this.TimeInputImplWidget=class extends DateTimeInputBaseImplWidget{constructor(shadowRoot){super(shadowRoot);}
onsetup(){super.onsetup();const kDefaultAMString="AM";const kDefaultPMString="PM";let{amString,pmString}=this.getStringsForLocale(this.mLocales);this.mAMIndicator=amString||kDefaultAMString;this.mPMIndicator=pmString||kDefaultPMString;this.mHour12=this.is12HourTime(this.mLocales);this.mMillisecSeparatorText=".";this.mMaxLength=2;this.mMillisecMaxLength=3;this.mDefaultStep=60*1000; this.mMinHour=this.mHour12?1:0;this.mMaxHour=this.mHour12?12:23;this.mMinMinute=0;this.mMaxMinute=59;this.mMinSecond=0;this.mMaxSecond=59;this.mMinMillisecond=0;this.mMaxMillisecond=999;this.mHourPageUpDownInterval=3;this.mMinSecPageUpDownInterval=10;this.buildEditFields();this.updateEditAttributes();if(this.mInputElement.value){this.setFieldsFromInputValue();}}
destructor(){this.removeEventListenersToField(this.mHourField);this.removeEventListenersToField(this.mMinuteField);this.removeEventListenersToField(this.mSecondField);this.removeEventListenersToField(this.mMillisecField);this.removeEventListenersToField(this.mDayPeriodField);super.destructor();}
get kMsPerSecond(){return 1000;}
get kMsPerMinute(){return 60*1000;}
getInputElementValues(){let value=this.mInputElement.value;if(value.length===0){return{};}
let hour,minute,second,millisecond;[hour,minute,second]=value.split(":");if(second){[second,millisecond]=second.split(".");if(millisecond&&millisecond.length===1){millisecond*=100;}else if(millisecond&&millisecond.length===2){millisecond*=10;}}
return{hour,minute,second,millisecond};}
hasSecondField(){return!!this.mSecondField;}
hasMillisecField(){return!!this.mMillisecField;}
hasDayPeriodField(){return!!this.mDayPeriodField;}
shouldShowSecondField(){let{second}=this.getInputElementValues();if(second!=undefined){return true;}
let stepBase=this.mInputElement.getStepBase();if(stepBase%this.kMsPerMinute!=0){return true;}
let step=this.mInputElement.getStep();if(step%this.kMsPerMinute!=0){return true;}
return false;}
shouldShowMillisecField(){let{millisecond}=this.getInputElementValues();if(millisecond!=undefined){return true;}
let stepBase=this.mInputElement.getStepBase();if(stepBase%this.kMsPerSecond!=0){return true;}
let step=this.mInputElement.getStep();if(step%this.kMsPerSecond!=0){return true;}
return false;}
rebuildEditFieldsIfNeeded(){if(this.shouldShowSecondField()==this.hasSecondField()&&this.shouldShowMillisecField()==this.hasMillisecField()){return;}
let focused=this.mInputElement.matches(":focus");let root=this.shadowRoot.getElementById("edit-wrapper");while(root.firstChild){root.firstChild.remove();}
this.removeEventListenersToField(this.mHourField);this.removeEventListenersToField(this.mMinuteField);this.removeEventListenersToField(this.mSecondField);this.removeEventListenersToField(this.mMillisecField);this.removeEventListenersToField(this.mDayPeriodField);this.mHourField=null;this.mMinuteField=null;this.mSecondField=null;this.mMillisecField=null;this.mDayPeriodField=null;this.buildEditFields();if(focused){this.focusInnerTextBox();}}
buildEditFields(){let root=this.shadowRoot.getElementById("edit-wrapper");let options={hour:"numeric",minute:"numeric",hour12:this.mHour12,};if(this.shouldShowSecondField()){options.second="numeric";}
let formatter=Intl.DateTimeFormat(this.mLocales,options);formatter.formatToParts(Date.now()).map(part=>{switch(part.type){case"hour":this.mHourField=this.createEditFieldAndAppend(this.mHourPlaceHolder,this.mHourLabel,true,this.mMaxLength,this.mMaxLength,this.mMinHour,this.mMaxHour,this.mHourPageUpDownInterval);this.addEventListenersToField(this.mHourField);break;case"minute":this.mMinuteField=this.createEditFieldAndAppend(this.mMinutePlaceHolder,this.mMinuteLabel,true,this.mMaxLength,this.mMaxLength,this.mMinMinute,this.mMaxMinute,this.mMinSecPageUpDownInterval);this.addEventListenersToField(this.mMinuteField);break;case"second":this.mSecondField=this.createEditFieldAndAppend(this.mSecondPlaceHolder,this.mSecondLabel,true,this.mMaxLength,this.mMaxLength,this.mMinSecond,this.mMaxSecond,this.mMinSecPageUpDownInterval);this.addEventListenersToField(this.mSecondField);if(this.shouldShowMillisecField()){
let span=this.shadowRoot.createElementAndAppendChildAt(root,"span");span.textContent=this.mMillisecSeparatorText;this.mMillisecField=this.createEditFieldAndAppend(this.mMillisecPlaceHolder,this.mMillisecLabel,true,this.mMillisecMaxLength,this.mMillisecMaxLength,this.mMinMillisecond,this.mMaxMillisecond,this.mMinSecPageUpDownInterval);this.addEventListenersToField(this.mMillisecField);}
break;case"dayPeriod":this.mDayPeriodField=this.createEditFieldAndAppend(this.mDayPeriodPlaceHolder,this.mDayPeriodLabel,false);this.addEventListenersToField(this.mDayPeriodField); this.mDayPeriodField.setAttribute("aria-autocomplete","inline");break;default:let span=this.shadowRoot.createElementAndAppendChildAt(root,"span");span.textContent=part.value;break;}});}
getStringsForLocale(aLocales){this.log("getStringsForLocale: "+aLocales);let intlUtils=this.window.intlUtils;if(!intlUtils){return{};}
let amString,pmString;let keys=["dates/gregorian/dayperiods/am","dates/gregorian/dayperiods/pm",];let result=intlUtils.getDisplayNames(this.mLocales,{style:"short",keys,});[amString,pmString]=keys.map(key=>result.values[key]);return{amString,pmString};}
is12HourTime(aLocales){let options=new Intl.DateTimeFormat(aLocales,{hour:"numeric",}).resolvedOptions();return options.hour12;}
setFieldsFromInputValue(){let{hour,minute,second,millisecond}=this.getInputElementValues();if(this.isEmpty(hour)&&this.isEmpty(minute)){this.clearInputFields(true);return;}

this.rebuildEditFieldsIfNeeded();this.setFieldValue(this.mHourField,hour);this.setFieldValue(this.mMinuteField,minute);if(this.mHour12){this.setDayPeriodValue(hour>=this.mMaxHour?this.mPMIndicator:this.mAMIndicator);}
if(this.hasSecondField()){this.setFieldValue(this.mSecondField,second!=undefined?second:0);}
if(this.hasMillisecField()){this.setFieldValue(this.mMillisecField,millisecond!=undefined?millisecond:0);}
this.notifyPicker();}
setInputValueFromFields(){if(this.isAnyFieldEmpty()){if(this.mInputElement.value){this.mInputElement.setUserInput("");}else{this.mInputElement.updateValidityState();}

this.notifyPicker();return;}
let{hour,minute,second,millisecond}=this.getCurrentValue();let dayPeriod=this.getDayPeriodValue(); if(this.mHour12){if(dayPeriod==this.mPMIndicator&&hour<this.mMaxHour){hour+=this.mMaxHour;}else if(dayPeriod==this.mAMIndicator&&hour==this.mMaxHour){hour=0;}}
hour=hour<10?"0"+hour:hour;minute=minute<10?"0"+minute:minute;let time=hour+":"+minute;if(second!=undefined){second=second<10?"0"+second:second;time+=":"+second;}
if(millisecond!=undefined){millisecond=millisecond.toString().padStart(this.mMillisecMaxLength,"0");time+="."+millisecond;}
if(time==this.mInputElement.value){return;}
this.log("setInputValueFromFields: "+time);this.notifyPicker();this.mInputElement.setUserInput(time);}
setFieldsFromPicker(aValue){let hour=aValue.hour;let minute=aValue.minute;this.log("setFieldsFromPicker: "+hour+":"+minute);if(!this.isEmpty(hour)){this.setFieldValue(this.mHourField,hour);if(this.mHour12){this.setDayPeriodValue(hour>=this.mMaxHour?this.mPMIndicator:this.mAMIndicator);}}
if(!this.isEmpty(minute)){this.setFieldValue(this.mMinuteField,minute);}
this.setInputValueFromFields();}
clearInputFields(aFromInputElement){this.log("clearInputFields");if(this.mHourField){this.clearFieldValue(this.mHourField);}
if(this.mMinuteField){this.clearFieldValue(this.mMinuteField);}
if(this.hasSecondField()){this.clearFieldValue(this.mSecondField);}
if(this.hasMillisecField()){this.clearFieldValue(this.mMillisecField);}
if(this.hasDayPeriodField()){this.clearFieldValue(this.mDayPeriodField);}
if(!aFromInputElement){if(this.mInputElement.value){this.mInputElement.setUserInput("");}else{this.mInputElement.updateValidityState();}}}
notifyMinMaxStepAttrChanged(){
this.rebuildEditFieldsIfNeeded();this.setFieldsFromInputValue();}
incrementFieldValue(aTargetField,aTimes){let value=this.getFieldValue(aTargetField);if(this.isEmpty(value)){let now=new Date();if(aTargetField==this.mHourField){value=now.getHours();if(this.mHour12){value=value%this.mMaxHour||this.mMaxHour;}}else if(aTargetField==this.mMinuteField){value=now.getMinutes();}else if(aTargetField==this.mSecondField){value=now.getSeconds();}else if(aTargetField==this.mMillisecField){value=now.getMilliseconds();}else{this.log("Field not supported in incrementFieldValue.");return;}}
let min=aTargetField.getAttribute("min");let max=aTargetField.getAttribute("max");value+=Number(aTimes);if(value>max){value-=max-min+1;}else if(value<min){value+=max-min+1;}
this.setFieldValue(aTargetField,value);}
handleKeyboardNav(aEvent){if(!this.isEditable()){return;}
let targetField=aEvent.originalTarget;let key=aEvent.key;if(this.hasDayPeriodField()&&targetField==this.mDayPeriodField){if(key=="Home"||key=="End"){return;}
this.setDayPeriodValue(this.getDayPeriodValue()==this.mAMIndicator?this.mPMIndicator:this.mAMIndicator);this.setInputValueFromFields();return;}
switch(key){case"ArrowUp":this.incrementFieldValue(targetField,1);break;case"ArrowDown":this.incrementFieldValue(targetField,-1);break;case"PageUp":{let interval=targetField.getAttribute("pginterval");this.incrementFieldValue(targetField,interval);break;}
case"PageDown":{let interval=targetField.getAttribute("pginterval");this.incrementFieldValue(targetField,0-interval);break;}
case"Home":let min=targetField.getAttribute("min");this.setFieldValue(targetField,min);break;case"End":let max=targetField.getAttribute("max");this.setFieldValue(targetField,max);break;}
this.setInputValueFromFields();}
handleKeypress(aEvent){if(!this.isEditable()){return;}
let targetField=aEvent.originalTarget;let key=aEvent.key;if(this.hasDayPeriodField()&&targetField==this.mDayPeriodField){if(key=="a"||key=="A"){this.setDayPeriodValue(this.mAMIndicator);}else if(key=="p"||key=="P"){this.setDayPeriodValue(this.mPMIndicator);}
if(!this.isAnyFieldEmpty()){this.setInputValueFromFields();}
return;}
if(targetField.classList.contains("numeric")&&key.match(/[0-9]/)){let buffer=targetField.getAttribute("typeBuffer")||"";buffer=buffer.concat(key);this.setFieldValue(targetField,buffer);let n=Number(buffer);let max=targetField.getAttribute("max");let maxLength=targetField.getAttribute("maxlength");if(buffer.length>=maxLength||n*10>max){buffer="";this.advanceToNextField();}
targetField.setAttribute("typeBuffer",buffer);if(!this.isAnyFieldEmpty()){this.setInputValueFromFields();}}}
setFieldValue(aField,aValue){if(!aField||!aField.classList.contains("numeric")){return;}
let value=Number(aValue);if(isNaN(value)){this.log("NaN on setFieldValue!");return;}
if(aField==this.mHourField){if(this.mHour12){
let maxLength=aField.getAttribute("maxlength");if(value==0&&aValue.length==maxLength){value=this.mMaxHour;}else{value=value>this.mMaxHour?value%this.mMaxHour:value;}}else if(value>this.mMaxHour){value=this.mMaxHour;}}
aField.setAttribute("value",value);let minDigits=aField.getAttribute("mindigits");let formatted=value.toLocaleString(this.mLocales,{minimumIntegerDigits:minDigits,useGrouping:false,});aField.textContent=formatted;aField.setAttribute("aria-valuetext",formatted);this.updateResetButtonVisibility();}
getDayPeriodValue(aValue){if(!this.hasDayPeriodField()){return"";}
let placeholder=this.mDayPeriodField.placeholder;let value=this.mDayPeriodField.textContent;return value==placeholder?"":value;}
setDayPeriodValue(aValue){if(!this.hasDayPeriodField()){return;}
this.mDayPeriodField.textContent=aValue;this.mDayPeriodField.setAttribute("value",aValue);this.updateResetButtonVisibility();}
isAnyFieldAvailable(aForPicker){let{hour,minute,second,millisecond}=this.getCurrentValue();let dayPeriod=this.getDayPeriodValue();let available=!this.isEmpty(hour)||!this.isEmpty(minute);if(available){return true;}
if(aForPicker){return false;}
return((this.hasDayPeriodField()&&!this.isEmpty(dayPeriod))||(this.hasSecondField()&&!this.isEmpty(second))||(this.hasMillisecField()&&!this.isEmpty(millisecond)));}
isAnyFieldEmpty(){let{hour,minute,second,millisecond}=this.getCurrentValue();let dayPeriod=this.getDayPeriodValue();return(this.isEmpty(hour)||this.isEmpty(minute)||(this.hasDayPeriodField()&&this.isEmpty(dayPeriod))||(this.hasSecondField()&&this.isEmpty(second))||(this.hasMillisecField()&&this.isEmpty(millisecond)));}
getCurrentValue(){let hour=this.getFieldValue(this.mHourField);if(!this.isEmpty(hour)){if(this.mHour12){let dayPeriod=this.getDayPeriodValue();if(dayPeriod==this.mPMIndicator&&hour<this.mMaxHour){hour+=this.mMaxHour;}else if(dayPeriod==this.mAMIndicator&&hour==this.mMaxHour){hour=0;}}}
let minute=this.getFieldValue(this.mMinuteField);let second=this.getFieldValue(this.mSecondField);let millisecond=this.getFieldValue(this.mMillisecField);let time={hour,minute,second,millisecond};this.log("getCurrentValue: "+JSON.stringify(time));return time;}};