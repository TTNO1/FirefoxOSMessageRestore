"use strict";function Calendar(options,context){const DAYS_IN_A_WEEK=7;this.context=context;this.state={days:[],weekHeaders:[],setSelection:options.setSelection,getDayString:options.getDayString,getWeekHeaderString:options.getWeekHeaderString,};this.elements={weekHeaders:this._generateNodes(DAYS_IN_A_WEEK,context.weekHeader),daysView:this._generateNodes(options.calViewSize,context.daysView),};this._attachEventListeners();}
Calendar.prototype={setProps(props){if(props.isVisible){ const days=props.days.map(({dateObj,content,classNames,enabled})=>{return{dateObj,textContent:this.state.getDayString(content),className:classNames.join(" "),enabled,};});const weekHeaders=props.weekHeaders.map(({content,classNames})=>{return{textContent:this.state.getWeekHeaderString(content),className:classNames.join(" "),};}); this._render({elements:this.elements.daysView,items:days,prevState:this.state.days,});this._render({elements:this.elements.weekHeaders,items:weekHeaders,prevState:this.state.weekHeaders,}); this.state.days=days;this.state.weekHeaders=weekHeaders;}},_render({elements,items,prevState}){for(let i=0,l=items.length;i<l;i++){let el=elements[i]; if(!prevState[i]||prevState[i].textContent!=items[i].textContent){el.textContent=items[i].textContent;}
if(!prevState[i]||prevState[i].className!=items[i].className){el.className=items[i].className;}}},_generateNodes(size,context){let frag=document.createDocumentFragment();let refs=[];for(let i=0;i<size;i++){let el=document.createElement("div");el.dataset.id=i;refs.push(el);frag.appendChild(el);}
context.appendChild(frag);return refs;},handleEvent(event){switch(event.type){case"click":{if(event.target.parentNode==this.context.daysView){let targetId=event.target.dataset.id;let targetObj=this.state.days[targetId];if(targetObj.enabled){this.state.setSelection(targetObj.dateObj);}}
break;}}},_attachEventListeners(){this.context.daysView.addEventListener("click",this);},};