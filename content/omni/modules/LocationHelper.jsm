//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["LocationHelper"];function isPublic(ap){let mask="_nomap";let result=ap.ssid.indexOf(mask,ap.ssid.length-mask.length);return result==-1;}
function sort(a,b){return b.signal-a.signal;}
function encode(ap){return{macAddress:ap.mac,signalStrength:ap.signal};}
class LocationHelper{static formatWifiAccessPoints(accessPoints){return accessPoints.filter(isPublic).sort(sort).map(encode);}
static distance(p1,p2){let rad=x=>(x*Math.PI)/180;let R=6371e3;let lat=rad(p2.lat-p1.lat);let lng=rad(p2.lng-p1.lng);let a=Math.sin(lat/2)*Math.sin(lat/2)+
Math.cos(rad(p1.lat))*Math.cos(rad(p2.lat))*Math.sin(lng/2)*Math.sin(lng/2);let c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return R*c;}}