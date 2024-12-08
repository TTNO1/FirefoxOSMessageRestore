let messageRestorePopup = null;

function onPressMessageRestoreToolbarIcon() {
	if(messageRestorePopup == null || messageRestorePopup.closed) {
		messageRestorePopup = window.open("chrome://messagerestore/content/index.html", "MessageRestoreWindow", "width=700,height=550,top=100,left=400,popup=true,resizable");
	} else {
		messageRestorePopup.focus();
	}
}