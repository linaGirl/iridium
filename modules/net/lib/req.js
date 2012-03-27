


	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, Socket = require( "./socket" );




	var ReQSocket = module.exports = new Class( {
		$id: "net.Socket.RequestSocket"
		, Extends: Events


		, constructor: function( options ){
			this.__directory = options.directoryClient;
			this.__hostinfo = options.hostInfoClient;

			this.__socket = new Socket( {
				type: "req"
				, on: {
					message: this.__handleMessage.bind( this ) 
					, error: this.__handleError.bind( this )
					, close: this.__handleClose.bind( this )
				}
			} );

			if ( options.uri ){
				this.__uri = options.uri;
				this.__connect();
			}
			else {
				this.__directory.registerNotification( options.__serviceName, function( uri ){
					this.__uri = uri;
					this.__connect();
				}.bind( this ) );
			}
		}



		// connect
		, __connect: function(){
			this.__socket.connect( this.__uri );
			this.__handleListening();
		}


		// send
		, send: function( message, callback ){
			
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
			
		}

	} );