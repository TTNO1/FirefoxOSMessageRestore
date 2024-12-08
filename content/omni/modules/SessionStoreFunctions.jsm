//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
function UpdateSessionStore(aBrowser,aBrowsingContext,aFlushId,aIsFinal,aEpoch,aData,aCollectSHistory){return SessionStoreFuncInternal.updateSessionStore(aBrowser,aBrowsingContext,aFlushId,aIsFinal,aEpoch,aData,aCollectSHistory);}
var EXPORTED_SYMBOLS=["UpdateSessionStore"];var SessionStoreFuncInternal={ _formDataId:[],_formDataIdValue:[],_formDataXPath:[],_formDataXPathValue:[],updateFormData:function SSF_updateFormData(aType,aData){let idArray=this._formDataId;let valueArray=this._formDataIdValue;if(aType=="XPath"){idArray=this._formDataXPath;valueArray=this._formDataXPathValue;}
let valueIdx=aData.valueIdx;for(let i=0;i<aData.id.length;i++){idArray.push(aData.id[i]);if(aData.type[i]=="singleSelect"){valueArray.push({selectedIndex:aData.selectedIndex[valueIdx[i]],value:aData.selectVal[valueIdx[i]],});}else if(aData.type[i]=="file"){valueArray.push({type:"file",fileList:aData.strVal.slice(valueIdx[i],valueIdx[++i]),});}else if(aData.type[i]=="multipleSelect"){valueArray.push(aData.strVal.slice(valueIdx[i],valueIdx[++i]));}else if(aData.type[i]=="string"){valueArray.push(aData.strVal[valueIdx[i]]);}else if(aData.type[i]=="bool"){valueArray.push(aData.boolVal[valueIdx[i]]);}}},composeInputChildren:function SSF_composeInputChildren(aInnerHTML,aUrl,aCurrentIdIdx,aNumId,aCurrentXpathIdx,aNumXPath,aDescendants,aStartIndex,aNumberOfDescendants){let children=[];let lastIndexOfNonNullbject=-1;for(let i=0;i<aNumberOfDescendants;i++){let currentIndex=aStartIndex+i;let obj={};let objWithData=false; if(aUrl[currentIndex]){obj.url=aUrl[currentIndex];objWithData=true;if(aInnerHTML[currentIndex]){ obj.innerHTML=aInnerHTML[currentIndex];}
if(aNumId[currentIndex]){let idObj={};for(let idx=0;idx<aNumId[currentIndex];idx++){idObj[this._formDataId[aCurrentIdIdx+idx]]=this._formDataIdValue[aCurrentIdIdx+idx];}
obj.id=idObj;}
 
if(obj.url=="about:sessionrestore"||obj.url=="about:welcomeback"){obj.id.sessionData=JSON.parse(obj.id.sessionData);}
if(aNumXPath[currentIndex]){let xpathObj={};for(let idx=0;idx<aNumXPath[currentIndex];idx++){xpathObj[this._formDataXPath[aCurrentXpathIdx+idx]]=this._formDataXPathValue[aCurrentXpathIdx+idx];}
obj.xpath=xpathObj;}} 
if(aDescendants[currentIndex]){let descendantsTree=this.composeInputChildren(aInnerHTML,aUrl,aCurrentIdIdx+aNumId[currentIndex],aNumId,aCurrentXpathIdx+aNumXPath[currentIndex],aNumXPath,aDescendants,currentIndex+1,aDescendants[currentIndex]);i+=aDescendants[currentIndex];if(descendantsTree){obj.children=descendantsTree;}}
if(objWithData){lastIndexOfNonNullbject=children.length;children.push(obj);}else{children.push(null);}}
if(lastIndexOfNonNullbject==-1){return null;}
return children.slice(0,lastIndexOfNonNullbject+1);},updateInput:function SSF_updateInput(aSessionData,aDescendants,aInnerHTML,aUrl,aNumId,aNumXPath){let obj={};let objWithData=false;if(aUrl[0]){obj.url=aUrl[0];if(aInnerHTML[0]){ obj.innerHTML=aInnerHTML[0];objWithData=true;}
if(aNumId[0]){let idObj={};for(let i=0;i<aNumId[0];i++){idObj[this._formDataId[i]]=this._formDataIdValue[i];}
obj.id=idObj;objWithData=true;}
 
if(obj.url=="about:sessionrestore"||obj.url=="about:welcomeback"){obj.id.sessionData=JSON.parse(obj.id.sessionData);}
if(aNumXPath[0]){let xpathObj={};for(let i=0;i<aNumXPath[0];i++){xpathObj[this._formDataXPath[i]]=this._formDataXPathValue[i];}
obj.xpath=xpathObj;objWithData=true;}}
if(aDescendants.length>1){let descendantsTree=this.composeInputChildren(aInnerHTML,aUrl,aNumId[0],aNumId,aNumXPath[0],aNumXPath,aDescendants,1,aDescendants[0]);if(descendantsTree){obj.children=descendantsTree;objWithData=true;}}
if(objWithData){aSessionData.formdata=obj;}else{aSessionData.formdata=null;}},composeChildren:function SSF_composeScrollPositionsData(aPositions,aDescendants,aStartIndex,aNumberOfDescendants){let children=[];let lastIndexOfNonNullbject=-1;for(let i=0;i<aNumberOfDescendants;i++){let currentIndex=aStartIndex+i;let obj={};let objWithData=false;if(aPositions[currentIndex]){obj.scroll=aPositions[currentIndex];objWithData=true;}
if(aDescendants[currentIndex]){let descendantsTree=this.composeChildren(aPositions,aDescendants,currentIndex+1,aDescendants[currentIndex]);i+=aDescendants[currentIndex];if(descendantsTree){obj.children=descendantsTree;objWithData=true;}}
if(objWithData){lastIndexOfNonNullbject=children.length;children.push(obj);}else{children.push(null);}}
if(lastIndexOfNonNullbject==-1){return null;}
return children.slice(0,lastIndexOfNonNullbject+1);},updateScrollPositions:function SSF_updateScrollPositions(aPositions,aDescendants){let obj={};let objWithData=false;if(aPositions[0]){obj.scroll=aPositions[0];objWithData=true;}
if(aPositions.length>1){let children=this.composeChildren(aPositions,aDescendants,1,aDescendants[0]);if(children){obj.children=children;objWithData=true;}}
if(objWithData){return obj;}
return null;},updateStorage:function SSF_updateStorage(aOrigins,aKeys,aValues){let data={};for(let i=0;i<aOrigins.length;i++){

if(aKeys[i]==""){while(aOrigins[i+1]==aOrigins[i]){i++;}
data[aOrigins[i]]=null;}else{let hostData={};hostData[aKeys[i]]=aValues[i];while(aOrigins[i+1]==aOrigins[i]){i++;hostData[aKeys[i]]=aValues[i];}
data[aOrigins[i]]=hostData;}}
if(aOrigins.length){return data;}
return null;},updateSessionStore:function SSF_updateSessionStore(aBrowser,aBrowsingContext,aFlushId,aIsFinal,aEpoch,aData,aCollectSHistory){let currentData={};if(aData.docShellCaps!=undefined){currentData.disallow=aData.docShellCaps?aData.docShellCaps:null;}
if(aData.isPrivate!=undefined){currentData.isPrivate=aData.isPrivate;}
if(aData.positions!=undefined&&aData.positionDescendants!=undefined){currentData.scroll=this.updateScrollPositions(aData.positions,aData.positionDescendants);}
if(aData.id!=undefined){this.updateFormData("id",aData.id);}
if(aData.xpath!=undefined){this.updateFormData("XPath",aData.xpath);}
if(aData.inputDescendants!=undefined){this.updateInput(currentData,aData.inputDescendants,aData.innerHTML,aData.url,aData.numId,aData.numXPath);}
if(aData.isFullStorage!=undefined){let storage=this.updateStorage(aData.storageOrigins,aData.storageKeys,aData.storageValues);if(aData.isFullStorage){currentData.storage=storage;}else{currentData.storagechange=storage;}}
this._formDataId=[];this._formDataIdValue=[];this._formDataXPath=[];this._formDataXPathValue=[];},};