


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, util 			= iridium( "util" )
		, argv 			= util.argv
		, sha512 		= util.sha512
		, db 			= iridium( "db" )
		, RandomData	= iridium( "crypto" ).RandomData
		, LRUCache 		= db.LRUCache
		, Schema 		= db.Schema
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-session" );



	var Response 		= require( "./response" );



	module.exports = new Class( {
		inherits: Events


		// LRU cache
		, __cache: null


		, init: function( options ){
			// random pool
			this.__randomPool = new RandomData();

			// session cache
			this.__cache = new LRUCache( {
				limit: 100000 				// 100k
				, ttl: 2 * 24 * 3600 * 1000 // 2 days
				, on: {
					autoremove: this.__handleCacheRemove.bind( this )
				}
			} );

			options.schema.path = iridium.root + "iridium/modules/web/lib/schema";

			// session db
			this.__db = new Schema( { 
				config: options.schema
				, name: "iridium"
			} );

			this.emit( "ready" );
		}



		// store last hit
		, __handleCacheRemove: function( id, session, lastHit ){
			session.lastHit = lastHit;
			session.save();
		}




		// message from worker process
		, handleMessage: function( rawMessage, sourceId ){
			var response 	= new Response( { callId: rawMessage.callId, sourceId: sourceId, on: { message: this.__send.bind( this ) } } )
				, message 	= rawMessage.payload || {} ;

			if ( debug ) log.info( "got message from worker ...", this ), log.dir( rawMessage );


			switch ( rawMessage.action ){
				case "create": // create a new session
					this.__createSession( message, response );
					break;

				case "get": // get / valdate session. may return a new session
					this.__getSession( message, response );
					break;

				case "remove": // delete session
					this.__removeSession( message, response );
					break;

				case "update": // update values inside the session
					this.__updateSession( message, response );
					break;

				default: 
					response.sendError( new Error( "unknown_action" ) );
			}
		}



		// uopdate
		, __updateSession: function( message, response ){
			var sessionId = this.__getSessionIdFromMessage( message );


			var updateSession = function( theSession ){
				theSession.lastHit 			= Date.now();
				theSession.userId 			= message.session.userId;
				theSession.authenticated 	= message.session.authenticated;
				theSession.data 			= message.session.data;

				this.__broadcast( "set", theSession, response.getSourceId() );

				response.sendSuccess();
				
				theSession.save();
			}.bind( this );



			if ( sessionId ){
				var session = this.__cache.get( sessionId );

				if ( session )  {
					updateSession( session );
				}
				else {
					this.__db.session.findOne( sessionId, function( err, session ){
						if ( err ){
							response.sendError( err );
						}
						else if ( session ){
							this.__cache.set( session.id, session );

							updateSession( session );							
						}
						else {
							response.sendError( new Error( "invalid_session" ) );
						}
					}.bind( this ) );
				}
			}
			else {
				response.sendError( new Error( "missing_sessionId" ) );
			}
		}




		// delete a session
		, __removeSession: function( message, response ){
			var sessionId = this.__getSessionIdFromMessage( message );

			if ( sessionId ){
				this.__db.session.remove( sessionId, function( err ){
					if ( err ){
						response.sendError( err );
					}
					else {
						this.__broadcast( "remove", { id: sessionId }, response.getSourceId() );

						this.__cache.remove( sessionId );

						response.sendSuccess();
					}
				}.bind( this ) );
			}
			else {
				response.sendError( new Error( "missing_sessionId" ) );
			}
		}



		// create a new session
		, __createSession: function( message, response ){
			if ( debug ) log.info( "creating a new session ...", this );

			var session = new this.__db.session( {
				id: 		this.__createId()
				, lastHit: 	Date.now()
			} ).save( function( err ){
				if ( err ){
					if ( debug ) log.warn( "db error ...", this );
					log.trace( err );
					response.sendError( err );
				}
				else {
					this.__broadcast( "set", session, response.getSourceId() );

					this.__cache.set( session.id, session );

					if ( debug ) log.info( "returning new session ...", this );
					response.sendSession( session );
				}
			}.bind( this ) );
		}


		// return a session ( it may exist already )
		, __getSession: function( message, response ){
			var sessionId = this.__getSessionIdFromMessage( message );

			if ( sessionId ){
				var session = this.__cache.get( sessionId );

				if ( session ){
					if ( debug ) log.info( "returning session from cache ...", this );
					response.sendSession( session );
				}
				else {
					if ( debug ) log.debug( "fetching session from db ...", this );
					this.__db.session.findOne( sessionId, function( err, session ){
						if ( err ){
							if ( debug ) log.info( "db error ...", this );
							log.trace( err );
							response.sendError( err );
						}
						else if ( session ){
							session.lastHit = Date.now();

							this.__broadcast( "set", session, response.getSourceId() );
							this.__cache.set( session.id, session );
							session.save();

							if ( debug ) log.info( "returning session from db ...", this );
							response.sendSession( session );
						}
						else {
							this.__createSession( message, response );
						}
					}.bind( this ) );
				}
			}
			else {
				this.__createSession( message, response );
			}
		}





		// create a new sessionId
		, __createId: function(){
			var rdata = this.__randomPool.get( 64 );

			// we didnt get random data
			if ( !rdata ){
				if ( debug ) log.warn( "failed to fetch random data!", this );
				rdata += Math.random() + "" + Math.random() + ""  + Date.now() + "_not really random ....";
			}

			// return a new sessionId
			return sha512( rdata );
		}



		// send message to a worker
		, __send: function( targetId, message ){
			if ( debug ) log.debug( "sending message to [" + targetId + "] ...", this ), log.dir ( message );
			this.emit( "message", targetId, message );
		}


		// broadcast a message to all workers, you may exclude on worker
		, __broadcast: function( action, session, excludeId ){
			var message = { action: action, payload: { session: session.toJSON() } };

			if ( debug ) log.info( "broadcasting, exluding [" + excludeId + "] ...", this ), log.dir ( message );
			this.emit( "broadcast", message, excludeId );
		}


		// get session id
		, __getSessionIdFromMessage: function( message ){
			if ( typeof message.session === "object" && typeof message.session.id === "string" && /^[0-9a-f]{128}$/i.test( message.session.id ) ){
				return message.session.id;
			}
			return null;
		}
	} );