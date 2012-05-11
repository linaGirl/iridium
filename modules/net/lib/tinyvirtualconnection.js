




	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );


	

	module.exports = new Class( {
		$id: "net.tinyVirtualConnection"
		, inherits: Events

		, __port: 0
		, __host: ""
		, __id: ""
		, __connectionId: ""
		, __connection: null
		, __finished: false

		
		, init: function( options ){
			this.__port = options.port || throw new Error( "missing port!" );
			this.__host = options.host || throw new Error( "missing host!" );
			this.__connectionId = options.connectioId || throw new Error( "missing connection id!" );
			this.__id = options.id;

			this.__connection = options.connection;
		}



		// send a chunk of data
		, send: function( data ){
			return this.__connection.send( data );
		}


		// send a chunk of data
		, close: function(){
			this.__close();
		}


		// close this virtualconnection
		, __close: function(){
			// flag as dead
			this.__finished = true;

			// cleanupo connection stuff
			if ( this.__connection ){
				this.__connection.off( "close", this.__handleConnectionClose.bind( this ) );
				this.__connection = null;
			}

			// tell about my death
			this.emit( "close", this.__id );
		}
	} );