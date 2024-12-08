//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
if(!this.ctypes){this.EXPORTED_SYMBOLS=["libcutils","netHelpers"];const{ctypes}=ChromeUtils.import("resource://gre/modules/ctypes.jsm");this.ctypes=ctypes;}
const SYSTEM_PROPERTY_KEY_MAX=32;const SYSTEM_PROPERTY_VALUE_MAX=92;

var DEBUG;this.libcutils=(function(){let lib;try{lib=ctypes.open("libcutils.so");}catch(ex){if(DEBUG){dump("Could not load libcutils.so. Using fake propdb.\n");}
let fake_propdb=Object.create(null);return{property_get(key,defaultValue){if(key in fake_propdb){return fake_propdb[key];}
return defaultValue===undefined?null:defaultValue;},property_set(key,value){fake_propdb[key]=value;},};}
let c_property_get=lib.declare("property_get",ctypes.default_abi,ctypes.int, ctypes.char.ptr, ctypes.char.ptr, ctypes.char.ptr); let c_property_set=lib.declare("property_set",ctypes.default_abi,ctypes.int, ctypes.char.ptr, ctypes.char.ptr); let c_value_buf=ctypes.char.array(SYSTEM_PROPERTY_VALUE_MAX)();return{property_get(key,defaultValue){if(defaultValue===undefined){defaultValue=null;}
c_property_get(key,c_value_buf,defaultValue);return c_value_buf.readString();},property_set(key,value){let rv=c_property_set(key,value);if(rv){throw Error(`libcutils.property_set("${key}", "${value}") failed with error ${rv}`);}},ext_lcd_notify(){let rv=c_property_set('fih.extlcd.initialized','1');if(rv){throw Error(`libcutils.property_set("fih.extlcd.initialized", "1") failed with error ${rv}`);}},};})();this.netHelpers={swap32(n){return((((n>>24)&0xff)<<0)|(((n>>16)&0xff)<<8)|(((n>>8)&0xff)<<16)|(((n>>0)&0xff)<<24));},ntohl(n){return this.swap32(n);},htonl(n){return this.swap32(n);},ipToString(ip){return(((ip>>0)&0xff)+"."+
((ip>>8)&0xff)+"."+
((ip>>16)&0xff)+"."+
((ip>>24)&0xff));},stringToIP(string){if(!string){return null;}
let ip=0;let start,end=-1;for(let i=0;i<4;i++){start=end+1;end=string.indexOf(".",start);if(end==-1){end=string.length;}
let num=parseInt(string.slice(start,end),10);if(isNaN(num)){return null;}
ip|=num<<(i*8);}
return ip;},makeMask(len){let mask=0;for(let i=0;i<len;++i){mask|=0x80000000>>i;}
return this.ntohl(mask);},getMaskLength(mask){let len=0;let netmask=this.ntohl(mask);while(netmask&0x80000000){len++;netmask=netmask<<1;}
return len;},};