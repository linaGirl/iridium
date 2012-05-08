
	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );



	module.exports = new Class( {
		$id: "net.f2reader"
		, inherits: Events

		, __buffer: null



		, __decodePacket: function( binaryPacket ){
			try {
				this.emit( "data", JSON.parse( binaryPacket.toString( 13, binaryPacket.length - 2 ) ).body );
			} catch ( e ) {
				log.error( "failed to decode data!", this );
				log.dir( binaryPacket );
			}
		}



		// decode packet data
		, read: function( binaryData ){
			
			if ( this.__buffer === null ){
				this.__buffer = binaryData;
			}
			else {
				var newBuffer = new Buffer( this.__buffer.length + binaryData.length );
				this.__buffer.copy( newBuffer, 0, 0 );
				binaryData.copy( newBuffer, this.__buffer.length, 0 );
				this.__buffer = newBuffer;
			}

			while( this.__buffer.length > 15 ){
				if ( this.__buffer.toString( 0, 9 ) === "\u0000I\u0000RIDIUM" ){
					var len = this.__buffer.readInt32BE( 9 ) + 15;

					// full packet
					if ( this.__buffer.length === len ){
						this.__decodePacket( this.__buffer );
						this.__buffer = null;
					}
					// full packet with additional data
					else if ( this.__buffer.length > len ){
						this.__decodePacket( this.__buffer.slice( 0, len ) );
						this.__buffer = this.__buffer.slice( len, this.__buffer.length );
					}
					// partial packet
					else {
						break;
					}
				}
				else {
					log.error( "invalid packet data!", this );
					log.dir( this.__buffer );
					this.__buffer = null;
				}
			}
		}
	} );