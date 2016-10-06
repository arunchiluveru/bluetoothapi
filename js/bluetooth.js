// Innitial start up for Bluetooth device
function getBTReady($rootScope, $cordovaBluetoothSerial) {
    $rootScope.btNotification = '';
    var listPorts = function() {
        $cordovaBluetoothSerial.list().then(
            function(list) {
                $rootScope.isBTIcon = 'btn btn-warning btn-sm';
                $rootScope.btDevicesList = list;
            },
            function(error) {
                $rootScope.btNotification = JSON.stringify(error);
            });
    };
    var btStatus = $('#btStatus');
    var enableSuccess = function() {
        $rootScope.isBTIcon = 'btn btn-warning btn-sm';
        getBTReady($rootScope, $cordovaBluetoothSerial)
    };
    var enableFailure = function() {
        $rootScope.btStatus = 'disconnected';
        $rootScope.isBTIcon = 'btn btn-danger btn-sm';
    };
    var notEnabled = function() {
        $cordovaBluetoothSerial.enable().then(enableSuccess, enableFailure);
    };

    $cordovaBluetoothSerial.isEnabled().then(listPorts, notEnabled);
}

// Function to Connect BT to specified Mac
function connectBT($rootScope, $cordovaBluetoothSerial) {
    var connect = function() {
        $rootScope.isBTIdle = true;
        $rootScope.btNotification = "Trying to connect to: " + $rootScope.btDevice.name;
        $cordovaBluetoothSerial.connectInsecure($rootScope.btDevice.address).then(
            function() {
                $rootScope.isBTIcon = 'btn btn-success btn-sm';
                $rootScope.btStatus = 'connected';
                $rootScope.btConnectBtn = 'Disconnect from device';
                $rootScope.btNotification = "Connected to: " + $rootScope.btDevice.name;
                $rootScope.isBTIdle = false;
                // Subscribing for acknowledge
                $cordovaBluetoothSerial.subscribe(',#').then(function(data) {
                    console.log("Data Got: " + data);
                }, function(error) {
                    $rootScope.btNotification = JSON.stringify(error);
                });
            },
            function(error) {
                $rootScope.btConnectBtn = 'Connect to device';
                $rootScope.btStatus = 'disconnected';
                $rootScope.isBTIcon = 'btn btn-warning btn-sm';
                $rootScope.btNotification = JSON.stringify(error);
                $rootScope.isBTIdle = true;
            }
        );
    };
    var disconnect = function() {
        $rootScope.isBTIdle = true;
        $rootScope.btNotification = "Trying to disconnect from: " + $rootScope.btDevice.name;
        $cordovaBluetoothSerial.disconnect().then(
            function() {
                $rootScope.isBTIcon = 'btn btn-warning btn-sm';
                $rootScope.btStatus = 'disconnected';
                $rootScope.btConnectBtn = 'Connect to device';
                $rootScope.btNotification = "Disconnected from: " + $rootScope.btDevice.name;
                $cordovaBluetoothSerial.unsubscribe(function() {
                    // Doing Nothing
                }, function(error) {
                    $rootScope.btNotification = JSON.stringify(error);
                });
            },
            function(error) {
                $rootScope.btNotification = JSON.stringify(error);
            }
        );
    };
    $cordovaBluetoothSerial.isConnected().then(disconnect, connect);
}

function isBTConnected($rootScope, $cordovaBluetoothSerial) {
    $cordovaBluetoothSerial.isConnected().then(function() {
        $rootScope.$broadcast('btDisconnected', false);
    }, function() {
        $rootScope.$broadcast('btDisconnected', true);
    });
}