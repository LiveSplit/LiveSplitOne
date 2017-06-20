window.setSize = function (w, h) {
	var win = require('electron').remote.getCurrentWindow();

	var width, height;
	if (typeof (w) !== 'number') {
		width = win.getSize()[0];
	} else {
		width = w;
	}
	if (typeof (h) !== 'number') {
		height = win.getSize()[1];
	} else {
		height = h;
	}

	win.setSize(width, height);
};

window.wrapSize = function () {
	var win = require('electron').remote.getCurrentWindow();
	var width = win.getSize()[0];
	var livesplit = document.getElementsByClassName("livesplit")[0];
	var height = livesplit.clientHeight;

	// Add the buttons (remove?)
	var buttons = document.getElementsByClassName("buttons")[0];
	height = height + buttons.clientHeight;

	window.setSize(null, height);
};

window.openNewWindow = function (path, modal, title, width, height) {
	const electron = require('electron');
	var parentWin = electron.remote.getCurrentWindow();

	var wWidth = 400,
		wHeight = 400,
		wTitle = "",
		wModal = false;

	if (typeof width === 'number') {
		wWidth = width;
	}
	if (typeof height === 'number') {
		wHeight = height;
	}
	if (typeof title === 'string') {
		wTitle = title;
	}
	if (typeof modal === 'boolean') {
		wModal = modal;
	}

	var win = new electron.remote.BrowserWindow({
		parent: parentWin,
		show: false,
		modal: wModal,
		width: wWidth,
		height: wHeight,
		title: wTitle
	});

	win.setMenu(null);
	win.loadURL(path);
	win.once('ready-to-show', () => {
		win.show();
	});
}
