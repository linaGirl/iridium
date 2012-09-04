
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


		// status
		, __available: false


		, init: function( options ){
			this.__config = options.config;
			this.__id = options.id;

			// try to connect
			this.__connect();
		}


		, query: function( query, parameters, callback ){
			if ( this.__available ) this.__available = false, this.emit( "busy", this.__id, this );
			this.__clearTimeout();

			if ( debug ) {
				log.debug( "<< --- QUERY ----------", this );
				log.debug( query, this );
				log.dir( parameters );
				log.debug( "--- QUERY ---------- >>", this );
			}

			if ( timing ) var now = Date.now();
			this.__connection.query( query, parameters, function( err, result ){
				if ( timing ) log.debug( "query took [" + ( Date.now() - now ) + "] ms", this );
				
				this.__setTimout();

				if ( typeof callback === "function" ){
					callback( err, result );
				}
				else if( typeof parameters === "function" ){
					parameters( err, result );
				}

				this.emit( "available", this.__id, this );
			}.bind( this ) );
		}



		, createTransaction: function( callback ){
			if ( this.__available ) this.__available = false, this.emit( "busy", this.__id, this );
			var transaction = new Transaction( {
				connection: this
				, on: {
					complete: function(){
						if ( !this.__available ) this.__available = true, this.emit( "available", this.__id, this );
					}.bind( this )
					, ready: function(){
						callback( transaction );
					}.bind( this )
					, error: function( err ){
						log.error( "failed to create transaction!", this );
						log.trace( err );
						setTimeout( function(){
							this.createTransaction( callback );
						}.bind( this ), 1000 );						
					}.bind( this )
				}
			} );			
		}



		, __setTimout: function(){
			this.__idleTimeout = setTimeout( function(){
				this.emit( "idleTimeout", this.__id, this );
			}.bind( this ), this.__idleTimeoutTime );
		}

		, __clearTimeout: function(){
			if ( this.__idleTimeout ) clearTimeout( this.__idleTimeout ), delete this.__idleTimeout;
		}



		, __connect: function( attemptCount ){
			attemptCount = attemptCount || 0;
			// try to connect 12 times, the attempt will be delayed by attemptCount secods
			if ( attemptCount > 10 ) return this.emit( "error", this.__id, this );

			// create a new connection
			this.__connection = mysql.createConnection( this.__config );

			// handle connection level errors
			this.__connection.on( "error", function( err ){
				// remove from stack
				if ( this.__available ) this.__available = false, this.emit( "busy", this.__id, this );

				// the server doesnt accept more connections!
				switch ( err.code ){
					case "ER_TOO_MANY_USER_CONNECTIONS":
						this.emit( "tooManyConnections", this.__id, this );
						this.emit( "error", this.__id, this );
						break;

					case "PROTOCOL_CONNECTION_LOST":
						setTimeout( function(){
							this.__connect( ++attemptCount );
						}.bind( this ), ( attemptCount * 1000 ) );
						break;

					default: 
						this.emit( "error", this.__id, this, err );
						log.trace( err );
						break;
				}
			}.bind( this ) );


			// connect
			this.__connection.query( "SELECT 1;", function( err, result ){
				if ( err ){
					log.dir( err );
				}
				else {
					if ( !this.__available ) this.__available = true, this.emit( "available", this.__id, this );
				}
			}.bind( this ) );
		}
	} );