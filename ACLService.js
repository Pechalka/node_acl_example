
var async = require('async');

var db = require('./models/db');

var acl = require('acl');

console.debug = console.log;
acl = new acl(new acl.memoryBackend(), console);

//acl service
var createRole = exports.createRole = function(name, resources, callback){
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
                canEdit   : canEdit  
            });
        }
        var oldResurce = doc.resources || [];
        resources = resources || [];

        doc.resources = resources;
        doc.save(function(){
            var allowResurce = function(resource, callback){
                acl.allow(name , resource.path, resource.method, callback);                            
            }
            var removeAllow = function(resource, callback){
                acl.removeAllow(name , resource.path, resource.method, callback);                                        
            }

            async.each(oldResurce, allowResurce, function(e){ //fix sync
                async.each(oldResurce, removeAllow, function(){
                    async.each(resources, allowResurce, function(e){
                        callback(e, doc);
                    })
                })
            });
        });
    });
}

var apllyUser = exports.apllyUser = function(users, role, callback){
    var removeRole = function(user, callback){
        acl.removeUserRoles(user, role, callback);
    }
    var addRole = function(user, callback){
        acl.addUserRoles(user, role, callback);async
    }
    users = users || [];

    db.Role.findOne({ name : role }, function(e, doc){
        var oldUsers = doc.users || [];
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

var deleteRole = exports.deleteRole  = function(roleName, callback){
    db.Role.findOne({ name : roleName }, function(e, role){
        role.remove(callback);
    });
}

var registUser = exports.registUser = function(user, callback){
    acl.addUserRoles(user, 'athorized', callback); 
}

var allRoles = exports.allRoles = function(callback){
    db.Role.find({}, callback);
}

var currentUser = 'test';

var changeUser = exports.changeUser = function(userName){
    currentUser = userName;
}

var middleware = exports.middleware = function(){
    return acl.middleware(1, function(req, res){
        console.log();
        console.log(currentUser);
        console.log();
        
        return currentUser || 'anonymous';
    });
}

var createDefault = function(admin, allUsers, done){
    var defaultRoles = [
        {
            name : 'admin',
            users : [admin],
            resources : [
                { path : "/favicon.ico", method : 'get' },
                { path : "/roles", method : 'get'},
                { path : "/roles", method : 'post' },
                { path : "/roles", method : 'put'},
                { path : "/roles", method : 'delete'},
                { path : "/aplly_user"},
                { path : "/login"}
            ],
            canDelete : false,
            canEdit : true    
        },
        {
            name : 'anonymous',
            users : ['anonymous'],
            resources : [
                { path : "/login" }
            ],
            canDelete : false,
            canEdit : false    
        },
        {
            name : 'athorized',
            users : allUsers, //should be all users
            resources : [
                { path : "/page1" },
                { path : "/login" }
            ],
            canDelete : false,
            canEdit : true    
        },
    ];

    db.Role.create(defaultRoles, function(e){
        var docs = [];
        for (var i=1; i<arguments.length; ++i) {
            docs.push(arguments[i]);
        }
        done(e, docs);
    });
}

exports.init = function(admin, allUsers, done){
    db.connect('mongodb://localhost:27017/acl');//connect to db with roles
            
    var apllyUserFromRole = function(role, callback){
        apllyUser(role.users, role.name, callback);
    }
    var apllyPermissionFromRole = function(role, callback){
        createRole(role.name, role.resources, callback);
    }

    async.waterfall([
       function(callback){
            allRoles(callback);     
       }, 
       function(roles, callback){
            if (roles.length == 0){ //if no roles in db create defaul
                createDefault(admin, allUsers, callback);
            } else {
                callback(null, roles);
            }
       }, 
       function(roles, callback){
           async.each(roles, apllyUserFromRole, function(){
                callback(null, roles); 
           });                
       },
       function(roles, callback){ //apply permission
           async.each(roles, apllyPermissionFromRole, callback);
       }
    ], done);
}
