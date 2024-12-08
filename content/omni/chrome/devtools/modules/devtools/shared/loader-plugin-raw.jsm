"use strict";const{NetUtil}=ChromeUtils.import("resource://gre/modules/NetUtil.jsm");const requireRawId=function(id,require){const index=id.indexOf("!");const rawId=id.slice(index+1);let uri=require.resolve(rawId);


if(!id.endsWith(".js")&&uri.endsWith(".js")){uri=uri.slice(0,-3);}
const stream=NetUtil.newChannel({uri:NetUtil.newURI(uri,"UTF-8"),loadUsingSystemPrincipal:true,}).open();const count=stream.available();const data=NetUtil.readInputStreamToString(stream,count,{charset:"UTF-8",});stream.close();
return data;};const EXPORTED_SYMBOLS=["requireRawId"];