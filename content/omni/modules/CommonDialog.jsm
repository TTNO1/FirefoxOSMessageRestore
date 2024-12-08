//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["CommonDialog"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"EnableDelayHelper","resource://gre/modules/SharedPromptUtils.jsm");function CommonDialog(args,ui){this.args=args;this.ui=ui;}
CommonDialog.prototype={args:null,ui:null,hasInputField:true,numButtons:undefined,iconClass:undefined,soundID:undefined,focusTimer:null,async onLoad(commonDialogEl=null){switch(this.args.promptType){case"alert":case"alertCheck":this.hasInputField=false;this.numButtons=1;this.iconClass=["alert-icon"];this.soundID=Ci.nsISound.EVENT_ALERT_DIALOG_OPEN;break;case"confirmCheck":case"confirm":this.hasInputField=false;this.numButtons=2;this.iconClass=["question-icon"];this.soundID=Ci.nsISound.EVENT_CONFIRM_DIALOG_OPEN;break;case"confirmEx":var numButtons=0;if(this.args.button0Label){numButtons++;}
if(this.args.button1Label){numButtons++;}
if(this.args.button2Label){numButtons++;}
if(this.args.button3Label){numButtons++;}
if(numButtons==0){throw new Error("A dialog with no buttons? Can not haz.");}
this.numButtons=numButtons;this.hasInputField=false;this.iconClass=["question-icon"];this.soundID=Ci.nsISound.EVENT_CONFIRM_DIALOG_OPEN;break;case"prompt":this.numButtons=2;this.iconClass=["question-icon"];this.soundID=Ci.nsISound.EVENT_PROMPT_DIALOG_OPEN;this.initTextbox("login",this.args.value);this.ui.loginLabel.setAttribute("value","");break;case"promptUserAndPass":this.numButtons=2;this.iconClass=["authentication-icon","question-icon"];this.soundID=Ci.nsISound.EVENT_PROMPT_DIALOG_OPEN;this.initTextbox("login",this.args.user);this.initTextbox("password1",this.args.pass);break;case"promptPassword":this.numButtons=2;this.iconClass=["authentication-icon","question-icon"];this.soundID=Ci.nsISound.EVENT_PROMPT_DIALOG_OPEN;this.initTextbox("password1",this.args.pass);this.ui.password1Label.setAttribute("value","");break;default:Cu.reportError("commonDialog opened for unknown type: "+this.args.promptType);throw new Error("unknown dialog type");}
if(commonDialogEl){commonDialogEl.setAttribute("windowtype","prompt:"+this.args.promptType);} 
let title=this.args.title;let infoTitle=this.ui.infoTitle;infoTitle.appendChild(infoTitle.ownerDocument.createTextNode(title));if(commonDialogEl){commonDialogEl.ownerDocument.title=title;}



switch(this.numButtons){case 4:this.setLabelForNode(this.ui.button3,this.args.button3Label);this.ui.button3.hidden=false; case 3:this.setLabelForNode(this.ui.button2,this.args.button2Label);this.ui.button2.hidden=false; case 2: if(this.args.button1Label){this.setLabelForNode(this.ui.button1,this.args.button1Label);}
break;case 1:this.ui.button1.hidden=true;break;} 
if(this.args.button0Label){this.setLabelForNode(this.ui.button0,this.args.button0Label);} 
let croppedMessage="";if(this.args.text){croppedMessage=this.args.text.substr(0,10000);}
let infoBody=this.ui.infoBody;infoBody.appendChild(infoBody.ownerDocument.createTextNode(croppedMessage));let label=this.args.checkLabel;if(label){this.ui.checkboxContainer.hidden=false;this.ui.checkboxContainer.clientTop; this.setLabelForNode(this.ui.checkbox,label);this.ui.checkbox.checked=this.args.checked;} 
let icon=this.ui.infoIcon;if(icon){this.iconClass.forEach((el,idx,arr)=>icon.classList.add(el));} 
this.args.ok=false;this.args.buttonNumClicked=1; let b=this.args.defaultButtonNum||0;let button=this.ui["button"+b];if(commonDialogEl){commonDialogEl.defaultButton=["accept","cancel","extra1","extra2"][b];}else{button.setAttribute("default","true");}
let focusReady;if(!this.ui.promptContainer||!this.ui.promptContainer.hidden){if(commonDialogEl&&this.ui.prompt.docShell.chromeEventHandler){
focusReady=new Promise(resolve=>this.ui.prompt.addEventListener("load",resolve,{once:true})).then(()=>{this.setDefaultFocus(true);});}else{this.setDefaultFocus(true);}}
if(this.args.enableDelay){this.delayHelper=new EnableDelayHelper({disableDialog:()=>this.setButtonsEnabledState(false),enableDialog:()=>this.setButtonsEnabledState(true),focusTarget:this.ui.focusTarget,});}

try{if(commonDialogEl&&this.soundID){Cc["@mozilla.org/sound;1"].createInstance(Ci.nsISound).playEventSound(this.soundID);}}catch(e){Cu.reportError("Couldn't play common dialog event sound: "+e);}
if(commonDialogEl){
await focusReady;Services.obs.notifyObservers(this.ui.prompt,"common-dialog-loaded");}else{Services.obs.notifyObservers(this.ui.promptContainer,"tabmodal-dialog-loaded");}},setLabelForNode(aNode,aLabel){


var accessKey=null;if(/ *\(\&([^&])\)(:?)$/.test(aLabel)){aLabel=RegExp.leftContext+RegExp.$2;accessKey=RegExp.$1;}else if(/^([^&]*)\&(([^&]).*$)/.test(aLabel)){aLabel=RegExp.$1+RegExp.$2;accessKey=RegExp.$3;}
aLabel=aLabel.replace(/\&\&/g,"&");aNode.label=aLabel;
if(accessKey){aNode.accessKey=accessKey;}},initTextbox(aName,aValue){this.ui[aName+"Container"].hidden=false;this.ui[aName+"Textbox"].setAttribute("value",aValue!==null?aValue:"");},setButtonsEnabledState(enabled){this.ui.button0.disabled=!enabled;this.ui.button2.disabled=!enabled;this.ui.button3.disabled=!enabled;},setDefaultFocus(isInitialLoad){let b=this.args.defaultButtonNum||0;let button=this.ui["button"+b];if(!this.hasInputField){let isOSX="nsILocalFileMac"in Ci;if(isOSX){this.ui.infoBody.focus();}else{button.focus();}}else if(this.args.promptType=="promptPassword"){
if(isInitialLoad){this.ui.password1Textbox.select();}else{this.ui.password1Textbox.focus();}}else if(isInitialLoad){this.ui.loginTextbox.select();}else{this.ui.loginTextbox.focus();}},onCheckbox(){this.args.checked=this.ui.checkbox.checked;},onButton0(){this.args.promptActive=false;this.args.ok=true;this.args.buttonNumClicked=0;let username=this.ui.loginTextbox.value;let password=this.ui.password1Textbox.value; switch(this.args.promptType){case"prompt":this.args.value=username;break;case"promptUserAndPass":this.args.user=username;this.args.pass=password;break;case"promptPassword":this.args.pass=password;break;}},onButton1(){this.args.promptActive=false;this.args.buttonNumClicked=1;},onButton2(){this.args.promptActive=false;this.args.buttonNumClicked=2;},onButton3(){this.args.promptActive=false;this.args.buttonNumClicked=3;},abortPrompt(){this.args.promptActive=false;this.args.promptAborted=true;},};