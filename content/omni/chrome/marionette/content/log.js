"use strict";const EXPORTED_SYMBOLS=["Log"];const StdLog=ChromeUtils.import("resource://gre/modules/Log.jsm",{}).Log;const PREF_LOG_LEVEL="marionette.log.level";class Log{static get(){let logger=StdLog.repository.getLogger("Marionette");if(logger.ownAppenders.length==0){logger.addAppender(new StdLog.DumpAppender());logger.manageLevelFromPref(PREF_LOG_LEVEL);}
return logger;}
static getWithPrefix(prefix){this.get();return StdLog.repository.getLoggerWithMessagePrefix("Marionette",`[${prefix}] `);}}
this.Log=Log;