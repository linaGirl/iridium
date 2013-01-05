


	var Class 		= iridium( "class" )
		, log 		= iridium( "log" )
		, argv 		= iridium( "util" ).argv
		, debug 	= argv.has( "trace-all" ) || argv.has( "trace-net" )
		, TTLQueue 	= require( "../ttlqueue" )
		, Events 	= iridium( "events" )
		, net 		= require( "net" );



	module.exports = new Class( {
		inherits: Events

		, connected: false

		, __receiverBuffer: new Buffer( 0 )

		// is socket writable
		, __socketWritable: false


		// the conenction was created by the user
		, __userInitiaited: false

		// throttle reconnect attempts
		, __throttling: 0


		, init: function( options ){

			// cahce sender buffer only for a certain amount of time
			this.__senderQueue = new TTLQueue( {
				  ttl: 		10000 	// 10 sec
				, limit: 	1000 	// 1k packets at max
				, on: {
					autoremove: function( item ){
						if ( item && typeof item.callback === "function" ){
							item.callback( new Error( "SEND_TIMEOUT" ) );
						}
					}.bind( this ) 
				}
			} );



			if ( options.socket ){
				// connection from a server
				this.__socket = options.socket;

				this.remoteAddress 	= this.__socket.remoteAddress;
				this.remotePort 	= this.__socket.remotePort;

				this.__attachEvents();
			}
			else {
				// create a new connection
				this.remoteAddress 	= options.host;
				this.remotePort 	= options.port;
				this.__userInitiaited = true;
			}
		}



		, connect: function( port, host ){
			if ( port ) this.remotePort = port;
			if ( host ) this.remoteAddress = host;
			this.__connect();
		}


		, write: function( data, callback ){
			var   jsonString = JSON.stringify( data )
				, packet = new Buffer( jsonString.length + 4 );

			packet.writeUInt32BE( jsonString.length, 0 );
			packet.write( jsonString, 4 );

			this.__write( packet, callback );
		}


		, close: function(){
			this.__socket.close();
		}


		, __write: function( packet, callback ){
			if ( this.connected && this.__socketWritable ){
					
				// send buffered items first
				if ( this.__senderQueue.hasItems() ){
					var item = this.__senderQueue.getOldest();

					this.__socketWritable = this.__socket.write( item.data );
					if ( typeof item.callback === "function" ) item.callback();

					// retry
					this.__write( packet, callback );
				}
				else {
					this.__socketWritable = this.__socket.write( packet );
					if ( callback ) callback();
				}				
			}
			else {
				this.__senderQueue.add( { callback: callback, data: packet } );
			}	
		}

		, __connect: function(){
			this.__socket = new net.Socket();
			this.__attachEvents();
			this.__socket.connect( this.remotePort, this.remoteAddress );
		}

		, __decode: function( data ){
			var json;

			try {
				json = JSON.parse( data.toString() );
			} catch ( e ){
				log.error( "net.Connection failed to decode packet from", this.remoteAddress, ":", this.remotePort, this );
				log.dir( data );
				return;
			}

			if ( debug ) log.info( "net.Connection got a packet from", this.remoteAddress, ":", this.remotePort, this ), log.dir( json );
			this.emit( "data", json, this.remoteAddress + "@" + this.remotePort );
		}



		, __onDrain: function(){
			// send buffered stuff
			while( this.connected && this.__senderQueue.hasItems() && this.__socketWritable ){
				var item = this.__senderQueue.getOldest();
				this.__socketWritable = this.__socket.write( item.data );
				if ( typeof item.callback === "function" ) item.callback();
			}
		}


		, __onClose: function( err ){
		 	this.connected = false;
			if ( debug ) log.info( "net.Connection to", this.remoteAddress, ":", this.remotePort, "was closed" , this );			
			this.emit( "close", err );

			// reconnect on error if the socket was user intitazed
			if ( err && this.__userInitiaited ) setTimeout( this.__connect.bind( this ), this.__throttling );
		}

		, __onError: function( err ){
			this.connected = false;
			this.__throttling += 250;
			log.error( "net.Connection to", this.remoteAddress, ":", this.remotePort, "encountered an error" , this );
			log.trace( err );
			this.emit( "error", err );
		}

		, __onTimeout: function(){
			if ( debug ) log.info( "net.Connection to", this.remoteAddress, ":", this.remotePort, " has timeout", this );
			this.emit( "timeout" );
		}

		, __onEnd: function(){
			if ( debug ) log.info( "net.Connection to", this.remoteAddress, ":", this.remotePort, "got the FIN packet", this );
			this.connected = false;
			this.emit( "end" );
		}

		, __onData: function( chunk ){
			if ( debug ) log.info( "net.Connection got data from", this.remoteAddress, ":", this.remotePort, this );

			// concatenate on existing buffer
			this.__receiverBuffer = Buffer.concat( [ this.__receiverBuffer, chunk ], this.__receiverBuffer.length + chunk.length );

			// the header is 4 bytes, so we need at least that
			if ( this.__receiverBuffer.length > 4 ){
				var packetLen = this.__receiverBuffer.readUInt32BE( 0 );
				if ( packetLen + 4 <= this.__receiverBuffer.length ){

					// we got at least a complete packet
					this.__decode( this.__receiverBuffer.slice( 4, packetLen ) );

					// handle the rest
					if ( packetLen + 4 <= this.__receiverBuffer.length ) this.__onData( this.__receiverBuffer.slice( 4 + packetLen ) );
				}
			}
		}

		, __onConnect: function(){
			this.connected = true;
			this.__throttling = 0;
			if ( debug ) log.info( "net.Connection is conencted to", this.remoteAddress, ":", this.remotePort, this );
			this.emit( "connect" );
		}


		// add eventhandlers to the socket
		, __attachEvents: function(){
			this.__socket.on( "connect", 	this.__onConnect.bind( this ) );
			this.__socket.on( "data", 		this.__onData.bind( this ) );
			this.__socket.on( "end", 		this.__onEnd.bind( this ) );
			this.__socket.on( "timeout", 	this.__onTimeout.bind( this ) );
			this.__socket.on( "drain", 		this.__onDrain.bind( this ) );
			this.__socket.on( "error", 		this.__onError.bind( this ) );
			this.__socket.on( "close", 		this.__onClose.bind( this ) );
		}
	} );