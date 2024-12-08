"use strict";const{TYPES:{DOCUMENT_EVENT},}=require("devtools/server/actors/resources/index");const{DocumentEventsListener,}=require("devtools/server/actors/webconsole/listeners/document-events");class DocumentEventWatcher{async watch(targetActor,{onAvailable}){if(isWorker){return;}
const onDocumentEvent=(name,time)=>{onAvailable([{resourceType:DOCUMENT_EVENT,name,time,},]);};this.listener=new DocumentEventsListener(targetActor);this.listener.on("*",onDocumentEvent);this.listener.listen();}
destroy(){if(this.listener){this.listener.destroy();}}}
module.exports=DocumentEventWatcher;