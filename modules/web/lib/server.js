


	// iridium modules
	var   Class 			= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, argv 				= iridium( "util" ).argv
		, debug 			= argv.has( "trace-all" ) || argv.has( "trace-webservice" )
		, debugUrl 			= argv.has( "trace-all" ) || argv.has( "trace-urls" )
		, userDebug 		= argv.has( "debug" );


	// node classes
	var   http 				= require( "http" )
		, crypto 			= require( "crypto" );


	// server components
	var   Request 			= require( "./request" )
	 	, Response 			= require( "./response" )
	 	, RESTResponder 	= require( "./restresponder" )
	 	, Cookie 			= require( "./cookie" );




	

	module.exports = new Class( {
		inherits: Events


		, __basicAuth: false
		, __users: {}


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

			// default rest responder
			this.__defaultResponder = new RESTResponder( { rest: options.rest } );

			// rest controllers
			this.rest = options.rest;


			// basic auth required( dev environment )
			if ( iridium.app.config.basicAuth ){
				this.__basicAuth = true;
				var keys = Object.keys( iridium.app.config.basicAuth ), k = keys.length;
				while( k-- ) this.__users[ keys[ k ] ] = crypto.createHash( "sha512" ).update( iridium.app.config.basicAuth[ keys[ k ] ] ).digest( "hex" )
			}


			// wait until this class was returned ( events emit immediately )
			process.nextTick( function(){ this.emit( "load" ); }.bind( this ) );
		}




		, __checkPassword: function( authHeader ){
			var token = authHeader.split( /\s+/ ).pop() || ''
				, auth = new Buffer( token, "base64" ).toString()
				, parts = auth.split( /:/ );

			return parts && this.__users[ parts[ 0 ] ] && crypto.createHash( "sha512" ).update( parts[ 1 ] ).digest( "hex" ) === this.__users[ parts[ 0 ] ];
		}

		


		// handlestandard http requests
		, __handleRequest: function( req, res ){
			if ( debug || debugUrl ) log.info( "request on", req.url, this );

			if ( req.url === "/ping" ){
				res.writeHead( 200 );
				res.end( "healthy!" );
				if ( debug ) log.debug( "LB ping ...", this );
			} 
			else {
				// basic auth required and we're not on a subdomain or the password is corrrect ?
				if ( !this.__basicAuth || ( req.headers.authorization && this.__checkPassword( req.headers.authorization ) ) ){

					var request 		= new Request( { request: req, resources: this.resources, on: { cookie: function( cookie ){ response.setCookie( cookie ); } } } )
						, response 		= new Response( { response: res, request: request } )
						, fakeSession 	= !req.headers[ "user-agent" ] || /bot|googlebot|crawler|spider|robot|crawling/.test( ( req.headers[ "user-agent" ] || "" ) );

					// lb health check
					if ( req.url === "/ping" ){
						response.send( 200, null, "healthy!" );
						if ( debug ) log.debug( "LB ping ...", this );
					} 
					else { // http://b2b.apis.j.b/1/sessions/33
						// check for rest api call
						if ( request.hostname.indexOf( ".apis." ) > 0 ){
							var components = /^\/([0-9a-z\.-]*)\/?(.*)$/gi.exec( request.pathname );
							if ( debugUrl ) log.debug( "call on REST [" + request.pathname + "]", this );

							if ( !components[ 1 ] ) components[ 1 ] = "root";

							if ( !components ) this.__defaultResponder.respond( request, response, 400, { status: "bad request" } );
							else {
								var   resourceName	= ( components[ 1 ] || "" ).toLowerCase()
									, identifier 	= ( components[ 2 ] || "" ).toLowerCase()
									, verb 			= ( request.method.toLowerCase() === "head" ? "get" : request.method.toLowerCase() )
									, namespace		= ( ( /^([^\.]+)\.apis\./gi.exec( request.hostname ) || [ null, "" ] )[ 1 ] );

								if ( this.rest.hasNamespace( namespace ) ){
									if ( this.rest.has( namespace, resourceName ) ){
										var resourceController = this.rest.get( namespace, resourceName );

										// call on collection or on the resource?
										if ( identifier && identifier.length > 0 ){
											if ( resourceController.hasResource() ){
												var resource = resourceController.getResource();
												
												if ( resource.hasVerb( verb ) ){
													if ( resource.hasCommonAction() ){
														resource.doCommon( request, response, function( status, data ){ resource.respond( request, response, status, data ); }.bind( this ), function(){
															resource[ verb ]( identifier, request, response, function( status, data ){ resource.respond( request, response, status, data ); }.bind( this ) );
														}.bind( this ) );
													}
													else resource[ verb ]( request, response, function( status, data ){ resource.respond( request, response, status, data ); }.bind( this ) );
												} else this.__defaultResponder.respond( request, response, 501 );
											} else this.__defaultResponder.respond( request, response, 404, { description: "resource not found" } );
										}
										else {
											if ( resourceController.hasVerb( verb ) ){
												if ( resourceController.hasCommonAction() ){
													resourceController.doCommon( request, response, function( status, data ){ resourceController.respond( request, response, status, data ); }.bind( this ), function(){
														resourceController[ verb ]( request, response, function( status, data ){ resourceController.respond( request, response, status, data ); }.bind( this ) );
													}.bind( this ) );
												}
												else resourceController[ verb ]( request, response, function( status, data ){ resourceController.respond( request, response, status, data ); }.bind( this ) );
											} else this.__defaultResponder.respond( request, response, 501 );
										}									
									} else this.__defaultResponder.respond( request, response, 404, { description: "collection not found" } );
								} else this.__defaultResponder.respond( request, response, 404, { description: "namespace not found" } );
							}
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
										// does the required controlelr exist
										if ( this.controllers.has( command.controller ) ){
											controller = this.controllers.get( command.controller );

											// is the action valid?
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

																complete( session );
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
											} else response.send( 302, { location: iridium.app.config.protocol +  iridium.app.config.host } ); //response.sendError( 404, "invalid_action" );
										} else response.send( 302, { location: iridium.app.config.protocol +  iridium.app.config.host } ); //esponse.sendError( 404, "invalid_controller" );
									} else response.send( 302, { location: iridium.app.config.protocol +  iridium.app.config.host } ); //response.sendError( 404, "no_route" );
								}
							}.bind( this ) );
						}
					}

				}
				else {
					res.statusCode = 401;
					res.setHeader( "WWW-Authenticate", "basic" );
					res.end();
				}
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