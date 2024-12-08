"use strict";class DragDropAddonInstaller extends HTMLElement{connectedCallback(){window.addEventListener("drop",this);}
disconnectedCallback(){window.removeEventListener("drop",this);}
canInstallFromEvent(e){let types=e.dataTransfer.types;return(types.includes("text/uri-list")||types.includes("text/x-moz-url")||types.includes("application/x-moz-file"));}
handleEvent(e){if(!XPINSTALL_ENABLED){return;}
if(e.type=="drop"&&this.canInstallFromEvent(e)){this.onDrop(e);}}
async onDrop(e){e.preventDefault();let dataTransfer=e.dataTransfer;let browser=getBrowserElement();let urls=[];for(let i=0;i<dataTransfer.mozItemCount;i++){let url=dataTransfer.mozGetDataAt("text/uri-list",i);if(!url){url=dataTransfer.mozGetDataAt("text/x-moz-url",i);}
if(url){url=url.split("\n")[0];}else{let file=dataTransfer.mozGetDataAt("application/x-moz-file",i);if(file){url=Services.io.newFileURI(file).spec;}}
if(url){urls.push(url);}}
for(let url of urls){let install=await AddonManager.getInstallForURL(url,{telemetryInfo:{source:"about:addons",method:"drag-and-drop",},});AddonManager.installAddonFromAOM(browser,document.documentURIObject,install);}}}
customElements.define("drag-drop-addon-installer",DragDropAddonInstaller);