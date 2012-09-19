
	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, debug 		= iridium( "util" ).argv.has( "trace-mysql" );

	var mysql 			= require( "../dep/node-mysql" );

	var Transaction 	= require( "./mysqltransaction" );




	module.exports = new Class( {
		$id: "db.mysql.connection"
		, inherits: Events


		// connection config
		, __config: {}


		// after idling this amount of ms close the connection 
		, __idleTimeoutTime: 1000 * 900 // 15 mins

		// kill queries after 
		, __queryTimeoutTime: 60000


		// status
		, __available: false


		, init: function( options ){
			this.__config 	= options.config;
			this.__id 		= options.id;
			this.__writable = options.writable;

			// try to connect
			this.__connect();
		}



		, isWritable: function(){
			return this.__writable;
		}


		, query: function( query, parameters, callback ){
			if ( typeof parameters === "function" ) {
				callback = parameters;
				parameters = null;
			}

			this.__setBusy();
			this.__clearIdleTimeout();

			if ( debug ) {
				log.info( "<< --- QUERY ----------", "host: " + this.__config.host, this );
				log.debug( query, this );
				log.dir( parameters );
				log.debug( "--- QUERY ---------- >>", this );
			}

			// pseudo timeout
			this.__setQueryTimeout( query, parameters );			
			if ( debug ) var now = Date.now();

			this.__connection.query( query, parameters, function( err, result ){
				if ( debug ) log.debug( "query took [" + ( Date.now() - now ) + "] ms", this );
				if ( err ) log.trace ( err );
				// not really a timeout :( no driver support
				this.__cancelQuerytimeout();
				this.__setIdleTimout();

				if ( typeof callback === "function" ) callback( err, result );

				this.__setAvailable();
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
					this.__available = true;
					this.emit( "available", this );
				}
			}.bind( this ) );
		}

		, __setBusy: function(){
			if ( this.__available ) {
				this.__available = false;
				this.emit( "busy", this );
			}
		}



		, __setIdleTimout: function(){
			this.__idleTimeout = setTimeout( function(){
				this.emit( "idleTimeout", this );
				log.debug( "connection close because of idle timeout", this );
				this.__close();
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
			}.bind( this ) );


			// connect
			this.__connection.query( "SELECT 1;", function( err, result ){
				if ( err ) return this.__close( err );
				this.emit( "ready", this );
				this.__setAvailable();
			}.bind( this ) );
		}


		, __close: function( err ){
			if ( err ) this.emit( "error", this, err );
			this.emit( "close", this );
			this.__connection.end();
			this.off();
		}	
	} );