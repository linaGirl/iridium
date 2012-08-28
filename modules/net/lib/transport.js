	


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );


	var crypto 			= require( "crypto" )
		, net 			= require( "net" );



	var TCPServer 		= require( "./tcpserver" )
		TCPConnection 	= require( "./tcpconnection" );





	module.exports = new Class( {
		$id: "net.transport"
		, inherits: Events


		, init: function( options ){
			if ( iridium.__.transport ) return iridium.__.transport;

			// get the tcp server
			this.__server = new TCPServer();
		}



		// subscribe to data sent to an instance
		, subscribe: function( instanceName, listener ){
			
		}

		// unsubsribe for data sent to an instance
		, unsubscribe: function( instanceName ){

		}

		// send a payload to an instance, the underliying code will manage the discovery and serialization of the data
		, send: function( payload, targetInstance, callback ){

		}
	} );