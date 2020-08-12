const $ = require("jquery");
const fileDialog = require("file-dialog");
const fs = require("fs");
const path = require("path");
const electron = require("electron");

let current_file = null;
let stjsonContent = null;

let settings_file = __dirname + "/settings.json";
settings_file = settings_file.replace(/\\/g, "\\\\");

function showCurrentFileInfo(){
	if(current_file == null){
		$("#current__file span").text("Новый файл");
	} else{
		$("#current__file span").text(current_file);
	}
}

function openFileInExplorer(){
	electron.remote.shell.showItemInFolder(current_file);
}

function openFile(){
	fileDialog({ accept: ['*.*'] })
    .then(files => {
        let filepath = files[0]['path'];
        let filecontent = fs.readFileSync(filepath, "UTF-8");
        $("#textarea").text(filecontent);
        current_file = filepath;
        showCurrentFileInfo();
    });

}

function clearAlert(){
	$(".alert__title").text("");
		$(".alert__text").text("");
		$(".alert__buttons").html("");
}

function deleteFile(){
	if(current_file != null){
		$(".dark").fadeIn(500)
		$(".alert__title").text("Подтверждение");
		$(".alert__text").text("Вы действительно хотите удалить файл " + current_file + " ?");
		$(".alert__buttons").append($("<button id='delete_yes'>Да</button>"));
		$(".alert__buttons").append($("<button id='delete_no'>Нет</button>"));
		$(".confirm__deleting__alert").show(500);

		$("#delete_yes").click(function(){
			fs.unlinkSync(current_file);
			closeFile();
			$(".confirm__deleting__alert").hide(500);
			$(".dark").fadeOut(500);
			clearAlert();
			changeLastOpenedFile(null);
		});

		$("#delete_no").click(function(){
			$(".confirm__deleting__alert").hide(500);
			$(".dark").fadeOut(500);
			clearAlert();
		});
	}
}

function closeFile(){
	current_file = null;
	$("#textarea").text("");
	showCurrentFileInfo();
	changeLastOpenedFile(null);
}

function createNewFile(){
	let path = electron.remote.dialog.showSaveDialogSync( {
        title: "Сохранение нового файла",
        filters: [ { name:"Любые файлы", ext: [ ".*" ] } ],
    });

    if ( ! path ) {
        return;
    }

    fs.writeFileSync( path.toString() , $("#textarea").text());

    current_file = path.toString();

    let filecontent = fs.readFileSync(current_file, "UTF-8");

    $("#textarea").text(filecontent);

    showCurrentFileInfo();
}


function saveFile(){
	if(current_file == null){
		createNewFile();
	} else{
		fs.writeFileSync(current_file, $("#textarea").text());
		showPopup("Сохранено!");
	}
	
}


function getSelectionText() {
   var text = "";
   if (window.getSelection) {
       text = window.getSelection().toString();
   } else if (document.selection && document.selection.type != "Control") {
       text = document.selection.createRange().text;
   }
   return text;
}


function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val(element);
  document.execCommand("copy");
  $temp.remove();
}


function catchPaste(evt, elem, callback) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    // modern approach with Clipboard API
    navigator.clipboard.readText().then(callback);
  } else if (evt.originalEvent && evt.originalEvent.clipboardData) {
    // OriginalEvent is a property from jQuery, normalizing the event object
    callback(evt.originalEvent.clipboardData.getData('text'));
  } else if (evt.clipboardData) {
    // used in some browsers for clipboardData
    callback(evt.clipboardData.getData('text/plain'));
  } else if (window.clipboardData) {
    // Older clipboardData version for Internet Explorer only
    callback(window.clipboardData.getData('Text'));
  } else {
    // Last resort fallback, using a timer
    setTimeout(function() {
      callback(elem.value)
    }, 100);
  }
}

function showPopup(text){
	$(".popup").text(text);
	$(".popup").show();
	setTimeout(function(){
		$(".popup").hide();
	},500);
}

function changeLastOpenedFile(new_value){
	if (stjsonContent != null){
		if(new_value != null){
			new_value = new_value.replace(/\\/g, "\\\\");
		}
		stjsonContent.lastOpenedFile = new_value;
		fs.writeFileSync(settings_file, JSON.stringify(stjsonContent));
	}
}

function loadSettings(){
	var stfilecontent = fs.readFileSync(settings_file);
	stjsonContent = JSON.parse(stfilecontent);
	current_file = stjsonContent.lastOpenedFile;

	if(current_file != null){
		let LOFContent = fs.readFileSync(current_file.toString(), "UTF-8");

  	$("#textarea").text(LOFContent);
	}

  showCurrentFileInfo();

}

$(document).ready(function(){

	loadSettings();

	electron.remote.app.on('before-quit', () => {
		changeLastOpenedFile(current_file)
	});

	$("#open_file").click(openFile);
	$("#save_file").click(saveFile);
	$("#new_file").click(createNewFile);
	$("#close_file").click(closeFile);
	$("#delete_file").click(deleteFile);
	$("#current_file_path").click(openFileInExplorer);

	$("#openFileInNextRunTime").click(function(){
		changeLastOpenedFile(current_file);
	});

	$("#copy").click(function(){
		copyToClipboard(getSelectionText());
	});

	$("#help").click(function () {
		$(".dark").fadeIn(500)
		$(".alert__title").text("Информация");
		$(".alert__text").html("Автор программы - Пуртов Илья<br />Версия программы - " + electron.remote.app.getVersion());
		$(".alert__buttons").append($("<button id='close_alert'>Ок</button>"));
		$(".confirm__deleting__alert").show(500);

		$("#close_alert").click(function(){
			$(".confirm__deleting__alert").hide(500);
			$(".dark").fadeOut(500);
			clearAlert();
		});

	});

	$("#paste").on("click", function(evt){
		catchPaste(evt, this, function(clipData) {
	    $("#textarea").text($("#textarea").text() + clipData);
	  });
	});

	$(document).keyup(function(event){
		if(event.ctrlKey && event.keyCode == 83){
			saveFile();
		}
	});

	$(".dark").click(function(){
		$(".confirm__deleting__alert").hide(500);
		$(".dark").fadeOut(500);
		clearAlert();
	});

});