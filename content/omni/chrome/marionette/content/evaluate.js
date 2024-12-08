"use strict";const EXPORTED_SYMBOLS=["evaluate","sandbox","Sandboxes"];const{clearTimeout,setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{assert:"chrome://marionette/content/assert.js",element:"chrome://marionette/content/element.js",error:"chrome://marionette/content/error.js",Log:"chrome://marionette/content/log.js",WebElement:"chrome://marionette/content/element.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());const ARGUMENTS="__webDriverArguments";const CALLBACK="__webDriverCallback";const COMPLETE="__webDriverComplete";const DEFAULT_TIMEOUT=10000;const FINISH="finish";this.evaluate={};evaluate.sandbox=function(sb,script,args=[],{async=false,file="dummy file",line=0,timeout=DEFAULT_TIMEOUT,}={}){let unloadHandler;let marionetteSandbox=sandbox.create(sb.window); let scriptTimeoutID,timeoutPromise;if(timeout!==null){timeoutPromise=new Promise((resolve,reject)=>{scriptTimeoutID=setTimeout(()=>{reject(new error.ScriptTimeoutError(`Timed out after ${timeout} ms`));},timeout);});}
let promise=new Promise((resolve,reject)=>{let src="";sb[COMPLETE]=resolve;sb[ARGUMENTS]=sandbox.cloneInto(args,sb);

 if(async){sb[CALLBACK]=sb[COMPLETE];src+=`${ARGUMENTS}.push(rv => ${CALLBACK}(rv));`;}
src+=`(function() {
      ${script}
    }).apply(null, ${ARGUMENTS})`;unloadHandler=sandbox.cloneInto(()=>reject(new error.JavaScriptError("Document was unloaded")),marionetteSandbox);marionetteSandbox.window.addEventListener("unload",unloadHandler);let promises=[Cu.evalInSandbox(src,sb,"1.8",file,line,false),timeoutPromise,];
Promise.race(promises).then(value=>{if(!async){resolve(value);}},err=>{reject(err);});});

return Promise.race([promise,timeoutPromise]).catch(err=>{if(err instanceof error.ScriptTimeoutError){throw err;}
throw new error.JavaScriptError(err);}).finally(()=>{clearTimeout(scriptTimeoutID);marionetteSandbox.window.removeEventListener("unload",unloadHandler);});};evaluate.fromJSON=function(obj,seenEls=undefined,win=undefined){switch(typeof obj){case"boolean":case"number":case"string":default:return obj;case"object":if(obj===null){return obj;}else if(Array.isArray(obj)){return obj.map(e=>evaluate.fromJSON(e,seenEls,win));}else if(WebElement.isReference(obj.webElRef)){if(seenEls instanceof element.ReferenceStore){ return seenEls.add(obj);}else if(!seenEls){ return element.resolveElement(obj,win);}
throw new TypeError("seenEls is not an instance of ReferenceStore");}else if(WebElement.isReference(obj)){const webEl=WebElement.fromJSON(obj);if(seenEls instanceof element.Store){ return seenEls.get(webEl,win);}else if(!seenEls){ return webEl;}
throw new TypeError("seenEls is not an instance of Store");} 
let rv={};for(let prop in obj){rv[prop]=evaluate.fromJSON(obj[prop],seenEls,win);}
return rv;}};evaluate.toJSON=function(obj,seenEls){const t=Object.prototype.toString.call(obj); if(t=="[object Undefined]"||t=="[object Null]"){return null;}else if(t=="[object Boolean]"||t=="[object Number]"||t=="[object String]"){return obj;}else if(element.isCollection(obj)){assert.acyclic(obj);return[...obj].map(el=>evaluate.toJSON(el,seenEls));}else if(WebElement.isReference(obj)){ if(seenEls instanceof element.ReferenceStore){return seenEls.get(WebElement.fromJSON(obj));}
return obj;}else if(WebElement.isReference(obj.webElRef)){ if(seenEls instanceof element.ReferenceStore){return obj;} 
return WebElement.fromJSON(obj.webElRef);}else if(element.isElement(obj)){ if(seenEls instanceof element.ReferenceStore){throw new TypeError(`ReferenceStore can't be used with Element`);}else if(seenEls instanceof element.Store){return seenEls.add(obj);}



return element.getElementId(Cu.unwaiveXrays(obj));}else if(typeof obj.toJSON=="function"){let unsafeJSON=obj.toJSON();return evaluate.toJSON(unsafeJSON,seenEls);} 
let rv={};for(let prop in obj){assert.acyclic(obj[prop]);try{rv[prop]=evaluate.toJSON(obj[prop],seenEls);}catch(e){if(e.result==Cr.NS_ERROR_NOT_IMPLEMENTED){logger.debug(`Skipping ${prop}: ${e.message}`);}else{throw e;}}}
return rv;};evaluate.isCyclic=function(value,stack=[]){let t=Object.prototype.toString.call(value); if(t=="[object Undefined]"||t=="[object Null]"){return false;}else if(t=="[object Boolean]"||t=="[object Number]"||t=="[object String]"){return false;}else if(element.isElement(value)){return false;}else if(element.isCollection(value)){if(stack.includes(value)){return true;}
stack.push(value);for(let i=0;i<value.length;i++){if(evaluate.isCyclic(value[i],stack)){return true;}}
stack.pop();return false;} 
if(stack.includes(value)){return true;}
stack.push(value);for(let prop in value){if(evaluate.isCyclic(value[prop],stack)){return true;}}
stack.pop();return false;};evaluate.isDead=function(obj,prop){try{obj[prop];}catch(e){if(e.message.includes("dead object")){return true;}
throw e;}
return false;};this.sandbox={};sandbox.cloneInto=function(obj,sb){return Cu.cloneInto(obj,sb,{cloneFunctions:true,wrapReflectors:true});};sandbox.augment=function(sb,adapter){function*entries(obj){for(let key of Object.keys(obj)){yield[key,obj[key]];}}
let funcs=adapter.exports||entries(adapter);for(let[name,func]of funcs){sb[name]=func;}
return sb;};sandbox.create=function(win,principal=null,opts={}){let p=principal||win;opts=Object.assign({sameZoneAs:win,sandboxPrototype:win,wantComponents:true,wantXrays:true,wantGlobalProperties:["ChromeUtils"],},opts);return new Cu.Sandbox(p,opts);};sandbox.createMutable=function(win){let opts={wantComponents:false,wantXrays:false,};return Cu.waiveXrays(sandbox.create(win,null,opts));};sandbox.createSystemPrincipal=function(win){let principal=Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal);return sandbox.create(win,principal);};sandbox.createSimpleTest=function(win,harness){let sb=sandbox.create(win);sb=sandbox.augment(sb,harness);sb[FINISH]=()=>sb[COMPLETE](harness.generate_results());return sb;};this.Sandboxes=class{constructor(windowFn){this.windowFn_=windowFn;this.boxes_=new Map();}
get window_(){return this.windowFn_();}
get(name="default",fresh=false){let sb=this.boxes_.get(name);if(sb){if(fresh||evaluate.isDead(sb,"window")||sb.window!=this.window_){this.boxes_.delete(name);return this.get(name,false);}}else{if(name=="system"){sb=sandbox.createSystemPrincipal(this.window_);}else{sb=sandbox.create(this.window_);}
this.boxes_.set(name,sb);}
return sb;}
clear(){this.boxes_.clear();}};evaluate.ScriptStorage=class extends Set{concat(...additional){let rv="";for(let s of this){rv=s+";"+rv;}
for(let s of additional){rv=rv+";"+s;}
logger.debug(rv);return rv;}
toJson(){return Array.from(this);}};