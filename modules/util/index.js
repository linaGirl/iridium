


	module.exports = {
		
		  mime: require( "./lib/mime" )

		, argv: require( "./lib/argv" )

		, airbrake: require( "./node_modules/airbrake" )


		, sha512: function( input ){
			return require( "crypto" ).createHash( "sha512" ).update( input ).digest( "hex" );
		}
	};