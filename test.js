
	var iridium = require( "./main" )( "iridium test", 1 );
	var log = require(  iridium.core + "log" );


	log.dir( {
		my: {
			name: "is mike"
			, an: [
				{
					type: true
				}
				, 433
				, ""
				, "eesdffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe"
				, null
				, undefined
				, new Buffer( "dssdfsda fdsafsdaf sdagköl dfjpglkera fdsafsdaf sdagköl dfjpglkera fdsafsdaf sdagköl dfjpglkera fdsafsdaf sdagköl dfjpglkera fdsafsdaf sdagköl dfjpglkerasufs" )
			]
		}
	} );
log.dir( {});