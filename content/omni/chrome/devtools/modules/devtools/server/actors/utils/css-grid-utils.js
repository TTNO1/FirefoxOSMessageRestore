"use strict";const{Cu}=require("chrome");function getStringifiableFragments(fragments=[]){if(fragments[0]&&Cu.isDeadWrapper(fragments[0])){return{};}
return fragments.map(getStringifiableFragment);}
function stringifyGridFragments(fragments){return JSON.stringify(getStringifiableFragments(fragments));}
function getStringifiableFragment(fragment){return{areas:getStringifiableAreas(fragment.areas),cols:getStringifiableDimension(fragment.cols),rows:getStringifiableDimension(fragment.rows),};}
function getStringifiableAreas(areas){return[...areas].map(getStringifiableArea);}
function getStringifiableDimension(dimension){return{lines:[...dimension.lines].map(getStringifiableLine),tracks:[...dimension.tracks].map(getStringifiableTrack),};}
function getStringifiableArea({columnEnd,columnStart,name,rowEnd,rowStart,type,}){return{columnEnd,columnStart,name,rowEnd,rowStart,type};}
function getStringifiableLine({breadth,names,number,start,type}){return{breadth,names,number,start,type};}
function getStringifiableTrack({breadth,start,state,type}){return{breadth,start,state,type};}
exports.getStringifiableFragments=getStringifiableFragments;exports.stringifyGridFragments=stringifyGridFragments;