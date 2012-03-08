
	
	var Server = require( "./lib/server" )
		, ConnectionPool = require( "./lib/connectionPool" );



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
		, createConnectionPool: function(){
			return new ConnectionPool();
		}
	};