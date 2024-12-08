const{LocalizationHelper}=require("devtools/shared/l10n");const L10N=new LocalizationHelper("toolkit/locales/intl.properties");

const gFunctions=[[1,(n)=>0],[2,(n)=>n!=1?1:0],[2,(n)=>n>1?1:0],[3,(n)=>n%10==1&&n%100!=11?1:n%10==0?0:2],[4,(n)=>n==1||n==11?0:n==2||n==12?1:n>0&&n<20?2:3],[3,(n)=>n==1?0:n==0||n%100>0&&n%100<20?1:2],[3,(n)=>n%10==1&&n%100!=11?0:n%10>=2&&(n%100<10||n%100>=20)?2:1],[3,(n)=>n%10==1&&n%100!=11?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2],[3,(n)=>n==1?0:n>=2&&n<=4?1:2],[3,(n)=>n==1?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2],[4,(n)=>n%100==1?0:n%100==2?1:n%100==3||n%100==4?2:3],[5,(n)=>n==1?0:n==2?1:n>=3&&n<=6?2:n>=7&&n<=10?3:4],[6,(n)=>n==0?5:n==1?0:n==2?1:n%100>=3&&n%100<=10?2:n%100>=11&&n%100<=99?3:4],[4,(n)=>n==1?0:n==0||n%100>0&&n%100<=10?1:n%100>10&&n%100<20?2:3],[3,(n)=>n%10==1?0:n%10==2?1:2],[2,(n)=>n%10==1&&n%100!=11?0:1],[5,(n)=>n%10==1&&n%100!=11&&n%100!=71&&n%100!=91?0:n%10==2&&n%100!=12&&n%100!=72&&n%100!=92?1:(n%10==3||n%10==4||n%10==9)&&n%100!=13&&n%100!=14&&n%100!=19&&n%100!=73&&n%100!=74&&n%100!=79&&n%100!=93&&n%100!=94&&n%100!=99?2:n%1000000==0&&n!=0?3:4],[2,(n)=>n!=0?1:0],[6,(n)=>n==0?0:n==1?1:n==2?2:n==3?3:n==6?4:5],[3,(n)=>n%10==1&&n%100!=11?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2],];const PluralForm={get get()
{


 delete this.numForms;delete this.get;[this.get,this.numForms]=this.makeGetter(this.ruleNum);return this.get;},makeGetter:function(aRuleNum)
{ if(aRuleNum<0||aRuleNum>=gFunctions.length||isNaN(aRuleNum)){log(["Invalid rule number: ",aRuleNum," -- defaulting to 0"]);aRuleNum=0;} 
let[numForms,pluralFunc]=gFunctions[aRuleNum];
 return[function(aNum,aWords){ let index=pluralFunc(aNum?Number(aNum):0);let words=aWords?aWords.split(/;/):[""]; let ret=index<words.length?words[index]:undefined; if((ret==undefined)||(ret=="")){ log(["Index #",index," of '",aWords,"' for value ",aNum," is invalid -- plural rule #",aRuleNum,";"]);ret=words[0];}
return ret;},()=>numForms];},get numForms()
{this.get();return this.numForms;},get ruleNum()
{try{return parseInt(L10N.getStr("pluralRule"),10);}catch(e){return 1;}}};function log(aMsg)
{let msg="plural-form.js: "+(aMsg.join?aMsg.join(""):aMsg);console.log(msg+"\n");}
exports.PluralForm=PluralForm;exports.get=PluralForm.get;