
	require( "./" )( "iridium test", 1 );


	var net = iridium( "net" );


	

	var connectionPool = net.createConnectionPool();
	var server = net.createServer();


	connectionPool.getConnection( "10.0.0.1", 80 );

	