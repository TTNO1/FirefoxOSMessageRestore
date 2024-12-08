//---Inject---
Components.utils.import("chrome://messagerestore/content/inject.jsm", this);
//------------

let fileInput = document.getElementById("fileinput");
let fileNameText = document.getElementById("filenametext")
let fileInputX = document.getElementById("fileinputx");
let submitButton = document.getElementById("submitbutton");
fileInput.value = null;
fileInput.addEventListener("change", function(e) {
	let file = e.target.files[0];
	if (file) {
		fileNameText.innerHTML = file.name;
		fileNameText.style.color = "#000000";
		fileNameText.style.fontStyle = "normal";
		fileNameText.style["-moz-user-select"] = "unset";
		submitButton.style.cursor = "pointer";
	}
});
fileInputX.addEventListener("click", function(e) {
	fileInput.value = null;
	fileNameText.innerHTML = "'sms-backup.xml'";
	fileNameText.style.color = "#878787";
	fileNameText.style.fontStyle = "italic";
	fileNameText.style["-moz-user-select"] = "none";
	submitButton.style.cursor = "not-allowed";
});
submitButton.addEventListener("click", onSubmit);
function onSubmit(e) {
	submitButton.removeEventListener("click", onsubmit);
	submitButton.style.cursor = "not-allowed";
	if(fileInput.value) {
		setStatusMsg("Reading backup file...");
		let file = fileInput.files[0];
		let fileReader = new FileReader();
		fileReader.addEventListener("load", function () {
			setStatusMsg("Parsing backup file...");
			let fileContentString = fileReader.result;
			let parser = new DOMParser();
			let xmlDoc = parser.parseFromString(fileContentString, "text/xml");
			populateDatabase(xmlDoc);
		});
		fileReader.readAsText(file);
	}
	submitButton.addEventListener("click", onSubmit);
	submitButton.style.cursor = "unset";
}
let statusMsgDiv = document.getElementById("statusmsg");
function setStatusMsg(msg) {
	statusMsgDiv.innerHTML = msg;
}
let errorMsgDiv = document.getElementById("errormsg");
let errorMsgSet = false;
function setErrorMsg(msg) {
	if(errorMsgSet) {
		msg = "*! " + msg;
	}
	errorMsgDiv.innerHTML = msg;
	errorMsgDiv.style.display = "inline-block";
	errorMsgSet = true;
}

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm", this);
XPCOMUtils.defineLazyGetter(this, "MMS", function() {
    let MMS = {};
    ChromeUtils.import("resource://gre/modules/MmsPduHelper.jsm", MMS);
    return MMS;
});

function populateDatabase(xmlDoc) {
	setStatusMsg("Populating database ...");
	
	let smsMsgs = Array.from(xmlDoc.getElementsByTagName("sms"));
	let mmsMsgs = Array.from(xmlDoc.getElementsByTagName("mms"));
	let totalMsgCount = smsMsgs.length + mmsMsgs.length;
	let savedMsgCount = 0;
	
	smsMsgs.forEach(function(sms, index, arr) {
		if(savedMsgCount % 500 == 0) {
			setStatusMsg("Populating database " + Math.round((savedMsgCount/totalMsgCount)*1000)/10 + "%");
		}
		
		let type = sms.getAttribute("type");
		
		let msgObj = {
			type: "sms",
			read: 1,
			timestamp: Number(sms.getAttribute("date")),
			messageClass: "normal",
			body: sms.getAttribute("body")
		}
		
		if(type == "1") {
			msgObj.sender = sms.getAttribute("address");
			msgObj.delivery = "received";
			mmdbs.saveReceivedMessage(msgObj, {
				notify: function (e, domMsg) {
					if(e != 0 && e != undefined) {
						setErrorMsg("Error: " + e);
					}
					mmdbs.markMessageRead(domMsg.id, 1, false, {
						notifyMarkMessageReadFailed: function(e) {
							setErrorMsg("Error: " + e);
						},
						notifyMessageMarkedRead: function(val) {
							if(!val) {
								setErrorMsg("Error: Message with id " + domMsg.id + " not marked as read.");
							}
						}
					});
				}
			});
		} else if(type == "2") {
			msgObj.receiver = sms.getAttribute("address");
			msgObj.delivery = "sent";
			msgObj.deliveryStatusRequested = false;
			mmdbs.saveSendingMessage(msgObj, {
				notify: function (e, domMsg) {
					if(e != 0 && e != undefined) {
						setErrorMsg("Error: " + e);
					}
					mmdbs.setMessageDeliveryByMessageId(domMsg.id, undefined, "sent", undefined, undefined, {
						notify: function (e, msgRecord) {
							if(e != 0 && e != undefined) {
								setErrorMsg("Error: " + e);
							}
						}
					});
				}
			});
		} else {
			setErrorMsg("Error, Inavlid SMS Type: " + type);
		}
		savedMsgCount++;
	});
	
	mmsMsgs.forEach(function(mms, index, arr) {
		if(savedMsgCount % 500 == 0) {
			setStatusMsg("Populating database " + Math.round((savedMsgCount/totalMsgCount)*1000)/10 + "%");
		}
		
		let addressNumbers = mms.getAttribute("address").split("~");
		let receivers = [];
		let sender = null;
		let sent = true;
		let toArray = [];
		let ccArray = [];
		let bccArray = [];
		Array.from(mms.getElementsByTagName("addrs")[0].getElementsByTagName("addr")).forEach(function(addr, index, arr) {
			let type = addr.getAttribute("type");
			let address = addr.getAttribute("address");
			let addressType = MMS.Address.resolveType(address);
			if(type == "151") {
				receivers.push(address);
				toArray.push({address: address, type: addressType});
			} else if(type == "130") {
				receivers.push(address);
				ccArray.push({address: address, type: addressType});
			} else if(type == "129") {
				receivers.push(address);
				bccArray.push({address: address, type: addressType});
			} else if(type == "137") {
				sender = address;
			} else {
				setErrorMsg("Error, Invalid Address Type: " + type);
			}
		});
		addressNumbers.forEach(function(num, index, arr) {
			if(phoneNumsEqual(num, sender)) {
				sent = false;
			}
		});
		
		if(!sent && toArray.length != 1) {
			setErrorMsg("Error, invalid number of 151 addresses.");
		}
		
		let domParts = Array.from(mms.getElementsByTagName("parts")[0].getElementsByTagName("part"));
		let parts = [];
		domParts.forEach(function (part, index, arr) {
			let contentType = part.getAttribute("ct");
			let content = null;
			if(contentType == "application/smil") {
				content = part.getAttribute("text");
			} else {
				content = new Blob([part.getAttribute("text")], {type: contentType});
			}
			parts.push({
				index: Number(part.getAttribute("seq")),
				headers: {
					"content-id": part.getAttribute("cid") === "null" ? null : part.getAttribute("cid"),
					"content-length": content.size || content.length,
					"content-location": part.getAttribute("cl") === "null" ? null : part.getAttribute("cl"),
					"content-type": {
						media: contentType,
						params: {
							charset: {charset: "utf-8"},
							name: part.getAttribute("name") === "null" ? null : part.getAttribute("name")
						}
					}
				},
				content: content
			});
		});
		
		let msgObj = {
			type: "mms",
			read: 1,
			receivers: receivers,
			phoneNumber: !sent ? toArray[0].address : undefined,
			delivery: sent ? "sent" : "received",
			deliveryStatus: "not-applicable",
			timestamp: Number(mms.getAttribute("date")),
			messageClass: "normal",
			deliveryStatusRequested: false,
			headers: {
				from: {
					address: sender
				},
				to: toArray,
				cc: ccArray,
				bcc: bccArray,
				subject: mms.getAttribute("sub")
			},
			parts: parts
		}
		
		if(sent) {
			mmdbs.saveSendingMessage(msgObj, {
				notify: function (e, domMsg) {
					if(e != 0 && e != undefined) {
						setErrorMsg("Error: " + e);
					}
					mmdbs.setMessageDeliveryByMessageId(domMsg.id, undefined, "sent", undefined, undefined, {
						notify: function (e, msgRecord) {
							if(e != 0 && e != undefined) {
								setErrorMsg("Error: " + e);
							}
						}
					});
				}
			});
		} else {
			mmdbs.saveReceivedMessage(msgObj, {
				notify: function (e, domMsg) {
					if(e != 0 && e != undefined) {
						setErrorMsg("Error: " + e);
					}
					mmdbs.markMessageRead(domMsg.id, 1, false, {
						notifyMarkMessageReadFailed: function(e) {
							setErrorMsg("Error: " + e);
						},
						notifyMessageMarkedRead: function(val) {
							if(!val) {
								setErrorMsg("Error: Message with id " + domMsg.id + " not marked as read.");
							}
						}
					});
				}
			});
		}
		
		savedMsgCount++;
	});
	
	setStatusMsg("Complete!");
}

function phoneNumsEqual(num1, num2) {
	if(num1.startsWith("+")) {
		num1 = num1.substring(1);
	}
	if(num2.startsWith("+")) {
		num2 = num2.substring(1);
	}
	if(num1 == num2) {
		return true;
	} else if(num1.substring(1) == num2) {
		return true;
	} else if(num1 == num2.substring(1)) {
		return true;
	} else {
		return false;
	}
}

ChromeUtils.import("resource://gre/modules/MobileMessageDatabaseService.jsm", this);
let mmdbs = new MobileMessageDatabaseService();

function logMessageRecordsForIDs(idFrom, idTo) {
	for (let i = idFrom; i <= idTo; i++) {
		mmdbs.getMessageRecordById(i, {
			notify: function (error, msgRecord, domMsg) {
				if(msgRecord != null) {
					if(error != 0 && error != undefined) {
						console.warn("Error: " + error);
					}
					console.log("Message Record:");
					console.log(msgRecord);
					console.log("DOM Message:");
					console.log(domMsg);
				}
			}
		});
	}
}