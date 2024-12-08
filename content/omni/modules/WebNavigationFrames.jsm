//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const EXPORTED_SYMBOLS=["WebNavigationFrames"];function iterateDocShellTree(docShell){return docShell.getAllDocShellsInSubtree(docShell.typeContent,docShell.ENUMERATE_FORWARDS);}
function getFrameId(bc){if(!BrowsingContext.isInstance(bc)){bc=bc.browsingContext;}
return bc.parent?bc.id:0;}
function getParentFrameId(bc){if(!BrowsingContext.isInstance(bc)){bc=bc.browsingContext;}
return bc.parent?getFrameId(bc.parent):-1;}
function convertDocShellToFrameDetail(docShell){let{browsingContext,domWindow:window}=docShell;return{frameId:getFrameId(browsingContext),parentFrameId:getParentFrameId(browsingContext),url:window.location.href,};}
function findDocShell(frameId,rootDocShell){for(let docShell of iterateDocShellTree(rootDocShell)){if(frameId==getFrameId(docShell.browsingContext)){return docShell;}}
return null;}
var WebNavigationFrames={iterateDocShellTree,findDocShell,getFrame(docShell,frameId){let result=findDocShell(frameId,docShell);if(result){return convertDocShellToFrameDetail(result);}
return null;},getFrameId,getParentFrameId,getAllFrames(docShell){return Array.from(iterateDocShellTree(docShell),convertDocShellToFrameDetail);},};