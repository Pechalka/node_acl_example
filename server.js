var express = require('express')
  , app = express();

var acl = require('acl');

//acl config
console.debug = console.log;
acl = new acl(new acl.memoryBackend(), console);
//acl.allow("guest", "/page1", "get", function(){});

acl.addUserRoles('test', 'admin', function(){
	acl.allow("admin", "/page1", "get", function(){});
});

//end acl

//acl.allow("admin", "/favicon.ico", "get", function(){});

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser()); 
app.use(express.static(__dirname ));

app.use(express.session({ secret: 'zzzzzzz'} ));



//acl.middleware()
// app.use(function(req, res, next){
//    var transaction = acl.backend.begin();

//    acl.backend.add(transaction, 'users', "guest", ["guest"]);
    
//    req.session.userId = 'test';
// 	acl.backend.add(transaction, 'users', req.session.userId, ["admin"]);

//    acl.backend.end(transaction, function(){});
// 	next();
// });

app.use(acl.middleware(1, 'test'));
app.use(app.router);





app.use(function(err, req, res, next) {
        if(err && err.errorCode)
            res.send(err.errorCode, err.msg);
        else
        	next();
    });


app.get('/page1', //acl.middleware(),  
     function(req, res){
		console.log('page1');
		res.json('page1');
});

app.get('/page2', function(req, res){
	res.json('page2');
});


app.get('/page3', function(req, res){
	res.json('page3');
});

app.get('/getRoutes', function(req, res){
	res.json(app.routes);
});

app.listen(8080, function(){
  console.log("Express server listening on port %d", '8080');
});