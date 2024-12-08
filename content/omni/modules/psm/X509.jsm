"use strict";var{DER}=ChromeUtils.import("resource://gre/modules/psm/DER.jsm");const ERROR_UNSUPPORTED_ASN1="unsupported asn.1";const ERROR_TIME_NOT_VALID="Time not valid";const ERROR_LIBRARY_FAILURE="library failure";const X509v3=2;function readNULL(der){return new NULL(der.readTagAndGetContents(DER.NULL));}
class NULL{constructor(bytes){ this._contents=bytes;}}
function readOID(der){return new OID(der.readTagAndGetContents(DER.OBJECT_IDENTIFIER));}
class OID{constructor(bytes){this._values=[];
 
let value1=Math.floor(bytes[0]/40);let value2=bytes[0]-40*value1;this._values.push(value1);this._values.push(value2);bytes.shift();let accumulator=0; while(bytes.length>0){let value=bytes.shift();accumulator*=128;if(value>128){accumulator+=value-128;}else{accumulator+=value;this._values.push(accumulator);accumulator=0;}}}}
class DecodedDER{constructor(){this._der=null;this._error=null;}
get error(){return this._error;}
parseOverride(){throw new Error(ERROR_LIBRARY_FAILURE);}
parse(bytes){this._der=new DER.DERDecoder(bytes);try{this.parseOverride();}catch(e){this._error=e;}}}
function readSEQUENCEAndMakeDER(der){return new DER.DERDecoder(der.readTagAndGetContents(DER.SEQUENCE));}
function readTagAndMakeDER(der,tag){return new DER.DERDecoder(der.readTagAndGetContents(tag));}
class Certificate extends DecodedDER{constructor(){super();this._tbsCertificate=new TBSCertificate();this._signatureAlgorithm=new AlgorithmIdentifier();this._signatureValue=[];}
get tbsCertificate(){return this._tbsCertificate;}
get signatureAlgorithm(){return this._signatureAlgorithm;}
get signatureValue(){return this._signatureValue;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);this._tbsCertificate.parse(contents.readTLV());this._signatureAlgorithm.parse(contents.readTLV());let signatureValue=contents.readBIT_STRING();if(signatureValue.unusedBits!=0){throw new Error(ERROR_UNSUPPORTED_ASN1);}
this._signatureValue=signatureValue.contents;contents.assertAtEnd();this._der.assertAtEnd();}}




class TBSCertificate extends DecodedDER{constructor(){super();this._version=null;this._serialNumber=[];this._signature=new AlgorithmIdentifier();this._issuer=new Name();this._validity=new Validity();this._subject=new Name();this._subjectPublicKeyInfo=new SubjectPublicKeyInfo();this._extensions=[];}
get version(){return this._version;}
get serialNumber(){return this._serialNumber;}
get signature(){return this._signature;}
get issuer(){return this._issuer;}
get validity(){return this._validity;}
get subject(){return this._subject;}
get subjectPublicKeyInfo(){return this._subjectPublicKeyInfo;}
get extensions(){return this._extensions;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);let versionTag=DER.CONTEXT_SPECIFIC|DER.CONSTRUCTED|0;if(!contents.peekTag(versionTag)){this._version=1;}else{let versionContents=readTagAndMakeDER(contents,versionTag);let versionBytes=versionContents.readTagAndGetContents(DER.INTEGER);if(versionBytes.length==1&&versionBytes[0]==X509v3){this._version=3;}else{
this._version=versionBytes;}
versionContents.assertAtEnd();}
let serialNumberBytes=contents.readTagAndGetContents(DER.INTEGER);this._serialNumber=serialNumberBytes;this._signature.parse(contents.readTLV());this._issuer.parse(contents.readTLV());this._validity.parse(contents.readTLV());this._subject.parse(contents.readTLV());this._subjectPublicKeyInfo.parse(contents.readTLV()); let issuerUniqueIDTag=DER.CONTEXT_SPECIFIC|DER.CONSTRUCTED|1;if(contents.peekTag(issuerUniqueIDTag)){contents.readTagAndGetContents(issuerUniqueIDTag);}
let subjectUniqueIDTag=DER.CONTEXT_SPECIFIC|DER.CONSTRUCTED|2;if(contents.peekTag(subjectUniqueIDTag)){contents.readTagAndGetContents(subjectUniqueIDTag);}
let extensionsTag=DER.CONTEXT_SPECIFIC|DER.CONSTRUCTED|3;if(contents.peekTag(extensionsTag)){let extensionsSequence=readTagAndMakeDER(contents,extensionsTag);let extensionsContents=readSEQUENCEAndMakeDER(extensionsSequence);while(!extensionsContents.atEnd()){ this._extensions.push(extensionsContents.readTLV());}
extensionsContents.assertAtEnd();extensionsSequence.assertAtEnd();}
contents.assertAtEnd();this._der.assertAtEnd();}}
class AlgorithmIdentifier extends DecodedDER{constructor(){super();this._algorithm=null;this._parameters=null;}
get algorithm(){return this._algorithm;}
get parameters(){return this._parameters;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);this._algorithm=readOID(contents);if(!contents.atEnd()){if(contents.peekTag(DER.NULL)){this._parameters=readNULL(contents);}else if(contents.peekTag(DER.OBJECT_IDENTIFIER)){this._parameters=readOID(contents);}}
contents.assertAtEnd();this._der.assertAtEnd();}}
class Name extends DecodedDER{constructor(){super();this._rdns=[];}
get rdns(){return this._rdns;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);while(!contents.atEnd()){let rdn=new RelativeDistinguishedName();rdn.parse(contents.readTLV());this._rdns.push(rdn);}
contents.assertAtEnd();this._der.assertAtEnd();}}
class RelativeDistinguishedName extends DecodedDER{constructor(){super();this._avas=[];}
get avas(){return this._avas;}
parseOverride(){let contents=readTagAndMakeDER(this._der,DER.SET); while(!contents.atEnd()){let ava=new AttributeTypeAndValue();ava.parse(contents.readTLV());this._avas.push(ava);}
contents.assertAtEnd();this._der.assertAtEnd();}}

class AttributeTypeAndValue extends DecodedDER{constructor(){super();this._type=null;this._value=new DirectoryString();}
get type(){return this._type;}
get value(){return this._value;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);this._type=readOID(contents);this._value.parse(contents.readTLVChoice([DER.UTF8String,DER.PrintableString,DER.TeletexString,DER.IA5String,]));contents.assertAtEnd();this._der.assertAtEnd();}}
class DirectoryString extends DecodedDER{constructor(){super();this._type=null;this._value=null;}
get type(){return this._type;}
get value(){return this._value;}
parseOverride(){if(this._der.peekTag(DER.UTF8String)){this._type=DER.UTF8String;}else if(this._der.peekTag(DER.PrintableString)){this._type=DER.PrintableString;}else if(this._der.peekTag(DER.TeletexString)){this._type=DER.TeletexString;}else if(this._der.peekTag(DER.IA5String)){this._type=DER.IA5String;} 
this._value=this._der.readTagAndGetContents(this._type);this._der.assertAtEnd();}}
class Time extends DecodedDER{constructor(){super();this._type=null;this._time=null;}
get time(){return this._time;}
parseOverride(){if(this._der.peekTag(DER.UTCTime)){this._type=DER.UTCTime;}else if(this._der.peekTag(DER.GeneralizedTime)){this._type=DER.GeneralizedTime;}
let contents=readTagAndMakeDER(this._der,this._type);let year;
if(this._type==DER.UTCTime){
let y1=this._validateDigit(contents.readByte());let y2=this._validateDigit(contents.readByte());let yy=y1*10+y2;if(yy>=50){year=1900+yy;}else{year=2000+yy;}}else{year=0;for(let i=0;i<4;i++){let y=this._validateDigit(contents.readByte());year=year*10+y;}}
let m1=this._validateDigit(contents.readByte());let m2=this._validateDigit(contents.readByte());let month=m1*10+m2;if(month==0||month>12){throw new Error(ERROR_TIME_NOT_VALID);}
let d1=this._validateDigit(contents.readByte());let d2=this._validateDigit(contents.readByte());let day=d1*10+d2;if(day==0||day>31){throw new Error(ERROR_TIME_NOT_VALID);}
let h1=this._validateDigit(contents.readByte());let h2=this._validateDigit(contents.readByte());let hour=h1*10+h2;if(hour>23){throw new Error(ERROR_TIME_NOT_VALID);}
let min1=this._validateDigit(contents.readByte());let min2=this._validateDigit(contents.readByte());let minute=min1*10+min2;if(minute>59){throw new Error(ERROR_TIME_NOT_VALID);}
let s1=this._validateDigit(contents.readByte());let s2=this._validateDigit(contents.readByte());let second=s1*10+s2;if(second>60){ throw new Error(ERROR_TIME_NOT_VALID);}
let z=contents.readByte();if(z!="Z".charCodeAt(0)){throw new Error(ERROR_TIME_NOT_VALID);}
 
this._time=new Date(Date.UTC(year,month-1,day,hour,minute,second));contents.assertAtEnd();this._der.assertAtEnd();}
_validateDigit(d){if(d<"0".charCodeAt(0)||d>"9".charCodeAt(0)){throw new Error(ERROR_TIME_NOT_VALID);}
return d-"0".charCodeAt(0);}}
class Validity extends DecodedDER{constructor(){super();this._notBefore=new Time();this._notAfter=new Time();}
get notBefore(){return this._notBefore;}
get notAfter(){return this._notAfter;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);this._notBefore.parse(contents.readTLVChoice([DER.UTCTime,DER.GeneralizedTime]));this._notAfter.parse(contents.readTLVChoice([DER.UTCTime,DER.GeneralizedTime]));contents.assertAtEnd();this._der.assertAtEnd();}}
class SubjectPublicKeyInfo extends DecodedDER{constructor(){super();this._algorithm=new AlgorithmIdentifier();this._subjectPublicKey=null;}
get algorithm(){return this._algorithm;}
get subjectPublicKey(){return this._subjectPublicKey;}
parseOverride(){let contents=readSEQUENCEAndMakeDER(this._der);this._algorithm.parse(contents.readTLV());let subjectPublicKeyBitString=contents.readBIT_STRING();if(subjectPublicKeyBitString.unusedBits!=0){throw new Error(ERROR_UNSUPPORTED_ASN1);}
this._subjectPublicKey=subjectPublicKeyBitString.contents;contents.assertAtEnd();this._der.assertAtEnd();}}
var X509={Certificate};var EXPORTED_SYMBOLS=["X509"];