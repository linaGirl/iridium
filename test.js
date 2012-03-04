
	var iridium = require( "./main" )( "iridium test", 1 );
	var log = require(  iridium.core + "log" );

var t = {
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
	} ;

	log.dir( process, t, this, log );
	log.debug( "sdf", 2323, true, "gay", log );
	log.info( "sdf", 2323, true, "gay", log );
	log.warn( "sdf", 2323, true, "gay", log );
	log.error( "sdf", 2323, true, "gay", log );
	log.highlight( "sdf", 2323, true, "gay", log, t );
	