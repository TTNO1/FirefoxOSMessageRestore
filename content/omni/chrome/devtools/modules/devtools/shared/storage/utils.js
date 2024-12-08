"use strict";loader.lazyRequireGetter(this,"validator","devtools/shared/storage/vendor/stringvalidator/validator");loader.lazyRequireGetter(this,"JSON5","devtools/shared/storage/vendor/json5");const MATH_REGEX=/(?:(?:^|[-+_*/])(?:\s*-?\d+(\.\d+)?(?:[eE][+-]?\d+)?\s*))+$/;function _extractKeyValPairs(value){const makeObject=(keySep,pairSep)=>{const object={};for(const pair of value.split(pairSep)){const[key,val]=pair.split(keySep);object[key]=val;}
return object;};const separators=["=",":","~","#","&","\\*",",","\\."]; for(let i=0;i<separators.length;i++){const kv=separators[i];for(let j=0;j<separators.length;j++){if(i==j){continue;}
const p=separators[j];const word=`[^${kv}${p}]*`;const keyValue=`${word}${kv}${word}`;const keyValueList=`${keyValue}(${p}${keyValue})*`;const regex=new RegExp(`^${keyValueList}$`);if(value.match&&value.match(regex)&&value.includes(kv)&&(value.includes(p)||value.split(kv).length==2)){return makeObject(kv,p);}}} 
for(const p of separators){const word=`[^${p}]*`;const wordList=`(${word}${p})+${word}`;const regex=new RegExp(`^${wordList}$`);if(regex.test(value)){const pNoBackslash=p.replace(/\\*/g,"");return value.split(pNoBackslash);}}
return null;}
function _shouldParse(value){const validators=["isBase64","isBoolean","isCurrency","isDataURI","isEmail","isFQDN","isHexColor","isIP","isISO8601","isMACAddress","isSemVer","isURL",];if(MATH_REGEX.test(value)){return false;}
for(const test of validators){if(validator[test](value)){return false;}}
return true;}
function parseItemValue(originalValue){ let decodedValue="";try{decodedValue=decodeURIComponent(originalValue);}catch(e){}
const value=decodedValue&&decodedValue!==originalValue?decodedValue:originalValue;if(!_shouldParse(value)){return value;}
let obj=null;try{obj=JSON5.parse(value);}catch(ex){obj=null;}
if(!obj&&value){obj=_extractKeyValPairs(value);}
if(!obj||obj===value||typeof obj==="string"){return value;} 
return obj;}
exports.parseItemValue=parseItemValue;