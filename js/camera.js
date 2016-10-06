var pictureSource;
// picture source
var destinationType;
// sets the format of returned value

// Wait for device API libraries to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// device APIs are available
function onDeviceReady() {
	pictureSource = navigator.camera.PictureSourceType;
	destinationType = navigator.camera.DestinationType;
}

function getpic() {
	
	navigator.camera.getPicture(moveFile, onFail, {
		quality : 100,
		targetWidth : 600,
		targetHeight : 600,
		destinationType : Camera.DestinationType.FILE_URI,
		sourceType : Camera.PictureSourceType.CAMERA,
		allowEdit : false,
		encodingType : Camera.EncodingType.JPEG,
		
		saveToPhotoAlbum : true,
		correctOrientation:true
	});
}

function onFail(message) {
	console.log('Failed because: ' + message);
}

var imgpath;
function moveFile(imageURI){//directory creation functionality
	
	 var date= new Date();
	 var time = date.getTime();
	 newFilename= time+".jpg";
	// $("#IID").text(time);
	 var scope = angular.element($("#blue")).scope();
	    scope.$apply(function(){    	
	      var res = scope.readBluetoothempcode(imageURI);
	       
	    })
//	    console.log($("#IID").text())
	
}

function getpicture(succval){
	var btcode=succval[0];
	console.log(btcode)
	newFilename=btcode+".jpg";
	tempdate=succval[2];
	tempwegiht=succval[1];
	$("#IID").text(code);
	function moveFiles(imageURI){
		window.resolveLocalFileSystemURL(
    			imageURI,
    	          function(fileEntry){
    	                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys){
    	                	fileSys.root.getDirectory("FaceIdentifier", {create: true, exclusive: false},function(directory){//directory creation
    	                		var directoryEntry = fileSys.root.nativeURL;
    	                		imgpath=directoryEntry;
    		 	             var check= fileEntry.moveTo(directory, newFilename,successCallback ,errorCallback );
    	                	},errorCallback);
    	                }, errorCallback);
    	          },
    	          errorCallback);
	}
	navigator.camera.getPicture(moveFiles, onFails, {
		quality : 100,
		targetWidth : 600,
		targetHeight : 600,
		destinationType : Camera.DestinationType.FILE_URI,
		sourceType : Camera.PictureSourceType.CAMERA,
		allowEdit : false,
		encodingType : Camera.EncodingType.JPEG,	
		saveToPhotoAlbum : true,
		correctOrientation:true
	});	
	
}

