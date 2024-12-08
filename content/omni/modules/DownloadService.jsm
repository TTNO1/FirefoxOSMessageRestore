//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

this.EXPORTED_SYMBOLS = ["DownloadService"];

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { Downloads } = ChromeUtils.import(
  "resource://gre/modules/Downloads.jsm"
);
const { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");

/**
 * Parent process logic that services download API requests from the
 * DownloadAPI.js instances in content processeses.  The actual work of managing
 * downloads is done by Toolkit's Downloads.jsm.  This module is loaded by B2G's
 * shell.js
 */

const DEBUG = Services.prefs.getBoolPref("dom.downloads.debug", false);
function debug(aStr) {
  dump("-*- DownloadService.jsm : " + aStr + "\n");
}

function sendPromiseMessage(aMm, aMessageName, aData, aError) {
  DEBUG && debug("sendPromiseMessage " + aMessageName);
  let msg = {
    id: aData.id,
    promiseId: aData.promiseId,
  };

  if (aError) {
    msg.error = aError;
  }

  aMm.sendAsyncMessage(aMessageName, msg);
}

var DownloadService = {
  init() {
    DEBUG && debug("init");

    this._ids = new WeakMap(); // Maps toolkit download objects to ids.
    this._index = {}; // Maps ids to downloads.

    [
      "Downloads:GetList",
      "Downloads:ClearAllDone",
      "Downloads:Remove",
      "Downloads:Pause",
      "Downloads:Resume",
      "Downloads:Adopt",
    ].forEach(msgName => {
      Services.ppmm.addMessageListener(msgName, this);
    });

    let self = this;
    (async function() {
      let list = await Downloads.getList(Downloads.ALL);

      // At the first time of calling Downloads.getList(), DownloadStore.load()
      // loads persistent downloads from the file, and calls download.start()
      // on the downloads which were in progress.
      // On b2g, we choose to cancel these downloads, and let user restart the
      // downloads manually, to avoid unexpected storage or network consumption.
      let downloads = await list.getAll();
      downloads.forEach(aDownload => {
        if (!aDownload.succeeded && !aDownload.canceled && !aDownload.error) {
          DEBUG &&
            debug(
              `cancel download on init ${JSON.stringify(
                self.jsonDownload(aDownload)
              )}`
            );
          aDownload.cancel();
        }
      });

      await list.addView(self);
      DEBUG && debug("view added to download list.");
    })().then(null, Cu.reportError);

    this._currentId = 0;
  },

  /**
   * Returns a unique id for each download, hashing the url and the path.
   */
  downloadId(aDownload) {
    let id = this._ids.get(aDownload, null);
    if (!id) {
      id = "download-" + this._currentId++;
      this._ids.set(aDownload, id);
      this._index[id] = aDownload;
    }
    return id;
  },

  getDownloadById(aId) {
    return this._index[aId];
  },

  /**
   * Converts a download object into a plain json object that we'll
   * send to the DOM side.
   */
  jsonDownload(aDownload) {
    let res = {
      totalBytes: aDownload.totalBytes,
      currentBytes: aDownload.currentBytes,
      url: aDownload.source.url,
      path: aDownload.target.path,
      contentType: aDownload.contentType,
      startTime: aDownload.startTime.getTime(),
      sourceAppManifestURL:
        aDownload._unknownProperties &&
        aDownload._unknownProperties.sourceAppManifestURL,
    };

    if (aDownload.error) {
      res.error = aDownload.error;
    }

    res.id = this.downloadId(aDownload);

    // The state of the download. Can be any of "downloading", "stopped",
    // "succeeded", finalized".

    // Default to "stopped"
    res.state = "stopped";
    if (
      !aDownload.stopped &&
      !aDownload.canceled &&
      !aDownload.succeeded &&
      !aDownload.DownloadError
    ) {
      res.state = "downloading";
    } else if (aDownload.succeeded) {
      res.state = "succeeded";
    }
    return res;
  },

  /**
   * download view methods.
   */
  onDownloadAdded(aDownload) {
    let download = this.jsonDownload(aDownload);
    debug("onDownloadAdded " + uneval(download));
    Services.ppmm.broadcastAsyncMessage("Downloads:Added", download);
  },

  onDownloadRemoved(aDownload) {
    let download = this.jsonDownload(aDownload);
    download.state = "finalized";
    debug("onDownloadRemoved " + uneval(download));
    Services.ppmm.broadcastAsyncMessage("Downloads:Removed", download);
    this._index[this._ids.get(aDownload)] = null;
    this._ids.delete(aDownload);
  },

  onDownloadChanged(aDownload) {
    let download = this.jsonDownload(aDownload);
    if (DEBUG || download.state !== "downloading") {
      debug("onDownloadChanged " + uneval(download));
    }
    Services.ppmm.broadcastAsyncMessage("Downloads:Changed", download);
  },

  receiveMessage(aMessage) {
    DEBUG && debug("message: " + aMessage.name);

    switch (aMessage.name) {
      case "Downloads:GetList":
        this.getList(aMessage.data, aMessage.target);
        break;
      case "Downloads:ClearAllDone":
        this.clearAllDone(aMessage.data, aMessage.target);
        break;
      case "Downloads:Remove":
        this.remove(aMessage.data, aMessage.target);
        break;
      case "Downloads:Pause":
        this.pause(aMessage.data, aMessage.target);
        break;
      case "Downloads:Resume":
        this.resume(aMessage.data, aMessage.target);
        break;
      case "Downloads:Adopt":
        this.adoptDownload(aMessage.data, aMessage.target);
        break;
      default:
        DEBUG && debug("Invalid message: " + aMessage.name);
    }
  },

  getList(aData, aMm) {
    DEBUG && debug("getList");
    let self = this;
    (async function() {
      let list = await Downloads.getList(Downloads.ALL);
      let downloads = await list.getAll();
      let res = [];
      downloads.forEach(aDownload => {
        res.push(self.jsonDownload(aDownload));
      });
      aMm.sendAsyncMessage("Downloads:GetList:Return", res);
    })().then(null, Cu.reportError);
  },

  clearAllDone(aData, aMm) {
    debug("clearAllDone");
    (async function() {
      let list = await Downloads.getList(Downloads.ALL);
      list.removeFinished();
    })().then(null, Cu.reportError);
  },

  remove(aData, aMm) {
    DEBUG && debug("remove id " + aData.id);
    let download = this.getDownloadById(aData.id);
    if (!download) {
      sendPromiseMessage(
        aMm,
        "Downloads:Remove:Return",
        aData,
        "NoSuchDownload"
      );
      return;
    }

    (async function() {
      await download.finalize(true);
      let list = await Downloads.getList(Downloads.ALL);
      await list.remove(download);
    })().then(
      function() {
        sendPromiseMessage(aMm, "Downloads:Remove:Return", aData);
      },
      function() {
        sendPromiseMessage(
          aMm,
          "Downloads:Remove:Return",
          aData,
          "RemoveError"
        );
      }
    );
  },

  pause(aData, aMm) {
    debug("pause id " + aData.id);
    let download = this.getDownloadById(aData.id);
    if (!download) {
      sendPromiseMessage(
        aMm,
        "Downloads:Pause:Return",
        aData,
        "NoSuchDownload"
      );
      return;
    }

    download.cancel().then(
      function() {
        sendPromiseMessage(aMm, "Downloads:Pause:Return", aData);
      },
      function() {
        sendPromiseMessage(aMm, "Downloads:Pause:Return", aData, "PauseError");
      }
    );
  },

  resume(aData, aMm) {
    debug("resume id " + aData.id);
    let download = this.getDownloadById(aData.id);
    if (!download) {
      sendPromiseMessage(
        aMm,
        "Downloads:Resume:Return",
        aData,
        "NoSuchDownload"
      );
      return;
    }

    download.start().then(
      function() {
        sendPromiseMessage(aMm, "Downloads:Resume:Return", aData);
      },
      function() {
        sendPromiseMessage(
          aMm,
          "Downloads:Resume:Return",
          aData,
          "ResumeError"
        );
      }
    );
  },

  /**
   * Receive a download to adopt in the same representation we produce from
   * our "jsonDownload" normalizer and add it to the list of downloads.
   */
  adoptDownload(aData, aMm) {
    (async function() {
      let adoptJsonRep = aData.jsonDownload;
      debug("adoptDownload " + adoptJsonRep?.path + " " + adoptJsonRep?.url);
      DEBUG && debug(uneval(adoptJsonRep));

      // Verify that the file exists on disk.  This will result in a rejection
      // if the file does not exist.  We will also use this information for the
      // file size to avoid weird inconsistencies.  We ignore the filesystem
      // timestamp in favor of whatever the caller is telling us.
      let fileInfo = await OS.File.stat(adoptJsonRep.path);

      // We also require that the file is not a directory.
      if (fileInfo.isDir) {
        throw new Error("AdoptFileIsDirectory");
      }

      // We need to create a Download instance to add to the list.  Create a
      // serialized representation and then from there the instance.
      let serializedRep = {
        // explicit initializations in toSerializable
        source: {
          url: adoptJsonRep.url,
          // This is where isPrivate would go if adoption supported private
          // browsing.
        },
        target: {
          path: adoptJsonRep.path,
        },
        startTime: adoptJsonRep.startTime,
        // kPlainSerializableDownloadProperties propagations
        succeeded: true, // (all adopted downloads are required to be completed)
        totalBytes: fileInfo.size,
        contentType: adoptJsonRep.contentType,
        // unknown properties added/used by the DownloadService
        currentBytes: fileInfo.size,
        sourceAppManifestURL: adoptJsonRep.sourceAppManifestURL,
      };

      let download = await Downloads.createDownload(serializedRep);

      // The ALL list is a DownloadCombinedList instance that combines the
      // PUBLIC (persisted to disk) and PRIVATE (ephemeral) download lists..
      // When we call add on it, it dispatches to the appropriate list based on
      // the 'isPrivate' field of the source.  (Which we don't initialize and
      // defaults to false.)
      let allDownloadList = await Downloads.getList(Downloads.ALL);

      // This add will automatically notify all views of the added download,
      // including DownloadService instances and the DownloadAutoSaveView that's
      // subscribed to the PUBLIC list and will save the download.
      await allDownloadList.add(download);

      DEBUG && debug("download adopted");
      // The notification above occurred synchronously, and so we will have
      // already dispatched an added notification for our download to the child
      // process in question.  As such, we only need to relay the download id
      // since the download will already have been cached.
      return download;
    })().then(
      download => {
        sendPromiseMessage(aMm, "Downloads:Adopt:Return", {
          id: this.downloadId(download),
          promiseId: aData.promiseId,
        });
      },
      ex => {
        let reportAs = "AdoptError";
        // Provide better error codes for expected errors.
        if (ex instanceof OS.File.Error && ex.becauseNoSuchFile) {
          reportAs = "AdoptNoSuchFile";
        } else if (ex.message === "AdoptFileIsDirectory") {
          reportAs = ex.message;
        } else {
          // Anything else is unexpected and should be reported to help track
          // down what's going wrong.
          debug("unexpected download error: " + ex);
          Cu.reportError(ex);
        }
        sendPromiseMessage(
          aMm,
          "Downloads:Adopt:Return",
          {
            promiseId: aData.promiseId,
          },
          reportAs
        );
      }
    );
  },
};

DownloadService.init();
