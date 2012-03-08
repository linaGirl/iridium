
	
	var net = require( "net" )
		, dns = require( "dns" )
		, crypto = require( "crypto" );


	module.exports = new Class( {
		$id: "net.Connection"
		, Extends: Events

		
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
		}



		// handle the socket
		, __handleSocket: function( socket ){

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
			socket.on( "end" );

			// the socket times out after 2 minutes idle time, we have to destroy the socket ourselfs
			socket.on( "timeout", function(){

			}.bind( this ) );

			// the socket had an error, dont take any action, the socket will close later, destroy itself
			// the user has to reconnect andthrowttle reconnecting if the host is not available
			socket.on( "error", function( err ){
				log.error( "socket error: " + err, this );
			}.bind( this ) );

			// the socket was closed, close down 
			socket.on( "close", function(){

			}.bind( this ) );

			socket.setTimeout( 120000 );
		}



		// connect
		, __connect: function(){
			this.__lookup( this.__host, function( address ){
				this.__handleSocket ( net.createConnection( this.__port, this.__host, this.__credentials ) );
			}.bind( this ) );
		}



		// lookup the host
		, __lookup: function( host, callback ){
			if ( net.isIP( host ) ) {
				this.__address = host;
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
	} );