class WifiManager{constructor(){this.manager=navigator.b2g.wifiManager;}
get enabled(){return this.manager.enabled;}
enable(){if(this.manager.enabled){return Promise.resolve();}
return new Promise((resolve,reject)=>{let req=this.manager.setWifiEnabled(true);req.onsuccess=resolve;req.onerror=event=>{reject(event.target.error);};});}
disable(){if(!this.manager.enabled){return Promise.resolve();}
return new Promise((resolve,reject)=>{let req=this.manager.setWifiEnabled(false);req.onsuccess=resolve;req.onerror=event=>{reject(event.target.error);};});}
getNetworks(){return new Promise((resolve,reject)=>{let req=this.manager.getNetworks();req.onsuccess=()=>{resolve(req.result);};req.onerror=()=>{console.log(`WIFI Failed to find wifi networks: ${req.error}`);reject(req.error);};});}
associate(network){return this.manager.associate(network);}
observeScanResult(callback){this.manager.onscanresult=r=>{callback(r.scanResult);};}}
function elem(name,content){let element=document.createElement(name);element.textContent=content;return element;}
function onNetworks(networks,manager){console.log(`WIFI Found ${networks.length} wifi networks:`);let list=document.getElementById("network-list");list.innerHTML="";networks.forEach((network,index)=>{if(!network.ssid.trim().length){return;}
console.log(`WIFI ${network.ssid} ${network.security}`);let item=elem("li",`${network.ssid} `);if(network.security.trim().toUpperCase().includes("OPEN")){let button=elem("button","Connect");button.setAttribute("id",`wifi-network-${index}-connect`);item.appendChild(button);}else{item.textContent=`${network.ssid} (${network.security})`;}
list.appendChild(item);});networks.forEach((network,index)=>{if(!network.ssid.trim().length||!network.security.trim().toUpperCase().includes("OPEN")){return;}
document.getElementById(`wifi-network-${index}-connect`).onclick=()=>{console.log(`WIFI Trying to associate with ${network.ssid}`);console.log(`WIFI object is ${network} ${network.ssid} ${network.security}`);manager.associate(network).then(result=>{console.log(`WIFI associate with ${network.ssid}: ${result}`);},error=>{console.error(`WIFI Error: ${error}`);});};});}
function startWifi(){let manager=new WifiManager();console.log(`WIFI starting, enabled? ${manager.enabled}`);manager.enable().catch(error=>{console.error(`WIFI Error: ${error}`);});return manager;}
document.addEventListener("DOMContentLoaded",()=>{let manager=startWifi();manager.observeScanResult(networks=>{onNetworks(networks,manager);});document.getElementById("scan-wifi").onclick=()=>{manager.getNetworks().then(networks=>{onNetworks(networks,manager);},error=>{console.log(`WIFI error: ${error}`);});};},{once:true});