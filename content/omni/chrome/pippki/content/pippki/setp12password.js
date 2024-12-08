"use strict";function onLoad(){document.getElementById("pw1").focus();document.addEventListener("dialogaccept",onDialogAccept);document.addEventListener("dialogcancel",onDialogCancel);}
function onDialogAccept(){let password=document.getElementById("pw1").value;let retVals=window.arguments[0].QueryInterface(Ci.nsIWritablePropertyBag2);retVals.setPropertyAsBool("confirmedPassword",true);retVals.setPropertyAsAString("password",password);}
function onDialogCancel(){let retVals=window.arguments[0].QueryInterface(Ci.nsIWritablePropertyBag2);retVals.setPropertyAsBool("confirmedPassword",false);}
function getPasswordStrength(password){let lengthStrength=password.length;if(lengthStrength>5){lengthStrength=5;}
let nonNumericChars=password.replace(/[0-9]/g,"");let numericStrength=password.length-nonNumericChars.length;if(numericStrength>3){numericStrength=3;}
let nonSymbolChars=password.replace(/\W/g,"");let symbolStrength=password.length-nonSymbolChars.length;if(symbolStrength>3){symbolStrength=3;}
let nonUpperAlphaChars=password.replace(/[A-Z]/g,"");let upperAlphaStrength=password.length-nonUpperAlphaChars.length;if(upperAlphaStrength>3){upperAlphaStrength=3;}
let strength=lengthStrength*10-
20+
numericStrength*10+
symbolStrength*15+
upperAlphaStrength*10;if(strength<0){strength=0;}
if(strength>100){strength=100;}
return strength;}
function onPasswordInput(recalculatePasswordStrength){let pw1=document.getElementById("pw1").value;if(recalculatePasswordStrength){document.getElementById("pwmeter").value=getPasswordStrength(pw1);}

let pw2=document.getElementById("pw2").value;document.getElementById("setp12password").getButton("accept").disabled=pw1!=pw2;}