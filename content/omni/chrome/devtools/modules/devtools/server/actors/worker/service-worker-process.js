"use strict";const swm=Cc["@mozilla.org/serviceworkers/manager;1"].getService(Ci.nsIServiceWorkerManager);addMessageListener("serviceWorkerRegistration:start",message=>{const{data}=message;const array=swm.getAllRegistrations();for(let i=0;i<array.length;i++){const registration=array.queryElementAt(i,Ci.nsIServiceWorkerRegistrationInfo);



if(registration.scope===data.scope&&registration.activeWorker){
registration.activeWorker.attachDebugger();registration.activeWorker.detachDebugger();return;}}});