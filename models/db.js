var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var accountSchema = new Schema({
	name:{ type:String, required:true, unique:true, index:true},
	resources : [String]
});

accountSchema.index({ "name" : 1}, { unique: true });

module.exports.Role = mongoose.model('role', accountSchema);

var connection = null;
module.exports.connect = function(options){
	if(mongoose.connection.readyState == 0 && connection == null){
	    connection = mongoose.connect(options, function(err) {
	        if (err) {
	            console.log('error', 'Database connection.\n %s', err.stack);
	        }
	    })

	    mongoose.connection.on('error', function(err) {
	        if(err) {
	        	connection = null;
	            console.log('error', 'Database connection error:\n ', err.stack);
	        }
	    });

	    mongoose.connection.on('open', function (ref) {
	        console.log('info', 'Connected to mongo server.');
		});
	}

	return connection;
}