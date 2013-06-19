var express = require('express')
  , app = express()
  , acl = require('./ACLService'); 

acl.init(
	'test', //admin user 
	['test', 'user1', 'user2'], //all users 
	function(){
		console.log('ACL', 'init', 'success');
});


app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser()); 
app.use(express.static(__dirname ));

app.use(express.session({ secret: 'zzzzzzz'} ));

app.use(acl.middleware());
app.use(app.router);


app.use(function(err, req, res, next) {
        if(err && err.errorCode)
            res.send(err.errorCode, err.msg);
        else
        	next();
    });


app.get('/page1', function(req, res){
	res.json('page1');
});

app.get('/page2', function(req, res){
	res.json('page2');
});


app.get('/page3', function(req, res){
	res.json('page3');
});





app.post('/aplly_user', function(req, res){
	acl.apllyUser(req.body.users, req.body.role, function(e, role){
		res.json(role);
	});
});

// -- RESP -----------------
app.get('/roles', function(req, res){
	acl.allRoles(function(e, docs){
		var data = {
			roles : docs,
			all_rotes : app.routes
		};
		res.json(data);	
	});
});

app.delete('/roles', function(req, res){
	acl.deleteRole(req.body.name, function(){
		res.json(req.body.name)
	});
});

app.put('/roles', function(req, res){
	acl.createRole(req.body.name, req.body.resources, function(e, role){
		res.json(role);
	});
});

app.post('/roles', function(req, res){
	acl.createRole(req.body.name, req.body.resources, function(e, role){
		res.json(role);
	});
});
// -----------------------------------------------

app.get('/login/:name', function(req, res){
	var user_name = req.params['name'];

	if (user_name == 'none')
		acl.changeUser(null); //log out
	else
		acl.changeUser(user_name);	

	res.redirect('/index.html');
})


app.listen(3000, function(){
  console.log("Express server listening on port %d", '3000');
});