
	
	var net = require( "net" )
		, dns = require( "dns" )
		, crypto = require( "crypto" );


	module.exports = new Class( {
		$id: "net.Connection"
		, Extends: Events


		, __buffer: []
		
		, __closed: false
		, __connected: false
		, __host: ""
		, __address: ""
		, __port: 0



		, constructor: function( options ){
			if ( typeof options !== "object" ) throw new TypeError( "parameter options of the cuonstructor expects an object!" );

			if ( typeof options.socket === "object" ){
				// got a socket
				this.__handleScoket( options.socket );
			}
			else if ( typeof options.host === "string" && ( typeof options.port === "number" || typeof options.port === "string" ) ){
				// connect
				this.__host = options.host;
				this.__port = options.port;
				this.__credentials = options.credentials;

				this.__connect();
			}
			else {
				throw new Error( "constructor expects either a socket or connection parameters ( host, port, optional credentials )!" );
			}

			this.on( "close", this.__destroy.bind( this ) );
		}



		// send data to the other end of the pipe
		, send: function( data, callback ){
			if ( this.__closed ){
				callback( new Error( "connection_closed" ), data );
			}
			else {
				if ( this.__connected ){
					if ( Buffer.isBuffer( data ) ){
						this.__socket.write( data, "binary", function(){
							callback();
						}.bind( this ) );
					}
					else {
						throw new TypeError( "parameter data must be typeof buffer!" );
					}
				}
				else {
					this.__buffer.push( {
						data: data
						, callback: callback
					} );
				}
			}
		}




		// returns the id of the connection 
		, id: function(){
			return this.__address + this.__port;
		}


		// end the connection
		, end: function(){
			if ( this.__socket ){
				// end the socket, will call __destroy later
				this.__socket.end();
			}
			else {
				// no socket
				this.__closed = true;
				this.__connected = false;
				this.__destroy();
			}
		}



		// handle the socket
		, __handleSocket: function( socket ){

			// dont accept a socket if the connection was ended
			if ( this.__closed ) return;


			// dont accespt a closed socket
			if ( socket.destroyed ){
				log.warn( "node socket was destroyed already on iridium socket contruction!", this );
				this.emit( "close" );
				return;
			}

			// this event will only be fired if its listener is added
			// in the same tick as it was emitted by the server ( bevaior as expected )
			socket.on( "connect", function(){
				this.__connected = true;
				this.emit( "connect" );
			}.bind( this ) );


			// data, no protocol stuff in here
			socket.on( "data", function( data ){
				this,emit( "data", data );
			}.bind( this ) );


			// the other side sent a fin packet, we cannot write more data to the socket
			socket.on( "end", function(){
				this.__closed = true;
				this.__connected = false;
			}.bind( this ) );


			// the socket times out after 2 minutes idle time, we have to destroy the socket ourselfs
			socket.on( "timeout", function(){
				this.__closed = true;
				this.__connected = false;
				this.__socket.end();
			}.bind( this ) );


			// the socket had an error, dont take any action, the socket will close later, destroy itself
			// the user has to reconnect andthrowttle reconnecting if the host is not available
			socket.on( "error", function( err ){
				log.error( "socket error: " + err, this );
			}.bind( this ) );


			// the socket was closed, close down 
			socket.on( "close", function(){
				this.__closed = true;
				this.__connected = false;
				this.emit( "close" );
			}.bind( this ) );


			// set the idletimeout
			socket.setTimeout( 120000 );

			// store reference
			this.__socket = socket;
		}



		// connect
		, __connect: function(){
			// first check if host is a hostname, if yes resolve it
			this.__lookup( this.__host, function( address ){
				this.__handleSocket ( net.createConnection( this.__port, this.__host, this.__credentials ) );
			}.bind( this ) );
		}



		// lookup the host
		, __lookup: function( host, callback ){
			if ( net.isIP( host ) ) {
				this.__address = host;
				this.emit( "address", host );
				callback( host );
			} 
			else {
				dns.lookup( host, function( err, address ){
					if ( err ){
						log.error( "could not connect to target host: " + err, this );
						this.emit( "error", new Error( "could not connect to target host: " + err ) );
					} else {
						if ( address ){
							this.__address = address;
							this.emit( "address", address );
							callback( address );
						}
						else {
							log.error( "could not connect to target host: nx_domain", this );
							this.emit( "error", new Error( "could not connect to target host: nx_domain" ) );
						}
					}
				}.bind( this ) );
			}
		}





		// destroy
		, __destroy: function(){
			this.emit( "destroy" );

			// clear the buffer
			var i = this.__buffer.length;
			while( i-- ){
				this.__buffer.splice( i, 1 )[ 0 ].callback( new Error( "connection_closed" ), this.__buffer[ i ].data );
			}

			process.nextTick( function(){
				// get rid of all listeners
				this.off();
			}.bind( this ) );
		}
	} );
