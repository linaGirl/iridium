
	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-mysql" ) || argv.has( "trace-all" )
		, timing 		= argv.has( "trace-mysql-timing" );

	var mysql 			= require( "../dep/node-mysql" );

	var Transaction 	= require( "./mysqltransaction" );




	module.exports = new Class( {
		inherits: Events


		// connection config
		, __config: {}


		// after idling this amount of ms close the connection 
		, __idleTimeoutTime: debug ? 1000 * 5 : 1000 * 600

		// kill queries after 
		, __queryTimeoutTime: 60000


		// status
		, __available: false



		, init: function( options ){
			this.__config 	= options.config;
			this.__id 		= options.id;
			this.__writable = options.writable;

			this.$id += "@" + this.__id;
			
			// try to connect
			this.__connect();
		}


		// double check if the connection is ok...
		, isAvailable: function(){
			return !!this.__connection;
		}


		, isWritable: function(){
			return this.__writable;
		}


		, query: function( query, parameters, callback ){
			if ( typeof parameters === "function" ) {
				callback = parameters;
				parameters = null;
			}
			// store callback globally
			this.__callback = typeof callback === "function" ? callback : function(){};
			this.__setBusy();

			if ( debug ) {
				log.info( "<< --- QUERY ----------", "host: " + this.__config.host, this );
				log.debug( query, this );
				if ( parameters ) log.dir( parameters );
				log.debug( "--- QUERY ---------- >>", this );
			}

			// pseudo timeout
			this.__setQueryTimeout( query, parameters );			
			if ( timing || debug ) var now = Date.now();

			if ( debug ) log.debug( "starting query ...", this );
			this.__connection.query( query, parameters, function( err, result ){
				if ( timing || debug ) log.debug( "query took [" + ( Date.now() - now ) + "] ms", this );

				if ( !err || err.code === "ER_PARSE_ERROR" ){
					// no or recoverable error
					if ( err ) log.trace ( err );
					this.__cancelQuerytimeout();

					// call the callback
					this.__callback( err, result );
					delete this.__callback;

					// timeouts

					// im available agian
					this.__setAvailable();
				}
				else {
					// kill the connection, it may be broken
					this.__callback( err, result );
					delete this.__callback;					
					this.__cancelQuerytimeout();
					log.trace ( err );
				}
			}.bind( this ) );
		}



		, createTransaction: function( callback ){
			this.__setBusy();
			this.__clearIdleTimeout();

			var transaction = new Transaction( {
				connection: this
				, on: {
					complete: function(){
						this.__setAvailable();
						this.__setIdleTimout();
					}.bind( this )
					, ready: function(){
						callback( null, transaction );
					}.bind( this )
					, error: function( err ){
						log.error( "failed to create transaction!", this );
						log.trace( err );
						callback( err );
						this.__setIdleTimout();
						this.__free();		
					}.bind( this )
				}
			} );			
		}


		, __setQueryTimeout: function( sql, parameters ){
			this.__queryTimeout = setTimeout( function () {
				log.warn( "long running query!", this );
				log.dir( sql, parameters );
			}.bind( this ), this.__queryTimeoutTime );
		}

		, __cancelQuerytimeout: function(){
			clearTimeout( this.__queryTimeout );
			if ( this.__queryTimeout !== undefined ) delete this.__queryTimeout;
		}



		, __setAvailable: function(){
			process.nextTick( function(){
				if ( !this.__available ) {
					this.__setIdleTimout();
					this.__available = true;
					this.emit( "available", this );
				}
			}.bind( this ) );
		}

		, __setBusy: function(){
			if ( this.__available ) {
				this.__clearIdleTimeout();
				this.__available = false;
				this.emit( "busy", this );
			}
		}



		, __setIdleTimout: function(){
			this.__idleTimeout = setTimeout( function(){
				this.emit( "requestRemove", function( removalAllowed ){
					if ( removalAllowed ){
						this.emit( "idleTimeout", this );
						if ( debug ) log.warn( "connection close [idle]", this );
						this.__close();
					}
				}.bind( this ) );
			}.bind( this ), this.__idleTimeoutTime );
		}

		, __clearIdleTimeout: function(){
			clearTimeout( this.__idleTimeout );
			if ( this.__idleTimeout !== undefined ) delete this.__idleTimeout;
		}



		, __connect: function(){
			this.__connection = mysql.createConnection( this.__config );

			// handle connection level errors
			this.__connection.on( "error", function( err ){
				if ( debug ) log.error( "error on connection:", this ), log.trace( err );

				// remove from stack
				this.__setBusy();

				// the server doesnt accept more connections!
				switch ( err.code ){
					case "ER_TOO_MANY_USER_CONNECTIONS":
					case "ER_CON_COUNT_ERROR":
						this.emit( "tooManyConnections", this );
						this.__close( err );
						break;

					default: 
						this.__close( err );
						break;
				}

				if ( this.__callback ){
					this.__callback( err);
					this.__cancelQuerytimeout();
					delete this.__callback;
				}
			}.bind( this ) );


			// connect
			this.__connection.query( "SELECT 1;", function( err, result ){
				if ( err ) return this.__close( err );
				this.emit( "ready", this );
				this.__setAvailable();
			}.bind( this ) );
		}


		, __close: function( err ){
			if ( err ){
				if ( err.code === "ER_CON_COUNT_ERROR" ) this.emit( "tooManyConnections", this );
				else this.emit( "error", this, err );
			} 
			this.__clearIdleTimeout();
			this.__cancelQuerytimeout();
			this.emit( "close", this );
			this.__connection.end();
			delete this.__connection;
			this.off();
		}	
	} );