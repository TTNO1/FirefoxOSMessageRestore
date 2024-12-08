"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");ChromeUtils.defineModuleGetter(this,"PdfStreamConverter","resource://pdf.js/PdfStreamConverter.jsm");function StreamConverterFactory(){if(!Services.prefs.getBoolPref("pdfjs.disabled",false)){return new PdfStreamConverter();}
throw Components.Exception("",Cr.NS_ERROR_FACTORY_NOT_REGISTERED);}
var EXPORTED_SYMBOLS=["StreamConverterFactory"];