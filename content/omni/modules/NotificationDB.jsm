//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=[];const DEBUG=false;function debug(s){dump("-*- NotificationDB component: "+s+"\n");}
const{OS}=ChromeUtils.import("resource://gre/modules/osfile.jsm");ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const NOTIFICATION_STORE_DIR=OS.Constants.Path.profileDir;const NOTIFICATION_STORE_PATH=OS.Path.join(NOTIFICATION_STORE_DIR,"notificationstore.json");const kMessages=["Notification:Save","Notification:Delete","Notification:GetAll","Notification:GetAllCrossOrigin",];var NotificationDB={ _shutdownInProgress:false,init(){if(this._shutdownInProgress){return;}
this.notifications={};this.byTag={};this.loaded=false;this.tasks=[]; this.runningTask=null;Services.obs.addObserver(this,"xpcom-shutdown");this.registerListeners();},registerListeners(){for(let message of kMessages){Services.ppmm.addMessageListener(message,this);}},unregisterListeners(){for(let message of kMessages){Services.ppmm.removeMessageListener(message,this);}},observe(aSubject,aTopic,aData){if(DEBUG){debug("Topic: "+aTopic);}
if(aTopic=="xpcom-shutdown"){this._shutdownInProgress=true;Services.obs.removeObserver(this,"xpcom-shutdown");this.unregisterListeners();}},filterNonAppNotifications(notifications){for(let origin in notifications){let persistentNotificationCount=0;for(let id in notifications[origin]){if(notifications[origin][id].serviceWorkerRegistrationScope){persistentNotificationCount++;}else{delete notifications[origin][id];}}
if(persistentNotificationCount==0){if(DEBUG){debug("Origin "+origin+" is not linked to an app manifest, deleting.");}
delete notifications[origin];}}
return notifications;},load(){var promise=OS.File.read(NOTIFICATION_STORE_PATH,{encoding:"utf-8"});return promise.then(data=>{if(data.length>0){
try{this.notifications=this.filterNonAppNotifications(JSON.parse(data));}catch(e){debug("Recreate a store due to fail to preprocessing notification data. Error: "+
e);this.loaded=true;this.notifications={};return this.createStore();}} 
if(this.notifications){for(var origin in this.notifications){this.byTag[origin]={};for(var id in this.notifications[origin]){var curNotification=this.notifications[origin][id];if(curNotification.tag){this.byTag[origin][curNotification.tag]=curNotification;}}}}
this.loaded=true;return true;},reason=>{this.loaded=true;return this.createStore();});},createStore(){var promise=OS.File.makeDir(NOTIFICATION_STORE_DIR,{ignoreExisting:true,});return promise.then(this.createFile.bind(this));},createFile(){return OS.File.writeAtomic(NOTIFICATION_STORE_PATH,"");},save(){var data=JSON.stringify(this.notifications);return OS.File.writeAtomic(NOTIFICATION_STORE_PATH,data,{encoding:"utf-8",});},ensureLoaded(){if(!this.loaded){return this.load();}
return Promise.resolve();},receiveMessage(message){if(DEBUG){debug("Received message:"+message.name);}

function returnMessage(name,data){try{message.target.sendAsyncMessage(name,data);}catch(e){if(DEBUG){debug("Return message failed, "+name);}}}
switch(message.name){case"Notification:GetAll":this.queueTask("getall",message.data).then(function(notifications){returnMessage("Notification:GetAll:Return:OK",{requestID:message.data.requestID,origin:message.data.origin,notifications,});}).catch(function(error){returnMessage("Notification:GetAll:Return:KO",{requestID:message.data.requestID,origin:message.data.origin,errorMsg:error,});});break;case"Notification:GetAllCrossOrigin":this.queueTask("getallaccrossorigin",message.data).then(function(notifications){returnMessage("Notification:GetAllCrossOrigin:Return:OK",{notifications,});}).catch(function(error){returnMessage("Notification:GetAllCrossOrigin:Return:KO",{errorMsg:error,});});break;case"Notification:Save":this.queueTask("save",message.data).then(function(){returnMessage("Notification:Save:Return:OK",{requestID:message.data.requestID,});}).catch(function(error){returnMessage("Notification:Save:Return:KO",{requestID:message.data.requestID,errorMsg:error,});});break;case"Notification:Delete":this.queueTask("delete",message.data).then(function(){returnMessage("Notification:Delete:Return:OK",{requestID:message.data.requestID,});}).catch(function(error){returnMessage("Notification:Delete:Return:KO",{requestID:message.data.requestID,errorMsg:error,});});break;default:if(DEBUG){debug("Invalid message name"+message.name);}}},queueTask(operation,data){if(DEBUG){debug("Queueing task: "+operation);}
var defer={};this.tasks.push({operation,data,defer,});var promise=new Promise(function(resolve,reject){defer.resolve=resolve;defer.reject=reject;});if(!this.runningTask){if(DEBUG){debug("Task queue was not running, starting now...");}
this.runNextTask();}
return promise;},runNextTask(){if(this.tasks.length===0){if(DEBUG){debug("No more tasks to run, queue depleted");}
this.runningTask=null;return;}
this.runningTask=this.tasks.shift();this.ensureLoaded().then(()=>{var task=this.runningTask;switch(task.operation){case"getall":return this.taskGetAll(task.data);case"getallaccrossorigin":return this.taskGetAllCrossOrigin();case"save":return this.taskSave(task.data);case"delete":return this.taskDelete(task.data);default:return Promise.reject(new Error(`Found a task with unknown operation ${task.operation}`));}}).then(payload=>{if(DEBUG){debug("Finishing task: "+this.runningTask.operation);}
this.runningTask.defer.resolve(payload);}).catch(err=>{if(DEBUG){debug("Error while running "+this.runningTask.operation+": "+err);}
this.runningTask.defer.reject(err);}).then(()=>{this.runNextTask();});},taskGetAll(data){if(DEBUG){debug("Task, getting all");}
var origin=data.origin;var notifications=[];if(this.notifications[origin]){if(data.tag){let n;if((n=this.byTag[origin][data.tag])){notifications.push(n);}}else{for(var i in this.notifications[origin]){notifications.push(this.notifications[origin][i]);}}}
return Promise.resolve(notifications);},taskGetAllCrossOrigin(){if(DEBUG){debug("Task, getting all whatever origin");}
var notifications=[];for(var origin in this.notifications){if(!this.notifications[origin]){continue;}
for(var i in this.notifications[origin]){var notification=this.notifications[origin][i];

if(!("alertName"in notification)){continue;}
notification.origin=origin;notifications.push(notification);}}
return Promise.resolve(notifications);},taskSave(data){if(DEBUG){debug("Task, saving");}
var origin=data.origin;var notification=data.notification;if(!this.notifications[origin]){this.notifications[origin]={};this.byTag[origin]={};}
if(notification.tag){var oldNotification=this.byTag[origin][notification.tag];if(oldNotification){delete this.notifications[origin][oldNotification.id];}
this.byTag[origin][notification.tag]=notification;}
this.notifications[origin][notification.id]=notification;return this.save();},taskDelete(data){if(DEBUG){debug("Task, deleting");}
var origin=data.origin;var id=data.id;if(!this.notifications[origin]){if(DEBUG){debug("No notifications found for origin: "+origin);}
return Promise.resolve();}
var oldNotification=this.notifications[origin][id];if(!oldNotification){if(DEBUG){debug("No notification found with id: "+id);}
return Promise.resolve();}
if(oldNotification.tag){delete this.byTag[origin][oldNotification.tag];}
delete this.notifications[origin][id];return this.save();},};NotificationDB.init();