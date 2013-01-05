



	var   Class 		= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-net" )
		, net 			= require( "net" )
		, Connection 	= require( "./connection" );



	// simple tcp server which tires to stay open

	module.exports = new Class( {
		inherits: Events


		// the server
		, __server: null
				
		// server status
		, listening: false

		// throttle reopne after every fail
		, __throttling: 0



		, init: function( options ){
			this.__port 		= options.port;
			this.__address 		= options.host;
		}



		, listen: function( port ){
			if ( port ) this.__port = port;

			this.__listen();
			return this;
		}


		, close: function(){
			htis.__server.close();
			return this;
		}


		, __onConnection: function( socket ){
			this.emit( "connection", new Connection( { socket: socket } ) );
		}

		, __onListening: function(){
			this.listening = true;
			this.__throttling = 0;
			this.emit( "listening" );
			if ( debug ) log.info( "net.Server listening on", this.__server.address().address, ":", this.__server.address().port , this );
		}

		, __onClose: function( err ){
			this.listening = false;
			this.emit( "close", err );

			if ( debug ) log.info( "net.Server on", this.__server.address().address, ":", this.__server.address().port, "closed" , this );

			// repoen on error
			if ( err ) setTimeout( this.__listen.bind( this ), this.__throttling );
		}

		, __onError: function( err ){
			this.listening = false;
			this.__throttling += 250;
			log.error( "net.Server on", this.__server.address().address, ":", this.__server.address().port, "failed" , this );
			log.trace( err );
			this.emit( "error", err );
		}

		, __listen: function(){
			this.__server = net.createServer();

			this.__server.on( "listening", 	this.__onListening.bind( this ) );
			this.__server.on( "close", 		this.__onClose.bind( this ) );
			this.__server.on( "error", 		this.__onError.bind( this ) );
			this.__server.on( "connection", this.__onConnection.bind( this ) );

			// listen
			this.__server.listen( this.__port );
		}
	} );