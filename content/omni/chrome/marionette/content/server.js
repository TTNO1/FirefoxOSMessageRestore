"use strict";const EXPORTED_SYMBOLS=["TCPConnection","TCPListener"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{OS:"resource://gre/modules/osfile.jsm",assert:"chrome://marionette/content/assert.js",Command:"chrome://marionette/content/message.js",DebuggerTransport:"chrome://marionette/content/transport.js",error:"chrome://marionette/content/error.js",GeckoDriver:"chrome://marionette/content/driver.js",Log:"chrome://marionette/content/log.js",MarionettePrefs:"chrome://marionette/content/prefs.js",Message:"chrome://marionette/content/message.js",Response:"chrome://marionette/content/message.js",WebElement:"chrome://marionette/content/element.js",});XPCOMUtils.defineLazyGetter(this,"logger",()=>Log.get());XPCOMUtils.defineLazyGetter(this,"ServerSocket",()=>{return Components.Constructor("@mozilla.org/network/server-socket;1","nsIServerSocket","initSpecialConnection");});const{KeepWhenOffline,LoopbackOnly}=Ci.nsIServerSocket;this.server={};const PROTOCOL_VERSION=3;class TCPListener{constructor(port){this.port=port;this.socket=null;this.conns=new Set();this.nextConnID=0;this.alive=false;}
driverFactory(){MarionettePrefs.contentListener=false;return new GeckoDriver(this);}
set acceptConnections(value){if(value){if(!this.socket){try{const flags=KeepWhenOffline|LoopbackOnly;const backlog=1;this.socket=new ServerSocket(this.port,flags,backlog);}catch(e){throw new Error(`Could not bind to port ${this.port} (${e.name})`);}
this.port=this.socket.port;this.socket.asyncListen(this);logger.info(`Listening on port ${this.port}`);}}else if(this.socket){
this.socket.close();this.socket=null;logger.info(`Stopped listening on port ${this.port}`);}}
start(){if(this.alive){return;} 
this.acceptConnections=true;MarionettePrefs.port=this.port;this.alive=true;}
stop(){if(!this.alive){return;} 
this.acceptConnections=false;this.alive=false;}
onSocketAccepted(serverSocket,clientSocket){let input=clientSocket.openInputStream(0,0,0);let output=clientSocket.openOutputStream(0,0,0);let transport=new DebuggerTransport(input,output);let conn=new TCPConnection(this.nextConnID++,transport,this.driverFactory.bind(this));conn.onclose=this.onConnectionClosed.bind(this);this.conns.add(conn);logger.debug(`Accepted connection ${conn.id} `+`from ${clientSocket.host}:${clientSocket.port}`);conn.sayHello();transport.ready();}
onConnectionClosed(conn){logger.debug(`Closed connection ${conn.id}`);this.conns.delete(conn);}}
this.TCPListener=TCPListener;class TCPConnection{constructor(connID,transport,driverFactory){this.id=connID;this.conn=transport;
 this.conn.hooks=this; this.onclose=null; this.lastID=0;this.driver=driverFactory();this.driver.init();}
onClosed(){this.driver.deleteSession();this.driver.uninit();if(this.onclose){this.onclose(this);}}
onPacket(data){ if(!Array.isArray(data)){let e=new TypeError("Unable to unmarshal packet data: "+JSON.stringify(data));error.report(e);return;} 
let msg;try{msg=Message.fromPacket(data);msg.origin=Message.Origin.Client;this.log_(msg);}catch(e){let resp=this.createResponse(data[1]);resp.sendError(e);return;} 
if(msg instanceof Command){(async()=>{await this.execute(msg);})();}else{logger.fatal("Cannot process messages other than Command");}}
async execute(cmd){let resp=this.createResponse(cmd.id);let sendResponse=()=>resp.sendConditionally(resp=>!resp.sent);let sendError=resp.sendError.bind(resp);await this.despatch(cmd,resp).then(sendResponse,sendError).catch(error.report);}
async despatch(cmd,resp){let fn=this.driver.commands[cmd.name];if(typeof fn=="undefined"){throw new error.UnknownCommandError(cmd.name);}
if(cmd.name!="WebDriver:NewSession"){assert.session(this.driver,"Tried to run command without establishing a connection");}
let rv=await fn.bind(this.driver)(cmd);if(rv!=null){if(rv instanceof WebElement||typeof rv!="object"){resp.body={value:rv};}else{resp.body=rv;}}}
createResponse(msgID){if(typeof msgID!="number"){msgID=-1;}
return new Response(msgID,this.send.bind(this));}
sendError(err,cmdID){let resp=new Response(cmdID,this.send.bind(this));resp.sendError(err);}
sayHello(){let whatHo={applicationType:"gecko",marionetteProtocol:PROTOCOL_VERSION,};this.sendRaw(whatHo);}
send(msg){msg.origin=Message.Origin.Server;if(msg instanceof Response){this.sendToClient(msg);}else{logger.fatal("Cannot send messages other than Response");}}
sendToClient(resp){this.sendMessage(resp);}
sendMessage(msg){this.log_(msg);let payload=msg.toPacket();this.sendRaw(payload);}
sendRaw(payload){this.conn.send(payload);}
log_(msg){let dir=msg.origin==Message.Origin.Client?"->":"<-";logger.debug(`${this.id} ${dir} ${msg}`);}
toString(){return`[object TCPConnection ${this.id}]`;}}
this.TCPConnection=TCPConnection;