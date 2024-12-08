//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
function match(str,regex,flags,doc){var docFrag=doc.createDocumentFragment();var re=new RegExp(regex,flags);var matches=str.match(re);if(matches!=null){for(var i=0;i<matches.length;++i){var match=matches[i];var elem=doc.createElementNS(null,"match");var text=doc.createTextNode(match?match:"");elem.appendChild(text);docFrag.appendChild(elem);}}
return docFrag;}
function replace(str,regex,flags,replace){var re=new RegExp(regex,flags);return str.replace(re,replace);}
function test(str,regex,flags){var re=new RegExp(regex,flags);return re.test(str);}
var EXPORTED_SYMBOLS=["match","replace","test"];