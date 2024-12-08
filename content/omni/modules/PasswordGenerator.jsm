//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["PasswordGenerator"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["crypto"]);const DEFAULT_PASSWORD_LENGTH=15;const MAX_UINT8=Math.pow(2,8)-1;const MAX_UINT32=Math.pow(2,32)-1;const LOWER_CASE_ALPHA="abcdefghijkmnpqrstuvwxyz";const UPPER_CASE_ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ";const DIGITS="23456789";const ALL_CHARACTERS=LOWER_CASE_ALPHA+UPPER_CASE_ALPHA+DIGITS;const REQUIRED_CHARACTER_CLASSES=[LOWER_CASE_ALPHA,UPPER_CASE_ALPHA,DIGITS];this.PasswordGenerator={generatePassword(length=DEFAULT_PASSWORD_LENGTH){if(length<REQUIRED_CHARACTER_CLASSES.length){throw new Error("requested password length is too short");}
if(length>MAX_UINT8){throw new Error("requested password length is too long");}
let password=""; for(const charClassString of REQUIRED_CHARACTER_CLASSES){password+=charClassString[this._randomUInt8Index(charClassString.length)];}
while(password.length<length){password+=ALL_CHARACTERS[this._randomUInt8Index(ALL_CHARACTERS.length)];}

password=this._shuffleString(password);return password;},_randomUInt8Index(range){if(range>MAX_UINT8){throw new Error("`range` cannot fit into uint8");}


 
const MAX_ACCEPTABLE_VALUE=Math.floor(MAX_UINT8/range)*range-1;const randomValueArr=new Uint8Array(1);do{crypto.getRandomValues(randomValueArr);}while(randomValueArr[0]>MAX_ACCEPTABLE_VALUE);return randomValueArr[0]%range;},_shuffleString(str){let arr=Array.from(str);const randomValues=new Uint32Array(arr.length-1);crypto.getRandomValues(randomValues);
 for(let i=arr.length-1;i>0;i--){const j=Math.floor((randomValues[i-1]/MAX_UINT32)*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
return arr.join("");},};