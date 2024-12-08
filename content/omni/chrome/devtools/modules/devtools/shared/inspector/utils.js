"use strict";function truncateString(str,maxLength){if(!str||str.length<=maxLength){return str;}
return(str.substring(0,Math.ceil(maxLength/2))+"…"+
str.substring(str.length-Math.floor(maxLength/2)));}
exports.truncateString=truncateString;