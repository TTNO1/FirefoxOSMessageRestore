"use strict";
{const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");class MozDialog extends MozXULElement{constructor(){super();this.attachShadow({mode:"open"});document.addEventListener("keypress",event=>{if(event.keyCode==KeyEvent.DOM_VK_RETURN){this._hitEnter(event);}else if(event.keyCode==KeyEvent.DOM_VK_ESCAPE&&!event.defaultPrevented){this.cancelDialog();}},{mozSystemGroup:true});if(AppConstants.platform=="macosx"){document.addEventListener("keypress",event=>{if(event.key=="."&&event.metaKey){this.cancelDialog();}},true);}else{this.addEventListener("focus",this,true);this.shadowRoot.addEventListener("focus",this,true);} 
window.addEventListener("close",event=>{if(!this.cancelDialog()){event.preventDefault();}}); window.addEventListener("load",event=>this.postLoadInit(event));}
static get observedAttributes(){return super.observedAttributes.concat("subdialog");}
attributeChangedCallback(name,oldValue,newValue){if(name=="subdialog"){console.assert(newValue,`Turning off subdialog style is not supported`);if(this.isConnectedAndReady&&!oldValue&&newValue){this.shadowRoot.appendChild(MozXULElement.parseXULToFragment(this.inContentStyle));}
return;}
super.attributeChangedCallback(name,oldValue,newValue);}
static get inheritedAttributes(){return{".dialog-button-box":"pack=buttonpack,align=buttonalign,dir=buttondir,orient=buttonorient","[dlgtype='accept']":"disabled=buttondisabledaccept",};}
get inContentStyle(){return`
      <html:link rel="stylesheet" href="chrome://global/skin/in-content/common.css" />
    `;}
get _markup(){let buttons=AppConstants.XP_UNIX?`
      <hbox class="dialog-button-box">
        <button dlgtype="disclosure" hidden="true"/>
        <button dlgtype="help" hidden="true"/>
        <button dlgtype="extra2" hidden="true"/>
        <button dlgtype="extra1" hidden="true"/>
        <spacer class="button-spacer" part="button-spacer" flex="1"/>
        <button dlgtype="cancel"/>
        <button dlgtype="accept"/>
      </hbox>`:`
      <hbox class="dialog-button-box" pack="end">
        <button dlgtype="extra2" hidden="true"/>
        <spacer class="button-spacer" part="button-spacer" flex="1" hidden="true"/>
        <button dlgtype="accept"/>
        <button dlgtype="extra1" hidden="true"/>
        <button dlgtype="cancel"/>
        <button dlgtype="help" hidden="true"/>
        <button dlgtype="disclosure" hidden="true"/>
      </hbox>`;let key=AppConstants.platform=="macosx"?`<key phase="capturing"
            oncommand="document.querySelector('dialog').openHelp(event)"
            key="&openHelpMac.commandkey;" modifiers="accel"/>`:`<key phase="capturing"
            oncommand="document.querySelector('dialog').openHelp(event)"
            keycode="&openHelp.commandkey;"/>`;return`
      <html:link rel="stylesheet" href="chrome://global/skin/button.css"/>
      <html:link rel="stylesheet" href="chrome://global/skin/dialog.css"/>
      ${this.hasAttribute("subdialog") ? this.inContentStyle : ""}
      <vbox class="box-inherit dialog-content-box" part="content-box" flex="1">
        <html:slot></html:slot>
      </vbox>
      ${buttons}
      <keyset>${key}</keyset>`;}
connectedCallback(){if(this.delayConnectedCallback()){return;}
document.documentElement.setAttribute("role","dialog");this.shadowRoot.textContent="";this.shadowRoot.appendChild(MozXULElement.parseXULToFragment(this._markup,["chrome://global/locale/globalKeys.dtd",]));this.initializeAttributeInheritance();this._l10nButtons=[];this._configureButtons(this.buttons);window.moveToAlertPosition=this.moveToAlertPosition;window.centerWindowOnScreen=this.centerWindowOnScreen;}
set buttons(val){this._configureButtons(val);return val;}
get buttons(){return this.getAttribute("buttons");}
set defaultButton(val){this._setDefaultButton(val);return val;}
get defaultButton(){if(this.hasAttribute("defaultButton")){return this.getAttribute("defaultButton");}
return"accept";}
get _strBundle(){if(!this.__stringBundle){this.__stringBundle=Services.strings.createBundle("chrome://global/locale/dialog.properties");}
return this.__stringBundle;}
acceptDialog(){return this._doButtonCommand("accept");}
cancelDialog(){return this._doButtonCommand("cancel");}
getButton(aDlgType){return this._buttons[aDlgType];}
get buttonBox(){return this.shadowRoot.querySelector(".dialog-button-box");}
moveToAlertPosition(){ if(window.outerWidth==1){dump("Trying to position a sizeless window; caller should have called sizeToContent() or sizeTo(). See bug 75649.\n");sizeToContent();}
if(opener){var xOffset=(opener.outerWidth-window.outerWidth)/2;var yOffset=opener.outerHeight/5;var newX=opener.screenX+xOffset;var newY=opener.screenY+yOffset;}else{newX=(screen.availWidth-window.outerWidth)/2;newY=(screen.availHeight-window.outerHeight)/2;}
if(newX<screen.availLeft){newX=screen.availLeft+20;}
if(newX+window.outerWidth>screen.availLeft+screen.availWidth){newX=screen.availLeft+screen.availWidth-window.outerWidth-20;}
if(newY<screen.availTop){newY=screen.availTop+20;}
if(newY+window.outerHeight>screen.availTop+screen.availHeight){newY=screen.availTop+screen.availHeight-window.outerHeight-60;}
window.moveTo(newX,newY);}
centerWindowOnScreen(){var xOffset=screen.availWidth/2-window.outerWidth/2;var yOffset=screen.availHeight/2-window.outerHeight/2;xOffset=xOffset>0?xOffset:0;yOffset=yOffset>0?yOffset:0;window.moveTo(xOffset,yOffset);}
postLoadInit(aEvent){let focusInit=()=>{const defaultButton=this.getButton(this.defaultButton); let focusedElt=document.commandDispatcher.focusedElement;if(!focusedElt){document.commandDispatcher.advanceFocusIntoSubtree(this);focusedElt=document.commandDispatcher.focusedElement;if(focusedElt){var initialFocusedElt=focusedElt;while(focusedElt.localName=="tab"||focusedElt.getAttribute("noinitialfocus")=="true"){document.commandDispatcher.advanceFocusIntoSubtree(focusedElt);focusedElt=document.commandDispatcher.focusedElement;if(focusedElt){if(focusedElt==initialFocusedElt){if(focusedElt.getAttribute("noinitialfocus")=="true"){focusedElt.blur();}
break;}}}
if(initialFocusedElt.localName=="tab"){if(focusedElt.hasAttribute("dlgtype")){ initialFocusedElt.focus();}}else if(AppConstants.platform!="macosx"&&focusedElt.hasAttribute("dlgtype")&&focusedElt!=defaultButton){defaultButton.focus();}}}
try{if(defaultButton){window.notifyDefaultButtonLoaded(defaultButton);}}catch(e){}};setTimeout(focusInit,0);if(this._l10nButtons.length){document.l10n.translateElements(this._l10nButtons).then(()=>{window.sizeToContent();});}}
openHelp(event){var helpButton=this.getButton("help");if(helpButton.disabled||helpButton.hidden){return;}
this._fireButtonEvent("help");event.stopPropagation();event.preventDefault();}
_configureButtons(aButtons){ var buttons={};this._buttons=buttons;for(let type of["accept","cancel","extra1","extra2","help","disclosure",]){buttons[type]=this.shadowRoot.querySelector(`[dlgtype="${type}"]`);} 
var exBtns=this.getElementsByAttribute("dlgtype","*");var dlgtype;for(let i=0;i<exBtns.length;++i){dlgtype=exBtns[i].getAttribute("dlgtype");buttons[dlgtype].hidden=true; buttons[dlgtype]=exBtns[i];} 
for(dlgtype in buttons){var button=buttons[dlgtype];button.addEventListener("command",this._handleButtonCommand.bind(this),true); if(!button.hasAttribute("label")){ if(this.hasAttribute("buttonlabel"+dlgtype)){button.setAttribute("label",this.getAttribute("buttonlabel"+dlgtype));if(this.hasAttribute("buttonaccesskey"+dlgtype)){button.setAttribute("accesskey",this.getAttribute("buttonaccesskey"+dlgtype));}}else if(this.hasAttribute("buttonid"+dlgtype)){document.l10n.setAttributes(button,this.getAttribute("buttonid"+dlgtype));this._l10nButtons.push(button);}else if(dlgtype!="extra1"&&dlgtype!="extra2"){button.setAttribute("label",this._strBundle.GetStringFromName("button-"+dlgtype));var accessKey=this._strBundle.GetStringFromName("accesskey-"+dlgtype);if(accessKey){button.setAttribute("accesskey",accessKey);}}}}
 
this.defaultButton=this.defaultButton; if(aButtons){ var list=aButtons.split(","); var shown={accept:false,cancel:false,help:false,disclosure:false,extra1:false,extra2:false,};for(let i=0;i<list.length;++i){shown[list[i].replace(/ /g,"")]=true;} 
for(dlgtype in buttons){buttons[dlgtype].hidden=!shown[dlgtype];} 
if(AppConstants.platform=="win"){let spacer=this.shadowRoot.querySelector(".button-spacer");spacer.removeAttribute("hidden");spacer.setAttribute("flex",shown.extra2?"1":"0");}}}
_setDefaultButton(aNewDefault){ var oldDefaultButton=this.getButton(this.defaultButton);if(oldDefaultButton){oldDefaultButton.removeAttribute("default");}
var newDefaultButton=this.getButton(aNewDefault);if(newDefaultButton){this.setAttribute("defaultButton",aNewDefault);newDefaultButton.setAttribute("default","true");}else{this.setAttribute("defaultButton","none");if(aNewDefault!="none"){dump("invalid new default button: "+aNewDefault+", assuming: none\n");}}}
_handleButtonCommand(aEvent){return this._doButtonCommand(aEvent.target.getAttribute("dlgtype"));}
_doButtonCommand(aDlgType){var button=this.getButton(aDlgType);if(!button.disabled){var noCancel=this._fireButtonEvent(aDlgType);if(noCancel){if(aDlgType=="accept"||aDlgType=="cancel"){var closingEvent=new CustomEvent("dialogclosing",{bubbles:true,detail:{button:aDlgType},});this.dispatchEvent(closingEvent);window.close();}}
return noCancel;}
return true;}
_fireButtonEvent(aDlgType){var event=document.createEvent("Events");event.initEvent("dialog"+aDlgType,true,true); return this.dispatchEvent(event);}
_hitEnter(evt){if(evt.defaultPrevented){return;}
var btn=this.getButton(this.defaultButton);if(btn){this._doButtonCommand(this.defaultButton);}}
on_focus(event){let btn=this.getButton(this.defaultButton);if(btn){btn.setAttribute("default",event.originalTarget==btn||!(event.originalTarget.localName=="button"||event.originalTarget.localName=="toolbarbutton"));}}}
customElements.define("dialog",MozDialog);}