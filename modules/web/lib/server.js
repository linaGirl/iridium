


	// iridium modules
	var   Class 			= iridium( "class" )
		, log 				= iridium( "log" )
		, verbose 			= iridium( "util" ).argv.has( "verbose" );


	// node classes
	var   http 				= require( "http" )
		, urlParser 		= require( "url" );


	// server components
	var   Request 			= require( "./request" )
		, RewriteEngine 	= require( "./rewriteengine" );





	module.exports = new Class( {
		$id: "iridium.webserver"
		, inherits: RewriteEngine


		, init: function( options ){

			// the port to listen on
			this.__port = options.port || 80;

			// the interface to listen on
			this.__address = options.address || "0.0.0.0";

			// rewrite engine
			this.__rewrite = new RewriteEngine();
		}



		// handlestandard http requests
		, __handleRequest: function( request, response ){
			var url 		= urlParser.parse( request.url, true )
				, headers 	= requet.headers || {}
				, command 	= this.__rewrite.rewrite( url, headers );


			this.emit( "request", new Response( {
				  request: request
				, respose: response 
			} ) );
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

			// listen
			this.__server.listen( port || this.__port );
		}
	} );