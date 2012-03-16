	
	require( "./" )( "iridium test", 1 );


	// iridium net implementation
	var net = iridium( "net" )
		log = iridium( "log" );

	// iridium server
	var server = net.createServer();

	// iridium connection
	var connection = net.createConnection( "joinbox.com", 80 );
	var connection2 = net.createConnection( "sbb.ch", 80 );
	var connection3 = net.createConnection( "saddöfgkhjsdaf sdfhl lkj .ch", 80 );


	connection3.on( "error", function( err ){
		log.error( "conenction failed: " + err.message );
	}.bind( this ) )

	connection.on( "close", function(){
		log.warn( "socket was closed ...." );
	}.bind( this ) )

	connection.on( "connect", function(){
		log.info( "connected to [" + connection.id() + "] ..." );
	}.bind( this ) );

	connection2.on( "close", function(){
		log.warn( "socket was closed ...." );
	}.bind( this ) )

	connection2.on( "connect", function(){
		log.info( "connected to [" + connection2.id() + "] ..." );
	}.bind( this ) );
	