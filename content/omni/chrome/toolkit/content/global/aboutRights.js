var servicesDiv=document.getElementById("webservices-container");servicesDiv.style.display="none";function showServices(){servicesDiv.style.display="";}

let rightsIntro=document.querySelector("[data-l10n-id=rights-intro-point-5]")||document.querySelector("[data-l10n-id=rights-intro-point-5-unbranded]");rightsIntro.addEventListener("click",event=>{if(event.target.id=="showWebServices"){showServices();}});var disablingServicesDiv=document.getElementById("disabling-webservices-container");function showDisablingServices(){disablingServicesDiv.style.display="";}
if(disablingServicesDiv!=null){disablingServicesDiv.style.display="none";let rightsWebServices=document.querySelector("[data-l10n-id=rights-webservices]");rightsWebServices.addEventListener("click",event=>{if(event.target.id=="showDisablingWebServices"){showDisablingServices();}});}