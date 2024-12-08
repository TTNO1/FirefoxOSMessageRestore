"use strict";class Framerate{constructor(targetActor){this.targetActor=targetActor;this._contentWin=targetActor.window;this._onRefreshDriverTick=this._onRefreshDriverTick.bind(this);this._onGlobalCreated=this._onGlobalCreated.bind(this);this.targetActor.on("window-ready",this._onGlobalCreated);}
destroy(conn){this.targetActor.off("window-ready",this._onGlobalCreated);this.stopRecording();}
startRecording(){if(this._recording){return;}
this._recording=true;this._ticks=[];this._startTime=this.targetActor.docShell.now();this._rafID=this._contentWin.requestAnimationFrame(this._onRefreshDriverTick);}
stopRecording(beginAt=0,endAt=Number.MAX_SAFE_INTEGER){if(!this._recording){return[];}
const ticks=this.getPendingTicks(beginAt,endAt);this.cancelRecording();return ticks;}
cancelRecording(){this._contentWin.cancelAnimationFrame(this._rafID);this._recording=false;this._ticks=null;this._rafID=-1;}
isRecording(){return!!this._recording;}
getPendingTicks(beginAt=0,endAt=Number.MAX_SAFE_INTEGER){if(!this._ticks){return[];}
return this._ticks.filter(e=>e>=beginAt&&e<=endAt);}
_onRefreshDriverTick(){if(!this._recording){return;}
this._rafID=this._contentWin.requestAnimationFrame(this._onRefreshDriverTick);this._ticks.push(this.targetActor.docShell.now()-this._startTime);}
_onGlobalCreated(win){if(this._recording){this._contentWin.cancelAnimationFrame(this._rafID);this._rafID=this._contentWin.requestAnimationFrame(this._onRefreshDriverTick);}}}
exports.Framerate=Framerate;