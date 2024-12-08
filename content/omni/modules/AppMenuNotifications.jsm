//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["AppMenuNotifications"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");function AppMenuNotification(id,mainAction,secondaryAction,options={}){this.id=id;this.mainAction=mainAction;this.secondaryAction=secondaryAction;this.options=options;this.dismissed=this.options.dismissed||false;}
var AppMenuNotifications={_notifications:[],_hasInitialized:false,get notifications(){return Array.from(this._notifications);},_lazyInit(){if(!this._hasInitialized){Services.obs.addObserver(this,"xpcom-shutdown");Services.obs.addObserver(this,"appMenu-notifications-request");}},uninit(){Services.obs.removeObserver(this,"xpcom-shutdown");Services.obs.removeObserver(this,"appMenu-notifications-request");},observe(subject,topic,status){switch(topic){case"xpcom-shutdown":this.uninit();break;case"appMenu-notifications-request":if(this._notifications.length){Services.obs.notifyObservers(null,"appMenu-notifications","init");}
break;}},get activeNotification(){if(this._notifications.length){const doorhanger=this._notifications.find(n=>!n.dismissed&&!n.options.badgeOnly);return doorhanger||this._notifications[0];}
return null;},showNotification(id,mainAction,secondaryAction,options={}){let notification=new AppMenuNotification(id,mainAction,secondaryAction,options);let existingIndex=this._notifications.findIndex(n=>n.id==id);if(existingIndex!=-1){this._notifications.splice(existingIndex,1);}

if(!options.badgeOnly&&!options.dismissed){this._notifications.forEach(n=>{n.dismissed=true;});}


this._notifications.unshift(notification);this._lazyInit();this._updateNotifications();return notification;},showBadgeOnlyNotification(id){return this.showNotification(id,null,null,{badgeOnly:true});},removeNotification(id){let notifications;if(typeof id=="string"){notifications=this._notifications.filter(n=>n.id==id);}else{ notifications=this._notifications.filter(n=>id.test(n.id));}



if(!notifications.length){return;}
notifications.forEach(n=>{this._removeNotification(n);});this._updateNotifications();},dismissNotification(id){let notifications;if(typeof id=="string"){notifications=this._notifications.filter(n=>n.id==id);}else{ notifications=this._notifications.filter(n=>id.test(n.id));}
notifications.forEach(n=>{n.dismissed=true;if(n.options.onDismissed){n.options.onDismissed();}});this._updateNotifications();},callMainAction(win,notification,fromDoorhanger){let action=notification.mainAction;this._callAction(win,notification,action,fromDoorhanger);},callSecondaryAction(win,notification){let action=notification.secondaryAction;this._callAction(win,notification,action,true);},_callAction(win,notification,action,fromDoorhanger){let dismiss=true;if(action){try{action.callback(win,fromDoorhanger);}catch(error){Cu.reportError(error);}
dismiss=action.dismiss;}
if(dismiss){notification.dismissed=true;}else{this._removeNotification(notification);}
this._updateNotifications();},_removeNotification(notification){let notifications=this._notifications;if(!notifications){return;}
var index=notifications.indexOf(notification);if(index==-1){return;} 
notifications.splice(index,1);},_updateNotifications(){Services.obs.notifyObservers(null,"appMenu-notifications","update");},};