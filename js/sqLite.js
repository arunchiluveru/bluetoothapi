
function createDatabase($cordovaSQLite) {
    // for opening a background db:
    var db = $cordovaSQLite.openDB({
        name: "TeaGarden_Test.db",
        bgType: 1
    });
    
    
    
    var User = "CREATE TABLE IF NOT EXISTS User (userID INTEGER PRIMARY KEY AUTOINCREMENT, eName varchar(20), eCode varchar(10), subjectID varchar(20), role varchar(20),userName varchar(20), password varchar(10), status varchar(10), addedOn datetime);";
    var Imagetbl = "CREATE TABLE IF NOT EXISTS Imagetbl (EmpID varchar(100),EmployeeName varchar(150),Gender varchar(50), weight int(100),imagePath varchar(150), longitude varchar(20), latitude varchar(20),entry_date date, CreatedOn datetime);";
    $cordovaSQLite.execute(db, User, []).then(function(res) {
        console.log("Table User: " + JSON.stringify(res));
    }, function(err) {
        console.error("Table User err: " + JSON.stringify(err));
    });
    $cordovaSQLite.execute(db, Imagetbl, []).then(function(res) {
        console.log("Table Imagetbl: " + JSON.stringify(res));
    }, function(err) {
        console.error("Table Imagetbl err: " + JSON.stringify(err));
    });
    
    var defaultUserCheck = 'SELECT COUNT(*) as count FROM User';
    
    $cordovaSQLite.execute(db, defaultUserCheck, []).then(function(res) {
        console.log("Default User Check: " + JSON.stringify(res.rows));
        if (res.rows.item(0).count == 0) {
            var defaultUser = "INSERT INTO 'User'('eName', 'eCode', 'subjectID', 'role','userName', 'password', 'status', 'addedOn') VALUES ('Super Admin', 'P02015', '', 'superadmin','superadmin', '1234','active', CURRENT_TIMESTAMP)"
            $cordovaSQLite.execute(db, defaultUser, []).then(function(res) {
                console.log("Default User: " + JSON.stringify(res));
            }, function(err) {
                console.error("Default User err: " + JSON.stringify(err));
            });
        };
    }, function(err) {
        console.error("Table 5 err: " + JSON.stringify(err));
    });
    return db;
}