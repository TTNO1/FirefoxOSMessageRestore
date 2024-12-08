//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["DownloadPaths"];const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");ChromeUtils.defineModuleGetter(this,"AppConstants","resource://gre/modules/AppConstants.jsm");XPCOMUtils.defineLazyGetter(this,"gConvertToSpaceRegExp",()=>{
switch(AppConstants.platform){
case"android":return/[\x00-\x1f\x7f-\x9f:*?|"<>;,+=\[\]]+/g;
    case "win":
      return /[\x00-\x1f\x7f-\x9f:*?|]+/g;
    default:
      return /[\x00-\x1f\x7f-\x9f:]+/g;
  }
  /* eslint-enable no-control-regex */
});

var DownloadPaths = {
  /**
   * Sanitizes an arbitrary string for use as the local file name of a download.
   * The input is often a document title or a manually edited name. The output
   * can be an empty string if the input does not include any valid character.
   *
   * The length of the resulting string is not limited, because restrictions
   * apply to the full path name after the target folder has been added.
   *
   * Splitting the base name and extension to add a counter or to identify the
   * file type should only be done after the sanitization process, because it
   * can alter the final part of the string or remove leading dots.
   *
   * Runs of slashes and backslashes are replaced with an underscore.
   *
   * On Windows, the angular brackets `<` and `>` are replaced with parentheses,
   * and double quotes are replaced with single quotes.
   *
   * Runs of control characters are replaced with a space. On Mac, colons are
   * also included in this group. On Windows, stars, question marks, and pipes
   * are additionally included. On Android, semicolons, commas, plus signs,
   * equal signs, and brackets are additionally included.
   *
   * Leading and trailing dots and whitespace are removed on all platforms. This
   * avoids the accidental creation of hidden files on Unix and invalid or
   * inaccessible file names on Windows. These characters are not removed when
   * located at the end of the base name or at the beginning of the extension.
   *
   * @param {string} leafName The full leaf name to sanitize
   * @param {boolean} [compressWhitespaces] Whether consecutive whitespaces
   *        should be compressed.
   */
  sanitize(leafName, { compressWhitespaces = true } = {}) {
    if (AppConstants.platform == "win") {
      leafName = leafName
        .replace(/</g, "(")
        .replace(/>/g, ")")
        .replace(/"/g,"'");}
leafName=leafName.replace(/[\\/]+/g,"_").replace(/[\u200e\u200f\u202a-\u202e]/g,"").replace(gConvertToSpaceRegExp," ");if(compressWhitespaces){leafName=leafName.replace(/\s{2,}/g," ");}
return leafName.replace(/^[\s\u180e.]+|[\s\u180e.]+$/g,"");},createNiceUniqueFile(templateFile){let curFile=templateFile.clone().QueryInterface(Ci.nsIFile);let[base,ext]=DownloadPaths.splitBaseNameAndExtension(curFile.leafName);for(let i=1;i<10000&&curFile.exists();i++){curFile.leafName=base+"("+i+")"+ext;}





curFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,0o644);return curFile;},splitBaseNameAndExtension(leafName){
let[,base,ext]=/(.*?)(\.[A-Z0-9]{1,3}\.(?:gz|bz2|Z)|\.[^.]*)?$/i.exec(leafName);return[base,ext||""];},};