"use strict";function DatePicker(context){this.context=context;this._attachEventListeners();}
{const CAL_VIEW_SIZE=42;DatePicker.prototype={init(props={}){this.props=props;this._setDefaultState();this._createComponents();this._update();document.dispatchEvent(new CustomEvent("PickerReady"));},_setDefaultState(){const{year,month,day,min,max,step,stepBase,firstDayOfWeek,weekends,monthStrings,weekdayStrings,locale,dir,}=this.props;const dateKeeper=new DateKeeper({year,month,day,min,max,step,stepBase,firstDayOfWeek,weekends,calViewSize:CAL_VIEW_SIZE,});document.dir=dir;this.state={dateKeeper,locale,isMonthPickerVisible:false,datetimeOrders:new Intl.DateTimeFormat(locale).formatToParts(new Date(0)).map(part=>part.type),getDayString:day=>day?new Intl.NumberFormat(locale).format(day):"",getWeekHeaderString:weekday=>weekdayStrings[weekday],getMonthString:month=>monthStrings[month],setSelection:date=>{dateKeeper.setSelection({year:date.getUTCFullYear(),month:date.getUTCMonth(),day:date.getUTCDate(),});this._update();this._dispatchState();this._closePopup();},setYear:year=>{dateKeeper.setYear(year);dateKeeper.setSelection({year,month:dateKeeper.selection.month,day:dateKeeper.selection.day,});this._update();this._dispatchState();},setMonth:month=>{dateKeeper.setMonth(month);dateKeeper.setSelection({year:dateKeeper.selection.year,month,day:dateKeeper.selection.day,});this._update();this._dispatchState();},toggleMonthPicker:()=>{this.state.isMonthPickerVisible=!this.state.isMonthPickerVisible;this._update();},};},_createComponents(){this.components={calendar:new Calendar({calViewSize:CAL_VIEW_SIZE,locale:this.state.locale,setSelection:this.state.setSelection,getDayString:this.state.getDayString,getWeekHeaderString:this.state.getWeekHeaderString,},{weekHeader:this.context.weekHeader,daysView:this.context.daysView,}),monthYear:new MonthYear({setYear:this.state.setYear,setMonth:this.state.setMonth,getMonthString:this.state.getMonthString,datetimeOrders:this.state.datetimeOrders,locale:this.state.locale,},{monthYear:this.context.monthYear,monthYearView:this.context.monthYearView,}),};},_update(options={}){const{dateKeeper,isMonthPickerVisible}=this.state;if(isMonthPickerVisible){this.state.months=dateKeeper.getMonths();this.state.years=dateKeeper.getYears();}else{this.state.days=dateKeeper.getDays();}
this.components.monthYear.setProps({isVisible:isMonthPickerVisible,dateObj:dateKeeper.state.dateObj,months:this.state.months,years:this.state.years,toggleMonthPicker:this.state.toggleMonthPicker,noSmoothScroll:options.noSmoothScroll,});this.components.calendar.setProps({isVisible:!isMonthPickerVisible,days:this.state.days,weekHeaders:dateKeeper.state.weekHeaders,});isMonthPickerVisible?this.context.monthYearView.classList.remove("hidden"):this.context.monthYearView.classList.add("hidden");},_closePopup(){window.postMessage({name:"ClosePopup",},"*");},_dispatchState(){const{year,month,day}=this.state.dateKeeper.selection;
window.postMessage({name:"PickerPopupChanged",detail:{year,month,day,},},"*");},_attachEventListeners(){window.addEventListener("message",this);document.addEventListener("mouseup",this,{passive:true});document.addEventListener("mousedown",this);},handleEvent(event){switch(event.type){case"message":{this.handleMessage(event);break;}
case"mousedown":{ event.preventDefault();event.target.setCapture();if(event.target==this.context.buttonPrev){event.target.classList.add("active");this.state.dateKeeper.setMonthByOffset(-1);this._update();}else if(event.target==this.context.buttonNext){event.target.classList.add("active");this.state.dateKeeper.setMonthByOffset(1);this._update();}
break;}
case"mouseup":{if(event.target==this.context.buttonPrev||event.target==this.context.buttonNext){event.target.classList.remove("active");}}}},handleMessage(event){switch(event.data.name){case"PickerSetValue":{this.set(event.data.detail);break;}
case"PickerInit":{this.init(event.data.detail);break;}}},set({year,month,day}){if(!this.state){return;}
const{dateKeeper}=this.state;dateKeeper.setCalendarMonth({year,month,});dateKeeper.setSelection({year,month,day,});this._update({noSmoothScroll:true});},};function MonthYear(options,context){const spinnerSize=5;const yearFormat=new Intl.DateTimeFormat(options.locale,{year:"numeric",timeZone:"UTC",}).format;const dateFormat=new Intl.DateTimeFormat(options.locale,{year:"numeric",month:"long",timeZone:"UTC",}).format;const spinnerOrder=options.datetimeOrders.indexOf("month")<options.datetimeOrders.indexOf("year")?"order-month-year":"order-year-month";context.monthYearView.classList.add(spinnerOrder);this.context=context;this.state={dateFormat};this.props={};this.components={month:new Spinner({id:"spinner-month",setValue:month=>{this.state.isMonthSet=true;options.setMonth(month);},getDisplayString:options.getMonthString,viewportSize:spinnerSize,},context.monthYearView),year:new Spinner({id:"spinner-year",setValue:year=>{this.state.isYearSet=true;options.setYear(year);},getDisplayString:year=>yearFormat(new Date(new Date(0).setUTCFullYear(year))),viewportSize:spinnerSize,},context.monthYearView),};this._attachEventListeners();}
MonthYear.prototype={setProps(props){this.context.monthYear.textContent=this.state.dateFormat(props.dateObj);if(props.isVisible){this.context.monthYear.classList.add("active");this.components.month.setState({value:props.dateObj.getUTCMonth(),items:props.months,isInfiniteScroll:true,isValueSet:this.state.isMonthSet,smoothScroll:!(this.state.firstOpened||props.noSmoothScroll),});this.components.year.setState({value:props.dateObj.getUTCFullYear(),items:props.years,isInfiniteScroll:false,isValueSet:this.state.isYearSet,smoothScroll:!(this.state.firstOpened||props.noSmoothScroll),});this.state.firstOpened=false;}else{this.context.monthYear.classList.remove("active");this.state.isMonthSet=false;this.state.isYearSet=false;this.state.firstOpened=true;}
this.props=Object.assign(this.props,props);},handleEvent(event){switch(event.type){case"click":{this.props.toggleMonthPicker();break;}}},_attachEventListeners(){this.context.monthYear.addEventListener("click",this);},};}