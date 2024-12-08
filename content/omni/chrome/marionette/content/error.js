"use strict";const EXPORTED_SYMBOLS=["error"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{pprint:"chrome://marionette/content/format.js",});const ERRORS=new Set(["ElementClickInterceptedError","ElementNotAccessibleError","ElementNotInteractableError","InsecureCertificateError","InvalidArgumentError","InvalidCookieDomainError","InvalidElementStateError","InvalidSelectorError","InvalidSessionIDError","JavaScriptError","MoveTargetOutOfBoundsError","NoSuchAlertError","NoSuchElementError","NoSuchFrameError","NoSuchWindowError","ScriptTimeoutError","SessionNotCreatedError","StaleElementReferenceError","TimeoutError","UnableToSetCookieError","UnexpectedAlertOpenError","UnknownCommandError","UnknownError","UnsupportedOperationError","WebDriverError",]);const BUILTIN_ERRORS=new Set(["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError",]);this.error={isError(val){if(val===null||typeof val!="object"){return false;}else if(val instanceof Ci.nsIException){return true;} 
try{let proto=Object.getPrototypeOf(val);return BUILTIN_ERRORS.has(proto.toString());}catch(e){return false;}},isWebDriverError(obj){return error.isError(obj)&&"name"in obj&&ERRORS.has(obj.name);},wrap(err){if(error.isWebDriverError(err)){return err;}
return new UnknownError(err);},report(err){let msg="Marionette threw an error: "+error.stringify(err);dump(msg+"\n");if(Cu.reportError){Cu.reportError(msg);}},stringify(err){try{let s=err.toString();if("stack"in err){s+="\n"+err.stack;}
return s;}catch(e){return"<unprintable error>";}},stack(){let trace=new Error().stack;let sa=trace.split("\n");sa=sa.slice(1);let rv="stacktrace:\n"+sa.join("\n");return rv.trimEnd();},};class WebDriverError extends Error{constructor(x){super(x);this.name=this.constructor.name;this.status="webdriver error"; if(error.isError(x)){this.stack=x.stack;}}
toJSON(){return{error:this.status,message:this.message||"",stacktrace:this.stack||"",};}
static fromJSON(json){if(typeof json.error=="undefined"){let s=JSON.stringify(json);throw new TypeError("Undeserialisable error type: "+s);}
if(!STATUSES.has(json.error)){throw new TypeError("Not of WebDriverError descent: "+json.error);}
let cls=STATUSES.get(json.error);let err=new cls();if("message"in json){err.message=json.message;}
if("stacktrace"in json){err.stack=json.stacktrace;}
return err;}}
class ElementNotAccessibleError extends WebDriverError{constructor(message){super(message);this.status="element not accessible";}}
class ElementClickInterceptedError extends WebDriverError{constructor(obscuredEl=undefined,coords=undefined){let msg="";if(obscuredEl&&coords){const doc=obscuredEl.ownerDocument;const overlayingEl=doc.elementFromPoint(coords.x,coords.y);switch(obscuredEl.style.pointerEvents){case"none":msg=pprint`Element ${obscuredEl} is not clickable `+`at point (${coords.x},${coords.y}) `+`because it does not have pointer events enabled, `+
pprint`and element ${overlayingEl} `+`would receive the click instead`;break;default:msg=pprint`Element ${obscuredEl} is not clickable `+`at point (${coords.x},${coords.y}) `+
pprint`because another element ${overlayingEl} `+`obscures it`;break;}}
super(msg);this.status="element click intercepted";}}
class ElementNotInteractableError extends WebDriverError{constructor(message){super(message);this.status="element not interactable";}}
class InsecureCertificateError extends WebDriverError{constructor(message){super(message);this.status="insecure certificate";}}
class InvalidArgumentError extends WebDriverError{constructor(message){super(message);this.status="invalid argument";}}
class InvalidCookieDomainError extends WebDriverError{constructor(message){super(message);this.status="invalid cookie domain";}}
class InvalidElementStateError extends WebDriverError{constructor(message){super(message);this.status="invalid element state";}}
class InvalidSelectorError extends WebDriverError{constructor(message){super(message);this.status="invalid selector";}}
class InvalidSessionIDError extends WebDriverError{constructor(message){super(message);this.status="invalid session id";}}
class JavaScriptError extends WebDriverError{constructor(x){super(x);this.status="javascript error";}}
class MoveTargetOutOfBoundsError extends WebDriverError{constructor(message){super(message);this.status="move target out of bounds";}}
class NoSuchAlertError extends WebDriverError{constructor(message){super(message);this.status="no such alert";}}
class NoSuchElementError extends WebDriverError{constructor(message){super(message);this.status="no such element";}}
class NoSuchFrameError extends WebDriverError{constructor(message){super(message);this.status="no such frame";}}
class NoSuchWindowError extends WebDriverError{constructor(message){super(message);this.status="no such window";}}
class ScriptTimeoutError extends WebDriverError{constructor(message){super(message);this.status="script timeout";}}
class SessionNotCreatedError extends WebDriverError{constructor(message){super(message);this.status="session not created";}}
class StaleElementReferenceError extends WebDriverError{constructor(message){super(message);this.status="stale element reference";}}
class TimeoutError extends WebDriverError{constructor(message){super(message);this.status="timeout";}}
class UnableToSetCookieError extends WebDriverError{constructor(message){super(message);this.status="unable to set cookie";}}
class UnexpectedAlertOpenError extends WebDriverError{constructor(message){super(message);this.status="unexpected alert open";}}
class UnknownCommandError extends WebDriverError{constructor(message){super(message);this.status="unknown command";}}
class UnknownError extends WebDriverError{constructor(message){super(message);this.status="unknown error";}}
class UnsupportedOperationError extends WebDriverError{constructor(message){super(message);this.status="unsupported operation";}}
const STATUSES=new Map([["element click intercepted",ElementClickInterceptedError],["element not accessible",ElementNotAccessibleError],["element not interactable",ElementNotInteractableError],["insecure certificate",InsecureCertificateError],["invalid argument",InvalidArgumentError],["invalid cookie domain",InvalidCookieDomainError],["invalid element state",InvalidElementStateError],["invalid selector",InvalidSelectorError],["invalid session id",InvalidSessionIDError],["javascript error",JavaScriptError],["move target out of bounds",MoveTargetOutOfBoundsError],["no such alert",NoSuchAlertError],["no such element",NoSuchElementError],["no such frame",NoSuchFrameError],["no such window",NoSuchWindowError],["script timeout",ScriptTimeoutError],["session not created",SessionNotCreatedError],["stale element reference",StaleElementReferenceError],["timeout",TimeoutError],["unable to set cookie",UnableToSetCookieError],["unexpected alert open",UnexpectedAlertOpenError],["unknown command",UnknownCommandError],["unknown error",UnknownError],["unsupported operation",UnsupportedOperationError],["webdriver error",WebDriverError],]);

for(let cls of STATUSES.values()){error[cls.name]=cls;}