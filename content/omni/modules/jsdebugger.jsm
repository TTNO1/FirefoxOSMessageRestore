//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS=["addDebuggerToGlobal","addSandboxedDebuggerToGlobal"];const init=Cc["@mozilla.org/jsdebugger;1"].createInstance(Ci.IJSDebugger);function addDebuggerToGlobal(global){init.addClass(global);initPromiseDebugging(global);}

function addSandboxedDebuggerToGlobal(global){var sb=Cu.Sandbox(global,{freshCompartment:true});addDebuggerToGlobal(sb);global.Debugger=sb.Debugger;}
function initPromiseDebugging(global){if(global.Debugger.Object.prototype.PromiseDebugging){return;}

if(!PromiseDebugging.getDependentPromises){return;}
global.Debugger.Object.prototype.PromiseDebugging=PromiseDebugging;global.eval(polyfillSource);}
let polyfillSource=`
  Object.defineProperty(Debugger.Object.prototype, "promiseState", {
    get() {
      const state = this.PromiseDebugging.getState(this.unsafeDereference());
      return {
        state: state.state,
        value: this.makeDebuggeeValue(state.value),
        reason: this.makeDebuggeeValue(state.reason)
      };
    }
  });
  Object.defineProperty(Debugger.Object.prototype, "promiseLifetime", {
    get() {
      return this.PromiseDebugging.getPromiseLifetime(this.unsafeDereference());
    }
  });
  Object.defineProperty(Debugger.Object.prototype, "promiseTimeToResolution", {
    get() {
      return this.PromiseDebugging.getTimeToSettle(this.unsafeDereference());
    }
  });
  Object.defineProperty(Debugger.Object.prototype, "promiseDependentPromises", {
    get() {
      let promises = this.PromiseDebugging.getDependentPromises(this.unsafeDereference());
      return promises.map(p => this.makeDebuggeeValue(p));
    }
  });
  Object.defineProperty(Debugger.Object.prototype, "promiseAllocationSite", {
    get() {
      return this.PromiseDebugging.getAllocationStack(this.unsafeDereference());
    }
  });
  Object.defineProperty(Debugger.Object.prototype, "promiseResolutionSite", {
    get() {
      let state = this.promiseState.state;
      if (state === "fulfilled") {
        return this.PromiseDebugging.getFullfillmentStack(this.unsafeDereference());
      } else {
        return this.PromiseDebugging.getRejectionStack(this.unsafeDereference());
      }
    }
  });
`;