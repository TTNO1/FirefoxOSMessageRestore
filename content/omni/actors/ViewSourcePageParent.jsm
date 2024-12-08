
ChromeUtils.defineModuleGetter(this,"Services","resource://gre/modules/Services.jsm");const BUNDLE_URL="chrome://global/locale/viewSource.properties";var EXPORTED_SYMBOLS=["ViewSourcePageParent"];class ViewSourcePageParent extends JSWindowActorParent{constructor(){super();this.lastLineFound=null;}
receiveMessage(message){let data=message.data;switch(message.name){case"ViewSource:PromptAndGoToLine":this.promptAndGoToLine();break;case"ViewSource:GoToLine:Success":this.onGoToLineSuccess(data.lineNumber);break;case"ViewSource:GoToLine:Failed":this.onGoToLineFailed();break;case"ViewSource:StoreWrapping":this.storeWrapping(data.state);break;case"ViewSource:StoreSyntaxHighlighting":this.storeSyntaxHighlighting(data.state);break;}}
get bundle(){if(this._bundle){return this._bundle;}
return(this._bundle=Services.strings.createBundle(BUNDLE_URL));}
promptAndGoToLine(){let input={value:this.lastLineFound};let window=Services.wm.getMostRecentWindow(null);let ok=Services.prompt.prompt(window,this.bundle.GetStringFromName("goToLineTitle"),this.bundle.GetStringFromName("goToLineText"),input,null,{value:0});if(!ok){return;}
let line=parseInt(input.value,10);if(!(line>0)){Services.prompt.alert(window,this.bundle.GetStringFromName("invalidInputTitle"),this.bundle.GetStringFromName("invalidInputText"));this.promptAndGoToLine();}else{this.goToLine(line);}}
goToLine(lineNumber){this.sendAsyncMessage("ViewSource:GoToLine",{lineNumber});}
onGoToLineSuccess(lineNumber){
this.lastLineFound=lineNumber;}
onGoToLineFailed(){let window=Services.wm.getMostRecentWindow(null);Services.prompt.alert(window,this.bundle.GetStringFromName("outOfRangeTitle"),this.bundle.GetStringFromName("outOfRangeText"));this.promptAndGoToLine();}
storeWrapping(state){Services.prefs.setBoolPref("view_source.wrap_long_lines",state);}
storeSyntaxHighlighting(state){Services.prefs.setBoolPref("view_source.syntax_highlight",state);}}