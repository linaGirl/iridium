

	var request = require( "request" );


	module.exports = function( url, callback ){
		request( { 
			  url: 		url 
			, encoding: null
		}, function( err, response, body ){
			if ( err ) callback( err );
			else {
				callback( null, {
					  data: 	body 
					, headers: 	response.headers
					, status: 	response.statusCode
				} );
			}
		} );
	}