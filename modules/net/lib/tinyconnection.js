




	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, f2 = require( "./f2" )
		, TinyBuffer = require( "./tinybuffer" );


	

	module.exports = new Class( {
		$id: "net.tinyConnection"
		, inherits: Events

		, __port: 0
		, __host: ""



		, init: function( options ){


			// buffer
			this.__buffer = new TinyBuffer( {
				on: {
					free: function(){
						// the buffer did become space again ...
						this.__bufferIsFree = true;
					}.bind( this )
				}
			} );


			// protocol
			this.__reader = new f2.Reader();
			this.__writer = new f2.Writer();		

			
			this.__socket.on( "drain", function(){
				this.__socketIsFree = true;
			}.bind( this ) );
		}




		, __sendPacket: function( packetBuffer ){
			if ( this.__socket && this.__socketIsFree ){
				// tell the caller that the buffer is free, more data can be sent now
				return this.__socketIsFree = this.__socket.write( packetBuffer ), true ;
			}
			else {
				// tell the caller wheter there is enough capacity left for more data to buffer
				return ( this.__bufferIsFree = this.__buffer.push( packetBuffer ) );
			}
		}

		


		, send: function( payload, virtualConnectionId ){
			return this.__sendPacket( this.__writer.write( {
				vcid: virtualConnectionId
				, payload: payload
			} ) );
		}

	} );