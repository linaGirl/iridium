


	module.exports = {
		mime: require( "./lib/mime" )
		, argv: require( "./lib/argv" )


		, sha512: function( input ){
			return require( "crypto" ).createHash( "sha512" ).update( input ).digest( "hex" );
		}
	};