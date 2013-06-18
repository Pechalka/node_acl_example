var express = require('express')
  , app = express();

var acl = require('acl');
var async = require('async');

var db = require('./models/db');

//acl config
console.debug = console.log;

//acl = new acl(new acl.mongodbBackend(), console);

acl = new acl(new acl.memoryBackend(), console);

//acl.allow("guest", "/page1", "get", function(){});

//acl service
var createRole = function(name, resources, callback){
	db.Role.findOne({ name : name }, function(e, doc){
		if (!doc) {
			var canDelete = name != 'anonymous' &&
							name != 'athorized' &&
							name != 'admin';
			var canEdit = name != 'anonymous' &&
					      name != 'athorized';

			doc = new db.Role({
				name : name, 
				resources : resources,
				canDelete : canDelete,
				canEdit	  : canEdit  
			});
		}
		var oldResurce = doc.resources || [];

		doc.resources = resources;
		doc.save(function(){
		 	acl.allow(name , oldResurce, '*', function(e){ //fix sync
			 	acl.removeAllow(name, oldResurce, '*', function(){
						acl.allow(name , resources, '*', function(e){
							callback(e, doc);
						});
		 		});
	 		});
		});
	});
}

var apllyUser = function(users, role, callback){
	var removeRole = function(user, callback){
		acl.removeUserRoles(user, role, callback);
	}
	var addRole = function(user, callback){
		acl.addUserRoles(user, role, callback);async
	}

	db.Role.findOne({ name : role }, function(e, doc){
		var oldUsers = doc.users;
		doc.users = users; 
		doc.save(function(){
			async.each(oldUsers, removeRole, function(){
				async.each(users, addRole, function(){
					callback(null, doc);
				});
			});
		});
	});
	
}

var deleteRole = function(roleName, callback){
	db.Role.findOne({ name : roleName }, function(e, role){
		role.remove(callback);
	});
}

var registUser = function(user, callback){
	acl.addUserRoles(user, 'athorized', callback); //все юзеры как только залогинятся становятся athorized
}

db.connect('mongodb://localhost:27017/acl');



// 				acl.removeAllow('admin', [ 
// 	"/favicon.ico",
// 	"/roles",
// 	"/create_role",
// 	"/update_role",
// 	"/delete_role",
// 	"/aplly_user",
// 	"/login"
// ], '*', function(){
createRole('admin', [ //дефолтовая роль все акшены упровляющии acl
	"/favicon.ico",
	"/roles",
	"/create_role",
	"/update_role",
	"/delete_role",
	"/aplly_user",
	"/login"
], function(){
	createRole('anonymous', [ //не авторазированные могут тока логинется
		"/login"
	], function(){
		createRole('athorized', [//авторизированые могут логинется и видить страницу 1
			"/login",
			"/page1"
		], function(){

			//создали 4 пользоватся
			//registUser('anonymous', function(){});
			registUser('test', function(){});
			registUser('user1', function(){});
			registUser('user2', function(){});

			apllyUser(['test'], 'admin', function(){
				apllyUser(['anonymous'], 'anonymous', function(){
				
				});				
			});	

		});

	});
});

// });






//end acl

//acl.allow("admin", "/favicon.ico", "get", function(){});

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser()); 
app.use(express.static(__dirname ));

app.use(express.session({ secret: 'zzzzzzz'} ));




app.use(acl.middleware(1, function(req, res){
	console.log();
	console.log(currentUser);
	console.log();
	
	return currentUser || 'anonymous';
}));
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


app.post('/aplly_user', function(req, res){
	apllyUser(req.body.users, req.body.role, function(e, role){
		res.json(role);
	});
});

app.post('/delete_role', function(req, res){
	deleteRole(req.body.name, function(){
		res.json(req.body.name)
	});
});

app.post('/update_role', function(req, res){
	createRole(req.body.name, req.body.resources, function(e, role){
		res.json(role);
	});
});

app.post('/create_role', function(req, res){
	createRole(req.body.name, req.body.resources, function(e, role){
		res.json(role);
	});
});


app.get('/login/:name', function(req, res){
	var user_name = req.params['name'];

	
	currentUser = user_name ;
	if (user_name == 'none')
		currentUser = null;

	console.log('>>> ' + currentUser);

	res.redirect('/index.html');
})

var currentUser = 'test';

app.listen(3000, function(){
  console.log("Express server listening on port %d", '3000');
});