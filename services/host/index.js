

	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, net = iridium.module( "net" )
		, fs = require( "fs" );





	var Host = module.exports = new Class( {
		$id: "service.Host"
		, Extends: Events

		, __queue: []
		, __ready: false
		, __path: "/var/iridium/hostconfig.json"


		, __defaultConfig: {
			ip: "127.0.0.1"
			, directoryService: "127.0.0.1"
		}


		, constructor: function( options ){

			// the rep socket
			this.__socket = new net.Socket( {
				type: "rep"
				, uri: "tcp://127.0.0.1:6842"
				, on: {
					message: this.__handleMessage.bind( this )
				}
			} );


			// get the hostconfig
			fs.readFile( this.__path, function( err, data ){
				var i;

				if ( err ){
					log.warn( "failed to load hostconfig!", this );
					log.trace( err );
				}
				else {
					try {
						this.__hostConfig = JSON.parse( data.toString() );
					} catch ( e ) {
						log.warn( "failed to parse hostconfig!", this );
						log.trace( e );
					}
				}

				// im ready now
				this.__ready = true;


				// repond to waiting requests
				if ( this.__queue.length > 0 ){
					i = this.__queue.length;
					while( i-- ){
						this.__handleMessage( this.__queue[ i ] );
					}
					this.__queue = [];
				}
			}.bind( this ) );
		}






		// message from client
		, __handleMessage: function( message ){
			if ( message.action === "getHostConfig" ){
				if ( this.__ready ){
					message.info = this.__hostConfig;
					message.success = true;
					this.__socket.send( message );
				}
				else {
					this.__queue.push( message );
				}
			}
			else {
				message.success = false;
				message.err = "unknown_action";
				this.__socket.send( message );
			}
		}
	} );