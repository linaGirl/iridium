


	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, Socket = require( "./socket" );




	var RepSocket = module.exports = new Class( {
		$id: "net.Socket.ReplySocket"
		, Extends: Events


		, constructor: function( options ){
			this.__directory = options.directoryClient;
			this.__hostinfo = options.hostInfoClient;

			this.__socket = new Socket( {
				type: "rep"
				, on: {
					message: this.__handleMessage.bind( this ) 
					, error: this.__handleError.bind( this )
					, close: this.__handleClose.bind( this )
				}
			} );


			this.__hostinfo.getInfo( function( info ){
				this.__socket.bind( null, info.ip );
				this.__directory.registerService( this.__serviceName, this.__uri, function( serviceId ){
					this.__uri = this.__socket.getUri();
					this.__serviceId = serviceId;
					this.__handleListening();
				}.bind( this ) );
			}.bind( this ) );

			// cleanup on exit
			process.on( "exit", this.__destroy.bind( this ) );
		}



		// msg from net
		, __handleMessage: function( message ){
			this.emit( "message", message.message, {
				send: function( responseMessage ){
					this.__socket.send( {
						requestId: message.requestId
						, message: responseMessage 
					} );
				} 
				, end: function( message ){
					this.__socket.send( {
						requestId: message.requestId
						, message: responseMessage 
					} );
				}
			} );
		}



		// end the socket
		, end: function(){
			this.__destroy();
		}


		// listening
		, __handleListening: function(){
			this.emit( "listening" );
		}


		// error
		, __handleError: function( err ){
			this.emit( "error", err );
		}


		// clsoe
		, __handleClose: function(){
			this.emit( "close" );
		}


		// destroy
		, __destroy: function(){
			this.__directory.deregisterService( this.__serviceId, this.__serviceName, function(){

				// close the socket
				if ( this.__socket ) {
					this.__socket.close();
					delete this.__socket;
				} 

				// remove references
				delete this.__directory;
				delete this.__hostinfo;

				// emit NOW
				this.emitNow( "destroy" );

				// remove all eventlisterners
				this.off();
			}.bind( this ) );
		}
	} );