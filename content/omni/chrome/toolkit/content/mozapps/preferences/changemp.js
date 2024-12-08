
const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const nsPK11TokenDB="@mozilla.org/security/pk11tokendb;1";const nsIPK11TokenDB=Ci.nsIPK11TokenDB;const nsIDialogParamBlock=Ci.nsIDialogParamBlock;const nsPKCS11ModuleDB="@mozilla.org/security/pkcs11moduledb;1";const nsIPKCS11ModuleDB=Ci.nsIPKCS11ModuleDB;const nsIPKCS11Slot=Ci.nsIPKCS11Slot;const nsIPK11Token=Ci.nsIPK11Token;var params;var pw1;function init(){pw1=document.getElementById("pw1");process();document.addEventListener("dialogaccept",setPassword);}
function process(){let tokenDB=Cc["@mozilla.org/security/pk11tokendb;1"].getService(Ci.nsIPK11TokenDB);let token=tokenDB.getInternalKeyToken();if(token){let oldpwbox=document.getElementById("oldpw");let msgBox=document.getElementById("message");if((token.needsLogin()&&token.needsUserInit)||!token.needsLogin()){oldpwbox.setAttribute("hidden","true");msgBox.removeAttribute("hidden");if(!token.needsLogin()){oldpwbox.setAttribute("inited","empty");}else{oldpwbox.setAttribute("inited","true");} 
document.getElementById("pw1").focus();}else{ oldpwbox.removeAttribute("hidden");msgBox.setAttribute("hidden","true");oldpwbox.setAttribute("inited","false");oldpwbox.focus();}}
if(!token.hasPassword&&!Services.policies.isAllowed("removeMasterPassword")){document.getElementById("admin").hidden=false;}
if(params){params.SetInt(1,0);}
checkPasswords();}
async function createAlert(titleL10nId,messageL10nId){const[title,message]=await document.l10n.formatValues([{id:titleL10nId},{id:messageL10nId},]);Services.prompt.alert(window,title,message);}
function setPassword(){var pk11db=Cc[nsPK11TokenDB].getService(nsIPK11TokenDB);var token=pk11db.getInternalKeyToken();var oldpwbox=document.getElementById("oldpw");var initpw=oldpwbox.getAttribute("inited");if(initpw=="false"||initpw=="empty"){try{var oldpw="";var passok=0;if(initpw=="empty"){passok=1;}else{oldpw=oldpwbox.value;passok=token.checkPassword(oldpw);}
if(passok){if(initpw=="empty"&&pw1.value==""){}else{if(pw1.value==""){var secmoddb=Cc[nsPKCS11ModuleDB].getService(nsIPKCS11ModuleDB);if(secmoddb.isFIPSEnabled){ createAlert("pw-change-failed-title","pp-change2empty-in-fips-mode");passok=0;}}
if(passok){token.changePassword(oldpw,pw1.value);if(pw1.value==""){createAlert("pw-change-success-title","pp-erased-ok");}else{createAlert("pw-change-success-title","pp-change-ok");}}}}else{oldpwbox.focus();oldpwbox.setAttribute("value","");createAlert("pw-change-failed-title","incorrect-pp");}}catch(e){Cu.reportError(e);createAlert("pw-change-failed-title","failed-pp-change");}}else{token.initPassword(pw1.value);if(pw1.value==""){createAlert("pw-change-success-title","pp-not-wanted");}}}
function setPasswordStrength(){



 var pw=document.getElementById("pw1").value; var pwlength=pw.length;if(pwlength>5){pwlength=5;} 
var numnumeric=pw.replace(/[0-9]/g,"");var numeric=pw.length-numnumeric.length;if(numeric>3){numeric=3;} 
var symbols=pw.replace(/\W/g,"");var numsymbols=pw.length-symbols.length;if(numsymbols>3){numsymbols=3;} 
var numupper=pw.replace(/[A-Z]/g,"");var upper=pw.length-numupper.length;if(upper>3){upper=3;}
var pwstrength=pwlength*10-20+numeric*10+numsymbols*15+upper*10; if(pwstrength<0){pwstrength=0;}
if(pwstrength>100){pwstrength=100;}
var mymeter=document.getElementById("pwmeter");mymeter.value=pwstrength;}
function checkPasswords(){var pw1=document.getElementById("pw1").value;var pw2=document.getElementById("pw2").value;var ok=document.getElementById("changemp").getButton("accept");var oldpwbox=document.getElementById("oldpw");if(oldpwbox){var initpw=oldpwbox.getAttribute("inited");if(initpw=="empty"&&pw1==""){
ok.setAttribute("disabled","true");return;}}
if(pw1==pw2&&(pw1!=""||Services.policies.isAllowed("removeMasterPassword"))){ok.setAttribute("disabled","false");}else{ok.setAttribute("disabled","true");}}