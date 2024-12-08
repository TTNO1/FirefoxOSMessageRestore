const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");const{Log}=ChromeUtils.import("chrome://marionette/content/log.js");XPCOMUtils.defineLazyGetter(this,"logger",Log.get);this.EXPORTED_SYMBOLS=["MarionetteHelper"];class MarionetteHelper{constructor(contentBrowser){ this.browser=contentBrowser;this.content=contentBrowser.contentWindow;}
get tabs(){let web_views=Array.from(this.content.document.querySelectorAll("web-view")); web_views.push(this.browser);return web_views;}
get selectedTab(){let web_views=Array.from(this.content.document.querySelectorAll("web-view"));let active=web_views.find(tab=>{return tab.active;});if(!active&&web_views.length){active=web_views[0];}
return active;}
set selectedTab(tab){logger.info(`MarionetteHelper set selectedTab to ${tab}`);let current=this.selectedTab;current.active=false;tab.active=true;}}
this.MarionetteHelper=MarionetteHelper;