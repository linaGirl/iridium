


	var Class 				= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" );




	// the iridium streaming protocol, multiplexing big data ;)



	module.exports = new Class( {
		$id: "net.protocol.stream"
		, inherits: Events


		, init: function(){

		}


		// streams the data towards the other endpoint. one socket, one stream protocol handler
		// input may be in any format. code will not be executed on the other end!
		// streams will be streamed
		// objects, arrays & primitives get serialized and streamed towards the other end.
		// input will be delievreed mutlipleyxed, small parts wont wait for big prats to pass.
		, write: function( mixed, calback ){
			
		}
	} );