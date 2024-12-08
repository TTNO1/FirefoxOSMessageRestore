//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const gKeyValueService=Cc["@mozilla.org/key-value-service;1"].getService(Ci.nsIKeyValueService);const EXPORTED_SYMBOLS=["KeyValueService"];function promisify(fn,...args){return new Promise((resolve,reject)=>{fn({resolve,reject},...args);});}
class KeyValueService{static async getOrCreate(dir,name){return new KeyValueDatabase(await promisify(gKeyValueService.getOrCreate,dir,name));}}
class KeyValueDatabase{constructor(database){this.database=database;}
put(key,value){return promisify(this.database.put,key,value);}
writeMany(pairs){if(!pairs){throw new Error("writeMany(): unexpected argument.");}
let entries;if(pairs instanceof Map||pairs instanceof Array||typeof pairs[Symbol.iterator]==="function"){try{

const map=pairs instanceof Map?pairs:new Map(pairs);entries=Array.from(map,([key,value])=>({key,value}));}catch(error){throw new Error("writeMany(): unexpected argument.");}}else if(typeof pairs==="object"){entries=Array.from(Object.entries(pairs),([key,value])=>({key,value,}));}else{throw new Error("writeMany(): unexpected argument.");}
if(entries.length){return promisify(this.database.writeMany,entries);}
return Promise.resolve();}
has(key){return promisify(this.database.has,key);}
get(key,defaultValue){return promisify(this.database.get,key,defaultValue);}
delete(key){return promisify(this.database.delete,key);}
clear(){return promisify(this.database.clear);}
async enumerate(from_key,to_key){return new KeyValueEnumerator(await promisify(this.database.enumerate,from_key,to_key));}}
class KeyValueEnumerator{constructor(enumerator){this.enumerator=enumerator;}
hasMoreElements(){return this.enumerator.hasMoreElements();}
getNext(){return this.enumerator.getNext();}*[Symbol.iterator](){while(this.enumerator.hasMoreElements()){yield this.enumerator.getNext();}}}