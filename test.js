
	require( "./" )( "iridium test", 1 );

	// iridium net implementation
	var net = iridium( "net" );

	// iridium server
	var server = net.createServer();

	// iridium connection
	var connection = net.createConnection( "joinbox.com", 80 );
	var connection2 = net.createConnection( "sbb.ch", 80 );


	connection.on( "close", function(){
		log.warn( "socket was closed ...." );
		log.dir( connection);
	}.bind( this ) )

	connection.on( "connect", function(){
		log.dir( connection);
	}.bind( this ) );

	connection2.on( "close", function(){
		log.warn( "socket was closed ...." );
		log.dir( connection2);
	}.bind( this ) )

	connection2.on( "connect", function(){
		log.dir( connection2);
	}.bind( this ) );


	var a = new Array( 30 );
	a.push( "w")
	log.dir( a );
