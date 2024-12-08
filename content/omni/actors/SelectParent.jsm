"use strict";var EXPORTED_SYMBOLS=["SelectParent","SelectParentHelper"];const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const MAX_ROWS=20;const SEARCH_MINIMUM_ELEMENTS=40;const PROPERTIES_RESET_WHEN_ACTIVE=["color","background-color","text-shadow",];
const SUPPORTED_OPTION_OPTGROUP_PROPERTIES=["direction","color","background-color","text-shadow","font-family","font-weight","font-size","font-style",];const SUPPORTED_SELECT_PROPERTIES=[...SUPPORTED_OPTION_OPTGROUP_PROPERTIES,"scrollbar-width","scrollbar-color",];const customStylingEnabled=Services.prefs.getBoolPref("dom.forms.select.customstyling");var SelectParentHelper={populate(menulist,items,uniqueItemStyles,selectedIndex,zoom,uaStyle,selectStyle){ menulist.menupopup.textContent="";let stylesheet=menulist.querySelector("#ContentSelectDropdownStylesheet");if(stylesheet){stylesheet.remove();}
let doc=menulist.ownerDocument;let sheet;if(customStylingEnabled){stylesheet=doc.createElementNS("http://www.w3.org/1999/xhtml","style");stylesheet.setAttribute("id","ContentSelectDropdownStylesheet");stylesheet.hidden=true;stylesheet=menulist.appendChild(stylesheet);sheet=stylesheet.sheet;}else{selectStyle=uaStyle;}
let selectBackgroundSet=false;if(selectStyle["background-color"]=="rgba(0, 0, 0, 0)"){selectStyle["background-color"]=uaStyle["background-color"];}
if(selectStyle.color==selectStyle["background-color"]){selectStyle.color=uaStyle.color;}
if(customStylingEnabled){if(selectStyle["text-shadow"]!="none"){sheet.insertRule(`#ContentSelectDropdown > menupopup > [_moz-menuactive="true"] {
          text-shadow: none;
        }`,0);}
let addedRule=false;for(let property of SUPPORTED_SELECT_PROPERTIES){if(property=="direction"){continue;}
if(!selectStyle[property]||selectStyle[property]==uaStyle[property]){continue;}
if(!addedRule){sheet.insertRule("#ContentSelectDropdown > menupopup {}",0);addedRule=true;}
let value=selectStyle[property];if(property=="scrollbar-width"){
property="--content-select-scrollbar-width";}
sheet.cssRules[0].style.setProperty(property,value);}
if(customStylingEnabled&&selectStyle["background-color"]!=uaStyle["background-color"]){

let parsedColor=sheet.cssRules[0].style["background-color"];sheet.cssRules[0].style["background-color"]="";sheet.cssRules[0].style["background-image"]=`linear-gradient(${parsedColor}, ${parsedColor})`;selectBackgroundSet=true;}
if(addedRule){sheet.insertRule(`#ContentSelectDropdown > menupopup > :not([_moz-menuactive="true"]) {
            color: inherit;
        }`,0);}}


if(selectBackgroundSet){menulist.menupopup.setAttribute("customoptionstyling","true");}else{menulist.menupopup.removeAttribute("customoptionstyling");}
this._currentZoom=zoom;this._currentMenulist=menulist;this.populateChildren(menulist,items,uniqueItemStyles,selectedIndex,zoom,selectStyle,selectBackgroundSet,sheet);},open(browser,menulist,rect,isOpenedViaTouch,selectParentActor){this._actor=selectParentActor;menulist.hidden=false;this._currentBrowser=browser;this._closedWithEnter=false;this._selectRect=rect;this._registerListeners(browser,menulist.menupopup);let win=browser.ownerGlobal;let menupopup=menulist.menupopup;let firstItem=menupopup.firstElementChild;while(firstItem&&firstItem.hidden){firstItem=firstItem.nextElementSibling;}
if(firstItem){let itemHeight=firstItem.getBoundingClientRect().height;let cs=win.getComputedStyle(menupopup);let bpHeight=parseFloat(cs.borderTopWidth)+
parseFloat(cs.borderBottomWidth)+
parseFloat(cs.paddingTop)+
parseFloat(cs.paddingBottom);menupopup.style.maxHeight=itemHeight*MAX_ROWS+bpHeight+"px";}
menupopup.classList.toggle("isOpenedViaTouch",isOpenedViaTouch);if(browser.getAttribute("selectmenuconstrained")!="false"){let constraintRect=browser.getBoundingClientRect();constraintRect=new win.DOMRect(constraintRect.left+win.mozInnerScreenX,constraintRect.top+win.mozInnerScreenY,constraintRect.width,constraintRect.height);menupopup.setConstraintRect(constraintRect);}else{menupopup.setConstraintRect(new win.DOMRect(0,0,0,0));}
menupopup.openPopupAtScreenRect(AppConstants.platform=="macosx"?"selection":"after_start",rect.left,rect.top,rect.width,rect.height,false,false);},hide(menulist,browser){if(this._currentBrowser==browser){menulist.menupopup.hidePopup();}},handleEvent(event){switch(event.type){case"mouseup":function inRect(rect,x,y){return(x>=rect.left&&x<=rect.left+rect.width&&y>=rect.top&&y<=rect.top+rect.height);}
let x=event.screenX,y=event.screenY;let onAnchor=!inRect(this._currentMenulist.menupopup.getOuterScreenRect(),x,y)&&inRect(this._selectRect,x,y)&&this._currentMenulist.menupopup.state=="open";this._actor.sendAsyncMessage("Forms:MouseUp",{onAnchor});break;case"mouseover":this._actor.sendAsyncMessage("Forms:MouseOver",{});break;case"mouseout":this._actor.sendAsyncMessage("Forms:MouseOut",{});break;case"keydown":if(event.keyCode==event.DOM_VK_RETURN){this._closedWithEnter=true;}
break;case"command":if(event.target.hasAttribute("value")){this._actor.sendAsyncMessage("Forms:SelectDropDownItem",{value:event.target.value,closedWithEnter:this._closedWithEnter,});}
break;case"fullscreen":if(this._currentMenulist){this._currentMenulist.menupopup.hidePopup();}
break;case"popuphidden":this._actor.sendAsyncMessage("Forms:DismissedDropDown",{});let popup=event.target;this._unregisterListeners(this._currentBrowser,popup);popup.parentNode.hidden=true;this._currentBrowser=null;this._currentMenulist=null;this._selectRect=null;this._currentZoom=1;this._actor=null;break;}},receiveMessage(msg){if(!this._currentBrowser){return;}
if(msg.name=="Forms:UpdateDropDown"){
if(!this._currentMenulist){return;}
let scrollBox=this._currentMenulist.menupopup.scrollBox.scrollbox;let scrollTop=scrollBox.scrollTop;let options=msg.data.options;let selectedIndex=msg.data.selectedIndex;this.populate(this._currentMenulist,options.options,options.uniqueStyles,selectedIndex,this._currentZoom,msg.data.defaultStyle,msg.data.style);scrollBox.scrollTop=scrollTop;}else if(msg.name=="Forms:BlurDropDown-Ping"){this._actor.sendAsyncMessage("Forms:BlurDropDown-Pong",{});}},_registerListeners(browser,popup){popup.addEventListener("command",this);popup.addEventListener("popuphidden",this);popup.addEventListener("mouseover",this);popup.addEventListener("mouseout",this);browser.ownerGlobal.addEventListener("mouseup",this,true);browser.ownerGlobal.addEventListener("keydown",this,true);browser.ownerGlobal.addEventListener("fullscreen",this,true);},_unregisterListeners(browser,popup){popup.removeEventListener("command",this);popup.removeEventListener("popuphidden",this);popup.removeEventListener("mouseover",this);popup.removeEventListener("mouseout",this);browser.ownerGlobal.removeEventListener("mouseup",this,true);browser.ownerGlobal.removeEventListener("keydown",this,true);browser.ownerGlobal.removeEventListener("fullscreen",this,true);},populateChildren(menulist,options,uniqueOptionStyles,selectedIndex,zoom,selectStyle,selectBackgroundSet,sheet,parentElement=null,isGroupDisabled=false,addSearch=true,nthChildIndex=1){let element=menulist.menupopup;let ariaOwns="";for(let option of options){let isOptGroup=option.tagName=="OPTGROUP";let item=element.ownerDocument.createXULElement(isOptGroup?"menucaption":"menuitem");if(isOptGroup){item.setAttribute("role","group");}
let style=uniqueOptionStyles[option.styleIndex];item.setAttribute("label",option.textContent);item.style.direction=style.direction;item.style.fontSize=zoom*parseFloat(style["font-size"],10)+"px";item.hidden=option.display=="none"||(parentElement&&parentElement.hidden);
 item.hiddenByContent=item.hidden;item.setAttribute("tooltiptext",option.tooltip);if(style["background-color"]=="rgba(0, 0, 0, 0)"){style["background-color"]=selectStyle["background-color"];}
let optionBackgroundSet=style["background-color"]!=selectStyle["background-color"];if(style.color==style["background-color"]){style.color=selectStyle.color;}
if(customStylingEnabled){let addedRule=false;for(const property of SUPPORTED_OPTION_OPTGROUP_PROPERTIES){if(property=="direction"||property=="font-size"){continue;} 
if(!style[property]||style[property]==selectStyle[property]){continue;}
if(PROPERTIES_RESET_WHEN_ACTIVE.includes(property)){if(!addedRule){sheet.insertRule(`#ContentSelectDropdown > menupopup > :nth-child(${nthChildIndex}):not([_moz-menuactive="true"]) {
              }`,0);addedRule=true;}
sheet.cssRules[0].style[property]=style[property];}else{item.style.setProperty(property,style[property]);}}
if(addedRule){if(style["text-shadow"]!="none"&&style["text-shadow"]!=selectStyle["text-shadow"]){

sheet.insertRule(`#ContentSelectDropdown > menupopup > :nth-child(${nthChildIndex})[_moz-menuactive="true"] {
              text-shadow: none;
            }`,0);}}}
if(customStylingEnabled&&(optionBackgroundSet||selectBackgroundSet)){item.setAttribute("customoptionstyling","true");}else{item.removeAttribute("customoptionstyling");}
if(parentElement){

item.id="ContentSelectDropdownOption"+nthChildIndex;item.setAttribute("aria-level","2");ariaOwns+=item.id+" ";}
element.appendChild(item);nthChildIndex++;let isDisabled=isGroupDisabled||option.disabled;if(isDisabled){item.setAttribute("disabled","true");}
if(isOptGroup){nthChildIndex=this.populateChildren(menulist,option.children,uniqueOptionStyles,selectedIndex,zoom,selectStyle,selectBackgroundSet,sheet,item,isDisabled,false,nthChildIndex);}else{if(option.index==selectedIndex){



menulist.selectedItem=item;



menulist.activeChild=item;}
item.setAttribute("value",option.index);if(parentElement){item.classList.add("contentSelectDropdown-ingroup");}}}
if(parentElement&&ariaOwns){parentElement.setAttribute("aria-owns",ariaOwns);}

if(Services.prefs.getBoolPref("dom.forms.selectSearch")&&addSearch&&element.childElementCount>SEARCH_MINIMUM_ELEMENTS){ let searchbox=element.ownerDocument.createXULElement("search-textbox");searchbox.className="contentSelectDropdown-searchbox";searchbox.addEventListener("input",this.onSearchInput);searchbox.addEventListener("focus",this.onSearchFocus.bind(this));searchbox.addEventListener("blur",this.onSearchBlur);searchbox.addEventListener("command",this.onSearchInput); searchbox.addEventListener("keydown",event=>{this.onSearchKeydown(event,menulist);},true);element.insertBefore(searchbox,element.children[0]);}
return nthChildIndex;},onSearchKeydown(event,menulist){if(event.defaultPrevented){return;}
let searchbox=event.currentTarget;switch(event.key){case"Escape":searchbox.parentElement.hidePopup();break;case"ArrowDown":case"Enter":case"Tab":searchbox.blur();if(searchbox.nextElementSibling.localName=="menuitem"&&!searchbox.nextElementSibling.hidden){menulist.activeChild=searchbox.nextElementSibling;}else{let currentOption=searchbox.nextElementSibling;while(currentOption&&(currentOption.localName!="menuitem"||currentOption.hidden)){currentOption=currentOption.nextElementSibling;}
if(currentOption){menulist.activeChild=currentOption;}else{searchbox.focus();}}
break;default:return;}
event.preventDefault();},onSearchInput(event){let searchObj=event.currentTarget; let input=searchObj.value.toLowerCase();let menupopup=searchObj.parentElement;let menuItems=menupopup.querySelectorAll("menuitem, menucaption");let allHidden=true;
let prevCaption=null;for(let currentItem of menuItems){ if(!currentItem.hiddenByContent){
 let itemLabel=currentItem.getAttribute("label").toLowerCase();let itemTooltip=currentItem.getAttribute("title").toLowerCase(); if(!input){currentItem.hidden=false;}else if(currentItem.localName=="menucaption"){if(prevCaption!=null){prevCaption.hidden=allHidden;}
prevCaption=currentItem;allHidden=true;}else{if(!currentItem.classList.contains("contentSelectDropdown-ingroup")&&currentItem.previousElementSibling.classList.contains("contentSelectDropdown-ingroup")){if(prevCaption!=null){prevCaption.hidden=allHidden;}
prevCaption=null;allHidden=true;}
if(itemLabel.includes(input)||itemTooltip.includes(input)){currentItem.hidden=false;allHidden=false;}else{currentItem.hidden=true;}}
if(prevCaption!=null){prevCaption.hidden=allHidden;}}}},onSearchFocus(event){let menupopup=event.target.closest("menupopup");menupopup.parentElement.activeChild=null;menupopup.setAttribute("ignorekeys","true");this._actor.sendAsyncMessage("Forms:SearchFocused",{});},onSearchBlur(event){let menupopup=event.target.closest("menupopup");menupopup.setAttribute("ignorekeys","false");},};class SelectParent extends JSWindowActorParent{receiveMessage(message){switch(message.name){case"Forms:ShowDropDown":{let topBrowsingContext=this.manager.browsingContext.top;let browser=topBrowsingContext.embedderElement;if(!browser.hasAttribute("selectmenulist")){return;}
let document=browser.ownerDocument;let menulist=document.getElementById(browser.getAttribute("selectmenulist"));if(!this._menulist){
this._menulist=menulist;}
let data=message.data;menulist.menupopup.style.direction=data.style.direction;let{ZoomManager}=topBrowsingContext.topChromeWindow;SelectParentHelper.populate(menulist,data.options.options,data.options.uniqueStyles,data.selectedIndex,
ZoomManager.getFullZoomForBrowser(browser),data.defaultStyle,data.style);SelectParentHelper.open(browser,menulist,data.rect,data.isOpenedViaTouch,this);break;}
case"Forms:HideDropDown":{let topBrowsingContext=this.manager.browsingContext.top;let browser=topBrowsingContext.embedderElement;SelectParentHelper.hide(this._menulist,browser);break;}
default:SelectParentHelper.receiveMessage(message);}}}