
	
	var Server = require( "./lib/server" )
		, Connection = require( "./lib/connection" );



	module.exports = {
		

		// server
		createServer:  function( port, bind, credentials ){
			return Server( {
				port: port
				, bind: bind
				, credentials: credentials
			} );
		}



		// connection pool
		, createConnection: function( host, port, credentials ){
			if ( typeof host === "string" ){
				if ( typeof port === "number" || typeof port === "string" ){
					if ( parseInt( port, 10 ) > 0 && parseInt( port, 10 ) <= 0xFFFF ){
						return new Connection( {
							host: host
							, port: port
							, credentials: credentials 
						} );
					}
					else {
						throw new RangeError( "port must be a number between 1 and 65535!" );
					}
				}
				else {
					throw new TypeError( "parameter port must be typeof number or string!" );
				}
			}
			else {
				throw new TypeError( "parameter host must be typeof string!" );
			}
		}
	};