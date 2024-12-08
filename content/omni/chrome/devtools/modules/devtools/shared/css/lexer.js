




"use strict";

const eCSSToken_Whitespace="whitespace";const eCSSToken_Comment="comment";
const eCSSToken_Ident="ident";const eCSSToken_Function="function";const eCSSToken_AtKeyword="at";const eCSSToken_ID="id";const eCSSToken_Hash="hash";









const eCSSToken_Number="number";const eCSSToken_Dimension="dimension";const eCSSToken_Percentage="percentage";


const eCSSToken_String="string";const eCSSToken_Bad_String="bad_string";const eCSSToken_URL="url";const eCSSToken_Bad_URL="bad_url";
const eCSSToken_Symbol="symbol";

const eCSSToken_Includes="includes";const eCSSToken_Dashmatch="dashmatch";const eCSSToken_Beginsmatch="beginsmatch";const eCSSToken_Endsmatch="endsmatch";const eCSSToken_Containsmatch="containsmatch";





const eCSSToken_URange="urange";





const eCSSToken_HTMLComment="htmlcomment";const eEOFCharacters_None=0x0000;const eEOFCharacters_DropBackslash=0x0001;const eEOFCharacters_ReplacementChar=0x0002;const eEOFCharacters_Asterisk=0x0004;const eEOFCharacters_Slash=0x0008;const eEOFCharacters_DoubleQuote=0x0010;const eEOFCharacters_SingleQuote=0x0020;const eEOFCharacters_CloseParen=0x0040;const APOSTROPHE="'".charCodeAt(0);const ASTERISK="*".charCodeAt(0);const CARRIAGE_RETURN="\r".charCodeAt(0);const CIRCUMFLEX_ACCENT="^".charCodeAt(0);const COMMERCIAL_AT="@".charCodeAt(0);const DIGIT_NINE="9".charCodeAt(0);const DIGIT_ZERO="0".charCodeAt(0);const DOLLAR_SIGN="$".charCodeAt(0);const EQUALS_SIGN="=".charCodeAt(0);const EXCLAMATION_MARK="!".charCodeAt(0);const FULL_STOP=".".charCodeAt(0);const GREATER_THAN_SIGN=">".charCodeAt(0);const HYPHEN_MINUS="-".charCodeAt(0);const LATIN_CAPITAL_LETTER_E="E".charCodeAt(0);const LATIN_CAPITAL_LETTER_U="U".charCodeAt(0);const LATIN_SMALL_LETTER_E="e".charCodeAt(0);const LATIN_SMALL_LETTER_U="u".charCodeAt(0);const LEFT_PARENTHESIS="(".charCodeAt(0);const LESS_THAN_SIGN="<".charCodeAt(0);const LINE_FEED="\n".charCodeAt(0);const NUMBER_SIGN="#".charCodeAt(0);const PERCENT_SIGN="%".charCodeAt(0);const PLUS_SIGN="+".charCodeAt(0);const QUESTION_MARK="?".charCodeAt(0);const QUOTATION_MARK='"'.charCodeAt(0);const REVERSE_SOLIDUS="\\".charCodeAt(0);const RIGHT_PARENTHESIS=")".charCodeAt(0);const SOLIDUS="/".charCodeAt(0);const TILDE="~".charCodeAt(0);const VERTICAL_LINE="|".charCodeAt(0);const UCS2_REPLACEMENT_CHAR=0xfffd;const kImpliedEOFCharacters=[UCS2_REPLACEMENT_CHAR,ASTERISK,SOLIDUS,QUOTATION_MARK,APOSTROPHE,RIGHT_PARENTHESIS,0,];function ensureValidChar(c){if(c>=0x00110000||(c&0xfff800)==0xd800){return UCS2_REPLACEMENT_CHAR;}
return c;}
function stringToCodes(str){const charCodes=[];for(let i=0;i<str.length;i++){charCodes.push(str.charCodeAt(i));}
return charCodes;}
const IS_HEX_DIGIT=0x01;const IS_IDSTART=0x02;const IS_IDCHAR=0x04;const IS_URL_CHAR=0x08;const IS_HSPACE=0x10;const IS_VSPACE=0x20;const IS_SPACE=IS_HSPACE|IS_VSPACE;const IS_STRING=0x40;const H=IS_HSPACE;const V=IS_VSPACE;const I=IS_IDCHAR;const J=IS_IDSTART;const U=IS_URL_CHAR;const S=IS_STRING;const X=IS_HEX_DIGIT;const SH=S|H;const SU=S|U;const SUI=S|U|I;const SUIJ=S|U|I|J;const SUIX=S|U|I|X;const SUIJX=S|U|I|J|X;const gLexTable=[ 0,S,S,S,S,S,S,S, S,SH,V,S,V,V,S,S, S,S,S,S,S,S,S,S, S,S,S,S,S,S,S,S,SH,SU,0,SU,SU,SU,SU,0,S,S,SU,SU,SU,SUI,SU,SU, SUIX,SUIX,SUIX,SUIX,SUIX,SUIX,SUIX,SUIX,SUIX,SUIX,SU,SU,SU,SU,SU,SU, SU,SUIJX,SUIJX,SUIJX,SUIJX,SUIJX,SUIJX,SUIJ, SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ, SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ, SUIJ,SUIJ,SUIJ,SU,J,SU,SU,SUIJ, SU,SUIJX,SUIJX,SUIJX,SUIJX,SUIJX,SUIJX,SUIJ, SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ, SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ,SUIJ, SUIJ,SUIJ,SUIJ,SU,SU,SU,SU,S,];function IsOpenCharClass(ch,cls){return ch>=0&&(ch>=128||(gLexTable[ch]&cls)!=0);}
function IsClosedCharClass(ch,cls){return ch>=0&&ch<128&&(gLexTable[ch]&cls)!=0;}
function IsWhitespace(ch){return IsClosedCharClass(ch,IS_SPACE);}
function IsHorzSpace(ch){return IsClosedCharClass(ch,IS_HSPACE);}
function IsVertSpace(ch){return IsClosedCharClass(ch,IS_VSPACE);}
function IsIdentChar(ch){return IsOpenCharClass(ch,IS_IDCHAR)||ch==0;}
function IsIdentStart(ch){return IsOpenCharClass(ch,IS_IDSTART)||ch==0;}
function StartsIdent(aFirstChar,aSecondChar){return(IsIdentStart(aFirstChar)||(aFirstChar==HYPHEN_MINUS&&(aSecondChar==HYPHEN_MINUS||IsIdentStart(aSecondChar))));}
function IsDigit(ch){return ch>=DIGIT_ZERO&&ch<=DIGIT_NINE;}
function IsHexDigit(ch){return IsClosedCharClass(ch,IS_HEX_DIGIT);}
function DecimalDigitValue(ch){return ch-DIGIT_ZERO;}
function HexDigitValue(ch){if(IsDigit(ch)){return DecimalDigitValue(ch);}else{

return(ch&0x7)+9;}}
function MatchOperatorType(ch){switch(ch){case TILDE:return eCSSToken_Includes;case VERTICAL_LINE:return eCSSToken_Dashmatch;case CIRCUMFLEX_ACCENT:return eCSSToken_Beginsmatch;case DOLLAR_SIGN:return eCSSToken_Endsmatch;case ASTERISK:return eCSSToken_Containsmatch;default:return eCSSToken_Symbol;}}
function Scanner(buffer){this.mBuffer=buffer||"";this.mOffset=0;this.mCount=this.mBuffer.length;this.mLineNumber=1;this.mLineOffset=0;this.mTokenLineOffset=0;this.mTokenOffset=0;this.mTokenLineNumber=1;this.mEOFCharacters=eEOFCharacters_None;}
Scanner.prototype={get lineNumber(){return this.mTokenLineNumber-1;},get columnNumber(){return this.mTokenOffset-this.mTokenLineOffset;},performEOFFixup:function(aInputString,aPreserveBackslash){let result=aInputString;let eofChars=this.mEOFCharacters;if(aPreserveBackslash&&(eofChars&(eEOFCharacters_DropBackslash|eEOFCharacters_ReplacementChar))!=0){eofChars&=~(eEOFCharacters_DropBackslash|eEOFCharacters_ReplacementChar);result+="\\";}
if((eofChars&eEOFCharacters_DropBackslash)!=0&&result.length>0&&result.endsWith("\\")){result=result.slice(0,-1);}
const extra=[];this.AppendImpliedEOFCharacters(eofChars,extra);const asString=String.fromCharCode.apply(null,extra);return result+asString;},nextToken:function(){const token={};if(!this.Next(token)){return null;}
const resultToken={};resultToken.tokenType=token.mType;resultToken.startOffset=this.mTokenOffset;resultToken.endOffset=this.mOffset;const constructText=()=>{return String.fromCharCode.apply(null,token.mIdent);};switch(token.mType){case eCSSToken_Whitespace:break;case eCSSToken_Ident:case eCSSToken_Function:case eCSSToken_AtKeyword:case eCSSToken_ID:case eCSSToken_Hash:resultToken.text=constructText();break;case eCSSToken_Dimension:resultToken.text=constructText();case eCSSToken_Number:case eCSSToken_Percentage:resultToken.number=token.mNumber;resultToken.hasSign=token.mHasSign;resultToken.isInteger=token.mIntegerValid;break;case eCSSToken_String:case eCSSToken_Bad_String:case eCSSToken_URL:case eCSSToken_Bad_URL:resultToken.text=constructText();break;case eCSSToken_Symbol:resultToken.text=String.fromCharCode(token.mSymbol);break;case eCSSToken_Includes:case eCSSToken_Dashmatch:case eCSSToken_Beginsmatch:case eCSSToken_Endsmatch:case eCSSToken_Containsmatch:case eCSSToken_URange:break;case eCSSToken_Comment:case eCSSToken_HTMLComment:break;}
return resultToken;},Peek:function(n=0){if(this.mOffset+n>=this.mCount){return-1;}
return this.mBuffer.charCodeAt(this.mOffset+n);},Advance:function(n=1){if(this.mOffset+n>=this.mCount||this.mOffset+n<this.mOffset){this.mOffset=this.mCount;}else{this.mOffset+=n;}},AdvanceLine:function(){if(this.mBuffer.charCodeAt(this.mOffset)==CARRIAGE_RETURN&&this.mOffset+1<this.mCount&&this.mBuffer.charCodeAt(this.mOffset+1)==LINE_FEED){this.mOffset+=2;}else{this.mOffset+=1;}
if(this.mLineNumber!=0){this.mLineNumber++;}
this.mLineOffset=this.mOffset;},SkipWhitespace:function(){for(;;){const ch=this.Peek();if(!IsWhitespace(ch)){ break;}
if(IsVertSpace(ch)){this.AdvanceLine();}else{this.Advance();}}},SkipComment:function(){this.Advance(2);for(;;){let ch=this.Peek();if(ch<0){this.SetEOFCharacters(eEOFCharacters_Asterisk|eEOFCharacters_Slash);return;}
if(ch==ASTERISK){this.Advance();ch=this.Peek();if(ch<0){this.SetEOFCharacters(eEOFCharacters_Slash);return;}
if(ch==SOLIDUS){this.Advance();return;}}else if(IsVertSpace(ch)){this.AdvanceLine();}else{this.Advance();}}},GatherEscape:function(aOutput,aInString){let ch=this.Peek(1);if(ch<0){

this.Advance();if(aInString){this.SetEOFCharacters(eEOFCharacters_DropBackslash);}else{aOutput.push(UCS2_REPLACEMENT_CHAR);this.SetEOFCharacters(eEOFCharacters_ReplacementChar);}
return true;}
if(IsVertSpace(ch)){if(aInString){

this.Advance();this.AdvanceLine();return true;}
return false;}
if(!IsHexDigit(ch)){

 this.Advance(2);if(ch==0){aOutput.push(UCS2_REPLACEMENT_CHAR);}else{aOutput.push(ch);}
return true;}






this.Advance();let val=0;let i=0;do{val=val*16+HexDigitValue(ch);i++;this.Advance();ch=this.Peek();}while(i<6&&IsHexDigit(ch));


 if(val==0){aOutput.push(UCS2_REPLACEMENT_CHAR);}else{aOutput.push(ensureValidChar(val));}

if(IsVertSpace(ch)){this.AdvanceLine();}else if(IsHorzSpace(ch)){this.Advance();}
return true;},GatherText:function(aClass,aText){const start=this.mOffset;const inString=aClass==IS_STRING;for(;;){let n=this.mOffset;while(n<this.mCount&&IsOpenCharClass(this.mBuffer.charCodeAt(n),aClass)){n++;}
if(n>this.mOffset){const substr=this.mBuffer.slice(this.mOffset,n);Array.prototype.push.apply(aText,stringToCodes(substr));this.mOffset=n;}
if(n==this.mCount){break;}
const ch=this.Peek();if(ch==0){this.Advance();aText.push(UCS2_REPLACEMENT_CHAR);continue;}
if(ch!=REVERSE_SOLIDUS){break;}
if(!this.GatherEscape(aText,inString)){break;}}
return this.mOffset>start;},ScanIdent:function(aToken){if(!this.GatherText(IS_IDCHAR,aToken.mIdent)){aToken.mSymbol=this.Peek();this.Advance();return true;}
if(this.Peek()!=LEFT_PARENTHESIS){aToken.mType=eCSSToken_Ident;return true;}
this.Advance();aToken.mType=eCSSToken_Function;const asString=String.fromCharCode.apply(null,aToken.mIdent);if(asString.toLowerCase()==="url"){this.NextURL(aToken);}
return true;},ScanAtKeyword:function(aToken){aToken.mSymbol=COMMERCIAL_AT;this.Advance();const ch=this.Peek();if(StartsIdent(ch,this.Peek(1))){if(this.GatherText(IS_IDCHAR,aToken.mIdent)){aToken.mType=eCSSToken_AtKeyword;}}
return true;},ScanHash:function(aToken){aToken.mSymbol=NUMBER_SIGN;this.Advance();const ch=this.Peek();if(IsIdentChar(ch)||ch==REVERSE_SOLIDUS){const type=StartsIdent(ch,this.Peek(1))?eCSSToken_ID:eCSSToken_Hash;aToken.mIdent.length=0;if(this.GatherText(IS_IDCHAR,aToken.mIdent)){aToken.mType=type;}}
return true;},ScanNumber:function(aToken){let c=this.Peek();const sign=c==HYPHEN_MINUS?-1:1;


let intPart=0;


let fracPart=0;



let exponent=0;let expSign=1;aToken.mHasSign=c==PLUS_SIGN||c==HYPHEN_MINUS;if(aToken.mHasSign){this.Advance();c=this.Peek();}
let gotDot=c==FULL_STOP;if(!gotDot){do{intPart=10*intPart+DecimalDigitValue(c);this.Advance();c=this.Peek();}while(IsDigit(c));gotDot=c==FULL_STOP&&IsDigit(this.Peek(1));}
if(gotDot){this.Advance();c=this.Peek(); let divisor=10;do{fracPart+=DecimalDigitValue(c)/divisor;divisor*=10;this.Advance();c=this.Peek();}while(IsDigit(c));}
let gotE=false;if(c==LATIN_SMALL_LETTER_E||c==LATIN_CAPITAL_LETTER_E){const expSignChar=this.Peek(1);const nextChar=this.Peek(2);if(IsDigit(expSignChar)||((expSignChar==HYPHEN_MINUS||expSignChar==PLUS_SIGN)&&IsDigit(nextChar))){gotE=true;if(expSignChar==HYPHEN_MINUS){expSign=-1;}
this.Advance(); if(expSignChar==HYPHEN_MINUS||expSignChar==PLUS_SIGN){this.Advance();c=nextChar;}else{c=expSignChar;}
do{exponent=10*exponent+DecimalDigitValue(c);this.Advance();c=this.Peek();}while(IsDigit(c));}}
let type=eCSSToken_Number;
aToken.mIntegerValid=false;let value=sign*(intPart+fracPart);if(gotE){
value*=Math.pow(10.0,expSign*exponent);}else if(!gotDot){if(sign>0){aToken.mInteger=Math.min(intPart,Number.MAX_SAFE_INTEGER);}else{aToken.mInteger=Math.max(-intPart,Number.MIN_SAFE_INTEGER);}
aToken.mIntegerValid=true;}
const ident=aToken.mIdent;if(c>=0){if(StartsIdent(c,this.Peek(1))){if(this.GatherText(IS_IDCHAR,ident)){type=eCSSToken_Dimension;}}else if(c==PERCENT_SIGN){this.Advance();type=eCSSToken_Percentage;value=value/100.0;aToken.mIntegerValid=false;}}
aToken.mNumber=value;aToken.mType=type;return true;},ScanString:function(aToken){const aStop=this.Peek();aToken.mType=eCSSToken_String;aToken.mSymbol=aStop;this.Advance();for(;;){this.GatherText(IS_STRING,aToken.mIdent);const ch=this.Peek();if(ch==-1){this.AddEOFCharacters(aStop==QUOTATION_MARK?eEOFCharacters_DoubleQuote:eEOFCharacters_SingleQuote);break;}
if(ch==aStop){this.Advance();break;}
if(ch==QUOTATION_MARK||ch==APOSTROPHE){aToken.mIdent.push(ch);this.Advance();continue;}
aToken.mType=eCSSToken_Bad_String;break;}
return true;},ScanURange:function(aResult){const intro1=this.Peek();const intro2=this.Peek(1);let ch=this.Peek(2);aResult.mIdent.push(intro1);aResult.mIdent.push(intro2);this.Advance(2);let valid=true;let haveQues=false;let low=0;let high=0;let i=0;do{aResult.mIdent.push(ch);if(IsHexDigit(ch)){if(haveQues){valid=false;}
low=low*16+HexDigitValue(ch);high=high*16+HexDigitValue(ch);}else{haveQues=true;low=low*16+0x0;high=high*16+0xf;}
i++;this.Advance();ch=this.Peek();}while(i<6&&(IsHexDigit(ch)||ch==QUESTION_MARK));if(ch==HYPHEN_MINUS&&IsHexDigit(this.Peek(1))){if(haveQues){valid=false;}
aResult.mIdent.push(ch);this.Advance();ch=this.Peek();high=0;i=0;do{aResult.mIdent.push(ch);high=high*16+HexDigitValue(ch);i++;this.Advance();ch=this.Peek();}while(i<6&&IsHexDigit(ch));}
aResult.mInteger=low;aResult.mInteger2=high;aResult.mIntegerValid=valid;aResult.mType=eCSSToken_URange;return true;},SetEOFCharacters:function(aEOFCharacters){this.mEOFCharacters=aEOFCharacters;},AddEOFCharacters:function(aEOFCharacters){this.mEOFCharacters=this.mEOFCharacters|aEOFCharacters;},AppendImpliedEOFCharacters:function(aEOFCharacters,aResult){let c=aEOFCharacters>>1;for(const p of kImpliedEOFCharacters){if(c&1){aResult.push(p);}
c>>=1;}},NextURL:function(aToken){this.SkipWhitespace(); aToken.mIdent.length=0;let hasString=false;let ch=this.Peek();if(ch==QUOTATION_MARK||ch==APOSTROPHE){this.ScanString(aToken);if(aToken.mType==eCSSToken_Bad_String){aToken.mType=eCSSToken_Bad_URL;return;}
hasString=true;}else{aToken.mSymbol=0;this.GatherText(IS_URL_CHAR,aToken.mIdent);}
this.SkipWhitespace();ch=this.Peek(); if(ch<0||ch==RIGHT_PARENTHESIS){this.Advance();aToken.mType=eCSSToken_URL;if(ch<0){this.AddEOFCharacters(eEOFCharacters_CloseParen);}}else{aToken.mType=eCSSToken_Bad_URL;if(!hasString){




do{if(IsVertSpace(ch)){this.AdvanceLine();}else{this.Advance();}
ch=this.Peek();}while(ch>=0&&ch!=RIGHT_PARENTHESIS);}}},Next:function(aToken,aSkip){ aToken.mIdent=[];aToken.mType=eCSSToken_Symbol;this.mTokenOffset=this.mOffset;this.mTokenLineOffset=this.mLineOffset;this.mTokenLineNumber=this.mLineNumber;const ch=this.Peek();if(IsWhitespace(ch)){this.SkipWhitespace();aToken.mType=eCSSToken_Whitespace;return true;}
if(ch==SOLIDUS&&this.Peek(1)==ASTERISK){this.SkipComment();aToken.mType=eCSSToken_Comment;return true;} 
if(ch<0){return false;} 
if(ch==LATIN_SMALL_LETTER_U||ch==LATIN_CAPITAL_LETTER_U){const c2=this.Peek(1);const c3=this.Peek(2);if(c2==PLUS_SIGN&&(IsHexDigit(c3)||c3==QUESTION_MARK)){return this.ScanURange(aToken);}
return this.ScanIdent(aToken);} 
if(IsIdentStart(ch)){return this.ScanIdent(aToken);} 
if(IsDigit(ch)){return this.ScanNumber(aToken);}
if(ch==FULL_STOP&&IsDigit(this.Peek(1))){return this.ScanNumber(aToken);}
if(ch==PLUS_SIGN){const c2=this.Peek(1);if(IsDigit(c2)||(c2==FULL_STOP&&IsDigit(this.Peek(2)))){return this.ScanNumber(aToken);}} 
if(ch==HYPHEN_MINUS){const c2=this.Peek(1);const c3=this.Peek(2);if(IsIdentStart(c2)||(c2==HYPHEN_MINUS&&c3!=GREATER_THAN_SIGN)){return this.ScanIdent(aToken);}
if(IsDigit(c2)||(c2==FULL_STOP&&IsDigit(c3))){return this.ScanNumber(aToken);}
if(c2==HYPHEN_MINUS&&c3==GREATER_THAN_SIGN){this.Advance(3);aToken.mType=eCSSToken_HTMLComment;aToken.mIdent=stringToCodes("-->");return true;}} 
if(ch==LESS_THAN_SIGN&&this.Peek(1)==EXCLAMATION_MARK&&this.Peek(2)==HYPHEN_MINUS&&this.Peek(3)==HYPHEN_MINUS){this.Advance(4);aToken.mType=eCSSToken_HTMLComment;aToken.mIdent=stringToCodes("<!--");return true;} 
if(ch==COMMERCIAL_AT){return this.ScanAtKeyword(aToken);} 
if(ch==NUMBER_SIGN){return this.ScanHash(aToken);} 
if(ch==QUOTATION_MARK||ch==APOSTROPHE){return this.ScanString(aToken);}
const opType=MatchOperatorType(ch);if(opType!=eCSSToken_Symbol&&this.Peek(1)==EQUALS_SIGN){aToken.mType=opType;this.Advance(2);return true;}
aToken.mSymbol=ch;this.Advance();return true;},};function getCSSLexer(input){return new Scanner(input);}
exports.getCSSLexer=getCSSLexer;