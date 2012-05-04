
	
	require( "./" )( "iridium directoy service", 1 );

	var argv = new( iridium( "argv" ) )();

	new ( iridium.service( "directory" ) )( {
		port: argv.has( "port" ) ? argv.get( "port" ) : 3333 
		, bind: argv.has( "bind" ) ? argv.get( "bind" ) : 3333 
	} );



	