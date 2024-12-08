"use strict";const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyGlobalGetters(this,["URL"]);XPCOMUtils.defineLazyGetter(this,"log",()=>{let{ConsoleAPI}=ChromeUtils.import("resource://gre/modules/Console.jsm");return new ConsoleAPI({prefix:"JsonSchemaValidator.jsm",
maxLogLevel:"error",});});var EXPORTED_SYMBOLS=["JsonSchemaValidator"];class JsonSchemaValidator{static validate(value,schema,{allowArrayNonMatchingItems=false,allowExplicitUndefinedProperties=false,allowNullAsUndefinedProperties=false,allowExtraProperties=false,}={}){let validator=new JsonSchemaValidator({allowArrayNonMatchingItems,allowExplicitUndefinedProperties,allowNullAsUndefinedProperties,allowExtraProperties,});return validator.validate(value,schema);}
constructor({allowArrayNonMatchingItems=false,allowExplicitUndefinedProperties=false,allowNullAsUndefinedProperties=false,allowExtraProperties=false,}={}){this.allowArrayNonMatchingItems=allowArrayNonMatchingItems;this.allowExplicitUndefinedProperties=allowExplicitUndefinedProperties;this.allowNullAsUndefinedProperties=allowNullAsUndefinedProperties;this.allowExtraProperties=allowExtraProperties;}
validate(value,schema){return this._validateRecursive(value,schema,[],{rootValue:value,rootSchema:schema,});} 
_validateRecursive(param,properties,keyPath,state){log.debug(`checking @${param}@ for type ${properties.type}`);if(Array.isArray(properties.type)){log.debug("type is an array");


for(const type of properties.type){let typeProperties=Object.assign({},properties,{type});log.debug(`checking subtype ${type}`);let result=this._validateRecursive(param,typeProperties,keyPath,state);if(result.valid){return result;}} 
return{valid:false,error:new JsonSchemaValidatorError({message:`The value '${valueToString(param)}' does not match any type in `+
valueToString(properties.type),value:param,keyPath,state,}),};}
switch(properties.type){case"boolean":case"number":case"integer":case"string":case"URL":case"URLorEmpty":case"origin":case"null":{let result=this._validateSimpleParam(param,properties.type,keyPath,state);if(!result.valid){return result;}
if(properties.enum&&typeof result.parsedValue!=="boolean"){if(!properties.enum.includes(param)){return{valid:false,error:new JsonSchemaValidatorError({message:`The value '${valueToString(param)}' is not one of the `+`enumerated values ${valueToString(properties.enum)}`,value:param,keyPath,state,}),};}}
return result;}
case"array":if(!Array.isArray(param)){log.error("Array expected but not received");return{valid:false,error:new JsonSchemaValidatorError({message:`The value '${valueToString(param)}' does not match the `+`expected type 'array'`,value:param,keyPath,state,}),};}
let parsedArray=[];for(let i=0;i<param.length;i++){let item=param[i];log.debug(`in array, checking @${item}@ for type ${properties.items.type}`);let result=this._validateRecursive(item,properties.items,keyPath.concat(i),state);if(!result.valid){if(("strict"in properties&&properties.strict)||(!("strict"in properties)&&!this.allowArrayNonMatchingItems)){return result;}
continue;}
parsedArray.push(result.parsedValue);}
return{valid:true,parsedValue:parsedArray};case"object":{if(typeof param!="object"||!param){log.error("Object expected but not received");return{valid:false,error:new JsonSchemaValidatorError({message:`The value '${valueToString(param)}' does not match the `+`expected type 'object'`,value:param,keyPath,state,}),};}
let parsedObj={};let patternProperties=[];if("patternProperties"in properties){for(let prop of Object.keys(properties.patternProperties||{})){let pattern;try{pattern=new RegExp(prop);}catch(e){throw new Error(`Internal error: Invalid property pattern ${prop}`);}
patternProperties.push({pattern,schema:properties.patternProperties[prop],});}}
if(properties.required){for(let required of properties.required){if(!(required in param)){log.error(`Object is missing required property ${required}`);return{valid:false,error:new JsonSchemaValidatorError({message:`Object is missing required property '${required}'`,value:param,keyPath,state,}),};}}}
for(let item of Object.keys(param)){let schema;if("properties"in properties&&properties.properties.hasOwnProperty(item)){schema=properties.properties[item];}else if(patternProperties.length){for(let patternProperty of patternProperties){if(patternProperty.pattern.test(item)){schema=patternProperty.schema;break;}}}
if(!schema){let allowExtraProperties=!properties.strict&&this.allowExtraProperties;if(allowExtraProperties){continue;}
return{valid:false,error:new JsonSchemaValidatorError({message:`Object has unexpected property '${item}'`,value:param,keyPath,state,}),};}
let allowExplicitUndefinedProperties=!properties.strict&&this.allowExplicitUndefinedProperties;let allowNullAsUndefinedProperties=!properties.strict&&this.allowNullAsUndefinedProperties;let isUndefined=(!allowExplicitUndefinedProperties&&!(item in param))||(allowExplicitUndefinedProperties&&param[item]===undefined)||(allowNullAsUndefinedProperties&&param[item]===null);if(isUndefined){continue;}
let result=this._validateRecursive(param[item],schema,keyPath.concat(item),state);if(!result.valid){return result;}
parsedObj[item]=result.parsedValue;}
return{valid:true,parsedValue:parsedObj};}
case"JSON":if(typeof param=="object"){return{valid:true,parsedValue:param};}
try{let json=JSON.parse(param);if(typeof json!="object"){log.error("JSON was not an object");return{valid:false,error:new JsonSchemaValidatorError({message:`JSON was not an object: ${valueToString(param)}`,value:param,keyPath,state,}),};}
return{valid:true,parsedValue:json};}catch(e){log.error("JSON string couldn't be parsed");return{valid:false,error:new JsonSchemaValidatorError({message:`JSON string could not be parsed: ${valueToString(
                param
              )}`,value:param,keyPath,state,}),};}}
return{valid:false,error:new JsonSchemaValidatorError({message:`Invalid schema property type: ${valueToString(
          properties.type
        )}`,value:param,keyPath,state,}),};}
_validateSimpleParam(param,type,keyPath,state){let valid=false;let parsedParam=param;let error=undefined;switch(type){case"boolean":if(typeof param=="boolean"){valid=true;}else if(typeof param=="number"&&(param==0||param==1)){valid=true;parsedParam=!!param;}
break;case"number":case"string":valid=typeof param==type;break; case"integer":valid=typeof param=="number";break;case"null":valid=param===null;break;case"origin":if(typeof param!="string"){break;}
try{parsedParam=new URL(param);if(parsedParam.protocol=="file:"){ valid=true;}else{let pathQueryRef=parsedParam.pathname+parsedParam.hash;if(pathQueryRef!="/"&&pathQueryRef!=""){log.error(`Ignoring parameter "${param}" - origin was expected but received full URL.`);valid=false;}else{valid=true;}}}catch(ex){valid=false;}
break;case"URL":case"URLorEmpty":if(typeof param!="string"){break;}
if(type=="URLorEmpty"&&param===""){valid=true;break;}
try{parsedParam=new URL(param);valid=true;}catch(ex){if(!param.startsWith("http")){log.error(`Ignoring parameter "${param}" - scheme (http or https) must be specified.`);}
valid=false;}
break;}
if(!valid&&!error){error=new JsonSchemaValidatorError({message:`The value '${valueToString(param)}' does not match the expected `+`type '${type}'`,value:param,keyPath,state,});}
let result={valid,parsedValue:parsedParam,};if(error){result.error=error;}
return result;}}
class JsonSchemaValidatorError extends Error{constructor({message,value,keyPath,state}={},...args){if(keyPath.length){message+=". "+`The invalid value is property '${keyPath.join(".")}' in `+
JSON.stringify(state.rootValue);}
super(message,...args);this.name="JsonSchemaValidatorError";this.rootValue=state.rootValue;this.rootSchema=state.rootSchema;this.invalidPropertyNameComponents=keyPath;this.invalidValue=value;}}
function valueToString(value){try{return JSON.stringify(value);}catch(ex){}
return String(value);}