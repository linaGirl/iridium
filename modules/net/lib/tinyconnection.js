




	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );


	

	module.exports = new Class( {
		$id: "net.tinyConnection"
		, inherits: Events

		, __port: 0
		, __host: ""


		, init: function( options ){
			
			if ( options.socket ){
				this.__socket = options.socket;

				this.__socket.on( "close", this.__handleClose.bind( this ) );
			}
			else {
				this.__port = options.port || 0;
				this.__host = options.host || "";
			}
		}



	} );