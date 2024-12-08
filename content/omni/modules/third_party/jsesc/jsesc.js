var EXPORTED_SYMBOLS=["jsesc"];;(function(root){var freeExports=typeof exports=='object'&&exports;var freeModule=typeof module=='object'&&module&&module.exports==freeExports&&module;var freeGlobal=typeof global=='object'&&global;if(freeGlobal.global===freeGlobal||freeGlobal.window===freeGlobal){root=freeGlobal;}
var object={};var hasOwnProperty=object.hasOwnProperty;var forOwn=function(object,callback){var key;for(key in object){if(hasOwnProperty.call(object,key)){callback(key,object[key]);}}};var extend=function(destination,source){if(!source){return destination;}
forOwn(source,function(key,value){destination[key]=value;});return destination;};var forEach=function(array,callback){var length=array.length;var index=-1;while(++index<length){callback(array[index]);}};var toString=object.toString;var isArray=function(value){return toString.call(value)=='[object Array]';};var isObject=function(value){return toString.call(value)=='[object Object]';};var isString=function(value){return typeof value=='string'||toString.call(value)=='[object String]';};var isFunction=function(value){
return typeof value=='function'||toString.call(value)=='[object Function]';}; var singleEscapes={'"':'\\"','\'':'\\\'','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t'
};var regexSingleEscape=/["'\\\b\f\n\r\t]/;var regexDigit=/[0-9]/;var regexWhitelist=/[ !#-&\(-\[\]-~]/;var jsesc=function(argument,options){ var defaults={'escapeEverything':false,'quotes':'single','wrap':false,'es6':false,'json':false,'compact':true,'lowercaseHex':false,'indent':'\t','__indent__':''};var json=options&&options.json;if(json){defaults.quotes='double';defaults.wrap=true;}
options=extend(defaults,options);if(options.quotes!='single'&&options.quotes!='double'){options.quotes='single';}
var quote=options.quotes=='double'?'"':'\'';var compact=options.compact;var indent=options.indent;var oldIndent;var newLine=compact?'':'\n';var result;var isEmpty=true;if(json&&argument&&isFunction(argument.toJSON)){argument=argument.toJSON();}
if(!isString(argument)){if(isArray(argument)){result=[];options.wrap=true;oldIndent=options.__indent__;indent+=oldIndent;options.__indent__=indent;forEach(argument,function(value){isEmpty=false;result.push((compact?'':indent)+
jsesc(value,options));});if(isEmpty){return'[]';}
return'['+newLine+result.join(','+newLine)+newLine+
(compact?'':oldIndent)+']';}else if(!isObject(argument)){if(json){
return JSON.stringify(argument)||'null';}
return String(argument);}else{ result=[];options.wrap=true;oldIndent=options.__indent__;indent+=oldIndent;options.__indent__=indent;forOwn(argument,function(key,value){isEmpty=false;result.push((compact?'':indent)+
jsesc(key,options)+':'+
(compact?'':' ')+
jsesc(value,options));});if(isEmpty){return'{}';}
return'{'+newLine+result.join(','+newLine)+newLine+
(compact?'':oldIndent)+'}';}}
var string=argument; var index=-1;var length=string.length;var first;var second;var codePoint;result='';while(++index<length){var character=string.charAt(index);if(options.es6){first=string.charCodeAt(index);if( first>=0xD800&&first<=0xDBFF&& length>index+1
){second=string.charCodeAt(index+1);if(second>=0xDC00&&second<=0xDFFF){
 codePoint=(first-0xD800)*0x400+second-0xDC00+0x10000;var hexadecimal=codePoint.toString(16);if(!options.lowercaseHex){hexadecimal=hexadecimal.toUpperCase();}
result+='\\u{'+hexadecimal+'}';index++;continue;}}}
if(!options.escapeEverything){if(regexWhitelist.test(character)){result+=character;continue;}
if(character=='"'){result+=quote==character?'\\"':character;continue;}
if(character=='\''){result+=quote==character?'\\\'':character;continue;}}
if(character=='\0'&&!json&&!regexDigit.test(string.charAt(index+1))){result+='\\0';continue;}
if(regexSingleEscape.test(character)){ result+=singleEscapes[character];continue;}
var charCode=character.charCodeAt(0);var hexadecimal=charCode.toString(16);if(!options.lowercaseHex){hexadecimal=hexadecimal.toUpperCase();}
var longhand=hexadecimal.length>2||json;var escaped='\\'+(longhand?'u':'x')+
('0000'+hexadecimal).slice(longhand?-4:-2);result+=escaped;continue;}
if(options.wrap){result=quote+result+quote;}
return result;};jsesc.version='1.0.0';
if(typeof define=='function'&&typeof define.amd=='object'&&define.amd){define(function(){return jsesc;});}else if(freeExports&&!freeExports.nodeType){if(freeModule){freeModule.exports=jsesc;}else{freeExports.jsesc=jsesc;}}else{ root.jsesc=jsesc;}}(this));