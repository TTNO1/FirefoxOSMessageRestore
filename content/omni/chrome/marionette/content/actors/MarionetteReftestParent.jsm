("use strict");const EXPORTED_SYMBOLS=["MarionetteReftestParent"];class MarionetteReftestParent extends JSWindowActorParent{async reftestWait(url,useRemote){try{const isCorrectUrl=await this.sendQuery("MarionetteReftestParent:reftestWait",{url,useRemote,});return isCorrectUrl;}catch(e){if(e.name==="AbortError"){
return false;}
throw e;}}}