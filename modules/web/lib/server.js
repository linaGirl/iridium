


	// iridium modules
	var   Class 			= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, argv 				= iridium( "util" ).argv
		, debug 			= argv.has( "trace-all" ) || argv.has( "trace-webservice" )
		, userDebug 		= argv.has( "debug" );


	// node classes
	var   http 				= require( "http" );


	// server components
	var   Request 			= require( "./request" )
	 	, Response 			= require( "./response" )
	 	, Cookie 			= require( "./cookie" );




	

	module.exports = new Class( {
		inherits: Events


		, init: function( options ){

			// the port to listen on
			this.__port = argv.get( "port" ) || options.port || 80;

			// the interface to listen on
			this.__address = options.address || "0.0.0.0";

			// rewrite engine
			this.rewriteEngine = options.rewriteEngine;

			// sesison manager
			this.sessions = options.sessions;

			// resources
			this.resources = options.resources;

			// controllers
			this.controllers = options.controllers;

			// wait until this class was returned ( events emit immediately )
			process.nextTick( function(){ this.emit( "load" ); }.bind( this ) );
		}



		// handlestandard http requests
		, __handleRequest: function( req, res ){
			var request 		= new Request( { request: req, resources: this.resources, on: { cookie: function( cookie ){ response.setCookie( cookie ); } } } )
				, response 		= new Response( { response: res, request: request } )
				, fakeSession 	= !req.headers[ "user-agent" ] || /bot|googlebot|crawler|spider|robot|crawling/.test( ( req.headers[ "user-agent" ] || "" ) );


			// lb health check
			if ( req.url === "/ping" ){
				response.send( 200, null, "healthy!" );
				if ( debug ) log.debug( "LB ping ...", this );
			} 
			else {
				if ( debug ) x = Date.now(), log.debug( "rewriting url...", this );

				// get the command from the rewrite engine
				this.rewriteEngine.rewrite( request, response, function( err, command ){
					var controller;

					if ( debug ){
						log.debug( "rewrite completed after [" + ( Date.now() - x ) + "] ms ...", this );
						log.debug( "command -->", this );
						log.dir( command );
						log.debug( "<-- command", this );
					} 
					


					if ( !response.isSent ){
						if ( err ){
							response.sendError( 500, "rewrite_error" );
						}
						else if ( command ){
							if ( this.controllers.has( command.controller ) ){
								controller = this.controllers.get( command.controller );
								if ( controller.hasAction( command.action ) ){

									// check if we need to get a session
									if ( controller.requiresSession( command.action ) ){

										// get session
										var cookie = request.getCookie( "sid" );
										this.sessions.get( cookie, function( err, existingSession ){
											if ( err ) response.sendError( 500, "session error: " + err.message );
											else {

												var complete = function( session ){
													if ( cookie !== session.sessionId ) response.setCookie( new Cookie( { name: "sid", value: session.sessionId, path: "/", httponly: true, maxage: 315360000 } ) );

													command.data.authenticated = session.authenticated;
													command.data.lang = request.language;
													command.data[ "lang" + request.language[ 0 ].toUpperCase() + request.language[ 1 ].toLowerCase() ] = true;
													
													controller[ command.action ]( request, response, command, session );
												}.bind( this );


												var resume = function( session ){
													// stats
													session.ip = req.connection.remoteAddress;
													session.useragent = req.headers[ "user-agent" ];


													// fake auth
													if ( request.query.hasOwnProperty( "authenticated" ) ){
														var status = request.query.authenticated === "true";
														if ( status !== session.authenticated ){
															if ( !session.hasUser( 0 ) ){
																session.addUser( 0, function( err, sessionUser ){
																	if ( !err && sessionUser ) {
																		sessionUser.set( { authenticated: status, active: true }, function(){
																			complete( session );
																		}.bind( this )  );
																	}
																	else complete( session );
																}.bind( this ) );
															}
															else {
																session.getUser( 0 ).setAuthenticated( status, function(){
																	complete( session );
																}.bind( this ) );
															}
														} else complete( session );
													} else complete( session );
												}.bind( this );


												if ( existingSession ) resume( existingSession );
												else {
													this.sessions.create( function( err, newSession ){
														if ( err ) response.sendError( 500, "session error: " + err.message );
														else resume( newSession );
													}.bind( this ), fakeSession );
												}												
											}
										}.bind( this ), fakeSession );
									} else controller[ command.action ]( request, response, command );									
								} else response.sendError( 404, "invalid_action" );
							} else response.sendError( 404, "invalid_controller" );
						} else response.sendError( 404, "no_route" );
					}
				}.bind( this ) );
			}
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