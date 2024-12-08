"use strict";const{TYPES:{CSS_CHANGE},}=require("devtools/server/actors/resources/index");const TrackChangeEmitter=require("devtools/server/actors/utils/track-change-emitter");class CSSChangeWatcher{constructor(){this.onTrackChange=this.onTrackChange.bind(this);}
async watch(targetActor,{onAvailable}){this.onAvailable=onAvailable;TrackChangeEmitter.on("track-change",this.onTrackChange);}
onTrackChange(change){change.resourceType=CSS_CHANGE;this.onAvailable([change]);}
destroy(){TrackChangeEmitter.off("track-change",this.onTrackChange);}}
module.exports=CSSChangeWatcher;