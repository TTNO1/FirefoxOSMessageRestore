"use strict";class ChannelMap{constructor(){this.weakMap=new WeakMap();this.refMap=new Map();this.finalizationGroup=new FinalizationRegistry(ChannelMap.cleanup);}
static cleanup({refMap,id}){refMap.delete(id);}
set(channel,value){const ref=new WeakRef(channel);this.weakMap.set(channel,{value,ref});this.refMap.set(channel.channelId,ref);this.finalizationGroup.register(channel,{refMap:this.refMap,id:channel.channelId,},ref);}
getChannelById(channelId){const ref=this.refMap.get(channelId);const key=ref?ref.deref():null;if(!key){return null;}
const channelInfo=this.weakMap.get(key);return channelInfo?channelInfo.value:null;}
delete(channel){const entry=this.weakMap.get(channel);if(!entry){return false;}
this.weakMap.delete(channel);this.refMap.delete(channel.channelId);this.finalizationGroup.unregister(entry.ref);return true;}}
exports.ChannelMap=ChannelMap;