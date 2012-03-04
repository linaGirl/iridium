
	
	var net = require( "net" )
		crypto = require( "crypto" );


	module.exports = new Class( {
		$id: "net.Connection"
		, Extends: Events

		, constructor: function( options ){
			if( typeof options !== "object" ) throw new Error( "net.Connection expects a socket or conenction parameters as init options!" );
			
			if ( typeof options.socket === "object" ){
				this.__initbySocket( options.socket );
			}
			else if ( typeof options.address === "string" && typeof options.port === "" ){
				this.__connect( options.address, options.port );
			}
			else {
				throw new Error( "net.Connection expects a socket or conenction parameters as init options!" );
			}
		}



		// send a message throough the pipe, the only public accesible property
		, send: function( message, callback ){
			if ( message && Buffer.isBuffer( message ) ){
				
			}
			else {
				throw new Error( "send takes only buffer as argument 0!" );
				log.dir( message );
			}
		}

		// init by socket
		, __initbySocket: function( socket ){
			
		}

		// connect
		, __connect: function( address, port ){
			
		}
	} );