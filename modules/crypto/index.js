	

	var crypto = require( "crypto" );
	

	module.exports = {
		  pki: 			require( "./lib/pki" )
		, RandomData: 	require( "./lib/randomdata" )


		, sha512: function( input ){
			return crypto.createHash( "sha512" ).update( input ).digest( "hex" );
		}

		, md5: function( input ){
			return crypto.createHash( "md5" ).update( input ).digest( "hex" );
		}
	}