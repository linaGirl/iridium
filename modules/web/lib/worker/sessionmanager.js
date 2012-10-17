

	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, LRUCache		= iridium( "db" ).LRUCache
		, RandomData	= iridium( "crypto" ).RandomData;


	var Session 		= require( "./session" );



	module.exports = new Class( {
		inherits: Events

		
		, init: function( options ){

			// random pool
			this.__randomPool = new RandomData();

			// session cache
			this.__cache = new LRUCache( {
				limit: 100000 			// 100k
				, ttl: 2 * 3600 * 1000 	// 2h
				, on: {
					autoremove: function( session ){
						session.save();
					}.bind( this )
				}
			} );

			// cache commands from other hosts
			process.on( "message", function( message ){
				if ( message.t === "session" && message.a = "setCache" ) {
					message.d.$fromDB = true;
					this.__cache.set( message.d.sessionId, new this.iridium.session( message.d ) );
				}
			}.bind( this ) );
		}



		// create a new session
		, createSession: function( callback ){
			var sessionId = this.__createId();

			this.iridium.session.findOne( { sessionId: sessionId }, function( err, DBSession ){
				if ( err ) callback( err );
				else if ( DBSession ) this.createSession( callback );
				else {
					var session = new this.iridium.session( {
						sessionId: this.__createId()
					} ).save( function( err ){
						if ( err ) callback( err );
						else {
							this.__cache.set( session.sessionId, session );
							this.__attachEvents( session );
							callback( null, session );
						}
					}.bind( this ) );	
				}
			}.bind( this ) );
		}


		// get existing session
		, getSession: function( sessionId, callback ){
			var session = this.__cache.get( sessionId );

			if ( session ) {
				session.touch();
				callback( null, session );
			}
			else {
				this.iridium.session.findOne( { sessionId: sessionId }, function( err, session ){
					if ( err ) callback( err );
					else if ( !session ) callback();
					else {
						this.__attachEvents( session );
						callback( null, session );
					}
				}.bind( this ) );
			}
		}


		// caching
		, __attachEvents: function( session ){
			session.on( "renew", function( oldSessionId, newSessionId ){
				this.__cache.set( newSessionId, session );
				this.__cache.remove( oldSessionId );
			}.bind( this ) );

			session.on( "destroy", function( sessionId ){
				this.__cache.remove( sessionId );
			}.bind( this ) );
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
			return sha512( rdata ).substr( 0, 50 );
		}
	} );