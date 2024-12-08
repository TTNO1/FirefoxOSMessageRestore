const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"BrowserUtils","resource://gre/modules/BrowserUtils.jsm");ChromeUtils.defineModuleGetter(this,"WebViewChild","resource://gre/modules/WebViewChild.jsm");try{docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIBrowserChild).beginSendingWebProgressEventsToParent();}catch(e){
}

sendAsyncMessage("Content:BrowserChildReady",{time:Services.telemetry.msSystemNow(),});



addMessageListener("BrowserElement:CreateAboutBlank",message=>{if(!content.document||content.document.documentURI!="about:blank"){throw new Error("Can't create a content viewer unless on about:blank");}
let{principal,partitionedPrincipal}=message.data;principal=BrowserUtils.principalWithMatchingOA(principal,content.document.nodePrincipal);partitionedPrincipal=BrowserUtils.principalWithMatchingOA(partitionedPrincipal,content.document.partitionedPrincipal);docShell.createAboutBlankContentViewer(principal,partitionedPrincipal);});this.webViewChild=new WebViewChild();this.webViewChild.init(this);