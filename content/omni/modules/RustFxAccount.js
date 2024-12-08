const EXPORTED_SYMBOLS=["RustFxAccount"];class RustFxAccount{constructor(options){let viaduct=Cc["@mozilla.org/toolkit/viaduct;1"].createInstance(Ci.mozIViaduct);viaduct.EnsureInitialized();this.bridge=Cc["@mozilla.org/services/firefox-accounts-bridge;1"].createInstance(Ci.mozIFirefoxAccountsBridge);if(typeof options=="string"){this.bridge.initFromJSON(options);}else{let props=Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);props.setProperty("content_url",options.fxaServer);props.setProperty("client_id",options.clientId);props.setProperty("redirect_uri",options.redirectUri);props.setProperty("token_server_url_override",options.tokenServerUrlOverride||"");this.bridge.init(props);}}
async stateJSON(){return promisify(this.bridge.stateJSON);}
async beginOAuthFlow(scopes,entryPoint="desktop"){return promisify(this.bridge.beginOAuthFlow,scopes,entryPoint);}
async completeOAuthFlow(code,state){return promisify(this.bridge.completeOAuthFlow,code,state);}
async getAccessToken(scope,ttl){return JSON.parse(await promisify(this.bridge.getAccessToken,scope,ttl));}
async getSessionToken(){return promisify(this.bridge.getSessionToken);}
async getAttachedClients(){return JSON.parse(await promisify(this.bridge.getAttachedClients));}
async checkAuthorizationStatus(){return JSON.parse(await promisify(this.bridge.checkAuthorizationStatus));}
async clearAccessTokenCache(){return promisify(this.bridge.clearAccessTokenCache);}
async disconnect(){return promisify(this.bridge.disconnect);}
async getProfile(ignoreCache){return JSON.parse(await promisify(this.bridge.getProfile,ignoreCache));}
async migrateFromSessionToken(sessionToken,kSync,kXCS,copySessionToken=false){return JSON.parse(await promisify(this.bridge.migrateFromSessionToken,sessionToken,kSync,kXCS,copySessionToken));}
async retryMigrateFromSessionToken(){return JSON.parse(await promisify(this.bridge.retryMigrateFromSessionToken));}
async isInMigrationState(){return promisify(this.bridge.isInMigrationState);}
async handleSessionTokenChange(sessionToken){return promisify(this.bridge.handleSessionTokenChange,sessionToken);}
async getTokenServerEndpointURL(){let url=await promisify(this.bridge.getTokenServerEndpointURL);return`${url}${url.endsWith("/") ? "" : "/"}1.0/sync/1.5`;}
async getConnectionSuccessURL(){return promisify(this.bridge.getConnectionSuccessURL);}
async getManageAccountURL(entrypoint){return promisify(this.bridge.getManageAccountURL,entrypoint);}
async getManageDevicesURL(entrypoint){return promisify(this.bridge.getManageDevicesURL,entrypoint);}
async fetchDevices(ignoreCache){return JSON.parse(await promisify(this.bridge.fetchDevices,ignoreCache));}
async setDeviceDisplayName(name){return promisify(this.bridge.setDeviceDisplayName,name);}
async handlePushMessage(payload){return JSON.parse(await promisify(this.bridge.handlePushMessage,payload));}
async pollDeviceCommands(){return JSON.parse(await promisify(this.bridge.pollDeviceCommands));}
async sendSingleTab(targetId,title,url){return promisify(this.bridge.sendSingleTab,targetId,title,url);}
async setDevicePushSubscription(endpoint,publicKey,authKey){return promisify(this.bridge.setDevicePushSubscription,endpoint,publicKey,authKey);}
async initializeDevice(name,deviceType,supportedCapabilities){return promisify(this.bridge.initializeDevice,name,deviceType,supportedCapabilities);}
async ensureCapabilities(supportedCapabilities){return promisify(this.bridge.ensureCapabilities,supportedCapabilities);}}
function promisify(func,...params){return new Promise((resolve,reject)=>{func(...params,{
handleSuccess:resolve,handleError(code,message){let error=new Error(message);error.result=code;reject(error);},});});}
const DeviceType=Object.freeze({desktop:"desktop",mobile:"mobile",tablet:"tablet",tv:"tv",vr:"vr",});const DeviceCapability=Object.freeze({sendTab:"sendTab",fromCommandName(str){switch(str){case"https://identity.mozilla.com/cmd/open-uri":return DeviceCapability.sendTab;}
throw new Error("Unknown device capability.");},});