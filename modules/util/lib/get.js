

	var http = require( "http" )
		, https = require( "https" );


	module.exports = function( url, callback ){
		( url.indexOf( "https://" ) === -1 ? http : https ).get( url, function( res ){
			var data, tdata;

			res.on( "data", function( c ){ 
				if ( !data ) data = c;
				else {
					tdata = new Buffer( c.length + data.length );
					data.copy( tdata );
					c.copy( tdata, data.length )
					data = tdata;
				}
			} );

			res.on( "error", function( err ){
				callback( err );
			}.bind( this ) );

			res.on( "end", function(){
				callback( null, {
					  data: 	data 
					, headers: 	res.headers
					, status: 	res.statusCode
				} );
			}.bind( this ) );
		}.bind( this ) );
	}