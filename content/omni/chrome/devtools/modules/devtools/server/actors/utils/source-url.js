"use strict";function getDebuggerSourceURL(source){const introType=source.introductionType;
if(introType==="injectedScript"||introType==="eval"||introType==="debugger eval"||introType==="Function"||introType==="javascriptURL"||introType==="eventHandler"||introType==="domTimer"){return null;}
return source.url;}
exports.getDebuggerSourceURL=getDebuggerSourceURL;