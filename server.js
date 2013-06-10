var express = require('express')
  , app = express();

var acl = require('acl');

var db = require('./models/db');

//acl config
console.debug = console.log;
acl = new acl(new acl.memoryBackend(), console);
//acl.allow("guest", "/page1", "get", function(){});

acl.addUserRoles('test', 'admin', function(){
	acl.allow("admin", "/favicon.ico", "get", function(){
		acl.allow("admin", "/roles", "*", function(){
			acl.allow("admin", "/create_role", "*", function(){
				acl.allow("admin", "/delete_role", "*", function(){
					acl.allow("admin", "/update_role", "*", function(){

					})
				});
			});			
		});
	});
});
db.connect('mongodb://localhost:27017/acl');


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


app.get('/page1',  
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



app.get('/roles', function(req, res){
	db.Role.find({}, function(e, docs){
		var data = {
			roles : docs,
			all_rotes : app.routes
		};
		res.json(data);	
	})
	
});


app.post('/delete_role', function(req, res){
	db.Role.findOne({ name : req.body.name }, function(e, role){
		role.remove();
		res.json(e)
	});
});

app.post('/update_role', function(req, res){
	console.log(req.body);

	var role = req.body.name;
	var resources = req.body.resources; 

	db.Role.findOne({ name : role }, function(e, doc){
		doc.resources = resources;
		doc.save(function(){
			acl.allow(role , resources, '*', function(){
				res.json(doc);
			})		
		});
	});
	
});

app.post('/create_role', function(req, res){
	var role = new db.Role(req.body);
	role.save(function(e, role){
		

		res.json(role);	
	});
});



app.listen(3000, function(){
  console.log("Express server listening on port %d", '3000');
});