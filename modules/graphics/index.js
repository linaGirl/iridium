
	
	var Image = require( "./lib/image" );



	module.exports = {
		createImage: function( options ){
			return new Image( options );
		}
	};