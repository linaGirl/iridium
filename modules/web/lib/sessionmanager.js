


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, LRUCache		= iridium( "db" ).LRUCache
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-session" ) || argv.has( "trace-all" );



	var Session 		= require( "./session" );



	module.exports = new Class( {
		inherits: Events


		// cache
		, __cache: null

		// ipc callbacks
		, __callbacks: {}
		, __ipcCounter: 0
	

		, init: function( options ){

			this.__schemas = options.schemas;

			// create cache
			this.__cache = new LRUCache( {
				  ttl: 		3600000 // 1h
				, limit: 	100000 	// 100k
			} );


			process.on( "message", this.__handleMessage.bind( this ) );

			// wait until this class was returned ( events emit immediately )
			process.nextTick( function(){ this.emit( "load" ); }.bind( this ) );
		}





		, __handleMessage: function( message ){
		
			if ( message && message.payload && message.payload ){
				if ( debug ) log.info( "got message from master ...", this ), log.dir( message );
				
				if ( message.callId ){
					if ( typeof this.__callbacks[ message.callId ] === "function" ){
						this.__callbacks[ message.callId ]( message.status !== "ok" ? new Error( "operation failed: " + ( message.payload.err || "unknown_reason" ) ) : null, message.payload );
						delete this.__callbacks[ message.callId ];
					}
				}
				else {
					switch ( message.action ){
						case "set": 
							this.__setSession( message.payload.session );
							break;

						case "remove":
							this.__removeSession( message.payload.session );
							break;

						default:
							log.dir( message );
							throw new Error( "invalid message!" );
					}
				}
			}
			else {
				log.dir( message );
				throw new Error( "invalid message!" );
			}
		}





		, __removeSession: function( masterSession ){
			var session = this.__cache.remove( masterSession.id );

			if ( session ){
				// empty session
				session.userId 			= null;
				session.authenticated 	= false;
				session.data 			= {};
			}
		}






		// create local session, or update existing
		, __setSession: function( masterSession ){
			var session = this.__cache.get( masterSession.id );

			if ( session ){
				// update
				session.lastHit 		= masterSession.lastHit;
				session.userId 			= masterSession.userId;
				session.authenticated 	= masterSession.authenticated;
				session.data 			= masterSession.data;
			}
			else {
				this.__createSession( masterSession );
			}
		}





		// returns a session ( validates an existing one )
		, get: function( sessionId, callback ){
			var session;

			if ( typeof sessionId === "function" ) callback = sessionId, sessionId = null;

			if ( sessionId && this.__isValidSessionId( sessionId ) ){
				session = this.__cache.get( sessionId );

				if ( session ){
					if ( debug ) log.info( "got session from local cache ...", this );
					callback( null, session );
				}
				else {
					this.__send( "get", { session: { id: sessionId } }, function( err, message ){
						if ( err ){
							if ( debug ) log.warn( "failed to get a session ...", this ), log.trace( err );
							callback( err );
						}
						else {
							if ( message.session ){
								if ( debug ) log.info( "got a session from the master ...", this );
								session = this.__createSession( message.session );
								callback( null, session );
							}
							else {
								throw new Error( "callback should return either an error or a session, it did neither!" );
							}
						}
					}.bind( this ) );
				}
			}
			else {
				// create new
				this.__send( "create", { session: { id: sessionId } }, function( err, message ){
					if ( err ){
						if ( debug ) log.warn( "failed to create a new session ...", this ), log.trace( err );
						callback( err );
					}
					else {
						if ( message.session ){
							if ( debug ) log.info( "got a new session from the master ...", this );
							session = this.__createSession( message.session );
							callback( null, session );
						}
						else {
							throw new Error( "callback should return either an error or a session, it did neither!" );
						}
					}
				}.bind( this ) );
			}
		}



		, __createSession: function( sessionData ){
			var session = new Session( sessionData );

			// save to master
			session.on( "message", function( action, payload, callback ){
				this.__send( action, payload, callback );
			}.bind( this ) );

			// destory
			session.on( "destory", function(){
				this.__cache.remove( session.id );
			}.bind( this ) );

			// add to cache
			this.__cache.set( session.id, session );

			return session;
		}



		, __send: function( action, payload, callback ){

			if ( debug ) log.info( "sending message [" + action + "] ...", this );
			// counter will not be increased too much ( 10000 calls / sec * 3600 seconds * 24 hours * 365 days * 10 years 
			// -> 3.1536e+12 ( ~2^42 ) while javascript supports up to 9.0071993e+15 ( 2^53 ) )
			var callId = ++this.__ipcCounter; 
			if ( typeof callback === "function" ) this.__callbacks[ callId ] = callback;

			// send to master
			process.send( { callId: callId, action: action, payload: payload } );
		}


		, __isValidSessionId: function( sessionId ){
			return typeof sessionId === "string" && sessionId.length === 128 && /^[a-f0-9]{128}$/i.test( sessionId );
		}
	} );
