"use strict";

class ConsoleAPIListener{constructor(window,listener,consoleID){this.window=window;this.listener=listener;this.consoleID=consoleID;this.observe=this.observe.bind(this);}
init(){setConsoleEventHandler(this.observe);}
destroy(){setConsoleEventHandler(null);}
observe(message){this.listener(message.wrappedJSObject);}
getCachedMessages(){return retrieveConsoleEvents();}}
exports.ConsoleAPIListener=ConsoleAPIListener;