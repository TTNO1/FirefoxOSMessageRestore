"use strict";var EXPORTED_SYMBOLS=["TabModalPrompt"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");var TabModalPrompt=class{constructor(win){this.win=win;let newPrompt=(this.element=win.document.createElement("tabmodalprompt"));newPrompt.setAttribute("role","dialog");let randomIdSuffix=Math.random().toString(32).substr(2);newPrompt.setAttribute("aria-describedby",`infoBody-${randomIdSuffix}`);newPrompt.appendChild(win.MozXULElement.parseXULToFragment(`
        <div class="tabmodalprompt-mainContainer" xmlns="http://www.w3.org/1999/xhtml" xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
          <div class="tabmodalprompt-topContainer">
            <div class="tabmodalprompt-infoContainer">
              <div class="tabmodalprompt-infoTitle infoTitle" hidden="hidden"/>
              <div class="tabmodalprompt-infoBody infoBody" id="infoBody-${randomIdSuffix}" tabindex="-1"/>
            </div>

            <div class="tabmodalprompt-loginContainer" hidden="hidden">
              <xul:label class="tabmodalprompt-loginLabel" value="&editfield0.label;" control="loginTextbox-${randomIdSuffix}"/>
              <input class="tabmodalprompt-loginTextbox" id="loginTextbox-${randomIdSuffix}"/>
            </div>

            <div class="tabmodalprompt-password1Container" hidden="hidden">
              <xul:label class="tabmodalprompt-password1Label" value="&editfield1.label;" control="password1Textbox-${randomIdSuffix}"/>
              <input class="tabmodalprompt-password1Textbox" type="password" id="password1Textbox-${randomIdSuffix}"/>
            </div>

            <div class="tabmodalprompt-checkboxContainer" hidden="hidden">
              <div/>
              <xul:checkbox class="tabmodalprompt-checkbox"/>
            </div>

            <!-- content goes here -->
          </div>
          <div class="tabmodalprompt-buttonContainer">
            <xul:button class="tabmodalprompt-button3" hidden="true"/>
            <div class="tabmodalprompt-buttonSpacer"/>
            <xul:button class="tabmodalprompt-button0" label="&okButton.label;"/>
            <xul:button class="tabmodalprompt-button2" hidden="true"/>
            <xul:button class="tabmodalprompt-button1" label="&cancelButton.label;"/>
          </div>
        </div>`,["chrome://global/locale/commonDialog.dtd","chrome://global/locale/dialogOverlay.dtd",]));this.ui={prompt:this,promptContainer:this.element,mainContainer:newPrompt.querySelector(".tabmodalprompt-mainContainer"),loginContainer:newPrompt.querySelector(".tabmodalprompt-loginContainer"),loginTextbox:newPrompt.querySelector(".tabmodalprompt-loginTextbox"),loginLabel:newPrompt.querySelector(".tabmodalprompt-loginLabel"),password1Container:newPrompt.querySelector(".tabmodalprompt-password1Container"),password1Textbox:newPrompt.querySelector(".tabmodalprompt-password1Textbox"),password1Label:newPrompt.querySelector(".tabmodalprompt-password1Label"),infoContainer:newPrompt.querySelector(".tabmodalprompt-infoContainer"),infoBody:newPrompt.querySelector(".tabmodalprompt-infoBody"),infoTitle:newPrompt.querySelector(".tabmodalprompt-infoTitle"),infoIcon:null,rows:newPrompt.querySelector(".tabmodalprompt-topContainer"),checkbox:newPrompt.querySelector(".tabmodalprompt-checkbox"),checkboxContainer:newPrompt.querySelector(".tabmodalprompt-checkboxContainer"),button3:newPrompt.querySelector(".tabmodalprompt-button3"),button2:newPrompt.querySelector(".tabmodalprompt-button2"),button1:newPrompt.querySelector(".tabmodalprompt-button1"),button0:newPrompt.querySelector(".tabmodalprompt-button0"),};if(AppConstants.XP_UNIX){ let buttonContainer=newPrompt.querySelector(".tabmodalprompt-buttonContainer");buttonContainer.appendChild(this.ui.button3);buttonContainer.appendChild(this.ui.button2);buttonContainer.appendChild(newPrompt.querySelector(".tabmodalprompt-buttonSpacer"));buttonContainer.appendChild(this.ui.button1);buttonContainer.appendChild(this.ui.button0);}
this.ui.button0.addEventListener("command",this.onButtonClick.bind(this,0));this.ui.button1.addEventListener("command",this.onButtonClick.bind(this,1));this.ui.button2.addEventListener("command",this.onButtonClick.bind(this,2));this.ui.button3.addEventListener("command",this.onButtonClick.bind(this,3));this.ui.checkbox.addEventListener("command",()=>{this.Dialog.onCheckbox();});this.element.addEventListener("keypress",event=>{switch(event.keyCode){case KeyEvent.DOM_VK_RETURN:this.onKeyAction("default",event);break;case KeyEvent.DOM_VK_ESCAPE:this.onKeyAction("cancel",event);break;default:if(AppConstants.platform=="macosx"&&event.key=="."&&event.metaKey){this.onKeyAction("cancel",event);}
break;}},{mozSystemGroup:true});this.element.addEventListener("focus",event=>{let bnum=this.args.defaultButtonNum||0;let defaultButton=this.ui["button"+bnum];if(AppConstants.platform=="macosx"){
defaultButton.setAttribute("default","true");}else{


let focusedDefault=event.originalTarget==defaultButton;let someButtonFocused=event.originalTarget.localName=="button"||event.originalTarget.localName=="toolbarbutton";if(focusedDefault||!someButtonFocused){defaultButton.setAttribute("default","true");}}},true);this.element.addEventListener("blur",()=>{
let bnum=this.args.defaultButtonNum||0;let button=this.ui["button"+bnum];button.removeAttribute("default");});}
init(args,linkedTab,onCloseCallback){this.args=args;this.linkedTab=linkedTab;this.onCloseCallback=onCloseCallback;if(args.enableDelay){throw new Error("BUTTON_DELAY_ENABLE not yet supported for tab-modal prompts");}
if(args.modalType===Ci.nsIPrompt.MODAL_TYPE_TAB){this.element.classList.add("tab-prompt");}else{this.element.classList.add("content-prompt");}

this.win.addEventListener("resize",this);this.win.addEventListener("unload",this);if(linkedTab){linkedTab.addEventListener("TabClose",this);}

let tmp={};ChromeUtils.import("resource://gre/modules/CommonDialog.jsm",tmp);this.Dialog=new tmp.CommonDialog(args,this.ui);this.Dialog.onLoad(null);
if(args.modalType==Ci.nsIPrompt.MODAL_TYPE_CONTENT&&args.showCallerOrigin){this.ui.infoTitle.removeAttribute("hidden");}
}
shutdownPrompt(){ try{this.win.removeEventListener("resize",this);this.win.removeEventListener("unload",this);if(this.linkedTab){this.linkedTab.removeEventListener("TabClose",this);}}catch(e){} 
this.onCloseCallback();this.win=null;this.ui=null;
}
abortPrompt(){this.Dialog.abortPrompt();this.shutdownPrompt();}
handleEvent(aEvent){switch(aEvent.type){case"unload":case"TabClose":this.abortPrompt();break;}}
onButtonClick(buttonNum){








Services.tm.dispatchToMainThread(()=>{this.Dialog["onButton"+buttonNum]();this.shutdownPrompt();});}
onKeyAction(action,event){if(event.defaultPrevented){return;}
event.stopPropagation();if(action=="default"){let bnum=this.args.defaultButtonNum||0;this.onButtonClick(bnum);}else{this.onButtonClick(1);}}};