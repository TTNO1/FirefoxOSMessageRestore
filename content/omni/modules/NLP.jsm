//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";var EXPORTED_SYMBOLS=["NLP"];var NLP={levenshtein(word1="",word2="",costIns=1,costRep=1,costDel=1){if(word1===word2){return 0;}
let l1=word1.length;let l2=word2.length;if(!l1){return l2*costIns;}
if(!l2){return l1*costDel;}
let p1=new Array(l2+1);let p2=new Array(l2+1);let i1,i2,c0,c1,c2,tmp;for(i2=0;i2<=l2;i2++){p1[i2]=i2*costIns;}
for(i1=0;i1<l1;i1++){p2[0]=p1[0]+costDel;for(i2=0;i2<l2;i2++){c0=p1[i2]+(word1[i1]===word2[i2]?0:costRep);c1=p1[i2+1]+costDel;if(c1<c0){c0=c1;}
c2=p2[i2]+costIns;if(c2<c0){c0=c2;}
p2[i2+1]=c0;}
tmp=p1;p1=p2;p2=tmp;}
c0=p1[l2];return c0;},};