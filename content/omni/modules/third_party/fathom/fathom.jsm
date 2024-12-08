"use strict";this.EXPORTED_SYMBOLS=["fathom"];(function(global,factory){typeof exports==='object'&&typeof module!=='undefined'?factory(exports):typeof define==='function'&&define.amd?define(['exports'],factory):(global=global||self,factory(global.fathom={}));}(this,(function(exports){'use strict';class CycleError extends Error{}
function identity(x){return x;}
function best(iterable,by,isBetter){let bestSoFar,bestKeySoFar;let isFirst=true;forEach(function(item){const key=by(item);if(isBetter(key,bestKeySoFar)||isFirst){bestSoFar=item;bestKeySoFar=key;isFirst=false;}},iterable);if(isFirst){throw new Error('Tried to call best() on empty iterable');}
return bestSoFar;}
function max(iterable,by=identity){return best(iterable,by,(a,b)=>a>b);}
function maxes(iterable,by=identity){let bests=[];let bestKeySoFar;let isFirst=true;forEach(function(item){const key=by(item);if(key>bestKeySoFar||isFirst){bests=[item];bestKeySoFar=key;isFirst=false;}else if(key===bestKeySoFar){bests.push(item);}},iterable);return bests;}
function min(iterable,by=identity){return best(iterable,by,(a,b)=>a<b);}
function sum(iterable){let total;let isFirst=true;forEach(function assignOrAdd(addend){if(isFirst){total=addend;isFirst=false;}else{total+=addend;}},iterable);return total;}
function length(iterable){let num=0; for(let item of iterable){num++;}
return num;}
function*walk(element,shouldTraverse){yield element;for(let child of element.childNodes){if(shouldTraverse(child)){for(let w of walk(child,shouldTraverse)){yield w;}}}}
const blockTags=new Set(['ADDRESS','BLOCKQUOTE','BODY','CENTER','DIR','DIV','DL','FIELDSET','FORM','H1','H2','H3','H4','H5','H6','HR','ISINDEX','MENU','NOFRAMES','NOSCRIPT','OL','P','PRE','TABLE','UL','DD','DT','FRAMESET','LI','TBODY','TD','TFOOT','TH','THEAD','TR','HTML']);function isBlock(element){return blockTags.has(element.tagName);}
function*inlineTexts(element,shouldTraverse=element=>true){
for(let child of walk(element,element=>!(isBlock(element)||element.tagName==='SCRIPT'&&element.tagName==='STYLE')&&shouldTraverse(element))){if(child.nodeType===child.TEXT_NODE){



yield child.textContent;}}}
function inlineTextLength(element,shouldTraverse=element=>true){return sum(map(text=>collapseWhitespace(text).length,inlineTexts(element,shouldTraverse)));}
function collapseWhitespace(str){return str.replace(/\s{2,}/g,' ');}
function linkDensity(fnode,inlineLength){if(inlineLength===undefined){inlineLength=inlineTextLength(fnode.element);}
const lengthWithoutLinks=inlineTextLength(fnode.element,element=>element.tagName!=='A');return(inlineLength-lengthWithoutLinks)/inlineLength;}
function isWhitespace(element){return(element.nodeType===element.TEXT_NODE&&element.textContent.trim().length===0);}
function setDefault(map,key,defaultMaker){if(map.has(key)){return map.get(key);}
const defaultValue=defaultMaker();map.set(key,defaultValue);return defaultValue;}
function getDefault(map,key,defaultMaker){if(map.has(key)){return map.get(key);}
return defaultMaker();}
function*reversed(array){for(let i=array.length-1;i>=0;i--){yield array[i];}}
function toposort(nodes,nodesThatNeed){const ret=[];const todo=new Set(nodes);const inProgress=new Set();function visit(node){if(inProgress.has(node)){throw new CycleError('The graph has a cycle.');}
if(todo.has(node)){inProgress.add(node);for(let needer of nodesThatNeed(node)){visit(needer);}
inProgress.delete(node);todo.delete(node);ret.push(node);}}
while(todo.size>0){visit(first(todo));}
return ret;}
class NiceSet extends Set{pop(){for(let v of this.values()){this.delete(v);return v;}
throw new Error('Tried to pop from an empty NiceSet.');}
extend(otherSet){for(let item of otherSet){this.add(item);}
return this;}
toString(){return'{'+Array.from(this).join(', ')+'}';}}
function first(iterable){for(let i of iterable){return i;}}
function rootElement(element){return element.ownerDocument.documentElement;}
function numberOfMatches(regex,haystack){return(haystack.match(regex)||[]).length;}
function page(scoringFunction){function wrapper(fnode){const scoreAndTypeAndNote=scoringFunction(fnode);if(scoreAndTypeAndNote.score!==undefined){scoreAndTypeAndNote.element=rootElement(fnode.element);}
return scoreAndTypeAndNote;}
return wrapper;}
function domSort(fnodes){function compare(a,b){const element=a.element;const position=element.compareDocumentPosition(b.element);if(position&element.DOCUMENT_POSITION_FOLLOWING){return-1;}else if(position&element.DOCUMENT_POSITION_PRECEDING){return 1;}else{return 0;}}
return Array.from(fnodes).sort(compare);}
function isDomElement(thing){return thing.nodeName!==undefined;}
function toDomElement(fnodeOrElement){return isDomElement(fnodeOrElement)?fnodeOrElement:fnodeOrElement.element;}
function attributesMatch(element,predicate,attrs=[]){const attributes=attrs.length===0?Array.from(element.attributes).map(a=>a.name):attrs;for(let i=0;i<attributes.length;i++){const attr=element.getAttribute(attributes[i]); if(attr&&((Array.isArray(attr)&&attr.some(predicate))||predicate(attr))){return true;}}
return false;}
function*ancestors(element){yield element;let parent;while((parent=element.parentNode)!==null&&parent.nodeType===parent.ELEMENT_NODE){yield parent;element=parent;}}
function sigmoid(x){return 1/(1+Math.exp(-x));}
function isVisible(fnodeOrElement){const element=toDomElement(fnodeOrElement);const elementRect=element.getBoundingClientRect();const elementStyle=getComputedStyle(element);if(elementRect.width===0&&elementRect.height===0&&elementStyle.overflow!=='hidden'){return false;}
if(elementStyle.visibility==='hidden'){return false;}
const frame=element.ownerDocument.defaultView;if(elementRect.x+elementRect.width<0||elementRect.y+elementRect.height<0||elementRect.x>frame.innerWidth||elementRect.y>frame.innerHeight){return false;}
for(const ancestor of ancestors(element)){const isElement=ancestor===element;const style=isElement?elementStyle:getComputedStyle(ancestor);if(style.opacity==='0'){return false;}
if(style.display==='contents'){
continue;}
const rect=isElement?elementRect:ancestor.getBoundingClientRect();if((rect.width===0||rect.height===0)&&elementStyle.overflow==='hidden'){
return false;}}
return true;}
function rgbaFromString(str){const m=str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/i);if(m){return[m[1]/255,m[2]/255,m[3]/255,m[4]===undefined?undefined:parseFloat(m[4])];}else{throw new Error('Color '+str+' did not match pattern rgb[a](r, g, b[, a]).');}}
function saturation(r,g,b){const cMax=Math.max(r,g,b);const cMin=Math.min(r,g,b);const delta=cMax-cMin;const lightness=(cMax+cMin)/2;const denom=(1-(Math.abs(2*lightness-1)));return(denom===0)?0:delta/denom;}
function linearScale(number,zeroAt,oneAt){const isRising=zeroAt<oneAt;if(isRising){if(number<=zeroAt){return 0;}else if(number>=oneAt){return 1;}}else{if(number>=zeroAt){return 0;}else if(number<=oneAt){return 1;}}
const slope=1/(oneAt-zeroAt);return slope*(number-zeroAt);}
function*flatten(iterable){for(const i of iterable){if(typeof i!=='string'&&isIterable(i)){yield*(flatten(i));}else{yield i;}}}
function*map(fn,iterable){for(const i of iterable){yield fn(i);}}
function forEach(fn,iterable){for(const i of iterable){fn(i);}}
function isIterable(thing){return thing&&typeof thing[Symbol.iterator]==='function';}
var utilsForFrontend=Object.freeze({__proto__:null,identity:identity,best:best,max:max,maxes:maxes,min:min,sum:sum,length:length,walk:walk,isBlock:isBlock,inlineTexts:inlineTexts,inlineTextLength:inlineTextLength,collapseWhitespace:collapseWhitespace,linkDensity:linkDensity,isWhitespace:isWhitespace,setDefault:setDefault,getDefault:getDefault,reversed:reversed,toposort:toposort,NiceSet:NiceSet,first:first,rootElement:rootElement,numberOfMatches:numberOfMatches,page:page,domSort:domSort,isDomElement:isDomElement,toDomElement:toDomElement,attributesMatch:attributesMatch,ancestors:ancestors,sigmoid:sigmoid,isVisible:isVisible,rgbaFromString:rgbaFromString,saturation:saturation,linearScale:linearScale,flatten:flatten,map:map,forEach:forEach});function numStrides(left,right){let num=0;let sibling=left;let shouldContinue=sibling&&sibling!==right;while(shouldContinue){sibling=sibling.nextSibling;if((shouldContinue=sibling&&sibling!==right)&&!isWhitespace(sibling)){num+=1;}}
if(sibling!==right){sibling=right;while(sibling){sibling=sibling.previousSibling;if(sibling&&!isWhitespace(sibling)){num+=1;}}}
return num;}
function distance(fnodeA,fnodeB,{differentDepthCost=2,differentTagCost=2,sameTagCost=1,strideCost=1,additionalCost=(fnodeA,fnodeB)=>0}={}){

if(fnodeA===fnodeB){return 0;}
const elementA=isDomElement(fnodeA)?fnodeA:fnodeA.element;const elementB=isDomElement(fnodeB)?fnodeB:fnodeB.element;const aAncestors=[elementA];const bAncestors=[elementB];let aAncestor=elementA;let bAncestor=elementB;while(!aAncestor.contains(elementB)){aAncestor=aAncestor.parentNode;aAncestors.push(aAncestor);}
const comparison=elementA.compareDocumentPosition(elementB);

if(comparison&(elementA.DOCUMENT_POSITION_CONTAINS|elementA.DOCUMENT_POSITION_CONTAINED_BY)){return Number.MAX_VALUE;}

do{bAncestor=bAncestor.parentNode;bAncestors.push(bAncestor);}while(bAncestor!==aAncestor);

let left=aAncestors;let right=bAncestors;let cost=0;if(comparison&elementA.DOCUMENT_POSITION_FOLLOWING){left=aAncestors;right=bAncestors;}else if(comparison&elementA.DOCUMENT_POSITION_PRECEDING){left=bAncestors;right=aAncestors;}


while(left.length||right.length){const l=left.pop();const r=right.pop();if(l===undefined||r===undefined){
 cost+=differentDepthCost;}else{cost+=l.tagName===r.tagName?sameTagCost:differentTagCost;}
if(strideCost!==0){cost+=numStrides(l,r)*strideCost;}}
return cost+additionalCost(fnodeA,fnodeB);}
function euclidean(fnodeA,fnodeB){function xCenter(domRect){return domRect.left+domRect.width/2;}
function yCenter(domRect){return domRect.top+domRect.height/2;}
const elementA=toDomElement(fnodeA);const elementB=toDomElement(fnodeB);const aRect=elementA.getBoundingClientRect();const bRect=elementB.getBoundingClientRect();return Math.sqrt((xCenter(aRect)-xCenter(bRect))**2+
(yCenter(aRect)-yCenter(bRect))**2);}
class DistanceMatrix{constructor(elements,distance){






this._matrix=new Map();const clusters=elements.map(el=>[el]);for(let outerCluster of clusters){const innerMap=new Map();for(let innerCluster of this._matrix.keys()){innerMap.set(innerCluster,distance(outerCluster[0],innerCluster[0]));}
this._matrix.set(outerCluster,innerMap);}
this._numClusters=clusters.length;}
closest(){const self=this;if(this._numClusters<2){throw new Error('There must be at least 2 clusters in order to return the closest() ones.');}
function clustersAndDistances(){const ret=[];for(let[outerKey,row]of self._matrix.entries()){for(let[innerKey,storedDistance]of row.entries()){ret.push({a:outerKey,b:innerKey,distance:storedDistance});}}
return ret;}

return min(clustersAndDistances(),x=>x.distance);}


_cachedDistance(clusterA,clusterB){let ret=this._matrix.get(clusterA).get(clusterB);if(ret===undefined){ret=this._matrix.get(clusterB).get(clusterA);}
return ret;}
merge(clusterA,clusterB){

const newRow=new Map();for(let outerKey of this._matrix.keys()){if(outerKey!==clusterA&&outerKey!==clusterB){newRow.set(outerKey,Math.min(this._cachedDistance(clusterA,outerKey),this._cachedDistance(clusterB,outerKey)));}}
this._matrix.delete(clusterA);this._matrix.delete(clusterB);for(let inner of this._matrix.values()){inner.delete(clusterA);inner.delete(clusterB);}
this._matrix.set([clusterA,clusterB],newRow);this._numClusters-=1;}
numClusters(){return this._numClusters;}
clusters(){return Array.from(this._matrix.keys()).map(e=>Array.from(flatten(e)));}}
function clusters(fnodes,splittingDistance,getDistance=distance){const matrix=new DistanceMatrix(fnodes,getDistance);let closest;while(matrix.numClusters()>1&&(closest=matrix.closest()).distance<splittingDistance){matrix.merge(closest.a,closest.b);}
return matrix.clusters();}
var clusters$1=Object.freeze({__proto__:null,distance:distance,euclidean:euclidean,clusters:clusters}); function dom(selector){return new DomLhs(selector);}
function element(selector){return new ElementLhs(selector);}
class Lhs{constructor(){this._predicate=()=>true;}
static fromFirstCall(firstCall){if(firstCall.method==='type'){return new TypeLhs(...firstCall.args);}else if(firstCall.method==='and'){return new AndLhs(firstCall.args);}else if(firstCall.method==='nearest'){return new NearestLhs(firstCall.args);}else{throw new Error('The left-hand side of a rule() must start with dom(), type(), and(), or nearest().');}}
when(predicate){let lhs=this.clone();lhs._predicate=predicate;return lhs;}
fnodesSatisfyingWhen(fnodes){return Array.from(fnodes).filter(this._predicate);}
checkFact(fact){}
guaranteedType(){}
aggregatedType(){}
}
class DomLhs extends Lhs{constructor(selector){super();if(selector===undefined){throw new Error('A querySelector()-style selector is required as the argument to '+this._callName()+'().');}
this.selector=selector;}
_callName(){return'dom';}
clone(){return new this.constructor(this.selector);}
fnodes(ruleset){return this._domNodesToFilteredFnodes(ruleset,ruleset.doc.querySelectorAll(this.selector));}
_domNodesToFilteredFnodes(ruleset,domNodes){let ret=[];for(let i=0;i<domNodes.length;i++){ret.push(ruleset.fnodeForElement(domNodes[i]));}
return super.fnodesSatisfyingWhen(ret);}
checkFact(fact){if(fact.type===undefined){throw new Error(`The right-hand side of a ${this._callName()}() rule failed to specify a type. This means there is no way for its output to be used by later rules. All it specified was ${fact}.`);}}
asLhs(){return this;}
possibleTypeCombinations(){return[];}
typesMentioned(){return new NiceSet();}}
class ElementLhs extends DomLhs{_callName(){return'element';}
fnodes(ruleset){return this._domNodesToFilteredFnodes(ruleset,ruleset.doc.matches(this.selector)?[ruleset.doc]:[]);}}
class TypeLhs extends Lhs{constructor(type){super();if(type===undefined){throw new Error('A type name is required when calling type().');}
this._type=type;}
clone(){return new this.constructor(this._type);}
fnodes(ruleset){const cached=getDefault(ruleset.typeCache,this._type,()=>[]);return super.fnodesSatisfyingWhen(cached);}
type(inputType){return new this.constructor(inputType);}
max(){return new TypeMaxLhs(this._type);}
bestCluster(options){return new BestClusterLhs(this._type,options);}

guaranteedType(){return this._type;}
possibleTypeCombinations(){return[this.typesMentioned()];}
typesMentioned(){return new NiceSet([this._type]);}}
class AggregateTypeLhs extends TypeLhs{aggregatedType(){return this._type;}}
class TypeMaxLhs extends AggregateTypeLhs{fnodes(ruleset){
const self=this; const getSuperFnodes=()=>super.fnodes(ruleset);return setDefault(ruleset.maxCache,this._type,function maxFnodesOfType(){return maxes(getSuperFnodes(),fnode=>ruleset.weightedScore(fnode.scoresSoFarFor(self._type)));});}}
class BestClusterLhs extends AggregateTypeLhs{constructor(type,options){super(type);this._options=options||{splittingDistance:3};}
fnodes(ruleset){const fnodesOfType=Array.from(super.fnodes(ruleset));if(fnodesOfType.length===0){return[];}
const clusts=clusters(fnodesOfType,this._options.splittingDistance,(a,b)=>distance(a,b,this._options));const clustsAndSums=clusts.map(clust=>[clust,sum(clust.map(fnode=>fnode.scoreFor(this._type)))]);return max(clustsAndSums,clustAndSum=>clustAndSum[1])[0];}}
class AndLhs extends Lhs{constructor(lhss){super();
this._args=lhss.map(sideToTypeLhs);}*fnodes(ruleset){
const fnodes=this._args[0].fnodes(ruleset);fnodeLoop:for(let fnode of fnodes){for(let otherLhs of this._args.slice(1)){ if(!fnode.hasType(otherLhs.guaranteedType())){continue fnodeLoop;}}
yield fnode;}}
possibleTypeCombinations(){return[this.typesMentioned()];}
typesMentioned(){return new NiceSet(this._args.map(arg=>arg.guaranteedType()));}}
function sideToTypeLhs(side){const lhs=side.asLhs();if(!(lhs.constructor===TypeLhs)){throw new Error('and() and nearest() support only simple type() calls as arguments for now.');}
return lhs;}
class NearestLhs extends Lhs{constructor([a,b,distance]){super();this._a=sideToTypeLhs(a);this._b=sideToTypeLhs(b);this._distance=distance;}
*fnodes(ruleset){






const as_=this._a.fnodes(ruleset);const bs=Array.from(this._b.fnodes(ruleset));if(bs.length>0){for(const a of as_){const nearest=min(bs,b=>this._distance(a,b));yield{fnode:a,rhsTransformer:function setNoteIfEmpty(fact){

if(fact.note===undefined){fact.note=nearest;}
return fact;}};}}}
checkFact(fact){}
possibleTypeCombinations(){return[new NiceSet([this._a.guaranteedType()])];}
typesMentioned(){return new NiceSet([this._a.guaranteedType(),this._b.guaranteedType()]);}
guaranteedType(){return this._a.guaranteedType();}} 
const TYPE=1;const NOTE=2;const SCORE=4;const ELEMENT=8;const SUBFACTS={type:TYPE,note:NOTE,score:SCORE,element:ELEMENT};function out(key){return new OutwardRhs(key);}
class InwardRhs{constructor(calls=[],max=Infinity,types){this._calls=calls.slice();this._max=max; this._types=new NiceSet(types);}
atMost(score){return new this.constructor(this._calls,score,this._types);}
_checkAtMost(fact){if(fact.score!==undefined&&fact.score>this._max){throw new Error(`Score of ${fact.score} exceeds the declared atMost(${this._max}).`);}}
props(callback){function getSubfacts(fnode){const subfacts=callback(fnode);

for(let subfact in subfacts){if(!SUBFACTS.hasOwnProperty(subfact)||!(SUBFACTS[subfact]&getSubfacts.possibleSubfacts)){
delete subfacts[subfact];}}
return subfacts;}
getSubfacts.possibleSubfacts=TYPE|NOTE|SCORE|ELEMENT;getSubfacts.kind='props';return new this.constructor(this._calls.concat(getSubfacts),this._max,this._types);}
type(theType){


function getSubfacts(){return{type:theType};}
getSubfacts.possibleSubfacts=TYPE;getSubfacts.type=theType;getSubfacts.kind='type';return new this.constructor(this._calls.concat(getSubfacts),this._max,this._types);}
typeIn(...types){





return new this.constructor(this._calls,this._max,types);}
_checkTypeIn(result,leftType){if(this._types.size>0){if(result.type===undefined){if(!this._types.has(leftType)){throw new Error(`A right-hand side claimed, via typeIn(...) to emit one of the types ${this._types} but actually inherited ${leftType} from the left-hand side.`);}}else if(!this._types.has(result.type)){throw new Error(`A right-hand side claimed, via typeIn(...) to emit one of the types ${this._types} but actually emitted ${result.type}.`);}}}
note(callback){function getSubfacts(fnode){return{note:callback(fnode)};}
getSubfacts.possibleSubfacts=NOTE;getSubfacts.kind='note';return new this.constructor(this._calls.concat(getSubfacts),this._max,this._types);}
score(scoreOrCallback){let getSubfacts;function getSubfactsFromNumber(fnode){return{score:scoreOrCallback};}
function getSubfactsFromFunction(fnode){let result=scoreOrCallback(fnode);if(typeof result==='boolean'){

result=Number(result);}
return{score:result};}
if(typeof scoreOrCallback==='number'){getSubfacts=getSubfactsFromNumber;}else{getSubfacts=getSubfactsFromFunction;}
getSubfacts.possibleSubfacts=SCORE;getSubfacts.kind='score';return new this.constructor(this._calls.concat(getSubfacts),this._max,this._types);}
fact(fnode,leftType){const doneKinds=new Set();const result={};let haveSubfacts=0;for(let call of reversed(this._calls)){if(!doneKinds.has(call.kind)){doneKinds.add(call.kind);if(~haveSubfacts&call.possibleSubfacts){const newSubfacts=call(fnode); for(let subfact in newSubfacts){

if(!result.hasOwnProperty(subfact)){result[subfact]=newSubfacts[subfact];}
haveSubfacts|=SUBFACTS[subfact];}}}}
this._checkAtMost(result);this._checkTypeIn(result,leftType);return result;}
possibleEmissions(){


let couldChangeType=false;for(let call of reversed(this._calls)){if(call.kind==='props'){couldChangeType=true;break;}else if(call.kind==='type'){return{couldChangeType:true,possibleTypes:new Set([call.type])};}}
return{couldChangeType,possibleTypes:this._types};}}
class OutwardRhs{constructor(key,through=x=>x,allThrough=x=>x){this.key=key;this.callback=through;this.allCallback=allThrough;}
through(callback){return new this.constructor(this.key,callback,this.allCallback);}
allThrough(callback){return new this.constructor(this.key,this.callback,callback);}
asRhs(){return this;}}
function props(callback){return new Side({method:'props',args:[callback]});}
function type(theType){return new Side({method:'type',args:[theType]});}
function note(callback){return new Side({method:'note',args:[callback]});}
function score(scoreOrCallback){return new Side({method:'score',args:[scoreOrCallback]});}
function atMost(score){return new Side({method:'atMost',args:[score]});}
function typeIn(...types){return new Side({method:'typeIn',args:types});}
function and(...lhss){return new Side({method:'and',args:lhss});}
function nearest(typeCallA,typeCallB,distance=euclidean){return new Side({method:'nearest',args:[typeCallA,typeCallB,distance]});}
class Side{constructor(...calls){this._calls=calls;}
max(){return this._and('max');}
bestCluster(options){return this._and('bestCluster',options);}
props(callback){return this._and('props',callback);}
type(...types){return this._and('type',...types);}
note(callback){return this._and('note',callback);}
score(scoreOrCallback){return this._and('score',scoreOrCallback);}
atMost(score){return this._and('atMost',score);}
typeIn(...types){return this._and('typeIn',...types);}
and(...lhss){return this._and('and',lhss);}
_and(method,...args){return new this.constructor(...this._calls.concat({method,args}));}
asLhs(){return this._asSide(Lhs.fromFirstCall(this._calls[0]),this._calls.slice(1));}
asRhs(){return this._asSide(new InwardRhs(),this._calls);}
_asSide(side,calls){for(let call of calls){side=side[call.method](...call.args);}
return side;}
when(pred){return this._and('when',pred);}}
class Fnode{constructor(element,ruleset){if(element===undefined){throw new Error("Someone tried to make a fnode without specifying the element they're talking about.");}
this.element=element;this._ruleset=ruleset;

this._types=new Map();




this._conservedScores=new Map();}
hasType(type){
this._computeType(type);return this._types.has(type);}
scoreFor(type){this._computeType(type);return sigmoid(this._ruleset.weightedScore(this.scoresSoFarFor(type))+
getDefault(this._ruleset.biases,type,()=>0));}
noteFor(type){this._computeType(type);return this._noteSoFarFor(type);}
hasNoteFor(type){this._computeType(type);return this._hasNoteSoFarFor(type);}
typesSoFar(){return this._types.keys();}
_noteSoFarFor(type){return this._typeRecordForGetting(type).note;}
_hasNoteSoFarFor(type){return this._noteSoFarFor(type)!==undefined;}
scoresSoFarFor(type){return this._typeRecordForGetting(type).score;}
addScoreFor(type,score,ruleName){this._typeRecordForSetting(type).score.set(ruleName,score);}
setNoteFor(type,note){if(this._hasNoteSoFarFor(type)){if(note!==undefined){throw new Error(`Someone (likely the right-hand side of a rule) tried to add a note of type ${type} to an element, but one of that type already exists. Overwriting notes is not allowed, since it would make the order of rules matter.`);}

}else{
this._typeRecordForSetting(type).note=note;}}
_typeRecordForSetting(type){return setDefault(this._types,type,()=>({score:new Map()}));}
_typeRecordForGetting(type){return getDefault(this._types,type,()=>({score:new Map()}));}
_computeType(theType){if(!this._types.has(theType)){this._ruleset.get(type(theType));}}}
function rule(lhs,rhs,options){


if(typeof rhs==='string'){rhs=out(rhs);}
return new((rhs instanceof OutwardRhs)?OutwardRule:InwardRule)(lhs,rhs,options);}
let nextRuleNumber=0;function newInternalRuleName(){return'_'+nextRuleNumber++;}
class Rule{ constructor(lhs,rhs,options){this.lhs=lhs.asLhs();this.rhs=rhs.asRhs();

this.name=(options?options.name:undefined)||newInternalRuleName();}
prerequisites(ruleset){

function extendOrThrow(prereqs,types,ruleGetter,verb){for(let type of types){const rules=ruleGetter(type);if(rules.length>0){prereqs.extend(rules);}else{throw new Error(`No rule ${verb} the "${type}" type, but another rule needs it as input.`);}}}
const prereqs=new NiceSet();extendOrThrow(prereqs,this._typesFinalized(),type=>ruleset.inwardRulesThatCouldEmit(type),'emits');


extendOrThrow(prereqs,this.lhs.typesMentioned(),type=>ruleset.inwardRulesThatCouldAdd(type),'adds');return prereqs;}
_typesFinalized(){










const type=this.lhs.aggregatedType();return(type===undefined)?new NiceSet():new NiceSet([type]);}}
class InwardRule extends Rule{
results(ruleset){if(ruleset.doneRules.has(this)){ throw new Error('A bug in Fathom caused results() to be called on an inward rule twice. That could cause redundant score contributions, etc.');}
const self=this;

const leftResults=this.lhs.fnodes(ruleset);

const returnedFnodes=new Set();forEach(function updateFnode(leftResult){const leftType=self.lhs.guaranteedType();
const{fnode:leftFnode=leftResult,rhsTransformer=identity}=leftResult;

const fact=rhsTransformer(self.rhs.fact(leftFnode,leftType));self.lhs.checkFact(fact);const rightFnode=ruleset.fnodeForElement(fact.element||leftFnode.element);
const rightType=fact.type||self.lhs.guaranteedType();if(fact.score!==undefined){if(rightType!==undefined){rightFnode.addScoreFor(rightType,fact.score,self.name);}else{throw new Error(`The right-hand side of a rule specified a score (${fact.score}) with neither an explicit type nor one we could infer from the left-hand side.`);}}
if(fact.type!==undefined||fact.note!==undefined){if(rightType===undefined){throw new Error(`The right-hand side of a rule specified a note (${fact.note}) with neither an explicit type nor one we could infer from the left-hand side. Notes are per-type, per-node, so that's a problem.`);}else{rightFnode.setNoteFor(rightType,fact.note);}}
returnedFnodes.add(rightFnode);},leftResults);ruleset.doneRules.add(this);
for(let fnode of returnedFnodes){for(let type of fnode.typesSoFar()){setDefault(ruleset.typeCache,type,()=>new Set()).add(fnode);}}
return returnedFnodes.values();}
typesItCouldEmit(){const rhs=this.rhs.possibleEmissions();if(!rhs.couldChangeType&&this.lhs.guaranteedType()!==undefined){return new Set([this.lhs.guaranteedType()]);}else if(rhs.possibleTypes.size>0){return rhs.possibleTypes;}else{throw new Error('Could not determine the emitted type of a rule because its right-hand side calls props() without calling typeIn().');}}
typesItCouldAdd(){const ret=new Set(this.typesItCouldEmit());ret.delete(this.lhs.guaranteedType());return ret;}
_typesFinalized(){const self=this;function typesThatCouldChange(){const ret=new NiceSet();const emissions=self.rhs.possibleEmissions();if(emissions.couldChangeType){


for(let combo of self.lhs.possibleTypeCombinations()){for(let rhsType of emissions.possibleTypes){if(!combo.has(rhsType)){ret.extend(combo);break;}}}}



return ret;}
return typesThatCouldChange().extend(super._typesFinalized());}}
class OutwardRule extends Rule{results(ruleset){function justFnode(fnodeOrStruct){return(fnodeOrStruct instanceof Fnode)?fnodeOrStruct:fnodeOrStruct.fnode;}
return this.rhs.allCallback(map(this.rhs.callback,map(justFnode,this.lhs.fnodes(ruleset))));}
key(){return this.rhs.key;}
_typesFinalized(){return this.lhs.typesMentioned().extend(super._typesFinalized());}}
function ruleset(rules,coeffs=[],biases=[]){return new Ruleset(rules,coeffs,biases);}
class Ruleset{constructor(rules,coeffs=[],biases=[]){this._inRules=[];this._outRules=new Map(); this._rulesThatCouldEmit=new Map();this._rulesThatCouldAdd=new Map();
this._coeffs=new Map(coeffs); this.biases=new Map(biases);

for(let rule of rules){if(rule instanceof InwardRule){this._inRules.push(rule);const emittedTypes=rule.typesItCouldEmit();for(let type of emittedTypes){setDefault(this._rulesThatCouldEmit,type,()=>[]).push(rule);}
for(let type of rule.typesItCouldAdd()){setDefault(this._rulesThatCouldAdd,type,()=>[]).push(rule);}}else if(rule instanceof OutwardRule){this._outRules.set(rule.key(),rule);}else{throw new Error(`This element of ruleset()'s first param wasn't a rule: ${rule}`);}}}
against(doc){return new BoundRuleset(doc,this._inRules,this._outRules,this._rulesThatCouldEmit,this._rulesThatCouldAdd,this._coeffs,this.biases);}
rules(){return Array.from([...this._inRules,...this._outRules.values()]);}}
class BoundRuleset{constructor(doc,inRules,outRules,rulesThatCouldEmit,rulesThatCouldAdd,coeffs,biases){this.doc=doc;this._inRules=inRules;this._outRules=outRules;this._rulesThatCouldEmit=rulesThatCouldEmit;this._rulesThatCouldAdd=rulesThatCouldAdd;this._coeffs=coeffs;this.biases=biases;this._clearCaches();this.elementCache=new WeakMap(); this.doneRules=new Set();}
setCoeffsAndBiases(coeffs,biases=[]){
this._coeffs=new Map(coeffs);this.biases=new Map(biases);this._clearCaches();}
_clearCaches(){this.maxCache=new Map(); this.typeCache=new Map();}
get(thing){if(typeof thing==='string'){if(this._outRules.has(thing)){return Array.from(this._execute(this._outRules.get(thing)));}else{throw new Error(`There is no out() rule with key "${thing}".`);}}else if(isDomElement(thing)){
return this.fnodeForElement(thing);}else if(thing.asLhs!==undefined){



const outRule=rule(thing,out(Symbol('outKey')));return Array.from(this._execute(outRule));}else{throw new Error('ruleset.get() expects a string, an expression like on the left-hand side of a rule, or a DOM node.');}}
weightedScore(mapOfScores){let total=0;for(const[name,score]of mapOfScores){total+=score*getDefault(this._coeffs,name,()=>1);}
return total;}

_prerequisitesTo(rule,undonePrereqs=new Map()){for(let prereq of rule.prerequisites(this)){if(!this.doneRules.has(prereq)){
const alreadyAdded=undonePrereqs.has(prereq);setDefault(undonePrereqs,prereq,()=>[]).push(rule);


if(!alreadyAdded){this._prerequisitesTo(prereq,undonePrereqs);}}}
return undonePrereqs;}
_execute(rule){const prereqs=this._prerequisitesTo(rule);let sorted;try{sorted=[rule].concat(toposort(prereqs.keys(),prereq=>prereqs.get(prereq)));}catch(exc){if(exc instanceof CycleError){throw new CycleError('There is a cyclic dependency in the ruleset.');}else{throw exc;}}
let fnodes;for(let eachRule of reversed(sorted)){fnodes=eachRule.results(this);}
return Array.from(fnodes);}
inwardRulesThatCouldEmit(type){return getDefault(this._rulesThatCouldEmit,type,()=>[]);}
inwardRulesThatCouldAdd(type){return getDefault(this._rulesThatCouldAdd,type,()=>[]);}
fnodeForElement(element){return setDefault(this.elementCache,element,()=>new Fnode(element,this));}}
const version='3.3';exports.and=and;exports.atMost=atMost;exports.clusters=clusters$1;exports.dom=dom;exports.element=element;exports.nearest=nearest;exports.note=note;exports.out=out;exports.props=props;exports.rule=rule;exports.ruleset=ruleset;exports.score=score;exports.type=type;exports.typeIn=typeIn;exports.utils=utilsForFrontend;exports.version=version;Object.defineProperty(exports,'__esModule',{value:true});})));