
const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{ComponentUtils}=ChromeUtils.import("resource://gre/modules/ComponentUtils.jsm");ChromeUtils.defineModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");

function HelperAppLauncherDialog(){}
HelperAppLauncherDialog.prototype={classID:Components.ID("{710322af-e6ae-4b0c-b2c9-1474a87b077e}"),QueryInterface:ChromeUtils.generateQI([Ci.nsIHelperAppLauncherDialog]),show(aLauncher,aContext,aReason){aLauncher.MIMEInfo.preferredAction=Ci.nsIMIMEInfo.saveToDisk;aLauncher.promptForSaveDestination();},promptForSaveToFileAsync(aLauncher,aContext,aDefaultFile,aSuggestedFileExt,aForcePrompt){(async function(){let file=null;try{let defaultFolder=await Downloads.getPreferredDownloadsDirectory();let dir=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);dir.initWithPath(defaultFolder);file=this.validateLeafName(dir,aDefaultFile,aSuggestedFileExt);}catch(e){}
aLauncher.saveDestinationAvailable(file);}.bind(this)().then(null,Cu.reportError));},validateLeafName(aLocalFile,aLeafName,aFileExt){if(!(aLocalFile&&this.isUsableDirectory(aLocalFile))){return null;}

aLeafName=aLeafName.replace(/^\.+/,"");if(aLeafName==""){aLeafName="unnamed"+(aFileExt?"."+aFileExt:"");}
aLocalFile.append(aLeafName);this.makeFileUnique(aLocalFile);return aLocalFile;},makeFileUnique(aLocalFile){try{

let collisionCount=0;while(aLocalFile.exists()){collisionCount++;if(collisionCount==1){
 if(aLocalFile.leafName.match(/\.[^\.]{1,3}\.(gz|bz2|Z)$/i)){aLocalFile.leafName=aLocalFile.leafName.replace(/\.[^\.]{1,3}\.(gz|bz2|Z)$/i,"(2)$&");}else{aLocalFile.leafName=aLocalFile.leafName.replace(/(\.[^\.]*)?$/,"(2)$&");}}else{aLocalFile.leafName=aLocalFile.leafName.replace(/^(.*\()\d+\)/,"$1"+(collisionCount+1)+")");}}
aLocalFile.create(Ci.nsIFile.NORMAL_FILE_TYPE,0o600);}catch(e){dump("*** exception in makeFileUnique: "+e+"\n");if(e.result==Cr.NS_ERROR_FILE_ACCESS_DENIED){throw e;}
if(aLocalFile.leafName==""||aLocalFile.isDirectory()){aLocalFile.append("unnamed");if(aLocalFile.exists()){aLocalFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,0o600);}}}},isUsableDirectory(aDirectory){return(aDirectory.exists()&&aDirectory.isDirectory()&&aDirectory.isWritable());},};this.NSGetFactory=ComponentUtils.generateNSGetFactory([HelperAppLauncherDialog,]);