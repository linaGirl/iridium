
	
	var server = require( "./lib/server" )
		, Connection = require( "./lib/connection" );



	module.exports = new Class( {
		$id: "net"
		, Extends: Events
		
		, constructor: function( options ){
			log.dir( options );
		}



		// add credentials for accepting connections
		, addCredentials: function( credentials ){
			
		}



		// send data to a target
		, send: function( packet, target, callback ){
			
		}



		// connect to a host
		, __connect: function(){

		}
	} );



