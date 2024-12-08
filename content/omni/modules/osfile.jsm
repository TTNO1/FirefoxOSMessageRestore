//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
if(typeof Components!="undefined"){this.EXPORTED_SYMBOLS=["OS"];ChromeUtils.import("resource://gre/modules/osfile/osfile_async_front.jsm",this);}else{importScripts("resource://gre/modules/workers/require.js");var SharedAll=require("resource://gre/modules/osfile/osfile_shared_allthreads.jsm");

if(SharedAll.Constants.Win){importScripts("resource://gre/modules/osfile/osfile_win_back.jsm","resource://gre/modules/osfile/osfile_shared_front.jsm","resource://gre/modules/osfile/osfile_win_front.jsm");}else{importScripts("resource://gre/modules/osfile/osfile_unix_back.jsm","resource://gre/modules/osfile/osfile_shared_front.jsm","resource://gre/modules/osfile/osfile_unix_front.jsm");}
OS.Path=require("resource://gre/modules/osfile/ospath.jsm");}