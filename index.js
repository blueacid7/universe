var express = require('express');
var app = express();
var db = require('./src/db.js');
var portNo = process.env.PORT || 8051;
app.get('/', function (req, res) {
   res.send('Hello Universe');
})

var server = app.listen(portNo, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port);
});

app.get('/setupDatabase', db.setupDB);
app.get('/addPerson', db.addPerson);
app.get('/getPersonList', db.getPersonList);
app.get('/getFamilyList', db.getFamilyList);
app.get('/checkIfUniverseBalanced', db.checkIfUniverseBalanced);
app.get('/BalanceUniverse', db.BalanceUniverse);


