//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["MulticastDNS"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{clearTimeout,setTimeout}=ChromeUtils.import("resource://gre/modules/Timer.jsm");const{DNSPacket}=ChromeUtils.import("resource://gre/modules/DNSPacket.jsm");const{DNSRecord}=ChromeUtils.import("resource://gre/modules/DNSRecord.jsm");const{DNSResourceRecord}=ChromeUtils.import("resource://gre/modules/DNSResourceRecord.jsm");const{DNS_AUTHORITATIVE_ANSWER_CODES,DNS_CLASS_CODES,DNS_QUERY_RESPONSE_CODES,DNS_RECORD_TYPES,}=ChromeUtils.import("resource://gre/modules/DNSTypes.jsm");const NS_NETWORK_LINK_TOPIC="network:link-status-changed";let networkInfoService=Cc["@mozilla.org/network-info-service;1"].createInstance(Ci.nsINetworkInfoService);const DEBUG=true;const MDNS_MULTICAST_GROUP="224.0.0.251";const MDNS_PORT=5353;const DEFAULT_TTL=120;function debug(msg){dump("MulticastDNS: "+msg+"\n");}
function ServiceKey(svc){return(""+
svc.serviceType.length+"/"+
svc.serviceType+"|"+
svc.serviceName.length+"/"+
svc.serviceName+"|"+
svc.port);}
function TryGet(obj,name){try{return obj[name];}catch(err){return undefined;}}
function IsIpv4Address(addr){let parts=addr.split(".");if(parts.length!=4){return false;}
for(let part of parts){let partInt=Number.parseInt(part,10);if(partInt.toString()!=part){return false;}
if(partInt<0||partInt>=256){return false;}}
return true;}
class PublishedService{constructor(attrs){this.serviceType=attrs.serviceType.replace(/\.$/,"");this.serviceName=attrs.serviceName;this.domainName=TryGet(attrs,"domainName")||"local";this.address=TryGet(attrs,"address")||"0.0.0.0";this.port=attrs.port;this.serviceAttrs=_propertyBagToObject(TryGet(attrs,"attributes")||{});this.host=TryGet(attrs,"host");this.key=this.generateKey();this.lastAdvertised=undefined;this.advertiseTimer=undefined;}
equals(svc){return(this.port==svc.port&&this.serviceName==svc.serviceName&&this.serviceType==svc.serviceType);}
generateKey(){return ServiceKey(this);}
ptrMatch(name){return name==this.serviceType+"."+this.domainName;}
clearAdvertiseTimer(){if(!this.advertiseTimer){return;}
clearTimeout(this.advertiseTimer);this.advertiseTimer=undefined;}}
class MulticastDNS{constructor(){this._listeners=new Map();this._sockets=new Map();this._services=new Map();this._discovered=new Map();this._querySocket=undefined;this._broadcastReceiverSocket=undefined;this._broadcastTimer=undefined;this._networkLinkObserver={observe:(subject,topic,data)=>{DEBUG&&debug(NS_NETWORK_LINK_TOPIC+"("+
data+"); Clearing list of previously discovered services");this._discovered.clear();},};}
_attachNetworkLinkObserver(){if(this._networkLinkObserverTimeout){clearTimeout(this._networkLinkObserverTimeout);}
if(!this._isNetworkLinkObserverAttached){DEBUG&&debug("Attaching observer "+NS_NETWORK_LINK_TOPIC);Services.obs.addObserver(this._networkLinkObserver,NS_NETWORK_LINK_TOPIC);this._isNetworkLinkObserverAttached=true;}}
_detachNetworkLinkObserver(){if(this._isNetworkLinkObserverAttached){if(this._networkLinkObserverTimeout){clearTimeout(this._networkLinkObserverTimeout);}
this._networkLinkObserverTimeout=setTimeout(()=>{DEBUG&&debug("Detaching observer "+NS_NETWORK_LINK_TOPIC);Services.obs.removeObserver(this._networkLinkObserver,NS_NETWORK_LINK_TOPIC);this._isNetworkLinkObserverAttached=false;this._networkLinkObserverTimeout=null;},5000);}}
startDiscovery(aServiceType,aListener){DEBUG&&debug('startDiscovery("'+aServiceType+'")');let{serviceType}=_parseServiceDomainName(aServiceType);this._attachNetworkLinkObserver();this._addServiceListener(serviceType,aListener);try{this._query(serviceType+".local");aListener.onDiscoveryStarted(serviceType);}catch(e){DEBUG&&debug('startDiscovery("'+serviceType+'") FAILED: '+e);this._removeServiceListener(serviceType,aListener);aListener.onStartDiscoveryFailed(serviceType,Cr.NS_ERROR_FAILURE);}}
stopDiscovery(aServiceType,aListener){DEBUG&&debug('stopDiscovery("'+aServiceType+'")');let{serviceType}=_parseServiceDomainName(aServiceType);this._detachNetworkLinkObserver();this._removeServiceListener(serviceType,aListener);aListener.onDiscoveryStopped(serviceType);this._checkCloseSockets();}
resolveService(aServiceInfo,aListener){DEBUG&&debug("resolveService(): "+aServiceInfo.serviceName); setTimeout(()=>aListener.onServiceResolved(aServiceInfo));}
registerService(aServiceInfo,aListener){DEBUG&&debug("registerService(): "+aServiceInfo.serviceName);

this._getBroadcastReceiverSocket();for(let name of["port","serviceName","serviceType"]){if(!TryGet(aServiceInfo,name)){aListener.onRegistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE);throw new Error('Invalid nsIDNSServiceInfo; Missing "'+name+'"');}}
let publishedService;try{publishedService=new PublishedService(aServiceInfo);}catch(e){DEBUG&&debug("Error constructing PublishedService: "+e+" - "+e.stack);setTimeout(()=>aListener.onRegistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}
if(this._services.get(publishedService.key)){setTimeout(()=>aListener.onRegistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}

this._getSockets().then(sockets=>{if(publishedService.address!="0.0.0.0"&&!sockets.get(publishedService.address)){setTimeout(()=>aListener.onRegistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}
this._services.set(publishedService.key,publishedService);setTimeout(()=>aListener.onServiceRegistered(aServiceInfo));publishedService.advertiseTimer=setTimeout(()=>{this._advertiseService(publishedService.key,true);});});}
unregisterService(aServiceInfo,aListener){DEBUG&&debug("unregisterService(): "+aServiceInfo.serviceName);let serviceKey;try{serviceKey=ServiceKey(aServiceInfo);}catch(e){setTimeout(()=>aListener.onUnregistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}
let publishedService=this._services.get(serviceKey);if(!publishedService){setTimeout(()=>aListener.onUnregistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}
publishedService.clearAdvertiseTimer();if(!this._services.delete(serviceKey)){setTimeout(()=>aListener.onUnregistrationFailed(aServiceInfo,Cr.NS_ERROR_FAILURE));return;}
this._checkStartBroadcastTimer();this._checkCloseSockets();aListener.onServiceUnregistered(aServiceInfo);}
_respondToQuery(serviceKey,message){let address=message.fromAddr.address;let port=message.fromAddr.port;DEBUG&&debug("_respondToQuery(): key="+
serviceKey+", fromAddr="+
address+":"+
port);let publishedService=this._services.get(serviceKey);if(!publishedService){debug("_respondToQuery Could not find service (key="+serviceKey+")");return;}
DEBUG&&debug("_respondToQuery(): key="+serviceKey+": SENDING RESPONSE");this._advertiseServiceHelper(publishedService,{address,port});}
_advertiseService(serviceKey,firstAdv){DEBUG&&debug("_advertiseService(): key="+serviceKey);let publishedService=this._services.get(serviceKey);if(!publishedService){debug("_advertiseService Could not find service to advertise (key="+
serviceKey+")");return;}
publishedService.advertiseTimer=undefined;this._advertiseServiceHelper(publishedService,null).then(()=>{if(firstAdv){publishedService.advertiseTimer=setTimeout(()=>{this._advertiseService(serviceKey);},1000);}else{publishedService.lastAdvertised=Date.now();this._checkStartBroadcastTimer();}});}
_advertiseServiceHelper(svc,target){if(!target){target={address:MDNS_MULTICAST_GROUP,port:MDNS_PORT};}
return this._getSockets().then(sockets=>{sockets.forEach((socket,address)=>{if(svc.address=="0.0.0.0"||address==svc.address){let packet=this._makeServicePacket(svc,[address]);let data=packet.serialize();try{socket.send(target.address,target.port,data);}catch(err){DEBUG&&debug("Failed to send packet to "+target.address+":"+target.port);}}});});}
_cancelBroadcastTimer(){if(!this._broadcastTimer){return;}
clearTimeout(this._broadcastTimer);this._broadcastTimer=undefined;}
_checkStartBroadcastTimer(){DEBUG&&debug("_checkStartBroadcastTimer()");this._cancelBroadcastTimer();let now=Date.now();let bcastServices=[];let nextBcastWait=undefined;for(let[,publishedService]of this._services){
if(publishedService.lastAdvertised===undefined){continue;}
let msSinceAdv=now-publishedService.lastAdvertised;if(msSinceAdv>DEFAULT_TTL*1000*0.9){bcastServices.push(publishedService);continue;}
let nextAdvWait=DEFAULT_TTL*1000*0.95-msSinceAdv;if(nextBcastWait===undefined||nextBcastWait>nextAdvWait){nextBcastWait=nextAdvWait;}}
for(let svc of bcastServices){svc.advertiseTimer=setTimeout(()=>this._advertiseService(svc.key));}
if(nextBcastWait!==undefined){DEBUG&&debug("_checkStartBroadcastTimer(): Scheduling next check in "+
nextBcastWait+"ms");this._broadcastTimer=setTimeout(()=>this._checkStartBroadcastTimer(),nextBcastWait);}}
_query(name){DEBUG&&debug('query("'+name+'")');let packet=new DNSPacket();packet.setFlag("QR",DNS_QUERY_RESPONSE_CODES.QUERY); packet.addRecord("QD",new DNSRecord({name,recordType:DNS_RECORD_TYPES.PTR,classCode:DNS_CLASS_CODES.IN,cacheFlush:true,}));let data=packet.serialize();

this._getBroadcastReceiverSocket();this._getQuerySocket().then(querySocket=>{DEBUG&&debug('sending query on query socket ("'+name+'")');querySocket.send(MDNS_MULTICAST_GROUP,MDNS_PORT,data);});
setTimeout(()=>{DEBUG&&debug('announcing previously discovered services ("'+name+'")');let{serviceType}=_parseServiceDomainName(name);this._clearExpiredDiscoveries();this._discovered.forEach((discovery,key)=>{let serviceInfo=discovery.serviceInfo;if(serviceInfo.serviceType!==serviceType){return;}
let listeners=this._listeners.get(serviceInfo.serviceType)||[];listeners.forEach(listener=>{listener.onServiceFound(serviceInfo);});});});}
_clearExpiredDiscoveries(){this._discovered.forEach((discovery,key)=>{if(discovery.expireTime<Date.now()){this._discovered.delete(key);}});}
_handleQueryPacket(packet,message){packet.getRecords(["QD"]).forEach(record=>{if(record.classCode!==DNS_CLASS_CODES.IN&&record.classCode!==DNS_CLASS_CODES.ANY){return;}
if(record.recordType!==DNS_RECORD_TYPES.PTR&&record.recordType!==DNS_RECORD_TYPES.ANY){return;}
for(let[serviceKey,publishedService]of this._services){DEBUG&&debug("_handleQueryPacket: "+packet.toJSON());if(publishedService.ptrMatch(record.name)){this._respondToQuery(serviceKey,message);}}});}
_makeServicePacket(service,addresses){let packet=new DNSPacket();packet.setFlag("QR",DNS_QUERY_RESPONSE_CODES.RESPONSE);packet.setFlag("AA",DNS_AUTHORITATIVE_ANSWER_CODES.YES);let host=service.host||_hostname; let serviceDomainName=service.serviceName+"."+service.serviceType+".local"; packet.addRecord("AN",new DNSResourceRecord({name:service.serviceType+".local", recordType:DNS_RECORD_TYPES.PTR,data:serviceDomainName,})); packet.addRecord("AR",new DNSResourceRecord({name:serviceDomainName,recordType:DNS_RECORD_TYPES.SRV,classCode:DNS_CLASS_CODES.IN,cacheFlush:true,data:{priority:0,weight:0,port:service.port,target:host,},})); for(let address of addresses){packet.addRecord("AR",new DNSResourceRecord({name:host,recordType:DNS_RECORD_TYPES.A,data:address,}));} 
packet.addRecord("AR",new DNSResourceRecord({name:serviceDomainName,recordType:DNS_RECORD_TYPES.TXT,classCode:DNS_CLASS_CODES.IN,cacheFlush:true,data:service.serviceAttrs||{},}));return packet;}
_handleResponsePacket(packet,message){let services={};let hosts={};let srvRecords=packet.getRecords(["AN","AR"],DNS_RECORD_TYPES.SRV);let txtRecords=packet.getRecords(["AN","AR"],DNS_RECORD_TYPES.TXT);let ptrRecords=packet.getRecords(["AN","AR"],DNS_RECORD_TYPES.PTR);let aRecords=packet.getRecords(["AN","AR"],DNS_RECORD_TYPES.A);srvRecords.forEach(record=>{let data=record.data||{};services[record.name]={host:data.target,port:data.port,ttl:record.ttl,};});txtRecords.forEach(record=>{if(!services[record.name]){return;}
services[record.name].attributes=record.data;});aRecords.forEach(record=>{if(IsIpv4Address(record.data)){hosts[record.name]=record.data;}});ptrRecords.forEach(record=>{let name=record.data;if(!services[name]){return;}
let{host,port}=services[name];if(!host||!port){return;}
let{serviceName,serviceType,domainName}=_parseServiceDomainName(name);if(!serviceName||!serviceType||!domainName){return;}
let address=hosts[host];if(!address){return;}
let ttl=services[name].ttl||0;let serviceInfo={serviceName,serviceType,host,address,port,domainName,attributes:services[name].attributes||{},};this._onServiceFound(serviceInfo,ttl);});}
_onServiceFound(serviceInfo,ttl=0){let expireTime=Date.now()+ttl*1000;let key=serviceInfo.serviceName+"."+
serviceInfo.serviceType+"."+
serviceInfo.domainName+" @"+
serviceInfo.address+":"+
serviceInfo.port;
if(this._discovered.has(key)){this._discovered.get(key).expireTime=expireTime;return;}
this._discovered.set(key,{serviceInfo,expireTime,});let listeners=this._listeners.get(serviceInfo.serviceType)||[];listeners.forEach(listener=>{listener.onServiceFound(serviceInfo);});DEBUG&&debug("_onServiceFound()"+serviceInfo.serviceName);}
_getQuerySocket(){return new Promise((resolve,reject)=>{if(!this._querySocket){this._querySocket=_openSocket("0.0.0.0",0,{onPacketReceived:this._onPacketReceived.bind(this),onStopListening:this._onStopListening.bind(this),});}
resolve(this._querySocket);});}
_getBroadcastReceiverSocket(){return new Promise((resolve,reject)=>{if(!this._broadcastReceiverSocket){this._broadcastReceiverSocket=_openSocket("0.0.0.0",MDNS_PORT,{onPacketReceived:this._onPacketReceived.bind(this),onStopListening:this._onStopListening.bind(this),},"0.0.0.0");}
resolve(this._broadcastReceiverSocket);});}
_getSockets(){return new Promise(resolve=>{if(this._sockets.size>0){resolve(this._sockets);return;}
Promise.all([getAddresses(),getHostname()]).then(()=>{_addresses.forEach(address=>{let socket=_openSocket(address,MDNS_PORT,null);this._sockets.set(address,socket);});resolve(this._sockets);});});}
_checkCloseSockets(){if(this._sockets.size==0){return;}
if(this._listeners.size>0){return;}
if(this._services.size>0){return;}
this._closeSockets();}
_closeSockets(){this._sockets.forEach(socket=>socket.close());this._sockets.clear();}
_onPacketReceived(socket,message){let packet=DNSPacket.parse(message.rawData);switch(packet.getFlag("QR")){case DNS_QUERY_RESPONSE_CODES.QUERY:this._handleQueryPacket(packet,message);break;case DNS_QUERY_RESPONSE_CODES.RESPONSE:this._handleResponsePacket(packet,message);break;default:break;}}
_onStopListening(socket,status){DEBUG&&debug("_onStopListening() "+status);}
_addServiceListener(serviceType,listener){let listeners=this._listeners.get(serviceType);if(!listeners){listeners=[];this._listeners.set(serviceType,listeners);}
if(!listeners.find(l=>l===listener)){listeners.push(listener);}}
_removeServiceListener(serviceType,listener){let listeners=this._listeners.get(serviceType);if(!listeners){return;}
let index=listeners.findIndex(l=>l===listener);if(index>=0){listeners.splice(index,1);}
if(listeners.length===0){this._listeners.delete(serviceType);}}}
let _addresses;function getAddresses(){return new Promise((resolve,reject)=>{if(_addresses){resolve(_addresses);return;}
networkInfoService.listNetworkAddresses({onListedNetworkAddresses(aAddressArray){_addresses=aAddressArray.filter(address=>{return(!address.includes("%p2p")&&!address.includes(":")&& address!="127.0.0.1");});DEBUG&&debug("getAddresses(): "+_addresses);resolve(_addresses);},onListNetworkAddressesFailed(){DEBUG&&debug("getAddresses() FAILED!");resolve([]);},});});}
let _hostname;function getHostname(){return new Promise(resolve=>{if(_hostname){resolve(_hostname);return;}
networkInfoService.getHostname({onGotHostname(aHostname){_hostname=aHostname.replace(/\s/g,"-")+".local";DEBUG&&debug("getHostname(): "+_hostname);resolve(_hostname);},onGetHostnameFailed(){DEBUG&&debug("getHostname() FAILED");resolve("localhost");},});});}
function _parseServiceDomainName(serviceDomainName){let parts=serviceDomainName.split(".");let index=Math.max(parts.lastIndexOf("_tcp"),parts.lastIndexOf("_udp"));return{serviceName:parts.splice(0,index-1).join("."),serviceType:parts.splice(0,2).join("."),domainName:parts.join("."),};}
function _propertyBagToObject(propBag){let result={};if(propBag.QueryInterface){propBag.QueryInterface(Ci.nsIPropertyBag2);for(let prop of propBag.enumerator){result[prop.name]=prop.value.toString();}}else{for(let name in propBag){result[name]=propBag[name].toString();}}
return result;}
function _openSocket(addr,port,handler,multicastInterface){let socket=Cc["@mozilla.org/network/udp-socket;1"].createInstance(Ci.nsIUDPSocket);socket.init2(addr,port,Services.scriptSecurityManager.getSystemPrincipal(),true);if(handler){socket.asyncListen({onPacketReceived:handler.onPacketReceived,onStopListening:handler.onStopListening,});}
if(multicastInterface){socket.joinMulticast(MDNS_MULTICAST_GROUP,multicastInterface);}
return socket;}