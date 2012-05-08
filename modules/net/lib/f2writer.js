


	
	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );



	module.exports = new Class( {
		$id: "net.f2writer"
		, inherits: Events

		// first argument is the payload data.
		, write: function( data ){
			var packet = {
				header: {}
				, body: data
			}, buffer;

			packet = JSON.stringify( data );
			buffer = new Buffer( packet.length + 15 );
			buffer.write( "\u0000I\u0000RIDIUM", 0 );
			buffer.writeInt32BE( packet.length, 9 );
			buffer.write( packet, 4 );
			buffer.write( "\u0000\u0000", packet.length + 13 );

			this.emit( "buffer", buffer );
		}
	} );