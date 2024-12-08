//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";this.EXPORTED_SYMBOLS=["PermissionsManagerChild"];class PermissionsManagerChild extends JSWindowActorChild{getPermission(params){return this.sendQuery("PermissionsManager:GetPermission",params);}
isExplicit(params){return this.sendQuery("PermissionsManager:IsExplicit",params);}
addPermission(params){return this.sendQuery("PermissionsManager:AddPermission",params);}}