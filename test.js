	
	require( "./" )( "iridium test", 1 );



	var Socket = iridium.module( "net" ).Socket
		, log = iridium( "log" )
		, HostService = iridium.service( "host" )
		, net = iridium.module( "net" );



	// start the hostservice which provides the network with infrastructure info
	new HostService();



	new net.RepSocket();


	new ( iridium.module( "db" ).MongoDB )();
/*
	var rep = new Socket( {
		type: "rep"
		, uri: "tcp://*:4567"
		, on: {
			message: function( message ){
				log.dir( message );
				rep.send( { koni: "istlustig" } );
			}.bind( this ) 
		}
	} );

	var rep = new Socket( {
		type: "rep"
		, uri: "tcp://*"
		, on: {
			message: function( message ){
				log.dir( message );
				rep.send( { koni: "istlustig" } );
			}.bind( this ) 
		}
	} );


	var req = new Socket( {
		type: "req"
		, uri: "tcp://localhost:4567"
		, on: {
			message: function( message ){
				log.dir( message );
			}.bind( this ) 
		}
	} );

	req.send( require( "os" ).networkInterfaces()  );

*/


	//log.dir( );

	//new ( iridium.service( "directory" ) )();


	/*
	// iridium net implementation
	var net = iridium.module( "net" )
		log = iridium( "log" );

	// iridium server
	var server = net.createServer();

	// iridium connection
	var connection = net.createConnection( "joinbox.com", 80 );
	var connection2 = net.createConnection( "sbb.ch", 80 );
	var connection3 = net.createConnection( "saddöfgkhjsdaf sdfhl lkj .ch", 80 );


	connection3.on( "error", function( err ){
		log.error( "conenction failed: " + err.message );
	}.bind( this ) );
	connection3.on( "close", function(){
		log.warn( "socket was closed [" + connection3.id() + "] ...." );
	}.bind( this ) );


	connection.on( "close", function(){
		log.warn( "socket was closed [" + connection.id() + "] ...." );
	}.bind( this ) );

	connection.on( "connect", function(){
		log.info( "connected to [" + connection.id() + "] ..." );
	}.bind( this ) );

	connection2.on( "close", function(){
		log.warn( "socket was closed [" + connection2.id() + "] ...." );
	}.bind( this ) );

	connection2.on( "connect", function(){
		log.info( "connected to [" + connection2.id() + "] ..." );
	}.bind( this ) );
	*/