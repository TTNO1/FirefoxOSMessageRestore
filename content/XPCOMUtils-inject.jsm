//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
var EXPORTED_SYMBOLS = ["XPCOMUtils"];
let global = Cu.getGlobalForObject({});
const EXTRA_GLOBAL_NAME_TO_IMPORT_NAME = {
    Headers: "fetch",
    MessagePort: "MessageChannel",
    Request: "fetch",
    Response: "fetch",
};

function redefine(object, prop, value) {
    Object.defineProperty(object, prop, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
    });
    return value;
}
var XPCOMUtils = {
    defineLazyGetter: function XPCU_defineLazyGetter(aObject, aName, aLambda) {
        let redefining = false;
        Object.defineProperty(aObject, aName, {
            get: function() {
                if (!redefining) {
                    redefining = true;
                    return redefine(aObject, aName, aLambda.apply(aObject));
                }
            },
            configurable: true,
            enumerable: true
        });
    },
    defineLazyScriptGetter: function XPCU_defineLazyScriptGetter(aObject, aNames, aResource) {
        if (!Array.isArray(aNames)) {
            aNames = [aNames];
        }
        for (let name of aNames) {
            Object.defineProperty(aObject, name, {
                get: function() {
                    Services.scriptloader.loadSubScript(aResource, aObject);
                    return aObject[name];
                },
                set(value) {
                    redefine(aObject, name, value);
                },
                configurable: true,
                enumerable: true
            });
        }
    },
    defineLazyGlobalGetters(aObject, aNames) {
        for (let name of aNames) {
            this.defineLazyGetter(aObject, name, () => {
                if (!(name in global)) {
                    let importName = EXTRA_GLOBAL_NAME_TO_IMPORT_NAME[name] || name;
                    Cu.importGlobalProperties([importName]);
                }
                return global[name];
            });
        }
    },
    defineLazyServiceGetter: function XPCU_defineLazyServiceGetter(aObject, aName, aContract, aInterfaceName) {
        this.defineLazyGetter(aObject, aName, function XPCU_serviceLambda() {
			switch (aContract) {
				case "@mozilla.org/sidl-native/contacts;1":
					return {
						findBlockedNumbers: function(filterParams, callbacks) {
							callbacks.resolve({});
						}
					}
					break;
				default:
					if (aInterfaceName) {
						return Cc[aContract].getService(Ci[aInterfaceName]);
					}
					return Cc[aContract].getService().wrappedJSObject;
					break;
			}
        });
    },
    defineLazyServiceGetters: function XPCU_defineLazyServiceGetters(aObject, aServices) {
        for (let [name, service] of Object.entries(aServices)) {

            this.defineLazyServiceGetter(aObject, name, service[0], service[1] || null);
        }
    },
    defineLazyModuleGetter: function XPCU_defineLazyModuleGetter(aObject, aName, aResource, aSymbol, aPreLambda, aPostLambda, aProxy) {
        if (arguments.length == 3) {
            return ChromeUtils.defineModuleGetter(aObject, aName, aResource);
        }
        let proxy = aProxy || {};
        if (typeof(aPreLambda) === "function") {
            aPreLambda.apply(proxy);
        }
        this.defineLazyGetter(aObject, aName, function XPCU_moduleLambda() {
            var temp = {};
            try {
                ChromeUtils.import(aResource, temp);
                if (typeof(aPostLambda) === "function") {
                    aPostLambda.apply(proxy);
                }
            } catch (ex) {
                Cu.reportError("Failed to load module " + aResource + ".");
                throw ex;
            }
            return temp[aSymbol || aName];
        });
    },
    defineLazyModuleGetters: function XPCU_defineLazyModuleGetters(aObject, aModules) {
        for (let [name, module] of Object.entries(aModules)) {
            ChromeUtils.defineModuleGetter(aObject, name, module);
        }
    },
    defineLazyPreferenceGetter: function XPCU_defineLazyPreferenceGetter(aObject, aName, aPreference, aDefaultValue = null, aOnUpdate = null, aTransform = val => val) {



        let observer = {
            QueryInterface: XPCU_lazyPreferenceObserverQI,
            value: undefined,
            observe(subject, topic, data) {
                if (data == aPreference) {
                    if (aOnUpdate) {
                        let previous = this.value;
                        this.value = undefined;
                        let latest = lazyGetter();
                        aOnUpdate(data, previous, latest);
                    } else {
                        this.value = undefined;
                    }
                }
            },
        }
        let defineGetter = get => {
            Object.defineProperty(aObject, aName, {
                configurable: true,
                enumerable: true,
                get,
            });
        };

        function lazyGetter() {
            if (observer.value === undefined) {
                let prefValue;
                switch (Services.prefs.getPrefType(aPreference)) {
                    case Ci.nsIPrefBranch.PREF_STRING:
                        prefValue = Services.prefs.getStringPref(aPreference);
                        break;
                    case Ci.nsIPrefBranch.PREF_INT:
                        prefValue = Services.prefs.getIntPref(aPreference);
                        break;
                    case Ci.nsIPrefBranch.PREF_BOOL:
                        prefValue = Services.prefs.getBoolPref(aPreference);
                        break;
                    case Ci.nsIPrefBranch.PREF_INVALID:
                        prefValue = aDefaultValue;
                        break;
                    default:
                        throw new Error(`Error getting pref ${aPreference}; its value's type is ` + `${Services.prefs.getPrefType(aPreference)}, which I don't ` + `know how to handle.`);
                }
                observer.value = aTransform(prefValue);
            }
            return observer.value;
        }
        defineGetter(() => {
            Services.prefs.addObserver(aPreference, observer, true);
            defineGetter(lazyGetter);
            return lazyGetter();
        });
    },
    defineConstant: function XPCOMUtils__defineConstant(aObj, aName, aValue) {
        Object.defineProperty(aObj, aName, {
            value: aValue,
            enumerable: true,
            writable: false
        });
    },
    defineLazyProxy: function XPCOMUtils__defineLazyProxy(aObject, aName, aInitFuncOrResource, aStubProperties, aUntrapCallback) {
        let initFunc = aInitFuncOrResource;
        if (typeof(aInitFuncOrResource) == "string") {
            initFunc = function() {
                let tmp = {};
                ChromeUtils.import(aInitFuncOrResource, tmp);
                return tmp[aName];
            };
        }
        let handler = new LazyProxyHandler(aName, initFunc, aStubProperties, aUntrapCallback);
        let proxy = new Proxy({}, handler);
        if (aObject) {
            Object.defineProperty(aObject, aName, {
                value: proxy,
                enumerable: true,
                writable: true,
            });
        }
        return proxy;
    },
};
class LazyProxyHandler {
    constructor(aName, aInitFunc, aStubProperties, aUntrapCallback) {
        this.pending = true;
        this.name = aName;
        this.initFuncOrResource = aInitFunc;
        this.stubProperties = aStubProperties;
        this.untrapCallback = aUntrapCallback;
    }
    getObject() {
        if (this.pending) {
            this.realObject = this.initFuncOrResource.call(null);
            if (this.untrapCallback) {
                this.untrapCallback.call(null, this.realObject);
                this.untrapCallback = null;
            }
            this.pending = false;
            this.stubProperties = null;
        }
        return this.realObject;
    }
    getPrototypeOf(target) {
        return Reflect.getPrototypeOf(this.getObject());
    }
    setPrototypeOf(target, prototype) {
        return Reflect.setPrototypeOf(this.getObject(), prototype);
    }
    isExtensible(target) {
        return Reflect.isExtensible(this.getObject());
    }
    preventExtensions(target) {
        return Reflect.preventExtensions(this.getObject());
    }
    getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(this.getObject(), prop);
    }
    defineProperty(target, prop, descriptor) {
        return Reflect.defineProperty(this.getObject(), prop, descriptor);
    }
    has(target, prop) {
        return Reflect.has(this.getObject(), prop);
    }
    get(target, prop, receiver) {
        if (this.pending && this.stubProperties && Object.prototype.hasOwnProperty.call(this.stubProperties, prop)) {
            return this.stubProperties[prop];
        }
        return Reflect.get(this.getObject(), prop, receiver);
    }
    set(target, prop, value, receiver) {
        return Reflect.set(this.getObject(), prop, value, receiver);
    }
    deleteProperty(target, prop) {
        return Reflect.deleteProperty(this.getObject(), prop);
    }
    ownKeys(target) {
        return Reflect.ownKeys(this.getObject());
    }
}
var XPCU_lazyPreferenceObserverQI = ChromeUtils.generateQI(["nsIObserver", "nsISupportsWeakReference"]);
ChromeUtils.defineModuleGetter(this, "Services", "resource://gre/modules/Services.jsm");