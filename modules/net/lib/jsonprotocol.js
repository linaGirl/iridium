
	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );




	module.exports = new Class( {
		$id: "net.protocolJson"
		, inherits: Events


		, __buffer: null
		, __expectedLen: 0 


		, decode: function( chunk ){
			var len, buf;

			if ( this.__buffer && this.__buffer.length > 0 ){
				buf = new Buffer( this.__buffer.length + chunk.length );
				this.__buffer.copy( buf );
				chunk.copy( buf, this.__buffer.length );

				if ( buf.length >= 7 + this.__expectedLen ){
					// there should be a complete packet, decode
					this.__buffer = null;
					this.decode( buf );
				}
				else {
					this.__buffer = buf;
				}
			}
			else {
				// must be packet init!
				if ( chunk.length >= 7 && chunk.toString( 0, 5 ) === "__i__" ){

					len = chunk.readUInt16LE( chunk, 5 );
					if ( len + 7 === chunk.length ){
						// got a packet
						this.__decode( chunk );
					}
					else if ( len + 7 < chunk.length ){
						// got more than onde
						this.__decode( chunk.slice( 0, len + 7 ) );

						// reparse the rest
						this.decode( chunk.slice( len + 7 ) );
					}
					else {
						// got less than one
						this.__buffer = chunk;
						this.__expectedLen = len;
					}
				}
				else {
					// protocol error
					log.warn( "got malformed packet, either its too short or the header is incorrect. discarding data!", this );
					log.dir( chunk );
				}
			}
		}


		, __decode: function( data ){
			try{
				data = JSON.parse( data.toString() );
				this.emit( "data", data );
			}
			catch ( e ){
				log.warn( "failed to decode packet: " + e, this );
				log.dir( data );
			}
		}



		, "static encode": function( payload ){
			var data = JSON.stringify( pyload )
				, len = Buffer.byteLength( data )
				, packet = new Buffer( 7 + len );

			if ( len > 0xFFFF ) throw new Error( "packet too long! supporting up to 0XFFFF Bytes of payload!", this );
			packet.write( "__i__" );
			packet.writeUInt16LE( len, 5 );
			packet.write( data, 7 );
			return packet;
		}
	} );