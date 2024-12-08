//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";
const {
    XPCOMUtils
} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const {
    Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["indexedDB"]);
XPCOMUtils.defineLazyGetter(this, "RIL", function() {
    let obj = ChromeUtils.import("resource://gre/modules/ril_consts.js");
    return obj;
});
XPCOMUtils.defineLazyGetter(this, "SIM", function() {
    return ChromeUtils.import("resource://gre/modules/simIOHelper.js");
});
XPCOMUtils.defineLazyModuleGetter(this, "gPhoneNumberUtils", "resource://gre/modules/PhoneNumberUtils.jsm", "PhoneNumberUtils");
XPCOMUtils.defineLazyServiceGetter(this, "gContactsManager", "@mozilla.org/sidl-native/contacts;1", "nsIContactsManager");
const RIL_GETMESSAGESCURSOR_CID = Components.ID("{484d1ad8-840e-4782-9dc4-9ebc4d914937}");
const RIL_GETTHREADSCURSOR_CID = Components.ID("{95ee7c3e-d6f2-4ec4-ade5-0c453c036d35}");
const DISABLE_MMS_GROUPING_FOR_RECEIVING = false;
const DB_VERSION = 1;
const MESSAGE_STORE_NAME = "sms";
const THREAD_STORE_NAME = "thread";
const PARTICIPANT_STORE_NAME = "participant";
const SMS_SEGMENT_STORE_NAME = "sms-segment";
const CELLBROADCAST_STORE_NAME = "cellbroadcast";
const DELIVERY_SENDING = "sending";
const DELIVERY_SENT = "sent";
const DELIVERY_RECEIVED = "received";
const DELIVERY_NOT_DOWNLOADED = "not-downloaded";
const DELIVERY_ERROR = "error";
const DELIVERY_STATUS_NOT_APPLICABLE = "not-applicable";
const DELIVERY_STATUS_SUCCESS = "success";
const DELIVERY_STATUS_PENDING = "pending";
const DELIVERY_STATUS_ERROR = "error";
const MESSAGE_CLASS_NORMAL = "normal";
const ATTACHMENT_STATUS_NONE = "none";
const ATTACHMENT_STATUS_NOT_DOWNLOADED = "not-downloaded";
const ATTACHMENT_STATUS_DOWNLOADED = "downloaded";
const FILTER_READ_UNREAD = 0;
const FILTER_READ_READ = 1;
const READ_ONLY = "readonly";
const READ_WRITE = "readwrite";
const PREV = "prev";
const NEXT = "next";
const COLLECT_ID_END = 0;
const COLLECT_ID_ERROR = -1;
const COLLECT_TIMESTAMP_UNUSED = 0;
const DEFAULT_READ_AHEAD_ENTRIES = 7;
XPCOMUtils.defineLazyServiceGetter(this, "gMobileMessageService", "@mozilla.org/mobilemessage/mobilemessageservice;1", "nsIMobileMessageService");
XPCOMUtils.defineLazyServiceGetter(this, "gMMSService", "@mozilla.org/mms/gonkmmsservice;1", "nsIMmsService");
XPCOMUtils.defineLazyGetter(this, "MMS", function() {
    let MMS = {};
    ChromeUtils.import("resource://gre/modules/MmsPduHelper.jsm", MMS);
    return MMS;
});
var RIL_DEBUG = ChromeUtils.import("resource://gre/modules/ril_consts_debug.js");
var DEBUG = RIL_DEBUG.DEBUG_RIL;
this.MobileMessageDB = function() {
    this._updateDebugFlag();
};
MobileMessageDB.prototype = {
    dbName: null,
    dbVersion: null,
    db: null,
    lastMessageId: 0,
    _updateDebugFlag() {
        try {
            DEBUG = RIL_DEBUG.DEBUG_RIL || Services.prefs.getBoolPref(RIL_DEBUG.PREF_RIL_DEBUG_ENABLED);
        } catch (e) {}
    },
    getAttachmentStatus(aMessageRecord) {
        if (aMessageRecord && aMessageRecord.type == "mms") {
            if (aMessageRecord.delivery == DELIVERY_NOT_DOWNLOADED) {
                return ATTACHMENT_STATUS_NOT_DOWNLOADED;
            }
            let parts = aMessageRecord.parts;
            if (!parts) {
                return ATTACHMENT_STATUS_NONE;
            }
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                if (!part) {
                    continue;
                }
                let partHeaders = part.headers;
                if (partHeaders["content-type"].media != "application/smil" && partHeaders["content-type"].media != "text/plain") {
                    return ATTACHMENT_STATUS_DOWNLOADED;
                }
            }
        }
        return ATTACHMENT_STATUS_NONE;
    },
    ensureDB(callback) {
        if (this.db) {
            if (DEBUG) {
                debug("ensureDB: already have a database, returning early.");
            }
            callback(null, this.db);
            return;
        }
        let self = this;

        function gotDB(db) {
            self.db = db;
            callback(null, db);
        }
        let request = indexedDB.open(this.dbName, this.dbVersion);
        request.onsuccess = function(event) {
            if (DEBUG) {
                debug("Opened database:", self.dbName, self.dbVersion);
            }
            gotDB(event.target.result);
        };
        request.onupgradeneeded = function(event) {
            if (DEBUG) {
                debug("Database needs upgrade:", self.dbName, event.oldVersion, event.newVersion);
                debug("Correct new database version:", event.newVersion == self.dbVersion);
            }
            let db = event.target.result;
            let currentVersion = event.oldVersion;

            function update(currentVersion) {
                if (currentVersion >= self.dbVersion) {
                    if (DEBUG) {
                        debug("Upgrade finished.");
                    }
                    return;
                }
                let next = update.bind(self, currentVersion + 1);
                if (DEBUG) {
                    debug("Upgrade to version " + (currentVersion + 1));
                }
                switch (currentVersion) {
                    case 0:
                        self.createSchema(db, next);
                        break;
                    default:
                        event.target.transaction.abort();
                        if (DEBUG) {
                            debug("unexpected db version: " + event.oldVersion);
                        }
                        callback(Cr.NS_ERROR_FAILURE, null);
                        break;
                }
            }
            update(currentVersion);
        };
        request.onerror = function(event) {
            if (DEBUG) {
                debug("Error opening database!");
            }
            callback(Cr.NS_ERROR_FAILURE, null);
        };
        request.onblocked = function(event) {
            if (DEBUG) {
                debug("Opening database request is blocked.");
            }
            callback(Cr.NS_ERROR_FAILURE, null);
        };
    },
    newTxn(txn_type, callback, storeNames) {
        if (!storeNames) {
            storeNames = [MESSAGE_STORE_NAME];
        }
        if (DEBUG) {
            debug("Opening transaction for object stores: " + storeNames);
        }
        this.ensureDB(function(error, db) {
            if (error) {
                if (DEBUG) {
                    debug("Could not open database: " + error);
                }
                callback(error);
                return;
            }
            let txn = db.transaction(storeNames, txn_type);
            if (DEBUG) {
                debug("Started transaction " + txn + " of type " + txn_type);
            }
            if (DEBUG) {
                txn.oncomplete = function(event) {
                    debug("Transaction " + txn + " completed.");
                };
                txn.onerror = function(event) {
                    debug("Error occurred during transaction: " + event.target.error.name);
                };
            }
            let stores;
            if (storeNames.length == 1) {
                if (DEBUG) {
                    debug("Retrieving object store " + storeNames[0]);
                }
                stores = txn.objectStore(storeNames[0]);
            } else {
                stores = [];
                for (let storeName of storeNames) {
                    if (DEBUG) {
                        debug("Retrieving object store " + storeName);
                    }
                    stores.push(txn.objectStore(storeName));
                }
            }
            callback(null, txn, stores);
        });
    },
    init(aDbName, aDbVersion, aCallback) {
        this.dbName = aDbName;
        this.dbVersion = aDbVersion || DB_VERSION;
        if (DEBUG) {
            debug("MobileMessageDB init");
        }
        let self = this;
        this.newTxn(READ_ONLY, function(error, txn, messageStore) {
            if (error) {
                if (aCallback) {
                    aCallback(error);
                }
                return;
            }
            if (aCallback) {
                txn.oncomplete = function() {
                    aCallback(null);
                };
            }

            let request = messageStore.openCursor(null, PREV);
            request.onsuccess = function(event) {
                let cursor = event.target.result;
                if (!cursor) {
                    if (DEBUG) {
                        debug("Could not get the last key from mobile message database. " + "Probably empty database");
                    }
                    return;
                }
                self.lastMessageId = cursor.key || 0;
                if (DEBUG) {
                    debug("Last assigned message ID was " + self.lastMessageId);
                }
            };
            request.onerror = function(event) {
                if (DEBUG) {
                    debug("Could not get the last key from mobile message database " +
                        event.target.error.name);
                }
            };
        });
    },
    close() {
        if (!this.db) {
            return;
        }
        this.db.close();
        this.db = null;
        this.lastMessageId = 0;
    },
    updatePendingTransactionToError(aError) {
        if (aError) {
            return;
        }
        this.newTxn(READ_WRITE, function(error, txn, messageStore) {
            if (error) {
                return;
            }
            let deliveryIndex = messageStore.index("delivery");
            let keyRange = IDBKeyRange.bound([DELIVERY_SENDING, 0], [DELIVERY_SENDING, ""]);
            let cursorRequestSending = deliveryIndex.openCursor(keyRange);
            cursorRequestSending.onsuccess = function(event) {
                let messageCursor = event.target.result;
                if (!messageCursor) {
                    return;
                }
                let messageRecord = messageCursor.value;
                if (DEBUG) {
                    debug("updatePendingTransactionToError: update message " +
                        messageRecord.id + " to " +
                        DELIVERY_ERROR);
                }
                messageRecord.delivery = DELIVERY_ERROR;
                messageRecord.deliveryIndex = [DELIVERY_ERROR, messageRecord.timestamp];
                if (messageRecord.type == "sms") {
                    messageRecord.deliveryStatus = DELIVERY_STATUS_ERROR;
                } else {
                    for (let i = 0; i < messageRecord.deliveryInfo.length; i++) {
                        if (DEBUG) {
                            debug("updatePendingTransactionToError: update message " +
                                messageRecord.id + " deliveryStatus from " +
                                messageRecord.deliveryInfo[i].deliveryStatus + " to " +
                                DELIVERY_STATUS_ERROR);
                        }
                        messageRecord.deliveryInfo[i].deliveryStatus = DELIVERY_STATUS_ERROR;
                    }
                }
                messageCursor.update(messageRecord);
                messageCursor.continue();
            };
            keyRange = IDBKeyRange.bound([DELIVERY_NOT_DOWNLOADED, 0], [DELIVERY_NOT_DOWNLOADED, ""]);
            let cursorRequestNotDownloaded = deliveryIndex.openCursor(keyRange);
            cursorRequestNotDownloaded.onsuccess = function(event) {
                let messageCursor = event.target.result;
                if (!messageCursor) {
                    return;
                }
                let messageRecord = messageCursor.value;
                if (messageRecord.type == "sms") {
                    messageCursor.continue();
                    return;
                }
                let deliveryInfo = messageRecord.deliveryInfo;
                if (deliveryInfo.length == 1 && deliveryInfo[0].deliveryStatus == DELIVERY_STATUS_PENDING) {
                    deliveryInfo[0].deliveryStatus = DELIVERY_STATUS_ERROR;
                }
                messageCursor.update(messageRecord);
                messageCursor.continue();
            };
        });
    },
    createSchema(db, next) {
        let messageStore = db.createObjectStore(MESSAGE_STORE_NAME, {
            keyPath: "id",
        });
        messageStore.createIndex("timestamp", "timestamp", {
            unique: false
        });
        messageStore.createIndex("delivery", "deliveryIndex");
        messageStore.createIndex("read", "readIndex");
        messageStore.createIndex("threadId", "threadIdIndex");
        messageStore.createIndex("participantIds", "participantIdsIndex", {
            multiEntry: true,
        });
        messageStore.createIndex("transactionId", "transactionIdIndex", {
            unique: true,
        });
        messageStore.createIndex("envelopeId", "envelopeIdIndex", {
            unique: true
        });
        if (DEBUG) {
            debug("Created object stores and indexes");
        }
        let participantStore = db.createObjectStore(PARTICIPANT_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
        });
        participantStore.createIndex("addresses", "addresses", {
            multiEntry: true,
        });
        let threadStore = db.createObjectStore(THREAD_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
        });
        threadStore.createIndex("participantIds", "participantIds");
        threadStore.createIndex("lastTimestamp", "lastTimestamp");
        let smsSegmentStore = db.createObjectStore(SMS_SEGMENT_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
        });
        smsSegmentStore.createIndex("hash", "hash", {
            unique: true
        });
        let cellBroadcastStore = db.createObjectStore(CELLBROADCAST_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
        });
        cellBroadcastStore.createIndex("hash", "hash", {
            unique: true
        });
        next();
    },
    matchParsedPhoneNumbers(addr1, parsedAddr1, addr2, parsedAddr2) {
        if ((parsedAddr1.internationalNumber && parsedAddr1.internationalNumber === parsedAddr2.internationalNumber) || (parsedAddr1.nationalNumber && parsedAddr1.nationalNumber === parsedAddr2.nationalNumber)) {
            return true;
        }
        if (parsedAddr1.countryName != parsedAddr2.countryName) {
            return false;
        }
        let ssPref = "dom.phonenumber.substringmatching." + parsedAddr1.countryName;
        if (Services.prefs.getPrefType(ssPref) != Ci.nsIPrefBranch.PREF_INT) {
            return false;
        }
        let val = Services.prefs.getIntPref(ssPref);
        return (addr1.length > val && addr2.length > val && addr1.slice(-val) === addr2.slice(-val));
    },
    createDomMessageFromRecord(aMessageRecord) {
        if (DEBUG) {
            debug("createDomMessageFromRecord: " + JSON.stringify(aMessageRecord));
        }
        if (aMessageRecord.type == "sms") {
            return gMobileMessageService.createSmsMessage(aMessageRecord.id, aMessageRecord.threadId, aMessageRecord.iccId, aMessageRecord.delivery, aMessageRecord.deliveryStatus, aMessageRecord.sender, aMessageRecord.receiver, aMessageRecord.body, aMessageRecord.messageClass, aMessageRecord.timestamp, aMessageRecord.sentTimestamp, aMessageRecord.deliveryTimestamp, aMessageRecord.read);
        } else if (aMessageRecord.type == "mms") {
            let headers = aMessageRecord.headers;
            if (DEBUG) {
                debug("MMS: headers: " + JSON.stringify(headers));
            }
            let subject = headers.subject;
            if (subject == undefined) {
                subject = "";
            }
            let smil = "";
            let attachments = [];
            let parts = aMessageRecord.parts;
            if (parts) {
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    if (DEBUG) {
                        debug("MMS: part[" + i + "]: " + JSON.stringify(part));
                    }

                    if (!part) {
                        continue;
                    }
                    let partHeaders = part.headers;
                    let partContent = part.content;
                    if (partHeaders["content-type"].media == "application/smil") {
                        smil = partContent;
                        continue;
                    }
                    attachments.push({
                        id: partHeaders["content-id"],
                        location: partHeaders["content-location"],
                        content: partContent,
                    });
                }
            }
            let expiryDate = 0;
            if (headers["x-mms-expiry"] != undefined) {
                expiryDate = aMessageRecord.timestamp + headers["x-mms-expiry"] * 1000;
            }
            let readReportRequested = headers["x-mms-read-report"] || false;
            let isGroup = aMessageRecord.isGroup || false;
            return gMobileMessageService.createMmsMessage(aMessageRecord.id, aMessageRecord.threadId, aMessageRecord.iccId, aMessageRecord.delivery, aMessageRecord.deliveryInfo, aMessageRecord.sender, aMessageRecord.receivers, aMessageRecord.timestamp, aMessageRecord.sentTimestamp, aMessageRecord.read, subject, smil, attachments, expiryDate, readReportRequested, isGroup);
        }
        if (DEBUG) {
            debug("This should not be reached");
        }
        return null;
    },
    createParticipantRecord(aParticipantStore, aAddresses, aCallback) {
        let participantRecord = {
            addresses: aAddresses
        };
        let addRequest = aParticipantStore.add(participantRecord);
        addRequest.onsuccess = function(event) {
            participantRecord.id = event.target.result;
            if (DEBUG) {
                debug("createParticipantRecord: " + JSON.stringify(participantRecord));
            }
            aCallback(participantRecord);
        };
    },
    findParticipantRecordByPlmnAddress(aParticipantStore, aAddress, aCreate, aCallback) {
        if (DEBUG) {
            debug("findParticipantRecordByPlmnAddress(" +
                JSON.stringify(aAddress) + ", " +
                aCreate + ")");
        }

        let normalizedAddress = gPhoneNumberUtils.normalize(aAddress, false);
        let allPossibleAddresses = [normalizedAddress];
        if (DEBUG) {
            debug("findParticipantRecordByPlmnAddress: allPossibleAddresses = " +
                JSON.stringify(allPossibleAddresses));
        }
        let needles = allPossibleAddresses.slice(0);
        let request = aParticipantStore.index("addresses").get(needles.pop());
        request.onsuccess = function onsuccess(event) {
            let participantRecord = event.target.result;
            if (participantRecord) {
                if (DEBUG) {
                    debug("findParticipantRecordByPlmnAddress: got " +
                        JSON.stringify(participantRecord));
                }
                aCallback(participantRecord);
                return;
            }
            if (needles.length) {
                let request = aParticipantStore.index("addresses").get(needles.pop());
                request.onsuccess = onsuccess.bind(this);
                return;
            }
            aParticipantStore.openCursor().onsuccess = function(event) {
                let cursor = event.target.result;
                if (!cursor) {
                    if (!aCreate) {
                        aCallback(null);
                        return;
                    }
                    this.createParticipantRecord(aParticipantStore, [normalizedAddress], aCallback);
                    return;
                }
                let participantRecord = cursor.value;
                for (let storedAddress of participantRecord.addresses) {
                    let match = gPhoneNumberUtils.match(normalizedAddress, storedAddress);
                    if (!match) {
                        continue;
                    }
                    if (aCreate) {
                        participantRecord.addresses = participantRecord.addresses.concat(allPossibleAddresses);
                        cursor.update(participantRecord);
                    }
                    if (DEBUG) {
                        debug("findParticipantRecordByPlmnAddress: match " +
                            JSON.stringify(cursor.value));
                    }
                    aCallback(participantRecord);
                    return;
                }
                cursor.continue();
            }.bind(this);
        }.bind(this);
    },
    findParticipantRecordByOtherAddress(aParticipantStore, aAddress, aCreate, aCallback) {
        if (DEBUG) {
            debug("findParticipantRecordByOtherAddress(" +
                JSON.stringify(aAddress) + ", " +
                aCreate + ")");
        }
        let request = aParticipantStore.index("addresses").get(aAddress);
        request.onsuccess = function(event) {
            let participantRecord = event.target.result;
            if (participantRecord) {
                if (DEBUG) {
                    debug("findParticipantRecordByOtherAddress: got " +
                        JSON.stringify(participantRecord));
                }
                aCallback(participantRecord);
                return;
            }
            if (aCreate) {
                this.createParticipantRecord(aParticipantStore, [aAddress], aCallback);
                return;
            }
            aCallback(null);
        }.bind(this);
    },
    findParticipantRecordByTypedAddress(aParticipantStore, aTypedAddress, aCreate, aCallback) {
        if (aTypedAddress.type == "PLMN") {
            this.findParticipantRecordByPlmnAddress(aParticipantStore, aTypedAddress.address, aCreate, aCallback);
        } else {
            this.findParticipantRecordByOtherAddress(aParticipantStore, aTypedAddress.address, aCreate, aCallback);
        }
    },
    findParticipantIdsByTypedAddresses(aParticipantStore, aTypedAddresses, aCreate, aSkipNonexistent, aCallback) {
        if (DEBUG) {
            debug("findParticipantIdsByTypedAddresses(" +
                JSON.stringify(aTypedAddresses) + ", " +
                aCreate + ", " +
                aSkipNonexistent + ")");
        }
        if (!aTypedAddresses || !aTypedAddresses.length) {
            if (DEBUG) {
                debug("findParticipantIdsByTypedAddresses: returning null");
            }
            aCallback(null);
            return;
        }
        let self = this;
        (function findParticipantId(index, result) {
            if (index >= aTypedAddresses.length) {
                result.sort(function(a, b) {
                    return a - b;
                });
                if (DEBUG) {
                    debug("findParticipantIdsByTypedAddresses: returning " + result);
                }
                aCallback(result);
                return;
            }
            self.findParticipantRecordByTypedAddress(aParticipantStore, aTypedAddresses[index++], aCreate, function(participantRecord) {
                if (!participantRecord) {
                    if (!aSkipNonexistent) {
                        if (DEBUG) {
                            debug("findParticipantIdsByTypedAddresses: returning null");
                        }
                        aCallback(null);
                        return;
                    }
                } else if (!result.includes(participantRecord.id)) {
                    result.push(participantRecord.id);
                }
                findParticipantId(index, result);
            });
        })(0, []);
    },
    findThreadRecordByTypedAddresses(aThreadStore, aParticipantStore, aTypedAddresses, aCreateParticipants, aCallback) {
        if (DEBUG) {
            debug("findThreadRecordByTypedAddresses(" +
                JSON.stringify(aTypedAddresses) + ", " +
                aCreateParticipants + ")");
        }
        this.findParticipantIdsByTypedAddresses(aParticipantStore, aTypedAddresses, aCreateParticipants, false, function(participantIds) {
            if (!participantIds) {
                if (DEBUG) {
                    debug("findThreadRecordByTypedAddresses: returning null");
                }
                aCallback(null, null);
                return;
            }
            let request = aThreadStore.index("participantIds").get(participantIds);
            request.onsuccess = function(event) {
                let threadRecord = event.target.result;
                if (DEBUG) {
                    debug("findThreadRecordByTypedAddresses: return " +
                        JSON.stringify(threadRecord));
                }
                aCallback(threadRecord, participantIds);
            };
        });
    },
    newTxnWithCallback(aCallback, aFunc, aStoreNames) {
        let self = this;
        this.newTxn(READ_WRITE, function(aError, aTransaction, aStores) {
            let notifyResult = function(aRv, aMessageRecord) {
                if (!aCallback) {
                    return;
                }
                let domMessage = aMessageRecord && self.createDomMessageFromRecord(aMessageRecord);
                aCallback.notify(aRv, domMessage);
            };
            if (aError) {
                notifyResult(aError, null);
                return;
            }
            let capture = {};
            aTransaction.oncomplete = function(event) {
                notifyResult(Cr.NS_OK, capture.messageRecord);
            };
            aTransaction.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Cr.NS_ERROR_FILE_NO_DEVICE_SPACE : Cr.NS_ERROR_FAILURE;
                notifyResult(error, null);
            };
            aFunc(capture, aStores);
        }, aStoreNames);
    },
    saveRecord(aMessageRecord, aThreadParticipants, aCallback) {
        if (DEBUG) {
            debug("Going to store " + JSON.stringify(aMessageRecord));
        }
        let self = this;
        this.newTxn(READ_WRITE, function(error, txn, stores) {
            let notifyResult = function(aRv, aMessageRecord) {
                if (!aCallback) {
                    return;
                }
                let domMessage = aMessageRecord && self.createDomMessageFromRecord(aMessageRecord);
                aCallback.notify(aRv, domMessage);
            };
            if (error) {
                notifyResult(error, aMessageRecord);
                return;
            }
            let deletedInfo = {
                messageIds: [],
                threadIds: []
            };
            txn.oncomplete = function(event) {
                if (aMessageRecord.id > self.lastMessageId) {
                    self.lastMessageId = aMessageRecord.id;
                }
                notifyResult(Cr.NS_OK, aMessageRecord);
                if (deletedInfo.threadIds.length > 0) {
                    deletedInfo.messageIds = [];
                }
                self.notifyDeletedInfo(deletedInfo);
            };
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Cr.NS_ERROR_FILE_NO_DEVICE_SPACE : Cr.NS_ERROR_FAILURE;
                notifyResult(error, aMessageRecord);
            };
            let messageStore = stores[0];
            let participantStore = stores[1];
            let threadStore = stores[2];
            self.replaceShortMessageOnSave(txn, messageStore, participantStore, threadStore, aMessageRecord, aThreadParticipants, deletedInfo);
        }, [MESSAGE_STORE_NAME, PARTICIPANT_STORE_NAME, THREAD_STORE_NAME]);
    },
    replaceShortMessageOnSave(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo) {
        let isReplaceTypePid = aMessageRecord.pid && ((aMessageRecord.pid >= RIL.PDU_PID_REPLACE_SHORT_MESSAGE_TYPE_1 && aMessageRecord.pid <= RIL.PDU_PID_REPLACE_SHORT_MESSAGE_TYPE_7) || aMessageRecord.pid == RIL.PDU_PID_RETURN_CALL_MESSAGE);
        if (aMessageRecord.type != "sms" || aMessageRecord.delivery != DELIVERY_RECEIVED || !isReplaceTypePid) {
            this.realSaveRecord(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo);
            return;
        }




        let self = this;
        let typedSender = {
            address: aMessageRecord.sender,
            type: MMS.Address.resolveType(aMessageRecord.sender),
        };
        this.findParticipantRecordByTypedAddress(aParticipantStore, typedSender, false, function(participantRecord) {
            if (!participantRecord) {
                self.realSaveRecord(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo);
                return;
            }
            let participantId = participantRecord.id;
            let range = IDBKeyRange.bound([participantId, 0], [participantId, ""]);
            let request = aMessageStore.index("participantIds").openCursor(range);
            request.onsuccess = function(event) {
                let cursor = event.target.result;
                if (!cursor) {
                    self.realSaveRecord(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo);
                    return;
                }
                let foundMessageRecord = cursor.value;
                if (foundMessageRecord.type != "sms" || foundMessageRecord.sender != aMessageRecord.sender || foundMessageRecord.pid != aMessageRecord.pid) {
                    cursor.continue();
                    return;
                }
                aMessageRecord.id = foundMessageRecord.id;
                self.realSaveRecord(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo);
            };
        });
    },
    realSaveRecord(aTransaction, aMessageStore, aParticipantStore, aThreadStore, aMessageRecord, aThreadParticipants, aDeletedInfo) {
        let self = this;
        this.findThreadRecordByTypedAddresses(aThreadStore, aParticipantStore, aThreadParticipants, true, function(threadRecord, participantIds) {
            if (!participantIds) {
                aTransaction.abort();
                return;
            }
            let isOverriding = aMessageRecord.id !== undefined;
            if (!isOverriding) {
                aMessageRecord.id = self.lastMessageId + 1;
            }
            let timestamp = aMessageRecord.timestamp;
            let insertMessageRecord = function(threadId) {
                aMessageRecord.threadId = threadId;
                aMessageRecord.threadIdIndex = [threadId, timestamp];
                aMessageRecord.participantIdsIndex = [];
                for (let id of participantIds) {
                    aMessageRecord.participantIdsIndex.push([id, timestamp]);
                }
                if (!isOverriding) {
                    aMessageStore.put(aMessageRecord);
                    return;
                }


                aMessageStore.get(aMessageRecord.id).onsuccess = function(event) {
                    let oldMessageRecord = event.target.result;
                    aMessageStore.put(aMessageRecord);
                    if (oldMessageRecord) {
                        self.updateThreadByMessageChange(aMessageStore, aThreadStore, oldMessageRecord.threadId, [aMessageRecord.id], oldMessageRecord.read ? 0 : 1, aDeletedInfo);
                        if (DEBUG) {
                            debug("Notify download replace action to update UI type, old thread is " +
                                oldMessageRecord.threadId + ", new thread is " +
                                aMessageRecord.threadId);
                        }
                        if (oldMessageRecord.threadId !== aMessageRecord.threadId) {
                            self.notifyDeletedInfo({
                                messageIds: [aMessageRecord.id],
                                threadIds: [oldMessageRecord.threadId],
                            });
                        }
                    }
                };
            };
            if (threadRecord) {
                let needsUpdate = false;
                if (threadRecord.lastTimestamp <= timestamp) {
                    let lastMessageSubject;
                    if (aMessageRecord.type == "mms") {
                        lastMessageSubject = aMessageRecord.headers.subject;
                    }
                    threadRecord.lastMessageSubject = lastMessageSubject || null;
                    threadRecord.lastTimestamp = timestamp;
                    threadRecord.body = aMessageRecord.body;
                    threadRecord.lastMessageId = aMessageRecord.id;
                    threadRecord.lastMessageType = aMessageRecord.type;
                    threadRecord.lastMessageAttachementStatus = self.getAttachmentStatus(aMessageRecord);
                    needsUpdate = true;
                }
                if (!aMessageRecord.read) {
                    threadRecord.unreadCount++;
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    threadRecord.isGroup = aMessageRecord.isGroup || false;
                    aThreadStore.put(threadRecord);
                }
                insertMessageRecord(threadRecord.id);
                return;
            }
            let lastMessageSubject;
            if (aMessageRecord.type == "mms") {
                lastMessageSubject = aMessageRecord.headers.subject;
            }
            let lastMessageAttachementStatus = self.getAttachmentStatus(aMessageRecord);
            threadRecord = {
                participantIds,
                participantAddresses: aThreadParticipants.map(function(typedAddress) {
                    return typedAddress.address;
                }),
                lastMessageId: aMessageRecord.id,
                lastTimestamp: timestamp,
                lastMessageSubject: lastMessageSubject || null,
                lastMessageAttachementStatus,
                body: aMessageRecord.body,
                unreadCount: aMessageRecord.read ? 0 : 1,
                lastMessageType: aMessageRecord.type,
                isGroup: aMessageRecord.isGroup,
            };
            aThreadStore.add(threadRecord).onsuccess = function(event) {
                let threadId = event.target.result;
                insertMessageRecord(threadId);
            };
        });
    },
    forEachMatchedMmsDeliveryInfo(aDeliveryInfo, aNeedle, aCallback) {
        let typedAddress = {
            type: MMS.Address.resolveType(aNeedle),
            address: aNeedle,
        };
        let normalizedAddress;
        if (typedAddress.type === "PLMN") {
            normalizedAddress = gPhoneNumberUtils.normalize(aNeedle, false);
        }
        for (let element of aDeliveryInfo) {
            let typedStoredAddress = {
                type: MMS.Address.resolveType(element.receiver),
                address: element.receiver,
            };
            if (typedAddress.type !== typedStoredAddress.type) {
                continue;
            }
            if (typedAddress.address == typedStoredAddress.address) {
                aCallback(element);
                continue;
            }
            if (typedAddress.type !== "PLMN") {
                continue;
            }
            let normalizedStoredAddress = gPhoneNumberUtils.normalize(element.receiver, false);
            if (gPhoneNumberUtils.match(normalizedAddress, normalizedStoredAddress)) {
                aCallback(element);
            }
        }
    },
    updateMessageDeliveryById(id, type, receiver, delivery, deliveryStatus, envelopeId, callback) {
        if (DEBUG) {
            debug("Setting message's delivery by " +
                type + " = " +
                id + " receiver: " +
                receiver + " delivery: " +
                delivery + " deliveryStatus: " +
                deliveryStatus + " envelopeId: " +
                envelopeId);
        }
        let self = this;
        this.newTxnWithCallback(callback, function(aCapture, aMessageStore) {
            let getRequest;
            if (type === "messageId") {
                getRequest = aMessageStore.get(id);
            } else if (type === "envelopeId") {
                getRequest = aMessageStore.index("envelopeId").get(id);
            }
            getRequest.onsuccess = function(event) {
                let messageRecord = event.target.result;
                if (!messageRecord) {
                    if (DEBUG) {
                        debug("type = " + id + " is not found");
                    }
                    throw Components.Exception("", Cr.NS_ERROR_FAILURE);
                }
                let isRecordUpdated = false;
                if (delivery && messageRecord.delivery != delivery) {
                    messageRecord.delivery = delivery;
                    messageRecord.deliveryIndex = [delivery, messageRecord.timestamp];
                    isRecordUpdated = true;

                    if (delivery == DELIVERY_SENT) {
                        messageRecord.sentTimestamp = Date.now();
                    }
                }
                if (deliveryStatus) {
                    let updateFunc = function(aTarget) {
                        if (aTarget.deliveryStatus == deliveryStatus) {
                            return;
                        }
                        aTarget.deliveryStatus = deliveryStatus;
                        if (deliveryStatus == DELIVERY_STATUS_SUCCESS) {
                            aTarget.deliveryTimestamp = Date.now();
                        }
                        isRecordUpdated = true;
                    };
                    if (messageRecord.type == "sms") {
                        updateFunc(messageRecord);
                    } else if (messageRecord.type == "mms") {
                        if (!receiver) {
                            messageRecord.deliveryInfo.forEach(updateFunc);
                        } else {
                            self.forEachMatchedMmsDeliveryInfo(messageRecord.deliveryInfo, receiver, updateFunc);
                        }
                    }
                }
                if (envelopeId) {
                    if (messageRecord.envelopeIdIndex != envelopeId) {
                        messageRecord.envelopeIdIndex = envelopeId;
                        isRecordUpdated = true;
                    }
                }
                aCapture.messageRecord = messageRecord;
                if (!isRecordUpdated) {
                    if (DEBUG) {
                        debug("The values of delivery, deliveryStatus and envelopeId " + "don't need to be updated.");
                    }
                    return;
                }
                if (DEBUG) {
                    debug("The delivery, deliveryStatus or envelopeId are updated.");
                }
                aMessageStore.put(messageRecord);
            };
        });
    },
    fillReceivedMmsThreadParticipants(aMessage, threadParticipants) {
        let receivers = aMessage.receivers;




        if (DISABLE_MMS_GROUPING_FOR_RECEIVING || receivers.length < 2) {
            return;
        }
        aMessage.isGroup = true;
        let isSuccess = false;
        let slicedReceivers = receivers.slice();
        if (aMessage.phoneNumber) {
            let foundIndex = -1;
            for (var i = 0; i < slicedReceivers.length; i++) {
                if (gPhoneNumberUtils.match(slicedReceivers[i], aMessage.phoneNumber)) {
                    isSuccess = true;
                    foundIndex = i;
                    break;
                }
            }
            if (foundIndex != -1) {
                slicedReceivers.splice(foundIndex, 1);
            }
        }
        if (!isSuccess) {

            if (DEBUG) {
                debug("Error! Cannot strip out user's own phone number!");
            }
        }
        aMessage.receivers = slicedReceivers;
        slicedReceivers.forEach(function(aAddress) {
            threadParticipants.push({
                address: aAddress,
                type: MMS.Address.resolveType(aAddress),
            });
        });
    },
    updateThreadByMessageChange(messageStore, threadStore, threadId, removedMsgIds, ignoredUnreadCount, deletedInfo) {
        let self = this;
        threadStore.get(threadId).onsuccess = function(event) {
            let threadRecord = event.target.result;
            if (DEBUG) {
                debug("Updating thread record " + JSON.stringify(threadRecord));
            }
            if (ignoredUnreadCount > 0) {
                if (DEBUG) {
                    debug("Updating unread count : " +
                        threadRecord.unreadCount + " -> " +
                        (threadRecord.unreadCount - ignoredUnreadCount));
                }
                threadRecord.unreadCount -= ignoredUnreadCount;
            }
            if (removedMsgIds.includes(threadRecord.lastMessageId)) {
                if (DEBUG) {
                    debug("MRU entry was deleted.");
                }
                let range = IDBKeyRange.bound([threadId, 0], [threadId, ""]);
                let request = messageStore.index("threadId").openCursor(range, PREV);
                request.onsuccess = function(event) {
                    let cursor = event.target.result;
                    if (!cursor) {
                        if (DEBUG) {
                            debug("All messages were deleted. Delete this thread.");
                        }
                        threadStore.delete(threadId);
                        if (deletedInfo) {
                            deletedInfo.threadIds.push(threadId);
                        }
                        return;
                    }
                    let nextMsg = cursor.value;
                    let lastMessageSubject;
                    if (nextMsg.type == "mms") {
                        lastMessageSubject = nextMsg.headers.subject;
                    }
                    threadRecord.lastMessageSubject = lastMessageSubject || null;
                    threadRecord.lastMessageAttachementStatus = self.getAttachmentStatus(nextMsg);
                    threadRecord.lastMessageId = nextMsg.id;
                    threadRecord.lastTimestamp = nextMsg.timestamp;
                    threadRecord.body = nextMsg.body;
                    threadRecord.lastMessageType = nextMsg.type;
                    if (DEBUG) {
                        debug("Updating mru entry: " + JSON.stringify(threadRecord));
                    }
                    threadStore.put(threadRecord);
                };
            } else if (ignoredUnreadCount > 0) {
                if (DEBUG) {
                    debug("Shortcut, just update the unread count.");
                }
                threadStore.put(threadRecord);
            }
        };
    },
    notifyDeletedInfo(info) {
        if (!info || (info.messageIds.length === 0 && info.threadIds.length === 0)) {
            return;
        }
        let deletedInfo = gMobileMessageService.createDeletedMessageInfo(info.messageIds, info.messageIds.length, info.threadIds, info.threadIds.length);
        Services.obs.notifyObservers(deletedInfo, "sms-deleted");
    },
    saveReceivedMessage(aMessage, aCallback) {
        let self = this;
        if ((aMessage.type != "sms" && aMessage.type != "mms") || (aMessage.type == "sms" && (aMessage.messageClass == undefined || aMessage.sender == undefined)) || (aMessage.type == "mms" && (aMessage.delivery == undefined || aMessage.deliveryStatus == undefined || !Array.isArray(aMessage.receivers))) || aMessage.timestamp == undefined) {
            if (aCallback) {
                let domMessage = aMessage && self.createDomMessageFromRecord(aMessage);
                aCallback.notify(Cr.NS_ERROR_FAILURE, domMessage);
            }
            return;
        }
        let threadParticipants;
        if (aMessage.type == "mms") {
            if (aMessage.headers.from) {
                aMessage.sender = aMessage.headers.from.address;
            } else if (aMessage.sourceAddress) {
                aMessage.sender = aMessage.sourceAddress;
            } else {
                aMessage.sender = "";
            }
            threadParticipants = [{
                address: aMessage.sender,
                type: MMS.Address.resolveType(aMessage.sender),
            }, ];
            this.fillReceivedMmsThreadParticipants(aMessage, threadParticipants);
        } else {
            threadParticipants = [{
                address: aMessage.sender,
                type: MMS.Address.resolveType(aMessage.sender),
            }, ];
        }
        let timestamp = aMessage.timestamp;
        aMessage.readIndex = [FILTER_READ_UNREAD, timestamp];
        aMessage.read = FILTER_READ_UNREAD;
        if (aMessage.sentTimestamp == undefined) {
            aMessage.sentTimestamp = 0;
        }
        if (aMessage.type == "mms") {
            debug("receive a group MMS = " + aMessage.isGroup);
            aMessage.transactionIdIndex = aMessage.headers["x-mms-transaction-id"];
            aMessage.isReadReportSent = false;

            aMessage.deliveryInfo = [{
                receiver: aMessage.phoneNumber,
                deliveryStatus: aMessage.deliveryStatus,
                deliveryTimestamp: 0,
                readStatus: MMS.DOM_READ_STATUS_NOT_APPLICABLE,
                readTimestamp: 0,
            }, ];
            delete aMessage.deliveryStatus;
        }
        if (aMessage.type == "sms") {
            aMessage.delivery = DELIVERY_RECEIVED;
            aMessage.deliveryStatus = DELIVERY_STATUS_SUCCESS;
            aMessage.deliveryTimestamp = 0;
            if (aMessage.pid == undefined) {
                aMessage.pid = RIL.PDU_PID_DEFAULT;
            }
        }
        aMessage.deliveryIndex = [aMessage.delivery, timestamp];

        function findBlockContactsSuccess(aResult) {
            if (DEBUG) {
                debug("Find block contact successfully");
            }
            if (!isJSONEmpty(aResult)) {
                if (DEBUG) {
                    debug("Message blocked by block contact!");
                }
                if (aCallback) {
                    let domMessage = aMessage && self.createDomMessageFromRecord(aMessage);
                    aCallback.notify(Cr.NS_ERROR_FAILURE, domMessage);
                }
            } else {
                self.saveRecord(aMessage, threadParticipants, aCallback);
            }
        }

        function findBlockContactsFail() {
            if (DEBUG) {
                debug("Find block contact fail, interface error");
            }
            self.saveRecord(aMessage, threadParticipants, aCallback);
        }

        function isJSONEmpty(result) {
            for (let key in result) {
                return false;
            }
            return true;
        }
        gContactsManager.findBlockedNumbers({
            filterValue: aMessage.sender,
            filterOption: Ci.nsIFilterOption.FuzzyMatch,
        }, {
            resolve: result => {
                findBlockContactsSuccess(result);
            },
            reject: () => {
                findBlockContactsFail();
            },
        });
    },
    saveSendingMessage(aMessage, aCallback) {
        let self = this;
        if ((aMessage.type != "sms" && aMessage.type != "mms") || (aMessage.type == "sms" && aMessage.receiver == undefined) || (aMessage.type == "mms" && !Array.isArray(aMessage.receivers)) || aMessage.deliveryStatusRequested == undefined || aMessage.timestamp == undefined) {
            if (aCallback) {
                let domMessage = aMessage && self.createDomMessageFromRecord(aMessage);
                aCallback.notify(Cr.NS_ERROR_FAILURE, domMessage);
            }
            return;
        }

        let deliveryStatus = aMessage.deliveryStatusRequested ? DELIVERY_STATUS_PENDING : DELIVERY_STATUS_NOT_APPLICABLE;
        if (aMessage.type == "sms") {
            aMessage.deliveryStatus = deliveryStatus;
            if (aMessage.deliveryTimestamp == undefined) {
                aMessage.deliveryTimestamp = 0;
            }
        } else if (aMessage.type == "mms") {
            let receivers = aMessage.receivers;
            let readStatus = aMessage.headers["x-mms-read-report"] ? MMS.DOM_READ_STATUS_PENDING : MMS.DOM_READ_STATUS_NOT_APPLICABLE;
            aMessage.deliveryInfo = [];
            for (let i = 0; i < receivers.length; i++) {
                aMessage.deliveryInfo.push({
                    receiver: receivers[i],
                    deliveryStatus,
                    deliveryTimestamp: 0,
                    readStatus,
                    readTimestamp: 0,
                });
            }
        }
        let timestamp = aMessage.timestamp;
        aMessage.deliveryIndex = [DELIVERY_SENDING, timestamp];
        aMessage.readIndex = [FILTER_READ_READ, timestamp];
        aMessage.delivery = DELIVERY_SENDING;
        aMessage.messageClass = MESSAGE_CLASS_NORMAL;
        aMessage.read = FILTER_READ_READ;
        aMessage.sentTimestamp = 0;
        let threadParticipants;
        if (aMessage.type == "sms") {
            threadParticipants = [{
                address: aMessage.receiver,
                type: MMS.Address.resolveType(aMessage.receiver),
            }, ];
        } else if (aMessage.type == "mms") {
            threadParticipants = [];
            if (aMessage.headers.to) {
                for (var i = 0; i < aMessage.headers.to.length; i++) {
                    threadParticipants.push(aMessage.headers.to[i]);
                }
            }
            if (aMessage.headers.cc) {
                for (i = 0; i < aMessage.headers.cc.length; i++) {
                    threadParticipants.push(aMessage.headers.cc[i]);
                }
            }
            if (aMessage.headers.bcc) {
                for (i = 0; i < aMessage.headers.bcc.length; i++) {
                    threadParticipants.push(aMessage.headers.bcc[i]);
                }
            }
        }
        this.saveRecord(aMessage, threadParticipants, aCallback);
    },
    setMessageDeliveryByMessageId(messageId, receiver, delivery, deliveryStatus, envelopeId, callback) {
        this.updateMessageDeliveryById(messageId, "messageId", receiver, delivery, deliveryStatus, envelopeId, callback);
    },
    setMessageDeliveryStatusByEnvelopeId(aEnvelopeId, aReceiver, aDeliveryStatus, aCallback) {
        this.updateMessageDeliveryById(aEnvelopeId, "envelopeId", aReceiver, null, aDeliveryStatus, null, aCallback);
    },
    setMessageReadStatusByEnvelopeId(aEnvelopeId, aReceiver, aReadStatus, aCallback) {
        if (DEBUG) {
            debug("Setting message's read status by envelopeId = " +
                aEnvelopeId + ", receiver: " +
                aReceiver + ", readStatus: " +
                aReadStatus);
        }
        let self = this;
        this.newTxnWithCallback(aCallback, function(aCapture, aMessageStore) {
            let getRequest = aMessageStore.index("envelopeId").get(aEnvelopeId);
            getRequest.onsuccess = function(event) {
                let messageRecord = event.target.result;
                if (!messageRecord) {
                    if (DEBUG) {
                        debug("envelopeId '" + aEnvelopeId + "' not found");
                    }
                    throw Components.Exception("", Cr.NS_ERROR_FAILURE);
                }
                aCapture.messageRecord = messageRecord;
                let isRecordUpdated = false;
                self.forEachMatchedMmsDeliveryInfo(messageRecord.deliveryInfo, aReceiver, function(aEntry) {
                    if (aEntry.readStatus == aReadStatus) {
                        return;
                    }
                    aEntry.readStatus = aReadStatus;
                    if (aReadStatus == MMS.DOM_READ_STATUS_SUCCESS) {
                        aEntry.readTimestamp = Date.now();
                    } else {
                        aEntry.readTimestamp = 0;
                    }
                    isRecordUpdated = true;
                });
                if (!isRecordUpdated) {
                    if (DEBUG) {
                        debug("The values of readStatus don't need to be updated.");
                    }
                    return;
                }
                if (DEBUG) {
                    debug("The readStatus is updated.");
                }
                aMessageStore.put(messageRecord);
            };
        });
    },
    getMessageRecordByTransactionId(aTransactionId, aCallback) {
        if (DEBUG) {
            debug("Retrieving message with transaction ID " + aTransactionId);
        }
        this.newTxn(READ_ONLY, function(error, txn, messageStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null, null);
                return;
            }
            let request = messageStore.index("transactionId").get(aTransactionId);
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                let messageRecord = request.result;
                if (!messageRecord) {
                    if (DEBUG) {
                        debug("Transaction ID " + aTransactionId + " not found");
                    }
                    aCallback.notify(Cr.NS_ERROR_FILE_NOT_FOUND, null, null);
                    return;
                }

                aCallback.notify(Cr.NS_OK, messageRecord, null);
            };
            txn.onerror = function(event) {
                if (DEBUG) {
                    if (event.target) {
                        debug("Caught error on transaction", event.target.error.name);
                    }
                }
                aCallback.notify(Cr.NS_ERROR_FAILURE, null, null);
            };
        });
    },
    getMessageRecordById(aMessageId, aCallback) {
        if (DEBUG) {
            debug("Retrieving message with ID " + aMessageId);
        }
        let self = this;
        this.newTxn(READ_ONLY, function(error, txn, messageStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null, null);
                return;
            }
            let request = messageStore.mozGetAll(aMessageId);
            txn.oncomplete = function() {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                if (request.result.length > 1) {
                    if (DEBUG) {
                        debug("Got too many results for id " + aMessageId);
                    }
                    aCallback.notify(Cr.NS_ERROR_UNEXPECTED, null, null);
                    return;
                }
                let messageRecord = request.result[0];
                if (!messageRecord) {
                    if (DEBUG) {
                        debug("Message ID " + aMessageId + " not found");
                    }
                    aCallback.notify(Cr.NS_ERROR_FILE_NOT_FOUND, null, null);
                    return;
                }
                if (messageRecord.id != aMessageId) {
                    if (DEBUG) {
                        debug("Requested message ID (" +
                            aMessageId + ") is " + "different from the one we got");
                    }
                    aCallback.notify(Cr.NS_ERROR_UNEXPECTED, null, null);
                    return;
                }
                let domMessage = self.createDomMessageFromRecord(messageRecord);
                aCallback.notify(Cr.NS_OK, messageRecord, domMessage);
            };
            txn.onerror = function(event) {
                if (DEBUG) {
                    if (event.target) {
                        debug("Caught error on transaction", event.target.error.name);
                    }
                }
                aCallback.notify(Cr.NS_ERROR_FAILURE, null, null);
            };
        });
    },
    translateCrErrorToMessageCallbackError(aCrError) {
        switch (aCrError) {
            case Cr.NS_OK:
                return Ci.nsIMobileMessageCallback.SUCCESS_NO_ERROR;
            case Cr.NS_ERROR_UNEXPECTED:
                return Ci.nsIMobileMessageCallback.UNKNOWN_ERROR;
            case Cr.NS_ERROR_FILE_NOT_FOUND:
                return Ci.nsIMobileMessageCallback.NOT_FOUND_ERROR;
            case Cr.NS_ERROR_FILE_NO_DEVICE_SPACE:
                return Ci.nsIMobileMessageCallback.STORAGE_FULL_ERROR;
            default:
                return Ci.nsIMobileMessageCallback.INTERNAL_ERROR;
        }
    },
    saveSmsSegment(aSmsSegment, aCallback) {
        let completeMessage = null;
        this.newTxn(READ_WRITE, function(error, txn, segmentStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null);
                return;
            }
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                if (completeMessage) {
                    if (completeMessage.encoding == RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET) {
                        let fullDataLen = 0;
                        for (let i = 1; i <= completeMessage.segmentMaxSeq; i++) {
                            fullDataLen += completeMessage.segments[i].length;
                        }
                        completeMessage.fullData = new Uint8Array(fullDataLen);
                        for (let d = 0, i = 1; i <= completeMessage.segmentMaxSeq; i++) {
                            let data = completeMessage.segments[i];
                            for (let j = 0; j < data.length; j++) {
                                completeMessage.fullData[d++] = data[j];
                            }
                        }
                    } else {
                        completeMessage.fullBody = completeMessage.segments.join("");
                    }
                    delete completeMessage.id;
                    delete completeMessage.hash;
                    delete completeMessage.receivedSegments;
                    delete completeMessage.segments;
                }
                aCallback.notify(Cr.NS_OK, completeMessage);
            };
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Cr.NS_ERROR_FILE_NO_DEVICE_SPACE : Cr.NS_ERROR_FAILURE;
                aCallback.notify(error, null);
            };
            aSmsSegment.hash = aSmsSegment.sender + ":" +
                aSmsSegment.segmentRef + ":" +
                aSmsSegment.segmentMaxSeq + ":" +
                aSmsSegment.iccId;
            let seq = aSmsSegment.segmentSeq;
            if (DEBUG) {
                debug("Saving SMS Segment: " + aSmsSegment.hash + ", seq: " + seq);
            }
            let getRequest = segmentStore.index("hash").get(aSmsSegment.hash);
            getRequest.onsuccess = function(event) {
                let segmentRecord = event.target.result;
                if (!segmentRecord) {
                    if (DEBUG) {
                        debug("Not found! Create a new record to store the segments.");
                    }
                    aSmsSegment.receivedSegments = 1;
                    aSmsSegment.segments = [];
                    if (aSmsSegment.encoding == RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET) {
                        aSmsSegment.segments[seq] = aSmsSegment.data;
                    } else {
                        aSmsSegment.segments[seq] = aSmsSegment.body;
                    }
                    segmentStore.add(aSmsSegment);
                    return;
                }
                if (DEBUG) {
                    debug("Append SMS Segment into existed message object: " +
                        segmentRecord.id);
                }
                if (segmentRecord.segments[seq]) {
                    if (segmentRecord.encoding == RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET && segmentRecord.encoding == aSmsSegment.encoding && segmentRecord.segments[seq].length == aSmsSegment.data.length && segmentRecord.segments[seq].every(function(aElement, aIndex) {
                            return aElement == aSmsSegment.data[aIndex];
                        })) {
                        if (DEBUG) {
                            debug("Got duplicated binary segment no: " + seq);
                        }
                        return;
                    }
                    if (segmentRecord.encoding != RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET && aSmsSegment.encoding != RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET && segmentRecord.segments[seq] == aSmsSegment.body) {
                        if (DEBUG) {
                            debug("Got duplicated text segment no: " + seq);
                        }
                        return;
                    }

                    segmentRecord.encoding = aSmsSegment.encoding;
                    segmentRecord.originatorPort = aSmsSegment.originatorPort;
                    segmentRecord.destinationPort = aSmsSegment.destinationPort;
                    segmentRecord.teleservice = aSmsSegment.teleservice;
                    segmentRecord.receivedSegments--;
                }
                segmentRecord.timestamp = aSmsSegment.timestamp;
                if (segmentRecord.encoding == RIL.PDU_DCS_MSG_CODING_8BITS_ALPHABET) {
                    segmentRecord.segments[seq] = aSmsSegment.data;
                } else {
                    segmentRecord.segments[seq] = aSmsSegment.body;
                }
                segmentRecord.receivedSegments++;
                segmentRecord.imsMessage = aSmsSegment.imsMessage;

                if (aSmsSegment.teleservice === RIL.PDU_CDMA_MSG_TELESERVICE_ID_WAP && seq === 1) {
                    if (aSmsSegment.originatorPort !== Ci.nsIGonkSmsService.SMS_APPLICATION_PORT_INVALID) {
                        segmentRecord.originatorPort = aSmsSegment.originatorPort;
                    }
                    if (aSmsSegment.destinationPort !== Ci.nsIGonkSmsService.SMS_APPLICATION_PORT_INVALID) {
                        segmentRecord.destinationPort = aSmsSegment.destinationPort;
                    }
                }
                if (segmentRecord.receivedSegments < segmentRecord.segmentMaxSeq) {
                    if (DEBUG) {
                        debug("Message is incomplete.");
                    }
                    segmentStore.put(segmentRecord);
                    return;
                }
                completeMessage = segmentRecord;
                segmentStore.delete(segmentRecord.id);
            };
        }, [SMS_SEGMENT_STORE_NAME]);
    },
    saveCellBroadcastMessage(aCellBroadcastMessage, aCallback) {
        if (DEBUG) {
            debug("Save CellBroadcast Message " + JSON.stringify(aCellBroadcastMessage));
        }
        this.newTxn(READ_WRITE, function(error, txn, cellBroadcastStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null);
                return;
            }
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                aCallback.notify(Cr.NS_OK, aCellBroadcastMessage);
            };
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Cr.NS_ERROR_FILE_NO_DEVICE_SPACE : Cr.NS_ERROR_FAILURE;
                aCallback.notify(error, null);
            };
            let cellbroadcastRecord = JSON.parse(JSON.stringify(aCellBroadcastMessage));
            cellbroadcastRecord.hash = aCellBroadcastMessage.serialNumber + ":" +
                aCellBroadcastMessage.messageId;
            if (DEBUG) {
                debug("Save CellBroadcast Message hash " + cellbroadcastRecord.hash);
            }
            cellBroadcastStore.add(cellbroadcastRecord);
        }, [CELLBROADCAST_STORE_NAME]);
    },
    getCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback) {
        let hash = aSerialNumber + ":" + aMessageIdentifier;
        if (DEBUG) {
            debug("Get Cellbroadcast Message hash: " + hash);
        }
        this.newTxn(READ_ONLY, function(error, txn, cellBroadcastStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null, null);
                return;
            }
            let request = cellBroadcastStore.index("hash").get(hash);
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                let cellBroadcastRecord = request.result;
                if (!cellBroadcastRecord) {
                    if (DEBUG) {
                        debug("Broadcast Message: " + hash + " not found");
                    }
                    aCallback.notify(Cr.NS_ERROR_FILE_NOT_FOUND, null, null);
                    return;
                }
                if (DEBUG) {
                    debug("Broadcast Message: " +
                        hash + " founded " +
                        JSON.stringify(cellBroadcastRecord));
                }
                let geometries = [];
                cellBroadcastRecord.geometries.forEach(geo => {
                    if (geo.type === RIL.GEOMETRY_TYPE_POLYGON) {
                        geometries.push(new SIM.Polygon(geo._vertices));
                    } else if (geo.type === RIL.GEOMETRY_TYPE_CIRCLE) {
                        geometries.push(new SIM.Circle(geo._center, geo._radius));
                    } else if (DEBUG) {
                        debug("Invalid geometry type: " + geo.type);
                    }
                });
                cellBroadcastRecord.geometries = geometries;
                aCallback.notify(Cr.NS_OK, cellBroadcastRecord, null);
            };
            txn.onerror = function(event) {
                if (DEBUG) {
                    if (event.target) {
                        debug("Caught error on transaction", event.target.error.name);
                    }
                }
                aCallback.notify(Cr.NS_ERROR_FAILURE, null, null);
            };
        }, [CELLBROADCAST_STORE_NAME]);
    },
    deleteCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback) {
        let hash = aSerialNumber + ":" + aMessageIdentifier;
        if (DEBUG) {
            debug("Delete Cellbroadcast Message hash: " + hash);
        }
        this.newTxn(READ_WRITE, function(error, txn, cellBroadcastStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null, null);
                return;
            }
            let request = cellBroadcastStore.index("hash").get(hash);
            let deletedRecord = {};
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                if (!deletedRecord) {
                    aCallback.notify(Cr.NS_ERROR_FILE_NOT_FOUND, null, null);
                    return;
                }
                aCallback.notify(Cr.NS_OK, deletedRecord, null);
            };
            txn.onerror = function(event) {
                if (DEBUG) {
                    if (event.target) {
                        debug("Caught error on transaction", event.target.error.name);
                    }
                }
                aCallback.notify(Cr.NS_ERROR_FAILURE, null, null);
            };
            request.onsuccess = function(event) {
                let deletedRecord = event.target.result;
                if (!deletedRecord) {
                    if (DEBUG) {
                        debug("Broadcast Message: " + hash + " not found");
                    }
                } else {
                    cellBroadcastStore.delete(deletedRecord.id).onsuccess = function(event) {
                        if (DEBUG) {
                            debug("Cellbroadcast Message: " + hash + " deleted");
                        }
                    };
                }
            };
        }, [CELLBROADCAST_STORE_NAME]);
    },
    removeAllCellBroadcastMessage(aCallback) {
        if (DEBUG) {
            debug("remove all CellBroadcast Message ");
        }
        this.newTxn(READ_WRITE, function(error, txn, cellBroadcastStore) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aCallback.notify(error, null);
                return;
            }
            cellBroadcastStore.clear();
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                aCallback.notify(Cr.NS_OK, null);
            };
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                aCallback.notify(error, null);
            };
        }, [CELLBROADCAST_STORE_NAME]);
    },
    getMessage(aMessageId, aRequest) {
        if (DEBUG) {
            debug("Retrieving message with ID " + aMessageId);
        }
        let self = this;
        let notifyCallback = {
            notify(aRv, aMessageRecord, aDomMessage) {
                if (Cr.NS_OK == aRv) {
                    aRequest.notifyMessageGot(aDomMessage);
                    return;
                }
                aRequest.notifyGetMessageFailed(self.translateCrErrorToMessageCallbackError(aRv), null);
            },
        };
        this.getMessageRecordById(aMessageId, notifyCallback);
    },
    deleteMessage(messageIds, length, aRequest) {
        if (DEBUG) {
            debug("deleteMessage: message ids " + JSON.stringify(messageIds));
        }
        let deleted = [];
        let self = this;
        this.newTxn(READ_WRITE, function(error, txn, stores) {
            if (error) {
                if (DEBUG) {
                    debug("deleteMessage: failed to open transaction");
                }
                aRequest.notifyDeleteMessageFailed(self.translateCrErrorToMessageCallbackError(error));
                return;
            }
            let deletedInfo = {
                messageIds: [],
                threadIds: []
            };
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Ci.nsIMobileMessageCallback.STORAGE_FULL_ERROR : Ci.nsIMobileMessageCallback.INTERNAL_ERROR;
                aRequest.notifyDeleteMessageFailed(error);
            };
            const messageStore = stores[0];
            const threadStore = stores[1];
            txn.oncomplete = function(event) {
                if (DEBUG) {
                    debug("Transaction " + txn + " completed.");
                }
                aRequest.notifyMessageDeleted(deleted, length);
                if (deletedInfo.threadIds.length > 0) {
                    deletedInfo.messageIds = [];
                }
                self.notifyDeletedInfo(deletedInfo);
            };
            let threadsToUpdate = {};
            let numOfMessagesToDelete = length;
            let updateThreadInfo = function() {
                for (let threadId in threadsToUpdate) {
                    let threadInfo = threadsToUpdate[threadId];
                    self.updateThreadByMessageChange(messageStore, threadStore, threadInfo.threadId, threadInfo.removedMsgIds, threadInfo.ignoredUnreadCount, deletedInfo);
                }
            };
            let req = messageStore.mozGetAll();
            req.onsuccess = function(event) {
                let size = event.target.result.length;
                if (DEBUG) {
                    debug("message size " + size + " equal? deleted size " + length);
                }
                if (size === length) {
                    messageStore.clear();
                    threadStore.clear();
                    let threadsIdSet = new Set();
                    for (let i = 0; i < length; i++) {
                        deleted[i] = true;
                        deletedInfo.messageIds.push(messageIds[i]);
                        threadsIdSet.add(event.target.result[i].threadId);
                    }
                    deletedInfo.threadIds.push(...Array.from(threadsIdSet));
                    updateThreadInfo();
                } else {
                    for (let i = 0; i < length; i++) {
                        let messageId = messageIds[i];
                        deleted[i] = false;
                        messageStore.get(messageId).onsuccess = function(messageIndex, event) {
                            let messageRecord = event.target.result;
                            let messageId = messageIds[messageIndex];
                            if (messageRecord) {
                                if (DEBUG) {
                                    debug("Deleting message id " + messageId);
                                }
                                messageStore.delete(messageId).onsuccess = function(event) {
                                    if (DEBUG) {
                                        debug("Message id " + messageId + " deleted");
                                    }
                                    numOfMessagesToDelete--;
                                    deleted[messageIndex] = true;
                                    deletedInfo.messageIds.push(messageId);
                                    let threadId = messageRecord.threadId;
                                    if (!threadsToUpdate[threadId]) {
                                        threadsToUpdate[threadId] = {
                                            threadId,
                                            removedMsgIds: [messageId],
                                            ignoredUnreadCount: !messageRecord.read ? 1 : 0,
                                        };
                                    } else {
                                        let threadInfo = threadsToUpdate[threadId];
                                        threadInfo.removedMsgIds.push(messageId);
                                        if (!messageRecord.read) {
                                            threadInfo.ignoredUnreadCount++;
                                        }
                                    }

                                    if (!numOfMessagesToDelete) {
                                        updateThreadInfo();
                                    }
                                };
                            } else {
                                if (DEBUG) {
                                    debug("Message id " + messageId + " does not exist");
                                }
                                numOfMessagesToDelete--;
                                if (!numOfMessagesToDelete) {
                                    updateThreadInfo();
                                }
                            }
                        }.bind(null, i);
                    }
                }
            };
            req.onerror = function(error) {
                aRequest.notifyDeleteMessageFailed(error);
            };
        }, [MESSAGE_STORE_NAME, THREAD_STORE_NAME]);
    },
    createMessageCursor(aHasStartDate, aStartDate, aHasEndDate, aEndDate, aNumbers, aNumbersCount, aDelivery, aHasRead, aRead, aHasThreadId, aThreadId, aReverse, aCallback) {
        if (DEBUG) {
            debug("Creating a message cursor. Filters:" + " startDate: " +
                (aHasStartDate ? aStartDate : "(null)") + " endDate: " +
                (aHasEndDate ? aEndDate : "(null)") + " delivery: " +
                aDelivery + " numbers: " +
                (aNumbersCount ? aNumbers : "(null)") + " read: " +
                (aHasRead ? aRead : "(null)") + " threadId: " +
                (aHasThreadId ? aThreadId : "(null)") + " reverse: " +
                aReverse);
        }
        let filter = {};
        if (aHasStartDate) {
            filter.startDate = aStartDate;
        }
        if (aHasEndDate) {
            filter.endDate = aEndDate;
        }
        if (aNumbersCount) {
            filter.numbers = aNumbers.slice();
        }
        if (aDelivery !== null) {
            filter.delivery = aDelivery;
        }
        if (aHasRead) {
            filter.read = aRead;
        }
        if (aHasThreadId) {
            filter.threadId = aThreadId;
        }
        let cursor = new GetMessagesCursor(this, aCallback);
        let self = this;
        self.newTxn(READ_ONLY, function(error, txn, stores) {
            let collector = cursor.collector.idCollector;
            let collect = collector.collect.bind(collector);
            FilterSearcherHelper.transact(self, txn, error, filter, aReverse, collect);
        }, [MESSAGE_STORE_NAME, PARTICIPANT_STORE_NAME]);
        return cursor;
    },
    markMessageRead(messageId, value, aSendReadReport, aRequest) {
        if (DEBUG) {
            debug("Setting message " + messageId + " read to " + value);
        }
        let self = this;
        this.newTxn(READ_WRITE, function(error, txn, stores) {
            if (error) {
                if (DEBUG) {
                    debug(error);
                }
                aRequest.notifyMarkMessageReadFailed(self.translateCrErrorToMessageCallbackError(error));
                return;
            }
            txn.onabort = function(event) {
                if (DEBUG) {
                    debug("transaction abort due to " + event.target.error.name);
                }
                let error = event.target.error.name === "QuotaExceededError" ? Ci.nsIMobileMessageCallback.STORAGE_FULL_ERROR : Ci.nsIMobileMessageCallback.INTERNAL_ERROR;
                aRequest.notifyMarkMessageReadFailed(error);
            };
            let messageStore = stores[0];
            let threadStore = stores[1];
            messageStore.get(messageId).onsuccess = function(event) {
                let messageRecord = event.target.result;
                if (!messageRecord) {
                    if (DEBUG) {
                        debug("Message ID " + messageId + " not found");
                    }
                    aRequest.notifyMarkMessageReadFailed(Ci.nsIMobileMessageCallback.NOT_FOUND_ERROR);
                    return;
                }
                if (messageRecord.id != messageId) {
                    if (DEBUG) {
                        debug("Retrieve message ID (" +
                            messageId + ") is " + "different from the one we got");
                    }
                    aRequest.notifyMarkMessageReadFailed(Ci.nsIMobileMessageCallback.UNKNOWN_ERROR);
                    return;
                }
                if (messageRecord.read == value) {
                    if (DEBUG) {
                        debug("The value of messageRecord.read is already " + value);
                    }
                    aRequest.notifyMessageMarkedRead(messageRecord.read);
                    return;
                }
                messageRecord.read = value ? FILTER_READ_READ : FILTER_READ_UNREAD;
                messageRecord.readIndex = [messageRecord.read, messageRecord.timestamp, ];
                let readReportMessageId, readReportTo;
                if (messageRecord.type == "mms" && messageRecord.delivery == DELIVERY_RECEIVED && messageRecord.read == FILTER_READ_READ && messageRecord.headers["x-mms-read-report"] && !messageRecord.isReadReportSent) {
                    messageRecord.isReadReportSent = true;
                    if (aSendReadReport) {
                        let from = messageRecord.headers.from;
                        readReportTo = from && from.address;
                        readReportMessageId = messageRecord.headers["message-id"];
                    }
                }
                if (DEBUG) {
                    debug("Message.read set to: " + value);
                }
                messageStore.put(messageRecord).onsuccess = function(event) {
                    if (DEBUG) {
                        debug("Update successfully completed. Message: " +
                            JSON.stringify(event.target.result));
                    }
                    let threadId = messageRecord.threadId;
                    threadStore.get(threadId).onsuccess = function(event) {
                        let threadRecord = event.target.result;
                        threadRecord.unreadCount += value ? -1 : 1;
                        if (DEBUG) {
                            debug("Updating unreadCount for thread id " +
                                threadId + ": " +
                                (value ? threadRecord.unreadCount + 1 : threadRecord.unreadCount - 1) + " -> " +
                                threadRecord.unreadCount);
                        }
                        threadStore.put(threadRecord).onsuccess = function(event) {
                            if (readReportMessageId && readReportTo) {
                                gMMSService.sendReadReport(readReportMessageId, readReportTo, messageRecord.iccId);
                            }
                            aRequest.notifyMessageMarkedRead(messageRecord.read);
                        };
                    };
                };
            };
        }, [MESSAGE_STORE_NAME, THREAD_STORE_NAME]);
    },
    createThreadCursor(callback) {
        if (DEBUG) {
            debug("Getting thread list");
        }
        let cursor = new GetThreadsCursor(this, callback);
        this.newTxn(READ_ONLY, function(error, txn, threadStore) {
            let collector = cursor.collector.idCollector;
            if (error) {
                collector.collect(null, COLLECT_ID_ERROR, COLLECT_TIMESTAMP_UNUSED);
                return;
            }
            txn.onerror = function(event) {
                if (DEBUG) {
                    debug("Caught error on transaction ", event.target.error.name);
                }
                collector.collect(null, COLLECT_ID_ERROR, COLLECT_TIMESTAMP_UNUSED);
            };
            let request = threadStore.index("lastTimestamp").openKeyCursor(null, PREV);
            request.onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor) {
                    if (collector.collect(txn, cursor.primaryKey, cursor.key)) {
                        cursor.continue();
                    }
                } else {
                    collector.collect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
                }
            };
        }, [THREAD_STORE_NAME]);
        return cursor;
    },
};
var FilterSearcherHelper = {
    filterIndex(index, range, direction, txn, collect) {
        let messageStore = txn.objectStore(MESSAGE_STORE_NAME);
        let request = messageStore.index(index).openKeyCursor(range, direction);
        request.onsuccess = function(event) {
            let cursor = event.target.result;
            if (cursor) {
                let timestamp = Array.isArray(cursor.key) ? cursor.key[1] : cursor.key;
                if (collect(txn, cursor.primaryKey, timestamp)) {
                    cursor.continue();
                }
            } else {
                collect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
            }
        };
        request.onerror = function(event) {
            if (DEBUG && event) {
                debug("IDBRequest error " + event.target.error.name);
            }
            collect(txn, COLLECT_ID_ERROR, COLLECT_TIMESTAMP_UNUSED);
        };
    },
    filterTimestamp(startDate, endDate, direction, txn, collect) {
        let range = null;
        if (startDate != null && endDate != null) {
            range = IDBKeyRange.bound(startDate, endDate);
        } else if (startDate != null) {
            range = IDBKeyRange.lowerBound(startDate);
        } else if (endDate != null) {
            range = IDBKeyRange.upperBound(endDate);
        }
        this.filterIndex("timestamp", range, direction, txn, collect);
    },
    transact(mmdb, txn, error, filter, reverse, collect) {
        if (error) {
            if (DEBUG) {
                debug("IDBRequest error " + error);
            }
            collect(txn, COLLECT_ID_ERROR, COLLECT_TIMESTAMP_UNUSED);
            return;
        }
        let direction = reverse ? PREV : NEXT;
        if (filter.delivery == null && filter.numbers == null && filter.read == null && filter.threadId == null) {
            if (DEBUG) {
                debug("filter.timestamp " + filter.startDate + ", " + filter.endDate);
            }
            this.filterTimestamp(filter.startDate, filter.endDate, direction, txn, collect);
            return;
        }

        let startDate = 0,
            endDate = "";
        if (filter.startDate != null) {
            startDate = filter.startDate;
        }
        if (filter.endDate != null) {
            endDate = filter.endDate;
        }
        let single, intersectionCollector;
        {
            let num = 0;
            if (filter.delivery) {
                num++;
            }
            if (filter.numbers) {
                num++;
            }
            if (filter.read != undefined) {
                num++;
            }
            if (filter.threadId != undefined) {
                num++;
            }
            single = num == 1;
        }
        if (!single) {
            intersectionCollector = new IntersectionResultsCollector(collect, reverse);
        }

        if (filter.delivery) {
            if (DEBUG) {
                debug("filter.delivery " + filter.delivery);
            }
            let delivery = filter.delivery;
            let range = IDBKeyRange.bound([delivery, startDate], [delivery, endDate]);
            this.filterIndex("delivery", range, direction, txn, single ? collect : intersectionCollector.newContext());
        }

        if (filter.read != undefined) {
            if (DEBUG) {
                debug("filter.read " + filter.read);
            }
            let read = filter.read ? FILTER_READ_READ : FILTER_READ_UNREAD;
            let range = IDBKeyRange.bound([read, startDate], [read, endDate]);
            this.filterIndex("read", range, direction, txn, single ? collect : intersectionCollector.newContext());
        }

        if (filter.threadId != undefined) {
            if (DEBUG) {
                debug("filter.threadId " + filter.threadId);
            }
            let threadId = filter.threadId;
            let range = IDBKeyRange.bound([threadId, startDate], [threadId, endDate]);
            this.filterIndex("threadId", range, direction, txn, single ? collect : intersectionCollector.newContext());
        }

        if (filter.numbers) {
            if (DEBUG) {
                debug("filter.numbers " + filter.numbers.join(", "));
            }
            if (!single) {
                collect = intersectionCollector.newContext();
            }
            let participantStore = txn.objectStore(PARTICIPANT_STORE_NAME);
            let typedAddresses = filter.numbers.map(function(number) {
                return {
                    address: number,
                    type: MMS.Address.resolveType(number),
                };
            });
            mmdb.findParticipantIdsByTypedAddresses(participantStore, typedAddresses, false, true, function(participantIds) {
                if (DEBUG) {
                    debug("findParticipantIdsByTypedAddresses return participantIds: " +
                        participantIds + "[" +
                        participantIds.length + "]");
                }
                if (!participantIds || !participantIds.length) {
                    collect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
                    return;
                }
                if (participantIds.length == 1) {
                    let id = participantIds[0];
                    let range = IDBKeyRange.bound([id, startDate], [id, endDate]);
                    this.filterIndex("participantIds", range, direction, txn, collect);
                    return;
                }
                let unionCollector = new UnionResultsCollector(collect);
                this.filterTimestamp(filter.startDate, filter.endDate, direction, txn, unionCollector.newTimestampContext());
                for (let i = 0; i < participantIds.length; i++) {
                    let id = participantIds[i];
                    let range = IDBKeyRange.bound([id, startDate], [id, endDate]);
                    this.filterIndex("participantIds", range, direction, txn, unionCollector.newContext());
                }
            }.bind(this));
        }
    },
};

function ResultsCollector(readAheadFunc) {
    this.idCollector = new IDsCollector();
    this.results = [];
    this.readAhead = readAheadFunc;
    this.maxReadAhead = this.maxReadAhead = Services.prefs.getIntPref("dom.sms.maxReadAheadEntries", DEFAULT_READ_AHEAD_ENTRIES);
}
ResultsCollector.prototype = {
    idCollector: null,
    results: null,
    readAhead: null,
    readingAhead: false,
    maxReadAhead: 0,
    activeTxn: null,
    requestWaiting: null,
    done: false,
    lastId: null,
    collect(txn, id) {
        if (this.done) {
            return;
        }
        if (DEBUG) {
            debug("ResultsCollector::collect ID = " + id);
        }

        txn = txn || this.activeTxn;
        if (id > 0) {
            this.readingAhead = true;
            this.readAhead(txn, id, this);
        } else {
            this.notifyResult(txn, id, null);
        }
    },
    notifyResult(txn, id, result) {
        if (DEBUG) {
            debug("notifyResult(txn, " + id + ", <result>)");
        }
        this.readingAhead = false;
        if (id > 0) {
            if (result != null) {
                this.results.push(result);
            } else {
                id = COLLECT_ID_ERROR;
            }
        }
        if (id <= 0) {
            this.lastId = id;
            this.done = true;
        }
        if (!this.requestWaiting) {
            if (DEBUG) {
                debug("notifyResult: cursor.continue() not called yet");
            }
        } else {
            let callback = this.requestWaiting;
            this.requestWaiting = null;
            this.drip(callback);
        }
        this.maybeSqueezeIdCollector(txn);
    },
    maybeSqueezeIdCollector(txn) {
        if (this.done || this.readingAhead || this.idCollector.requestWaiting) {
            return;
        }
        let max = this.maxReadAhead;
        if (!max && this.requestWaiting) {
            max = 1;
        }
        if (max >= 0 && this.results.length >= max) {
            if (DEBUG) {
                debug("maybeSqueezeIdCollector: max " + max + " entries read. Stop.");
            }
            return;
        }

        this.activeTxn = txn;
        this.idCollector.squeeze(this.collect.bind(this));
        this.activeTxn = null;
    },
    squeeze(callback) {
        if (this.requestWaiting) {
            throw new Error("Already waiting for another request!");
        }
        if (this.results.length || this.done) {
            if (DEBUG) {
                debug("squeeze results.length: " + this.results.length);
            }


            this.drip(callback);
        } else {
            this.requestWaiting = callback;
        }


        this.maybeSqueezeIdCollector(null);
    },
    drip(callback) {
        let results = this.results;
        this.results = [];
        let func = this.notifyCallback.bind(this, callback, results, this.lastId);
        Services.tm.currentThread.dispatch(func, Ci.nsIThread.DISPATCH_NORMAL);
    },
    notifyCallback(callback, results, lastId) {
        if (DEBUG) {
            debug("notifyCallback(results[" + results.length + "], " + lastId + ")");
        }
        if (results.length) {
            callback.notifyCursorResult(results, results.length);
        } else if (lastId == COLLECT_ID_END) {
            callback.notifyCursorDone();
        } else {
            callback.notifyCursorError(Ci.nsIMobileMessageCallback.INTERNAL_ERROR);
        }
    },
};

function IDsCollector() {
    this.results = [];
    this.done = false;
}
IDsCollector.prototype = {
    results: null,
    requestWaiting: null,
    done: null,
    collect(txn, id, timestamp) {
        if (this.done) {
            return false;
        }
        if (DEBUG) {
            debug("IDsCollector::collect ID = " + id);
        }
        this.results.push(id);
        if (id <= 0) {
            this.done = true;
        }
        if (!this.requestWaiting) {
            if (DEBUG) {
                debug("IDsCollector::squeeze() not called yet");
            }
            return !this.done;
        }


        let callback = this.requestWaiting;
        this.requestWaiting = null;
        this.drip(txn, callback);
        return !this.done;
    },
    squeeze(callback) {
        if (this.requestWaiting) {
            throw new Error("Already waiting for another request!");
        }
        if (!this.done) {
            this.requestWaiting = callback;
            return;
        }
        this.drip(null, callback);
    },
    drip(txn, callback) {
        let firstId = this.results[0];
        if (firstId > 0) {
            this.results.shift();
        }
        callback(txn, firstId);
    },
};

function IntersectionResultsCollector(collect, reverse) {
    this.cascadedCollect = collect;
    this.reverse = reverse;
    this.contexts = [];
}
IntersectionResultsCollector.prototype = {
    cascadedCollect: null,
    reverse: false,
    contexts: null,
    collect(contextIndex, txn, id, timestamp) {
        if (DEBUG) {
            debug("IntersectionResultsCollector: " +
                contextIndex + ", " +
                id + ", " +
                timestamp);
        }
        let contexts = this.contexts;
        let context = contexts[contextIndex];
        if (id < 0) {
            id = 0;
        }
        if (!id) {
            context.done = true;
            if (!context.results.length) {
                return this.cascadedCollect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
            }
            for (let i = 0; i < contexts.length; i++) {
                if (!contexts[i].done) {
                    return false;
                }
            }
            return this.cascadedCollect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
        }


        for (let i = 0; i < contexts.length; i++) {
            if (i == contextIndex) {
                continue;
            }
            let ctx = contexts[i];
            let results = ctx.results;
            let found = false;
            for (let j = 0; j < results.length; j++) {
                let result = results[j];
                if (result.id == id) {
                    found = true;
                    break;
                }
                if ((!this.reverse && result.timestamp > timestamp) || (this.reverse && result.timestamp < timestamp)) {
                    return true;
                }
            }
            if (!found) {
                if (ctx.done) {
                    if (results.length) {
                        let lastResult = results[results.length - 1];
                        if ((!this.reverse && lastResult.timestamp >= timestamp) || (this.reverse && lastResult.timestamp <= timestamp)) {
                            return true;
                        }
                    }

                    context.done = true;
                    return this.cascadedCollect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
                }
                context.results.push({
                    id,
                    timestamp,
                });
                return true;
            }
        }
        return this.cascadedCollect(txn, id, timestamp);
    },
    newContext() {
        let contextIndex = this.contexts.length;
        this.contexts.push({
            results: [],
            done: false,
        });
        return this.collect.bind(this, contextIndex);
    },
};

function UnionResultsCollector(collect) {
    this.cascadedCollect = collect;
    this.contexts = [{
        processing: 1,
        results: [],
    }, {
        processing: 0,
        results: [],
    }, ];
}
UnionResultsCollector.prototype = {
    cascadedCollect: null,
    contexts: null,
    collect(contextIndex, txn, id, timestamp) {
        if (DEBUG) {
            debug("UnionResultsCollector: " + contextIndex + ", " + id + ", " + timestamp);
        }
        let contexts = this.contexts;
        let context = contexts[contextIndex];
        if (id < 0) {
            id = 0;
        }
        if (id) {
            if (!contextIndex) {
                context.results.push({
                    id,
                    timestamp,
                });
            } else {
                context.results.push(id);
            }
            return true;
        }
        context.processing -= 1;
        if (contexts[0].processing || contexts[1].processing) {

            return false;
        }
        let tres = contexts[0].results;
        let qres = contexts[1].results;
        tres = tres.filter(function(element) {
            return qres.includes(element.id);
        });
        for (let i = 0; i < tres.length; i++) {
            this.cascadedCollect(txn, tres[i].id, tres[i].timestamp);
        }
        this.cascadedCollect(txn, COLLECT_ID_END, COLLECT_TIMESTAMP_UNUSED);
        return false;
    },
    newTimestampContext() {
        return this.collect.bind(this, 0);
    },
    newContext() {
        this.contexts[1].processing++;
        return this.collect.bind(this, 1);
    },
};

function GetMessagesCursor(mmdb, callback) {
    this.mmdb = mmdb;
    this.callback = callback;
    this.collector = new ResultsCollector(this.getMessage.bind(this));
}
GetMessagesCursor.prototype = {
    classID: RIL_GETMESSAGESCURSOR_CID,
    QueryInterface: ChromeUtils.generateQI([Ci.nsICursorContinueCallback]),
    mmdb: null,
    callback: null,
    collector: null,
    getMessageTxn(txn, messageStore, messageId, collector) {
        if (DEBUG) {
            debug("Fetching message " + messageId);
        }
        let getRequest = messageStore.get(messageId);
        let self = this;
        getRequest.onsuccess = function(event) {
            if (DEBUG) {
                debug("notifyNextMessageInListGot - messageId: " + messageId);
            }
            let domMessage = self.mmdb.createDomMessageFromRecord(event.target.result);
            collector.notifyResult(txn, messageId, domMessage);
        };
        getRequest.onerror = function(event) {
            event.stopPropagation();
            event.preventDefault();
            if (DEBUG) {
                debug("notifyCursorError - messageId: " + messageId);
            }
            collector.notifyResult(txn, messageId, null);
        };
    },
    getMessage(txn, messageId, collector) {
        if (txn) {
            let messageStore = txn.objectStore(MESSAGE_STORE_NAME);
            this.getMessageTxn(txn, messageStore, messageId, collector);
            return;
        }
        let self = this;
        this.mmdb.newTxn(READ_ONLY, function(error, txn, messageStore) {
            if (error) {
                debug("getMessage: failed to create new transaction");
                collector.notifyResult(null, messageId, null);
            } else {
                self.getMessageTxn(txn, messageStore, messageId, collector);
            }
        }, [MESSAGE_STORE_NAME]);
    },
    handleContinue() {
        if (DEBUG) {
            debug("Getting next message in list");
        }
        this.collector.squeeze(this.callback);
    },
};

function GetThreadsCursor(mmdb, callback) {
    this.mmdb = mmdb;
    this.callback = callback;
    this.collector = new ResultsCollector(this.getThread.bind(this));
}
GetThreadsCursor.prototype = {
    classID: RIL_GETTHREADSCURSOR_CID,
    QueryInterface: ChromeUtils.generateQI([Ci.nsICursorContinueCallback]),
    mmdb: null,
    callback: null,
    collector: null,
    getThreadTxn(txn, threadStore, threadId, collector) {
        if (DEBUG) {
            debug("Fetching thread " + threadId);
        }
        let getRequest = threadStore.get(threadId);
        getRequest.onsuccess = function(event) {
            let threadRecord = event.target.result;
            if (DEBUG) {
                debug("notifyCursorResult: " + JSON.stringify(threadRecord));
            }
            let thread = gMobileMessageService.createThread(threadRecord.id, threadRecord.participantAddresses, threadRecord.lastTimestamp, threadRecord.lastMessageSubject || "", threadRecord.body, threadRecord.unreadCount, threadRecord.lastMessageType, threadRecord.isGroup, threadRecord.lastMessageAttachementStatus || ATTACHMENT_STATUS_NONE);
            collector.notifyResult(txn, threadId, thread);
        };
        getRequest.onerror = function(event) {
            event.stopPropagation();
            event.preventDefault();
            if (DEBUG) {
                debug("notifyCursorError - threadId: " + threadId);
            }
            collector.notifyResult(txn, threadId, null);
        };
    },
    getThread(txn, threadId, collector) {
        if (txn) {
            let threadStore = txn.objectStore(THREAD_STORE_NAME);
            this.getThreadTxn(txn, threadStore, threadId, collector);
            return;
        }
        let self = this;
        this.mmdb.newTxn(READ_ONLY, function(error, txn, threadStore) {
            if (error) {
                collector.notifyResult(null, threadId, null);
            } else {
                self.getThreadTxn(txn, threadStore, threadId, collector);
            }
        }, [THREAD_STORE_NAME]);
    },
    handleContinue() {
        if (DEBUG) {
            debug("Getting next thread in list");
        }
        this.collector.squeeze(this.callback);
    },
};
this.EXPORTED_SYMBOLS = ["MobileMessageDB"];

function debug(s) {
    dump("MobileMessageDB: " + s + "\n");
}