"use strict";
function getFilteredStorageEvents(updates,storageType){const filteredUpdate=Object.create(null);for(const updateType in updates){if(updates[updateType][storageType]){if(!filteredUpdate[updateType]){filteredUpdate[updateType]={};}
filteredUpdate[updateType][storageType]=updates[updateType][storageType];}}
return Object.keys(filteredUpdate).length>0?filteredUpdate:null;}

function makeStorageLegacyListener(storageKey,storageType){return async function({targetList,targetType,targetFront,onAvailable,onUpdated,onDestroyed,}){if(!targetFront.isTopLevel){return;}
const storageFront=await targetFront.getFront("storage");const storageTypes=await storageFront.listStores(); const storage=storageTypes[storageKey]; if(!storage){return;}
storage.resourceType=storageType;storage.resourceKey=storageKey;
 storage.resourceId=storageType;onAvailable([storage]); storageFront.on("stores-update",response=>{response=getFilteredStorageEvents(response,storageKey);if(!response){return;}
onUpdated([{resourceId:storageType,resourceType:storageType,resourceKey:storageKey,changed:response.changed,added:response.added,deleted:response.deleted,},]);}); storageFront.on("stores-cleared",response=>{const cleared=response[storageKey];if(!cleared){return;}
onDestroyed([{resourceId:storageType,resourceType:storageType,resourceKey:storageKey,clearedHostsOrPaths:cleared,},]);});};}
module.exports={makeStorageLegacyListener};