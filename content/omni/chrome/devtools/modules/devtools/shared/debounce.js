"use strict";exports.debounce=function(func,wait,scope){let timer=null;function clearTimer(resetTimer=false){if(timer){clearTimeout(timer);}
if(resetTimer){timer=null;}}
const debouncedFunction=function(){clearTimer();const args=arguments;timer=setTimeout(function(){timer=null;func.apply(scope,args);},wait);};debouncedFunction.cancel=clearTimer.bind(null,true);return debouncedFunction;};