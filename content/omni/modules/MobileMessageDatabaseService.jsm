//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
"use strict";
const {
    Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");
var MMDB = {};
ChromeUtils.import("resource://gre/modules/MobileMessageDB.jsm", MMDB);
const GONK_MOBILEMESSAGEDATABASESERVICE_CID = Components.ID("{7db05024-8038-11e4-b7fa-a3edb6f1bf0c}");
const DB_NAME = "sms";

function MobileMessageDatabaseService() {
    Services.dirsvc.get("ProfD", Ci.nsIFile);
    let mmdb = new MMDB.MobileMessageDB();
    mmdb.init(DB_NAME, 0, mmdb.updatePendingTransactionToError.bind(mmdb));
    this.mmdb = mmdb;
}
MobileMessageDatabaseService.prototype = {
    classID: GONK_MOBILEMESSAGEDATABASESERVICE_CID,
    QueryInterface: ChromeUtils.generateQI([Ci.nsIGonkMobileMessageDatabaseService, Ci.nsIMobileMessageDatabaseService, Ci.nsIObserver, ]),
    mmdb: null,
    observe() {},
    saveReceivedMessage(aMessage, aCallback) {
        this.mmdb.saveReceivedMessage(aMessage, aCallback);
    },
    saveSendingMessage(aMessage, aCallback) {
        this.mmdb.saveSendingMessage(aMessage, aCallback);
    },
    setMessageDeliveryByMessageId(aMessageId, aReceiver, aDelivery, aDeliveryStatus, aEnvelopeId, aCallback) {
        this.mmdb.updateMessageDeliveryById(aMessageId, "messageId", aReceiver, aDelivery, aDeliveryStatus, aEnvelopeId, aCallback);
    },
    setMessageDeliveryStatusByEnvelopeId(aEnvelopeId, aReceiver, aDeliveryStatus, aCallback) {
        this.mmdb.updateMessageDeliveryById(aEnvelopeId, "envelopeId", aReceiver, null, aDeliveryStatus, null, aCallback);
    },
    setMessageReadStatusByEnvelopeId(aEnvelopeId, aReceiver, aReadStatus, aCallback) {
        this.mmdb.setMessageReadStatusByEnvelopeId(aEnvelopeId, aReceiver, aReadStatus, aCallback);
    },
    getMessageRecordByTransactionId(aTransactionId, aCallback) {
        this.mmdb.getMessageRecordByTransactionId(aTransactionId, aCallback);
    },
    getMessageRecordById(aMessageId, aCallback) {
        this.mmdb.getMessageRecordById(aMessageId, aCallback);
    },
    translateCrErrorToMessageCallbackError(aCrError) {
        return this.mmdb.translateCrErrorToMessageCallbackError(aCrError);
    },
    saveSmsSegment(aSmsSegment, aCallback) {
        this.mmdb.saveSmsSegment(aSmsSegment, aCallback);
    },
    saveCellBroadcastMessage(aCellBroadcastMessage, aCallback) {
        this.mmdb.saveCellBroadcastMessage(aCellBroadcastMessage, aCallback);
    },
    removeAllCellBroadcastMessage(aCallback) {
        this.mmdb.removeAllCellBroadcastMessage(aCallback);
    },
    getCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback) {
        this.mmdb.getCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback);
    },
    deleteCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback) {
        this.mmdb.deleteCellBroadcastMessage(aSerialNumber, aMessageIdentifier, aCallback);
    },
    getMessage(aMessageId, aRequest) {
        this.mmdb.getMessage(aMessageId, aRequest);
    },
    deleteMessage(aMessageIds, aLength, aRequest) {
        this.mmdb.deleteMessage(aMessageIds, aLength, aRequest);
    },
    createMessageCursor(aHasStartDate, aStartDate, aHasEndDate, aEndDate, aNumbers, aNumbersCount, aDelivery, aHasRead, aRead, aHasThreadId, aThreadId, aReverse, aCallback) {
        return this.mmdb.createMessageCursor(aHasStartDate, aStartDate, aHasEndDate, aEndDate, aNumbers, aNumbersCount, aDelivery, aHasRead, aRead, aHasThreadId, aThreadId, aReverse, aCallback);
    },
    markMessageRead(aMessageId, aValue, aSendReadReport, aRequest) {
        this.mmdb.markMessageRead(aMessageId, aValue, aSendReadReport, aRequest);
    },
    createThreadCursor(aCallback) {
        return this.mmdb.createThreadCursor(aCallback);
    },
};
var EXPORTED_SYMBOLS = ["MobileMessageDatabaseService"];