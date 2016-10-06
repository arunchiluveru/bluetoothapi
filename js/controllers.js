/*
 *  This is main JS file for entire application. Contains controllers, filters, url mapping, global level initialisation, listeners and background processes.
 *  Plugin initialisation and their default values and function calls for intansiation. Common JS functions are seperated in main.js file.
 *
 *  Author: Arun Chiluveru
 *  
 */

var app = angular.module('frApp', ['ngCordova', 'ngRoute']);
var bluetoothempcode;

// app global initialisation 
app.run(['$rootScope', '$cordovaSQLite', '$cordovaBluetoothSerial', '$cordovaGeolocation', '$location', '$route', '$interval',

    function($rootScope, $cordovaSQLite, $cordovaBluetoothSerial, $cordovaGeolocation, $location, $route, $interval) {
        // Application Level Constants.
      $rootScope.apiURL =	'http://localhost/face/';
        $rootScope.deviceRequest = $rootScope.apiURL + "/controller/deviceRequest.php"
        $rootScope.imageURLPrifix = '/sdcard/TeaGarden/images/';
        $rootScope.imageURLSufix = '1.jpg';
        $rootScope.galleryName = 'Class1';

        // Environment variables
        $rootScope.isDevelopment = false; // Make it false in production

        // Navigation Handler
        document.addEventListener("backbutton", function() {
            // Checking for any opened modals.
            if ($rootScope.isModalOpen) {
                $('#' + $rootScope.modalOpenID).modal('hide');
                $rootScope.isModalOpen = false;
                $rootScope.modalOpenID = '';
                return false;
            };
            if ($location.path() == '/superadmin' || $location.path() == '/login') {
                navigator.app.exitApp();
            } else {
                console.log('In the change Loacation');
                $location.path('/superadmin');
                $route.reload();
            };
        }, false);

        document.addEventListener("deviceready", function() {
            $rootScope.isDeviceReady = true;
            // Database Initialisation
            $rootScope.db = createDatabase($cordovaSQLite);

            // Bluetooth initial configuration
            getBTReady($rootScope, $cordovaBluetoothSerial);

            // Geo Taging adding watchdog
            var watchOptions = {
                frequency: 1000,
                timeout: 3000,
                enableHighAccuracy: false // may cause errors if true
            };

            var watch = $cordovaGeolocation.watchPosition(watchOptions);
            watch.then(null, function(err) {
                    if (err.code == '3') {
                        console.log("Please Switch on GPS.");
                    };
                    if (JSON.stringify(err) == '{}') {
                        console.log('Please check GPS.');
                    };
                },
                function(position) {
                    $rootScope.lat = position.coords.latitude
                    $rootScope.lng = position.coords.longitude
                    
                });
            // Repeated tasks Decleration.
            // Randomly checking for BT connectivity
            $rootScope.isBTIdle = true;
            $interval(function() {
                if (!$rootScope.isBTIdle) {
                    isBTConnected($rootScope, $cordovaBluetoothSerial);
                };
            }, 5000);
            // Bluetooth Status Checking
            $rootScope.$on('btDisconnected', function(event, status) {
                if (status) {
                    connectBT($rootScope, $cordovaBluetoothSerial);
                };
            });

            

        }, false);

    }
]);

// Sanitization configuration
app.config(['$compileProvider', '$httpProvider',

    function($compileProvider, $httpProvider) {
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        
    }
]);

// URL Mapping
app.config(['$routeProvider',
    function($routeProvider) {

        $routeProvider.
        when('/login', {
            templateUrl: 'template/login.html',
            controller: 'loginCtrl'
        }).
 
        
        
        when('/superadmin', {
            templateUrl: 'template/superadmin.html',
            controller: 'SuperAdminCtrl'	
        }).
        when('/Enroll', {
            templateUrl: 'template/Enroll.html',
            controller: 'EnrollCtrl'
        }).
        
        when('/ImageGallery', {
            templateUrl: 'template/Gallery.html',
            controller: 'ImageGalleryCtrl'
        }).otherwise({
            redirectTo: '/login'
        });
    }
]);

//SuperAdmin Controlls
app.controller('SuperAdminCtrl', ['$scope', '$location', '$rootScope', '$cordovaSQLite',
                             function($scope, $location, $rootScope, $cordovaSQLite) {
	$scope.logout = function (){
		
		navigator.notification.confirm('Do you want to logout?',onConfirm,'Logout',['Yes','No']);
		function onConfirm(buttonIndex){
			if(buttonIndex==1){
				$location.path('/login');
				console.log("logged out successfully");
			}else {
				console.log("You selected No button" +buttonIndex);
				}
			
		}
	}
}
]);

// Login Controlls
app.controller('loginCtrl', ['$scope', '$location', '$rootScope', '$cordovaSQLite',
    function($scope, $location, $rootScope, $cordovaSQLite) {

        if ($rootScope.isDevelopment) {
            $scope.user = {
                userName: 'superadmin',
                password: '1234'
            };
        };

        $scope.loginSubmit = function() {
            var query = 'SELECT * FROM User WHERE userName="' + $scope.user.userName + '" AND password="' + $scope.user.password + '"';
            $cordovaSQLite.execute($rootScope.db, query, []).then(function(res) {
            	
                if (res.rows.length != '0') {
                    $scope.error = "";
                    var path = $location.path('/superadmin');
                } else {
                    $scope.error = "Invalid login credentials";
                };
                $rootScope.loggedInUser = res.rows.item(0);
                console.log("Logged in as: " + res.rows.item(0).role);
            }, function(err) {
                console.error("Login query error: " + JSON.stringify(err));
            });
        }
    }
]);

var tempdate,tempwegiht;
// Bluetooth controlles in recognition
app.controller('bluetoothCtrl', ['$scope', '$location', '$rootScope', '$cordovaBluetoothSerial',
    function($scope, $location, $rootScope, $cordovaBluetoothSerial) {

        // Bindding Modal Changes
        $('#btSettings').on('show.bs.modal', function(e) {
            $rootScope.isModalOpen = true;
            $rootScope.modalOpenID = 'btSettings';
        });
        $('#btSettings').on('hide.bs.modal', function(e) {
            $rootScope.isModalOpen = false;
            $rootScope.modalOpenID = '';
        });

        if ($rootScope.btStatus == 'connected') {
            $rootScope.btConnectBtn = 'Disconnect from device';
        } else {
            $rootScope.btConnectBtn = 'Connect to device';
        };

        // Initialization
        $scope.btDevices = $rootScope.btDevicesList;

        $scope.connectToBT = function() {
            var isRootBTDeviceSet = angular.isUndefined($rootScope.btDevice) || $rootScope.btDevice === null;
            if (angular.isUndefined($scope.btDevice) || $scope.btDevice === null) {
                console.log('Please select Device');
                return false;
            };
            var macAddress;
            if (isRootBTDeviceSet) {
                $rootScope.btDevice = $scope.btDevice;
                macAddress = $scope.btDevice.address;

            } else {
                macAddress = $rootScope.btDevice.address
            };
            connectBT($rootScope, $cordovaBluetoothSerial);
        };

        $rootScope.readBluetoothempcode = function(imageURI){
        	var bcode='';
        	var newFilename='';
        	var readSuccess = function(data) {
            	//console.log("connected read");
          		console.log('Msg read: ' + JSON.stringify(data));
            	bluetoothempcode = JSON.stringify(data);
            	bluetoothempcode=bluetoothempcode.replace(/\"/g, "");
            	bluetoothempcode=bluetoothempcode.split(",");
            	var code = bluetoothempcode[0].replace(/\!$/g, "");
            	$("#IID").text(code);
            	if(code!=""){
            		$("#capture_image").attr("src", imageURI);
            		$("#image_path").val(imageURI);
            	bcode=bluetoothempcode;
            	newFilename=code+".jpg";
            	tempdate=bluetoothempcode[2];
            	tempwegiht=bluetoothempcode[1];
            	//console.log('Msg Send: ' + JSON.stringify(data));
            	window.resolveLocalFileSystemURL(
            			imageURI,
            	          function(fileEntry){
            	                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys){
            	                	fileSys.root.getDirectory("FaceReco", {create: true, exclusive: false},function(directory){//directory creation
            	                		var directoryEntry = fileSys.root.nativeURL;
            	                		imgpath=directoryEntry;
            		 	             var check= fileEntry.moveTo(directory, newFilename,successCallback ,errorCallback );
            	                	},errorCallback);
            	                }, errorCallback);
            	          },
            	          errorCallback);
            	}else{
            		console.log("No data recevied");
            		$('#capture_image').attr('src', 'images/human_icon.png');	
                	$("#IID").text("");   		
            	}
            	//return bluetoothempcode;
                
            }
            var readFail = function(error) {
                $rootScope.btNotification = $rootScope.btNotification + " Image Id not Sent : " + JSON.stringify(error);
                console.log(" Image Id not Sent : " + JSON.stringify(error));
            }       	
           $cordovaBluetoothSerial.read(imageURI).then(readSuccess, readFail);
          // console.log(req)
        	//return req;
        }
        $rootScope.getempCodeFromBtCtrl=function(){
        	var imgid=$("#IID").text();
            //console.log(imgid);
             var msg = imgid;  
             var getSuccess=function(data){
            	var btcode='';
            	btcode = JSON.stringify(data);
            	//console.log(btcode)
            	btcode=btcode.replace(/\"/g, "");
            	btcode=btcode.split(",");
            	var code = btcode[0].replace(/\!$/g, "");
            	if(code.length==6){
            		//getpic();
            		var newFilename='';        		
            		navigator.camera.getPicture(function(imagePath){        			
            			console.log('Msg read: ' + JSON.stringify(data));
            			$("#capture_image").attr("src", imagePath);
                		$("#image_path").val(imagePath);
                		newFilename=code+".jpg";
                    	tempdate=btcode[2];
                    	tempwegiht=btcode[1];
                    	$("#IID").text(code);
                    	//console.log(newFilename+":"+code);
                		window.resolveLocalFileSystemURL(
                				imagePath,
                    	          function(fileEntry){
                    	                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys){
                    	                	fileSys.root.getDirectory("FaceReco", {create: true, exclusive: false},function(directory){//directory creation
                    	                		var directoryEntry = fileSys.root.nativeURL;
                    	                		imgpath=directoryEntry;
                    		 	             var check= fileEntry.moveTo(directory, newFilename,successCallback ,errorCallback );
                    	                	},errorCallback);
                    	                }, errorCallback);
                    	          },
                    	    errorCallback);
                		
            		}, function(errMsg){console.log(errMsg)}, {
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
            	}else{      		
            		$("#msgg").text("Waiting for next employee data..");
            		$rootScope.getempCodeFromBtCtrl();
            	}
             }
             var getFail=function(err){
            	 console.log(err);
             }
        	$cordovaBluetoothSerial.read(msg).then(getSuccess, getFail);
        }
        
      $rootScope.sendImgCodeToBTCtrl=function(){      	
      
        var msgSuccess = function(data) {
        	$rootScope.getempCodeFromBtCtrl()
        	
           }
        var msgFail = function(error) {
            $rootScope.btNotification = $rootScope.btNotification + " Image Id not Sent : " + JSON.stringify(error);
            console.log(" Image Id not Sent : " + JSON.stringify(error));
        }
       // string
        $cordovaBluetoothSerial.write("OK").then(msgSuccess, msgFail);
        }
      
    }

]);

//$rootScope.successCallback=function(entry){}
function successCallback(entry) {
	$("#image_path_new").val(imgpath+entry.fullPath);
    console.log("New Path: " + entry.fullPath);
}

function errorCallback(error) {
    console.log("Error:" + error.code);
}


//Enroll controls 
app.controller('EnrollCtrl', ['$scope', '$location', '$rootScope', '$cordovaSQLite', '$cordovaGeolocation','$routeParams',
    function($scope, $location, $rootScope, $cordovaSQLite, $cordovaGeolocation,$routeParams) {
        $scope.captureImage = function() {
            getpic();
        };
        $scope.NextRecord = function(){
        	 $('#capture_image').attr('src', 'images/human_icon.png');	
        	 $("#IID").text("");
        };
        if ($rootScope.btStatus == 'connected') {
        	$rootScope.getempCodeFromBtCtrl();
        }
        $scope.imageButton = function() {
            if ($('#capture_image').attr('src') == 'images/human_icon.png') {
                console.log('Please Capture Image');
                return false;
            };
          var path = $("#image_path_new").val();
           var curpath = path.replace(/^.*[\\\/]/, '');
           var personQuery = '';
           var empType='Local';
           curpath=curpath.split('.');
           var empId=$("#IID").text();
           var cnt = '';
          //console.log(empId)
         var qry='SELECT * FROM Imagetbl WHERE EmpID="'+empId+'" AND weight='+tempwegiht;    
         var reqs= $cordovaSQLite.execute($rootScope.db, qry, []).then(function(res) {
        	  cnt = res.rows.length;
        	  if ($rootScope.btStatus == 'connected') { //Uncomment this lines to test blue-tooth
                  if(cnt == 0){
                   personQuery = "INSERT INTO Imagetbl(EmpID,imagePath,weight,entry_date,CreatedOn) VALUES('" + empId + "','" +path + "','"+tempwegiht+"','"+tempdate+"',CURRENT_TIMESTAMP)";
                   $cordovaSQLite.execute($rootScope.db, personQuery, []).then(function(res) {
                          if ($rootScope.btStatus == 'connected') {
                        	  $('#capture_image').attr('src', 'images/human_icon.png');	
                         	  $("#IID").text("");
                              $rootScope.sendImgCodeToBTCtrl();
                              //$rootScope.getempCodeFromBtCtrl();
                          } else {
                              console.log("Please Connect to EasyWeigh Device");
                          };
                    }, function(err) {
                        console.error("EMPLOYEE EROR: " + JSON.stringify(err));
                    });
                  } else {
                	    console.log("Data Already Exists");
                	    $('#capture_image').attr('src', 'images/human_icon.png');	
                   	    $("#IID").text("");
                	    $rootScope.sendImgCodeToBTCtrl();
                	
                  };
                  }else{
                	  console.log("Please Connect to EasyWeigh Device");
                	  return false;
                  };
          },function(err) {
        	  
              console.error("EMPLOYEE EROR: " + JSON.stringify(err));
          });
          
    }
}
]);

//image gallery controls
app.controller('ImageGalleryCtrl', ['$scope', '$location', '$rootScope', '$cordovaSQLite', '$route',
                               function($scope, $location, $rootScope, $cordovaSQLite,$route) {
                                   $scope.ImageGallery = new Array();
                                   var numofrows='';
                                   var query = 'SELECT * FROM Imagetbl';
                                   $cordovaSQLite.execute($rootScope.db, query, []).then(function(res) {
                                	   numofrows=res.rows.length;
                                       for (var i = 0; i < res.rows.length; i++) {
                                           $scope.ImageGallery.push(res.rows.item(i));
                                           
                                       };
                                       console.log("Gallery Employee: " + JSON.stringify(res.rows));
                                   }, function(err) {
                                       console.error("Gallery Employee error: " + JSON.stringify(err));
                                   });
                                   $scope.imageClick = function(obj){
                                	  var relativeFilePath=obj.target.attributes.src.value;
                                	  var imgpath=obj.target.attributes.id.value;
                                	  var targetpath='/FaceReco/'+imgpath+'.jpg';
                                	  navigator.notification.confirm('Do you want to delete the image?',onConfirm,'Delete Image', ['Ok','Cancel']);
                                	   function onConfirm(buttonIndex) {
                                		   if(buttonIndex==1){
                                			   window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
                                				    fileSystem.root.getFile(targetpath, {create:false}, function(fileEntry){
                                				        fileEntry.remove(function(file){
                                				            console.log("File removed!");
                                				            var delqury="DELETE FROM Imagetbl WHERE EmpID='"+imgpath+"'";
                                				            $cordovaSQLite.execute($rootScope.db, delqury, []).then(function(res) {
                                                                console.log("Success : " + JSON.stringify(res.rows));
                                                                $route.reload(); 
                                                            }, function(err) {  
                                                                console.error("Gallery Employee error: " + JSON.stringify(err));
                                                            });
                                				        },function(){
                                				            console.log("error deleting the file " + error.code);
                                				            });
                                				        },function(){
                                				            console.log("file does not exist");
                                				        });
                                				    },function(evt){
                                				        console.log(evt.target.error.code);
                                				});   
                                		   }else {console.log('You selected button Cancel');}
                                		}
                                    }
                                   $scope.dataFlush = function(){                               	   
                                	   if(numofrows>0){
                                	   navigator.notification.confirm('Do you want to delete all the images?',onConfirm,'Delete Images', ['Ok','Cancel']);
                                	   function onConfirm(buttonIndex) {
                                	   if(buttonIndex==1){
                                	   $cordovaSQLite.execute($rootScope.db, query, []).then(function(res) {
                                		   var j=0;
                                		   for (var i = 0; i < res.rows.length; i++) {
                                               var imgpath=res.rows.item(i).EmpID;
                                               var targetpath='/FaceReco/'+imgpath+'.jpg';
                                               var c=deleteImage(targetpath,imgpath,$cordovaSQLite,$rootScope);
                                             j=j+parseInt(c);  
                                           }
                                		   if(j==(res.rows.length)){
                                          	 $route.reload();
                                           }
                                           console.log("Gallery Employee: " + JSON.stringify(res.rows));
                                       }, function(err) {
                                           console.error("Gallery Employee error: " + JSON.stringify(err));
                                       });   
                                   } 
                                	   }
                                   }else{
                                	   console.log("There is no data ");
                                   }
                                   } 
                                   
                               }
                           ]);

//images flush
function deleteImage(targetpath,imgpath,$cordovaSQLite,$rootScope){
	var delqury="DELETE FROM Imagetbl WHERE EmpID='"+imgpath+"'";
    $cordovaSQLite.execute($rootScope.db, delqury, []).then(function(res1) {
                 console.log("Success : " + JSON.stringify(res1.rows));
             }, function(err) {
                 console.error("Gallery Employee error: " + JSON.stringify(err));
             });
	 window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
		    fileSystem.root.getFile(targetpath, {create:false}, function(fileEntry){
		        fileEntry.remove(function(file){  
		        },function(){
		            console.log("error deleting the file " + error.code);
		            });
		        },function(){
		            console.log("file does not exist");
		        });
		    },function(evt){
		        console.log(evt.target.error.code);
		}); 
	 return 1;
}
