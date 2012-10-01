

	var http = require( "http" );


	module.exports = function( url, callback ){
		http.get( url, function( res ){
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
				callback( null, data );
			}.bind( this ) );
		}.bind( this ) );
	}