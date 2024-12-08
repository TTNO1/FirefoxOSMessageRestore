//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const global=this;const{AppConstants}=ChromeUtils.import("resource://gre/modules/AppConstants.jsm");const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["URL"]);const{ExtensionUtils}=ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");var{DefaultMap,DefaultWeakMap}=ExtensionUtils;ChromeUtils.defineModuleGetter(this,"ExtensionParent","resource://gre/modules/ExtensionParent.jsm");ChromeUtils.defineModuleGetter(this,"NetUtil","resource://gre/modules/NetUtil.jsm");ChromeUtils.defineModuleGetter(this,"ShortcutUtils","resource://gre/modules/ShortcutUtils.jsm");XPCOMUtils.defineLazyServiceGetter(this,"contentPolicyService","@mozilla.org/addons/content-policy;1","nsIAddonContentPolicy");XPCOMUtils.defineLazyGetter(this,"StartupCache",()=>ExtensionParent.StartupCache);XPCOMUtils.defineLazyPreferenceGetter(this,"treatWarningsAsErrors","extensions.webextensions.warnings-as-errors",false);var EXPORTED_SYMBOLS=["SchemaRoot","Schemas"];const KEY_CONTENT_SCHEMAS="extensions-framework/schemas/content";const KEY_PRIVILEGED_SCHEMAS="extensions-framework/schemas/privileged";const{DEBUG}=AppConstants;const isParentProcess=Services.appinfo.processType===Services.appinfo.PROCESS_TYPE_DEFAULT;function readJSON(url){return new Promise((resolve,reject)=>{NetUtil.asyncFetch({uri:url,loadUsingSystemPrincipal:true},(inputStream,status)=>{if(!Components.isSuccessCode(status)){ let e=Components.Exception("",status);reject(new Error(`Error while loading '${url}' (${e.name})`));return;}
try{let text=NetUtil.readInputStreamToString(inputStream,inputStream.available());


let index=text.indexOf("[");text=text.slice(index);resolve(JSON.parse(text));}catch(e){reject(e);}});});}
function stripDescriptions(json,stripThis=true){if(Array.isArray(json)){for(let i=0;i<json.length;i++){if(typeof json[i]==="object"&&json[i]!==null){json[i]=stripDescriptions(json[i]);}}
return json;}
let result={};


for(let key of Object.keys(json).sort()){if(stripThis&&key==="description"&&typeof json[key]==="string"){continue;}
if(typeof json[key]==="object"&&json[key]!==null){result[key]=stripDescriptions(json[key],key!=="properties");}else{result[key]=json[key];}}
return result;}
function blobbify(json){

json=stripDescriptions(json);return new StructuredCloneHolder(json);}
async function readJSONAndBlobbify(url){let json=await readJSON(url);return blobbify(json);}
function exportLazyGetter(object,prop,getter){object=ChromeUtils.waiveXrays(object);let redefine=value=>{if(value===undefined){delete object[prop];}else{Object.defineProperty(object,prop,{enumerable:true,configurable:true,writable:true,value,});}
getter=null;return value;};Object.defineProperty(object,prop,{enumerable:true,configurable:true,get:Cu.exportFunction(function(){return redefine(getter.call(this));},object),set:Cu.exportFunction(value=>{redefine(value);},object),});}
function exportLazyProperty(object,prop,getter){object=ChromeUtils.waiveXrays(object);let redefine=obj=>{let desc=getter.call(obj);getter=null;delete object[prop];if(desc){let defaults={configurable:true,enumerable:true,};if(!desc.set&&!desc.get){defaults.writable=true;}
Object.defineProperty(object,prop,Object.assign(defaults,desc));}};Object.defineProperty(object,prop,{enumerable:true,configurable:true,get:Cu.exportFunction(function(){redefine(this);return object[prop];},object),set:Cu.exportFunction(function(value){redefine(this);object[prop]=value;},object),});}
const POSTPROCESSORS={convertImageDataToURL(imageData,context){let document=context.cloneScope.document;let canvas=document.createElementNS("http://www.w3.org/1999/xhtml","canvas");canvas.width=imageData.width;canvas.height=imageData.height;canvas.getContext("2d").putImageData(imageData,0,0);return canvas.toDataURL("image/png");},webRequestBlockingPermissionRequired(string,context){if(string==="blocking"&&!context.hasPermission("webRequestBlocking")){throw new context.cloneScope.Error("Using webRequest.addListener with the "+"blocking option requires the 'webRequestBlocking' permission.");}
return string;},requireBackgroundServiceWorkerEnabled(value,context){if(WebExtensionPolicy.backgroundServiceWorkerEnabled){return value;}

const msg="background.service_worker is currently disabled";context.logError(context.makeError(msg));throw new Error(msg);},};
function parsePattern(pattern){let flags="";let match=/^\(\?([im]*)\)(.*)/.exec(pattern);if(match){[,flags,pattern]=match;}
return new RegExp(pattern,flags);}
function getValueBaseType(value){let type=typeof value;switch(type){case"object":if(value===null){return"null";}
if(Array.isArray(value)){return"array";}
break;case"number":if(value%1===0){return"integer";}}
return type;}

const CONTEXT_FOR_VALIDATION=["checkLoadURL","hasPermission","logError"];const CONTEXT_FOR_INJECTION=[...CONTEXT_FOR_VALIDATION,"getImplementation","isPermissionRevokable","shouldInject",];function forceString(msg){if(typeof msg==="function"){return msg();}
return msg;}
class Context{constructor(params,overridableMethods=CONTEXT_FOR_VALIDATION){this.params=params;this.path=[];this.preprocessors={localize(value,context){return value;},};this.postprocessors=POSTPROCESSORS;this.isChromeCompat=false;this.currentChoices=new Set();this.choicePathIndex=0;for(let method of overridableMethods){if(method in params){this[method]=params[method].bind(params);}}
let props=["preprocessors","isChromeCompat"];for(let prop of props){if(prop in params){if(prop in this&&typeof this[prop]=="object"){Object.assign(this[prop],params[prop]);}else{this[prop]=params[prop];}}}}
get choicePath(){let path=this.path.slice(this.choicePathIndex);return path.join(".");}
get cloneScope(){return this.params.cloneScope||undefined;}
get url(){return this.params.url;}
get principal(){return(this.params.principal||Services.scriptSecurityManager.createNullPrincipal({}));}
checkLoadURL(url){let ssm=Services.scriptSecurityManager;try{ssm.checkLoadURIWithPrincipal(this.principal,Services.io.newURI(url),ssm.DISALLOW_INHERIT_PRINCIPAL);}catch(e){return false;}
return true;}
hasPermission(permission){return false;}
isPermissionRevokable(permission){return false;}
error(errorMessage,choicesMessage=undefined,warning=false){if(choicesMessage!==null){let{choicePath}=this;if(choicePath){choicesMessage=`.${choicePath} must ${choicesMessage}`;}
this.currentChoices.add(choicesMessage);}
if(this.currentTarget){let{currentTarget}=this;return{error:()=>`${
            warning ? "Warning" : "Error"
          } processing ${currentTarget}: ${forceString(errorMessage)}`,};}
return{error:errorMessage};}
makeError(message,{warning=false}={}){let error=forceString(this.error(message,null,warning).error);if(this.cloneScope){return new this.cloneScope.Error(error);}
return error;}
logError(error){Cu.reportError(error);}
get currentTarget(){return this.path.join(".");}
withChoices(callback){let{currentChoices,choicePathIndex}=this;let choices=new Set();this.currentChoices=choices;this.choicePathIndex=this.path.length;try{let result=callback();return{result,choices};}finally{this.currentChoices=currentChoices;this.choicePathIndex=choicePathIndex;if(choices.size==1){for(let choice of choices){currentChoices.add(choice);}}else if(choices.size){this.error(null,()=>{let array=Array.from(choices,forceString);let n=array.length-1;array[n]=`or ${array[n]}`;return`must either [${array.join(", ")}]`;});}}}
withPath(component,callback){this.path.push(component);try{return callback();}finally{this.path.pop();}}}
class InjectionEntry{constructor(context,entry,parentObj,name,path,parentEntry){this.context=context;this.entry=entry;this.parentObj=parentObj;this.name=name;this.path=path;this.parentEntry=parentEntry;this.injected=null;this.lazyInjected=null;}
get allowedContexts(){let{allowedContexts}=this.entry;if(allowedContexts.length){return allowedContexts;}
return this.parentEntry.defaultContexts;}
get isRevokable(){return(this.entry.permissions&&this.entry.permissions.some(perm=>this.context.isPermissionRevokable(perm)));}
get hasPermission(){return(!this.entry.permissions||this.entry.permissions.some(perm=>this.context.hasPermission(perm)));}
get shouldInject(){return this.context.shouldInject(this.path.join("."),this.name,this.allowedContexts);}
revoke(){if(this.lazyInjected){this.lazyInjected=false;}else if(this.injected){if(this.injected.revoke){this.injected.revoke();}
try{let unwrapped=ChromeUtils.waiveXrays(this.parentObj);delete unwrapped[this.name];}catch(e){Cu.reportError(e);}
let{value}=this.injected.descriptor;if(value){this.context.revokeChildren(value);}
this.injected=null;}}
getDescriptor(){this.lazyInjected=false;if(this.injected){let path=[...this.path,this.name];throw new Error(`Attempting to re-inject already injected entry: ${path.join(".")}`);}
if(!this.shouldInject){return;}
if(this.isRevokable){this.context.pendingEntries.add(this);}
if(!this.hasPermission){return;}
this.injected=this.entry.getDescriptor(this.path,this.context);if(!this.injected){return undefined;}
return this.injected.descriptor;}
lazyInject(){if(this.lazyInjected||this.injected){let path=[...this.path,this.name];throw new Error(`Attempting to re-lazy-inject already injected entry: ${path.join(".")}`);}
this.lazyInjected=true;exportLazyProperty(this.parentObj,this.name,()=>{if(this.lazyInjected){return this.getDescriptor();}});}
permissionsChanged(){if(this.injected){this.maybeRevoke();}else{this.maybeInject();}}
maybeInject(){if(!this.injected&&!this.lazyInjected){this.lazyInject();}}
maybeRevoke(){if(this.injected&&!this.hasPermission){this.revoke();}}}
class InjectionContext extends Context{constructor(params,schemaRoot){super(params,CONTEXT_FOR_INJECTION);this.schemaRoot=schemaRoot;this.pendingEntries=new Set();this.children=new DefaultWeakMap(()=>new Map());this.injectedRoots=new Set();if(params.setPermissionsChangedCallback){params.setPermissionsChangedCallback(this.permissionsChanged.bind(this));}}
shouldInject(namespace,name,allowedContexts){throw new Error("Not implemented");}
getImplementation(namespace,name){throw new Error("Not implemented");}
permissionsChanged(){for(let entry of this.pendingEntries){try{entry.permissionsChanged();}catch(e){Cu.reportError(e);}}}
revokeChildren(object){if(!this.children.has(object)){return;}
let children=this.children.get(object);for(let[name,entry]of children.entries()){try{entry.revoke();}catch(e){Cu.reportError(e);}
children.delete(name);

this.pendingEntries.delete(entry);}
this.children.delete(object);}
_getInjectionEntry(entry,dest,name,path,parentEntry){let injection=new InjectionEntry(this,entry,dest,name,path,parentEntry);this.children.get(dest).set(name,injection);return injection;}
getDescriptor(entry,dest,name,path,parentEntry){let injection=this._getInjectionEntry(entry,dest,name,path,parentEntry);return injection.getDescriptor();}
injectInto(entry,dest,name,path,parentEntry){let injection=this._getInjectionEntry(entry,dest,name,path,parentEntry);injection.lazyInject();}}
const FORMATS={hostname(string,context){let valid=true;try{valid=new URL(`http://${string}`).host===string;}catch(e){valid=false;}
if(!valid){throw new Error(`Invalid hostname ${string}`);}
return string;},url(string,context){let url=new URL(string).href;if(!context.checkLoadURL(url)){throw new Error(`Access denied for URL ${url}`);}
return url;},relativeUrl(string,context){if(!context.url){
try{new URL(string);}catch(e){return string;}}
let url=new URL(string,context.url).href;if(!context.checkLoadURL(url)){throw new Error(`Access denied for URL ${url}`);}
return url;},strictRelativeUrl(string,context){void FORMATS.unresolvedRelativeUrl(string,context);return FORMATS.relativeUrl(string,context);},unresolvedRelativeUrl(string,context){if(!string.startsWith("//")){try{new URL(string);}catch(e){return string;}}
throw new SyntaxError(`String ${JSON.stringify(string)} must be a relative URL`);},homepageUrl(string,context){
return FORMATS.relativeUrl(string.replace(new RegExp("\\|","g"),"%7C"),context);},imageDataOrStrictRelativeUrl(string,context){
 if(!string.startsWith("data:image/png;base64,")&&!string.startsWith("data:image/jpeg;base64,")){try{return FORMATS.strictRelativeUrl(string,context);}catch(e){throw new SyntaxError(`String ${JSON.stringify(
            string
          )} must be a relative or PNG or JPG data:image URL`);}}
return string;},contentSecurityPolicy(string,context){let error=contentPolicyService.validateAddonCSP(string);if(error!=null){
context.logError(`Error processing ${context.currentTarget}: ${error}`);throw new SyntaxError(error);}
return string;},date(string,context){const PATTERN=/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|([-+]\d{2}:?\d{2})))?$/;if(!PATTERN.test(string)){throw new Error(`Invalid date string ${string}`);}


if(isNaN(new Date(string))){throw new Error(`Invalid date string ${string}`);}
return string;},manifestShortcutKey(string,context){if(ShortcutUtils.validate(string)==ShortcutUtils.IS_VALID){return string;}
let errorMessage=`Value "${string}" must consist of `+`either a combination of one or two modifiers, including `+`a mandatory primary modifier and a key, separated by '+', `+`or a media key. For details see: `+`https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands#Key_combinations`;throw new Error(errorMessage);},manifestShortcutKeyOrEmpty(string,context){return string===""?"":FORMATS.manifestShortcutKey(string,context);},};
class Entry{constructor(schema={}){this.deprecated=false;if("deprecated"in schema){this.deprecated=schema.deprecated;}
this.preprocessor=schema.preprocess||null;this.postprocessor=schema.postprocess||null;this.allowedContexts=schema.allowedContexts||[];}
preprocess(value,context){if(this.preprocessor){return context.preprocessors[this.preprocessor](value,context);}
return value;}
postprocess(result,context){if(result.error||!this.postprocessor){return result;}
let value=context.postprocessors[this.postprocessor](result.value,context);return{value};}
logDeprecation(context,value=null){let message="This property is deprecated";if(typeof this.deprecated=="string"){message=this.deprecated;if(message.includes("${value}")){try{value=JSON.stringify(value);}catch(e){value=String(value);}
message=message.replace(/\$\{value\}/g,()=>value);}}
this.logWarning(context,message);}
logWarning(context,warningMessage){let error=context.makeError(warningMessage,{warning:true});context.logError(error);if(treatWarningsAsErrors){

Services.console.logStringMessage("Treating warning as error because the preference "+"extensions.webextensions.warnings-as-errors is set to true");if(typeof error==="string"){error=new Error(error);}
throw error;}}
checkDeprecated(context,value=null){if(this.deprecated){this.logDeprecation(context,value);}}
getDescriptor(path,context){return undefined;}}

class Type extends Entry{static get EXTRA_PROPERTIES(){return["description","deprecated","preprocess","postprocess","allowedContexts",];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);return new this(schema);}
static checkSchemaProperties(schema,path,extra=[]){if(DEBUG){let allowedSet=new Set([...this.EXTRA_PROPERTIES,...extra]);for(let prop of Object.keys(schema)){if(!allowedSet.has(prop)){throw new Error(`Internal error: Namespace ${path.join(".")} has `+`invalid type property "${prop}" `+`in type "${schema.id || JSON.stringify(schema)}"`);}}}}




normalize(value,context){return context.error("invalid type");}


 
checkBaseType(baseType){return false;}

normalizeBase(type,value,context){if(this.checkBaseType(getValueBaseType(value))){this.checkDeprecated(context,value);return{value:this.preprocess(value,context)};}
let choice;if("aeiou".includes(type[0])){choice=`be an ${type} value`;}else{choice=`be a ${type} value`;}
return context.error(()=>`Expected ${type} instead of ${JSON.stringify(value)}`,choice);}}
class AnyType extends Type{normalize(value,context){this.checkDeprecated(context,value);return this.postprocess({value},context);}
checkBaseType(baseType){return true;}}
class ChoiceType extends Type{static get EXTRA_PROPERTIES(){return["choices",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let choices=schema.choices.map(t=>root.parseSchema(t,path));return new this(schema,choices);}
constructor(schema,choices){super(schema);this.choices=choices;}
extend(type){this.choices.push(...type.choices);return this;}
normalize(value,context){this.checkDeprecated(context,value);let error;let{choices,result}=context.withChoices(()=>{for(let choice of this.choices){let r=choice.normalize(value,context);if(!r.error){return r;}
error=r;}});if(result){return result;}
if(choices.size<=1){return error;}
choices=Array.from(choices,forceString);let n=choices.length-1;choices[n]=`or ${choices[n]}`;let message;if(typeof value==="object"){message=()=>`Value must either: ${choices.join(", ")}`;}else{message=()=>`Value ${JSON.stringify(value)} must either: ${choices.join(", ")}`;}
return context.error(message,null);}
checkBaseType(baseType){return this.choices.some(t=>t.checkBaseType(baseType));}}
class RefType extends Type{static get EXTRA_PROPERTIES(){return["$ref",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let ref=schema.$ref;let ns=path.join(".");if(ref.includes(".")){[,ns,ref]=/^(.*)\.(.*?)$/.exec(ref);}
return new this(root,schema,ns,ref);}
constructor(root,schema,namespaceName,reference){super(schema);this.root=root;this.namespaceName=namespaceName;this.reference=reference;}
get targetType(){let ns=this.root.getNamespace(this.namespaceName);let type=ns.get(this.reference);if(!type){throw new Error(`Internal error: Type ${this.reference} not found`);}
return type;}
normalize(value,context){this.checkDeprecated(context,value);return this.targetType.normalize(value,context);}
checkBaseType(baseType){return this.targetType.checkBaseType(baseType);}}
class StringType extends Type{static get EXTRA_PROPERTIES(){return["enum","minLength","maxLength","pattern","format",...super.EXTRA_PROPERTIES,];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let enumeration=schema.enum||null;if(enumeration){
enumeration=enumeration.map(e=>{if(typeof e=="object"){return e.name;}
return e;});}
let pattern=null;if(schema.pattern){try{pattern=parsePattern(schema.pattern);}catch(e){throw new Error(`Internal error: Invalid pattern ${JSON.stringify(schema.pattern)}`);}}
let format=null;if(schema.format){if(!(schema.format in FORMATS)){throw new Error(`Internal error: Invalid string format ${schema.format}`);}
format=FORMATS[schema.format];}
return new this(schema,schema.id||undefined,enumeration,schema.minLength||0,schema.maxLength||Infinity,pattern,format);}
constructor(schema,name,enumeration,minLength,maxLength,pattern,format){super(schema);this.name=name;this.enumeration=enumeration;this.minLength=minLength;this.maxLength=maxLength;this.pattern=pattern;this.format=format;}
normalize(value,context){let r=this.normalizeBase("string",value,context);if(r.error){return r;}
value=r.value;if(this.enumeration){if(this.enumeration.includes(value)){return this.postprocess({value},context);}
let choices=this.enumeration.map(JSON.stringify).join(", ");return context.error(()=>`Invalid enumeration value ${JSON.stringify(value)}`,`be one of [${choices}]`);}
if(value.length<this.minLength){return context.error(()=>`String ${JSON.stringify(value)} is too short (must be ${
            this.minLength
          })`,`be longer than ${this.minLength}`);}
if(value.length>this.maxLength){return context.error(()=>`String ${JSON.stringify(value)} is too long (must be ${
            this.maxLength
          })`,`be shorter than ${this.maxLength}`);}
if(this.pattern&&!this.pattern.test(value)){return context.error(()=>`String ${JSON.stringify(value)} must match ${this.pattern}`,`match the pattern ${this.pattern.toSource()}`);}
if(this.format){try{r.value=this.format(r.value,context);}catch(e){return context.error(String(e),`match the format "${this.format.name}"`);}}
return r;}
checkBaseType(baseType){return baseType=="string";}
getDescriptor(path,context){if(this.enumeration){let obj=Cu.createObjectIn(context.cloneScope);for(let e of this.enumeration){obj[e.toUpperCase()]=e;}
return{descriptor:{value:obj},};}}}
class NullType extends Type{normalize(value,context){return this.normalizeBase("null",value,context);}
checkBaseType(baseType){return baseType=="null";}}
let FunctionEntry;let Event;let SubModuleType;class ObjectType extends Type{static get EXTRA_PROPERTIES(){return["properties","patternProperties","$import",...super.EXTRA_PROPERTIES,];}
static parseSchema(root,schema,path,extraProperties=[]){if("functions"in schema){return SubModuleType.parseSchema(root,schema,path,extraProperties);}
if(DEBUG&&!("$extend"in schema)){extraProperties=["additionalProperties","isInstanceOf",...extraProperties,];}
this.checkSchemaProperties(schema,path,extraProperties);let imported=null;if("$import"in schema){let importPath=schema.$import;let idx=importPath.indexOf(".");if(idx===-1){imported=[path[0],importPath];}else{imported=[importPath.slice(0,idx),importPath.slice(idx+1)];}}
let parseProperty=(schema,extraProps=[])=>{return{type:root.parseSchema(schema,path,DEBUG&&["unsupported","onError","permissions","default",...extraProps,]),optional:schema.optional||false,unsupported:schema.unsupported||false,onError:schema.onError||null,default:schema.default===undefined?null:schema.default,};};let properties=Object.create(null);for(let propName of Object.keys(schema.properties||{})){properties[propName]=parseProperty(schema.properties[propName],["optional",]);}
let patternProperties=[];for(let propName of Object.keys(schema.patternProperties||{})){let pattern;try{pattern=parsePattern(propName);}catch(e){throw new Error(`Internal error: Invalid property pattern ${JSON.stringify(propName)}`);}
patternProperties.push({pattern,type:parseProperty(schema.patternProperties[propName]),});}
let additionalProperties=null;if(schema.additionalProperties){let type=schema.additionalProperties;if(type===true){type={type:"any"};}
additionalProperties=root.parseSchema(type,path);}
return new this(schema,properties,additionalProperties,patternProperties,schema.isInstanceOf||null,imported);}
constructor(schema,properties,additionalProperties,patternProperties,isInstanceOf,imported){super(schema);this.properties=properties;this.additionalProperties=additionalProperties;this.patternProperties=patternProperties;this.isInstanceOf=isInstanceOf;if(imported){let[ns,path]=imported;ns=Schemas.getNamespace(ns);let importedType=ns.get(path);if(!importedType){throw new Error(`Internal error: imported type ${path} not found`);}
if(DEBUG&&!(importedType instanceof ObjectType)){throw new Error(`Internal error: cannot import non-object type ${path}`);}
this.properties=Object.assign({},importedType.properties,this.properties);this.patternProperties=[...importedType.patternProperties,...this.patternProperties,];this.additionalProperties=importedType.additionalProperties||this.additionalProperties;}}
extend(type){for(let key of Object.keys(type.properties)){if(key in this.properties){throw new Error(`InternalError: Attempt to extend an object with conflicting property "${key}"`);}
this.properties[key]=type.properties[key];}
this.patternProperties.push(...type.patternProperties);return this;}
checkBaseType(baseType){return baseType=="object";}
extractProperties(value,context){





let klass=ChromeUtils.getClassName(value,true);if(klass!="Object"){throw context.error(`Expected a plain JavaScript object, got a ${klass}`,`be a plain JavaScript object`);}
return ChromeUtils.shallowClone(value);}
checkProperty(context,prop,propType,result,properties,remainingProps){let{type,optional,unsupported,onError}=propType;let error=null;if(unsupported){if(prop in properties){error=context.error(`Property "${prop}" is unsupported by Firefox`,`not contain an unsupported "${prop}" property`);}}else if(prop in properties){if(optional&&(properties[prop]===null||properties[prop]===undefined)){result[prop]=propType.default;}else{let r=context.withPath(prop,()=>type.normalize(properties[prop],context));if(r.error){error=r;}else{result[prop]=r.value;properties[prop]=r.value;}}
remainingProps.delete(prop);}else if(!optional){error=context.error(`Property "${prop}" is required`,`contain the required "${prop}" property`);}else if(optional!=="omit-key-if-missing"){result[prop]=propType.default;}
if(error){if(onError=="warn"){this.logWarning(context,forceString(error.error));}else if(onError!="ignore"){throw error;}
result[prop]=propType.default;}}
normalize(value,context){try{let v=this.normalizeBase("object",value,context);if(v.error){return v;}
value=v.value;if(this.isInstanceOf){if(DEBUG){if(Object.keys(this.properties).length||this.patternProperties.length||!(this.additionalProperties instanceof AnyType)){throw new Error("InternalError: isInstanceOf can only be used "+"with objects that are otherwise unrestricted");}}
if(ChromeUtils.getClassName(value)!==this.isInstanceOf&&(this.isInstanceOf!=="Element"||value.nodeType!==1)){return context.error(`Object must be an instance of ${this.isInstanceOf}`,`be an instance of ${this.isInstanceOf}`);}

return this.postprocess({value},context);}
let properties=this.extractProperties(value,context);let remainingProps=new Set(Object.keys(properties));let result={};for(let prop of Object.keys(this.properties)){this.checkProperty(context,prop,this.properties[prop],result,properties,remainingProps);}
for(let prop of Object.keys(properties)){for(let{pattern,type}of this.patternProperties){if(pattern.test(prop)){this.checkProperty(context,prop,type,result,properties,remainingProps);}}}
if(this.additionalProperties){for(let prop of remainingProps){let r=context.withPath(prop,()=>this.additionalProperties.normalize(properties[prop],context));if(r.error){return r;}
result[prop]=r.value;}}else if(remainingProps.size==1){return context.error(`Unexpected property "${[...remainingProps]}"`,`not contain an unexpected "${[...remainingProps]}" property`);}else if(remainingProps.size){let props=[...remainingProps].sort().join(", ");return context.error(`Unexpected properties: ${props}`,`not contain the unexpected properties [${props}]`);}
return this.postprocess({value:result},context);}catch(e){if(e.error){return e;}
throw e;}}}

SubModuleType=class SubModuleType extends Type{static get EXTRA_PROPERTIES(){return["functions","events","properties",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);path=[...path,schema.id];let functions=schema.functions.filter(fun=>!fun.unsupported).map(fun=>FunctionEntry.parseSchema(root,fun,path));let events=[];if(schema.events){events=schema.events.filter(event=>!event.unsupported).map(event=>Event.parseSchema(root,event,path));}
return new this(functions,events);}
constructor(functions,events){super();this.functions=functions;this.events=events;}};class NumberType extends Type{normalize(value,context){let r=this.normalizeBase("number",value,context);if(r.error){return r;}
if(isNaN(r.value)||!Number.isFinite(r.value)){return context.error("NaN and infinity are not valid","be a finite number");}
return r;}
checkBaseType(baseType){return baseType=="number"||baseType=="integer";}}
class IntegerType extends Type{static get EXTRA_PROPERTIES(){return["minimum","maximum",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let{minimum=-Infinity,maximum=Infinity}=schema;return new this(schema,minimum,maximum);}
constructor(schema,minimum,maximum){super(schema);this.minimum=minimum;this.maximum=maximum;}
normalize(value,context){let r=this.normalizeBase("integer",value,context);if(r.error){return r;}
value=r.value; if(!Number.isSafeInteger(value)){return context.error("Integer is out of range","be a valid 32 bit signed integer");}
if(value<this.minimum){return context.error(`Integer ${value} is too small (must be at least ${this.minimum})`,`be at least ${this.minimum}`);}
if(value>this.maximum){return context.error(`Integer ${value} is too big (must be at most ${this.maximum})`,`be no greater than ${this.maximum}`);}
return this.postprocess(r,context);}
checkBaseType(baseType){return baseType=="integer";}}
class BooleanType extends Type{static get EXTRA_PROPERTIES(){return["enum",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let enumeration=schema.enum||null;return new this(schema,enumeration);}
constructor(schema,enumeration){super(schema);this.enumeration=enumeration;}
normalize(value,context){if(!this.checkBaseType(getValueBaseType(value))){return context.error(()=>`Expected boolean instead of ${JSON.stringify(value)}`,`be a boolean`);}
value=this.preprocess(value,context);if(this.enumeration&&!this.enumeration.includes(value)){return context.error(()=>`Invalid value ${JSON.stringify(value)}`,`be ${this.enumeration}`);}
this.checkDeprecated(context,value);return{value};}
checkBaseType(baseType){return baseType=="boolean";}}
class ArrayType extends Type{static get EXTRA_PROPERTIES(){return["items","minItems","maxItems",...super.EXTRA_PROPERTIES];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let items=root.parseSchema(schema.items,path,["onError"]);return new this(schema,items,schema.minItems||0,schema.maxItems||Infinity);}
constructor(schema,itemType,minItems,maxItems){super(schema);this.itemType=itemType;this.minItems=minItems;this.maxItems=maxItems;this.onError=schema.items.onError||null;}
normalize(value,context){let v=this.normalizeBase("array",value,context);if(v.error){return v;}
value=v.value;let result=[];for(let[i,element]of value.entries()){element=context.withPath(String(i),()=>this.itemType.normalize(element,context));if(element.error){if(this.onError=="warn"){this.logWarning(context,forceString(element.error));}else if(this.onError!="ignore"){return element;}
continue;}
result.push(element.value);}
if(result.length<this.minItems){return context.error(`Array requires at least ${this.minItems} items; you have ${result.length}`,`have at least ${this.minItems} items`);}
if(result.length>this.maxItems){return context.error(`Array requires at most ${this.maxItems} items; you have ${result.length}`,`have at most ${this.maxItems} items`);}
return this.postprocess({value:result},context);}
checkBaseType(baseType){return baseType=="array";}}
class FunctionType extends Type{static get EXTRA_PROPERTIES(){return["parameters","async","returns","requireUserInput",...super.EXTRA_PROPERTIES,];}
static parseSchema(root,schema,path,extraProperties=[]){this.checkSchemaProperties(schema,path,extraProperties);let isAsync=!!schema.async;let isExpectingCallback=typeof schema.async==="string";let parameters=null;if("parameters"in schema){parameters=[];for(let param of schema.parameters){
let isCallback=isAsync&&param.name==schema.async;if(isCallback){isExpectingCallback=false;}
parameters.push({type:root.parseSchema(param,path,["name","optional","default"]),name:param.name,optional:param.optional==null?isCallback:param.optional,default:param.default==undefined?null:param.default,});}}
let hasAsyncCallback=false;if(isAsync){hasAsyncCallback=parameters&&parameters.length&&parameters[parameters.length-1].name==schema.async;}
if(DEBUG){if(isExpectingCallback){throw new Error(`Internal error: Expected a callback parameter `+`with name ${schema.async}`);}
if(isAsync&&schema.returns){throw new Error("Internal error: Async functions must not have return values.");}
if(isAsync&&schema.allowAmbiguousOptionalArguments&&!hasAsyncCallback){throw new Error("Internal error: Async functions with ambiguous "+"arguments must declare the callback as the last parameter");}}
return new this(schema,parameters,isAsync,hasAsyncCallback,!!schema.requireUserInput);}
constructor(schema,parameters,isAsync,hasAsyncCallback,requireUserInput){super(schema);this.parameters=parameters;this.isAsync=isAsync;this.hasAsyncCallback=hasAsyncCallback;this.requireUserInput=requireUserInput;}
normalize(value,context){return this.normalizeBase("function",value,context);}
checkBaseType(baseType){return baseType=="function";}}

class ValueProperty extends Entry{constructor(schema,name,value){super(schema);this.name=name;this.value=value;}
getDescriptor(path,context){return{descriptor:{value:this.value},};}}

class TypeProperty extends Entry{constructor(schema,path,name,type,writable,permissions){super(schema);this.path=path;this.name=name;this.type=type;this.writable=writable;this.permissions=permissions;}
throwError(context,msg){throw context.makeError(`${msg} for ${this.path.join(".")}.${this.name}.`);}
getDescriptor(path,context){if(this.unsupported){return;}
let apiImpl=context.getImplementation(path.join("."),this.name);let getStub=()=>{this.checkDeprecated(context);return apiImpl.getProperty();};let descriptor={get:Cu.exportFunction(getStub,context.cloneScope),};if(this.writable){let setStub=value=>{let normalized=this.type.normalize(value,context);if(normalized.error){this.throwError(context,forceString(normalized.error));}
apiImpl.setProperty(normalized.value);};descriptor.set=Cu.exportFunction(setStub,context.cloneScope);}
return{descriptor,revoke(){apiImpl.revoke();apiImpl=null;},};}}
class SubModuleProperty extends Entry{



constructor(root,schema,path,name,reference,properties,permissions){super(schema);this.root=root;this.name=name;this.path=path;this.namespaceName=path.join(".");this.reference=reference;this.properties=properties;this.permissions=permissions;}
getDescriptor(path,context){let obj=Cu.createObjectIn(context.cloneScope);let ns=this.root.getNamespace(this.namespaceName);let type=ns.get(this.reference);if(!type&&this.reference.includes(".")){let[namespaceName,ref]=this.reference.split(".");ns=this.root.getNamespace(namespaceName);type=ns.get(ref);}
if(DEBUG){if(!type||!(type instanceof SubModuleType)){throw new Error(`Internal error: ${this.namespaceName}.${this.reference} `+`is not a sub-module`);}}
let subpath=[...path,this.name];let functions=type.functions;for(let fun of functions){context.injectInto(fun,obj,fun.name,subpath,ns);}
let events=type.events;for(let event of events){context.injectInto(event,obj,event.name,subpath,ns);}
return{descriptor:{value:obj},revoke(){let unwrapped=ChromeUtils.waiveXrays(obj);for(let fun of functions){try{delete unwrapped[fun.name];}catch(e){Cu.reportError(e);}}},};}}


class CallEntry extends Entry{constructor(schema,path,name,parameters,allowAmbiguousOptionalArguments){super(schema);this.path=path;this.name=name;this.parameters=parameters;this.allowAmbiguousOptionalArguments=allowAmbiguousOptionalArguments;}
throwError(context,msg){throw context.makeError(`${msg} for ${this.path.join(".")}.${this.name}.`);}
checkParameters(args,context){let fixedArgs=[];
let check=(parameterIndex,argIndex)=>{if(parameterIndex==this.parameters.length){if(argIndex==args.length){return true;}
return false;}
let parameter=this.parameters[parameterIndex];if(parameter.optional){fixedArgs[parameterIndex]=parameter.default;if(check(parameterIndex+1,argIndex)){return true;}}
if(argIndex==args.length){return false;}
let arg=args[argIndex];if(!parameter.type.checkBaseType(getValueBaseType(arg))){
if(parameter.optional&&(arg===null||arg===undefined)){fixedArgs[parameterIndex]=Cu.cloneInto(parameter.default,global);}else{return false;}}else{fixedArgs[parameterIndex]=arg;}
return check(parameterIndex+1,argIndex+1);};if(this.allowAmbiguousOptionalArguments){
if(this.hasAsyncCallback&&typeof args[args.length-1]!="function"){args.push(null);}
return args;}
let success=check(0,0);if(!success){this.throwError(context,"Incorrect argument types");}
fixedArgs=fixedArgs.map((arg,parameterIndex)=>{if(arg===null){return null;}
let parameter=this.parameters[parameterIndex];let r=parameter.type.normalize(arg,context);if(r.error){this.throwError(context,`Type error for parameter ${parameter.name} (${forceString(r.error)})`);}
return r.value;});return fixedArgs;}}
FunctionEntry=class FunctionEntry extends CallEntry{static parseSchema(root,schema,path){let returns=!!schema.returns;if(DEBUG&&"returns"in schema){returns={type:root.parseSchema(schema.returns,path,["optional","name"]),optional:schema.returns.optional||false,name:"result",};}
return new this(schema,path,schema.name,root.parseSchema(schema,path,["name","unsupported","returns","permissions","allowAmbiguousOptionalArguments",]),schema.unsupported||false,schema.allowAmbiguousOptionalArguments||false,returns,schema.permissions||null);}
constructor(schema,path,name,type,unsupported,allowAmbiguousOptionalArguments,returns,permissions){super(schema,path,name,type.parameters,allowAmbiguousOptionalArguments);this.unsupported=unsupported;this.returns=returns;this.permissions=permissions;this.isAsync=type.isAsync;this.hasAsyncCallback=type.hasAsyncCallback;this.requireUserInput=type.requireUserInput;}
checkValue({type,optional,name},value,context){if(optional&&value==null){return;}
if(type.reference==="ExtensionPanel"||type.reference==="ExtensionSidebarPane"||type.reference==="Port"){return;}
const{error}=type.normalize(value,context);if(error){this.throwError(context,`Type error for ${name} value (${forceString(error)})`);}}
checkCallback(args,context){const callback=this.parameters[this.parameters.length-1];for(const[i,param]of callback.type.parameters.entries()){this.checkValue(param,args[i],context);}}
getDescriptor(path,context){let apiImpl=context.getImplementation(path.join("."),this.name);let stub;if(this.isAsync){stub=(...args)=>{this.checkDeprecated(context);let actuals=this.checkParameters(args,context);let callback=null;if(this.hasAsyncCallback){callback=actuals.pop();}
if(callback===null&&context.isChromeCompat){
callback=()=>{};}
if(DEBUG&&this.hasAsyncCallback&&callback){let original=callback;callback=(...args)=>{this.checkCallback(args,context);original(...args);};}
let result=apiImpl.callAsyncFunction(actuals,callback,this.requireUserInput);if(DEBUG&&this.hasAsyncCallback&&!callback){return result.then(result=>{this.checkCallback([result],context);return result;});}
return result;};}else if(!this.returns){stub=(...args)=>{this.checkDeprecated(context);let actuals=this.checkParameters(args,context);return apiImpl.callFunctionNoReturn(actuals);};}else{stub=(...args)=>{this.checkDeprecated(context);let actuals=this.checkParameters(args,context);let result=apiImpl.callFunction(actuals);if(DEBUG&&this.returns){this.checkValue(this.returns,result,context);}
return result;};}
return{descriptor:{value:Cu.exportFunction(stub,context.cloneScope)},revoke(){apiImpl.revoke();apiImpl=null;},};}};
Event=class Event extends CallEntry{static parseSchema(root,event,path){let extraParameters=Array.from(event.extraParameters||[],param=>({type:root.parseSchema(param,path,["name","optional","default"]),name:param.name,optional:param.optional||false,default:param.default==undefined?null:param.default,}));let extraProperties=["name","unsupported","permissions","extraParameters","returns","filters",];return new this(event,path,event.name,root.parseSchema(event,path,extraProperties),extraParameters,event.unsupported||false,event.permissions||null);}
constructor(schema,path,name,type,extraParameters,unsupported,permissions){super(schema,path,name,extraParameters);this.type=type;this.unsupported=unsupported;this.permissions=permissions;}
checkListener(listener,context){let r=this.type.normalize(listener,context);if(r.error){this.throwError(context,"Invalid listener");}
return r.value;}
getDescriptor(path,context){let apiImpl=context.getImplementation(path.join("."),this.name);let addStub=(listener,...args)=>{listener=this.checkListener(listener,context);let actuals=this.checkParameters(args,context);apiImpl.addListener(listener,actuals);};let removeStub=listener=>{listener=this.checkListener(listener,context);apiImpl.removeListener(listener);};let hasStub=listener=>{listener=this.checkListener(listener,context);return apiImpl.hasListener(listener);};let obj=Cu.createObjectIn(context.cloneScope);Cu.exportFunction(addStub,obj,{defineAs:"addListener"});Cu.exportFunction(removeStub,obj,{defineAs:"removeListener"});Cu.exportFunction(hasStub,obj,{defineAs:"hasListener"});return{descriptor:{value:obj},revoke(){apiImpl.revoke();apiImpl=null;let unwrapped=ChromeUtils.waiveXrays(obj);delete unwrapped.addListener;delete unwrapped.removeListener;delete unwrapped.hasListener;},};}};const TYPES=Object.freeze(Object.assign(Object.create(null),{any:AnyType,array:ArrayType,boolean:BooleanType,function:FunctionType,integer:IntegerType,null:NullType,number:NumberType,object:ObjectType,string:StringType,}));const LOADERS={events:"loadEvent",functions:"loadFunction",properties:"loadProperty",types:"loadType",};class Namespace extends Map{constructor(root,name,path){super();this.root=root;this._lazySchemas=[];this.initialized=false;this.name=name;this.path=name?[...path,name]:[...path];this.superNamespace=null;this.permissions=null;this.allowedContexts=[];this.defaultContexts=[];}
addSchema(schema){this._lazySchemas.push(schema);for(let prop of["permissions","allowedContexts","defaultContexts"]){if(schema[prop]){this[prop]=schema[prop];}}
if(schema.$import){this.superNamespace=this.root.getNamespace(schema.$import);}}
init(){if(this.initialized){return;}
if(this.superNamespace){this._lazySchemas.unshift(...this.superNamespace._lazySchemas);}
for(let type of Object.keys(LOADERS)){this[type]=new DefaultMap(()=>[]);}
for(let schema of this._lazySchemas){for(let type of schema.types||[]){if(!type.unsupported){this.types.get(type.$extend||type.id).push(type);}}
for(let[name,prop]of Object.entries(schema.properties||{})){if(!prop.unsupported){this.properties.get(name).push(prop);}}
for(let fun of schema.functions||[]){if(!fun.unsupported){this.functions.get(fun.name).push(fun);}}
for(let event of schema.events||[]){if(!event.unsupported){this.events.get(event.name).push(event);}}}




for(let type of Object.keys(LOADERS)){for(let key of this[type].keys()){this.set(key,type);}}
this.initialized=true;if(DEBUG){for(let key of this.keys()){this.get(key);}}}
initKey(key,type){let loader=LOADERS[type];for(let schema of this[type].get(key)){this.set(key,this[loader](key,schema));}
return this.get(key);}
loadType(name,type){if("$extend"in type){return this.extendType(type);}
return this.root.parseSchema(type,this.path,["id"]);}
extendType(type){let targetType=this.get(type.$extend);if(targetType instanceof ObjectType){type.type="object";}else if(DEBUG){if(!targetType){throw new Error(`Internal error: Attempt to extend a nonexistent type ${type.$extend}`);}else if(!(targetType instanceof ChoiceType)){throw new Error(`Internal error: Attempt to extend a non-extensible type ${type.$extend}`);}}
let parsed=this.root.parseSchema(type,this.path,["$extend"]);if(DEBUG&&parsed.constructor!==targetType.constructor){throw new Error(`Internal error: Bad attempt to extend ${type.$extend}`);}
targetType.extend(parsed);return targetType;}
loadProperty(name,prop){if("$ref"in prop){if(!prop.unsupported){return new SubModuleProperty(this.root,prop,this.path,name,prop.$ref,prop.properties||{},prop.permissions||null);}}else if("value"in prop){return new ValueProperty(prop,name,prop.value);}else{
let type=this.root.parseSchema(prop,[this.name],["optional","permissions","writable"]);return new TypeProperty(prop,this.path,name,type,prop.writable||false,prop.permissions||null);}}
loadFunction(name,fun){return FunctionEntry.parseSchema(this.root,fun,this.path);}
loadEvent(name,event){return Event.parseSchema(this.root,event,this.path);}
injectInto(dest,context){for(let name of this.keys()){exportLazyProperty(dest,name,()=>{let entry=this.get(name);return context.getDescriptor(entry,dest,name,this.path,this);});}}
getDescriptor(path,context){let obj=Cu.createObjectIn(context.cloneScope);let ns=context.schemaRoot.getNamespace(this.path.join("."));ns.injectInto(obj,context);if(Object.keys(obj).length){return{descriptor:{value:obj},};}}
keys(){this.init();return super.keys();}*entries(){for(let key of this.keys()){yield[key,this.get(key)];}}
get(key){this.init();let value=super.get(key);

if(typeof value==="string"){value=this.initKey(key,value);}
return value;}
getNamespace(name,create=true){let subName;let idx=name.indexOf(".");if(idx>0){subName=name.slice(idx+1);name=name.slice(0,idx);}
let ns=super.get(name);if(!ns){if(!create){return null;}
ns=new Namespace(this.root,name,this.path);this.set(name,ns);}
if(subName){return ns.getNamespace(subName);}
return ns;}
getOwnNamespace(name){return this.getNamespace(name);}
has(key){this.init();return super.has(key);}}
class Namespaces extends Namespace{constructor(root,name,path,namespaces){super(root,name,path);this.namespaces=namespaces;}
injectInto(obj,context){for(let ns of this.namespaces){ns.injectInto(obj,context);}}}
class SchemaRoots extends Namespaces{constructor(root,bases){bases=bases.map(base=>base.rootSchema||base);super(null,"",[],bases);this.root=root;this.bases=bases;this._namespaces=new Map();}
_getNamespace(name,create){let results=[];for(let root of this.bases){let ns=root.getNamespace(name,create);if(ns){results.push(ns);}}
if(results.length==1){return results[0];}
if(results.length){return new Namespaces(this.root,name,name.split("."),results);}
return null;}
getNamespace(name,create){let ns=this._namespaces.get(name);if(!ns){ns=this._getNamespace(name,create);if(ns){this._namespaces.set(name,ns);}}
return ns;}*getNamespaces(name){for(let root of this.bases){yield*root.getNamespaces(name);}}}
class SchemaRoot extends Namespace{constructor(base,schemaJSON){super(null,"",[]);if(Array.isArray(base)){base=new SchemaRoots(this,base);}
this.root=this;this.base=base;this.schemaJSON=schemaJSON;}*getNamespaces(path){let name=path.join(".");let ns=this.getNamespace(name,false);if(ns){yield ns;}
if(this.base){yield*this.base.getNamespaces(name);}}
getNamespace(name,create=true){let ns=super.getNamespace(name,false);if(ns){return ns;}
ns=this.base&&this.base.getNamespace(name,false);if(ns){return ns;}
return create&&super.getNamespace(name,create);}
getOwnNamespace(name){return super.getNamespace(name);}
parseSchema(schema,path,extraProperties=[]){let allowedProperties=DEBUG&&new Set(extraProperties);if("choices"in schema){return ChoiceType.parseSchema(this,schema,path,allowedProperties);}else if("$ref"in schema){return RefType.parseSchema(this,schema,path,allowedProperties);}
let type=TYPES[schema.type];if(DEBUG){allowedProperties.add("type");if(!("type"in schema)){throw new Error(`Unexpected value for type: ${JSON.stringify(schema)}`);}
if(!type){throw new Error(`Unexpected type ${schema.type}`);}}
return type.parseSchema(this,schema,path,allowedProperties);}
parseSchemas(){for(let[key,schema]of this.schemaJSON.entries()){try{if(typeof schema.deserialize==="function"){schema=schema.deserialize(global,isParentProcess);


if(!isParentProcess){this.schemaJSON.set(key,schema);}}
this.loadSchema(schema);}catch(e){Cu.reportError(e);}}}
loadSchema(json){for(let namespace of json){this.getOwnNamespace(namespace.namespace).addSchema(namespace);}}
checkPermissions(namespace,wrapperFuncs){let ns=this.getNamespace(namespace);if(ns&&ns.permissions){return ns.permissions.some(perm=>wrapperFuncs.hasPermission(perm));}
return true;}
inject(dest,wrapperFuncs){let context=new InjectionContext(wrapperFuncs,this);this.injectInto(dest,context);}
injectInto(dest,context){
if(!context.injectedRoots.has(this)){context.injectedRoots.add(this);if(this.base){this.base.injectInto(dest,context);}
super.injectInto(dest,context);}}
normalize(obj,typeName,context){let[namespaceName,prop]=typeName.split(".");let ns=this.getNamespace(namespaceName);let type=ns.get(prop);let result=type.normalize(obj,new Context(context));if(result.error){return{error:forceString(result.error)};}
return result;}}
this.Schemas={initialized:false,REVOKE:Symbol("@@revoke"),
schemaJSON:new Map(),contentSchemaJSON:new Map(),privilegedSchemaJSON:new Map(),_rootSchema:null,get rootSchema(){if(!this.initialized){this.init();}
if(!this._rootSchema){this._rootSchema=new SchemaRoot(null,this.schemaJSON);this._rootSchema.parseSchemas();}
return this._rootSchema;},getNamespace(name){return this.rootSchema.getNamespace(name);},init(){if(this.initialized){return;}
this.initialized=true;if(Services.appinfo.processType==Services.appinfo.PROCESS_TYPE_CONTENT){let addSchemas=schemas=>{for(let[key,value]of schemas.entries()){this.schemaJSON.set(key,value);}};if(WebExtensionPolicy.isExtensionProcess||DEBUG){addSchemas(Services.cpmm.sharedData.get(KEY_PRIVILEGED_SCHEMAS));}
let schemas=Services.cpmm.sharedData.get(KEY_CONTENT_SCHEMAS);if(schemas){addSchemas(schemas);}}},_loadCachedSchemasPromise:null,loadCachedSchemas(){if(!this._loadCachedSchemasPromise){this._loadCachedSchemasPromise=StartupCache.schemas.getAll().then(results=>{return results;});}
return this._loadCachedSchemasPromise;},addSchema(url,schema,content=false){this.schemaJSON.set(url,schema);if(content){this.contentSchemaJSON.set(url,schema);}else{this.privilegedSchemaJSON.set(url,schema);}
if(this._rootSchema){throw new Error("Schema loaded after root schema populated");}},updateSharedSchemas(){let{sharedData}=Services.ppmm;sharedData.set(KEY_CONTENT_SCHEMAS,this.contentSchemaJSON);sharedData.set(KEY_PRIVILEGED_SCHEMAS,this.privilegedSchemaJSON);},fetch(url){return readJSONAndBlobbify(url);},processSchema(json){return blobbify(json);},async load(url,content=false){if(!isParentProcess){return;}
let schemaCache=await this.loadCachedSchemas();let blob=schemaCache.get(url)||(await StartupCache.schemas.get(url,readJSONAndBlobbify));if(!this.schemaJSON.has(url)){this.addSchema(url,blob,content);}},checkPermissions(namespace,wrapperFuncs){return this.rootSchema.checkPermissions(namespace,wrapperFuncs);},getPermissionNames(types=["Permission","OptionalPermission","PermissionNoPrompt","OptionalPermissionNoPrompt",]){const ns=this.getNamespace("manifest");let names=[];for(let typeName of types){for(let choice of ns.get(typeName).choices.filter(choice=>choice.enumeration)){names=names.concat(choice.enumeration);}}
return names.sort();},exportLazyGetter,inject(dest,wrapperFuncs){this.rootSchema.inject(dest,wrapperFuncs);},normalize(obj,typeName,context){return this.rootSchema.normalize(obj,typeName,context);},};