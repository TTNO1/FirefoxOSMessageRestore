function getErrorFromURI(){let _error={};var uri=document.documentURI;if(!uri.startsWith("about:neterror?")){return uri;}
var url=new URL(uri.replace("about:","http://"));["e","u","m","c","d","f"].forEach(function(v){_error[v]=url.searchParams.get(v);});switch(_error.e){case"connectionFailure":case"netInterrupt":case"netTimeout":case"netReset":_error.e="connectionFailed";break;case"unknownSocketType":case"unknownProtocolFound":case"cspFrameAncestorBlocked":this._error.e="invalidConnection";break;}
return _error;}
let node=document.getElementById("view");node.textContent=getErrorFromURI().e;