//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");this.EXPORTED_SYMBOLS=["StateMachine"];const DEBUG=false;this.StateMachine=function(aDebugTag){function debug(aMsg){dump("-*- StateMachine:"+aDebugTag+": "+aMsg);}
var sm={};var _initialState;var _curState;var _prevState;var _paused;var _eventQueue=[];var _deferredEventQueue=[];var _defaultEventHandler;sm.setDefaultEventHandler=function(aDefaultEventHandler){_defaultEventHandler=aDefaultEventHandler;};sm.start=function(aInitialState){_initialState=aInitialState;sm.gotoState(_initialState);};sm.sendEvent=function(aEvent){if(!_initialState){if(DEBUG){debug("StateMachine is not running. Call StateMachine.start() first.");}
return;}
_eventQueue.push(aEvent);asyncCall(handleFirstEvent);};sm.getPreviousState=function(){return _prevState;};sm.getCurrentState=function(){return _curState;};sm.makeState=function(aName,aDelegate){if(!aDelegate.handleEvent){throw Components.Exception("handleEvent is a required delegate function",Cr.NS_ERROR_INVALID_ARG);}
var nop=function(){};return{name:aName,enter:aDelegate.enter||nop,exit:aDelegate.exit||nop,handleEvent:aDelegate.handleEvent,};};sm.deferEvent=function(aEvent){



if(DEBUG){debug("Deferring event: "+JSON.stringify(aEvent));}
_deferredEventQueue.push(aEvent);};
sm.gotoState=function(aNewState){if(_curState){if(DEBUG){debug("exiting state: "+_curState.name);}
_curState.exit();}
_prevState=_curState;_curState=aNewState;if(DEBUG){debug("entering state: "+_curState.name);}
_curState.enter();
handleDeferredEvents();sm.resume();};sm.pause=function(){_paused=true;};sm.resume=function(){_paused=false;asyncCall(handleFirstEvent);};
function asyncCall(f){Services.tm.currentThread.dispatch(f,Ci.nsIThread.DISPATCH_NORMAL);}
function handleFirstEvent(){var hadDeferredEvents;if(0===_eventQueue.length){return;}
if(_paused){return;}
hadDeferredEvents=_deferredEventQueue.length>0;handleOneEvent(_eventQueue.shift());
if(hadDeferredEvents){handleDeferredEvents();}
handleFirstEvent();}
function handleDeferredEvents(){if(_deferredEventQueue.length&&DEBUG){debug("Handle deferred events: "+_deferredEventQueue.length);}
for(let i=0;i<_deferredEventQueue.length;i++){handleOneEvent(_deferredEventQueue.shift());}}
function handleOneEvent(aEvent){if(DEBUG){debug("Handling event: "+JSON.stringify(aEvent));}
var handled=_curState.handleEvent(aEvent);if(undefined===handled){throw Components.Exception("handleEvent returns undefined: "+_curState.name,Cr.NS_ERROR_INVALID_ARG);}
if(!handled){handled=_defaultEventHandler?_defaultEventHandler(aEvent):handled;}
if(undefined===handled){throw Components.Exception("handleEventCommon returns undefined: "+_curState.name,Cr.NS_ERROR_INVALID_ARG);}
if(!handled){if(DEBUG){debug("!!!!!!!!! FIXME !!!!!!!!! Event not handled: "+
JSON.stringify(aEvent));}}
return handled;}
return sm;};