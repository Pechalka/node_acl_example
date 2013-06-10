var express = require('express')
  , app = express();

var acl = require('acl');

//acl config
console.debug = console.log;
acl = new acl(new acl.memoryBackend(), console);
//acl.allow("guest", "/page1", "get", function(){});

acl.addUserRoles('test', 'admin', function(){
	acl.allow("admin", "/page1", "get", function(){
		acl.allow("admin", "/favicon.ico", "get", function(){
			acl.allow("admin", "/roles", "get", function(){
				acl.allow("admin", "/set_roles", "*", function(){
				});
			});			
		});
	});
});

//end acl

//acl.allow("admin", "/favicon.ico", "get", function(){});

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser()); 
app.use(express.static(__dirname ));

app.use(express.session({ secret: 'zzzzzzz'} ));



//acl.addUserRoles('guies', 'guies', function(){});

// app.use(acl.middleware(1, function(req, res){
//     return req.session.userId || 'guies';
// }));

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


var roles = [
	{
		name : 'auth',
		permissions : []
	},
	{
		name : 'not auth',
		permissions : []
	}
];

app.get('/roles', function(req, res){
	
	var data = {
		roles : roles,
		all_rotes : app.routes
	};

	res.json(data);
});


app.post('/set_roles', function(req, res){
	roles = req.body.roles;
	res.json(req.body.roles);
});

app.listen(3000, function(){
  console.log("Express server listening on port %d", '3000');
});