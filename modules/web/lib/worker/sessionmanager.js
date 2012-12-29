

	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, LRUCache		= iridium( "db" ).LRUCache
		, RandomData	= iridium( "crypto" ).RandomData
		, util 			= iridium( "util" )
		, Obj 			= util.Object
		, sha512 		= util.sha512
		, argv 			= util.argv
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-session" );


	var Session 		= require( "./session" )
		, FakeSession 	= require( "./fakesession" );

	var cluster 		= require( "cluster" );



	module.exports = new Class( {
		inherits: Events

		
		, init: function( options ){
			if ( cluster.isMaster ){
				cluster.on( "fork", function( worker ){
					worker.on( "message", function( message ){
						Obj.each( cluster.workers, function( wrkr ){
							if ( wrkr.id !== worker.id ) wrkr.send( message );
						}.bind( this ) );
					}.bind( this ) );
				}.bind( this ) );
			}
			else {
				this.__iridium = options.schemas.iridium;

				// random pool
				this.__randomPool = new RandomData();

				this.__createCache();
				this.__handleMessaging();

				// wait until this class was returned ( events emit immediately )
				process.nextTick( function(){ this.emit( "load" ); }.bind( this ) );
			}			
		}




		, getOrCreate: function( sessionId, callback, fakeSession ){
			if ( !fakeSession ){
				this.get( sessionId, function( err, session ){
					if ( err || !session ) this.create( callback );
					else callback( null, session );
				}.bind( this ) );
			}
			else callback( null, new FakeSession() );
		}




		, create: function( callback, fakeSession ){
			if ( debug ) log.info( "creating new session ...", this );

			if ( !fakeSession ){
				var sessionId = this.__createId();

				// check for an exising gsession with this id, should alwas return none!
				this.__iridium.session.findOne( { sessionId: sessionId }, function( err, exisitingSession ){
					if ( err ) callback( err );
					else if ( exisitingSession ) this.create( callback );
					else {
						new this.__iridium.session( {
							sessionId: sessionId
							, created: new Date()
						} ).save( function( err, dbSession ){
							if ( err ) callback( err );
							else {
								// create session
								new Session( { 
									  dbSession: dbSession
									, iridium: this.__iridium
									, manager: this
									, on: {
										load: function( err, session ){ 
											if ( !err && session ) this.__cache.set( session.sessionId, session );
										  	callback( err, session ); 
										}.bind( this )
										, renew: function( session, oldSessionId, newSessionId ){
											// change caching key
											this.__cache.remove( oldSessionId );
											this.__cache.set( newSessionId, session );
										}.bind( this )
									}
								} );
							}
						}.bind( this ) );
					}
				}.bind( this ) );
			}
			else callback( null, new FakeSession() );
		}



		, get: function( sessionId, callback, fakeSession ){
			if ( debug ) log.info( "requesting session [" + sessionId + "] ...", this );

			if ( !fakeSession ){
				if ( /^[a-f0-9]{50}$/i.test( sessionId ) ){
					var cachedSession = this.__cache.get( sessionId );

					if ( cachedSession ){
						if ( debug ) log.info( "returning cached session ...", this );
						callback( null, cachedSession );
					}
					else {
						if ( debug ) log.info( "getting session from db ...", this );
						this.__iridium.session.findOne( { sessionId: sessionId }, function( err, exisitingSession ){
							if ( err ) callback( err );
							else if ( exisitingSession ) {
								new Session( { 
									  dbSession: exisitingSession
									, iridium: this.__iridium
									, manager: this
									, on: {
										load:  function( err, session ){ 
											if ( !err && session ) this.__cache.set( session.sessionId, session );
										  	callback( err, session ); 
										}.bind( this )
										, renew: function( session, oldSessionId, newSessionId ){
											// change caching key
											this.__cache.remove( oldSessionId );
											this.__cache.set( newSessionId, session );
										}.bind( this )
									}
								} );
							}
							else callback();
						}.bind( this ) );
					}
				} else callback();
			}
			else callback( null, new FakeSession() );
		}



		// create a new sessionId
		, __createId: function(){
			var rdata = this.__randomPool.get( 64 ) + Math.random() + "afdbf4bb01be13d99d07d8a1909ad65566004ba60929f87c665cd5b662e31d0b86f1ab791853595fb10e023904acbb3dcebff802cac447760eb792147a844073";

			// we didnt get random data
			if ( !rdata ){
				if ( debug ) log.warn( "failed to fetch random data!", this );
				rdata += Math.random() + "" + Math.random() + ""  + Date.now() + "afdbf4bb01be13d99d07d8a1909ad65566004ba60929f87c665cd5b662e31d0b86f1ab791853595fb10e023904acbb3dcebff802cac447760eb792147a844073";
			}

			// return a new sessionId
			return sha512( rdata ).substr( 50, 50 );
		}



		// cache commands from other hosts
		, __handleMessaging: function(){
			process.on( "message", function( message ){
				var session;

				if ( message.t === "session" ) {
					if ( debug ) log.debug( "got message [" + message.a + "]: ", this ), log.dir( message.d );

					switch ( message.a ){
						case "renew":
						case "authchange":
						case "activate":
						case "removeUser":
						case "addUser":
							session = this.__cache.get( message.s );
							if ( session ) session.handleMessage( message.a, message.d );
							break;

						case "cache":
							new Session( { 
								  networkSession: message.d
								, iridium: this.__iridium
								, manager: this
								, on: {
									load:  function( err, session ){ 
										if ( !err && session ) this.__cache.set( session.sessionId, session );
									}.bind( this )
									, renew: function( session, oldSessionId, newSessionId ){
										// change caching key
										this.__cache.remove( oldSessionId );
										this.__cache.set( newSessionId, session );
									}.bind( this )
								}
							} );
							break;

						default: throw new Error( "unknown command [" + message.a + "]!");
					}
				}
			}.bind( this ) );
		}


		, __createCache: function(){

			// session cache
			this.__cache = new LRUCache( {
				  limit: 100000 			// 100k
				, ttl: 2 * 3600 * 1000 	// 2h
				, on: {
					autoremove: function( sessionId, session ){
						
						// create log entry
						if ( session.isMaster() ){
							new this.iridium.sessionlog( {
								  id_session: 	session.id
								, accessed: 	new Date()
								, ip: 			session.ip
								, useragent: 	session.useragent
							} ).save();
						}

						session.cleanup();
					}.bind( this )
				}
			} );
		}
	} );