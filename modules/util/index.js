


	module.exports = {
		
		  mime: require( "./lib/mime" )

		, argv: require( "./lib/argv" )

		, airbrake: require( "./node_modules/airbrake" )

		, moment: require( "./lib/moment" )

		, sha512: function( input ){
			return require( "crypto" ).createHash( "sha512" ).update( input ).digest( "hex" );
		}

		, md5: function( input ){
			return require( "crypto" ).createHash( "md5" ).update( input ).digest( "hex" );
		}
	};