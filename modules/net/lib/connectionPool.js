
	var Connection = require( "./connection" )


	module.exports = ConnectionPool = new Class( {
		$id: "ConnectionPool"

		, $connections: {}


		, constructor: function(){
			log.info( "new ConnectionPool", this );
		}


		// returns a connections to the target host if the optional credentials match
		, getConnection: function( host, port, credentials ){
			var connection;

			if ( typeof host === "string" ){
				if ( typeof port === "number" || typeof port === "string" ){
					if ( parseInt( port, 10 ) > 0 && parseInt( port, 10 ) <= 0xFFFF ){
						if ( this.$connections[ host + port ] ){
							return this.$connections[ host + port ];
						}
						else {
							return new Connection( {
								host: host
								, port: port
								, credentials: credentials 
							} );
						}
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
	} );