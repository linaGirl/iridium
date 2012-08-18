


	// iridium modules
	var   Class 			= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, verbose 			= iridium( "util" ).argv.has( "verbose" );


	// node classes
	var   http 				= require( "http" );


	// server components
	var   Request 			= require( "./request" )
		, Response 			= require( "./response" );


	// depencies
	var   WebSocketServer	= require( "../dep/WebSocket-Node" ).server;





	module.exports = new Class( {
		$id: "iridium.webserver"
		, inherits: Events


		, init: function( options ){

			// the port to listen on
			this.__port = options.port || 80;

			// the interface to listen on
			this.__address = options.address || "0.0.0.0";

			// the endpoint to accept xhr requests on ( socket emulation )
			this.__endpoint = options.endpoint || "/_t/";

			// check websocket requestfor the origin
			this.__origin = options.origin || /.*/gi;
		}




		// handlestandard http requests
		, __handleRequest: function( request, response ){
			if ( request.url.indexOf( this.__endpoint ) === 0 ){
				this.__handleTransportRequest( request, response );
			}
			else this.emit( "request", new Request( { request: request, respose: response } ), new Response( { request: request, respose: response } ) );
		}



		// handle websocket requests
		, __handleWebsocketRequest: function( request ){

		}

		// handle transport request -> xhr 
		, __handleTransportRequest: function( request, response ){

		}




		// start the server
		, listen: function( port ){
			this.__listen( port );
			return this;
		}


		// shut down the server
		, close: function(){
			this.__server.close();
			return this;
		}



		// start a standard http server
		, __listen: function( port ){
			this.__server = http.createServer();

			// dont allow spamming with headers
			this.__server.maxHeadersCount = 50;

			// handle http server events
			this.__server.on( "request", this.__handleRequest.bind( this ) );

			// listen, close, error
			this.__server.on( "listening", function(){
				log.info( "http server is listening on port [" + this.__port + "] ...", this );
				this.emit( "listening" );
			}.bind( this ) );
			this.__server.on( "close", function(){
				log.info( "http server was closed ...", this );
				this.emit( "close" );
			}.bind( this ) );
			this.__server.on( "error", function( err ){
				log.info( "http server was closed due to an error: " + err, this );
				this.emit( "error", err );
			}.bind( this ) );



			// attach websocket server to the http server
			this.__socketServer = new WebSocketServer( {
				httpServer: this.__server
				, autoAcceptConnections: false
			} );

			// accept incoming websockets
			this.__socketServer.on( "request", this.__handleWebsocketRequest.bind( this ) );


			// listen
			this.__server.listen( port || this.__port );
		}
	} );