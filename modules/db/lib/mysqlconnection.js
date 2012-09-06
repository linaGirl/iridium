
	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, debug 		= iridium( "util" ).argv.has( "debug" )
		, timing 		= iridium( "util" ).argv.has( "timing" );

	var mysql 			= require( "../dep/node-mysql" );

	var Transaction 	= require( "./mysqltransaction" );




	module.exports = new Class( {
		$id: "db.mysql.connection"
		, inherits: Events


		// connection config
		, __config: {}

		, __idleTimeoutTime: 300000

		// kill queries after 
		, __queryTimeoutTime: 60000


		// status
		, __available: false


		, init: function( options ){
			this.__config = options.config;
			this.__id = options.id;

			// try to connect
			this.__connect();
		}


		, query: function( query, parameters, callback ){
			this.__busy();
			this.__clearTimeout();

			if ( debug ) {
				log.debug( "<< --- QUERY ----------", this );
				log.debug( "host: " + this.__config.host, this );
				log.debug( query, this );
				log.dir( parameters );
				log.debug( "--- QUERY ---------- >>", this );
			}

			// pseudo timeout
			this.__setQueryTimeout( query, parameters );
			
			if ( timing ) var now = Date.now();
			this.__connection.query( query, parameters, function( err, result ){
				if ( timing ) log.debug( "query took [" + ( Date.now() - now ) + "] ms", this );
				if ( err ) log.trace ( err );
				// not really a timeout :( no driver support
				this.__cancelQuerytimeout();
				this.__setTimout();

				if ( typeof callback === "function" ) callback( err, result );
				else if( typeof parameters === "function" ) parameters( err, result );

				this.__free();
			}.bind( this ) );
		}



		, createTransaction: function( callback ){
			this.__busy();
			var transaction = new Transaction( {
				connection: this
				, on: {
					complete: function(){
						this.__free();
					}.bind( this )
					, ready: function(){
						callback( null, transaction );
					}.bind( this )
					, error: function( err ){
						log.error( "failed to create transaction!", this );
						log.trace( err );
						callback( err );
						this.__free();				
					}.bind( this )
				}
			} );			
		}


		, __setQueryTimeout: function( sql, parameters ){
			this.__queryTimeout = setTimeout( function () {
				log.warn( "long running quer! canont timeout, you will probably loose this conenction!", this );
				log.dir( sql, parameters );
			}.bind( this ), this.__queryTimeoutTime );
		}

		, __cancelQuerytimeout: function(){
			if ( this.__queryTimeout ) clearTimeout( this.__queryTimeout ), delete this.__queryTimeout;
		}


		, __free: function(){
			process.nextTick( function(){
				if ( !this.__available ) {
					this.__available = true;
					this.emit( "available", this.__id, this );
				}
			}.bind( this ) );
		}

		, __busy: function(){
			if ( this.__available ) {
				this.__available = false;
				this.emit( "busy", this.__id, this );
			}
		}



		, __setTimout: function(){
			this.__idleTimeout = setTimeout( function(){
				this.emit( "idleTimeout", this.__id, this );
				log.debug( "connection [" + this.__id + "] closed: idle timaout", this );
				this.__connection.end();
				this.off();
			}.bind( this ), this.__idleTimeoutTime );
		}

		, __clearTimeout: function(){
			if ( this.__idleTimeout ) clearTimeout( this.__idleTimeout ), delete this.__idleTimeout;
		}



		, __connect: function( attemptCount ){
			attemptCount = attemptCount || 0;
			// try to connect 12 times, the attempt will be delayed by attemptCount secods
			if ( attemptCount > 10 ){
				this.__busy();
				this.emit( "error", this.__id, this );
				this.off();
				return;
			} 

			// create a new connection
			this.__connection = mysql.createConnection( this.__config );

			// handle connection level errors
			this.__connection.on( "error", function( err ){
				//log.error( "go fuyk yourself!", this );
				//log.trace( err );
				// remove from stack
				this.__busy();

				// the server doesnt accept more connections!
				switch ( err.code ){
					case "ER_TOO_MANY_USER_CONNECTIONS":
					case "ER_CON_COUNT_ERROR":
						this.emit( "tooManyConnections", this.__id, this );
						this.emit( "error", this.__id, this );
						this.off();
						break;

					case "PROTOCOL_CONNECTION_LOST":
						setTimeout( function(){
							this.__connect( ++attemptCount );
						}.bind( this ), ( attemptCount * 1000 ) );
						break;

					default: 
						this.emit( "error", this.__id, this, err );
						log.trace( err );
						this.off();
						break;
				}
			}.bind( this ) );


			// connect
			this.__connection.query( "SELECT 1;", function( err, result ){
				if ( err ){
					log.dir( err );
				}
				else {
					this.__free();
				}
			}.bind( this ) );
		}
	} );