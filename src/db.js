var mysql = require('mysql');
var conConfig = {
    host: "us-cdbr-iron-east-05.cleardb.net",
    user: "b7ec18c0a1822d",
    password: "563e2eef",
    database: "heroku_fb376f5e5f38945"
  };

var con = mysql.createConnection(conConfig);


function handleDisconnect(client) {
    client.on('error', function (error) {
        if (!error.fatal) return;
        if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw error;
    
        console.error('> Re-connecting lost MySQL connection: ' + error.stack);

        con = mysql.createConnection(client.config);
        handleDisconnect(con);
        con.connect();
      });
}
handleDisconnect(con);


var getConnection = function() {
    return new Promise((resolve,reject) =>{
        if(con.state != 'authenticated'){
            con.connect(function(err) {
                if (err) reject(err);
                resolve(true);
            });
        }
        else{
            resolve(true);
        }
    });
};

var setupDB = function (req, res){
    getConnection().then((conRes) => {
        
        console.log("Connected!");

        var sql = "CREATE TABLE person (P_id INT AUTO_INCREMENT PRIMARY KEY, power INT, f_id VARCHAR(255), universe VARCHAR(255))";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table created");
        });
        res.send("Setup Complete !");
        
      },
      (error) => {
        res.send("Unable to create connection to the Database.")
      });
}

var addPersontoDatabase = function (f_id, universe, power){
    return new  Promise((resolve,reject) =>{
        getConnection().then((conRes) => {
            var query = "INSERT INTO person (power, f_id, universe ) VALUES ('" + power +"','" + f_id + "','" + universe +"')";
            con.query(query , function (err, result) {
                if (err) throw err;
                resolve(true);
                
            });
        },
        (error) => {
            resolve(false);
        }); 
    });
   
}

var addPerson = function(req, res){
    var power = req.query.power;
    var f_id = req.query.f_id;
    var universe = req.query.universe;

    addPersontoDatabase(f_id, universe, power).then((resp)=>{
        if(resp == true){
            console.log("Successfully added to the universe.");
            res.send("Successfully added to the universe.");
        }
        else {
            console.log("Successfully added to the universe.");
            res.send("Successfully added to the universe.");
        }
    });
};

var getPersonList = function(req, res){
    var universe = req.query.universe;

    getConnection().then((conRes) => {

        var query = "Select * from person where universe='"+ universe + "'";
        con.query(query , function (err, result) {
            if (err) throw err;
            res.send(result);
            
        });
    },
    (error) => {
        res.send("Unable to create connection to the Database.")
    }); 
};

var getFamilyList = function(req, res){
    var universe = req.query.universe;

    getConnection().then((conRes) => {

        var query = "Select distinct f_id from person where universe='"+ universe + "'";
        con.query(query , function (err, result) {
            if (err) throw err;
            res.send(result);
            
        });
    },
    (error) => {
        res.send("Unable to create connection to the Database.")
    }); 
};


var checkIfUniverseBalanced = function(req, res){

    var familyList= null, universeList = null;
    getConnection().then((conRes) => {
        
        var fQuery = "Select distinct f_id from person";
        con.query(fQuery , function (err, result) {
            if (err) throw err;
            familyList = result;

            var uQuery = "Select distinct universe from person";
            con.query(uQuery , function (err, result) {
                if (err) throw err;
                universeList = result;
                iterate(res, familyList, universeList).then((resp)=>{
                    Promise.all(resp).then((values) =>{
                        var ifAllSame = !!values.reduce(function(a, b){ return (a === b) ? a : NaN; });
                        if(ifAllSame == false){
                            res.send("Universe is not balanced");
                        }
                        else{
                            res.send("Universe is balanced");
                        }
                        
                    });
                });
            });
        });
    },
    (error) => {
        res.send("Unable to create connection to the Database.")
    }); 
};

var iterate = function(res, familyList, universeList){
    return new Promise((resolveMain, rejectMain) =>{
        var familyPromiseList = [];
        for(var family in familyList){
            var promise = new Promise((resolve, reject) =>{
                var powerList=[];
                getPowerListFromAllUniverse(familyList[family].f_id, universeList).then((resp) =>{
                    Promise.all(resp.promiseList).then((value) => {
                        powerList = value;

                        var ifAllSame = !!powerList.reduce(function(a, b){ return (a === b) ? a : NaN; });
                        if(ifAllSame == false){
                            resolve(false);
                        }
                        else{
                            resolve(true);
                        }
                    });
                });
            });

            familyPromiseList.push(promise);
            if(family == familyList.length - 1)
            resolveMain(familyPromiseList);
        }
    });
}

var getPowerListFromAllUniverse = function(f_id, universelist){

    return new Promise((resolveMain, rejectMain) => {
        var universePromiseList = [];
        var powerList = []
        for(var universe in universelist) {
            var promise = new Promise((resolve, reject) =>{
                query = "select sum(power) from person where universe='"+ universelist[universe].universe + "' AND f_id='"+ f_id + "'";
                con.query(query , function (err, result) {
                    if (err) throw err;
                    resolve(result[0]["sum(power)"]);
                });
            });
            universePromiseList.push(promise);
            if(universe == universelist.length -1) 
                resolveMain({
                    promiseList : universePromiseList,
                    f_id : f_id
                });
        }
    });
}



var BalanceUniverse = function (req, res){
    var familyList= null, universeList = null;
    getConnection().then((conRes) => {       
        var fQuery = "Select distinct f_id from person";
        con.query(fQuery , function (err, result) {
            if (err) throw err;
            familyList = result;

            var uQuery = "Select distinct universe from person";
            con.query(uQuery , function (err, result) {
                if (err) throw err;
                universeList = result;
                iterateAndBalance(res, familyList, universeList).then((resp)=>{
                    Promise.all(resp).then((values) =>{
                        var ifAllSame = !!values.reduce(function(a, b){ return (a === b) ? a : NaN; });
                        if(ifAllSame == false){
                            res.send("Universe is not balanced");
                        }
                        else{
                            res.send("Universe is now balanced");
                        }
                        
                    });
                });
            });
        });
    },
    (error) => {
        res.send("Unable to create connection to the Database.")
    }); 
}

var iterateAndBalance = function(res, familyList, universeList){
    return new Promise((resolveMain, rejectMain) =>{
        var familyPromiseList = [];
        for(var family in familyList){
            var promise = new Promise((resolve, reject) =>{
                var powerList=[];
                getPowerListFromAllUniverse(familyList[family].f_id, universeList).then((resp) =>{
                    Promise.all(resp.promiseList).then((value) => {
                        powerList = value;

                        var ifAllSame = !!powerList.reduce(function(a, b){ return (a === b) ? a : NaN; });
                        if(ifAllSame == false){
                            var maxPower = powerList.reduce(function(a, b) {
                                return Math.max(a, b);
                            });
                            balanceEveryUniverse(resp.f_id, universeList, maxPower).then((queryResp) => {
                                Promise.all(queryResp).then((queryRespList)=>{
                                    var ifAlltrue = queryRespList.every(x => x == true);
                                    if(ifAlltrue === true ){
                                        resolve(true);
                                    }
                                    else{
                                        resolve(false);
                                    }
                                });
                            });
                        }
                        else{
                            resolve(true);
                        }
                    });
                });
            });

            familyPromiseList.push(promise);
            if(family == familyList.length - 1)
            resolveMain(familyPromiseList);
        }
    });
};
var balanceEveryUniverse = function(f_id, universelist, maxPower){
    return new Promise((resolveMain, rejectMain) => {
        var universePromiseList = [];
        var powerList = []
        for(var universe in universelist) {
            var promise = new Promise((resolve, reject) =>{
                query = "select sum(power) from person where universe='"+ universelist[universe].universe + "' AND f_id='"+ f_id + "'";
                con.query(query , function (err, result) {
                    if (err) throw err;
                    var powerDiff = maxPower - result[0]["sum(power)"];
                    if( powerDiff > 0){
                        addPersontoDatabase(f_id, universelist[universe].universe, powerDiff).then((resp)=>{
                            resolve(resp);
                        }); 
                    }
                    else{
                        resolve(true);
                    }
                });
            });
            universePromiseList.push(promise);
            if(universe == universelist.length -1) 
                resolveMain(universePromiseList);
        }
    });

};


module.exports = {
                setupDB : setupDB,
                addPerson : addPerson,
                getPersonList : getPersonList,
                getFamilyList : getFamilyList,
                checkIfUniverseBalanced : checkIfUniverseBalanced,
                BalanceUniverse : BalanceUniverse
               };
