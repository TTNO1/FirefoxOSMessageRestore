"use strict";const EventEmitter=require("devtools/shared/event-emitter");class TrackChangeEmitter{constructor(){EventEmitter.decorate(this);}
trackChange(change){this.emit("track-change",change);}}
module.exports=new TrackChangeEmitter();