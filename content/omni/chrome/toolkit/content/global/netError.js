




function getErrorCode(){var url=document.documentURI;var error=url.search(/e\=/);var duffUrl=url.search(/\&u\=/);return decodeURIComponent(url.slice(error+2,duffUrl));}
function getCSSClass(){var url=document.documentURI;var matches=url.match(/s\=([^&]+)\&/); if(!matches||matches.length<2){return"";} 
return decodeURIComponent(matches[1]);}
function getDescription(){var url=document.documentURI;var desc=url.search(/d\=/);
 if(desc==-1){return"";}
return decodeURIComponent(url.slice(desc+2));}
function retryThis(buttonEl){

try{location.reload();}catch(e){
}
buttonEl.disabled=true;}
function initPage(){var err=getErrorCode();
 var errTitle=document.getElementById("et_"+err);var errDesc=document.getElementById("ed_"+err);if(!errTitle||!errDesc){errTitle=document.getElementById("et_generic");errDesc=document.getElementById("ed_generic");}
var title=document.getElementById("errorTitleText");if(title){title.parentNode.replaceChild(errTitle,title); errTitle.id="errorTitleText";}
var sd=document.getElementById("errorShortDescText");if(sd){sd.textContent=getDescription();}
var ld=document.getElementById("errorLongDesc");if(ld){ld.parentNode.replaceChild(errDesc,ld); errDesc.id="errorLongDesc";} 
var errContainer=document.getElementById("errorContainer");errContainer.remove();var className=getCSSClass();if(className&&className!="expertBadCert"){ document.documentElement.className=className;

var favicon=document.getElementById("favicon");var faviconParent=favicon.parentNode;faviconParent.removeChild(favicon);favicon.setAttribute("href","chrome://global/skin/icons/"+className+"_favicon.png");faviconParent.appendChild(favicon);}
if(className=="expertBadCert"){showSecuritySection();}
if(err=="remoteXUL"){
document.getElementById("errorTryAgain").style.display="none";}
if(err=="cspBlocked"||err=="xfoBlocked"){
document.getElementById("errorTryAgain").style.display="none";}
if(err=="nssBadCert"){
document.getElementById("errorTryAgain").style.display="none";document.getElementById("errorPageContainer").setAttribute("class","certerror");addDomainErrorLink();}else{
 var secOverride=document.getElementById("securityOverrideDiv");secOverride.remove();}
if(err=="inadequateSecurityError"||err=="blockedByPolicy"){
document.getElementById("errorTryAgain").style.display="none";var container=document.getElementById("errorLongDesc");for(var span of container.querySelectorAll("span.hostname")){span.textContent=document.location.hostname;}}
if(document.getElementById("errorTryAgain").style.display!="none"){addAutofocus("errorTryAgain");}}
function showSecuritySection(){ document.getElementById("securityOverrideContent").style.display="";document.getElementById("securityOverrideLink").style.display="none";}
function addDomainErrorLink(){ var sd=document.getElementById("errorShortDescText");if(sd){var desc=getDescription();

 var re=/<a id="cert_domain_link" title="([^"]+)">/;var result=re.exec(desc);if(!result){return;} 
sd.textContent=""; sd.appendChild(document.createTextNode(desc.slice(0,result.index))); var anchorEl=document.createElement("a");anchorEl.setAttribute("id","cert_domain_link");anchorEl.setAttribute("title",result[1]);anchorEl.appendChild(document.createTextNode(result[1]));sd.appendChild(anchorEl);sd.appendChild(document.createTextNode(desc.slice(desc.indexOf("</a>")+"</a>".length)));}
var link=document.getElementById("cert_domain_link");if(!link){return;}
var okHost=link.getAttribute("title");var thisHost=document.location.hostname;var proto=document.location.protocol;

 okHost=okHost.replace(/^\*\./,"www.");if(endsWith(okHost,"."+thisHost)){link.href=proto+okHost;}
if(endsWith(thisHost,"."+okHost)){link.href=proto+okHost;}}
function endsWith(haystack,needle){return haystack.slice(-needle.length)==needle;}
function addAutofocus(buttonId,position="afterbegin"){if(window.top==window){var button=document.getElementById(buttonId);var parent=button.parentNode;button.remove();button.setAttribute("autofocus","true");parent.insertAdjacentElement(position,button);}}
let errorTryAgain=document.getElementById("errorTryAgain");errorTryAgain.addEventListener("click",function(){retryThis(this);});

initPage();