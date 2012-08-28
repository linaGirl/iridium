	


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );


	var crypto 			= require( "crypto" )
		, tcp 			= require( "net" );


	var Connection 		= require ( "connection" );



	// a global available self reopening tcp sever. one instance per process. used
	// for the service infrastructure.

	// layered services
	// 0 - tcp
	// 1 - connection   -
	// 2 - endpoint		- in enpoint registry, this is alays a server which is reachable from anywhere
	// 3 - instance		- in application registry, maps to an endpoint, may change endpoint at anytime ( move to other ervers etc )
	// 4 - service 		- in service registry, maps to an instance


	// comm:
	// instance -> service: do x
	// service -> instance: done ... commit / rollback / dontknow ? ( dontknow may happen if an instance moved to another endpoint or the instance has crashed and lost its memory, the service will try again to return the result to the correct endpoint and rolling abck after timing out on the transaction )
	// instance -> service: commit / rollback / dontknow



	module.exports = new Class( {
		$id: "net.tcpserver"
		, inherits: Events

		, __address: null
		, __port: 0
		, __retries: 0

		, init: function( options ){

			// exactly one tcp server per process!
			if ( iridium.__.tcpserver ) return iridium.__.tcpserver;
			iridium.__.tcpserver = this;


			// ou may define a port / address
			if ( options.port ) this.__port = options.port;
			if ( options.address ) this.__address = options.address;


			// lsiten
			this.__listen();
		}
		


		, __handleConnection: function( connection ){
			this.emit( "connection", new Connection( { connection: connection } ) );
		}


		, __handleListening: function(){
			this.__retries = 0;
			this.__info = this.__server.address();
			log.info( "tcp server is lisening on [" + this.__info.address + ":" + this.__info.port + "] ...", this );
		}

		, __handleClose: function( err ){
			// closed due to an error? reopen
			if ( err ) {
				// reopen immediately if we didnt try before
				if ( this.__retries === 0 ){
					this.__listen();
				}
				else {
					// retry by the interval of n seconds
					setTimeout( this.__listen.bin( this ), 1000 ) ;
				}
				this.__retries++;
			}
		}

		, __handleError: function( err ){
			log.error( err, this );
		}

		, __listen: function(){
			this.__server = tcp.createServer();
			this.__server.on( "connection", this.__handleConnection.bind( this ) );
			this.__server.on( "error", this.__handleError.bind( this ) );
			this.__server.on( "close", this.__handleClose.bind( this ) );
			this.__server.on( "listening", this.__handleListening.bind( this ) );
			this.__server.listen( this.__port, this.__address );
		}
	} );